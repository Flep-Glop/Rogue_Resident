# data_manager.py - JSON data loading/saving
import json
import os

# Data loading functions
def load_json_data(filename):
    """Load data from a JSON file in the data directory"""
    data_path = os.path.join('data', filename)
    try:
        with open(data_path, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {filename}: {e}")
        return {}

def save_json_data(data, filename):
    """Save data to a JSON file in the data directory"""
    data_path = os.path.join('data', filename)
    os.makedirs(os.path.dirname(data_path), exist_ok=True)
    
    with open(data_path, 'w') as file:
        json.dump(data, file, indent=2)

# Initialize data directory and files if they don't exist
def init_data_files():
    """Create data directory and initialize JSON files if they don't exist"""
    data_dir = 'data'
    os.makedirs(data_dir, exist_ok=True)
    
    # Check if each file exists, create with default content if not
    files_to_check = [
        ('questions.json', {"categories": []}),
        ('floors.json', {"floors": []}),
        ('characters.json', {"characters": []}),
        ('items.json', {"items": []}),
        ('game_config.json', {"game_title": "Medical Physics Residency Game"})
    ]
    
    for filename, default_content in files_to_check:
        file_path = os.path.join(data_dir, filename)
        if not os.path.exists(file_path):
            with open(file_path, 'w') as file:
                json.dump(default_content, file, indent=2)
            print(f"Created default {filename}")