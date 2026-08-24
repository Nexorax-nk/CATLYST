import os
import json
import pandas as pd
from pipeline.groq_client import get_groq_completion
from rapidfuzz import process, fuzz
from .data_loaders import MANUFACTURERS_LIST

# Prepare a simple flat list of manufacturers for rapidfuzz
UNIQUE_MANUFACTURERS = list(set([m["MANUFACTURER_NAME"] for m in MANUFACTURERS_LIST if str(m.get("MANUFACTURER_NAME", "")) != "nan"]))

def resolve_entity(manufacturer_str: str, brand_str: str):
    """
    Fuzzy match and LLM-assisted normalization against the master list.
    """
    if pd.isna(manufacturer_str) or manufacturer_str.strip() == "":
        manufacturer_str = "UNKNOWN"
    if pd.isna(brand_str) or brand_str.strip() == "":
        brand_str = "UNKNOWN"

    # 1. Deterministic Fuzzy Matching
    top_matches = []
    if manufacturer_str != "UNKNOWN" and UNIQUE_MANUFACTURERS:
        results = process.extract(manufacturer_str, UNIQUE_MANUFACTURERS, scorer=fuzz.token_sort_ratio, limit=5)
        top_matches = [res[0] for res in results]
    
    # Get associated brands for these top manufacturers
    candidate_records = []
    for m in top_matches:
        brands = [rec["BRAND_NAME"] for rec in MANUFACTURERS_LIST if rec["MANUFACTURER_NAME"] == m]
        candidate_records.append({
            "manufacturer": m,
            "associated_brands": list(set(brands))
        })

    # 2. AI Selection
    prompt = f"""
    You are an expert master data steward. 
    A user has provided the following raw product data:
    Raw Manufacturer: "{manufacturer_str}"
    Raw Brand: "{brand_str}"

    We have fuzzy-matched the manufacturer against our canonical database and found these top candidates:
    {json.dumps(candidate_records, indent=2)}

    Your task is to select the correct canonical manufacturer and canonical brand from the candidates provided. 
    If none of the candidates are a good match, return "UNKNOWN" for the canonical fields.
    If the brand is "-- Unbranded --", "-- No Unilog Brand --", or similar placeholder, return "UNKNOWN".

    Respond ONLY in valid JSON format:
    {{
        "canonical_manufacturer": "Exact Name from Candidates",
        "canonical_brand": "Exact Brand Name from Candidates",
        "confidence": 0.0 to 1.0
    }}
    """

    try:
        completion = get_groq_completion(
            model="groq/compound",
            messages=[
                {"role": "system", "content": "You output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        response_json = json.loads(completion.choices[0].message.content)
        return response_json
    except Exception as e:
        print(f"Error in entity resolution: {e}")
        return {
            "canonical_manufacturer": manufacturer_str,
            "canonical_brand": brand_str,
            "confidence": 0.0
        }
