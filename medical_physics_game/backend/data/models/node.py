"""
Node model for the Medical Physics Game.
Represents map nodes and their connections for the game map.
"""

class Node:
    """Represents a node on the game map."""
    
    def __init__(self, id, type, position, connections=None, metadata=None, visited=False):
        """
        Initialize a new node.
        
        Args:
            id (str): Unique identifier for the node
            type (str): Node type (question, rest, elite, boss, etc.)
            position (dict): Node position with 'x' and 'y' coordinates
            connections (list, optional): List of connected node IDs
            metadata (dict, optional): Additional node metadata
            visited (bool, optional): Whether the node has been visited
        """
        self.id = id
        self.type = type
        self.position = position
        self.connections = connections or []
        self.metadata = metadata or {}
        self.visited = visited
        
    def add_connection(self, node_id):
        """
        Add a connection to another node.
        
        Args:
            node_id (str): ID of the node to connect to
            
        Returns:
            bool: True if connection was added, False if it already existed
        """
        if node_id not in self.connections:
            self.connections.append(node_id)
            return True
        return False
        
    def remove_connection(self, node_id):
        """
        Remove a connection to another node.
        
        Args:
            node_id (str): ID of the node to disconnect from
            
        Returns:
            bool: True if connection was removed, False if it didn't exist
        """
        if node_id in self.connections:
            self.connections.remove(node_id)
            return True
        return False
        
    def mark_visited(self):
        """
        Mark the node as visited.
        
        Returns:
            bool: New visited state
        """
        self.visited = True
        return self.visited
        
    def get_distance_to(self, other_node):
        """
        Calculate distance to another node.
        
        Args:
            other_node (Node): Another node
            
        Returns:
            float: Euclidean distance between nodes
        """
        dx = self.position['x'] - other_node.position['x']
        dy = self.position['y'] - other_node.position['y']
        return (dx**2 + dy**2)**0.5
        
    def to_dict(self):
        """
        Convert node to dictionary for serialization.
        
        Returns:
            dict: Dictionary representation of node
        """
        return {
            'id': self.id,
            'type': self.type,
            'position': self.position,
            'connections': self.connections,
            'metadata': self.metadata,
            'visited': self.visited
        }
        
    @classmethod
    def from_dict(cls, data):
        """
        Create a Node instance from dictionary data.
        
        Args:
            data (dict): Dictionary containing node data
            
        Returns:
            Node: New Node instance
        """
        return cls(
            id=data.get('id'),
            type=data.get('type', 'generic'),
            position=data.get('position', {'x': 0, 'y': 0}),
            connections=data.get('connections', []),
            metadata=data.get('metadata', {}),
            visited=data.get('visited', False)
        )