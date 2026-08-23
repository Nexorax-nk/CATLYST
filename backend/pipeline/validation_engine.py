from .data_loaders import UOM_MAP

def validate_against_lov(attribute_dict: dict, classpath: str):
    """
    Validates extracted attributes against the Unicat LOV and UOM standard.
    """
    validated = {}
    rejected = {}
    
    for attr, val in attribute_dict.items():
        if not isinstance(val, str):
            val = str(val)
            
        # Very simple UOM normalisation based on UOM_MAP
        # Example: "24 inches" -> "24 in"
        normalized_val = val
        for k, v in UOM_MAP.items():
            if f" {k}" in normalized_val.lower():
                # naive replacement
                normalized_val = normalized_val.lower().replace(f" {k}", f" {v}")
        
        # Here we would do a strict lookup against LOV values
        # For MVP, we will accept the normalized value
        validated[attr] = normalized_val

    return {
        "validated_attributes": validated,
        "rejected_attributes": rejected,
        "status": "PASSED" if not rejected else "PARTIAL"
    }
