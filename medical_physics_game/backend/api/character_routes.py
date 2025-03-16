from flask import jsonify, request
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
