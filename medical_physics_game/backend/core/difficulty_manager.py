class DifficultyManager:
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
    
    def __init__(self, difficulty='normal'):
        self.set_difficulty(difficulty)
        
    def set_difficulty(self, difficulty):
        if difficulty not in self.DIFFICULTY_SETTINGS:
            difficulty = 'normal'
        self.current_difficulty = difficulty
        self.settings = self.DIFFICULTY_SETTINGS[difficulty]
        
    def get_question_difficulty(self):
        """Return a weighted random question difficulty based on current settings"""
        import random
        weights = self.settings['question_difficulty_weights']
        difficulties = list(weights.keys())
        probabilities = list(weights.values())
        return random.choices(difficulties, probabilities)[0]
        
    def modify_health(self, base_health):
        return base_health * self.settings['health_modifier']
        
    def modify_enemy_strength(self, base_strength):
        return base_strength * self.settings['enemy_strength']
        
    def modify_reward(self, base_reward):
        return base_reward * self.settings['reward_modifier']
