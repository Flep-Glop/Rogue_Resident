#!/usr/bin/env python3
import os
import json

# First, let's create or fix the Question model
question_model_path = 'backend/data/models/question.py'
with open(question_model_path, 'w') as f:
    f.write("""# Question model

class Question:
    def __init__(self, id=None, text=None, options=None, correct_answer=None, difficulty=None, category=None, explanation=None):
        self.id = id
        self.text = text
        self.options = options or []
        self.correct_answer = correct_answer
        self.difficulty = difficulty
        self.category = category
        self.explanation = explanation
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'options': self.options,
            'correct_answer': self.correct_answer,
            'difficulty': self.difficulty,
            'category': self.category,
            'explanation': self.explanation
        }
    
    @classmethod
    def from_dict(cls, data):
        # Handle both string and dictionary input
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                # If it's not valid JSON, use it as the ID
                return cls(id=data)
        
        # Now data should be a dictionary
        return cls(
            id=data.get('id'),
            text=data.get('text'),
            options=data.get('options', []),
            correct_answer=data.get('correct_answer'),
            difficulty=data.get('difficulty'),
            category=data.get('category'),
            explanation=data.get('explanation')
        )
""")
print(f"✅ Created/Fixed {question_model_path}")

# Now, let's create or fix the Question repository
question_repo_path = 'backend/data/repositories/question_repo.py'
with open(question_repo_path, 'w') as f:
    f.write("""# Question repository
import os
import json
from backend.data.models.question import Question

class QuestionRepository:
    @staticmethod
    def get_questions_file_path():
        return os.path.join('data', 'questions', 'questions.json')
    
    @staticmethod
    def load_questions_data():
        try:
            with open(QuestionRepository.get_questions_file_path(), 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Return empty list if file doesn't exist or is invalid
            return []
    
    @staticmethod
    def get_all_questions():
        questions_data = QuestionRepository.load_questions_data()
        return [Question.from_dict(q) for q in questions_data]
    
    @staticmethod
    def get_question_by_id(question_id):
        questions_data = QuestionRepository.load_questions_data()
        for question_data in questions_data:
            if str(question_data.get('id')) == str(question_id):
                return Question.from_dict(question_data)
        return None
    
    @staticmethod
    def get_questions_by_category(category):
        questions_data = QuestionRepository.load_questions_data()
        category_questions = [q for q in questions_data if q.get('category') == category]
        return [Question.from_dict(q) for q in category_questions]

# For backwards compatibility
def get_all_questions():
    return QuestionRepository.get_all_questions()

def get_question_by_id(question_id):
    return QuestionRepository.get_question_by_id(question_id)

def get_questions_by_category(category):
    return QuestionRepository.get_questions_by_category(category)
""")
print(f"✅ Created/Fixed {question_repo_path}")

# Now, let's fix the Question API routes
question_routes_path = 'backend/api/question_routes.py'
with open(question_routes_path, 'w') as f:
    f.write("""from flask import jsonify, request
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
""")
print(f"✅ Created/Fixed {question_routes_path}")

# Let's create a sample questions data file if it doesn't exist
os.makedirs('data/questions', exist_ok=True)
questions_data_path = 'data/questions/questions.json'
if not os.path.exists(questions_data_path) or os.path.getsize(questions_data_path) == 0:
    with open(questions_data_path, 'w') as f:
        json.dump([
            {
                "id": 1,
                "text": "What is the unit of absorbed dose?",
                "options": ["Sievert", "Gray", "Becquerel", "Coulomb"],
                "correct_answer": 1,
                "difficulty": "easy",
                "category": "radiation",
                "explanation": "The Gray (Gy) is the SI unit of absorbed dose, which is the amount of energy deposited by ionizing radiation in a unit mass of matter."
            },
            {
                "id": 2,
                "text": "Which imaging modality uses a magnetic field and radio waves?",
                "options": ["CT", "MRI", "PET", "Ultrasound"],
                "correct_answer": 1,
                "difficulty": "medium",
                "category": "imaging",
                "explanation": "Magnetic Resonance Imaging (MRI) uses a strong magnetic field and radio frequency pulses to generate images."
            },
            {
                "id": 3,
                "text": "What is the half-life of F-18, commonly used in PET imaging?",
                "options": ["110 minutes", "6 hours", "12 hours", "24 hours"],
                "correct_answer": 0,
                "difficulty": "hard",
                "category": "nuclear",
                "explanation": "F-18 has a half-life of approximately 110 minutes, which makes it suitable for PET imaging as it allows enough time for synthesis, quality control, and imaging."
            }
        ], f, indent=2)
    print(f"✅ Created sample questions data in {questions_data_path}")
else:
    print(f"ℹ️ Questions data file already exists at {questions_data_path}")
