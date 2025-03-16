import json
import os
from pathlib import Path
import time
from backend.data.models.character import Character

# Path to character data files
DATA_DIR = Path(__file__).resolve().parents[2] / 'data'
CHARACTERS_FILE = DATA_DIR / 'characters' / 'characters.json'
CUSTOM_CHARACTERS_DIR = DATA_DIR / 'characters' / 'custom'

# Ensure custom characters directory exists
os.makedirs(CUSTOM_CHARACTERS_DIR, exist_ok=True)

def get_all_characters():
    """
    Get all available characters, including both standard and custom characters.
    """
    characters = []
    
    # Load standard characters
    try:
        with open(CHARACTERS_FILE, 'r') as f:
            char_data = json.load(f)
            for data in char_data:
                characters.append(Character.from_dict(data))
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading standard characters: {e}")
    
    # Load custom characters
    try:
        for file_path in CUSTOM_CHARACTERS_DIR.glob('*.json'):
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    custom_char = Character.from_dict(data)
                    custom_char.custom = True  # Mark as custom
                    characters.append(custom_char)
            except (json.JSONDecodeError, Exception) as e:
                print(f"Error loading custom character {file_path}: {e}")
    except Exception as e:
        print(f"Error scanning custom characters directory: {e}")
    
    return characters

def get_character_by_id(character_id):
    """
    Get a character by ID from either standard or custom characters.
    """
    # Try standard characters first
    try:
        with open(CHARACTERS_FILE, 'r') as f:
            char_data = json.load(f)
            for data in char_data:
                if str(data.get('id')) == str(character_id):
                    return Character.from_dict(data)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading standard characters: {e}")
    
    # Try custom characters
    custom_file = CUSTOM_CHARACTERS_DIR / f"{character_id}.json"
    if custom_file.exists():
        try:
            with open(custom_file, 'r') as f:
                data = json.load(f)
                custom_char = Character.from_dict(data)
                custom_char.custom = True
                return custom_char
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error loading custom character {custom_file}: {e}")
    
    return None

def save_custom_character(data):
    """
    Save a new custom character.
    
    Args:
        data (dict): Character data including name, abilities, and stats
        
    Returns:
        Character: The created character instance
    """
    # Generate an ID if not provided
    if 'id' not in data:
        data['id'] = int(time.time() * 1000)  # Use timestamp as ID
    
    # Set default values if not provided
    if 'max_hp' not in data:
        data['max_hp'] = 100
    if 'current_hp' not in data:
        data['current_hp'] = data['max_hp']
    if 'level' not in data:
        data['level'] = 1
    
    # Mark as custom
    data['custom'] = True
    
    # Create character instance
    character = Character.from_dict(data)
    
    # Save to file
    file_path = CUSTOM_CHARACTERS_DIR / f"{character.id}.json"
    with open(file_path, 'w') as f:
        json.dump(character.to_dict(), f, indent=2)
    
    return character