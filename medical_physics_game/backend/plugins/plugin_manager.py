# backend/plugins/plugin_manager.py
import importlib
import inspect
import os
import sys
from .base_plugin import BasePlugin

class PluginManager:
    def __init__(self):
        self.plugins = {}  # plugin_id -> plugin_instance
        self.event_listeners = {}  # event_type -> [plugin_id]
        
    def load_all_plugins(self):
        """Load all plugins from the plugins directory"""
        plugins_dir = os.path.dirname(__file__)
        plugin_files = [f for f in os.listdir(plugins_dir) 
                       if f.endswith('_plugin.py') and f != 'base_plugin.py']
        
        for plugin_file in plugin_files:
            module_name = plugin_file[:-3]  # Remove .py extension
            try:
                # Import module
                plugin_module = importlib.import_module(f"backend.plugins.{module_name}")
                
                # Find plugin classes in module
                for name, obj in inspect.getmembers(plugin_module):
                    if (inspect.isclass(obj) and issubclass(obj, BasePlugin) and 
                        obj is not BasePlugin and hasattr(obj, 'id')):
                        self.register_plugin(obj)
                        
            except Exception as e:
                print(f"Error loading plugin {module_name}: {e}")
                
    def register_plugin(self, plugin_class):
        """Register a plugin class"""
        if not plugin_class.id:
            print(f"Plugin class {plugin_class.__name__} missing ID")
            return False
            
        if plugin_class.id in self.plugins:
            print(f"Plugin with ID {plugin_class.id} already registered")
            return False
            
        try:
            # Create instance
            plugin = plugin_class(self)
            
            # Initialize plugin
            plugin.initialize()
            
            # Store plugin
            self.plugins[plugin_class.id] = plugin
            
            print(f"Registered plugin: {plugin_class.name} v{plugin_class.version}")
            return True
        except Exception as e:
            print(f"Error registering plugin {plugin_class.__name__}: {e}")
            return False
            
    def enable_plugin(self, plugin_id):
        """Enable a specific plugin"""
        if plugin_id not in self.plugins:
            return False
            
        plugin = self.plugins[plugin_id]
        plugin.enable()
        return True
        
    def disable_plugin(self, plugin_id):
        """Disable a specific plugin"""
        if plugin_id not in self.plugins:
            return False
            
        plugin = self.plugins[plugin_id]
        plugin.disable()
        return True
        
    def register_event_listener(self, plugin_id, event_type):
        """Register a plugin as a listener for an event type"""
        if plugin_id not in self.plugins:
            return False
            
        if event_type not in self.event_listeners:
            self.event_listeners[event_type] = []
            
        if plugin_id not in self.event_listeners[event_type]:
            self.event_listeners[event_type].append(plugin_id)
            
        return True
        
    def unregister_event_listener(self, plugin_id, event_type):
        """Unregister a plugin as a listener for an event type"""
        if (event_type not in self.event_listeners or 
            plugin_id not in self.event_listeners[event_type]):
            return False
            
        self.event_listeners[event_type].remove(plugin_id)
        return True
        
    def fire_event(self, event_type, event_data=None):
        """Fire an event to all registered listeners"""
        if event_type not in self.event_listeners:
            return []
            
        results = []
        for plugin_id in self.event_listeners[event_type]:
            if plugin_id in self.plugins and self.plugins[plugin_id].enabled:
                plugin = self.plugins[plugin_id]
                
                # Check if plugin has a handler for this event
                handler_name = f"on_{event_type}"
                if hasattr(plugin, handler_name) and callable(getattr(plugin, handler_name)):
                    try:
                        result = getattr(plugin, handler_name)(event_data)
                        results.append(result)
                    except Exception as e:
                        print(f"Error in plugin {plugin_id} handling event {event_type}: {e}")
                        
        return results
        
    def get_plugin(self, plugin_id):
        """Get a plugin by ID"""
        return self.plugins.get(plugin_id)
        
    def get_all_plugins(self):
        """Get all registered plugins"""
        return list(self.plugins.values())
        
    def get_enabled_plugins(self):
        """Get all enabled plugins"""
        return [p for p in self.plugins.values() if p.enabled]