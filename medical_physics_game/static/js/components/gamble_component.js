// gamble_component.js - Component for gamble node type (Research Opportunity)

const GambleComponent = ComponentUtils.createComponent('gamble', {
    // Initialize component
    initialize: function() {
      console.log("Initializing gamble component");
      this.setUiState('selectedOption', null);
      this.setUiState('resultShown', false);
    },
    
    // Render the gamble UI
    render: function(nodeData, container) {
      console.log("Rendering gamble component", nodeData);
      
      // Create default options if none provided
      const options = this.generateGambleOptions(nodeData);
      
      // Create gamble UI
      container.innerHTML = `
        <h3>Research Opportunity</h3>
        <p class="mb-3">You have a chance to participate in a medical physics research project. The outcome could benefit your career, but there are risks involved.</p>
        
        <div id="gamble-options" class="gamble-options mb-3">
          ${this.renderOptions(options)}
        </div>
        
        <div id="gamble-result" class="alert mt-3" style="display: none;"></div>
        <button id="gamble-continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
      `;
      
      // Add event handlers to options
      const optionsContainer = document.getElementById('gamble-options');
      if (optionsContainer) {
        this.bindActionToSelector(optionsContainer, '.gamble-option', 'click', 'selectOption', (element) => {
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
    
    // Render gamble options
    renderOptions: function(options) {
      if (!options || !options.length) return '<p>No research options available.</p>';
      
      return options.map((option, index) => {
        const riskClass = this.getRiskClass(option.risk);
        return `
          <div class="card mb-2 gamble-option" data-index="${index}">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="m-0">${option.name}</h5>
              <span class="badge ${riskClass}">${this.formatRisk(option.risk)} Risk</span>
            </div>
            <div class="card-body">
              <p>${option.description}</p>
              <div class="gamble-rewards">
                <div class="potential-reward">
                  <strong>Potential Gain:</strong> ${this.formatReward(option.reward)}
                </div>
                ${option.penalty ? `
                <div class="potential-penalty">
                  <strong>Potential Loss:</strong> ${this.formatReward(option.penalty)}
                </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    },
    
    // Get risk badge class
    getRiskClass: function(risk) {
      switch(risk) {
        case 'low': return 'bg-success';
        case 'medium': return 'bg-warning';
        case 'high': return 'bg-danger';
        default: return 'bg-info';
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
    
    // Select a gamble option
    selectOption: function(nodeData, optionIndex, option) {
      console.log(`Selected gamble option: ${optionIndex}`, option);
      
      // Save selected option
      this.setUiState('selectedOption', optionIndex);
      this.setUiState('resultShown', true);
      
      // Hide other options
      const optionsContainer = document.getElementById('gamble-options');
      if (optionsContainer) {
        const allOptions = optionsContainer.querySelectorAll('.gamble-option');
        allOptions.forEach((element, index) => {
          if (index !== optionIndex) {
            element.style.display = 'none';
          }
        });
      }
      
      // Show result based on risk level
      this.showGambleResult(option);
    },
    
    // Show gamble result
    showGambleResult: function(option) {
      if (!option) return;
      
      // Determine if successful based on risk
      const isSuccess = this.determineSuccess(option.risk);
      
      // Show result message
      const resultDiv = document.getElementById('gamble-result');
      if (resultDiv) {
        resultDiv.className = `alert ${isSuccess ? 'alert-success' : 'alert-danger'}`;
        
        if (isSuccess) {
          resultDiv.innerHTML = `
            <h4>Success!</h4>
            <p>Your research is successful and produces valuable results.</p>
            <p>${this.formatReward(option.reward)}</p>
          `;
          
          // Apply reward
          if (option.reward) {
            this.applyReward(option.reward);
          }
        } else {
          resultDiv.innerHTML = `
            <h4>Setback</h4>
            <p>Your research encounters unexpected challenges.</p>
            ${option.penalty ? `<p>${this.formatReward(option.penalty)}</p>` : ''}
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
    
    // Apply reward or penalty
    applyReward: function(reward) {
      if (!reward || !reward.type) return;
      
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
            .catch(error => console.error("Error fetching item:", error));
          break;
      }
    },
    
    // Handle component actions
    handleAction: function(nodeData, action, data) {
      console.log(`Gamble component handling action: ${action}`, data);
      
      switch (action) {
        case 'selectOption':
          this.selectOption(nodeData, data.optionIndex, data.option);
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