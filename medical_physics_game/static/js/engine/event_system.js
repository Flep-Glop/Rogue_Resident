// event_system.js - Optimized game-wide event management system

// EventSystem singleton - handles game-wide event dispatching with improved performance
const EventSystem = {
  // Event listeners by event type - using Maps for faster lookup
  listeners: new Map(),
  
  // Event prioritization
  priorityListeners: new Map(),
  
  // Track events currently being processed to prevent recursion
  _processingEvents: new Map(),
  
  // Maximum recursion depth for each event type
  _maxRecursionDepth: 2,
  
  // Track memory usage for debugging
  _memoryStats: {
    eventsProcessed: 0,
    totalListeners: 0,
    eventsWithMostListeners: ''
  },
  
  // Initialize event system
  initialize: function() {
    console.log("Initializing optimized event system...");
    
    // Define built-in listeners that connect systems
    this.registerBuiltInListeners();
    
    // Set up debug mode if URL parameter is present
    this.debugMode = new URLSearchParams(window.location.search).has('debug_events');
    
    return this;
  },
  
  // Register built-in listeners that connect game systems
  registerBuiltInListeners: function() {
    // Listen for node completion to update UI
    this.on(GAME_EVENTS.NODE_COMPLETED, (nodeId) => {
      console.log(`Node completed: ${nodeId}`);
      // Show map after node completion
      if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
        UI.showMapView();
      }
    });
    
    // Listen for floor completion to show next floor button
    this.on(GAME_EVENTS.FLOOR_COMPLETED, (floorNumber) => {
      console.log(`✨ Floor ${floorNumber} completed! Ready for next floor.`);
      
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
    this.on(GAME_EVENTS.FLOOR_CHANGED, (floorNumber) => {
      console.log(`Floor changed to ${floorNumber}`);
      
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
  
  // Register event listener with priority support
  on: function(eventType, callback, priority = 0) {
    if (!eventType) {
      console.error("Event type is required for EventSystem.on()");
      return this;
    }
    
    // Initialize listeners collection for this event type if needed
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
      this.priorityListeners.set(eventType, new Map());
    }
    
    // Store the callback in the appropriate collection
    if (priority !== 0) {
      // Store in priority map (for less common priority-based listeners)
      if (!this.priorityListeners.get(eventType).has(priority)) {
        this.priorityListeners.get(eventType).set(priority, []);
      }
      this.priorityListeners.get(eventType).get(priority).push(callback);
    } else {
      // Store in main array (for common non-priority listeners)
      this.listeners.get(eventType).push(callback);
    }
    
    // Update memory stats
    this._memoryStats.totalListeners++;
    
    // Track which event has the most listeners
    const totalForEvent = (this.listeners.get(eventType).length + 
      Array.from(this.priorityListeners.get(eventType).values())
        .reduce((sum, callbacks) => sum + callbacks.length, 0));
    
    const currentMax = this._memoryStats.eventsWithMostListeners.split(':')[1] || 0;
    if (totalForEvent > currentMax) {
      this._memoryStats.eventsWithMostListeners = `${eventType}:${totalForEvent}`;
    }
    
    return this; // For chaining
  },
  
  // Register a one-time event listener
  once: function(eventType, callback, priority = 0) {
    if (!eventType) {
      console.error("Event type is required for EventSystem.once()");
      return this;
    }
    
    // Create a wrapper that will remove itself after execution
    const wrappedCallback = (data) => {
      this.off(eventType, wrappedCallback);
      callback(data);
    };
    
    // Store the original callback for potential removal later
    wrappedCallback.originalCallback = callback;
    
    // Register the wrapped callback
    return this.on(eventType, wrappedCallback, priority);
  },
  
  // Remove event listener with more robust matching
  off: function(eventType, callback) {
    if (!eventType) {
      console.error("Event type is required for EventSystem.off()");
      return this;
    }
    
    if (!this.listeners.has(eventType)) {
      return this; // No listeners for this event type
    }
    
    if (!callback) {
      // Remove all listeners for this event type if no callback specified
      this._memoryStats.totalListeners -= this.getListenerCount(eventType);
      this.listeners.set(eventType, []);
      this.priorityListeners.set(eventType, new Map());
      return this;
    }
    
    // Find and remove callback from standard listeners
    const standardListeners = this.listeners.get(eventType);
    let index = standardListeners.indexOf(callback);
    
    // If not found directly, check for wrapped 'once' callbacks
    if (index === -1) {
      index = standardListeners.findIndex(cb => 
        cb.originalCallback && cb.originalCallback === callback
      );
    }
    
    if (index !== -1) {
      standardListeners.splice(index, 1);
      this._memoryStats.totalListeners--;
    }
    
    // Also check priority listeners
    const priorityMap = this.priorityListeners.get(eventType);
    priorityMap.forEach((callbacks, priority) => {
      // Check for direct match
      index = callbacks.indexOf(callback);
      
      // If not found directly, check for wrapped 'once' callbacks
      if (index === -1) {
        index = callbacks.findIndex(cb => 
          cb.originalCallback && cb.originalCallback === callback
        );
      }
      
      if (index !== -1) {
        callbacks.splice(index, 1);
        this._memoryStats.totalListeners--;
        
        // Remove empty priority entries
        if (callbacks.length === 0) {
          priorityMap.delete(priority);
        }
      }
    });
    
    return this; // For chaining
  },
  
  // Check if we're currently processing an event (to prevent recursion)
  isHandlingEvent: function(eventType) {
    return (this._processingEvents.get(eventType) || 0) > 0;
  },
  
  // Optimized emit event to all listeners
  emit: function(eventType, data) {
    // VALIDATION: Check event type
    if (!eventType) {
      console.error("Attempted to emit event with undefined type:", data);
      return this;
    }
    
    // RECURSION CONTROL: Check and increment recursion
    const currentDepth = this._processingEvents.get(eventType) || 0;
    
    // Check recursion depth
    if (currentDepth >= this._maxRecursionDepth) {
      console.warn(`Event recursion limit reached for ${eventType}. Skipping to prevent infinite loop.`);
      return this;
    }
    
    // Increment processing counter for this event
    this._processingEvents.set(eventType, currentDepth + 1);
    
    // DEBUGGING: Log in debug mode
    if (this.debugMode) {
      console.log(`Event emitted: ${eventType}`, data);
    }
    
    // Statistics tracking
    this._memoryStats.eventsProcessed++;
    
    // FAST PATH: Check if we have any listeners at all for this event
    if (!this.listeners.has(eventType) || 
        (this.listeners.get(eventType).length === 0 && 
         this.priorityListeners.get(eventType)?.size === 0)) {
      // No listeners, just clean up and return
      this._processingEvents.set(eventType, currentDepth);
      return this;
    }
    
    try {
      // EXECUTION: Process listeners in priority order
      
      // 1. Get priority listeners for this event
      const priorityMap = this.priorityListeners.get(eventType);
      
      if (priorityMap && priorityMap.size > 0) {
        // Sort priorities (descending order)
        const priorities = Array.from(priorityMap.keys()).sort((a, b) => b - a);
        
        // Execute higher priority listeners first
        for (const priority of priorities) {
          const priorityListeners = priorityMap.get(priority);
          
          // Execute all listeners at this priority level
          for (let i = 0; i < priorityListeners.length; i++) {
            try {
              priorityListeners[i](data);
            } catch (error) {
              console.error(`Error in priority(${priority}) listener for ${eventType}:`, error);
              if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.handleError(
                  error, 
                  `Event Listener (${eventType}, priority ${priority})`, 
                  ErrorHandler.SEVERITY.WARNING
                );
              }
            }
          }
        }
      }
      
      // 2. Process standard (priority 0) listeners
      const standardListeners = this.listeners.get(eventType);
      
      if (standardListeners && standardListeners.length > 0) {
        // Use a copy to handle if listeners are added/removed during emission
        const listenersToCall = [...standardListeners];
        
        // Call each listener
        for (let i = 0; i < listenersToCall.length; i++) {
          try {
            listenersToCall[i](data);
          } catch (error) {
            console.error(`Error in standard listener for ${eventType}:`, error);
            if (typeof ErrorHandler !== 'undefined') {
              ErrorHandler.handleError(
                error, 
                `Event Listener (${eventType})`, 
                ErrorHandler.SEVERITY.WARNING
              );
            }
          }
        }
      }
    } finally {
      // CLEANUP: Always decrement processing counter, even if errors occurred
      this._processingEvents.set(eventType, currentDepth);
    }
    
    return this; // For chaining
  },
  
  // Correct syntax
  emitAsync: async function(eventType, data) {
    // VALIDATION: Check event type
    if (!eventType) {
      console.error("Attempted to emit async event with undefined type:", data);
      throw new Error("Invalid event type");
    }
    
    // RECURSION CONTROL: Async events still respect recursion limits
    const currentDepth = this._processingEvents.get(eventType) || 0;
    
    // Check recursion depth
    if (currentDepth >= this._maxRecursionDepth) {
      console.warn(`Event recursion limit reached for async ${eventType}. Skipping to prevent infinite loop.`);
      return this;
    }
    
    // Increment processing counter for this event
    this._processingEvents.set(eventType, currentDepth + 1);
    
    try {
      // DEBUGGING: Log in debug mode
      if (this.debugMode) {
        console.log(`Async event emitted: ${eventType}`, data);
      }
      
      // Statistics tracking
      this._memoryStats.eventsProcessed++;
      
      // FAST PATH: Check if we have any listeners at all for this event
      if (!this.listeners.has(eventType) || 
          (this.listeners.get(eventType).length === 0 && 
           this.priorityListeners.get(eventType)?.size === 0)) {
        return this;
      }
      
      // EXECUTION: Process listeners in priority order
      const results = [];
      
      // 1. Get priority listeners for this event
      const priorityMap = this.priorityListeners.get(eventType);
      
      if (priorityMap && priorityMap.size > 0) {
        // Sort priorities (descending order)
        const priorities = Array.from(priorityMap.keys()).sort((a, b) => b - a);
        
        // Execute higher priority listeners first
        for (const priority of priorities) {
          const priorityListeners = priorityMap.get(priority);
          
          // Execute all listeners at this priority level
          for (let i = 0; i < priorityListeners.length; i++) {
            try {
              const result = priorityListeners[i](data);
              
              // If it's a promise, await it
              if (result instanceof Promise) {
                results.push(await result);
              } else {
                results.push(result);
              }
            } catch (error) {
              console.error(`Error in async priority(${priority}) listener for ${eventType}:`, error);
              if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.handleError(
                  error, 
                  `Async Event Listener (${eventType}, priority ${priority})`, 
                  ErrorHandler.SEVERITY.WARNING
                );
              }
            }
          }
        }
      }
      
      // 2. Process standard (priority 0) listeners
      const standardListeners = this.listeners.get(eventType);
      
      if (standardListeners && standardListeners.length > 0) {
        // Use a copy to handle if listeners are added/removed during emission
        const listenersToCall = [...standardListeners];
        
        // Call each listener
        for (let i = 0; i < listenersToCall.length; i++) {
          try {
            const result = listenersToCall[i](data);
            
            // If it's a promise, await it
            if (result instanceof Promise) {
              results.push(await result);
            } else {
              results.push(result);
            }
          } catch (error) {
            console.error(`Error in async standard listener for ${eventType}:`, error);
            if (typeof ErrorHandler !== 'undefined') {
              ErrorHandler.handleError(
                error, 
                `Async Event Listener (${eventType})`, 
                ErrorHandler.SEVERITY.WARNING
              );
            }
          }
        }
      }
      
      return results;
    } finally {
      // CLEANUP: Always decrement processing counter, even if errors occurred
      this._processingEvents.set(eventType, currentDepth);
    }
  },
  
  // Remove all listeners for an event type or all events
  clearListeners: function(eventType) {
    if (eventType) {
      // Clear specific event type
      if (this.listeners.has(eventType)) {
        this._memoryStats.totalListeners -= this.getListenerCount(eventType);
        this.listeners.set(eventType, []);
        this.priorityListeners.set(eventType, new Map());
      }
    } else {
      // Clear all events
      this._memoryStats.totalListeners = 0;
      this.listeners = new Map();
      this.priorityListeners = new Map();
    }
    
    return this; // For chaining
  },
  
  // Get count of listeners for an event type
  getListenerCount: function(eventType) {
    if (!this.listeners.has(eventType)) {
      return 0;
    }
    
    // Count standard listeners
    let count = this.listeners.get(eventType).length;
    
    // Count priority listeners
    const priorityMap = this.priorityListeners.get(eventType);
    if (priorityMap) {
      priorityMap.forEach(callbacks => {
        count += callbacks.length;
      });
    }
    
    return count;
  },
  
  // Subscribe to multiple events at once
  onMultiple: function(eventTypes, callback, priority = 0) {
    if (!Array.isArray(eventTypes)) {
      console.error("eventTypes must be an array for EventSystem.onMultiple()");
      return this;
    }
    
    eventTypes.forEach(eventType => {
      this.on(eventType, callback, priority);
    });
    
    return this;
  },
  
  // Unsubscribe from multiple events at once
  offMultiple: function(eventTypes, callback) {
    if (!Array.isArray(eventTypes)) {
      console.error("eventTypes must be an array for EventSystem.offMultiple()");
      return this;
    }
    
    eventTypes.forEach(eventType => {
      this.off(eventType, callback);
    });
    
    return this;
  },
  
  // Debug helper to list all registered events
  debugEvents: function() {
    console.group("Event System Debug");
    
    const eventTypes = Array.from(this.listeners.keys());
    console.log(`Registered event types: ${eventTypes.length}`);
    
    // Get memory statistics
    console.log(`Events processed: ${this._memoryStats.eventsProcessed}`);
    console.log(`Total listeners: ${this._memoryStats.totalListeners}`);
    console.log(`Most subscribed event: ${this._memoryStats.eventsWithMostListeners}`);
    
    // Log details for each event type
    eventTypes.forEach(eventType => {
      const standardCount = this.listeners.get(eventType).length;
      
      // Count priority listeners
      let priorityCount = 0;
      const priorityMap = this.priorityListeners.get(eventType);
      
      if (priorityMap && priorityMap.size > 0) {
        priorityMap.forEach(callbacks => {
          priorityCount += callbacks.length;
        });
      }
      
      const totalCount = standardCount + priorityCount;
      console.log(`- ${eventType}: ${totalCount} listener${totalCount !== 1 ? 's' : ''} (${standardCount} standard, ${priorityCount} priority)`);
    });
    
    // Check for events being processed right now
    const processingEvents = Array.from(this._processingEvents.entries())
      .filter(([_, depth]) => depth > 0);
    
    if (processingEvents.length > 0) {
      console.warn("Events currently being processed:");
      processingEvents.forEach(([eventType, depth]) => {
        console.warn(`- ${eventType}: recursion depth ${depth}`);
      });
    }
    
    console.groupEnd();
    
    return {
      eventCount: eventTypes.length,
      listenerCount: this._memoryStats.totalListeners,
      eventsProcessed: this._memoryStats.eventsProcessed,
      activeEvents: processingEvents.length
    };
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
  ITEM_ADDED_SUCCESS: 'itemAddedSuccess',
  ITEM_USED: 'itemUsed',
  ITEM_REMOVED: 'itemRemoved',
  
  // UI events
  UI_CONTAINER_CHANGED: 'uiContainerChanged',
  UI_TOAST_SHOWN: 'uiToastShown',
  UI_FEEDBACK_SHOWN: 'uiFeedbackShown'
};

// Attach event types to window
window.GAME_EVENTS = GAME_EVENTS;