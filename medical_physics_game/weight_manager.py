import json
import os
import sys

def get_floor_config_path():
    """Get the path to the floors.json file"""
    # Try different possible locations
    possible_paths = [
        "data/floors.json",
        "medical_physics_game/data/floors.json",
        "./floors.json"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # If not found, ask user
    path = input("Enter the path to floors.json: ")
    if os.path.exists(path):
        return path
    else:
        print(f"Error: Could not find floors.json at '{path}'")
        sys.exit(1)

def load_floor_config(path):
    """Load the floor configuration from file"""
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading floor config: {e}")
        sys.exit(1)

def save_floor_config(path, config):
    """Save the floor configuration to file"""
    try:
        with open(path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"Successfully saved configuration to {path}")
    except Exception as e:
        print(f"Error saving floor config: {e}")
        sys.exit(1)

def print_floor_weights(floor):
    """Print the weights for a floor's node types"""
    print(f"\nFloor {floor['id']}: {floor['name']}")
    print("-" * 50)
    
    for node_type, config in floor['node_types'].items():
        weight = config.get('weight', 0)
        status = "ENABLED" if weight > 0 else "DISABLED"
        print(f"{node_type.ljust(15)}: {str(weight).ljust(5)} - {status}")

def update_floor_weights(floor, updates):
    """Update the weights for a floor based on the updates dictionary"""
    for node_type, weight in updates.items():
        if node_type in floor['node_types']:
            floor['node_types'][node_type]['weight'] = weight
        else:
            # Add new node type if it doesn't exist
            floor['node_types'][node_type] = {"weight": weight}
    
    return floor

def main():
    print("====== Medical Physics Game - Node Weight Manager ======")
    
    # Get path to floors.json
    path = get_floor_config_path()
    config = load_floor_config(path)
    
    # Show current weights
    print("\nCurrent Node Weights:")
    for floor in config.get('floors', []):
        print_floor_weights(floor)
    
    # Ask if user wants to update weights
    choice = input("\nDo you want to update node weights? (y/n): ")
    if choice.lower() != 'y':
        print("Exiting without changes.")
        return
    
    # Common update patterns
    print("\nCommon update patterns:")
    print("1. Questions only")
    print("2. Questions and treasures")
    print("3. All node types")
    print("4. Custom weights")
    
    pattern_choice = input("Select a pattern (1-4): ")
    
    # Define weights based on pattern
    if pattern_choice == '1':
        # Questions only
        updates = {
            "question": 100,
            "rest": 0,
            "treasure": 0, 
            "shop": 0,
            "event": 0,
            "elite": 0,
            "patient_case": 0,
            "gamble": 0
        }
    elif pattern_choice == '2':
        # Questions and treasures
        updates = {
            "question": 80,
            "rest": 0,
            "treasure": 20, 
            "shop": 0,
            "event": 0,
            "elite": 0,
            "patient_case": 0,
            "gamble": 0
        }
    elif pattern_choice == '3':
        # All node types
        updates = {
            "question": 50,
            "rest": 10,
            "treasure": 10, 
            "shop": 10,
            "event": 10,
            "elite": 10,
            "patient_case": 0,
            "gamble": 0
        }
    elif pattern_choice == '4':
        # Custom weights - ask user for each node type
        updates = {}
        node_types = ["question", "rest", "treasure", "shop", "event", "elite", "patient_case", "gamble"]
        
        print("\nEnter weights for each node type (0 to disable):")
        for node_type in node_types:
            while True:
                try:
                    weight = int(input(f"{node_type}: "))
                    if weight < 0:
                        print("Weight must be 0 or greater")
                        continue
                    updates[node_type] = weight
                    break
                except ValueError:
                    print("Please enter a valid number")
    else:
        print("Invalid choice. Exiting.")
        return
    
    # Apply to specific floor or all floors
    floor_choice = input("\nApply to (A)ll floors or (S)pecific floor? (A/S): ")
    
    if floor_choice.lower() == 's':
        # Apply to specific floor
        floor_id = int(input("Enter floor ID: "))
        for floor in config.get('floors', []):
            if floor['id'] == floor_id:
                update_floor_weights(floor, updates)
                break
        else:
            print(f"Floor {floor_id} not found.")
            return
    else:
        # Apply to all floors
        for floor in config.get('floors', []):
            update_floor_weights(floor, updates)
    
    # Show updated weights
    print("\nUpdated Node Weights:")
    for floor in config.get('floors', []):
        print_floor_weights(floor)
    
    # Confirm and save
    save_choice = input("\nSave these changes? (y/n): ")
    if save_choice.lower() == 'y':
        save_floor_config(path, config)
        
        print("\n=== IMPORTANT ===")
        print("You must restart the Flask server for changes to take effect.")
        print("If using Docker or a similar environment, you may need to rebuild.")
    else:
        print("Changes discarded.")

if __name__ == "__main__":
    main()
