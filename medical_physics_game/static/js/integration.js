// integration.js - Script to integrate all enhancements
// Save this to: medical_physics_game/static/js/integration.js

/**
 * GameIntegration - Ties together all visual enhancements and transitions
 * Provides a cohesive experience across game screens
 */
const GameIntegration = {
    // Configuration
    config: {
      enableBackgroundEffects: true,
      enableScreenTransitions: true,
      enableMapScaling: true,
      applyConsistentUI: true,
      debugMode: false
    },
    
    // Component states
    components: {
      backgroundEffects: false,
      screenTransitions: false,
      mapScaling: false,
      gameModeActive: false
    },
    
    /**
     * Initialize all enhancements
     * @param {Object} options - Configuration options
     */
    initialize: function(options = {}) {
      console.log("GameIntegration: Initializing visual enhancements...");
      
      // Merge options with defaults
      this.config = {...this.config, ...options};
      
      // Debug output if enabled
      if (this.config.debugMode) {
        console.log("GameIntegration config:", this.config);
      }
      
      // Setup CSS classes for UI consistency if enabled
      if (this.config.applyConsistentUI) {
        this.setupConsistentUI();
      }
      
      // Initialize screen transitions if enabled
      if (this.config.enableScreenTransitions && typeof ScreenTransition !== 'undefined') {
        ScreenTransition.initialize();
        this.components.screenTransitions = true;
        
        console.log("GameIntegration: Screen transitions initialized");
      }
      
      // Initialize background effects if enabled
      if (this.config.enableBackgroundEffects && typeof GameBackgroundEffects !== 'undefined') {
        // Initialize with game mode settings (subtle)
        GameBackgroundEffects.initialize({
          pixelCount: 20,
          opacity: 0.2,
          gameMode: true
        });
        this.components.backgroundEffects = true;
        
        console.log("GameIntegration: Background effects initialized");
      }
      
      // Initialize map scaling if enabled
      if (this.config.enableMapScaling && typeof MapScaling !== 'undefined') {
        MapScaling.initialize({
          autoScale: true,
          enhanceVisuals: true,
          scaleFactor: 1.2  // Slightly larger default scale
        });
        this.components.mapScaling = true;
        
        console.log("GameIntegration: Map scaling initialized");
      }
      
      // Add event listeners
      this.setupEventListeners();
      
      // Enhanced character select screen
      this.enhanceCharacterSelect();
      
      // Setup the appropriate mode based on current page
      this.detectAndSetupCurrentScreen();
      
      console.log("GameIntegration: All enhancements initialized");
      
      return true;
    },
    
    /**
     * Set up event listeners for game transitions
     */
    setupEventListeners: function() {
      // Listen to game events if EventSystem exists
      if (typeof EventSystem !== 'undefined') {
        // Game initialization completed
        EventSystem.on('GAME_INITIALIZED', () => {
          console.log("GameIntegration: Game initialized event received");
          this.setGameMode(true);
          
          // Force a map render update after a short delay
          setTimeout(() => {
            if (typeof MapRenderer !== 'undefined' && MapRenderer.renderMap) {
              MapRenderer.renderMap();
            }
          }, 500);
        });
        
        // Floor change
        EventSystem.on('FLOOR_CHANGED', (floorData) => {
          if (this.components.screenTransitions && typeof ScreenTransition !== 'undefined') {
            // Extract floor information
            const floorNumber = floorData.floor_number || floorData.level || 1;
            const floorName = floorData.name || `Level ${floorNumber}`;
            const description = floorData.description || "A new challenge awaits...";
            
            // Trigger floor transition
            ScreenTransition.transitionToFloor(floorNumber, floorName, description, () => {
              // Refresh background effects
              if (this.components.backgroundEffects && typeof GameBackgroundEffects !== 'undefined') {
                GameBackgroundEffects.updateConfig({
                  pixelCount: 20 + Math.min(floorNumber * 2, 20)  // More particles on higher floors
                });
              }
            });
          }
        });
      }
      
      // Button to start game from character select
      const startGameBtn = document.getElementById('start-game-btn');
      if (startGameBtn) {
        // Replace the default click handler with our enhanced version
        const originalClickHandler = startGameBtn.onclick;
        startGameBtn.onclick = (e) => {
          // Prevent immediate navigation
          e.preventDefault();
          
          // Get selected character
          const selectedCharacter = window.selectedCharacter || 
                                   document.querySelector('.character-card.selected')?.dataset?.characterId || 
                                   'resident';
          
          // Trigger transition animation
          if (this.components.screenTransitions && typeof ScreenTransition !== 'undefined') {
            ScreenTransition.transitionToGame({
              floorNumber: 1,
              floorName: "Hospital Wing",
              floorDescription: "Your residency begins...",
              onComplete: () => {
                // Execute original handler after animation
                if (typeof originalClickHandler === 'function') {
                  // Delay to allow animation to complete
                  setTimeout(() => {
                    originalClickHandler.call(startGameBtn, e);
                  }, 500);
                } else {
                  // Default fallback if no handler
                  setTimeout(() => {
                    this.startNewGame(selectedCharacter);
                  }, 500);
                }
              }
            });
            
            return false;
          }
          
          // If transitions not available, proceed normally
          if (typeof originalClickHandler === 'function') {
            return originalClickHandler.call(startGameBtn, e);
          } else {
            this.startNewGame(selectedCharacter);
            return false;
          }
        };
      }
    },
    
    /**
     * Detect and setup the current screen based on URL
     */
    detectAndSetupCurrentScreen: function() {
      const path = window.location.pathname;
      
      if (path.includes('/game')) {
        // Main game screen
        this.setGameMode(true);
      } else if (path.includes('/character-select') || path.includes('/select')) {
        // Character selection screen
        this.setMenuMode('character-select');
      } else {
        // Assume landing page / main menu
        this.setMenuMode('main-menu');
      }
    },
    
    /**
     * Enhance character select screen
     */
    enhanceCharacterSelect: function() {
      // Check if we're on the character select screen
      const characterCarousel = document.getElementById('character-carousel');
      if (!characterCarousel) return;
      
      // Add enhanced styling for character cards
      const cards = document.querySelectorAll('.character-card');
      cards.forEach(card => {
        card.classList.add('pixel-corners');
        
        // Add subtle animation to character images
        const characterImg = card.querySelector('.pixel-character-img');
        if (characterImg) {
          characterImg.classList.add('pixel-bobbing');
        }
        
        // Add glow effect to stats bars
        const statBars = card.querySelectorAll('.stat-bar');
        statBars.forEach(bar => {
          bar.style.boxShadow = '0 0 5px currentColor';
        });
      });
      
      // Enhance selection indicators
      const indicators = document.querySelectorAll('.carousel-indicator');
      indicators.forEach(indicator => {
        indicator.style.transition = 'all 0.3s ease';
        indicator.addEventListener('mouseenter', () => {
          indicator.style.transform = 'scale(1.2)';
        });
        
        indicator.addEventListener('mouseleave', () => {
          if (!indicator.classList.contains('active') && 
              !indicator.classList.contains('selected')) {
            indicator.style.transform = 'scale(1)';
          }
        });
      });
    },
    
    /**
     * Set up consistent UI elements
     */
    setupConsistentUI: function() {
      // Create style element for custom CSS
      const style = document.createElement('style');
      style.id = 'game-integration-styles';
      style.textContent = `
        /* Game integration specific overrides */
        .pixel-container {
          overflow: hidden;
        }
        
        /* Ensure map container has consistent styling */
        .map-container {
          position: relative;
          margin-bottom: 20px;
          border: 2px solid var(--primary);
          border-radius: var(--border-radius-md);
          background-color: var(--background-alt);
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }
        
        /* Screen transition container */
        #screen-transition-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(41, 47, 91, 0.95);
          z-index: 9000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          pointer-events: none;
        }
        
        /* Transitions and animations */
        .slide-in-left {
          animation: slide-in-left 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        
        .fade-in-scale {
          animation: fade-in-scale 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        
        @keyframes slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fade-in-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          #floor-map {
            min-height: 300px;
          }
        }
      `;
      
      // Add to document
      document.head.appendChild(style);
    },
    
    /**
     * Set game mode - subtle effects for gameplay
     * @param {boolean} isGame - Whether we're in game mode
     */
    setGameMode: function(isGame) {
      // Mark as game mode
      this.components.gameModeActive = isGame;
      
      // Update background effects
      if (this.components.backgroundEffects && typeof GameBackgroundEffects !== 'undefined') {
        GameBackgroundEffects.setMenuMode(!isGame);
      }
      
      // Enhance character panel animations
      if (isGame) {
        const character = document.querySelector('.character-avatar-container');
        if (character) {
          character.classList.add('enhanced-character');
        }
        
        // Add slight delay to inventory appearance for staggered animation
        const inventory = document.getElementById('inventory-container');
        if (inventory) {
          inventory.style.animationDelay = '0.2s';
        }
      }
    },
    
    /**
     * Set menu mode - more visual effects for menus
     * @param {string} menuType - Type of menu
     */
    setMenuMode: function(menuType) {
      // Mark as not in game mode
      this.components.gameModeActive = false;
      
      // Update background effects
      if (this.components.backgroundEffects && typeof GameBackgroundEffects !== 'undefined') {
        GameBackgroundEffects.setMenuMode(true);
        
        // Different settings for different menu types
        if (menuType === 'main-menu') {
          GameBackgroundEffects.updateConfig({
            pixelCount: 60,
            opacity: 0.7,
            speedMultiplier: 0.8
          });
        } else if (menuType === 'character-select') {
          GameBackgroundEffects.updateConfig({
            pixelCount: 40,
            opacity: 0.5,
            speedMultiplier: 0.6
          });
        }
      }
    },
    
    /**
     * Fallback method to start a new game
     * @param {string} characterId - Character ID to use
     */
    startNewGame: function(characterId) {
      fetch('/api/new-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character_id: characterId }),
      })
      .then(response => response.json())
      .then(data => {
        // Redirect to the game page
        window.location.href = '/game';
      })
      .catch(error => console.error('Error starting new game:', error));
    }
  };
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize with default settings
    GameIntegration.initialize();
  });
  
  // Export globally
  window.GameIntegration = GameIntegration;