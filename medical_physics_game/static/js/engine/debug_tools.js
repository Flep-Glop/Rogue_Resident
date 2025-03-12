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

  // Generate a concise state summary for debugging
  generateStateSummary: function() {
    if (!GameState || !GameState.data) {
      return "GameState not available";
    }

    // Get all nodes for summary
    const allNodes = GameState.getAllNodes();
    
    // Current floor info
    const floorInfo = {
      currentFloor: GameState.data.currentFloor,
      currentNode: GameState.data.currentNode,
    };
    
    // Node stats - count by state, type, and row
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
    allNodes.forEach(node => {
      // Count by state
      if (node.state) {
        nodeStats.byState[node.state.toLowerCase()]++;
      }
      
      // Count by row
      if (node.position && node.position.row !== undefined) {
        if (!nodeStats.byRow[node.position.row]) {
          nodeStats.byRow[node.position.row] = {
            total: 0,
            completed: 0,
            available: 0,
            locked: 0
          };
        }
        
        nodeStats.byRow[node.position.row].total++;
        
        if (node.visited) {
          nodeStats.byRow[node.position.row].completed++;
        } else if (node.state === NODE_STATE.AVAILABLE) {
          nodeStats.byRow[node.position.row].available++;
        } else if (node.state === NODE_STATE.LOCKED) {
          nodeStats.byRow[node.position.row].locked++;
        }
      }
      
      // Collect all available nodes
      if (node.state === NODE_STATE.AVAILABLE) {
        availableNodes.push({
          id: node.id,
          row: node.position?.row,
          col: node.position?.col,
          connections: this._findConnectionsToNode(node.id)
        });
      }
    });
    
    // Create a pretty-printed summary
    const summary = {
      floorInfo,
      nodeStats,
      availableNodes,
      characterStats: {
        level: GameState.data.character?.level,
        lives: GameState.data.character?.lives,
        insight: GameState.data.character?.insight
      },
      inventory: GameState.data.inventory?.length || 0
    };
    
    // Create a text output
    let output = "===== GAME STATE SUMMARY =====\n\n";
    
    // Floor info
    output += `Floor: ${floorInfo.currentFloor}, Current Node: ${floorInfo.currentNode || 'None'}\n\n`;
    
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
    availableNodes.forEach(node => {
      output += `  ${node.id} (Row ${node.row}, Col ${node.col}): Connected from ${node.connections.join(', ') || 'none'}\n`;
    });
    output += "\n";
    
    // Character stats
    output += `Character: Level ${summary.characterStats.level}, Lives ${summary.characterStats.lives}, Insight ${summary.characterStats.insight}\n`;
    output += `Inventory: ${summary.inventory} items\n`;
    
    console.log(output);
    
    // Copy to clipboard
    this._copyToClipboard(output);
    
    return output;
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
  }
  };
  
  // Export globally
  window.DebugTools = DebugTools;