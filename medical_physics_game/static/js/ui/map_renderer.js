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
    
    renderMap: function() {
      console.log("Rendering map...");
      
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
      
      // ADDED: More detailed logging
      console.log("Canvas dimensions before adjustment:", {
        width: canvas.width,
        height: canvas.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight,
        style: {
          width: canvas.style.width,
          height: canvas.style.height
        }
      });
      
      // CRITICAL FIX: Handle high-DPI displays properly
      const dpr = window.devicePixelRatio || 1;
      
      // Get container dimensions
      const container = canvas.parentElement;
      const containerWidth = container ? container.clientWidth : 800;
      const containerHeight = container ? container.clientHeight : 600;
      
      // Set canvas logical size to match container
      const width = Math.max(this.config.minWidth, containerWidth);
      const height = Math.max(this.config.minHeight, containerHeight);
      
      // Set canvas backing store size (actual pixels)
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      // Set display size (CSS pixels)
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Scale all drawing operations by dpr
      ctx.scale(dpr, dpr);
      
      // ADDED: Log after adjustment
      console.log("Canvas dimensions after adjustment:", {
        width: canvas.width,
        height: canvas.height,
        style: {
          width: canvas.style.width,
          height: canvas.style.height
        },
        dpr: dpr
      });
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Rest of your rendering code...
    },
    
    // Draw all connections between nodes
    drawConnections: function(ctx, width, height) {
      const mapData = GameState.data.map;
      if (!mapData) return;
      
      // Get all nodes
      const allNodes = GameState.getAllNodes();
      
      // For each node, draw paths to connected nodes
      allNodes.forEach(node => {
        if (!node.paths || node.paths.length === 0) return;
        
        // Calculate source position
        const startY = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
        const startX = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
        
        // Draw paths to each connected node
        node.paths.forEach(targetId => {
          const targetNode = GameState.getNodeById(targetId);
          if (!targetNode) return;
          
          // Calculate target position
          const endY = height - height * ((targetNode.position.row + 0.5) / (this.config.rowCount + 2));
          const endX = width * ((targetNode.position.col + 1) / (this.config.nodesPerRow + 1));
          
          // Determine connection state based on node states
          let connectionState = "locked";
          
          // Get node states
          const sourceState = node.state || (node.visited ? NODE_STATE.COMPLETED : 
                                            node.current ? NODE_STATE.CURRENT : 
                                            NODE_STATE.LOCKED);
          const targetState = targetNode.state || (targetNode.visited ? NODE_STATE.COMPLETED : 
                                                  targetNode.current ? NODE_STATE.CURRENT : 
                                                  NODE_STATE.LOCKED);
          
          // Current node's connections
          if (sourceState === NODE_STATE.CURRENT || targetState === NODE_STATE.CURRENT) {
            connectionState = "current";
          }
          // Both nodes completed
          else if (sourceState === NODE_STATE.COMPLETED && targetState === NODE_STATE.COMPLETED) {
            connectionState = "completed";
          }
          // Source completed and target available
          else if (sourceState === NODE_STATE.COMPLETED && targetState === NODE_STATE.AVAILABLE) {
            connectionState = "available";
          }
          // Start node connections
          else if (node.id === 'start' && targetState === NODE_STATE.AVAILABLE) {
            connectionState = "available";
          }
          
          // Draw the connection
          this.drawConnection(ctx, startX, startY, endX, endY, connectionState);
        });
      });
    },
    
    // Draw a single connection with appropriate styling
    drawConnection: function(ctx, startX, startY, endX, endY, state) {
      ctx.save();
      
      // Connection styles based on state
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
      
      // Calculate path length for segment calculation
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create slightly jagged line for pixelated effect
      const segments = Math.max(10, Math.floor(distance / 15));
      const maxOffset = 1.5; // Maximum pixel offset
      
      ctx.beginPath();
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
    
    // Draw all nodes
    drawNodes: function(ctx, width, height) {
      const allNodes = GameState.getAllNodes();
      
      // Draw regular nodes and boss
      allNodes.forEach(node => {
        if (node.id !== 'start') {
          this.drawNode(ctx, node, width, height);
        }
      });
      
      // Draw start node last (so it's on top)
      const startNode = GameState.getNodeById('start');
      if (startNode) {
        this.drawNode(ctx, startNode, width, height);
      }
    },
    
    // Draw a single node
    drawNode: function(ctx, node, width, height) {
      // Calculate node position
      const y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
      const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
      const radius = 20; // Node radius
      
      // Get node state
      const nodeState = node.state || 
                       (node.visited ? NODE_STATE.COMPLETED : 
                        node.current ? NODE_STATE.CURRENT : 
                        ProgressionManager.canVisitNode(node.id) ? NODE_STATE.AVAILABLE : 
                        NODE_STATE.LOCKED);
      
      // Save context for node styling
      ctx.save();
      
      // Add glow effect for current and available nodes
      if (nodeState === NODE_STATE.CURRENT) {
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
      } else if (nodeState === NODE_STATE.AVAILABLE) {
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
      
      // Style based on node state
      if (nodeState === NODE_STATE.CURRENT) {
        // Current node - bright
        const lighterColor = '#ffffff'; 
        const baseColor = this.nodeColors[node.type] || '#5b8dd9';
        
        innerGradient.addColorStop(0, lighterColor);
        innerGradient.addColorStop(1, baseColor);
        
        ctx.fillStyle = innerGradient;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
      } 
      else if (nodeState === NODE_STATE.COMPLETED) {
        // Completed node - gray gradient
        innerGradient.addColorStop(0, 'rgba(120, 120, 130, 0.9)');
        innerGradient.addColorStop(1, 'rgba(90, 90, 100, 0.7)');
        ctx.fillStyle = innerGradient;
      } 
      else if (nodeState === NODE_STATE.AVAILABLE) {
        // Available node - vibrant color
        const nodeColor = this.nodeColors[node.type] || '#5b8dd9';
        const lighterColor = this.lightenColor(nodeColor, 20);
        
        innerGradient.addColorStop(0, lighterColor);
        innerGradient.addColorStop(1, nodeColor);
        
        ctx.fillStyle = innerGradient;
      } 
      else {
        // Locked node - dimmed
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
      ctx.lineWidth = nodeState === NODE_STATE.CURRENT ? 3 : 2;
      
      if (nodeState === NODE_STATE.CURRENT) {
        // Current node - white border with glow
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 3;
      } 
      else if (nodeState === NODE_STATE.COMPLETED) {
        // Completed node - subtle gray border
        ctx.strokeStyle = 'rgba(150, 150, 160, 0.6)';
      } 
      else if (nodeState === NODE_STATE.AVAILABLE) {
        // Available node - white border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      } 
      else {
        // Locked node - subtle border
        ctx.strokeStyle = 'rgba(100, 100, 110, 0.3)';
        ctx.lineWidth = 1;
      }
      
      ctx.stroke();
      
      // Draw node symbol
      if (nodeState !== NODE_STATE.LOCKED) {
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
      if (nodeState === NODE_STATE.CURRENT) {
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
        
        if (nodeState === NODE_STATE.AVAILABLE || nodeState === NODE_STATE.COMPLETED) {
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
    
    // Replace the handleMapClick method in MapRenderer with this fixed version

    handleMapClick: function(event) {
      const canvas = event.target;
      const rect = canvas.getBoundingClientRect();
      
      // CRITICAL FIX: Account for CSS scaling vs actual canvas size
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      // Calculate click position in actual canvas coordinates
      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;
      
      // ADDED: Log click coordinates for debugging
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
        },
        canvasSize: {
          width: canvas.width,
          height: canvas.height
        }
      });
      
      // Get map data
      const mapData = GameState.data.map;
      if (!mapData) return;
      
      // Calculate canvas size
      const width = canvas.width;
      const height = canvas.height;
      
      // Track if we found a clickable node
      let foundClickableNode = false;
      let clickedNode = null;
      
      // Check if click is on any node
      const allNodes = GameState.getAllNodes();
      for (const node of allNodes) {
        // Skip start node (can't be clicked)
        if (node.id === 'start') continue;
        
        // Skip nodes that are already visited
        if (node.visited) continue;
        
        // Calculate node position
        const y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
        const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
        
        // Check distance from click to node center
        const dx = clickX - x;
        const dy = clickY - y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const nodeRadius = 20 * dpr;
        
        // Check if click is within node radius
        if (distance <= nodeRadius) {
          clickedNode = node;
          console.log("Clicked on node:", node.id, "- state:", node.state);
          
          // If node can be visited, process it
          if (ProgressionManager.canVisitNode(node.id)) {
            foundClickableNode = true;
            
            // Visual feedback for click
            this.showClickFeedback(x / dpr, y / dpr);
            
            // Notify that node was selected
            EventSystem.emit(GAME_EVENTS.NODE_SELECTED, node.id);
            
            break;
          }
          else {
            // Show feedback that node can't be visited
            UiUtils.showFloatingText("Can't visit this node yet", "warning");
          }
        }
      }
      
      // If a node was clicked but couldn't be visited, explain why
      if (clickedNode && !foundClickableNode) {
        // Determine reason
        let reason = "";
        
        if (clickedNode.state === NODE_STATE.LOCKED) {
          reason = "This node is locked. Complete earlier nodes first.";
        } else if (GameState.data.currentNode) {
          reason = "Already visiting another node.";
        } else {
          reason = "No path available to this node.";
        }
        
        UiUtils.showFloatingText(reason, "warning");
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
    }
  };
  
  // Export the MapRenderer
  window.MapRenderer = MapRenderer;