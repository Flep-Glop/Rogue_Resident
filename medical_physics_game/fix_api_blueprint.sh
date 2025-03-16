#!/bin/bash
echo "Fixing API blueprint registration..."

# First, let's check Flask app structure
mkdir -p backend/api

# Create or fix __init__.py in backend directory
cat > backend/__init__.py << 'PY_EOF'
# Backend package initialization
PY_EOF

# Create or fix __init__.py in backend/api directory
cat > backend/api/__init__.py << 'PY_EOF'
# API package initialization
PY_EOF

# Recreate routes.py with proper blueprint initialization
cat > backend/api/routes.py << 'PY_EOF'
from flask import Blueprint

# Create the API blueprint
api_bp = Blueprint('api', __name__)

# Import routes AFTER creating the blueprint to avoid circular imports
from backend.api import character_routes
from backend.api import item_routes
from backend.api import question_routes
from backend.api import skill_tree_routes
from backend.api import game_state_routes
PY_EOF

# Fix character_routes.py to use the proper imports
cat > backend/api/character_routes.py << 'PY_EOF'
from flask import jsonify, request
from backend.api.routes import api_bp
from backend.data.repositories.character_repo import get_all_characters, get_character_by_id

@api_bp.route('/characters', methods=['GET'])
def get_characters():
    characters = get_all_characters()
    return jsonify(characters)

@api_bp.route('/characters/<character_id>', methods=['GET'])
def get_character(character_id):
    character = get_character_by_id(character_id)
    if character:
        return jsonify(character)
    return jsonify({"error": "Character not found"}), 404
PY_EOF

# Fix item_routes.py
cat > backend/api/item_routes.py << 'PY_EOF'
from flask import jsonify, request
from backend.api.routes import api_bp
from backend.data.repositories.item_repo import get_all_items, get_item_by_id

@api_bp.route('/items', methods=['GET'])
def get_items():
    items = get_all_items()
    return jsonify(items)

@api_bp.route('/items/<item_id>', methods=['GET'])
def get_item(item_id):
    item = get_item_by_id(item_id)
    if item:
        return jsonify(item)
    return jsonify({"error": "Item not found"}), 404
PY_EOF

# Fix question_routes.py
cat > backend/api/question_routes.py << 'PY_EOF'
from flask import jsonify, request
from backend.api.routes import api_bp
from backend.data.repositories.question_repo import get_all_questions, get_question_by_id

@api_bp.route('/questions', methods=['GET'])
def get_questions():
    questions = get_all_questions()
    return jsonify(questions)

@api_bp.route('/questions/<question_id>', methods=['GET'])
def get_question(question_id):
    question = get_question_by_id(question_id)
    if question:
        return jsonify(question)
    return jsonify({"error": "Question not found"}), 404
PY_EOF

# Create skill_tree_routes.py
cat > backend/api/skill_tree_routes.py << 'PY_EOF'
from flask import jsonify
from backend.api.routes import api_bp
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

# Create game_state_routes.py
cat > backend/api/game_state_routes.py << 'PY_EOF'
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
PY_EOF

# Update main app.py to register blueprint properly
cat > app.py << 'PY_EOF'
from flask import Flask, render_template, jsonify

def create_app(config_name='development'):
    app = Flask(__name__, 
               static_folder='frontend/static',
               template_folder='frontend/templates')
    
    # Load configuration
    if config_name == 'development':
        app.config['DEBUG'] = True
        app.config['SECRET_KEY'] = 'dev-secret-key'
    
    # Register blueprints - MUST import here to avoid circular imports
    from backend.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Test route to verify the app is working
    @app.route('/test')
    def test():
        return jsonify({"status": "ok", "message": "Flask app is working!"})
    
    # Routes
    @app.route('/')
    def index():
        return render_template('pages/index.html')
    
    @app.route('/character-select')
    def character_select():
        return render_template('pages/character_select.html')
    
    @app.route('/game')
    def game():
        return render_template('pages/game.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
PY_EOF

echo "✅ Fixed API blueprint registration"
