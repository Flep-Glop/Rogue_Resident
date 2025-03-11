// nodes.js - Node interaction (questions, treasure, etc)

window.Nodes = {
    // Function to hide all containers
    hideAllInteractionContainers: function() {
      // Hide all interaction containers
      const containers = document.querySelectorAll('.interaction-container');
      containers.forEach(container => {
        container.style.display = 'none';
      });
      
      // Game over is not an interaction container but should be hidden initially
      const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
      if (gameOverContainer) {
        gameOverContainer.style.display = 'none';
      }
      
      // Make sure the game board is visible
      const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
      if (gameBoardContainer) {
        gameBoardContainer.style.display = 'block';
      }
    },
    
    // Function to show a specific container and hide others
    showContainer: function(containerId) {
      this.hideAllInteractionContainers();
      const container = document.getElementById(containerId);
      if (container) {
        container.style.display = 'block';
      } else {
        console.error(`Container not found: ${containerId}`);
      }
    },
    
    // Improved clearEventListeners function in nodes.js
    clearEventListeners: function() {
      // Store references to all buttons that need listeners cleared
      const elements = [
          'continue-btn',
          'treasure-continue-btn',
          'rest-heal-btn',
          'rest-study-btn',
          'rest-continue-btn',
          'event-continue-btn',
          'collect-item-btn'
      ];
      
      // Clone and replace each element to remove all event listeners
      elements.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
              const newElement = element.cloneNode(true);
              element.parentNode.replaceChild(newElement, element);
          }
      });
      
      // Also clear option buttons if they exist
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
    
    // Replace the visitNode function in nodes.js
    visitNode: function(nodeId) {
      console.log(`Visiting node: ${nodeId}`);
      
      // First, clear any existing event listeners to prevent duplicates
      this.clearEventListeners();
      
      // Set this as the current node using our helper
      this.setCurrentNode(nodeId);
      
      fetch(`/api/node/${nodeId}`)
          .then(response => {
              if (!response.ok) {
                  throw new Error(`Server responded with status: ${response.status}`);
              }
              return response.json();
          })
          .then(nodeData => {
              console.log("Node data:", nodeData);
              
              // Handle different node types
              if (nodeData.type === 'question' || nodeData.type === 'elite' || nodeData.type === 'boss') {
                  this.showQuestion(nodeData);
              } else if (nodeData.type === 'treasure') {
                  this.showTreasure(nodeData);
              } else if (nodeData.type === 'rest') {
                  this.showRestNode(nodeData);
              } else if (nodeData.type === 'event') {
                  this.showEvent(nodeData);
              } else if (nodeData.type === 'shop') {
                  this.showShop(nodeData);
              } else if (nodeData.type === 'gamble') {
                  this.showGamble(nodeData);
              } else {
                  // Unknown node type
                  console.error(`Unknown node type: ${nodeData.type}`);
                  UiUtils.showToast(`Unknown node type: ${nodeData.type}`, 'danger');
                  this.markNodeVisited(nodeId);
              }
          })
          .catch(error => {
              console.error('Error visiting node:', error);
              UiUtils.showToast(`Failed to load node: ${error.message}`, 'danger');
          });
    },
    
    // Show question node
    showQuestion: function(nodeData) {
      const questionContainer = document.getElementById(CONTAINER_TYPES.QUESTION);
      const questionText = document.getElementById('question-text');
      const optionsContainer = document.getElementById('options-container');
      const resultDiv = document.getElementById('question-result');
      
      // Store current question for potential item use
      gameState.currentQuestion = nodeData.question;
      
      // Reset previous question state
      questionText.textContent = nodeData.question.text;
      optionsContainer.innerHTML = '';
      resultDiv.style.display = 'none';
      
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'none';
      }
      
      // Add options
      nodeData.question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.classList.add('btn', 'btn-outline-primary', 'option-btn', 'mb-2', 'w-100');
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', () => {
          this.answerQuestion(nodeData.id, index, nodeData.question);
        });
        optionsContainer.appendChild(optionBtn);
      });
      
      // Show the question container
      this.showContainer(CONTAINER_TYPES.QUESTION);
    },
    
    applyQuestionHint: function() {
      const questionContainer = document.getElementById(CONTAINER_TYPES.QUESTION);
      if (!questionContainer || questionContainer.style.display !== 'block') return false;
      
      // Get all option buttons
      const options = document.querySelectorAll('.option-btn');
      if (!options.length) return false;
      
      // Get correct answer from current question
      const currentQuestion = gameState.currentQuestion;
      if (!currentQuestion) return false;
      
      // Find wrong answers to eliminate (not the correct one)
      let wrongIndexes = [];
      for (let i = 0; i < options.length; i++) {
          if (i !== currentQuestion.correct) {
              wrongIndexes.push(i);
          }
      }
      
      // Randomly select one wrong answer to eliminate
      if (wrongIndexes.length > 0) {
          const randomWrongIndex = wrongIndexes[Math.floor(Math.random() * wrongIndexes.length)];
          const wrongOption = options[randomWrongIndex];
          
          // Check if this option is already eliminated
          if (wrongOption.classList.contains('eliminated-option')) {
              // Try to find another option that's not eliminated
              const nonEliminatedWrong = wrongIndexes.find(idx => 
                  !options[idx].classList.contains('eliminated-option')
              );
              
              if (nonEliminatedWrong !== undefined) {
                  const newWrongOption = options[nonEliminatedWrong];
                  // Cross out the wrong option
                  newWrongOption.classList.add('eliminated-option');
                  newWrongOption.innerHTML = `<s>${newWrongOption.textContent}</s> <span class="badge bg-danger">Incorrect</span>`;
                  newWrongOption.disabled = true;
              } else {
                  // All wrong options already eliminated
                  UiUtils.showFloatingText("All wrong answers already eliminated!", "warning");
                  return false;
              }
          } else {
              // Cross out the wrong option
              wrongOption.classList.add('eliminated-option');
              wrongOption.innerHTML = `<s>${wrongOption.textContent}</s> <span class="badge bg-danger">Incorrect</span>`;
              wrongOption.disabled = true;
          }
          
          // Show feedback
          UiUtils.showFloatingText("Eliminated one wrong answer!", "success");
          return true;
      }
      
      return false;
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
          
          // Update game state
          if (data.game_state && data.game_state.character) {
            gameState.character = data.game_state.character;
            Character.updateCharacterInfo(gameState.character);
          }
          
          // Check for game over
          if (gameState.character.lives <= 0) {
            // Set timeout to show the result before game over
            setTimeout(() => {
              this.showGameOver();
            }, 2000);
          } else {
            // Set up continue button to mark node as visited
            this.setupContinueButton(() => {
              this.markNodeVisited(nodeId);
              this.showContainer(CONTAINER_TYPES.MAP); // Return to map
            });
          }
        })
        .catch(error => {
          console.error('Error answering question:', error);
          UiUtils.showError(`Error submitting answer: ${error.message}`);
          
          // Re-enable options
          options.forEach(opt => opt.disabled = false);
        });
    },
    
    // Show question result
    showQuestionResult: function(data, selectedIndex, question) {
      const resultDiv = document.getElementById('question-result');
      const continueBtn = document.getElementById('continue-btn');
      
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
      if (!data.correct && question.correct !== selectedIndex) {
        options[question.correct].classList.add('btn-success');
        options[question.correct].classList.remove('btn-outline-primary');
      }
      
      // Show result and continue button
      resultDiv.style.display = 'block';
      if (continueBtn) {
        continueBtn.style.display = 'block';
      }
    },
    
    // Replace the showRestNode function in nodes.js with this version
    showRestNode: function(nodeData) {
      console.log("Showing rest node:", nodeData);
      
      // First show the container so elements exist in the DOM
      this.showContainer(CONTAINER_TYPES.REST);
      
      // Get button elements after the container is shown
      const healBtn = document.getElementById('rest-heal-btn');
      const studyBtn = document.getElementById('rest-study-btn');
      const continueBtn = document.getElementById('rest-continue-btn');
      
      // Remove ALL existing event listeners by cloning parent element and replacing content
      const restOptions = document.getElementById('rest-options');
      if (restOptions) {
          const newRestOptions = restOptions.cloneNode(false); // Clone without children
          
          // Recreate the buttons
          newRestOptions.innerHTML = `
              <button id="rest-heal-btn" class="btn btn-success mb-2">Heal (+1 Life)</button>
              <button id="rest-study-btn" class="btn btn-primary mb-2">Study (+5 Insight)</button>
          `;
          
          // Replace the old container
          restOptions.parentNode.replaceChild(newRestOptions, restOptions);
          
          // Get the new buttons
          const newHealBtn = document.getElementById('rest-heal-btn');
          const newStudyBtn = document.getElementById('rest-study-btn');
          
          // Add event listeners to new buttons
          if (newHealBtn) {
              newHealBtn.addEventListener('click', function() {
                  console.log("Heal button clicked");
                  if (gameState.character.lives < gameState.character.max_lives) {
                      gameState.character.lives += 1;
                      Character.updateCharacterInfo(gameState.character);
                      UiUtils.showFloatingText('+1 Life', 'success');
                      this.disabled = true;
                  } else {
                      UiUtils.showFloatingText('Already at full health!', 'warning');
                  }
              });
          }
          
          if (newStudyBtn) {
              newStudyBtn.addEventListener('click', function() {
                  console.log("Study button clicked");
                  gameState.character.insight += 5;
                  Character.updateCharacterInfo(gameState.character);
                  UiUtils.showFloatingText('+5 Insight', 'success');
                  this.disabled = true;
              });
          }
      }
      
      // Reset and add event listener for continue button
      if (continueBtn) {
          // Clone and replace to remove old event listeners
          const newContinueBtn = continueBtn.cloneNode(true);
          continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
          
          // Add event listener to the new button
          newContinueBtn.addEventListener('click', () => {
              console.log("Continue button clicked");
              if (gameState.currentNode) {
                  this.markNodeVisited(gameState.currentNode);
                  this.showContainer(CONTAINER_TYPES.MAP);
                  
                  // Save game state
                  if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
                      ApiClient.saveGame().catch(err => console.error("Failed to save game after rest:", err));
                  }
              }
          });
      }
      
      console.log("Rest node setup complete, buttons should be working");
    },
    
    // Show shop node
    showShop: function(nodeData) {
      console.log("Showing shop node:", nodeData);
      
      // Implementation for future shop functionality
      const shopContainer = document.getElementById(CONTAINER_TYPES.SHOP);
      if (!shopContainer) {
        console.error("Shop container not found");
        this.markNodeVisited(nodeData.id);
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
          this.markNodeVisited(nodeData.id);
          this.showContainer(CONTAINER_TYPES.MAP);
        });
      }
      
      // Show shop container
      this.showContainer(CONTAINER_TYPES.SHOP);
    },
    
    // Show gamble node
    showGamble: function(nodeData) {
      console.log("Showing gamble node:", nodeData);
      
      // Implementation for future gamble functionality
      const gambleContainer = document.getElementById(CONTAINER_TYPES.GAMBLE);
      if (!gambleContainer) {
        console.error("Gamble container not found");
        this.markNodeVisited(nodeData.id);
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
          this.markNodeVisited(nodeData.id);
          this.showContainer(CONTAINER_TYPES.MAP);
        });
      }
      
      // Show gamble container
      this.showContainer(CONTAINER_TYPES.GAMBLE);
    },
    
    // Replace the markNodeVisited function in nodes.js
    markNodeVisited: function(nodeId) {
      console.log(`Marking node ${nodeId} as visited`);
      
      // Find the node that's being marked as visited
      let visitedNode = null;
      
      if (gameState.map.nodes && gameState.map.nodes[nodeId]) {
          visitedNode = gameState.map.nodes[nodeId];
          gameState.map.nodes[nodeId].visited = true;
          gameState.map.nodes[nodeId].current = false;
      } else if (gameState.map.boss && gameState.map.boss.id === nodeId) {
          visitedNode = gameState.map.boss;
          gameState.map.boss.visited = true;
          gameState.map.boss.current = false;
      }
      
      // Log the node that was visited and its paths
      if (visitedNode) {
          console.log(`Node ${nodeId} marked as visited with paths:`, visitedNode.paths);
      }
      
      // Clear current node
      gameState.currentNode = null;
      
      // Update on server
      ApiClient.markNodeVisited(nodeId)
          .then(data => {
              console.log("Server response after marking node visited:", data);
              
              // Check if all nodes are visited
              if (data.all_nodes_visited) {
                  console.log("All nodes visited, showing next floor button");
                  const nextFloorBtn = document.getElementById('next-floor-btn');
                  if (nextFloorBtn) {
                      nextFloorBtn.style.display = 'block';
                  }
              }
              
              // Update game state from server response if provided
              if (data.game_state) {
                  console.log("Updating game state from server response");
                  // We keep the local map data because it has UI state not persisted on server
                  const localMap = gameState.map;
                  gameState = data.game_state;
                  gameState.map = localMap;
              }
              
              // Render the updated map
              console.log("Re-rendering map");
              MapRenderer.renderFloorMap(gameState.map, CONTAINER_TYPES.MAP);
              
              // Save game state
              if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
                  ApiClient.saveGame()
                      .then(() => console.log("Game saved after marking node visited"))
                      .catch(err => console.error("Failed to save game after marking node visited:", err));
              }
          })
          .catch(error => {
              console.error('Error marking node as visited:', error);
              UiUtils.showToast(`Error marking node as visited: ${error.message}`, 'danger');
          });
    },
    
    // Go to the next floor
    goToNextFloor: function() {
      console.log("Going to next floor...");
      
      ApiClient.goToNextFloor()
        .then(data => {
          // Update global game state
          gameState.character = data.character;
          gameState.currentFloor = data.current_floor;
          gameState.currentNode = null;
          gameState.map = null;  // Clear map so new one will be generated
          
          // Update UI
          Character.updateCharacterInfo(data.character);
          document.getElementById('current-floor').textContent = data.current_floor;
          
          // Hide next floor button
          const nextFloorBtn = document.getElementById('next-floor-btn');
          if (nextFloorBtn) {
            nextFloorBtn.style.display = 'none';
          }
          
          // Show floor transition
          UiUtils.showFloorTransition(data.current_floor);
          
          // Initialize new floor map
          MapRenderer.initializeFloorMap();
        })
        .catch(error => {
          console.error('Error going to next floor:', error);
          UiUtils.showError(`Failed to advance to next floor: ${error.message}`);
        });
    },
    // Implement complete showTreasure function 
    showTreasure: function(nodeData) {
      console.log("Showing treasure node:", nodeData);
      
      // Get item data from node
      const item = nodeData.item;
      if (!item) {
        console.error("No item data in treasure node");
        this.markNodeVisited(nodeData.id);
        return;
      }
      
      // Create treasure content
      const treasureContent = document.getElementById('treasure-content');
      if (!treasureContent) return;
      
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
              <strong>Effect:</strong> ${Character.getEffectDescription(item.effect)}
            </div>
            <button id="collect-item-btn" class="btn btn-success">Add to Inventory</button>
          </div>
        </div>
      `;
      
      // Set up event listener for the collect button
      const collectBtn = document.getElementById('collect-item-btn');
      if (collectBtn) {
        collectBtn.addEventListener('click', () => {
          // Add item to inventory
          const added = Character.addItemToInventory(item);
          
          if (added) {
            // Disable the button to prevent multiple collections
            collectBtn.disabled = true;
            collectBtn.textContent = "Added to Inventory";
          }
        });
      }
      
      // Show the treasure container
      this.showContainer(CONTAINER_TYPES.TREASURE);
    },

    // Show event node
    showEvent: function(nodeData) {
      console.log("Showing event node:", nodeData);
      
      const event = nodeData.event;
      if (!event) {
          console.error("No event data in event node");
          this.markNodeVisited(nodeData.id);
          return;
      }
      
      // Set event title and description
      const eventTitle = document.getElementById('event-title');
      const eventDescription = document.getElementById('event-description');
      const eventOptions = document.getElementById('event-options');
      const eventResult = document.getElementById('event-result');
      const continueBtn = document.getElementById('event-continue-btn');
      const eventIcon = document.querySelector('.event-icon');
      
      // Update event icon based on title (simple mapping)
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
      
      if (eventTitle) eventTitle.textContent = event.title;
      if (eventDescription) eventDescription.textContent = event.description;
      if (eventOptions) {
          eventOptions.innerHTML = '';
          
          // Create option buttons
          event.options.forEach((option, index) => {
              const optionBtn = document.createElement('button');
              optionBtn.classList.add('event-option');
              optionBtn.textContent = option.text;
              
              // Check if option has requirement
              if (option.requirementType) {
                  let canUseOption = false;
                  let requirementText = '';
                  
                  // Check different requirement types
                  if (option.requirementType === 'insight_check') {
                      canUseOption = gameState.character.insight >= option.requirementValue;
                      requirementText = `${option.requirementValue} Insight`;
                  } else if (option.requirementType === 'item_check') {
                      // Check if player has the required item
                      const hasItem = gameState.inventory && 
                                    gameState.inventory.some(item => item.id === option.requirementValue);
                      canUseOption = hasItem;
                      
                      // Get item name instead of ID for display
                      let itemName = option.requirementValue;
                      if (hasItem) {
                          const item = gameState.inventory.find(item => item.id === option.requirementValue);
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
      
      // Reset result and hide continue button
      if (eventResult) eventResult.style.display = 'none';
      if (continueBtn) continueBtn.style.display = 'none';
      
      // Show the event container with a fade-in effect
      const container = document.getElementById(CONTAINER_TYPES.EVENT);
      container.style.opacity = '0';
      this.showContainer(CONTAINER_TYPES.EVENT);
      
      // Fade in animation
      setTimeout(() => {
          container.style.transition = 'opacity 0.5s';
          container.style.opacity = '1';
      }, 50);
    },

    // Handle event option selection
    handleEventOption: function(nodeId, optionIndex, option) {
      console.log(`Selected event option ${optionIndex} for node ${nodeId}:`, option);
      
      // Play selection sound (if you have one)
      // UiUtils.playSound('click');
      
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
      if (option.outcome.effect) {
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
          
          if (eventResult) {
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
          if (option.outcome.effect) {
              setTimeout(() => {
                  this.applyEventEffect(option.outcome.effect);
              }, 500);
          }
          
          // Show continue button after a short delay
          setTimeout(() => {
              if (continueBtn) {
                  continueBtn.style.display = 'block';
                  continueBtn.addEventListener('click', () => {
                      this.markNodeVisited(nodeId);
                      this.showContainer(CONTAINER_TYPES.MAP);
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
      
      // Add some visual flair based on effect type
      let animationClass = '';
      let floatingTextType = '';
      
      switch (effect.type) {
          case 'insight_gain':
              gameState.character.insight += effect.value;
              animationClass = 'insight-gain-animation';
              floatingTextType = 'success';
              break;
              
          case 'insight_loss':
              gameState.character.insight = Math.max(0, gameState.character.insight - effect.value);
              animationClass = 'insight-loss-animation';
              floatingTextType = 'danger';
              break;
              
          case 'gain_life':
              if (gameState.character.lives < gameState.character.max_lives) {
                  gameState.character.lives += effect.value;
                  animationClass = 'life-gain-animation';
                  floatingTextType = 'success';
              } else {
                  // Already at max lives
                  UiUtils.showFloatingText('Already at max lives!', 'warning');
                  return;
              }
              break;
              
          case 'lose_life':
              gameState.character.lives -= effect.value;
              animationClass = 'life-loss-animation';
              floatingTextType = 'danger';
              
              // Check for game over
              if (gameState.character.lives <= 0) {
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
                          const added = Character.addItemToInventory(itemData);
                          if (added) {
                              animationClass = 'item-gain-animation';
                              UiUtils.showFloatingText(`Gained ${itemData.name}!`, 'success');
                          }
                      }
                  })
                  .catch(error => console.error('Error fetching item:', error));
              return; // Early return since this is async
      }
      
      // Apply animation to character info section
      const characterInfo = document.querySelector('.character-stats');
      if (characterInfo && animationClass) {
          characterInfo.classList.add(animationClass);
          setTimeout(() => {
              characterInfo.classList.remove(animationClass);
          }, 1000);
      }
      
      // Show floating text for the effect
      let effectText = '';
      if (effect.type === 'insight_gain') effectText = `+${effect.value} Insight`;
      else if (effect.type === 'insight_loss') effectText = `-${effect.value} Insight`;
      else if (effect.type === 'gain_life') effectText = `+${effect.value} Life`;
      else if (effect.type === 'lose_life') effectText = `-${effect.value} Life`;
      
      if (effectText) {
          UiUtils.showFloatingText(effectText, floatingTextType);
      }
      
      // Update character display
      Character.updateCharacterInfo(gameState.character);
      
      // Save game state to server
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
          ApiClient.saveGame().catch(err => console.error("Failed to save game after event effect:", err));
      }
    },

    // Show game over screen
    showGameOver: function() {
      // Update final score
      const finalScoreElement = document.getElementById('final-score');
      if (finalScoreElement) {
        finalScoreElement.textContent = gameState.character.insight;
      }
      
      // Hide game board
      const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
      if (gameBoardContainer) {
        gameBoardContainer.style.display = 'none';
      }
      
      // Show game over
      const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
      if (gameOverContainer) {
        gameOverContainer.style.display = 'block';
      }
    },
    
    // Generic event handler for continue button
    setupContinueButton: function(onContinue) {
      const continueBtn = document.getElementById('continue-btn');
      if (!continueBtn) return;
      
      continueBtn.style.display = 'block';
      continueBtn.addEventListener('click', onContinue);
    },
    // Add this function to the Nodes object in nodes.js
    setCurrentNode: function(nodeId) {
      console.log(`Setting current node to ${nodeId}`);
      
      // Clear current status from all nodes
      if (gameState.map && gameState.map.nodes) {
          Object.values(gameState.map.nodes).forEach(node => {
              node.current = false;
          });
      }
      
      if (gameState.map && gameState.map.boss) {
          gameState.map.boss.current = false;
      }
      
      if (gameState.map && gameState.map.start) {
          gameState.map.start.current = false;
      }
      
      // Set current node
      if (nodeId) {
          if (gameState.map && gameState.map.nodes && gameState.map.nodes[nodeId]) {
              gameState.map.nodes[nodeId].current = true;
          } else if (gameState.map && gameState.map.boss && gameState.map.boss.id === nodeId) {
              gameState.map.boss.current = true;
          } else if (gameState.map && gameState.map.start && gameState.map.start.id === nodeId) {
              gameState.map.start.current = true;
          }
      }
      
      // Set in game state
      gameState.currentNode = nodeId;
      
      // Render the map to show the current node
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.renderFloorMap === 'function') {
          MapRenderer.renderFloorMap(gameState.map, CONTAINER_TYPES.MAP);
      }
    }
  };