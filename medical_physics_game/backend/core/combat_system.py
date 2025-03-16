# backend/core/skill_tree_manager.py
class SkillTreeManager:
    def __init__(self, character_id):
        self.character_id = character_id
        self.nodes = self._load_skill_tree()
        self.unlocked_nodes = self._load_unlocked_nodes()
        
    def _load_skill_tree(self):
        """Load the full skill tree structure"""
        from backend.data.repositories.skill_tree_repo import SkillTreeRepository
        return SkillTreeRepository.get_skill_tree()
        
    def _load_unlocked_nodes(self):
        """Load nodes unlocked by this character"""
        from backend.data.repositories.character_repo import CharacterRepository
        character = CharacterRepository.get_character_by_id(self.character_id)
        return character.unlocked_skills if hasattr(character, 'unlocked_skills') else []
    
    def can_unlock_node(self, node_id):
        """Check if a node can be unlocked"""
        node = self._get_node_by_id(node_id)
        if not node:
            return False
            
        # Check if node is already unlocked
        if node_id in self.unlocked_nodes:
            return False
            
        # Check if prerequisites are met
        for prereq_id in node.prerequisites:
            if prereq_id not in self.unlocked_nodes:
                return False
                
        # Check if character has enough skill points
        from backend.data.repositories.character_repo import CharacterRepository
        character = CharacterRepository.get_character_by_id(self.character_id)
        return character.skill_points >= node.cost
        
    def unlock_node(self, node_id):
        """Unlock a node in the skill tree"""
        if not self.can_unlock_node(node_id):
            return False
            
        node = self._get_node_by_id(node_id)
        
        # Update character
        from backend.data.repositories.character_repo import CharacterRepository
        character = CharacterRepository.get_character_by_id(self.character_id)
        character.skill_points -= node.cost
        if not hasattr(character, 'unlocked_skills'):
            character.unlocked_skills = []
        character.unlocked_skills.append(node_id)
        
        # Apply node effects
        self._apply_node_effects(node)
        
        # Save character
        CharacterRepository.update_character(character)
        
        self.unlocked_nodes.append(node_id)
        return True
        
    def _get_node_by_id(self, node_id):
        """Get a skill tree node by ID"""
        for node in self.nodes:
            if node.id == node_id:
                return node
        return None
        
    def _apply_node_effects(self, node):
        """Apply the effects of unlocking a node"""
        # Implementation depends on effect system design
        pass