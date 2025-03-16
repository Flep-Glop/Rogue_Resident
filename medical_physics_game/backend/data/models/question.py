class Question:
    def __init__(self, id, text, answers, correct_answer):
        self.id = id
        self.text = text
        self.answers = answers
        self.correct_answer = correct_answer
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data.get('id'),
            text=data.get('text'),
            answers=data.get('answers', []),
            correct_answer=data.get('correct_answer')
        )
