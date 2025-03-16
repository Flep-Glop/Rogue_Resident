# question_plugin.py - Example plugin for question node type
from node_plugins import NodeTypePlugin, register_node_plugin
from game_state import get_question_for_node

class QuestionNodePlugin(NodeTypePlugin):
    """Plugin for question node type"""
    
    def process_node_data(self, node):
        """Process a question node - add question data if missing"""
        if 'question' not in node:
            # Get question data
            question_data = get_question_for_node(node)
            if question_data:
                node['question'] = question_data
                
        return node
    
    def get_node_content(self, node):
        """Get formatted content for the question node"""
        if 'question' not in node:
            return {"error": "No question data found for node"}
        
        # Return formatted question data
        question = node['question']
        return {
            "text": question.get('text', ''),
            "options": question.get('options', []),
            "difficulty": question.get('difficulty', 1),
            "category": question.get('category_name', 'General')
        }

# Register plugin
register_node_plugin(QuestionNodePlugin(
    type_id="question",
    display_name="Physics Question",
    weight=60
))