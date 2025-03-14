// character_panel.js - Handles character display and stats

// CharacterPanel singleton - manages character UI
const CharacterPanel = {
  // Initialize the character panel
  initialize: function() {
    console.log("Initializing character panel...");
    
    // Register for events
    EventSystem.on(GAME_EVENTS.CHARACTER_UPDATED, this.updateCharacterDisplay.bind(this));
    EventSystem.on(GAME_EVENTS.LIVES_CHANGED, this.updateLives.bind(this));
    EventSystem.on(GAME_EVENTS.INSIGHT_CHANGED, this.updateInsight.bind(this));
    
    // Initial character display
    this.updateCharacterDisplay(GameState.data.character);
    
    // Make sure animation stops when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.animationTimer) {
          clearInterval(this.animationTimer);
          this.animationTimer = null;
        }
      } else {
        // Resume animation when page becomes visible again
        this.startCharacterAnimation();
      }
    });
    
    return this;
  },
  
  // Update character display with new character data
  updateCharacterDisplay: function(character) {
    if (!character) return;
    
    // Get character data
    this.getCharacterData(character.name)
      .then(characterData => {
        // Get character ID
        const characterId = CharacterAssets.getCharacterIdFromName(character.name);
        
        // Create HTML for character display
        const charInfoHtml = `
          <div class="character-details">
            <p><strong>${character.name}</strong></p>
            <div class="character-avatar-container">
              <div class="character-avatar">
                <img src="${CharacterAssets.getCharacterImagePath(characterId)}" 
                     alt="${character.name}" 
                     class="character-panel-img pixel-character-img">
              </div>
            </div>
            <div class="insight-bar-container">
              <div class="insight-bar-label">Insight</div>
              <div class="insight-bar">
                <div class="insight-bar-fill" style="width: ${Math.min(100, character.insight / 2)}%"></div>
                <span class="insight-value">${character.insight}</span>
              </div>
            </div>
            <p><strong>Level:</strong> ${character.level}</p>
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
            characterStats.classList.remove('debug-physicist', 'resident-character', 'qa-specialist', 'physicist-character');
            
            // Add appropriate class based on character name
            characterStats.classList.add(`${characterId}-character`);
          }
        }
        
        // Update lives visualization
        this.updateLivesDisplay(character.lives, character.max_lives);
        
        // Update special ability if exists
        if (character.special_ability) {
          this.updateSpecialAbility(character.special_ability);
        }
        
        // Start the character animation
        this.startCharacterAnimation();
      });
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
  
  // Get character data from server or cache
  getCharacterData: function(characterName) {
    // Check if we have cached the character data
    if (this.characterDataCache && this.characterDataCache[characterName]) {
      return Promise.resolve(this.characterDataCache[characterName]);
    }
    
    // If not cached, fetch from server
    return fetch('/api/characters')
      .then(response => response.json())
      .then(data => {
        // Initialize cache if needed
        if (!this.characterDataCache) {
          this.characterDataCache = {};
        }
        
        // Find the matching character
        const character = data.characters.find(c => c.name === characterName);
        
        // Cache all characters for future use
        data.characters.forEach(c => {
          this.characterDataCache[c.name] = c;
        });
        
        return character;
      })
      .catch(error => {
        console.error('Error fetching character data:', error);
        return null;
      });
  },
  
  // Update lives visualization to handle large values
  updateLivesDisplay: function(lives, maxLives) {
    const livesContainer = document.getElementById('lives-container');
    if (!livesContainer) return;
    
    // Clear current content
    livesContainer.innerHTML = '';
    
    // Check if we have lots of lives (more than 10)
    if (maxLives > 10) {
      // Set attribute for CSS targeting
      livesContainer.setAttribute('data-lives-count', 'high');
      
      // Add a single heart icon
      const heartIcon = document.createElement('span');
      heartIcon.className = 'life-icon active';
      heartIcon.innerHTML = '❤️';
      livesContainer.appendChild(heartIcon);
      
      // Add numeric display
      const livesCount = document.createElement('span');
      livesCount.className = 'life-display';
      livesCount.textContent = ` ${lives}/${maxLives}`;
      livesContainer.appendChild(livesCount);
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
  },
  
  // Default ASCII art - kept for backward compatibility
  getDefaultAsciiArt: function() {
    return `    ,+,
   (o o)
   /|\\Y/|\\
   || ||
   /|| ||\\
     ==`;
  },
  
  // High res ASCII art - kept for backward compatibility
  getHighResAsciiArt: function(characterName) {
    if (characterName.includes('Physicist')) {
      return `   .---.
  [o--o]
 /|_⚛_|\\
  |/__\\|
  // \\\\`;
    } else if (characterName.includes('QA')) {
      return `    ,+,
   [o-o]
  /|\\#/|\\
   |QA|
   // \\\\`;
    } else if (characterName.includes('Debug')) {
      return `  $[01]$
 {>_<}
=|▢▣▢|=
 /|¦|\\
 /¦ ¦\\`;
    } else {
      return `    ,+,
   (o.o)
  /|\\Y/|\\
   || ||
  /|| ||\\
    ==`;
    }
  },
  
  // Style ASCII art - kept for backward compatibility
  styleAsciiArt: function(asciiArt, characterName) {
    // Always use high res art instead of passed-in ASCII
    const highResArt = this.getHighResAsciiArt(characterName);
    
    // Add color based on character type
    let color = '#5b8dd9'; // Default blue for resident
    
    if (characterName.includes('Physicist')) {
      color = '#56b886'; // Green for physicist
    } else if (characterName.includes('QA')) {
      color = '#f0c866'; // Yellow for QA specialist
    } else if (characterName.includes('Regulatory')) {
      color = '#e67e73'; // Red for regulatory specialist
    }
    
    // Add color styling to ASCII art for terminal-like effect
    const coloredArt = highResArt
      .split('\n')
      .map((line, index) => {
        // Add slight color variation for each line for a more dynamic look
        const shade = Math.min(100, 80 + index * 5);
        return `<span style="color: ${color}; filter: brightness(${shade}%)">${line}</span>`;
      })
      .join('\n');
    
    return coloredArt;
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
    
    // Update ability display with button and tooltip
    abilityContainer.innerHTML = `
      <button class="special-ability-btn ${specialAbility.remaining_uses <= 0 ? 'disabled' : ''}" id="use-ability-btn">
        ${specialAbility.name}
        <span class="use-count">${specialAbility.remaining_uses}/${specialAbility.uses_per_floor || 1}</span>
        <div class="ability-tooltip">${specialAbility.description}</div>
      </button>
    `;
    
    // Add event listener for using the ability
    const useAbilityBtn = document.getElementById('use-ability-btn');
    if (useAbilityBtn) {
      useAbilityBtn.addEventListener('click', () => {
        this.useSpecialAbility(specialAbility);
      });
      
      // Disable button if no uses left
      if (specialAbility.remaining_uses <= 0) {
        useAbilityBtn.disabled = true;
      }
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
        } else {
          UiUtils.showFloatingText('No active question', 'warning');
          // Return the use since it wasn't applicable
          specialAbility.remaining_uses++;
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
  
  // Animation frames - kept for backward compatibility
  animationFrames: {
    // Physicist frames
    physicist: [
      // Frame 1: Regular pose
      `   .---.
  [o--o]
 /|_⚛_|\\
  |/__\\|
  // \\\\`,
      // Frame 2: Slight arm movement
      `   .---.
  [o--o]
 /|_⚛~|\\
  |/__\\|
  // \\\\`,
      // Frame 3: More arm movement
      `   .---.
  [o--o]
 /|~⚛_|\\
  |/__\\|
  // \\\\`,
    ],
    
    // Resident frames
    resident: [
      // Frame 1: Regular pose
      `    ,+,
   (o.o)
  /|\\Y/|\\
   || ||
  /|| ||\\
    ==`,
      // Frame 2: Slight movement
      `    ,+,
   (o.o)
  /|\\Y/|\\
   || ||
  /|/ \\|\\
    ==`,
      // Frame 3: More movement
      `    ,+,
   (o.o)
  /|\\Y/|\\
   || ||
  /|| ||\\
    ==`,
    ],
    
    // QA Specialist frames
    qa_specialist: [
      // Frame 1: Regular pose
      `    ,+,
   [o-o]
  /|\\#/|\\
   |QA|
   // \\\\`,
      // Frame 2: Measurement pose
      `    ,+,
   [o-o]
  /|\\#-|\\
   |QA|
   // \\\\`,
      // Frame 3: Another pose
      `    ,+,
   [o-o]
  /|-#/|\\
   |QA|
   // \\\\`,
    ],
    
    // Debug mode frames
    debug_mode: [
      // Frame 1: Regular pose
      `  $[01]$
 {>_<}
=|▢▣▢|=
 /|¦|\\
 /¦ ¦\\`,
      // Frame 2: Binary change
      `  $[10]$
 {^_^}
=|▣▢▣|=
 /|¦|\\
 /¦ ¦\\`,
      // Frame 3: More circuit changes
      `  $[11]$
 {>_<}
=|▢▢▢|=
 /|¦|\\
 /¦ ¦\\`,
    ]
  },

  // Current animation frame and timer - keeping these for compatibility
  currentAnimationFrame: 0,
  animationTimer: null,

  // Start the animation for pixel character 
  startCharacterAnimation: function() {
    // Clear any existing animation
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
    
    // Apply bobbing animation to character image
    const characterImg = document.querySelector('.character-panel-img');
    if (characterImg) {
      characterImg.classList.add('pixel-bobbing');
    }
    
    // In the future, you could implement sprite-based animation here
    // by cycling through different images
  },

  // This is kept empty for compatibility with any code that might call it
  updateCharacterAnimation: function() {
    // No longer needed for static pixel images
    // But kept for backward compatibility
  },

  // This is kept for backward compatibility
  styleAnimationFrame: function(frame, characterName) {
    // Add color based on character type
    let color = '#5b8dd9'; // Default blue for resident
    
    if (characterName.includes('Physicist')) {
      color = '#56b886'; // Green for physicist
    } else if (characterName.includes('QA')) {
      color = '#f0c866'; // Yellow for QA specialist
    } else if (characterName.includes('Regulatory')) {
      color = '#e67e73'; // Red for regulatory specialist
    }
    
    // Add color styling to ASCII art
    const coloredArt = frame
      .split('\n')
      .map((line, index) => {
        const shade = Math.min(100, 80 + index * 5);
        return `<span style="color: ${color}; filter: brightness(${shade}%)">${line}</span>`;
      })
      .join('\n');
    
    return coloredArt;
  },
  
  // Initialize inventory system
  initializeInventory: function() {
    InventorySystem.initialize();
  },
  
  // Add item to inventory
  addItemToInventory: function(item) {
    return InventorySystem.addItem(item);
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