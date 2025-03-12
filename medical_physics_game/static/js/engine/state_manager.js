// state_manager.js - Centralized game state management
// This is the core of the game's architecture

// Define node states as constants
const NODE_STATE = {
    LOCKED: 'locked',     // Cannot be visited yet
    AVAILABLE: 'available', // Can be visited now
    CURRENT: 'current',   // Currently being visited
    COMPLETED: 'completed' // Already visited and completed
  };
  
  // GameState singleton - manages all game state
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
    
    // State observers (components that need to be notified of changes)
    observers: [],
    
    // Initialize the game state
    initialize: function() {
      console.log("Initializing game state...");
      return this.loadFromServer()
        .then(() => {
          this.notifyObservers('stateInitialized');
          return this.data;
        });
    },
    
    // Load game state from server
    loadFromServer: function() {
      return ApiClient.loadGameState()
        .then(data => {
          // Update core data
          this.data.character = data.character;
          this.data.currentFloor = data.current_floor || 1;
          this.data.inventory = data.inventory || [];
          this.data.currentNode = null;
          
          // We'll load the map separately
          return this.loadMap(data.current_floor || 1);
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
    if (!mapData || !mapData.nodes || Object.keys(mapData.nodes).length === 0) {
      console.error("Invalid map data received:", mapData);
      throw new Error("Map data is invalid or empty");
    }
    
    console.log(`Map for floor ${floorNumber} has ${Object.keys(mapData.nodes).length} nodes and ${mapData.boss ? "a boss" : "no boss"}`);
    
    // IMPORTANT: Store the map data properly
    this.data.map = mapData;
    
    // Reset the current node
    this.data.currentNode = null;
    
    // Initialize node states
    this.updateAllNodeStates();
    
    // Emit event that a new floor map is loaded
    EventSystem.emit(GAME_EVENTS.FLOOR_LOADED, floorNumber);
    
    // Force a map render
    if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.renderMap === 'function') {
      setTimeout(() => MapRenderer.renderMap(), 100);
    }
    
    return mapData;
  });
},

// Fully redone goToNextFloor implementation
goToNextFloor: function() {
  console.log("Going to next floor...");
  
  // Inform user we're loading
  if (typeof UiUtils !== 'undefined' && typeof UiUtils.showToast === 'function') {
    UiUtils.showToast("Loading next floor...", "info");
  }
  
  // First, disable next floor button to prevent multiple clicks
  const nextFloorBtn = document.getElementById('next-floor-btn');
  if (nextFloorBtn) {
    nextFloorBtn.disabled = true;
    nextFloorBtn.textContent = "Loading...";
  }
  
  return ApiClient.goToNextFloor()
    .then(data => {
      console.log("Next floor API response:", data);
      
      // Validate response
      if (!data || !data.current_floor) {
        throw new Error("Invalid response from server for next floor");
      }
      
      // Update character stats
      this.data.character = data.character;
      
      // IMPORTANT: Clear current floor data 
      this.data.currentNode = null;
      this.data.map = null; // This ensures old nodes are completely gone
      
      // Update floor number
      const newFloor = data.current_floor;
      console.log(`✨ ADVANCING TO FLOOR ${newFloor} ✨`);
      this.data.currentFloor = newFloor;
      
      // Update floor number display
      const floorElement = document.getElementById('current-floor');
      if (floorElement) {
        floorElement.textContent = newFloor;
      }
      
      // Notify observers before loading new map
      this.notifyObservers('floorAdvancing', newFloor);
      EventSystem.emit(GAME_EVENTS.FLOOR_CHANGED, newFloor);
      
      // Show floor transition animation
      if (typeof UiUtils !== 'undefined' && typeof UiUtils.showFloorTransition === 'function') {
        UiUtils.showFloorTransition(newFloor);
      }
      
      // Add a delay before loading the map for better UX
      return new Promise(resolve => setTimeout(() => resolve(newFloor), 500));
    })
    .then(newFloor => {
      // Load new floor map
      return this.loadMap(newFloor)
        .catch(error => {
          console.error(`Error loading map for floor ${newFloor}:`, error);
          
          // Show error to user
          if (typeof UiUtils !== 'undefined' && typeof UiUtils.showToast === 'function') {
            UiUtils.showToast(`Error loading floor ${newFloor}: ${error.message}`, "danger");
          }
          
          // Create a very simple default map as fallback
          console.log("Creating fallback map");
          this.data.map = this._createFallbackMap(newFloor);
          this.updateAllNodeStates();
          
          // Force map render
          if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.renderMap === 'function') {
            setTimeout(() => MapRenderer.renderMap(), 100);
          }
          
          return this.data.map;
        });
    })
    .then(mapData => {
      console.log("New floor map loaded:", mapData);
      
      // Re-enable next floor button
      if (nextFloorBtn) {
        nextFloorBtn.disabled = false;
        nextFloorBtn.textContent = "Go to Next Floor";
        nextFloorBtn.style.display = 'none'; // Hide until this floor is complete
      }
      
      return mapData;
    })
    .catch(error => {
      console.error("Critical error during floor advancement:", error);
      
      // Re-enable next floor button
      if (nextFloorBtn) {
        nextFloorBtn.disabled = false;
        nextFloorBtn.textContent = "Try Again";
      }
      
      // Show error to user
      if (typeof UiUtils !== 'undefined' && typeof UiUtils.showToast === 'function') {
        UiUtils.showToast(`Error going to next floor: ${error.message}. Please try again.`, "danger");
      }
      
      throw error;
    });
},

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
      
      console.log("Updating node states with PATH-BASED ROW PROGRESSION");

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
                targetNode.id !== this.data.currentNode) {
              
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

      // Log the state of all nodes for debugging
      console.log("ALL NODE STATES");
      allNodes.forEach(node => {
        console.log(`Node ${node.id}: ${node.state}, visited=${node.visited}, position=${node.position?.row},${node.position?.col}`);
      });
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
      
      // DEBUG: Log all nodes and their visited status
      console.log("Checking floor completion. All nodes:", allNodes.map(node => ({
        id: node.id,
        type: node.type, 
        visited: node.visited,
        state: node.state
      })));
      
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
      
      console.log("Floor node stats:", stats);
      
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
        
        // Show the next floor button
        const nextFloorBtn = document.getElementById('next-floor-btn');
        if (nextFloorBtn) {
          nextFloorBtn.style.display = 'block';
        }
      }
      
      return isFloorComplete;
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
        console.error(`Cannot complete node: ${nodeId} - not found`);
        return Promise.reject(new Error(`Node ${nodeId} not found`));
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
          EventSystem.emit(GAME_EVENTS.NODE_COMPLETED, nodeId);
          
          // Explicitly check if the floor is complete now
          console.log("Checking if floor is complete after node completion");
          const isFloorComplete = this.checkFloorCompletion();
          console.log("Floor complete check result:", isFloorComplete);
          
          return true;
        })
        .catch(error => {
          console.error('Error completing node:', error);
          
          // Optimistically continue with client-side state
          // This ensures the game is still playable if server fails
          this.updateAllNodeStates();
          this.notifyObservers('nodeCompleted', nodeId);
          EventSystem.emit(GAME_EVENTS.NODE_COMPLETED, nodeId);
          
          // Still check floor completion on error
          this.checkFloorCompletion();
          
          return Promise.reject(error);
        });
    },
    
    // Go to the next floor
    goToNextFloor: function() {
      console.log("Going to next floor...");
      
      return ApiClient.goToNextFloor()
        .then(data => {
          // Update character stats
          this.data.character = data.character;
          
          // IMPORTANT: Clear current floor data 
          this.data.currentNode = null;
          this.data.map = null; // This ensures old nodes are completely gone
          
          // Update floor number
          const newFloor = data.current_floor;
          console.log(`Advancing to floor ${newFloor}`);
          this.data.currentFloor = newFloor;
          
          // Hide next floor button
          const nextFloorBtn = document.getElementById('next-floor-btn');
          if (nextFloorBtn) {
            nextFloorBtn.style.display = 'none';
          }
          
          // Update floor number display
          const floorElement = document.getElementById('current-floor');
          if (floorElement) {
            floorElement.textContent = newFloor;
          }
          
          // Notify observers before loading new map
          this.notifyObservers('floorAdvancing', newFloor);
          EventSystem.emit(GAME_EVENTS.FLOOR_CHANGED, newFloor);
          
          // Load new floor map - with retry logic
          return this.loadMap(newFloor)
            .catch(error => {
              console.error(`Error loading map for floor ${newFloor}:`, error);
              console.log("Retrying map load...");
              
              // Wait a moment and retry once
              return new Promise(resolve => setTimeout(resolve, 500))
                .then(() => this.loadMap(newFloor));
            });
        })
        .then(mapData => {
          console.log("Map loaded successfully:", mapData);
          
          // Show transition animation
          if (typeof UiUtils !== 'undefined' && typeof UiUtils.showFloorTransition === 'function') {
            UiUtils.showFloorTransition(this.data.currentFloor);
          }
          
          // Notify observers after new map is loaded
          this.notifyObservers('floorChanged', this.data.currentFloor);
          return mapData;
        });
    },
    
    // Add observer to state changes
    addObserver: function(observer) {
      this.observers.push(observer);
    },
    
    // Remove observer
    removeObserver: function(observer) {
      const index = this.observers.indexOf(observer);
      if (index !== -1) {
        this.observers.splice(index, 1);
      }
    },
    
    // Notify all observers of state change
    notifyObservers: function(event, data) {
      this.observers.forEach(observer => {
        if (typeof observer.onStateChanged === 'function') {
          observer.onStateChanged(event, data);
        }
      });
    },
    
    // Get a copy of the current state
    getState: function() {
      // Return a deep copy to prevent direct mutation
      return JSON.parse(JSON.stringify(this.data));
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