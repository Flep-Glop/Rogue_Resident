# backend/data/repositories/optimized_repo.py
from ..models.character import Character
from ..models.item import Item
from ..models.question import Question
from backend.utils.cache import cached
import json
import os

class OptimizedRepository:
    """Base class for optimized repositories with efficient loading strategies"""
    
    # Class variables for model cache
    _model_cache = {}
    _dirty = False
    
    @classmethod
    def _get_data_path(cls):
        """Get the path to the data file - must be implemented by subclasses"""
        raise NotImplementedError
        
    @classmethod
    def _get_model_class(cls):
        """Get the model class - must be implemented by subclasses"""
        raise NotImplementedError
        
    @classmethod
    def _get_cache_key(cls):
        """Get the cache key for this model type"""
        return cls.__name__
        
    @classmethod
    @cached(ttl=60)  # Cache for 60 seconds
    def _load_all_items(cls):
        """Load all items from the data file with caching"""
        try:
            data_path = cls._get_data_path()
            with open(data_path, 'r') as f:
                items_data = json.load(f)
                model_class = cls._get_model_class()
                return [model_class.from_dict(item) for item in items_data]
        except FileNotFoundError:
            return []
            
    @classmethod
    def _save_items(cls, items):
        """Save items to the data file"""
        try:
            data_path = cls._get_data_path()
            os.makedirs(os.path.dirname(data_path), exist_ok=True)
            
            with open(data_path, 'w') as f:
                items_data = [item.to_dict() for item in items]
                json.dump(items_data, f, indent=2)
                
            # Mark cache as clean
            cls._dirty = False
            
            # Update the cache
            cache_key = cls._get_cache_key()
            cls._model_cache[cache_key] = items
            
            return True
        except Exception as e:
            print(f"Error saving {cls.__name__}: {e}")
            return False
            
    @classmethod
    def _get_by_field(cls, field, value, all_items=None):
        """Generic method to get an item by a field value"""
        all_items = all_items or cls._load_all_items()
        for item in all_items:
            if getattr(item, field, None) == value:
                return item
        return None
        
    @classmethod
    def _bulk_get_by_field(cls, field, values, all_items=None):
        """Generic method to get multiple items by field values"""
        all_items = all_items or cls._load_all_items()
        return [item for item in all_items if getattr(item, field, None) in values]
        
    @classmethod
    def _filter_by_fields(cls, filters, all_items=None):
        """Generic method to filter items by multiple fields"""
        all_items = all_items or cls._load_all_items()
        result = all_items
        
        for field, value in filters.items():
            if isinstance(value, list):
                result = [item for item in result if getattr(item, field, None) in value]
            else:
                result = [item for item in result if getattr(item, field, None) == value]
                
        return result


# Example implementation for Characters
class OptimizedCharacterRepository(OptimizedRepository):
    @classmethod
    def _get_data_path(cls):
        return os.path.join(os.path.dirname(__file__), '../../../data/characters/characters.json')
        
    @classmethod
    def _get_model_class(cls):
        return Character
        
    @classmethod
    def get_all_characters(cls):
        return cls._load_all_items()
        
    @classmethod
    def get_character_by_id(cls, character_id):
        return cls._get_by_field('id', character_id)
        
    @classmethod
    def update_character(cls, character):
        all_characters = cls._load_all_items()
        
        for i, c in enumerate(all_characters):
            if c.id == character.id:
                all_characters[i] = character
                return cls._save_items(all_characters)
                
        return False


# Example implementation for Questions
class OptimizedQuestionRepository(OptimizedRepository):
    @classmethod
    def _get_data_path(cls):
        return os.path.join(os.path.dirname(__file__), '../../../data/questions/questions.json')
        
    @classmethod
    def _get_model_class(cls):
        return Question
        
    @classmethod
    def get_all_questions(cls):
        return cls._load_all_items()
        
    @classmethod
    def get_question_by_id(cls, question_id):
        return cls._get_by_field('id', question_id)
        
    @classmethod
    def get_questions_by_category(cls, category):
        return cls._filter_by_fields({'category': category})
        
    @classmethod
    def get_questions_by_difficulty(cls, difficulty):
        return cls._filter_by_fields({'difficulty': difficulty})