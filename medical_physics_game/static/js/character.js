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
      // Implementation of inventory full dialog
      // ...
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
      // Implementation for character selection screen
      // ...
    },
    
    // ASCII character animation
    addCharacterAnimation: function() {
      // Implementation for character animation
      // ...
    }
  };