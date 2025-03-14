// boss_component.js - Custom boss encounter component with unique mechanics
// Designed for medical physics board exam with cosmic absurdity

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
      
      // Subscribe to design bridge for theming
      if (window.DesignBridge && window.DesignBridge.subscribe) {
        window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
      }
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
    
    // Handle design system changes
    onDesignChanged: function(designBridge) {
      // Update exam appearance if active
      const container = document.getElementById('boss-container');
      if (container && container.style.display !== 'none') {
        this.refreshExamAppearance();
      }
    },
    
    // Handle item usage during exam
    onItemUsed: function(item) {
      // Special handling for items used during boss fight
      if (item && this.getUiState('currentPhase') >= 0) {
        const effectText = this.getItemEffectForExam(item);
        this.showFeedback(effectText, 'primary');
      }
    },
    
    // Determine item effect during exam
    getItemEffectForExam: function(item) {
      if (!item || !item.effect) return "You used an item with no effect";
      
      switch (item.effect.type) {
        case 'insight_boost':
          // Add confidence in exam
          this.setUiState('playerConfidence', Math.min(100, this.getUiState('playerConfidence') + 10));
          return `The ${item.name} calms your mind. +10% Confidence!`;
          
        case 'restore_life':
          // Add time to exam
          const addedTime = 15;
          this.setUiState('timeRemaining', this.getUiState('timeRemaining') + addedTime);
          return `The ${item.name} bends time. +${addedTime} seconds added!`;
          
        default:
          // Default random effect for cosmic absurdity
          this.increaseRealityDistortion(5);
          return `The ${item.name} distorts the fabric of the exam reality.`;
      }
    },
    
    // Main render function
    render: function(nodeData, container) {
      console.log("Rendering boss component", nodeData);
      
      // Ensure we have a boss container
      if (!document.getElementById('boss-container')) {
        this.createBossContainer(container);
      }
      
      // Initialize or get the current exam phase
      const currentPhase = this.getUiState('currentPhase');
      const phaseComplete = this.getUiState('phaseComplete');
      
      // Get boss data
      const bossData = this.getBossData(nodeData);
      
      // Set up the boss container with the cosmic exam theme
      container.innerHTML = `
        <div class="game-panel quantum-exam-panel anim-fade-in">
          <div class="exam-header">
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
          
          <div class="professor-container ${this.getUiState('professorState')}-state">
            <div class="professor-portrait">
              <div class="professor-image"></div>
              <div class="professor-glow"></div>
              <div class="quantum-particles"></div>
            </div>
            <div class="professor-dialogue">
              <p id="professor-text">${this.getProfessorDialogue(currentPhase, phaseComplete)}</p>
            </div>
          </div>
          
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
      
      // Add custom CSS for the boss battle
      this.injectBossStyles();
      
      // Bind next phase button if phase is complete
      if (phaseComplete) {
        this.bindAction('next-phase-btn', 'click', 'nextPhase', { 
          nodeData,
          currentPhase,
          isLastPhase: currentPhase >= this.getExamPhases(bossData).length - 1
        });
      }
      
      // Render the current exam phase
      this.renderExamPhase(bossData, currentPhase);
      
      // Start exam timer if not already running
      this.startExamTimer();
      
      // Apply quantum effects based on reality distortion
      this.applyQuantumEffects();
    },
    
    // Create the main boss container if needed
    createBossContainer: function(container) {
      if (!container) return;
      
      // Give the container an ID for reference
      container.id = 'boss-container';
      container.className = 'interaction-container quantum-exam';
    },
    
    // Get boss data from node data or create default
    getBossData: function(nodeData) {
      if (!nodeData) return this.getDefaultBossData();
      
      // If node has a question but no specific boss data, adapt the question
      if (nodeData.question && !nodeData.boss) {
        return {
          title: nodeData.title || 'ABR Part 1 Examination',
          description: nodeData.description || 'Prove your knowledge of medical physics principles.',
          phases: [{
            title: 'Core Knowledge Assessment',
            questions: [nodeData.question]
          }]
        };
      }
      
      // If node has boss data, use it
      if (nodeData.boss) {
        return nodeData.boss;
      }
      
      // Default boss data with multiple phases
      return this.getDefaultBossData();
    },
    
    // Define default boss data
    getDefaultBossData: function() {
      return {
        title: 'Quantum Professor\'s ABR Part 1 Challenge',
        description: 'Face the Quantum Professor in a multidimensional examination of medical physics knowledge.',
        phases: [
          {
            title: 'Radiation Physics Fundamentals',
            description: 'Demonstrate understanding of basic radiation physics principles.',
            questions: [
              {
                text: 'Which interaction is most important for photoelectric effect?',
                options: [
                  'Low-energy photons with high-Z materials',
                  'High-energy photons with low-Z materials',
                  'Mid-energy photons with any material',
                  'Charged particles with any material'
                ],
                correct: 0,
                explanation: 'The photoelectric effect is dominant for low-energy photons interacting with high-Z materials, where the photon is completely absorbed and an electron is ejected.'
              }
            ]
          },
          {
            title: 'Quantum Mechanics Principles',
            description: 'Explore the quantum nature of radiation physics.',
            questions: [
              {
                text: 'What phenomenon best demonstrates the wave-particle duality of radiation?',
                options: [
                  'Compton scattering',
                  'Pair production',
                  'Double-slit experiment',
                  'Auger cascade'
                ],
                correct: 2,
                explanation: 'The double-slit experiment demonstrates the wave-particle duality of particles, including photons, showing interference patterns even with single particles.'
              }
            ]
          },
          {
            title: 'Dosimetry Under Pressure',
            description: 'Calculate dosimetric quantities under time pressure.',
            questions: [
              {
                text: 'A beam of 6 MV photons delivers 2 Gy at dmax. What is the approximate dose at 10 cm depth in water (assuming μ = 0.03 cm^-1)?',
                options: [
                  '1.48 Gy',
                  '0.74 Gy',
                  '1.00 Gy',
                  '0.37 Gy'
                ],
                correct: 1,
                explanation: 'Using exponential attenuation D = D₀e^(-μx), we get D = 2Gy × e^(-0.03 × 10) = 2Gy × 0.37 = 0.74 Gy'
              }
            ]
          }
        ]
      };
    },
    
    // Get exam phases from boss data
    getExamPhases: function(bossData) {
      return bossData && bossData.phases ? bossData.phases : [];
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
      if (distortionLevel > 40) {
        setTimeout(() => this.addQuantumQuestionEffects(questionContainer), 500);
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
      const scoreText = this.getScoreText(scorePercent);
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
      if (this.getUiState('realityDistortion') > 60) {
        setTimeout(() => this.addQuantumResultEffects(container), 500);
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
      
      // Create completion screen
      phaseContainer.innerHTML = `
        <div class="exam-complete ${finalState}-results ${distortionLevel > 80 ? 'reality-collapsed' : ''}">
          <div class="cosmic-seal"></div>
          
          <h4 class="complete-title cosmic-text">Examination ${examPassed ? 'Passed' : 'Failed'}</h4>
          
          <div class="final-score-container">
            <div class="final-score-circle ${examPassed ? 'passed' : 'failed'}">
              <span class="final-score">${Math.round(overallPercent)}%</span>
            </div>
            <p class="final-verdict">${this.getFinalVerdict(overallPercent, distortionLevel)}</p>
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
      setTimeout(() => this.addFinalCosmicEffects(phaseContainer), 500);
      
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
            const phase = this.getExamPhases(this.getBossData(this.getCurrentNodeData()))[this.getUiState('currentPhase')];
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
        this.applyQuantumEffects();
      }
    },
    
    // Update professor state based on reality distortion
    updateProfessorState: function() {
      const distortion = this.getUiState('realityDistortion');
      let newState = 'normal';
      
      if (distortion >= 70) {
        newState = 'cosmic';
      } else if (distortion >= 40) {
        newState = 'quantum';
      }
      
      // Set new state
      this.setUiState('professorState', newState);
      
      // Update professor appearance
      const professorContainer = document.querySelector('.professor-container');
      if (professorContainer) {
        professorContainer.className = `professor-container ${newState}-state`;
      }
    },
    
    // Apply quantum effects based on reality distortion
    applyQuantumEffects: function() {
      const distortion = this.getUiState('realityDistortion');
      
      // Apply effects based on distortion level
      if (distortion >= 30) {
        // Add floating quantum particles
        this.addQuantumParticles();
      }
      
      if (distortion >= 50) {
        // Add flickering text
        this.addQuantumTextEffects();
      }
      
      if (distortion >= 70) {
        // Add reality warping
        this.addRealityWarpingEffects();
      }
      
      if (distortion >= 90) {
        // Full cosmic collapse
        this.addCosmicCollapseEffects();
      }
    },
    
    // Add quantum particles to the background
    addQuantumParticles: function() {
      const container = document.getElementById('boss-container');
      if (!container) return;
      
      const particleCount = 10 + Math.floor(this.getUiState('realityDistortion') / 10);
      
      // Create particles
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'quantum-particle';
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random size
        const size = 2 + Math.random() * 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random animation duration
        particle.style.animationDuration = `${3 + Math.random() * 7}s`;
        
        // Random color
        const colors = ['#5b8dd9', '#d35db3', '#f0c866', '#56b886'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Add to container
        container.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
          if (particle && particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 10000);
      }
    },
    
    // Add quantum effects to text
    addQuantumTextEffects: function() {
      // Make text quantum-uncertain
      const textElements = document.querySelectorAll('#boss-container p, #boss-container h4, #boss-container button');
      
      textElements.forEach(element => {
        if (Math.random() < 0.3) { // Only apply to some elements
          element.classList.add('quantum-text');
        }
      });
    },
    
    // Add quantum effects to question display
    addQuantumQuestionEffects: function(container) {
      if (!container) return;
      
      // Add quantum uncertainty to options
      const options = container.querySelectorAll('.question-option');
      
      options.forEach(option => {
        // Small chance to swap option text with another randomly
        if (Math.random() < 0.2) {
          const randomIndex = Math.floor(Math.random() * options.length);
          if (options[randomIndex]) {
            const tempText = option.textContent;
            option.textContent = options[randomIndex].textContent;
            options[randomIndex].textContent = tempText;
          }
        }
        
        // Add quantum shimmer
        option.classList.add('quantum-shimmer');
      });
    },
    
    // Add quantum effects to results display
    addQuantumResultEffects: function(container) {
      if (!container) return;
      
      // Get all score displays
      const scoreElements = container.querySelectorAll('.score-value, .score-text');
      
      scoreElements.forEach(element => {
        // Add quantum uncertainty - occasionally change the displayed score
        if (Math.random() < 0.3) {
          if (element.classList.contains('score-value')) {
            const originalScore = parseInt(element.textContent);
            const quantumScore = originalScore + (Math.random() < 0.5 ? -10 : 10);
            element.textContent = `${quantumScore}%`;
            element.setAttribute('data-original', originalScore);
            
            // Flicker between values
            setInterval(() => {
              if (element.hasAttribute('data-original')) {
                element.textContent = `${element.getAttribute('data-original')}%`;
                element.removeAttribute('data-original');
              } else {
                element.setAttribute('data-original', element.textContent.replace('%', ''));
                element.textContent = `${Math.round(Math.random() * 100)}%`;
              }
            }, 2000 + Math.random() * 3000);
          }
        }
        
        // Add quantum shimmer
        element.classList.add('quantum-shimmer');
      });
    },
    
    // Add reality warping effects
    addRealityWarpingEffects: function() {
      const container = document.getElementById('boss-container');
      if (!container) return;
      
      // Add reality warp class to container
      container.classList.add('reality-warped');
      
      // Create ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'reality-ripple';
      ripple.style.left = `${50 + (Math.random() * 30 - 15)}%`;
      ripple.style.top = `${50 + (Math.random() * 30 - 15)}%`;
      
      container.appendChild(ripple);
      
      // Remove after animation
      setTimeout(() => {
        if (ripple && ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 4000);
    },
    
    // Add cosmic collapse effects at highest distortion
    addCosmicCollapseEffects: function() {
      const container = document.getElementById('boss-container');
      if (!container) return;
      
      // Add cosmic collapse class
      container.classList.add('cosmic-collapse');
      
      // Create a spacetime rift
      const rift = document.createElement('div');
      rift.className = 'cosmic-rift';
      
      // Random position near center
      rift.style.left = `${40 + Math.random() * 20}%`;
      rift.style.top = `${40 + Math.random() * 20}%`;
      
      container.appendChild(rift);
      
      // Grow and collapse
      setTimeout(() => {
        rift.classList.add('expanding');
        
        // Show cosmic message
        this.showFeedback("Reality is becoming unstable!", 'warning');
        
        setTimeout(() => {
          if (rift && rift.parentNode) {
            rift.classList.add('collapsing');
            
            setTimeout(() => {
              if (rift && rift.parentNode) {
                rift.parentNode.removeChild(rift);
              }
            }, 2000);
          }
        }, 3000);
      }, 500);
    },
    
    // Add final cosmic effects to completion screen
    addFinalCosmicEffects: function(container) {
      if (!container) return;
      
      const distortion = this.getUiState('realityDistortion');
      
      // Add appropriate cosmic effects based on distortion
      if (distortion > 50) {
        // Add cosmic particles
        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('div');
          particle.className = 'cosmic-particle';
          
          // Random position
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.top = `${Math.random() * 100}%`;
          
          // Random size
          const size = 4 + Math.random() * 8;
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          
          // Add to container
          container.appendChild(particle);
        }
      }
      
      if (distortion > 80) {
        // Add cosmic seal animation
        const seal = container.querySelector('.cosmic-seal');
        if (seal) {
          seal.classList.add('active');
        }
        
        // Add reality unravel effect
        container.classList.add('reality-unravel');
      }
    },
    
    // Get professor dialogue based on phase and state
    getProfessorDialogue: function(phaseIndex, phaseComplete) {
      const professorState = this.getUiState('professorState');
      const distortion = this.getUiState('realityDistortion');
      
      // Base dialogues for different states
      const dialogues = {
        normal: [
          "Welcome to your ABR Part 1 examination. Let's assess your knowledge of medical physics.",
          "Good. Now let's test your understanding of quantum principles in medical physics.",
          "Excellent progress. This section will test your ability to perform calculations under pressure."
        ],
        quantum: [
          "Welcome to your examination... *flickers* ...I seem to exist in multiple states simultaneously.",
          "Quantum mechanics is... *shifts* ...both fascinating and troubling. Shall we continue?",
          "In this universe—or perhaps another—we must test your calculations. *phases in and out*"
        ],
        cosmic: [
          "W̷E̴L̵C̶O̸M̷E̵ ̶T̷O̸ ̵T̸H̸E̵ ̷E̸X̵A̸M̴ ̷T̸H̵A̸T̵ ̸E̵X̶I̶S̶T̸S̸ ̴B̵E̵Y̵O̸N̸D̴ ̷S̵P̸A̶C̸E̸T̷I̵M̵E̸",
          "Quantum physics is but a glimpse into the abyss that stares back at all of us.",
          "Your calculations are meaningless in the grand entropy of the universe, yet we persist."
        ]
      };
      
      // Completion dialogues
      const completionDialogues = {
        normal: [
          "You've completed this section. Let's proceed to the next challenge.",
          "Section complete. You're making good progress.",
          "Well done. You've demonstrated adequate knowledge for this section."
        ],
        quantum: [
          "This section exists in a state of both completion and incompletion... fascinating.",
          "You've temporarily resolved the quantum uncertainty of this section.",
          "Your knowledge exists in superposition, yet somehow you progress..."
        ],
        cosmic: [
          "T̵H̵E̶ ̸B̶O̷U̵N̵D̴A̵R̷I̸E̵S̸ ̵B̵E̶T̶W̶E̵E̴N̸ ̷S̷E̸C̸T̵I̷O̵N̸S̸ ̵A̵R̸E̶ ̶I̴L̸L̸U̷S̶O̸R̶Y̷",
          "The cosmos laughs at our arbitrary delineations of knowledge.",
          "You progress through the exam as all things progress toward entropy."
        ]
      };
      
      // Get appropriate dialogue
      let dialogue;
      if (phaseComplete) {
        dialogue = completionDialogues[professorState][Math.min(phaseIndex, completionDialogues[professorState].length - 1)];
      } else {
        dialogue = dialogues[professorState][Math.min(phaseIndex, dialogues[professorState].length - 1)];
      }
      
      // Add cosmic distortions at high levels
      if (distortion > 60) {
        dialogue = dialogue.split(' ').map(word => 
          Math.random() < 0.2 ? this.distortText(word) : word
        ).join(' ');
      }
      
      return dialogue;
    },
    
    // Distort text for cosmic effects
    distortText: function(text) {
      const zalgoLevel = Math.min(3, Math.floor(this.getUiState('realityDistortion') / 30));
      
      if (zalgoLevel === 0) return text;
      
      const zalgoMarks = [
        '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307', '\u0308', '\u0309',
        '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F', '\u0310', '\u0311', '\u0312', '\u0313',
        '\u0314', '\u0315', '\u0316', '\u0317', '\u0318', '\u0319', '\u031A', '\u031B', '\u031C', '\u031D',
        '\u031E', '\u031F', '\u0320', '\u0321', '\u0322', '\u0323', '\u0324', '\u0325', '\u0326', '\u0327'
      ];
      
      return text.split('').map(char => {
        let distorted = char;
        // Add zalgo marks
        for (let i = 0; i < zalgoLevel; i++) {
          if (Math.random() < 0.7) {
            distorted += zalgoMarks[Math.floor(Math.random() * zalgoMarks.length)];
          }
        }
        return distorted;
      }).join('');
    },
    
    // Get score text based on percentage
    getScoreText: function(percentage) {
      if (percentage >= 90) return "Excellent";
      if (percentage >= 80) return "Very Good";
      if (percentage >= 70) return "Good";
      if (percentage >= 60) return "Satisfactory";
      if (percentage >= 50) return "Borderline";
      return "Needs Improvement";
    },
    
    // Get final verdict text
    getFinalVerdict: function(percentage, distortion) {
      // Base verdicts
      const baseVerdicts = {
        high: "You have demonstrated exceptional understanding of medical physics principles.",
        pass: "You have demonstrated sufficient competency in medical physics.",
        fail: "You have not demonstrated sufficient competency at this time."
      };
      
      // Cosmic verdicts
      const cosmicVerdicts = {
        high: "Your understanding transcends conventional medical physics, bordering on the cosmic.",
        pass: "You comprehend enough to glimpse the true quantum nature of reality.",
        fail: "The quantum nature of reality eludes you, but you perceive more than most."
      };
      
      // Choose base or cosmic based on distortion
      const verdicts = distortion > 70 ? cosmicVerdicts : baseVerdicts;
      
      // Return appropriate verdict
      if (percentage >= 85) return verdicts.high;
      if (percentage >= 70) return verdicts.pass;
      return verdicts.fail;
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
    
    // Inject custom CSS for boss battle
    injectBossStyles: function() {
      // Check if styles are already injected
      if (document.getElementById('boss-component-styles')) return;
      
      // Create style element
      const style = document.createElement('style');
      style.id = 'boss-component-styles';
      
      // Add CSS
      style.textContent = `
        /* Quantum Exam Styling */
        .quantum-exam-panel {
          border-color: #d35db3;
          background-color: rgba(33, 35, 47, 0.95);
          position: relative;
          overflow: hidden;
        }
        
        /* Header Styling */
        .exam-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 2px solid rgba(211, 93, 179, 0.3);
          padding-bottom: 10px;
        }
        
        .exam-title {
          font-size: 1.2rem;
          margin: 0;
          color: #d35db3;
        }
        
        .cosmic-glow {
          text-shadow: 0 0 5px #d35db3, 0 0 10px rgba(211, 93, 179, 0.5);
          animation: pulse-glow 2s infinite;
        }
        
        .exam-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .time-container {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .time-icon {
          margin-right: 5px;
        }
        
        .time-remaining {
          font-family: monospace;
          font-size: 1.1rem;
          color: white;
        }
        
        .time-warning {
          color: #f0c866;
          animation: pulse-warning 1s infinite;
        }
        
        .time-critical {
          color: #e67e73;
          animation: pulse-danger 0.5s infinite;
        }
        
        .confidence-container {
          width: 150px;
        }
        
        .confidence-bar {
          height: 8px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        
        .confidence-fill {
          height: 100%;
          background-color: #56b886;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        
        .confidence-text {
          font-size: 0.7rem;
          text-align: right;
        }
        
        /* Professor Styling */
        .professor-container {
          display: flex;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          transition: all 0.5s ease;
        }
        
        .professor-portrait {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          margin-right: 15px;
        }
        
        .professor-image {
          width: 100%;
          height: 100%;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><circle fill="%23777" cx="50" cy="35" r="20"/><rect fill="%23777" x="25" y="60" width="50" height="40"/></svg>');
          background-size: cover;
          transition: all 0.5s ease;
        }
        
        .professor-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: all 0.5s ease;
        }
        
        .professor-dialogue {
          flex-grow: 1;
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
          padding: 10px;
          position: relative;
        }
        
        .professor-dialogue:before {
          content: '';
          position: absolute;
          left: -8px;
          top: 15px;
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 8px solid rgba(0, 0, 0, 0.3);
        }
        
        /* Professor States */
        .normal-state .professor-image {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><circle fill="%23777" cx="50" cy="35" r="20"/><rect fill="%23777" x="25" y="60" width="50" height="40"/></svg>');
        }
        
        .quantum-state {
          background-color: rgba(91, 141, 217, 0.2);
        }
        
        .quantum-state .professor-image {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23335599" width="100" height="100"/><circle fill="%235b8dd9" cx="50" cy="35" r="20"/><rect fill="%235b8dd9" x="25" y="60" width="50" height="40"/><circle fill="%23ffffff" cx="42" cy="30" r="3"/><circle fill="%23ffffff" cx="58" cy="30" r="3"/></svg>');
          animation: quantum-flicker 4s infinite;
        }
        
        .quantum-state .professor-glow {
          box-shadow: 0 0 15px rgba(91, 141, 217, 0.7) inset;
          opacity: 0.7;
        }
        
        .cosmic-state {
          background-color: rgba(211, 93, 179, 0.2);
        }
        
        .cosmic-state .professor-image {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23220033" width="100" height="100"/><circle fill="%23d35db3" cx="50" cy="35" r="20"/><rect fill="%23d35db3" x="25" y="60" width="50" height="40"/><circle fill="%23ffffff" cx="42" cy="30" r="4"/><circle fill="%23ffffff" cx="58" cy="30" r="4"/></svg>');
          animation: cosmic-professor 4s infinite alternate;
        }
        
        .cosmic-state .professor-glow {
          box-shadow: 0 0 15px rgba(211, 93, 179, 0.7) inset, 0 0 30px rgba(211, 93, 179, 0.3);
          opacity: 1;
        }
        
        /* Quantum particles in professor portrait */
        .quantum-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          pointer-events: none;
        }
        
        .quantum-state .quantum-particles,
        .cosmic-state .quantum-particles {
          opacity: 1;
        }
        
        /* Phase Styling */
        .exam-phase-container {
          margin-bottom: 20px;
          min-height: 200px;
        }
        
        .phase-header {
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
        }
        
        .cosmic-border {
          position: relative;
          border-bottom: 0;
        }
        
        .cosmic-border:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, 
            rgba(91, 141, 217, 0),
            rgba(91, 141, 217, 0.7) 20%, 
            rgba(211, 93, 179, 0.7) 50%,
            rgba(91, 141, 217, 0.7) 80%,
            rgba(91, 141, 217, 0)
          );
        }
        
        .phase-title {
          margin: 0 0 10px 0;
          color: #f0c866;
        }
        
        /* Question Styling */
        .question-card {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          transition: all 0.5s ease;
        }
        
        .question-text {
          margin-bottom: 15px;
        }
        
        .question-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .question-option {
          text-align: left;
          padding: 10px 15px;
          background-color: rgba(59, 76, 96, 0.4);
          border: 1px solid rgba(91, 141, 217, 0.3);
          border-radius: 5px;
          color: white;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .question-option:hover:not(:disabled) {
          background-color: rgba(91, 141, 217, 0.2);
          transform: translateX(5px);
        }
        
        .question-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .question-option.correct-option {
          background-color: rgba(86, 184, 134, 0.2);
          border-color: rgba(86, 184, 134, 0.7);
        }
        
        .question-option.incorrect-option {
          background-color: rgba(230, 126, 115, 0.2);
          border-color: rgba(230, 126, 115, 0.7);
        }
        
        /* Reality distortion meter */
        .reality-distortion-meter {
          height: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 5px;
          width: 100%;
        }
        
        .reality-fill {
          height: 100%;
          background: linear-gradient(90deg, 
            rgba(91, 141, 217, 0.7) 0%,
            rgba(91, 141, 217, 0.7) 40%,
            rgba(211, 93, 179, 0.7) 60%, 
            rgba(211, 93, 179, 0.7) 100%
          );
          transition: width 0.5s ease;
        }
        
        /* Results Styling */
        .phase-results {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
        }
        
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
        }
        
        .results-title {
          margin: 0;
          color: #f0c866;
        }
        
        .score-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 5px;
          border: 2px solid #5b8dd9;
        }
        
        .score-value {
          font-size: 1.2rem;
          font-weight: bold;
          color: white;
        }
        
        .score-text {
          font-size: 0.8rem;
          color: #aaa;
        }
        
        .answered-questions {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .answered-question {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 5px;
          padding: 10px;
          border-left: 3px solid transparent;
        }
        
        .correct-answer {
          border-left-color: #56b886;
        }
        
        .incorrect-answer {
          border-left-color: #e67e73;
        }
        
        .question-result {
          display: flex;
          margin-bottom: 10px;
        }
        
        .result-icon {
          margin-right: 10px;
          font-size: 1rem;
        }
        
        .answer-explanation {
          background-color: rgba(59, 76, 96, 0.4);
          padding: 10px;
          border-radius: 5px;
          font-size: 0.8rem;
        }
        
        /* Quantum effects */
        .quantum-text {
          animation: quantum-text 4s infinite alternate;
        }
        
        .quantum-shimmer {
          position: relative;
          overflow: hidden;
        }
        
        .quantum-shimmer::after {
          content: '';
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(30deg);
          animation: shimmer 3s infinite;
        }
        
        .quantum-options .question-option {
          animation: option-shift 8s infinite alternate;
        }
        
        .quantum-probability {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.7rem;
          opacity: 0.7;
          color: #5b8dd9;
        }
        
        .cosmic-hover:hover {
          background: linear-gradient(
            90deg,
            rgba(91, 141, 217, 0.3) 0%,
            rgba(211, 93, 179, 0.3) 100%
          ) !important;
          border-color: rgba(211, 93, 179, 0.5) !important;
        }
        
        .reality-warped {
          animation: reality-warp 10s infinite alternate;
        }
        
        .quantum-particle {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.7;
          z-index: 10;
          animation: float-particle 10s infinite ease-in-out;
        }
        
        .reality-ripple {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: rgba(211, 93, 179, 0.3);
          pointer-events: none;
          animation: ripple 4s ease-out forwards;
          z-index: 5;
        }
        
        .cosmic-rift {
          position: absolute;
          width: 20px;
          height: 5px;
          background-color: rgba(211, 93, 179, 0.7);
          border-radius: 50%;
          box-shadow: 
            0 0 10px rgba(211, 93, 179, 0.7),
            0 0 20px rgba(211, 93, 179, 0.5),
            0 0 30px rgba(211, 93, 179, 0.3);
          z-index: 100;
          transform: rotate(30deg);
          opacity: 0.7;
        }
        
        .cosmic-rift.expanding {
          animation: rift-expand 3s forwards;
        }
        
        .cosmic-rift.collapsing {
          animation: rift-collapse 2s forwards;
        }
        
        .cosmic-collapse {
          animation: space-distort 5s infinite alternate;
        }
        
        /* Reality states for Professor */
        .quantum-state .professor-dialogue {
          animation: dialogue-shift 8s infinite;
        }
        
        .cosmic-state .professor-dialogue {
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(211, 93, 179, 0.1) 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
          animation: cosmic-dialogue 5s infinite alternate;
        }
        
        /* Results for different professor states */
        .quantum-results .score-circle {
          border-color: #5b8dd9;
          box-shadow: 0 0 10px rgba(91, 141, 217, 0.5);
          animation: uncertainty 4s infinite;
        }
        
        .cosmic-results .score-circle {
          border-color: #d35db3;
          background: linear-gradient(
            135deg,
            rgba(91, 141, 217, 0.2) 0%,
            rgba(211, 93, 179, 0.2) 100%
          );
          box-shadow: 
            0 0 10px rgba(211, 93, 179, 0.5),
            0 0 20px rgba(211, 93, 179, 0.3);
          animation: cosmic-pulse 3s infinite alternate;
        }
        
        /* Exam completion styling */
        .exam-complete {
          text-align: center;
          padding: 20px;
          position: relative;
        }
        
        .cosmic-seal {
          position: absolute;
          width: 0;
          height: 0;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(211, 93, 179, 0.7) 0%,
            rgba(91, 141, 217, 0.7) 50%,
            transparent 70%
          );
          opacity: 0;
          z-index: -1;
        }
        
        .cosmic-seal.active {
          animation: seal-activate 3s forwards;
        }
        
        .complete-title {
          font-size: 1.3rem;
          margin-bottom: 20px;
          color: #f0c866;
        }
        
        .cosmic-text {
          background: linear-gradient(
            90deg,
            #5b8dd9 0%,
            #d35db3 50%,
            #f0c866 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shift 5s infinite alternate;
        }
        
        .final-score-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .final-score-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
          border: 3px solid;
        }
        
        .final-score-circle.passed {
          border-color: #56b886;
          box-shadow: 0 0 15px rgba(86, 184, 134, 0.5);
        }
        
        .final-score-circle.failed {
          border-color: #e67e73;
          box-shadow: 0 0 15px rgba(230, 126, 115, 0.5);
        }
        
        .final-score {
          font-size: 2rem;
          font-weight: bold;
          color: white;
        }
        
        .final-verdict {
          text-align: center;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }
        
        .cosmic-rewards {
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .rewards-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 15px;
        }
        
        .reward-item {
          display: flex;
          align-items: center;
          background-color: rgba(59, 76, 96, 0.4);
          padding: 10px;
          border-radius: 5px;
        }
        
        .reward-icon {
          margin-right: 10px;
          font-size: 1.2rem;
        }
        
        .quantum-reward {
          background: linear-gradient(
            90deg,
            rgba(91, 141, 217, 0.2) 0%,
            rgba(211, 93, 179, 0.2) 100%
          );
          border: 1px solid rgba(211, 93, 179, 0.3);
          animation: quantum-reward 3s infinite alternate;
        }
        
        .reality-collapsed .cosmic-rewards {
          animation: reality-collapse 2s forwards;
        }
        
        .reality-unravel .cosmic-rewards {
          animation: reality-unravel 10s infinite alternate;
        }
        
        .cosmic-particle {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(211, 93, 179, 0.7);
          box-shadow: 0 0 5px rgba(211, 93, 179, 0.7);
          animation: cosmic-particle 5s infinite alternate;
        }
        
        /* Cosmic animations */
        @keyframes pulse-glow {
          0% { text-shadow: 0 0 5px currentColor, 0 0 10px currentColor; }
          50% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor; }
          100% { text-shadow: 0 0 5px currentColor, 0 0 10px currentColor; }
        }
        
        @keyframes pulse-warning {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        
        @keyframes pulse-danger {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        
        @keyframes quantum-flicker {
          0% { opacity: 1; }
          5% { opacity: 0.7; }
          10% { opacity: 0.9; }
          15% { opacity: 0.8; }
          20% { opacity: 1; }
          25% { opacity: 0.7; }
          30% { opacity: 0.9; }
          35% { opacity: 1; }
          40% { opacity: 0.8; }
          45% { opacity: 1; }
          75% { opacity: 0.9; }
          80% { opacity: 1; }
          85% { opacity: 0.8; }
          90% { opacity: 1; }
          95% { opacity: 0.9; }
          100% { opacity: 1; }
        }
        
        @keyframes cosmic-professor {
          0% { 
            filter: hue-rotate(0deg); 
            transform: scale(1);
          }
          100% { 
            filter: hue-rotate(90deg); 
            transform: scale(1.05);
          }
        }
        
        @keyframes quantum-text {
          0% { 
            opacity: 0.9;
            letter-spacing: normal;
          }
          50% { 
            opacity: 0.7;
            letter-spacing: 1px;
          }
          100% { 
            opacity: 0.9;
            letter-spacing: normal;
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(30deg); }
        }
        
        @keyframes option-shift {
          0% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes reality-warp {
          0% { 
            transform: perspective(1000px) rotateX(0deg);
            filter: hue-rotate(0deg);
          }
          50% { 
            transform: perspective(1000px) rotateX(2deg);
            filter: hue-rotate(15deg);
          }
          100% { 
            transform: perspective(1000px) rotateX(0deg);
            filter: hue-rotate(0deg);
          }
        }
        
        @keyframes float-particle {
          0% { 
            transform: translateX(0) translateY(0);
            opacity: 0.7;
          }
          50% { 
            transform: translateX(20px) translateY(-10px);
            opacity: 0.9;
          }
          100% { 
            transform: translateX(0) translateY(0);
            opacity: 0.7;
          }
        }
        
        @keyframes ripple {
          0% { 
            width: 10px;
            height: 10px;
            opacity: 0.7;
          }
          100% { 
            width: 1000px;
            height: 1000px;
            opacity: 0;
          }
        }
        
        @keyframes rift-expand {
          0% { 
            width: 20px;
            height: 5px;
            opacity: 0.7;
          }
          100% { 
            width: 500px;
            height: 100px;
            opacity: 0.9;
          }
        }
        
        @keyframes rift-collapse {
          0% { 
            width: 500px;
            height: 100px;
            opacity: 0.9;
          }
          100% { 
            width: 5px;
            height: 2px;
            opacity: 0;
          }
        }
        
        @keyframes space-distort {
          0% { transform: none; }
          25% { transform: skew(1deg, 0deg); }
          75% { transform: skew(-1deg, 0.5deg); }
          100% { transform: none; }
        }
        
        @keyframes dialogue-shift {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes cosmic-dialogue {
          0% { 
            background-position: 0% 0%;
            box-shadow: 0 0 5px rgba(211, 93, 179, 0.3) inset;
          }
          100% { 
            background-position: 100% 100%;
            box-shadow: 0 0 15px rgba(211, 93, 179, 0.5) inset;
          }
        }
        
        @keyframes uncertainty {
          0% { transform: scale(1); opacity: 1; }
          33% { transform: scale(1.05); opacity: 0.7; }
          66% { transform: scale(0.97); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes cosmic-pulse {
          0% { 
            box-shadow: 0 0 10px rgba(211, 93, 179, 0.5), 0 0 20px rgba(211, 93, 179, 0.3);
            transform: rotate(0deg);
          }
          100% { 
            box-shadow: 0 0 20px rgba(211, 93, 179, 0.7), 0 0 30px rgba(211, 93, 179, 0.5);
            transform: rotate(10deg);
          }
        }
        
        @keyframes seal-activate {
          0% { 
            width: 0;
            height: 0;
            opacity: 0;
          }
          100% { 
            width: 500px;
            height: 500px;
            opacity: 0.7;
          }
        }
        
        @keyframes text-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        
        @keyframes reality-collapse {
          0% { transform: none; opacity: 1; }
          50% { transform: perspective(500px) rotateX(10deg) scale(0.9); opacity: 0.8; }
          100% { transform: perspective(500px) rotateX(0deg) scale(0.5); opacity: 0; }
        }
        
        @keyframes reality-unravel {
          0% { transform: skew(0deg, 0deg); }
          33% { transform: skew(2deg, 1deg); }
          66% { transform: skew(-2deg, -1deg); }
          100% { transform: skew(0deg, 0deg); }
        }
        
        @keyframes cosmic-particle {
          0% { transform: scale(1) rotate(0deg); opacity: 0.7; }
          100% { transform: scale(2) rotate(180deg); opacity: 0.3; }
        }
        
        @keyframes quantum-reward {
          0% { border-color: rgba(91, 141, 217, 0.3); }
          50% { border-color: rgba(211, 93, 179, 0.5); }
          100% { border-color: rgba(91, 141, 217, 0.3); }
        }
        
        /* Button effects */
        .cosmic-pulse {
          position: relative;
          overflow: hidden;
        }
        
        .cosmic-pulse::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            rgba(211, 93, 179, 0) 0%,
            rgba(211, 93, 179, 0.1) 50%,
            rgba(211, 93, 179, 0) 100%
          );
          transform: rotate(45deg);
          animation: cosmic-button-pulse 3s infinite;
        }
        
        @keyframes cosmic-button-pulse {
          0% { transform: rotate(45deg) translateX(-100%) translateY(-100%); }
          100% { transform: rotate(45deg) translateX(100%) translateY(100%); }
        }
      `;
      
      // Add to document head
      document.head.appendChild(style);
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