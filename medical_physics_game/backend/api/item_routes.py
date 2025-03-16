from flask import jsonify, request
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
