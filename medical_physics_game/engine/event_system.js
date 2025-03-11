// event_system.js - Game-wide event management system

// EventSystem singleton - handles game-wide event dispatching
const EventSystem = {
    // Event listeners by event type
    listeners: {},
    
    // Initialize event system
    initialize: function() {
      console.log("Initializing event system...");
      
      // Define built-in listeners that connect systems
      this.registerBuiltInListeners();
      
      return this;
    },
    
    // Register built-in listeners that connect game systems
    registerBuiltInListeners: function() {
      // Listen for node completion to update UI
      this.on('nodeCompleted', (nodeId) => {
        // Show map after node completion
        if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
          UI.showMapView();
        }
      });
      
      // Listen for floor completion to show next floor button
      this.on('floorCompleted', (floorNumber) => {
        console.log(`Floor ${floorNumber} completed!`);
        
        // Show next floor button
        const nextFloorBtn = document.getElementById('next-floor-btn');
        if (nextFloorBtn) {
          nextFloorBtn.style.display = 'block';
        }
        
        // Show completion notification
        if (typeof UiUtils !== 'undefined' && typeof UiUtils.showToast === 'function') {
          UiUtils.showToast(`Floor ${floorNumber} completed! You can now proceed to the next floor.`, 'success');
        }
      });
      
      // Listen for floor change to update UI
      this.on('floorChanged', (floorNumber) => {
        // Update floor number display
        const floorElement = document.getElementById('current-floor');
        if (floorElement) {
          floorElement.textContent = floorNumber;
        }
        
        // Hide next floor button
        const nextFloorBtn = document.getElementById('next-floor-btn');
        if (nextFloorBtn) {
          nextFloorBtn.style.display = 'none';
        }
      });
    },
    
    // Register event listener
    on: function(eventType, callback) {
      if (!this.listeners[eventType]) {
        this.listeners[eventType] = [];
      }
      
      this.listeners[eventType].push(callback);
      return this; // For chaining
    },
    
    // Remove event listener
    off: function(eventType, callback) {
      if (!this.listeners[eventType]) return this;
      
      const index = this.listeners[eventType].indexOf(callback);
      if (index !== -1) {
        this.listeners[eventType].splice(index, 1);
      }
      
      return this; // For chaining
    },
    
    // Emit event to all listeners
    emit: function(eventType, data) {
      console.log(`Event emitted: ${eventType}`, data);
      
      if (!this.listeners[eventType]) return;
      
      this.listeners[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
      
      return this; // For chaining
    },
    
    // Remove all listeners for an event type
    clearListeners: function(eventType) {
      if (eventType) {
        this.listeners[eventType] = [];
      } else {
        this.listeners = {};
      }
      
      return this; // For chaining
    },
    
    // Debug helper to list all registered events
    debugEvents: function() {
      console.group("Event System Debug");
      
      const eventTypes = Object.keys(this.listeners);
      console.log(`Registered event types: ${eventTypes.length}`);
      
      eventTypes.forEach(eventType => {
        const count = this.listeners[eventType].length;
        console.log(`- ${eventType}: ${count} listener${count !== 1 ? 's' : ''}`);
      });
      
      console.groupEnd();
    }
  };
  
  // Attach to window for global access
  window.EventSystem = EventSystem;
  
  // Common event types - used to prevent typos
  const GAME_EVENTS = {
    // Game state events
    GAME_INITIALIZED: 'gameInitialized',
    GAME_RESET: 'gameReset',
    GAME_OVER: 'gameOver',
    
    // Node events
    NODE_SELECTED: 'nodeSelected',
    NODE_COMPLETED: 'nodeCompleted',
    NODE_FAILED: 'nodeFailed',
    
    // Floor events
    FLOOR_LOADED: 'floorLoaded',
    FLOOR_COMPLETED: 'floorCompleted',
    FLOOR_CHANGED: 'floorChanged',
    
    // Character events
    CHARACTER_UPDATED: 'characterUpdated',
    LIVES_CHANGED: 'livesChanged',
    INSIGHT_CHANGED: 'insightChanged',
    
    // Inventory events
    ITEM_ADDED: 'itemAdded',
    ITEM_USED: 'itemUsed',
    ITEM_REMOVED: 'itemRemoved',
    
    // UI events
    UI_CONTAINER_CHANGED: 'uiContainerChanged',
    UI_TOAST_SHOWN: 'uiToastShown',
    UI_FEEDBACK_SHOWN: 'uiFeedbackShown'
  };
  
  // Attach event types to window
  window.GAME_EVENTS = GAME_EVENTS;