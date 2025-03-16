"""
Achievement System for Medical Physics Game

Implements the achievement system as described in Developer Guide 3.
This system:
- Tracks player accomplishments
- Provides rewards for achievements
- Handles achievement notifications
"""

from datetime import datetime
from backend.utils.logging import GameLogger

logger = GameLogger()

class AchievementSystem:
    """
    System for tracking and unlocking player achievements
    """
    
    def __init__(self, user_id):
        """
        Initialize the achievement system for a specific user
        
        Args:
            user_id (str): The ID of the user
        """
        self.user_id = user_id
        self.achievements = self._load_achievements()
        self.user_achievements = self._load_user_achievements()
        self.achievement_progress = self._load_achievement_progress()
        self.logger = logger
    
    def _load_achievements(self):
        """
        Load achievement definitions from repository
        
        Returns:
            list: All available achievements
        """
        try:
            from backend.data.repositories.achievement_repo import AchievementRepository
            return AchievementRepository.get_all_achievements()
        except Exception as e:
            self.logger.error(f"Error loading achievements: {str(e)}")
            
            # Return hardcoded defaults if repository unavailable
            return [
                {
                    'id': 'perfect_floor',
                    'name': 'Perfect Knowledge',
                    'description': 'Complete a floor with 100% correct answers',
                    'icon': 'trophy',
                    'hidden': False,
                    'points': 10
                },
                {
                    'id': 'skill_master',
                    'name': 'Skill Master',
                    'description': 'Unlock 20 skill nodes',
                    'icon': 'skill',
                    'hidden': False,
                    'points': 15,
                    'progress_max': 20
                },
                {
                    'id': 'save_lives',
                    'name': 'Lifesaver',
                    'description': 'Successfully treat 50 patients',
                    'icon': 'heart',
                    'hidden': False,
                    'points': 25,
                    'progress_max': 50
                },
                {
                    'id': 'knowledge_seeker',
                    'name': 'Knowledge Seeker',
                    'description': 'Answer 100 questions correctly',
                    'icon': 'book',
                    'hidden': False,
                    'points': 20,
                    'progress_max': 100
                },
                {
                    'id': 'elite_defeater',
                    'name': 'Elite Specialist',
                    'description': 'Defeat 10 elite challenges',
                    'icon': 'medal',
                    'hidden': False,
                    'points': 15,
                    'progress_max': 10
                },
                {
                    'id': 'hidden_achievement',
                    'name': 'The Scientific Method',
                    'description': 'Discover a hidden achievement',
                    'icon': 'lightbulb',
                    'hidden': True,
                    'points': 5
                },
                {
                    'id': 'perfect_boss',
                    'name': 'Flawless Victory',
                    'description': 'Defeat a boss without making any mistakes',
                    'icon': 'star',
                    'hidden': True,
                    'points': 30
                }
            ]
    
    def _load_user_achievements(self):
        """
        Load user's unlocked achievements
        
        Returns:
            list: User's unlocked achievement IDs
        """
        try:
            from backend.data.repositories.user_repo import UserRepository
            user = UserRepository.get_user_by_id(self.user_id)
            return user.achievements if hasattr(user, 'achievements') else []
        except Exception as e:
            self.logger.error(f"Error loading user achievements: {str(e)}")
            return []
    
    def _load_achievement_progress(self):
        """
        Load user's progress toward achievements
        
        Returns:
            dict: Achievement progress by achievement ID
        """
        try:
            from backend.data.repositories.user_repo import UserRepository
            user = UserRepository.get_user_by_id(self.user_id)
            return user.achievement_progress if hasattr(user, 'achievement_progress') else {}
        except Exception as e:
            self.logger.error(f"Error loading achievement progress: {str(e)}")
            return {}
    
    def _save_user_achievements(self):
        """
        Save user's achievements back to the repository
        """
        try:
            from backend.data.repositories.user_repo import UserRepository
            UserRepository.update_user_achievements(self.user_id, self.user_achievements)
        except Exception as e:
            self.logger.error(f"Error saving user achievements: {str(e)}")
    
    def _save_achievement_progress(self):
        """
        Save user's achievement progress back to the repository
        """
        try:
            from backend.data.repositories.user_repo import UserRepository
            UserRepository.update_achievement_progress(self.user_id, self.achievement_progress)
        except Exception as e:
            self.logger.error(f"Error saving achievement progress: {str(e)}")
    
    def get_all_achievements(self, include_hidden=False):
        """
        Get all achievements, optionally including hidden ones
        
        Args:
            include_hidden (bool): Whether to include hidden achievements
            
        Returns:
            list: Achievement definitions with unlock status
        """
        result = []
        
        for achievement in self.achievements:
            # Skip hidden achievements if not requested
            if achievement.get('hidden', False) and not include_hidden:
                continue
            
            # Add unlock status and progress information
            achievement_with_status = achievement.copy()
            achievement_id = achievement['id']
            
            achievement_with_status['unlocked'] = achievement_id in self.user_achievements
            
            # Add progress if applicable
            if 'progress_max' in achievement and achievement_id in self.achievement_progress:
                achievement_with_status['progress'] = self.achievement_progress[achievement_id]
                achievement_with_status['progress_percentage'] = min(100, int(self.achievement_progress[achievement_id] / achievement['progress_max'] * 100))
            
            result.append(achievement_with_status)
        
        return result
    
    def get_achievement(self, achievement_id):
        """
        Get a specific achievement with unlock status
        
        Args:
            achievement_id (str): The ID of the achievement
            
        Returns:
            dict: Achievement definition with unlock status, or None if not found
        """
        achievement = next((a for a in self.achievements if a['id'] == achievement_id), None)
        
        if not achievement:
            return None
        
        # Add unlock status and progress information
        achievement_with_status = achievement.copy()
        achievement_with_status['unlocked'] = achievement_id in self.user_achievements
        
        # Add progress if applicable
        if 'progress_max' in achievement and achievement_id in self.achievement_progress:
            achievement_with_status['progress'] = self.achievement_progress[achievement_id]
            achievement_with_status['progress_percentage'] = min(100, int(self.achievement_progress[achievement_id] / achievement['progress_max'] * 100))
        
        return achievement_with_status
    
    def unlock_achievement(self, achievement_id):
        """
        Unlock an achievement for the user
        
        Args:
            achievement_id (str): The ID of the achievement to unlock
            
        Returns:
            dict: The unlocked achievement with metadata, or False if already unlocked or not found
        """
        # Check if already unlocked
        if achievement_id in self.user_achievements:
            return False
        
        # Find the achievement
        achievement = next((a for a in self.achievements if a['id'] == achievement_id), None)
        if not achievement:
            self.logger.warning(f"Attempted to unlock non-existent achievement: {achievement_id}")
            return False
        
        # Add to unlocked achievements
        self.user_achievements.append(achievement_id)
        
        # Save to repository
        self._save_user_achievements()
        
        # Record unlock time
        unlock_time = datetime.now().isoformat()
        
        # Log the achievement
        self.logger.info(f"User {self.user_id} unlocked achievement: {achievement['name']}")
        
        # Return achievement with unlock metadata
        return {
            'achievement': achievement,
            'is_new': True,
            'unlocked_at': unlock_time
        }
    
    def update_progress(self, achievement_id, value=1, set_value=False):
        """
        Update progress toward an achievement
        
        Args:
            achievement_id (str): The ID of the achievement
            value (int): Value to add (or set if set_value is True)
            set_value (bool): Whether to set the progress to the given value instead of adding
            
        Returns:
            dict: Updated progress information, or None if achievement not found
        """
        # Find the achievement
        achievement = next((a for a in self.achievements if a['id'] == achievement_id), None)
        if not achievement:
            return None
        
        # Skip if already unlocked
        if achievement_id in self.user_achievements:
            return None
        
        # Update progress
        if achievement_id not in self.achievement_progress:
            self.achievement_progress[achievement_id] = 0
        
        if set_value:
            self.achievement_progress[achievement_id] = value
        else:
            self.achievement_progress[achievement_id] += value
        
        # Save progress
        self._save_achievement_progress()
        
        # Check if achievement should be unlocked
        result = {
            'achievement_id': achievement_id,
            'progress': self.achievement_progress[achievement_id],
            'achievement_unlocked': False
        }
        
        # If there's a progress_max and we've reached it, unlock the achievement
        if 'progress_max' in achievement and self.achievement_progress[achievement_id] >= achievement['progress_max']:
            unlock_result = self.unlock_achievement(achievement_id)
            if unlock_result:
                result['achievement_unlocked'] = True
                result['achievement_data'] = unlock_result
        
        return result
    
    def check_achievement_progress(self, event_type, event_data):
        """
        Check if an event triggers any achievement progress or unlocks
        
        Args:
            event_type (str): The type of event
            event_data (dict): Data associated with the event
            
        Returns:
            list: Results of achievement checks (progress updates and unlocks)
        """
        results = []
        
        # Check for various event types
        if event_type == 'floor_completed':
            # Check for perfect floor
            correct_answers = event_data.get('correct_answers', 0)
            total_questions = event_data.get('total_questions', 0)
            
            if total_questions > 0 and correct_answers == total_questions:
                result = self.unlock_achievement('perfect_floor')
                if result:
                    results.append(result)
        
        elif event_type == 'question_answered':
            # Update knowledge_seeker progress if answer was correct
            if event_data.get('correct', False):
                result = self.update_progress('knowledge_seeker')
                if result:
                    results.append(result)
        
        elif event_type == 'patient_treated':
            # Update lifesaver progress
            if event_data.get('success', False):
                result = self.update_progress('save_lives')
                if result:
                    results.append(result)
        
        elif event_type == 'skill_unlocked':
            # Update skill_master progress
            result = self.update_progress('skill_master')
            if result:
                results.append(result)
        
        elif event_type == 'elite_defeated':
            # Update elite_defeater progress
            result = self.update_progress('elite_defeater')
            if result:
                results.append(result)
        
        elif event_type == 'boss_defeated':
            # Check for perfect boss fight
            if event_data.get('mistakes', 0) == 0:
                result = self.unlock_achievement('perfect_boss')
                if result:
                    results.append(result)
        
        # Add more event types as needed
        
        return results
    
    def get_total_achievement_points(self):
        """
        Get the total achievement points earned by the user
        
        Returns:
            int: Total achievement points
        """
        total_points = 0
        
        for achievement in self.achievements:
            if achievement['id'] in self.user_achievements:
                total_points += achievement.get('points', 0)
        
        return total_points
    
    def get_recent_achievements(self, limit=5):
        """
        Get the user's most recently unlocked achievements
        
        Args:
            limit (int): Maximum number of achievements to return
            
        Returns:
            list: Recently unlocked achievements
        """
        # In a real implementation, we would store unlock timestamps
        # For now, just return the last N unlocked achievements
        recent_ids = self.user_achievements[-limit:] if self.user_achievements else []
        recent = []
        
        for achievement_id in recent_ids:
            achievement = next((a for a in self.achievements if a['id'] == achievement_id), None)
            if achievement:
                recent.append(achievement)
        
        return recent