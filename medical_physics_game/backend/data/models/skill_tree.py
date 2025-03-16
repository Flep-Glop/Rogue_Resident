# backend/data/models/skill_tree.py
class SkillTreeNode:
    def __init__(self, id, name, description, cost, prerequisites=None, effects=None, 
                 category=None, position=None):
        self.id = id
        self.name = name
        self.description = description
        self.cost = cost
        self.prerequisites = prerequisites or []
        self.effects = effects or []
        self.category = category
        self.position = position or {'x': 0, 'y': 0}
        
    def to_dict(self):
        """Convert node to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'cost': self.cost,
            'prerequisites': self.prerequisites,
            'effects': self.effects,
            'category': self.category,
            'position': self.position
        }
        
    @classmethod
    def from_dict(cls, data):
        """Create node from dictionary"""
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            description=data.get('description'),
            cost=data.get('cost', 1),
            prerequisites=data.get('prerequisites', []),
            effects=data.get('effects', []),
            category=data.get('category'),
            position=data.get('position', {'x': 0, 'y': 0})
        )