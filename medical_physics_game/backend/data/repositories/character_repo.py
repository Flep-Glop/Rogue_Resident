# Character repository
import os
import json
from backend.data.models.character import Character

class CharacterRepository:
    @staticmethod
    def get_characters_file_path():
        return os.path.join('data', 'characters', 'characters.json')
    
    @staticmethod
    def load_characters_data():
        try:
            with open(CharacterRepository.get_characters_file_path(), 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Return empty list if file doesn't exist or is invalid
            return []
    
    @staticmethod
    def get_all_characters():
        characters_data = CharacterRepository.load_characters_data()
        return [Character.from_dict(c) for c in characters_data]
    
    @staticmethod
    def get_character_by_id(character_id):
        characters_data = CharacterRepository.load_characters_data()
        for char_data in characters_data:
            if str(char_data.get('id')) == str(character_id):
                return Character.from_dict(char_data)
        return None

# For backwards compatibility
def get_all_characters():
    return CharacterRepository.get_all_characters()

def get_character_by_id(character_id):
    return CharacterRepository.get_character_by_id(character_id)
