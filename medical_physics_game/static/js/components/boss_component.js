// simplified_boss_component.js - Bare bones Ion Chamber Boss

const FixedBossComponent = ComponentUtils.createComponent('boss', {
  
  // Initialize component state
  initialize: function() {
    console.log("Initializing simplified ion chamber boss component");
    
    // Set default state
    this.setUiState('bossState', 'idle');
    this.setUiState('bossAnimation', null);
    
    // Track dynamic styles we create for cleanup
    this._dynamicStyleIds = [];
  },
  
  // Clean up EVERYTHING when component is destroyed
  destroy: function() {
    console.log("Cleaning up boss component...");
    
    // Stop any animations
    const animId = this.getUiState('bossAnimation');
    if (animId && typeof SpriteSystem !== 'undefined') {
      SpriteSystem.removeAnimation(animId);
    }
    
    // Clean up dynamic styles
    this.cleanupDynamicStyles();
    
    // Reset any button styles that might have leaked
    this.resetButtonStyles();
  },
  
  // Clean up all dynamic styles added by this component
  cleanupDynamicStyles: function() {
    // Remove tracked dynamic style elements
    this._dynamicStyleIds.forEach(id => {
      const styleEl = document.getElementById(id);
      if (styleEl) {
        console.log(`Removing dynamic style: ${id}`);
        styleEl.remove();
      }
    });
    
    // Remove any styles matching our ion-chamber identifiers
    document.querySelectorAll('style').forEach(style => {
      if (style.textContent.includes('ion-chamber') || 
          style.textContent.includes('game-btn--primary') && style.textContent.includes('linear-gradient')) {
        console.log("Removing untracked ion chamber style:", style);
        style.remove();
      }
    });
  },
  
  // Reset button styles outside of the boss component
  resetButtonStyles: function() {
    document.querySelectorAll('.game-btn.game-btn--primary').forEach(btn => {
      // Only reset buttons that aren't inside our boss component
      if (!btn.closest('.ion-chamber-boss')) {
        console.log("Resetting button style for:", btn);
        
        // Clear specific properties that might have leaked
        btn.style.backgroundImage = 'none';
        btn.style.background = '';
        btn.style.boxShadow = '';
        btn.style.textShadow = '';
        btn.style.transition = '';
      }
    });
  },
  
  // Add dynamic style with proper tracking for cleanup
  addDynamicStyle: function(id, css) {
    // Remove any existing style with this ID
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    
    // Create new style element
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    
    // Track this ID for cleanup
    if (!this._dynamicStyleIds.includes(id)) {
      this._dynamicStyleIds.push(id);
    }
    
    return style;
  },
  
  // Simplified render function - just containers and Ionix
  render: function(nodeData, container) {
    console.log("Rendering simplified ion chamber boss component");

    // Ensure we have a boss container
    if (!document.getElementById('boss-container')) {
      container.id = 'boss-container';
      container.className = 'interaction-container boss-exam';
    }
    
    // Create container - no inventory, just Ionix
    container.innerHTML = `
      <div class="game-panel boss-exam-panel ion-chamber-boss anim-fade-in">
        <div class="exam-header">
          <div class="exam-title-container">
            <h3 class="exam-title">Ionix</h3>
            <p class="exam-subtitle">The Sentient Ion Chamber</p>
          </div>
        </div>
        
        <!-- Simplified layout with just Ionix -->
        <div class="boss-character-container">
          <div id="boss-sprite" class="boss-sprite ion-chamber-glow"></div>
        </div>
        
        <!-- Simple dialogue -->
        <div id="boss-dialogue" class="boss-dialogue">
          <p>Greetings. I am Ionix, a sentient ion chamber.</p>
        </div>
        
        <!-- Simple continue button -->
        <button id="continue-btn" class="game-btn game-btn--primary ion-chamber-button">
          Continue
        </button>
      </div>
    `;
    
    // Add scoped styles for the boss component
    this.addDynamicStyle('ion-chamber-boss-styles', `
      /* Properly scoped styles that won't leak */
      .ion-chamber-boss {
        background-color: rgba(30, 23, 45, 0.95);
        background-image: linear-gradient(to bottom, rgba(45, 23, 53, 0.95), rgba(25, 12, 30, 0.98));
        box-shadow: 0 0 20px rgba(255, 106, 0, 0.3), inset 0 0 30px rgba(138, 43, 226, 0.2);
      }
      
      .ion-chamber-boss .exam-title {
        font-size: 1.4rem;
        color: #ff6a00;
        text-shadow: 0 0 5px rgba(255, 106, 0, 0.5);
      }
      
      .ion-chamber-boss .exam-subtitle {
        color: #ff9d4c;
        font-size: 0.9rem;
      }
      
      .ion-chamber-boss .ion-chamber-glow {
        box-shadow: 0 0 15px rgba(255, 106, 0, 0.6);
        animation: ion-chamber-glow-pulse 3s infinite;
      }
      
      .ion-chamber-boss .boss-dialogue {
        background-color: rgba(0, 0, 0, 0.4);
        border-radius: 8px;
        border-left: 3px solid #ff6a00;
        padding: 15px 20px;
        margin: 20px 0;
        font-style: italic;
      }
      
      /* IMPORTANT: Scope button styles to only affect buttons inside .ion-chamber-boss */
      .ion-chamber-boss .game-btn.game-btn--primary,
      .ion-chamber-boss .ion-chamber-button {
        background: linear-gradient(to bottom, #ff8f30, #e55b00);
        color: white;
        border: none;
        padding: 12px 18px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      
      .ion-chamber-boss .game-btn.game-btn--primary:hover,
      .ion-chamber-boss .ion-chamber-button:hover {
        background: linear-gradient(to bottom, #ffaa30, #ff6a00);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      
      @keyframes ion-chamber-glow-pulse {
        0% { box-shadow: 0 0 15px rgba(255, 106, 0, 0.4); }
        50% { box-shadow: 0 0 25px rgba(255, 106, 0, 0.7); }
        100% { box-shadow: 0 0 15px rgba(255, 106, 0, 0.4); }
      }
    `);
    
    // Initialize the simple Ionix sprite
    this.initBossSprite();
    
    // Bind continue button
    this.bindAction('continue-btn', 'click', 'continue', { nodeData });
  },
  
  // Create simple static Ionix sprite
  initBossSprite: function() {
    const container = document.getElementById('boss-sprite');
    if (!container) {
      console.error("Boss sprite container not found");
      return;
    }
    
    // Simple styling for container
    container.style.width = '140px';
    container.style.height = '140px';
    container.style.margin = '0 auto';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    
    // Create simple image element - no complex animations
    container.innerHTML = `
      <img src="/static/img/characters/ion_chamber/idle.png" 
           alt="Ionix" 
           class="boss-static-img boss-idle" 
           style="width: 100px; height: 100px; object-fit: contain; image-rendering: pixelated;">
    `;
    
    // Add some simple animation styling
    this.addDynamicStyle('ion-chamber-animations', `
      /* Simple animation for Ionix - properly scoped with unique name */
      @keyframes ion-chamber-idle {
        0% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
        50% { transform: scale(1.05); filter: drop-shadow(0 0 12px rgba(255, 106, 0, 0.5)); }
        100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
      }
      
      /* Apply animation only to elements inside ion-chamber-boss */
      .ion-chamber-boss .boss-idle {
        animation: ion-chamber-idle 3s infinite ease-in-out;
      }
    `);
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Boss component handling action: ${action}`);
    
    switch (action) {
      case 'continue':
        // Complete the node and make sure we clean up
        this.completeNode(nodeData);
        break;
      
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('boss', FixedBossComponent);
}