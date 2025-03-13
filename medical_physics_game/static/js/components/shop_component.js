// shop_component.js - Component for shop node type

const ShopComponent = ComponentUtils.createComponent('shop', {
    // Initialize component
    initialize: function() {
      console.log("Initializing shop component");
      this.setUiState('itemsLoaded', false);
      this.setUiState('shopItems', []);
    },
    
    // Render the shop UI
    render: function(nodeData, container) {
      console.log("Rendering shop component", nodeData);
      
      // Create shop UI
      container.innerHTML = `
        <div class="shop-header">
          <h3>Department Store</h3>
          <p class="shop-description">Browse and purchase items using your insight points.</p>
        </div>
        <div class="shop-currency">
          <span class="currency-label">Available Insight:</span>
          <span class="currency-value" id="shop-currency">${this.getPlayerInsight()}</span>
        </div>
        <div id="shop-items-container" class="shop-items-container">
          <div class="shop-loading">Loading available items...</div>
        </div>
        <div class="shop-footer">
          <button id="shop-continue-btn" class="btn btn-primary mt-3">Leave Shop</button>
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
        .then(response => response.json())
        .then(items => {
          // Save items in UI state
          this.setUiState('itemsLoaded', true);
          this.setUiState('shopItems', items);
          
          // Render items
          this.renderShopItems(items);
        })
        .catch(error => {
          console.error("Error loading shop items:", error);
          
          // Show error message
          const container = document.getElementById('shop-items-container');
          if (container) {
            container.innerHTML = `
              <div class="alert alert-danger">
                <p>Failed to load shop items. Please try again later.</p>
              </div>
            `;
          }
        });
    },
    
    // Render shop items
    renderShopItems: function(items) {
      const container = document.getElementById('shop-items-container');
      if (!container) return;
      
      // Clear container
      container.innerHTML = '';
      
      // If no items, show message
      if (!items || items.length === 0) {
        container.innerHTML = `
          <div class="empty-shop-message">
            <p>No items available in the shop.</p>
          </div>
        `;
        return;
      }
      
      // Calculate item prices based on rarity
      const itemsWithPrices = items.map(item => {
        const basePrice = this.getItemBasePrice(item.rarity);
        return {
          ...item,
          price: basePrice
        };
      });
      
      // Render each item
      itemsWithPrices.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `shop-item rarity-${item.rarity || 'common'}`;
        
        const playerCanAfford = this.getPlayerInsight() >= item.price;
        
        itemElement.innerHTML = `
          <div class="shop-item-header">
            <h5 class="item-name">${item.name}</h5>
            <span class="item-price ${!playerCanAfford ? 'cannot-afford' : ''}">${item.price} Insight</span>
          </div>
          <div class="shop-item-body">
            <span class="item-rarity">${item.rarity || 'common'}</span>
            <p class="item-description">${item.description}</p>
            <div class="item-effect">${item.effect?.value || 'No effect'}</div>
          </div>
          <div class="shop-item-footer">
            <button 
              class="btn ${playerCanAfford ? 'btn-primary' : 'btn-secondary'} buy-item-btn" 
              ${!playerCanAfford ? 'disabled' : ''}
              data-item-id="${item.id}"
            >
              ${playerCanAfford ? 'Purchase' : 'Not enough insight'}
            </button>
          </div>
        `;
        
        container.appendChild(itemElement);
        
        // Add click handler for purchase button
        const buyBtn = itemElement.querySelector('.buy-item-btn');
        if (buyBtn && playerCanAfford) {
          buyBtn.addEventListener('click', () => {
            this.purchaseItem(item);
          });
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
    
    // Purchase an item
    purchaseItem: function(item) {
      const price = item.price || this.getItemBasePrice(item.rarity);
      
      // Check if player has enough insight
      if (this.getPlayerInsight() < price) {
        this.showToast("Not enough insight to purchase this item!", "warning");
        return;
      }
      
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
    }
  });
  
  // Register the component
  if (typeof NodeComponents !== 'undefined') {
    NodeComponents.register('shop', ShopComponent);
  }