// shop_component.js - Simple implementation with no syntax errors

const ShopComponent = {
  // Initialize component
  initialize: function() {
    console.log("Initializing shop component");
    this.itemsLoaded = false;
    this.shopItems = [];
  },
  
  // Render the shop
  render: function(nodeData, container) {
    console.log("Rendering shop component", nodeData);
    
    // Create basic shop structure
    container.innerHTML = `
      <div class="game-panel shop-panel">
        <div class="shop-header">
          <h3>Department Store</h3>
          <div class="insight-bar">
            <span>Available Insight:</span>
            <span id="shop-currency">${this.getPlayerInsight()}</span>
          </div>
        </div>
        
        <p class="shop-description">Browse and purchase items using your insight points.</p>
        
        <div id="shop-items-container">
          <div class="loading-indicator">
            Loading items...
          </div>
        </div>
        
        <button id="shop-continue-btn" class="btn btn-success w-100 mt-3">
          LEAVE SHOP
        </button>
      </div>
    `;
    
    // Add basic styles
    this.addStyles();
    
    // Add continue button event listener
    const continueBtn = document.getElementById('shop-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.completeNode(nodeData);
      });
    }
    
    // Load items
    this.loadItems();
  },
  
  // Add basic styles
  addStyles: function() {
    if (document.getElementById('shop-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'shop-styles';
    styleEl.textContent = `
      .shop-panel {
        background-color: #1a1c2e;
        border: 2px solid #5b8dd9;
        padding: 15px;
        color: #fff;
      }
      
      .shop-header {
        margin-bottom: 15px;
      }
      
      .shop-header h3 {
        color: #5b8dd9;
        margin-bottom: 10px;
        text-align: center;
      }
      
      .insight-bar {
        background-color: #252a3d;
        padding: 10px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      #shop-currency {
        color: #f0c866;
        font-weight: bold;
      }
      
      .shop-item {
        background-color: #252a3d;
        border-radius: 6px;
        margin-bottom: 10px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .item-name {
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
      }
      
      .item-icon {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        margin-bottom: 10px;
      }
      
      .item-icon img {
        max-width: 48px;
        max-height: 48px;
        image-rendering: pixelated;
      }
      
      .purchase-btn {
        width: 100%;
        padding: 8px;
        background-color: #56b886;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
      }
      
      .rare {
        color: #9c77db;
      }
      
      .uncommon {
        color: #5b8dd9;
      }
      
      .epic {
        color: #f0c866;
      }
    `;
    
    document.head.appendChild(styleEl);
  },
  
  // Load items
  loadItems: function() {
    // Create static items
    const items = [
      {
        id: "medical_textbook",
        name: "Medical Physics Textbook",
        description: "Eliminates one incorrect answer option",
        price: 30,
        rarity: "uncommon",
        iconPath: "Notebook.png",
        type: "consumable"
      },
      {
        id: "radiation_badge",
        name: "Radiation Badge",
        description: "Restores 1 life point",
        price: 50,
        rarity: "rare",
        iconPath: "Nametag.png",
        type: "consumable"
      },
      {
        id: "quantum_goggles",
        name: "Schrödinger's Spectacles",
        description: "Allows a second attempt at questions",
        price: 80,
        rarity: "epic",
        iconPath: "3D Glasses.png",
        type: "relic"
      }
    ];
    
    this.shopItems = items;
    this.itemsLoaded = true;
    this.renderItems();
  },
  
  // Render items
  renderItems: function() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create sections
    container.innerHTML = `
      <div class="section-title">Consumable Items</div>
      <div id="consumables-container"></div>
      <div class="section-title mt-3">Rare Relics</div>
      <div id="relics-container"></div>
    `;
    
    const consumablesContainer = document.getElementById('consumables-container');
    const relicsContainer = document.getElementById('relics-container');
    
    // Render each item
    this.shopItems.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'shop-item';
      
      const canAfford = this.getPlayerInsight() >= item.price;
      
      itemEl.innerHTML = `
        <div class="item-name ${item.rarity}">${item.name}</div>
        <div class="item-icon">
          <img src="/static/img/items/${item.iconPath}" alt="${item.name}">
        </div>
        <button class="purchase-btn" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
          ${item.price} INSIGHT
        </button>
      `;
      
      // Add purchase button event
      const purchaseBtn = itemEl.querySelector('.purchase-btn');
      if (purchaseBtn && canAfford) {
        purchaseBtn.addEventListener('click', () => {
          this.purchaseItem(item);
        });
      }
      
      // Add to appropriate container
      if (item.type === 'relic') {
        relicsContainer.appendChild(itemEl);
      } else {
        consumablesContainer.appendChild(itemEl);
      }
    });
  },
  
  // Get player insight
  getPlayerInsight: function() {
    return window.GameState?.data?.character?.insight || 0;
  },
  
  // Purchase item
  purchaseItem: function(item) {
    const insight = this.getPlayerInsight();
    
    if (insight < item.price) {
      alert("Not enough insight!");
      return;
    }
    
    // Deduct insight
    if (window.GameState && GameState.data && GameState.data.character) {
      GameState.data.character.insight -= item.price;
      
      // Add item to inventory
      if (!GameState.data.inventory) {
        GameState.data.inventory = [];
      }
      
      // Create full item object
      const fullItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        itemType: item.type,
        iconPath: item.iconPath,
        effect: {
          type: item.id === "medical_textbook" ? "eliminateOption" : 
                item.id === "radiation_badge" ? "heal" : "second_chance",
          value: item.description,
          duration: item.type === "relic" ? "permanent" : "instant"
        }
      };
      
      // Add to inventory
      GameState.data.inventory.push(fullItem);
      
      // Update display
      const currencyElement = document.getElementById('shop-currency');
      if (currencyElement) {
        currencyElement.textContent = this.getPlayerInsight();
      }
      
      alert(`Purchased ${item.name}!`);
      
      // Refresh display
      this.renderItems();
    }
  },
  
  // Complete the node
  completeNode: function(nodeData) {
    // Mark node as visited
    if (window.NodeInteraction && typeof NodeInteraction.completeNode === 'function') {
      NodeInteraction.completeNode(nodeData);
    } else if (window.ApiClient && typeof ApiClient.markNodeVisited === 'function') {
      ApiClient.markNodeVisited(nodeData.id);
    }
    
    // Show the map
    if (window.UI && typeof UI.showMapView === 'function') {
      UI.showMapView();
    }
  }
};

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('shop', ShopComponent);
}