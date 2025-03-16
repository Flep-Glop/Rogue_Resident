"""
Character repository for the Medical Physics Game.
Handles character data access and persistence.
"""

import json
import os
from backend.data.models.character import Character
from backend.utils.db_utils import get_data_path

class CharacterRepository:
    """Repository for character data management."""
    
    def __init__(self, data_path=None):
        """
        Initialize character repository.
        
        Args:
            data_path (str, optional): Path to character data file
        """
        self.data_path = data_path or os.path.join(get_data_path(), 'characters', 'characters.json')
        
    def get_all(self):
        """
        Get all available characters.
        
        Returns:
            list: List of Character objects
        """
        try:
            with open(self.data_path, 'r') as f:
                characters_data = json.load(f)
                return [Character.from_dict(char_data) for char_data in characters_data]
        except (FileNotFoundError, json.JSONDecodeError):
            return []
            
    def get_by_id(self, character_id):
        """
        Get a character by ID.
        
        Args:
            character_id (str): Character ID to find
            
        Returns:
            Character: Character object if found, None otherwise
        """
        characters = self.get_all()
        for character in characters:
            if character.id == character_id:
                return character
        return None
        
    def save(self, character):
        """
        Save a character to the data store.
        
        Args:
            character (Character): Character object to save
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        characters = self.get_all()
        
        # Update existing or add new
        updated = False
        for i, existing_char in enumerate(characters):
            if existing_char.id == character.id:
                characters[i] = character
                updated = True
                break
                
        if not updated:
            characters.append(character)
            
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
            
            # Write updated data
            with open(self.data_path, 'w') as f:
                json.dump([char.to_dict() for char in characters], f, indent=2)
            return True
        except (IOError, TypeError):
            return False
            
    def delete(self, character_id):
        """
        Delete a character by ID.
        
        Args:
            character_id (str): ID of character to delete
            
        Returns:
            bool: True if deletion was successful, False otherwise
        """
        characters = self.get_all()
        initial_count = len(characters)
        
        characters = [c for c in characters if c.id != character_id]
        
        if len(characters) == initial_count:
            return False  # No character was deleted
            
        try:
            with open(self.data_path, 'w') as f:
                json.dump([char.to_dict() for char in characters], f, indent=2)
            return True
        except (IOError, TypeError):
            return False