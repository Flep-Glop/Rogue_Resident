// inventory_system.js - Enhanced inventory management with consistent item/relic display

// InventorySystem singleton - handles inventory display and functionality
const InventorySystem = {
  // Max inventory size (can be increased with level)
  maxSize: 5,
  
  // Track which items have been added to prevent duplicates
  addedItems: new Set(),
  
  // Initialize inventory system
  initialize: function() {
    console.log("Initializing inventory system...");
    // Find the inventory container in the DOM
    this.container = document.getElementById('inventory-container');

    // Check if the container exists
    if (!this.container) {
      console.error("Inventory container not found. Inventory system initialization failed.");
      
      // Try to find a fallback container
      const sidePanel = document.querySelector('.col-md-3');
      if (sidePanel) {
        // Create an inventory container if it doesn't exist
        console.log("Creating inventory container as fallback...");
        this.container = document.createElement('div');
        this.container.id = 'inventory-container';
        this.container.className = 'inventory-container';
        sidePanel.appendChild(this.container);
      } else {
        // If no sidebar found, we can't initialize
        console.error("Failed to create inventory container - no sidebar found");
        return this; // Return early but don't break the chain
      }
    }
    // Subscribe to inventory events
    if (window.EventSystem) {
      EventSystem.on(GAME_EVENTS.ITEM_ADDED, this.addItem.bind(this));
      EventSystem.on(GAME_EVENTS.ITEM_USED, this.useItem.bind(this));
      EventSystem.on(GAME_EVENTS.ITEM_REMOVED, this.removeItem.bind(this));
    } else {
      console.warn("EventSystem not available for inventory event subscription");
    }
    
    // Calculate initial max size based on character level
    if (window.GameState && GameState.data && GameState.data.character) {
      this.maxSize = 4 + Math.floor(GameState.data.character.level / 2);
    }
    
    // Render initial inventory
    this.renderInventory();
    
    return this;
  },
  
  // Render different sections for items and relics
  renderInventory: function() {
    // Clear the container
    this.container.innerHTML = '';
    
    // Create tabs
    const tabsHtml = `
      <div class="inventory-tabs">
        <button id="items-tab" class="inventory-tab active">Items</button>
        <button id="relics-tab" class="inventory-tab">Relics</button>
      </div>
      <div id="items-container" class="inventory-section"></div>
      <div id="relics-container" class="inventory-section" style="display:none;"></div>
    `;
    
    this.container.innerHTML = tabsHtml;
    
    // Add tab event listeners
    document.getElementById('items-tab').addEventListener('click', () => {
      document.getElementById('items-tab').classList.add('active');
      document.getElementById('relics-tab').classList.remove('active');
      document.getElementById('items-container').style.display = 'block';
      document.getElementById('relics-container').style.display = 'none';
    });
    
    document.getElementById('relics-tab').addEventListener('click', () => {
      document.getElementById('items-tab').classList.remove('active');
      document.getElementById('relics-tab').classList.add('active');
      document.getElementById('items-container').style.display = 'none';
      document.getElementById('relics-container').style.display = 'block';
    });
    
    // Render sections
    this.renderItems();
    this.renderRelics();
    
    // Update inventory count
    this.updateInventoryCount();
  },
  
  // Update inventory count display
  updateInventoryCount: function() {
    const countElement = document.getElementById('inventory-count');
    if (countElement && window.GameState && GameState.data) {
      const itemCount = GameState.data.inventory ? GameState.data.inventory.filter(
        item => item.itemType === 'consumable' || !item.itemType
      ).length : 0;
      
      countElement.textContent = `${itemCount}/${this.maxSize}`;
    }
  },
  
  // Render consumable items
  renderItems: function() {
    const itemsContainer = document.getElementById('items-container');
    if (!itemsContainer) return;
    
    // Filter inventory to only show consumable items
    const items = window.GameState && GameState.data && GameState.data.inventory ? 
      GameState.data.inventory.filter(item => 
        item.itemType === 'consumable' || !item.itemType) : [];
    
    if (items.length === 0) {
      itemsContainer.innerHTML = '<div class="empty-inventory">No consumable items</div>';
      return;
    }
    
    // Create title and grid
    const gridHtml = `
      <div class="inventory-title">
        <h3>Items</h3>
        <span id="inventory-count">${items.length}/${this.maxSize}</span>
      </div>
      <div class="inventory-grid"></div>
    `;
    itemsContainer.innerHTML = gridHtml;
    
    const grid = itemsContainer.querySelector('.inventory-grid');
    
    // Add each item
    items.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = `inventory-item ${item.rarity || 'common'}`;
      itemElement.dataset.index = index;
      
      itemElement.innerHTML = `
        <div class="item-inner">
          <div class="item-icon">${this.getItemIcon(item)}</div>
          <div class="item-glow"></div>
        </div>
        <div class="pixel-border ${item.rarity || 'common'}">
          <div class="pixel-corner top-left"></div>
          <div class="pixel-corner top-right"></div>
          <div class="pixel-corner bottom-left"></div>
          <div class="pixel-corner bottom-right"></div>
        </div>
        <div class="item-tooltip">
          <div class="tooltip-header ${item.rarity || 'common'}">
            <span class="tooltip-title">${item.name}</span>
            <span class="tooltip-rarity">${item.rarity || 'common'}</span>
          </div>
          <div class="tooltip-body">
            <p class="tooltip-desc">${item.description}</p>
            <div class="tooltip-effect">${item.effect?.value || 'No effect'}</div>
            <div class="tooltip-usage">Click to use</div>
          </div>
        </div>
      `;
      
      // Add click handler directly to the item element
      itemElement.addEventListener('click', (e) => {
        // Prevent default behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Use the item directly when clicked
        this.useItem(item.id || item);
      });
      
      grid.appendChild(itemElement);
    });
  },

  // Render relics - now matches items display style
  renderRelics: function() {
    const relicsContainer = document.getElementById('relics-container');
    if (!relicsContainer) return;
    
    // Filter inventory to only show relics
    const relics = window.GameState && GameState.data && GameState.data.inventory ? 
      GameState.data.inventory.filter(item => 
      item.itemType === 'relic') : [];
    
    if (relics.length === 0) {
      relicsContainer.innerHTML = '<div class="empty-inventory">No relics found</div>';
      return;
    }
    
    // Create title and grid - using the same grid class for consistency
    const gridHtml = `
      <div class="inventory-title">
        <h3>Relics</h3>
        <span id="relics-count">${relics.length}</span>
      </div>
      <div class="inventory-grid"></div>
    `;
    relicsContainer.innerHTML = gridHtml;
    
    const grid = relicsContainer.querySelector('.inventory-grid');
    
    // Add each relic using the same format as items
    relics.forEach((relic, index) => {
      const relicElement = document.createElement('div');
      relicElement.className = `inventory-item ${relic.rarity || 'common'}`;
      relicElement.dataset.index = index;
      
      relicElement.innerHTML = `
        <div class="item-inner">
          <div class="item-icon">${this.getItemIcon(relic)}</div>
          <div class="item-glow"></div>
        </div>
        <div class="pixel-border ${relic.rarity || 'common'}">
          <div class="pixel-corner top-left"></div>
          <div class="pixel-corner top-right"></div>
          <div class="pixel-corner bottom-left"></div>
          <div class="pixel-corner bottom-right"></div>
        </div>
        <div class="item-tooltip">
          <div class="tooltip-header ${relic.rarity || 'common'}">
            <span class="tooltip-title">${relic.name}</span>
            <span class="tooltip-rarity">${relic.rarity || 'common'}</span>
          </div>
          <div class="tooltip-body">
            <p class="tooltip-desc">${relic.description}</p>
            <div class="tooltip-effect">
              <span class="passive-text">${relic.passiveText || relic.effect?.value || 'No effect'}</span>
            </div>
          </div>
        </div>
      `;
      
      grid.appendChild(relicElement);
    });
  },

  // Use an item with improved error handling
  useItem: function(itemId) {
    let item;
    
    // Handle both direct item objects and item IDs
    if (typeof itemId === 'object') {
      item = itemId;
      itemId = item.id;
    } else {
      // Find the item by ID in the inventory
      if (window.GameState && GameState.data && GameState.data.inventory) {
        item = GameState.data.inventory.find(i => i.id === itemId);
      }
    }
    
    if (!item) {
      console.error(`Item not found: ${itemId}`);
      return false;
    }
    
    // Use ItemManager if available
    if (typeof window.ItemManager !== 'undefined' && typeof ItemManager.useItem === 'function') {
      const success = ItemManager.useItem(itemId);
      
      if (success) {
        this.renderInventory(); // Refresh the display
        
        // Show visual feedback
        if (window.UiUtils && typeof UiUtils.showFloatingText === 'function') {
          UiUtils.showFloatingText(`Used ${item.name}!`, 'success');
        }
      } else if (window.UiUtils && typeof UiUtils.showToast === 'function') {
        UiUtils.showToast("Cannot use this item", "warning");
      }
      
      return success;
    }
    
    // Fallback implementation if ItemManager doesn't exist
    console.log("ItemManager not available, using fallback item usage");
    const success = this.fallbackUseItem(item);
    
    if (success) {
      this.renderInventory(); // Refresh the display
      
      // Show visual feedback
      if (window.UiUtils && typeof UiUtils.showFloatingText === 'function') {
        UiUtils.showFloatingText(`Used ${item.name}!`, 'success');
      } else {
        console.log(`Used ${item.name}!`);
      }
    } else if (window.UiUtils && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast("Cannot use this item", "warning");
    } else {
      console.log("Cannot use this item");
    }
    
    return success;
  },
  
  // Fixed fallbackUseItem function with proper item removal - replace in inventory_system.js

  // Fallback implementation for using an item when ItemManager is not available
  fallbackUseItem: function(item) {
    console.log("Using fallback item usage for:", item);
    
    if (!item || !item.effect) {
      console.error("Item has no effect");
      return false;
    }
    
    // Don't allow using relics directly
    if (item.itemType === 'relic') {
      console.warn("Cannot use relics directly");
      return false;
    }
    
    // Make sure GameState exists
    if (!window.GameState || !GameState.data) {
      console.error("GameState not available for item usage");
      return false;
    }
    
    const effect = item.effect;
    let effectApplied = false;
    
    // Apply the effect based on its type
    switch (effect.type) {
      case "heal":
        // Heal the player
        if (GameState.data.character) {
          const value = parseInt(effect.value) || 1;
          const newLives = Math.min(
            GameState.data.character.max_lives,
            GameState.data.character.lives + value
          );
          
          GameState.data.character.lives = newLives;
          
          // Emit event for UI update
          if (window.EventSystem) {
            EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, newLives);
          }
          
          effectApplied = true;
        }
        break;
        
      case "insight_gain":
        // Add insight
        if (GameState.data.character) {
          const amount = parseInt(effect.value) || 10;
          GameState.data.character.insight += amount;
          
          // Emit event for UI update
          if (window.EventSystem) {
            EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
          }
          
          effectApplied = true;
        }
        break;
        
      case "eliminateOption":
        // Set flag for question component to use
        if (!GameState.data.questionEffects) {
          GameState.data.questionEffects = {};
        }
        
        GameState.data.questionEffects.eliminateOption = true;
        effectApplied = true;
        break;
        
      default:
        console.log(`Unhandled effect type: ${effect.type}`);
        return false;
    }
    
    // Only proceed with removal if effect was applied
    if (!effectApplied) {
      console.error("Effect could not be applied");
      return false;
    }
    
    // Now that the effect is applied, we need to remove the item from inventory
    // First, find the item in the inventory
    if (!GameState.data.inventory) {
      console.error("Inventory not found in GameState");
      return false;
    }
    
    const itemIndex = GameState.data.inventory.findIndex(invItem => 
      invItem.id === item.id && invItem.name === item.name
    );
    
    if (itemIndex === -1) {
      console.error("Item not found in inventory");
      return false;
    }
    
    // Remove the item from inventory
    GameState.data.inventory.splice(itemIndex, 1);
    console.log(`Removed item at index ${itemIndex} from inventory`);
    
    // Update our tracking to allow adding this item again
    const itemKey = `${item.id}-${item.name}`;
    this.addedItems.delete(itemKey);
    
    // Save game state
    if (window.ApiClient) {
      if (typeof ApiClient.saveInventory === 'function') {
        ApiClient.saveInventory({ inventory: GameState.data.inventory })
          .catch(err => console.error("Failed to save inventory:", err));
      } else if (typeof ApiClient.saveGame === 'function') {
        ApiClient.saveGame()
          .catch(err => console.error("Failed to save game state:", err));
      }
    }
    
    // Emit the item used event
    if (window.EventSystem) {
      EventSystem.emit(GAME_EVENTS.ITEM_USED, item);
    }
    
    return true;
  },
  
  // Get pixel art icon for an item
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      // Handle both paths with and without the /static/ prefix
      const iconPath = item.iconPath.startsWith('/static/') ? 
        item.iconPath : `/static/img/items/${item.iconPath}`;
      
      return `<img src="${iconPath}" alt="${item.name}" class="pixel-item-icon-img">`;
    }
    
    // Fallback: Use item name to determine a default icon
    const itemName = (item.name || '').toLowerCase();
    let iconFile = "Yellow Sticky Note.png";
    
    // Map common item types to default icons
    if (itemName.includes('book') || itemName.includes('manual') || itemName.includes('textbook')) {
      iconFile = "Textbook.png";
    } else if (itemName.includes('potion') || itemName.includes('vial')) {
      iconFile = "Flask.png";
    } else if (itemName.includes('badge') || itemName.includes('dosimeter')) {
      iconFile = "Nametag.png";
    } else if (itemName.includes('glasses') || itemName.includes('spectacles') || itemName.includes('goggles')) {
      iconFile = "3D Glasses.png";
    }
    
    return `<img src="/static/img/items/${iconFile}" alt="${item.name}" class="pixel-item-icon-img">`;
  },
  
  // Get effect description for display
  getEffectDescription: function(effect) {
    if (!effect) return 'No effect';
    
    switch (effect.type) {
      case 'insight_boost': return `+${effect.value}% Insight`;
      case 'restore_life': 
      case 'heal': 
        return `Restore ${effect.value} Life`;
      case 'eliminateOption': 
      case 'question_hint': 
        return effect.value;
      case 'category_boost': return effect.value;
      case 'extra_life': return effect.value;
      case 'second_chance': return "Second chance on questions";
      default: return effect.value || 'Unknown effect';
    }
  },
  
  // Add an item to inventory with improved duplicate prevention
  addItem: function(item) {
    console.log("Adding item to inventory:", item);
    
    // Prevent null items
    if (!item || !item.id) {
      console.error("Attempted to add invalid item to inventory");
      return false;
    }
    
    // Check if GameState is available
    if (!window.GameState || !GameState.data) {
      console.error("GameState not available for inventory operations");
      return false;
    }
    
    // Initialize inventory array if needed
    if (!GameState.data.inventory) {
      GameState.data.inventory = [];
    }
    
    // Check if it's a relic and already exists
    if (item.itemType === 'relic' || item.type === 'relic') {
      const existingRelic = GameState.data.inventory.find(i => i.id === item.id);
      if (existingRelic) {
        console.warn(`Relic ${item.name} (${item.id}) already exists in inventory. Not adding duplicate.`);
        if (window.UiUtils && typeof UiUtils.showToast === 'function') {
          UiUtils.showToast(`You already have the ${item.name} relic.`, "warning");
        }
        return false;
      }
    }
    
    // For consumables, also track using a unique key to prevent duplicates
    if (item.itemType === 'consumable' || item.type === 'consumable' || (!item.itemType && !item.type)) {
      const itemKey = `${item.id}-${item.name}`;
      if (this.addedItems.has(itemKey)) {
        // For consumables, we'll check if it's actually in the inventory
        const existingItem = GameState.data.inventory.find(i => i.id === item.id && i.name === item.name);
        if (existingItem) {
          console.warn(`Item ${item.name} (${item.id}) already exists in inventory. Not adding duplicate.`);
          return false;
        } else {
          // If it's in our tracking but not in inventory, allow adding it
          this.addedItems.delete(itemKey);
        }
      }
      
      // Check if inventory is full for consumable items
      const consumableCount = GameState.data.inventory.filter(i => 
        i.itemType === 'consumable' || (!i.itemType && i.type !== 'relic')
      ).length;
      
      if (consumableCount >= this.maxSize) {
        this.showInventoryFullDialog(item);
        return false;
      }
      
      // Mark this item as added to prevent duplicates
      this.addedItems.add(itemKey);
    }
    
    // Add the item
    GameState.data.inventory.push(item);
    
    // Show feedback
    if (window.UiUtils && typeof UiUtils.showFloatingText === 'function') {
      UiUtils.showFloatingText(`Added ${item.name} to inventory!`, 'success');
    }
    
    // Update inventory display
    this.renderInventory();
    
    // Save inventory to server
    this.saveInventory();
    
    // Emit item added success event
    if (window.EventSystem) {
      EventSystem.emit(GAME_EVENTS.ITEM_ADDED_SUCCESS, item);
    }
    
    return true;
  },
  
  // Remove an item from inventory
  removeItem: function(index) {
    // Handle both item object and index
    if (typeof index === 'object') {
      // If passed an item instead of index, find its index
      const itemObj = index;
      
      if (!window.GameState || !GameState.data || !GameState.data.inventory) {
        console.error("GameState or inventory not available");
        return false;
      }
      
      index = GameState.data.inventory.findIndex(item => 
        item.id === itemObj.id && item.name === itemObj.name
      );
    }
    
    if (index < 0 || !window.GameState || !GameState.data || !GameState.data.inventory || 
        index >= GameState.data.inventory.length) {
      console.error("Invalid index or inventory for item removal");
      return false;
    }
    
    // Remove the item
    const removedItem = GameState.data.inventory.splice(index, 1)[0];
    
    if (!removedItem) {
      console.error("Failed to remove item at index", index);
      return false;
    }
    
    // Remove from tracking Set to allow it to be added again
    const itemKey = `${removedItem.id}-${removedItem.name}`;
    this.addedItems.delete(itemKey);
    
    // Update inventory display
    this.renderInventory();
    
    // Save inventory to server
    this.saveInventory();
    
    // Emit item removed event
    if (window.EventSystem) {
      EventSystem.emit(GAME_EVENTS.ITEM_REMOVED, removedItem);
    }
    
    return true;
  },
  
  // Show dialog for full inventory
  showInventoryFullDialog: function(newItem) {
    // Create a modal dialog for inventory management
    const dialogHtml = `
      <div id="inventory-full-modal" class="game-modal-overlay" style="display:flex;">
        <div class="game-modal-content">
          <div class="game-modal__header">
            <h3>Inventory Full!</h3>
            <button class="game-modal-close" id="close-inv-modal">&times;</button>
          </div>
          <div class="game-modal__body">
            <p>Your inventory is full. Would you like to discard an item to make room for ${newItem.name}?</p>
            <div id="current-items-list" class="mt-3"></div>
            <div class="mt-3">
              <button id="cancel-new-item" class="game-btn game-btn--danger">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to DOM
    const modalElement = document.createElement('div');
    modalElement.innerHTML = dialogHtml;
    document.body.appendChild(modalElement.firstElementChild);
    
    // Get the modal element
    const modal = document.getElementById('inventory-full-modal');
    
    // Display current inventory items
    const itemsList = document.getElementById('current-items-list');
    
    if (itemsList && window.GameState && GameState.data && GameState.data.inventory) {
      // Only show consumable items
      const consumables = GameState.data.inventory.filter(item => 
        item.itemType === 'consumable' || (!item.itemType && item.type !== 'relic')
      );
      
      consumables.forEach((item, index) => {
        const itemBtn = document.createElement('button');
        itemBtn.className = 'game-btn game-btn--primary game-btn--block mb-2';
        itemBtn.innerHTML = `
          <strong>${item.name}</strong> (${item.rarity || 'common'}) 
          <br><small>${this.getEffectDescription(item.effect)}</small>
        `;
        
        // Add click event to replace this item
        itemBtn.addEventListener('click', () => {
          // Find the real index in the full inventory
          const realIndex = GameState.data.inventory.findIndex(i => 
            i.id === item.id && i.name === item.name
          );
          
          if (realIndex >= 0) {
            this.removeItem(realIndex);
            this.addItem(newItem);
          }
          
          // Close the modal
          modal.remove();
        });
        
        itemsList.appendChild(itemBtn);
      });
    }
    
    // Add cancel button event
    const cancelButton = document.getElementById('cancel-new-item');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // Add close button event
    const closeButton = document.getElementById('close-inv-modal');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.remove();
      });
    }
  },
  
  // Save inventory to server
  saveInventory: function() {
    if (typeof ApiClient !== 'undefined') {
      if (typeof ApiClient.saveInventory === 'function' && window.GameState && GameState.data) {
        ApiClient.saveInventory({ inventory: GameState.data.inventory })
          .catch(err => console.error("Failed to save inventory:", err));
      } else if (typeof ApiClient.saveGame === 'function') {
        ApiClient.saveGame()
          .catch(err => console.error("Failed to save game state:", err));
      }
    }
  },
  
  // Clear duplicate tracking (for testing/debugging)
  clearDuplicateTracking: function() {
    this.addedItems.clear();
    console.log("Cleared duplicate item tracking");
  }
};

// Export globally
window.InventorySystem = InventorySystem;