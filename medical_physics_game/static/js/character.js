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
    
    // Render inventory items in the UI
    renderInventory: function() {
      const inventoryContainer = document.getElementById('inventory-items');
      if (!inventoryContainer) return;
      
      // Clear current inventory display
      inventoryContainer.innerHTML = '';
      
      // Update inventory count
      const inventoryCount = document.getElementById('inventory-count');
      if (inventoryCount) {
        inventoryCount.textContent = `${gameState.inventory.length}/${gameState.maxInventorySize}`;
      }
      
      // If inventory is empty, show a message
      if (!gameState.inventory || gameState.inventory.length === 0) {
        inventoryContainer.innerHTML = '<p class="text-muted">No items yet</p>';
        return;
      }
      
      // Create item elements
      gameState.inventory.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item ${item.rarity || 'common'}`;
        itemElement.setAttribute('data-index', index);
        
        // Item icon based on type
        const itemIcon = this.getItemIcon(item);
        itemElement.innerHTML = itemIcon;
        
        // Add tooltip with item details
        const tooltip = document.createElement('div');
        tooltip.className = 'inventory-tooltip';
        tooltip.innerHTML = `
          <div class="tooltip-title">${item.name}</div>
          <div class="tooltip-desc">${item.description}</div>
          <div class="tooltip-effect">${this.getEffectDescription(item.effect)}</div>
          <div class="tooltip-usage">Click to use</div>
        `;
        
        itemElement.appendChild(tooltip);
        
        // Add click event to use the item
        itemElement.addEventListener('click', () => this.useInventoryItem(index));
        
        inventoryContainer.appendChild(itemElement);
      });
    },
    
    // Get an appropriate icon for an item based on its type
    getItemIcon: function(item) {
      if (!item) return '?';
      
      const itemIcons = {
        'textbook': '📚',
        'coffee': '☕',
        'dosimeter': '📊',
        'tg51': '📋',
        'badge': '🔰',
        // Other item icons...
      };
      
      // Classify by effect type if no specific icon
      if (!itemIcons[item.id]) {
        switch (item.effect?.type) {
          case 'insight_boost': return '💡';
          case 'restore_life': return '❤️';
          case 'question_hint': return '❓';
          case 'category_boost': return '📈';
          case 'extra_life': return '💖';
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
    
    // Apply an item effect
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
          
        // Handle other effect types...
      }
      
      // Update character display if successful
      if (success) {
        this.updateCharacterInfo(gameState.character);
        
        // Show feedback
        UiUtils.showFloatingText(message, success ? 'success' : 'warning');
      } else {
        UiUtils.showFloatingText(message, 'warning');
      }
      
      return success;
    },
    
    // Update character info display
    updateCharacterInfo: function(character) {
      if (!character) return;
      
      const charInfoHtml = `
        <p><strong>Name:</strong> ${character.name}</p>
        <p><strong>Level:</strong> ${character.level}</p>
        <p><strong>Insight:</strong> ${character.insight}</p>
      `;
      
      const charInfoElement = document.getElementById('character-info');
      if (charInfoElement) {
        charInfoElement.innerHTML = charInfoHtml;
      }
      
      // Update lives visualization
      this.updateLivesDisplay(character.lives, character.max_lives);
      
      // Update special ability if available
      this.updateSpecialAbility(character.special_ability);
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
    
    // Update special ability display
    updateSpecialAbility: function(specialAbility) {
      // Implementation for special ability display
      // ...
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
    
    // Show character selection screen
    showCharacterSelection: function() {
      console.log("Showing character selection");
      
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
        .then(response => response.json())
        .then(data => {
          const container = document.getElementById('char-select-container');
          container.innerHTML = '';
          
          let selectedChar = null;
          
          // Create character cards
          data.characters.forEach(character => {
            const charCard = document.createElement('div');
            charCard.className = 'card mb-3';
            charCard.innerHTML = `
              <div class="card-header">
                <h4>${character.name}</h4>
              </div>
              <div class="card-body">
                <p>${character.description || ""}</p>
                <p><strong>Starting Stats:</strong></p>
                <ul>
                  <li>Level: ${character.starting_stats.level}</li>
                  <li>Lives: ${character.starting_stats.lives}</li>
                  <li>Insight: ${character.starting_stats.insight}</li>
                </ul>
                <p><strong>${character.special_ability.name}:</strong> ${character.special_ability.description}</p>
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
              document.getElementById('start-with-char').disabled = false;
            });
            
            container.appendChild(charCard);
          });
          
          // Add event listeners for buttons
          document.getElementById('start-with-char').addEventListener('click', function() {
            if (selectedChar) {
              // Start new game with selected character
              ApiClient.startNewGame(selectedChar)
                .then(() => {
                  // Remove modal
                  document.getElementById('character-select-modal').remove();
                  
                  // Reload page to start game
                  window.location.reload();
                })
                .catch(error => {
                  console.error('Error starting new game:', error);
                  alert('Failed to start new game. Please try again.');
                });
            }
          });
          
          document.getElementById('cancel-char-select').addEventListener('click', function() {
            document.getElementById('character-select-modal').remove();
          });
          
          document.getElementById('close-char-select').addEventListener('click', function() {
            document.getElementById('character-select-modal').remove();
          });
        })
        .catch(error => {
          console.error('Error loading characters:', error);
          const container = document.getElementById('char-select-container');
          container.innerHTML = '<div class="alert alert-danger">Failed to load characters. Please try again.</div>';
        });
    },
    
    // ASCII character animation
    addCharacterAnimation: function() {
      // Implementation for character animation
      // ...
    }
  };