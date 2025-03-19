// tooltip-debugger.js - Tools for debugging tooltip issues

const TooltipDebugger = {
    // Initialize debugger
    initialize: function() {
      console.log("Initializing tooltip debugger...");
      
      // Create the debug panel
      this.createDebugPanel();
      
      return this;
    },
    
    // Create a debug panel UI
    createDebugPanel: function() {
      // Check if panel already exists
      if (document.getElementById('tooltip-debug-panel')) {
        return;
      }
      
      // Create panel element
      const panel = document.createElement('div');
      panel.id = 'tooltip-debug-panel';
      panel.className = 'tooltip-debug-panel';
      
      panel.innerHTML = `
        <div class="debug-panel-header">
          <h3>Tooltip Debugger</h3>
          <div class="debug-panel-controls">
            <button id="debug-panel-toggle" class="debug-panel-button">-</button>
            <button id="debug-panel-close" class="debug-panel-button">×</button>
          </div>
        </div>
        <div class="debug-panel-content">
          <div class="debug-section">
            <h4>Troubleshoot Tooltips</h4>
            <button id="debug-highlight-tooltips" class="debug-action-button">Highlight All Tooltips</button>
            <button id="debug-fix-tooltips" class="debug-action-button">Fix All Tooltips</button>
            <button id="debug-test-tooltip" class="debug-action-button">Create Test Tooltip</button>
          </div>
          <div class="debug-section">
            <h4>Inspect Elements</h4>
            <div class="debug-input-group">
              <input type="text" id="debug-selector-input" placeholder=".inventory-item, .shop-item, etc.">
              <button id="debug-inspect-selector" class="debug-action-button">Inspect</button>
            </div>
          </div>
          <div class="debug-section">
            <h4>Stats</h4>
            <div id="debug-stats" class="debug-stats">
              Tooltip count: <span id="debug-tooltip-count">0</span><br>
              Visible tooltips: <span id="debug-visible-tooltips">0</span><br>
              Z-index issues: <span id="debug-zindex-issues">0</span>
            </div>
          </div>
          <div class="debug-section">
            <h4>Log</h4>
            <div id="debug-log" class="debug-log"></div>
          </div>
        </div>
      `;
      
      // Add styles for debug panel
      this.addDebugStyles();
      
      // Add to the document
      document.body.appendChild(panel);
      
      // Add event listeners
      document.getElementById('debug-panel-toggle').addEventListener('click', this.toggleDebugPanel.bind(this));
      document.getElementById('debug-panel-close').addEventListener('click', this.hideDebugPanel.bind(this));
      document.getElementById('debug-highlight-tooltips').addEventListener('click', this.highlightAllTooltips.bind(this));
      document.getElementById('debug-fix-tooltips').addEventListener('click', this.fixAllTooltips.bind(this));
      document.getElementById('debug-test-tooltip').addEventListener('click', this.createTestTooltip.bind(this));
      document.getElementById('debug-inspect-selector').addEventListener('click', () => {
        const selector = document.getElementById('debug-selector-input').value;
        this.inspectElements(selector);
      });
      
      // Make panel draggable
      this.makeElementDraggable(panel);
      
      this.log("Tooltip debugger ready!");
    },
    
    // Add debug styles
    addDebugStyles: function() {
      // Check if styles are already added
      if (document.getElementById('tooltip-debugger-styles')) {
        return;
      }
      
      // Create style element
      const style = document.createElement('style');
      style.id = 'tooltip-debugger-styles';
      
      style.textContent = `
        /* Tooltip debugger panel */
        .tooltip-debug-panel {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 300px;
          background-color: #1e1e2a;
          border: 2px solid #5b8dd9;
          border-radius: 6px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          color: white;
          font-family: sans-serif;
          z-index: 100000;
          overflow: hidden;
        }
        
        .debug-panel-header {
          padding: 8px;
          background-color: #5b8dd9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
        }
        
        .debug-panel-header h3 {
          margin: 0;
          font-size: 14px;
          color: white;
        }
        
        .debug-panel-controls {
          display: flex;
          gap: 5px;
        }
        
        .debug-panel-button {
          width: 20px;
          height: 20px;
          border: none;
          background-color: rgba(0, 0, 0, 0.3);
          color: white;
          border-radius: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        
        .debug-panel-button:hover {
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .debug-panel-content {
          padding: 10px;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .tooltip-debug-panel.collapsed .debug-panel-content {
          display: none;
        }
        
        .debug-section {
          margin-bottom: 15px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          padding: 8px;
        }
        
        .debug-section h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #5b8dd9;
        }
        
        .debug-action-button {
          background-color: #2a2a36;
          border: 1px solid #5b8dd9;
          color: white;
          padding: 6px 8px;
          margin-bottom: 5px;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
          display: block;
          width: 100%;
          text-align: left;
        }
        
        .debug-action-button:hover {
          background-color: #3a3a46;
        }
        
        .debug-input-group {
          display: flex;
          gap: 5px;
          margin-bottom: 5px;
        }
        
        .debug-input-group input {
          flex: 1;
          background-color: #2a2a36;
          border: 1px solid #5b8dd9;
          color: white;
          padding: 5px;
          border-radius: 3px;
          font-size: 11px;
        }
        
        .debug-input-group button {
          background-color: #5b8dd9;
          width: auto;
        }
        
        .debug-stats {
          background-color: #2a2a36;
          padding: 8px;
          font-size: 11px;
          border-radius: 3px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .debug-log {
          background-color: #2a2a36;
          padding: 8px;
          font-size: 10px;
          border-radius: 3px;
          color: rgba(255, 255, 255, 0.8);
          height: 100px;
          overflow-y: auto;
          font-family: monospace;
        }
        
        /* Debugging visual helpers */
        .debug-highlight {
          outline: 2px dashed red !important;
          background-color: rgba(255, 0, 0, 0.1) !important;
          position: relative !important;
        }
        
        .debug-tooltip-highlight {
          outline: 2px dashed yellow !important;
          background-color: rgba(255, 255, 0, 0.1) !important;
          visibility: visible !important;
          opacity: 1 !important;
          display: block !important;
          pointer-events: all !important;
        }
        
        .debug-test-tooltip-trigger {
          position: fixed !important;
          bottom: 100px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 100px !important;
          height: 100px !important;
          background-color: blue !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: white !important;
          cursor: pointer !important;
          z-index: 9999 !important;
        }
      `;
      
      document.head.appendChild(style);
    },
    
    // Toggle debug panel visibility
    toggleDebugPanel: function() {
      const panel = document.getElementById('tooltip-debug-panel');
      if (panel) {
        panel.classList.toggle('collapsed');
        
        const toggleButton = document.getElementById('debug-panel-toggle');
        if (toggleButton) {
          toggleButton.textContent = panel.classList.contains('collapsed') ? '+' : '-';
        }
      }
    },
    
    // Hide debug panel
    hideDebugPanel: function() {
      const panel = document.getElementById('tooltip-debug-panel');
      if (panel) {
        panel.remove();
      }
    },
    
    // Highlight all tooltips in the document
    highlightAllTooltips: function() {
      // Clear existing highlights
      document.querySelectorAll('.debug-highlight, .debug-tooltip-highlight').forEach(el => {
        el.classList.remove('debug-highlight', 'debug-tooltip-highlight');
      });
      
      // Find all tooltip triggers
      const triggers = document.querySelectorAll('.tooltip-trigger');
      triggers.forEach(trigger => {
        trigger.classList.add('debug-highlight');
        
        // Find tooltips inside triggers
        const tooltip = trigger.querySelector('.unified-tooltip');
        if (tooltip) {
          tooltip.classList.add('debug-tooltip-highlight');
        }
      });
      
      // Find all old tooltips
      const oldTooltips = document.querySelectorAll('.item-tooltip, .standardized-tooltip, .shop-tooltip');
      oldTooltips.forEach(tooltip => {
        tooltip.classList.add('debug-tooltip-highlight');
      });
      
      // Update stats
      this.updateDebugStats();
      
      this.log(`Highlighted ${triggers.length} tooltip triggers and ${triggers.length + oldTooltips.length} tooltips`);
    },
    
    // Fix all tooltips
    fixAllTooltips: function() {
      // Check if UnifiedTooltipSystem is available
      if (!window.UnifiedTooltipSystem) {
        this.log("ERROR: UnifiedTooltipSystem not available!");
        return;
      }
      
      // Log action
      this.log("Attempting to fix all tooltips...");
      
      // Call fixExistingTooltips from UnifiedTooltipSystem
      try {
        UnifiedTooltipSystem.fixExistingTooltips();
        this.log("Fix completed. Refreshing highlights...");
        
        // Highlight again to see the results
        setTimeout(() => {
          this.highlightAllTooltips();
        }, 100);
      } catch (error) {
        this.log(`ERROR: ${error.message}`);
        console.error("Failed to fix tooltips:", error);
      }
    },
    
    // Create a test tooltip
    createTestTooltip: function() {
      // Remove any existing test tooltip
      const existingTest = document.querySelector('.debug-test-tooltip-trigger');
      if (existingTest) {
        existingTest.remove();
      }
      
      // Create a test element
      const testElement = document.createElement('div');
      testElement.className = 'debug-test-tooltip-trigger tooltip-trigger';
      testElement.textContent = 'Test Tooltip';
      
      // Add to document
      document.body.appendChild(testElement);
      
      // Create a test item
      const testItem = {
        id: 'test-item',
        name: 'Debug Test Item',
        description: 'This is a test item created by the tooltip debugger.',
        rarity: 'epic',
        itemType: 'consumable',
        effect: {
          type: 'debug',
          value: 'This tooltip should be visible and positioned correctly.'
        }
      };
      
      // Apply unified tooltip
      if (window.UnifiedTooltipSystem) {
        UnifiedTooltipSystem.applyTooltip(testElement, testItem);
        this.log("Created test tooltip element");
      } else {
        this.log("ERROR: UnifiedTooltipSystem not available!");
      }
    },
    
    // Inspect elements by selector
    inspectElements: function(selector) {
      if (!selector) {
        this.log("Please enter a valid CSS selector");
        return;
      }
      
      try {
        const elements = document.querySelectorAll(selector);
        this.log(`Found ${elements.length} elements matching "${selector}"`);
        
        // Clear existing highlights
        document.querySelectorAll('.debug-highlight').forEach(el => {
          el.classList.remove('debug-highlight');
        });
        
        // Highlight matched elements
        elements.forEach(el => {
          el.classList.add('debug-highlight');
          
          // Log details about each element
          const rect = el.getBoundingClientRect();
          const tooltip = el.querySelector('.unified-tooltip, .item-tooltip, .standardized-tooltip, .shop-tooltip');
          
          console.log({
            element: el,
            position: rect,
            tooltip: tooltip,
            hasTooltipTriggerClass: el.classList.contains('tooltip-trigger'),
            zIndex: window.getComputedStyle(el).zIndex,
            overflow: window.getComputedStyle(el).overflow
          });
        });
        
        this.log(`Details logged to console for ${elements.length} elements`);
      } catch (error) {
        this.log(`ERROR: ${error.message}`);
        console.error("Inspection error:", error);
      }
    },
    
    // Update debug stats
    updateDebugStats: function() {
      // Count tooltips
      const allTooltips = document.querySelectorAll('.unified-tooltip, .item-tooltip, .standardized-tooltip, .shop-tooltip');
      const visibleTooltips = Array.from(allTooltips).filter(tooltip => {
        const style = window.getComputedStyle(tooltip);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      
      // Check for z-index issues (tooltips with z-index less than their container)
      let zIndexIssues = 0;
      allTooltips.forEach(tooltip => {
        const parent = tooltip.parentElement;
        if (parent) {
          const tooltipZIndex = parseInt(window.getComputedStyle(tooltip).zIndex) || 0;
          const parentZIndex = parseInt(window.getComputedStyle(parent).zIndex) || 0;
          
          if (tooltipZIndex <= parentZIndex && parentZIndex > 0) {
            zIndexIssues++;
          }
        }
      });
      
      // Update the stats display
      document.getElementById('debug-tooltip-count').textContent = allTooltips.length;
      document.getElementById('debug-visible-tooltips').textContent = visibleTooltips.length;
      document.getElementById('debug-zindex-issues').textContent = zIndexIssues;
    },
    
    // Add a log message
    log: function(message) {
      const logContainer = document.getElementById('debug-log');
      if (logContainer) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Limit log entries
        while (logContainer.children.length > 100) {
          logContainer.removeChild(logContainer.firstChild);
        }
      }
      
      // Also log to console
      console.log(`[TooltipDebugger] ${message}`);
    },
    
    // Make an element draggable
    makeElementDraggable: function(element) {
      if (!element) return;
      
      const header = element.querySelector('.debug-panel-header');
      if (!header) return;
      
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;
      
      header.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
      });
      
      document.addEventListener('mousemove', function(e) {
        if (isDragging) {
          element.style.left = (e.clientX - offsetX) + 'px';
          element.style.top = (e.clientY - offsetY) + 'px';
        }
      });
      
      document.addEventListener('mouseup', function() {
        isDragging = false;
      });
    }
  };
  
  // Initialize on script load
  if (typeof window !== 'undefined') {
    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        // Create a button to show the debugger
        const debugButton = document.createElement('button');
        debugButton.id = 'show-tooltip-debugger';
        debugButton.textContent = '🛠️';
        debugButton.style.cssText = `
          position: fixed;
          bottom: 10px;
          right: 10px;
          width: 40px;
          height: 40px;
          background-color: #5b8dd9;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        `;
        
        debugButton.addEventListener('click', function() {
          TooltipDebugger.initialize();
          debugButton.remove();
        });
        
        document.body.appendChild(debugButton);
      });
    } else {
      // DOM already loaded, add the button immediately
      const debugButton = document.createElement('button');
      debugButton.id = 'show-tooltip-debugger';
      debugButton.textContent = '🛠️';
      debugButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        background-color: #5b8dd9;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      `;
      
      debugButton.addEventListener('click', function() {
        TooltipDebugger.initialize();
        debugButton.remove();
      });
      
      document.body.appendChild(debugButton);
    }
  }
  
  // Make available globally
  window.TooltipDebugger = TooltipDebugger;