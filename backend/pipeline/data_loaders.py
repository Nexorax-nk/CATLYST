import pandas as pd
import os
import sys

# The exact path the user provided for the Expected Output
EXPECTED_OUTPUT_PATH = r"C:\Users\navee\CATLYST\Unihack_ Expected Output - Delivery Format (1).csv"

def build_masters_from_expected_output():
    manufacturers_list = []
    lov_map = {}
    
    if os.path.exists(EXPECTED_OUTPUT_PATH):
        try:
            df = pd.read_csv(EXPECTED_OUTPUT_PATH)
            
            # 1. Build Manufacturers List
            unique_combos = df[['MANUFACTURER_NAME', 'BRAND_NAME']].drop_duplicates().dropna()
            manufacturers_list = unique_combos.to_dict('records')
            
            # 2. Build LOV Schema (mocked using a generic classpath for MVP)
            # In a real scenario, we'd map this by Category. Here we just aggregate all unique attribute labels.
            all_labels = set()
            for i in range(1, 21):
                col_name = f"ATTRIBUTE_LABEL {i}"
                if col_name in df.columns:
                    labels = df[col_name].dropna().unique()
                    all_labels.update(labels)
                    
            lov_map = {
                "Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers": list(all_labels)
            }
            
            print(f"Dynamically extracted {len(manufacturers_list)} Manufacturer/Brand combos from Expected Output.")
            
        except Exception as e:
            print(f"Error reading Expected Output for Master Data: {e}")
    else:
        print(f"Warning: {EXPECTED_OUTPUT_PATH} not found. Using mock Master Data.")
        manufacturers_list = [
            {"MANUFACTURER_NAME": "Freud Inc", "BRAND_NAME": "Diablo"},
            {"MANUFACTURER_NAME": "Whirlpool Corporation", "BRAND_NAME": "Whirlpool"}
        ]
        lov_map = {
            "Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers": ["Material", "Voltage", "Color"]
        }
        
    return manufacturers_list, lov_map

def load_uom_standard():
    return {
        "inches": "in",
        "inch": "in",
        "in.": "in",
        "volt": "V",
        "volts": "V",
        "amp": "A",
        "amps": "A"
    }

# Pre-load data in memory
MANUFACTURERS_LIST, LOV_MAP = build_masters_from_expected_output()
UOM_MAP = load_uom_standard()
