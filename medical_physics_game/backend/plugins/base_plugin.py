# backend/plugins/base_plugin.py
class BasePlugin:
    """Base class for all plugins"""
    
    # Plugin metadata
    id = None
    name = None
    version = None
    description = None
    author = None
    
    def __init__(self, plugin_manager=None):
        self.plugin_manager = plugin_manager
        self.enabled = False
        self.config = {}
        
    def initialize(self):
        """Initialize the plugin - called when plugin is loaded"""
        pass
        
    def enable(self):
        """Enable the plugin"""
        if not self.enabled:
            self.on_enable()
            self.enabled = True
        
    def disable(self):
        """Disable the plugin"""
        if self.enabled:
            self.on_disable()
            self.enabled = False
        
    def on_enable(self):
        """Called when the plugin is enabled"""
        pass
        
    def on_disable(self):
        """Called when the plugin is disabled"""
        pass
        
    def configure(self, config):
        """Configure the plugin with settings"""
        self.config = config
        self.on_configure(config)
        
    def on_configure(self, config):
        """Called when the plugin is configured"""
        pass
        
    @classmethod
    def get_metadata(cls):
        """Get plugin metadata"""
        return {
            'id': cls.id,
            'name': cls.name,
            'version': cls.version,
            'description': cls.description,
            'author': cls.author
        }