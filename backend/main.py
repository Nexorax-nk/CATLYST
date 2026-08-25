import io
import os
import json
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from contextlib import asynccontextmanager
from rapidfuzz import process, fuzz

from pipeline.entity_resolution import resolve_entity
from pipeline.attribute_extraction import extract_attributes
from pipeline.validation_engine import validate_against_lov
from pipeline.data_loaders import MANUFACTURERS_LIST
from database import engine, Base, get_db, Product, SessionLocal, ProcessingJob, ProcessingEvent, SourceConfig

# We will initialize DB on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Clean up any zombie jobs left over from previous unexpected shutdowns
    db = SessionLocal()
    try:
        stuck_jobs = db.query(ProcessingJob).filter(ProcessingJob.status == 'Processing').all()
        for job in stuck_jobs:
            job.status = 'Failed'
            job.errors = 'Job interrupted by server restart.'
        if stuck_jobs:
            db.commit()
            print(f"Cleaned up {len(stuck_jobs)} zombie job(s) from previous run.")
    finally:
        db.close()
        
    yield

app = FastAPI(title="UniHack Product Intelligence Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "awake"}

@app.get("/api/sources")
def get_sources(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.sources != None).all()
    
    domain_agg = {}
    from urllib.parse import urlparse
    import uuid

    for p in products:
        if isinstance(p.sources, list):
            for s in p.sources:
                url = s.get("url", "")
                if not url: continue
                try:
                    domain = urlparse(url).netloc
                except:
                    domain = url
                
                if not domain:
                    domain = "Unknown"
                
                if domain not in domain_agg:
                    domain_agg[domain] = {
                        "name": domain,
                        "type": s.get("type", "Website"),
                        "items_enriched": 0,
                        "last_sync": p.updated_at
                    }
                domain_agg[domain]["items_enriched"] += 1
                if p.updated_at and (domain_agg[domain]["last_sync"] is None or p.updated_at > domain_agg[domain]["last_sync"]):
                    domain_agg[domain]["last_sync"] = p.updated_at
                    
    result = []
    for domain, data in domain_agg.items():
        # Clean up domain name to look nicer if possible
        display_name = domain.replace("www.", "")
        
        result.append({
            "id": str(uuid.uuid4()),
            "name": display_name,
            "type": data["type"],
            "status": "Active",
            "items": f"{data['items_enriched']:,}",
            "lastSync": data["last_sync"].strftime("%Y-%m-%d %H:%M") if data["last_sync"] else "Just now",
            "icon": "Globe",
            "color": "#00d4ff"
        })
        
    return sorted(result, key=lambda x: int(x["items"].replace(',', '')), reverse=True)

@app.get("/api/catalog")
def get_catalog(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.confidence_score.desc()).all()
    # Convert DB models to JSON-friendly dicts
    result = []
    for p in products:
        result.append({
            "id": p.id,
            "canonical_manufacturer": p.canonical_manufacturer,
            "canonical_brand": p.canonical_brand,
            "product_title": p.product_title,
            "attributes": p.attributes if p.attributes else {},
            "confidence_scores": {"extraction": p.confidence_score},
            "status": p.status
        })
    return {"total": len(result), "items": result}



@app.get("/api/product/{item_id}")
def get_product(item_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return {
        "id": product.id,
        "canonical_manufacturer": product.canonical_manufacturer,
        "canonical_brand": product.canonical_brand,
        "product_title": product.product_title,
        "attributes": product.attributes if product.attributes else {},
        "descriptions": product.descriptions if product.descriptions else {},
        "evidence": product.evidence if product.evidence else {},
        "sources": product.sources if product.sources else [],
        "validation": product.validation if product.validation else [],
        "confidence_score": product.confidence_score,
        "status": product.status,
        "raw_desc": product.raw_desc
    }

from pydantic import BaseModel

class BatchProcessRequest(BaseModel):
    file_path: str
    start_row: int
    end_row: int
    filename: str

@app.post("/api/upload-analyze")
async def upload_analyze(file: UploadFile = File(...)):
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file format.")
    
    import uuid
    import os
    os.makedirs("uploads", exist_ok=True)
    file_id = str(uuid.uuid4())
    save_path = f"uploads/{file_id}_{file.filename}"
    
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
        
    try:
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        total_rows = len(df)
        return {"file_path": save_path, "total_rows": total_rows, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-process")
async def batch_process_csv(req: BatchProcessRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Fast Heuristic Processor: queues background job"""
    import os
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=404, detail="File not found. Please upload again.")
    
    try:
        if req.file_path.endswith('.xlsx'):
            df = pd.read_excel(req.file_path)
        else:
            df = pd.read_csv(req.file_path)
            
        # Slice dataframe
        df_slice = df.iloc[req.start_row:req.end_row]
        total_rows = len(df_slice)
        
        # Fill NaNs with empty string to avoid JSON serialization errors
        df_slice = df_slice.fillna('')
        data_records = df_slice.to_dict('records')
        
        import uuid
        job_id = str(uuid.uuid4())
        
        new_job = ProcessingJob(
            id=job_id,
            filename=f"{req.filename} (Rows {req.start_row + 1}-{req.end_row})",
            total_rows=total_rows,
            processed_rows=0,
            status="Processing"
        )
        db.add(new_job)
        db.commit()
        
        background_tasks.add_task(process_csv_background, job_id, data_records)
        
        return {"message": "Batch processing started.", "job_id": job_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def process_csv_background(job_id: str, records: list):
    db = SessionLocal()
    try:
        UNIQUE_MANUFACTURERS = list(set([m["MANUFACTURER_NAME"] for m in MANUFACTURERS_LIST]))
        import uuid
        import time
        from datetime import datetime
        
        seen_ids = set()
        count = 0
        
        for row in records:
            # Check job state for pause/stop
            db.commit()
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if not job or job.status in ["Stopped", "Failed"]:
                break
            
            while job.status == "Paused":
                time.sleep(1)
                db.commit()
                job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
                if not job or job.status == "Stopped":
                    break
                    
            if not job or job.status in ["Stopped", "Failed"]:
                break

            start_time = time.time()
            
            # Dynamic extraction for id
            values = list(row.values())
            raw_id = str(row.get('Mfg_Part_Num', row.get('MPN', values[1] if len(values) > 1 else ''))).strip()
            item_id = raw_id if raw_id else str(uuid.uuid4())
            
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            
            existing_prod = db.query(Product).filter(Product.id == item_id).first()
            if existing_prod and existing_prod.status == "ai-enriched":
                print(f"[{item_id}] Product already fully enriched. Skipping to resume...")
                count += 1
                if job:
                    job.processed_rows += 1
                    db.commit()
                continue
            
            print(f"[{item_id}] Started processing item...")
            
            try:
                raw_mfg = str(row.get('Part_Manuf', row.get('Manufacturer', values[0] if values else '')))
                raw_brand = str(row.get('E1_Brand', ''))
                raw_desc = str(row.get('Part_Desc', row.get('Description', '')))
                
                # If there's no clear description column, dump the entire row for the AI!
                if not raw_desc.strip():
                    raw_desc = " | ".join([f"{k}: {v}" for k, v in row.items() if str(v).strip()])
                    
                raw_mpn = item_id
                
                # --- REAL PIPELINE EXECUTION ---
                import ai_pipeline
                print(f"[{item_id}] Running AI Enrichment Pipeline...")
                enriched_result = ai_pipeline.process_product(row)
                
                # USE THE AI's RESOLVED manufacturer/brand, NOT the raw distributor
                final_mfg = enriched_result.get("canonical_manufacturer", raw_mfg)
                final_brand = enriched_result.get("canonical_brand", "")
                
                # Filter placeholders from brand
                PLACEHOLDERS = ["-- Unbranded --", "-- No Unilog Brand --", "-- No DIB Brand --", "Unbranded", "N/A", ""]
                if final_brand in PLACEHOLDERS:
                    final_brand = ""
                if final_mfg in PLACEHOLDERS:
                    final_mfg = raw_mfg  # absolute fallback
                
                # Build a clean product title (no placeholders)
                title_parts = []
                if final_brand:
                    title_parts.append(final_brand)
                if final_mfg and final_mfg != final_brand:
                    title_parts.append(final_mfg)
                # Add product type from desc (strip MPN prefix)
                clean_desc = raw_desc
                if raw_mpn and clean_desc.startswith(raw_mpn):
                    clean_desc = clean_desc[len(raw_mpn):].strip().lstrip('-').strip()
                title_parts.append(clean_desc)
                product_title = " ".join(title_parts).strip()
                
                # Use REAL computed scores from the pipeline
                confidence = enriched_result.get("confidence", 0.5)
                completeness = enriched_result.get("completeness", 0.0)
                accuracy = enriched_result.get("accuracy", 0.0)
                
                existing = db.query(Product).filter(Product.id == item_id).first()
                if not existing:
                    new_prod = Product(
                        id=item_id,
                        canonical_manufacturer=final_mfg,
                        canonical_brand=final_brand,
                        product_title=product_title,
                        attributes=enriched_result.get("attributes", []),
                        descriptions=enriched_result.get("descriptions", {}),
                        evidence=enriched_result.get("evidence", {}),
                        sources=enriched_result.get("sources", []),
                        validation=enriched_result.get("validation", []),
                        confidence_score=confidence,
                        status="heuristic-processed" if enriched_result.get("stage") in ["RAW", "PARSED", "CLASSIFIED"] else "ai-enriched",
                        stage=enriched_result.get("stage", "PARSED"),
                        is_valid=1 if enriched_result.get("stage") in ["VALIDATED", "COMMERCE READY"] else 0,
                        category=enriched_result.get("taxonomy", {}).get("classpath", "Unclassified"),
                        accuracy_score=accuracy,
                        completeness_score=completeness,
                        source_type="csv_upload",
                        raw_desc=raw_desc,
                        taxonomy=enriched_result.get("taxonomy", {}),
                        digital_assets=enriched_result.get("digital_assets", [])
                    )
                    db.add(new_prod)
                    
                    # Insert latencies recorded by the pipeline
                    latencies = enriched_result.get("latencies", {})
                    for stg, lat in latencies.items():
                        evt = ProcessingEvent(
                            product_id=item_id,
                            job_id=job_id,
                            event_type="latency",
                            stage=stg,
                            duration_ms=lat
                        )
                        db.add(evt)
                        
                    db.commit()
                    print(f"[{item_id}] Successfully enriched and saved. Stage: {enriched_result.get('stage')}")
                else:
                    print(f"[{item_id}] Product already exists, updating...")
                    existing.canonical_manufacturer = final_mfg
                    existing.canonical_brand = final_brand
                    existing.product_title = product_title
                    existing.updated_at = datetime.utcnow()
                    existing.attributes = enriched_result.get("attributes", [])
                    existing.descriptions = enriched_result.get("descriptions", {})
                    existing.evidence = enriched_result.get("evidence", {})
                    existing.sources = enriched_result.get("sources", [])
                    existing.validation = enriched_result.get("validation", [])
                    existing.category = enriched_result.get("taxonomy", {}).get("classpath", "Unclassified")
                    existing.taxonomy = enriched_result.get("taxonomy", {})
                    existing.confidence_score = confidence
                    existing.accuracy_score = accuracy
                    existing.completeness_score = completeness
                    existing.stage = enriched_result.get("stage", "COMMERCE READY")
                    existing.status = "ai-enriched" if enriched_result.get("success") else "heuristic-processed"
                    existing.is_valid = 1 if enriched_result.get("success") else 0
                    existing.digital_assets = enriched_result.get("digital_assets", [])
                
                duration_ms = (time.time() - start_time) * 1000
                latency_event = ProcessingEvent(
                    product_id=item_id,
                    job_id=job_id,
                    stage="Parsing",
                    event_type="latency",
                    duration_ms=duration_ms
                )
                db.add(latency_event)
                db.commit()
                
            except Exception as row_e:
                db.rollback()
                print(f"[{item_id}] Failed to process row: {row_e}")
                err_evt = ProcessingEvent(
                    product_id=item_id,
                    job_id=job_id,
                    event_type="issue",
                    stage="EXTRACTION",
                    issue_reason=f"Failed to process row: {str(row_e)}",
                    duration_ms=(time.time() - start_time) * 1000
                )
                db.add(err_evt)
                db.commit()
            
            finally:
                count += 1
                
                # Rate limiting / Batching Logic for Free Tier APIs
                # Sleep 1 second after every 5 items to avoid rate limits
                if count % 5 == 0:
                    time.sleep(1)
                
                # Update progress on every row for real-time tracking in UI
                job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
                if job:
                    job.processed_rows = count
                db.commit()
                
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            job.processed_rows = count
            if job.status not in ["Stopped", "Failed"]:
                job.status = "Completed"
            job.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        db.rollback()
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            job.status = "Failed"
            job.completed_at = datetime.utcnow()
        db.commit()
        import traceback
        traceback.print_exc()
    finally:
        db.close()


@app.post("/api/enhance/{item_id}")
async def enhance_product(item_id: str, db: Session = Depends(get_db)):
    """Deep dive AI enhancement using Groq LLM for a single product."""
    import time
    from datetime import datetime
    
    product = db.query(Product).filter(Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    try:
        classpath = "Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers" # mock for MVP
        product.category = classpath
        
        # 1. Entity Resolution via Groq
        t0 = time.time()
        er_result = resolve_entity(product.canonical_manufacturer, product.canonical_brand)
        t1 = time.time()
        db.add(ProcessingEvent(product_id=product.id, stage="Classification", event_type="latency", duration_ms=(t1-t0)*1000))
        
        # 2. Attribute Extraction via Groq
        t0 = time.time()
        ext_result = extract_attributes(product.raw_desc, classpath)
        t1 = time.time()
        db.add(ProcessingEvent(product_id=product.id, stage="Enrichment", event_type="latency", duration_ms=(t1-t0)*1000))
        
        # 3. Validation
        t0 = time.time()
        val_result = validate_against_lov(ext_result["extracted"], classpath)
        t1 = time.time()
        db.add(ProcessingEvent(product_id=product.id, stage="Validation", event_type="latency", duration_ms=(t1-t0)*1000))
        
        # Update DB Record
        product.canonical_manufacturer = er_result.get("canonical_manufacturer", product.canonical_manufacturer)
        product.canonical_brand = er_result.get("canonical_brand", product.canonical_brand)
        product.product_title = f"{product.canonical_brand} {product.raw_desc}".strip()
        product.attributes = val_result["validated_attributes"]
        
        # Check issues
        rejected = val_result.get("rejected_attributes", {})
        if rejected:
            product.is_valid = False
            for attr in rejected:
                db.add(ProcessingEvent(product_id=product.id, stage="Validation", event_type="issue", issue_reason="LOV Mismatch"))
        else:
            product.is_valid = True
            
        expected_attrs = max(len(ext_result["extracted"]), 5)
        product.completeness_score = min(len(product.attributes) / expected_attrs, 1.0) * 100
        total_extracted = len(ext_result["extracted"])
        if total_extracted > 0:
            product.accuracy_score = (len(product.attributes) / total_extracted) * 100
        else:
            product.accuracy_score = 0.0
        
        # Combine confidence
        er_conf = er_result.get("confidence", 0.8)
        ex_conf = ext_result.get("confidence", 0.8)
        product.confidence_score = (er_conf + ex_conf) / 2.0
        
        product.status = "ai-enriched"
        product.stage = "COMMERCE READY" if product.is_valid else "VALIDATED"
        product.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Successfully enhanced with AI", "product": {
            "canonical_manufacturer": product.canonical_manufacturer,
            "canonical_brand": product.canonical_brand,
            "attributes": product.attributes,
            "confidence_score": product.confidence_score
        }}
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.add(ProcessingEvent(product_id=product.id, stage="Enrichment", event_type="drop-off", issue_reason=str(e)))
        db.commit()
        raise HTTPException(status_code=500, detail="AI Enhancement failed.")

from sqlalchemy import func
from datetime import timedelta

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    # Performance Stats
    total_products = db.query(Product).count() or 1
    total_time = db.query(func.sum(ProcessingEvent.duration_ms)).filter(ProcessingEvent.event_type=="latency").scalar() or 0
    throughput = f"{total_products}"
    
    avg_accuracy = db.query(func.avg(Product.accuracy_score)).scalar() or 0
    success_rate = f"{avg_accuracy:.1f}%"
    
    # Funnel
    stages = db.query(Product.stage, func.count(Product.id)).group_by(Product.stage).all()
    stage_counts = {s[0]: s[1] for s in stages}
    funnel = []
    ordered_stages = ["RAW", "PARSED", "CLASSIFIED", "ENRICHED", "VALIDATED", "COMMERCE READY"]
    for s in ordered_stages:
        cnt = stage_counts.get(s, 0)
        pct = f"{(cnt / total_products) * 100:.1f}%" if total_products else "0%"
        funnel.append({"stage": s, "count": cnt, "percentage": pct})
        
    # Quality Trends
    quality_trends = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for i in range(7):
        # We simulate day grouping via simple query for MVP, or just fallback to basic structure
        quality_trends.append({"day": day_names[i], "completeness": 0, "accuracy": 0, "lov": 0})
    
    # Retrieve real trend data
    if engine.name == 'postgresql':
        dow_expr = func.extract('dow', Product.created_at).label("dow")
    else:
        dow_expr = func.strftime('%w', Product.created_at).label("dow")
        
    trends_data = db.query(
        dow_expr,
        func.avg(Product.completeness_score),
        func.avg(Product.accuracy_score)
    ).group_by("dow").all()
    for row in trends_data:
        if row[0] is not None:
            idx = (int(row[0]) + 6) % 7 # SQLite strftime %w is 0=Sun. We want 0=Mon
            quality_trends[idx] = {
                "day": day_names[idx], 
                "completeness": int(row[1] or 0), 
                "accuracy": int(row[2] or 0), 
                "lov": int(row[2] or 0)
            }
            
    # Confidence Distribution
    high = db.query(Product).filter(Product.confidence_score >= 0.90).count()
    med = db.query(Product).filter(Product.confidence_score >= 0.70, Product.confidence_score < 0.90).count()
    low = db.query(Product).filter(Product.confidence_score < 0.70).count()
    total_conf = (high + med + low) or 1
    
    confidence_distribution = [
        {"name": "90-100%", "count": (high / total_conf) * 100, "color": "#2CFF05"},
        {"name": "70-90%", "count": (med / total_conf) * 100, "color": "#ffffff"},
        {"name": "<70%", "count": (low / total_conf) * 100, "color": "#ef4444"},
    ]
    
    # Top Issues
    issues = db.query(ProcessingEvent.issue_reason, func.count(ProcessingEvent.id)).filter(ProcessingEvent.event_type=="issue").group_by(ProcessingEvent.issue_reason).order_by(func.count(ProcessingEvent.id).desc()).limit(5).all()
    top_issues = [{"issue": i[0], "count": str(i[1])} for i in issues]
    
    # Category Performance
    cats = db.query(Product.category, func.count(Product.id), func.avg(Product.completeness_score), func.avg(Product.accuracy_score)).filter(Product.category != None).group_by(Product.category).all()
    category_performance = [
        {"category": c[0], "volume": str(c[1]), "completeness": f"{c[2] or 0:.1f}%", "accuracy": f"{c[3] or 0:.1f}%", "success": f"{c[3] or 0:.1f}%"} for c in cats
    ]
    
    # Source Performance
    sources_data = db.query(Product.sources).all()
    total_sources = sum(len(s[0]) for s in sources_data if isinstance(s[0], list))
    website_success = sum(1 for s in sources_data if isinstance(s[0], list) and any("http" in str(src).lower() for src in s[0]))
    
    source_performance = {
        "websites": {"success": f"{(website_success / total_products) * 100:.0f}%" if total_products > 0 else "0%"},
        "pdfs": {"success": "0%"},
        "manuals": {"success": "0%"},
        "total_discovered": str(total_sources),
        "verified": str(total_sources)
    }
    
    # Stage Times
    stages_avg = db.query(ProcessingEvent.stage, func.avg(ProcessingEvent.duration_ms)).filter(ProcessingEvent.event_type=="latency").group_by(ProcessingEvent.stage).all()
    stage_times = []
    max_time = max([s[1] or 0 for s in stages_avg]) if stages_avg else 1
    for s in stages_avg:
        progress = ((s[1] or 0) / max_time) * 100 if max_time else 0
        stage_times.append({"stage": s[0], "time": f"{s[1] or 0:.1f}ms", "progress": progress})
        
    drop_off_reasons = []
    drop_offs = db.query(ProcessingEvent.stage, ProcessingEvent.issue_reason, func.count(ProcessingEvent.id)).filter(ProcessingEvent.event_type=="drop-off").group_by(ProcessingEvent.stage, ProcessingEvent.issue_reason).all()
    for d in drop_offs:
        drop_off_reasons.append({"stage": d[0], "reason": d[1], "count": d[2]})
        
    # Recent Jobs
    recent_jobs_db = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).limit(4).all()
    recent_jobs = [
        {
            "id": str(j.id)[:8], 
            "file": j.filename, 
            "products": str(j.total_rows), 
            "progress": f"{(j.processed_rows / j.total_rows) * 100 if j.total_rows > 0 else 0:.0f}%", 
            "status": j.status
        } for j in recent_jobs_db
    ]

    return {
        "performance": {
            "throughput": {"value": throughput, "trend": "Realtime"},
            "automation_rate": {"value": f"{(db.query(Product).filter(Product.confidence_score >= 0.8).count() / total_products) * 100:.1f}%", "trend": "Realtime"},
            "processing_time": {"value": f"{(total_time / total_products / 1000):.2f}s", "trend": "Live"},
            "success_rate": {"value": success_rate, "trend": "Live"}
        },
        "funnel": funnel,
        "quality_trends": quality_trends,
        "confidence_distribution": confidence_distribution,
        "top_issues": top_issues,
        "category_performance": category_performance,
        "source_performance": source_performance,
        "stage_times": stage_times,
        "drop_off_reasons": drop_off_reasons,
        "recent_jobs": recent_jobs
    }

import time
from fastapi import BackgroundTasks
import threading

DASHBOARD_CACHE = {
    "data": {
        "products": { "value": 0, "trend": "Realtime" },
        "processing": { "value": 0, "trend": "0 batches active" },
        "review": { "value": 0, "trend": "Issues Found" },
        "health": { "value": "A+", "trend": "System healthy" },
        "chart_data": [
            {"name": "Mon", "processed": 0},
            {"name": "Tue", "processed": 0},
            {"name": "Wed", "processed": 0},
            {"name": "Thu", "processed": 0},
            {"name": "Fri", "processed": 0},
            {"name": "Sat", "processed": 0},
            {"name": "Sun", "processed": 0}
        ],
        "recent_jobs": [],
        "quality_overview": [
            {"t1": "Attribute", "t2": "Completeness", "val": 0.0, "col": "text-neon", "iconName": "Layers"},
            {"t1": "LOV", "t2": "Compliance", "val": 0.0, "col": "text-neon", "iconName": "Tag"},
            {"t1": "UOM", "t2": "Compliance", "val": 0.0, "col": "text-neon", "iconName": "Shield"},
            {"t1": "Source-backed", "t2": "Fields", "val": 0.0, "col": "text-neon", "iconName": "LinkIcon"},
            {"t1": "Validation", "t2": "Success", "val": 0.0, "col": "text-neon", "iconName": "CheckCircle2"},
            {"t1": "Data", "t2": "Consistency", "val": 0.0, "col": "text-neon", "iconName": "Database"}
        ],
        "needs_attention": [
            {"label": "0 Attribute conflicts"},
            {"label": "0 Low-confidence extractions"},
            {"label": "0 Missing manufacturer sources"}
        ]
    },
    "timestamp": 0,
    "updating": False
}

def update_dashboard_cache_background():
    global DASHBOARD_CACHE
    if DASHBOARD_CACHE.get("updating"):
        return
    DASHBOARD_CACHE["updating"] = True
    db = SessionLocal()
    try:
        from sqlalchemy import cast, String
        total_products = db.query(Product).count()
        active_jobs = db.query(ProcessingJob).filter(ProcessingJob.status == "Processing").count()
        issues_count = db.query(ProcessingEvent).filter(ProcessingEvent.event_type == "issue").count()
        
        chart_data = []
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for i in range(7):
            chart_data.append({"name": day_names[i], "processed": 0})
            
        if engine.name == 'postgresql':
            trends_data = db.query(
                func.extract('dow', Product.created_at).label("dow"),
                func.count(Product.id)
            ).group_by("dow").all()
        else:
            trends_data = db.query(
                func.strftime('%w', Product.created_at).label("dow"),
                func.count(Product.id)
            ).group_by("dow").all()
        
        for row in trends_data:
            if row[0] is not None:
                idx = (int(row[0]) + 6) % 7 
                chart_data[idx] = {
                    "name": day_names[idx], 
                    "processed": row[1]
                }
                
        recent_jobs_db = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).limit(4).all()
        recent_jobs = [
            {
                "id": str(j.id)[:8], 
                "file": j.filename, 
                "progress": f"{(j.processed_rows / j.total_rows) * 100 if j.total_rows > 0 else 0:.0f}%", 
                "status": j.status
            } for j in recent_jobs_db
        ]

        avg_completeness = db.query(func.avg(Product.completeness_score)).scalar() or 0
        avg_accuracy = db.query(func.avg(Product.accuracy_score)).scalar() or 0
        
        lov_issues_count = db.query(ProcessingEvent).filter(ProcessingEvent.issue_reason == "LOV Mismatch").count()
        low_conf_count = db.query(Product).filter(Product.confidence_score < 0.70).count()

        source_backed_count = db.query(Product).filter(cast(Product.sources, String) != '[]').count()
        source_backed_pct = (source_backed_count / total_products * 100) if total_products > 0 else 0.0

        valid_products_count = db.query(Product).filter(Product.is_valid == True).count()
        validation_success_pct = (valid_products_count / total_products * 100) if total_products > 0 else 0.0

        data_consistency_pct = avg_accuracy
        lov_compliance_pct = validation_success_pct

        uom_compliance_count = db.query(Product).filter(cast(Product.attributes, String).like('%"uom"%')).count()
        uom_compliance = (uom_compliance_count / total_products * 100) if total_products > 0 else 0.0

        quality_overview = [
            {"t1": "Attribute", "t2": "Completeness", "val": float(f"{avg_completeness:.1f}"), "col": "text-neon", "iconName": "Layers"},
            {"t1": "LOV", "t2": "Compliance", "val": float(f"{lov_compliance_pct:.1f}"), "col": "text-neon", "iconName": "Tag"},
            {"t1": "UOM", "t2": "Compliance", "val": float(f"{uom_compliance:.1f}"), "col": "text-neon", "iconName": "Shield"},
            {"t1": "Source-backed", "t2": "Fields", "val": float(f"{source_backed_pct:.1f}"), "col": "text-neon", "iconName": "LinkIcon"},
            {"t1": "Validation", "t2": "Success", "val": float(f"{validation_success_pct:.1f}"), "col": "text-neon", "iconName": "CheckCircle2"},
            {"t1": "Data", "t2": "Consistency", "val": float(f"{data_consistency_pct:.1f}"), "col": "text-neon", "iconName": "Database"}
        ]
        
        missing_mfg_count = db.query(Product).filter(
            (Product.canonical_manufacturer == None) | (Product.canonical_manufacturer == "")
        ).count()

        needs_attention = [
            {"label": f"{lov_issues_count} Attribute conflicts"},
            {"label": f"{low_conf_count} Low-confidence extractions"},
            {"label": f"{missing_mfg_count} Missing manufacturer sources"}
        ]

        overall_score = (avg_completeness + avg_accuracy + source_backed_pct + validation_success_pct + uom_compliance) / 5.0
        if overall_score >= 90:
            health_grade = "A+"
            health_trend = "System healthy"
        elif overall_score >= 80:
            health_grade = "A"
            health_trend = "Looking good"
        elif overall_score >= 70:
            health_grade = "B"
            health_trend = "Needs improvement"
        elif overall_score >= 50:
            health_grade = "C"
            health_trend = "Needs attention"
        else:
            health_grade = "F"
            health_trend = "Critical issues"

        result = {
            "products": { "value": total_products, "trend": "Realtime" },
            "processing": { "value": active_jobs, "trend": f"{active_jobs} batches active" },
            "review": { "value": issues_count, "trend": "Issues Found" },
            "health": { "value": health_grade, "trend": health_trend },
            "chart_data": chart_data,
            "recent_jobs": recent_jobs,
            "quality_overview": quality_overview,
            "needs_attention": needs_attention
        }
        DASHBOARD_CACHE["data"] = result
        DASHBOARD_CACHE["timestamp"] = time.time()
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        DASHBOARD_CACHE["updating"] = False
        db.close()

@app.on_event("startup")
def startup_event_cache():
    import threading
    threading.Thread(target=update_dashboard_cache_background, daemon=True).start()

@app.get("/api/dashboard")
def get_dashboard_stats(background_tasks: BackgroundTasks):
    global DASHBOARD_CACHE
    if time.time() - DASHBOARD_CACHE["timestamp"] > 10:
        background_tasks.add_task(update_dashboard_cache_background)
    return DASHBOARD_CACHE["data"]

@app.get("/api/jobs")
def get_jobs_list(db: Session = Depends(get_db)):
    jobs_db = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).all()
    results = []
    for j in jobs_db:
        error_count = db.query(ProcessingEvent).filter(
            ProcessingEvent.job_id == j.id, 
            ProcessingEvent.event_type == "issue"
        ).count()
        
        date_str = j.created_at.strftime("%b %d, %I:%M %p") if j.created_at else ""
        
        results.append({
            "id": str(j.id)[:8],
            "file": j.filename,
            "type": "Bulk Enrichment",
            "status": j.status.capitalize() if j.status else "Unknown",
            "date": date_str,
            "rows": j.total_rows,
            "errors": error_count
        })
    return results

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    error_count = db.query(ProcessingEvent).filter(
        ProcessingEvent.job_id == job_id, 
        ProcessingEvent.event_type == "issue"
    ).count()

    successful_count = job.processed_rows - error_count if job.processed_rows else 0
    
    return {
        "id": job.id,
        "status": job.status,
        "total_rows": job.total_rows,
        "processed_rows": job.processed_rows,
        "successful": successful_count,
        "errors": error_count
    }

@app.get("/api/search")
def search_products(q: str = Query(""), db: Session = Depends(get_db)):
    if not q.strip():
        return []
    
    query_str = f"%{q.strip()}%"
    results = db.query(Product).filter(
        or_(
            Product.product_title.ilike(query_str),
            Product.canonical_manufacturer.ilike(query_str),
            Product.canonical_brand.ilike(query_str),
            Product.category.ilike(query_str),
            Product.id.ilike(query_str)
        )
    ).limit(20).all()
    
    formatted_results = []
    for r in results:
        formatted_results.append({
            "id": r.id,
            "title": r.product_title,
            "manufacturer": r.canonical_manufacturer or "Unknown",
            "category": r.category or "Uncategorized",
            "confidence": f"{r.confidence_score:.2f}" if r.confidence_score else "0.00",
            "status": r.status,
            "stage": r.stage
        })
    return formatted_results


from pydantic import BaseModel

class AcceptCorrectionRequest(BaseModel):
    corrected_value: str
    attribute_key: str

@app.get("/api/validation/queue")
def get_validation_queue(db: Session = Depends(get_db)):
    # First get invalid products
    invalid_products = db.query(Product).filter(Product.is_valid == False).all()
    # Then get low confidence products
    low_conf_products = db.query(Product).filter(Product.confidence_score < 0.8).all()
    
    # Combine uniquely
    products_dict = {p.id: p for p in invalid_products + low_conf_products}
    products = list(products_dict.values())[:50]
    
    # If no real queue, try to fetch some lowest confidence products for demo
    if not products:
        products = db.query(Product).order_by(Product.confidence_score.asc()).limit(5).all()

    queue = []
    for p in products:
        issue = "Low Confidence Extraction"
        expected = "Requires Review"
        extracted = "Review needed"
        attr_key = "General"
        
        # Pick an attribute to show if available
        if isinstance(p.attributes, list) and p.attributes:
            first_attr = p.attributes[0]
            if isinstance(first_attr, dict):
                attr_key = first_attr.get("label", "General")
                extracted = f"{first_attr.get('value', '')} {first_attr.get('uom', '')}".strip()
            if p.is_valid == False:
                issue = f"LOV Conflict: '{attr_key}'"
                expected = extracted.title()
            else:
                 issue = "Low Confidence Extraction"
                 expected = "Needs Manual Review"
        elif isinstance(p.attributes, dict) and p.attributes:
            attr_key = list(p.attributes.keys())[0]
            extracted = str(p.attributes[attr_key])
            if p.is_valid == False:
                issue = f"LOV Conflict: '{attr_key}'"
                expected = extracted.title()
            else:
                 issue = "Low Confidence Extraction"
                 expected = "Needs Manual Review"

        # Determine if it has evidence
        evidence_str = "No specific evidence found."
        if isinstance(p.evidence, dict) and attr_key in p.evidence:
             evidence_str = str(p.evidence[attr_key])
        elif isinstance(p.descriptions, dict) and p.descriptions:
             evidence_str = " ".join([str(v) for v in p.descriptions.values()])[:150] + "..."
             
        queue.append({
            "id": p.id,
            "title": p.product_title or "Unknown Product",
            "issue": issue,
            "extracted": extracted,
            "expected": expected,
            "confidence": p.confidence_score or 0.0,
            "source_evidence": evidence_str,
            "attribute_key": attr_key
        })
    return queue

@app.post("/api/validation/{item_id}/accept")
def accept_validation(item_id: str, req: AcceptCorrectionRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404)
        
    attr_key = req.attribute_key
    corrected = req.corrected_value
    
    if attr_key and corrected and isinstance(product.attributes, dict):
        new_attrs = product.attributes.copy()
        new_attrs[attr_key] = corrected
        product.attributes = new_attrs
        
    product.is_valid = True
    product.confidence_score = 0.99
    product.stage = "COMMERCE READY"
    
    # Optional: Log the resolution as an event
    db.add(ProcessingEvent(
        product_id=product.id,
        stage="Validation",
        event_type="resolution",
        issue_reason="Manual Validation Approved"
    ))
    db.commit()
    return {"status": "accepted"}

@app.post("/api/validation/{item_id}/reject")
def reject_validation(item_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404)
        
    product.is_valid = False
    product.stage = "REJECTED"
    
    db.add(ProcessingEvent(
        product_id=product.id,
        stage="Validation",
        event_type="resolution",
        issue_reason="Manual Validation Rejected"
    ))
    db.commit()
    return {"status": "rejected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)

class JobActionRequest(BaseModel):
    action: str

@app.post("/api/jobs/{job_id}/action")
def job_action(job_id: str, payload: JobActionRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if payload.action == "pause":
        if job.status == "Processing":
            job.status = "Paused"
    elif payload.action == "resume":
        if job.status == "Paused":
            job.status = "Processing"
    elif payload.action == "stop":
        if job.status in ["Processing", "Paused"]:
            job.status = "Failed"
            job.completed_at = datetime.utcnow()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    db.commit()
    return {"status": "success", "job_status": job.status}

@app.get("/api/export")
def export_products(format: str = 'csv', db: Session = Depends(get_db)):
    """Export all processed products matching the exact Unihack output format."""
    from fastapi.responses import StreamingResponse
    import csv
    import io
    import pandas as pd
    
    products = db.query(Product).all()
    
    # EXACT Headers required by hackathon
    headers = [
        "MFR URL", "Ref URL 1", "Ref URL 2", "Ref URL 3", "Ref URL 4", "Ref URL 5", "PART_NUMBER", "Dept", "Class", "Fine", 
        "SKU - MY_PART_NUMBER", "Mfg_Part_Num", "Part_Desc", "E1_Brand", "Unilog_Brand", "DIB_Brand", "Part_Manuf", 
        "MANUFACTURER_NAME", "BRAND_NAME", "TRADE_NAME", "MANUFACTURER_PART_NUMBER", "ALTERNATE_PART_NUMBER", "Classpath", 
        "MOBILE_DESC", "INVOICE_DESC", "SHORT_DESC", "LONG_DESC1", "RETAIL_DESC", "MARKETING_DESCRIPTION"
    ]
    for i in range(1, 21): headers.append(f"ITEM_FEATURES_{i}")
    headers += ["With", "Standard/Approvals", "Prop 65", "Application", "Includes", "Product Name"]
    for i in range(1, 51):
        headers.extend([f"ATTRIBUTE_LABEL {i}", f"ATTRIBUTE_VALUE {i}", f"ATTRIBUTE_UOM {i}"])
    headers += [
        "UPC", "EAN", "GTIN", "UNSPSC", "Warranty", "List Price", "Selling Qty", "Selling UOM", "Standard Packaging Information", 
        "LENGTH", "LENGTH_UOM", "HEIGHT", "HEIGHT_UOM", "WIDTH", "WIDTH_UOM", "WEIGHT", "WEIGHT_UOM", "VOLUME", "VOLUME_UOM", 
        "Product Image", "Alternate Image 1", "Alternate Image 2", "Alternate Image 3", "Alternate Image 4", "SDS", "SDS_1", 
        "Warranty Information", "Catalog", "Specification Sheet", "Instruction/Installation Manual", "Service Manual", 
        "Owners/User Manual", "Line Drawing", "MTR", "RoHS", "Full Engineering Drawing", "Energy Star Guide", "Technical Bulletin", 
        "Submittal", "Compatibility Chart", "Size Chart", "Product Label/Insert", "Video Link", "Video Link 1", "Country Of Origin", 
        "Discontinued", "Actual Image (Yes/No)"
    ]

    
    rows_list = []
    
    for p in products:
        row = {h: "" for h in headers}
        
        # Base mappings
        row["Mfg_Part_Num"] = p.id
        row["PART_NUMBER"] = p.id
        row["MANUFACTURER_PART_NUMBER"] = p.id
        row["Part_Desc"] = p.raw_desc if hasattr(p, 'raw_desc') else p.product_title
        row["MANUFACTURER_NAME"] = p.canonical_manufacturer
        row["Part_Manuf"] = p.canonical_manufacturer
        row["BRAND_NAME"] = p.canonical_brand
        row["Product Name"] = p.product_title
        if isinstance(p.taxonomy, dict):
            row["Dept"] = p.taxonomy.get("department", "")
            row["Class"] = p.taxonomy.get("class_name", "")
            row["Fine"] = p.taxonomy.get("fine", "")
            row["Classpath"] = p.taxonomy.get("classpath", "")
        else:
            row["Classpath"] = p.category
        
        if isinstance(p.descriptions, dict):
            row["MOBILE_DESC"] = p.descriptions.get("mobile", "")
            row["INVOICE_DESC"] = p.descriptions.get("invoice", "")
            row["SHORT_DESC"] = p.descriptions.get("short", "")
            row["LONG_DESC1"] = p.descriptions.get("long", "")
            row["RETAIL_DESC"] = p.descriptions.get("retail", "")
            row["MARKETING_DESCRIPTION"] = p.descriptions.get("marketing", "")
            
            features = p.descriptions.get("features", [])
            if isinstance(features, list):
                for idx, feat in enumerate(features[:20]):
                    row[f"ITEM_FEATURES_{idx+1}"] = str(feat)
            
        if isinstance(p.sources, list):
            urls = [s.get("url") for s in p.sources if "url" in s]
            if len(urls) > 0: row["MFR URL"] = urls[0]
            for i in range(1, min(6, len(urls))):
                row[f"Ref URL {i}"] = urls[i]
                
        # Handle Attributes
        if isinstance(p.attributes, list):
            attr_idx = 1
            for attr in p.attributes:
                if isinstance(attr, dict) and attr_idx <= 50:
                    row[f"ATTRIBUTE_LABEL {attr_idx}"] = attr.get("label", "")
                    row[f"ATTRIBUTE_VALUE {attr_idx}"] = attr.get("value", "")
                    row[f"ATTRIBUTE_UOM {attr_idx}"] = attr.get("uom", "")
                    attr_idx += 1
                    
                    
        rows_list.append(row)
        
    if format.lower() == 'excel':
        df = pd.DataFrame(rows_list, columns=headers)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]), 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            headers={"Content-Disposition": "attachment; filename=unihack_export.xlsx"}
        )
    else:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows_list)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]), 
            media_type="text/csv", 
            headers={"Content-Disposition": "attachment; filename=unihack_export.csv"}
        )

import traceback
from fastapi.responses import JSONResponse
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={'traceback': traceback.format_exc()})
