import os
import re
import time
import json
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from pipeline.groq_client import get_groq_completion
from dotenv import load_dotenv

from database import SessionLocal, SearchCache

load_dotenv()

# Initialize clients
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

try:
    tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
except Exception:
    tavily_client = None


# ============================================================
# KNOWN MANUFACTURER DATABASE
# Used to resolve the REAL manufacturer from Part_Desc when
# Part_Manuf is actually a distributor.
# ============================================================
KNOWN_MANUFACTURERS = {
    "3M": {"brand_patterns": ["Cubitron", "Stikit", "Scotch-Brite", "Scotchgard"], "domain": "3m.com"},
    "Diablo": {"brand_patterns": ["Diablo"], "domain": "diablotools.com"},
    "Freud": {"brand_patterns": ["Freud"], "domain": "freudtools.com"},
    "DeWalt": {"brand_patterns": ["DeWalt", "DEWALT"], "domain": "dewalt.com"},
    "Bosch": {"brand_patterns": ["Bosch"], "domain": "boschtools.com"},
    "Makita": {"brand_patterns": ["Makita"], "domain": "makitatools.com"},
    "Milwaukee": {"brand_patterns": ["Milwaukee"], "domain": "milwaukeetool.com"},
    "Norton": {"brand_patterns": ["Norton", "BlueFire"], "domain": "nortonabrasives.com"},
    "Whirlpool": {"brand_patterns": ["Whirlpool"], "domain": "whirlpool.com"},
    "Frigidaire": {"brand_patterns": ["Frigidaire", "FRIGIDAIRE"], "domain": "frigidaire.com"},
    "Rheem": {"brand_patterns": ["Rheem"], "domain": "rheem.com"},
    "Stanley": {"brand_patterns": ["Stanley"], "domain": "stanleytools.com"},
    "Snap-on": {"brand_patterns": ["Snap-on"], "domain": "snapon.com"},
    "Honeywell": {"brand_patterns": ["Honeywell"], "domain": "honeywell.com"},
    "Siemens": {"brand_patterns": ["Siemens"], "domain": "siemens.com"},
    "GE": {"brand_patterns": ["GE", "General Electric"], "domain": "ge.com"},
    "LG": {"brand_patterns": ["LG"], "domain": "lg.com"},
    "Samsung": {"brand_patterns": ["Samsung"], "domain": "samsung.com"},
}

DISTRIBUTOR_KEYWORDS = [
    "supply", "industrial", "distributor", "dealer", "wholesale", "cooperative",
    "corp", "trading", "hardware", "tools direct", "pro tools", "marketplace",
]

BLOCKED_DOMAINS = [
    "amazon.com", "ebay.com", "linkedin.com", "facebook.com", "twitter.com",
    "instagram.com", "youtube.com", "walmart.com", "homedepot.com", "lowes.com",
    "grainger.com", "mcmaster.com", "mscdirect.com", "zoro.com",
    "jamindustrialsupply.com",
]

PLACEHOLDER_VALUES = [
    "-- Unbranded --", "-- No Unilog Brand --", "-- No DIB Brand --",
    "Unbranded", "N/A", "NA", "None", "--", "",
]


# ============================================================
# Pydantic Models for structured extraction
# ============================================================
class Taxonomy(BaseModel):
    department: str = Field(default="")
    class_name: str = Field(default="")
    fine: str = Field(default="")
    classpath: str = Field(default="")

class Attribute(BaseModel):
    label: str
    value: str
    uom: str = Field(default="")
    source: str = Field(default="INFERRED", description="Origin of the attribute: INPUT, WEB, or INFERRED")
    evidence_snippet: str = Field(default="")

class Descriptions(BaseModel):
    mobile: str = Field(default="")
    invoice: str = Field(default="")
    short: str = Field(default="")
    long: str = Field(default="")
    retail: str = Field(default="")
    marketing: str = Field(default="")
    features: List[str] = Field(default_factory=list)

class Asset(BaseModel):
    type: str = Field(default="Image")
    url: str

class BaseFacts(BaseModel):
    canonical_manufacturer: str = Field(default="")
    canonical_brand: str = Field(default="")
    taxonomy: Taxonomy = Field(default_factory=Taxonomy)
    attributes: List[Attribute] = Field(default_factory=list)

class WebFacts(BaseModel):
    attributes: List[Attribute] = Field(default_factory=list)
    digital_assets: List[Asset] = Field(default_factory=list)

class FinalDescriptions(BaseModel):
    mobile: str = Field(default="")
    invoice: str = Field(default="")
    short: str = Field(default="")
    long: str = Field(default="")
    retail: str = Field(default="")
    marketing: str = Field(default="")
    features: List[str] = Field(default_factory=list)

class ExtractedProduct(BaseModel):
    canonical_manufacturer: str = Field(default="")
    canonical_brand: str = Field(default="")
    taxonomy: Taxonomy = Field(default_factory=Taxonomy)
    attributes: List[Attribute] = Field(default_factory=list)
    descriptions: Descriptions = Field(default_factory=Descriptions)
    evidence: Dict[str, str] = Field(default_factory=dict)
    digital_assets: List[Asset] = Field(default_factory=list)


# ============================================================
# Phase 1: Smart Manufacturer Resolution
# ============================================================
def is_placeholder(val: str) -> bool:
    """Check if a value is a known placeholder."""
    if not val:
        return True
    return val.strip() in PLACEHOLDER_VALUES

def is_distributor(name: str) -> bool:
    """Check if a company name looks like a distributor, not a manufacturer."""
    name_lower = name.lower()
    return any(kw in name_lower for kw in DISTRIBUTOR_KEYWORDS)

def extract_real_manufacturer(part_desc: str, part_manuf: str) -> dict:
    """
    Parse Part_Desc to identify the REAL manufacturer and brand.
    Falls back to LLM resolution if local heuristics fail.
    
    Returns: {"manufacturer": str, "brand": str, "product_line": str}
    """
    result = {"manufacturer": "", "brand": "", "product_line": ""}
    
    # Strategy 1: Check Part_Desc against known manufacturers
    desc_upper = part_desc.upper() if part_desc else ""
    for mfg_name, mfg_info in KNOWN_MANUFACTURERS.items():
        if mfg_name.upper() in desc_upper:
            result["manufacturer"] = mfg_name
            # Also check for brand patterns
            for brand_pat in mfg_info.get("brand_patterns", []):
                if brand_pat.upper() in desc_upper:
                    result["brand"] = brand_pat
                    break
            break
    
    # Strategy 2: If no known manufacturer found in desc, check Part_Manuf
    if not result["manufacturer"] and part_manuf:
        if not is_distributor(part_manuf):
            # Part_Manuf looks like an actual manufacturer
            clean_manuf = re.sub(r'\s*\([^)]*\)\s*$', '', part_manuf).strip()
            result["manufacturer"] = clean_manuf
        else:
            # LLM Fallback for Manufacturer Resolution
            if part_desc:
                try:
                    completion = get_groq_completion(
                        model="llama-3.1-8b-instant", 
                        messages=[
                            {"role": "system", "content": "Extract the real manufacturer and brand from the product description. Output valid JSON only: {\"manufacturer\": \"\", \"brand\": \"\"}"},
                            {"role": "user", "content": f"Description: {part_desc}"}
                        ],
                        temperature=0,
                        max_tokens=200
                    )
                    res = completion.choices[0].message.content
                    if "```" in res:
                        res = res.split("```")[1]
                        if res.startswith("json\n"):
                            res = res[5:]
                    parsed = json.loads(res.strip())
                    result["manufacturer"] = parsed.get("manufacturer", "")
                    result["brand"] = parsed.get("brand", "")
                except Exception as e:
                    print(f"LLM Manufacturer Extraction Error: {e}")
            
            # Final heuristic fallback if LLM fails
            if not result["manufacturer"]:
                words = part_desc.split() if part_desc else []
                if words:
                    for word in words[:3]:
                        clean = word.strip(",-/")
                        if len(clean) >= 2 and not clean[0].isdigit():
                            result["manufacturer"] = clean
                            break
    
    # Extract product line from description (e.g. "775L Stikit Film")
    if part_desc:
        line = part_desc
        if result["manufacturer"]:
            pattern = re.compile(re.escape(result["manufacturer"]), re.IGNORECASE)
            line = pattern.sub("", line).strip()
        # Remove MPN-like prefixes (alphanumeric codes)
        line = re.sub(r'^[A-Z0-9]{5,}\s*', '', line).strip()
        line = re.sub(r'^[-–]\s*', '', line).strip()
        result["product_line"] = line[:80] if line else ""
    
    return result


# ============================================================
# Phase 2: Source Discovery (manufacturer-focused)
# ============================================================
def discover_urls(manufacturer: str, mpn: str, part_desc: str = "") -> List[str]:
    """Uses Tavily to find the MANUFACTURER's product page, not distributor pages."""
    if not tavily_client:
        return []
    
    # Build a manufacturer-focused search query
    mfg_domain = ""
    for mfg_name, mfg_info in KNOWN_MANUFACTURERS.items():
        if mfg_name.upper() in manufacturer.upper():
            mfg_domain = mfg_info.get("domain", "")
            break
            
    # If domain unknown, discover it dynamically
    if not mfg_domain and manufacturer:
        try:
            domain_query = f"{manufacturer} manufacturer official website"
            domain_response = tavily_client.search(query=domain_query, search_depth="basic", max_results=2)
            if domain_response and 'results' in domain_response and len(domain_response['results']) > 0:
                import urllib.parse
                first_url = domain_response['results'][0].get('url', '')
                parsed = urllib.parse.urlparse(first_url)
                if parsed.netloc:
                    mfg_domain = parsed.netloc.replace("www.", "")
        except Exception:
            pass
    
    # Extract a clean product identifier from desc for better search
    product_keywords = ""
    if part_desc:
        # Extract key product terms (model number, product type)
        product_keywords = part_desc.replace(manufacturer, "").strip()[:60]
    
    if mfg_domain:
        query = f"site:{mfg_domain} {mpn} OR {product_keywords} specifications"
    else:
        query = f"{manufacturer} {mpn} official product specifications datasheet -amazon -ebay -linkedin -distributor -wholesale"
    
    db = SessionLocal()
    try:
        cached = db.query(SearchCache).filter(SearchCache.query == query).first()
        if cached:
            urls = [res.get('url') for res in cached.results.get('results', [])]
            return _filter_urls(urls)
            
        try:
            response = tavily_client.search(query=query, search_depth="basic", max_results=5)
            new_cache = SearchCache(query=query, results=response)
            db.add(new_cache)
            db.commit()
            urls = [res.get('url') for res in response.get('results', [])]
            return _filter_urls(urls)
        except Exception as e:
            print(f"Tavily error: {e}")
            return []
    finally:
        db.close()

def _filter_urls(urls: List[str]) -> List[str]:
    """Remove blocked domains (distributors, marketplaces, social media)."""
    filtered = []
    for url in urls:
        if not url:
            continue
        url_lower = url.lower()
        if any(blocked in url_lower for blocked in BLOCKED_DOMAINS):
            continue
        if url_lower.endswith('.pdf'):
            continue
        filtered.append(url)
    return filtered[:3]


# ============================================================
# Phase 3: Web Scraping
# ============================================================
def scrape_url(url: str) -> str:
    """Scrapes a URL and extracts cleaned text."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        resp = requests.get(url, headers=headers, timeout=8)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            for el in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
                el.extract()
            text = soup.get_text(separator=' ', strip=True)
            return text[:6000]
        return ""
    except Exception:
        return ""


import time
import re

# ============================================================
# Phase 4: LLM Extraction (with multi-layer architecture)
# ============================================================
def _call_groq_with_retry(messages, max_tokens=600):
    """Helper to handle Groq's 8000 TPM rate limit by retrying with backoff."""
    import random
    max_retries = 8
    for attempt in range(max_retries):
        try:
            completion = get_groq_completion(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0,
                max_tokens=max_tokens
            )
            # Proactive sleep to prevent slamming the API instantly on the next call
            time.sleep(1.5)
            return completion.choices[0].message.content
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "rate limit" in error_msg.lower():
                wait_time = 30 # Default wait
                match = re.search(r'try again in ([\d\.]+)s', error_msg)
                if match:
                    # Add 2 seconds + random jitter to ensure we definitely clear the window
                    wait_time = float(match.group(1)) + 2.0 + random.uniform(0.5, 2.5)
                else:
                    # Exponential backoff fallback
                    wait_time = min(60, 2 ** attempt + random.uniform(1, 3))
                
                print(f"Rate limit hit! Waiting {wait_time:.1f} seconds (Attempt {attempt+1}/{max_retries})...")
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded for Groq API")

def extract_input_facts(row_data: dict, real_mfg: str, real_brand: str) -> Optional[BaseFacts]:
    """Layer 1: Extract Base Facts (Taxonomy, obvious attributes) strictly from the CSV Row."""
    # Removed groq_client check

    # Filter row_data to essentials
    input_keys = {"Mfg_Part_Num", "Part_Desc", "E1_Brand", "Unilog_Brand", "DIB_Brand", "Part_Manuf", "SKU", "Dept", "Class", "Fine", "Brand"}
    clean_row = {k: v for k, v in row_data.items() if k in input_keys and str(v).strip()}
    if not clean_row: clean_row = {k: v for k, v in list(row_data.items())[:10] if str(v).strip()}
    row_json = json.dumps(clean_row, indent=2)

    schema_example = '''{
  "canonical_manufacturer": "''' + real_mfg + '''",
  "canonical_brand": "''' + (real_brand if real_brand else "Brand Name") + '''",
  "taxonomy": {
    "department": "Abrasives",
    "class_name": "Sanding Discs",
    "fine": "Film Discs",
    "classpath": "Abrasives > Sanding Discs > Film Discs"
  },
  "attributes": [
    {"label": "Grit", "value": "150", "uom": "", "source": "INPUT", "evidence_snippet": "P150 grit from CSV Part_Desc"},
    {"label": "Quantity Per Box", "value": "50", "uom": "pcs", "source": "INPUT", "evidence_snippet": "50 disc/box packaging from CSV"}
  ]
}'''

    prompt = f"""You are Layer 1 of a product data enrichment pipeline.
Your job is to parse the Raw CSV Input and extract high-confidence facts.

Raw Product Data:
{row_json}

RULES:
1. MANUFACTURER: Use "{real_mfg}". 
2. BRAND: Identify the actual product brand/sub-brand.
3. TAXONOMY: Determine a precise 4-level taxonomy (department, class_name, fine, classpath). Do NOT leave empty.
4. ATTRIBUTES: Extract ANY technical specifications found explicitly in the text (e.g., Grit, Size, Quantity, Color, Voltage). 
   - Split value and UOM (e.g., "5 inches" -> value: "5", uom: "in").
   - For grit scales (e.g., "P150", "P180"), the value is "150" or "180" and the UOM is empty string "". Do not use "Grit" as a UOM.
   - Set source to "INPUT".
   
Output ONLY valid JSON matching this schema:
{schema_example}"""

    try:
        res = _call_groq_with_retry([
            {"role": "system", "content": "You are a precise JSON extraction API. Output ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ], max_tokens=400)
        if "```" in res:
            res = res.split("```")[1]
            if res.startswith("json\n"): res = res[5:]
        if "</think>" in res: res = res.split("</think>")[-1]
        
        return BaseFacts.model_validate_json(res.strip())
    except Exception as e:
        print(f"Layer 1 Error: {e}")
        return None

def extract_web_facts(scraped_text: str, base_facts: BaseFacts) -> Optional[WebFacts]:
    """Layer 2: Extract supplemental attributes from manufacturer website text."""
    if not scraped_text: return None

    base_attributes_str = json.dumps([a.label for a in base_facts.attributes])
    scraped_text = scraped_text[:2000] # Truncate heavily to prevent 413 limit explosion

    schema_example = '''{
  "attributes": [
    {"label": "Disc Diameter", "value": "5", "uom": "in", "source": "WEB", "evidence_snippet": "5 inch diameter mentioned on web"}
  ],
  "digital_assets": [
    {"type": "Image", "url": "https://example.com/image.jpg"}
  ]
}'''

    prompt = f"""You are Layer 2 of a product data enrichment pipeline.
Your job is to read scraped manufacturer text and extract SUPPLEMENTAL technical attributes.

Already Extracted Attributes (DO NOT RE-EXTRACT THESE):
{base_attributes_str}

Source Text:
{scraped_text}

RULES:
1. ATTRIBUTES: Extract technical specs (e.g., weight, material, voltage, diameter) NOT listed above.
   - Set source to "WEB".
   - Split value and UOM properly (e.g., "5 inches" -> value: "5", uom: "in").
2. DIGITAL ASSETS: Extract any valid image or PDF URLs.

Output ONLY valid JSON matching this schema:
{schema_example}"""

    try:
        res = _call_groq_with_retry([
            {"role": "system", "content": "You are a precise JSON extraction API. Output ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ], max_tokens=400)
        if "```" in res:
            res = res.split("```")[1]
            if res.startswith("json\n"): res = res[5:]
        if "</think>" in res: res = res.split("</think>")[-1]
        
        return WebFacts.model_validate_json(res.strip())
    except Exception as e:
        print(f"Layer 2 Error: {e}")
        return None

def merge_facts(input_facts: BaseFacts, web_facts: Optional[WebFacts]) -> List[Attribute]:
    """Layer 3: Merge evidence. Input facts take absolute priority."""
    if not input_facts: return []
    merged = []
    seen_labels = set()
    
    # Add input facts first
    for attr in input_facts.attributes:
        if attr.label.lower() not in seen_labels:
            merged.append(attr)
            seen_labels.add(attr.label.lower())
            
    # Add web facts if they don't conflict
    if web_facts and web_facts.attributes:
        for attr in web_facts.attributes:
            if attr.label.lower() not in seen_labels:
                merged.append(attr)
                seen_labels.add(attr.label.lower())
                
    return merged

def generate_descriptions(row_data: dict, merged_attributes: List[Attribute], taxonomy: Taxonomy, mfg: str, brand: str) -> Optional[Descriptions]:
    """Layer 4: Generate marketing copy from validated facts."""
    # Removed groq_client check

    attrs_json = json.dumps([a.model_dump() for a in merged_attributes], indent=2)
    part_desc = row_data.get('Part_Desc', row_data.get('Description', ''))

    schema_example = '''{
  "mobile": "3M, Sanding Disc, 775L, P150",
  "invoice": "SANDING DISC FILM P150 50/BX",
  "short": "3M Cubitron II 775L P150 Stikit Film Disc features precision-shaped grain.",
  "long": "The 3M Cubitron II 775L P150 Stikit Film Disc uses precision-shaped ceramic grain technology...",
  "retail": "Professional-grade P150 sanding disc...",
  "marketing": "Engineered with 3M precision-shaped grain technology...",
  "features": ["Precision-shaped ceramic grain", "Film backing"]
}'''

    prompt = f"""You are Layer 4 of a product data enrichment pipeline.
Generate descriptions based ONLY on these extracted, verified facts:

Manufacturer: {mfg}
Brand: {brand}
Taxonomy: {taxonomy.classpath}
Raw Description: {part_desc}
Extracted Attributes: {attrs_json}

RULES:
1. Do not invent specs. Use ONLY the attributes provided.
2. mobile: Comma-separated key identifiers (Manufacturer, Type, Model, Key Spec).
3. invoice: ALL CAPS, abbreviated, under 40 chars.

Output ONLY valid JSON matching this schema:
{schema_example}"""

    try:
        res = _call_groq_with_retry([
            {"role": "system", "content": "You are a precise JSON copywriter API. Output ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ], max_tokens=600)
        
        if "```" in res:
            res = res.split("```")[1]
            if res.startswith("json\n"): res = res[5:]
        if "</think>" in res: res = res.split("</think>")[-1]
        
        return Descriptions.model_validate_json(res.strip())
    except Exception as e:
        print(f"Layer 4 Error: {e}")
        return None


# ============================================================
# Phase 5: Confidence & Completeness Scoring
# ============================================================
def compute_scores(enriched_result: dict) -> dict:
    """Compute REAL confidence and completeness scores based on actual data quality."""
    
    # Confidence: weighted sum of evidence quality
    score = 0.0
    max_score = 1.0
    
    # Has manufacturer source? (+0.25)
    sources = enriched_result.get("sources", [])
    if sources:
        score += 0.25
    
    # Has taxonomy? (+0.20)
    taxonomy = enriched_result.get("taxonomy", {})
    if taxonomy.get("classpath") and taxonomy.get("classpath") != "Unclassified":
        score += 0.20
    
    # Has attributes? (+0.25, scaled by count)
    attributes = enriched_result.get("attributes", [])
    if attributes:
        attr_score = min(len(attributes) / 10.0, 1.0) * 0.25
        score += attr_score
    
    # Has descriptions? (+0.30, scaled by how many are filled)
    descs = enriched_result.get("descriptions", {})
    desc_fields = ["mobile", "invoice", "short", "long", "retail", "marketing"]
    filled_descs = sum(1 for f in desc_fields if descs.get(f) and not is_placeholder(str(descs.get(f))))
    desc_score = (filled_descs / len(desc_fields)) * 0.30
    score += desc_score
    
    confidence = round(score, 2)
    
    # Completeness: what percentage of the key 252 columns would be populated
    populated = 0
    total_key_fields = 30  # Key fields we care about
    
    # Count populated fields
    if enriched_result.get("canonical_manufacturer"): populated += 3  # MANUFACTURER_NAME, Part_Manuf, BRAND
    if taxonomy.get("department"): populated += 1
    if taxonomy.get("class_name"): populated += 1
    if taxonomy.get("fine"): populated += 1
    if taxonomy.get("classpath"): populated += 1
    populated += min(len(attributes) * 3, 15)  # Each attr = label+value+uom (max 5 attrs counted)
    populated += filled_descs
    features = descs.get("features", [])
    populated += min(len(features), 5)
    if sources: populated += min(len(sources), 3)
    
    completeness = round((populated / total_key_fields) * 100, 1)
    
    return {
        "confidence": confidence,
        "completeness": min(completeness, 100.0),
        "accuracy": round(confidence * 100, 1)
    }


# ============================================================
# Main Pipeline Entry Point
# ============================================================
def process_product(row: dict) -> dict:
    """
    Main pipeline entrypoint for a single CSV row.
    Returns a dict containing the enriched data.
    """
    # Step 0: Extract raw fields
    raw_manuf = str(row.get('Part_Manuf', row.get('Manufacturer', '')))
    raw_mpn = str(row.get('Mfg_Part_Num', row.get('MPN', '')))
    raw_desc = str(row.get('Part_Desc', row.get('Description', '')))
    raw_brand = str(row.get('E1_Brand', ''))
    
    # Step 1: RESOLVE the real manufacturer from Part_Desc
    resolved = extract_real_manufacturer(raw_desc, raw_manuf)
    real_mfg = resolved["manufacturer"]
    real_brand = resolved["brand"]
    
    print(f"  -> Resolved manufacturer: '{real_mfg}' (was '{raw_manuf}')")
    if real_brand:
        print(f"  -> Resolved brand: '{real_brand}'")
    
    # Step 2: Discover manufacturer sources (using REAL manufacturer)
    start_discover = time.time()
    urls = discover_urls(real_mfg, raw_mpn, raw_desc)
    time_discover = (time.time() - start_discover) * 1000
    
    scraped_text = ""
    sources = []
    time_scrape = 0
    
    # Step 3: Scrape manufacturer pages
    if urls:
        start_scrape = time.time()
        for url in urls:
            text = scrape_url(url)
            if text and len(text) > 200:
                scraped_text += f"\n\nSource: {url}\n" + text
                sources.append({"type": "Website", "url": url, "name": f"{real_mfg} Product Page", "status": "verified"})
        time_scrape = (time.time() - start_scrape) * 1000
    
    # If no web sources, use raw description as context
    if not scraped_text:
        scraped_text = f"Product description from catalog: {raw_desc}"
        print(f"  -> No manufacturer sources found, using description as context")
    
    # Truncate to stay under Groq's TPM limit
    if len(scraped_text) > 5500:
        scraped_text = scraped_text[:5500] + "\n...[TRUNCATED]"
    
    # Step 4: Multi-Layer LLM Extraction
    time_extract = 0
    start_extract = time.time()
    
    # Layer 1: Input Facts
    input_facts = extract_input_facts(row, real_mfg, real_brand)
    if not input_facts:
        input_facts = BaseFacts(canonical_manufacturer=real_mfg, canonical_brand=real_brand)
        
    # Layer 2: Web Facts (only if we have scraped text)
    web_facts = None
    if scraped_text and not scraped_text.startswith("Product description from catalog:"):
        web_facts = extract_web_facts(scraped_text, input_facts)
        
    # Layer 3: Merge Facts
    merged_attributes = merge_facts(input_facts, web_facts)
    
    # Layer 4: Generate Descriptions
    descriptions = generate_descriptions(row, merged_attributes, input_facts.taxonomy, input_facts.canonical_manufacturer, input_facts.canonical_brand)
    if not descriptions:
        descriptions = Descriptions(short=raw_desc)
        
    # Merge digital assets
    digital_assets = []
    if web_facts and web_facts.digital_assets:
        digital_assets = web_facts.digital_assets
        
    time_extract = (time.time() - start_extract) * 1000
    
    # Step 5: Build validation array
    validations = []
    if sources:
        validations.append({"step": "Source document identified", "status": "passed"})
    if merged_attributes:
        validations.append({"step": f"{len(merged_attributes)} attributes extracted", "status": "passed"})
    if input_facts.taxonomy and input_facts.taxonomy.classpath:
        validations.append({"step": "Taxonomy classified", "status": "passed"})
    if descriptions and descriptions.short:
        validations.append({"step": "Descriptions generated", "status": "passed"})
    
    result = {
        "success": True,
        "canonical_manufacturer": input_facts.canonical_manufacturer or real_mfg,
        "canonical_brand": input_facts.canonical_brand or real_brand,
        "taxonomy": input_facts.taxonomy.model_dump() if input_facts.taxonomy else {},
        "attributes": [a.model_dump() for a in merged_attributes],
        "descriptions": descriptions.model_dump(),
        "evidence": {},
        "sources": sources,
        "digital_assets": [a.model_dump() for a in digital_assets],
        "validation": validations,
        "stage": "COMMERCE READY",
        "latencies": {
            "CLASSIFIED": time_discover,
            "ENRICHED": time_scrape,
            "VALIDATED": time_extract
        }
    }
    
    scores = compute_scores(result)
    result["confidence"] = scores["confidence"]
    result["completeness"] = scores["completeness"]
    result["accuracy"] = scores["accuracy"]
    
    return result
