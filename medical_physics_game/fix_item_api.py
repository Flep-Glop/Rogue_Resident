#!/usr/bin/env python3
import os
import json

# First, let's create or fix the Item model
item_model_path = 'backend/data/models/item.py'
with open(item_model_path, 'w') as f:
    f.write("""# Item model

class Item:
    def __init__(self, id=None, name=None, description=None, effects=None, rarity=None, type=None, stats=None):
        self.id = id
        self.name = name
        self.description = description
        self.effects = effects or []
        self.rarity = rarity
        self.type = type
        self.stats = stats or {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'effects': self.effects,
            'rarity': self.rarity,
            'type': self.type,
            'stats': self.stats
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
            description=data.get('description'),
            effects=data.get('effects', []),
            rarity=data.get('rarity'),
            type=data.get('type'),
            stats=data.get('stats', {})
        )
""")
print(f"✅ Created/Fixed {item_model_path}")

# Now, let's create or fix the Item repository
item_repo_path = 'backend/data/repositories/item_repo.py'
with open(item_repo_path, 'w') as f:
    f.write("""# Item repository
import os
import json
from backend.data.models.item import Item

class ItemRepository:
    @staticmethod
    def get_items_file_path():
        return os.path.join('data', 'items', 'items.json')
    
    @staticmethod
    def load_items_data():
        try:
            with open(ItemRepository.get_items_file_path(), 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Return empty list if file doesn't exist or is invalid
            return []
    
    @staticmethod
    def get_all_items():
        items_data = ItemRepository.load_items_data()
        return [Item.from_dict(i) for i in items_data]
    
    @staticmethod
    def get_item_by_id(item_id):
        items_data = ItemRepository.load_items_data()
        for item_data in items_data:
            if str(item_data.get('id')) == str(item_id):
                return Item.from_dict(item_data)
        return None

# For backwards compatibility
def get_all_items():
    return ItemRepository.get_all_items()

def get_item_by_id(item_id):
    return ItemRepository.get_item_by_id(item_id)
""")
print(f"✅ Created/Fixed {item_repo_path}")

# Now, let's fix the Item API routes
item_routes_path = 'backend/api/item_routes.py'
with open(item_routes_path, 'w') as f:
    f.write("""from flask import jsonify, request
from . import api_bp
from backend.data.repositories.item_repo import get_all_items, get_item_by_id

@api_bp.route('/items', methods=['GET'])
def get_items():
    try:
        items = get_all_items()
        # Convert objects to dictionaries for JSON serialization
        items_dict = [i.to_dict() for i in items]
        return jsonify(items_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/items/<item_id>', methods=['GET'])
def get_item(item_id):
    try:
        item = get_item_by_id(item_id)
        if item:
            return jsonify(item.to_dict())
        else:
            return jsonify({"error": "Item not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
""")
print(f"✅ Created/Fixed {item_routes_path}")

# Let's create a sample items data file if it doesn't exist
os.makedirs('data/items', exist_ok=True)
items_data_path = 'data/items/items.json'
if not os.path.exists(items_data_path) or os.path.getsize(items_data_path) == 0:
    with open(items_data_path, 'w') as f:
        json.dump([
            {
                "id": 1,
                "name": "Pocket Dosimeter",
                "description": "A small device to measure radiation exposure",
                "effects": ["Increases radiation detection by 10%"],
                "rarity": "common",
                "type": "equipment",
                "stats": {"detection": 10}
            },
            {
                "id": 2,
                "name": "Lead Apron",
                "description": "Protects from radiation",
                "effects": ["Reduces radiation damage by 20%"],
                "rarity": "uncommon",
                "type": "armor",
                "stats": {"radiation_defense": 20}
            },
            {
                "id": 3,
                "name": "Medical Textbook",
                "description": "Contains valuable medical knowledge",
                "effects": ["Increases medical knowledge by 15%"],
                "rarity": "rare",
                "type": "book",
                "stats": {"knowledge": 15}
            }
        ], f, indent=2)
    print(f"✅ Created sample items data in {items_data_path}")
else:
    print(f"ℹ️ Items data file already exists at {items_data_path}")
