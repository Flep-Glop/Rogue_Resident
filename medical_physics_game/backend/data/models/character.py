"""
Character model for the Medical Physics Game.
Contains the data structure and methods for character management.
"""

class Character:
    """Represents a playable character in the game."""
    
    def __init__(self, id, name, max_hp, current_hp, abilities=None, stats=None, inventory=None):
        """
        Initialize a new character.
        
        Args:
            id (str): Unique identifier for the character
            name (str): Character name
            max_hp (int): Maximum health points
            current_hp (int): Current health points
            abilities (list, optional): List of character abilities
            stats (dict, optional): Character statistics
            inventory (list, optional): Character inventory items
        """
        self.id = id
        self.name = name
        self.max_hp = max_hp
        self.current_hp = current_hp
        self.abilities = abilities or []
        self.stats = stats or {}
        self.inventory = inventory or []
        
    def take_damage(self, amount):
        """
        Reduce character health by the specified amount.
        
        Args:
            amount (int): Amount of damage to take
            
        Returns:
            int: Remaining health points
        """
        self.current_hp = max(0, self.current_hp - amount)
        return self.current_hp
        
    def heal(self, amount):
        """
        Increase character health by the specified amount.
        
        Args:
            amount (int): Amount of healing to receive
            
        Returns:
            int: New current health points
        """
        self.current_hp = min(self.max_hp, self.current_hp + amount)
        return self.current_hp
        
    def add_item(self, item):
        """
        Add an item to the character's inventory.
        
        Args:
            item (dict): Item to add to inventory
            
        Returns:
            list: Updated inventory
        """
        self.inventory.append(item)
        return self.inventory
        
    def remove_item(self, item_id):
        """
        Remove an item from the character's inventory.
        
        Args:
            item_id (str): ID of item to remove
            
        Returns:
            bool: True if item was removed, False otherwise
        """
        for i, item in enumerate(self.inventory):
            if item.get('id') == item_id:
                self.inventory.pop(i)
                return True
        return False
        
    def to_dict(self):
        """
        Convert character to dictionary for serialization.
        
        Returns:
            dict: Dictionary representation of character
        """
        return {
            'id': self.id,
            'name': self.name,
            'max_hp': self.max_hp,
            'current_hp': self.current_hp,
            'abilities': self.abilities,
            'stats': self.stats,
            'inventory': self.inventory
        }
        
    @classmethod
    def from_dict(cls, data):
        """
        Create a Character instance from dictionary data.
        
        Args:
            data (dict): Dictionary containing character data
            
        Returns:
            Character: New Character instance
        """
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            max_hp=data.get('max_hp', 100),
            current_hp=data.get('current_hp', 100),
            abilities=data.get('abilities', []),
            stats=data.get('stats', {}),
            inventory=data.get('inventory', [])
        )