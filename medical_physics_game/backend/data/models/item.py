import json

class Item:
    def __init__(self, id, name, description, effects):
        self.id = id
        self.name = name
        self.description = description
        self.effects = effects
        
    @classmethod
    def from_dict(cls, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                return cls(
                    id=data,
                    name="Unknown Item",
                    description="Item description not available",
                    effects={}
                )
                
        return cls(
            id=data.get('id'),
            name=data.get('name', ''),
            description=data.get('description', ''),
            effects=data.get('effects', {})
        )
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'effects': self.effects
        }
