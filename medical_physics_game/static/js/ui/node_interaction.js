// node_interaction.js - Handles all node interactions

// Define container types
const CONTAINER_TYPES = {
    QUESTION: 'question-container',
    TREASURE: 'treasure-container',
    REST: 'rest-container',
    EVENT: 'event-container',
    SHOP: 'shop-container',
    GAMBLE: 'gamble-container',
    GAME_OVER: 'game-over-container',
    GAME_BOARD: 'game-board-container',
    MAP: 'floor-map'
  };
  
  // NodeInteraction singleton - handles node interactions
  const NodeInteraction = {
    // Current node data
    currentNodeData: null,
    
    // Initialize
    initialize: function() {
      console.log("Initializing node interaction system...");
      
      // Register for events
      EventSystem.on(GAME_EVENTS.NODE_SELECTED, this.visitNode.bind(this));
      
      return this;
    },
    
    // Hide all interaction containers
    hideAllContainers: function() {
      // Hide all interaction containers
      const containers = document.querySelectorAll('.interaction-container');
      containers.forEach(container => {
        container.style.display = 'none';
      });
      
      // Hide game over container if it exists
      const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
      if (gameOverContainer) {
        gameOverContainer.style.display = 'none';
      }
    },
    
    // Show a specific container
    showContainer: function(containerId) {
      this.hideAllContainers();
      
      const container = document.getElementById(containerId);
      if (container) {
        container.style.display = 'block';
        
        // Notify of container change
        EventSystem.emit(GAME_EVENTS.UI_CONTAINER_CHANGED, containerId);
      } else {
        console.error(`Container not found: ${containerId}`);
      }
    },
    
    // Show map view
    showMapView: function() {
      // Make sure game board is visible
      const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
      if (gameBoardContainer) {
        gameBoardContainer.style.display = 'block';
      }
      
      // Hide all interaction containers
      this.hideAllContainers();
    },
    
    // Clear all event listeners to prevent duplicates
    clearEventListeners: function() {
      // Store references to all buttons that need listeners cleared
      const elements = [
        'continue-btn',
        'treasure-continue-btn',
        'rest-heal-btn',
        'rest-study-btn',
        'rest-continue-btn',
        'event-continue-btn',
        'collect-item-btn',
        'shop-continue-btn',
        'gamble-continue-btn'
      ];
      
      // Clone and replace each element to remove all event listeners
      elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          const newElement = element.cloneNode(true);
          element.parentNode.replaceChild(newElement, element);
        }
      });
      
      // Clear option buttons if they exist
      const optionsContainer = document.getElementById('options-container');
      if (optionsContainer) {
        optionsContainer.innerHTML = '';
      }
      
      // Clear event options
      const eventOptions = document.getElementById('event-options');
      if (eventOptions) {
        eventOptions.innerHTML = '';
      }
    },
    
    // Visit a node
    visitNode: function(nodeId) {
      console.log(`Attempting to visit node: ${nodeId}`);
      
      // Clear any existing event listeners
      this.clearEventListeners();
      
      // Set current node in game state
      GameState.setCurrentNode(nodeId);
      
      // Request node data from server
      fetch(`/api/node/${nodeId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          return response.json();
        })
        .then(nodeData => {
          console.log("Node data received:", nodeData);
          this.currentNodeData = nodeData;
          
          // Validate and fix node data
          nodeData = this.validateNodeData(nodeData);
          
          // Process the node based on its type
          this.processNodeContent(nodeData);
        })
        .catch(error => {
          console.error('Error loading node:', error);
          UiUtils.showToast(`Failed to load node: ${error.message}`, 'danger');
          
          // Clear current node on error
          GameState.setCurrentNode(null);
        });
    },

    // Validate and fix node data for consistency
    validateNodeData: function(nodeData) {
      if (!nodeData) return nodeData;
      
      console.log("Validating node data for consistency:", nodeData);
      
      // Check if node type and content are mismatched
      const hasItem = nodeData.item !== undefined;
      const hasQuestion = nodeData.question !== undefined;
      const hasEvent = nodeData.event !== undefined;
      
      // Check for title/type mismatch
      const titleTypeMap = {
        'Physics Question': 'question',
        'Challenging Question': 'elite',
        'Final Assessment': 'boss',
        'Equipment Found': 'treasure',
        'Break Room': 'rest',
        'Random Event': 'event',
        'Department Store': 'shop'
      };
      
      // Fix type based on title if needed
      if (nodeData.title && titleTypeMap[nodeData.title] && nodeData.type !== titleTypeMap[nodeData.title]) {
        console.warn(`Node ${nodeData.id} has mismatched type (${nodeData.type}) and title (${nodeData.title})`);
        console.log(`Fixing node type from ${nodeData.type} to ${titleTypeMap[nodeData.title]}`);
        nodeData.type = titleTypeMap[nodeData.title];
      }
      
      // Handle content mismatches
      if (hasItem && (nodeData.type === 'question' || nodeData.type === 'elite' || nodeData.type === 'boss')) {
        console.warn(`Node ${nodeData.id} is type ${nodeData.type} but has item data`);
        console.log("Converting item data to placeholder question data");
        
        // Create placeholder question data
        nodeData.question = {
          id: `placeholder_${nodeData.id}`,
          text: `What is the effect of the ${nodeData.item.name}?`,
          options: [
            `${nodeData.item.effect.value}`,
            "It has no effect",
            "It decreases insight",
            "It's harmful to patients"
          ],
          correct: 0,
          explanation: `The ${nodeData.item.name} ${nodeData.item.effect.value}`,
          difficulty: nodeData.difficulty || 1
        };
        
        // Keep the item for later use
        nodeData._originalItem = nodeData.item;
        delete nodeData.item;
      }
      else if (hasQuestion && nodeData.type === 'treasure') {
        console.warn(`Node ${nodeData.id} is type treasure but has question data`);
        console.log("Converting question data to placeholder item data");
        
        // Create placeholder item data
        nodeData.item = {
          id: `placeholder_${nodeData.id}`,
          name: "Study Notes",
          description: "Notes about " + nodeData.question.text,
          rarity: "common",
          effect: {
            type: "insight_boost",
            value: 5,
            duration: "instant"
          }
        };
        
        // Keep the question for later
        nodeData._originalQuestion = nodeData.question;
        delete nodeData.question;
      }
      
      return nodeData;
    },

    
    // Replace the processNodeContent method in NodeInteraction with this fixed version

    processNodeContent: function(nodeData) {
      console.log("Processing node type:", nodeData.type);
      
      switch (nodeData.type) {
        case 'question':
        case 'elite':
        case 'boss':
          if (nodeData.question) {
            this.showQuestion(nodeData);
          } else {
            console.error(`Question data missing for ${nodeData.type} node:`, nodeData);
            UiUtils.showToast(`Error: Missing question data for ${nodeData.type} node`, "danger");
          }
          break;
          
        case 'treasure':
          if (nodeData.item) {
            this.showTreasure(nodeData);
          } else {
            console.error("Item data missing for treasure node:", nodeData);
            UiUtils.showToast("Error: Missing item data for treasure node", "danger");
          }
          break;
          
        case 'rest':
          this.showRestNode(nodeData);
          break;
          
        case 'event':
          if (nodeData.event) {
            this.showEvent(nodeData);
          } else {
            console.error("Event data missing for event node:", nodeData);
            UiUtils.showToast("Error: Missing event data for event node", "danger");
          }
          break;
          
        case 'shop':
          this.showShop(nodeData);
          break;
          
        case 'gamble':
          this.showGamble(nodeData);
          break;
          
        default:
          console.error(`Unknown node type: ${nodeData.type}`);
          UiUtils.showToast(`Unknown node type: ${nodeData.type}`, 'danger');
          GameState.completeNode(nodeData.id);
      }
    },
    
    // Show a question node
    showQuestion: function(nodeData) {
      console.log("Showing question node");
      
      const questionContainer = document.getElementById(CONTAINER_TYPES.QUESTION);
      const questionTitle = document.getElementById('question-title');
      const questionText = document.getElementById('question-text');
      const optionsContainer = document.getElementById('options-container');
      const resultDiv = document.getElementById('question-result');
      
      // Store current question for potential hint use
      this.currentQuestion = nodeData.question;
      
      // Set question title if element exists
      if (questionTitle) {
        questionTitle.textContent = nodeData.title || 'Question';
      }
      
      // Reset previous question state
      if (questionText) questionText.textContent = nodeData.question.text;
      if (optionsContainer) optionsContainer.innerHTML = '';
      if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
      }
      
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'none';
      }
      
      // Add options with clean event handling
      if (optionsContainer && nodeData.question.options) {
        nodeData.question.options.forEach((option, index) => {
          const optionBtn = document.createElement('button');
          optionBtn.classList.add('btn', 'btn-outline-primary', 'option-btn', 'mb-2', 'w-100');
          optionBtn.textContent = option;
          
          // Use a clean approach to event handling
          optionBtn.addEventListener('click', () => {
            this.answerQuestion(nodeData.id, index, nodeData.question);
          });
          
          optionsContainer.appendChild(optionBtn);
        });
      }
      
      // Show the question container
      this.showContainer(CONTAINER_TYPES.QUESTION);
    },
    
    // Answer a question
    answerQuestion: function(nodeId, answerIndex, question) {
      console.log(`Answering question for node ${nodeId}, selected option ${answerIndex}`);
      
      // Disable all options to prevent multiple submissions
      const options = document.querySelectorAll('.option-btn');
      options.forEach(opt => opt.disabled = true);
      
      ApiClient.answerQuestion(nodeId, answerIndex, question)
        .then(data => {
          // Show result
          this.showQuestionResult(data, answerIndex, question);
          
          // Check for game over
          if (data.game_state && data.game_state.character && 
              data.game_state.character.lives <= 0) {
            // Set timeout to show the result before game over
            setTimeout(() => {
              this.showGameOver();
            }, 2000);
          } else {
            // Set up continue button to mark node as completed
            const continueBtn = document.getElementById('continue-btn');
            if (continueBtn) {
              continueBtn.style.display = 'block';
              continueBtn.addEventListener('click', () => {
                GameState.completeNode(nodeId);
              });
            }
          }
        })
        .catch(error => {
          console.error('Error answering question:', error);
          UiUtils.showToast(`Error: ${error.message}`, "danger");
          
          // Re-enable options
          options.forEach(opt => opt.disabled = false);
        });
    },
    
    // Show question result
    showQuestionResult: function(data, selectedIndex, question) {
      const resultDiv = document.getElementById('question-result');
      
      if (!resultDiv) return;
      
      // Create result message
      resultDiv.innerHTML = `
        <div class="alert ${data.correct ? 'alert-success' : 'alert-danger'} mt-3">
          <strong>${data.correct ? 'Correct!' : 'Incorrect!'}</strong>
          <p>${data.explanation}</p>
          <div class="mt-2">
            ${data.correct 
              ? `<span class="badge bg-success">+${data.insight_gained || 10} Insight</span>` 
              : `<span class="badge bg-danger">-1 Life</span>`}
          </div>
        </div>
      `;
      
      // Show floating feedback
      if (data.correct) {
        UiUtils.showFloatingText(`+${data.insight_gained || 10} Insight`, 'success');
      } else {
        UiUtils.showFloatingText('-1 Life', 'danger');
      }
      
      // Highlight the selected option
      const options = document.querySelectorAll('.option-btn');
      if (options[selectedIndex]) {
        options[selectedIndex].classList.add(data.correct ? 'btn-success' : 'btn-danger');
        options[selectedIndex].classList.remove('btn-outline-primary');
      }
      
      // Highlight the correct answer if the user was wrong
      if (!data.correct && question.correct !== selectedIndex && options[question.correct]) {
        options[question.correct].classList.add('btn-success');
        options[question.correct].classList.remove('btn-outline-primary');
      }
      
      // Show result
      resultDiv.style.display = 'block';
    },
    
    // Show a treasure node
    showTreasure: function(nodeData) {
      console.log("Showing treasure node:", nodeData);
      
      // Get item data from node
      const item = nodeData.item;
      if (!item) {
        console.error("No item data in treasure node");
        GameState.completeNode(nodeData.id);
        return;
      }
      
      // Create treasure content
      const treasureContent = document.getElementById('treasure-content');
      if (!treasureContent) {
        GameState.completeNode(nodeData.id);
        return;
      }
      
      // Display item information
      treasureContent.innerHTML = `
        <div class="card mb-3">
          <div class="card-header bg-warning">
            <h4>${item.name}</h4>
            <span class="badge bg-secondary">${item.rarity || 'common'}</span>
          </div>
          <div class="card-body">
            <p>${item.description}</p>
            <div class="alert alert-info">
              <strong>Effect:</strong> ${this.getEffectDescription(item.effect)}
            </div>
            <button id="collect-item-btn" class="btn btn-success">Add to Inventory</button>
          </div>
        </div>
      `;
      
      // Set up event listener for the collect button
      const collectBtn = document.getElementById('collect-item-btn');
      if (collectBtn) {
        collectBtn.addEventListener('click', () => {
          // Add item to inventory - notify via event system
          EventSystem.emit(GAME_EVENTS.ITEM_ADDED, item);
          
          // Disable the button to prevent multiple collections
          collectBtn.disabled = true;
          collectBtn.textContent = "Added to Inventory";
        });
      }
      
      // Show the treasure container
      this.showContainer(CONTAINER_TYPES.TREASURE);
      
      // Set up event listener for continue button
      const continueBtn = document.getElementById('treasure-continue-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          console.log("Treasure continue button clicked - completing node");
          GameState.completeNode(nodeData.id);
        });
      }
    },
    
    // Get formatted effect description for an item
    getEffectDescription: function(effect) {
      if (!effect) return 'No effect';
      
      switch (effect.type) {
        case 'insight_boost': return `+${effect.value} Insight`;
        case 'restore_life': return `Restore ${effect.value} Life`;
        case 'question_hint': return effect.value;
        case 'category_boost': return effect.value;
        case 'extra_life': return effect.value;
        default: return effect.value || 'Unknown effect';
      }
    },
    
    // Show a rest node
    showRestNode: function(nodeData) {
      console.log("Showing rest node:", nodeData);
      
      // First show the container so elements exist in the DOM
      this.showContainer(CONTAINER_TYPES.REST);
      
      // Replace the rest options container to clear event listeners
      const restOptions = document.getElementById('rest-options');
      if (restOptions) {
        const newRestOptions = restOptions.cloneNode(false);
        
        // Recreate buttons
        newRestOptions.innerHTML = `
          <button id="rest-heal-btn" class="btn btn-success mb-2">Heal (+1 Life)</button>
          <button id="rest-study-btn" class="btn btn-primary mb-2">Study (+5 Insight)</button>
        `;
        
        // Replace container
        restOptions.parentNode.replaceChild(newRestOptions, restOptions);
        
        // Add event listeners to new buttons
        const healBtn = document.getElementById('rest-heal-btn');
        if (healBtn) {
          healBtn.addEventListener('click', function() {
            if (GameState.data.character.lives < GameState.data.character.max_lives) {
              GameState.data.character.lives += 1;
              
              // Notify of lives change
              EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
              
              // Show feedback
              UiUtils.showFloatingText('+1 Life', 'success');
              
              // Disable button
              this.disabled = true;
            } else {
              UiUtils.showFloatingText('Already at full health!', 'warning');
            }
          });
        }
        
        const studyBtn = document.getElementById('rest-study-btn');
        if (studyBtn) {
          studyBtn.addEventListener('click', function() {
            GameState.data.character.insight += 5;
            
            // Notify of insight change
            EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
            
            // Show feedback
            UiUtils.showFloatingText('+5 Insight', 'success');
            
            // Disable button
            this.disabled = true;
          });
        }
      }
      
      // Set up continue button
      const continueBtn = document.getElementById('rest-continue-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          console.log("Rest continue button clicked - completing node");
          GameState.completeNode(nodeData.id);
        });
      }
    },
    
    // Show an event node
    showEvent: function(nodeData) {
      console.log("Showing event node:", nodeData);
      
      const event = nodeData.event;
      if (!event) {
        console.error("No event data in event node");
        GameState.completeNode(nodeData.id);
        return;
      }
      
      // Get UI elements
      const eventTitle = document.getElementById('event-title');
      const eventDescription = document.getElementById('event-description');
      const eventOptions = document.getElementById('event-options');
      const eventResult = document.getElementById('event-result');
      const continueBtn = document.getElementById('event-continue-btn');
      const eventIcon = document.querySelector('.event-icon');
      
      // Update event icon based on title
      if (eventIcon) {
        const iconMap = {
          'Unexpected Discovery': '🔍',
          'Equipment Malfunction': '🔧',
          'Research Opportunity': '📚',
          'Conference Invitation': '🎓',
          'Challenging Patient': '👨‍⚕️',
          'Broken Dosimeter': '📊',
          'Protocol Update': '📋',
          'Late Night Call': '📱'
        };
        
        eventIcon.textContent = iconMap[event.title] || '📝';
      }
      
      // Set event details
      if (eventTitle) eventTitle.textContent = event.title;
      if (eventDescription) eventDescription.textContent = event.description;
      
      // Clear previous event state
      if (eventOptions) eventOptions.innerHTML = '';
      if (eventResult) eventResult.style.display = 'none';
      if (continueBtn) continueBtn.style.display = 'none';
      
      // Create option buttons
      if (eventOptions && event.options) {
        event.options.forEach((option, index) => {
          const optionBtn = document.createElement('button');
          optionBtn.classList.add('event-option');
          optionBtn.textContent = option.text;
          
          // Check if option has a requirement
          if (option.requirementType) {
            let canUseOption = false;
            let requirementText = '';
            
            // Check different requirement types
            if (option.requirementType === 'insight_check') {
              canUseOption = GameState.data.character.insight >= option.requirementValue;
              requirementText = `${option.requirementValue} Insight`;
            } else if (option.requirementType === 'item_check') {
              // Check if player has the required item
              const hasItem = GameState.data.inventory && 
                            GameState.data.inventory.some(item => item.id === option.requirementValue);
              canUseOption = hasItem;
              
              // Get item name for display
              let itemName = option.requirementValue;
              if (hasItem) {
                const item = GameState.data.inventory.find(item => item.id === option.requirementValue);
                if (item && item.name) {
                  itemName = item.name;
                }
              }
              requirementText = itemName;
            }
            
            if (!canUseOption) {
              optionBtn.classList.add('disabled');
              optionBtn.disabled = true;
              
              // Add requirement info
              const reqSpan = document.createElement('span');
              reqSpan.className = 'event-requirement';
              reqSpan.textContent = `Requires: ${requirementText}`;
              optionBtn.appendChild(reqSpan);
            } else {
              // Add visual indicator for available special options
              const specialSpan = document.createElement('span');
              specialSpan.className = 'event-requirement event-special';
              specialSpan.textContent = '✓ Available';
              optionBtn.appendChild(specialSpan);
            }
          }
          
          // Add click handler
          optionBtn.addEventListener('click', () => {
            this.handleEventOption(nodeData.id, index, option);
          });
          
          eventOptions.appendChild(optionBtn);
        });
      }
      
      // Show the event container with a fade-in effect
      const container = document.getElementById(CONTAINER_TYPES.EVENT);
      if (container) {
        container.style.opacity = '0';
        this.showContainer(CONTAINER_TYPES.EVENT);
        
        // Fade in animation
        setTimeout(() => {
          container.style.transition = 'opacity 0.5s';
          container.style.opacity = '1';
        }, 50);
      }
    },
    
    // Handle event option selection
    handleEventOption: function(nodeId, optionIndex, option) {
      console.log(`Selected event option ${optionIndex} for node ${nodeId}:`, option);
      
      // Disable all option buttons
      const optionButtons = document.querySelectorAll('#event-options button');
      optionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      });
      
      // Highlight selected option
      const selectedButton = optionButtons[optionIndex];
      if (selectedButton) {
        selectedButton.style.opacity = '1';
        selectedButton.style.borderColor = '#4CAF50';
        selectedButton.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
      }
      
      // Determine result type for styling
      let resultClass = 'event-result-neutral';
      if (option.outcome && option.outcome.effect) {
        const effectType = option.outcome.effect.type;
        if (effectType === 'insight_gain' || effectType === 'gain_life') {
          resultClass = 'event-result-success';
        } else if (effectType === 'insight_loss' || effectType === 'lose_life') {
          resultClass = 'event-result-negative';
        }
      }
      
      // Show the result with a slight delay for better UX
      setTimeout(() => {
        const eventResult = document.getElementById('event-result');
        const continueBtn = document.getElementById('event-continue-btn');
        
        if (eventResult && option.outcome) {
          eventResult.className = `alert mt-3 ${resultClass}`;
          eventResult.innerHTML = `
            <p>${option.outcome.description}</p>
            ${this.getEffectHTML(option.outcome.effect)}
          `;
          
          // Fade in the result
          eventResult.style.opacity = '0';
          eventResult.style.display = 'block';
          
          setTimeout(() => {
            eventResult.style.transition = 'opacity 0.5s';
            eventResult.style.opacity = '1';
          }, 50);
        }
        
        // Apply the effect after showing the result
        if (option.outcome && option.outcome.effect) {
          setTimeout(() => {
            this.applyEventEffect(option.outcome.effect);
          }, 500);
        }
        
        // Show continue button after a short delay
        setTimeout(() => {
          if (continueBtn) {
            continueBtn.style.display = 'block';
            continueBtn.addEventListener('click', () => {
              GameState.completeNode(nodeId);
            });
          }
        }, 1200);
      }, 600);
    },
    
    // Helper function to generate HTML for effect display
    getEffectHTML: function(effect) {
      if (!effect || !effect.type) return '';
      
      let iconClass = '';
      let text = '';
      
      switch (effect.type) {
        case 'insight_gain':
          iconClass = 'text-success';
          text = `+${effect.value} Insight`;
          break;
        case 'insight_loss':
          iconClass = 'text-danger';
          text = `-${effect.value} Insight`;
          break;
        case 'gain_life':
          iconClass = 'text-success';
          text = `+${effect.value} Life`;
          break;
        case 'lose_life':
          iconClass = 'text-danger';
          text = `-${effect.value} Life`;
          break;
        case 'gain_item':
          iconClass = 'text-primary';
          text = `Gained item: ${effect.value}`;
          break;
        default:
          return '';
      }
      
      return `<div class="effect-display ${iconClass}"><strong>${text}</strong></div>`;
    },
    
    // Apply event effect
    applyEventEffect: function(effect) {
      console.log("Applying event effect:", effect);
      
      if (!effect || !effect.type) return;
      
      // Apply effect based on type
      switch (effect.type) {
        case 'insight_gain':
          GameState.data.character.insight += effect.value;
          EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
          UiUtils.showFloatingText(`+${effect.value} Insight`, 'success');
          break;
          
        case 'insight_loss':
          GameState.data.character.insight = Math.max(0, GameState.data.character.insight - effect.value);
          EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
          UiUtils.showFloatingText(`-${effect.value} Insight`, 'danger');
          break;
          
        case 'gain_life':
          if (GameState.data.character.lives < GameState.data.character.max_lives) {
            GameState.data.character.lives += effect.value;
            EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
            UiUtils.showFloatingText(`+${effect.value} Life`, 'success');
          } else {
            UiUtils.showFloatingText('Already at max lives!', 'warning');
          }
          break;
          
        case 'lose_life':
          GameState.data.character.lives -= effect.value;
          EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
          UiUtils.showFloatingText(`-${effect.value} Life`, 'danger');
          
          // Check for game over
          if (GameState.data.character.lives <= 0) {
            setTimeout(() => {
              this.showGameOver();
            }, 1500);
          }
          break;
          
        case 'gain_item':
          // Find the item by id
          fetch(`/api/item/${effect.value}`)
            .then(response => response.json())
            .then(itemData => {
              if (itemData) {
                // Add item via event system
                EventSystem.emit(GAME_EVENTS.ITEM_ADDED, itemData);
                UiUtils.showFloatingText(`Gained ${itemData.name}!`, 'success');
              }
            })
            .catch(error => console.error('Error fetching item:', error));
          break;
      }
      
      // Save game state after effect
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
        ApiClient.saveGame().catch(err => 
          console.error("Failed to save game after event effect:", err)
        );
      }
    },
    
    // Show a shop node (placeholder implementation)
    showShop: function(nodeData) {
      console.log("Showing shop node:", nodeData);
      
      // Implementation for shop
      const shopContainer = document.getElementById(CONTAINER_TYPES.SHOP);
      if (!shopContainer) {
        console.error("Shop container not found");
        GameState.completeNode(nodeData.id);
        return;
      }
      
      // Placeholder shop content
      shopContainer.innerHTML = `
        <div class="card mb-3">
          <div class="card-header bg-info">
            <h4>${nodeData.title || 'Department Store'}</h4>
          </div>
          <div class="card-body">
            <p>The shop will be implemented in a future update.</p>
            <button id="shop-continue-btn" class="btn btn-primary">Continue</button>
          </div>
        </div>
      `;
      
      // Add event listener for continue button
      const continueBtn = document.getElementById('shop-continue-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          GameState.completeNode(nodeData.id);
        });
      }
      
      // Show shop container
      this.showContainer(CONTAINER_TYPES.SHOP);
    },
    
    // Show a gamble node (placeholder implementation)
    showGamble: function(nodeData) {
      console.log("Showing gamble node:", nodeData);
      
      // Implementation for gamble
      const gambleContainer = document.getElementById(CONTAINER_TYPES.GAMBLE);
      if (!gambleContainer) {
        console.error("Gamble container not found");
        GameState.completeNode(nodeData.id);
        return;
      }
      
      // Placeholder gamble content
      gambleContainer.innerHTML = `
        <div class="card mb-3">
          <div class="card-header bg-warning">
            <h4>${nodeData.title || 'Research Roulette'}</h4>
          </div>
          <div class="card-body">
            <p>The gamble node will be implemented in a future update.</p>
            <button id="gamble-continue-btn" class="btn btn-primary">Continue</button>
          </div>
        </div>
      `;
      
      // Add event listener for continue button
      const continueBtn = document.getElementById('gamble-continue-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          GameState.completeNode(nodeData.id);
        });
      }
      
      // Show gamble container
      this.showContainer(CONTAINER_TYPES.GAMBLE);
    },
    
    // Show game over screen
    showGameOver: function() {
      console.log("Game over!");
      
      // Update final score
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = GameState.data.character.insight;
      }
      
      // Hide game board
      const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
      if (gameBoardContainer) {
        gameBoardContainer.style.display = 'none';
      }
      
      // Show game over screen
      const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
      if (gameOverContainer) {
        gameOverContainer.style.display = 'block';
      }
      
      // Emit game over event
      EventSystem.emit(GAME_EVENTS.GAME_OVER, {
        finalScore: GameState.data.character.insight,
        floorReached: GameState.data.currentFloor
      });
    }
  };
  
  // Export globally
  window.NodeInteraction = NodeInteraction;
  window.CONTAINER_TYPES = CONTAINER_TYPES;