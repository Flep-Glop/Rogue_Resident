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
    
    // Load map for the current floor
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
        
        // Validate the map data has required structure
        if (!mapData || !mapData.nodes) {
          console.error("Invalid map data received:", mapData);
          throw new Error("Invalid map data structure");
        }
        
        // Check if we have any nodes
        const nodeCount = Object.keys(mapData.nodes).length;
        console.log(`Map has ${nodeCount} regular nodes and ${mapData.boss ? 1 : 0} boss nodes`);
        
        if (nodeCount === 0) {
          console.error("Map has no nodes!");
          throw new Error("Map generation failed - no nodes");
        }
        
        // IMPORTANT: Clear any previous map data completely
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
    
    // In state_manager.js, modify the updateAllNodeStates function:

    updateAllNodeStates: function() {
      if (!this.data.map) return;
      
      console.log("Updating all node states with STRICT RULES");

      // Step 1: Mark all nodes LOCKED initially (except start)
      const allNodes = this.getAllNodes();
      for (const node of allNodes) {
        if (node.id === 'start') {
          node.state = NODE_STATE.COMPLETED;
          node.visited = true; // Ensure start is always visited
        } else {
          node.state = NODE_STATE.LOCKED;
        }
      }
      
      // Step 2: Mark current node if exists
      if (this.data.currentNode) {
        const currentNode = this.getNodeById(this.data.currentNode);
        if (currentNode) {
          currentNode.state = NODE_STATE.CURRENT;
          currentNode.current = true;
        }
      }
      
      // Step 3: Mark completed nodes (for clarity)
      for (const node of allNodes) {
        if (node.visited && node.id !== 'start' && node.id !== this.data.currentNode) {
          node.state = NODE_STATE.COMPLETED;
        }
      }
      
      // CRITICAL: Check if there are any completed nodes besides start
      const hasOtherCompletedNodes = allNodes.some(node => 
        node.id !== 'start' && node.visited && node.id !== this.data.currentNode
      );
      
      // Step 4: Mark nodes that are direct children of completed nodes as AVAILABLE
      for (const node of allNodes) {
        // Only process completed/visited nodes
        if (node.visited && node.id !== this.data.currentNode) {
          // CRITICAL: Skip start node if there are other completed nodes
          if (node.id === 'start' && hasOtherCompletedNodes) {
            continue; // Skip start node to prevent backtracking
          }
          
          // For each path from this node
          if (node.paths) {
            for (const targetId of node.paths) {
              const targetNode = this.getNodeById(targetId);
              // Only mark as available if not already visited/current
              if (targetNode && !targetNode.visited && targetId !== this.data.currentNode) {
                console.log(`Setting node ${targetId} to available (connected from ${node.id})`);
                targetNode.state = NODE_STATE.AVAILABLE;
              }
            }
          }
        }
      }
      
      // For debugging - log all node states
      console.group("ALL NODE STATES");
      allNodes.forEach(node => {
        console.log(`Node ${node.id}: ${node.state}, visited=${node.visited}, current=${!!node.current}`);
      });
      console.groupEnd();
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
        visited: node.visited
      })));
      
      // Special handling for boss floors
      const hasBoss = allNodes.some(node => node.id === 'boss');
      console.log("Floor has boss:", hasBoss);
      
      // Consider floor complete if:
      // 1. All regular nodes (except start and boss) are visited
      // 2. If there's a boss node, it must be visited too
      const regularNodesComplete = allNodes.every(node => 
        node.id === 'start' || node.visited
      );
      
      const isFloorComplete = regularNodesComplete;
      
      console.log("Floor completion status:", {
        regularNodesComplete,
        currentNode: this.data.currentNode,
        isFloorComplete
      });
      
      if (isFloorComplete && !this.data.currentNode) {
        // Floor is complete - notify observers
        this.notifyObservers('floorCompleted', this.data.currentFloor);
        
        // Emit event for floor completion
        EventSystem.emit(GAME_EVENTS.FLOOR_COMPLETED, this.data.currentFloor);
        console.log(`Floor ${this.data.currentFloor} completed! Ready for next floor.`);
        
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
          
          return true;
        })
        .catch(error => {
          console.error('Error completing node:', error);
          
          // Optimistically continue with client-side state
          // This ensures the game is still playable if server fails
          this.updateAllNodeStates();
          this.notifyObservers('nodeCompleted', nodeId);
          
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