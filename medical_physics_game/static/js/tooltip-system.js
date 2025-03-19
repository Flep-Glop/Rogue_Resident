// tooltip-system.js
const TooltipSystem = {
    // Singleton tooltip element
    tooltipEl: null,
    
    // Currently active trigger element
    activeTrigger: null,
    
    // Initialize the system
    initialize: function() {
      // Add global styles
      this.addStyles();
      
      // Create tooltip container
      this.createTooltipElement();
      
      // Set up event delegation
      this.setupEvents();
      
      console.log("Tooltip System initialized");
      return this;
    },
    
    // Add required styles
    addStyles: function() {
      if (document.getElementById('tooltip-system-styles')) return;
      
      const styleEl = document.createElement('style');
      styleEl.id = 'tooltip-system-styles';
      styleEl.textContent = `
        /* Tooltip root container - always at top level */
        #tooltip-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 0;
          overflow: visible;
          pointer-events: none;
          z-index: 1000000;
        }
        
        /* Tooltip element */
        .game-tooltip {
          position: fixed;
          z-index: 1000000;
          background-color: #1e1e2a;
          border: 2px solid rgba(91, 141, 217, 0.5);
          border-radius: 5px;
          padding: 0;
          font-family: 'Press Start 2P', cursive;
          font-size: 10px;
          color: #ffffff;
          max-width: 350px;
          width: max-content;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
          filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
        }
        
        /* Visible state */
        .game-tooltip.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
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
          margin: 0;
          padding: 0;
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
          font-size: 10px;
        }
        
        /* Tooltip effect */
        .tooltip-effect {
          color: #5b8dd9;
          margin-bottom: 8px;
          padding: 8px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
          font-size: 10px;
        }
        
        /* Passive text for relics */
        .passive-text {
          color: #f0c866;
        }
        
        /* Rarity styles */
        .tooltip-header.common { background-color: rgba(170, 170, 170, 0.2); }
        .tooltip-header.uncommon { background-color: rgba(91, 141, 217, 0.2); }
        .tooltip-header.rare { background-color: rgba(156, 119, 219, 0.2); }
        .tooltip-header.epic { background-color: rgba(240, 200, 102, 0.2); }
        
        /* Tooltip arrow */
        .tooltip-arrow {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #1e1e2a;
          bottom: -8px;
          left: 50%;
          margin-left: -8px;
        }
        
        /* Hide all old tooltips */
        .item-tooltip, .unified-tooltip, 
        .standardized-tooltip, .shop-tooltip {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(styleEl);
    },
    
    // Create singleton tooltip element
    createTooltipElement: function() {
      // Check if container exists
      let container = document.getElementById('tooltip-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'tooltip-container';
        document.body.appendChild(container);
      }
      
      // Create tooltip element
      const tooltip = document.createElement('div');
      tooltip.className = 'game-tooltip';
      tooltip.innerHTML = `
        <div class="tooltip-header">
          <span class="tooltip-title"></span>
          <span class="tooltip-rarity"></span>
        </div>
        <div class="tooltip-body">
          <p class="tooltip-desc"></p>
          <div class="tooltip-effect"></div>
        </div>
        <div class="tooltip-arrow"></div>
      `;
      
      container.appendChild(tooltip);
      this.tooltipEl = tooltip;
    },
    
    // Set up event listeners using delegation
    setupEvents: function() {
      // Mouse move for tracking position
      document.addEventListener('mousemove', this.handleMouseMove.bind(this));
      
      // Mouse enter/leave for tooltip triggers
      document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
      document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
      
      // Window resize for tooltip repositioning
      window.addEventListener('resize', this.handleResize.bind(this));
      
      // Handle scroll events on any element
      document.addEventListener('scroll', this.handleScroll.bind(this), true);
      
      // Click handler for tooltip triggers
      document.addEventListener('click', this.handleClick.bind(this));
    },
    
    // Handle mouse movement to position tooltip
    handleMouseMove: function(e) {
      if (!this.activeTrigger) return;
      
      // Update position if we have an active trigger
      this.positionTooltip(this.activeTrigger);
    },
    
    // Minimal fix for just the handleMouseEnter function
    handleMouseEnter: function(e) {
        try {
        // Check if target or any parent has tooltip data
        const trigger = e.target.closest('[data-tooltip], [data-tooltip-item]');
        if (!trigger) return;
        
        // Set active trigger
        this.activeTrigger = trigger;
        
        // Configure and show tooltip
        this.updateTooltipContent(trigger);
        this.positionTooltip(trigger);
        this.showTooltip();
        } catch(err) {
        // Silently handle the error and continue
        console.log("Tooltip hover handling error:", err);
        }
    },
    
    // Handle mouse leave
    handleMouseLeave: function(e) {
      // Only process if we have an active trigger
      if (!this.activeTrigger) return;
      
      // Check if mouse left the trigger
      const trigger = this.activeTrigger;
      const relatedTarget = e.relatedTarget;
      
      // If mouse left the trigger or went to an element outside the trigger
      if (!trigger.contains(relatedTarget) && trigger !== relatedTarget) {
        this.hideTooltip();
        this.activeTrigger = null;
      }
    },
    
    // Handle window resize
    handleResize: function() {
      if (this.activeTrigger) {
        this.positionTooltip(this.activeTrigger);
      }
    },
    
    // Handle scroll events
    handleScroll: function(e) {
      if (this.activeTrigger) {
        this.positionTooltip(this.activeTrigger);
      }
    },
    
    // Handle click on tooltip triggers
    handleClick: function(e) {
      // Find tooltip trigger
      const trigger = e.target.closest('[data-tooltip-item]');
      if (!trigger) return;
      
      // Check for item ID
      const itemId = trigger.dataset.itemId || trigger.dataset.tooltipItem;
      if (!itemId) return;
      
      // Find appropriate handler
      if (window.ItemManager && typeof ItemManager.useItem === 'function') {
        ItemManager.useItem(itemId);
      } else if (window.InventorySystem && typeof InventorySystem.useItem === 'function') {
        InventorySystem.useItem(itemId);
      }
    },
    
    // Update tooltip content from trigger element
    updateTooltipContent: function(trigger) {
      // Reset content
      const titleEl = this.tooltipEl.querySelector('.tooltip-title');
      const rarityEl = this.tooltipEl.querySelector('.tooltip-rarity');
      const descEl = this.tooltipEl.querySelector('.tooltip-desc');
      const effectEl = this.tooltipEl.querySelector('.tooltip-effect');
      const headerEl = this.tooltipEl.querySelector('.tooltip-header');
      
      // Remove all rarity classes from header
      headerEl.classList.remove('common', 'uncommon', 'rare', 'epic');
      
      // Get tooltip data
      let item;
      if (trigger.dataset.tooltipItem) {
        // Try to load item from game state
        item = this.getItemById(trigger.dataset.tooltipItem);
      } else {
        // Extract data from element
        item = this.extractItemData(trigger);
      }
      
      if (!item || !item.name) {
        titleEl.textContent = 'Unknown Item';
        rarityEl.textContent = 'common';
        descEl.textContent = 'No description available';
        effectEl.textContent = '';
        headerEl.classList.add('common');
        return;
      }
      
      // Update tooltip content
      titleEl.textContent = item.name;
      rarityEl.textContent = item.rarity || 'common';
      descEl.textContent = item.description || '';
      
      // Get effect text
      let effectText = '';
      if (item.effect && item.effect.value) {
        effectText = item.effect.value;
      } else if (item.itemType === 'relic' && item.passiveText) {
        effectText = item.passiveText;
      }
      
      // Set effect text
      if (item.itemType === 'relic') {
        effectEl.innerHTML = `<span class="passive-text">Passive: ${effectText}</span>`;
      } else {
        effectEl.innerHTML = `<span>Effect: ${effectText}</span>`;
      }
      
      // Add rarity class to header
      headerEl.classList.add(item.rarity || 'common');
    },
    
    // Position tooltip relative to trigger
    positionTooltip: function(trigger) {
      if (!trigger || !this.tooltipEl) return;
      
      // Get trigger position
      const triggerRect = trigger.getBoundingClientRect();
      
      // Calculate position for tooltip
      let left = triggerRect.left + (triggerRect.width / 2);
      let top = triggerRect.top - 10; // Position above by default
      
      // Get tooltip size
      const tooltipRect = this.tooltipEl.getBoundingClientRect();
      
      // Center tooltip horizontally on trigger
      left -= (tooltipRect.width / 2);
      
      // Position tooltip above or below trigger
      if (top - tooltipRect.height < 10) {
        // Not enough room above, position below
        top = triggerRect.bottom + 10;
        
        // Move arrow to top
        const arrow = this.tooltipEl.querySelector('.tooltip-arrow');
        arrow.style.bottom = 'auto';
        arrow.style.top = '-8px';
        arrow.style.borderTop = 'none';
        arrow.style.borderBottom = '8px solid #1e1e2a';
      } else {
        // Position above
        top -= tooltipRect.height;
        
        // Move arrow to bottom
        const arrow = this.tooltipEl.querySelector('.tooltip-arrow');
        arrow.style.top = 'auto';
        arrow.style.bottom = '-8px';
        arrow.style.borderBottom = 'none';
        arrow.style.borderTop = '8px solid #1e1e2a';
      }
      
      // Keep tooltip within viewport
      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      
      // Apply position
      this.tooltipEl.style.left = `${left}px`;
      this.tooltipEl.style.top = `${top}px`;
      
      // If the tooltip was repositioned away from center, adjust arrow
      const arrow = this.tooltipEl.querySelector('.tooltip-arrow');
      const arrowLeft = (triggerRect.left + triggerRect.width/2) - left;
      
      // Keep arrow within tooltip bounds
      if (arrowLeft < 10) {
        arrow.style.left = '10px';
      } else if (arrowLeft > tooltipRect.width - 10) {
        arrow.style.left = `${tooltipRect.width - 10}px`;
      } else {
        arrow.style.left = `${arrowLeft}px`;
      }
      arrow.style.marginLeft = '0';
    },
    
    // Show tooltip
    showTooltip: function() {
      this.tooltipEl.classList.add('visible');
    },
    
    // Hide tooltip
    hideTooltip: function() {
      this.tooltipEl.classList.remove('visible');
    },
    
    // Get item data from ID
    getItemById: function(itemId) {
      // Try to get from different managers
      if (window.ItemManager && typeof ItemManager.getItemById === 'function') {
        const item = ItemManager.getItemById(itemId);
        if (item) return item;
      }
      
      // Try to get from game state
      if (window.GameState && GameState.data && GameState.data.inventory) {
        const item = GameState.data.inventory.find(i => i.id === itemId);
        if (item) return item;
      }
      
      return null;
    },
    
    // Extract item data from element attributes and content
    extractItemData: function(element) {
      const item = {};
      
      // Check for direct data attributes
      if (element.dataset.itemId) {
        item.id = element.dataset.itemId;
      }
      
      if (element.dataset.itemName) {
        item.name = element.dataset.itemName;
      } else {
        // Try to find name in element content
        const nameEl = element.querySelector('.item-name, [class*="name"]');
        if (nameEl) {
          item.name = nameEl.textContent.trim();
        }
      }
      
      // Extract rarity
      if (element.dataset.itemRarity) {
        item.rarity = element.dataset.itemRarity;
      } else {
        // Try to determine from classes
        const rarityClasses = ['common', 'uncommon', 'rare', 'epic'];
        rarityClasses.forEach(rarity => {
          if (element.classList.contains(rarity)) {
            item.rarity = rarity;
          }
          if (element.classList.contains(`rarity-${rarity}`)) {
            item.rarity = rarity;
          }
        });
      }
      
      // Extract description
      if (element.dataset.itemDescription) {
        item.description = element.dataset.itemDescription;
      } else {
        // Try to find description in element content
        const descEl = element.querySelector('.item-description, [class*="desc"]');
        if (descEl) {
          item.description = descEl.textContent.trim();
        }
      }
      
      // Extract item type
      if (element.dataset.itemType) {
        item.itemType = element.dataset.itemType;
      } else if (element.classList.contains('relic-item')) {
        item.itemType = 'relic';
      } else {
        item.itemType = 'consumable';
      }
      
      // Extract effect
      if (element.dataset.itemEffect) {
        item.effect = {
          type: element.dataset.itemEffectType || 'default',
          value: element.dataset.itemEffect
        };
      } else {
        // Try to find effect in element content
        const effectEl = element.querySelector('.item-effect, [class*="effect"]');
        if (effectEl) {
          item.effect = {
            value: effectEl.textContent.trim()
          };
        }
      }
      
      return item;
    },
    
    // Register an element to show tooltips
    registerTooltip: function(element, item) {
      if (!element) return;
      
      // Clean any old tooltip classes
      element.classList.remove('tooltip-trigger');
      
      // Set data attributes
      element.dataset.tooltipItem = item.id;
      
      // For easier use in CSS/scripting
      element.dataset.itemId = item.id;
      element.dataset.itemRarity = item.rarity || 'common';
      element.dataset.itemType = item.itemType || 'consumable';
      
      // If any old tooltips exist, remove them
      const oldTooltip = element.querySelector('.unified-tooltip, .item-tooltip');
      if (oldTooltip) {
        oldTooltip.remove();
      }
    }
  };
  
  // Initialize on script load
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        TooltipSystem.initialize();
      });
    } else {
      TooltipSystem.initialize();
    }
  }
  
  // Make available globally
  window.TooltipSystem = TooltipSystem;