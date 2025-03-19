// shop_component.js - Improved version with reliable node completion and condensed UI

const ShopComponent = ComponentUtils.createComponent('shop', {
  // Initialize component
  initialize: function() {
    console.log("Initializing improved shop component");
    this.itemsLoaded = false;
    this.shopItems = [];
  },
  
  // Render the shop with improved UI
  render: function(nodeData, container) {
    console.log("Rendering shop component", nodeData);
    
    // Create simplified shop structure
    container.innerHTML = `
      <div class="game-panel anim-fade-in">
        <div class="shop-header">
          <h3 class="game-panel__title">Department Store</h3>
          <div class="insight-display">
            <span>Insight:</span>
            <span class="insight-value" id="shop-currency">${this.getPlayerInsight()}</span>
          </div>
        </div>
        
        <p class="shop-description">Browse and purchase items using your insight points.</p>
        
        <div id="shop-items-grid" class="shop-items-grid">
          <div class="loading-indicator">
            <p>Loading items...</p>
          </div>
        </div>
        
        <button id="shop-continue-btn" class="game-btn game-btn--secondary game-btn--block mt-md">
          LEAVE SHOP
        </button>
      </div>
    `;
    
    // Bind action using ComponentUtils for reliability
    this.bindAction('shop-continue-btn', 'click', 'continue', { nodeData });
    
    // Load items
    this.loadItems();
  },
  
  // Load shop items
  loadItems: function() {
    console.log("Loading shop items");
    
    // Create static items guaranteed to work
    const items = [
      {
        id: "medical_textbook",
        name: "Medical Physics Textbook",
        description: "Eliminates one incorrect answer option",
        price: 30,
        rarity: "uncommon",
        iconPath: "Notebook.png",
        type: "consumable",
        itemType: "consumable"
      },
      {
        id: "radiation_badge",
        name: "Radiation Badge",
        description: "Restores 1 life point",
        price: 50,
        rarity: "rare",
        iconPath: "Nametag.png",
        type: "consumable",
        itemType: "consumable"
      },
      {
        id: "quantum_goggles",
        name: "Schrödinger's Spectacles",
        description: "Allows a second attempt at questions",
        price: 80,
        rarity: "epic",
        iconPath: "3D Glasses.png",
        type: "relic",
        itemType: "relic"
      }
    ];
    
    this.shopItems = items;
    this.itemsLoaded = true;
    this.renderItems();
  },
  
  // Render items with condensed UI
  renderItems: function() {
    const container = document.getElementById('shop-items-grid');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Group items by type
    const consumables = this.shopItems.filter(item => 
      item.type === 'consumable' || item.itemType === 'consumable');
    
    const relics = this.shopItems.filter(item => 
      item.type === 'relic' || item.itemType === 'relic');
    
    // Display consumables first
    if (consumables.length > 0) {
      const consumablesHeader = document.createElement('div');
      consumablesHeader.className = 'shop-category-header';
      consumablesHeader.textContent = 'Consumable Items';
      container.appendChild(consumablesHeader);
      
      this.renderItemGroup(container, consumables);
    }
    
    // Display relics
    if (relics.length > 0) {
      const relicsHeader = document.createElement('div');
      relicsHeader.className = 'shop-category-header';
      relicsHeader.textContent = 'Permanent Relics';
      container.appendChild(relicsHeader);
      
      this.renderItemGroup(container, relics);
    }
    
    // If no items at all
    if (this.shopItems.length === 0) {
      container.innerHTML = `
        <div class="empty-shop-message">
          <p>No items available for purchase at this time.</p>
        </div>
      `;
    }
    
    // Add simple styles
    this.addStyles();
  },
  
  // Render a group of items
  renderItemGroup: function(container, items) {
    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'shop-items-container';
    
    items.forEach(item => {
      const canAfford = this.getPlayerInsight() >= item.price;
      
      const itemElement = document.createElement('div');
      itemElement.className = `shop-item rarity-${item.rarity || 'common'}`;
      
      // Simplified item display
      itemElement.innerHTML = `
        <div class="shop-item-header">
          <div class="item-name">${item.name}</div>
          <div class="item-price ${!canAfford ? 'cannot-afford' : ''}">${item.price}</div>
        </div>
        <div class="shop-item-body">
          <div class="item-rarity ${item.rarity || 'common'}">${item.rarity || 'common'}</div>
          <div class="item-description">${item.description}</div>
          <div class="item-effect">${this.getEffectText(item)}</div>
        </div>
        <div class="shop-item-footer">
          <button class="purchase-btn ${!canAfford ? 'cannot-afford' : ''}" 
                  data-id="${item.id}" 
                  ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? 'Purchase' : 'Not enough insight'}
          </button>
        </div>
      `;
      
      itemsGrid.appendChild(itemElement);
    });
    
    container.appendChild(itemsGrid);
    
    // Add purchase event listeners
    itemsGrid.querySelectorAll('.purchase-btn:not([disabled])').forEach(button => {
      const itemId = button.getAttribute('data-id');
      
      // Directly bind purchase to avoid issues
      button.addEventListener('click', () => {
        const item = this.shopItems.find(i => i.id === itemId);
        if (item) this.purchaseItem(item);
      });
    });
  },
  
  // Get formatted effect text
  getEffectText: function(item) {
    if (item.type === 'relic' || item.itemType === 'relic') {
      return `Passive: ${item.description}`;
    } else {
      return `Effect: ${item.description}`;
    }
  },
  
  // Add condensed styles
  addStyles: function() {
    if (document.getElementById('improved-shop-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'improved-shop-styles';
    styleEl.textContent = `
      /* Condensed shop styles */
      .shop-category-header {
        background-color: #2a2a36;
        padding: 8px 12px;
        margin: 15px 0 10px 0;
        color: #f0c866;
        font-weight: bold;
        border-left: 3px solid #f0c866;
      }
      
      .shop-items-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .shop-item {
        background-color: #1e2032;
        border-radius: 5px;
        overflow: hidden;
        transition: transform 0.2s;
      }
      
      .shop-item:hover {
        transform: translateY(-3px);
      }
      
      .shop-item-header {
        background-color: rgba(0,0,0,0.2);
        padding: 8px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .item-name {
        font-weight: bold;
        color: white;
      }
      
      .item-price {
        background-color: #5b8dd9;
        padding: 3px 6px;
        border-radius: 3px;
        font-size: 12px;
      }
      
      .item-price.cannot-afford {
        background-color: #e67e73;
        text-decoration: line-through;
      }
      
      .shop-item-body {
        padding: 10px;
      }
      
      .item-rarity {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        text-transform: capitalize;
        margin-bottom: 8px;
        background-color: rgba(0,0,0,0.2);
      }
      
      .item-rarity.common { color: #aaa; }
      .item-rarity.uncommon { color: #5b8dd9; }
      .item-rarity.rare { color: #9c77db; }
      .item-rarity.epic { color: #f0c866; }
      
      .item-description {
        font-size: 12px;
        margin-bottom: 8px;
        line-height: 1.4;
      }
      
      .item-effect {
        font-size: 12px;
        background-color: rgba(0,0,0,0.2);
        padding: 6px;
        border-radius: 3px;
        color: #5b8dd9;
      }
      
      .shop-item-footer {
        padding: 10px;
        background-color: rgba(0,0,0,0.2);
      }
      
      .purchase-btn {
        width: 100%;
        padding: 8px;
        border: none;
        background-color: #5b8dd9;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;
        font-size: 13px;
      }
      
      .purchase-btn:hover {
        background-color: #4a7cc7;
      }
      
      .purchase-btn.cannot-afford {
        background-color: #e67e73;
        cursor: not-allowed;
        opacity: 0.7;
      }
      
      .empty-shop-message {
        text-align: center;
        padding: 20px;
        color: #888;
        font-style: italic;
      }
    `;
    
    document.head.appendChild(styleEl);
  },
  
  // Get player insight
  getPlayerInsight: function() {
    return window.GameState?.data?.character?.insight || 0;
  },
  
  // Purchase item with improved reliability
  purchaseItem: function(item) {
    const insight = this.getPlayerInsight();
    
    if (insight < item.price) {
      this.showToast("Not enough insight to purchase this item", "warning");
      return;
    }
    
    // Deduct insight
    if (window.GameState && GameState.data && GameState.data.character) {
      // Create full item object
      const fullItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        itemType: item.type || item.itemType,
        iconPath: item.iconPath,
        effect: {
          type: this.getEffectType(item),
          value: item.description,
          duration: (item.type === "relic" || item.itemType === "relic") ? "permanent" : "instant"
        }
      };
      
      // First add to inventory to ensure it works
      if (window.InventorySystem && typeof InventorySystem.addItem === 'function') {
        const added = InventorySystem.addItem(fullItem);
        
        if (!added) {
          this.showToast("Failed to add item to inventory. It may be full.", "warning");
          return;
        }
      } else {
        // Fallback to direct inventory manipulation
        if (!GameState.data.inventory) {
          GameState.data.inventory = [];
        }
        GameState.data.inventory.push(fullItem);
        
        // Save inventory
        if (window.ApiClient && typeof ApiClient.saveInventory === 'function') {
          ApiClient.saveInventory({ inventory: GameState.data.inventory });
        }
      }
      
      // Now deduct the insight after successful addition
      GameState.data.character.insight -= item.price;
      
      // Update display
      const currencyElement = document.getElementById('shop-currency');
      if (currencyElement) {
        currencyElement.textContent = this.getPlayerInsight();
      }
      
      // Show feedback
      this.showToast(`Purchased ${item.name}!`, "success");
      
      // Refresh display
      this.renderItems();
      
      // Emit events to update UI
      if (window.EventSystem) {
        EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
        EventSystem.emit(GAME_EVENTS.ITEM_ADDED_SUCCESS, fullItem);
      }
    }
  },
  
  // Get effect type based on item ID
  getEffectType: function(item) {
    const id = item.id.toLowerCase();
    
    if (id.includes('textbook')) return "eliminateOption";
    if (id.includes('badge') || id.includes('heal')) return "heal";
    if (id.includes('goggles') || id.includes('spectacles')) return "second_chance";
    if (id.includes('insight')) return "insight_gain";
    
    // Default fallback
    return "special";
  },
  
  // Show toast message
  showToast: function(message, type) {
    if (window.UiUtils && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(message, type);
    } else {
      alert(message);
    }
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Shop component handling action: ${action}`, data);
    
    switch (action) {
      case 'continue':
        this.completeNode(nodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  },
  
  // Complete the node with improved reliability
  completeNode: function(nodeData) {
    console.log("Completing shop node", nodeData);
    
    // Mark node as visited - try multiple approaches for reliability
    if (window.NodeInteraction && typeof NodeInteraction.completeNode === 'function') {
      NodeInteraction.completeNode(nodeData);
    } else if (window.ApiClient && typeof ApiClient.markNodeVisited === 'function') {
      ApiClient.markNodeVisited(nodeData.id)
        .then(() => {
          console.log("Node marked as visited via API");
          // Ensure we return to map view
          this.showMapView();
        })
        .catch(err => {
          console.error("Error marking node as visited:", err);
          // Try to show map anyway
          this.showMapView();
        });
    } else {
      console.warn("No method found to mark node as visited");
      // Try to show map anyway
      this.showMapView();
    }
  },
  
  // Show map view with multiple fallbacks for reliability
  showMapView: function() {
    console.log("Attempting to show map view");
    
    // Try multiple methods to ensure we can return to the map
    if (window.UI && typeof UI.showMapView === 'function') {
      UI.showMapView();
    } else {
      // Try to find the map container and show it directly
      const mapContainer = document.querySelector('.map-container');
      if (mapContainer) {
        mapContainer.style.display = 'block';
      }
      
      // Hide modal if present
      const modal = document.getElementById('node-modal-overlay');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Hide all interaction containers
      document.querySelectorAll('.interaction-container').forEach(el => {
        el.style.display = 'none';
      });
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('shop', ShopComponent);
}