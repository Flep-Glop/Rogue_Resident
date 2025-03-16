import json

class Character:
    def __init__(self, id, name, max_hp, current_hp, abilities, stats):
        self.id = id
        self.name = name
        self.max_hp = max_hp
        self.current_hp = current_hp
        self.abilities = abilities
        self.stats = stats
        
    @classmethod
    def from_dict(cls, data):
        """Create a Character instance from a dictionary."""
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                # If it's just a string ID, create minimal character
                return cls(
                    id=data,
                    name="Unknown Character",
                    max_hp=100,
                    current_hp=100,
                    abilities=[],
                    stats={}
                )
                
        return cls(
            id=data.get('id'),
            name=data.get('name', 'Unknown'),
            max_hp=data.get('max_hp', 100),
            current_hp=data.get('current_hp', 100),
            abilities=data.get('abilities', []),
            stats=data.get('stats', {})
        )
        
    def to_dict(self):
        """Convert Character instance to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'max_hp': self.max_hp,
            'current_hp': self.current_hp,
            'abilities': self.abilities,
            'stats': self.stats
        }
