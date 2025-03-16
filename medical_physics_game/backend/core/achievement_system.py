class AchievementSystem:
    def __init__(self, user_id):
        self.user_id = user_id
        self.achievements = self._load_achievements()
        self.user_achievements = self._load_user_achievements()
        
    def _load_achievements(self):
        """Load achievement definitions"""
        # Implementation to load from file or database
        return [
            {
                'id': 'perfect_floor',
                'name': 'Perfect Knowledge',
                'description': 'Complete a floor with 100% correct answers',
                'icon': 'trophy',
                'hidden': False
            },
            {
                'id': 'skill_master',
                'name': 'Skill Master',
                'description': 'Unlock 20 skill nodes',
                'icon': 'skill',
                'hidden': False
            },
            {
                'id': 'save_lives',
                'name': 'Lifesaver',
                'description': 'Successfully treat 50 patients',
                'icon': 'heart',
                'hidden': False
            },
            # More achievements...
        ]
        
    def _load_user_achievements(self):
        """Load user's unlocked achievements"""
        from backend.data.repositories.user_repo import UserRepository
        try:
            user = UserRepository.get_user_by_id(self.user_id)
            return user.achievements if hasattr(user, 'achievements') else []
        except:
            # Fallback if repository isn't fully implemented yet
            return []
        
    def unlock_achievement(self, achievement_id):
        """Unlock an achievement for the user"""
        if achievement_id in self.user_achievements:
            return False
            
        # Check if achievement exists
        achievement = next((a for a in self.achievements if a['id'] == achievement_id), None)
        if not achievement:
            return False
            
        # Add achievement to user's unlocked achievements
        self.user_achievements.append(achievement_id)
        
        # Save to repository
        try:
            from backend.data.repositories.user_repo import UserRepository
            UserRepository.update_user_achievements(self.user_id, self.user_achievements)
        except:
            # Temporary fallback during development
            print(f"Achievement unlocked: {achievement['name']} (would be saved to database)")
        
        # Trigger achievement notification
        return {
            'achievement': achievement,
            'is_new': True
        }
        
    def check_achievement_progress(self, event_type, event_data):
        """Check if an event triggers any achievements"""
        results = []
        
        if event_type == 'floor_completed':
            correct_answers = event_data.get('correct_answers', 0)
            total_questions = event_data.get('total_questions', 0)
            
            if total_questions > 0 and correct_answers == total_questions:
                result = self.unlock_achievement('perfect_floor')
                if result:
                    results.append(result)
        
        elif event_type == 'skill_tree_updated':
            unlocked_nodes = event_data.get('total_unlocked_nodes', 0)
            
            if unlocked_nodes >= 20:
                result = self.unlock_achievement('skill_master')
                if result:
                    results.append(result)
                    
        elif event_type == 'patient_treated':
            total_patients = event_data.get('total_patients', 0)
            
            if total_patients >= 50:
                result = self.unlock_achievement('save_lives')
                if result:
                    results.append(result)
        
        return results
