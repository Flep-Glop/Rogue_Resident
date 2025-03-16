#!/bin/bash
echo "Fixing API routes for JSON serialization..."

# Fix character_routes.py
cat > backend/api/character_routes.py << 'PY_EOF'
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
PY_EOF

# Fix item_routes.py
cat > backend/api/item_routes.py << 'PY_EOF'
from flask import jsonify, request
from backend.api.routes import api_bp
from backend.data.repositories.item_repo import get_all_items, get_item_by_id

@api_bp.route('/items', methods=['GET'])
def get_items():
    items = get_all_items()
    # Convert Item objects to dictionaries for JSON serialization
    item_dicts = [item.to_dict() for item in items]
    return jsonify(item_dicts)

@api_bp.route('/items/<item_id>', methods=['GET'])
def get_item(item_id):
    item = get_item_by_id(item_id)
    if item:
        # Convert Item object to dictionary
        return jsonify(item.to_dict())
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
    # Convert Question objects to dictionaries for JSON serialization
    question_dicts = [question.to_dict() for question in questions]
    return jsonify(question_dicts)

@api_bp.route('/questions/<question_id>', methods=['GET'])
def get_question(question_id):
    question = get_question_by_id(question_id)
    if question:
        # Convert Question object to dictionary
        return jsonify(question.to_dict())
    return jsonify({"error": "Question not found"}), 404
PY_EOF

echo "✅ Fixed API routes for JSON serialization"
