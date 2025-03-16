#!/bin/bash
echo "Checking CharacterRepository implementation..."

# Check if character_repo.py has the load_characters_data method
if grep -q "load_characters_data" "backend/data/repositories/character_repo.py"; then
    echo "✅ load_characters_data method exists"
else
    echo "❌ load_characters_data method is missing, creating it..."
    
    # Update character_repo.py to include load_characters_data method
    cat > backend/data/repositories/character_repo.py << 'PY_EOF'
import os
import json
from backend.data.models.character import Character

class CharacterRepository:
    @staticmethod
    def load_characters_data():
        """Load character data from JSON file."""
        try:
            characters_path = os.path.join('data', 'characters', 'characters.json')
            with open(characters_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading characters: {e}")
            return []

    @staticmethod
    def get_all_characters():
        """Get all characters from the data file."""
        characters_data = CharacterRepository.load_characters_data()
        return [Character.from_dict(c) for c in characters_data]

    @staticmethod
    def get_character_by_id(character_id):
        """Get a specific character by ID."""
        characters_data = CharacterRepository.load_characters_data()
        for char_data in characters_data:
            if char_data.get('id') == character_id:
                return Character.from_dict(char_data)
        return None

# Functions for API use
def get_all_characters():
    return CharacterRepository.get_all_characters()

def get_character_by_id(character_id):
    return CharacterRepository.get_character_by_id(character_id)
PY_EOF
    
    echo "✅ Created character_repo.py with load_characters_data method"
fi
