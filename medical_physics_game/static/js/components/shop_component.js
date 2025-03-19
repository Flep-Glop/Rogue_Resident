// shop_component.js - Refactored implementation with new design architecture

const ShopComponent = ComponentUtils.createComponent('shop', {
  // Initialize component
  initialize: function() {
    console.log("Initializing shop component");
    
    // Initialize UI state
    this.setUiState('itemsLoaded', false);
    this.setUiState('shopItems', []);
    
    // Subscribe to design bridge changes
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // Update shop appearance if active
    const container = document.getElementById('shop-container');
    if (container && container.style.display !== 'none') {
      this.refreshShopAppearance();
    }
  },
  
  // Refresh shop appearance with design tokens
  refreshShopAppearance: function() {
    const currencyDisplay = document.getElementById('shop-currency');
    if (currencyDisplay) {
      currencyDisplay.style.color = window.DesignBridge?.colors?.warning || '#f0c866';
    }
  },
  
  // Simplified shop_component.js render function
  render: function(nodeData, container) {
    console.log("Rendering shop component", nodeData);
    
    // Get colors from design bridge if available
    const shopColor = window.DesignBridge?.colors?.nodeShop || '#5bbcd9';
    
    // Create shop UI with clean, minimal design matching screenshot
    container.innerHTML = `
      <div class="game-panel shadow-md">
        <div class="shop-header flex justify-between items-center">
          <h3>Department Store</h3>
          <div class="insight-display">
            <span>Available Insight:</span>
            <span id="shop-currency" class="insight-value">${this.getPlayerInsight()}</span>
          </div>
        </div>
        
        <p class="shop-description">Browse and purchase items using your insight points.</p>
        
        <div id="shop-items-container" class="shop-items-grid">
          <div class="loading-indicator">
            <div class="spinner-border"></div>
            <p>Loading items...</p>
          </div>
        </div>
        
        <button id="shop-continue-btn" class="game-btn w-full">
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
    
    // Fetch items from API
    fetch('/api/item/random?count=3')
      .then(response => {
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(items => {
        // Save items in UI state
        this.setUiState('itemsLoaded', true);
        this.setUiState('shopItems', items);
        
        // Render items
        this.renderShopItems(items);
      })
      .catch(error => {
        ErrorHandler.handleError(
          error, 
          "Shop Items Loading", 
          ErrorHandler.SEVERITY.WARNING
        );
        
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
  
  // Simplified rendering of shop items
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
    
    // Render each item
    items.forEach(item => {
      const playerCanAfford = this.getPlayerInsight() >= item.price;
      const rarity = item.rarity || 'common';
      
      const itemElement = document.createElement('div');
      itemElement.className = `shop-item rarity-${rarity}`;
      
      itemElement.innerHTML = `
        <div class="shop-item-header">
          <span class="item-name">${item.name}</span>
          <span class="item-price ${playerCanAfford ? '' : 'cannot-afford'}">${item.price} Insight</span>
        </div>
        
        <div class="shop-item-body">
          <div class="rarity-badge ${rarity}">${rarity}</div>
          <p class="item-description">${item.description}</p>
          <div class="item-effect">${item.effect?.value || 'No effect'}</div>
        </div>
        
        <button class="purchase-btn ${playerCanAfford ? 'can-afford' : 'cannot-afford'}" 
          ${!playerCanAfford ? 'disabled' : ''} data-item-id="${item.id}">
          ${playerCanAfford ? 'Purchase' : 'Not enough insight'}
        </button>
      `;
      
      container.appendChild(itemElement);
      
      // Add click handler for purchase button
      const buyBtn = itemElement.querySelector('.purchase-btn');
      if (buyBtn && playerCanAfford) {
        this.bindAction(buyBtn, 'click', 'purchaseItem', { item });
      }
    });
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
  
  // Get icon for an item
  getItemIcon: function(item) {
    // Use design bridge for colors if available
    const iconColor = window.DesignBridge?.colors?.primary || "#5b8dd9";
    
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="pixelated">`;
    }
    
    // Map common item types to icons
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
          currencyElement.classList.add('anim-pulse-warning');
          setTimeout(() => currencyElement.classList.remove('anim-pulse-warning'), 1000);
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
    // Create a quick animation overlay
    const overlay = document.createElement('div');
    overlay.className = 'position-fixed top-0 left-0 w-full h-full';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.animation = 'fade-in 0.2s';
    
    const message = document.createElement('div');
    message.className = 'bg-background-alt p-lg rounded-md text-center';
    message.innerHTML = `
      <div class="text-xl text-secondary mb-md">Purchase Complete!</div>
      <div class="spinner-border mb-md"></div>
      <div>Adding to inventory...</div>
    `;
    
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    
    // Remove after short delay
    setTimeout(() => {
      overlay.style.animation = 'fade-out 0.2s';
      overlay.addEventListener('animationend', () => {
        document.body.removeChild(overlay);
        if (callback) callback();
      });
    }, 700);
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