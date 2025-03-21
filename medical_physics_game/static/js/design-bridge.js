// design-bridge.js - Bridge between CSS variables and JavaScript components
// This centralizes access to design values for consistent styling

/**
 * DesignBridge - Singleton for accessing CSS design tokens in JavaScript
 * Provides a single source of truth for colors, spacing, animations, etc.
 */
const DesignBridge = {
    // Cache for variables to avoid constant DOM access
    _cache: {},
    
    // Callback registry for theme change notifications
    _listeners: [],
    
    // Initialization
    initialize: function() {
      console.log("Initializing design bridge...");
      
      // Initial load of all design tokens
      this.refreshAllTokens();
      
      // Set up observer for theme changes if needed in the future
      this._setupThemeChangeDetection();
      
      // Make colors and tokens globally available
      window.gameDesign = {
        colors: this.colors,
        spacing: this.spacing,
        animation: this.animation,
        shadows: this.shadows,
        borderRadius: this.borderRadius
      };
      
      // Update existing components that need design tokens
      this._updateComponents();
      
      return this;
    },
    
    // Get a CSS variable value
    getVariable: function(name, defaultValue = null) {
      // Check cache first
      if (this._cache[name]) {
        return this._cache[name];
      }
      
      // Get the computed style
      const styles = getComputedStyle(document.documentElement);
      const value = styles.getPropertyValue(name).trim();
      
      // Cache the result
      this._cache[name] = value || defaultValue;
      
      return this._cache[name];
    },
    
    // Get a numeric value from a CSS variable (strip units)
    getNumericValue: function(name, defaultValue = 0) {
      const value = this.getVariable(name, defaultValue);
      // Extract number from string like "10px" or "1.5rem"
      const numericValue = parseFloat(value);
      return isNaN(numericValue) ? defaultValue : numericValue;
    },
    
    // Convert hex to rgba for transparency support
    hexToRgba: function(hex, alpha = 1) {
      // Check cache
      const cacheKey = `${hex}-${alpha}`;
      if (this._cache[cacheKey]) {
        return this._cache[cacheKey];
      }
      
      // Process hex string
      let r, g, b;
      if (hex.startsWith('#')) {
        hex = hex.substring(1);
      }
      
      if (hex.length === 3) {
        r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
        g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
      } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      
      // Create rgba string
      const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      
      // Cache the result
      this._cache[cacheKey] = rgba;
      
      return rgba;
    },
    
    // Subscribe to design token changes
    subscribe: function(callback) {
      if (typeof callback === 'function' && !this._listeners.includes(callback)) {
        this._listeners.push(callback);
        return true;
      }
      return false;
    },
    
    // Unsubscribe from design token changes
    unsubscribe: function(callback) {
      const index = this._listeners.indexOf(callback);
      if (index !== -1) {
        this._listeners.splice(index, 1);
        return true;
      }
      return false;
    },
    
    // Refresh all design tokens from CSS
    refreshAllTokens: function() {
      // Clear cache to ensure fresh values
      this._cache = {};
      
      // Load color values
      this.colors = {
        // Core colors
        primary: this.getVariable('--primary'),
        primaryDark: this.getVariable('--primary-dark'),
        secondary: this.getVariable('--secondary'),
        secondaryDark: this.getVariable('--secondary-dark'),
        danger: this.getVariable('--danger'),
        dangerDark: this.getVariable('--danger-dark'),
        warning: this.getVariable('--warning'),
        warningDark: this.getVariable('--warning-dark'),
        
        // Background colors
        background: this.getVariable('--background'),
        backgroundAlt: this.getVariable('--background-alt'),
        dark: this.getVariable('--dark'),
        darkAlt: this.getVariable('--dark-alt'),
        
        // Text colors
        text: this.getVariable('--text'),
        textDark: this.getVariable('--text-dark'),
        textLight: this.getVariable('--text-light'),
        
        // Node colors
        nodeStart: this.getVariable('--node-start'),
        nodeBoss: this.getVariable('--node-boss'),
        nodeQuestion: this.getVariable('--node-question'),
        nodeElite: this.getVariable('--node-elite'),
        nodeEliteDark: this.getVariable('--node-elite-dark'),
        nodeTreasure: this.getVariable('--node-treasure'),
        nodeRest: this.getVariable('--node-rest'),
        nodeRestDark: this.getVariable('--node-rest-dark'),
        nodeShop: this.getVariable('--node-shop'),
        nodeShopDark: this.getVariable('--node-shop-dark'),
        nodeEvent: this.getVariable('--node-event'),
        nodeEventDark: this.getVariable('--node-event-dark'),
        nodeGamble: this.getVariable('--node-gamble'),
        nodeGambleDark: this.getVariable('--node-gamble-dark'),
        nodePatientCase: this.getVariable('--node-patient-case'),
        nodePatientCaseDark: this.getVariable('--node-patient-case-dark'),
        
        // Rarity colors
        rarityCommon: this.getVariable('--rarity-common'),
        rarityUncommon: this.getVariable('--rarity-uncommon'),
        rarityRare: this.getVariable('--rarity-rare'),
        rarityEpic: this.getVariable('--rarity-epic'),
        
        // Helper function to get transparent version of any color
        withAlpha: (colorName, alpha) => {
          const hexColor = this.colors[colorName];
          if (!hexColor) return null;
          return this.hexToRgba(hexColor, alpha);
        }
      };
      
      // Load spacing values
      this.spacing = {
        xs: this.getNumericValue('--spacing-xs'),
        sm: this.getNumericValue('--spacing-sm'),
        md: this.getNumericValue('--spacing-md'),
        lg: this.getNumericValue('--spacing-lg'),
        xl: this.getNumericValue('--spacing-xl'),
        xxl: this.getNumericValue('--spacing-xxl')
      };
      
      // Load border radius values
      this.borderRadius = {
        xs: this.getNumericValue('--border-radius-xs'),
        sm: this.getNumericValue('--border-radius-sm'),
        md: this.getNumericValue('--border-radius-md'),
        lg: this.getNumericValue('--border-radius-lg'),
        xl: this.getNumericValue('--border-radius-xl')
      };
      
      // Load animation durations
      this.animation = {
        fast: this.getVariable('--transition-fast'),
        medium: this.getVariable('--transition-medium'),
        slow: this.getVariable('--transition-slow'),
        short: this.getVariable('--animation-short'),
        medium: this.getVariable('--animation-medium'),
        long: this.getVariable('--animation-long')
      };
      
      // Load shadow values
      this.shadows = {
        sm: this.getVariable('--shadow-sm'),
        md: this.getVariable('--shadow-md'),
        lg: this.getVariable('--shadow-lg'),
        xl: this.getVariable('--shadow-xl'),
        
        innerSm: this.getVariable('--shadow-inner-sm'),
        innerMd: this.getVariable('--shadow-inner-md'),
        innerLg: this.getVariable('--shadow-inner-lg'),
        
        glowPrimary: this.getVariable('--glow-primary'),
        glowSecondary: this.getVariable('--glow-secondary'),
        glowDanger: this.getVariable('--glow-danger'),
        glowWarning: this.getVariable('--glow-warning')
      };
      
      // Notify all listeners of the update
      this._notifyListeners();
      
      return this;
    },
    
    // Set up detection for theme changes
    _setupThemeChangeDetection: function() {
      // This is a placeholder for future theme switching functionality
      // For now, it does nothing as theme changes aren't implemented yet
      
      // For future use, we could use a MutationObserver to watch for class/style changes
      // on the root element or a theme toggle switch event
    },
    
    // Notify all listeners of design token changes
    _notifyListeners: function() {
      this._listeners.forEach(callback => {
        try {
          callback(this);
        } catch (error) {
          console.error("Error in design bridge listener:", error);
        }
      });
    },
    
    // Update existing components with design tokens
    _updateComponents: function() {
      // Update PixelBackgroundGenerator
      if (window.PixelBackgroundGenerator) {
        window.PixelBackgroundGenerator.config.baseColors = [
          this.colors.primary,
          this.colors.secondary,
          this.colors.warning,
          this.colors.danger,
          this.colors.nodeRest,
          this.colors.nodeEvent,
          this.colors.nodePatientCase,
          '#ffffff' // Keep white for contrast
        ];
        
        // If pixel background is already initialized, refresh it
        if (window.PixelBackgroundGenerator.refresh) {
          window.PixelBackgroundGenerator.refresh();
        }
      }
      
      // For future components that need design tokens
      if (window.EventSystem) {
        EventSystem.emit('designTokensUpdated', this);
      }
    },
    
    // Generate an array of colors based on node types
    getNodeTypeColors: function() {
      return [
        this.colors.nodeQuestion,
        this.colors.nodeElite,
        this.colors.nodeTreasure,
        this.colors.nodeRest,
        this.colors.nodeShop,
        this.colors.nodeEvent,
        this.colors.nodeGamble,
        this.colors.nodePatientCase
      ];
    },
    // Add this to your existing design-bridge.js
    applyUnifiedStyling: function() {
      // Apply to all key containers
      const containers = document.querySelectorAll('.character-stats, .map-container, .inventory-container, .node-modal-content');
      
      // Apply unified styling class
      containers.forEach(container => {
        container.classList.add('unified-background');
      });
      
      // Apply to the game board container too
      const gameBoard = document.getElementById('game-board-container');
      if (gameBoard) {
        gameBoard.classList.add('game-board-unified');
      }
      
      // Apply to modals
      document.addEventListener('DOMNodeInserted', function(event) {
        if (event.target.id === 'node-modal-content' || 
            event.target.classList && event.target.classList.contains('node-modal-content')) {
          event.target.classList.add('unified-background');
        }
      });
      
      console.log("Applied unified styling to game components");
    },
    // Get color by node type
    getNodeTypeColor: function(type) {
      const typeKey = `node${type.charAt(0).toUpperCase() + type.slice(1)}`;
      return this.colors[typeKey] || this.colors.dark;
    },
    
    // Generate CSS color variations for JavaScript components
    generateColorVariations: function(baseColor, steps = 5) {
      const variations = [];
      
      // Convert hex to RGB
      let r, g, b;
      if (baseColor.startsWith('#')) {
        baseColor = baseColor.substring(1);
      }
      
      if (baseColor.length === 3) {
        r = parseInt(baseColor.charAt(0) + baseColor.charAt(0), 16);
        g = parseInt(baseColor.charAt(1) + baseColor.charAt(1), 16);
        b = parseInt(baseColor.charAt(2) + baseColor.charAt(2), 16);
      } else {
        r = parseInt(baseColor.substring(0, 2), 16);
        g = parseInt(baseColor.substring(2, 4), 16);
        b = parseInt(baseColor.substring(4, 6), 16);
      }
      
      // Generate lighter and darker variations
      for (let i = 0; i < steps; i++) {
        // Lighter variations (add white)
        const lightFactor = i / steps;
        const rLight = Math.min(255, Math.round(r + (255 - r) * lightFactor));
        const gLight = Math.min(255, Math.round(g + (255 - g) * lightFactor));
        const bLight = Math.min(255, Math.round(b + (255 - b) * lightFactor));
        
        // Darker variations (add black)
        const darkFactor = i / steps;
        const rDark = Math.max(0, Math.round(r * (1 - darkFactor)));
        const gDark = Math.max(0, Math.round(g * (1 - darkFactor)));
        const bDark = Math.max(0, Math.round(b * (1 - darkFactor)));
        
        // Convert back to hex
        const lightHex = `#${rLight.toString(16).padStart(2, '0')}${gLight.toString(16).padStart(2, '0')}${bLight.toString(16).padStart(2, '0')}`;
        const darkHex = `#${rDark.toString(16).padStart(2, '0')}${gDark.toString(16).padStart(2, '0')}${bDark.toString(16).padStart(2, '0')}`;
        
        variations.push({ light: lightHex, dark: darkHex });
      }
      
      return variations;
    }
  };
  
  // Export globally
  window.DesignBridge = DesignBridge;