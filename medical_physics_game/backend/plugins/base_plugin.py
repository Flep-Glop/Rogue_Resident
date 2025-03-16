"""
Base plugin system for the Medical Physics Game.
Defines the plugin architecture and registration system.
"""

from backend.core.state_manager import get_random_item, get_question_for_node, get_random_event

class NodePlugin:
    """Base class for node plugins."""
    
    def __init__(self, plugin_id, node_type):
        """
        Initialize a new node plugin.
        
        Args:
            plugin_id (str): Unique plugin identifier
            node_type (str): Node type this plugin handles
        """
        self.plugin_id = plugin_id
        self.node_type = node_type
        
    def handle_node(self, node, game_state):
        """
        Handle player interaction with a node.
        Must be implemented by plugin subclasses.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Response data
        """
        raise NotImplementedError("Subclasses must implement handle_node")
        
    def get_node_description(self, node, game_state):
        """
        Get node description text.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            str: Node description
        """
        return f"A {self.node_type} node"
        
    def get_initial_state(self, node):
        """
        Get initial state data for a node.
        
        Args:
            node (dict): Node data
            
        Returns:
            dict: Initial state data
        """
        return {}
        
    def get_client_data(self, node, game_state):
        """
        Get data to send to the client for this node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Client data
        """
        return {
            'type': self.node_type,
            'description': self.get_node_description(node, game_state),
            'state': self.get_initial_state(node),
            'metadata': node.get('metadata', {})
        }

class PluginManager:
    """Manager for node plugins."""
    
    def __init__(self):
        """Initialize a new plugin manager."""
        self.plugins = {}
        
    def register_plugin(self, plugin):
        """
        Register a plugin with the manager.
        
        Args:
            plugin (NodePlugin): Plugin to register
            
        Returns:
            bool: True if registration was successful, False otherwise
        """
        if not isinstance(plugin, NodePlugin):
            return False
            
        node_type = plugin.node_type
        
        if node_type in self.plugins:
            print(f"Warning: Plugin for node type '{node_type}' already registered. Overwriting.")
            
        self.plugins[node_type] = plugin
        return True
        
    def get_plugin_for_node(self, node):
        """
        Get the appropriate plugin for a node.
        
        Args:
            node (dict): Node data
            
        Returns:
            NodePlugin: Plugin for the node, or None if not found
        """
        node_type = node.get('type')
        return self.plugins.get(node_type)
        
    def handle_node(self, node, game_state):
        """
        Handle a node using the appropriate plugin.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Response data
        """
        plugin = self.get_plugin_for_node(node)
        
        if not plugin:
            return {'error': f"No plugin found for node type '{node.get('type')}'"}
            
        return plugin.handle_node(node, game_state)
        
    def get_client_data_for_node(self, node, game_state):
        """
        Get client data for a node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Client data
        """
        plugin = self.get_plugin_for_node(node)
        
        if not plugin:
            return {
                'type': node.get('type', 'unknown'),
                'description': f"Unknown node type: {node.get('type')}",
                'state': {},
                'metadata': node.get('metadata', {})
            }
            
        return plugin.get_client_data(node, game_state)

# Standard node plugin implementations

class QuestionNodePlugin(NodePlugin):
    """Plugin for question nodes."""
    
    def __init__(self):
        """Initialize a question node plugin."""
        super().__init__('question_plugin', 'question')
        
    def handle_node(self, node, game_state):
        """
        Handle a question node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Response data with question
        """
        # Get question from metadata or generate a new one
        question = None
        if 'question_id' in node.get('metadata', {}):
            question_id = node['metadata']['question_id']
            # Logic to get a specific question would go here
        else:
            question = get_question_for_node(node.get('metadata', {}))
            
        if not question:
            return {'error': 'Failed to get question for node'}
            
        return {
            'success': True,
            'node_type': 'question',
            'question': question.to_dict(include_answer=False)
        }
        
    def get_node_description(self, node, game_state):
        """
        Get description for a question node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            str: Node description
        """
        metadata = node.get('metadata', {})
        difficulty = metadata.get('difficulty', 'medium').capitalize()
        category = metadata.get('category', 'general')
        
        return f"A {difficulty} difficulty question about {category}"

class RestNodePlugin(NodePlugin):
    """Plugin for rest nodes."""
    
    def __init__(self):
        """Initialize a rest node plugin."""
        super().__init__('rest_plugin', 'rest')
        
    def handle_node(self, node, game_state):
        """
        Handle a rest node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Response data with healing result
        """
        if not game_state.character:
            return {'error': 'No character in game state'}
            
        # Calculate healing amount
        heal_percentage = node.get('metadata', {}).get('heal_percentage', 30)
        max_hp = game_state.character.max_hp
        heal_amount = int(max_hp * (heal_percentage / 100))
        
        # Apply healing
        old_hp = game_state.character.current_hp
        new_hp = game_state.character.heal(heal_amount)
        
        return {
            'success': True,
            'node_type': 'rest',
            'old_hp': old_hp,
            'new_hp': new_hp,
            'heal_amount': new_hp - old_hp
        }
        
    def get_node_description(self, node, game_state):
        """
        Get description for a rest node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            str: Node description
        """
        heal_percentage = node.get('metadata', {}).get('heal_percentage', 30)
        return f"A rest area where you can recover {heal_percentage}% of your health"

class TreasureNodePlugin(NodePlugin):
    """Plugin for treasure nodes."""
    
    def __init__(self):
        """Initialize a treasure node plugin."""
        super().__init__('treasure_plugin', 'treasure')
        
    def handle_node(self, node, game_state):
        """
        Handle a treasure node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Response data with treasure result
        """
        # Get item from metadata or generate a random one
        item = None
        if 'item_id' in node.get('metadata', {}):
            item_id = node['metadata']['item_id']
            # Logic to get a specific item would go here
        else:
            item = get_random_item()
            
        if not item:
            return {'error': 'Failed to get item for treasure node'}
            
        # Add item to inventory
        if game_state.character:
            game_state.character.add_item(item)
            
        return {
            'success': True,
            'node_type': 'treasure',
            'item': item
        }
        
    def get_node_description(self, node, game_state):
        """
        Get description for a treasure node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            str: Node description
        """
        return "A treasure chest containing a useful item"

class EventNodePlugin(NodePlugin):
    """Plugin for event nodes."""
    
    def __init__(self):
        """Initialize an event node plugin."""
        super().__init__('event_plugin', 'event')
        
    def handle_node(self, node, game_state):
        """
        Handle an event node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            dict: Response data with event result
        """
        # Get event from metadata or generate a random one
        event = None
        if 'event_id' in node.get('metadata', {}):
            event_id = node['metadata']['event_id']
            # Logic to get a specific event would go here
        else:
            event = get_random_event()
            
        if not event:
            return {'error': 'Failed to get event for node'}
            
        return {
            'success': True,
            'node_type': 'event',
            'event': event
        }
        
    def get_node_description(self, node, game_state):
        """
        Get description for an event node.
        
        Args:
            node (dict): Node data
            game_state (GameState): Current game state
            
        Returns:
            str: Node description
        """
        event_type = node.get('metadata', {}).get('event_type', 'random')
        return f"An event node with a {event_type} encounter"

# Global plugin manager instance
_plugin_manager = None

def get_plugin_manager():
    """
    Get the global plugin manager instance.
    
    Returns:
        PluginManager: Global plugin manager instance
    """
    global _plugin_manager
    if _plugin_manager is None:
        _plugin_manager = PluginManager()
        
        # Register default plugins
        _plugin_manager.register_plugin(QuestionNodePlugin())
        _plugin_manager.register_plugin(RestNodePlugin())
        _plugin_manager.register_plugin(TreasureNodePlugin())
        _plugin_manager.register_plugin(EventNodePlugin())
        
    return _plugin_manager