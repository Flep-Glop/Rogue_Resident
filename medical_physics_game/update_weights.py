import json
import os
import sys

def update_floor_weights(config_path="data/floors.json", mode="questions_only"):
    """
    Update floor weights based on the selected mode
    
    Modes:
    - questions_only: Only question nodes appear
    - include_treasures: Questions and treasures
    - include_rest: Questions, treasures, and rest nodes
    - balanced: Balanced mix of all node types
    - custom: Use custom weights defined in the weights dict
    """
    # Define weight profiles
    weight_profiles = {
        "questions_only": {
            "question": 100,
            "rest": 0,
            "treasure": 0,
            "shop": 0,
            "event": 0,
            "elite": 0,
            "patient_case": 0,
            "gamble": 0
        },
        "include_treasures": {
            "question": 80,
            "rest": 0,
            "treasure": 20,
            "shop": 0,
            "event": 0,
            "elite": 0,
            "patient_case": 0,
            "gamble": 0
        },
        "include_rest": {
            "question": 70,
            "rest": 15,
            "treasure": 15,
            "shop": 0,
            "event": 0,
            "elite": 0,
            "patient_case": 0,
            "gamble": 0
        },
        "balanced": {
            "question": 40,
            "rest": 10,
            "treasure": 15,
            "shop": 10,
            "event": 10,
            "elite": 10,
            "patient_case": 5,
            "gamble": 0
        },
        "custom": {
            # Define your custom weights here
            "question": 100,
            "rest": 0,
            "treasure": 0,
            "shop": 0,
            "event": 0,
            "elite": 0,
            "patient_case": 0,
            "gamble": 0
        }
    }
    
    # Validate mode
    if mode not in weight_profiles:
        print(f"Error: Unknown mode '{mode}'. Available modes: {', '.join(weight_profiles.keys())}")
        return False
    
    # Load config file
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except Exception as e:
        print(f"Error loading floor config from {config_path}: {e}")
        return False
    
    weights = weight_profiles[mode]
    
    # Update all floors
    for floor in config.get('floors', []):
        for node_type, weight in weights.items():
            if node_type in floor['node_types']:
                floor['node_types'][node_type]['weight'] = weight
            else:
                # Add new node type if it doesn't exist
                floor['node_types'][node_type] = {"weight": weight}
    
    # Save the updated config
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"Successfully updated floor weights using '{mode}' mode")
        return True
    except Exception as e:
        print(f"Error saving floor config: {e}")
        return False

if __name__ == "__main__":
    # Get mode from command line args if provided
    mode = "questions_only"  # Default
    
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    
    # Get config path if provided as second arg
    config_path = "data/floors.json"
    if len(sys.argv) > 2:
        config_path = sys.argv[2]
    
    # Update weights
    success = update_floor_weights(config_path, mode)
    
    if success:
        print("\n=== IMPORTANT ===")
        print("You must restart the Flask server for changes to take effect.")
    else:
        print("Failed to update weights.")
