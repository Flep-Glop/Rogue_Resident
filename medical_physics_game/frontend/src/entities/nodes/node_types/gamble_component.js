// gamble_component.js - Refactored implementation using new design architecture

const GambleComponent = ComponentUtils.createComponent('gamble', {
  // Initialize component
  initialize: function() {
    console.log("Initializing gamble component");
    
    // Initialize UI state
    this.setUiState('selectedOption', null);
    this.setUiState('resultShown', false);
    this.setUiState('animationPlaying', false);
    
    // Subscribe to design bridge changes
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // Update appearance if active
    const container = document.getElementById('gamble-container');
    if (container && container.style.display !== 'none') {
      this.refreshAppearance();
    }
  },
  
  // Refresh appearance with design tokens
  refreshAppearance: function() {
    // Apply colors from design bridge with fallbacks
    const gambleColor = window.DesignBridge?.colors?.nodeGamble || '#b8d458';
    
    // Update specific elements if needed
    const header = document.querySelector('.gamble-header');
    if (header) {
      header.style.borderColor = gambleColor;
    }
  },
  
  // Render the gamble UI
  render: function(nodeData, container) {
    console.log("Rendering gamble component", nodeData);
    
    // Get colors from design bridge
    const gambleColor = window.DesignBridge?.colors?.nodeGamble || '#b8d458';
    const primaryColor = window.DesignBridge?.colors?.primary || '#5b8dd9';
    
    // Create default options if none provided
    const options = this.generateGambleOptions(nodeData);
    
    // Create gamble UI with new design classes
    container.innerHTML = `
      <div class="game-panel shadow-md anim-fade-in">
        <div class="game-panel__title border-left-rarity border-left-uncommon gamble-header">
          <h3>Research Opportunity</h3>
        </div>
        
        <div class="mb-md p-sm bg-dark-alt rounded-md">
          <p class="text-light">You have a chance to participate in a medical physics research project. 
             The outcome could benefit your career, but there are risks involved.</p>
        </div>
        
        <div id="gamble-options" class="flex-col gap-md mb-lg">
          ${this.renderOptions(options)}
        </div>
        
        <div id="gamble-result" class="alert mb-md" style="display: none;"></div>
        
        <button id="gamble-continue-btn" class="game-btn game-btn--primary w-full" 
                style="display: ${this.getUiState('resultShown') ? 'block' : 'none'};">
          Continue
        </button>
      </div>
    `;
    
    // Add event handlers to options using delegated event handling
    const optionsContainer = document.getElementById('gamble-options');
    if (optionsContainer) {
      this.bindActionToSelector(optionsContainer, '.game-card', 'click', 'selectOption', (element) => {
        if (element.classList.contains('disabled')) return null;
        
        const index = parseInt(element.dataset.index, 10);
        return { 
          nodeData, 
          optionIndex: index,
          option: options[index]
        };
      });
    }
    
    // Bind continue button
    this.bindAction('gamble-continue-btn', 'click', 'continue', { nodeData });
    
    // If we already selected an option, show the result
    if (this.getUiState('resultShown') && this.getUiState('selectedOption') !== null) {
      const selectedOption = options[this.getUiState('selectedOption')];
      this.showGambleResult(selectedOption);
    }
    
    // Apply design tokens if available
    if (window.DesignBridge) {
      this.refreshAppearance();
    }
  },
  
  // Generate default gamble options
  generateGambleOptions: function(nodeData) {
    // Use nodeData options if available
    if (nodeData.gamble_options && Array.isArray(nodeData.gamble_options)) {
      return nodeData.gamble_options;
    }
    
    // Otherwise generate default options
    return [
      {
        name: "Conservative Approach",
        description: "Take a safe approach to your research. Low risk, modest gain.",
        risk: "low",
        reward: {
          type: "insight_gain",
          value: 10
        }
      },
      {
        name: "Standard Research",
        description: "Follow standard research protocols. Moderate risk and reward.",
        risk: "medium",
        reward: {
          type: "insight_gain",
          value: 20
        },
        penalty: {
          type: "insight_loss",
          value: 5
        }
      },
      {
        name: "Novel Methodology",
        description: "Try an experimental approach that could lead to a breakthrough. High risk, high reward.",
        risk: "high",
        reward: {
          type: "insight_gain",
          value: 40
        },
        penalty: {
          type: "lose_life",
          value: 1
        }
      }
    ];
  },
  
  // Render gamble options with new design classes
  renderOptions: function(options) {
    if (!options || !options.length) return '<p class="text-center text-light">No research options available.</p>';
    
    return options.map((option, index) => {
      // Get risk colors from design tokens with fallbacks
      let riskColor, riskBgClass;
      switch(option.risk) {
        case 'low':
          riskColor = window.DesignBridge?.colors?.secondary || '#56b886';
          riskBgClass = 'bg-secondary';
          break;
        case 'medium':
          riskColor = window.DesignBridge?.colors?.warning || '#f0c866';
          riskBgClass = 'bg-warning';
          break;
        case 'high':
          riskColor = window.DesignBridge?.colors?.danger || '#e67e73';
          riskBgClass = 'bg-danger';
          break;
        default:
          riskColor = window.DesignBridge?.colors?.primary || '#5b8dd9';
          riskBgClass = 'bg-primary';
      }
      
      return `
        <div class="game-card shadow-sm hover:shadow-md anim-fade-in" data-index="${index}">
          <div class="game-card__header ${riskBgClass} flex justify-between items-center">
            <h4 class="game-card__title">${option.name}</h4>
            <span class="badge ${riskBgClass === 'bg-warning' ? 'text-dark' : ''}">${this.formatRisk(option.risk)} Risk</span>
          </div>
          <div class="game-card__body">
            <p class="mb-sm">${option.description}</p>
            <div class="p-xs bg-dark-alt rounded-sm mb-sm">
              <div class="flex items-center">
                <span class="badge badge-success mr-xs">+</span>
                <span><strong>Potential Gain:</strong> ${this.formatReward(option.reward)}</span>
              </div>
              ${option.penalty ? `
              <div class="flex items-center mt-xs">
                <span class="badge badge-danger mr-xs">-</span>
                <span><strong>Potential Loss:</strong> ${this.formatReward(option.penalty)}</span>
              </div>
              ` : ''}
            </div>
            <div class="text-xs text-right">
              <span>Success Rate: ${this.getSuccessRate(option.risk)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },
  
  // Get success rate text
  getSuccessRate: function(risk) {
    switch(risk) {
      case 'low': return '90%';
      case 'medium': return '70%';
      case 'high': return '40%';
      default: return '50%';
    }
  },
  
  // Format risk level
  formatRisk: function(risk) {
    if (!risk) return 'Unknown';
    return risk.charAt(0).toUpperCase() + risk.slice(1);
  },
  
  // Format reward description
  formatReward: function(reward) {
    if (!reward) return 'None';
    
    switch(reward.type) {
      case 'insight_gain':
        return `+${reward.value} Insight`;
      case 'insight_loss':
        return `-${reward.value} Insight`;
      case 'gain_life':
        return `+${reward.value} Life`;
      case 'lose_life':
        return `-${reward.value} Life`;
      case 'gain_item':
        return `Gain item: ${reward.value}`;
      default:
        return reward.value || 'Unknown';
    }
  },
  
  // Select a gamble option with enhanced animation
  selectOption: function(nodeData, optionIndex, option) {
    console.log(`Selected gamble option: ${optionIndex}`, option);
    
    // Prevent selecting during animation
    if (this.getUiState('animationPlaying')) return;
    
    // Set animation state
    this.setUiState('animationPlaying', true);
    
    // Save selected option
    this.setUiState('selectedOption', optionIndex);
    this.setUiState('resultShown', true);
    
    // Show selection animation
    const optionsContainer = document.getElementById('gamble-options');
    if (optionsContainer) {
      const allOptions = optionsContainer.querySelectorAll('.game-card');
      
      // Dim and disable non-selected options
      allOptions.forEach((element, index) => {
        if (index !== optionIndex) {
          element.classList.add('disabled');
          element.style.opacity = '0.4';
          element.style.transform = 'scale(0.95)';
          element.style.filter = 'grayscale(0.5)';
        } else {
          // Highlight selected option
          element.classList.add('selected');
          element.style.transform = 'scale(1.03)';
          element.style.boxShadow = window.DesignBridge?.shadows?.lg || '0 10px 15px rgba(0, 0, 0, 0.3)';
        }
      });
    }
    
    // Add dice rolling animation
    this.showDiceRollingAnimation(() => {
      // Show result after animation completes
      this.showGambleResult(option);
      this.setUiState('animationPlaying', false);
    });
  },
  
  // Show dice rolling animation
  showDiceRollingAnimation: function(callback) {
    // Create animation container
    const resultDiv = document.getElementById('gamble-result');
    if (!resultDiv) {
      if (callback) callback();
      return;
    }
    
    resultDiv.className = 'alert alert-info anim-fade-in';
    resultDiv.innerHTML = `
      <div class="text-center p-sm">
        <div class="mb-sm">
          <span class="text-lg anim-pulse-opacity">🎲</span>
          <span class="text-lg dice-roll anim-spin">🎲</span>
          <span class="text-lg anim-pulse-opacity">🎲</span>
        </div>
        <p>Calculating research outcomes...</p>
      </div>
    `;
    resultDiv.style.display = 'block';
    
    // Show animation for a short period, then call callback
    setTimeout(() => {
      if (callback) callback();
    }, 1500);
  },
  
  // Show gamble result with enhanced styling
  showGambleResult: function(option) {
    if (!option) return;
    
    // Determine if successful based on risk
    const isSuccess = this.determineSuccess(option.risk);
    
    // Get result colors from design bridge with fallbacks
    const successColor = window.DesignBridge?.colors?.secondary || '#56b886';
    const dangerColor = window.DesignBridge?.colors?.danger || '#e67e73';
    
    // Show result message
    const resultDiv = document.getElementById('gamble-result');
    if (resultDiv) {
      resultDiv.className = `alert ${isSuccess ? 'alert-success' : 'alert-danger'} anim-fade-in`;
      
      if (isSuccess) {
        resultDiv.innerHTML = `
          <div class="flex items-center mb-sm">
            <span class="text-xl mr-sm">✓</span>
            <h4>Success!</h4>
          </div>
          <p>Your research is successful and produces valuable results.</p>
          <div class="mt-md p-xs bg-dark-alt rounded-sm">
            <span class="badge badge-success">Reward</span>
            <span>${this.formatReward(option.reward)}</span>
          </div>
        `;
        
        // Apply reward
        if (option.reward) {
          this.applyReward(option.reward);
        }
      } else {
        resultDiv.innerHTML = `
          <div class="flex items-center mb-sm">
            <span class="text-xl mr-sm">✗</span>
            <h4>Setback</h4>
          </div>
          <p>Your research encounters unexpected challenges.</p>
          ${option.penalty ? `
          <div class="mt-md p-xs bg-dark-alt rounded-sm">
            <span class="badge badge-danger">Penalty</span>
            <span>${this.formatReward(option.penalty)}</span>
          </div>
          ` : ''}
        `;
        
        // Apply penalty
        if (option.penalty) {
          this.applyReward(option.penalty);
        }
      }
      
      resultDiv.style.display = 'block';
    }
    
    // Show continue button
    const continueBtn = document.getElementById('gamble-continue-btn');
    if (continueBtn) {
      continueBtn.style.display = 'block';
      continueBtn.classList.add('anim-pulse-scale');
    }
  },
  
  // Determine success based on risk level
  determineSuccess: function(risk) {
    let successChance = 0;
    
    switch(risk) {
      case 'low': 
        successChance = 0.9; // 90% success
        break;
      case 'medium': 
        successChance = 0.7; // 70% success
        break;
      case 'high': 
        successChance = 0.4; // 40% success
        break;
      default:
        successChance = 0.5; // 50% default
    }
    
    // Roll for success
    return Math.random() <= successChance;
  },
  
  // Apply reward or penalty with improved visual feedback
  applyReward: function(reward) {
    if (!reward || !reward.type) return;
    
    setTimeout(() => {
      switch(reward.type) {
        case 'insight_gain':
          this.updatePlayerInsight(reward.value);
          break;
          
        case 'insight_loss':
          this.updatePlayerInsight(-reward.value);
          break;
          
        case 'gain_life':
          this.updatePlayerLives(reward.value);
          break;
          
        case 'lose_life':
          this.updatePlayerLives(-reward.value);
          break;
          
        case 'gain_item':
          // Would need to fetch the item data from the server
          fetch(`/api/item/${reward.value}`)
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
    }, 500); // Small delay for visual feedback
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Gamble component handling action: ${action}`, data);
    
    switch (action) {
      case 'selectOption':
        if (data) {
          this.selectOption(nodeData, data.optionIndex, data.option);
        }
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
  NodeComponents.register('gamble', GambleComponent);
}