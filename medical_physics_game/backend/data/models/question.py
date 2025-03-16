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
