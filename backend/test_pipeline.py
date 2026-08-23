from enrichment_pipeline import extract_product_data
result = extract_product_data("FRIGIDAIRE", "PDSH4816AF", "DISHWASHER LEG 5 SST 120V 15A 50-1/4IN")
import json
print(json.dumps(result, indent=2))
