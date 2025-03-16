# backend/data/models/question.py
class Question:
    def __init__(self, id, text, options, correct_answer, difficulty=None, 
                 category=None, explanation=None, learning_objectives=None,
                 references=None, image_url=None, question_type="multiple_choice"):
        self.id = id
        self.text = text
        self.options = options
        self.correct_answer = correct_answer
        self.difficulty = difficulty
        self.category = category
        self.explanation = explanation
        self.learning_objectives = learning_objectives or []
        self.references = references or []
        self.image_url = image_url
        self.question_type = question_type
        
    def to_dict(self):
        """Convert question to dictionary"""
        return {
            'id': self.id,
            'text': self.text,
            'options': self.options,
            'correct_answer': self.correct_answer,
            'difficulty': self.difficulty,
            'category': self.category,
            'explanation': self.explanation,
            'learning_objectives': self.learning_objectives,
            'references': self.references,
            'image_url': self.image_url,
            'question_type': self.question_type
        }
        
    def check_answer(self, user_answer):
        """Check if an answer is correct"""
        if self.question_type == "multiple_choice":
            return user_answer == self.correct_answer
        elif self.question_type == "multiple_select":
            # For multiple select, correct_answer is a list of correct indices
            return sorted(user_answer) == sorted(self.correct_answer)
        elif self.question_type == "free_text":
            # For free text, do a simple string comparison (could be enhanced)
            return user_answer.lower().strip() == self.correct_answer.lower().strip()
        else:
            return False
            
    @classmethod
    def from_dict(cls, data):
        """Create question from dictionary"""
        return cls(
            id=data.get('id'),
            text=data.get('text'),
            options=data.get('options', []),
            correct_answer=data.get('correct_answer'),
            difficulty=data.get('difficulty'),
            category=data.get('category'),
            explanation=data.get('explanation'),
            learning_objectives=data.get('learning_objectives', []),
            references=data.get('references', []),
            image_url=data.get('image_url'),
            question_type=data.get('question_type', 'multiple_choice')
        )