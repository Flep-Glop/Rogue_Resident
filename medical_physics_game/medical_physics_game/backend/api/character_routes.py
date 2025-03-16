from flask import jsonify, request
from . import api_bp
from backend.data.repositories.character_repo import get_all_characters, get_character_by_id

@api_bp.route('/characters', methods=['GET'])
def get_characters():
    """Get all characters"""
    characters = get_all_characters()
    return jsonify([character.to_dict() for character in characters])

@api_bp.route('/characters/<character_id>', methods=['GET'])
def get_character(character_id):
    """Get a specific character by ID"""
    character = get_character_by_id(character_id)
    if character:
        return jsonify(character.to_dict())
    return jsonify({"error": "Character not found"}), 404
