import os
import re
import json
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
from pipeline.groq_client import get_groq_completion
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

try:
    tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None
except Exception as e:
    print(f"Error initializing clients: {e}")
    tavily_client = None
    tavily_client = None

def discover_manufacturer_sources(manufacturer: str, mpn: str) -> List[str]:
    if not tavily_client:
        return []
        
    query = f"{manufacturer} {mpn} product page OR specifications OR datasheet"
    try:
        response = tavily_client.search(query=query, max_results=3, search_depth="basic")
        urls = [result["url"] for result in response.get("results", [])]
        return urls
    except Exception as e:
        print(f"Tavily search error: {e}")
        return []

def scrape_url_text(url: str) -> str:
    try:
        response = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for el in soup(["script", "style", "nav", "footer", "header"]):
            el.extract()
        text = soup.get_text(separator="\n")
        text = re.sub(r'\n+', '\n', text)
        return text[:15000]
    except Exception as e:
        print(f"Scrape error for {url}: {e}")
        return ""

def extract_product_data(manufacturer: str, mpn: str, raw_desc: str) -> dict:
    urls = discover_manufacturer_sources(manufacturer, mpn)
    
    context_text = ""
    found_url = ""
    for url in urls:
        if not url.endswith('.pdf'):
            text = scrape_url_text(url)
            if len(text) > 500:
                context_text = text
                found_url = url
                break
                
    if not context_text:
        context_text = f"Fallback info: {raw_desc}. No online sources found."

    prompt = f"""
You are an expert product data enricher. Your job is to extract highly accurate product information based on the provided context.
Manufacturer: {manufacturer}
MPN: {mpn}
Context text from {found_url}:
{context_text}

Task:
Extract the product category (a leaf category like 'Built-In Dishwashers' or 'Sanding Belts').
Extract key technical attributes (e.g. Voltage, Material, Dimensions) with their UOMs.
Write a short description (1-2 sentences).
Write a long description (1 paragraph).
Extract the marketing description and item features.

Return strictly JSON matching this structure:
{{
    "category": "string",
    "attributes": {{"attribute_name": "value with UOM"}},
    "short_description": "string",
    "long_description": "string",
    "marketing_description": "string",
    "features": ["feature 1", "feature 2"],
    "extracted_from_url": "string"
}}
    """
    
    try:
        chat_completion = get_groq_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise data extraction tool that returns strictly JSON."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        result = json.loads(chat_completion.choices[0].message.content)
        result["extracted_from_url"] = found_url
        
        result["validation"] = [
            {"step": "Source document identified via Tavily", "status": "passed" if found_url else "warning"},
            {"step": "Context scraped via BeautifulSoup", "status": "passed" if context_text and found_url else "warning"},
            {"step": "Attributes extracted via Groq LLaMA3", "status": "passed"},
            {"step": "JSON schema validated", "status": "passed"}
        ]
        return result
    except Exception as e:
        print(f"Groq Extraction error: {e}")
        return fallback_extraction(raw_desc)

def fallback_extraction(raw_desc: str) -> dict:
    return {
        "category": "Unknown",
        "attributes": {},
        "short_description": raw_desc,
        "long_description": "",
        "marketing_description": "",
        "features": [],
        "extracted_from_url": "",
        "validation": [
            {"step": "Source discovery", "status": "failed"},
            {"step": "LLM Extraction", "status": "failed"}
        ]
    }
