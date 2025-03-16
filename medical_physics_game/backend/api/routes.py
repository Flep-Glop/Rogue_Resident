"""
API routes for the Medical Physics Game.
Defines the REST API endpoints for game functionality.
"""

from flask import Blueprint, jsonify, request
from backend.core.state_manager import get_game_state
from backend.data.repositories.character_repo import CharacterRepository
from backend.data.repositories.question_repo import QuestionRepository
from backend.plugins.base_plugin import get_plugin_manager

# Create Blueprint
api_bp = Blueprint('api', __name__)

# Register other route modules
from . import character_routes, game_state_routes, item_routes, question_routes, skill_tree_routes

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

# API route to check server status
@api_bp.route('/status', methods=['GET'])
def status():
    """Check server status."""
    return api_response(
        success=True,
        data={'status': 'online'},
        message='Server is running'
    )

# API route to initialize a new game
@api_bp.route('/game/new', methods=['POST'])
def new_game():
    """Start a new game."""
    data = request.get_json()
    
    if not data or 'character_id' not in data:
        return api_response(
            success=False,
            message='Character ID is required',
            status_code=400
        )
    
    character_id = data['character_id']
    game_state = get_game_state()
    
    success = game_state.new_game(character_id)
    
    if not success:
        return api_response(
            success=False,
            message=f'Failed to start game with character ID: {character_id}',
            status_code=400
        )
    
    # Get initial game data
    current_node = game_state.get_current_node()
    plugin_manager = get_plugin_manager()
    
    node_data = plugin_manager.get_client_data_for_node(current_node, game_state)
    
    return api_response(
        success=True,
        data={
            'character': game_state.character.to_dict(),
            'current_node': node_data,
            'available_moves': game_state.get_available_moves(),
            'score': game_state.score,
            'reputation': game_state.reputation
        },
        message='Game started successfully'
    )

# API route to move to a node
@api_bp.route('/game/move', methods=['POST'])
def move_to_node():
    """Move to a node on the game map."""
    data = request.get_json()
    
    if not data or 'node_id' not in data:
        return api_response(
            success=False,
            message='Node ID is required',
            status_code=400
        )
    
    node_id = data['node_id']
    game_state = get_game_state()
    
    # Check if the move is valid
    if node_id not in game_state.get_available_moves():
        return api_response(
            success=False,
            message=f'Invalid move to node ID: {node_id}',
            status_code=400
        )
    
    # Move to the node
    node = game_state.move_to_node(node_id)
    
    if not node:
        return api_response(
            success=False,
            message=f'Failed to move to node ID: {node_id}',
            status_code=400
        )
    
    # Handle the node with appropriate plugin
    plugin_manager = get_plugin_manager()
    node_data = plugin_manager.get_client_data_for_node(node, game_state)
    
    return api_response(
        success=True,
        data={
            'node': node_data,
            'available_moves': game_state.get_available_moves(),
            'character': game_state.character.to_dict(),
            'score': game_state.score,
            'reputation': game_state.reputation
        },
        message='Moved to node successfully'
    )

# API route to interact with a node
@api_bp.route('/game/interact', methods=['POST'])
def interact_with_node():
    """Interact with the current node."""
    data = request.get_json()
    
    if not data:
        return api_response(
            success=False,
            message='Interaction data is required',
            status_code=400
        )
    
    game_state = get_game_state()
    current_node = game_state.get_current_node()
    
    if not current_node:
        return api_response(
            success=False,
            message='No current node to interact with',
            status_code=400
        )
    
    # Handle the interaction with appropriate plugin
    plugin_manager = get_plugin_manager()
    result = plugin_manager.handle_node(current_node, game_state)
    
    # Add game state info to result
    result.update({
        'character': game_state.character.to_dict(),
        'available_moves': game_state.get_available_moves(),
        'score': game_state.score,
        'reputation': game_state.reputation
    })
    
    return api_response(
        success=True,
        data=result,
        message='Node interaction processed'
    )

# API route to save game
@api_bp.route('/game/save', methods=['POST'])
def save_game():
    """Save the current game state."""
    data = request.get_json()
    save_slot = data.get('save_slot', 0) if data else 0
    
    game_state = get_game_state()
    success = game_state.save_game(save_slot)
    
    if not success:
        return api_response(
            success=False,
            message=f'Failed to save game to slot {save_slot}',
            status_code=500
        )
    
    return api_response(
        success=True,
        message=f'Game saved to slot {save_slot}'
    )

# API route to load game
@api_bp.route('/game/load', methods=['POST'])
def load_game():
    """Load a saved game state."""
    data = request.get_json()
    save_slot = data.get('save_slot', 0) if data else 0
    
    game_state = get_game_state()
    success = game_state.load_game(save_slot)
    
    if not success:
        return api_response(
            success=False,
            message=f'Failed to load game from slot {save_slot}',
            status_code=404
        )
    
    # Get current node data
    current_node = game_state.get_current_node()
    plugin_manager = get_plugin_manager()
    node_data = plugin_manager.get_client_data_for_node(current_node, game_state)
    
    return api_response(
        success=True,
        data={
            'character': game_state.character.to_dict(),
            'current_node': node_data,
            'available_moves': game_state.get_available_moves(),
            'score': game_state.score,
            'reputation': game_state.reputation
        },
        message=f'Game loaded from slot {save_slot}'
    )

# API route to check saved games
@api_bp.route('/game/save-slots', methods=['GET'])
def get_save_slots():
    """Get information about available save slots."""
    # This is a simplified implementation
    import os
    from backend.utils.db_utils import get_data_path
    
    save_slots = []
    
    # Check for save files
    for i in range(3):  # Check slots 0-2
        save_path = os.path.join(get_data_path(), f'save_{i}.json')
        if os.path.exists(save_path):
            try:
                import json
                with open(save_path, 'r') as f:
                    save_data = json.load(f)
                    
                save_slots.append({
                    'slot': i,
                    'character_name': save_data.get('character', {}).get('name', 'Unknown'),
                    'score': save_data.get('score', 0),
                    'floor': save_data.get('current_floor', 1),
                    'timestamp': os.path.getmtime(save_path)
                })
            except:
                # If there's an error reading the save file, ignore it
                pass
    
    return api_response(
        success=True,
        data={'save_slots': save_slots},
        message='Save slots retrieved'
    )