// question_component.js - Component for question node type

// Question component using the new architecture
const QuestionComponent = ComponentUtils.createComponent('question', {
  // Initialize component - no state is stored here
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
  },
  
  // Render the question UI
  render: function(nodeData, container) {
    console.log("Rendering question component", nodeData);
    
    // Validate node data
    if (!nodeData.question) {
      ErrorHandler.handleError(
        new Error("Question node missing question data"), 
        "Question Rendering", 
        ErrorHandler.SEVERITY.WARNING
      );
      
      container.innerHTML = `
        <div class="alert alert-warning">
          <h4>Missing Question Data</h4>
          <p>This question node doesn't have question data.</p>
        </div>
        <button id="question-continue-btn" class="btn btn-primary mt-3">Continue</button>
      `;
      
      this.bindAction('question-continue-btn', 'click', 'continue', { nodeData });
      return;
    }
    
    // Create question UI
    container.innerHTML = `
      <h3 id="question-title">${nodeData.title || 'Question'}</h3>
      <p id="question-text">${nodeData.question?.text || 'No question text available'}</p>
      <div id="options-container"></div>
      <div id="question-result" style="display: none;"></div>
      <button id="continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
    `;
    
    // Add options
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer && nodeData.question?.options) {
      ComponentUtils.createOptionButtons(
        optionsContainer, 
        nodeData.question.options,
        (index) => this.handleAction(nodeData, 'answer', { index })
      );
    }
    
    // If question was already answered in this session, show the result
    if (this.getUiState('questionAnswered') && this.getUiState('selectedOptionIndex') !== null) {
      this.showQuestionResult(
        this.getUiState('resultData'),
        this.getUiState('selectedOptionIndex'),
        nodeData.question
      );
      
      // Disable all options
      ComponentUtils.disableOptionButtons(optionsContainer);
      
      // Show continue button
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'block';
        this.bindAction('continue-btn', 'click', 'continue', { nodeData });
      }
    }
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Question component handling action: ${action}`, data);
    
    switch (action) {
      case 'answer':
        this.answerQuestion(nodeData, data.index);
        break;
        
      case 'continue':
        // Complete the node
        this.completeNode(nodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  },
  
  // Answer a question
  answerQuestion: function(nodeData, answerIndex) {
    console.log(`Answering question for node ${nodeData.id}, selected option ${answerIndex}`);
    
    // Save selected option in UI state
    this.setUiState('selectedOptionIndex', answerIndex);
    
    // Disable all options to prevent multiple submissions
    const optionsContainer = document.getElementById('options-container');
    ComponentUtils.disableOptionButtons(optionsContainer);
    
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
          ErrorHandler.SEVERITY.ERROR
        );
        
        // Re-enable options in case of error
        const options = document.querySelectorAll('.option-btn');
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
    
    // Highlight the correct and selected options
    const optionsContainer = document.getElementById('options-container');
    ComponentUtils.highlightCorrectOption(optionsContainer, question.correct, selectedIndex);
    
    // Show floating feedback
    if (data.correct) {
      this.showFeedback(`+${data.insight_gained || 10} Insight`, 'success');
    } else {
      this.showFeedback('-1 Life', 'danger');
    }
    
    // Show result
    resultDiv.style.display = 'block';
  }
});

// Register the component with NodeComponents
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('question', QuestionComponent);
  NodeComponents.register('elite', QuestionComponent);  // Elite uses the same component
  NodeComponents.register('boss', QuestionComponent);   // Boss uses the same component
}