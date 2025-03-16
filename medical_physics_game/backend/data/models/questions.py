"""
Question model for the Medical Physics Game.
Defines the data structure for questions and related functionality.
"""

class Question:
    """Represents a question in the game."""
    
    def __init__(self, id, text, options, correct_option, difficulty, category, explanation=None, image_url=None):
        """
        Initialize a new question.
        
        Args:
            id (str): Unique identifier for the question
            text (str): The question text
            options (list): List of possible answers
            correct_option (int): Index of the correct answer in options
            difficulty (str): Difficulty level (easy, medium, hard)
            category (str): Question category
            explanation (str, optional): Explanation of the correct answer
            image_url (str, optional): URL to an image related to the question
        """
        self.id = id
        self.text = text
        self.options = options
        self.correct_option = correct_option
        self.difficulty = difficulty
        self.category = category
        self.explanation = explanation
        self.image_url = image_url
        
    def check_answer(self, selected_option):
        """
        Check if the selected option is correct.
        
        Args:
            selected_option (int): Index of the selected option
            
        Returns:
            bool: True if the answer is correct, False otherwise
        """
        return selected_option == self.correct_option
        
    def get_difficulty_modifier(self):
        """
        Get a numerical modifier based on question difficulty.
        
        Returns:
            float: Difficulty modifier value
        """
        difficulty_map = {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.0
        }
        return difficulty_map.get(self.difficulty.lower(), 1.0)
        
    def to_dict(self, include_answer=False):
        """
        Convert question to dictionary for serialization.
        
        Args:
            include_answer (bool): Whether to include the correct answer
            
        Returns:
            dict: Dictionary representation of question
        """
        result = {
            'id': self.id,
            'text': self.text,
            'options': self.options,
            'difficulty': self.difficulty,
            'category': self.category
        }
        
        if self.explanation:
            result['explanation'] = self.explanation
            
        if self.image_url:
            result['image_url'] = self.image_url
            
        if include_answer:
            result['correct_option'] = self.correct_option
            
        return result
        
    @classmethod
    def from_dict(cls, data):
        """
        Create a Question instance from dictionary data.
        
        Args:
            data (dict): Dictionary containing question data
            
        Returns:
            Question: New Question instance
        """
        return cls(
            id=data.get('id'),
            text=data.get('text', ''),
            options=data.get('options', []),
            correct_option=data.get('correct_option', 0),
            difficulty=data.get('difficulty', 'medium'),
            category=data.get('category', 'general'),
            explanation=data.get('explanation'),
            image_url=data.get('image_url')
        )