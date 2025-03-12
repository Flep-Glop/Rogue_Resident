// inventory_system.js - Manages game inventory

// InventorySystem singleton - handles inventory display and functionality
const InventorySystem = {
  // Max inventory size (can be increased with level)
  maxSize: 5,
  
  // Initialize inventory system
  initialize: function() {
    console.log("Initializing inventory system...");
    
    // Subscribe to inventory events
    EventSystem.on(GAME_EVENTS.ITEM_ADDED, this.addItem.bind(this));
    EventSystem.on(GAME_EVENTS.ITEM_USED, this.useItem.bind(this));
    EventSystem.on(GAME_EVENTS.ITEM_REMOVED, this.removeItem.bind(this));
    
    // Calculate initial max size based on character level
    if (GameState.data.character) {
      this.maxSize = 4 + Math.floor(GameState.data.character.level / 2);
    }
    
    // Render initial inventory
    this.renderInventory();
    
    return this;
  },
  
  // Render inventory items
  renderInventory: function() {
    const inventoryContainer = document.getElementById('inventory-items');
    if (!inventoryContainer) return;
    
    // Clear current inventory display
    inventoryContainer.innerHTML = '';
    
    // Update inventory count
    const inventoryCount = document.getElementById('inventory-count');
    if (inventoryCount) {
      inventoryCount.textContent = `${GameState.data.inventory.length}/${this.maxSize}`;
    }
    
    // If inventory is empty, show a message
    if (!GameState.data.inventory || GameState.data.inventory.length === 0) {
      inventoryContainer.innerHTML = '<div class="empty-inventory">No items yet</div>';
      return;
    }
    
    // Create grid layout for items
    const inventoryGrid = document.createElement('div');
    inventoryGrid.className = 'inventory-grid';
    
    // Create item elements
    GameState.data.inventory.forEach((item, index) => {
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
      itemElement.addEventListener('click', () => this.useItemByIndex(index));
      
      // Add to grid
      inventoryGrid.appendChild(itemElement);
    });
    
    // Add empty slots to complete the grid
    for (let i = GameState.data.inventory.length; i < this.maxSize; i++) {
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
  
  // Add an item to inventory (called from event)
  addItem: function(item) {
    console.log("Adding item to inventory:", item);
    
    // Check if inventory is full
    if (GameState.data.inventory.length >= this.maxSize) {
      this.showInventoryFullDialog(item);
      return false;
    }
    
    // Add the item
    GameState.data.inventory.push(item);
    
    // Show feedback
    UiUtils.showFloatingText(`Added ${item.name} to inventory!`, 'success');
    
    // Update inventory display
    this.renderInventory();
    
    // Save inventory to server
    this.saveInventory();
    
    // Emit item added success event
    EventSystem.emit(GAME_EVENTS.ITEM_ADDED_SUCCESS, item);
    
    return true;
  },
  
  // Use an item at a specific index
  useItemByIndex: function(index) {
    if (index < 0 || index >= GameState.data.inventory.length) return;
    
    const item = GameState.data.inventory[index];
    console.log(`Using item at index ${index}:`, item);
    
    // Try to use the item
    if (this.useItem(item)) {
      // Remove from inventory if successfully used
      this.removeItem(index);
    }
  },
  
  // Use an item (apply its effect)
  useItem: function(item) {
    if (!item || !item.effect) return false;
    
    console.log("Using item:", item);
    
    const effect = item.effect;
    let success = true;
    
    switch (effect.type) {
      case 'insight_boost':
        GameState.data.character.insight += parseInt(effect.value);
        EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
        UiUtils.showFloatingText(`+${effect.value} Insight`, 'success');
        break;
        
      case 'restore_life':
        // Only use if not at full health
        if (GameState.data.character.lives < GameState.data.character.max_lives) {
          GameState.data.character.lives = Math.min(
            GameState.data.character.lives + parseInt(effect.value),
            GameState.data.character.max_lives
          );
          EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
          UiUtils.showFloatingText(`+${effect.value} Life`, 'success');
        } else {
          UiUtils.showFloatingText("Already at full health!", 'warning');
          success = false;
        }
        break;
        
      case 'question_hint':
        // Apply hint to current question
        if (typeof NodeInteraction !== 'undefined' && 
            NodeInteraction.currentQuestion && 
            GameState.data.currentNode) {
          // Apply hint logic would go here
          UiUtils.showFloatingText("Applied hint to current question", 'success');
        } else {
          UiUtils.showFloatingText("No active question to apply hint to", 'warning');
          success = false;
        }
        break;
        
      case 'extra_life':
        // Increase max lives
        GameState.data.character.max_lives += 1;
        GameState.data.character.lives += 1;
        EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
        UiUtils.showFloatingText("Increased maximum lives by 1", 'success');
        break;
        
      default:
        UiUtils.showFloatingText("Unknown effect type", 'warning');
        success = false;
    }
    
    // Save game state if possible
    if (success && typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
      ApiClient.saveGame().catch(err => console.error("Failed to save after using item:", err));
    }
    
    // Emit event if successful
    if (success) {
      EventSystem.emit(GAME_EVENTS.ITEM_USED, item);
    }
    
    return success;
  },
  
  // Remove an item from inventory
  removeItem: function(index) {
    if (typeof index === 'object') {
      // If passed an item instead of index, find its index
      const itemObj = index;
      index = GameState.data.inventory.findIndex(item => 
        item.id === itemObj.id && item.name === itemObj.name
      );
    }
    
    if (index < 0 || index >= GameState.data.inventory.length) return;
    
    // Remove the item
    const removedItem = GameState.data.inventory.splice(index, 1)[0];
    
    // Update inventory display
    this.renderInventory();
    
    // Save inventory to server
    this.saveInventory();
    
    // Emit item removed event
    EventSystem.emit(GAME_EVENTS.ITEM_REMOVED, removedItem);
  },
  
  // Show dialog for full inventory
  showInventoryFullDialog: function(newItem) {
    // Create a modal dialog for inventory management
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
    GameState.data.inventory.forEach((item, index) => {
      const itemBtn = document.createElement('button');
      itemBtn.className = 'btn btn-outline-primary mb-2 w-100 text-start';
      itemBtn.innerHTML = `
        <strong>${item.name}</strong> (${item.rarity || 'common'}) 
        <br><small>${this.getEffectDescription(item.effect)}</small>
      `;
      
      // Add click event to replace this item
      itemBtn.addEventListener('click', () => {
        this.removeItem(index);
        this.addItem(newItem);
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
  
  // Save inventory to server
  saveInventory: function() {
    if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
      ApiClient.saveGame().catch(err => console.error("Failed to save inventory:", err));
    }
  }
};

// Export globally
window.InventorySystem = InventorySystem;