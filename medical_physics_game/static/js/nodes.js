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
    
    // Clear event listeners to prevent duplicates
    clearEventListeners: function() {
      // Clear continue button
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        const newBtn = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newBtn, continueBtn);
      }
      
      // Clear question options
      const optionsContainer = document.getElementById('options-container');
      if (optionsContainer) {
        const newContainer = optionsContainer.cloneNode(false);
        optionsContainer.parentNode.replaceChild(newContainer, optionsContainer);
      }
      
      // Clear other buttons...
    },
    
    // Node visit handling
    visitNode: function(nodeId) {
      console.log(`Visiting node: ${nodeId}`);
      
      // First, clear any existing event listeners to prevent duplicates
      this.clearEventListeners();
      
      // Mark this as the current node
      gameState.currentNode = nodeId;
      
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
            alert(`Unknown node type: ${nodeData.type}`);
            this.markNodeVisited(nodeId);
          }
          
          // Update map to highlight current node
          MapRenderer.renderFloorMap(gameState.map, CONTAINER_TYPES.MAP);
        })
        .catch(error => {
          console.error('Error visiting node:', error);
          UiUtils.showError(`Failed to load node: ${error.message}`);
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
    
    // Apply a hint to the current question
    applyQuestionHint: function() {
      const questionContainer = document.getElementById(CONTAINER_TYPES.QUESTION);
      if (!questionContainer || questionContainer.style.display !== 'block') return;
      
      // Get all option buttons
      const options = document.querySelectorAll('.option-btn');
      if (!options.length) return;
      
      // Get correct answer from current question
      const currentQuestion = gameState.currentQuestion;
      if (!currentQuestion) return;
      
      // Find a wrong answer to eliminate (not the correct one)
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
        
        // Cross out the wrong option
        wrongOption.classList.add('eliminated-option');
        wrongOption.innerHTML = `<s>${wrongOption.innerHTML}</s> <span class="badge bg-danger">Incorrect</span>`;
        wrongOption.disabled = true;
        
        // Show feedback
        UiUtils.showFloatingText("Eliminated one wrong answer!", "success");
      }
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
    
    // Show treasure node
    showTreasure: function(nodeData) {
      // Implementation for showing treasure node
      // ...
    },
    
    // Show rest node
    showRestNode: function(nodeData) {
      // Implementation for showing rest node
      // ...
    },
    
    // Show event node
    showEvent: function(nodeData) {
      // Implementation for showing event node
      // ...
    },
    
    // Handle event option selection
    handleEventOption: function(nodeId, optionIndex, option) {
      // Implementation for handling event options
      // ...
    },
    
    // Apply event effect
    applyEventEffect: function(effect) {
      // Implementation for applying event effects
      // ...
    },
    
    // Show shop node
    showShop: function(nodeData) {
      // Implementation for showing shop node
      // ...
    },
    
    // Show gamble node
    showGamble: function(nodeData) {
      // Implementation for showing gamble node
      // ...
    },
    
    // Function to mark a node as visited
    markNodeVisited: function(nodeId) {
      // Update local game state
      if (gameState.map && gameState.map.nodes && gameState.map.nodes[nodeId]) {
        gameState.map.nodes[nodeId].visited = true;
      } else if (gameState.map && gameState.map.boss && gameState.map.boss.id === nodeId) {
        gameState.map.boss.visited = true;
      }
      
      // Clear current node
      gameState.currentNode = null;
      
      // Update on server
      ApiClient.markNodeVisited(nodeId)
        .then(data => {
          // Check if all nodes are visited
          if (data.all_nodes_visited) {
            // Show next floor button
            const nextFloorBtn = document.getElementById('next-floor-btn');
            if (nextFloorBtn) {
              nextFloorBtn.style.display = 'block';
            }
          }
          
          // Render the updated map
          MapRenderer.renderFloorMap(gameState.map, CONTAINER_TYPES.MAP);
        })
        .catch(error => console.error('Error marking node as visited:', error));
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
    }
  };