// map_renderer.js - Map visualization component

// MapRenderer singleton - handles rendering the game map
const MapRenderer = {
  // Configuration for map rendering
  config: {
    nodesPerRow: 3,    // Number of nodes horizontally
    rowCount: 5,       // Number of rows (excluding start/boss)
    minWidth: 800,     // Minimum canvas width
    minHeight: 600     // Minimum canvas height
  },
  
  // Node appearance based on type
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
  
  // Initialize with canvas ID
  initialize: function(canvasId) {
    console.log(`Initializing map renderer with canvas: ${canvasId}`);
    this.canvasId = canvasId;
    
    // Set up as GameState observer
    GameState.addObserver(this);
    
    // Set up click handler
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      // Remove previous handlers if they exist
      if (this._clickHandler) {
        canvas.removeEventListener('click', this._clickHandler);
      }
      
      // Set up bound click handler
      this._clickHandler = this.handleMapClick.bind(this);
      canvas.addEventListener('click', this._clickHandler);
    }
    
    return this;
  },
  
  // Handle state changes from GameState
  onStateChanged: function(event, data) {
    // Respond to relevant state changes
    switch (event) {
      case 'stateInitialized':
      case 'nodeCompleted':
      case 'currentNodeChanged':
      case 'floorChanged':
        // Render the map
        this.renderMap();
        break;
    }
  },
  
  // Log node positions for debugging
  logNodePositions: function() {
    console.group("Node Positions");
    const allNodes = GameState.getAllNodes();
    
    allNodes.forEach(node => {
      // Calculate where the node should appear
      const rowSpacing = 80; // Fixed pixels between rows
      const colSpacing = 120; // Fixed pixels between columns
      
      const y = 100 + (node.position.row * rowSpacing); 
      const x = 100 + (node.position.col * colSpacing);
      
      console.log(`Node ${node.id} (${node.type}): position (${node.position.col},${node.position.row}) → canvas (${x},${y})`);
    });
    
    console.groupEnd();
  },

  // Render map with simplified approach
  renderMap: function() {
    console.log("Rendering map with simplified drawing...");
    
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      console.error(`Canvas element not found: ${this.canvasId}`);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }
    
    // Make sure canvas is visible with a border
    canvas.style.border = "2px solid #333";
    
    // Use fixed size for consistency
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    
    // Clear to white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw a simple grid for reference
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let y = 0; y <= 600; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x <= 800; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    
    // Log node positions
    this.logNodePositions();
    
    // Draw connections first
    this.drawConnections(ctx, 800, 600);
    
    // Draw all nodes
    const allNodes = GameState.getAllNodes();
    allNodes.forEach(node => {
      this.drawNode(ctx, node, 800, 600);
    });
  },
  
  drawConnections: function(ctx, width, height) {
    const allNodes = GameState.getAllNodes();
    
    // Draw connections
    allNodes.forEach(node => {
      if (!node.paths || node.paths.length === 0) return;
      
      // Calculate source position
      const sourceRow = node.position.row;
      const sourceCol = node.position.col;
      const startX = 100 + (sourceCol * 120);
      const startY = 100 + (sourceRow * 80);
      
      // Draw paths to each connected node
      node.paths.forEach(targetId => {
        const targetNode = GameState.getNodeById(targetId);
        if (!targetNode) return;
        
        // Calculate target position
        const targetRow = targetNode.position.row;
        const targetCol = targetNode.position.col;
        const endX = 100 + (targetCol * 120);
        const endY = 100 + (targetRow * 80);
        
        // CLEAR VISUAL INDICATION OF VALID PATHS
        if (node.visited || node.id === 'start') {
          if (targetNode.state === NODE_STATE.AVAILABLE) {
            // VALID PASSABLE PATH - BRIGHT GREEN
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 3;
          } else if (targetNode.state === NODE_STATE.COMPLETED) {
            // ALREADY TAKEN PATH - GRAY
            ctx.strokeStyle = '#AAAAAA';
            ctx.lineWidth = 2;
          } else if (targetNode.state === NODE_STATE.CURRENT) {
            // PATH TO CURRENT NODE - BRIGHT BLUE
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
          } else {
            // INACCESSIBLE PATH - VERY FAINT
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
          }
        } else {
          // All other paths - extremely faint
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.lineWidth = 1;
        }
        
        // Draw the connection
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      });
    });
  },
  
  // Draw a single node with fixed positioning
  drawNode: function(ctx, node, width, height) {
    // Use fixed spacing for reliable positioning
    const rowSpacing = 80; // Pixels between rows
    const colSpacing = 120; // Pixels between columns
    
    // Simple position calculation - start at (100,100) and space nodes evenly
    const x = 100 + (node.position.col * colSpacing);
    const y = 100 + (node.position.row * rowSpacing);
    
    const radius = 25; // Node radius
    
    // Save context for node styling
    ctx.save();
    
    // Draw a simple, highly visible node
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Use bright colors based on node state
    if (node.state === NODE_STATE.CURRENT) {
      ctx.fillStyle = '#FF0000'; // Red for current
    } else if (node.state === NODE_STATE.COMPLETED) {
      ctx.fillStyle = '#00FF00'; // Green for completed
    } else if (node.state === NODE_STATE.AVAILABLE) {
      ctx.fillStyle = '#0000FF'; // Blue for available
    } else {
      ctx.fillStyle = '#999999'; // Gray for locked
    }
    
    // Fill and stroke
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw node symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const symbol = this.nodeSymbols[node.type] || '?';
    ctx.fillText(symbol, x, y - 5);
    
    // Draw node ID below
    ctx.font = '12px Arial';
    ctx.fillText(node.id, x, y + 12);
    
    ctx.restore();
  },
  
  // Handle map clicks
  handleMapClick: function(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    
    // Get click coordinates relative to canvas
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Log click coordinates for debugging
    console.log("Click coordinates:", {
      clientX: event.clientX,
      clientY: event.clientY,
      canvasX: clickX,
      canvasY: clickY,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
    });
    
    // Check if click is on any node
    const allNodes = GameState.getAllNodes();
    
    for (const node of allNodes) {
      // Skip start node (can't be clicked)
      if (node.id === 'start') continue;
      
      // Skip nodes that are already visited
      if (node.visited) continue;
      
      // Calculate node position
      const rowSpacing = 80;
      const colSpacing = 120;
      const x = 100 + (node.position.col * colSpacing);
      const y = 100 + (node.position.row * rowSpacing);
      
      // Check distance from click to node center
      const dx = clickX - x;
      const dy = clickY - y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      const nodeRadius = 25;
      
      // Check if click is within node radius
      if (distance <= nodeRadius) {
        console.log("Clicked on node:", node.id, "- state:", node.state);
        
        // If node can be visited, process it
        if (ProgressionManager.canVisitNode(node.id)) {
          // Visual feedback for click
          this.showClickFeedback(x, y);
          
          // Notify that node was selected
          EventSystem.emit(GAME_EVENTS.NODE_SELECTED, node.id);
          
          break;
        }
        else {
          // Show feedback that node can't be visited
          UiUtils.showToast("Can't visit that node right now", "warning");
        }
      }
    }
  },
  
  // Show visual feedback for node click
  showClickFeedback: function(x, y) {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Draw a quick pulse effect
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  }
};

// Export the MapRenderer
window.MapRenderer = MapRenderer;