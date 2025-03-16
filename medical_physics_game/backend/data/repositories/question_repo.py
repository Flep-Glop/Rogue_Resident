# Question repository
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
