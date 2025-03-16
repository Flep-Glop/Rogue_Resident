import unittest
from unittest.mock import patch, MagicMock
from backend.core.difficulty_manager import DifficultyManager

class TestDifficultyManager(unittest.TestCase):
    def setUp(self):
        self.difficulty_manager = DifficultyManager()
        
    def test_initialization_with_default_difficulty(self):
        """Test that DifficultyManager initializes with 'normal' as default"""
        self.assertEqual(self.difficulty_manager.current_difficulty, 'normal')
        self.assertEqual(self.difficulty_manager.settings, 
                         DifficultyManager.DIFFICULTY_SETTINGS['normal'])
        
    def test_set_difficulty_valid(self):
        """Test setting a valid difficulty level"""
        self.difficulty_manager.set_difficulty('hard')
        self.assertEqual(self.difficulty_manager.current_difficulty, 'hard')
        self.assertEqual(self.difficulty_manager.settings, 
                         DifficultyManager.DIFFICULTY_SETTINGS['hard'])
        
    def test_set_difficulty_invalid(self):
        """Test setting an invalid difficulty level defaults to 'normal'"""
        self.difficulty_manager.set_difficulty('impossible')
        self.assertEqual(self.difficulty_manager.current_difficulty, 'normal')
        self.assertEqual(self.difficulty_manager.settings, 
                         DifficultyManager.DIFFICULTY_SETTINGS['normal'])
        
    def test_modify_health(self):
        """Test health modification based on difficulty"""
        base_health = 100
        
        # Test normal difficulty (1.0 multiplier)
        self.difficulty_manager.set_difficulty('normal')
        self.assertEqual(self.difficulty_manager.modify_health(base_health), 100)
        
        # Test easy difficulty (1.2 multiplier)
        self.difficulty_manager.set_difficulty('easy')
        self.assertEqual(self.difficulty_manager.modify_health(base_health), 120)
        
        # Test hard difficulty (0.8 multiplier)
        self.difficulty_manager.set_difficulty('hard')
        self.assertEqual(self.difficulty_manager.modify_health(base_health), 80)

if __name__ == '__main__':
    unittest.main()
