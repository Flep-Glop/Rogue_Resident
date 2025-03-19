// question_component.js - Refactored implementation
const QuestionComponent = ComponentUtils.createComponent('question', {
  // Initialize component
  initialize: function() {
    console.log("Initializing question component");
    
    // Register for state updates
    GameState.addObserver((eventType, data) => {
      // Reset component UI state whenever a new node is selected
      if (eventType === 'currentNodeChanged') {
        this.setUiState('questionAnswered', false);
        this.setUiState('selectedOptionIndex', null);
      }
    });
    
    // Subscribe to design bridge changes if available
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // If we have an active question, we could update colors dynamically
    const container = document.getElementById('question-container');
    if (container && container.style.display !== 'none') {
      // Could refresh UI elements with new design tokens if needed
    }
  },
  
  render: function(nodeData, container) {
    console.log("Rendering question component", nodeData);
    
    // Store node data in UI state for future reference
    this.setUiState('currentNodeData', nodeData);
    
    // Validate node data
    if (!nodeData || !nodeData.id) {
      console.error("Invalid node data provided to question component:", nodeData);
      container.innerHTML = `
        <div class="game-panel shadow-md">
          <div class="alert alert-danger">
            <h4>Error Loading Question</h4>
            <p>Unable to load question data. Please refresh and try again.</p>
          </div>
          <button id="error-continue-btn" class="game-btn game-btn--primary mt-md">Continue</button>
        </div>
      `;
      this.bindAction('error-continue-btn', 'click', 'continue', { nodeData });
      return;
    }
    
    // Check if the question data is missing
    if (!nodeData.question) {
      console.warn("Missing question data in node:", nodeData);
      
      // Attempt to fetch question data from server
      this.fetchQuestionData(nodeData)
        .then(updatedNodeData => {
          // Retry render with updated data
          this.render(updatedNodeData, container);
        })
        .catch(error => {
          console.error("Failed to fetch question data:", error);
          
          // Create fallback question
          const fallbackQuestion = {
            text: "What is the primary goal of medical physics?",
            options: [
              "Ensuring the safe use of radiation in medicine",
              "Maximizing radiation dose to all tissues",
              "Eliminating the need for physicians",
              "Avoiding the use of technology in healthcare"
            ],
            correct: 0,
            explanation: "Medical physics focuses on the safe and effective applications of physics principles in medical settings."
          };
          
          // Create a copy of the node data with the fallback question
          const updatedNodeData = {...nodeData, question: fallbackQuestion};
          
          // Update UI state
          this.setUiState('currentNodeData', updatedNodeData);
          
          // Retry render with fallback data
          this.render(updatedNodeData, container);
        });
      
      // Show loading state
      container.innerHTML = `
        <div class="game-panel shadow-md">
          <h3 class="game-panel__title">Loading Question...</h3>
          <div class="text-center p-md">
            <div class="spinner-border mb-sm"></div>
            <p>Retrieving question data...</p>
          </div>
        </div>
      `;
      return;
    }
    
    // Get colors from design bridge if available
    const questionColor = window.DesignBridge?.colors?.nodeQuestion || '#5b8dd9';
    const primaryColor = window.DesignBridge?.colors?.primary || '#5b8dd9';
    
    // Determine node type styling
    const isElite = nodeData.type === 'elite';
    const isBoss = nodeData.type === 'boss';
    
    // Choose panel style based on node type
    const panelClass = isElite ? 'game-panel--warning' : 
                       isBoss ? 'game-panel--danger' : 'game-panel--primary';
    
    // Create question UI
    container.innerHTML = `
      <div class="game-panel ${panelClass} anim-fade-in">
        <div class="game-panel__title">
          ${this.getQuestionTitle(nodeData)}
          ${this.getDifficultyBadge(nodeData.question.difficulty)}
        </div>
        
        <div class="p-sm mb-md bg-dark-alt rounded-md">
          <p id="question-text" class="text-light">${nodeData.question?.text || 'No question text available'}</p>
          ${this.getCategoryTag(nodeData.question)}
        </div>
        
        <div id="options-container" class="mb-lg"></div>
        
        <div id="question-result" class="alert mb-md" style="display: none;"></div>
        
        <button id="continue-btn" class="game-btn game-btn--primary w-full anim-pulse-scale" style="display: none;">
          Continue
        </button>
      </div>
    `;
    
    // Add options
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer && nodeData.question?.options) {
      this.renderOptions(optionsContainer, nodeData.question.options);
    }
    
    // If question was already answered in this session, show the result
    if (this.getUiState('questionAnswered') && this.getUiState('selectedOptionIndex') !== null) {
      this.showQuestionResult(
        this.getUiState('resultData'),
        this.getUiState('selectedOptionIndex'),
        nodeData.question
      );
      
      // Disable all options
      this.disableOptions(optionsContainer);
      
      // Show continue button
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'block';
        this.bindAction('continue-btn', 'click', 'continue', { nodeData });
      }
    }
  },
  
  // Add a method to fetch question data if it's missing
  fetchQuestionData: function(nodeData) {
    console.log("Attempting to fetch question data for node:", nodeData.id);
    
    return new Promise((resolve, reject) => {
      // Try to fetch from backend
      fetch(`/api/get-question?node_id=${nodeData.id}&type=${nodeData.type}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch question data: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.question) {
            throw new Error("API response missing question data");
          }
          
          // Create a copy of the node data with the question
          const updatedNodeData = {...nodeData, question: data.question};
          resolve(updatedNodeData);
        })
        .catch(error => {
          console.error("Error fetching question data:", error);
          reject(error);
        });
        
      // Add timeout for the request
      setTimeout(() => {
        reject(new Error("Request timed out"));
      }, 5000);
    });
  },
  
  renderOptions: function(container, options) {
    if (!container || !options || !options.length) return;
    
    // Get current node data to ensure it's passed to action handlers
    const currentNodeData = this.getCurrentNodeData();
    
    // Create option buttons
    options.forEach((option, index) => {
      const optionEl = document.createElement('button');
      optionEl.className = 'game-option w-full mb-sm';
      optionEl.dataset.index = index;
      optionEl.textContent = option;
      
      // Add click handler with FULL node data including question
      this.bindAction(optionEl, 'click', 'answer', { 
        index: index,
        nodeData: currentNodeData // Pass the complete node data
      });
      
      container.appendChild(optionEl);
    });
  },
  
  // Add this helper method to get current node data
  getCurrentNodeData: function() {
    // First try to get from GameState's current node
    if (GameState && GameState.data && GameState.data.currentNode) {
      const nodeId = GameState.data.currentNode;
      const nodeData = GameState.getNodeById(nodeId);
      if (nodeData) {
        return nodeData;
      }
    }
    
    // If not available, check UI state
    const nodeData = this.getUiState('currentNodeData');
    if (nodeData) {
      return nodeData;
    }
    
    // Last resort - create minimal valid structure
    return {
      id: 'unknown',
      type: 'question'
    };
  },
  
  // Disable all option buttons
  disableOptions: function(container) {
    if (!container) return;
    
    const buttons = container.querySelectorAll('.game-option');
    buttons.forEach(button => {
      button.disabled = true;
      button.classList.add('disabled');
    });
  },
  
  // Get appropriate title based on node type
  getQuestionTitle: function(nodeData) {
    if (nodeData.type === 'elite') {
      return 'Challenging Question';
    } else if (nodeData.type === 'boss') {
      return 'Final Assessment';
    } else {
      return nodeData.title || 'Physics Question';
    }
  },
  
  // Get difficulty badge
  getDifficultyBadge: function(difficulty) {
    if (!difficulty) return '';
    
    const difficultyText = difficulty === 1 ? 'Easy' : 
                          difficulty === 2 ? 'Medium' : 'Hard';
    
    const badgeClass = difficulty === 1 ? 'badge-secondary' : 
                      difficulty === 2 ? 'badge-warning' : 'badge-danger';
    
    return `<span class="badge ${badgeClass} float-right">Difficulty: ${difficultyText}</span>`;
  },
  
  // Get category tag if available
  getCategoryTag: function(question) {
    if (!question || !question.category_name) return '';
    
    return `
      <div class="mt-xs">
        <span class="badge badge-primary">${question.category_name}</span>
      </div>
    `;
  },
  
  handleAction: function(nodeData, action, data) {
    console.log(`Question component handling action: ${action}`, data);
    
    // Ensure we always have valid nodeData
    const validNodeData = nodeData || data.nodeData || this.getCurrentNodeData();
    
    if (!validNodeData) {
      console.error("Missing node data in handleAction", {action, data});
      this.showToast("An error occurred. Please try again.", "danger");
      return;
    }
    
    // Store current node data in UI state for future reference
    this.setUiState('currentNodeData', validNodeData);
    
    switch (action) {
      case 'answer':
        this.answerQuestion(validNodeData, data.index);
        break;
        
      case 'continue':
        this.completeNode(validNodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  },
  
  // Updated answerQuestion method with improved error handling
  answerQuestion: function(nodeData, answerIndex) {
    // Validate inputs
    if (!nodeData || !nodeData.id) {
      console.error("Invalid node data in answerQuestion:", nodeData);
      this.showToast("Error processing question. Please try again.", "danger");
      return;
    }
    
    // Make sure we have the question data
    if (!nodeData.question) {
      console.error("Missing question data in node:", nodeData);
      this.showToast("Error: Question data is missing. Please try again.", "danger");
      return;
    }
    
    console.log(`Answering question for node ${nodeData.id}, selected option ${answerIndex}`);
    console.log("Question data:", nodeData.question);
    
    // Save selected option in UI state
    this.setUiState('selectedOptionIndex', answerIndex);
    
    // Disable all options to prevent multiple submissions
    const optionsContainer = document.getElementById('options-container');
    this.disableOptions(optionsContainer);
    
    // Apply visual feedback immediately
    const selectedOption = optionsContainer.querySelector(`.game-option[data-index="${answerIndex}"]`);
    if (selectedOption) {
      selectedOption.classList.add('anim-pulse-opacity');
    }
    
    // Call API to check answer
    ApiClient.answerQuestion(nodeData.id, answerIndex, nodeData.question)
      .then(data => {
        // Save result data in UI state
        this.setUiState('questionAnswered', true);
        this.setUiState('resultData', data);
        
        // Show result
        this.showQuestionResult(data, answerIndex, nodeData.question);
        
        // Check for game over
        if (data.game_state && data.game_state.character && 
            data.game_state.character.lives <= 0) {
          // Set timeout to show the result before game over
          setTimeout(() => {
            if (typeof NodeInteraction !== 'undefined' && NodeInteraction.showGameOver) {
              NodeInteraction.showGameOver();
            }
          }, 2000);
        } else {
          // Set up continue button
          const continueBtn = document.getElementById('continue-btn');
          if (continueBtn) {
            continueBtn.style.display = 'block';
            this.bindAction('continue-btn', 'click', 'continue', { nodeData });
          }
        }
      })
      .catch(error => {
        ErrorHandler.handleError(
          error,
          "Question Answering", 
          ErrorHandler.SEVERITY.WARNING
        );
        
        console.log("Using fallback for question answer handling due to API error");
        
        // Enhanced fallback with better error handling
        if (nodeData.question && typeof nodeData.question.correct === 'number') {
          // Create a mock response based on the correct answer in question data
          const isCorrect = answerIndex === nodeData.question.correct;
          const fallbackData = {
            correct: isCorrect,
            explanation: nodeData.question.explanation || 
                        (isCorrect ? "Correct!" : "Incorrect answer."),
            insight_gained: isCorrect ? 10 : 0
          };
          
          // Log fallback
          console.log("Using fallback response:", fallbackData);
          
          // Save result data in UI state
          this.setUiState('questionAnswered', true);
          this.setUiState('resultData', fallbackData);
          
          // Show result using fallback data
          this.showQuestionResult(fallbackData, answerIndex, nodeData.question);
          
          // Update character stats based on result
          if (isCorrect) {
            // Award insight
            this.updatePlayerInsight(fallbackData.insight_gained || 10);
          } else {
            // Lose a life
            this.updatePlayerLives(-1);
            
            // Check for game over
            if (this.getPlayerLives() <= 0) {
              setTimeout(() => {
                if (typeof NodeInteraction !== 'undefined' && NodeInteraction.showGameOver) {
                  NodeInteraction.showGameOver();
                }
              }, 2000);
            }
          }
          
          // Show continue button
          const continueBtn = document.getElementById('continue-btn');
          if (continueBtn) {
            continueBtn.style.display = 'block';
            this.bindAction('continue-btn', 'click', 'continue', { nodeData });
          }
        } else {
          console.error("Fallback failed - question data incomplete:", nodeData.question);
          // Re-enable options if we can't use the fallback
          const options = document.querySelectorAll('.game-option');
          options.forEach(opt => {
            opt.disabled = false;
            opt.classList.remove('disabled');
          });
          
          // Show error toast
          this.showToast("There was a problem processing your answer. Please try again.", "danger");
        }
      });
  },
  
  // Show question result
  showQuestionResult: function(data, selectedIndex, question) {
    const resultDiv = document.getElementById('question-result');
    
    if (!resultDiv) return;
    
    // Create result message
    resultDiv.className = `alert ${data.correct ? 'alert-success' : 'alert-danger'} mt-sm anim-fade-in`;
    resultDiv.innerHTML = `
      <div class="flex items-center mb-sm">
        <span class="text-lg mr-sm">${data.correct ? '✓' : '✗'}</span>
        <strong>${data.correct ? 'Correct!' : 'Incorrect!'}</strong>
      </div>
      <p>${data.explanation}</p>
      <div class="mt-sm">
        ${data.correct 
          ? `<span class="badge badge-success">+${data.insight_gained || 10} Insight</span>` 
          : `<span class="badge badge-danger">-1 Life</span>`}
      </div>
    `;
    
    // Highlight the correct and selected options
    this.highlightOptions(question.correct, selectedIndex);
    
    // Show floating feedback
    if (data.correct) {
      this.showFeedback(`+${data.insight_gained || 10} Insight`, 'success');
    } else {
      this.showFeedback('-1 Life', 'danger');
    }
    
    // Show result
    resultDiv.style.display = 'block';
  },
  
  // Highlight correct and selected options
  highlightOptions: function(correctIndex, selectedIndex) {
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;
    
    const options = optionsContainer.querySelectorAll('.game-option');
    
    options.forEach((option, index) => {
      // Clear existing classes
      option.classList.remove('game-option--success', 'game-option--danger');
      
      if (index === correctIndex) {
        // Correct answer
        option.classList.add('game-option--success');
        
        // Add success icon
        if (!option.querySelector('.option-icon')) {
          const icon = document.createElement('span');
          icon.className = 'option-icon float-right';
          icon.textContent = '✓';
          option.appendChild(icon);
        }
      }
      else if (index === selectedIndex && index !== correctIndex) {
        // Wrong answer
        option.classList.add('game-option--danger');
        
        // Add error icon
        if (!option.querySelector('.option-icon')) {
          const icon = document.createElement('span');
          icon.className = 'option-icon float-right';
          icon.textContent = '✗';
          option.appendChild(icon);
        }
      }
    });
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('question', QuestionComponent);
  // Elite and boss nodes use the same component
  NodeComponents.register('elite', QuestionComponent);  
  NodeComponents.register('boss', QuestionComponent);   
}