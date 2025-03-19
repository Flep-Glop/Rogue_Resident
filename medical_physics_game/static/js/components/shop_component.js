// shop_component.js - Enhanced component with limited stock and better layout

const ShopComponent = ComponentUtils.createComponent('shop', {
  // Initialize component
  initialize: function() {
    console.log("Initializing enhanced shop component");
    this.itemsLoaded = false;
    this.shopItems = [];
    this.completedFlag = false; // Track if this node has been completed
    this.purchasedItems = new Set(); // Track which items have been purchased
    this.stockLimit = {
      consumables: 2, // Number of consumable items to show
      relics: 1       // Number of relics to show
    };
  },
  
  // Render the shop with improved UI
  render: function(nodeData, container) {
    console.log("Rendering shop component", nodeData);
    
    // Reset completion flag
    this.completedFlag = false;
    
    // Create shop structure with better layout
    container.innerHTML = `
      <div class="game-panel anim-fade-in">
        <div class="shop-header">
          <div class="shop-title-container">
            <h3 class="game-panel__title">Department Store</h3>
            <p class="shop-description">Purchase items using your insight points.</p>
          </div>
          <div class="insight-display">
            <span>Insight:</span>
            <span class="insight-value" id="shop-currency">${this.getPlayerInsight()}</span>
          </div>
        </div>
        
        <div id="shop-items-container" class="shop-items-container">
          <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Stocking shelves...</p>
          </div>
        </div>
        
        <button id="shop-continue-btn" class="game-btn game-btn--secondary game-btn--block mt-md">
          LEAVE SHOP
        </button>
      </div>
    `;
    
    // Add shop-specific styles
    this.addEnhancedStyles();
    
    // Bind action using ComponentUtils for reliability
    this.bindAction('shop-continue-btn', 'click', 'continue', { nodeData });
    
    // Load a finite selection of items
    this.loadLimitedStock();
  },
  
  // Load a limited selection of items for the shop
  loadLimitedStock: function() {
    console.log("Loading limited shop stock");
    
    // Try to load from API first
    if (window.ApiClient && typeof ApiClient.getRandomItems === 'function') {
      // Get consumables
      ApiClient.getRandomItems(this.stockLimit.consumables)
        .then(items => {
          if (Array.isArray(items) && items.length > 0) {
            this.shopItems = items.map(item => ({
              ...item,
              price: this.calculateItemPrice(item),
              itemType: item.itemType || 'consumable' // Ensure itemType is set
            }));
            
            // Then get relics
            if (window.ApiClient && typeof ApiClient.getRandomRelics === 'function') {
              return ApiClient.getRandomRelics(this.stockLimit.relics);
            } else {
              return this.getDefaultRelics();
            }
          } else {
            throw new Error("No items returned from API");
          }
        })
        .then(relics => {
          if (Array.isArray(relics) && relics.length > 0) {
            // Add relics to shop items
            this.shopItems = [
              ...this.shopItems,
              ...relics.map(relic => ({
                ...relic,
                price: this.calculateItemPrice(relic),
                itemType: 'relic' // Ensure itemType is set
              }))
            ];
          }
          
          this.itemsLoaded = true;
          this.renderEnhancedItems();
        })
        .catch(error => {
          console.error("Error loading items from API:", error);
          this.useDefaultItems();
        });
    } else {
      this.useDefaultItems();
    }
  },
  
  // Use default items if API fails
  useDefaultItems: function() {
    console.log("Using default shop items");
    
    // Create static items guaranteed to work
    const items = [
      {
        id: "medical_textbook",
        name: "Medical Physics Textbook",
        description: "Eliminates one incorrect answer option",
        price: 30,
        rarity: "uncommon",
        iconPath: "Notebook.png",
        itemType: "consumable"
      },
      {
        id: "radiation_badge",
        name: "Radiation Badge",
        description: "Restores 1 life point",
        price: 50,
        rarity: "rare",
        iconPath: "Nametag.png",
        itemType: "consumable"
      },
      {
        id: "quantum_goggles",
        name: "Schrödinger's Spectacles",
        description: "Allows a second attempt at questions",
        price: 80,
        rarity: "epic",
        iconPath: "3D Glasses.png",
        itemType: "relic"
      }
    ];
    
    // Select a limited number of items
    const consumables = items
      .filter(item => item.itemType === 'consumable')
      .slice(0, this.stockLimit.consumables);
      
    const relics = items
      .filter(item => item.itemType === 'relic')
      .slice(0, this.stockLimit.relics);
    
    this.shopItems = [...consumables, ...relics];
    this.itemsLoaded = true;
    this.renderEnhancedItems();
  },
  
  // Get default relics if API fails
  getDefaultRelics: function() {
    return [
      {
        id: "quantum_goggles",
        name: "Schrödinger's Spectacles",
        description: "Allows a second attempt at questions",
        rarity: "epic",
        iconPath: "3D Glasses.png",
        itemType: "relic"
      }
    ];
  },
  
  // Calculate item price based on rarity and player progress
  calculateItemPrice: function(item) {
    let basePrice = 0;
    
    // Set base price by rarity
    switch (item.rarity) {
      case 'common': basePrice = 20; break;
      case 'uncommon': basePrice = 35; break;
      case 'rare': basePrice = 60; break;
      case 'epic': basePrice = 90; break;
      default: basePrice = 30;
    }
    
    // Adjust by floor if available
    if (window.GameState && GameState.data) {
      const currentFloor = GameState.data.currentFloor || 1;
      basePrice = Math.round(basePrice * (1 + (currentFloor - 1) * 0.1));
    }
    
    // Add some minor randomization
    const variance = Math.floor(basePrice * 0.1);
    return basePrice + Math.floor(Math.random() * variance * 2) - variance;
  },
  
  // Render items with enhanced layout
  renderEnhancedItems: function() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Group items by type
    const consumables = this.shopItems.filter(item => 
      item.itemType === 'consumable');
    
    const relics = this.shopItems.filter(item => 
      item.itemType === 'relic');
    
    // Create sections for each type
    if (consumables.length > 0) {
      const consumablesSection = document.createElement('div');
      consumablesSection.className = 'shop-section';
      
      const sectionTitle = document.createElement('h4');
      sectionTitle.className = 'shop-section-title';
      sectionTitle.textContent = 'Consumable Items';
      consumablesSection.appendChild(sectionTitle);
      
      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'shop-items-grid';
      
      // Add each consumable item
      consumables.forEach(item => {
        const itemCard = this.createItemCard(item);
        itemsGrid.appendChild(itemCard);
      });
      
      consumablesSection.appendChild(itemsGrid);
      container.appendChild(consumablesSection);
    }
    
    // Add relics section
    if (relics.length > 0) {
      const relicsSection = document.createElement('div');
      relicsSection.className = 'shop-section';
      
      const sectionTitle = document.createElement('h4');
      sectionTitle.className = 'shop-section-title';
      sectionTitle.textContent = 'Powerful Relics';
      relicsSection.appendChild(sectionTitle);
      
      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'shop-items-grid';
      
      // Add each relic
      relics.forEach(item => {
        const itemCard = this.createItemCard(item);
        itemsGrid.appendChild(itemCard);
      });
      
      relicsSection.appendChild(itemsGrid);
      container.appendChild(relicsSection);
    }
    
    // If no items at all
    if (this.shopItems.length === 0) {
      container.innerHTML = `
        <div class="empty-shop-message">
          <p>The shop is sold out. No items available for purchase.</p>
        </div>
      `;
    }
  },
  
  // Create an item card
  createItemCard: function(item) {
    const canAfford = this.getPlayerInsight() >= item.price;
    const isPurchased = this.purchasedItems.has(item.id);
    const isInInventory = this.isItemInInventory(item);
    
    const card = document.createElement('div');
    card.className = `shop-item-card rarity-${item.rarity || 'common'} ${isPurchased ? 'purchased' : ''} ${isInInventory ? 'in-inventory' : ''}`;
    
    let buttonText = canAfford ? 'Purchase' : 'Not enough insight';
    let buttonClass = 'purchase-btn';
    let buttonDisabled = !canAfford;
    
    if (isPurchased) {
      buttonText = 'Sold Out';
      buttonClass += ' sold-out';
      buttonDisabled = true;
    } else if (isInInventory && item.itemType === 'relic') {
      buttonText = 'Already Owned';
      buttonClass += ' already-owned';
      buttonDisabled = true;
    }
    
    // Create card content
    card.innerHTML = `
      <div class="card-header">
        <h4 class="item-name">${item.name}</h4>
        <div class="item-price ${!canAfford ? 'cannot-afford' : ''}">${item.price}</div>
      </div>
      <div class="card-body">
        <div class="item-details">
          <div class="item-icon-container">
            <div class="item-icon ${item.rarity || 'common'}">
              ${this.getItemIcon(item)}
            </div>
          </div>
          <div class="item-info">
            <div class="item-rarity">${item.rarity || 'common'}</div>
            <div class="item-description">${item.description}</div>
          </div>
        </div>
        ${item.itemType === 'relic' ? 
          `<div class="item-passive">
            <span class="passive-label">Passive Effect</span>
          </div>` : ''}
      </div>
      <div class="card-footer">
        <button class="${buttonClass}" 
                data-id="${item.id}" 
                ${buttonDisabled ? 'disabled' : ''}>
          ${buttonText}
        </button>
      </div>
    `;
    
    // Add purchase event listener if not disabled
    if (!buttonDisabled) {
      const button = card.querySelector('.purchase-btn');
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.purchaseItem(item);
        });
      }
    }
    
    return card;
  },
  
  // Check if an item is already in the player's inventory
  isItemInInventory: function(item) {
    if (!window.GameState || !GameState.data || !GameState.data.inventory) {
      return false;
    }
    
    return GameState.data.inventory.some(invItem => 
      invItem.id === item.id &&
      (item.itemType === 'relic' ? invItem.itemType === 'relic' : true)
    );
  },
  
  // Get item icon HTML
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="item-image">`;
    }
    
    // Fallback icon based on item type
    const iconName = this.getIconName(item);
    return `<img src="/static/img/items/${iconName}.png" alt="${item.name}" class="item-image">`;
  },
  
  // Get icon name based on item properties
  getIconName: function(item) {
    const itemName = (item.name || '').toLowerCase();
    
    if (itemName.includes('textbook') || itemName.includes('book'))
      return 'Textbook';
    if (itemName.includes('badge'))
      return 'Nametag';
    if (itemName.includes('goggles') || itemName.includes('spectacles') || itemName.includes('glasses'))
      return '3D Glasses';
    
    // Default fallback
    return item.itemType === 'relic' ? 'USB Stick' : 'Yellow Sticky Note';
  },
  
  // Purchase item with improved reliability
  purchaseItem: function(item) {
    console.log("Attempting to purchase item:", item);
    
    // Verify insight
    const insight = this.getPlayerInsight();
    if (insight < item.price) {
      this.showToast("Not enough insight to purchase this item", "warning");
      return;
    }
    
    // Verify item isn't already purchased or in inventory (for relics)
    if (this.purchasedItems.has(item.id)) {
      this.showToast("This item is already sold out", "warning");
      return;
    }
    
    if (item.itemType === 'relic' && this.isItemInInventory(item)) {
      this.showToast("You already own this relic", "warning");
      return;
    }
    
    // Create full item object with complete attributes
    const fullItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      rarity: item.rarity,
      itemType: item.itemType,
      iconPath: item.iconPath,
      effect: {
        type: this.getEffectType(item),
        value: item.description,
        duration: (item.itemType === "relic") ? "permanent" : "instant"
      }
    };
    
    if (item.itemType === 'relic') {
      fullItem.passiveText = `Passive: ${item.description}`;
    }
    
    // Add to inventory with proper error handling
    let added = false;
    
    try {
      // First check if window.ItemManager exists
      if (window.ItemManager && typeof ItemManager.addItem === 'function') {
        // Initialize ItemManager if needed
        if (typeof ItemManager.initialize === 'function') {
          ItemManager.initialize();
        }
        added = ItemManager.addItem(fullItem);
      } else if (window.InventorySystem && typeof InventorySystem.addItem === 'function') {
        added = InventorySystem.addItem(fullItem);
      } else {
        // Direct fallback if no system is available
        if (!window.GameState || !GameState.data) {
          throw new Error("GameState not available");
        }
        
        if (!GameState.data.inventory) {
          GameState.data.inventory = [];
        }
        
        // Check for existing item before adding
        const exists = GameState.data.inventory.some(i => i.id === fullItem.id);
        if (exists && item.itemType === 'relic') {
          throw new Error("Relic already in inventory");
        }
        
        // Add the item
        GameState.data.inventory.push(fullItem);
        added = true;
        
        // Save inventory
        if (window.ApiClient && typeof ApiClient.saveInventory === 'function') {
          ApiClient.saveInventory({ inventory: GameState.data.inventory })
            .catch(err => console.error("Error saving inventory:", err));
        }
      }
    } catch (error) {
      console.error("Error adding item to inventory:", error);
      this.showToast(`Error: ${error.message || "Failed to add item to inventory"}`, "danger");
      return;
    }
    
    if (!added) {
      this.showToast("Failed to add item to inventory. It may be full.", "warning");
      return;
    }
    
    // If we get here, item was successfully added. Now update insight
    if (window.GameState && GameState.data && GameState.data.character) {
      GameState.data.character.insight -= item.price;
      
      // Update display
      const currencyElement = document.getElementById('shop-currency');
      if (currencyElement) {
        currencyElement.textContent = this.getPlayerInsight();
      }
      
      // Mark as purchased
      this.purchasedItems.add(item.id);
      
      // Show feedback
      this.showToast(`Purchased ${item.name}!`, "success");
      
      // Refresh display
      this.renderEnhancedItems();
      
      // Emit events to update UI
      if (window.EventSystem) {
        EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
      }
    }
  },
  
  // Get effect type based on item ID and description
  getEffectType: function(item) {
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
  
  // Get player insight
  getPlayerInsight: function() {
    return window.GameState?.data?.character?.insight || 0;
  },
  
  // Show toast message
  showToast: function(message, type) {
    if (window.UiUtils && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(message, type);
    } else {
      alert(message);
    }
  },
  
  // Add enhanced shop styles
  addEnhancedStyles: function() {
    if (document.getElementById('enhanced-shop-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'enhanced-shop-styles';
    styleEl.textContent = `
      /* Enhanced Shop Styles */
      .shop-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid rgba(91, 141, 217, 0.3);
      }
      
      .shop-title-container {
        flex: 1;
      }
      
      .shop-description {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        margin-top: 5px;
      }
      
      .insight-display {
        background-color: #222233;
        padding: 8px 12px;
        border-radius: 5px;
        border: 1px solid rgba(91, 141, 217, 0.5);
        font-weight: bold;
      }
      
      .insight-value {
        color: #f0c866;
        margin-left: 5px;
      }
      
      .shop-items-container {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 20px;
        scrollbar-width: thin;
        scrollbar-color: rgba(91, 141, 217, 0.5) #222233;
        padding-right: 5px;
      }
      
      .shop-items-container::-webkit-scrollbar {
        width: 8px;
      }
      
      .shop-items-container::-webkit-scrollbar-track {
        background: #222233;
        border-radius: 4px;
      }
      
      .shop-items-container::-webkit-scrollbar-thumb {
        background-color: rgba(91, 141, 217, 0.5);
        border-radius: 4px;
      }
      
      .shop-section {
        margin-bottom: 20px;
      }
      
      .shop-section-title {
        color: #5b8dd9;
        font-size: 16px;
        margin-bottom: 10px;
        padding-left: 8px;
        border-left: 3px solid #5b8dd9;
      }
      
      .shop-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
      }
      
      .shop-item-card {
        background-color: #1e1e2a;
        border-radius: 6px;
        overflow: hidden;
        transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        border-left: 4px solid gray;
      }
      
      .shop-item-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
      }
      
      .shop-item-card.purchased {
        opacity: 0.6;
        filter: grayscale(0.8);
      }
      
      .shop-item-card.in-inventory.rarity-epic {
        box-shadow: 0 0 10px rgba(240, 200, 102, 0.3);
      }
      
      .card-header {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .item-name {
        font-weight: bold;
        color: white;
        font-size: 14px;
        margin: 0;
      }
      
      .item-price {
        background-color: #5b8dd9;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        color: white;
        font-weight: bold;
      }
      
      .item-price.cannot-afford {
        background-color: #e67e73;
        text-decoration: line-through;
      }
      
      .card-body {
        padding: 12px;
        flex: 1;
      }
      
      .item-details {
        display: flex;
        gap: 12px;
        margin-bottom: 10px;
      }
      
      .item-icon-container {
        width: 64px;
        height: 64px;
        flex-shrink: 0;
      }
      
      .item-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #2a2a36;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .item-icon.common {
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
      }
      
      .item-icon.uncommon {
        box-shadow: 0 0 8px rgba(91, 141, 217, 0.3);
      }
      
      .item-icon.rare {
        box-shadow: 0 0 8px rgba(156, 119, 219, 0.3);
      }
      
      .item-icon.epic {
        box-shadow: 0 0 12px rgba(240, 200, 102, 0.3);
        animation: epic-glow 2s infinite;
      }
      
      @keyframes epic-glow {
        0% { box-shadow: 0 0 8px rgba(240, 200, 102, 0.3); }
        50% { box-shadow: 0 0 14px rgba(240, 200, 102, 0.5); }
        100% { box-shadow: 0 0 8px rgba(240, 200, 102, 0.3); }
      }
      
      .item-image {
        max-width: 80%;
        max-height: 80%;
        object-fit: contain;
        image-rendering: pixelated;
      }
      
      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .item-rarity {
        text-transform: capitalize;
        font-size: 12px;
        margin-bottom: 6px;
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        background-color: rgba(0, 0, 0, 0.2);
      }
      
      .item-description {
        font-size: 13px;
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .item-passive {
        background-color: rgba(0, 0, 0, 0.15);
        padding: 8px;
        border-radius: 4px;
        border-left: 3px solid #f0c866;
        margin-top: 8px;
      }
      
      .passive-label {
        color: #f0c866;
        font-size: 12px;
        font-weight: bold;
      }
      
      .card-footer {
        padding: 10px 12px;
        background-color: rgba(0, 0, 0, 0.2);
      }
      
      .purchase-btn {
        width: 100%;
        padding: 8px 12px;
        border: none;
        background-color: #5b8dd9;
        color: white;
        font-weight: bold;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .purchase-btn:hover {
        background-color: #4a7cc7;
      }
      
      .purchase-btn:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
      
      .purchase-btn.cannot-afford {
        background-color: #e67e73;
      }
      
      .purchase-btn.sold-out {
        background-color: #777;
      }
      
      .purchase-btn.already-owned {
        background-color: #5a5a72;
      }
      
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(91, 141, 217, 0.3);
        border-top: 3px solid #5b8dd9;
        border-radius: 50%;
        margin-bottom: 10px;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .empty-shop-message {
        text-align: center;
        padding: 30px;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
      }
      
      /* Rarity-based styling */
      .rarity-common {
        border-left-color: #aaa;
      }
      
      .rarity-uncommon {
        border-left-color: #5b8dd9;
      }
      
      .rarity-uncommon .item-rarity {
        color: #5b8dd9;
      }
      
      .rarity-rare {
        border-left-color: #9c77db;
      }
      
      .rarity-rare .item-rarity {
        color: #9c77db;
      }
      
      .rarity-epic {
        border-left-color: #f0c866;
      }
      
      .rarity-epic .item-rarity {
        color: #f0c866;
      }
    `;
    
    document.head.appendChild(styleEl);
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
  
  // Complete the node with enhanced reliability
  completeNode: function(nodeData) {
    console.log("Completing shop node", nodeData);
    
    // Prevent multiple completions of the same node
    if (this.completedFlag) {
      console.log("Node already completed, ignoring duplicate completion attempt");
      return this.showMapView();
    }
    
    // Mark as completed locally
    this.completedFlag = true;
    
    // Ensure we have the node data
    if (!nodeData || !nodeData.id) {
      console.error("Invalid node data for completion", nodeData);
      return this.showMapView(); // Try to show map anyway
    }
    
    // Save current node ID for reliable reference
    const nodeId = nodeData.id;
    
    // Create a Promise to handle all possible completion methods
    new Promise((resolve, reject) => {
      try {
        // First try NodeInteraction
        if (window.NodeInteraction && typeof NodeInteraction.completeNode === 'function') {
          NodeInteraction.completeNode(nodeData);
          console.log("Node completed via NodeInteraction");
          resolve();
        } else {
          throw new Error("NodeInteraction not available");
        }
      } catch (error) {
        reject(error);
      }
    })
    .catch(error => {
      console.log("Falling back to API client for node completion:", error);
      
      // Then try API client
      if (window.ApiClient && typeof ApiClient.markNodeVisited === 'function') {
        return ApiClient.markNodeVisited(nodeId);
      }
      throw new Error("No method available to mark node visited");
    })
    .catch(error => {
      console.error("All methods to mark node visited failed:", error);
      
      // Last resort: manually update GameState
      if (window.GameState && GameState.data && GameState.data.map) {
        console.log("Using direct GameState manipulation as last resort");
        
        try {
          // Find and mark the node
          if (GameState.data.map.boss && GameState.data.map.boss.id === nodeId) {
            GameState.data.map.boss.visited = true;
          } else if (GameState.data.map.nodes && GameState.data.map.nodes[nodeId]) {
            GameState.data.map.nodes[nodeId].visited = true;
          }
          
          // Update current node to null
          GameState.setCurrentNode(null);
          
          // Save the game state
          if (window.ApiClient && typeof ApiClient.saveGame === 'function') {
            return ApiClient.saveGame();
          }
          
          return Promise.resolve();
        } catch (e) {
          console.error("Even direct manipulation failed:", e);
          return Promise.reject(e);
        }
      }
      
      return Promise.reject(error);
    })
    .then(() => {
      console.log("Node marked as visited successfully");
      
      // Emit the node completed event
      if (window.EventSystem) {
        EventSystem.emit(GAME_EVENTS.NODE_COMPLETED, nodeId);
      }
    })
    .catch(error => {
      console.error("All methods to complete node failed:", error);
      this.showToast("Error progressing. Try using debug controls.", "warning");
    })
    .finally(() => {
      // Always try to show map view
      setTimeout(() => this.showMapView(), 100);
    });
  },
  
  // Enhanced show map view with thorough cleanup
  showMapView: function() {
    console.log("Attempting to show map view");
    
    // Try multiple methods to ensure we can return to the map
    if (window.UI && typeof UI.showMapView === 'function') {
      UI.showMapView();
      return; // UI.showMapView should handle everything
    }
    
    // Manual fallback if UI.showMapView is not available
    try {
      // Find and show the map container
      const mapContainer = document.querySelector('.map-container');
      if (mapContainer) {
        mapContainer.style.display = 'block';
      }
      
      // Handle modal cleanup
      const modal = document.getElementById('node-modal-overlay');
      if (modal) {
        modal.style.display = 'none';
        
        // Move any interaction containers back to their original parent
        const modalContent = document.getElementById('node-modal-content');
        if (modalContent) {
          const containers = modalContent.querySelectorAll('.interaction-container');
          const gameBoard = document.querySelector('.col-md-9');
          
          if (gameBoard) {
            containers.forEach(container => {
              gameBoard.appendChild(container);
              container.style.display = 'none';
            });
          }
        }
      }
      
      // Hide all interaction containers
      document.querySelectorAll('.interaction-container').forEach(el => {
        el.style.display = 'none';
      });
      
      // Special case for the shop container
      const shopContainer = document.querySelector('#shop-container');
      if (shopContainer) {
        shopContainer.style.display = 'none';
      }
    } catch (error) {
      console.error("Error during manual map view display:", error);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('shop', ShopComponent);
}