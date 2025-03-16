#!/usr/bin/env python3
import os
import json

# Fix the character model
model_path = 'backend/data/models/character.py'
if os.path.exists(model_path):
    with open(model_path, 'w') as f:
        f.write("""# Character model

class Character:
    def __init__(self, id=None, name=None, max_hp=100, current_hp=100, abilities=None, stats=None, level=1):
        self.id = id
        self.name = name
        self.max_hp = max_hp
        self.current_hp = current_hp
        self.abilities = abilities or []
        self.stats = stats or {}
        self.level = level
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'max_hp': self.max_hp,
            'current_hp': self.current_hp,
            'abilities': self.abilities,
            'stats': self.stats,
            'level': self.level
        }
    
    @classmethod
    def from_dict(cls, data):
        # Handle both string and dictionary input
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                # If it's not valid JSON, use it as the ID
                return cls(id=data)
        
        # Now data should be a dictionary
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            max_hp=data.get('max_hp', 100),
            current_hp=data.get('current_hp', 100),
            abilities=data.get('abilities', []),
            stats=data.get('stats', {}),
            level=data.get('level', 1)
        )
""")
    print(f"✅ Fixed {model_path}")
else:
    print(f"❌ {model_path} not found")

# Fix the character repository
repo_path = 'backend/data/repositories/character_repo.py'
if os.path.exists(repo_path):
    with open(repo_path, 'w') as f:
        f.write("""# Character repository
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
""")
    print(f"✅ Fixed {repo_path}")
else:
    print(f"❌ {repo_path} not found")

# Fix the character routes
route_path = 'backend/api/character_routes.py'
if os.path.exists(route_path):
    with open(route_path, 'w') as f:
        f.write("""from flask import jsonify, request
from . import api_bp
from backend.data.repositories.character_repo import get_all_characters, get_character_by_id

@api_bp.route('/characters', methods=['GET'])
def get_characters():
    try:
        characters = get_all_characters()
        # Convert objects to dictionaries for JSON serialization
        characters_dict = [c.to_dict() for c in characters]
        return jsonify(characters_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/characters/<character_id>', methods=['GET'])
def get_character(character_id):
    try:
        character = get_character_by_id(character_id)
        if character:
            return jsonify(character.to_dict())
        else:
            return jsonify({"error": "Character not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
""")
    print(f"✅ Fixed {route_path}")
else:
    print(f"❌ {route_path} not found")

