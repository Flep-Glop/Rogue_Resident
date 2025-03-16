from flask import jsonify, request
from backend.api.routes import api_bp
from backend.data.repositories.character_repo import get_all_characters, get_character_by_id

@api_bp.route('/characters', methods=['GET'])
def get_characters():
    characters = get_all_characters()
    # Convert Character objects to dictionaries for JSON serialization
    character_dicts = [character.to_dict() for character in characters]
    return jsonify(character_dicts)

@api_bp.route('/characters/<character_id>', methods=['GET'])
def get_character(character_id):
    character = get_character_by_id(character_id)
    if character:
        # Convert Character object to dictionary
        return jsonify(character.to_dict())
    return jsonify({"error": "Character not found"}), 404
