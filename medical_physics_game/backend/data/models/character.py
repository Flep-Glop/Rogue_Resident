# Character model

class Character:
    def __init__(self, id=None, name=None, max_hp=100, current_hp=100, abilities=None, stats=None, level=1):
        self.id = id
        self.name = name
        self.max_hp = max_hp
        self.current_hp = current_hp
        self.abilities = abilities or []
        self.stats = stats or {}
        self.level = level
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'max_hp': self.max_hp,
            'current_hp': self.current_hp,
            'abilities': self.abilities,
            'stats': self.stats,
            'level': self.level
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
            max_hp=data.get('max_hp', 100),
            current_hp=data.get('current_hp', 100),
            abilities=data.get('abilities', []),
            stats=data.get('stats', {}),
            level=data.get('level', 1)
        )
