import json
# Item model

class Item:
    def __init__(self, id=None, name=None, description=None, effects=None, rarity=None, type=None, stats=None):
        self.id = id
        self.name = name
        self.description = description
        self.effects = effects or []
        self.rarity = rarity
        self.type = type
        self.stats = stats or {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'effects': self.effects,
            'rarity': self.rarity,
            'type': self.type,
            'stats': self.stats
        }
    
    @classmethod
    def from_dict(cls, data):
        # Handle both string and dictionary input
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                # If it's not valid JSON, use it as the ID
                return cls(id=data)
        
        # Now data should be a dictionary
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            description=data.get('description'),
            effects=data.get('effects', []),
            rarity=data.get('rarity'),
            type=data.get('type'),
            stats=data.get('stats', {})
        )
