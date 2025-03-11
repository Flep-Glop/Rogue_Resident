// map-renderer.js - Map rendering and node display
// Define proper node states
const NODE_STATE = {
  LOCKED: 'locked',     // Cannot be visited yet (previous row not completed)
  AVAILABLE: 'available', // Can be visited now
  CURRENT: 'current',   // Currently being visited
  COMPLETED: 'completed' // Already visited and completed
};

window.MapRenderer = {
  // Map configuration
  config: {
    nodesPerRow: 3,    // Number of nodes horizontally
    rowCount: 5,       // Number of rows (excluding start/boss)
    branchFactor: 2,   // How many paths forward each node can have
    minWidth: 800,     // Minimum canvas width
    minHeight: 600     // Minimum canvas height
  },
  
  // Node colors with softer palette
  nodeColors: {
    'start': '#56b886',    // Green (secondary)
    'boss': '#e67e73',     // Red (danger)
    'question': '#5b8dd9', // Blue (primary)
    'elite': '#d35db3',    // Pink (softer)
    'treasure': '#f0c866', // Yellow (warning)
    'rest': '#9c77db',     // Purple (softer)
    'shop': '#5bbcd9',     // Cyan (softer)
    'event': '#e99c50',    // Orange (softer)
    'gamble': '#b8d458'    // Lime (softer)
  },
  
  // Node symbols
  nodeSymbols: {
    'start': 'S',
    'boss': 'B',
    'question': '?',
    'elite': '!',
    'treasure': 'T',
    'rest': 'R',
    'shop': '$',
    'event': 'E',
    'gamble': 'G'
  },
  
  // Initialize the floor map
  initializeFloorMap: function() {
    console.log("Initializing floor map...");
    
    // First try to load from backend
    fetch('/api/generate-floor-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        floor_number: gameState.currentFloor || 1
      }),
    })
    .then(response => response.json())
    .then(mapData => {
      console.log("Map data received from server:", mapData);
      gameState.map = mapData;
      this.renderFloorMap(mapData, 'floor-map');
    })
    .catch(error => {
      console.error('Error getting map from server:', error);
      UiUtils.showToast("Error loading floor map", "danger");
    });
  },
  
  // Main function to render the floor map
  renderFloorMap: function(mapData, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error("Canvas element not found:", canvasId);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Fix for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions based on map size
    const width = Math.max(this.config.minWidth, this.config.nodesPerRow * 150);
    const height = Math.max(this.config.minHeight, (this.config.rowCount + 2) * 100);
    
    // Set the canvas size with DPI adjustment
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale context for high-DPI displays
    ctx.scale(dpr, dpr);
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Update node states before rendering
    this.updateNodeStates(mapData);
    
    // Draw connections first (so they appear behind nodes)
    this.drawConnections(ctx, mapData, width, height);
    
    // Draw all nodes
    this.drawAllNodes(ctx, mapData, width, height);
    
    // Re-bind the event handler to maintain context
    // Remove previous click handler to avoid duplicates
    if (this._currentClickHandler) {
      canvas.removeEventListener('click', this._currentClickHandler);
    }

    // Create a bound handler and store it
    this._currentClickHandler = this.handleMapClick.bind(this);

    // Add the new event listener
    canvas.addEventListener('click', this._currentClickHandler);
  },
  
  // Draw all nodes on the map
  drawAllNodes: function(ctx, mapData, width, height) {
    // Draw regular nodes
    if (mapData.nodes) {
      for (const nodeId in mapData.nodes) {
        this.drawNode(ctx, mapData.nodes[nodeId], width, height, true);
      }
    }
    
    // Draw start and boss nodes
    if (mapData.start) {
      this.drawNode(ctx, mapData.start, width, height, true);
    }
    
    if (mapData.boss) {
      this.drawNode(ctx, mapData.boss, width, height, true);
    }
  },
  
  // Draw connections with states based on rows
  drawConnections: function(ctx, mapData, width, height) {
    if (!mapData) return;
    
    // First update all node states
    this.updateNodeStates(mapData);
    
    // Get all nodes
    const allNodes = this.getAllNodes(mapData);
    
    // For each node, draw paths to connected nodes
    for (const sourceNode of allNodes) {
      if (!sourceNode.paths || sourceNode.paths.length === 0) continue;
      
      // Calculate source position
      const startY = height - height * ((sourceNode.position.row + 0.5) / (this.config.rowCount + 2));
      const startX = width * ((sourceNode.position.col + 1) / (this.config.nodesPerRow + 1));
      
      // Draw paths to each connected node
      for (const targetId of sourceNode.paths) {
        const targetNode = this.getNodeById(mapData, targetId);
        if (!targetNode) continue;
        
        // Calculate target position
        const endY = height - height * ((targetNode.position.row + 0.5) / (this.config.rowCount + 2));
        const endX = width * ((targetNode.position.col + 1) / (this.config.nodesPerRow + 1));
        
        // Determine connection state based on node states and row completion
        let connectionState = "locked";
        
        // Check if source is start node (special case)
        if (sourceNode.id === 'start') {
          if (targetNode.state === NODE_STATE.CURRENT) {
            connectionState = "current";
          } else if (targetNode.state === NODE_STATE.COMPLETED) {
            connectionState = "completed";
          } else if (targetNode.state === NODE_STATE.AVAILABLE) {
            connectionState = "available";
          }
        }
        // Current node's connections
        else if (sourceNode.state === NODE_STATE.CURRENT || targetNode.state === NODE_STATE.CURRENT) {
          connectionState = "current";
        }
        // Both nodes completed 
        else if (sourceNode.state === NODE_STATE.COMPLETED && targetNode.state === NODE_STATE.COMPLETED) {
          connectionState = "completed";
        }
        // Source completed and target available
        else if (sourceNode.state === NODE_STATE.COMPLETED && targetNode.state === NODE_STATE.AVAILABLE) {
          // Only if target node is in the next row (enforce forward progression)
          if (targetNode.position.row === sourceNode.position.row + 1) {
            connectionState = "available";
          }
        }
        
        // Draw the connection with appropriate styling
        this.drawConnection(ctx, startX, startY, endX, endY, connectionState);
      }
    }
  },
  
  // Draw a single connection with appropriate styling
  drawConnection: function(ctx, startX, startY, endX, endY, state) {
    ctx.save();
    
    // Set up styling based on connection state
    const styles = {
      "locked": {
        strokeStyle: 'rgba(100, 100, 110, 0.15)', 
        lineWidth: 1,
        globalAlpha: 0.5,
        shadowBlur: 0
      },
      "available": {
        strokeStyle: '#56b886', // Green
        lineWidth: 3,
        globalAlpha: 0.9,
        shadowColor: '#56b886',
        shadowBlur: 5,
        animate: true,
        pulseRate: 1.5
      },
      "current": {
        strokeStyle: '#f0c866', // Gold
        lineWidth: 4,
        globalAlpha: 0.9,
        shadowColor: '#f0c866',
        shadowBlur: 8,
        animate: true,
        pulseRate: 2
      },
      "completed": {
        strokeStyle: '#56b886', // Green (dimmer)
        lineWidth: 2,
        globalAlpha: 0.7,
        shadowBlur: 0
      }
    };
    
    // Get style for this connection state
    const style = styles[state] || styles.locked;
    
    // Apply styles
    ctx.strokeStyle = style.strokeStyle;
    ctx.lineWidth = style.lineWidth;
    ctx.globalAlpha = style.globalAlpha;
    
    if (style.shadowBlur > 0) {
      ctx.shadowColor = style.shadowColor;
      ctx.shadowBlur = style.shadowBlur;
    }
    
    // Apply animation if needed
    if (style.animate) {
      const time = Date.now() / 1000;
      const pulseEffect = Math.sin(time * style.pulseRate * Math.PI) * 0.2;
      ctx.globalAlpha = Math.max(0.5, Math.min(1.0, style.globalAlpha + pulseEffect));
    }
    
    // Draw a slightly pixelated line for the connection
    ctx.beginPath();
    
    // Calculate path length for segment calculation
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create slightly jagged line for pixelated effect
    const segments = Math.max(10, Math.floor(distance / 15));
    const maxOffset = 1.5; // Maximum pixel offset
    
    ctx.moveTo(startX, startY);
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = startX + dx * t;
      const y = startY + dy * t;
      
      // Small offset for pixelated effect
      const seed = (x * 100 + y) % 1000;
      const offsetX = (Math.sin(seed) * maxOffset * 0.5);
      const offsetY = (Math.cos(seed * 2) * maxOffset * 0.5);
      
      ctx.lineTo(x + offsetX, y + offsetY);
    }
    
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.restore();
  },
  
  // Draw a single node
  drawNode: function(ctx, node, width, height) {
    // Calculate node position
    const y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
    const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
    const radius = 20; // Node radius
    
    // Save context for node styling
    ctx.save();
    
    // Add glow effect for current and available nodes
    if (node.current) {
      // Current node - bright gold glow
      const glowSize = 15;
      const glowAlpha = 0.5 + Math.sin(Date.now() / 300) * 0.2; // Pulsing effect
      
      const gradient = ctx.createRadialGradient(
        x, y, radius - 5,
        x, y, radius + glowSize
      );
      gradient.addColorStop(0, `rgba(240, 200, 102, ${glowAlpha})`); // Gold glow
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius + glowSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.canVisitNode(gameState.map, node.id)) {
      // Available node - green glow
      const glowSize = 10;
      const glowAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.1; // Gentle pulsing
      
      const gradient = ctx.createRadialGradient(
        x, y, radius - 5,
        x, y, radius + glowSize
      );
      gradient.addColorStop(0, `rgba(86, 184, 134, ${glowAlpha})`); // Green glow
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius + glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw node circle with gradient
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Create inner gradient for more depth
    const innerGradient = ctx.createRadialGradient(
      x - radius/4, y - radius/4, 1,
      x, y, radius
    );
    
    // Style based on node status
    if (node.current) {
      // Current node - bright
      const lighterColor = '#ffffff'; 
      const baseColor = this.nodeColors[node.type] || '#5b8dd9';
      
      innerGradient.addColorStop(0, lighterColor);
      innerGradient.addColorStop(1, baseColor);
      
      ctx.fillStyle = innerGradient;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 10;
    } 
    else if (node.visited) {
      // Visited node - gray gradient
      innerGradient.addColorStop(0, 'rgba(120, 120, 130, 0.9)');
      innerGradient.addColorStop(1, 'rgba(90, 90, 100, 0.7)');
      ctx.fillStyle = innerGradient;
    } 
    else if (this.canVisitNode(gameState.map, node.id)) {
      // Available node - vibrant color
      const nodeColor = this.nodeColors[node.type] || '#5b8dd9';
      const lighterColor = this.lightenColor(nodeColor, 20);
      
      innerGradient.addColorStop(0, lighterColor);
      innerGradient.addColorStop(1, nodeColor);
      
      ctx.fillStyle = innerGradient;
    } 
    else {
      // Unavailable node - dimmed
      const baseColor = this.nodeColors[node.type] || '#5b8dd9';
      const dimColor = this.dimColor(baseColor, 0.3);
      const dimmerColor = this.dimColor(baseColor, 0.2);
      
      innerGradient.addColorStop(0, dimColor);
      innerGradient.addColorStop(1, dimmerColor);
      
      ctx.fillStyle = innerGradient;
    }
    
    // Fill the node
    ctx.fill();
    
    // Draw border
    ctx.lineWidth = node.current ? 3 : 2;
    
    if (node.current) {
      // Current node - white border with glow
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 3;
    } 
    else if (node.visited) {
      // Visited node - subtle gray border
      ctx.strokeStyle = 'rgba(150, 150, 160, 0.6)';
    } 
    else if (this.canVisitNode(gameState.map, node.id)) {
      // Available node - white border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    } 
    else {
      // Unavailable node - subtle border
      ctx.strokeStyle = 'rgba(100, 100, 110, 0.3)';
      ctx.lineWidth = 1;
    }
    
    ctx.stroke();
    
    // Draw node symbol
    if (node.current || node.visited || this.canVisitNode(gameState.map, node.id)) {
      ctx.fillStyle = '#fff'; // Bright white
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Faded
    }
    
    // Use pixelated font for the symbol
    ctx.font = 'bold 15px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const symbol = this.nodeSymbols[node.type] || '?';
    
    // Draw text with bounce effect for current node
    if (node.current) {
      const bounceOffset = Math.sin(Date.now() / 300) * 2;
      ctx.fillText(symbol, x, y + bounceOffset);
    } else {
      ctx.fillText(symbol, x, y);
    }
    
    // Add node ID in small text for debugging (can be removed in production)
    ctx.font = '8px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(node.id, x, y + radius + 10);
    
    // Add difficulty indicator for question and elite nodes
    if ((node.type === 'question' || node.type === 'elite') && node.difficulty) {
      const starsY = y + radius + 20;
      
      if (this.canVisitNode(gameState.map, node.id) || node.visited) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      }
      
      ctx.font = '8px "Press Start 2P", monospace';
      const stars = '★'.repeat(node.difficulty);
      ctx.fillText(stars, x, starsY);
    }
    
    ctx.restore();
  },
  
  // Handle map click event
  handleMapClick: function(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position (adjusted for DPI)
    const clickX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    // Get map data
    const mapData = gameState.map;
    if (!mapData) return;
    
    // Get all nodes
    const allNodes = this.getAllNodes(mapData);
    
    // Calculate canvas size
    const width = canvas.width;
    const height = canvas.height;
    
    // Check if click is on any node
    for (const node of allNodes) {
      // Skip start node (can't be clicked)
      if (node.id === 'start') continue;
      
      // Skip visited nodes
      if (node.visited) continue;
      
      // Calculate node position
      const y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
      const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
      
      // Check distance from click to node center
      const dx = clickX - x;
      const dy = clickY - y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      // Check if click is within node radius and node can be visited
      if (distance <= 20 && this.canVisitNode(mapData, node.id)) {
        console.log("Clicked on node:", node.id);
        
        // Visual feedback for click
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // Visit the node after a short delay
        setTimeout(() => {
          Nodes.visitNode(node.id);
        }, 100);
        
        break;
      }
    }
  },
  
  // Core function to check if a node can be visited
  canVisitNode: function(mapData, nodeId) {
    // Can't visit the start node
    if (nodeId === 'start') return false;
    
    // Can't visit if there's already a current node
    if (gameState.currentNode) return false;
    
    // Get the node
    const node = this.getNodeById(mapData, nodeId);
    if (!node) return false;
    
    // Already visited nodes cannot be visited again
    if (node.visited) return false;
    
    // Get node's row
    const nodeRow = node.position.row;
    
    // Row 1 nodes are always available if start exists
    if (nodeRow === 1 && mapData.start) {
      const startNode = mapData.start;
      return startNode.paths && startNode.paths.includes(nodeId);
    }
    
    // For rows > 1, check if previous row is FULLY completed
    const previousRowIsComplete = this.isRowCompleted(mapData, nodeRow - 1);
    if (!previousRowIsComplete) return false;
    
    // Check if there's a direct path from a completed node in the previous row
    const connectedNodes = this.getConnectedNodes(mapData, nodeId);
    return connectedNodes.some(prevNode => 
      prevNode.position.row === nodeRow - 1 && 
      (prevNode.visited || prevNode.id === 'start')
    );
  },
  // Check if an entire row is completed
  isRowCompleted: function(mapData, rowNumber) {
    // Get all nodes in the row
    const nodesInRow = this.getAllNodes(mapData).filter(node => 
      node.position && node.position.row === rowNumber
    );
    
    // If no nodes found in this row, consider it complete (empty row)
    if (nodesInRow.length === 0) return true;
    
    // Check if all nodes in the row are visited
    return nodesInRow.every(node => node.visited);
  },
  // Get all nodes that have paths leading to this node
  getConnectedNodes: function(mapData, targetNodeId) {
    const connectedNodes = [];
    
    if (!mapData) return connectedNodes;
    
    // Check start node
    if (mapData.start && mapData.start.paths && 
        mapData.start.paths.includes(targetNodeId)) {
      connectedNodes.push(mapData.start);
    }
    
    // Check regular nodes
    if (mapData.nodes) {
      Object.values(mapData.nodes).forEach(node => {
        if (node.paths && node.paths.includes(targetNodeId)) {
          connectedNodes.push(node);
        }
      });
    }
    
    return connectedNodes;
  },
  
  // Get a node by ID
  getNodeById: function(mapData, nodeId) {
    if (!mapData) return null;
    
    if (nodeId === 'start' && mapData.start) return mapData.start;
    if (nodeId === 'boss' && mapData.boss) return mapData.boss;
    
    return mapData.nodes && mapData.nodes[nodeId] ? mapData.nodes[nodeId] : null;
  },
  
  // Update all node states in the map
  updateNodeStates: function(mapData) {
    if (!mapData) return;
    
    // Process all nodes
    const allNodes = this.getAllNodes(mapData);
    
    for (const node of allNodes) {
      // Skip start node
      if (node.id === 'start') continue;
      
      // Set current node
      if (node.id === gameState.currentNode) {
        node.state = NODE_STATE.CURRENT;
        continue;
      }
      
      // Set completed nodes
      if (node.visited) {
        node.state = NODE_STATE.COMPLETED;
        continue;
      }
      
      // Check if the node is available or locked
      node.state = this.canVisitNode(mapData, node.id) ? 
        NODE_STATE.AVAILABLE : NODE_STATE.LOCKED;
    }
    
    // Check if all nodes are completed (for next floor button)
    const allNodesCompleted = allNodes.every(node => 
      node.id === 'start' || node.visited
    );
    
    if (allNodesCompleted && !gameState.currentNode) {
      const nextFloorBtn = document.getElementById('next-floor-btn');
      if (nextFloorBtn) nextFloorBtn.style.display = 'block';
    }
  },
  
  // Get all nodes in the map
  getAllNodes: function(mapData) {
    if (!mapData) return [];
    
    const allNodes = [];
    
    if (mapData.start) allNodes.push(mapData.start);
    if (mapData.boss) allNodes.push(mapData.boss);
    
    if (mapData.nodes) {
      Object.values(mapData.nodes).forEach(node => {
        allNodes.push(node);
      });
    }
    
    return allNodes;
  },
  
  // Helper function to lighten a color
  lightenColor: function(hex, percent) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Lighten by percent
    r = Math.min(255, r + Math.floor(r * (percent / 100)));
    g = Math.min(255, g + Math.floor(g * (percent / 100)));
    b = Math.min(255, b + Math.floor(b * (percent / 100)));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },
  
  // Helper function to dim a color
  dimColor: function(hex, opacity = 0.5) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Dim by multiplying by opacity
    r = Math.floor(r * opacity);
    g = Math.floor(g * opacity);
    b = Math.floor(b * opacity);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },
  
  // Debug function to log node status
  debugNodeStatus: function() {
    if (!gameState.map) {
      console.log("No map data available for debugging");
      return;
    }
    
    console.group("Map Status Debug");
    console.log("Current Node:", gameState.currentNode);
    
    // Group nodes by row
    const nodesByRow = {};
    
    // Get all nodes
    const allNodes = this.getAllNodes(gameState.map);
    
    // Organize by row
    allNodes.forEach(node => {
      const row = node.position.row;
      if (!nodesByRow[row]) nodesByRow[row] = [];
      nodesByRow[row].push(node);
    });
    
    // Log each row
    const rows = Object.keys(nodesByRow).sort((a, b) => Number(a) - Number(b));
    rows.forEach(row => {
      console.group(`Row ${row} Nodes`);
      nodesByRow[row].forEach(node => {
        const statusFlags = [
          node.visited ? "VISITED" : "",
          node.current ? "CURRENT" : "",
          this.canVisitNode(gameState.map, node.id) ? "AVAILABLE" : ""
        ].filter(Boolean).join(", ");
        
        console.log(`Node ${node.id} (${node.type}): ${statusFlags}`);
        if (node.paths && node.paths.length > 0) {
          console.log(`  → Paths to: ${node.paths.join(", ")}`);
        }
      });
      console.groupEnd();
    });
    
    console.groupEnd();
  }
};