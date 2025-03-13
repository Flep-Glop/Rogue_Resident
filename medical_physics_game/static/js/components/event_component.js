// event_component.js - Component for event node type

const EventComponent = ComponentUtils.createComponent('event', {
  // Initialize component
  initialize: function() {
    console.log("Initializing event component");
  },
  
  // Render the event UI
  render: function(nodeData, container) {
    console.log("Rendering event component", nodeData);
    
    // Validate node data
    if (!nodeData.event) {
      this.showToast("Event data missing!", "warning");
      container.innerHTML = `
        <h3>Random Event</h3>
        <div class="alert alert-warning">
          <p>No event data available.</p>
        </div>
        <button id="event-continue-btn" class="btn btn-primary mt-3">Continue</button>
      `;
      this.bindAction('event-continue-btn', 'click', 'continue', { nodeData });
      return;
    }
    
    const event = nodeData.event;
    
    // Create event UI
    container.innerHTML = `
      <h3 id="event-title">${event.title || 'Random Event'}</h3>
      <div class="event-image-container">
        <div class="event-icon">📝</div>
      </div>
      <p id="event-description" class="event-description">${event.description}</p>
      <div id="event-options" class="event-options-container"></div>
      <div id="event-result" class="alert mt-3" style="display: none;"></div>
      <button id="event-continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
    `;
    
    // Add style for white text in options
    const styleEl = document.createElement('style');
    styleEl.textContent = '.event-option { color: white !important; }';
    document.head.appendChild(styleEl);
    
    // Add options
    const optionsContainer = document.getElementById('event-options');
    if (optionsContainer && event.options) {
      event.options.forEach((option, index) => {
        // Check if option has a requirement
        const hasRequirement = option.requirementType && option.requirementValue;
        const meetsRequirement = this.checkRequirement(option);
        
        // Create option button
        const optionBtn = document.createElement('button');
        optionBtn.className = `event-option ${!meetsRequirement ? 'disabled' : ''}`;
        optionBtn.disabled = !meetsRequirement;
        optionBtn.innerHTML = `
          ${option.text}
          ${hasRequirement ? `<span class="event-requirement">${this.getRequirementText(option)}</span>` : ''}
        `;
        
        // Only add click handler if option is available
        if (meetsRequirement) {
          optionBtn.addEventListener('click', () => {
            this.selectOption(nodeData, event, index);
          });
        }
        
        optionsContainer.appendChild(optionBtn);
      });
    }
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
        return `Requires ${option.requirementValue}`;
        
      default:
        return '';
    }
  },
  
  // Select an event option
  selectOption: function(nodeData, event, optionIndex) {
    // Get the selected option
    const option = event.options[optionIndex];
    if (!option || !option.outcome) return;
    
    // Hide options
    const optionsContainer = document.getElementById('event-options');
    if (optionsContainer) {
      optionsContainer.style.display = 'none';
    }
    
    // Show result
    const resultDiv = document.getElementById('event-result');
    if (resultDiv) {
      // Determine result type for styling
      let resultType = 'neutral';
      if (option.outcome.effect) {
        switch (option.outcome.effect.type) {
          case 'insight_gain':
            resultType = 'success';
            break;
          case 'insight_loss':
          case 'lose_life':
            resultType = 'negative';
            break;
          default:
            resultType = 'neutral';
        }
      }
      
      // Show result message
      resultDiv.className = `alert event-result-${resultType}`;
      resultDiv.innerHTML = `<p>${option.outcome.description}</p>`;
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
      // FIXED: Pass nodeData to continue action, not event
      this.bindAction('event-continue-btn', 'click', 'continue', { nodeData });
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
        // Would need to fetch the item data from the server
        // For now, just show a message
        this.showToast(`Would gain item: ${effect.value}`, "info");
        break;
    }
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Event component handling action: ${action}`, data);
    
    switch (action) {
      case 'continue':
        // Make sure we have nodeData
        if (!nodeData && data && data.nodeData) {
          nodeData = data.nodeData;
        }
        
        if (!nodeData) {
          console.error("Missing nodeData in handleAction for continue action");
          // Try to get from game state
          if (GameState && GameState.data && GameState.data.currentNode) {
            const currentNodeData = GameState.getNodeById(GameState.data.currentNode);
            if (currentNodeData) {
              this.completeNode(currentNodeData);
              return;
            }
          }
          // Fallback to map view
          if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
            UI.showMapView();
          }
          return;
        }
        
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