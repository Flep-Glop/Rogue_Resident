// patient_case_component.js - Component for patient case node type

const PatientCaseComponent = ComponentUtils.createComponent('patient_case', {
    // Initialize component
    initialize: function() {
      console.log("Initializing patient case component");
      this.setUiState('currentStage', 0);
      this.setUiState('selectedOption', null);
      this.setUiState('caseCompleted', false);
      this.setUiState('rewardClaimed', false);
    },
    
    // Render the patient case UI
    render: function(nodeData, container) {
      console.log("Rendering patient case component", nodeData);
      
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
      const totalStages = patientCase.stages ? patientCase.stages.length : 0;
      
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
        const progressPercentage = totalStages > 0 ? (currentStage / totalStages) * 100 : 0;
        progressFill.style.width = `${progressPercentage}%`;
      }
      
      // Render current stage
      this.renderStage(patientCase, currentStage);
      
      // Show continue button if case is completed
      const continueBtn = document.getElementById('patient-case-continue-btn');
      if (continueBtn) {
        continueBtn.style.display = this.getUiState('caseCompleted') ? 'block' : 'none';
        this.bindAction('patient-case-continue-btn', 'click', 'continue', { nodeData });
      }
    },
    
    // Render a specific stage of the patient case
    renderStage: function(patientCase, stageIndex) {
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
      
      // Render stage content
      const stageContainer = document.getElementById('stage-container');
      if (stageContainer) {
        stageContainer.innerHTML = `
          <div class="stage-question">${stage.question || 'What do you want to do?'}</div>
          <div id="stage-options"></div>
        `;
        
        // Add options
        const optionsContainer = document.getElementById('stage-options');
        if (optionsContainer && stage.options) {
          stage.options.forEach((option, index) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'btn btn-outline-primary option-btn mb-2 w-100';
            optionBtn.textContent = option.text;
            optionBtn.dataset.index = index;
            
            // Bind action using ComponentUtils method
            this.bindAction(optionBtn, 'click', 'selectOption', {
              patientCase: patientCase,
              stageIndex: stageIndex,
              optionIndex: index
            });
            
            optionsContainer.appendChild(optionBtn);
          });
        }
      }
    },
    
    // Handle component actions
    handleAction: function(nodeData, action, data) {
      console.log(`Patient case component handling action: ${action}`, data);
      
      switch (action) {
        case 'continue':
          this.completeNode(nodeData);
          break;
          
        case 'selectOption':
          this.selectOption(data.patientCase, data.stageIndex, data.optionIndex);
          break;
          
        default:
          console.warn(`Unknown action: ${action}`);
      }
    },
    
    // Select an option in the current stage
    selectOption: function(patientCase, stageIndex, optionIndex) {
      // Get the selected option
      const stage = patientCase.stages[stageIndex];
      const option = stage.options[optionIndex];
      
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
        
        // Bind action using ComponentUtils method
        this.bindAction(nextBtn, 'click', 'nextStage', {
          patientCase: patientCase,
          nextStage: stageIndex + 1
        });
        
        stageContainer.appendChild(nextBtn);
      }
    },
    
    // Move to the next stage
    nextStage: function(patientCase, nextStageIndex) {
      // Update current stage
      this.setUiState('currentStage', nextStageIndex);
      this.setUiState('selectedOption', null);
      
      // Re-render the current stage
      this.renderStage(patientCase, nextStageIndex);
    }
  });
  
  // Register the component
  if (typeof NodeComponents !== 'undefined') {
    NodeComponents.register('patient_case', PatientCaseComponent);
  }