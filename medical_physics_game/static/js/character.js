// character.js - Character management

window.Character = {
    // Initialize inventory in game state
    initializeInventory: function() {
      if (!gameState.inventory) {
        gameState.inventory = [];
      }
      
      // Create max inventory size based on character level
      gameState.maxInventorySize = 4 + Math.floor(gameState.character?.level / 2) || 5;
      
      // Render the inventory
      this.renderInventory();
    },
    
    // Render inventory items in the UI with improved styling
    renderInventory: function() {
      const inventoryContainer = document.getElementById('inventory-items');
      if (!inventoryContainer) return;
      
      // Clear current inventory display
      inventoryContainer.innerHTML = '';
      
      // Update inventory count
      const inventoryCount = document.getElementById('inventory-count');
      if (inventoryCount) {
          inventoryCount.textContent = `${gameState.inventory?.length || 0}/${gameState.maxInventorySize || 5}`;
      }
      
      // If inventory is empty, show a message
      if (!gameState.inventory || gameState.inventory.length === 0) {
          inventoryContainer.innerHTML = '<div class="empty-inventory">No items yet</div>';
          return;
      }
      
      // Create grid layout for items
      const inventoryGrid = document.createElement('div');
      inventoryGrid.className = 'inventory-grid';
      
      // Create item elements with improved styling
      gameState.inventory.forEach((item, index) => {
          const itemElement = document.createElement('div');
          itemElement.className = `inventory-item ${item.rarity || 'common'}`;
          itemElement.setAttribute('data-index', index);
          
          // Item icon based on type
          const itemIcon = this.getItemIcon(item);
          
          // Create inner content with icon and border
          itemElement.innerHTML = `
              <div class="item-inner">
                  <div class="item-icon">${itemIcon}</div>
                  <div class="item-glow"></div>
              </div>
          `;
          
          // Add tooltip with item details
          const tooltip = document.createElement('div');
          tooltip.className = 'item-tooltip';
          tooltip.innerHTML = `
              <div class="tooltip-header ${item.rarity || 'common'}">
                  <div class="tooltip-title">${item.name}</div>
                  <div class="tooltip-rarity">${item.rarity || 'common'}</div>
              </div>
              <div class="tooltip-body">
                  <div class="tooltip-desc">${item.description}</div>
                  <div class="tooltip-effect">${this.getEffectDescription(item.effect)}</div>
                  <div class="tooltip-usage">Click to use</div>
              </div>
          `;
          
          itemElement.appendChild(tooltip);
          
          // Add pixel border effect
          this.addPixelBorder(itemElement, item.rarity);
          
          // Add click event to use the item
          itemElement.addEventListener('click', () => this.useInventoryItem(index));
          
          // Add to grid
          inventoryGrid.appendChild(itemElement);
      });
      
      // Add empty slots to complete the grid
      for (let i = gameState.inventory.length; i < gameState.maxInventorySize; i++) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'inventory-item empty';
          emptySlot.innerHTML = '<div class="item-inner"></div>';
          
          // Add pixel border effect for empty slots
          this.addPixelBorder(emptySlot, 'empty');
          
          inventoryGrid.appendChild(emptySlot);
      }
      
      inventoryContainer.appendChild(inventoryGrid);
    },

    // Add pixelated border effect to inventory items
    addPixelBorder: function(element, rarity) {
      const borderElement = document.createElement('div');
      borderElement.className = `pixel-border ${rarity || 'common'}`;
      
      // Create pixelated corners
      ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(corner => {
          const cornerElement = document.createElement('div');
          cornerElement.className = `pixel-corner ${corner}`;
          borderElement.appendChild(cornerElement);
      });
      
      element.appendChild(borderElement);
    },

    // Get a themed icon for an item based on its type
    getItemIcon: function(item) {
      if (!item) return '?';
      
      const itemIcons = {
          'textbook': '📚',
          'coffee': '☕',
          'energy_drink': '🧃',
          'dosimeter': '📊',
          'cheat_sheet': '📝',
          'tg51': '📋',
          'reference_manual': '📔',
          'emergency_protocol': '🚨',
          'badge': '🔰',
          'farmer_chamber': '🔋',
          'lead_apron': '🛡️'
      };
      
      // Classify by effect type if no specific icon
      if (!itemIcons[item.id]) {
          switch (item.effect?.type) {
              case 'insight_boost': return '💡';
              case 'restore_life': return '❤️';
              case 'question_hint': return '❓';
              case 'category_boost': return '📈';
              case 'extra_life': return '💖';
              case 'defense': return '🛡️';
              case 'special': return '✨';
              default: return '🔮';
          }
      }
      
      return itemIcons[item.id];
    },
    
    // Convert effect object to readable description
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
    },
    
    // Add an item to inventory
    addItemToInventory: function(item) {
      if (!gameState.inventory) {
        gameState.inventory = [];
      }
      
      // Check if inventory is full
      if (gameState.inventory.length >= gameState.maxInventorySize) {
        this.showInventoryFullDialog(item);
        return false;
      }
      
      // Add the item
      gameState.inventory.push(item);
      
      // Show feedback
      UiUtils.showFloatingText(`Added ${item.name} to inventory!`, 'success');
      
      // Update inventory display
      this.renderInventory();

      // Save inventory to server
      this.saveInventory();

      return true;
    },
    
    // Show dialog for full inventory
    showInventoryFullDialog: function(newItem) {
      // Create a modal dialog
      const dialogHTML = `
        <div id="inventory-full-modal" class="game-modal" style="display:flex;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Inventory Full!</h3>
              <button class="close-modal" id="close-inv-modal">&times;</button>
            </div>
            <div class="modal-body">
              <p>Your inventory is full. Would you like to discard an item to make room for ${newItem.name}?</p>
              <div id="current-items-list" class="mt-3"></div>
              <div class="mt-3">
                <button id="cancel-new-item" class="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add to DOM
      document.body.insertAdjacentHTML('beforeend', dialogHTML);
      
      // Display current inventory items
      const itemsList = document.getElementById('current-items-list');
      gameState.inventory.forEach((item, index) => {
        const itemBtn = document.createElement('button');
        itemBtn.className = 'btn btn-outline-primary mb-2 w-100 text-start';
        itemBtn.innerHTML = `
          <strong>${item.name}</strong> (${item.rarity || 'common'}) 
          <br><small>${Character.getEffectDescription(item.effect)}</small>
        `;
        
        // Add click event to replace this item
        itemBtn.addEventListener('click', () => {
          gameState.inventory.splice(index, 1);
          this.addItemToInventory(newItem);
          document.getElementById('inventory-full-modal').remove();
        });
        
        itemsList.appendChild(itemBtn);
      });
      
      // Add cancel button event
      document.getElementById('cancel-new-item').addEventListener('click', () => {
        document.getElementById('inventory-full-modal').remove();
      });
      
      // Add close button event
      document.getElementById('close-inv-modal').addEventListener('click', () => {
        document.getElementById('inventory-full-modal').remove();
      });
    },
    
    // Use an item from inventory
    useInventoryItem: function(index) {
      if (!gameState.inventory || !gameState.inventory[index]) return;
      
      const item = gameState.inventory[index];
      
      // Apply item effect
      const effectApplied = this.applyItemEffect(item);
      
      // If effect was applied successfully, remove from inventory
      if (effectApplied) {
        gameState.inventory.splice(index, 1);
        this.renderInventory();
      }
    },
    
    // Complete the applyItemEffect function in Character.js
    applyItemEffect: function(item) {
      if (!item || !item.effect) return false;
      
      const effect = item.effect;
      let message = '';
      let success = true;
      
      switch (effect.type) {
          case 'insight_boost':
              gameState.character.insight += parseInt(effect.value);
              message = `+${effect.value} Insight`;
              break;
              
          case 'restore_life':
              // Only use if not at full health
              if (gameState.character.lives < gameState.character.max_lives) {
                  gameState.character.lives = Math.min(
                      gameState.character.lives + parseInt(effect.value),
                      gameState.character.max_lives
                  );
                  message = `+${effect.value} Life`;
              } else {
                  message = "Already at full health!";
                  success = false;
              }
              break;
              
          case 'question_hint':
              // Apply hint to current question if there is one
              if (typeof Nodes !== 'undefined' && typeof Nodes.applyQuestionHint === 'function') {
                  const applied = Nodes.applyQuestionHint();
                  if (applied) {
                      message = "Eliminated one wrong answer";
                  } else {
                      message = "No active question to apply hint to";
                      success = false;
                  }
              } else {
                  message = "Cannot apply hint at this time";
                  success = false;
              }
              break;
              
          case 'category_boost':
              // Add category boost status effect
              const categoryBoost = {
                  id: `boost_${Date.now()}`,
                  type: 'category_boost',
                  category: effect.value.split(" ")[0].toLowerCase() || 'all',
                  value: effect.value,
                  duration: effect.duration || 'permanent'
              };
              
              if (!gameState.statusEffects) {
                  gameState.statusEffects = [];
              }
              
              gameState.statusEffects.push(categoryBoost);
              message = `Added ${effect.value}`;
              break;
              
          case 'extra_life':
              // Increase max lives
              gameState.character.max_lives += 1;
              gameState.character.lives += 1;
              message = "Increased maximum lives by 1";
              break;
              
          default:
              message = "Unknown effect type";
              success = false;
      }
      
      // Update character display if successful
      if (success) {
          this.updateCharacterInfo(gameState.character);
          
          // Show feedback
          UiUtils.showFloatingText(message, success ? 'success' : 'warning');
      } else {
          UiUtils.showFloatingText(message, 'warning');
      }
      
      // Save game state if possible
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
          ApiClient.saveGame().catch(err => console.error("Failed to save game after using item:", err));
      }
      
      return success;
    },

    saveInventory: function() {
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
        ApiClient.saveGame().catch(err => console.error("Failed to save inventory:", err));
      }
    },

    // Update the character display to be larger and centered
    updateCharacterInfo: function(character) {
      if (!character) return;
      
      // Get character data including ASCII art
      this.getCharacterData(character.name).then(characterData => {
          // Create HTML for character display
          const asciiArt = characterData?.ascii_art || this.getDefaultAsciiArt();
          
          // Create styled ASCII art
          const styledAsciiArt = this.styleAsciiArt(asciiArt, character.name);
          
          const charInfoHtml = `
              <div class="character-avatar-container">
                  <div class="character-avatar">
                      <pre class="ascii-character bobbing">${styledAsciiArt}</pre>
                  </div>
              </div>
              <div class="character-details">
                  <p><strong>${character.name}</strong></p>
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
          }
          
          // Update lives visualization
          this.updateLivesDisplay(character.lives, character.max_lives);
          
          // Update special ability if exists
          if (character.special_ability) {
              this.updateSpecialAbility(character.special_ability);
          }
      });
    },

    // Get character data from the server or use cached data
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

    // Get default ASCII art for when character data is not available
    getDefaultAsciiArt: function() {
      return `  O
    /|\\
    / \\`;
    },

    // Style ASCII art based on character type
    styleAsciiArt: function(asciiArt, characterName) {
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
      const coloredArt = asciiArt
          .split('\n')
          .map((line, index) => {
              // Add slight color variation for each line for a more dynamic look
              const shade = Math.min(100, 80 + index * 5);
              return `<span style="color: ${color}; filter: brightness(${shade}%)">${line}</span>`;
          })
          .join('\n');
      
      return coloredArt;
    },

    // Update special ability display with a simpler button and hover info
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
        
        // Update the ability display with a simplified button and tooltip
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
      
      // Handle ability based on type
      switch (specialAbility.name) {
          case 'Literature Review':
              // Skip question node implementation
              UiUtils.showFloatingText('Skipped node without penalty', 'success');
              // Mark current node as visited and return to map
              if (gameState.currentNode) {
                  Nodes.markNodeVisited(gameState.currentNode);
                  Nodes.showContainer(CONTAINER_TYPES.MAP);
              }
              break;
              
          case 'Peer Review':
              // Reveal correct answer implementation
              if (gameState.currentQuestion) {
                  Nodes.applyQuestionHint();
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
      const useAbilityBtn = document.getElementById('use-ability-btn');
      if (useAbilityBtn) {
          useAbilityBtn.textContent = `Use Ability (${specialAbility.remaining_uses}/${specialAbility.uses_per_floor || 1})`;
          if (specialAbility.remaining_uses <= 0) {
              useAbilityBtn.disabled = true;
              useAbilityBtn.textContent = 'No uses remaining';
          }
      }
      
      // Update character info to save the remaining uses
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
          ApiClient.saveGame().catch(err => console.error("Failed to save game after using ability:", err));
      }
    },
    
    // Update lives display
    updateLivesDisplay: function(lives, maxLives) {
      const livesContainer = document.getElementById('lives-container');
      if (!livesContainer) return;
      
      livesContainer.innerHTML = '';
      for (let i = 0; i < maxLives; i++) {
        const lifeIcon = document.createElement('span');
        lifeIcon.className = i < lives ? 'life-icon active' : 'life-icon inactive';
        lifeIcon.innerHTML = i < lives ? '❤️' : '🖤';
        livesContainer.appendChild(lifeIcon);
      }
    },
    
    // Add starting relic based on character
    addStartingRelic: function(characterId) {
      let relic = null;
      
      switch (characterId) {
        case 'resident':
          relic = {
            id: 'coffee_mug',
            name: 'Coffee Mug',
            description: 'A well-worn mug that helps you stay focused.',
            rarity: 'common',
            effect: {
              type: 'restore_life',
              value: 1,
              duration: 'instant'
            }
          };
          break;
          
        // Other character starting relics...
      }
      
      if (relic) {
        this.addItemToInventory(relic);
      }
    },

    // Add this function to the Character object
    saveInventory: function() {
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
        ApiClient.saveGame().catch(err => console.error("Failed to save inventory:", err));
      }
    },

    // Improved showCharacterSelection function in Character.js
    showCharacterSelection: function() {
      console.log("Showing character selection");
      
      // First check if modal already exists
      if (document.getElementById('character-select-modal')) {
          console.warn("Character selection modal already exists");
          return;
      }
      
      // Create character selection modal
      const charSelectHTML = `
          <div id="character-select-modal" class="game-modal" style="display:flex;">
              <div class="modal-content">
                  <div class="modal-header">
                      <h3>Select Your Character</h3>
                      <button class="close-modal" id="close-char-select">&times;</button>
                  </div>
                  <div class="modal-body">
                      <div id="char-select-container">Loading characters...</div>
                      <div class="mt-3">
                          <button id="start-with-char" class="btn btn-success" disabled>Begin Residency</button>
                          <button id="cancel-char-select" class="btn btn-secondary">Cancel</button>
                      </div>
                  </div>
              </div>
          </div>
      `;
      
      // Add to DOM
      document.body.insertAdjacentHTML('beforeend', charSelectHTML);
      
      // Load characters from API
      fetch('/api/characters')
          .then(response => {
              if (!response.ok) {
                  throw new Error(`Server responded with status: ${response.status}`);
              }
              return response.json();
          })
          .then(data => {
              if (!data.characters || !Array.isArray(data.characters) || data.characters.length === 0) {
                  throw new Error("No characters found");
              }
              
              const container = document.getElementById('char-select-container');
              if (!container) {
                  throw new Error("Character selection container not found");
              }
              
              container.innerHTML = '';
              
              let selectedChar = null;
              
              // Create character cards
              data.characters.forEach(character => {
                  if (!character || !character.id || !character.name) return;
                  
                  const charCard = document.createElement('div');
                  charCard.className = 'card mb-3';
                  charCard.dataset.characterId = character.id;
                  
                  // Build character card HTML with safety checks
                  const startingStats = character.starting_stats || {};
                  const specialAbility = character.special_ability || {};
                  
                  charCard.innerHTML = `
                      <div class="card-header">
                          <h4>${character.name}</h4>
                      </div>
                      <div class="card-body">
                          <p>${character.description || ""}</p>
                          <p><strong>Starting Stats:</strong></p>
                          <ul>
                              <li>Level: ${startingStats.level || 1}</li>
                              <li>Lives: ${startingStats.lives || 3}</li>
                              <li>Insight: ${startingStats.insight || 0}</li>
                          </ul>
                          <p><strong>${specialAbility.name || 'Special Ability'}:</strong> ${specialAbility.description || 'None'}</p>
                      </div>
                  `;
                  
                  // Add selection behavior
                  charCard.addEventListener('click', function() {
                      // Remove selected class from all cards
                      document.querySelectorAll('#char-select-container .card').forEach(c => {
                          c.classList.remove('border-primary', 'bg-light');
                      });
                      
                      // Add selected class to this card
                      this.classList.add('border-primary', 'bg-light');
                      
                      // Save selected character
                      selectedChar = character.id;
                      
                      // Enable start button
                      const startBtn = document.getElementById('start-with-char');
                      if (startBtn) startBtn.disabled = false;
                  });
                  
                  container.appendChild(charCard);
              });
              
              // Select first character by default
              if (data.characters.length > 0) {
                  const firstCard = container.querySelector('.card');
                  if (firstCard) {
                      firstCard.click();
                  }
              }
              
              // Add event listeners for buttons
              const startBtn = document.getElementById('start-with-char');
              if (startBtn) {
                  startBtn.addEventListener('click', function() {
                      if (!selectedChar) {
                          UiUtils.showFloatingText("Please select a character", "warning");
                          return;
                      }
                      
                      // Disable button to prevent multiple clicks
                      this.disabled = true;
                      this.textContent = 'Starting...';
                      
                      // Start new game with selected character
                      ApiClient.startNewGame(selectedChar)
                          .then(() => {
                              console.log("New game started successfully with character:", selectedChar);
                              
                              // Remove modal
                              const modal = document.getElementById('character-select-modal');
                              if (modal) modal.remove();
                              
                              // Reload page to start game
                              window.location.href = '/game';
                          })
                          .catch(error => {
                              console.error('Error starting new game:', error);
                              UiUtils.showFloatingText('Failed to start new game', 'danger');
                              
                              // Re-enable button
                              this.disabled = false;
                              this.textContent = 'Begin Residency';
                          });
                  });
              }
              
              // Add cancel and close button listeners
              ['cancel-char-select', 'close-char-select'].forEach(id => {
                  const btn = document.getElementById(id);
                  if (btn) {
                      btn.addEventListener('click', function() {
                          const modal = document.getElementById('character-select-modal');
                          if (modal) modal.remove();
                      });
                  }
              });
          })
          .catch(error => {
              console.error('Error loading characters:', error);
              const container = document.getElementById('char-select-container');
              if (container) {
                  container.innerHTML = `
                      <div class="alert alert-danger">
                          Failed to load characters: ${error.message}
                          <button class="btn btn-primary mt-2" onclick="window.location.reload()">Retry</button>
                      </div>
                  `;
              }
          });
    },
    
    // ASCII character animation
    addCharacterAnimation: function() {
      // Implementation for character animation
      // ...
    }
  };