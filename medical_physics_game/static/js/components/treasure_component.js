// Updated treasure_component.js - Component for treasure node type with comprehensive fix for duplicate items

const TreasureComponent = ComponentUtils.createComponent('treasure', {
  // Initialize component
  initialize: function() {
    console.log("Initializing treasure component");
    
    // Initialize UI state with a global unique ID to track items
    this.setUiState('itemTaken', false);
    this.setUiState('processingTakeAction', false); // Add a lock to prevent double processing
    
    // Use a class-level property to track globally which items have been taken
    // This persists even if the component is re-instantiated
    if (!TreasureComponent.takenItems) {
      TreasureComponent.takenItems = new Set();
    }
  },
  
  // Render treasure component
  render: function(nodeData, container) {
    console.log("Rendering treasure component", nodeData);
    
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

    // Check if this item was already taken (using the static property)
    const nodeId = nodeData.id;
    const itemId = nodeData.item.id;
    const uniqueItemKey = `${nodeId}-${itemId}`;
    const alreadyTaken = TreasureComponent.takenItems.has(uniqueItemKey);
    
    // Update component state to match global state
    if (alreadyTaken) {
      this.setUiState('itemTaken', true);
    }
    
    // Get colors from the design bridge if available
    const treasureColor = window.DesignBridge?.colors?.nodeTreasure || '#f0c866';
    
    // Get item data
    const itemRarity = nodeData.item.rarity || 'common';
    
    // Create treasure UI with new component and utility classes
    container.innerHTML = `
      <div class="game-panel anim-fade-in">
        <div class="text-center mb-md">
          <h3 class="text-warning glow-text anim-pulse-warning">${this.generateTreasureTitle()}</h3>
        </div>
        
        <div class="game-card game-card--${itemRarity} shadow-md mb-lg">
          <div class="game-card__header">
            <h4 class="game-card__title">${nodeData.item.name}</h4>
            <span class="rarity-badge rarity-badge-${itemRarity}">${itemRarity}</span>
          </div>
          
          <div class="game-card__body flex">
            <div class="flex-shrink-0 mr-md" style="width: 80px; height: 80px;">
              <div class="item-icon item-icon--${itemRarity}" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                ${this.getItemIcon(nodeData.item)}
              </div>
            </div>
            
            <div class="flex-grow">
              <p class="mb-sm">${nodeData.item.description}</p>
              
              <div class="item-tooltip__effect mt-md">
                <span class="text-primary">Effect:</span>
                <span>${nodeData.item.effect?.value || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex gap-md">
          <button id="treasure-take-btn" class="game-btn game-btn--secondary flex-1 anim-pulse-scale" ${alreadyTaken ? 'style="display:none;"' : ''}>
            Take Item
          </button>
          <button id="treasure-leave-btn" class="game-btn game-btn--primary flex-1" ${alreadyTaken ? 'style="width:100%;"' : ''}>
            ${alreadyTaken ? 'Continue' : 'Leave It'}
          </button>
        </div>
      </div>
    `;
    
    // Remove old event listeners to prevent duplication
    const takeBtn = document.getElementById('treasure-take-btn');
    const leaveBtn = document.getElementById('treasure-leave-btn');
    
    if (takeBtn) {
      const newTakeBtn = takeBtn.cloneNode(true);
      takeBtn.parentNode.replaceChild(newTakeBtn, takeBtn);
      this.bindAction(newTakeBtn, 'click', 'takeItem', { 
        nodeData, 
        item: nodeData.item,
        uniqueItemKey: uniqueItemKey // Pass the unique key for tracking
      });
    }
    
    if (leaveBtn) {
      const newLeaveBtn = leaveBtn.cloneNode(true);
      leaveBtn.parentNode.replaceChild(newLeaveBtn, leaveBtn);
      this.bindAction(newLeaveBtn, 'click', 'continue', { nodeData });
    }
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

  // FIXED: Get icon for an item - properly displays image with consistent sizing
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="pixel-item-icon-img" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;">`;
    }
    
    // Use design bridge for colors if available
    const iconColor = window.DesignBridge?.colors?.warning || "#f0c866";
    
    // Map common item types to default icons with color from design bridge
    return `<i class="fas fa-${this.getIconClass(item)}" style="color: ${iconColor}; font-size: 32px;"></i>`;
  },
  
  // Get appropriate icon class based on item properties
  getIconClass: function(item) {
    const itemName = (item.name || '').toLowerCase();
    
    if (itemName.includes('book') || itemName.includes('textbook') || itemName.includes('manual')) {
      return "book";
    } else if (itemName.includes('potion') || itemName.includes('vial')) {
      return "flask";
    } else if (itemName.includes('badge') || itemName.includes('dosimeter') || itemName.includes('detector')) {
      return "id-badge";
    } else if (itemName.includes('shield') || itemName.includes('armor')) {
      return "shield-alt";
    } else if (itemName.includes('glasses') || itemName.includes('spectacles') || itemName.includes('goggles')) {
      return "glasses";
    } else if (itemName.includes('notebook') || itemName.includes('clipboard')) {
      return "clipboard";
    }
    
    // Default icon
    return "box";
  },
  
  // Take the item with comprehensive protection against duplicates
  takeItem: function(data) {
    const { nodeData, item, uniqueItemKey } = data;
    
    console.log("Taking item:", item, "with uniqueKey:", uniqueItemKey);
    
    // MULTIPLE CHECKS against duplicate items:
    
    // 1. Check component-level state
    if (this.getUiState('itemTaken')) {
      console.log("Item already taken according to component state, ignoring");
      return;
    }
    
    // 2. Check if we're already processing a take action
    if (this.getUiState('processingTakeAction')) {
      console.log("Already processing a take action, ignoring duplicate request");
      return;
    }
    
    // 3. Check global state tracking
    if (TreasureComponent.takenItems.has(uniqueItemKey)) {
      console.log("Item already taken according to global tracking, ignoring");
      this.setUiState('itemTaken', true); // Update local state to match global
      return;
    }
    
    // 4. Set processing lock - this prevents race conditions
    this.setUiState('processingTakeAction', true);
    
    try {
      // 5. Update global tracking BEFORE adding to inventory
      TreasureComponent.takenItems.add(uniqueItemKey);
      
      // 6. Mark as taken in component state
      this.setUiState('itemTaken', true);
      
      // 7. Now add to inventory
      const added = this.addItemToInventory(item);
      
      if (added) {
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
        // Failed to add - reset states
        this.setUiState('itemTaken', false);
        TreasureComponent.takenItems.delete(uniqueItemKey);
        
        // Show error
        this.showToast("Failed to add item to inventory. It may be full.", 'warning');
      }
    } finally {
      // 8. Always release the processing lock
      this.setUiState('processingTakeAction', false);
    }
  },
  
  // Reset component state when node is completed
  onNodeCompleted: function() {
    // Reset processing locks but keep itemTaken state
    this.setUiState('processingTakeAction', false);
    console.log("Treasure component processing locks reset");
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
        this.onNodeCompleted(); // Reset state when continuing
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Static property to track which items have been taken globally
// This ensures persistence even if the component is re-instantiated
TreasureComponent.takenItems = new Set();

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('treasure', TreasureComponent);
}