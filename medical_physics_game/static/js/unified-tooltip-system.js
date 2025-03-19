// unified-tooltip-system.js

// This system provides a standardized way to display item tooltips across the game
// It can be imported by all components that need to display items

const UnifiedTooltipSystem = {
    // Initialize the system and add required CSS
    initialize: function() {
      console.log("Initializing unified tooltip system");
      this.addStandardStyles();
      return this;
    },
    
    // Add standardized tooltip styles to the document
    addStandardStyles: function() {
      if (document.getElementById('standardized-tooltip-styles')) return;
      
      const styleEl = document.createElement('style');
      styleEl.id = 'standardized-tooltip-styles';
      styleEl.textContent = `
        /* STANDARDIZED TOOLTIP SYSTEM */
        
        /* Tooltip container */
        .standardized-tooltip {
          position: absolute !important;
          bottom: 100% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 220px !important;
          pointer-events: none !important;
          opacity: 0 !important;
          z-index: 9999 !important;
          transition: opacity 0.2s, transform 0.2s !important;
        }
        
        /* Show tooltip on hover */
        *:hover > .standardized-tooltip {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(-5px) !important;
          pointer-events: auto !important; /* Enable mouse interaction with tooltip */
        }
        
        /* Invisible bridge between item and tooltip */
        .tooltip-bridge {
          position: absolute !important;
          bottom: -10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 30px !important;
          height: 20px !important;
          /* For debugging: background-color: rgba(255, 0, 0, 0.3); */
        }
        
        /* Tooltip content */
        .tooltip-content {
          background-color: #1e1e2a !important;
          border-radius: 5px !important;
          border: 2px solid rgba(91, 141, 217, 0.5) !important;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5) !important;
          overflow: hidden !important;
          font-family: 'Press Start 2P', cursive !important;
          font-size: 10px !important;
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
        }
        
        /* Tooltip effect */
        .tooltip-effect {
          color: #5b8dd9 !important;
          margin-bottom: 8px !important;
          padding: 8px !important;
          background-color: rgba(0, 0, 0, 0.2) !important;
          border-radius: 3px !important;
        }
        
        /* Passive text */
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
          padding: 2px 4px !important;
          border-radius: 3px !important;
          background-color: rgba(0, 0, 0, 0.3) !important;
          text-transform: capitalize !important;
        }
        
        /* Fix for inventory items */
        .inventory-item {
          position: relative !important;
        }
        
        .inventory-item .standardized-tooltip {
          z-index: 10000 !important;
        }
        
        /* Override any existing tooltip styles to prevent conflicts */
        .item-tooltip {
          display: none !important;
        }
      `;
      
      document.head.appendChild(styleEl);
      console.log("Added standardized tooltip styles");
    },
    
    // Create HTML for a standardized tooltip
    createTooltipHTML: function(item) {
      if (!item) return '';
      
      return `
        <div class="standardized-tooltip">
          <div class="tooltip-bridge"></div>
          <div class="tooltip-content">
            <div class="tooltip-header ${item.rarity || 'common'}">
              <span class="tooltip-title">${item.name || 'Unknown Item'}</span>
              <span class="tooltip-rarity">${item.rarity || 'common'}</span>
            </div>
            <div class="tooltip-body">
              <p class="tooltip-desc">${item.description || 'No description available'}</p>
              <div class="tooltip-effect">
                ${item.itemType === 'relic' ? 
                  `<span class="passive-text">Passive: ${item.passiveText || item.effect?.value || item.description || 'No effect'}</span>` :
                  `<span>Effect: ${item.effect?.value || item.description || 'No effect'}</span>`
                }
              </div>
              ${item.itemType !== 'relic' ? 
                `<div class="tooltip-usage">Click to use</div>` : ''
              }
            </div>
          </div>
        </div>
      `;
    },
    
    // Apply a standardized tooltip to an existing element
    applyTooltip: function(element, item) {
      if (!element || !item) return;
      
      // Remove any existing tooltips
      const existingTooltip = element.querySelector('.standardized-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      
      // Create and append the new tooltip
      const tooltipHTML = this.createTooltipHTML(item);
      element.insertAdjacentHTML('beforeend', tooltipHTML);
    },
    
    // Create a standardized item display with tooltip
    createItemDisplay: function(item, options = {}) {
      const {
        size = 48,
        showName = false,
        isClickable = true,
        onClick = null
      } = options;
      
      // Create container element
      const container = document.createElement('div');
      container.className = `unified-item ${item.rarity || 'common'} ${isClickable ? 'clickable' : ''}`;
      container.style.width = `${size}px`;
      container.style.height = `${size}px`;
      container.style.position = 'relative';
      container.style.backgroundColor = '#1e1e2a';
      container.style.borderRadius = '4px';
      container.style.overflow = 'hidden';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.transition = 'transform 0.2s, box-shadow 0.2s';
      
      // Add shadow based on rarity
      switch (item.rarity) {
        case 'common':
          container.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.2)';
          break;
        case 'uncommon':
          container.style.boxShadow = '0 0 8px rgba(91, 141, 217, 0.3)';
          break;
        case 'rare':
          container.style.boxShadow = '0 0 8px rgba(156, 119, 219, 0.3)';
          break;
        case 'epic':
          container.style.boxShadow = '0 0 12px rgba(240, 200, 102, 0.3)';
          break;
        default:
          container.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.2)';
      }
      
      // Add item icon
      const iconHtml = this.getItemIcon(item);
      container.innerHTML = iconHtml;
      
      // Add name if requested
      if (showName) {
        const nameElement = document.createElement('div');
        nameElement.style.position = 'absolute';
        nameElement.style.bottom = '0';
        nameElement.style.left = '0';
        nameElement.style.right = '0';
        nameElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        nameElement.style.padding = '2px';
        nameElement.style.fontSize = '8px';
        nameElement.style.textAlign = 'center';
        nameElement.style.whiteSpace = 'nowrap';
        nameElement.style.overflow = 'hidden';
        nameElement.style.textOverflow = 'ellipsis';
        nameElement.textContent = item.name;
        container.appendChild(nameElement);
      }
      
      // Add tooltip
      this.applyTooltip(container, item);
      
      // Add hover effects for clickable items
      if (isClickable) {
        container.style.cursor = 'pointer';
        container.onmouseover = () => {
          container.style.transform = 'translateY(-3px)';
          container.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
        };
        container.onmouseout = () => {
          container.style.transform = '';
          
          // Restore original shadow
          switch (item.rarity) {
            case 'common':
              container.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.2)';
              break;
            case 'uncommon':
              container.style.boxShadow = '0 0 8px rgba(91, 141, 217, 0.3)';
              break;
            case 'rare':
              container.style.boxShadow = '0 0 8px rgba(156, 119, 219, 0.3)';
              break;
            case 'epic':
              container.style.boxShadow = '0 0 12px rgba(240, 200, 102, 0.3)';
              break;
            default:
              container.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.2)';
          }
        };
        
        // Add click handler if provided
        if (typeof onClick === 'function') {
          container.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(item);
          };
        }
      }
      
      return container;
    },
    
    // Get item icon HTML
    getItemIcon: function(item) {
      // Check if the item has a custom icon path
      if (item.iconPath) {
        return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" 
                style="max-width: 80%; max-height: 80%; object-fit: contain; image-rendering: pixelated;">`;
      }
      
      // Fallback icon based on item type
      const iconName = this.getIconName(item);
      return `<img src="/static/img/items/${iconName}.png" alt="${item.name}" 
              style="max-width: 80%; max-height: 80%; object-fit: contain; image-rendering: pixelated;">`;
    },
    
    // Get icon name based on item properties
    getIconName: function(item) {
      const itemName = (item.name || '').toLowerCase();
      
      if (itemName.includes('textbook') || itemName.includes('book') || itemName.includes('manual'))
        return 'Textbook';
      if (itemName.includes('badge') || itemName.includes('dosimeter'))
        return 'Nametag';
      if (itemName.includes('goggles') || itemName.includes('spectacles') || itemName.includes('glasses'))
        return '3D Glasses';
      if (itemName.includes('notebook') || itemName.includes('note'))
        return 'Yellow Sticky Note';
      
      // Default fallback
      return item.itemType === 'relic' ? 'USB Stick' : 'Paperclip';
    },
    
    // Fixed item tooltip by applying standardized tooltips to all existing items
    fixExistingItemTooltips: function() {
      console.log("Fixing existing item tooltips");
      
      // Fix inventory item tooltips
      document.querySelectorAll('.inventory-item').forEach(item => {
        // Try to extract item data from the element
        try {
          const nameEl = item.querySelector('.tooltip-title');
          const rarityEl = item.querySelector('.tooltip-rarity');
          const descEl = item.querySelector('.tooltip-desc');
          const effectEl = item.querySelector('.tooltip-effect');
          
          if (!nameEl) return;
          
          // Extract item data
          const extractedItem = {
            name: nameEl.textContent,
            rarity: rarityEl ? rarityEl.textContent : 'common',
            description: descEl ? descEl.textContent : '',
            effect: {
              value: effectEl ? effectEl.textContent : ''
            },
            itemType: item.classList.contains('relic-item') ? 'relic' : 'consumable'
          };
          
          // Apply standardized tooltip
          this.applyTooltip(item, extractedItem);
        } catch (error) {
          console.error("Error fixing inventory item tooltip:", error);
        }
      });
      
      // Fix shop item tooltips
      document.querySelectorAll('.shop-item').forEach(item => {
        try {
          const nameEl = item.querySelector('.item-name');
          const rarityClass = Array.from(item.classList).find(c => c.startsWith('rarity-'));
          const descEl = item.querySelector('.item-description');
          const effectEl = item.querySelector('.item-effect');
          
          if (!nameEl) return;
          
          // Extract item data
          const extractedItem = {
            name: nameEl.textContent,
            rarity: rarityClass ? rarityClass.replace('rarity-', '') : 'common',
            description: descEl ? descEl.textContent : '',
            effect: {
              value: effectEl ? effectEl.textContent : ''
            },
            itemType: item.classList.contains('relic-item') ? 'relic' : 'consumable'
          };
          
          // Apply standardized tooltip
          this.applyTooltip(item, extractedItem);
        } catch (error) {
          console.error("Error fixing shop item tooltip:", error);
        }
      });
      
      console.log("Tooltip fixing complete");
    }
  };
  
  // Export globally
  window.UnifiedTooltipSystem = UnifiedTooltipSystem;
  
  // Auto-initialize at script load
  if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      UnifiedTooltipSystem.initialize();
      
      // Fix existing tooltips after a short delay to ensure the DOM is ready
      setTimeout(() => {
        UnifiedTooltipSystem.fixExistingItemTooltips();
      }, 1000);
    });
  }