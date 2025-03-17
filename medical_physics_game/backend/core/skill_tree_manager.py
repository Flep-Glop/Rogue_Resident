"""
Skill Tree Manager for the Medical Physics Game.
This file contains the business logic for skill tree operations.
"""
from typing import Dict, List, Optional, Tuple

from backend.data.models.skill_tree import SkillNode, SkillTree
from backend.data.repositories.skill_tree_repo import SkillTreeRepository
from backend.core.event_system import EventSystem


class SkillTreeManager:
    """Manager for skill tree operations."""
    
    def __init__(self, repository: SkillTreeRepository = None, event_system: EventSystem = None):
        """Initialize the manager with a repository and event system."""
        self.repository = repository or SkillTreeRepository()
        self.event_system = event_system or EventSystem()
    
    def get_skill_tree(self, tree_id: str) -> Optional[SkillTree]:
        """Get a skill tree by its ID."""
        return self.repository.get_skill_tree_by_id(tree_id)
    
    def get_skill_tree_for_character(self, character_class: str, character_id: str) -> SkillTree:
        """Get or create a skill tree for a character."""
        # Try to load an existing tree
        tree_id = f"{character_class}_{character_id}"
        tree = self.repository.get_skill_tree_by_id(tree_id)
        
        if tree is None:
            # Create a new tree based on the template for this class
            template = self.repository.get_skill_tree_by_character_class(character_class)
            if template is None:
                # If no template exists, create the defaults and try again
                self.repository.create_default_skill_trees()
                template = self.repository.get_skill_tree_by_character_class(character_class)
            
            # Still couldn't find a template
            if template is None:
                raise ValueError(f"No skill tree template found for character class: {character_class}")
            
            # Create a new instance from template
            tree = SkillTree(
                id=tree_id,
                name=f"{template.name} - {character_id}",
                description=template.description,
                character_class=character_class,
                nodes={node_id: SkillNode(**node.__dict__) for node_id, node in template.nodes.items()}
            )
            
            # Unlock starting nodes
            for node_id, node in tree.nodes.items():
                if not node.prerequisites:
                    node.unlocked = True
                    node.level = 1
            
            # Save the new tree
            self.repository.save_skill_tree(tree)
        
        return tree
    
    def award_skill_points(self, tree_id: str, points: int) -> bool:
        """Award skill points to a character's skill tree."""
        tree = self.repository.get_skill_tree_by_id(tree_id)
        if tree is None:
            return False
        
        tree.add_points(points)
        self.repository.save_skill_tree(tree)
        
        # Fire event
        self.event_system.emit("skill_points_awarded", {
            "tree_id": tree_id,
            "points_awarded": points,
            "total_points": tree.available_points
        })
        
        return True
    
    def unlock_node(self, tree_id: str, node_id: str) -> Tuple[bool, Optional[Dict]]:
        """Unlock a skill tree node for a character."""
        tree = self.repository.get_skill_tree_by_id(tree_id)
        if tree is None:
            return False, {"error": "Skill tree not found"}
        
        if not tree.can_unlock_node(node_id):
            # Check specific reasons for failure
            node = tree.get_node(node_id)
            if not node:
                return False, {"error": "Node not found"}
            if node.unlocked:
                return False, {"error": "Node already unlocked"}
            if tree.available_points < node.cost:
                return False, {"error": "Not enough skill points"}
            
            # Check prerequisites
            missing_prereqs = []
            for prereq_id in node.prerequisites:
                prereq = tree.get_node(prereq_id)
                if not prereq or not prereq.unlocked:
                    missing_prereqs.append(prereq_id)
            
            if missing_prereqs:
                return False, {"error": "Missing prerequisites", "missing": missing_prereqs}
            
            return False, {"error": "Cannot unlock node"}
        
        # Unlock the node
        success = tree.unlock_node(node_id)
        if success:
            self.repository.save_skill_tree(tree)
            
            # Get the node and its effects for the event
            node = tree.get_node(node_id)
            
            # Fire event
            self.event_system.emit("skill_node_unlocked", {
                "tree_id": tree_id,
                "node_id": node_id,
                "node_name": node.name,
                "node_level": node.level,
                "effects": node.effects
            })
            
            return True, {
                "node": tree.get_node(node_id).__dict__,
                "available_points": tree.available_points
            }
        
        return False, {"error": "Failed to unlock node"}
    
    def level_up_node(self, tree_id: str, node_id: str) -> Tuple[bool, Optional[Dict]]:
        """Level up a skill tree node for a character."""
        tree = self.repository.get_skill_tree_by_id(tree_id)
        if tree is None:
            return False, {"error": "Skill tree not found"}
        
        if not tree.can_level_up_node(node_id):
            # Check specific reasons for failure
            node = tree.get_node(node_id)
            if not node:
                return False, {"error": "Node not found"}
            if not node.unlocked:
                return False, {"error": "Node not unlocked yet"}
            if node.level >= node.max_level:
                return False, {"error": "Node already at max level"}
            if tree.available_points < node.cost:
                return False, {"error": "Not enough skill points"}
            
            return False, {"error": "Cannot level up node"}
        
        # Level up the node
        success = tree.level_up_node(node_id)
        if success:
            self.repository.save_skill_tree(tree)
            
            # Get the node for the event
            node = tree.get_node(node_id)
            
            # Fire event
            self.event_system.emit("skill_node_leveled_up", {
                "tree_id": tree_id,
                "node_id": node_id,
                "node_name": node.name,
                "node_level": node.level,
                "effects": node.effects
            })
            
            return True, {
                "node": tree.get_node(node_id).__dict__,
                "available_points": tree.available_points
            }
        
        return False, {"error": "Failed to level up node"}
    
    def reset_skill_tree(self, tree_id: str) -> bool:
        """Reset a character's skill tree, refunding all spent points."""
        tree = self.repository.get_skill_tree_by_id(tree_id)
        if tree is None:
            return False
        
        # Calculate spent points
        spent_points = 0
        for node in tree.nodes.values():
            if node.unlocked:
                spent_points += node.cost * node.level
        
        # Reset all nodes
        for node in tree.nodes.values():
            if not node.prerequisites:  # Keep starting nodes unlocked
                node.level = 1
            else:
                node.unlocked = False
                node.level = 0
        
        # Refund points
        tree.available_points = tree.total_earned_points
        
        # Save the updated tree
        self.repository.save_skill_tree(tree)
        
        # Fire event
        self.event_system.emit("skill_tree_reset", {
            "tree_id": tree_id,
            "refunded_points": spent_points,
            "available_points": tree.available_points
        })
        
        return True
    
    def get_node_effects(self, tree_id: str) -> Dict[str, List[Dict]]:
        """Get all active effects from unlocked nodes in a skill tree."""
        tree = self.repository.get_skill_tree_by_id(tree_id)
        if tree is None:
            return {}
        
        effects = {}
        for node_id, node in tree.nodes.items():
            if node.unlocked and node.level > 0:
                for effect in node.effects:
                    effect_type = effect.get("type")
                    if effect_type not in effects:
                        effects[effect_type] = []
                    
                    # Scale effect by node level if appropriate
                    scaled_effect = effect.copy()
                    if "value" in scaled_effect:
                        scaled_effect["value"] = scaled_effect["value"] * node.level
                    
                    scaled_effect["source_node"] = node_id
                    scaled_effect["source_name"] = node.name
                    effects[effect_type].append(scaled_effect)
        
        return effects
    
    def calculate_total_effect(self, tree_id: str, effect_type: str) -> float:
        """Calculate the total value of a specific effect type from all nodes."""
        effects = self.get_node_effects(tree_id)
        if effect_type not in effects:
            return 0
        
        total = 0
        for effect in effects[effect_type]:
            if "value" in effect:
                total += effect["value"]
        
        return total