// patient_case_component.js - Component for patient case node type with multiple questions per stage

const PatientCaseComponent = ComponentUtils.createComponent('patient_case', {
    // Initialize component
    initialize: function() {
      console.log("Initializing patient case component");
      this.setUiState('currentStage', 0);
      this.setUiState('currentQuestion', 0); // Track current question within a stage
      this.setUiState('selectedOption', null);
      this.setUiState('caseCompleted', false);
      this.setUiState('rewardClaimed', false);
    },
    
    // Render the patient case UI
    render: function(nodeData, container) {
      console.log("Rendering patient case component", nodeData);
      // Store patient case data in UI state when first received
        if (nodeData.patient_case) {
        this.setUiState('patientCaseData', nodeData.patient_case);
        }
      // Validate node data
      if (!nodeData.patient_case) {
        this.showToast("Patient case data missing!", "warning");
        container.innerHTML = `
          <div class="patient-case-header">
            <h3>Patient Case</h3>
          </div>
          <div class="alert alert-warning">
            <p>No patient case data available.</p>
          </div>
          <button id="patient-case-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        this.bindAction('patient-case-continue-btn', 'click', 'continue', { nodeData });
        return;
      }
      
      const patientCase = nodeData.patient_case;
      const currentStage = this.getUiState('currentStage');
      const currentQuestion = this.getUiState('currentQuestion');
      const totalStages = patientCase.stages ? patientCase.stages.length : 0;
      
      // Calculate total number of questions across all stages
      let totalQuestions = 0;
      let currentQuestionIndex = 0;
      
      if (patientCase.stages) {
        patientCase.stages.forEach((stage, stageIndex) => {
          // If a stage has questions array, count them, otherwise count it as 1 question
          const stageQuestions = stage.questions ? stage.questions.length : 1;
          totalQuestions += stageQuestions;
          
          // Calculate the current question's absolute index
          if (stageIndex < currentStage) {
            // Add all questions from previous stages
            currentQuestionIndex += (stage.questions ? stage.questions.length : 1);
          } else if (stageIndex === currentStage) {
            // Add the current question index within the current stage
            currentQuestionIndex += currentQuestion;
          }
        });
      }
      
      // Update title and description
      const titleElement = document.getElementById('patient-case-title');
      if (titleElement) {
        titleElement.textContent = patientCase.title || 'Patient Case';
      }
      
      const descriptionElement = document.getElementById('case-description');
      if (descriptionElement) {
        descriptionElement.innerHTML = patientCase.description || '';
      }
      
      // Update progress bar
      const progressFill = document.getElementById('case-progress-fill');
      if (progressFill) {
        const progressPercentage = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
        progressFill.style.width = `${progressPercentage}%`;
      }
      
      // Render current stage and question
      this.renderCurrentQuestion(patientCase, currentStage, currentQuestion);
      
      // Show continue button if case is completed
      const continueBtn = document.getElementById('patient-case-continue-btn');
      if (continueBtn) {
        continueBtn.style.display = this.getUiState('caseCompleted') ? 'block' : 'none';
        this.bindAction('patient-case-continue-btn', 'click', 'continue', { nodeData });
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
            <div class="alert alert-success">
              <h4>Case Completed</h4>
              <p>${patientCase.conclusion || 'You have successfully managed this patient case.'}</p>
              <p>Gained insight: +${patientCase.reward || 15}</p>
            </div>
          `;
        }
        
        // Show continue button
        const continueBtn = document.getElementById('patient-case-continue-btn');
        if (continueBtn) {
          continueBtn.style.display = 'block';
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
      // Render question content
      const stageContainer = document.getElementById('stage-container');
      if (stageContainer) {
        stageContainer.innerHTML = `
          <div class="stage-question">${questionData.question || questionData.text || 'What do you want to do?'}</div>
          <div id="stage-options"></div>
        `;
        
        // Add options
        const optionsContainer = document.getElementById('stage-options');
        if (optionsContainer && questionData.options) {
        questionData.options.forEach((option, optIndex) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'btn btn-outline-primary option-btn mb-2 w-100';
            optionBtn.textContent = option.text;
            optionBtn.dataset.index = optIndex;
            
            // Update this line to include the nodeData
            this.bindAction(optionBtn, 'click', 'selectOption', {
            nodeData: this.getCurrentNodeData(), // Add this line
            stageIndex: stageIndex,
            questionIndex: questionIndex,
            optionIndex: optIndex
            });
            
            optionsContainer.appendChild(optionBtn);
        });
        }
      }
    },
    
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
      },
    
    // Select an option for the current question
    selectOption: function(patientCase, stageIndex, questionIndex, optionIndex) {
        // Add this validation
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
        
        // Show result message
        stageContainer.innerHTML = `
          <div class="alert alert-${resultType} mt-3">
            <p>${option.result || 'You selected this option.'}</p>
          </div>
        `;
        
        // Add next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-primary mt-2';
        nextBtn.textContent = 'Next';
        
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
        
        stageContainer.appendChild(nextBtn);
      }
    },
    // Add this helper method
    getCurrentNodeData: function() {
        return GameState && GameState.data ? 
        GameState.getNodeById(GameState.data.currentNode) : null;
    },

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
    
    // Re-render the current question
    this.renderCurrentQuestion(patientCase, stageIndex, questionIndex);
    },

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
    
    // Re-render with new stage and question
    this.renderCurrentQuestion(patientCase, currentStage + 1, 0);
    }
  });
  
  // Register the component
  if (typeof NodeComponents !== 'undefined') {
    NodeComponents.register('patient_case', PatientCaseComponent);
  }