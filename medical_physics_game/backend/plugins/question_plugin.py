# backend/plugins/question_plugin.py
from .base_plugin import BasePlugin
from backend.data.repositories.question_repo import QuestionRepository

class QuestionPlugin(BasePlugin):
    """Plugin for managing and extending question functionality"""
    
    id = "question_plugin"
    name = "Question Plugin"
    version = "1.0.0"
    description = "Extends question functionality with analytics and custom types"
    author = "Medical Physics Game Team"
    
    def __init__(self, plugin_manager=None):
        super().__init__(plugin_manager)
        self.question_stats = {}  # question_id -> stats
        
    def on_enable(self):
        """Register event listeners when enabled"""
        if self.plugin_manager:
            self.plugin_manager.register_event_listener(self.id, "question_answered")
            
    def on_disable(self):
        """Unregister event listeners when disabled"""
        if self.plugin_manager:
            self.plugin_manager.unregister_event_listener(self.id, "question_answered")
            
    def on_question_answered(self, event_data):
        """Handle question answered event"""
        question_id = event_data.get("question_id")
        correct = event_data.get("correct", False)
        
        if not question_id:
            return
            
        # Initialize stats for this question if needed
        if question_id not in self.question_stats:
            self.question_stats[question_id] = {
                "attempts": 0,
                "correct": 0,
                "incorrect": 0
            }
            
        # Update stats
        stats = self.question_stats[question_id]
        stats["attempts"] += 1
        
        if correct:
            stats["correct"] += 1
        else:
            stats["incorrect"] += 1
            
        # Calculate success rate
        if stats["attempts"] > 0:
            stats["success_rate"] = (stats["correct"] / stats["attempts"]) * 100
            
        return stats
        
    def get_question_stats(self, question_id=None):
        """Get question statistics"""
        if question_id:
            return self.question_stats.get(question_id)
        return self.question_stats
        
    def get_difficult_questions(self, threshold=30):
        """Get questions with low success rates"""
        difficult_questions = []
        
        for question_id, stats in self.question_stats.items():
            if "success_rate" in stats and stats["attempts"] >= 5:
                if stats["success_rate"] <= threshold:
                    # Get the question details
                    question = QuestionRepository.get_question_by_id(question_id)
                    if question:
                        difficult_questions.append({
                            "question": question.to_dict(),
                            "stats": stats
                        })
                        
        return difficult_questions