// treasure_component.js - Component for treasure node type

const TreasureComponent = ComponentUtils.createComponent('treasure', {
  // Initialize component
  initialize: function() {
    console.log("Initializing treasure component");
  },
  
  // treasure_component.js - Refactored implementation
  render: function(nodeData, container) {
    console.log("Rendering treasure component", nodeData);
    
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
            <div class="flex-shrink-0 mr-md">
              <div class="item-icon item-icon--${itemRarity}">
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
    
    // Add event handlers
    this.bindAction('treasure-take-btn', 'click', 'takeItem', { 
      nodeData, item: nodeData.item 
    });
    this.bindAction('treasure-leave-btn', 'click', 'continue', { nodeData });
  },

  // Add a fun new method that uses the design bridge for fancy titles
  generateTreasureTitle: function() {
    const titles = [
      "Treasure Found!",
      "Valuable Discovery!",
      "Artifact Uncovered!",
      "Mystical Item Found!"
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  },

  // Update the getItemIcon method to use design bridge colors
  getItemIcon: function(item) {
    // Use design bridge for colors if available
    const iconColor = window.DesignBridge?.colors?.warning || "#f0c866";
    
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="pixelated">`;
    }
    
    // Map common item types to default icons with color from design bridge
    const itemName = item.name.toLowerCase();
    let iconClass = "default";
    
    if (itemName.includes('book') || itemName.includes('manual')) {
      iconClass = "book";
    } else if (itemName.includes('potion') || itemName.includes('vial')) {
      iconClass = "potion";
    } else if (itemName.includes('shield') || itemName.includes('armor')) {
      iconClass = "shield";
    } else if (itemName.includes('dosimeter') || itemName.includes('detector')) {
      iconClass = "detector";
    }
    
    return `<i class="fas fa-${iconClass}" style="color: ${iconColor};"></i>`;
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
NodeComponents.register('treasure', TreasureComponent);
}