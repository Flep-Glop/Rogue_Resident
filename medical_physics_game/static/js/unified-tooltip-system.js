// unified-tooltip-system.js - Single source of truth for all tooltips in the game

const UnifiedTooltipSystem = {
    // Track initialization to prevent duplicate setups
    initialized: false,
    
    // Initialize the system
    initialize: function() {
      // Prevent multiple initializations
      if (this.initialized) {
        console.log("UnifiedTooltipSystem already initialized");
        return this;
      }
      
      console.log("Initializing UnifiedTooltipSystem");
      
      // Add core tooltip styles
      this.addTooltipStyles();
      
      // Fix any existing tooltips in the DOM
      this.fixExistingTooltips();
      
      // Add global event listeners for positioning updates
      this.setupGlobalListeners();
      
      // Mark as initialized
      this.initialized = true;
      
      return this;
    },
    
    // Add essential tooltip styles to the document
    addTooltipStyles: function() {
      // Check if styles are already added
      if (document.getElementById('unified-tooltip-styles')) {
        return;
      }
      
      // Create style element
      const styleEl = document.createElement('style');
      styleEl.id = 'unified-tooltip-styles';
      styleEl.textContent = `
        /* === UNIFIED TOOLTIP SYSTEM === */
        
        /* Base tooltip container */
        .unified-tooltip {
          position: fixed !important; /* Use fixed positioning to escape parent constraints */
          z-index: 100000 !important; /* Extremely high z-index to be above everything */
          pointer-events: none !important; /* Initially pass through mouse events */
          opacity: 0 !important; /* Hidden by default */
          transition: opacity 0.2s ease, transform 0.2s ease !important;
          max-width: 350px !important; /* Maximum width */
          width: max-content !important; /* Adapt to content width */
          transform: translateY(10px) !important; /* Initial position for animation */
          filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5)) !important;
        }
        
        /* Tooltip visibility on hover */
        .tooltip-trigger:hover .unified-tooltip, .tooltip-trigger.hovered .unified-tooltip {
          opacity: 1 !important;
          transform: translateY(0) !important;
          pointer-events: auto !important; /* Allow mouse interaction when visible */
        }
        
        /* Content wrapper with background */
        .tooltip-content {
          background-color: #1e1e2a !important;
          border-radius: 5px !important;
          border: 2px solid rgba(91, 141, 217, 0.5) !important;
          overflow: hidden !important;
          font-family: 'Press Start 2P', cursive !important;
          font-size: 10px !important;
          color: #ffffff !important;
          line-height: 1.4 !important;
          max-height: 80vh !important; /* Prevent exceeding viewport height */
          overflow-y: auto !important; /* Add scrolling for tall content */
        }
        
        /* Tooltip header */
        .tooltip-header {
          padding: 8px !important;
          border-bottom: 2px solid rgba(0, 0, 0, 0.3) !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        
        /* Tooltip title */
        .tooltip-title {
          font-weight: bold !important;
          font-size: 10px !important;
          color: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Tooltip body */
        .tooltip-body {
          padding: 8px !important;
        }
        
        /* Tooltip description */
        .tooltip-desc {
          margin-bottom: 8px !important;
          line-height: 1.3 !important;
          color: rgba(255, 255, 255, 0.9) !important;
          font-size: 10px !important;
        }
        
        /* Tooltip effect */
        .tooltip-effect {
          color: #5b8dd9 !important;
          margin-bottom: 8px !important;
          padding: 8px !important;
          background-color: rgba(0, 0, 0, 0.2) !important;
          border-radius: 3px !important;
          font-size: 10px !important;
        }
        
        /* Passive text styling */
        .passive-text {
          color: #f0c866 !important;
        }
        
        /* Rarity colors for tooltip headers */
        .tooltip-header.common {
          background-color: rgba(170, 170, 170, 0.2) !important;
        }
        
        .tooltip-header.uncommon {
          background-color: rgba(91, 141, 217, 0.2) !important;
        }
        
        .tooltip-header.rare {
          background-color: rgba(156, 119, 219, 0.2) !important;
        }
        
        .tooltip-header.epic {
          background-color: rgba(240, 200, 102, 0.2) !important;
        }
        
        /* Tooltip rarity badge */
        .tooltip-rarity {
          font-size: 8px !important;
          padding: 3px 6px !important;
          border-radius: 3px !important;
          background-color: rgba(0, 0, 0, 0.3) !important;
          text-transform: capitalize !important;
          margin: 0 !important;
        }
        
        /* Tooltip positioning arrow */
        .tooltip-arrow {
          position: absolute !important;
          width: 0 !important; 
          height: 0 !important;
          border-left: 8px solid transparent !important;
          border-right: 8px solid transparent !important;
          border-top: 8px solid #1e1e2a !important;
          bottom: -8px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 1 !important;
        }
        
        /* Hide old tooltip systems */
        .item-tooltip, 
        .standardized-tooltip, 
        .shop-tooltip,
        .tooltip:not(.unified-tooltip) {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `;
      
      document.head.appendChild(styleEl);
      console.log("Added unified tooltip styles");
    },
    
    // Create HTML for a tooltip
    createTooltipHTML: function(item) {
      if (!item) {
        console.warn("Cannot create tooltip: Item data is missing");
        return '';
      }
      
      // Create a unique ID for this tooltip
      const tooltipId = `tooltip-${item.id || Math.random().toString(36).substr(2, 9)}`;
      
      // Determine if it's a relic or consumable
      const isRelic = item.itemType === 'relic';
      const rarity = item.rarity || 'common';
      
      // Get effect text
      let effectText = '';
      if (item.effect && item.effect.value) {
        effectText = item.effect.value;
      } else if (isRelic && item.passiveText) {
        effectText = item.passiveText;
      } else if (item.description) {
        effectText = item.description;
      } else {
        effectText = 'No effect information available';
      }
      
      // Build tooltip HTML
      return `
        <div class="unified-tooltip" id="${tooltipId}" data-item-id="${item.id || ''}">
          <div class="tooltip-content">
            <div class="tooltip-header ${rarity}">
              <span class="tooltip-title">${item.name || 'Unknown Item'}</span>
              <span class="tooltip-rarity">${rarity}</span>
            </div>
            <div class="tooltip-body">
              <p class="tooltip-desc">${item.description || 'No description available'}</p>
              <div class="tooltip-effect">
                ${isRelic ? 
                  `<span class="passive-text">Passive: ${effectText}</span>` :
                  `<span>Effect: ${effectText}</span>`
                }
              </div>
              ${isRelic ? '' : 
                `<div class="tooltip-usage" ${item.price ? `data-price="${item.price}"` : ''}>
                   ${item.price ? `Price: ${item.price} Insight` : 'Click to use'}
                 </div>`
              }
            </div>
          </div>
          <div class="tooltip-arrow"></div>
        </div>
      `;
    },
    
    // Apply a tooltip to an existing element
    applyTooltip: function(element, item) {
      if (!element) {
        console.warn("Cannot apply tooltip: Target element is missing");
        return null;
      }
      
      if (!item) {
        console.warn("Cannot apply tooltip: Item data is missing");
        return null;
      }
      
      // Ensure the element has position if not already set
      const currentPosition = window.getComputedStyle(element).position;
      if (currentPosition === 'static') {
        element.style.position = 'relative';
      }
      
      // Add tooltip trigger class
      element.classList.add('tooltip-trigger');
      
      // Remove any existing tooltips
      const existingTooltip = element.querySelector('.unified-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      
      // Add the new tooltip
      const tooltipHTML = this.createTooltipHTML(item);
      element.insertAdjacentHTML('beforeend', tooltipHTML);
      
      // Get the newly added tooltip
      const tooltip = element.querySelector('.unified-tooltip');
      
      // Set initial position - will be updated by positionTooltip
      tooltip.style.top = '-10000px';
      tooltip.style.left = '-10000px';

      document.querySelectorAll('.unified-tooltip').forEach(tooltip => {
        tooltip.style.zIndex = '100000';
      });
      
      // Setup positioning after a brief delay to ensure DOM is ready
      setTimeout(() => {
        this.positionTooltip(element, tooltip);
      }, 50);
      
      return tooltip;
    },
    
    // Position a tooltip relative to its trigger element
    positionTooltip: function(trigger, tooltip) {
      if (!trigger || !tooltip) return;
      
      // Function to position the tooltip
      const position = () => {
        // Get dimensions and positions
        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Calculate initial position (above the element)
        let top = triggerRect.top - tooltipRect.height - 10;
        let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        
        // Make sure tooltip is visible in viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Check for horizontal overflow
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewportWidth - 10) {
          left = viewportWidth - tooltipRect.width - 10;
        }
        
        // Check for vertical overflow - if no room above, position below
        let position = 'top';
        if (top < 10) {
          top = triggerRect.bottom + 10;
          position = 'bottom';
          
          // Move arrow to top
          const arrow = tooltip.querySelector('.tooltip-arrow');
          if (arrow) {
            arrow.style.bottom = 'auto';
            arrow.style.top = '-8px';
            arrow.style.borderBottom = '8px solid #1e1e2a';
            arrow.style.borderTop = 'none';
          }
        } else {
          // Reset arrow position for top
          const arrow = tooltip.querySelector('.tooltip-arrow');
          if (arrow) {
            arrow.style.top = 'auto';
            arrow.style.bottom = '-8px';
            arrow.style.borderTop = '8px solid #1e1e2a';
            arrow.style.borderBottom = 'none';
          }
        }
        
        // Apply the calculated position
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        
        // Ensure tooltip has high z-index and fixed positioning
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '100000';
        
        // Adjust arrow position if tooltip is shifted from center
        const arrow = tooltip.querySelector('.tooltip-arrow');
        if (arrow) {
          const arrowLeft = Math.max(0, Math.min(tooltipRect.width - 16, 
            (triggerRect.left + triggerRect.width/2) - left));
          arrow.style.left = `${arrowLeft}px`;
          arrow.style.transform = 'none';
        }
      };
      
      // Position once initially
      position();
      
      // Attach to the tooltip's parent element for future updates
      trigger._positionTooltip = position;
      
      return position;
    },
    
    // Fix any existing tooltips in the DOM
    fixExistingTooltips: function() {
      console.log("Scanning for existing tooltips to fix");
      
      // List of common tooltip container selectors
      const containers = [
        '.inventory-item',
        '.shop-item',
        '.simplified-shop-item',
        '.treasure-item-card',
        '.relic-item',
        '.item-with-tooltip',
        '.game-card'
      ];
      
      containers.forEach(selector => {
        document.querySelectorAll(selector).forEach(container => {
          try {
            // Extract item data from existing DOM elements
            const item = this.extractItemDataFromElement(container);
            if (item && item.name) {
              // Apply new unified tooltip
              this.applyTooltip(container, item);
            }
          } catch (error) {
            console.warn(`Error fixing tooltip for ${selector}:`, error);
          }
        });
      });
    },
    
    // Extract item data from an existing DOM element
    extractItemDataFromElement: function(element) {
      const item = {};
      
      try {
        // Try to find common item properties in the DOM
        
        // Check for a direct data attribute
        if (element.dataset.itemId) {
          item.id = element.dataset.itemId;
        }
        
        // Look for a name element
        const nameEl = element.querySelector('.item-name, .tooltip-title, .relic-name');
        if (nameEl) {
          item.name = nameEl.textContent.trim();
        }
        
        // Check for rarity
        const rarityEl = element.querySelector('.tooltip-rarity, .item-rarity, .rarity-badge');
        if (rarityEl) {
          item.rarity = rarityEl.textContent.trim().toLowerCase();
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
        
        // Look for description
        const descEl = element.querySelector('.tooltip-desc, .item-description, .relic-desc');
        if (descEl) {
          item.description = descEl.textContent.trim();
        }
        
        // Look for item type (relic or consumable)
        if (element.classList.contains('relic-item')) {
          item.itemType = 'relic';
        } else if (element.querySelector('.passive-text')) {
          item.itemType = 'relic';
        } else {
          item.itemType = 'consumable';
        }
        
        // Look for effect
        const effectEl = element.querySelector('.tooltip-effect, .item-effect, .relic-effect');
        if (effectEl) {
          item.effect = {
            value: effectEl.textContent.trim()
          };
        }
        
        // Look for price (for shop items)
        const priceEl = element.querySelector('.item-price');
        if (priceEl) {
          item.price = parseInt(priceEl.textContent.trim(), 10) || null;
        }
        
        return item;
      } catch (error) {
        console.warn("Error extracting item data:", error);
        return null;
      }
    },
    
    // Setup global event listeners for positioning updates
    setupGlobalListeners: function() {
      // Update tooltip positions on scroll
      window.addEventListener('scroll', this.updateAllTooltipPositions, { passive: true });
      
      // Update tooltip positions on resize
      window.addEventListener('resize', this.updateAllTooltipPositions, { passive: true });
      
      // Handle clicks on tooltip triggers
      document.addEventListener('click', (e) => {
        // Find the closest tooltip trigger
        const trigger = e.target.closest('.tooltip-trigger');
        if (!trigger) return;
        
        // Check if the trigger has a tooltip
        const tooltip = trigger.querySelector('.unified-tooltip');
        if (!tooltip) return;
        
        // Find the itemId
        const itemId = tooltip.dataset.itemId;
        if (!itemId) return;
        
        // Forward the click event to inventory/item manager
        if (window.ItemManager && typeof ItemManager.useItem === 'function') {
          ItemManager.useItem(itemId);
        } else if (window.InventorySystem && typeof InventorySystem.useItem === 'function') {
          InventorySystem.useItem(itemId);
        }
      });
    },
    
    // Update the position of all tooltips
    updateAllTooltipPositions: function() {
      document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
        if (trigger._positionTooltip && typeof trigger._positionTooltip === 'function') {
          trigger._positionTooltip();
        }
      });
    },
    
    // Create a standardized item display
    createItemDisplay: function(item, options = {}) {
      // Default options
      const {
        size = 48,
        showName = false,
        showRarity = true,
        isClickable = true,
        onClick = null
      } = options;
      
      // Create container
      const container = document.createElement('div');
      container.className = `game-item ${item.rarity || 'common'} tooltip-trigger`;
      if (isClickable) container.classList.add('clickable');
      
      container.style.cssText = `
        position: relative;
        width: ${size}px;
        height: ${size}px;
        background-color: #1e1e2a;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        border: 2px solid transparent;
      `;
      
      // Set border color based on rarity
      switch (item.rarity) {
        case 'uncommon': container.style.borderColor = '#5b8dd9'; break;
        case 'rare': container.style.borderColor = '#9c77db'; break;
        case 'epic': container.style.borderColor = '#f0c866'; break;
        default: container.style.borderColor = '#aaa';
      }
      
      // Create inner item content
      container.innerHTML = `
        <div class="item-inner" style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${this.getItemIconHTML(item, size * 0.8)}
        </div>
        ${showName ? `
          <div class="item-name-label" style="
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: rgba(0,0,0,0.7);
            padding: 2px;
            font-size: 8px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${item.name}</div>
        ` : ''}
        ${showRarity ? `
          <div class="item-rarity-indicator" style="
            position: absolute;
            top: 0;
            right: 0;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${this.getRarityColor(item.rarity)};
          "></div>
        ` : ''}
      `;
      
      // Add hover effects
      if (isClickable) {
        container.style.cursor = 'pointer';
        
        container.addEventListener('mouseenter', () => {
          container.style.transform = 'translateY(-3px)';
          container.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
        });
        
        container.addEventListener('mouseleave', () => {
          container.style.transform = '';
          container.style.boxShadow = '';
        });
        
        // Add click handler
        if (onClick) {
          container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(item, container);
          });
        }
      }
      
      // Apply tooltip
      this.applyTooltip(container, item);
      
      return container;
    },
    
    // Get HTML for an item icon
    getItemIconHTML: function(item, size = 32) {
      // Check if the item has a custom icon path
      if (item.iconPath) {
        return `<img src="/static/img/items/${item.iconPath}" alt="${item.name || 'Item'}" 
                style="max-width: 80%; max-height: 80%; object-fit: contain; image-rendering: pixelated;">`;
      }
      
      // Fallback icon based on item type
      const iconName = this.getIconName(item);
      return `<img src="/static/img/items/${iconName}.png" alt="${item.name || 'Item'}" 
              style="max-width: 80%; max-height: 80%; object-fit: contain; image-rendering: pixelated;">`;
    },
    
    // Get icon name based on item properties
    getIconName: function(item) {
      const itemName = (item.name || '').toLowerCase();
      
      if (itemName.includes('textbook') || itemName.includes('book') || itemName.includes('manual'))
        return 'Textbook';
      if (itemName.includes('badge') || itemName.includes('dosimeter'))
        return 'Nametag';
      if (itemName.includes('goggles') || itemName.includes('glasses'))
        return '3D Glasses';
      if (itemName.includes('notebook') || itemName.includes('note'))
        return 'Yellow Sticky Note';
      
      // Default fallback
      return item.itemType === 'relic' ? 'USB Stick' : 'Paperclip';
    },
    
    // Get color for rarity
    getRarityColor: function(rarity) {
      switch (rarity) {
        case 'uncommon': return '#5b8dd9';
        case 'rare': return '#9c77db';
        case 'epic': return '#f0c866';
        default: return '#aaa';
      }
    },
    
    // Debug helper to visualize tooltip positioning
    debugTooltip: function(selector) {
      const elements = document.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements matching ${selector}`);
      
      elements.forEach((el, i) => {
        el.classList.add('tooltip-debug');
        console.log(`Element ${i} dimensions:`, el.getBoundingClientRect());
        
        // Find related tooltip
        const tooltip = el.querySelector('.unified-tooltip');
        if (tooltip) {
          tooltip.classList.add('tooltip-debug');
          console.log(`Tooltip ${i} dimensions:`, tooltip.getBoundingClientRect());
        } else {
          console.log(`No tooltip found for element ${i}`);
        }
      });
    }
  };
  
  // Initialize on script load
  if (typeof window !== 'undefined') {
    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        UnifiedTooltipSystem.initialize();
      });
    } else {
      // DOM already loaded, initialize immediately
      UnifiedTooltipSystem.initialize();
    }
  }
  
  // Make available globally
  window.UnifiedTooltipSystem = UnifiedTooltipSystem;