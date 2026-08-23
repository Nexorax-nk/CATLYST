import os
import json
from pipeline.groq_client import get_groq_completion
from .data_loaders import LOV_MAP

def extract_attributes(raw_description: str, classpath: str):
    """
    Extract raw attributes from a string or document using Groq.
    """
    allowed_attributes = LOV_MAP.get(classpath, ["Material", "Dimensions", "Weight", "Color"]) # fallback
    
    prompt = f"""
    You are an expert product data extractor.
    Your task is to extract product attributes from the following raw description.
    
    Raw Description:
    "{raw_description}"

    You should only attempt to extract the following allowed attributes for this category:
    {json.dumps(allowed_attributes)}

    If an attribute is not present in the description, do not include it.
    
    Respond ONLY in valid JSON format mapping the allowed attribute names to their extracted values:
    {{
        "Extracted_Attribute_1": "Extracted Value 1",
        "Extracted_Attribute_2": "Extracted Value 2"
    }}
    """

    try:
        completion = get_groq_completion(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        extracted = json.loads(completion.choices[0].message.content)
        return {
            "extracted": extracted,
            "evidence": "Extracted from Part_Desc",
            "confidence": 0.90
        }
    except Exception as e:
        print(f"Error in attribute extraction: {e}")
        return {
            "extracted": {},
            "evidence": "Error",
            "confidence": 0.0
        }
