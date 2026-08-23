import os
from groq import Groq

primary_key = os.environ.get("GROQ_API_KEY")
fallback_key = os.environ.get("GROQ_API_KEY_FALLBACK")

primary_client = Groq(api_key=primary_key) if primary_key else None
fallback_client = Groq(api_key=fallback_key) if fallback_key else None

def get_groq_completion(**kwargs):
    if not primary_client:
        raise ValueError("GROQ_API_KEY not configured")
        
    try:
        return primary_client.chat.completions.create(**kwargs)
    except Exception as e:
        print(f"[GROQ FALLBACK] Primary client failed: {e}. Attempting fallback...")
        if fallback_client:
            return fallback_client.chat.completions.create(**kwargs)
        else:
            print("[GROQ FALLBACK] No fallback client available.")
            raise e
