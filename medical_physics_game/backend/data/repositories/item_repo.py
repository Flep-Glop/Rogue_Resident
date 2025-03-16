# Item repository
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
