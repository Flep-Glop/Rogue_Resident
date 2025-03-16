"""
Character API routes for the Medical Physics Game.
Handles endpoints related to game characters.
"""

from flask import jsonify, request
from . import api_bp
from backend.data.repositories.character_repo import CharacterRepository

# Helper function to standardize API responses
def api_response(success, data=None, message=None, status_code=200):
    """
    Create a standardized API response.
    
    Args:
        success (bool): Whether the request was successful
        data (dict, optional): Response data
        message (str, optional): Response message
        status_code (int, optional): HTTP status code
        
    Returns:
        tuple: JSON response and status code
    """
    response = {
        'success': success
    }
    
    if data is not None:
        response['data'] = data
        
    if message is not None:
        response['message'] = message
        
    return jsonify(response), status_code

# API route to get all characters
@api_bp.route('/characters', methods=['GET'])
def get_characters():
    """Get all available characters."""
    character_repo = CharacterRepository()
    characters = character_repo.get_all()
    
    return api_response(
        success=True,
        data={
            'characters': [char.to_dict() for char in characters]
        },
        message='Characters retrieved successfully'
    )

# API route to get a specific character
@api_bp.route('/characters/<character_id>', methods=['GET'])
def get_character(character_id):
    """Get a specific character by ID."""
    character_repo = CharacterRepository()
    character = character_repo.get_by_id(character_id)
    
    if not character:
        return api_response(
            success=False,
            message=f'Character with ID {character_id} not found',
            status_code=404
        )
    
    return api_response(
        success=True,
        data={
            'character': character.to_dict()
        },
        message='Character retrieved successfully'
    )

# API route to create a new character (admin functionality)
@api_bp.route('/characters', methods=['POST'])
def create_character():
    """Create a new character."""
    data = request.get_json()
    
    if not data:
        return api_response(
            success=False,
            message='Character data is required',
            status_code=400
        )
    
    # Create character from request data
    from backend.data.models.character import Character
    try:
        character = Character.from_dict(data)
    except Exception as e:
        return api_response(
            success=False,
            message=f'Invalid character data: {str(e)}',
            status_code=400
        )
    
    # Save character
    character_repo = CharacterRepository()
    success = character_repo.save(character)
    
    if not success:
        return api_response(
            success=False,
            message='Failed to save character',
            status_code=500
        )
    
    return api_response(
        success=True,
        data={
            'character': character.to_dict()
        },
        message='Character created successfully',
        status_code=201
    )

# API route to update a character (admin functionality)
@api_bp.route('/characters/<character_id>', methods=['PUT'])
def update_character(character_id):
    """Update an existing character."""
    data = request.get_json()
    
    if not data:
        return api_response(
            success=False,
            message='Character data is required',
            status_code=400
        )
    
    # Check if character exists
    character_repo = CharacterRepository()
    existing_character = character_repo.get_by_id(character_id)
    
    if not existing_character:
        return api_response(
            success=False,
            message=f'Character with ID {character_id} not found',
            status_code=404
        )
    
    # Update character with new data
    from backend.data.models.character import Character
    try:
        # Ensure ID is preserved
        data['id'] = character_id
        character = Character.from_dict(data)
    except Exception as e:
        return api_response(
            success=False,
            message=f'Invalid character data: {str(e)}',
            status_code=400
        )
    
    # Save updated character
    success = character_repo.save(character)
    
    if not success:
        return api_response(
            success=False,
            message='Failed to update character',
            status_code=500
        )
    
    return api_response(
        success=True,
        data={
            'character': character.to_dict()
        },
        message='Character updated successfully'
    )

# API route to delete a character (admin functionality)
@api_bp.route('/characters/<character_id>', methods=['DELETE'])
def delete_character(character_id):
    """Delete a character."""
    character_repo = CharacterRepository()
    
    # Check if character exists
    existing_character = character_repo.get_by_id(character_id)
    
    if not existing_character:
        return api_response(
            success=False,
            message=f'Character with ID {character_id} not found',
            status_code=404
        )
    
    # Delete character
    success = character_repo.delete(character_id)
    
    if not success:
        return api_response(
            success=False,
            message='Failed to delete character',
            status_code=500
        )
    
    return api_response(
        success=True,
        message='Character deleted successfully'
    )