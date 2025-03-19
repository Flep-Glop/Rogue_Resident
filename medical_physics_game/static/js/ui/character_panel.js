// character_panel.js - Modern implementation of character display and stats

// CharacterPanel singleton - manages character UI
const CharacterPanel = {
  // State tracking
  state: {
    currentCharacterId: null,
    animationActive: false
  },

  // Initialize the character panel
  initialize: function() {
    console.log("Initializing character panel...");
    
    // Register for events
    EventSystem.on(GAME_EVENTS.CHARACTER_UPDATED, this.updateCharacterDisplay.bind(this));
    EventSystem.on(GAME_EVENTS.LIVES_CHANGED, this.updateLives.bind(this));
    EventSystem.on(GAME_EVENTS.INSIGHT_CHANGED, this.updateInsight.bind(this));
    
    // Initial character display if available in GameState
    if (GameState && GameState.data && GameState.data.character) {
      this.updateCharacterDisplay(GameState.data.character);
    }
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.animationActive) {
        this.pauseAnimations();
      } else if (!document.hidden && !this.state.animationActive) {
        this.resumeAnimations();
      }
    });
    
    return this;
  },
  
  // Update character display with new character data
  updateCharacterDisplay: function(character) {
    if (!character) {
      console.error('No character data provided to updateCharacterDisplay');
      return;
    }
    
    // Try to get character ID from name
    let characterId = this.getCharacterId(character);
    this.state.currentCharacterId = characterId;
    
    // Get image path
    const imagePath = this.getCharacterImagePath(characterId);
    
    // Create HTML for character display
    const charInfoHtml = `
      <div class="character-details">
        <p class="character-name"><strong>${character.name}</strong></p>
        <div class="character-avatar-container">
          <div class="character-avatar">
            <img src="${imagePath}" 
                 alt="${character.name}" 
                 class="character-panel-img pixel-character-img"
                 onerror="this.onerror=null; this.src='/static/img/characters/resident.png';">
          </div>
        </div>
        <div class="insight-bar-container">
          <div class="insight-bar-label">Insight</div>
          <div class="insight-bar">
            <div class="insight-bar-fill" style="width: ${Math.min(100, character.insight / 2)}%"></div>
            <span class="insight-value">${character.insight}</span>
          </div>
        </div>
        <p class="character-level"><strong>Level:</strong> ${character.level}</p>
      </div>
    `;
    
    // Update the character info element
    const charInfoElement = document.getElementById('character-info');
    if (charInfoElement) {
      charInfoElement.innerHTML = charInfoHtml;
      
      // Add character type class for CSS targeting
      const characterStats = document.querySelector('.character-stats');
      if (characterStats) {
        // Remove any existing character type classes
        const possibleClasses = ['debug-mode-character', 'resident-character', 'qa-specialist-character', 'physicist-character'];
        possibleClasses.forEach(cls => characterStats.classList.remove(cls));
        
        // Add appropriate class based on character ID
        characterStats.classList.add(`${characterId}-character`);
      }
    }
    
    // Update lives visualization
    this.updateLivesDisplay(character.lives, character.max_lives);
    
    // Update special ability if exists
    if (character.special_ability) {
      this.updateSpecialAbility(character.special_ability);
    }
    
    // Apply animations
    this.applyAnimations();
  },
  
  // Get character ID from character data
  getCharacterId: function(character) {
    // If character already has an id property, use it
    if (character.id) {
      return character.id;
    }
    
    // Try to get ID from name using CharacterAssets helper
    if (window.CharacterAssets && typeof CharacterAssets.getCharacterIdFromName === 'function') {
      try {
        return CharacterAssets.getCharacterIdFromName(character.name);
      } catch (err) {
        console.warn('Error getting character ID from name:', err);
      }
    }
    
    // Fallback: derive ID from name
    const derivedId = character.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Default to resident if we somehow got a blank ID
    return derivedId || 'resident';
  },
  
  // Get character image path
  getCharacterImagePath: function(characterId) {
    // Try to use CharacterAssets helper
    if (window.CharacterAssets && typeof CharacterAssets.getCharacterImagePath === 'function') {
      try {
        return CharacterAssets.getCharacterImagePath(characterId);
      } catch (err) {
        console.warn('Error getting character image path:', err);
      }
    }
    
    // Fallback path construction
    return `/static/img/characters/${characterId}.png`;
  },
  
  // Update lives display
  updateLives: function(lives) {
    if (!GameState.data.character) return;
    
    const maxLives = GameState.data.character.max_lives;
    this.updateLivesDisplay(lives, maxLives);
  },
  
  // Update insight display
  updateInsight: function(insight) {
    // Update insight bar
    const insightBarFill = document.querySelector('.insight-bar-fill');
    const insightValue = document.querySelector('.insight-value');
    
    if (insightBarFill) {
      insightBarFill.style.width = `${Math.min(100, insight / 2)}%`;
    }
    
    if (insightValue) {
      insightValue.textContent = insight;
    }
  },
  
  // Update lives visualization with improved handling
  updateLivesDisplay: function(lives, maxLives) {
    const livesContainer = document.getElementById('lives-container');
    if (!livesContainer) return;
    
    // Clear current content
    livesContainer.innerHTML = '';
    
    // Check if we have lots of lives (more than 10)
    if (maxLives > 10) {
      // Set attribute for CSS targeting
      livesContainer.setAttribute('data-lives-count', 'high');
      
      // Add a numeric display for high numbers of lives
      livesContainer.innerHTML = `
        <div class="lives-numeric">
          <span class="life-icon active">❤️</span>
          <span class="lives-count">${lives} / ${maxLives}</span>
        </div>
      `;
    } else {
      // Remove any previous attribute
      livesContainer.removeAttribute('data-lives-count');
      
      // Standard heart icons for normal lives count
      for (let i = 0; i < maxLives; i++) {
        const lifeIcon = document.createElement('span');
        lifeIcon.className = i < lives ? 'life-icon active' : 'life-icon inactive';
        lifeIcon.innerHTML = i < lives ? '❤️' : '🖤';
        livesContainer.appendChild(lifeIcon);
      }
    }
    
    // Add animation if lives changed
    if (lives !== this.prevLives) {
      if (lives > this.prevLives) {
        livesContainer.classList.add('lives-increased');
        setTimeout(() => livesContainer.classList.remove('lives-increased'), 1000);
      } else if (lives < this.prevLives) {
        livesContainer.classList.add('lives-decreased');
        setTimeout(() => livesContainer.classList.remove('lives-decreased'), 1000);
      }
      this.prevLives = lives;
    }
  },
  
  // Update special ability display with button
  updateSpecialAbility: function(specialAbility) {
    if (!specialAbility) return;
    
    // Find the special ability container or create it if it doesn't exist
    let abilityContainer = document.getElementById('special-ability');
    if (!abilityContainer) {
      const charInfoElement = document.getElementById('character-info');
      if (!charInfoElement) return;
      
      abilityContainer = document.createElement('div');
      abilityContainer.id = 'special-ability';
      abilityContainer.className = 'special-ability-container mt-3';
      charInfoElement.appendChild(abilityContainer);
    }
    
    // Initialize remaining uses if not set
    if (specialAbility.remaining_uses === undefined) {
      specialAbility.remaining_uses = specialAbility.uses_per_floor || 1;
    }
    
    // Check if ability is usable
    const isUsable = specialAbility.remaining_uses > 0;
    
    // Update ability display with button and tooltip
    abilityContainer.innerHTML = `
      <button class="special-ability-btn ${!isUsable ? 'disabled' : ''}" id="use-ability-btn" ${!isUsable ? 'disabled' : ''}>
        ${specialAbility.name}
        <span class="use-count">${specialAbility.remaining_uses}/${specialAbility.uses_per_floor || 1}</span>
        <div class="ability-tooltip">${specialAbility.description}</div>
      </button>
    `;
    
    // Add event listener for using the ability
    const useAbilityBtn = document.getElementById('use-ability-btn');
    if (useAbilityBtn && isUsable) {
      useAbilityBtn.addEventListener('click', () => {
        this.useSpecialAbility(specialAbility);
      });
    }
  },
  
  // Function to use the special ability
  useSpecialAbility: function(specialAbility) {
    if (!specialAbility || !specialAbility.name) return;
    
    // Check if there are uses remaining
    if (specialAbility.remaining_uses <= 0) {
      UiUtils.showFloatingText('No uses remaining!', 'warning');
      return;
    }
    
    // Decrease remaining uses
    specialAbility.remaining_uses--;
    
    // Emit the ability used event
    EventSystem.emit('abilityUsed', {
      abilityName: specialAbility.name,
      remainingUses: specialAbility.remaining_uses
    });
    
    // Handle ability based on type
    switch (specialAbility.name) {
      case 'Literature Review':
        // Skip question node implementation
        UiUtils.showFloatingText('Skipped node without penalty', 'success');
        // Mark current node as visited and return to map
        if (GameState.data.currentNode) {
          GameState.completeNode(GameState.data.currentNode);
        }
        break;
        
      case 'Peer Review':
        // Reveal correct answer implementation
        if (typeof NodeInteraction !== 'undefined' && 
            typeof NodeInteraction.currentQuestion !== 'undefined' &&
            NodeInteraction.currentQuestion) {
          // Show correct answer in UI
          UiUtils.showFloatingText('Revealed correct answer', 'success');
          
          // Highlight the correct answer if possible
          this.highlightCorrectAnswer();
        } else {
          UiUtils.showFloatingText('No active question', 'warning');
          // Return the use since it wasn't applicable
          specialAbility.remaining_uses++;
        }
        break;
        
      case 'Measurement Uncertainty':
        // Allow retry of a failed question
        UiUtils.showFloatingText('You can retry a failed question', 'success');
        // Set flag for question component to use
        if (!GameState.data.questionEffects) {
          GameState.data.questionEffects = {};
        }
        GameState.data.questionEffects.canRetry = true;
        break;
        
      case 'Debug Override':
        // Instant completion for debugging
        UiUtils.showFloatingText('Debug mode: Node completed', 'success');
        if (GameState.data.currentNode) {
          GameState.completeNode(GameState.data.currentNode);
        }
        break;
        
      default:
        console.warn('Unknown special ability:', specialAbility.name);
    }
    
    // Update the button state
    this.updateSpecialAbility(specialAbility);
    
    // Save game state
    if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
      ApiClient.saveGame().catch(err => console.error("Failed to save game after using ability:", err));
    }
  },
  
  // Highlight the correct answer for peer review ability
  highlightCorrectAnswer: function() {
    if (!NodeInteraction || !NodeInteraction.currentQuestion) return;
    
    const question = NodeInteraction.currentQuestion;
    const correctIndex = question.correct;
    
    // Find the correct answer option
    const options = document.querySelectorAll('.question-option');
    if (options && options.length > correctIndex) {
      // Add highlighting class
      options[correctIndex].classList.add('correct-answer-highlight');
      
      // Remove highlight after a while
      setTimeout(() => {
        options[correctIndex].classList.remove('correct-answer-highlight');
      }, 3000);
    }
  },
  
  // Apply animations to character display
  applyAnimations: function() {
    this.state.animationActive = true;
    
    // Apply bobbing animation to character image
    const characterImg = document.querySelector('.character-panel-img');
    if (characterImg) {
      characterImg.classList.add('pixel-bobbing');
    }
    
    // Apply subtle glow to character avatar
    const avatar = document.querySelector('.character-avatar');
    if (avatar) {
      avatar.classList.add('pixel-glow');
    }
  },
  
  // Pause animations (for background tabs, etc.)
  pauseAnimations: function() {
    this.state.animationActive = false;
    
    document.querySelectorAll('.pixel-bobbing').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
    
    document.querySelectorAll('.pixel-glow').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  },
  
  // Resume animations
  resumeAnimations: function() {
    this.state.animationActive = true;
    
    document.querySelectorAll('.pixel-bobbing').forEach(el => {
      el.style.animationPlayState = 'running';
    });
    
    document.querySelectorAll('.pixel-glow').forEach(el => {
      el.style.animationPlayState = 'running';
    });
  },
  
  // Initialize inventory system
  initializeInventory: function() {
    if (typeof InventorySystem !== 'undefined') {
      InventorySystem.initialize();
    }
  },
  
  // Add item to inventory
  addItemToInventory: function(item) {
    if (typeof InventorySystem !== 'undefined') {
      return InventorySystem.addItem(item);
    }
    return false;
  },
  
  // Get effect description for an item
  getEffectDescription: function(effect) {
    if (!effect) return 'No effect';
    
    switch (effect.type) {
      case 'insight_boost': return `+${effect.value} Insight`;
      case 'restore_life': return `Restore ${effect.value} Life`;
      case 'question_hint': return effect.value;
      case 'category_boost': return effect.value;
      case 'extra_life': return effect.value;
      default: return effect.value || 'Unknown effect';
    }
  }
};

// Export globally
window.CharacterPanel = CharacterPanel;