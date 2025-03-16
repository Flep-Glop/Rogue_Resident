// component_utils.js - Enhanced version with performance optimizations and lifecycle management

const ComponentUtils = {
  // Component registry for tracking active instances
  _activeComponents: new Map(),
  
  // Create a standard component object with required methods and enhanced lifecycle
  createComponent: function(typeId, config = {}) {
    // Basic component structure
    const component = {
      // Type this component handles
      typeId: typeId,
      
      // Component state - only for UI rendering, not game data
      uiState: {},
      
      // Track bound event handlers for cleanup
      _eventHandlers: [],
      
      // Track DOM mutation observer
      _observer: null,
      
      // Initialize component (called once at startup)
      initialize: function() {
        console.log(`Initializing ${typeId} component`);
        
        // Initialize UI state
        this.uiState = {};
        
        // Reset event handlers tracking
        this._eventHandlers = [];
        
        // Register instance
        ComponentUtils._activeComponents.set(typeId, this);
        
        // Call custom initialization if provided
        if (config.initialize) {
          config.initialize.call(this);
        }
        
        return this;
      },
      
      // Cleanup component resources (called when no longer needed)
      destroy: function() {
        console.log(`Destroying ${typeId} component`);
        
        // Remove all event handlers
        this._eventHandlers.forEach(({element, eventType, handler}) => {
          if (element) {
            element.removeEventListener(eventType, handler);
          }
        });
        this._eventHandlers = [];
        
        // Disconnect observer if exists
        if (this._observer) {
          this._observer.disconnect();
          this._observer = null;
        }
        
        // Clear UI state
        this.uiState = {};
        
        // Unregister instance
        ComponentUtils._activeComponents.delete(typeId);
        
        // Call custom destroy if provided
        if (config.destroy) {
          config.destroy.call(this);
        }
        
        return this;
      },
      
      // Render node data into a container with enhanced performance
      render: function(nodeData, container) {
        console.log(`Rendering ${typeId} node`, nodeData);
        
        // Clean up previous render first
        this.cleanupRender();
        
        // Track container for current render
        this._currentContainer = container;
        
        // Use custom render if provided, otherwise use default
        if (config.render) {
          config.render.call(this, nodeData, container);
        } else {
          // Default implementation
          container.innerHTML = `
            <h3>${nodeData.title || NodeRegistry.getNodeType(typeId).displayName}</h3>
            <p>This is a ${typeId} node.</p>
            <button id="${typeId}-continue-btn" class="btn btn-primary mt-3">Continue</button>
          `;
          
          // Add continue button handler
          this.bindAction(`${typeId}-continue-btn`, 'click', 'continue', {
            nodeData: nodeData
          });
        }
        
        // Set up a MutationObserver to track dynamically added elements
        this._setupMutationObserver(container);
        
        return this;
      },
      
      // Clean up previous render resources
      cleanupRender: function() {
        // Remove all event handlers from previous render
        this._eventHandlers.forEach(({element, eventType, handler}) => {
          if (element) {
            element.removeEventListener(eventType, handler);
          }
        });
        this._eventHandlers = [];
        
        // Disconnect observer if exists
        if (this._observer) {
          this._observer.disconnect();
          this._observer = null;
        }
        
        // Clear references
        this._currentContainer = null;
      },
      
      // Set up mutation observer to track dynamic content
      _setupMutationObserver: function(container) {
        // Skip if container not provided
        if (!container) return;
        
        // Create observer to track dynamic elements
        this._observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              // Handle newly added elements if needed
              // This is where you could auto-bind events to dynamically added elements
            }
          });
        });
        
        // Start observing
        this._observer.observe(container, { 
          childList: true, 
          subtree: true 
        });
      },
      
      // Handle user actions with better error handling
      handleAction: function(nodeData, action, data) {
        console.log(`${typeId} component handling action: ${action}`, data);
        
        try {
          // Use custom handler if provided, otherwise use default
          if (config.handleAction) {
            return config.handleAction.call(this, nodeData, action, data);
          } else {
            // Default implementation
            if (action === 'continue') {
              // Complete the node
              return this.completeNode(nodeData);
            }
          }
        } catch (error) {
          // Handle errors within the action handler
          console.error(`Error handling action ${action}:`, error);
          ErrorHandler.handleError(
            error,
            `Component Action (${typeId}:${action})`,
            ErrorHandler.SEVERITY.WARNING
          );
          
          // Return failure
          return false;
        }
      },
      
      // Standard node completion with better error handling
      completeNode: function(nodeData) {
        if (!nodeData) {
          console.error("Cannot complete node: missing node data");
          return false;
        }
        
        if (GameState && GameState.data && GameState.data.currentNode) {
          return GameState.completeNode(nodeData.id)
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
              
              return false;
            });
        } else {
          console.error("Cannot complete node: no current node or GameState not available");
          // Fallback to UI.showMapView if available
          if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
            UI.showMapView();
          }
          return false;
        }
      },
      
      // Enhanced event binding with tracking for cleanup
      bindAction: function(elementId, eventType, action, data = {}) {
        // Support both element ID strings and direct element references
        const element = typeof elementId === 'string' 
          ? document.getElementById(elementId)
          : elementId;
        
        if (!element) {
          console.warn(`Element not found for binding: ${elementId}`);
          return false;
        }
        
        const self = this;
        const nodeData = data.nodeData; // Extract node data
        
        // Create handler function
        const handler = function(event) {
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
        };
        
        // Add event listener
        element.addEventListener(eventType, handler);
        
        // Track for cleanup
        this._eventHandlers.push({
          element,
          eventType,
          handler
        });
        
        return true;
      },
      
      // Optimized bulk binding for multiple elements (uses event delegation)
      bindActionToSelector: function(container, selector, eventType, action, dataCallback) {
        if (!container) return false;
        
        const self = this;
        
        // Single event handler using event delegation
        const delegatedHandler = function(event) {
          // Find target matching the selector
          const target = event.target.closest(selector);
          if (!target) return; // Not a match
          
          // Prevent default for links/buttons
          if (target.tagName === 'A' || target.tagName === 'BUTTON') {
            event.preventDefault();
          }
          
          // Get custom data if callback provided
          const data = dataCallback ? dataCallback(target, event) : {};
          
          // Call the handleAction method with proper context
          self.handleAction(
            data.nodeData || GameState?.data?.currentNode, 
            action, 
            { ...data, element: target, event }
          );
        };
        
        // Add single event listener to container
        container.addEventListener(eventType, delegatedHandler);
        
        // Track for cleanup
        this._eventHandlers.push({
          element: container,
          eventType,
          handler: delegatedHandler
        });
        
        return true;
      },
      
      // Update a UI element with content - optimized with diffing
      updateElement: function(elementId, content) {
        const element = typeof elementId === 'string'
          ? document.getElementById(elementId)
          : elementId;
        
        if (!element) {
          console.warn(`Element not found for updating: ${elementId}`);
          return false;
        }
        
        // Simple diffing to avoid unnecessary DOM updates
        if (element.innerHTML !== content) {
          element.innerHTML = content;
        }
        
        return true;
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
      if (!['initialize', 'render', 'handleAction', 'destroy'].includes(key)) {
        component[key] = value;
      }
    });
    
    return component;
  },
  
  // Helper for option components - optimized with event delegation
  createOptionButtons: function(container, options, callback) {
    if (!container) {
      console.error("Container not provided for options");
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Add single event listener with delegation instead of one per button
    container.addEventListener('click', (event) => {
      const button = event.target.closest('.option-btn');
      if (!button || button.disabled) return;
      
      // Get index from data attribute
      const index = parseInt(button.dataset.index, 10);
      if (isNaN(index)) return;
      
      callback(index, options[index]);
    });
    
    // Create buttons without individual event listeners
    options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'btn btn-outline-primary option-btn mb-2 w-100';
      button.textContent = option;
      button.dataset.index = index;
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
  
  // Show correct answer among options with optimized rendering
  highlightCorrectOption: function(container, correctIndex, selectedIndex) {
    if (!container) return;
    
    const buttons = container.querySelectorAll('.option-btn');
    
    // Process in a single batch to minimize layout thrashing
    requestAnimationFrame(() => {
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
    });
  },
  
  // Enhanced template function with proper escaping
  template: function(strings, ...values) {
    return strings.reduce((result, string, i) => {
      const value = values[i];
      
      // Handle different value types
      let processed = '';
      
      if (value === null || value === undefined) {
        processed = '';
      } else if (typeof value === 'string') {
        // Escape HTML special characters for strings
        processed = value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        processed = String(value);
      } else if (Array.isArray(value)) {
        processed = JSON.stringify(value);
      } else if (typeof value === 'object') {
        processed = JSON.stringify(value);
      } else {
        processed = String(value);
      }
      
      return result + string + (processed || '');
    }, '');
  },
  
  // Destroy all active components (useful for page transitions)
  destroyAllComponents: function() {
    this._activeComponents.forEach((component) => {
      try {
        component.destroy();
      } catch (error) {
        console.error(`Error destroying component ${component.typeId}:`, error);
      }
    });
    
    this._activeComponents.clear();
  },
  
  // Create a throttled version of a function
  throttle: function(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  },
  
  // Create a debounced version of a function
  debounce: function(fn, delay) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }
};

// Export globally
window.ComponentUtils = ComponentUtils;