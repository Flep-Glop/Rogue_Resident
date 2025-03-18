// screen-transition.js - Simple transition system between game screens
// Save this to: medical_physics_game/static/js/screen-transition.js

const ScreenTransition = {
    // Configuration
    config: {
      duration: 3000,          // How long to show the transition screen
      fadeOutDuration: 1000,   // How long for the transition to fade out
      scanlineEffect: true     // Whether to include CRT scanline effect on transitions
    },
    
    // Current transition state
    state: {
      active: false
    },
    
    /**
     * Initialize the transition system
     */
    initialize: function() {
      console.log("Screen Transition System initialized");
      
      // Create transition container if it doesn't exist
      if (!document.getElementById('screen-transition-container')) {
        const container = document.createElement('div');
        container.id = 'screen-transition-container';
        container.style.display = 'none';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.backgroundColor = 'rgba(41, 47, 91, 0.95)';
        container.style.zIndex = '9000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.pointerEvents = 'none';
        
        document.body.appendChild(container);
      }
    },
    
    /**
     * Begin transition between screens
     * @param {Object} options - Transition options
     * @param {string} options.title - Main title to display
     * @param {string} options.subtitle - Optional subtitle
     * @param {string} options.description - Optional description text
     * @param {Function} options.onComplete - Callback when transition completes
     */
    beginTransition: function(options = {}) {
      this.state.active = true;
      
      // Default options
      const settings = {
        title: options.title || 'Loading...',
        subtitle: options.subtitle || '',
        description: options.description || '',
        onComplete: options.onComplete || function() {}
      };
      
      // Get or create container
      const container = document.getElementById('screen-transition-container');
      if (!container) {
        console.error("Transition container not found");
        return false;
      }
      
      container.innerHTML = '';
      
      // Create transition content
      const content = document.createElement('div');
      content.className = 'screen-transition-content';
      content.style.padding = '3rem';
      content.style.textAlign = 'center';
      content.style.color = '#d4dae0';
      
      // Add title and description
      content.innerHTML = `
        <h2 style="font-size: 2.5rem; color: #5b8dd9; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0px 0px 10px rgba(91, 141, 217, 0.6);">${settings.title}</h2>
        ${settings.subtitle ? `<h3 style="font-size: 1.5rem; color: #56b886; margin-bottom: 1.5rem; letter-spacing: 1px;">${settings.subtitle}</h3>` : ''}
        ${settings.description ? `<p style="font-size: 1rem; color: #d4dae0; max-width: 600px; margin: 0 auto;">${settings.description}</p>` : ''}
      `;
      
      // Add CRT effects if enabled
      if (this.config.scanlineEffect) {
        const scanlines = document.createElement('div');
        scanlines.className = 'transition-scanlines';
        scanlines.style.position = 'absolute';
        scanlines.style.top = '0';
        scanlines.style.left = '0';
        scanlines.style.width = '100%';
        scanlines.style.height = '100%';
        scanlines.style.background = 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.05) 50%)';
        scanlines.style.backgroundSize = '100% 4px';
        scanlines.style.zIndex = '-1';
        scanlines.style.pointerEvents = 'none';
        scanlines.style.opacity = '0.3';
        
        container.appendChild(scanlines);
      }
      
      // Add content to container
      container.appendChild(content);
      
      // Apply fade-in animation
      const keyframes = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      const style = document.createElement('style');
      style.innerHTML = keyframes;
      document.head.appendChild(style);
      
      content.style.opacity = '0';
      content.style.animation = 'fadeIn 0.5s forwards 0.2s';
      
      // Show the transition
      container.style.display = 'flex';
      
      // Trigger onComplete after duration
      setTimeout(() => {
        // Fade out
        container.style.transition = 'opacity 1s';
        container.style.opacity = '0';
        
        // Execute callback
        settings.onComplete();
        
        // Hide completely after animation
        setTimeout(() => {
          container.style.display = 'none';
          container.style.opacity = '1';
          container.style.transition = '';
          this.state.active = false;
        }, this.config.fadeOutDuration);
      }, this.config.duration);
      
      return true;
    },
    
    /**
     * Specific transition for entering the game
     * @param {Object} options - Additional options
     */
    transitionToGame: function(options = {}) {
      // Default floor info
      const floorNumber = options.floorNumber || 1;
      const floorName = options.floorName || 'Hospital Wing';
      const floorDescription = options.floorDescription || 'Your residency begins...';
      
      // Begin the transition
      this.beginTransition({
        title: `Floor ${floorNumber}`,
        subtitle: floorName,
        description: floorDescription,
        onComplete: options.onComplete || function() {}
      });
    },
    
    /**
     * Transition between floors
     * @param {number} floorNumber - The floor number to transition to
     * @param {string} floorName - The name of the floor
     * @param {string} description - Description of the floor
     * @param {Function} onComplete - Callback when transition completes
     */
    transitionToFloor: function(floorNumber, floorName, description, onComplete) {
      this.beginTransition({
        title: `Floor ${floorNumber}`,
        subtitle: floorName,
        description: description,
        onComplete: onComplete
      });
    }
  };
  
  // Export globally
  window.ScreenTransition = ScreenTransition;