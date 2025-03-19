// shop_component.js - Simple implementation with no syntax errors

const ShopComponent = {
  // Initialize component
  initialize: function() {
    console.log("Initializing shop component");
    this.itemsLoaded = false;
    this.shopItems = [];
  },
  
  // Render the shop to exactly match your screenshot
  render: function(nodeData, container) {
    console.log("Rendering shop component", nodeData);
    
    // Create shop structure to match your screenshot
    container.innerHTML = `
      <div class="shop-panel">
        <div class="shop-header">
          <h3>Department Store</h3>
          <div class="insight-bar">
            <span>Available Insight:</span>
            <span id="shop-currency" style="color: #f0c866; font-weight: bold;">${this.getPlayerInsight()}</span>
          </div>
        </div>
        
        <p style="color: #b8c7e0; margin-bottom: 15px;">Browse and purchase items using your insight points.</p>
        
        <div id="shop-items-container">
          <div style="text-align: center; padding: 20px;">
            Loading items...
          </div>
        </div>
        
        <button id="shop-continue-btn" style="background-color: #56b886; color: white; border: none; width: 100%; padding: 12px; font-size: 16px; letter-spacing: 1px; cursor: pointer; margin-top: 15px; font-weight: bold;">
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
  
  // Add dedicated styles for shop component
  addStyles: function() {
    if (document.getElementById('shop-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'shop-styles';
    styleEl.textContent = `
      /* Main shop styling to match your screenshot */
      .shop-panel {
        background-color: #1a1c2e;
        border: 2px solid #5b8dd9;
        padding: 15px;
        color: #fff;
      }
      
      .shop-header {
        margin-bottom: 15px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .shop-header h3 {
        color: #5b8dd9;
        font-size: 24px;
        margin: 0;
        font-weight: bold;
      }
      
      /* Insight display in top right */
      .insight-bar {
        color: #ffffff;
        font-weight: bold;
      }
      
      #shop-currency {
        color: #f0c866;
        font-weight: bold;
      }
      
      /* Shop description */
      .shop-description {
        margin-bottom: 20px;
        color: #b8c7e0;
        text-align: center;
      }
      
      /* Section titles for consumables and relics */
      .section-title {
        color: #f0c866;
        font-size: 18px;
        margin: 15px 0 10px 0;
        font-weight: bold;
      }
      
      /* Leave shop button */
      #shop-continue-btn {
        background-color: #56b886;
        color: white;
        border: none;
        padding: 12px;
        font-size: 16px;
        font-weight: bold;
        letter-spacing: 1px;
        cursor: pointer;
        text-align: center;
        margin-top: 15px;
      }
      
      #shop-continue-btn:hover {
        background-color: #48a375;
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
        type: "consumable",
        itemType: "consumable" // Added for compatibility
      },
      {
        id: "radiation_badge",
        name: "Radiation Badge",
        description: "Restores 1 life point",
        price: 50,
        rarity: "rare",
        iconPath: "Nametag.png",
        type: "consumable",
        itemType: "consumable" // Added for compatibility
      },
      {
        id: "quantum_goggles",
        name: "Schrödinger's Spectacles",
        description: "Allows a second attempt at questions",
        price: 80,
        rarity: "epic",
        iconPath: "3D Glasses.png",
        type: "relic",
        itemType: "relic" // Added for compatibility
      }
    ];
    
    console.log("Created shop items:", items);
    // Debug check for relics
    const relics = items.filter(item => item.type === 'relic' || item.itemType === 'relic');
    console.log("Filtered relics:", relics);
    
    this.shopItems = items;
    this.itemsLoaded = true;
    this.renderItems();
  },
  
  // Render items
  renderItems: function() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create sections with styled headers matching your UI
    container.innerHTML = `
      <div style="color: #f0c866; font-size: 18px; margin-bottom: 10px;">Consumable Items</div>
      <div id="consumables-container"></div>
      <div style="color: #f0c866; font-size: 18px; margin: 15px 0 10px 0;">Rare Relics</div>
      <div id="relics-container" style="margin-bottom: 15px;"></div>
    `;
    
    const consumablesContainer = document.getElementById('consumables-container');
    const relicsContainer = document.getElementById('relics-container');
    
    // Debug check
    console.log("Rendering items, containers:", {
      consumablesContainer: !!consumablesContainer,
      relicsContainer: !!relicsContainer
    });
    
    let consumableCount = 0;
    let relicCount = 0;
    
    // Render each item
    this.shopItems.forEach(item => {
      // Determine if item is a relic (checking both properties for compatibility)
      const isRelic = item.type === 'relic' || item.itemType === 'relic';
      console.log(`Processing item: ${item.name}, isRelic: ${isRelic}`);
      
      const itemEl = document.createElement('div');
      itemEl.className = 'shop-item';
      itemEl.style.backgroundColor = '#1e2032';
      itemEl.style.padding = '15px';
      itemEl.style.marginBottom = '10px';
      itemEl.style.borderRadius = '5px';
      
      const canAfford = this.getPlayerInsight() >= item.price;
      
      // Change color based on rarity
      let nameColor = '#ffffff';
      if (item.rarity === 'uncommon') nameColor = '#5b8dd9';
      if (item.rarity === 'rare') nameColor = '#9c77db';
      if (item.rarity === 'epic') nameColor = '#f0c866';
      
      itemEl.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px; color: ${nameColor}; font-weight: bold;">${item.name}</div>
        <div style="width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; background-color: #12141d; margin: 0 auto 15px auto; border-radius: 5px;">
          <img src="/static/img/items/${item.iconPath}" alt="${item.name}" style="max-width: 48px; max-height: 48px; image-rendering: pixelated;">
        </div>
        <button style="width: 100%; padding: 8px; background-color: ${canAfford ? '#56b886' : '#777777'}; color: white; border: none; border-radius: 5px; cursor: pointer; text-align: center; font-weight: bold;">
          ${item.price} INSIGHT
        </button>
      `;
      
      // Add purchase button event
      const purchaseBtn = itemEl.querySelector('button');
      if (purchaseBtn && canAfford) {
        purchaseBtn.addEventListener('click', () => {
          this.purchaseItem(item);
        });
      }
      
      // Add to appropriate container based on type
      if (isRelic) {
        if (relicsContainer) {
          relicsContainer.appendChild(itemEl);
          relicCount++;
        } else {
          console.error("Relics container not found");
        }
      } else {
        if (consumablesContainer) {
          consumablesContainer.appendChild(itemEl);
          consumableCount++;
        } else {
          console.error("Consumables container not found");
        }
      }
    });
    
    console.log(`Rendered ${consumableCount} consumables and ${relicCount} relics`);
    
    // Add message if no relics are shown
    if (relicCount === 0 && relicsContainer) {
      relicsContainer.innerHTML = `
        <div style="text-align: center; padding: 15px; color: #9c77db;">
          No relics available at this time
        </div>
      `;
    }
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