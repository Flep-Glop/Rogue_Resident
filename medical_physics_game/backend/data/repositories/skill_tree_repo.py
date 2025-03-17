"""
Skill Tree Repository for the Medical Physics Game.
This file handles data access operations for skill trees.
"""
import json
import os
from typing import Dict, List, Optional

from backend.data.models.skill_tree import SkillNode, SkillTree


class SkillTreeRepository:
    """Repository for accessing and manipulating skill tree data."""
    
    def __init__(self, data_path: str = "data/skill_tree"):
        """Initialize the repository with the data path."""
        self.data_path = data_path
        self.skill_trees_file = os.path.join(data_path, "skill_tree.json")
        self._ensure_data_directory()
    
    def _ensure_data_directory(self) -> None:
        """Ensure the data directory exists."""
        os.makedirs(os.path.dirname(self.skill_trees_file), exist_ok=True)
    
    def _load_skill_trees(self) -> Dict[str, Dict]:
        """Load skill trees from the JSON file."""
        if not os.path.exists(self.skill_trees_file):
            return {}
        
        try:
            with open(self.skill_trees_file, 'r') as file:
                return json.load(file)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    
    def _save_skill_trees(self, skill_trees: Dict[str, Dict]) -> None:
        """Save skill trees to the JSON file."""
        with open(self.skill_trees_file, 'w') as file:
            json.dump(skill_trees, file, indent=2)
    
    def get_all_skill_trees(self) -> List[SkillTree]:
        """Get all skill trees."""
        skill_trees_data = self._load_skill_trees()
        return [SkillTree.from_dict(data) for data in skill_trees_data.values()]
    
    def get_skill_tree_by_id(self, tree_id: str) -> Optional[SkillTree]:
        """Get a skill tree by its ID."""
        skill_trees_data = self._load_skill_trees()
        tree_data = skill_trees_data.get(tree_id)
        return SkillTree.from_dict(tree_data) if tree_data else None
    
    def get_skill_tree_by_character_class(self, character_class: str) -> Optional[SkillTree]:
        """Get a skill tree by character class."""
        for tree in self.get_all_skill_trees():
            if tree.character_class == character_class:
                return tree
        return None
    
    def save_skill_tree(self, skill_tree: SkillTree) -> bool:
        """Save a skill tree to storage."""
        skill_trees_data = self._load_skill_trees()
        skill_trees_data[skill_tree.id] = skill_tree.to_dict()
        self._save_skill_trees(skill_trees_data)
        return True
    
    def delete_skill_tree(self, tree_id: str) -> bool:
        """Delete a skill tree by its ID."""
        skill_trees_data = self._load_skill_trees()
        if tree_id in skill_trees_data:
            del skill_trees_data[tree_id]
            self._save_skill_trees(skill_trees_data)
            return True
        return False
    
    def create_default_skill_trees(self) -> None:
        """Create default skill trees if none exist."""
        if not self._load_skill_trees():
            # Create default skill trees for different character classes
            self._create_default_physicist_tree()
            self._create_default_resident_tree()
            self._create_default_qa_specialist_tree()
    
    def _create_default_physicist_tree(self) -> None:
        """Create the default physicist skill tree."""
        tree = SkillTree(
            id="physicist_tree",
            name="Physicist Skill Tree",
            description="Skills for the Medical Physicist character class",
            character_class="physicist"
        )
        
        # Add root node
        tree.add_node(SkillNode(
            id="radiation_basics",
            name="Radiation Basics",
            description="Understanding the fundamental principles of radiation",
            icon="radiation_icon.png",
            x_position=0,
            y_position=0,
            unlocked=True,
            level=1,
            effects=[{"type": "knowledge_boost", "value": 5}]
        ))
        
        # Add more nodes with proper positioning and prerequisites
        # ... (add more nodes here)
        
        self.save_skill_tree(tree)
    
    def _create_default_resident_tree(self) -> None:
        """Create the default resident skill tree."""
        # Similar implementation as physicist tree but with different nodes
        pass
    
    def _create_default_qa_specialist_tree(self) -> None:
        """Create the default QA specialist skill tree."""
        # Similar implementation as physicist tree but with different nodes
        pass