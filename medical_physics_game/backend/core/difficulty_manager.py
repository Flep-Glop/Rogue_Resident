"""
Difficulty Manager for Medical Physics Game

Implements the difficulty management system as described in Developer Guide 3.
This manages:
- Question difficulty weights
- Health and enemy scaling
- Reward adjustments
- Progressive difficulty increases
"""

import random
from backend.utils.logging import GameLogger

logger = GameLogger()

class DifficultyManager:
    """
    Manages game difficulty settings and scaling
    """
    
    # Difficulty settings as defined in Developer Guide 3
    DIFFICULTY_SETTINGS = {
        'easy': {
            'question_difficulty_weights': {'beginner': 0.7, 'intermediate': 0.3, 'advanced': 0.0},
            'health_modifier': 1.2,
            'enemy_strength': 0.8,
            'reward_modifier': 0.9
        },
        'normal': {
            'question_difficulty_weights': {'beginner': 0.4, 'intermediate': 0.5, 'advanced': 0.1},
            'health_modifier': 1.0,
            'enemy_strength': 1.0,
            'reward_modifier': 1.0
        },
        'hard': {
            'question_difficulty_weights': {'beginner': 0.1, 'intermediate': 0.5, 'advanced': 0.4},
            'health_modifier': 0.8,
            'enemy_strength': 1.2,
            'reward_modifier': 1.1
        }
    }
    
    def __init__(self, difficulty='normal', floor_number=1, adaptive=True):
        """
        Initialize the difficulty manager
        
        Args:
            difficulty (str): Initial difficulty setting ('easy', 'normal', or 'hard')
            floor_number (int): Current floor number for progressive scaling
            adaptive (bool): Whether to use adaptive difficulty (adjusts based on player performance)
        """
        self.set_difficulty(difficulty)
        self.floor_number = floor_number
        self.adaptive = adaptive
        self.performance_history = []  # Tracks player performance for adaptive difficulty
        self.logger = logger
    
    def set_difficulty(self, difficulty):
        """
        Set the game difficulty
        
        Args:
            difficulty (str): Difficulty setting ('easy', 'normal', or 'hard')
        """
        if difficulty not in self.DIFFICULTY_SETTINGS:
            self.logger.warning(f"Invalid difficulty '{difficulty}', defaulting to 'normal'")
            difficulty = 'normal'
        
        self.current_difficulty = difficulty
        self.settings = self.DIFFICULTY_SETTINGS[difficulty].copy()
        self.logger.info(f"Difficulty set to {difficulty}")
    
    def get_question_difficulty(self):
        """
        Return a weighted random question difficulty based on current settings
        
        Returns:
            str: Selected difficulty level ('beginner', 'intermediate', or 'advanced')
        """
        weights = self.settings['question_difficulty_weights']
        difficulties = list(weights.keys())
        probabilities = list(weights.values())
        
        return random.choices(difficulties, probabilities)[0]
    
    def get_question_filter(self):
        """
        Get a filter dictionary for question selection based on current difficulty
        
        Returns:
            dict: Filter parameters for question selection
        """
        # Get base weights from settings
        weights = self.settings['question_difficulty_weights'].copy()
        
        # Apply floor progression effect (higher floors have harder questions)
        if self.floor_number > 1:
            # Gradually shift weights toward more difficult questions
            floor_factor = min(0.1 * (self.floor_number - 1), 0.5)  # Cap at 0.5 shift
            
            # Reduce beginner weight
            if 'beginner' in weights:
                weights['beginner'] = max(0.0, weights['beginner'] - floor_factor)
            
            # Increase advanced weight
            if 'advanced' in weights:
                weights['advanced'] = min(1.0, weights['advanced'] + floor_factor)
            
            # Adjust intermediate to keep total at 1.0
            if 'intermediate' in weights:
                weights['intermediate'] = 1.0 - weights.get('beginner', 0.0) - weights.get('advanced', 0.0)
        
        # Apply adaptive adjustments if enabled
        if self.adaptive and self.performance_history:
            # Calculate recent performance (percentage of correct answers)
            correct_count = sum(1 for result in self.performance_history[-10:] if result)
            recent_performance = correct_count / len(self.performance_history[-10:])
            
            # Adjust difficulty based on performance
            if recent_performance > 0.8:  # Player doing very well
                # Make questions harder
                adjustment = 0.1
                weights['beginner'] = max(0.0, weights.get('beginner', 0.0) - adjustment)
                weights['advanced'] = min(1.0, weights.get('advanced', 0.0) + adjustment)
                weights['intermediate'] = 1.0 - weights.get('beginner', 0.0) - weights.get('advanced', 0.0)
            elif recent_performance < 0.4:  # Player struggling
                # Make questions easier
                adjustment = 0.1
                weights['beginner'] = min(1.0, weights.get('beginner', 0.0) + adjustment)
                weights['advanced'] = max(0.0, weights.get('advanced', 0.0) - adjustment)
                weights['intermediate'] = 1.0 - weights.get('beginner', 0.0) - weights.get('advanced', 0.0)
        
        # Convert weights to a filter format
        difficulty_filter = {
            'weights': weights
        }
        
        return difficulty_filter
    
    def record_question_result(self, correct):
        """
        Record the result of a question for adaptive difficulty adjustment
        
        Args:
            correct (bool): Whether the player answered correctly
        """
        self.performance_history.append(correct)
        
        # Keep history at a reasonable size
        if len(self.performance_history) > 50:
            self.performance_history = self.performance_history[-50:]
    
    def modify_health(self, base_health):
        """
        Modify health based on difficulty settings
        
        Args:
            base_health (int): Base health value
            
        Returns:
            int: Modified health value
        """
        # Apply difficulty modifier
        modified = base_health * self.settings['health_modifier']
        
        # Apply floor scaling for player health (slight increase per floor)
        if self.floor_number > 1:
            floor_bonus = 0.05 * (self.floor_number - 1)  # 5% per floor
            modified *= (1 + floor_bonus)
        
        return round(modified)
    
    def modify_enemy_strength(self, base_strength):
        """
        Modify enemy strength based on difficulty settings
        
        Args:
            base_strength (int): Base enemy strength value
            
        Returns:
            int: Modified enemy strength value
        """
        # Apply difficulty modifier
        modified = base_strength * self.settings['enemy_strength']
        
        # Apply floor scaling (enemies get stronger on higher floors)
        if self.floor_number > 1:
            floor_bonus = 0.1 * (self.floor_number - 1)  # 10% per floor
            modified *= (1 + floor_bonus)
        
        return round(modified)
    
    def modify_reward(self, base_reward):
        """
        Modify rewards based on difficulty settings
        
        Args:
            base_reward (int): Base reward value
            
        Returns:
            int: Modified reward value
        """
        # Apply difficulty modifier
        modified = base_reward * self.settings['reward_modifier']
        
        # Apply floor scaling (rewards increase on higher floors)
        if self.floor_number > 1:
            floor_bonus = 0.08 * (self.floor_number - 1)  # 8% per floor
            modified *= (1 + floor_bonus)
        
        return round(modified)
    
    def adjust_difficulty_from_performance(self):
        """
        Automatically adjust difficulty based on player performance
        
        Returns:
            str: New difficulty level if changed, None otherwise
        """
        if not self.adaptive or len(self.performance_history) < 5:
            return None
        
        # Calculate recent performance
        correct_count = sum(1 for result in self.performance_history[-10:] if result)
        recent_performance = correct_count / len(self.performance_history[-10:])
        
        # Adjust difficulty based on sustained performance
        new_difficulty = None
        
        if self.current_difficulty == 'easy' and recent_performance > 0.8:
            new_difficulty = 'normal'
        elif self.current_difficulty == 'normal':
            if recent_performance > 0.8:
                new_difficulty = 'hard'
            elif recent_performance < 0.4:
                new_difficulty = 'easy'
        elif self.current_difficulty == 'hard' and recent_performance < 0.4:
            new_difficulty = 'normal'
        
        # Apply the new difficulty if needed
        if new_difficulty and new_difficulty != self.current_difficulty:
            self.set_difficulty(new_difficulty)
            return new_difficulty
        
        return None
    
    def next_floor(self):
        """
        Update settings for the next floor
        
        Returns:
            int: New floor number
        """
        self.floor_number += 1
        
        # Adjust difficulty based on performance before changing floor
        self.adjust_difficulty_from_performance()
        
        self.logger.info(f"Advanced to floor {self.floor_number}")
        return self.floor_number
    
    def get_boss_settings(self):
        """
        Get settings for a boss encounter
        
        Returns:
            dict: Boss difficulty settings
        """
        # Bosses are tougher than regular encounters
        boss_settings = {
            'health_modifier': self.settings['health_modifier'] * 2.0,
            'strength_modifier': self.settings['enemy_strength'] * 1.5,
            'floor_scaling': 0.15 * (self.floor_number - 1)  # 15% per floor
        }
        
        return boss_settings
    
    def get_elite_settings(self):
        """
        Get settings for an elite encounter
        
        Returns:
            dict: Elite difficulty settings
        """
        # Elites are tougher than regular encounters but not as tough as bosses
        elite_settings = {
            'health_modifier': self.settings['health_modifier'] * 1.5,
            'strength_modifier': self.settings['enemy_strength'] * 1.2,
            'floor_scaling': 0.12 * (self.floor_number - 1)  # 12% per floor
        }
        
        return elite_settings
    
    def get_difficulty_info(self):
        """
        Get comprehensive information about current difficulty settings
        
        Returns:
            dict: Current difficulty information and settings
        """
        return {
            'level': self.current_difficulty,
            'floor': self.floor_number,
            'adaptive': self.adaptive,
            'settings': self.settings,
            'performance': {
                'recent': sum(1 for result in self.performance_history[-10:] if result) / max(1, len(self.performance_history[-10:])) if self.performance_history else 0,
                'overall': sum(1 for result in self.performance_history if result) / max(1, len(self.performance_history)) if self.performance_history else 0,
                'sample_size': len(self.performance_history)
            }
        }