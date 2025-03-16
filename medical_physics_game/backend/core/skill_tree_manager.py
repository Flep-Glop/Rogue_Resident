"""
Skill Tree Manager Implementation for Medical Physics Game

This implements the skill tree functionality as described in Developer Guide 3.
It handles:
- Loading the skill tree structure
- Checking node prerequisites
- Unlocking nodes
- Applying skill effects to character stats
"""

import json
import os
from backend.data.models.skill_tree import SkillTreeNode
from backend.utils.logging import GameLogger

logger = GameLogger()

class SkillTreeManager:
    def __init__(self, character_id):
        """
        Initialize the skill tree manager for a specific character
        
        Args:
            character_id (str): The unique identifier for the character
        """
        self.character_id = character_id
        self.nodes = self._load_skill_tree()
        self._load_character_data()
        
    def _load_skill_tree(self):
        """Load the skill tree structure from the data file"""
        from backend.data.repositories.skill_tree_repo import SkillTreeRepository
        
        try:
            return SkillTreeRepository.get_skill_tree()
        except Exception as e:
            logger.error(f"Error loading skill tree: {str(e)}")
            return []
            
    def _load_character_data(self):
        """Load character data, including unlocked skills"""
        from backend.data.repositories.character_repo import CharacterRepository
        
        try:
            self.character = CharacterRepository.get_character_by_id(self.character_id)
            if not hasattr(self.character, 'unlocked_skills'):
                self.character.unlocked_skills = []
            self.unlocked_nodes = self.character.unlocked_skills
        except Exception as e:
            logger.error(f"Error loading character data: {str(e)}")
            self.character = None
            self.unlocked_nodes = []
            
    def get_available_nodes(self):
        """
        Get all nodes that the character can potentially unlock
        
        Returns:
            list: A list of node IDs that can be unlocked
        """
        available_nodes = []
        
        for node in self.nodes:
            # Skip already unlocked nodes
            if node.id in self.unlocked_nodes:
                continue
                
            # Check if prerequisites are met
            if self.are_prerequisites_met(node.id):
                available_nodes.append(node.id)
                
        return available_nodes
        
    def are_prerequisites_met(self, node_id):
        """
        Check if all prerequisites for a node are unlocked
        
        Args:
            node_id (str): The ID of the node to check
            
        Returns:
            bool: True if all prerequisites are met, False otherwise
        """
        # Find the node
        node = next((n for n in self.nodes if n.id == node_id), None)
        
        if not node:
            logger.warning(f"Node {node_id} not found in skill tree")
            return False
            
        # If no prerequisites, always available
        if not node.prerequisites:
            return True
            
        # Check if all prerequisites are in unlocked nodes
        return all(prereq in self.unlocked_nodes for prereq in node.prerequisites)
        
    def can_unlock_node(self, node_id):
        """
        Check if a node can be unlocked (prerequisites met and enough skill points)
        
        Args:
            node_id (str): The ID of the node to check
            
        Returns:
            bool: True if the node can be unlocked, False otherwise
        """
        # Check if node exists
        node = next((n for n in self.nodes if n.id == node_id), None)
        if not node:
            logger.warning(f"Node {node_id} not found in skill tree")
            return False
            
        # Check if already unlocked
        if node_id in self.unlocked_nodes:
            return False
            
        # Check prerequisites
        if not self.are_prerequisites_met(node_id):
            return False
            
        # Check if enough skill points
        if not self.character or self.character.skill_points < node.cost:
            return False
            
        return True
        
    def unlock_node(self, node_id):
        """
        Unlock a skill tree node for the character
        
        Args:
            node_id (str): The ID of the node to unlock
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.can_unlock_node(node_id):
            return False
            
        # Find the node
        node = next((n for n in self.nodes if n.id == node_id), None)
        
        # Deduct skill points
        self.character.skill_points -= node.cost
        
        # Add to unlocked nodes
        self.unlocked_nodes.append(node_id)
        self.character.unlocked_skills = self.unlocked_nodes
        
        # Apply effects
        self._apply_node_effects(node)
        
        # Save character
        from backend.data.repositories.character_repo import CharacterRepository
        CharacterRepository.update_character(self.character)
        
        logger.info(f"Character {self.character_id} unlocked skill node {node_id}")
        
        return True
        
    def _apply_node_effects(self, node):
        """
        Apply the effects of a node to the character
        
        Args:
            node (SkillTreeNode): The node whose effects should be applied
        """
        if not node.effects:
            return
            
        for effect in node.effects:
            effect_type = effect.get('type')
            effect_value = effect.get('value')
            
            # Handle different effect types
            if effect_type == 'diagnosis_accuracy':
                if not hasattr(self.character, 'stats'):
                    self.character.stats = {}
                if 'diagnosis_accuracy' not in self.character.stats:
                    self.character.stats['diagnosis_accuracy'] = 0
                self.character.stats['diagnosis_accuracy'] += effect_value
            
            elif effect_type == 'treatment_effectiveness':
                if not hasattr(self.character, 'stats'):
                    self.character.stats = {}
                if 'treatment_effectiveness' not in self.character.stats:
                    self.character.stats['treatment_effectiveness'] = 0
                self.character.stats['treatment_effectiveness'] += effect_value
            
            elif effect_type == 'max_hp':
                self.character.max_hp += effect_value
                # Also increase current HP
                self.character.current_hp += effect_value
            
            elif effect_type == 'reveal_hidden_info':
                if not hasattr(self.character, 'abilities'):
                    self.character.abilities = []
                self.character.abilities.append({
                    'id': 'reveal_hidden_info',
                    'name': 'Reveal Hidden Information',
                    'description': 'Reveals hidden information in patient cases',
                    'effect': effect_value
                })
            
            # Additional effect types can be handled here
            
        logger.info(f"Applied effects of node {node.id} to character {self.character_id}")
    
    def get_node_details(self, node_id):
        """
        Get detailed information about a specific node
        
        Args:
            node_id (str): The ID of the node
            
        Returns:
            dict: Node details including status (unlocked/available/locked)
        """
        # Find the node
        node = next((n for n in self.nodes if n.id == node_id), None)
        
        if not node:
            return None
            
        # Determine status
        if node_id in self.unlocked_nodes:
            status = 'unlocked'
        elif self.can_unlock_node(node_id):
            status = 'available'
        else:
            status = 'locked'
            
        # Convert node to dictionary
        node_dict = {
            'id': node.id,
            'name': node.name,
            'description': node.description,
            'cost': node.cost,
            'prerequisites': node.prerequisites,
            'effects': node.effects,
            'category': node.category,
            'position': node.position,
            'icon': node.icon,
            'status': status
        }
        
        return node_dict
    
    def get_skill_tree_data(self):
        """
        Get the complete skill tree data for UI rendering
        
        Returns:
            dict: Complete skill tree data including node statuses
        """
        nodes_data = []
        
        for node in self.nodes:
            # Determine status
            if node.id in self.unlocked_nodes:
                status = 'unlocked'
            elif self.can_unlock_node(node.id):
                status = 'available'
            else:
                status = 'locked'
                
            nodes_data.append({
                'id': node.id,
                'name': node.name,
                'description': node.description,
                'cost': node.cost,
                'prerequisites': node.prerequisites,
                'category': node.category,
                'position': node.position,
                'icon': node.icon,
                'status': status
            })
            
        # Create connections data
        connections = []
        for node in self.nodes:
            for prereq in node.prerequisites:
                connections.append({
                    'from': prereq,
                    'to': node.id
                })
                
        return {
            'nodes': nodes_data,
            'connections': connections,
            'skill_points': self.character.skill_points if self.character else 0
        }