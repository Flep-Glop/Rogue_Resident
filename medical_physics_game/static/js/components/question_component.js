// question_component.js - Complete robust implementation

/**
 * Question Component
 * Handles question, elite, and boss nodes with comprehensive error handling
 */
const QuestionComponent = ComponentUtils.createComponent('question', {
  // Initialize component
  initialize: function() {
    console.log("Initializing question component");
    
    // Initialize UI state for persistence across renders
    this.setUiState('questionAnswered', false);
    this.setUiState('selectedOptionIndex', null);
    this.setUiState('currentNodeData', null);
    this.setUiState('resultData', null);
    this.setUiState('errorState', false);
    
    // Register for state updates
    if (window.GameState && GameState.addObserver) {
      GameState.addObserver((eventType, data) => {
        // Reset component UI state whenever a new node is selected
        if (eventType === 'currentNodeChanged') {
          this.resetComponentState();
        }
      });
    }
    
    // Subscribe to design bridge changes if available
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
  },
  
  // Reset component state for new questions
  resetComponentState: function() {
    this.setUiState('questionAnswered', false);
    this.setUiState('selectedOptionIndex', null);
    this.setUiState('resultData', null);
    this.setUiState('errorState', false);
    // Keep currentNodeData for reference until we get new data
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // If we have an active question, update colors dynamically
    const container = document.getElementById('question-container');
    if (container && container.style.display !== 'none') {
      // Refresh UI elements with new design tokens if needed
      this.refreshDesignTokens(container);
    }
  },
  
  // Apply design tokens to the container
  refreshDesignTokens: function(container) {
    if (!window.DesignBridge || !container) return;
    
    // Update primary color elements
    const primaryElements = container.querySelectorAll('.btn-primary, .badge-primary');
    primaryElements.forEach(el => {
      el.style.backgroundColor = DesignBridge.colors?.primary || '#5b8dd9';
    });
    
    // Update success color elements
    const successElements = container.querySelectorAll('.btn-success, .badge-success');
    successElements.forEach(el => {
      el.style.backgroundColor = DesignBridge.colors?.secondary || '#56b886';
    });
    
    // Update danger color elements
    const dangerElements = container.querySelectorAll('.btn-danger, .badge-danger');
    dangerElements.forEach(el => {
      el.style.backgroundColor = DesignBridge.colors?.danger || '#e67e73';
    });
  },
  
  // Render the question UI - main entry point
  render: function(nodeData, container) {
    console.log("Rendering question component", nodeData);
    
    // Always store the latest node data we received
    if (nodeData && nodeData.id) {
      this.setUiState('currentNodeData', nodeData);
    } else {
      // Try to recover from missing node data
      nodeData = this.recoverNodeData() || nodeData;
    }
    
    // Show error state if we've had an unrecoverable error
    if (this.getUiState('errorState')) {
      this.renderErrorState(container, nodeData);
      return;
    }
    
    // Validate node data
    if (!nodeData || !nodeData.id) {
      console.error("Invalid node data provided to question component:", nodeData);
      this.renderErrorState(container, nodeData);
      return;
    }
    
    // Handle missing question data
    if (!nodeData.question) {
      console.warn("Missing question data in node:", nodeData);
      this.handleMissingQuestionData(nodeData, container);
      return;
    }
    
    // Main question rendering for valid data
    this.renderQuestionUI(nodeData, container);
  },
  
  // Try to recover node data if it's missing
  recoverNodeData: function() {
    // First check if we have it in UI state
    const storedNodeData = this.getUiState('currentNodeData');
    if (storedNodeData && storedNodeData.id) {
      console.log("Recovered node data from UI state:", storedNodeData.id);
      return storedNodeData;
    }
    
    // Try to get from GameState
    if (window.GameState && GameState.data && GameState.data.currentNode) {
      const currentNodeId = GameState.data.currentNode;
      const nodeData = GameState.getNodeById(currentNodeId);
      if (nodeData && nodeData.id) {
        console.log("Recovered node data from GameState:", nodeData.id);
        return nodeData;
      }
    }
    
    console.error("Could not recover node data");
    return null;
  },
  
  // Handle missing question data
  handleMissingQuestionData: function(nodeData, container) {
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
    
    // Try to fetch question data from server
    this.fetchQuestionData(nodeData)
      .then(updatedNodeData => {
        // Success - update UI state
        this.setUiState('currentNodeData', updatedNodeData);
        // Re-render with complete data
        this.render(updatedNodeData, container);
      })
      .catch(error => {
        console.error("Failed to fetch question data:", error);
        // Create fallback question data
        const updatedNodeData = this.createFallbackQuestion(nodeData);
        // Update UI state
        this.setUiState('currentNodeData', updatedNodeData);
        // Try rendering with fallback data
        this.render(updatedNodeData, container);
      });
  },
  
  // Fetch question data from server
  fetchQuestionData: function(nodeData) {
    console.log("Attempting to fetch question data for node:", nodeData.id);
    
    return new Promise((resolve, reject) => {
      // Exit early for invalid node
      if (!nodeData || !nodeData.id) {
        reject(new Error("Invalid node data"));
        return;
      }
      
      // Try to fetch from endpoint
      fetch(`/api/get-question?node_id=${nodeData.id}&type=${nodeData.type || 'question'}`)
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
  
  // Create fallback question when no question data is available
  createFallbackQuestion: function(nodeData) {
    const isElite = nodeData.type === 'elite';
    const isBoss = nodeData.type === 'boss';
    
    // Different fallback questions based on node type
    let fallbackQuestion;
    
    if (isBoss) {
      fallbackQuestion = {
        text: "According to ALARA principle, what should be minimized in radiation protection?",
        options: [
          "Radiation exposure",
          "Patient comfort",
          "Treatment time",
          "Equipment costs"
        ],
        correct: 0,
        explanation: "The ALARA (As Low As Reasonably Achievable) principle states that radiation exposure should be kept as low as reasonably achievable.",
        difficulty: 3
      };
    } else if (isElite) {
      fallbackQuestion = {
        text: "Which of the following is NOT a type of radiation interaction with matter?",
        options: [
          "Photoelectric effect",
          "Compton scattering",
          "Quantum tunneling",
          "Pair production"
        ],
        correct: 2,
        explanation: "Quantum tunneling is a quantum mechanical phenomenon, not a type of radiation interaction with matter.",
        difficulty: 2
      };
    } else {
      fallbackQuestion = {
        text: "What is the primary goal of medical physics?",
        options: [
          "Ensuring the safe use of radiation in medicine",
          "Maximizing radiation dose to all tissues",
          "Eliminating the need for physicians",
          "Avoiding the use of technology in healthcare"
        ],
        correct: 0,
        explanation: "Medical physics focuses on the safe and effective applications of physics principles in medical settings.",
        difficulty: 1
      };
    }
    
    // Create a copy of the node data with the fallback question
    return {...nodeData, question: fallbackQuestion};
  },
  
  // Render error state
  renderErrorState: function(container, nodeData) {
    // Mark that we've entered error state
    this.setUiState('errorState', true);
    
    // Create error UI
    container.innerHTML = `
      <div class="game-panel shadow-md">
        <div class="alert alert-danger">
          <h4>Error Loading Question</h4>
          <p>Unable to load question data. Please try refreshing the page.</p>
        </div>
        <button id="error-continue-btn" class="btn btn-primary mt-3">Continue</button>
      </div>
    `;
    
    // Bind continue button
    this.bindAction('error-continue-btn', 'click', 'continue', { 
      nodeData: nodeData || this.getUiState('currentNodeData')
    });
  },
  
  // Main question UI rendering
  renderQuestionUI: function(nodeData, container) {
    // Get colors from design bridge
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
      this.renderOptions(optionsContainer, nodeData.question.options, nodeData);
    }
    
    // If question was already answered in this session, show the result
    if (this.getUiState('questionAnswered') && 
        this.getUiState('selectedOptionIndex') !== null && 
        this.getUiState('resultData')) {
      
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
    
    // Apply design tokens if available
    if (window.DesignBridge) {
      this.refreshDesignTokens(container);
    }
  },
  
  // Render question options
  renderOptions: function(container, options, nodeData) {
    if (!container || !options || !options.length) return;
    
    // Create option buttons
    options.forEach((option, index) => {
      const optionEl = document.createElement('button');
      optionEl.className = 'game-option w-full mb-sm';
      optionEl.dataset.index = index;
      optionEl.textContent = option;
      
      // Specifically pass BOTH the index AND the nodeData to the action
      this.bindAction(optionEl, 'click', 'answer', { 
        index: index,
        nodeData: nodeData // Pass the complete node data with question
      });
      
      container.appendChild(optionEl);
    });
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
    if (!nodeData) return 'Question';
    
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
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Question component handling action: ${action}`, data);
    
    // Find the best node data available
    const bestNodeData = data.nodeData || nodeData || this.getUiState('currentNodeData');
    
    if (!bestNodeData || !bestNodeData.id) {
      console.error("Missing node data in handleAction", {action, data});
      this.showToast("An error occurred. Please try again.", "danger");
      return;
    }
    
    // Always update our stored node data with the best available data
    this.setUiState('currentNodeData', bestNodeData);
    
    // Switch on action type
    switch (action) {
      case 'answer':
        // Ensure we have both node data and an answer index
        if (typeof data.index !== 'number') {
          console.error("Missing answer index:", data);
          return;
        }
        this.answerQuestion(bestNodeData, data.index);
        break;
        
      case 'continue':
        this.completeNode(bestNodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  },
  
  // Answer a question with comprehensive error handling
  answerQuestion: function(nodeData, answerIndex) {
    // Validate inputs extensively
    if (!nodeData || !nodeData.id) {
      console.error("Invalid node data in answerQuestion:", nodeData);
      this.showToast("Error processing question. Please refresh the page.", "danger");
      return;
    }
    
    // Check for question data
    if (!nodeData.question) {
      console.error("Missing question data in node:", nodeData);
      
      // Try to create fallback question
      nodeData = this.createFallbackQuestion(nodeData);
      if (!nodeData.question) {
        this.showToast("Error: Question data is missing. Please refresh the page.", "danger");
        return;
      }
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
        
        // FALLBACK: Use local validation instead of API
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
    
    // Default to correct answer if available
    const correctIndex = question?.correct !== undefined ? question.correct : 
                         data?.correct_index !== undefined ? data.correct_index : 0;
    
    // Determine if the answer was correct
    const isCorrect = data?.correct === true || (selectedIndex === correctIndex);
    
    // Create result message
    resultDiv.className = `alert ${isCorrect ? 'alert-success' : 'alert-danger'} mt-sm anim-fade-in`;
    resultDiv.innerHTML = `
      <div class="flex items-center mb-sm">
        <span class="text-lg mr-sm">${isCorrect ? '✓' : '✗'}</span>
        <strong>${isCorrect ? 'Correct!' : 'Incorrect!'}</strong>
      </div>
      <p>${data?.explanation || question?.explanation || 'No explanation available.'}</p>
      <div class="mt-sm">
        ${isCorrect 
          ? `<span class="badge badge-success">+${data?.insight_gained || 10} Insight</span>` 
          : `<span class="badge badge-danger">-1 Life</span>`}
      </div>
    `;
    
    // Highlight the correct and selected options
    this.highlightOptions(correctIndex, selectedIndex);
    
    // Show floating feedback
    if (isCorrect) {
      this.showFeedback(`+${data?.insight_gained || 10} Insight`, 'success');
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

// Register the component for all question-type nodes
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('question', QuestionComponent);
  // Elite and boss nodes use the same component
  NodeComponents.register('elite', QuestionComponent);  
  NodeComponents.register('boss', QuestionComponent);   
}