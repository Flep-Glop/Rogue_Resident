// boss_layout_manager.js - Controls boss-specific layout changes

const BossLayoutManager = {
    // Track if boss mode is active
    isActive: false,
    
    // Enable boss mode layout
    activate: function() {
      console.log("🔍 Activating boss layout mode");
      
      // Skip if already active
      if (this.isActive) return;
      
      // Add boss mode class to body
      document.body.classList.add('boss-mode-active');
      
      // Store the original container widths for restoration
      if (!this._originalStyles) {
        this._storeOriginalStyles();
      }
      
      // Set flag
      this.isActive = true;
      
      // Emit event so other components can adapt
      if (typeof EventSystem !== 'undefined') {
        EventSystem.emit('BOSS_MODE_ACTIVATED', {});
      }
      
      return this;
    },
    
    // Disable boss mode layout (restore normal layout)
    deactivate: function() {
      console.log("🔍 Deactivating boss layout mode");
      
      // Skip if not active
      if (!this.isActive) return;
      
      // Remove boss mode class from body
      document.body.classList.remove('boss-mode-active');
      
      // Set flag
      this.isActive = false;
      
      // Emit event so other components can adapt
      if (typeof EventSystem !== 'undefined') {
        EventSystem.emit('BOSS_MODE_DEACTIVATED', {});
      }
      
      return this;
    },
    
    // Store original container styles before modifications
    _storeOriginalStyles: function() {
      this._originalStyles = {
        container: this._getComputedStyle('.container', 'max-width'),
        gameBoard: this._getComputedStyle('.game-board-container', 'max-width'),
        nodeModal: this._getComputedStyle('#node-modal-overlay', 'width')
      };
      console.log("Stored original styles:", this._originalStyles);
    },
    
    // Helper to get computed style
    _getComputedStyle: function(selector, property) {
      const element = document.querySelector(selector);
      if (!element) return null;
      
      return window.getComputedStyle(element).getPropertyValue(property);
    },
    
    // Load CSS file if not already loaded
    loadBossStyles: function() {
      if (document.getElementById('boss-container-styles')) {
        return; // Already loaded
      }
      
      // Create link element
      const link = document.createElement('link');
      link.id = 'boss-container-styles';
      link.rel = 'stylesheet';
      link.href = '/static/css/components/boss_container.css';
      
      // Add to document head
      document.head.appendChild(link);
      console.log("Boss container styles loaded");
      
      return this;
    }
  };
  
  // Initialize and export
  if (typeof window !== 'undefined') {
    window.BossLayoutManager = BossLayoutManager;
    
    // Auto-initialize when document is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // Document already loaded
      BossLayoutManager.loadBossStyles();
    } else {
      // Wait for document to load
      document.addEventListener('DOMContentLoaded', function() {
        BossLayoutManager.loadBossStyles();
      });
    }
    
    // Listen for route changes or node navigation
    if (typeof EventSystem !== 'undefined') {
      // Handle node navigation
      EventSystem.on('NODE_VISITED', function(data) {
        // Check if the node is a boss node
        if (data && (data.type === 'boss' || (data.node && data.node.type === 'boss'))) {
          BossLayoutManager.activate();
        } else {
          BossLayoutManager.deactivate();
        }
      });
    }
  }
  
  // For module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BossLayoutManager;
  }