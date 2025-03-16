#!/bin/bash
echo "Fixing Question repository..."

# Update question_repo.py to handle string data
cat > backend/data/repositories/question_repo.py << 'PY_EOF'
import os
import json
from backend.data.models.question import Question

class QuestionRepository:
    @staticmethod
    def get_all_questions():
        """Get all questions from the data file."""
        try:
            # Get file path
            questions_path = os.path.join('data', 'questions', 'questions.json')
            
            # Read questions data
            with open(questions_path, 'r') as f:
                questions_data = json.load(f)
            
            # Convert to objects
            return [Question.from_dict(q) for q in questions_data]
        except Exception as e:
            print(f"Error loading questions: {e}")
            return []

    @staticmethod
    def get_question_by_id(question_id):
        """Get a specific question by ID."""
        questions = QuestionRepository.get_all_questions()
        for question in questions:
            if question.id == question_id:
                return question
        return None

# Functions for API use
def get_all_questions():
    return QuestionRepository.get_all_questions()

def get_question_by_id(question_id):
    return QuestionRepository.get_question_by_id(question_id)
PY_EOF

# Update question.py to handle different data formats
cat > backend/data/models/question.py << 'PY_EOF'
import json

class Question:
    def __init__(self, id, text, answers, correct_answer):
        self.id = id
        self.text = text
        self.answers = answers
        self.correct_answer = correct_answer
    
    @classmethod
    def from_dict(cls, data):
        # Handle string data (convert to dict if needed)
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                # If it's just a string ID, create minimal question
                return cls(
                    id=data,
                    text="Question not found",
                    answers=["Answer not available"],
                    correct_answer=0
                )
        
        # Now handle as dictionary
        return cls(
            id=data.get('id'),
            text=data.get('text', ""),
            answers=data.get('answers', []),
            correct_answer=data.get('correct_answer', 0)
        )
        
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'answers': self.answers,
            'correct_answer': self.correct_answer
        }
PY_EOF

echo "✅ Fixed Question repository and model"
