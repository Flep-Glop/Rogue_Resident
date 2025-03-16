// patient_case_component.js - Refactored implementation with new design architecture

const PatientCaseComponent = ComponentUtils.createComponent('patient_case', {
  // Initialize component
  initialize: function() {
    console.log("Initializing patient case component");
    
    // Initialize UI state
    this.setUiState('currentStage', 0);
    this.setUiState('currentQuestion', 0);
    this.setUiState('selectedOption', null);
    this.setUiState('caseCompleted', false);
    this.setUiState('rewardClaimed', false);
    
    // Subscribe to design bridge changes
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // Update component appearance if active
    const container = document.getElementById('patient-case-container');
    if (container && container.style.display !== 'none') {
      this.refreshProgressBar();
    }
  },
  
  // Render the patient case UI
  render: function(nodeData, container) {
    console.log("Rendering patient case component", nodeData);
    
    // Store patient case data in UI state when first received
    if (nodeData.patient_case) {
      this.setUiState('patientCaseData', nodeData.patient_case);
    }
    
    // Get colors from design bridge
    const caseColor = window.DesignBridge?.colors?.nodePatientCase || '#4acf8b';
    
    // Validate node data
    if (!nodeData.patient_case) {
      container.innerHTML = `
        <div class="game-panel shadow-md">
          <div class="alert alert-warning">
            <p>No patient case data available.</p>
          </div>
          <button id="patient-case-continue-btn" class="game-btn game-btn--primary mt-md">Continue</button>
        </div>
      `;
      this.bindAction('patient-case-continue-btn', 'click', 'continue', { nodeData });
      return;
    }
    
    const patientCase = nodeData.patient_case;
    const currentStage = this.getUiState('currentStage');
    const currentQuestion = this.getUiState('currentQuestion');
    
    // Create patient case UI with new design classes
    container.innerHTML = `
      <div class="game-panel shadow-md anim-fade-in">
        <div class="game-panel__title flex justify-between items-center border-left-rarity border-left-uncommon">
          <h3 id="patient-case-title">${patientCase.title || 'Patient Case'}</h3>
          <span class="badge badge-primary">Case Study</span>
        </div>
        
        <div class="mb-md">
          <div class="flex justify-between items-center mb-xs">
            <span class="text-xs">Case Progress</span>
            <span class="text-xs" id="case-progress-text">Stage ${currentStage + 1}</span>
          </div>
          <div class="progress-bar mb-sm">
            <div class="progress-fill" id="case-progress-fill" style="width: 0%;"></div>
          </div>
        </div>
        
        <div class="bg-dark-alt p-sm rounded-md mb-md">
          <p id="case-description" class="text-light">${patientCase.description || ''}</p>
        </div>
        
        <div id="stage-container" class="mb-md"></div>
        
        <button id="patient-case-continue-btn" class="game-btn game-btn--primary w-full" 
                style="display: ${this.getUiState('caseCompleted') ? 'block' : 'none'};">
          Complete Case
        </button>
      </div>
    `;
    
    // Update progress bar
    this.refreshProgressBar();
    
    // Bind continue button
    this.bindAction('patient-case-continue-btn', 'click', 'continue', { nodeData });
    
    // Render current stage and question
    this.renderCurrentQuestion(patientCase, currentStage, currentQuestion);
  },
  
  // Update progress bar based on current position in case
  refreshProgressBar: function() {
    const patientCase = this.getUiState('patientCaseData');
    if (!patientCase || !patientCase.stages) return;
    
    const currentStage = this.getUiState('currentStage');
    const currentQuestion = this.getUiState('currentQuestion');
    const totalStages = patientCase.stages.length;
    
    // Calculate total questions and current question index
    let totalQuestions = 0;
    let currentQuestionIndex = 0;
    
    patientCase.stages.forEach((stage, stageIndex) => {
      // Count questions in this stage
      const stageQuestions = stage.questions ? stage.questions.length : 1;
      totalQuestions += stageQuestions;
      
      // Calculate current question index
      if (stageIndex < currentStage) {
        currentQuestionIndex += stageQuestions;
      } else if (stageIndex === currentStage) {
        currentQuestionIndex += currentQuestion;
      }
    });
    
    // Update progress bar
    const progressFill = document.getElementById('case-progress-fill');
    if (progressFill) {
      const progressPercentage = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
      progressFill.style.width = `${progressPercentage}%`;
      
      // Apply design token color if available
      if (window.DesignBridge?.colors?.nodePatientCase) {
        progressFill.style.backgroundColor = window.DesignBridge.colors.nodePatientCase;
      }
    }
    
    // Update progress text
    const progressText = document.getElementById('case-progress-text');
    if (progressText) {
      progressText.textContent = `Stage ${currentStage + 1} of ${totalStages}`;
    }
  },
  
  // Render the current question from the current stage
  renderCurrentQuestion: function(patientCase, stageIndex, questionIndex) {
    // Add validation
    if (!patientCase) {
      console.error("Patient case is undefined in renderCurrentQuestion");
      this.showToast("Error loading question data", "danger");
      return;
    }
    
    if (!patientCase.stages || !Array.isArray(patientCase.stages)) {
      console.error("Invalid stages in patient case:", patientCase);
      this.showToast("Error: Invalid patient case format", "danger");
      return;
    }
    
    if (!patientCase.stages || stageIndex >= patientCase.stages.length) {
      // No more stages, case is completed
      this.setUiState('caseCompleted', true);
      
      const stageContainer = document.getElementById('stage-container');
      if (stageContainer) {
        stageContainer.innerHTML = `
          <div class="alert alert-success anim-fade-in">
            <div class="flex items-center mb-sm">
              <span class="text-xl mr-sm">✓</span>
              <h4>Case Completed</h4>
            </div>
            <p>${patientCase.conclusion || 'You have successfully managed this patient case.'}</p>
            <div class="mt-md">
              <span class="badge badge-success">+${patientCase.reward || 15} Insight</span>
            </div>
          </div>
        `;
      }
      
      // Show continue button
      const continueBtn = document.getElementById('patient-case-continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'block';
        continueBtn.classList.add('anim-pulse-scale');
      }
      
      // Award insight
      if (!this.getUiState('rewardClaimed')) {
        this.updatePlayerInsight(patientCase.reward || 15);
        this.setUiState('rewardClaimed', true);
      }
      
      return;
    }
    
    // Get current stage
    const stage = patientCase.stages[stageIndex];
    
    // Check if we have a questions array in this stage
    if (stage.questions && stage.questions.length > 0) {
      // Check if we're still within valid questions for this stage
      if (questionIndex >= stage.questions.length) {
        // Move to next stage
        this.moveToNextStage(patientCase, stageIndex);
        return;
      }
      
      // Get current question from the questions array
      const question = stage.questions[questionIndex];
      
      // Render the question
      this.renderQuestion(question, stageIndex, questionIndex);
    } else {
      // Legacy format: stage itself has a question property
      this.renderQuestion(stage, stageIndex, questionIndex);
    }
  },
  
  // Render a specific question
  renderQuestion: function(questionData, stageIndex, questionIndex) {
    // Get colors from design bridge
    const primaryColor = window.DesignBridge?.colors?.primary || '#5b8dd9';
    
    // Render question content
    const stageContainer = document.getElementById('stage-container');
    if (stageContainer) {
      stageContainer.innerHTML = `
        <div class="game-card mb-md shadow-sm anim-fade-in">
          <div class="game-card__header bg-dark">
            <h4 class="text-light">Question ${questionIndex + 1}</h4>
          </div>
          <div class="game-card__body">
            <p class="stage-question mb-md">${questionData.question || questionData.text || 'What do you want to do?'}</p>
            <div id="stage-options" class="flex-col gap-sm"></div>
          </div>
        </div>
      `;
      
      // Add options
      const optionsContainer = document.getElementById('stage-options');
      if (optionsContainer && questionData.options) {
        questionData.options.forEach((option, optIndex) => {
          const optionBtn = document.createElement('button');
          optionBtn.className = 'game-option w-full mb-xs';
          optionBtn.textContent = option.text;
          
          // Bind action to the button
          this.bindAction(optionBtn, 'click', 'selectOption', {
            nodeData: this.getCurrentNodeData(),
            stageIndex: stageIndex,
            questionIndex: questionIndex,
            optionIndex: optIndex
          });
          
          optionsContainer.appendChild(optionBtn);
        });
      }
    }
  },
  
  // Select an option for the current question
  selectOption: function(patientCase, stageIndex, questionIndex, optionIndex) {
    // Add validation
    if (!patientCase || !patientCase.stages || !Array.isArray(patientCase.stages)) {
      console.error("Invalid patient case data:", patientCase);
      this.showToast("Error: Invalid patient case data", "danger");
      return;
    }
    
    // Get the current stage
    const stage = patientCase.stages[stageIndex];
    
    // Get the question data and selected option
    let question, option;
    
    if (stage.questions && stage.questions.length > 0) {
      // Multi-question format
      question = stage.questions[questionIndex];
      option = question.options[optionIndex];
    } else {
      // Legacy format
      question = stage;
      option = stage.options[optionIndex];
    }
    
    // Save selected option
    this.setUiState('selectedOption', optionIndex);
    
    // Show option result
    const stageContainer = document.getElementById('stage-container');
    if (stageContainer) {
      // Determine result type for styling
      let resultType = option.correct ? 'success' : 'danger';
      let resultIcon = option.correct ? '✓' : '✗';
      
      // Show result message
      stageContainer.innerHTML = `
        <div class="alert alert-${resultType} anim-fade-in">
          <div class="flex items-center mb-sm">
            <span class="text-xl mr-sm">${resultIcon}</span>
            <strong>${option.correct ? 'Correct' : 'Incorrect'}</strong>
          </div>
          <p>${option.result || 'You selected this option.'}</p>
          <button class="game-btn game-btn--primary mt-md next-btn">Next</button>
        </div>
      `;
      
      // Bind next button
      const nextBtn = stageContainer.querySelector('.next-btn');
      if (nextBtn) {
        // Determine if we should go to next question or next stage
        const hasMoreQuestions = stage.questions && 
                               questionIndex < stage.questions.length - 1;
        
        if (hasMoreQuestions) {
          // Move to next question in this stage
          this.bindAction(nextBtn, 'click', 'nextQuestion', {
            stageIndex: stageIndex,
            nextQuestion: questionIndex + 1
          });
        } else {
          // Move to first question of next stage
          this.bindAction(nextBtn, 'click', 'nextQuestion', {
            stageIndex: stageIndex + 1,
            nextQuestion: 0
          });
        }
      }
    }
  },
  
  // Move to the next question
  moveToNextQuestion: function(patientCase, stageIndex, questionIndex) {
    // Add validation
    if (!patientCase || !patientCase.stages) {
      console.error("Invalid patient case data in moveToNextQuestion");
      return;
    }
    
    // Update current stage and question
    this.setUiState('currentStage', stageIndex);
    this.setUiState('currentQuestion', questionIndex);
    this.setUiState('selectedOption', null);
    
    // Update progress bar
    this.refreshProgressBar();
    
    // Re-render the current question
    this.renderCurrentQuestion(patientCase, stageIndex, questionIndex);
  },
  
  // Move to the next stage
  moveToNextStage: function(patientCase, currentStage) {
    // Add validation
    if (!patientCase || !patientCase.stages) {
      console.error("Invalid patient case data in moveToNextStage");
      return;
    }
    
    // Move to the next stage, reset question index to 0
    this.setUiState('currentStage', currentStage + 1);
    this.setUiState('currentQuestion', 0);
    this.setUiState('selectedOption', null);
    
    // Update progress bar
    this.refreshProgressBar();
    
    // Re-render with new stage and question
    this.renderCurrentQuestion(patientCase, currentStage + 1, 0);
  },
  
  // Helper method to get current node data
  getCurrentNodeData: function() {
    return GameState && GameState.data ? 
      GameState.getNodeById(GameState.data.currentNode) : null;
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Patient case component handling action: ${action}`, data);
    
    // Declare this once at the top of the function
    const patientCaseData = this.getUiState('patientCaseData');
    
    switch (action) {
      case 'continue':
        this.completeNode(nodeData);
        break;
        
      case 'selectOption':
        // Use the already declared patientCaseData
        if (!patientCaseData) {
          console.error("Missing patient case data in UI state");
          this.showToast("Error processing selection. Please try again.", "danger");
          return;
        }
        this.selectOption(patientCaseData, data.stageIndex, data.questionIndex, data.optionIndex);
        break;
        
      case 'nextQuestion':
        // Use the already declared patientCaseData
        if (!patientCaseData) {
          console.error("Missing patient case data in UI state for nextQuestion");
          this.showToast("Error processing next question. Please try again.", "danger");
          return;
        }
        this.moveToNextQuestion(patientCaseData, data.stageIndex, data.nextQuestion);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('patient_case', PatientCaseComponent);
}