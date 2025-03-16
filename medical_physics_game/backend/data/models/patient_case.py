# backend/data/models/patient_case.py
class PatientCase:
    def __init__(self, id, title, description, history, vitals=None,
                 imaging=None, labs=None, diagnosis=None, treatment=None,
                 follow_up=None, questions=None, difficulty=None, category=None):
        self.id = id
        self.title = title
        self.description = description
        self.history = history
        self.vitals = vitals or {}
        self.imaging = imaging or []
        self.labs = labs or {}
        self.diagnosis = diagnosis
        self.treatment = treatment
        self.follow_up = follow_up
        self.questions = questions or []
        self.difficulty = difficulty
        self.category = category
        
    def to_dict(self):
        """Convert patient case to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'history': self.history,
            'vitals': self.vitals,
            'imaging': self.imaging,
            'labs': self.labs,
            'diagnosis': self.diagnosis,
            'treatment': self.treatment,
            'follow_up': self.follow_up,
            'questions': self.questions,
            'difficulty': self.difficulty,
            'category': self.category
        }
        
    @classmethod
    def from_dict(cls, data):
        """Create patient case from dictionary"""
        return cls(
            id=data.get('id'),
            title=data.get('title'),
            description=data.get('description'),
            history=data.get('history'),
            vitals=data.get('vitals', {}),
            imaging=data.get('imaging', []),
            labs=data.get('labs', {}),
            diagnosis=data.get('diagnosis'),
            treatment=data.get('treatment'),
            follow_up=data.get('follow_up'),
            questions=data.get('questions', []),
            difficulty=data.get('difficulty'),
            category=data.get('category')
        )