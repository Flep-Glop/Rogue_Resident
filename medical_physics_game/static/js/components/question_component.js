// question_component.js - Component for question node type

// Question component
const QuestionComponent = {
    // Current question data
    currentQuestion: null,
    
    // Initialize component
    initialize: function() {
      console.log("Initializing question component");
      // Register for events if needed
    },
    
    // Render the question UI
    render: function(nodeData, container) {
      console.log("Rendering question component", nodeData);
      
      // Store current question for potential hint use
      this.currentQuestion = nodeData.question;
      
      // Get or create container
      const questionContainer = container || document.getElementById('question-container');
      if (!questionContainer) {
        console.error("Question container not found");
        return;
      }
      
      // Update container content
      questionContainer.innerHTML = `
        <h3 id="question-title">${nodeData.title || 'Question'}</h3>
        <p id="question-text">${nodeData.question?.text || 'No question text available'}</p>
        <div id="options-container"></div>
        <div id="question-result" style="display: none;"></div>
        <button id="continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
      `;
      
      // Add options
      const optionsContainer = document.getElementById('options-container');
      if (optionsContainer && nodeData.question?.options) {
        nodeData.question.options.forEach((option, index) => {
          const optionBtn = document.createElement('button');
          optionBtn.classList.add('btn', 'btn-outline-primary', 'option-btn', 'mb-2', 'w-100');
          optionBtn.textContent = option;
          
          // Use a clean approach to event handling
          optionBtn.addEventListener('click', () => {
            this.handleAction(nodeData, 'answer', { index });
          });
          
          optionsContainer.appendChild(optionBtn);
        });
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
          if (GameState.data.currentNode) {
            GameState.completeNode(nodeData.id);
          }
          break;
          
        default:
          console.warn(`Unknown action: ${action}`);
      }
    },
    
    // Answer a question
    answerQuestion: function(nodeData, answerIndex) {
      console.log(`Answering question for node ${nodeData.id}, selected option ${answerIndex}`);
      
      // Disable all options to prevent multiple submissions
      const options = document.querySelectorAll('.option-btn');
      options.forEach(opt => opt.disabled = true);
      
      ApiClient.answerQuestion(nodeData.id, answerIndex, nodeData.question)
        .then(data => {
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
              continueBtn.addEventListener('click', () => {
                this.handleAction(nodeData, 'continue');
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
    }
  };
  
  // Register the component with NodeComponents
  if (typeof NodeComponents !== 'undefined') {
    NodeComponents.register('question', QuestionComponent);
    NodeComponents.register('elite', QuestionComponent);  // Elite uses the same component
    NodeComponents.register('boss', QuestionComponent);   // Boss uses the same component
  }