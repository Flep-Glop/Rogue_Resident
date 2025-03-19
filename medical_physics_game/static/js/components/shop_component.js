// shop_component.js - Rewritten to use the unified tooltip system

const ShopComponent = ComponentUtils.createComponent('shop', {
  // Initialize component
  initialize: function() {
    console.log("Initializing enhanced shop component");
    this.resetComponentState();
    
    // Add shop-specific styles
    this.addEnhancedStyles();
    
    // Make sure the unified tooltip system is initialized
    if (window.UnifiedTooltipSystem) {
      if (typeof UnifiedTooltipSystem.initialize === 'function' && !UnifiedTooltipSystem.initialized) {
        UnifiedTooltipSystem.initialize();
      }
    } else {
      console.warn("UnifiedTooltipSystem not available - tooltips may not display correctly");
    }
  },

  // Reset component state - called on initialize and each render
  resetComponentState: function() {
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
    
    // IMPORTANT: Reset state when rendering a new shop
    this.resetComponentState();
    
    // Store nodeData for later use
    this.currentNodeData = nodeData;
    
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
    
    // Bind action using ComponentUtils for reliability
    this.bindAction('shop-continue-btn', 'click', 'continue', { nodeData });
    
    // Also add an additional direct event handler for extra reliability
    const continueBtn = document.getElementById('shop-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        // This direct handler is in addition to the component's action binding
        console.log("Direct handler for continue button clicked");
        this.leaveShop(nodeData);
      });
    }
    
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
        itemType: "consumable",
        effect: {
          type: "eliminateOption",
          value: "Removes one incorrect answer option",
          duration: "instant"
        }
      },
      {
        id: "radiation_badge",
        name: "Radiation Badge",
        description: "Restores 1 life point",
        price: 50,
        rarity: "rare",
        iconPath: "Nametag.png",
        itemType: "consumable",
        effect: {
          type: "heal",
          value: 1,
          duration: "instant"
        }
      },
      {
        id: "quantum_goggles",
        name: "Schrödinger's Spectacles",
        description: "Allows a second attempt at questions",
        price: 80,
        rarity: "epic",
        iconPath: "3D Glasses.png",
        itemType: "relic",
        effect: {
          type: "second_chance",
          value: "Allows a second attempt at question nodes",
          duration: "permanent"
        }
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
        itemType: "relic",
        effect: {
          type: "second_chance",
          value: "Allows a second attempt at question nodes",
          duration: "permanent"
        }
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
  
  // Render items with enhanced layout using the unified tooltip system
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
  
  // Create a simplified item card with just icon and price that uses unified tooltips
  createItemCard: function(item) {
    const canAfford = this.getPlayerInsight() >= item.price;
    const isPurchased = this.purchasedItems.has(item.id);
    const isInInventory = this.isItemInInventory(item);
    
    // Create card container
    const card = document.createElement('div');
    card.className = `simplified-shop-item ${item.rarity || 'common'} tooltip-trigger`;
    if (isPurchased) card.classList.add('purchased');
    if (isInInventory && item.itemType === 'relic') card.classList.add('owned');
    if (!isPurchased && !(isInInventory && item.itemType === 'relic') && canAfford) {
      card.classList.add('clickable');
    }
    
    card.dataset.itemId = item.id;
    card.dataset.rarity = item.rarity || 'common';
    
    // Create minimal content - just icon and price
    card.innerHTML = `
      <div class="item-icon-container">
        <div class="item-icon ${item.rarity || 'common'}">
          ${this.getItemIcon(item)}
        </div>
      </div>
      <div class="item-price ${!canAfford ? 'cannot-afford' : ''}">
        ${item.price}
      </div>
      ${isPurchased ? '<div class="sold-out-badge">SOLD</div>' : ''}
      ${isInInventory && item.itemType === 'relic' ? '<div class="owned-badge">OWNED</div>' : ''}
    `;
    
    // Add tooltip using the UnifiedTooltipSystem
    if (window.UnifiedTooltipSystem && typeof UnifiedTooltipSystem.applyTooltip === 'function') {
      UnifiedTooltipSystem.applyTooltip(card, item);
    }
    
    // Only make clickable if not purchased/owned and can afford
    const isClickable = !isPurchased && !(isInInventory && item.itemType === 'relic') && canAfford;
    
    if (isClickable) {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.purchaseItem(item);
      });
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
    let iconName = 'Paperclip';
    
    const itemName = (item.name || '').toLowerCase();
    if (itemName.includes('textbook') || itemName.includes('book'))
      iconName = 'Textbook';
    else if (itemName.includes('badge'))
      iconName = 'Nametag';
    else if (itemName.includes('goggles') || itemName.includes('glasses'))
      iconName = '3D Glasses';
    else if (item.itemType === 'relic')
      iconName = 'USB Stick';
    
    return `<img src="/static/img/items/${iconName}.png" alt="${item.name}" class="item-image">`;
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
        value: item.effect?.value || item.description,
        duration: (item.itemType === "relic") ? "permanent" : "instant"
      }
    };
    
    if (item.itemType === 'relic') {
      fullItem.passiveText = `Passive: ${item.effect?.value || item.description}`;
    }
    
    // Add to inventory with proper error handling
    let added = false;
    
    try {
      // First check if window.ItemManager exists
      if (window.ItemManager && typeof ItemManager.addItem === 'function') {
        // Initialize ItemManager if needed
        if (typeof ItemManager.initialize === 'function' && !ItemManager.initialized) {
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
    // If the item already has an effect type, use it
    if (item.effect && item.effect.type) {
      return item.effect.type;
    }
    
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
  
  // Leave shop
  leaveShop: function(nodeData) {
    console.log("Leaving shop", nodeData);
    
    // Prevent multiple completions
    if (this.completedFlag) {
      return this.safelyShowMapView();
    }
    
    this.completedFlag = true;
    
    // Complete the node
    if (nodeData && nodeData.id) {
      // First try the component's action system
      this.completeNode(nodeData);
      
      // Also mark node as visited directly for reliability
      if (window.ApiClient && typeof ApiClient.markNodeVisited === 'function') {
        ApiClient.markNodeVisited(nodeData.id)
          .then(() => {
            console.log(`Node ${nodeData.id} marked as visited`);
            
            // Emit completion event
            if (window.EventSystem) {
              EventSystem.emit(GAME_EVENTS.NODE_COMPLETED, nodeData.id);
            }
          })
          .catch(error => {
            console.warn(`Error marking node visited: ${error.message}`);
          });
      }
    }
    
    // Show map view after a short delay
    setTimeout(() => {
      this.safelyShowMapView();
    }, 100);
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Shop component handling action: ${action}`, data);
    
    switch (action) {
      case 'continue':
        this.leaveShop(nodeData);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  },
  
  // Safely show map view with multiple fallbacks
  safelyShowMapView: function() {
    console.log("Safely showing map view");
    
    // Try multiple approaches to ensure the map view is shown
    
    // Method 1: Use UI.showMapView if available
    if (window.UI && typeof UI.showMapView === 'function') {
      console.log("Using UI.showMapView");
      UI.showMapView();
    }
    
    // Method 2: Manual DOM manipulation as backup
    console.log("Also applying manual DOM updates for redundancy");
    
    // Hide any modal overlay
    const modal = document.getElementById('node-modal-overlay');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // Hide all interaction containers
    document.querySelectorAll('.interaction-container').forEach(container => {
      container.style.display = 'none';
    });
    
    // Show map container
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      mapContainer.style.display = 'block';
    }
    
    // Method 3: Force redraw map if needed
    if (window.MapRenderer && typeof MapRenderer.renderMap === 'function') {
      setTimeout(() => {
        MapRenderer.renderMap();
      }, 200);
    }
  },
  
  // Add enhanced shop styles
  addEnhancedStyles: function() {
    if (document.getElementById('enhanced-shop-styles')) {
      return; // Styles already added
    }
    
    const styleEl = document.createElement('style');
    styleEl.id = 'enhanced-shop-styles';
    styleEl.textContent = `
      /* Shop Component Styles */

      /* Grid for icon-based shop */
      .shop-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
      }
      
      /* Shop section headers */
      .shop-section-title {
        margin: 10px 0;
        color: #fff;
        font-size: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 8px;
      }

      /* Simplified shop item */
      .simplified-shop-item {
        width: 100%;
        aspect-ratio: 1;
        background-color: #1e1e2a;
        border-radius: 8px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: transform 0.2s, box-shadow 0.2s;
        border: 2px solid transparent;
      }

      /* Hover effect for purchasable items */
      .simplified-shop-item.clickable:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
        cursor: pointer;
      }

      /* Color borders by rarity */
      .simplified-shop-item.common { border-color: #aaa; }
      .simplified-shop-item.uncommon { border-color: #5b8dd9; }
      .simplified-shop-item.rare { border-color: #9c77db; }
      .simplified-shop-item.epic { 
        border-color: #f0c866; 
        box-shadow: 0 0 10px rgba(240, 200, 102, 0.3);
      }

      /* Epic items glow */
      .simplified-shop-item.epic {
        animation: epic-item-glow 2s infinite alternate;
      }

      @keyframes epic-item-glow {
        0% { box-shadow: 0 0 5px rgba(240, 200, 102, 0.3); }
        100% { box-shadow: 0 0 15px rgba(240, 200, 102, 0.5); }
      }

      /* Sold out and owned item styling */
      .simplified-shop-item.purchased,
      .simplified-shop-item.owned {
        opacity: 0.7;
        filter: grayscale(0.5);
      }

      /* Item icon container */
      .item-icon-container {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
      }

      /* Item icon */
      .item-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #252532;
        border-radius: 8px;
        overflow: hidden;
      }

      /* Glow effects by rarity */
      .item-icon.common { box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1); }
      .item-icon.uncommon { box-shadow: inset 0 0 8px rgba(91, 141, 217, 0.2); }
      .item-icon.rare { box-shadow: inset 0 0 8px rgba(156, 119, 219, 0.2); }
      .item-icon.epic { box-shadow: inset 0 0 12px rgba(240, 200, 102, 0.3); }

      /* Item icon image */
      .item-icon img.item-image {
        max-width: 80%;
        max-height: 80%;
        object-fit: contain;
        image-rendering: pixelated;
      }

      /* Price badge */
      .item-price {
        background-color: #5b8dd9;
        color: white;
        font-weight: bold;
        font-size: 14px;
        padding: 4px 10px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      /* Can't afford price */
      .item-price.cannot-afford {
        background-color: #e67e73;
        text-decoration: line-through;
      }

      /* Sold out badge */
      .sold-out-badge, .owned-badge {
        position: absolute;
        top: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 10px;
        padding: 3px 6px;
        border-radius: 0 8px 0 8px;
        font-weight: bold;
      }

      .sold-out-badge {
        background-color: #e67e73;
      }

      .owned-badge {
        background-color: #5b8dd9;
      }
    `;
    
    document.head.appendChild(styleEl);
    console.log("Added enhanced shop styles");
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('shop', ShopComponent);
}