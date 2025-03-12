// debug_tools.js - Debugging and development tools

// DebugTools singleton - helps identify and fix issues
const DebugTools = {
    // Is debug mode active
    debugMode: false,
    
    // Initialize debug tools
    initialize: function() {
      console.log("Initializing debug tools...");
      
      // Check if debug mode should be enabled (URL parameter or localStorage)
      this.debugMode = 
        new URLSearchParams(window.location.search).has('debug') || 
        localStorage.getItem('debug_mode') === 'true';
      
      // Only set up debug tools if in debug mode
      if (this.debugMode) {
        this.setupDebugUI();
        this.setupKeyboardShortcuts();
      }
      
      return this;
    },
    
    // Set up debug UI elements
    setupDebugUI: function() {
      console.log("Setting up debug UI...");
      
      // Add debug panel to body
      const debugPanel = document.createElement('div');
      debugPanel.id = 'debug-panel';
      debugPanel.className = 'debug-panel';
      debugPanel.innerHTML = `
        <div class="debug-header">
          <h3>Debug Tools</h3>
          <button id="debug-close" class="debug-close">×</button>
        </div>
        <div class="debug-content">
          <div class="debug-section">
            <h4>Map Diagnostics</h4>
            <button id="debug-validate-map" class="debug-btn">Validate Map</button>
            <button id="debug-log-map" class="debug-btn">Log Map Data</button>
            <button id="debug-visualize-paths" class="debug-btn">Visualize Paths</button>
          </div>
          <div class="debug-section">
            <h4>Game State</h4>
            <button id="debug-log-state" class="debug-btn">Log Game State</button>
            <button id="debug-log-events" class="debug-btn">Log Event Listeners</button>
          </div>
          <div class="debug-section">
            <h4>Cheats</h4>
            <button id="debug-complete-node" class="debug-btn">Complete Current Node</button>
            <button id="debug-complete-floor" class="debug-btn">Complete Floor</button>
            <button id="debug-add-insight" class="debug-btn">+20 Insight</button>
            <button id="debug-add-life" class="debug-btn">+1 Life</button>
          </div>
        </div>
      `;
      
      // Add panel styles if not already in document
      if (!document.getElementById('debug-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'debug-styles';
        styleElement.textContent = `
          .debug-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background-color: rgba(30, 30, 40, 0.9);
            border: 2px solid #5b8dd9;
            border-radius: 5px;
            color: white;
            font-family: monospace;
            z-index: 10000;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          }
          .debug-panel.collapsed {
            width: auto;
            height: auto;
          }
          .debug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 10px;
            background-color: #5b8dd9;
            cursor: move;
          }
          .debug-header h3 {
            margin: 0;
            font-size: 14px;
          }
          .debug-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
          }
          .debug-content {
            padding: 10px;
            max-height: 80vh;
            overflow-y: auto;
          }
          .debug-panel.collapsed .debug-content {
            display: none;
          }
          .debug-section {
            margin-bottom: 15px;
          }
          .debug-section h4 {
            margin: 0 0 5px 0;
            font-size: 12px;
            color: #5b8dd9;
          }
          .debug-btn {
            display: block;
            width: 100%;
            padding: 5px;
            margin-bottom: 5px;
            background-color: #2c3848;
            border: 1px solid #5b8dd9;
            color: white;
            font-family: monospace;
            font-size: 12px;
            cursor: pointer;
          }
          .debug-btn:hover {
            background-color: #3d4c60;
          }
          .debug-float-btn {
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
            background-color: #5b8dd9;
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      // Add toggle button
      const toggleButton = document.createElement('button');
      toggleButton.id = 'debug-toggle';
      toggleButton.className = 'debug-float-btn';
      toggleButton.innerHTML = '⚙️';
      toggleButton.title = 'Toggle Debug Panel';
      
      // Add elements to DOM
      document.body.appendChild(debugPanel);
      document.body.appendChild(toggleButton);
      
      // Make panel draggable
      this.makeDraggable(debugPanel);
      
      // Set up event listeners
      this.setupDebugEvents();
    },
    
    // Make an element draggable
    makeDraggable: function(element) {
      const header = element.querySelector('.debug-header');
      if (!header) return;
      
      let isDragging = false;
      let offsetX, offsetY;
      
      header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        element.style.left = (e.clientX - offsetX) + 'px';
        element.style.top = (e.clientY - offsetY) + 'px';
      });
      
      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    },
    
    // Set up event listeners for debug UI
    setupDebugEvents: function() {
      // Toggle debug panel
      const toggleBtn = document.getElementById('debug-toggle');
      const panel = document.getElementById('debug-panel');
      const closeBtn = document.getElementById('debug-close');
      
      if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', () => {
          panel.classList.toggle('collapsed');
          if (!panel.classList.contains('collapsed')) {
            panel.style.display = 'block';
          }
        });
      }
      
      if (closeBtn && panel) {
        closeBtn.addEventListener('click', () => {
          panel.style.display = 'none';
        });
      }
      
      // Map diagnostics buttons
      const validateMapBtn = document.getElementById('debug-validate-map');
      if (validateMapBtn) {
        validateMapBtn.addEventListener('click', () => {
          this.validateMap();
        });
      }
      
      const logMapBtn = document.getElementById('debug-log-map');
      if (logMapBtn) {
        logMapBtn.addEventListener('click', () => {
          this.logMapData();
        });
      }
      
      const visualizePathsBtn = document.getElementById('debug-visualize-paths');
      if (visualizePathsBtn) {
        visualizePathsBtn.addEventListener('click', () => {
          this.togglePathVisualization();
        });
      }
      
      // Game state buttons
      const logStateBtn = document.getElementById('debug-log-state');
      if (logStateBtn) {
        logStateBtn.addEventListener('click', () => {
          this.logGameState();
        });
      }
      
      const logEventsBtn = document.getElementById('debug-log-events');
      if (logEventsBtn) {
        logEventsBtn.addEventListener('click', () => {
          this.logEventListeners();
        });
      }
      
      // Cheat buttons
      const completeNodeBtn = document.getElementById('debug-complete-node');
      if (completeNodeBtn) {
        completeNodeBtn.addEventListener('click', () => {
          this.completeCurrentNode();
        });
      }
      
      const completeFloorBtn = document.getElementById('debug-complete-floor');
      if (completeFloorBtn) {
        completeFloorBtn.addEventListener('click', () => {
          this.completeFloor();
        });
      }
      
      const addInsightBtn = document.getElementById('debug-add-insight');
      if (addInsightBtn) {
        addInsightBtn.addEventListener('click', () => {
          this.addInsight(20);
        });
      }
      
      const addLifeBtn = document.getElementById('debug-add-life');
      if (addLifeBtn) {
        addLifeBtn.addEventListener('click', () => {
          this.addLife(1);
        });
      }
    },
    
    // Set up keyboard shortcuts for debug actions
    setupKeyboardShortcuts: function() {
      document.addEventListener('keydown', (e) => {
        // Only trigger if Alt+Shift is held
        if (e.altKey && e.shiftKey) {
          switch (e.key) {
            case 'D': // Alt+Shift+D: Toggle debug panel
              const panel = document.getElementById('debug-panel');
              if (panel) {
                panel.classList.toggle('collapsed');
                if (!panel.classList.contains('collapsed')) {
                  panel.style.display = 'block';
                }
              }
              break;
              
            case 'V': // Alt+Shift+V: Validate map
              this.validateMap();
              break;
              
            case 'M': // Alt+Shift+M: Log map data
              this.logMapData();
              break;
              
            case 'S': // Alt+Shift+S: Log game state
              this.logGameState();
              break;
              
            case 'C': // Alt+Shift+C: Complete current node
              this.completeCurrentNode();
              break;
          }
        }
      });
    },
    
    // =========================
    // Debug actions
    // =========================
    
    // Validate the map structure
    validateMap: function() {
      console.group("Map Validation");
      
      const mapData = GameState.data.map;
      if (!mapData) {
        console.error("No map data available!");
        console.groupEnd();
        return;
      }
      
      let issues = [];
      
      // Check if nodes have valid row and column positions
      console.log("Checking node positions...");
      
      const allNodes = GameState.getAllNodes();
      allNodes.forEach(node => {
        if (!node.position || typeof node.position.row !== 'number' || typeof node.position.col !== 'number') {
          issues.push({
            type: "invalid_position",
            node: node.id,
            message: `Node ${node.id} has invalid position: ${JSON.stringify(node.position)}`
          });
        }
      });
      
      // Check for row-based progression (nodes should only connect to the next row)
      console.log("Checking row-based progression...");
      
      allNodes.forEach(node => {
        if (!node.paths || node.id === 'boss') return;
        
        const sourceRow = node.position?.row;
        if (sourceRow === undefined) return;
        
        node.paths.forEach(targetId => {
          const target = GameState.getNodeById(targetId);
          if (!target || target.position?.row === undefined) {
            issues.push({
              type: "invalid_target",
              source: node.id,
              target: targetId,
              message: `Node ${node.id} has path to non-existent node: ${targetId}`
            });
            return;
          }
          
          // Check if target is in the next row (or boss node)
          const rowDiff = target.position.row - sourceRow;
          
          // Special case for start node (can connect to first row)
          if (node.id === 'start' && target.position.row !== 1) {
            issues.push({
              type: "invalid_start_connection",
              source: node.id,
              target: targetId,
              message: `Start node connects to row ${target.position.row}, should only connect to row 1`
            });
          }
          // Regular nodes should only connect to the next row
          else if (node.id !== 'start' && rowDiff !== 1) {
            issues.push({
              type: "invalid_progression",
              source: node.id,
              target: targetId,
              message: `Node ${node.id} (row ${sourceRow}) connects to node ${targetId} (row ${target.position.row}), should only connect to next row`
            });
          }
        });
      });
      
      // Check that every row has at least one node
      console.log("Checking row coverage...");
      
      const rowsWithNodes = {};
      allNodes.forEach(node => {
        if (node.position && typeof node.position.row === 'number') {
          rowsWithNodes[node.position.row] = true;
        }
      });
      
      // Should have nodes in rows 0 (start) through N
      for (let i = 0; i <= Math.max(...Object.keys(rowsWithNodes).map(Number)); i++) {
        if (!rowsWithNodes[i]) {
          issues.push({
            type: "missing_row",
            row: i,
            message: `No nodes found in row ${i}`
          });
        }
      }
      
      // Check for unreachable nodes
      console.log("Checking for unreachable nodes...");
      
      const reachableNodes = { 'start': true };
      let changed = true;
      
      // Keep propagating reachability until no changes
      while (changed) {
        changed = false;
        
        allNodes.forEach(node => {
          if (reachableNodes[node.id] && node.paths) {
            node.paths.forEach(targetId => {
              if (!reachableNodes[targetId]) {
                reachableNodes[targetId] = true;
                changed = true;
              }
            });
          }
        });
      }
      
      // Check which nodes are unreachable
      allNodes.forEach(node => {
        if (!reachableNodes[node.id]) {
          issues.push({
            type: "unreachable_node",
            node: node.id,
            message: `Node ${node.id} is unreachable from the start node`
          });
        }
      });
      
      // Log results
      if (issues.length > 0) {
        console.error(`Found ${issues.length} issues with map structure:`);
        issues.forEach(issue => {
          console.error(`- ${issue.message}`);
        });
        console.table(issues);
      } else {
        console.log("✅ Map structure validation passed with no issues!");
      }
      
      console.groupEnd();
      return issues;
    },
    
    // Log detailed map data
    logMapData: function() {
      console.group("Map Data");
      
      const mapData = GameState.data.map;
      if (!mapData) {
        console.error("No map data available!");
        console.groupEnd();
        return;
      }
      
      // Group nodes by row
      const nodesByRow = {};
      const allNodes = GameState.getAllNodes();
      
      allNodes.forEach(node => {
        if (node.position && typeof node.position.row === 'number') {
          if (!nodesByRow[node.position.row]) {
            nodesByRow[node.position.row] = [];
          }
          
          nodesByRow[node.position.row].push({
            id: node.id,
            type: node.type,
            state: node.state || (node.visited ? 'completed' : node.current ? 'current' : 'unknown'),
            visited: node.visited,
            current: node.current,
            paths: node.paths || []
          });
        }
      });
      
      // Log by row
      Object.keys(nodesByRow).sort((a, b) => Number(a) - Number(b)).forEach(row => {
        console.group(`Row ${row}`);
        
        const nodes = nodesByRow[row];
        nodes.sort((a, b) => a.position?.col - b.position?.col);
        
        nodes.forEach(node => {
          console.log(`Node ${node.id} (${node.type}): ${node.state}`);
          if (node.paths && node.paths.length > 0) {
            console.log(`  → Connects to: ${node.paths.join(', ')}`);
          }
        });
        
        console.groupEnd();
      });
      
      // Log connection stats
      const connections = {
        total: 0,
        byRow: {},
        byType: {}
      };
      
      allNodes.forEach(node => {
        if (!node.paths) return;
        
        connections.total += node.paths.length;
        
        // Count by source row
        const sourceRow = node.position?.row;
        if (sourceRow !== undefined) {
          if (!connections.byRow[sourceRow]) {
            connections.byRow[sourceRow] = 0;
          }
          connections.byRow[sourceRow] += node.paths.length;
        }
        
        // Count by source type
        const sourceType = node.type;
        if (sourceType) {
          if (!connections.byType[sourceType]) {
            connections.byType[sourceType] = 0;
          }
          connections.byType[sourceType] += node.paths.length;
        }
      });
      
      console.log("Connection statistics:", connections);
      
      console.groupEnd();
    },
    
    // Toggle visualization of all paths
    togglePathVisualization: function() {
      // This needs a canvas overlay to work
      // Check if we have a path visualization overlay
      let overlay = document.getElementById('path-visualization-overlay');
      
      if (overlay) {
        // Toggle visibility
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        return;
      }
      
      // Create overlay
      overlay = document.createElement('canvas');
      overlay.id = 'path-visualization-overlay';
      overlay.className = 'path-visualization-overlay';
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1000';
      
      // Get the map canvas dimensions
      const mapCanvas = document.getElementById('floor-map');
      if (!mapCanvas) {
        console.error("Map canvas not found!");
        return;
      }
      
      const rect = mapCanvas.getBoundingClientRect();
      overlay.width = rect.width;
      overlay.height = rect.height;
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
      
      // Position overlay on top of map
      overlay.style.top = rect.top + window.scrollY + 'px';
      overlay.style.left = rect.left + window.scrollX + 'px';
      
      // Add to DOM
      document.body.appendChild(overlay);
      
      // Draw all paths
      const ctx = overlay.getContext('2d');
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      
      const allNodes = GameState.getAllNodes();
      const mapData = GameState.data.map;
      
      allNodes.forEach(node => {
        if (!node.paths) return;
        
        const startX = node.position.col * 50 + 25;
        const startY = node.position.row * 50 + 25;
        
        node.paths.forEach(targetId => {
          const targetNode = GameState.getNodeById(targetId);
          if (!targetNode) return;
          
          const endX = targetNode.position.col * 50 + 25;
          const endY = targetNode.position.row * 50 + 25;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
      });
    },
    
    // Log the current game state
    logGameState: function() {
      console.group("Game State");
      
      console.log("Character:", GameState.data.character);
      console.log("Current Floor:", GameState.data.currentFloor);
      console.log("Current Node:", GameState.data.currentNode);
      console.log("Inventory:", GameState.data.inventory);
      
      console.log("Full State:", JSON.parse(JSON.stringify(GameState.data)));
      
      console.groupEnd();
    },
    
    // Log all event listeners
    logEventListeners: function() {
      console.group("Event Listeners");
      
      if (typeof EventSystem !== 'undefined' && typeof EventSystem.debugEvents === 'function') {
        EventSystem.debugEvents();
      } else {
        console.log("Event system not available or doesn't support debugging");
      }
      
      console.groupEnd();
    },
    
    // =========================
    // Cheat functions
    // =========================
    
    // Complete the current node
    completeCurrentNode: function() {
      const currentNodeId = GameState.data.currentNode;
      
      if (!currentNodeId) {
        console.log("No current node to complete");
        UiUtils.showToast("No current node to complete", "warning");
        return;
      }
      
      console.log(`Debug: Completing current node: ${currentNodeId}`);
      GameState.completeNode(currentNodeId)
        .then(() => {
          UiUtils.showToast(`Completed node: ${currentNodeId}`, "success");
        })
        .catch(error => {
          console.error("Failed to complete node:", error);
          UiUtils.showToast(`Failed to complete node: ${error.message}`, "danger");
        });
    },
    
    // Complete the entire floor
    completeFloor: function() {
      console.log("Debug: Completing floor");
      
      const allNodes = GameState.getAllNodes();
      const nodesToComplete = allNodes.filter(node => 
        !node.visited && node.id !== 'start'
      );
      
      if (nodesToComplete.length === 0) {
        console.log("All nodes already completed");
        UiUtils.showToast("All nodes already completed", "info");
        return;
      }
      
      // Mark all nodes as visited
      nodesToComplete.forEach(node => {
        node.visited = true;
      });
      
      // Clear current node
      GameState.data.currentNode = null;
      
      // Save to server
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
        ApiClient.saveGame()
          .then(() => {
            console.log("Floor completed");
            UiUtils.showToast(`Completed ${nodesToComplete.length} nodes`, "success");
            
            // Update the map
            if (typeof MapRenderer !== 'undefined' && 
                typeof MapRenderer.renderFloorMap === 'function') {
              MapRenderer.renderFloorMap(GameState.data.map, 'floor-map');
            }
            
            // Show next floor button
            const nextFloorBtn = document.getElementById('next-floor-btn');
            if (nextFloorBtn) {
              nextFloorBtn.style.display = 'block';
            }
          })
          .catch(error => {
            console.error("Failed to save completed floor:", error);
            UiUtils.showToast(`Failed to complete floor: ${error.message}`, "danger");
          });
      }
    },
    
    // Add insight to character
    addInsight: function(amount = 20) {
      if (!GameState.data.character) {
        console.log("No character data available");
        return;
      }
      
      GameState.data.character.insight += amount;
      
      // Update UI
      if (typeof CharacterPanel !== 'undefined' && 
          typeof CharacterPanel.updateInsight === 'function') {
        CharacterPanel.updateInsight(GameState.data.character.insight);
      }
      
      // Save to server
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
        ApiClient.saveGame().catch(error => {
          console.error("Failed to save after adding insight:", error);
        });
      }
      
      console.log(`Added ${amount} insight. New total: ${GameState.data.character.insight}`);
      UiUtils.showToast(`Added ${amount} insight`, "success");
    },
    
    // Add life to character
    addLife: function(amount = 1) {
      if (!GameState.data.character) {
        console.log("No character data available");
        return;
      }
      
      const newLives = Math.min(
        GameState.data.character.lives + amount,
        GameState.data.character.max_lives
      );
      
      if (newLives === GameState.data.character.lives) {
        console.log("Already at maximum lives");
        UiUtils.showToast("Already at maximum lives", "info");
        return;
      }
      
      GameState.data.character.lives = newLives;
      
      // Update UI
      if (typeof CharacterPanel !== 'undefined' && 
          typeof CharacterPanel.updateLives === 'function') {
        CharacterPanel.updateLives(GameState.data.character.lives);
      }
      
      // Save to server
      if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
        ApiClient.saveGame().catch(error => {
          console.error("Failed to save after adding life:", error);
        });
      }
      
      console.log(`Added ${amount} life. New total: ${GameState.data.character.lives}/${GameState.data.character.max_lives}`);
      UiUtils.showToast(`Added ${amount} life`, "success");
    },
  // Add to the DebugTools object

  // Add or replace this function in static/js/engine/debug_tools.js

// Replace your entire generateStateSummary function with this one
generateStateSummary: function() {
  console.log("Generating game state summary...");
  
  // Verify GameState exists
  if (!window.GameState || !GameState.data) {
    console.error("GameState not available");
    UiUtils.showToast("Error: GameState not available", "danger");
    return "GameState not available";
  }

  // Create output string to hold summary text
  let output = "===== GAME STATE SUMMARY =====\n\n";
  
  try {
    // Get all nodes for summary
    const allNodes = GameState.getAllNodes ? GameState.getAllNodes() : [];
    
    // Current floor info
    const floorInfo = {
      currentFloor: GameState.data.currentFloor || 0,
      currentNode: GameState.data.currentNode || 'None',
    };
    
    // Add floor info to output
    output += `Floor: ${floorInfo.currentFloor}, Current Node: ${floorInfo.currentNode || 'None'}\n\n`;
    
    // Node stats - count by state
    const nodeStats = {
      byState: {
        locked: 0,
        available: 0,
        current: 0,
        completed: 0
      },
      byRow: {}
    };
    
    // Available nodes details
    const availableNodes = [];
    
    // Process nodes
    if (allNodes && allNodes.length > 0) {
      allNodes.forEach(node => {
        if (!node) return;
        
        // Count by state
        if (node.state) {
          const stateKey = node.state.toLowerCase();
          if (nodeStats.byState.hasOwnProperty(stateKey)) {
            nodeStats.byState[stateKey]++;
          }
        }
        
        // Count by row
        if (node.position && typeof node.position.row !== 'undefined') {
          const row = node.position.row;
          if (!nodeStats.byRow[row]) {
            nodeStats.byRow[row] = {
              total: 0,
              completed: 0,
              available: 0,
              locked: 0
            };
          }
          
          nodeStats.byRow[row].total++;
          
          if (node.visited) {
            nodeStats.byRow[row].completed++;
          } else if (node.state === 'available') {
            nodeStats.byRow[row].available++;
          } else if (node.state === 'locked') {
            nodeStats.byRow[row].locked++;
          }
        }
        
        // Collect all available nodes
        if (node.state === 'available') {
          availableNodes.push({
            id: node.id,
            row: node.position?.row,
            col: node.position?.col,
            connections: this._findConnectionsToNode(node.id)
          });
        }
      });
    }
    
    // Node counts by state
    output += "Node Counts by State:\n";
    for (const [state, count] of Object.entries(nodeStats.byState)) {
      output += `  ${state}: ${count}\n`;
    }
    output += "\n";
    
    // Node stats by row
    output += "Nodes by Row:\n";
    const rows = Object.keys(nodeStats.byRow).sort((a, b) => parseInt(a) - parseInt(b));
    for (const row of rows) {
      const stats = nodeStats.byRow[row];
      output += `  Row ${row}: ${stats.completed}/${stats.total} completed, ${stats.available} available\n`;
    }
    output += "\n";
    
    // Available nodes
    output += "Available Nodes:\n";
    if (availableNodes.length === 0) {
      output += "  None\n";
    } else {
      availableNodes.forEach(node => {
        output += `  ${node.id} (Row ${node.row}, Col ${node.col}): Connected from ${node.connections.join(', ') || 'none'}\n`;
      });
    }
    output += "\n";
    
    // Character stats
    output += `Character: Level ${GameState.data.character?.level || 0}, Lives ${GameState.data.character?.lives || 0}, Insight ${GameState.data.character?.insight || 0}\n`;
    output += `Inventory: ${(GameState.data.inventory?.length || 0) + " items"}\n\n`;
    
    // Add node type status check
    const nodeTypeStatus = this.checkNodeTypeStatus();
    
    output += "===== NODE TYPE STATUS =====\n";
    
    if (nodeTypeStatus.error) {
      output += `Error checking node types: ${nodeTypeStatus.error}\n`;
    } else {
      output += "Working Types: " + (nodeTypeStatus.working.join(", ") || "None") + "\n";
      output += "Problem Types: " + (nodeTypeStatus.notWorking.join(", ") || "None") + "\n\n";
      
      // Add details for problem types only (to keep it concise)
      if (nodeTypeStatus.notWorking.length > 0) {
        output += "Details for problem node types:\n";
        nodeTypeStatus.notWorking.forEach(type => {
          const details = nodeTypeStatus.details[type];
          output += `  ${type}: ${details.status}\n`;
          output += `    Container: ${details.containerExists ? "Exists" : "Missing"}\n`;
          output += `    Handler: ${details.handlerExists ? details.handlerName : "Missing"}\n`;
        });
      }
    }
    
    console.group("Debug Summary");
    console.log(output);
    console.log("Full node type status:", nodeTypeStatus);
    console.groupEnd();
    
    // Copy to clipboard
    this._copyToClipboard(output);
    
    return output;
  } catch (error) {
    console.error("Error generating state summary:", error);
    UiUtils.showToast("Error generating debug summary: " + error.message, "danger");
    return "Error: " + error.message;
  }
},

// Also don't forget to add this function
checkNodeTypeStatus: function() {
  const results = {
    working: [],
    notWorking: [],
    details: {}
  };
  
  // Get all node types from the registry
  if (!window.NodeRegistry || !NodeRegistry.nodeTypes) {
    return { error: "NodeRegistry not available" };
  }
  
  // Check each node type
  Object.entries(NodeRegistry.nodeTypes).forEach(([type, config]) => {
    const status = { type, status: "Unknown" };
    
    // Check 1: Does the container exist?
    const containerId = config.interactionContainer;
    const containerExists = containerId && document.getElementById(containerId);
    status.containerExists = !!containerExists;
    
    // Check 2: Does the handler function exist?
    let handlerName;
    if (type.includes('_')) {
      // Handle types with underscores (like patient_case -> PatientCase)
      handlerName = 'show' + type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    } else {
      // Handle simple types
      handlerName = 'show' + type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    // Also check for alternate handler (like showRestNode)
    const altHandlerName = handlerName + 'Node';
    
    const hasHandler = (
      window.NodeInteraction && 
      (typeof NodeInteraction[handlerName] === 'function' || 
       typeof NodeInteraction[altHandlerName] === 'function')
    );
    
    status.handlerExists = hasHandler;
    status.handlerName = hasHandler ? 
      (typeof NodeInteraction[handlerName] === 'function' ? handlerName : altHandlerName) : 
      "missing";
    
    // Determine overall status
    if (type === 'start') {
      // Start node doesn't need a handler or container
      status.status = "OK (no handler needed)";
      results.working.push(type);
    } else if (containerExists && hasHandler) {
      status.status = "✅ Working";
      results.working.push(type);
    } else {
      status.status = "❌ Not Working";
      if (!containerExists) status.status += " (container missing)";
      if (!hasHandler) status.status += " (handler missing)";
      results.notWorking.push(type);
    }
    
    results.details[type] = status;
  });
  
  return results;
},

// Helper to find what nodes connect to a given node
_findConnectionsToNode: function(nodeId) {
  if (!GameState || !GameState.getAllNodes) {
    return [];
  }
  
  try {
    const allNodes = GameState.getAllNodes();
    const connections = [];
    
    allNodes.forEach(node => {
      if (node && node.paths && Array.isArray(node.paths) && node.paths.includes(nodeId)) {
        connections.push(node.id);
      }
    });
    
    return connections;
  } catch (error) {
    console.error("Error finding connections:", error);
    return [];
  }
},

// Helper to copy text to clipboard - using modern methods when available
_copyToClipboard: function(text) {
  try {
    // Try the modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          UiUtils.showToast("Debug summary copied to clipboard!", "success");
        })
        .catch(err => {
          console.error("Could not copy text with Clipboard API:", err);
          this._fallbackCopyToClipboard(text);
        });
    } else {
      this._fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    UiUtils.showToast("Failed to copy to clipboard", "danger");
  }
},

// Fallback copy method using document.execCommand
_fallbackCopyToClipboard: function(text) {
  try {
    // Create a temporary element
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    
    // Select and copy
    el.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(el);
    
    // Notify user
    if (successful) {
      UiUtils.showToast("Debug summary copied to clipboard!", "success");
    } else {
      UiUtils.showToast("Could not copy to clipboard", "warning");
    }
  } catch (error) {
    console.error("Error in fallback copy:", error);
    UiUtils.showToast("Failed to copy to clipboard", "danger");
  }
},

  // Helper to find what nodes connect to a given node
  _findConnectionsToNode: function(nodeId) {
    const allNodes = GameState.getAllNodes();
    const connections = [];
    
    allNodes.forEach(node => {
      if (node.paths && node.paths.includes(nodeId)) {
        connections.push(node.id);
      }
    });
    
    return connections;
  },

  // Helper to copy text to clipboard
  _copyToClipboard: function(text) {
    // Create a temporary element
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    
    // Select and copy
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    // Notify user
    UiUtils.showToast("Debug summary copied to clipboard!", "success");
  },
  // Add this function to DebugTools in static/js/engine/debug_tools.js
  checkNodeTypeStatus: function() {
    const results = {
      working: [],
      notWorking: [],
      details: {}
    };
    
    // Get all node types from the registry
    if (!window.NodeRegistry || !NodeRegistry.nodeTypes) {
      return { error: "NodeRegistry not available" };
    }
    
    // Check each node type
    Object.entries(NodeRegistry.nodeTypes).forEach(([type, config]) => {
      const status = { type, status: "Unknown" };
      
      // Check 1: Does the container exist?
      const containerId = config.interactionContainer;
      const containerExists = containerId && document.getElementById(containerId);
      status.containerExists = !!containerExists;
      
      // Check 2: Does the handler function exist?
      let handlerName;
      if (type.includes('_')) {
        // Handle types with underscores (like patient_case -> PatientCase)
        handlerName = 'show' + type.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
      } else {
        // Handle simple types
        handlerName = 'show' + type.charAt(0).toUpperCase() + type.slice(1);
      }
      
      // Also check for alternate handler (like showRestNode)
      const altHandlerName = handlerName + 'Node';
      
      const hasHandler = (
        window.NodeInteraction && 
        (typeof NodeInteraction[handlerName] === 'function' || 
        typeof NodeInteraction[altHandlerName] === 'function')
      );
      
      status.handlerExists = hasHandler;
      status.handlerName = hasHandler ? 
        (typeof NodeInteraction[handlerName] === 'function' ? handlerName : altHandlerName) : 
        "missing";
      
      // Determine overall status
      if (type === 'start') {
        // Start node doesn't need a handler or container
        status.status = "OK (no handler needed)";
        results.working.push(type);
      } else if (containerExists && hasHandler) {
        status.status = "✅ Working";
        results.working.push(type);
      } else {
        status.status = "❌ Not Working";
        if (!containerExists) status.status += " (container missing)";
        if (!hasHandler) status.status += " (handler missing)";
        results.notWorking.push(type);
      }
      
      results.details[type] = status;
    });
    
    return results;
  },
  // Add this to DebugTools object
  inspectNode: function(nodeId) {
    if (!window.GameState || !GameState.getNodeById) {
      console.error("GameState not available");
      return null;
    }
    
    const node = GameState.getNodeById(nodeId);
    if (!node) {
      console.error(`Node ${nodeId} not found`);
      return null;
    }
    
    console.group(`Node ${nodeId} Inspection`);
    console.log("Node data:", node);
    
    // Check node type handler
    const nodeType = node.type;
    let handlerName;
    if (nodeType.includes('_')) {
      handlerName = 'show' + nodeType.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    } else {
      handlerName = 'show' + nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
    }
    
    const altHandlerName = handlerName + 'Node';
    
    console.log(`Handler function: ${handlerName} or ${altHandlerName}`);
    console.log(`Handler exists: ${
      window.NodeInteraction && 
      (typeof NodeInteraction[handlerName] === 'function' || 
      typeof NodeInteraction[altHandlerName] === 'function')
    }`);
    
    // Check container
    const containerType = NodeRegistry.getNodeType(nodeType).interactionContainer;
    console.log(`Container: ${containerType}`);
    console.log(`Container exists: ${!!document.getElementById(containerType)}`);
    
    console.groupEnd();
    
    return node;
  }
  };
  
  // Export globally
  window.DebugTools = DebugTools;