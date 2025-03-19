// inventory_system.js - Manages game inventory

// InventorySystem singleton - handles inventory display and functionality
const InventorySystem = {
  // Max inventory size (can be increased with level)
  maxSize: 5,
  
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
  },
  
  // Render consumable items
  renderItems: function() {
    const itemsContainer = document.getElementById('items-container');
    if (!itemsContainer) return;
    
    // Filter inventory to only show consumable items
    const items = GameState.data.inventory.filter(item => 
      item.itemType === 'consumable' || !item.itemType);
    
    if (items.length === 0) {
      itemsContainer.innerHTML = '<div class="empty-inventory">No consumable items</div>';
      return;
    }
    
    // Create grid
    const gridHtml = '<div class="inventory-grid"></div>';
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

  // Render relics
  renderRelics: function() {
    const relicsContainer = document.getElementById('relics-container');
    if (!relicsContainer) return;
    
    // Filter inventory to only show relics
    const relics = GameState.data.inventory.filter(item => 
      item.itemType === 'relic');
    
    if (relics.length === 0) {
      relicsContainer.innerHTML = '<div class="empty-inventory">No relics found</div>';
      return;
    }
    
    // Create grid
    const gridHtml = '<div class="relic-grid"></div>';
    relicsContainer.innerHTML = gridHtml;
    
    const grid = relicsContainer.querySelector('.relic-grid');
    
    // Add each relic
    relics.forEach((relic, index) => {
      const relicElement = document.createElement('div');
      relicElement.className = `relic-item ${relic.rarity || 'common'}`;
      relicElement.dataset.index = index;
      
      relicElement.innerHTML = `
        <div class="relic-card">
          <div class="relic-header">
            <h4 class="relic-name">${relic.name}</h4>
            <span class="relic-rarity">${relic.rarity || 'common'}</span>
          </div>
          <div class="relic-icon">
            <div class="item-inner">
              <div class="item-icon">${this.getItemIcon(relic)}</div>
              <div class="item-glow"></div>
            </div>
          </div>
          <p class="relic-desc">${relic.description}</p>
          <div class="relic-effect">
            <span class="effect-label">Effect:</span>
            <span class="passive-text">${relic.passiveText || relic.effect?.value || 'No effect'}</span>
          </div>
        </div>
      `;
      
      grid.appendChild(relicElement);
    });
  },

  // Use an item
  useItem: function(itemId) {
    let item;
    
    // Handle both direct item objects and item IDs
    if (typeof itemId === 'object') {
      item = itemId;
      itemId = item.id;
    } else {
      // Find the item by ID in the inventory
      item = GameState.data.inventory.find(i => i.id === itemId);
    }
    
    if (!item) {
      console.error(`Item not found: ${itemId}`);
      return false;
    }
    
    if (!ItemManager) {
      console.error("ItemManager not available");
      return false;
    }
    
    const success = ItemManager.useItem(itemId);
    
    if (success) {
      this.renderInventory(); // Refresh the display
      
      // Show visual feedback
      UiUtils.showFloatingText(`Used ${item.name}!`, 'success');
    } else {
      UiUtils.showToast("Cannot use this item", "warning");
    }
    
    return success;
  },
  
  // Get pixel art icon for an item
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="pixel-item-icon-img">`;
    }
    
    // Fallback: Use item name to determine a default icon
    const itemName = item.name.toLowerCase();
    let iconFile = "default.png";
    
    // Map common item types to default icons
    if (itemName.includes('book') || itemName.includes('manual')) {
      iconFile = "book.png";
    } else if (itemName.includes('potion') || itemName.includes('vial')) {
      iconFile = "potion.png";
    } else if (itemName.includes('shield') || itemName.includes('armor')) {
      iconFile = "shield.png";
    } else if (itemName.includes('dosimeter') || itemName.includes('detector')) {
      iconFile = "detector.png";
    }
    
    return `<img src="/static/img/items/${iconFile}" alt="${item.name}" class="pixel-item-icon-img">`;
  },
  
  // Get effect description for display
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