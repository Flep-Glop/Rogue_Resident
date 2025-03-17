"""
Skill Tree data model for the Medical Physics Game.
This file defines the structure of skill trees in the application.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class SkillNode:
    """Represents a single node in the skill tree."""
    id: str
    name: str
    description: str
    icon: str
    x_position: float
    y_position: float
    unlocked: bool = False
    level: int = 0
    max_level: int = 1
    effects: List[Dict] = field(default_factory=list)
    prerequisites: List[str] = field(default_factory=list)
    category: str = "general"
    cost: int = 1


@dataclass
class SkillTree:
    """Represents a complete skill tree with multiple nodes."""
    id: str
    name: str
    description: str
    character_class: str
    nodes: Dict[str, SkillNode] = field(default_factory=dict)
    available_points: int = 0
    total_earned_points: int = 0

    def add_node(self, node: SkillNode) -> None:
        """Add a node to the skill tree."""
        self.nodes[node.id] = node

    def get_node(self, node_id: str) -> Optional[SkillNode]:
        """Get a node by its ID."""
        return self.nodes.get(node_id)

    def can_unlock_node(self, node_id: str) -> bool:
        """Check if a node can be unlocked based on prerequisites and available points."""
        node = self.get_node(node_id)
        if not node or node.unlocked or self.available_points < node.cost:
            return False
        
        # Check prerequisites
        for prereq_id in node.prerequisites:
            prereq_node = self.get_node(prereq_id)
            if not prereq_node or not prereq_node.unlocked:
                return False
        
        return True

    def unlock_node(self, node_id: str) -> bool:
        """Unlock a node if possible and return success status."""
        if not self.can_unlock_node(node_id):
            return False
        
        node = self.get_node(node_id)
        node.unlocked = True
        node.level = 1
        self.available_points -= node.cost
        
        return True

    def can_level_up_node(self, node_id: str) -> bool:
        """Check if a node can be leveled up."""
        node = self.get_node(node_id)
        return (node and node.unlocked and 
                node.level < node.max_level and 
                self.available_points >= node.cost)

    def level_up_node(self, node_id: str) -> bool:
        """Level up a node if possible and return success status."""
        if not self.can_level_up_node(node_id):
            return False
        
        node = self.get_node(node_id)
        node.level += 1
        self.available_points -= node.cost
        
        return True

    def add_points(self, points: int) -> None:
        """Add skill points to the tree."""
        self.available_points += points
        self.total_earned_points += points

    def to_dict(self) -> Dict:
        """Convert the skill tree to a dictionary for serialization."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "character_class": self.character_class,
            "nodes": {node_id: self._node_to_dict(node) for node_id, node in self.nodes.items()},
            "available_points": self.available_points,
            "total_earned_points": self.total_earned_points
        }
    
    @staticmethod
    def _node_to_dict(node: SkillNode) -> Dict:
        """Convert a node to a dictionary."""
        return {
            "id": node.id,
            "name": node.name,
            "description": node.description,
            "icon": node.icon,
            "x_position": node.x_position,
            "y_position": node.y_position,
            "unlocked": node.unlocked,
            "level": node.level,
            "max_level": node.max_level,
            "effects": node.effects,
            "prerequisites": node.prerequisites,
            "category": node.category,
            "cost": node.cost
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'SkillTree':
        """Create a skill tree from a dictionary."""
        tree = cls(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            character_class=data["character_class"],
            available_points=data.get("available_points", 0),
            total_earned_points=data.get("total_earned_points", 0)
        )
        
        for node_id, node_data in data.get("nodes", {}).items():
            tree.add_node(SkillNode(
                id=node_data["id"],
                name=node_data["name"],
                description=node_data["description"],
                icon=node_data["icon"],
                x_position=node_data["x_position"],
                y_position=node_data["y_position"],
                unlocked=node_data.get("unlocked", False),
                level=node_data.get("level", 0),
                max_level=node_data.get("max_level", 1),
                effects=node_data.get("effects", []),
                prerequisites=node_data.get("prerequisites", []),
                category=node_data.get("category", "general"),
                cost=node_data.get("cost", 1)
            ))
        
        return tree