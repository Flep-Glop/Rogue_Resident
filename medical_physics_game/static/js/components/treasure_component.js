// Updated treasure_component.js - Component for treasure node type

const TreasureComponent = ComponentUtils.createComponent('treasure', {
  // Initialize component
  initialize: function() {
    console.log("Initializing treasure component");
    
    // Initialize UI state
    this.setUiState('itemTaken', false);
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
          <button id="treasure-take-btn" class="game-btn game-btn--secondary flex-1 anim-pulse-scale">
            Take Item
          </button>
          <button id="treasure-leave-btn" class="game-btn game-btn--primary flex-1">
            Leave It
          </button>
        </div>
      </div>
    `;
    
    // Add event handlers - ONLY bind once
    if (!this.getUiState('eventsBound')) {
      this.bindAction('treasure-take-btn', 'click', 'takeItem', { 
        nodeData, item: nodeData.item 
      });
      this.bindAction('treasure-leave-btn', 'click', 'continue', { nodeData });
      
      // Mark events as bound
      this.setUiState('eventsBound', true);
    }
    
    // If item was already taken, update UI
    if (this.getUiState('itemTaken')) {
      const takeBtn = document.getElementById('treasure-take-btn');
      const leaveBtn = document.getElementById('treasure-leave-btn');
      
      if (takeBtn) takeBtn.style.display = 'none';
      if (leaveBtn) {
        leaveBtn.textContent = 'Continue';
        leaveBtn.style.width = '100%';
      }
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
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="pixel-item-icon-img">`;
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
  
  // Take the item
  takeItem: function(data) {
    const { nodeData, item } = data;
    
    console.log("Taking item:", item);
    
    // PREVENT DUPLICATE ITEMS: Check if item is already taken
    if (this.getUiState('itemTaken')) {
      console.log("Item already taken, ignoring duplicate click");
      return;
    }
    
    // Add to inventory - Mark as taken BEFORE adding to prevent duplicates
    this.setUiState('itemTaken', true);
    
    // Add to inventory
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
      // Failed to add - reset taken state
      this.setUiState('itemTaken', false);
      
      // Show error
      this.showToast("Failed to add item to inventory. It may be full.", 'warning');
    }
  },
  
  // Reset component state when node is completed
  onNodeCompleted: function() {
    // Reset UI state for next treasure node
    this.setUiState('itemTaken', false);
    this.setUiState('eventsBound', false);
    
    console.log("Treasure component state reset");
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

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('treasure', TreasureComponent);
}