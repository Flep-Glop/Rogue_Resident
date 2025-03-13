// component_utils.js - Shared utilities for component implementation

const ComponentUtils = {
  // Create a standard component object with required methods
  createComponent: function(typeId, config = {}) {
    // Basic component structure
    const component = {
      // Type this component handles
      typeId: typeId,
      
      // Component state - only for UI rendering, not game data
      uiState: {},
      
      // Initialize component (called once at startup)
      initialize: config.initialize || function() {
        console.log(`Initializing ${typeId} component`);
      },
      
      // Render node data into a container
      render: config.render || function(nodeData, container) {
        container.innerHTML = `
          <h3>${nodeData.title || NodeRegistry.getNodeType(typeId).displayName}</h3>
          <p>This is a ${typeId} node.</p>
          <button id="${typeId}-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        
        // Add continue button handler
        const continueBtn = document.getElementById(`${typeId}-continue-btn`);
        if (continueBtn) {
          continueBtn.addEventListener('click', () => {
            this.handleAction(nodeData, 'continue');
          });
        }
      },
      
      // Handle user actions
      handleAction: config.handleAction || function(nodeData, action, data) {
        console.log(`${typeId} component handling action: ${action}`, data);
        
        if (action === 'continue') {
          // Complete the node
          this.completeNode(nodeData);
        }
      },
      
      // Standard node completion
      completeNode: function(nodeData) {
        if (GameState && GameState.data && GameState.data.currentNode) {
          GameState.completeNode(nodeData.id)
            .catch(error => {
              ErrorHandler.handleError(
                error, 
                `Node Completion (${typeId})`, 
                ErrorHandler.SEVERITY.WARNING
              );
              
              // Try to return to map view as fallback
              if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
                UI.showMapView();
              }
            });
        } else {
          console.error("Cannot complete node: no current node or GameState not available");
          // Fallback to UI.showMapView if available
          if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
            UI.showMapView();
          }
        }
      },
      
      // Get player insight (safe access to GameState)
      getPlayerInsight: function() {
        if (GameState?.data?.character?.insight !== undefined) {
          return GameState.data.character.insight;
        }
        return 0;
      },
      
      // Get player lives (safe access to GameState)
      getPlayerLives: function() {
        if (GameState?.data?.character?.lives !== undefined) {
          return GameState.data.character.lives;
        }
        return 0;
      },
      
      // Show floating text feedback
      showFeedback: function(message, type = 'info') {
        if (typeof UiUtils !== 'undefined' && typeof UiUtils.showFloatingText === 'function') {
          UiUtils.showFloatingText(message, type);
        } else {
          console.log(`Feedback (${type}): ${message}`);
        }
      },
      
      // Show toast notification
      showToast: function(message, type = 'info') {
        if (typeof UiUtils !== 'undefined' && typeof UiUtils.showToast === 'function') {
          UiUtils.showToast(message, type);
        } else {
          console.log(`Toast (${type}): ${message}`);
        }
      },
      
      // Update player insight with feedback
      updatePlayerInsight: function(amount) {
        if (!GameState || !GameState.updateCharacterAttribute) {
          console.error("GameState not available for insight update");
          return false;
        }
        
        // Get current insight
        const currentInsight = this.getPlayerInsight();
        
        // Update insight
        const success = GameState.updateCharacterAttribute('insight', currentInsight + amount);
        
        // Show feedback
        if (success) {
          const message = amount >= 0 ? `+${amount} Insight` : `${amount} Insight`;
          const type = amount >= 0 ? 'success' : 'danger';
          this.showFeedback(message, type);
        }
        
        return success;
      },
      
      // Update player lives with feedback
      updatePlayerLives: function(amount) {
        if (!GameState || !GameState.updateCharacterAttribute) {
          console.error("GameState not available for lives update");
          return false;
        }
        
        // Get current lives and max lives
        const currentLives = this.getPlayerLives();
        const maxLives = GameState?.data?.character?.max_lives || 3;
        
        // Calculate new lives value (capped at max_lives)
        const newLives = Math.min(maxLives, Math.max(0, currentLives + amount));
        
        // Only update if there's a change
        if (newLives === currentLives) {
          return false;
        }
        
        // Update lives
        const success = GameState.updateCharacterAttribute('lives', newLives);
        
        // Show feedback
        if (success) {
          const message = amount > 0 ? `+${amount} Life` : `${amount} Life`;
          const type = amount > 0 ? 'success' : 'danger';
          this.showFeedback(message, type);
          
          // Check for game over
          if (newLives <= 0 && typeof NodeInteraction !== 'undefined' && 
              typeof NodeInteraction.showGameOver === 'function') {
            // Use timeout for visual feedback before game over
            setTimeout(() => {
              NodeInteraction.showGameOver();
            }, 1000);
          }
        }
        
        return success;
      },
      
      // Add item to inventory with feedback
      addItemToInventory: function(item) {
        if (!GameState || !GameState.addInventoryItem) {
          console.error("GameState not available for inventory update");
          return false;
        }
        
        const success = GameState.addInventoryItem(item);
        
        if (success) {
          this.showFeedback(`Added ${item.name} to inventory!`, 'success');
        }
        
        return success;
      },
      
      // Bind a component method to an element event
      bindAction: function(elementId, eventType, action, data = {}) {
        const element = document.getElementById(elementId);
        if (!element) {
          console.warn(`Element not found for binding: ${elementId}`);
          return false;
        }
        
        const self = this;
        const nodeData = data.nodeData; // Extract node data
        
        element.addEventListener(eventType, function(event) {
          // Prevent default for links/buttons
          if (element.tagName === 'A' || element.tagName === 'BUTTON') {
            event.preventDefault();
          }
          
          // Call the handleAction method with proper context
          self.handleAction(
            nodeData || GameState?.data?.currentNode, 
            action, 
            { ...data, element, event }
          );
        });
        
        return true;
      },
      
      // Update a UI element with content
      updateElement: function(elementId, content) {
        const element = document.getElementById(elementId);
        if (!element) {
          console.warn(`Element not found for updating: ${elementId}`);
          return false;
        }
        
        element.innerHTML = content;
        return true;
      },
      
      // Secure HTML template helper (prevents XSS)
      template: function(strings, ...values) {
        const escaped = values.map(value => {
          if (typeof value === 'string') {
            return value
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          }
          return value;
        });
        
        return strings.reduce((result, string, i) => {
          return result + string + (escaped[i] || '');
        }, '');
      },
      
      // Set UI state (only for rendering purposes)
      setUiState: function(key, value) {
        this.uiState[key] = value;
      },
      
      // Get UI state
      getUiState: function(key, defaultValue = null) {
        return key in this.uiState ? this.uiState[key] : defaultValue;
      }
    };
    
    // Add custom methods from config
    Object.entries(config).forEach(([key, value]) => {
      if (key !== 'initialize' && key !== 'render' && key !== 'handleAction') {
        component[key] = value;
      }
    });
    
    return component;
  },
  
  // Helper for option components
  createOptionButtons: function(container, options, callback) {
    if (!container) {
      console.error("Container not provided for options");
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create buttons for each option
    options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'btn btn-outline-primary option-btn mb-2 w-100';
      button.textContent = option;
      
      // Add click handler
      button.addEventListener('click', () => {
        callback(index, option);
      });
      
      container.appendChild(button);
    });
  },
  
  // Disable all option buttons
  disableOptionButtons: function(container) {
    if (!container) return;
    
    const buttons = container.querySelectorAll('.option-btn');
    buttons.forEach(button => {
      button.disabled = true;
    });
  },
  
  // Show correct answer among options
  highlightCorrectOption: function(container, correctIndex, selectedIndex) {
    if (!container) return;
    
    const buttons = container.querySelectorAll('.option-btn');
    
    // Highlight selected option (right or wrong)
    if (buttons[selectedIndex]) {
      buttons[selectedIndex].classList.remove('btn-outline-primary');
      buttons[selectedIndex].classList.add(
        selectedIndex === correctIndex ? 'btn-success' : 'btn-danger'
      );
    }
    
    // Also highlight correct option if user was wrong
    if (selectedIndex !== correctIndex && buttons[correctIndex]) {
      buttons[correctIndex].classList.remove('btn-outline-primary');
      buttons[correctIndex].classList.add('btn-success');
    }
  }
};

// Export globally
window.ComponentUtils = ComponentUtils;