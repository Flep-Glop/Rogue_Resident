// shop_component.js - Improved implementation with larger icons and cleaner UI

const ShopComponent = ComponentUtils.createComponent('shop', {
  // Initialize component
  initialize: function() {
    console.log("Initializing shop component");
    
    // Initialize UI state
    this.setUiState('itemsLoaded', false);
    this.setUiState('shopItems', []);
  },
  
  // Render the shop with a clean, redesigned interface
  render: function(nodeData, container) {
    console.log("Rendering shop component", nodeData);
    
    // Create basic shop structure with repositioned insight display
    container.innerHTML = `
      <div class="game-panel shop-panel">
        <div class="shop-header">
          <h3>Department Store</h3>
        </div>
        
        <div class="insight-bar">
          <span>Available Insight:</span>
          <span id="shop-currency" class="insight-value">${this.getPlayerInsight()}</span>
        </div>
        
        <p class="shop-description">Browse and purchase items using your insight points.</p>
        
        <div id="shop-items-container">
          <div class="loading-indicator">
            <div class="spinner-border"></div>
            <p>Loading items...</p>
          </div>
        </div>
        
        <button id="shop-continue-btn" class="leave-shop-btn">
          LEAVE SHOP
        </button>
      </div>
    `;
    
    // Inject custom CSS for improved shop styling
    this.injectShopStyles();
    
    // Bind continue button
    this.bindAction('shop-continue-btn', 'click', 'continue', { nodeData });
    
    // Load shop items
    this.loadShopItems(nodeData);
  },
  
  // Inject custom styles for shop UI improvements
  injectShopStyles: function() {
    // Check if styles are already injected
    if (document.getElementById('improved-shop-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'improved-shop-styles';
    styleEl.textContent = `
      /* Improved shop styling */
      .shop-panel {
        background-color: #1a1c2e;
        border: 2px solid #5b8dd9;
        border-radius: 6px;
        padding: 15px;
        color: #fff;
      }
      
      .shop-header {
        border-bottom: 2px solid rgba(91, 141, 217, 0.3);
        margin-bottom: 10px;
        padding-bottom: 8px;
      }
      
      .shop-header h3 {
        color: #5b8dd9;
        font-size: 1.5rem;
        margin: 0;
        text-align: center;
        font-family: 'Press Start 2P', cursive;
      }
      
      .insight-bar {
        background-color: #252a3d;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Press Start 2P', cursive;
        font-size: 0.8rem;
      }
      
      .insight-value {
        color: #f0c866;
        font-weight: bold;
        font-size: 1rem;
      }
      
      .shop-description {
        margin-bottom: 20px;
        color: #b8c7e0;
        text-align: center;
        font-size: 0.8rem;
      }
      
      /* Section headers */
      .shop-sections-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        border-bottom: 1px dashed rgba(91, 141, 217, 0.3);
        padding-bottom: 5px;
      }
      
      .section-title {
        font-family: 'Press Start 2P', cursive;
        font-size: 0.8rem;
        color: #f0c866;
      }
      
      /* Container for both sections */
      .shop-sections {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .shop-section {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      /* Enhanced item styling */
      .shop-item {
        background-color: #252a3d;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid rgba(91, 141, 217, 0.3);
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      }
      
      .shop-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }
      
      /* Item name styling */
      .item-name {
        padding: 8px 10px;
        font-family: 'Press Start 2P', cursive;
        font-size: 0.7rem;
        background-color: rgba(0, 0, 0, 0.3);
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* Item content with larger icon */
      .item-row {
        display: flex;
        align-items: center;
        padding: 10px;
      }
      
      .item-icon-container {
        width: 64px;
        height: 64px;
        background-color: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        margin-right: 10px;
        flex-shrink: 0;
      }
      
      .pixel-item-icon-img {
        width: 48px;
        height: 48px;
        image-rendering: pixelated;
        object-fit: contain;
      }
      
      /* Rarity badge */
      .rarity-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 0.6rem;
        text-transform: uppercase;
        margin: 0 10px 10px 10px;
      }
      
      .rarity-badge.common { background-color: #6c757d; }
      .rarity-badge.uncommon { background-color: #5b8dd9; }
      .rarity-badge.rare { background-color: #9c77db; }
      .rarity-badge.epic { background-color: #f0c866; color: black; }
      
      /* Price button styling - merged with purchase */
      .purchase-btn {
        width: calc(100% - 20px);
        margin: 0 10px 10px 10px;
        padding: 8px;
        font-family: 'Press Start 2P', cursive;
        font-size: 0.7rem;
        border: none;
        background-color: #e67e73;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .purchase-btn.can-afford {
        background-color: #56b886;
      }
      
      .purchase-btn.cannot-afford {
        background-color: #e67e73;
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .price-value {
        margin-right: 5px;
        font-weight: bold;
      }
      
      /* Leave shop button */
      .leave-shop-btn {
        width: 100%;
        padding: 12px;
        background-color: #56b886;
        color: white;
        border: none;
        border-radius: 4px;
        font-family: 'Press Start 2P', cursive;
        font-size: 0.8rem;
        cursor: pointer;
        margin-top: 10px;
        transition: background-color 0.2s;
      }
      
      .leave-shop-btn:hover {
        background-color: #48a375;
      }
      
      /* Empty section styling */
      .empty-section {
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
        padding: 20px;
      }
      
      /* Enhanced tooltip styling */
      .item-tooltip {
        position: absolute;
        top: 0;
        left: 100%;
        width: 200px;
        background-color: #1a1c2e;
        border: 2px solid #5b8dd9;
        border-radius: 4px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        z-index: 100;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        padding: 10px;
      }
      
      .shop-item:hover .item-tooltip {
        opacity: 1;
        pointer-events: auto;
      }
      
      .tooltip-header {
        border-bottom: 1px solid rgba(91, 141, 217, 0.3);
        padding-bottom: 5px;
        margin-bottom: 8px;
      }
      
      .tooltip-title {
        font-weight: bold;
        color: white;
        font-size: 0.8rem;
      }
      
      .tooltip-rarity {
        display: block;
        margin-top: 3px;
        font-size: 0.7rem;
        color: #b8c7e0;
        text-transform: capitalize;
      }
      
      .tooltip-desc {
        font-size: 0.7rem;
        line-height: 1.4;
        margin-bottom: 8px;
        color: #b8c7e0;
      }
      
      .tooltip-effect {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 8px;
        font-size: 0.7rem;
        color: #5b8dd9;
        border-radius: 3px;
      }
      
      .effect-type {
        color: #f0c866;
        margin-right: 5px;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .shop-sections {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(styleEl);
  },
  
  // Load shop items from API with additional focus on relics
  loadShopItems: function(nodeData) {
    // If items are already loaded, just show them
    if (this.getUiState('itemsLoaded')) {
      this.renderShopItems(this.getUiState('shopItems'));
      return;
    }
    
    // Show loading state
    const container = document.getElementById('shop-items-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner-border"></div>
          <p>Loading shop inventory...</p>
        </div>
      `;
    }
    
    // For testing purposes, use fixed items if specified in nodeData
    if (nodeData && nodeData.fixedItems) {
      console.log("Using fixed items from node data");
      this.setUiState('itemsLoaded', true);
      this.setUiState('shopItems', nodeData.fixedItems);
      this.renderShopItems(nodeData.fixedItems);
      return;
    }
    
    // IMPROVED: Explicitly load at least 1 consumable item and 1 relic
    Promise.all([
      // Fetch regular items
      fetch('/api/item/random?count=2')
        .then(response => response.ok ? response.json() : []),
      
      // Fetch relics specifically requesting count=2
      fetch('/api/relic/random?count=2')
        .then(response => response.ok ? response.json() : [])
    ])
    .then(([items, relics]) => {
      console.log("Shop items loaded:", { items, relics });
      
      // Fallback items if API returns empty results
      if (!items || !items.length) {
        items = [{
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
        }];
      }
      
      // Make sure we have at least one relic
      if (!relics || !relics.length) {
        relics = [{
          id: "quantum_uncertainty_goggles",
          name: "Schrödinger's Spectacles",
          description: "These glasses simultaneously show radiation as both particles and waves.",
          rarity: "epic",
          itemType: "relic",
          iconPath: "3D Glasses.png",
          effect: {
            type: "second_chance",
            value: "Allows a second attempt at questions",
            duration: "permanent"
          },
          passiveText: "Can attempt questions twice"
        }];
      }
      
      // Ensure item types are set
      items.forEach(item => {
        if (!item.itemType) item.itemType = 'consumable';
        item.price = this.getItemBasePrice(item.rarity || 'common');
      });
      
      relics.forEach(relic => {
        if (!relic.itemType) relic.itemType = 'relic';
        relic.price = this.getItemBasePrice(relic.rarity || 'uncommon') * 1.5;
      });
      
      // Combine items and relics
      const allItems = [...items, ...relics];
      
      // Save items in UI state
      this.setUiState('itemsLoaded', true);
      this.setUiState('shopItems', allItems);
      
      // Render items
      this.renderShopItems(allItems);
    })
    .catch(error => {
      console.error("Failed to load shop items:", error);
      
      // If API fails, use fallback items
      const fallbackItems = [
        {
          id: "medical_textbook",
          name: "Medical Physics Textbook",
          description: "A comprehensive guide that helps eliminate one incorrect answer option.",
          rarity: "uncommon",
          itemType: "consumable",
          iconPath: "Notebook.png",
          price: 30,
          effect: {
            type: "eliminateOption",
            value: "Removes one incorrect answer option",
            duration: "instant"
          }
        },
        {
          id: "radiation_badge",
          name: "Radiation Badge",
          description: "A personal dosimeter that can absorb harmful radiation.",
          rarity: "rare",
          itemType: "consumable",
          iconPath: "Nametag.png",
          price: 50,
          effect: {
            type: "heal",
            value: "Restores 1 life point",
            duration: "instant"
          }
        },
        {
          id: "quantum_goggles",
          name: "Schrödinger's Spectacles",
          description: "These glasses simultaneously show radiation as both particles and waves.",
          rarity: "epic",
          itemType: "relic",
          iconPath: "3D Glasses.png",
          price: 80,
          effect: {
            type: "second_chance",
            value: "Allows a second attempt at questions",
            duration: "permanent"
          },
          passiveText: "Can attempt questions twice"
        }
      ];
      
      this.setUiState('itemsLoaded', true);
      this.setUiState('shopItems', fallbackItems);
      this.renderShopItems(fallbackItems);
    });
  },
  
  // Render shop items with improved section layout and larger icons
  renderShopItems: function(items) {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // If no items, show message
    if (!items || items.length === 0) {
      container.innerHTML = `<p class="text-center">No items available</p>`;
      return;
    }
    
    // Group items by type
    const consumables = items.filter(item => item.itemType === 'consumable');
    const relics = items.filter(item => item.itemType === 'relic');
    
    console.log("Rendering shop sections:", { consumables, relics });
    
    // Create section headers
    container.innerHTML = `
      <div class="shop-sections-header">
        <span class="section-title consumables-title">Consumable Items</span>
        <span class="section-title relics-title">Rare Relics</span>
      </div>
      <div class="shop-sections">
        <div id="consumables-container" class="shop-section"></div>
        <div id="relics-container" class="shop-section"></div>
      </div>
    `;
    
    // Function to render an item card with larger icon and merged price button
    const renderItem = (item, targetContainer) => {
      const playerCanAfford = this.getPlayerInsight() >= item.price;
      const rarity = item.rarity || 'common';
      const isRelic = item.itemType === 'relic';
      
      const itemElement = document.createElement('div');
      itemElement.className = `shop-item ${isRelic ? 'shop-relic' : ''}`;
      
      // Simplified item card with larger icon and merged price button
      itemElement.innerHTML = `
        <div class="item-name">${item.name}</div>
        
        <div class="item-row">
          <div class="item-icon-container">
            ${this.getItemIcon(item)}
          </div>
        </div>
        
        <div class="rarity-badge ${rarity}">${rarity}</div>
        
        <button class="purchase-btn ${playerCanAfford ? 'can-afford' : 'cannot-afford'}" 
          ${!playerCanAfford ? 'disabled' : ''} data-item-id="${item.id}">
          <span class="price-value">${Math.round(item.price)}</span> INSIGHT
        </button>
          
        <!-- Enhanced item tooltip -->
        <div class="item-tooltip">
          <div class="tooltip-header">
            <span class="tooltip-title">${item.name}</span>
            <span class="tooltip-rarity">${rarity}</span>
          </div>
          <div class="tooltip-body">
            <p class="tooltip-desc">${item.description}</p>
            <div class="tooltip-effect">
              ${isRelic ? '<span class="effect-type">Passive:</span> ' : ''}
              ${isRelic ? (item.passiveText || item.effect?.value || 'No effect') : (item.effect?.value || 'No effect')}
            </div>
          </div>
        </div>
      `;
      
      targetContainer.appendChild(itemElement);
      
      // Add click handler for purchase button
      const buyBtn = itemElement.querySelector('.purchase-btn');
      if (buyBtn && playerCanAfford) {
        this.bindAction(buyBtn, 'click', 'purchaseItem', { item });
      }
    };
    
    // Render consumables
    const consumablesContainer = document.getElementById('consumables-container');
    if (consumables.length > 0) {
      consumables.forEach(item => renderItem(item, consumablesContainer));
    } else {
      consumablesContainer.innerHTML = `<p class="empty-section">No consumable items available</p>`;
    }
    
    // Render relics
    const relicsContainer = document.getElementById('relics-container');
    if (relics.length > 0) {
      relics.forEach(item => renderItem(item, relicsContainer));
    } else {
      relicsContainer.innerHTML = `<p class="empty-section">No relics available</p>`;
    }
  },
  
  // Get consistent item icon with larger dimensions
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="pixel-item-icon-img">`;
    }
    
    // Fallback to a default icon based on item type
    const itemType = this.getItemTypeFromName(item.name);
    return `<img src="/static/img/items/${itemType}.png" alt="${item.name}" class="pixel-item-icon-img">`;
  },
  
  // Helper to determine icon based on item name
  getItemTypeFromName: function(name) {
    if (!name) return 'default';
    name = name.toLowerCase();
    
    if (name.includes('book') || name.includes('textbook') || name.includes('manual')) {
      return 'Red Book';
    } else if (name.includes('badge') || name.includes('dosimeter') || name.includes('detector')) {
      return 'Nametag';
    } else if (name.includes('glasses') || name.includes('spectacles') || name.includes('goggles')) {
      return '3D Glasses';
    } else if (name.includes('potion') || name.includes('vial')) {
      return 'Tabletennis'; // Using this as a potion-like icon
    }
    
    return 'Yellow Sticky Note'; // Default fallback
  },
  
  // Base price calculation based on rarity
  getItemBasePrice: function(rarity) {
    switch(rarity) {
      case 'common': return 15;
      case 'uncommon': return 30;
      case 'rare': return 50;
      case 'epic': return 80;
      default: return 20;
    }
  },
  
  // Get player's current insight
  getPlayerInsight: function() {
    return window.GameState?.data?.character?.insight || 0;
  },
  
  // Purchase an item with improved feedback
  purchaseItem: function(data) {
    if (!data || !data.item) {
      console.error("Missing item data in purchaseItem");
      return;
    }
    
    const item = data.item;
    const price = item.price || this.getItemBasePrice(item.rarity);
    
    // Check if player has enough insight
    if (this.getPlayerInsight() < price) {
      this.showToast("Not enough insight to purchase this item!", "warning");
      return;
    }
    
    // Add purchase confirmation animation
    this.showPurchaseAnimation(() => {
      // Deduct insight
      this.updatePlayerInsight(-price);
      
      // Add item to inventory
      const added = this.addItemToInventory(item);
      
      if (added) {
        this.showFeedback(`Purchased ${item.name}!`, 'success');
        
        // Update currency display
        const currencyElement = document.getElementById('shop-currency');
        if (currencyElement) {
          currencyElement.textContent = this.getPlayerInsight();
        }
        
        // Remove item from shop
        const shopItems = this.getUiState('shopItems').filter(i => i.id !== item.id);
        this.setUiState('shopItems', shopItems);
        
        // Re-render shop items
        this.renderShopItems(shopItems);
      } else {
        // Refund insight if item couldn't be added
        this.updatePlayerInsight(price);
        this.showToast("Couldn't add item to inventory. It may be full.", "warning");
      }
    });
  },
  
  // Show purchase animation
  showPurchaseAnimation: function(callback) {
    // Create a simple overlay for feedback
    const overlay = document.createElement('div');
    overlay.className = 'purchase-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    const message = document.createElement('div');
    message.className = 'purchase-message';
    message.style.backgroundColor = '#1a1c2e';
    message.style.padding = '20px';
    message.style.borderRadius = '5px';
    message.style.textAlign = 'center';
    message.style.fontFamily = "'Press Start 2P', cursive";
    message.style.border = '2px solid #56b886';
    message.innerHTML = `
      <div style="font-size: 18px; color: #56b886; margin-bottom: 10px;">Purchase Complete!</div>
      <div style="font-size: 14px; color: #b8c7e0;">Adding to inventory...</div>
    `;
    
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    
    // Remove after short delay
    setTimeout(() => {
      document.body.removeChild(overlay);
      if (callback) callback();
    }, 700);
  },
  
  // Update player insight
  updatePlayerInsight: function(amount) {
    if (window.GameState && GameState.data && GameState.data.character) {
      GameState.data.character.insight += amount;
      
      // Notify UI systems of the change
      if (window.EventSystem) {
        EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
      }
      
      // Save game state
      if (window.ApiClient && ApiClient.saveGame) {
        ApiClient.saveGame();
      }
    }
  },
  
  // Add item to inventory using InventorySystem
  addItemToInventory: function(item) {
    // Use inventory system if available
    if (window.InventorySystem && typeof InventorySystem.addItem === 'function') {
      return InventorySystem.addItem(item);
    }
    
    // Fallback to direct GameState manipulation
    if (window.GameState && GameState.data) {
      if (!GameState.data.inventory) {
        GameState.data.inventory = [];
      }
      
      // Check inventory size limit
      const maxSize = 5;
      if (GameState.data.inventory.length >= maxSize) {
        return false;
      }
      
      // Add the item
      GameState.data.inventory.push(item);
      
      // Emit item added event
      if (window.EventSystem) {
        EventSystem.emit(GAME_EVENTS.ITEM_ADDED, item);
      }
      
      // Save inventory
      if (window.ApiClient && ApiClient.saveInventory) {
        ApiClient.saveInventory({ inventory: GameState.data.inventory });
      }
      
      return true;
    }
    
    return false;
  },
  
  // Show toast message
  showToast: function(message, type) {
    if (window.UiUtils && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  },
  
  // Show feedback message
  showFeedback: function(message, type) {
    if (window.UiUtils && typeof UiUtils.showFloatingText === 'function') {
      UiUtils.showFloatingText(message, type);
    } else {
      this.showToast(message, type);
    }
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Shop component handling action: ${action}`, data);
    
    switch (action) {
      case 'purchaseItem':
        this.purchaseItem(data);
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
  NodeComponents.register('shop', ShopComponent);
}