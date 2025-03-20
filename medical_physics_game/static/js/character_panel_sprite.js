// character_panel_sprite.js - Enhances the character panel with sprite support

// Wait for document to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Find and enhance the character panel
  initializeCharacterPanel();
});

// Initialize character panel with sprite support
function initializeCharacterPanel() {
  console.log("Initializing character panel with sprite support...");
  
  // Check if the character panel exists
  const charInfoElement = document.getElementById('character-info');
  if (!charInfoElement) {
    console.log("Character panel not found on this page");
    return;
  }

  // Find or create the character-stats element
  let characterStats = document.querySelector('.character-stats');
  if (!characterStats) {
    // Create the character stats element if it doesn't exist
    characterStats = document.createElement('div');
    characterStats.className = 'character-stats';
    document.querySelector('.player-info').appendChild(characterStats);
  }
  
  // Add resident-character class for styling
  characterStats.classList.add('resident-character');
  
  // Update the character info element with sprite container
  charInfoElement.innerHTML = `
    <div class="character-details">
      <p class="character-name"><strong>Medical Physics Resident</strong></p>
      <div class="character-avatar-container">
        <div class="character-avatar" id="character-sprite-container"></div>
      </div>
      <div class="insight-bar-container">
        <div class="insight-bar-label">Insight</div>
        <div class="insight-bar">
          <div class="insight-bar-fill" style="width: 20%"></div>
          <span class="insight-value">20</span>
        </div>
      </div>
      <p class="character-level"><strong>Level:</strong> 1</p>
    </div>
  `;
  
  // Initialize character sprite animation
  setTimeout(() => {
    if (window.CharacterAnimation) {
      // Get scale from config if available, otherwise use default
      const scale = window.CharacterConfig ? 
        CharacterConfig.getScaleFor('resident') : 3;
      
      // Initialize the animation
      const animId = CharacterAnimation.createAnimation(
        'resident',
        'character-sprite-container',
        {
          initialAnimation: 'idle',
          autoPlay: true,
          loop: true,
          scale: scale,
          centerImage: true
        }
      );
      
      // Store animation ID in window for easy access
      window.residentAnimationId = animId;
      
      // Add event listeners for animation testing
      addAnimationControls();
    } else {
      // Fallback to static image with scale
      const container = document.getElementById('character-sprite-container');
      if (container) {
        const scale = window.CharacterConfig ? 
          CharacterConfig.getScaleFor('resident') : 3;
        
        container.innerHTML = `
          <img src="/static/img/characters/resident/portrait.png" 
              alt="Medical Physics Resident" 
              class="character-panel-img pixel-character-img"
              style="transform: scale(${scale})">
        `;
      }
    }
  }, 100);
}

// Add animation control buttons for testing
function addAnimationControls() {
  // Create control buttons
  const controls = document.createElement('div');
  controls.className = 'animation-controls';
  controls.style.marginTop = '10px';
  controls.style.display = 'flex';
  controls.style.justifyContent = 'center';
  controls.style.gap = '5px';
  
  // Add buttons for different animations
  controls.innerHTML = `
    <button class="anim-btn" data-anim="idle">Idle</button>
    <button class="anim-btn" data-anim="walking">Walk</button>
    <button class="anim-btn" data-anim="ability">Ability</button>
  `;
  
  // Find the character panel to append controls
  const charPanel = document.querySelector('.character-details');
  if (charPanel) {
    charPanel.appendChild(controls);
    
    // Add click events to buttons
    controls.querySelectorAll('.anim-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const anim = this.dataset.anim;
        if (window.CharacterAnimation && window.residentAnimationId) {
          CharacterAnimation.playAnimation(window.residentAnimationId, anim);
        }
      });
    });
  }
}

// Additional function to integrate with ability usage
window.playCharacterAbilityAnimation = function() {
  if (window.CharacterAnimation && window.residentAnimationId) {
    // Play ability animation
    CharacterAnimation.playAnimation(window.residentAnimationId, 'ability');
    
    // Return to idle after animation completes
    setTimeout(() => {
      CharacterAnimation.playAnimation(window.residentAnimationId, 'idle');
    }, 1000);
  }
};