// state_manager.js - Centralized game state management
// With improved observer pattern and validation

// Define node states as constants
const NODE_STATE = {
  LOCKED: 'locked',     // Cannot be visited yet
  AVAILABLE: 'available', // Can be visited now
  CURRENT: 'current',   // Currently being visited
  COMPLETED: 'completed' // Already visited and completed
};

// GameState singleton - manages all game state with enhanced observer patterns
const GameState = {
  // Core game state data
  data: {
    character: null,
    currentFloor: 1,
    currentNode: null,
    map: null,
    inventory: [],
    statusEffects: []
  },
  
  // State observers with typed subscriptions
  observers: {
    // Global observers receive all events
    global: [],
    // Event-specific observers
    stateInitialized: [],
    characterUpdated: [],
    floorChanged: [],
    nodeCompleted: [],
    inventoryChanged: [],
    mapUpdated: []
  },
  
  // Schema validations for data types
  validators: {
    character: function(character) {
      if (!character) return false;
      // Basic validation of character object
      return (
        typeof character === 'object' &&
        typeof character.name === 'string' &&
        typeof character.level === 'number' &&
        typeof character.lives === 'number' &&
        typeof character.max_lives === 'number' &&
        typeof character.insight === 'number'
      );
    },
    
    map: function(map) {
      if (!map) return false;
      // Basic validation of map structure
      return (
        typeof map === 'object' &&
        map.start !== undefined &&
        typeof map.nodes === 'object'
      );
    }
  },
  
  // Initialize the game state
  initialize: function() {
    console.log("Initializing game state...");
    return this.loadFromServer()
      .then(() => {
        this.notifyObservers('stateInitialized', this.data);
        return this.data;
      });
  },
  
  // Load game state from server
  loadFromServer: function() {
    return ApiClient.loadGameState()
      .then(data => {
        // Update core data with validation
        if (data.character && this.validators.character(data.character)) {
          this.data.character = data.character;
          this.notifyObservers('characterUpdated', this.data.character);
        } else if (data.character) {
          ErrorHandler.handleError(
            new Error("Invalid character data from server"), 
            "State Loading", 
            ErrorHandler.SEVERITY.WARNING
          );
        }
        
        this.data.currentFloor = data.current_floor || 1;
        this.data.inventory = data.inventory || [];
        this.data.currentNode = null;
        
        // We'll load the map separately
        return this.loadMap(data.current_floor || 1);
      })
      .catch(error => {
        ErrorHandler.handleError(
          error, 
          "State Loading", 
          ErrorHandler.SEVERITY.ERROR
        );
        return Promise.reject(error);
      });
  },
  
  // Enhanced loadMap function with validation and error handling
  loadMap: function(floorNumber) {
    console.log(`Loading map for floor ${floorNumber}...`);
    
    return fetch('/api/generate-floor-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ floor_number: floorNumber })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(mapData => {
      console.log("Map data received from server:", mapData);
      
      // Validate map data
      if (!this.validators.map(mapData)) {
        throw new Error("Invalid map data structure");
      }
      
      console.log(`Map for floor ${floorNumber} has ${Object.keys(mapData.nodes).length} nodes and ${mapData.boss ? "a boss" : "no boss"}`);
      
      // IMPORTANT: Store the map data properly
      this.data.map = mapData;
      
      // Reset the current node
      this.data.currentNode = null;
      
      // Initialize node states
      this.updateAllNodeStates();
      
      // Notify observers
      this.notifyObservers('mapUpdated', mapData);
      
      // Emit event that a new floor map is loaded
      EventSystem.emit(GAME_EVENTS.FLOOR_LOADED, floorNumber);
      
      return mapData;
    })
    .catch(error => {
      ErrorHandler.handleError(
        error, 
        "Map Loading", 
        ErrorHandler.SEVERITY.ERROR
      );
      
      // Create a fallback map for error recovery
      console.log("Creating fallback map due to load error");
      this.data.map = this._createFallbackMap(floorNumber);
      this.updateAllNodeStates();
      
      // Still notify observers with fallback map
      this.notifyObservers('mapUpdated', this.data.map);
      
      // Don't reject - we've recovered with a fallback
      return this.data.map;
    });
  },
  
  // Set the current node being visited
  setCurrentNode: function(nodeId) {
    console.log(`Setting current node to: ${nodeId}`);
    
    // Update data
    this.data.currentNode = nodeId;
    
    // Update node states
    this.updateAllNodeStates();
    
    // Notify observers
    this.notifyObservers('currentNodeChanged', nodeId);
  },
  
  // Mark a node as completed
  completeNode: function(nodeId) {
    console.log(`Completing node: ${nodeId}`);
    
    // Get the node
    const node = this.getNodeById(nodeId);
    if (!node) {
      const error = new Error(`Cannot complete node: ${nodeId} - not found`);
      ErrorHandler.handleError(error, "Node Completion", ErrorHandler.SEVERITY.WARNING);
      return Promise.reject(error);
    }
    
    // Mark as visited in local state
    node.visited = true;
    node.current = false;
    node.state = NODE_STATE.COMPLETED;
    
    // Clear current node
    this.data.currentNode = null;
    
    // Update server state
    return ApiClient.markNodeVisited(nodeId)
      .then(data => {
        console.log("Server confirmed node completion:", nodeId);
        
        // Update all node states
        this.updateAllNodeStates();
        
        // Notify observers
        this.notifyObservers('nodeCompleted', nodeId);
        
        // Emit event that a node was completed
        EventSystem.emit(GAME_EVENTS.NODE_COMPLETED, nodeId);
        
        // Check if the floor is complete now
        this.checkFloorCompletion();
        
        return true;
      })
      .catch(error => {
        ErrorHandler.handleError(
          error,
          "Node Completion", 
          ErrorHandler.SEVERITY.WARNING
        );
        
        // Optimistically continue with client-side state
        // This ensures the game is still playable if server fails
        this.updateAllNodeStates();
        this.notifyObservers('nodeCompleted', nodeId);
        EventSystem.emit(GAME_EVENTS.NODE_COMPLETED, nodeId);
        
        // Still check floor completion on error
        this.checkFloorCompletion();
        
        // Don't reject - we've recovered with local state
        return true;
      });
  },
  
  // Go to the next floor
  goToNextFloor: function() {
    console.log("Going to next floor...");
    
    // Notify observers that we're about to change floors
    this.notifyObservers('floorChanging', this.data.currentFloor);
    
    return ApiClient.goToNextFloor()
      .then(data => {
        // Update character stats with validation
        if (data.character && this.validators.character(data.character)) {
          this.data.character = data.character;
          this.notifyObservers('characterUpdated', this.data.character);
        } else if (data.character) {
          ErrorHandler.handleError(
            new Error("Invalid character data from server during floor change"), 
            "Floor Advancement", 
            ErrorHandler.SEVERITY.WARNING
          );
        }
        
        // IMPORTANT: Clear current floor data 
        this.data.currentNode = null;
        this.data.map = null; // This ensures old nodes are completely gone
        
        // Update floor number
        const newFloor = data.current_floor;
        console.log(`✨ ADVANCING TO FLOOR ${newFloor} ✨`);
        const oldFloor = this.data.currentFloor;
        this.data.currentFloor = newFloor;
        
        // Notify observers about floor change
        this.notifyObservers('floorChanged', {
          oldFloor: oldFloor,
          newFloor: newFloor
        });
        
        // Emit global event
        EventSystem.emit(GAME_EVENTS.FLOOR_CHANGED, newFloor);
        
        // Add a delay before loading the map for better UX
        return new Promise(resolve => setTimeout(() => resolve(newFloor), 500));
      })
      .then(newFloor => {
        // Load new floor map
        return this.loadMap(newFloor);
      })
      .catch(error => {
        ErrorHandler.handleError(
          error,
          "Floor Advancement", 
          ErrorHandler.SEVERITY.ERROR
        );
        return Promise.reject(error);
      });
  },
  
  // Add item to inventory with validation
  addInventoryItem: function(item) {
    if (!item || typeof item !== 'object' || !item.id || !item.name) {
      ErrorHandler.handleError(
        new Error("Invalid item data"), 
        "Inventory", 
        ErrorHandler.SEVERITY.WARNING
      );
      return false;
    }
    
    // Make a copy to avoid reference issues
    const itemCopy = JSON.parse(JSON.stringify(item));
    
    // Add to inventory
    this.data.inventory.push(itemCopy);
    
    // Notify observers
    this.notifyObservers('inventoryChanged', {
      action: 'add',
      item: itemCopy,
      inventory: this.data.inventory
    });
    
    // Emit event
    EventSystem.emit(GAME_EVENTS.ITEM_ADDED, itemCopy);
    
    return true;
  },
  
  // Remove item from inventory
  removeInventoryItem: function(index) {
    if (index < 0 || index >= this.data.inventory.length) {
      ErrorHandler.handleError(
        new Error(`Invalid inventory index: ${index}`), 
        "Inventory", 
        ErrorHandler.SEVERITY.WARNING
      );
      return false;
    }
    
    // Remove item
    const removedItem = this.data.inventory.splice(index, 1)[0];
    
    // Notify observers
    this.notifyObservers('inventoryChanged', {
      action: 'remove',
      item: removedItem,
      inventory: this.data.inventory
    });
    
    // Emit event
    EventSystem.emit(GAME_EVENTS.ITEM_REMOVED, removedItem);
    
    return true;
  },
  
  // Update character attribute with validation
  updateCharacterAttribute: function(attribute, value) {
    if (!this.data.character) {
      ErrorHandler.handleError(
        new Error("Cannot update character: no character data"), 
        "Character Update", 
        ErrorHandler.SEVERITY.WARNING
      );
      return false;
    }
    
    // Validate attribute exists on character
    if (!(attribute in this.data.character)) {
      ErrorHandler.handleError(
        new Error(`Invalid character attribute: ${attribute}`), 
        "Character Update", 
        ErrorHandler.SEVERITY.WARNING
      );
      return false;
    }
    
    // Type validation based on attribute
    let isValid = true;
    
    if (['level', 'lives', 'max_lives', 'insight'].includes(attribute)) {
      // Numeric attributes
      isValid = typeof value === 'number' && !isNaN(value);
      
      // Additional range validations
      if (attribute === 'lives' && value < 0) isValid = false;
      if (attribute === 'max_lives' && value < 1) isValid = false;
      if (attribute === 'level' && value < 1) isValid = false;
    } else if (attribute === 'name') {
      // String attributes
      isValid = typeof value === 'string' && value.length > 0;
    } else if (attribute === 'special_ability') {
      // Object attributes
      isValid = typeof value === 'object' && value !== null;
    }
    
    if (!isValid) {
      ErrorHandler.handleError(
        new Error(`Invalid value for character.${attribute}: ${value}`), 
        "Character Update", 
        ErrorHandler.SEVERITY.WARNING
      );
      return false;
    }
    
    // Update attribute
    const oldValue = this.data.character[attribute];
    this.data.character[attribute] = value;
    
    // Notify observers
    this.notifyObservers('characterUpdated', this.data.character);
    
    // Emit specific events for important attributes
    if (attribute === 'lives') {
      EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, value);
    } else if (attribute === 'insight') {
      EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, value);
    }
    
    return true;
  },
  
  // Observer pattern functions
  
  // Add observer to specific event or to global observers
  addObserver: function(observer, eventType = 'global') {
    if (typeof observer !== 'function' && 
        typeof observer.onStateChanged !== 'function') {
      console.error("Invalid observer:", observer);
      return false;
    }
    
    // Check if event type exists
    if (!this.observers[eventType]) {
      console.warn(`Unknown event type: ${eventType}, defaulting to global`);
      eventType = 'global';
    }
    
    // Add observer
    this.observers[eventType].push(observer);
    return true;
  },
  
  // Remove observer from specific event or from global observers
  removeObserver: function(observer, eventType = 'global') {
    // Check if event type exists
    if (!this.observers[eventType]) {
      console.warn(`Unknown event type: ${eventType}, defaulting to global`);
      eventType = 'global';
    }
    
    // Find and remove observer
    const index = this.observers[eventType].indexOf(observer);
    if (index !== -1) {
      this.observers[eventType].splice(index, 1);
      return true;
    }
    
    return false;
  },
  
  // Notify all observers of state change with enhanced targeting
  notifyObservers: function(eventType, data) {
    console.log(`State update: ${eventType}`, data);
    
    try {
      // First notify event-specific observers
      if (this.observers[eventType]) {
        this.observers[eventType].forEach(observer => {
          try {
            if (typeof observer === 'function') {
              observer(eventType, data);
            } else if (typeof observer.onStateChanged === 'function') {
              observer.onStateChanged(eventType, data);
            }
          } catch (error) {
            ErrorHandler.handleError(
              error,
              `Observer Notification (${eventType})`, 
              ErrorHandler.SEVERITY.WARNING
            );
          }
        });
      }
      
      // Then notify global observers
      this.observers.global.forEach(observer => {
        try {
          if (typeof observer === 'function') {
            observer(eventType, data);
          } else if (typeof observer.onStateChanged === 'function') {
            observer.onStateChanged(eventType, data);
          }
        } catch (error) {
          ErrorHandler.handleError(
            error,
            `Global Observer Notification (${eventType})`, 
            ErrorHandler.SEVERITY.WARNING
          );
        }
      });
    } catch (error) {
      ErrorHandler.handleError(
        error,
        `Observer Notification System (${eventType})`, 
        ErrorHandler.SEVERITY.ERROR
      );
    }
  },
  
  // Get a copy of the current state
  getState: function() {
    // Return a deep copy to prevent direct mutation
    return JSON.parse(JSON.stringify(this.data));
  },
  
  // Helper functions
  
  // Create a fallback map in case API call fails
  _createFallbackMap: function(floorNumber) {
    console.log(`Creating fallback map for floor ${floorNumber}`);
    
    // Simple map with a few nodes
    return {
      "start": {
        "id": "start",
        "type": "start",
        "position": {"row": 0, "col": 1},
        "paths": ["node_1", "node_2"],
        "visited": true
      },
      "nodes": {
        "node_1": {
          "id": "node_1",
          "type": "question",
          "title": "Physics Question",
          "position": {"row": 1, "col": 0},
          "difficulty": 1,
          "paths": ["node_3"],
          "visited": false
        },
        "node_2": {
          "id": "node_2",
          "type": "treasure",
          "title": "Equipment Found",
          "position": {"row": 1, "col": 2},
          "paths": ["node_3"],
          "visited": false
        },
        "node_3": {
          "id": "node_3",
          "type": "rest",
          "title": "Break Room",
          "position": {"row": 2, "col": 1},
          "paths": floorNumber < 3 ? [] : ["boss"],
          "visited": false
        }
      },
      "boss": floorNumber >= 3 ? {
        "id": "boss",
        "type": "boss",
        "title": "Chief Medical Physicist",
        "position": {"row": 3, "col": 1},
        "difficulty": 3,
        "paths": [],
        "visited": false
      } : null
    };
  },
  
  // Row-based progression WITH proper connectivity enforcement
  updateAllNodeStates: function() {
    if (!this.data.map) return;
    
    console.log("Updating node states with path-based row progression");

    // Step 1: Mark all nodes LOCKED initially (except start)
    const allNodes = this.getAllNodes();
    for (const node of allNodes) {
      if (node.id === 'start') {
        node.state = NODE_STATE.COMPLETED;
        node.visited = true; // Ensure start is always visited
      } else if (node.visited) {
        // If a node is already visited, keep it as COMPLETED
        node.state = NODE_STATE.COMPLETED;
      } else if (node.id === this.data.currentNode) {
        // If a node is the current node, mark it as CURRENT
        node.state = NODE_STATE.CURRENT;
        node.current = true;
      } else {
        // Otherwise, mark as LOCKED initially
        node.state = NODE_STATE.LOCKED;
        node.current = false;
      }
    }
    
    // Step 2: Find completed nodes and their connected paths
    const completedNodes = allNodes.filter(node => 
      node.state === NODE_STATE.COMPLETED && node.paths && node.paths.length > 0
    );
    
    // Step 3: Make nodes available based on BOTH row progression AND connectivity
    if (!this.data.currentNode) {
      // Find the highest completed row
      let highestCompletedRow = 0;
      allNodes.forEach(node => {
        if (node.visited && node.position && node.position.row > highestCompletedRow) {
          highestCompletedRow = node.position.row;
        }
      });
      
      // The next available row is the one after the highest completed row
      const nextRow = highestCompletedRow + 1;
      
      console.log(`Highest completed row is ${highestCompletedRow}, checking for connections to row ${nextRow}`);
      
      // For each completed node, check if it has paths to the next row
      for (const node of completedNodes) {
        // Get all nodes this node is connected to
        for (const targetId of node.paths) {
          const targetNode = this.getNodeById(targetId);
          
          // Only make nodes available if they are:
          // 1. In the next row AND
          // 2. Connected to a completed node AND
          // 3. Not already visited or current
          if (targetNode && targetNode.position && 
              targetNode.position.row === nextRow && 
              !targetNode.visited && 
              targetId !== this.data.currentNode) {
            
            console.log(`Setting node ${targetId} to AVAILABLE (connected from ${node.id} in row ${node.position?.row})`);
            targetNode.state = NODE_STATE.AVAILABLE;
          }
        }
      }
      
      // Special case for boss node
      const bossNode = this.getNodeById('boss');
      if (bossNode && bossNode.position) {
        const lastRegularRow = bossNode.position.row - 1;
        
        // Check if any completed node has a direct path to the boss
        const hasBossConnection = completedNodes.some(node => 
          node.position && node.position.row === lastRegularRow && 
          node.paths && node.paths.includes('boss')
        );
        
        if (hasBossConnection && !bossNode.visited) {
          bossNode.state = NODE_STATE.AVAILABLE;
          console.log('Boss node is now AVAILABLE through direct connections');
        }
      }
    }
  },
  
  // Get all nodes from the map
  getAllNodes: function() {
    if (!this.data.map) return [];
    
    const allNodes = [];
    
    if (this.data.map.start) allNodes.push(this.data.map.start);
    if (this.data.map.boss) allNodes.push(this.data.map.boss);
    
    if (this.data.map.nodes) {
      Object.values(this.data.map.nodes).forEach(node => {
        allNodes.push(node);
      });
    }
    
    return allNodes;
  },
  
  // Get a node by id
  getNodeById: function(nodeId) {
    if (!this.data.map) return null;
    
    if (nodeId === 'start') return this.data.map.start;
    if (nodeId === 'boss') return this.data.map.boss;
    
    return this.data.map.nodes && this.data.map.nodes[nodeId] ? 
      this.data.map.nodes[nodeId] : null;
  },
  
  // Get all nodes in a specific row
  getNodesInRow: function(rowIndex) {
    return this.getAllNodes().filter(node => 
      node.position && node.position.row === rowIndex
    );
  },
  
  // Check if a row is completed
  isRowCompleted: function(rowIndex) {
    const nodesInRow = this.getNodesInRow(rowIndex);
    if (nodesInRow.length === 0) return true; // Empty row is considered complete
    
    return nodesInRow.every(node => node.visited);
  },
  
  // Check if the entire floor is completed
  checkFloorCompletion: function() {
    const allNodes = this.getAllNodes();
    
    // Count nodes by state
    const stats = {
      locked: 0,
      available: 0,
      completed: 0,
      current: 0,
      total: allNodes.length
    };
    
    allNodes.forEach(node => {
      if (node.state === NODE_STATE.LOCKED) stats.locked++;
      if (node.state === NODE_STATE.AVAILABLE) stats.available++;
      if (node.state === NODE_STATE.COMPLETED) stats.completed++;
      if (node.state === NODE_STATE.CURRENT) stats.current++;
    });
    
    // Floor is complete when:
    // 1. There are no nodes in the AVAILABLE state
    // 2. There is no current node
    // 3. At least one node has been completed (besides start)
    
    const hasCompletedNodes = allNodes.some(node => 
      node.state === NODE_STATE.COMPLETED && node.id !== 'start'
    );
    
    // Consider floor complete if there are no more available nodes to visit
    // and there's no current node being visited
    const isFloorComplete = (stats.available === 0 && !this.data.currentNode && hasCompletedNodes);
    
    console.log("Floor completion check:", {
      hasAvailableNodes: stats.available > 0,
      hasCurrentNode: !!this.data.currentNode,
      hasCompletedNodes,
      isFloorComplete
    });
    
    if (isFloorComplete) {
      console.log(`Floor ${this.data.currentFloor} is COMPLETE!`);
      
      // Notify observers
      this.notifyObservers('floorCompleted', this.data.currentFloor);
      
      // Emit event for floor completion
      EventSystem.emit(GAME_EVENTS.FLOOR_COMPLETED, this.data.currentFloor);
    }
    
    return isFloorComplete;
  },
  
  // Debug helper to log current state
  debugState: function() {
    console.group("Game State Debug");
    console.log("Character:", this.data.character);
    console.log("Current Floor:", this.data.currentFloor);
    console.log("Current Node:", this.data.currentNode);
    
    if (this.data.map) {
      console.group("Map Structure");
      const nodesByRow = {};
      this.getAllNodes().forEach(node => {
        if (node.position && node.position.row !== undefined) {
          const row = node.position.row;
          if (!nodesByRow[row]) nodesByRow[row] = [];
          
          // Add node with relevant info
          nodesByRow[row].push({
            id: node.id,
            type: node.type,
            state: node.state || (node.visited ? 'completed' : node.current ? 'current' : 'unknown'),
            visited: node.visited,
            current: node.current,
            connections: node.paths || []
          });
        }
      });
      
      // Log each row
      Object.keys(nodesByRow).sort().forEach(row => {
        console.group(`Row ${row}`);
        nodesByRow[row].forEach(node => {
          console.log(`Node ${node.id} (${node.type}): ${node.state}`);
          if (node.connections.length > 0) {
            console.log(`  → Connects to: ${node.connections.join(', ')}`);
          }
        });
        console.groupEnd();
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
};

// Export the GameState object and constants
window.GameState = GameState;
window.NODE_STATE = NODE_STATE;