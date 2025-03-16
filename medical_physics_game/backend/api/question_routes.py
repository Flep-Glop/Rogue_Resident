from flask import jsonify, request
from . import api_bp
from backend.data.repositories.question_repo import get_all_questions, get_question_by_id, get_questions_by_category

@api_bp.route('/questions', methods=['GET'])
def get_questions():
    try:
        category = request.args.get('category')
        if category:
            questions = get_questions_by_category(category)
        else:
            questions = get_all_questions()
        
        # Convert objects to dictionaries for JSON serialization
        questions_dict = [q.to_dict() for q in questions]
        return jsonify(questions_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/questions/<question_id>', methods=['GET'])
def get_question(question_id):
    try:
        question = get_question_by_id(question_id)
        if question:
            return jsonify(question.to_dict())
        else:
            return jsonify({"error": "Question not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
