from flask import jsonify, request
from backend.api.routes import api_bp
from backend.data.repositories.character_repo import get_all_characters, get_character_by_id, save_custom_character

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

@api_bp.route('/characters/custom', methods=['POST'])
def create_custom_character():
    """Create a new custom character."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'abilities', 'stats']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate stats
    required_stats = ['intelligence', 'persistence', 'adaptability']
    for stat in required_stats:
        if stat not in data['stats']:
            return jsonify({"error": f"Missing required stat: {stat}"}), 400
    
    # Create custom character
    try:
        character = save_custom_character(data)
        return jsonify(character.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500