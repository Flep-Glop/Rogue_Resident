// event_component.js - Refactored implementation with new design architecture

const EventComponent = ComponentUtils.createComponent('event', {
  // Initialize component
  initialize: function() {
    console.log("Initializing event component");
    
    // Subscribe to design bridge changes if available
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
    
    // Reset UI state when a new node is selected
    GameState.addObserver((eventType, data) => {
      if (eventType === 'currentNodeChanged') {
        this.setUiState('optionSelected', false);
        this.setUiState('selectedOptionIndex', null);
      }
    });
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // Update event appearance if active
    const container = document.getElementById('event-container');
    if (container && container.style.display !== 'none') {
      // Could refresh UI elements with new design tokens
    }
  },
  
  // Render the event UI with new design classes
  render: function(nodeData, container) {
    console.log("Rendering event component", nodeData);
    
    // Get colors from design bridge if available
    const eventColor = window.DesignBridge?.colors?.nodeEvent || '#e99c50';
    
    // Validate node data
    if (!nodeData.event) {
      container.innerHTML = `
        <div class="game-panel shadow-md">
          <div class="alert alert-warning">
            <p>No event data available.</p>
          </div>
          <button id="event-continue-btn" class="game-btn game-btn--primary mt-md">Continue</button>
        </div>
      `;
      this.bindAction('event-continue-btn', 'click', 'continue', { nodeData });
      return;
    }
    
    const event = nodeData.event;
    
    // Create event UI with new design classes
    container.innerHTML = `
      <div class="game-panel anim-fade-in">
        <div class="game-panel__title">
          <h3>${event.title || 'Random Event'}</h3>
        </div>
        
        <div class="flex items-center mb-md">
          <div class="event-icon flex-shrink-0 mr-md bg-dark-alt p-md rounded-md">
            <span class="text-xl text-warning">📝</span>
          </div>
          <p class="event-description flex-grow">${event.description}</p>
        </div>
        
        <div id="event-options" class="mb-lg flex-col gap-sm"></div>
        
        <div id="event-result" class="alert mb-md" style="display: none;"></div>
        
        <button id="event-continue-btn" class="game-btn game-btn--primary w-full" style="display: none;">
          Continue
        </button>
      </div>
    `;
    
    // Add options
    const optionsContainer = document.getElementById('event-options');
    if (optionsContainer && event.options) {
      this.renderOptions(optionsContainer, event.options, nodeData);
    }
    
    // If we already selected an option in this session, show the result
    if (this.getUiState('optionSelected') && this.getUiState('selectedOptionIndex') !== null) {
      const selectedOption = event.options[this.getUiState('selectedOptionIndex')];
      this.showOptionResult(selectedOption, nodeData);
    }
  },
  
  // Render event options with requirement checks
  renderOptions: function(container, options, nodeData) {
    if (!container || !options || !options.length) return;
    
    options.forEach((option, index) => {
      // Check if option has a requirement and if it's met
      const hasRequirement = option.requirementType && option.requirementValue;
      const meetsRequirement = this.checkRequirement(option);
      
      // Create option button with appropriate styling
      const optionBtn = document.createElement('button');
      optionBtn.className = `game-option ${!meetsRequirement ? 'disabled' : ''}`;
      optionBtn.disabled = !meetsRequirement;
      
      // Add option text and requirement badge if needed
      optionBtn.innerHTML = `
        <span>${option.text}</span>
        ${hasRequirement ? `
          <span class="badge ${meetsRequirement ? 'badge-primary' : 'badge-danger'} float-right">
            ${this.getRequirementText(option)}
          </span>
        ` : ''}
      `;
      
      // Only add click handler if option is available
      if (meetsRequirement) {
        this.bindAction(optionBtn, 'click', 'selectOption', {
          nodeData,
          optionIndex: index
        });
      }
      
      container.appendChild(optionBtn);
    });
  },
  
  // Check if player meets requirement
  checkRequirement: function(option) {
    if (!option.requirementType || !option.requirementValue) {
      return true; // No requirement
    }
    
    switch (option.requirementType) {
      case 'insight_check':
        return this.getPlayerInsight() >= option.requirementValue;
        
      case 'item_check':
        if (GameState && GameState.data && GameState.data.inventory) {
          return GameState.data.inventory.some(item => item.id === option.requirementValue);
        }
        return false;
        
      default:
        return true;
    }
  },
  
  // Get text description for requirement
  getRequirementText: function(option) {
    switch (option.requirementType) {
      case 'insight_check':
        return `Requires ${option.requirementValue} Insight`;
        
      case 'item_check':
        return `Requires specific item`;
        
      default:
        return '';
    }
  },
  
  // Select an event option with improved appearance
  selectOption: function(nodeData, optionIndex) {
    const event = nodeData.event;
    // Get the selected option
    const option = event.options[optionIndex];
    if (!option || !option.outcome) return;
    
    // Save selection in UI state
    this.setUiState('optionSelected', true);
    this.setUiState('selectedOptionIndex', optionIndex);
    
    // Hide options
    const optionsContainer = document.getElementById('event-options');
    if (optionsContainer) {
      optionsContainer.style.display = 'none';
    }
    
    // Show result for the selected option
    this.showOptionResult(option, nodeData);
  },
  
  // Show the result of selecting an option
  showOptionResult: function(option, nodeData) {
    // Show result
    const resultDiv = document.getElementById('event-result');
    if (resultDiv) {
      // Determine result type for styling
      let resultType = option.outcome.effect ? this.getResultType(option.outcome.effect) : 'info';
      
      // Show result message
      resultDiv.className = `alert alert-${resultType} mt-sm anim-fade-in`;
      resultDiv.innerHTML = `
        <p>${option.outcome.description}</p>
        ${option.outcome.effect ? `
          <div class="mt-sm">
            <span class="badge badge-${resultType}">
              ${this.formatEffectText(option.outcome.effect)}
            </span>
          </div>
        ` : ''}
      `;
      resultDiv.style.display = 'block';
      
      // Apply effect
      if (option.outcome.effect) {
        this.applyEffect(option.outcome.effect);
      }
    }
    
    // Show continue button
    const continueBtn = document.getElementById('event-continue-btn');
    if (continueBtn) {
      continueBtn.style.display = 'block';
      continueBtn.classList.add('anim-pulse-scale');
      this.bindAction('event-continue-btn', 'click', 'continue', { nodeData });
    }
  },
  
  // Determine result type for styling
  getResultType: function(effect) {
    if (!effect || !effect.type) return 'info';
    
    switch (effect.type) {
      case 'insight_gain':
        return 'success';
      case 'insight_loss':
      case 'lose_life':
        return 'danger';
      case 'gain_life':
        return 'success';
      case 'gain_item':
        return 'primary';
      default:
        return 'info';
    }
  },
  
  // Format effect text for displaying to the player
  formatEffectText: function(effect) {
    if (!effect || !effect.type) return 'No effect';
    
    switch (effect.type) {
      case 'insight_gain':
        return `+${effect.value} Insight`;
      case 'insight_loss':
        return `-${effect.value} Insight`;
      case 'gain_life':
        return `+${effect.value} Life`;
      case 'lose_life':
        return `-${effect.value} Life`;
      case 'gain_item':
        return `Gained new item`;
      default:
        return effect.value || 'Unknown effect';
    }
  },
  
  // Apply an effect
  applyEffect: function(effect) {
    if (!effect || !effect.type) return;
    
    switch (effect.type) {
      case 'insight_gain':
        this.updatePlayerInsight(effect.value);
        break;
        
      case 'insight_loss':
        this.updatePlayerInsight(-effect.value);
        break;
        
      case 'gain_life':
        this.updatePlayerLives(effect.value);
        break;
        
      case 'lose_life':
        this.updatePlayerLives(-effect.value);
        break;
        
      case 'gain_item':
        // Fetch the item data from the server
        fetch(`/api/item/${effect.value}`)
          .then(response => response.json())
          .then(item => {
            if (item) {
              this.addItemToInventory(item);
            }
          })
          .catch(error => {
            ErrorHandler.handleError(
              error,
              "Item Fetching", 
              ErrorHandler.SEVERITY.WARNING
            );
          });
        break;
    }
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Event component handling action: ${action}`, data);
    
    switch (action) {
      case 'selectOption':
        this.selectOption(nodeData, data.optionIndex);
        break;
        
      case 'continue':
        this.completeNode(nodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('event', EventComponent);
}