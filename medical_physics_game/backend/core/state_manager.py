"""
Game state manager for the Medical Physics Game.
Central module for managing game state and providing game logic functions.
"""

import json
import random
import os
from backend.data.repositories.character_repo import CharacterRepository
from backend.data.repositories.question_repo import QuestionRepository
from backend.data.models.node import Node
from backend.utils.db_utils import get_data_path

class GameState:
    """Manages the current game state."""
    
    def __init__(self):
        """Initialize a new game state."""
        self.character = None
        self.current_floor = 1
        self.current_map = []
        self.visited_nodes = []
        self.current_node_id = None
        self.score = 0
        self.reputation = 0
        self.game_over = False
        
        # Initialize repositories
        self.character_repo = CharacterRepository()
        self.question_repo = QuestionRepository()
        
    def new_game(self, character_id):
        """
        Start a new game with the selected character.
        
        Args:
            character_id (str): ID of the selected character
            
        Returns:
            bool: True if game was successfully started, False otherwise
        """
        character = self.character_repo.get_by_id(character_id)
        if not character:
            return False
            
        self.character = character
        self.current_floor = 1
        self.current_map = self._load_floor(self.current_floor)
        self.visited_nodes = []
        self.current_node_id = self._get_starting_node_id()
        self.score = 0
        self.reputation = 50  # Start with neutral reputation
        self.game_over = False
        
        return True
        
    def move_to_node(self, node_id):
        """
        Move the player to a new node.
        
        Args:
            node_id (str): ID of the destination node
            
        Returns:
            dict: Node data if move was successful, None otherwise
        """
        # Check if move is valid
        if not self._is_valid_move(node_id):
            return None
            
        # Update current position
        self.current_node_id = node_id
        
        # Mark node as visited
        if node_id not in self.visited_nodes:
            self.visited_nodes.append(node_id)
            
        # Get node data
        node_data = self._get_node_by_id(node_id)
        
        return node_data
        
    def get_current_node(self):
        """
        Get the current node data.
        
        Returns:
            dict: Current node data
        """
        return self._get_node_by_id(self.current_node_id)
        
    def get_available_moves(self):
        """
        Get available nodes the player can move to.
        
        Returns:
            list: List of available node IDs
        """
        if not self.current_node_id:
            return []
            
        current_node = self._get_node_by_id(self.current_node_id)
        if not current_node:
            return []
            
        return current_node.connections
        
    def answer_question(self, question_id, answer_index):
        """
        Process a question answer.
        
        Args:
            question_id (str): ID of the question being answered
            answer_index (int): Index of the selected answer
            
        Returns:
            dict: Result data with success flag and feedback
        """
        question = self.question_repo.get_by_id(question_id)
        if not question:
            return {'success': False, 'feedback': 'Question not found'}
            
        is_correct = question.check_answer(answer_index)
        
        if is_correct:
            # Calculate points based on difficulty
            points = int(10 * question.get_difficulty_modifier())
            self.score += points
            self.reputation += 2
            
            return {
                'success': True,
                'correct': True,
                'points': points,
                'feedback': question.explanation or 'Correct!'
            }
        else:
            self.reputation -= 1
            
            return {
                'success': True,
                'correct': False,
                'points': 0,
                'feedback': question.explanation or 'Incorrect. The correct answer was: ' + 
                            question.options[question.correct_option]
            }
            
    def complete_floor(self):
        """
        Complete the current floor and move to the next one.
        
        Returns:
            bool: True if moved to next floor, False if game is complete
        """
        self.current_floor += 1
        
        # Check if this was the last floor
        floor_data = self._load_floor(self.current_floor)
        if not floor_data:
            self.game_over = True
            return False
            
        self.current_map = floor_data
        self.visited_nodes = []
        self.current_node_id = self._get_starting_node_id()
        
        return True
        
    def add_item_to_inventory(self, item_id):
        """
        Add an item to the character's inventory.
        
        Args:
            item_id (str): ID of the item to add
            
        Returns:
            bool: True if item was added, False otherwise
        """
        # Item repository would be better here, but simplifying for now
        item_path = os.path.join(get_data_path(), 'items', 'items.json')
        try:
            with open(item_path, 'r') as f:
                items = json.load(f)
                
            item = next((i for i in items if i.get('id') == item_id), None)
            if not item:
                return False
                
            self.character.add_item(item)
            return True
        except (FileNotFoundError, json.JSONDecodeError):
            return False
            
    def update_reputation(self, amount):
        """
        Update the player's reputation.
        
        Args:
            amount (int): Amount to change reputation (positive or negative)
            
        Returns:
            int: New reputation value
        """
        self.reputation = max(0, min(100, self.reputation + amount))
        return self.reputation
        
    def save_game(self, save_slot=0):
        """
        Save the current game state.
        
        Args:
            save_slot (int, optional): Save slot number
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        save_data = {
            'character': self.character.to_dict(),
            'current_floor': self.current_floor,
            'current_map': [node.to_dict() for node in self.current_map],
            'visited_nodes': self.visited_nodes,
            'current_node_id': self.current_node_id,
            'score': self.score,
            'reputation': self.reputation,
            'game_over': self.game_over
        }
        
        save_path = os.path.join(get_data_path(), f'save_{save_slot}.json')
        
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            with open(save_path, 'w') as f:
                json.dump(save_data, f, indent=2)
            return True
        except (IOError, TypeError):
            return False
            
    def load_game(self, save_slot=0):
        """
        Load a saved game state.
        
        Args:
            save_slot (int, optional): Save slot number
            
        Returns:
            bool: True if load was successful, False otherwise
        """
        save_path = os.path.join(get_data_path(), f'save_{save_slot}.json')
        
        try:
            with open(save_path, 'r') as f:
                save_data = json.load(f)
                
            # Initialize character
            from backend.data.models.character import Character
            self.character = Character.from_dict(save_data.get('character', {}))
            
            # Load other game state properties
            self.current_floor = save_data.get('current_floor', 1)
            self.current_map = [Node.from_dict(node_data) for node_data in save_data.get('current_map', [])]
            self.visited_nodes = save_data.get('visited_nodes', [])
            self.current_node_id = save_data.get('current_node_id')
            self.score = save_data.get('score', 0)
            self.reputation = save_data.get('reputation', 50)
            self.game_over = save_data.get('game_over', False)
            
            return True
        except (FileNotFoundError, json.JSONDecodeError):
            return False
            
    def _load_floor(self, floor_number):
        """
        Load floor data.
        
        Args:
            floor_number (int): Floor number to load
            
        Returns:
            list: List of Node objects representing the floor map
        """
        floor_path = os.path.join(get_data_path(), 'maps', 'floors.json')
        try:
            with open(floor_path, 'r') as f:
                floors_data = json.load(f)
                
            floor_data = next((f for f in floors_data if f.get('floor') == floor_number), None)
            if not floor_data:
                return []
                
            nodes = []
            for node_data in floor_data.get('nodes', []):
                nodes.append(Node.from_dict(node_data))
                
            return nodes
        except (FileNotFoundError, json.JSONDecodeError):
            return []
            
    def _get_node_by_id(self, node_id):
        """
        Get a node by ID from the current map.
        
        Args:
            node_id (str): Node ID to find
            
        Returns:
            Node: Node object if found, None otherwise
        """
        for node in self.current_map:
            if node.id == node_id:
                return node
        return None
        
    def _get_starting_node_id(self):
        """
        Get the starting node ID for the current floor.
        
        Returns:
            str: Starting node ID, or None if no nodes
        """
        if not self.current_map:
            return None
            
        # Find node with 'start' type, or take the first node
        start_nodes = [node for node in self.current_map if node.type == 'start']
        if start_nodes:
            return start_nodes[0].id
            
        return self.current_map[0].id
        
    def _is_valid_move(self, node_id):
        """
        Check if a move to the specified node is valid.
        
        Args:
            node_id (str): Destination node ID
            
        Returns:
            bool: True if move is valid, False otherwise
        """
        if not self.current_node_id:
            # First move on the map
            starting_node_id = self._get_starting_node_id()
            return node_id == starting_node_id
            
        # Get current node
        current_node = self._get_node_by_id(self.current_node_id)
        if not current_node:
            return False
            
        # Check if destination is connected to current node
        return node_id in current_node.connections

# Global game state instance
_game_state = None

def get_game_state():
    """
    Get the global game state instance.
    
    Returns:
        GameState: Global game state instance
    """
    global _game_state
    if _game_state is None:
        _game_state = GameState()
    return _game_state

# Convenience functions for plugins and other modules

def get_random_item():
    """Get a random item from the item database."""
    item_path = os.path.join(get_data_path(), 'items', 'items.json')
    try:
        with open(item_path, 'r') as f:
            items = json.load(f)
        return random.choice(items) if items else None
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def get_question_for_node(node_metadata):
    """Get a question based on node metadata."""
    category = node_metadata.get('category')
    difficulty = node_metadata.get('difficulty')
    
    question_repo = QuestionRepository()
    return question_repo.get_random(category=category, difficulty=difficulty)

def get_random_event():
    """Get a random event from the events database."""
    event_path = os.path.join(get_data_path(), 'events.json')
    try:
        with open(event_path, 'r') as f:
            events = json.load(f)
        return random.choice(events) if events else None
    except (FileNotFoundError, json.JSONDecodeError):
        return None