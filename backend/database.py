import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./catalyst.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    canonical_manufacturer = Column(String)
    canonical_brand = Column(String)
    product_title = Column(String)
    attributes = Column(JSON)
    confidence_score = Column(Float)
    status = Column(String) # "heuristic-processed" or "ai-enriched"
    raw_desc = Column(String) # Store raw desc for AI deep dive
    
    taxonomy = Column(JSON)
    descriptions = Column(JSON)
    evidence = Column(JSON)
    sources = Column(JSON)
    validation = Column(JSON)
    digital_assets = Column(JSON)
    
    # Analytics Fields
    category = Column(String, nullable=True)
    stage = Column(String, default="RAW")
    is_valid = Column(Boolean, default=False)
    completeness_score = Column(Float, default=0.0)
    accuracy_score = Column(Float, default=0.0)
    source_type = Column(String, default="csv_upload")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SourceConfig(Base):
    __tablename__ = "source_configs"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # "Web Scraper", "REST API", "PDF Parser"
    status = Column(String, default="Active")
    items_enriched = Column(Integer, default=0)
    last_sync = Column(String, default="Never")
    color = Column(String, default="#00d4ff")
    icon = Column(String, default="Globe")
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    
    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    status = Column(String, default="Processing")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class ProcessingEvent(Base):
    __tablename__ = "processing_events"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(String, index=True, nullable=True)
    job_id = Column(String, index=True, nullable=True)
    stage = Column(String) # "Parsing", "Classification", "Enrichment", "Validation"
    event_type = Column(String) # "latency", "drop-off", "issue"
    duration_ms = Column(Float, nullable=True)
    issue_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SearchCache(Base):
    __tablename__ = "search_cache"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    query = Column(String, index=True, unique=True)
    results = Column(JSON) # Store raw JSON response from Tavily
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
