# node_plugins.py - Plugin system for node types
import json
import os
import importlib
from functools import lru_cache

class NodeTypePlugin:
    """Base class for node type plugins"""
    def __init__(self, type_id, display_name, weight):
        self.type_id = type_id
        self.display_name = display_name
        self.weight = weight
        
    def process_node_data(self, node):
        """Process node data - can be overridden by specific plugins"""
        return node
        
    def get_node_content(self, node):
        """Get content for a node - can be overridden by specific plugins"""
        return None

# Registry for node type plugins
node_plugins = {}

# Register a node type plugin
def register_node_plugin(plugin):
    """Register a node type plugin"""
    if not isinstance(plugin, NodeTypePlugin):
        raise TypeError("Plugin must be an instance of NodeTypePlugin")
    
    node_plugins[plugin.type_id] = plugin
    return plugin  # Allow chaining

# Get a node type plugin
def get_node_plugin(node_type):
    """Get a node type plugin by type ID"""
    if node_type not in node_plugins:
        raise ValueError(f"No plugin registered for node type: {node_type}")
    return node_plugins[node_type]

# Process a node using its plugin
def process_node_with_plugin(node):
    """Process a node using its registered plugin"""
    if not node or 'type' not in node:
        return node
    
    node_type = node['type']
    
    try:
        plugin = get_node_plugin(node_type)
        return plugin.process_node_data(node)
    except ValueError:
        # No plugin found, return node as is
        return node

@lru_cache(maxsize=1)
def load_node_types():
    """Load node types configuration from JSON"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    node_types_path = os.path.join(base_dir, 'data', 'node_types.json')
    
    try:
        with open(node_types_path, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading node types: {e}")
        return {"types": []}

def initialize_plugins():
    """Initialize all node type plugins from configuration"""
    node_types_data = load_node_types()
    
    for type_data in node_types_data.get('types', []):
        # Create a basic plugin for each type
        plugin = NodeTypePlugin(
            type_id=type_data.get('id'),
            display_name=type_data.get('displayName'),
            weight=type_data.get('weight', 0)
        )
        
        # Register the plugin
        register_node_plugin(plugin)
    
    # Try to load custom plugin implementations from plugins directory
    plugins_dir = os.path.join(os.path.dirname(__file__), 'plugins')
    if os.path.exists(plugins_dir) and os.path.isdir(plugins_dir):
        # Import all Python files in plugins directory
        for filename in os.listdir(plugins_dir):
            if filename.endswith('.py') and filename != '__init__.py':
                module_name = filename[:-3]  # Remove .py extension
                try:
                    # Import the module
                    importlib.import_module(f'plugins.{module_name}')
                except ImportError as e:
                    print(f"Error importing plugin module {module_name}: {e}")

# Create a basic plugin directory and __init__.py for future plugin implementations
def setup_plugin_directory():
    """Set up plugin directory structure"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    plugins_dir = os.path.join(base_dir, 'plugins')
    
    # Create plugins directory if it doesn't exist
    if not os.path.exists(plugins_dir):
        os.makedirs(plugins_dir)
    
    # Create __init__.py if it doesn't exist
    init_file = os.path.join(plugins_dir, '__init__.py')
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write('# plugins package')

# Initialize on import
setup_plugin_directory()