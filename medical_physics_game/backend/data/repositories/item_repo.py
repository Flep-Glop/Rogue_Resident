from backend.data.models.item import Item
import json
import os

def get_all_items():
    """Retrieve all items from the data store"""
    data_path = os.path.join(os.path.dirname(__file__), '../../../../data/items/items.json')
    try:
        with open(data_path, 'r') as f:
            items_data = json.load(f)
            return [Item.from_dict(i) for i in items_data]
    except FileNotFoundError:
        return []

def get_item_by_id(item_id):
    """Retrieve a specific item by ID"""
    items = get_all_items()
    for item in items:
        if str(item.id) == str(item_id):
            return item
    return None
