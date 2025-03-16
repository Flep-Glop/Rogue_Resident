class Character:
    def __init__(self, id, name, max_hp, current_hp=None, abilities=None, stats=None):
        self.id = id
        self.name = name
        self.max_hp = max_hp
        self.current_hp = current_hp if current_hp is not None else max_hp
        self.abilities = abilities or []
        self.stats = stats or {}
    
    def to_dict(self):
        """Convert character to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'max_hp': self.max_hp,
            'current_hp': self.current_hp,
            'abilities': self.abilities,
            'stats': self.stats
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create character from dictionary"""
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            max_hp=data.get('max_hp', 100),
            current_hp=data.get('current_hp'),
            abilities=data.get('abilities', []),
            stats=data.get('stats', {})
        )
