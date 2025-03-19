// Enhanced shop_component.js with fixes for refresh issues and standardized item display

const ShopComponent = ComponentUtils.createComponent('shop', {
  // Initialize component
  initialize: function() {
    console.log("Initializing enhanced shop component");
    this.resetComponentState();
    
    // Initialize the unified tooltip system if available
    if (window.UnifiedTooltipSystem && typeof UnifiedTooltipSystem.initialize === 'function') {
      UnifiedTooltipSystem.initialize();
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
    
    // Add shop-specific styles
    this.addEnhancedStyles();
    
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
  
  // Render items with enhanced layout and standardized item display
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
  
  // Create a simplified item card with just icon and price
  createItemCard: function(item) {
    const canAfford = this.getPlayerInsight() >= item.price;
    const isPurchased = this.purchasedItems.has(item.id);
    const isInInventory = this.isItemInInventory(item);
    
    const card = document.createElement('div');
    card.className = `simplified-shop-item ${item.rarity || 'common'} ${isPurchased ? 'purchased' : ''} ${isInInventory && item.itemType === 'relic' ? 'owned' : ''}`;
    card.dataset.id = item.id;
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
    
    // Add tooltip using the unified tooltip system
    if (window.UnifiedTooltipSystem && typeof UnifiedTooltipSystem.applyTooltip === 'function') {
      UnifiedTooltipSystem.applyTooltip(card, item);
    } else {
      // Fallback to inline tooltip if unified system isn't available
      card.appendChild(this.createInlineTooltip(item));
    }
    
    // Only make clickable if not purchased/owned and can afford
    const isClickable = !isPurchased && !(isInInventory && item.itemType === 'relic') && canAfford;
    
    if (isClickable) {
      card.classList.add('clickable');
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.purchaseItem(item);
      });
    }
    
    return card;
  },

  // Fallback tooltip if unified system isn't available
  createInlineTooltip: function(item) {
    const tooltip = document.createElement('div');
    tooltip.className = 'standardized-tooltip';
    
    tooltip.innerHTML = `
      <div class="tooltip-bridge"></div>
      <div class="tooltip-content">
        <div class="tooltip-header ${item.rarity || 'common'}">
          <span class="tooltip-title">${item.name}</span>
          <span class="tooltip-rarity">${item.rarity || 'common'}</span>
        </div>
        <div class="tooltip-body">
          <p class="tooltip-desc">${item.description}</p>
          <div class="tooltip-effect">
            ${item.itemType === 'relic' ? 
              `<span class="passive-text">Passive: ${item.description}</span>` :
              `<span>Effect: ${item.effect?.value || item.description}</span>`
            }
          </div>
        </div>
      </div>
    `;
    
    return tooltip;
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
  
  // Get item icon HTML using standardized approach
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
  
  // Direct method to leave shop - bypasses component action system
  leaveShop: function(nodeData) {
    console.log("🔍 Direct leave shop method called");
    
    // Prevent multiple completions
    if (this.completedFlag) {
      console.log("🔍 Node already completed, showing map view only");
      return this.safelyShowMapView();
    }
    
    this.completedFlag = true;
    
    // Save node ID for reference
    const nodeId = nodeData?.id || GameState.getCurrentNodeId();
    console.log(`🔍 Leaving shop, node ID: ${nodeId}`);
    
    if (nodeId) {
      // First update node in game state directly
      if (window.GameState && GameState.data && GameState.data.map) {
        if (GameState.data.map.nodes && GameState.data.map.nodes[nodeId]) {
          GameState.data.map.nodes[nodeId].visited = true;
          console.log(`✅ Node ${nodeId} marked as visited in map.nodes`);
        } else if (GameState.data.map.boss && GameState.data.map.boss.id === nodeId) {
          GameState.data.map.boss.visited = true;
          console.log(`✅ Boss node ${nodeId} marked as visited`);
        }
        
        // Clear current node
        if (typeof GameState.setCurrentNode === 'function') {
          GameState.setCurrentNode(null);
          console.log("✅ Current node set to null");
        }
      }
      
      // Then try API
      if (window.ApiClient && typeof ApiClient.markNodeVisited === 'function') {
        ApiClient.markNodeVisited(nodeId)
          .then(() => {
            console.log(`✅ Node ${nodeId} marked as visited via API`);
            
            // Emit completion event
            if (window.EventSystem) {
              EventSystem.emit(GAME_EVENTS.NODE_COMPLETED, nodeId);
              console.log(`✅ Emitted NODE_COMPLETED event for ${nodeId}`);
            }
          })
          .catch(error => {
            console.warn(`❌ Error marking node visited via API: ${error.message}`);
            // Still try to show map view
          })
          .finally(() => {
            // Always try to show map
            setTimeout(() => this.safelyShowMapView(), 100);
          });
      } else {
        // No API available, just show map
        console.log("❓ API not available, just showing map view");
        this.safelyShowMapView();
      }
    } else {
      // No node ID, just show map
      console.log("❓ No node ID found, just showing map view");
      this.safelyShowMapView();
    }
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
    console.log("🔍 Safely showing map view");
    
    // Try multiple approaches to ensure the map view is shown
    
    // Method 1: Use UI.showMapView if available
    if (window.UI && typeof UI.showMapView === 'function') {
      console.log("🔍 Using UI.showMapView");
      UI.showMapView();
    }
    
    // Method 2: Manual DOM manipulation
    console.log("🔍 Also applying manual DOM updates for redundancy");
    
    // Hide any modal overlay
    const modal = document.getElementById('node-modal-overlay');
    if (modal) {
      modal.style.display = 'none';
      console.log("✅ Hidden modal overlay");
      
      // Move interaction containers back
      const modalContent = document.getElementById('node-modal-content');
      if (modalContent) {
        const containers = modalContent.querySelectorAll('.interaction-container');
        const gameBoard = document.querySelector('.col-md-9');
        
        if (gameBoard) {
          containers.forEach(container => {
            gameBoard.appendChild(container);
            container.style.display = 'none';
            console.log(`✅ Moved and hidden container: ${container.id}`);
          });
        }
      }
    }
    
    // Hide all interaction containers
    document.querySelectorAll('.interaction-container').forEach(container => {
      container.style.display = 'none';
      console.log(`✅ Hidden interaction container: ${container.id}`);
    });
    
    // Show map container
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      mapContainer.style.display = 'block';
      console.log("✅ Shown map container");
    }
    
    // Method 3: Force redraw map
    if (window.MapRenderer && typeof MapRenderer.renderMap === 'function') {
      console.log("🔍 Forcing map render");
      setTimeout(() => {
        MapRenderer.renderMap();
        console.log("✅ Map re-rendered");
      }, 200);
    }
    
    console.log("✅ All map view methods applied");
  },
  
  // Add enhanced shop styles and standardized tooltip styles
  addEnhancedStyles: function() {
    if (document.getElementById('enhanced-shop-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'enhanced-shop-styles';
    styleEl.textContent = `
      /* Add these styles to your shop component's addEnhancedStyles method */

      /* Grid for icon-based shop */
      .shop-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
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
      .item-icon img {
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
      
      /* STANDARDIZED TOOLTIP SYSTEM */
      
      /* Tooltip container */
      .standardized-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 220px;
        pointer-events: none;
        opacity: 0;
        z-index: 9999;
        transition: opacity 0.2s, transform 0.2s;
      }
      
      /* Show tooltip on hover */
      .shop-item-card:hover .standardized-tooltip,
      .inventory-item:hover .standardized-tooltip {
        opacity: 1;
        transform: translateX(-50%) translateY(-5px);
        pointer-events: auto; /* Enable mouse interaction with tooltip */
      }
      
      /* Invisible bridge between item and tooltip */
      .tooltip-bridge {
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 20px;
        /* For debugging: background-color: rgba(255, 0, 0, 0.3); */
      }
      
      /* Tooltip content */
      .tooltip-content {
        background-color: #1e1e2a;
        border-radius: 5px;
        border: 2px solid rgba(91, 141, 217, 0.5);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        font-family: 'Press Start 2P', cursive;
        font-size: 10px;
      }
      
      /* Tooltip header */
      .tooltip-header {
        padding: 8px;
        border-bottom: 2px solid rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      /* Tooltip title */
      .tooltip-title {
        font-weight: bold;
        font-size: 10px;
        color: white;
      }
      
      /* Tooltip body */
      .tooltip-body {
        padding: 8px;
      }
      
      /* Tooltip description */
      .tooltip-desc {
        margin-bottom: 8px;
        line-height: 1.3;
        color: rgba(255, 255, 255, 0.9);
      }
      
      /* Tooltip effect */
      .tooltip-effect {
        color: #5b8dd9;
        margin-bottom: 8px;
        padding: 8px;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      
      /* Passive text */
      .passive-text {
        color: #f0c866;
      }
      
      /* Rarity colors for tooltip headers */
      .tooltip-header.common {
        background-color: rgba(170, 170, 170, 0.2);
      }
      
      .tooltip-header.uncommon {
        background-color: rgba(91, 141, 217, 0.2);
      }
      
      .tooltip-header.rare {
        background-color: rgba(156, 119, 219, 0.2);
      }
      
      .tooltip-header.epic {
        background-color: rgba(240, 200, 102, 0.2);
      }
      
      /* Tooltip rarity badge */
      .tooltip-rarity {
        font-size: 8px;
        padding: 2px 4px;
        border-radius: 3px;
        background-color: rgba(0, 0, 0, 0.3);
        text-transform: capitalize;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('shop', ShopComponent);
}