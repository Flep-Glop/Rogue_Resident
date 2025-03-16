import os
import json
from backend.data.models.item import Item

class ItemRepository:
    @staticmethod
    def load_items_data():
        """Load item data from JSON file."""
        try:
            items_path = os.path.join('data', 'items', 'items.json')
            print(f"Loading items from: {items_path}")
            with open(items_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading items: {e}")
            return []

    @staticmethod
    def get_all_items():
        """Get all items from the data file."""
        items_data = ItemRepository.load_items_data()
        return [Item.from_dict(i) for i in items_data]

    @staticmethod
    def get_item_by_id(item_id):
        """Get a specific item by ID."""
        items_data = ItemRepository.load_items_data()
        for item_data in items_data:
            if item_data.get('id') == item_id:
                return Item.from_dict(item_data)
        return None

# Functions for API use
def get_all_items():
    return ItemRepository.get_all_items()

def get_item_by_id(item_id):
    return ItemRepository.get_item_by_id(item_id)
