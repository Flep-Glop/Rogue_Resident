"""
Question repository for the Medical Physics Game.
Handles question data access and persistence.
"""

import json
import os
import random
from backend.data.models.question import Question
from backend.utils.db_utils import get_data_path

class QuestionRepository:
    """Repository for question data management."""
    
    def __init__(self, data_path=None):
        """
        Initialize question repository.
        
        Args:
            data_path (str, optional): Path to question data file
        """
        self.data_path = data_path or os.path.join(get_data_path(), 'questions', 'questions.json')
        
    def get_all(self):
        """
        Get all available questions.
        
        Returns:
            list: List of Question objects
        """
        try:
            with open(self.data_path, 'r') as f:
                questions_data = json.load(f)
                return [Question.from_dict(q_data) for q_data in questions_data]
        except (FileNotFoundError, json.JSONDecodeError):
            return []
            
    def get_by_id(self, question_id):
        """
        Get a question by ID.
        
        Args:
            question_id (str): Question ID to find
            
        Returns:
            Question: Question object if found, None otherwise
        """
        questions = self.get_all()
        for question in questions:
            if question.id == question_id:
                return question
        return None
        
    def get_by_category(self, category):
        """
        Get questions by category.
        
        Args:
            category (str): Category to filter by
            
        Returns:
            list: List of Question objects in the specified category
        """
        questions = self.get_all()
        return [q for q in questions if q.category.lower() == category.lower()]
        
    def get_by_difficulty(self, difficulty):
        """
        Get questions by difficulty level.
        
        Args:
            difficulty (str): Difficulty level to filter by
            
        Returns:
            list: List of Question objects with the specified difficulty
        """
        questions = self.get_all()
        return [q for q in questions if q.difficulty.lower() == difficulty.lower()]
        
    def get_random(self, category=None, difficulty=None):
        """
        Get a random question, optionally filtered by category and/or difficulty.
        
        Args:
            category (str, optional): Category to filter by
            difficulty (str, optional): Difficulty level to filter by
            
        Returns:
            Question: Random Question object, or None if no matching questions
        """
        questions = self.get_all()
        
        if category:
            questions = [q for q in questions if q.category.lower() == category.lower()]
            
        if difficulty:
            questions = [q for q in questions if q.difficulty.lower() == difficulty.lower()]
            
        if not questions:
            return None
            
        return random.choice(questions)
        
    def save(self, question):
        """
        Save a question to the data store.
        
        Args:
            question (Question): Question object to save
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        questions = self.get_all()
        
        # Update existing or add new
        updated = False
        for i, existing_q in enumerate(questions):
            if existing_q.id == question.id:
                questions[i] = question
                updated = True
                break
                
        if not updated:
            questions.append(question)
            
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
            
            # Write updated data
            with open(self.data_path, 'w') as f:
                json.dump([q.to_dict(include_answer=True) for q in questions], f, indent=2)
            return True
        except (IOError, TypeError):
            return False
            
    def delete(self, question_id):
        """
        Delete a question by ID.
        
        Args:
            question_id (str): ID of question to delete
            
        Returns:
            bool: True if deletion was successful, False otherwise
        """
        questions = self.get_all()
        initial_count = len(questions)
        
        questions = [q for q in questions if q.id != question_id]
        
        if len(questions) == initial_count:
            return False  # No question was deleted
            
        try:
            with open(self.data_path, 'w') as f:
                json.dump([q.to_dict(include_answer=True) for q in questions], f, indent=2)
            return True
        except (IOError, TypeError):
            return False