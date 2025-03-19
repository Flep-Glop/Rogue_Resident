// treasure_component.js - Updated to use icon with tooltip like inventory

const TreasureComponent = ComponentUtils.createComponent('treasure', {
  // Initialize component
  initialize: function() {
    console.log("Initializing treasure component");
    
    // Initialize UI state
    this.setUiState('itemTaken', false);
    this.setUiState('addAttempted', false); // Track if item add was attempted
    
    // Make sure unified tooltip system is initialized
    if (window.UnifiedTooltipSystem) {
      if (typeof UnifiedTooltipSystem.initialize === 'function' && !UnifiedTooltipSystem.initialized) {
        UnifiedTooltipSystem.initialize();
      }
    } else {
      console.warn("UnifiedTooltipSystem not available - tooltips may not display correctly");
    }
  },
  
  render: function(nodeData, container) {
    console.log("Rendering treasure component", nodeData);
    
    // Check for duplicate rendering
    const nodeId = nodeData.id;
    console.log(`Rendering treasure for node ${nodeId}`);
    
    // Handle array of items - just use the first one
    if (Array.isArray(nodeData.item)) {
      console.warn("Received multiple items in treasure node, using only the first one");
      nodeData.item = nodeData.item[0];
    }
    
    // Try to recover item data if missing
    if (!nodeData.item) {
      nodeData.item = this.getFallbackItem();
      console.log("Using fallback item for treasure node:", nodeData.item);
    }
    
    // Validate node data
    if (!nodeData.item) {
      this.showToast("No treasure found!", "warning");
      container.innerHTML = `
        <div class="game-panel game-panel--warning">
          <h3 class="game-panel__title">Treasure Room</h3>
          <div class="alert alert-warning">
            <p>The treasure chest is empty!</p>
          </div>
          <button id="treasure-continue-btn" class="game-btn game-btn--primary mt-md">Continue</button>
        </div>
      `;
      this.bindAction('treasure-continue-btn', 'click', 'continue', { nodeData });
      return;
    }
    
    // Get item data
    const itemRarity = nodeData.item.rarity || 'common';
    
    // Check if the item was already taken for this node
    const alreadyTaken = this.isItemAlreadyTaken(nodeData);
    
    // Update UI state to match
    if (alreadyTaken) {
      this.setUiState('itemTaken', true);
      this.setUiState('addAttempted', true);
    }
    
    // Create treasure UI with simplified icon display
    container.innerHTML = `
      <div class="game-panel anim-fade-in">
        <div class="text-center mb-md">
          <h3 class="text-warning glow-text anim-pulse-warning">${this.generateTreasureTitle()}</h3>
          <p>You found an item!</p>
        </div>
        
        <div class="treasure-display-container">
          <div id="treasure-item-icon" class="treasure-item-icon ${itemRarity}">
            <div class="item-inner">
              <div class="item-icon">${this.getItemIcon(nodeData.item)}</div>
              <div class="item-glow"></div>
            </div>
            <div class="pixel-border ${itemRarity}">
              <div class="pixel-corner top-left"></div>
              <div class="pixel-corner top-right"></div>
              <div class="pixel-corner bottom-left"></div>
              <div class="pixel-corner bottom-right"></div>
            </div>
          </div>
        </div>
        
        <div class="treasure-buttons">
          <button id="treasure-take-btn" class="game-btn game-btn--secondary flex-1 anim-pulse-scale" ${alreadyTaken ? 'style="display:none;"' : ''}>
            Take Item
          </button>
          <button id="treasure-leave-btn" class="game-btn game-btn--primary flex-1" ${alreadyTaken ? 'style="width:100%;"' : ''}>
            ${alreadyTaken ? 'Continue' : 'Leave It'}
          </button>
        </div>
      </div>
    `;
    
    // Register with tooltip system
    const itemIcon = document.getElementById('treasure-item-icon');
    if (itemIcon) {
      if (window.TooltipSystem && typeof TooltipSystem.registerTooltip === 'function') {
        TooltipSystem.registerTooltip(itemIcon, nodeData.item);
      } else if (window.UnifiedTooltipSystem && typeof UnifiedTooltipSystem.applyTooltip === 'function') {
        UnifiedTooltipSystem.applyTooltip(itemIcon, nodeData.item);
      }
    }
    
    // Add treasure component styles
    this.addTreasureStyles();
    
    // Bind action buttons
    this.bindAction('treasure-take-btn', 'click', 'takeItem', { nodeData, item: nodeData.item });
    this.bindAction('treasure-leave-btn', 'click', 'continue', { nodeData });
  },
  
  // Add treasure-specific styles
  addTreasureStyles: function() {
    // Check if styles are already added
    if (document.getElementById('treasure-component-styles')) {
      return;
    }
    
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.id = 'treasure-component-styles';
    styleEl.textContent = `
      /* Treasure component styles */
      .treasure-display-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 30px 0;
      }
      
      .treasure-item-icon {
        position: relative;
        width: 150px;
        height: 150px;
        background-color: var(--dark-alt);
        border-radius: var(--border-radius-sm);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: transform 0.2s, filter 0.2s, box-shadow 0.2s;
      }
      
      .treasure-item-icon:hover {
        transform: translateY(-3px);
        filter: brightness(1.1);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
      }
      
      .treasure-item-icon .item-inner {
        width: 140px;
        height: 140px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        background-color: var(--dark);
        border-radius: 10px;
        overflow: hidden;
      }
      
      .treasure-item-icon .item-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
      }
      
      .treasure-item-icon .item-icon img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        image-rendering: pixelated;
      }
      
      .treasure-item-icon .item-glow {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 6px;
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.1) inset;
        pointer-events: none;
      }
      
      /* Rarity styles with glowing effects */
      .treasure-item-icon.common .item-inner {
        box-shadow: 0 0 3px rgba(255, 255, 255, 0.2) inset;
      }
      
      .treasure-item-icon.uncommon .item-inner {
        box-shadow: 0 0 5px var(--primary) inset;
      }
      
      .treasure-item-icon.rare .item-inner {
        box-shadow: 0 0 5px var(--warning) inset;
      }
      
      .treasure-item-icon.epic .item-inner {
        box-shadow: 0 0 8px var(--secondary) inset;
        animation: epic-pulse 2s infinite;
      }
      
      /* Pixelated border effect */
      .pixel-border {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 2;
      }
      
      .pixel-corner {
        position: absolute;
        width: 8px;
        height: 8px;
      }
      
      .pixel-corner.top-left {
        top: 0;
        left: 0;
        border-top: 2px solid;
        border-left: 2px solid;
      }
      
      .pixel-corner.top-right {
        top: 0;
        right: 0;
        border-top: 2px solid;
        border-right: 2px solid;
      }
      
      .pixel-corner.bottom-left {
        bottom: 0;
        left: 0;
        border-bottom: 2px solid;
        border-left: 2px solid;
      }
      
      .pixel-corner.bottom-right {
        bottom: 0;
        right: 0;
        border-bottom: 2px solid;
        border-right: 2px solid;
      }
      
      /* Border colors by rarity */
      .pixel-border.common .pixel-corner {
        border-color: rgba(255, 255, 255, 0.5);
      }
      
      .pixel-border.uncommon .pixel-corner {
        border-color: var(--primary);
      }
      
      .pixel-border.rare .pixel-corner {
        border-color: var(--warning);
      }
      
      .pixel-border.epic .pixel-corner {
        border-color: var(--secondary);
        box-shadow: 0 0 3px var(--secondary);
      }
      
      /* Button styling */
      .treasure-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      
      .flex-1 {
        flex: 1;
      }
      
      /* Animations */
      @keyframes epic-pulse {
        0% { box-shadow: 0 0 3px var(--secondary) inset; }
        50% { box-shadow: 0 0 8px var(--secondary) inset; }
        100% { box-shadow: 0 0 3px var(--secondary) inset; }
      }
    `;
    
    document.head.appendChild(styleEl);
  },
  
  // Check if an item was already taken from this node
  isItemAlreadyTaken: function(nodeData) {
    // First check component state
    if (this.getUiState('itemTaken') || this.getUiState('addAttempted')) {
      return true;
    }
    
    // Then check if the item is already in inventory
    if (window.GameState && GameState.data && GameState.data.inventory) {
      const inventory = GameState.data.inventory;
      const nodeItem = nodeData.item;
      
      // Find by ID and possibly name
      const existsInInventory = inventory.some(item => 
        item.id === nodeItem.id && 
        (item.name === nodeItem.name || !nodeItem.name)
      );
      
      if (existsInInventory) {
        console.log(`Item ${nodeItem.id} already exists in inventory`);
        return true;
      }
    }
    
    return false;
  },
  
  // Get fallback item if node data doesn't include one
  getFallbackItem: function() {
    const items = [
      {
        id: "medical_textbook",
        name: "Medical Physics Textbook",
        description: "A comprehensive guide that helps eliminate one incorrect answer option.",
        rarity: "uncommon",
        itemType: "consumable",
        iconPath: "Notebook.png",
        effect: {
          type: "eliminateOption",
          value: "Removes one incorrect answer option",
          duration: "instant"
        }
      },
      {
        id: "radiation_badge",
        name: "Radiation Badge",
        description: "A personal dosimeter that can absorb harmful radiation, restoring 1 life point.",
        rarity: "rare",
        itemType: "consumable",
        iconPath: "Nametag.png",
        effect: {
          type: "heal",
          value: 1,
          duration: "instant"
        }
      }
    ];
    
    return items[Math.floor(Math.random() * items.length)];
  },

  // Generate a fun title for treasure
  generateTreasureTitle: function() {
    const titles = [
      "Treasure Found!",
      "Valuable Discovery!",
      "Artifact Uncovered!",
      "Mystical Item Found!"
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  },

  // Get icon for an item
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="item-image">`;
    }
    
    // Fallback: Use item name to determine a default icon
    const itemName = (item.name || '').toLowerCase();
    let iconFile = 'Yellow Sticky Note.png';
    
    // Map common item types to default icons
    if (itemName.includes('book') || itemName.includes('textbook') || itemName.includes('manual')) {
      iconFile = 'Textbook.png';
    } else if (itemName.includes('badge') || itemName.includes('dosimeter') || itemName.includes('detector')) {
      iconFile = 'Nametag.png';
    } else if (itemName.includes('shield') || itemName.includes('armor')) {
      iconFile = 'Flag.png';
    } else if (itemName.includes('glasses') || itemName.includes('spectacles') || itemName.includes('goggles')) {
      iconFile = '3D Glasses.png';
    } else if (itemName.includes('notebook') || itemName.includes('clipboard')) {
      iconFile = 'Notepad.png';
    }
    
    return `<img src="/static/img/items/${iconFile}" alt="${item.name}" class="item-image">`;
  },
  
  // Take the item - with direct hooks to inventory system
  takeItem: function(data) {
    const { nodeData, item } = data;
    
    console.log("Taking item:", item);
    
    // PREVENT DUPLICATE ITEMS: Check if item is already taken or add was attempted
    if (this.getUiState('itemTaken') || this.getUiState('addAttempted')) {
      console.log("Item already taken or add was attempted, ignoring duplicate click");
      return;
    }
    
    // Mark that we've attempted to add the item - this is crucial
    this.setUiState('addAttempted', true);
    
    // Check if InventorySystem exists
    if (!window.InventorySystem && !window.ItemManager) {
      console.error("Neither InventorySystem nor ItemManager are available");
      this.showToast("Cannot add item to inventory - system error", "danger");
      return;
    }
    
    // Create full item object with complete attributes
    const fullItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      rarity: item.rarity,
      itemType: item.itemType || 'consumable',
      iconPath: item.iconPath,
      effect: {
        type: this.getEffectType(item),
        value: item.effect?.value || item.description,
        duration: (item.itemType === "relic") ? "permanent" : "instant"
      }
    };
    
    if (item.itemType === 'relic') {
      fullItem.passiveText = `Passive: ${item.effect?.value || item.description}`;
    }
    
    // Add to inventory with proper error handling
    let added = false;
    
    // Try ItemManager first
    if (window.ItemManager && typeof ItemManager.addItem === 'function') {
      console.log("Using ItemManager to add item");
      added = ItemManager.addItem(fullItem);
    } 
    // Fall back to InventorySystem
    else if (window.InventorySystem && typeof InventorySystem.addItem === 'function') {
      console.log("Using InventorySystem to add item");
      added = InventorySystem.addItem(fullItem);
    }
    
    if (added) {
      // Mark as taken in component state
      this.setUiState('itemTaken', true);
      
      // Show feedback
      this.showFeedback(`Added ${item.name} to inventory!`, 'success');
      
      // Update UI to show item was taken
      const takeBtn = document.getElementById('treasure-take-btn');
      const leaveBtn = document.getElementById('treasure-leave-btn');
      
      if (takeBtn) takeBtn.style.display = 'none';
      if (leaveBtn) {
        leaveBtn.textContent = 'Continue';
        leaveBtn.style.width = '100%';
      }
    } else {
      // Show error
      this.showToast("Failed to add item to inventory. It may be full.", 'warning');
    }
  },
  
  // Get effect type based on item properties
  getEffectType: function(item) {
    // If the item already has an effect type, use it
    if (item.effect && item.effect.type) {
      return item.effect.type;
    }
    
    const id = (item.id || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    
    if (id.includes('textbook') || desc.includes('eliminat') || desc.includes('option')) 
      return "eliminateOption";
    if (id.includes('badge') || id.includes('heal') || desc.includes('restor') || desc.includes('life') || desc.includes('heal')) 
      return "heal";
    if (id.includes('goggles') || id.includes('spectacles') || desc.includes('second') || desc.includes('attempt') || desc.includes('retry'))
      return "second_chance";
    if (id.includes('insight') || desc.includes('insight')) 
      return "insight_gain";
    
    // Default fallback
    return item.itemType === 'relic' ? "passive" : "special";
  },
  
  // Show toast message
  showToast: function(message, type) {
    if (window.UiUtils && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(message, type);
    } else {
      console.log(message);
    }
  },
  
  // Show feedback message
  showFeedback: function(message, type) {
    if (window.UiUtils && typeof UiUtils.showFloatingText === 'function') {
      UiUtils.showFloatingText(message, type);
    } else if (window.UiUtils && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(message, type);
    } else {
      console.log(message);
    }
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Treasure component handling action: ${action}`, data);
    
    switch (action) {
      case 'takeItem':
        this.takeItem(data);
        break;
        
      case 'continue':
        this.completeNode(nodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('treasure', TreasureComponent);
}