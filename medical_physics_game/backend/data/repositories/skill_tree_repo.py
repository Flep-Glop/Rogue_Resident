# backend/data/repositories/skill_tree_repo.py
import os
import json
from backend.data.models.skill_tree import SkillTreeNode

class SkillTreeRepository:
    _skill_tree = None
    
    @classmethod
    def get_skill_tree(cls):
        """Get the full skill tree"""
        if cls._skill_tree is None:
            cls._load_skill_tree()
        return cls._skill_tree
    
    @classmethod
    def _load_skill_tree(cls):
        """Load the skill tree from the data file"""
        data_path = os.path.join(os.path.dirname(__file__), '../../../data/skill_tree/skill_tree.json')
        try:
            with open(data_path, 'r') as f:
                skill_data = json.load(f)
                cls._skill_tree = [SkillTreeNode.from_dict(node) for node in skill_data]
        except FileNotFoundError:
            cls._skill_tree = []
        return cls._skill_tree
    
    @classmethod
    def get_node_by_id(cls, node_id):
        """Get a specific skill tree node by ID"""
        skill_tree = cls.get_skill_tree()
        for node in skill_tree:
            if node.id == node_id:
                return node
        return None