import os
import json
from backend.data.models.question import Question

class QuestionRepository:
    @staticmethod
    def load_questions_data():
        """Load question data from JSON file."""
        try:
            questions_path = os.path.join('data', 'questions', 'questions.json')
            print(f"Loading questions from: {questions_path}")
            with open(questions_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading questions: {e}")
            return []

    @staticmethod
    def get_all_questions():
        """Get all questions from the data file."""
        questions_data = QuestionRepository.load_questions_data()
        return [Question.from_dict(q) for q in questions_data]

    @staticmethod
    def get_question_by_id(question_id):
        """Get a specific question by ID."""
        questions_data = QuestionRepository.load_questions_data()
        for question_data in questions_data:
            if question_data.get('id') == question_id:
                return Question.from_dict(question_data)
        return None

# Functions for API use
def get_all_questions():
    return QuestionRepository.get_all_questions()

def get_question_by_id(question_id):
    return QuestionRepository.get_question_by_id(question_id)
