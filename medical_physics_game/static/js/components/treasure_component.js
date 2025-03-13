// treasure_component.js - Component for treasure node type

const TreasureComponent = ComponentUtils.createComponent('treasure', {
    // Initialize component
    initialize: function() {
      console.log("Initializing treasure component");
    },
    
    // Render the treasure UI
    render: function(nodeData, container) {
      console.log("Rendering treasure component", nodeData);
      
      // Validate node data
      if (!nodeData.item) {
        this.showToast("No treasure found!", "warning");
        container.innerHTML = `
          <h3>Treasure Room</h3>
          <div class="alert alert-warning">
            <p>The treasure chest is empty!</p>
          </div>
          <button id="treasure-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        this.bindAction('treasure-continue-btn', 'click', 'continue', { nodeData });
        return;
      }
      
      // Create treasure UI
      const itemRarity = nodeData.item.rarity || 'common';
      container.innerHTML = `
        <div class="treasure-container">
          <div class="treasure-header">
            <h3 class="pixel-text">Treasure Found!</h3>
          </div>
          
          <div class="treasure-item-card rarity-${itemRarity}">
            <div class="item-icon-container">
              <div class="item-pixel-icon ${itemRarity}">
                ${this.getItemIcon(nodeData.item)}
              </div>
            </div>
            
            <div class="item-details">
              <div class="item-name-container">
                <h4 class="item-name">${nodeData.item.name}</h4>
                <span class="rarity-badge ${itemRarity}">${itemRarity}</span>
              </div>
              
              <p class="item-description">${nodeData.item.description}</p>
              
              <div class="item-effect-container">
                <span class="effect-label">Effect:</span>
                <span class="effect-value">${nodeData.item.effect?.value || 'None'}</span>
              </div>
            </div>
          </div>
          
          <div class="treasure-buttons">
            <button id="treasure-take-btn" class="btn btn-success mb-2">Take Item</button>
            <button id="treasure-leave-btn" class="btn btn-outline-secondary">Leave It</button>
          </div>
        </div>
      `;
      
      // Add event handlers
      this.bindAction('treasure-take-btn', 'click', 'takeItem', { 
        nodeData, item: nodeData.item 
      });
      this.bindAction('treasure-leave-btn', 'click', 'continue', { nodeData });
    },
    
    // Handle component actions
    handleAction: function(nodeData, action, data) {
      console.log(`Treasure component handling action: ${action}`, data);
      
      switch (action) {
        case 'takeItem':
          this.takeItem(nodeData, data.item);
          break;
          
        case 'continue':
          this.completeNode(nodeData);
          break;
          
        default:
          console.warn(`Unknown action: ${action}`);
      }
    },
    
    // Take the treasure item
    takeItem: function(nodeData, item) {
      console.log("Taking item:", item);
      
      // Add to inventory
      const added = this.addItemToInventory(item);
      
      if (added) {
        this.showFeedback(`Added ${item.name} to inventory!`, 'success');
      } else {
        this.showToast("Couldn't add item to inventory. It may be full.", "warning");
      }
      
      // Complete the node
      this.completeNode(nodeData);
    },
    
    // Get color class for rarity badge
    getRarityColor: function(rarity) {
      switch(rarity) {
        case 'common': return 'secondary';
        case 'uncommon': return 'primary';
        case 'rare': return 'info';
        case 'epic': return 'warning';
        default: return 'secondary';
      }
    }
  });
  
  // Register the component
  if (typeof NodeComponents !== 'undefined') {
    NodeComponents.register('treasure', TreasureComponent);
  }