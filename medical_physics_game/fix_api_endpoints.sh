#!/bin/bash
echo "Fixing missing API endpoints..."

# Create skill_tree_routes.py if it doesn't exist
if [ ! -f "backend/api/skill_tree_routes.py" ]; then
    cat > backend/api/skill_tree_routes.py << 'PY_EOF'
from flask import jsonify
from . import api_bp
import json
import os

@api_bp.route('/skill_tree', methods=['GET'])
def get_skill_tree():
    try:
        skill_tree_path = os.path.join('data', 'skill_tree', 'skill_tree.json')
        with open(skill_tree_path, 'r') as f:
            skill_tree = json.load(f)
        return jsonify(skill_tree)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
PY_EOF
    echo "✅ Created skill_tree_routes.py"
fi

# Create game_state_routes.py if it doesn't exist
if [ ! -f "backend/api/game_state_routes.py" ]; then
    cat > backend/api/game_state_routes.py << 'PY_EOF'
from flask import jsonify, request
from . import api_bp

@api_bp.route('/game_state', methods=['GET'])
def get_game_state():
    # This is a placeholder implementation
    return jsonify({
        "status": "active",
        "current_floor": 1,
        "player_position": {"x": 0, "y": 0},
        "visited_nodes": []
    })

@api_bp.route('/game_state', methods=['POST'])
def update_game_state():
    # This is a placeholder implementation
    data = request.json
    return jsonify({"status": "success", "message": "Game state updated"})
PY_EOF
    echo "✅ Created game_state_routes.py"
fi

# Fix routes.py to import all route files
cat > backend/api/routes.py << 'PY_EOF'
from flask import Blueprint

api_bp = Blueprint('api', __name__)

from . import character_routes
from . import item_routes
from . import question_routes
from . import skill_tree_routes
from . import game_state_routes
PY_EOF

echo "✅ Updated routes.py to import all route modules"
