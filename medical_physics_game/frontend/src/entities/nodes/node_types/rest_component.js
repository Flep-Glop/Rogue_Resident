// rest_component.js - Refactored implementation using new design architecture

const RestComponent = ComponentUtils.createComponent('rest', {
  // Initialize component
  initialize: function() {
    console.log("Initializing rest component");
    
    // Initialize UI state
    this.setUiState('optionSelected', false);
    
    // Subscribe to design bridge changes
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // Update rest room appearance if active
    const container = document.getElementById('rest-container');
    if (container && container.style.display !== 'none') {
      this.refreshAppearance();
    }
  },
  
  // Refresh appearance with design tokens
  refreshAppearance: function() {
    // Apply design tokens if needed
    const restColor = window.DesignBridge?.colors?.nodeRest || '#9c77db';
    
    // Example: update button colors
    const healBtn = document.getElementById('rest-heal-btn');
    const studyBtn = document.getElementById('rest-study-btn');
    
    if (healBtn && studyBtn) {
      healBtn.style.backgroundColor = window.DesignBridge?.colors?.secondary || '#56b886';
      studyBtn.style.backgroundColor = window.DesignBridge?.colors?.primary || '#5b8dd9';
    }
  },
  
  // Render the rest UI
  render: function(nodeData, container) {
    console.log("Rendering rest component", nodeData);
    
    // Get colors from design bridge if available
    const restColor = window.DesignBridge?.colors?.nodeRest || '#9c77db';
    
    // Create rest UI with new design classes
    container.innerHTML = `
      <div class="game-panel shadow-md anim-fade-in">
        <div class="game-panel__title border-left-rarity border-left-rare">
          <h3>Break Room</h3>
        </div>
        
        <div class="mb-md p-sm bg-dark-alt rounded-md">
          <p class="text-light">Take a moment to rest and recuperate. Choose an option to continue your journey.</p>
        </div>
        
        <div id="rest-options" class="grid grid-cols-2 gap-md mb-lg">
          <div class="game-card shadow-sm hover:shadow-md">
            <div class="game-card__header bg-secondary">
              <h4 class="game-card__title">Heal</h4>
            </div>
            <div class="game-card__body text-center">
              <div class="p-md">
                <span class="text-xl mb-sm">❤️</span>
                <p class="mb-sm">Restore your energy and regain 1 life point.</p>
                <span class="badge badge-success">+1 Life</span>
              </div>
            </div>
            <div class="game-card__footer">
              <button id="rest-heal-btn" class="game-btn game-btn--secondary w-full">
                Heal (+1 Life)
              </button>
            </div>
          </div>
          
          <div class="game-card shadow-sm hover:shadow-md">
            <div class="game-card__header bg-primary">
              <h4 class="game-card__title">Study</h4>
            </div>
            <div class="game-card__body text-center">
              <div class="p-md">
                <span class="text-xl mb-sm">📚</span>
                <p class="mb-sm">Review medical physics concepts to gain insight.</p>
                <span class="badge badge-primary">+5 Insight</span>
              </div>
            </div>
            <div class="game-card__footer">
              <button id="rest-study-btn" class="game-btn game-btn--primary w-full">
                Study (+5 Insight)
              </button>
            </div>
          </div>
        </div>
        
        <div id="rest-result" class="alert mb-md" style="display: none;"></div>
        
        <button id="rest-continue-btn" class="game-btn game-btn--primary w-full" 
                style="display: ${this.getUiState('optionSelected') ? 'block' : 'none'};">
          Continue
        </button>
      </div>
    `;
    
    // Add event handlers using the component utility
    this.bindAction('rest-heal-btn', 'click', 'heal', { nodeData });
    this.bindAction('rest-study-btn', 'click', 'study', { nodeData });
    this.bindAction('rest-continue-btn', 'click', 'continue', { nodeData });
    
    // Apply design tokens if available
    if (window.DesignBridge) {
      this.refreshAppearance();
    }
  },
  
  // Heal action - restore 1 life with improved feedback
  heal: function(nodeData) {
    console.log("Activating heal option");
    
    // Mark option as selected
    this.setUiState('optionSelected', true);
    
    // Show result message
    const resultDiv = document.getElementById('rest-result');
    if (resultDiv) {
      resultDiv.className = 'alert alert-success anim-fade-in';
      resultDiv.innerHTML = `
        <div class="flex items-center mb-sm">
          <span class="text-xl mr-sm">✓</span>
          <strong>Rest Complete</strong>
        </div>
        <p>You take a moment to rest, regaining your energy and restoring 1 life point.</p>
      `;
      resultDiv.style.display = 'block';
    }
    
    // Show continue button
    const continueBtn = document.getElementById('rest-continue-btn');
    if (continueBtn) {
      continueBtn.style.display = 'block';
      continueBtn.classList.add('anim-pulse-scale');
    }
    
    // Hide option buttons
    const optionsContainer = document.getElementById('rest-options');
    if (optionsContainer) {
      optionsContainer.style.opacity = '0.5';
      const buttons = optionsContainer.querySelectorAll('button');
      buttons.forEach(btn => btn.disabled = true);
    }
    
    // Update player lives
    this.updatePlayerLives(1);
  },
  
  // Study action - gain insight with improved feedback
  study: function(nodeData) {
    console.log("Activating study option");
    
    // Mark option as selected
    this.setUiState('optionSelected', true);
    
    // Show result message
    const resultDiv = document.getElementById('rest-result');
    if (resultDiv) {
      resultDiv.className = 'alert alert-primary anim-fade-in';
      resultDiv.innerHTML = `
        <div class="flex items-center mb-sm">
          <span class="text-xl mr-sm">✓</span>
          <strong>Study Complete</strong>
        </div>
        <p>You review important medical physics concepts, gaining 5 insight points.</p>
      `;
      resultDiv.style.display = 'block';
    }
    
    // Show continue button
    const continueBtn = document.getElementById('rest-continue-btn');
    if (continueBtn) {
      continueBtn.style.display = 'block';
      continueBtn.classList.add('anim-pulse-scale');
    }
    
    // Hide option buttons
    const optionsContainer = document.getElementById('rest-options');
    if (optionsContainer) {
      optionsContainer.style.opacity = '0.5';
      const buttons = optionsContainer.querySelectorAll('button');
      buttons.forEach(btn => btn.disabled = true);
    }
    
    // Update player insight
    this.updatePlayerInsight(5);
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Rest component handling action: ${action}`, data);
    
    switch (action) {
      case 'heal':
        this.heal(nodeData);
        break;
        
      case 'study':
        this.study(nodeData);
        break;
        
      case 'continue':
        this.completeNode(nodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('rest', RestComponent);
}