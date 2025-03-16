class Item:
    def __init__(self, id, name, description, effects=None):
        self.id = id
        self.name = name
        self.description = description
        self.effects = effects or []
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'effects': self.effects
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            description=data.get('description'),
            effects=data.get('effects')
        )
