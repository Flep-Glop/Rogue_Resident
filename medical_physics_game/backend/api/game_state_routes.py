from flask import jsonify, request
from backend.api.routes import api_bp

@api_bp.route('/game_state', methods=['GET'])
def get_game_state():
    # Placeholder implementation
    return jsonify({
        "status": "active",
        "current_floor": 1,
        "player_position": {"x": 0, "y": 0},
        "visited_nodes": []
    })
