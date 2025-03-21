// updated_boss_component.js - Properly isolated boss component

const BossComponent = ComponentUtils.createComponent('boss', {
  
  // Initialize component
  initialize: function() {
    console.log("Initializing isolated boss component");
    
    // Load boss-specific styles
    if (typeof BossLayoutManager !== 'undefined') {
      BossLayoutManager.loadBossStyles();
    } else {
      console.warn("BossLayoutManager not available - some styles may not be applied correctly");
      this._loadBossStyles();
    }
    
    // Component state
    this.state = {
      currentPhase: 0,
      phases: [],
      score: 0,
      bossAnimationId: null
    };
    
    return this;
  },
  
  // Render boss component with isolated styling
  render: function(nodeData, container) {
    console.log("Rendering boss component with isolated styling");
    
    // Ensure we have a boss container
    if (!document.getElementById('boss-container')) {
      container.id = 'boss-container';
      container.className = 'interaction-container boss-exam';
    }
    
    // Activate boss layout mode
    if (typeof BossLayoutManager !== 'undefined') {
      BossLayoutManager.activate();
    } else {
      // Add class directly if manager isn't available
      document.body.classList.add('boss-mode-active');
    }
    
    // Create isolated boss layout using the boss-container class for scoping
    container.innerHTML = `
      <div class="boss-container">
        <!-- Boss header -->
        <div class="boss-header">
          <div class="boss-header-left">
            <h2 class="boss-title">Ionix</h2>
            <p class="boss-subtitle">The Sentient Ion Chamber</p>
          </div>
          <div class="boss-header-right">
            <!-- Timer or other metadata can go here -->
          </div>
        </div>
        
        <!-- Main content layout -->
        <div class="boss-layout">
          <!-- Left column for boss character -->
          <div class="boss-character-column">
            <div id="boss-sprite" class="boss-sprite">
              <!-- Boss sprite will be inserted here -->
            </div>
          </div>
          
          <!-- Right column for content -->
          <div class="boss-content-column">
            <!-- Boss dialogue -->
            <div id="boss-dialogue" class="boss-dialogue">
              <p>I am Ionix, a sentient ion chamber. Your knowledge of radiation physics will be tested.</p>
            </div>
            
            <!-- Dynamic content area -->
            <div id="boss-content-area" class="boss-content-area">
              <!-- Phase content will be inserted here -->
              <div class="question-section">
                <div class="question-text">
                  <p>What principle is used to calibrate ion chambers to account for differences in beam quality?</p>
                </div>
                <div class="question-options">
                  <button class="option-btn">A) The inverse square law</button>
                  <button class="option-btn">B) Bragg-Gray cavity theory</button>
                  <button class="option-btn">C) Beer-Lambert attenuation</button>
                  <button class="option-btn">D) Compton scattering principles</button>
                </div>
              </div>
              
              <!-- Action buttons with proper scoping -->
              <div class="boss-actions">
                <button id="boss-continue-btn" class="boss-btn">Continue</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Initialize boss sprite
    this._initializeBossSprite();
    
    // Set up event listeners
    this._setupEventHandlers(nodeData);
  },
  
  // Clean up when leaving boss node
  destroy: function() {
    console.log("Cleaning up boss component");
    
    // Deactivate boss layout mode
    if (typeof BossLayoutManager !== 'undefined') {
      BossLayoutManager.deactivate();
    } else {
      // Remove class directly if manager isn't available
      document.body.classList.remove('boss-mode-active');
    }
    
    // Clean up sprite animation
    if (this.state.bossAnimationId && typeof SpriteSystem !== 'undefined') {
      SpriteSystem.removeAnimation(this.state.bossAnimationId);
      this.state.bossAnimationId = null;
    }
    
    // Reset state
    this.state = {
      currentPhase: 0,
      phases: [],
      score: 0,
      bossAnimationId: null
    };
  },
  
  // Initialize boss sprite with proper pixel rendering
  _initializeBossSprite: function() {
    const spriteContainer = document.getElementById('boss-sprite');
    if (!spriteContainer) {
      console.error("Boss sprite container not found");
      return;
    }
    
    // Try to use SpriteSystem if available
    if (typeof SpriteSystem !== 'undefined' && typeof SpriteSystem.createAnimation === 'function') {
      try {
        // Remove any existing content
        spriteContainer.innerHTML = '';
        
        // Create animation
        const animId = SpriteSystem.createAnimation(
          'ion_chamber', // character/boss id
          spriteContainer,
          {
            animation: 'idle',
            scale: 4,
            autoPlay: true
          }
        );
        
        if (animId) {
          this.state.bossAnimationId = animId;
          console.log("Created boss animation with id:", animId);
        } else {
          // Fallback to static image if animation creation failed
          this._createStaticBossImage(spriteContainer);
        }
      } catch (err) {
        console.error("Error creating boss animation:", err);
        this._createStaticBossImage(spriteContainer);
      }
    } else {
      // Fallback to static image
      this._createStaticBossImage(spriteContainer);
    }
  },
  
  // Create static boss image as fallback
  _createStaticBossImage: function(container) {
    console.log("Using static boss image fallback");
    
    // Clear container
    container.innerHTML = '';
    
    // Create image element
    const img = document.createElement('img');
    img.src = '/static/img/characters/ion_chamber/idle.png';
    img.alt = 'Ion Chamber Boss';
    img.className = 'boss-static-img boss-idle';
    img.style.imageRendering = 'pixelated';
    
    // Add error handler
    img.onerror = () => {
      console.error("Failed to load boss image");
      container.innerHTML = `
        <div class="boss-placeholder">
          <span>⚡</span>
        </div>
      `;
    };
    
    // Add to container
    container.appendChild(img);
  },
  
  // Set up event handlers
  _setupEventHandlers: function(nodeData) {
    // Continue button
    const continueBtn = document.getElementById('boss-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this._advancePhase(nodeData);
      });
    }
    
    // Option buttons
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this._handleOptionSelected(index, nodeData);
      });
    });
  },
  
  // Advance to next phase
  _advancePhase: function(nodeData) {
    console.log("Advancing to next phase");
    
    // For this example, we'll just show a success message
    const contentArea = document.getElementById('boss-content-area');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="question-section">
          <div class="question-text">
            <p>Phase complete! Your knowledge of radiation physics is impressive.</p>
          </div>
          <div class="boss-actions">
            <button id="complete-boss-btn" class="boss-btn">Complete Examination</button>
          </div>
        </div>
      `;
      
      // Add event listener for the new button
      const completeBtn = document.getElementById('complete-boss-btn');
      if (completeBtn) {
        completeBtn.addEventListener('click', () => {
          this._completeBoss(nodeData);
        });
      }
    }
    
    // Update boss dialogue
    const dialogueEl = document.getElementById('boss-dialogue');
    if (dialogueEl) {
      dialogueEl.innerHTML = '<p>You have demonstrated proficiency in this section. Let us move on.</p>';
    }
    
    // Trigger boss ability animation
    this._triggerBossAnimation('ability');
  },
  
  // Handle option selection
  _handleOptionSelected: function(index, nodeData) {
    console.log("Option selected:", index);
    
    // Disable all options
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.disabled = true;
    });
    
    // Highlight selected option (assuming option 1 is correct for this example)
    const correctIndex = 1;
    const isCorrect = index === correctIndex;
    
    if (isCorrect) {
      optionBtns[index].style.backgroundColor = 'rgba(39, 174, 96, 0.3)';
      optionBtns[index].style.borderColor = 'rgba(39, 174, 96, 0.7)';
      
      // Update dialogue for correct answer
      const dialogueEl = document.getElementById('boss-dialogue');
      if (dialogueEl) {
        dialogueEl.innerHTML = '<p>Excellent! Bragg-Gray cavity theory is indeed the foundation for ion chamber calibration.</p>';
      }
      
      // Update boss animation
      this._triggerBossAnimation('idle');
      
    } else {
      optionBtns[index].style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
      optionBtns[index].style.borderColor = 'rgba(231, 76, 60, 0.7)';
      
      // Highlight correct answer
      optionBtns[correctIndex].style.backgroundColor = 'rgba(39, 174, 96, 0.3)';
      optionBtns[correctIndex].style.borderColor = 'rgba(39, 174, 96, 0.7)';
      
      // Update dialogue for incorrect answer
      const dialogueEl = document.getElementById('boss-dialogue');
      if (dialogueEl) {
        dialogueEl.innerHTML = '<p>Incorrect. Bragg-Gray cavity theory is the foundation for ion chamber calibration.</p>';
      }
      
      // Update boss animation
      this._triggerBossAnimation('ability');
    }
  },
  
  // Complete the boss encounter
  _completeBoss: function(nodeData) {
    console.log("Completing boss encounter");
    
    // Show completion screen
    const contentArea = document.getElementById('boss-content-area');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="question-section">
          <div class="question-text">
            <p>Examination complete! You have passed the Ion Chamber Calibration test.</p>
            <p>Your understanding of radiation physics is commendable.</p>
          </div>
          <div class="boss-actions">
            <button id="boss-exit-btn" class="boss-btn">Return to Map</button>
          </div>
        </div>
      `;
      
      // Add event listener for exit button
      const exitBtn = document.getElementById('boss-exit-btn');
      if (exitBtn) {
        exitBtn.addEventListener('click', () => {
          // Mark node as visited
          if (typeof GameState !== 'undefined' && GameState.completeNode) {
            const nodeId = nodeData.id || 'boss';
            GameState.completeNode(nodeId);
          }
          
          // Return to map
          if (typeof UI !== 'undefined' && UI.showMapView) {
            UI.showMapView();
          }
        });
      }
    }
    
    // Update boss dialogue
    const dialogueEl = document.getElementById('boss-dialogue');
    if (dialogueEl) {
      dialogueEl.innerHTML = '<p>Your knowledge is adequate. You may proceed with your training.</p>';
    }
    
    // Trigger final boss animation
    this._triggerBossAnimation('ability');
  },
  
  // Trigger boss animation
  _triggerBossAnimation: function(animationName) {
    if (this.state.bossAnimationId && typeof SpriteSystem !== 'undefined') {
      // Use sprite system if available
      SpriteSystem.changeAnimation(
        this.state.bossAnimationId,
        animationName,
        {
          loop: animationName === 'idle',
          onComplete: () => {
            if (animationName !== 'idle') {
              // Switch back to idle after non-idle animations
              SpriteSystem.changeAnimation(this.state.bossAnimationId, 'idle');
            }
          }
        }
      );
    } else {
      // Use CSS animations for static image
      const staticImg = document.querySelector('.boss-static-img');
      if (staticImg) {
        // Remove all animation classes
        staticImg.classList.remove('boss-idle', 'boss-ability', 'boss-walking');
        
        // Force reflow to restart animation
        void staticImg.offsetWidth;
        
        // Add requested animation class
        staticImg.classList.add(`boss-${animationName}`);
        
        // Return to idle after ability animation
        if (animationName !== 'idle') {
          setTimeout(() => {
            staticImg.classList.remove(`boss-${animationName}`);
            staticImg.classList.add('boss-idle');
          }, 1000);
        }
      }
    }
  },
  
  // Handle component actions from external callers
  handleAction: function(nodeData, action, data) {
    console.log(`Boss component handling action: ${action}`, data);
    
    switch (action) {
      case 'answer_question':
        // Handle question answering
        this._handleOptionSelected(data.answerIndex, nodeData);
        break;
        
      case 'next_phase':
        // Advance to next phase
        this._advancePhase(nodeData);
        break;
        
      case 'complete':
        // Complete the boss
        this._completeBoss(nodeData);
        break;
    }
  },
  
  // Fallback method to load boss styles if BossLayoutManager is not available
  _loadBossStyles: function() {
    if (document.getElementById('boss-container-styles')) {
      return; // Already loaded
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'boss-container-styles';
    style.textContent = `
      /* Minimal styles for boss container when manager not available */
      body.boss-mode-active .container,
      body.boss-mode-active .game-board-container {
        max-width: 95vw !important;
        width: 95vw !important;
      }
      
      .boss-container {
        position: relative;
        width: 100%;
        background-color: rgba(30, 23, 45, 0.95);
        border: 2px solid #ff6a00;
        border-radius: 8px;
      }
      
      .boss-layout {
        display: flex;
        gap: 20px;
        padding: 20px;
      }
      
      @media (max-width: 992px) {
        .boss-layout {
          flex-direction: column;
        }
      }
    `;
    
    // Add to document head
    document.head.appendChild(style);
    console.log("Added fallback boss styles");
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('boss', BossComponent);
  console.log("Registered isolated boss component");
}