from ..models.character import Character
import json
import os

class CharacterRepository:
    @staticmethod
    def get_all_characters():
        """Retrieve all characters from the data store"""
        data_path = os.path.join(os.path.dirname(__file__), '../../../data/characters/characters.json')
        try:
            with open(data_path, 'r') as f:
                characters_data = json.load(f)
                return [Character.from_dict(c) for c in characters_data]
        except FileNotFoundError:
            return []

    @staticmethod
    def get_character_by_id(character_id):
        """Retrieve a specific character by ID"""
        characters = CharacterRepository.get_all_characters()
        for character in characters:
            if str(character.id) == str(character_id):
                return character
        return None

# Add these functions to maintain compatibility with current code
def get_all_characters():
    return CharacterRepository.get_all_characters()

def get_character_by_id(character_id):
    return CharacterRepository.get_character_by_id(character_id)
