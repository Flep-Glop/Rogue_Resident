#!/bin/bash
echo "Fixing Flask application and API routes..."

# First, check if the app is running
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Flask application is running"
else
    echo "❌ Flask application is not running. Please start it."
    echo "   Run: python app.py"
fi

# Update app.py to ensure API routes are registered correctly
cat > app.py << 'PY_EOF'
from flask import Flask, render_template
import os

def create_app(config_name='development'):
    app = Flask(__name__, 
               static_folder='frontend/static',
               template_folder='frontend/templates')
    
    # Load configuration
    if config_name == 'development':
        app.config['DEBUG'] = True
        app.config['SECRET_KEY'] = 'dev-secret-key'
    elif config_name == 'production':
        app.config['DEBUG'] = False
        app.config['SECRET_KEY'] = 'production-secret-key'
    elif config_name == 'test':
        app.config['DEBUG'] = True
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key'
    
    # Register blueprints
    from backend.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('errors/500.html'), 500
    
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
    
    @app.route('/item-editor')
    def item_editor():
        return render_template('pages/item_editor.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
PY_EOF

# Update API routes to ensure they're registered correctly
cat > backend/api/character_routes.py << 'PY_EOF'
from flask import jsonify, request
from . import api_bp
from backend.data.repositories.character_repo import get_all_characters, get_character_by_id

@api_bp.route('/characters', methods=['GET'])
def get_characters():
    characters = get_all_characters()
    # Convert to dictionaries if they're objects
    if characters and hasattr(characters[0], 'to_dict'):
        characters = [c.to_dict() for c in characters]
    return jsonify(characters)

@api_bp.route('/characters/<character_id>', methods=['GET'])
def get_character(character_id):
    character = get_character_by_id(character_id)
    if character:
        # Convert to dictionary if it's an object
        if hasattr(character, 'to_dict'):
            character = character.to_dict()
        return jsonify(character)
    return jsonify({"error": "Character not found"}), 404
PY_EOF

cat > backend/api/item_routes.py << 'PY_EOF'
from flask import jsonify, request
from . import api_bp
from backend.data.repositories.item_repo import get_all_items, get_item_by_id

@api_bp.route('/items', methods=['GET'])
def get_items():
    items = get_all_items()
    # Convert to dictionaries if they're objects
    if items and hasattr(items[0], 'to_dict'):
        items = [i.to_dict() for i in items]
    return jsonify(items)

@api_bp.route('/items/<item_id>', methods=['GET'])
def get_item(item_id):
    item = get_item_by_id(item_id)
    if item:
        # Convert to dictionary if it's an object
        if hasattr(item, 'to_dict'):
            item = item.to_dict()
        return jsonify(item)
    return jsonify({"error": "Item not found"}), 404
PY_EOF

cat > backend/api/question_routes.py << 'PY_EOF'
from flask import jsonify, request
from . import api_bp
from backend.data.repositories.question_repo import get_all_questions, get_question_by_id

@api_bp.route('/questions', methods=['GET'])
def get_questions():
    questions = get_all_questions()
    # Convert to dictionaries if they're objects
    if questions and hasattr(questions[0], 'to_dict'):
        questions = [q.to_dict() for q in questions]
    return jsonify(questions)

@api_bp.route('/questions/<question_id>', methods=['GET'])
def get_question(question_id):
    question = get_question_by_id(question_id)
    if question:
        # Convert to dictionary if it's an object
        if hasattr(question, 'to_dict'):
            question = question.to_dict()
        return jsonify(question)
    return jsonify({"error": "Question not found"}), 404
PY_EOF

# Create to_dict methods for models that need them
cat > backend/data/models/character.py << 'PY_EOF'
class Character:
    def __init__(self, id, name, max_hp, current_hp, abilities, stats):
        self.id = id
        self.name = name
        self.max_hp = max_hp
        self.current_hp = current_hp
        self.abilities = abilities
        self.stats = stats
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'max_hp': self.max_hp,
            'current_hp': self.current_hp,
            'abilities': self.abilities,
            'stats': self.stats
        }
PY_EOF

cat > backend/data/models/item.py << 'PY_EOF'
import json

class Item:
    def __init__(self, id, name, description, effects):
        self.id = id
        self.name = name
        self.description = description
        self.effects = effects
        
    @classmethod
    def from_dict(cls, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                return cls(
                    id=data,
                    name="Unknown Item",
                    description="Item description not available",
                    effects={}
                )
                
        return cls(
            id=data.get('id'),
            name=data.get('name', ''),
            description=data.get('description', ''),
            effects=data.get('effects', {})
        )
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'effects': self.effects
        }
PY_EOF

echo "✅ Fixed Flask application and API routes"
echo "Please restart the Flask application: python app.py"
