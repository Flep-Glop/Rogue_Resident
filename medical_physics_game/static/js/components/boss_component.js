// boss_component.js - Refactored boss encounter component
// Uses helper modules for separation of concerns

const BossComponent = ComponentUtils.createComponent('boss', {
  // Initialize component and set up initial state
  initialize: function() {
    console.log("Initializing quantum boss component");
    
    // Initialize phase-specific UI state
    this.setUiState('currentPhase', 0);
    this.setUiState('phaseComplete', false);
    this.setUiState('selectedOption', null);
    this.setUiState('bossHealth', 100);
    this.setUiState('playerConfidence', 100);
    this.setUiState('timeRemaining', 120);
    this.setUiState('phaseResults', []);
    this.setUiState('examQuirks', 0);
    this.setUiState('realityDistortion', 0);
    this.setUiState('professorState', 'normal'); // normal, quantum, cosmic
    
    // Set up timer for exam pressure
    this._examTimer = null;
    
    // Register for events
    EventSystem.on('itemUsed', this.onItemUsed.bind(this));
  },
  
  // Clean up when component is destroyed
  destroy: function() {
    // Clear timer if active
    if (this._examTimer) {
      clearInterval(this._examTimer);
      this._examTimer = null;
    }
    
    // Unsubscribe from events
    EventSystem.off('itemUsed', this.onItemUsed);
  },
  
  // Handle item usage during exam
  onItemUsed: function(item) {
    // Special handling for items used during exam
    if (item && this.getUiState('currentPhase') >= 0) {
      let effectText = "You used an item";
      
      // Use helper if available
      if (window.BossHelpers) {
        effectText = BossHelpers.getItemEffectForExam(item);
      }
      
      // Apply item effects
      if (item.effect) {
        switch (item.effect.type) {
          case 'insight_boost':
            // Add confidence in exam
            this.setUiState('playerConfidence', Math.min(100, this.getUiState('playerConfidence') + 10));
            break;
            
          case 'restore_life':
            // Add time to exam
            const addedTime = 15;
            this.setUiState('timeRemaining', this.getUiState('timeRemaining') + addedTime);
            break;
            
          default:
            // Default random effect for cosmic absurdity
            this.increaseRealityDistortion(5);
            break;
        }
      }
      
      this.showFeedback(effectText, 'primary');
    }
  },
  
  // Main render function
  render: function(nodeData, container) {
    console.log("Rendering boss component", nodeData);
    
    // Ensure we have a boss container
    if (!document.getElementById('boss-container')) {
      container.id = 'boss-container';
      container.className = 'interaction-container quantum-exam';
    }
    
    // Initialize or get the current exam phase
    const currentPhase = this.getUiState('currentPhase');
    const phaseComplete = this.getUiState('phaseComplete');
    
    // Get boss data using helper
    const bossData = window.BossHelpers ? 
      BossHelpers.getBossData(nodeData) : 
      this.getBossData(nodeData);
    
    // Set up the boss container with the cosmic exam theme
    container.innerHTML = `
      <div class="game-panel quantum-exam-panel anim-fade-in">
        <div id="exam-header" class="exam-header">
          <div class="exam-title-container">
            <h3 class="exam-title cosmic-glow">${bossData.title || 'ABR Part 1 Examination'}</h3>
            <div class="reality-distortion-meter" title="Reality Distortion">
              <div class="reality-fill" style="width: ${this.getUiState('realityDistortion')}%"></div>
            </div>
          </div>
          
          <div class="exam-status">
            <div class="time-container">
              <span class="time-icon">⏱️</span>
              <span class="time-remaining">${this.formatTime(this.getUiState('timeRemaining'))}</span>
            </div>
            
            <div class="confidence-container">
              <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${this.getUiState('playerConfidence')}%"></div>
              </div>
              <span class="confidence-text">${this.getUiState('playerConfidence')}% Confidence</span>
            </div>
          </div>
        </div>
        
        <div id="professor-container"></div>
        
        <div id="exam-phase-container" class="exam-phase-container"></div>
        
        <div id="exam-actions" class="exam-actions">
          ${phaseComplete ? `
            <button id="next-phase-btn" class="game-btn game-btn--primary cosmic-pulse w-full">
              ${currentPhase >= this.getExamPhases(bossData).length - 1 ? 'Complete Examination' : 'Continue to Next Section'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    // Render the professor
    this.renderProfessor(bossData, currentPhase, phaseComplete);
    
    // Render the current exam phase
    this.renderExamPhase(bossData, currentPhase);
    
    // Bind next phase button if phase is complete
    if (phaseComplete) {
      this.bindAction('next-phase-btn', 'click', 'nextPhase', { 
        nodeData,
        currentPhase,
        isLastPhase: currentPhase >= this.getExamPhases(bossData).length - 1
      });
    }
    
    // Start exam timer if not already running
    this.startExamTimer();
    
    // Apply quantum effects based on reality distortion
    if (window.BossEffects) {
      BossEffects.applyQuantumEffects(container, this.getUiState('realityDistortion'));
    } else {
      this.applyQuantumEffects();
    }
  },
  
  // Render professor using helper or inline
  renderProfessor: function(bossData, currentPhase, phaseComplete) {
    const professorContainer = document.getElementById('professor-container');
    if (!professorContainer) return;
    
    const professorState = this.getUiState('professorState');
    const distortion = this.getUiState('realityDistortion');
    
    // Get dialogue text
    let dialogueText = "";
    
    if (window.BossHelpers) {
      // Use helper if available
      dialogueText = BossHelpers.getProfessorDialogue(
        currentPhase, 
        phaseComplete, 
        professorState, 
        distortion
      );
    } else {
      // Fallback to basic dialogue
      dialogueText = phaseComplete ? 
        "You've completed this section." : 
        "Please answer the question to the best of your ability.";
    }
    
    // Use helper component if available
    if (window.BossProfessor) {
      BossProfessor.render(professorContainer, professorState, dialogueText);
    } else {
      // Fallback rendering
      professorContainer.innerHTML = `
        <div class="professor-container ${professorState}-state">
          <div class="professor-portrait">
            <div class="professor-image"></div>
            <div class="professor-glow"></div>
            <div class="quantum-particles"></div>
          </div>
          <div class="professor-dialogue">
            <p id="professor-text">${dialogueText}</p>
          </div>
        </div>
      `;
    }
  },
  
  // Render current exam phase
  renderExamPhase: function(bossData, phaseIndex) {
    const phases = this.getExamPhases(bossData);
    
    // Check if we have valid phases
    if (phases.length === 0 || phaseIndex >= phases.length) {
      this.renderExamComplete(bossData);
      return;
    }
    
    // Get current phase
    const currentPhase = phases[phaseIndex];
    
    // Get the phase container
    const phaseContainer = document.getElementById('exam-phase-container');
    if (!phaseContainer) return;
    
    // If phase is completed, show results
    if (this.getUiState('phaseComplete')) {
      this.renderPhaseResults(phaseContainer, currentPhase, phaseIndex);
      return;
    }
    
    // Set up the phase content
    phaseContainer.innerHTML = `
      <div class="phase-header cosmic-border">
        <h4 class="phase-title">Section ${phaseIndex + 1}: ${currentPhase.title}</h4>
        <p class="phase-description">${currentPhase.description || 'Answer the following questions to prove your knowledge.'}</p>
      </div>
      
      <div id="phase-questions" class="phase-questions"></div>
    `;
    
    // Render questions for this phase
    this.renderPhaseQuestions(currentPhase);
  },
  
  // Render the questions for current phase
  renderPhaseQuestions: function(phase) {
    if (!phase || !phase.questions || phase.questions.length === 0) {
      console.error('No questions available for this phase');
      return;
    }
    
    const questionContainer = document.getElementById('phase-questions');
    if (!questionContainer) return;
    
    // For simplicity, just render the first question of the phase
    // In a more complex implementation, you could handle multiple questions
    const question = phase.questions[0];
    
    // Get the current reality distortion level for visual effects
    const distortionLevel = this.getUiState('realityDistortion');
    
    // Create question with cosmic distortion effects
    questionContainer.innerHTML = `
      <div class="question-card ${distortionLevel > 50 ? 'reality-warped' : ''}">
        <div class="question-text">
          <p>${question.text}</p>
        </div>
        
        <div id="question-options" class="question-options ${distortionLevel > 70 ? 'quantum-options' : ''}">
          ${question.options.map((option, index) => `
            <button data-index="${index}" class="game-option question-option ${distortionLevel > 30 ? 'cosmic-hover' : ''}">
              ${option}
              ${distortionLevel > 50 ? `<span class="quantum-probability">${Math.floor(Math.random() * 100)}%</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    // Add event handlers for options
    const optionsContainer = document.getElementById('question-options');
    if (optionsContainer) {
      this.bindActionToSelector(optionsContainer, '.question-option', 'click', 'answerQuestion', (element) => {
        if (element.classList.contains('disabled')) return null;
        
        const index = parseInt(element.dataset.index, 10);
        return { 
          question,
          answerIndex: index
        };
      });
    }
    
    // Add quantum effects to question based on distortion
    if (distortionLevel > 40 && window.BossEffects) {
      setTimeout(() => BossEffects.addQuantumQuestionEffects(questionContainer), 500);
    }
  },
  
  // Render results of the completed phase
  renderPhaseResults: function(container, phase, phaseIndex) {
    if (!container) return;
    
    // Get phase results
    const results = this.getUiState('phaseResults')[phaseIndex] || {
      correct: 0,
      total: phase.questions ? phase.questions.length : 0,
      answers: []
    };
    
    // Calculate score percentage
    const scorePercent = results.total > 0 ? (results.correct / results.total) * 100 : 0;
    const scoreText = window.BossHelpers ? 
      BossHelpers.getScoreText(scorePercent) : 
      this.getScoreText(scorePercent);
      
    const professorState = this.getUiState('professorState');
    
    // Create results UI
    container.innerHTML = `
      <div class="phase-results ${professorState}-results">
        <div class="results-header">
          <h4 class="results-title">Section ${phaseIndex + 1} Results</h4>
          <div class="score-display">
            <div class="score-circle">
              <span class="score-value">${Math.round(scorePercent)}%</span>
            </div>
            <span class="score-text">${scoreText}</span>
          </div>
        </div>
        
        <div class="answered-questions">
          ${results.answers.map((answer, index) => `
            <div class="answered-question ${answer.correct ? 'correct-answer' : 'incorrect-answer'}">
              <div class="question-result">
                <span class="result-icon">${answer.correct ? '✓' : '✗'}</span>
                <p class="question-text">${phase.questions[index]?.text || 'Question'}</p>
              </div>
              <div class="answer-explanation">
                <p>${phase.questions[index]?.explanation || 'No explanation available'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Add quantum effects if reality is highly distorted
    if (this.getUiState('realityDistortion') > 60 && window.BossEffects) {
      setTimeout(() => BossEffects.addQuantumResultEffects(container), 500);
    }
  },
  
  // Render exam completion screen
  renderExamComplete: function(bossData) {
    // Get phase results
    const allResults = this.getUiState('phaseResults');
    
    // Calculate overall score
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    allResults.forEach(result => {
      totalCorrect += result.correct;
      totalQuestions += result.total;
    });
    
    const overallPercent = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const examPassed = overallPercent >= 70;
    const finalState = this.getUiState('professorState');
    const distortionLevel = this.getUiState('realityDistortion');
    
    // Get the phase container
    const phaseContainer = document.getElementById('exam-phase-container');
    if (!phaseContainer) return;
    
    // Get final verdict text
    const verdictText = window.BossHelpers ? 
      BossHelpers.getFinalVerdict(overallPercent, distortionLevel) :
      (examPassed ? "You have demonstrated sufficient competency." : "You have not demonstrated sufficient competency.");
    
    // Create completion screen
    phaseContainer.innerHTML = `
      <div class="exam-complete ${finalState}-results ${distortionLevel > 80 ? 'reality-collapsed' : ''}">
        <div class="cosmic-seal"></div>
        
        <h4 class="complete-title cosmic-text">Examination ${examPassed ? 'Passed' : 'Failed'}</h4>
        
        <div class="final-score-container">
          <div class="final-score-circle ${examPassed ? 'passed' : 'failed'}">
            <span class="final-score">${Math.round(overallPercent)}%</span>
          </div>
          <p class="final-verdict">${verdictText}</p>
        </div>
        
        <div class="cosmic-rewards">
          <p>Your knowledge of medical physics has ${examPassed ? 'impressed' : 'intrigued'} the Quantum Professor.</p>
          <div class="rewards-list">
            <div class="reward-item">
              <span class="reward-icon">🧠</span>
              <span class="reward-text">+${examPassed ? 50 : 20} Insight</span>
            </div>
            ${examPassed ? `
              <div class="reward-item">
                <span class="reward-icon">🔬</span>
                <span class="reward-text">ABR Certificate Obtained</span>
              </div>
            ` : ''}
            ${distortionLevel > 70 ? `
              <div class="reward-item quantum-reward">
                <span class="reward-icon">⚛️</span>
                <span class="reward-text">Quantum Uncertainty: Reality now ${distortionLevel > 90 ? 'permanently' : 'temporarily'} exists in multiple states</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Update next phase button to complete exam
    const nextButton = document.getElementById('next-phase-btn');
    if (nextButton) {
      nextButton.textContent = 'Complete Examination';
      nextButton.classList.add('cosmic-glow');
    }
    
    // Add final cosmic effects
    if (window.BossEffects) {
      setTimeout(() => BossEffects.addFinalCosmicEffects(phaseContainer, distortionLevel), 500);
    }
    
    // Apply rewards
    this.applyExamRewards(examPassed, distortionLevel);
  },
  
  // Answer a question
  answerQuestion: function(data) {
    if (!data || !data.question) return;
    
    const question = data.question;
    const answerIndex = data.answerIndex;
    const isCorrect = answerIndex === question.correct;
    
    // Get current phase index
    const currentPhase = this.getUiState('currentPhase');
    
    // Update phase results
    const phaseResults = this.getUiState('phaseResults');
    if (!phaseResults[currentPhase]) {
      phaseResults[currentPhase] = {
        correct: 0,
        total: 1,
        answers: []
      };
    }
    
    // Add this answer to the results
    phaseResults[currentPhase].answers.push({
      questionIndex: 0, // Assuming only one question per phase for simplicity
      answerIndex: answerIndex,
      correct: isCorrect
    });
    
    // Update correct count
    if (isCorrect) {
      phaseResults[currentPhase].correct += 1;
    }
    
    // Save updated results
    this.setUiState('phaseResults', phaseResults);
    
    // Update player confidence based on answer
    const confidenceChange = isCorrect ? 10 : -15;
    this.setUiState('playerConfidence', Math.max(0, Math.min(100, this.getUiState('playerConfidence') + confidenceChange)));
    
    // Mark phase as complete
    this.setUiState('phaseComplete', true);
    
    // Disable options
    const optionsContainer = document.getElementById('question-options');
    if (optionsContainer) {
      const options = optionsContainer.querySelectorAll('.question-option');
      options.forEach(option => {
        option.disabled = true;
        option.classList.add('disabled');
        
        // Highlight correct and selected options
        const index = parseInt(option.dataset.index, 10);
        if (index === question.correct) {
          option.classList.add('correct-option');
        } else if (index === answerIndex && !isCorrect) {
          option.classList.add('incorrect-option');
        }
      });
    }
    
    // Show floating feedback
    this.showFeedback(isCorrect ? 'Correct!' : 'Incorrect!', isCorrect ? 'success' : 'danger');
    
    // Increase reality distortion
    this.increaseRealityDistortion(isCorrect ? 5 : 15);
    
    // Check if professor state should change
    this.updateProfessorState();
    
    // Re-render to show results
    this.render(this.getCurrentNodeData(), document.getElementById('boss-container'));
  },
  
  // Move to next phase
  nextPhase: function(data) {
    if (!data) return;
    
    const currentPhase = data.currentPhase;
    const isLastPhase = data.isLastPhase;
    
    if (isLastPhase) {
      // Complete the boss node
      this.completeNode(data.nodeData);
    } else {
      // Move to next phase
      this.setUiState('currentPhase', currentPhase + 1);
      this.setUiState('phaseComplete', false);
      
      // Add some reality distortion between phases
      this.increaseRealityDistortion(10);
      
      // Reset timer for next phase
      this.setUiState('timeRemaining', 120);
      
      // Update professor state
      this.updateProfessorState();
      
      // Re-render for next phase
      this.render(data.nodeData, document.getElementById('boss-container'));
    }
  },
  
  // Start the exam timer
  startExamTimer: function() {
    // Clear existing timer
    if (this._examTimer) {
      clearInterval(this._examTimer);
    }
    
    // Set up new timer
    this._examTimer = setInterval(() => {
      let timeRemaining = this.getUiState('timeRemaining');
      
      // Reduce time
      timeRemaining -= 1;
      
      // Update time
      this.setUiState('timeRemaining', timeRemaining);
      
      // Update time display
      const timeDisplay = document.querySelector('.time-remaining');
      if (timeDisplay) {
        timeDisplay.textContent = this.formatTime(timeRemaining);
        
        // Add warning class for low time
        if (timeRemaining <= 30) {
          timeDisplay.classList.add('time-warning');
        }
        
        // Add panic visual when very low time
        if (timeRemaining <= 10) {
          timeDisplay.classList.add('time-critical');
          
          // Increase reality distortion as time runs out
          this.increaseRealityDistortion(1);
        }
      }
      
      // Handle time running out
      if (timeRemaining <= 0) {
        clearInterval(this._examTimer);
        this._examTimer = null;
        
        // Mark phase as failed if not already complete
        if (!this.getUiState('phaseComplete')) {
          // Auto-select an incorrect answer
          const nodeData = this.getCurrentNodeData();
          const bossData = window.BossHelpers ? 
            BossHelpers.getBossData(nodeData) : 
            this.getBossData(nodeData);
            
          const phase = this.getExamPhases(bossData)[this.getUiState('currentPhase')];
          if (phase && phase.questions && phase.questions.length > 0) {
            const question = phase.questions[0];
            
            // Choose an incorrect answer
            let wrongAnswer = 0;
            if (question.correct === 0) {
              wrongAnswer = 1;
            }
            
            // Submit the wrong answer
            this.answerQuestion({
              question: question,
              answerIndex: wrongAnswer
            });
          } else {
            // Just mark it complete with no answer
            this.setUiState('phaseComplete', true);
            
            // Re-render to show results
            this.render(this.getCurrentNodeData(), document.getElementById('boss-container'));
          }
          
          // Show time's up message
          this.showFeedback("Time's up!", 'danger');
          
          // Drastically increase reality distortion
          this.increaseRealityDistortion(25);
        }
      }
    }, 1000);
  },
  
  // Format time remaining
  formatTime: function(seconds) {
    // Use helper if available
    if (window.BossHelpers && BossHelpers.formatTime) {
      return BossHelpers.formatTime(seconds);
    }
    
    // Fallback formatting
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  // Increase reality distortion level
  increaseRealityDistortion: function(amount) {
    const currentDistortion = this.getUiState('realityDistortion');
    this.setUiState('realityDistortion', Math.min(100, currentDistortion + amount));
    
    // Update visuals if element exists
    const realityMeter = document.querySelector('.reality-fill');
    if (realityMeter) {
      realityMeter.style.width = `${this.getUiState('realityDistortion')}%`;
    }
    
    // Apply cosmic effects if threshold reached
    if (currentDistortion < 50 && currentDistortion + amount >= 50) {
      if (window.BossEffects) {
        BossEffects.applyQuantumEffects(document.getElementById('boss-container'), this.getUiState('realityDistortion'));
      } else {
        this.applyQuantumEffects();
      }
    }
  },
  
  // Update professor state based on reality distortion
  updateProfessorState: function() {
    const distortion = this.getUiState('realityDistortion');
    
    let newState = 'normal';
    if (window.BossProfessor) {
      newState = BossProfessor.updateState(distortion);
    } else {
      // Fallback state determination
      if (distortion >= 70) {
        newState = 'cosmic';
      } else if (distortion >= 40) {
        newState = 'quantum';
      }
    }
    
    // Set new state
    this.setUiState('professorState', newState);
    
    // Update professor appearance
    const professorContainer = document.querySelector('.professor-container');
    if (professorContainer) {
      professorContainer.className = `professor-container ${newState}-state`;
    }
  },
  
  // Apply quantum effects - fallback if BossEffects not available
  applyQuantumEffects: function() {
    const distortion = this.getUiState('realityDistortion');
    const container = document.getElementById('boss-container');
    if (!container) return;
    
    // Apply basic effects based on distortion level
    if (distortion >= 50) {
      // Add flickering text
      const textElements = container.querySelectorAll('p, h4');
      textElements.forEach(element => {
        if (Math.random() < 0.3) {
          element.classList.add('quantum-text');
        }
      });
    }
  },
  
  // Apply exam rewards
  applyExamRewards: function(passed, distortion) {
    // Grant insight based on performance
    const insightGain = passed ? 50 : 20;
    this.updatePlayerInsight(insightGain);
    
    // If reality is highly distorted, apply special effects
    if (distortion > 90) {
      // Could add a special relic to inventory
      if (typeof ItemManager !== 'undefined') {
        const quantumRelic = {
          id: "quantum_relic",
          name: "Quantum Uncertainty Principle",
          description: "A mysterious artifact from your ABR examination. Reality seems less certain when you hold it.",
          rarity: "epic",
          itemType: "relic",
          effect: {
            type: "special_ability",
            value: "Questions occasionally exist in superposition, revealing the correct answer.",
            duration: "permanent"
          },
          iconPath: "quantum.png"
        };
        
        // Add to inventory
        this.addItemToInventory(quantumRelic);
      }
    }
  },
  
  // Get current node data
  getCurrentNodeData: function() {
    return GameState && GameState.data ? 
      GameState.getNodeById(GameState.data.currentNode) : null;
  },
  
  // Get exam phases from boss data
  getExamPhases: function(bossData) {
    // Use helper if available
    if (window.BossHelpers && BossHelpers.getExamPhases) {
      return BossHelpers.getExamPhases(bossData);
    }
    
    // Fallback implementation
    return bossData && bossData.phases ? bossData.phases : [];
  },
  
  // Get score text based on percentage - fallback if BossHelpers not available
  getScoreText: function(percentage) {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Very Good";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Satisfactory";
    if (percentage >= 50) return "Borderline";
    return "Needs Improvement";
  },
  
  // Get boss data - fallback if BossHelpers not available
  getBossData: function(nodeData) {
    if (!nodeData) return { title: 'ABR Examination', phases: [] };
    
    // If node has a question, adapt it
    if (nodeData.question) {
      return {
        title: nodeData.title || 'ABR Examination',
        phases: [{
          title: 'Knowledge Assessment',
          questions: [nodeData.question]
        }]
      };
    }
    
    // Return provided boss data or empty object
    return nodeData.boss || { title: 'ABR Examination', phases: [] };
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Boss component handling action: ${action}`, data);
    
    switch (action) {
      case 'answerQuestion':
        this.answerQuestion(data);
        break;
          
      case 'nextPhase':
        this.nextPhase(data);
        break;
          
      case 'continue':
        // Complete the node/boss
        this.completeNode(nodeData);
        
        // Clear exam timer
        if (this._examTimer) {
          clearInterval(this._examTimer);
          this._examTimer = null;
        }
        break;
          
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('boss', BossComponent);
}