from flask import jsonify, request
from backend.api.routes import api_bp
from backend.data.repositories.item_repo import get_all_items, get_item_by_id

@api_bp.route('/items', methods=['GET'])
def get_items():
    items = get_all_items()
    # Convert Item objects to dictionaries for JSON serialization
    item_dicts = [item.to_dict() for item in items]
    return jsonify(item_dicts)

@api_bp.route('/items/<item_id>', methods=['GET'])
def get_item(item_id):
    item = get_item_by_id(item_id)
    if item:
        # Convert Item object to dictionary
        return jsonify(item.to_dict())
    return jsonify({"error": "Item not found"}), 404
