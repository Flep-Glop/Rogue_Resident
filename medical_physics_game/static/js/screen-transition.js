// screen-transition.js - Enhanced transition system between game screens
// Save this to: medical_physics_game/static/js/screen-transition.js

const ScreenTransition = {
    // Configuration
    config: {
      duration: 3000,          // How long to show the transition screen
      fadeOutDuration: 1000,   // How long for the transition to fade out
      animationDelay: 100,     // Delay before starting animations
      scanlineEffect: true     // Whether to include CRT scanline effect on transitions
    },
    
    // Current transition state
    state: {
      active: false,
      currentScreen: null,
      targetScreen: null
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
        document.body.appendChild(container);
      }
      
      // Listen for transition events if EventSystem exists
      if (typeof EventSystem !== 'undefined') {
        EventSystem.on('TRANSITION_REQUESTED', this.beginTransition.bind(this));
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
        fromScreen: options.fromScreen || 'unknown',
        toScreen: options.toScreen || 'unknown',
        onComplete: options.onComplete || function() {}
      };
      
      this.state.currentScreen = settings.fromScreen;
      this.state.targetScreen = settings.toScreen;
      
      console.log(`Transitioning from ${settings.fromScreen} to ${settings.toScreen}`);
      
      // Get or create container
      const container = document.getElementById('screen-transition-container');
      container.innerHTML = '';
      
      // Create transition content
      const content = document.createElement('div');
      content.className = 'screen-transition-content';
      
      // Add title and description
      content.innerHTML = `
        <h2 class="transition-title">${settings.title}</h2>
        ${settings.subtitle ? `<h3 class="transition-subtitle">${settings.subtitle}</h3>` : ''}
        ${settings.description ? `<p class="transition-description">${settings.description}</p>` : ''}
      `;
      
      // Add CRT effects if enabled
      if (this.config.scanlineEffect) {
        const scanlines = document.createElement('div');
        scanlines.className = 'transition-scanlines';
        container.appendChild(scanlines);
      }
      
      // Add content to container
      container.appendChild(content);
      
      // Show the transition
      container.style.display = 'flex';
      container.style.animation = 'floor-transition 0.5s forwards';
      
      // Trigger onComplete after duration
      setTimeout(() => {
        container.style.animation = 'floor-transition-out 1s forwards';
        
        // Execute callback
        settings.onComplete();
        
        // Hide completely after animation
        setTimeout(() => {
          container.style.display = 'none';
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
        fromScreen: 'character-select',
        toScreen: 'game',
        onComplete: () => {
          // Animate character panel sliding in
          const charPanel = document.querySelector('.character-stats');
          if (charPanel) {
            charPanel.classList.add('slide-in-left');
          }
          
          // Animate map container
          const mapContainer = document.querySelector('.map-container');
          if (mapContainer) {
            mapContainer.classList.add('fade-in-scale');
          }
          
          // Animate inventory
          const inventoryContainer = document.querySelector('#inventory-container');
          if (inventoryContainer) {
            inventoryContainer.classList.add('slide-in-left');
            inventoryContainer.style.animationDelay = '0.2s';
          }
          
          // Initialize background particles
          if (typeof GameBackgroundEffects !== 'undefined') {
            GameBackgroundEffects.initialize({
              targetElement: 'floor-map',
              pixelCount: 30,
              opacity: 0.4
            });
          }
          
          // Call original onComplete if provided
          if (options.onComplete && typeof options.onComplete === 'function') {
            options.onComplete();
          }
        }
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
        fromScreen: 'game',
        toScreen: 'game',
        onComplete: onComplete
      });
    }
  };
  
  // Export globally
  window.ScreenTransition = ScreenTransition;