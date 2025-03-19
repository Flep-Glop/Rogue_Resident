// shop_component.js - Simplified implementation with consistent icon handling

const ShopComponent = ComponentUtils.createComponent('shop', {
  // Initialize component
  initialize: function() {
    console.log("Initializing shop component");
    
    // Initialize UI state
    this.setUiState('itemsLoaded', false);
    this.setUiState('shopItems', []);
  },
  
  // Render the shop with a clean, minimal design
  render: function(nodeData, container) {
    console.log("Rendering shop component", nodeData);
    
    // Create basic shop structure
    container.innerHTML = `
      <div class="game-panel shop-panel">
        <div class="shop-header">
          <h3>Department Store</h3>
          <div class="insight-display">
            <span>Available Insight:</span>
            <span id="shop-currency" class="insight-value">${this.getPlayerInsight()}</span>
          </div>
        </div>
        
        <p class="shop-description">Browse and purchase items using your insight points.</p>
        
        <div id="shop-items-container">
          <div class="loading-indicator">
            <div class="spinner-border"></div>
            <p>Loading items...</p>
          </div>
        </div>
        
        <button id="shop-continue-btn" class="leave-shop-btn">
          Leave Shop
        </button>
      </div>
    `;
    
    // Bind continue button
    this.bindAction('shop-continue-btn', 'click', 'continue', { nodeData });
    
    // Load shop items
    this.loadShopItems(nodeData);
  },
  
  // Load shop items from API
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
    
    // Load both items and relics
    Promise.all([
      // Fetch regular items
      fetch('/api/item/random?count=2')
        .then(response => response.ok ? response.json() : []),
      
      // Fetch relics
      fetch('/api/relic/random?count=1')
        .then(response => response.ok ? response.json() : [])
    ])
    .then(([items, relics]) => {
      // Add item type if missing
      items.forEach(item => {
        if (!item.itemType) item.itemType = 'consumable';
        item.price = this.getItemBasePrice(item.rarity || 'common');
      });
      
      // Add item type for relics if missing
      relics.forEach(relic => {
        if (!relic.itemType) relic.itemType = 'relic';
        // Relics are more expensive
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
      
      // Show error message
      const container = document.getElementById('shop-items-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger w-full">
            <p>Failed to load shop items. Please try again later.</p>
          </div>
        `;
      }
    });
  },
  
  // Render shop items with consistent icon handling
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
    
    // Create layout with section headers
    container.innerHTML = `
      <div class="shop-divider">
        <span class="section-title consumables-title">Consumable Items</span>
        <span class="section-title relics-title">Rare Relics</span>
      </div>
      <div class="shop-sections">
        <div id="consumables-container" class="shop-section"></div>
        <div id="relics-container" class="shop-section"></div>
      </div>
    `;
    
    // Function to render an item card
    const renderItem = (item, targetContainer) => {
      const playerCanAfford = this.getPlayerInsight() >= item.price;
      const rarity = item.rarity || 'common';
      const isRelic = item.itemType === 'relic';
      
      const itemElement = document.createElement('div');
      itemElement.className = `shop-item ${isRelic ? 'shop-relic' : ''}`;
      
      // Main visible content (icon, name, price)
      itemElement.innerHTML = `
        <div class="shop-item-content">
          <div class="item-header">
            <span class="item-name">${item.name}</span>
            <div class="item-price-tag ${playerCanAfford ? '' : 'cannot-afford'}">
              <span class="item-price-value">${Math.round(item.price)}</span>
              <span class="item-price-label">Insight</span>
            </div>
          </div>
          
          <div class="item-main">
            <div class="item-icon-container">
              ${this.getItemIcon(item)}
            </div>
            <div class="rarity-badge ${rarity}">${rarity}</div>
            
            <!-- Item tooltip that appears on hover -->
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
          </div>
          
          <button class="purchase-btn ${playerCanAfford ? 'can-afford' : 'cannot-afford'}" 
            ${!playerCanAfford ? 'disabled' : ''} data-item-id="${item.id}">
            Purchase
          </button>
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
  
  // Get consistent item icon (matching inventory system)
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="pixel-item-icon-img">`;
    }
    
    // Fallback to a default icon
    return `<img src="/static/img/items/default.png" alt="${item.name}" class="pixel-item-icon-img">`;
  },
  
  // Get base price for an item based on rarity
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
  
  // Purchase an item
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
    message.style.backgroundColor = '#2a2a36';
    message.style.padding = '20px';
    message.style.borderRadius = '5px';
    message.style.textAlign = 'center';
    message.innerHTML = `
      <div style="font-size: 18px; color: #56b886; margin-bottom: 10px;">Purchase Complete!</div>
      <div>Adding to inventory...</div>
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
  
  // Add item to inventory
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