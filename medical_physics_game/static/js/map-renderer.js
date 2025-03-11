// map-renderer.js - Map rendering and node display

window.MapRenderer = {
  // Map configuration
  config: {
    nodesPerRow: 3,    // Number of nodes horizontally
    rowCount: 5,       // Number of rows (excluding start/boss)
    branchFactor: 2,   // How many paths forward each node can have
    minWidth: 800,     // Minimum canvas width
    minHeight: 600     // Minimum canvas height
  },
  
  // Updated node colors with softer palette
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
  
  // Updated node symbols
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
  
  // Function to initialize the floor map
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
      this.renderFloorMap(mapData, CONTAINER_TYPES.MAP);
    })
    .catch(error => {
      console.error('Error getting map from server, using client-side generation:', error);
      
      // Fall back to client-side generation
      const floorData = this.getFloorData(gameState.currentFloor || 1);
      const mapData = this.generateFloorMap(gameState.currentFloor || 1, floorData);
      gameState.map = mapData;
      this.renderFloorMap(mapData, CONTAINER_TYPES.MAP);
    });
  },
  
  // Get floor data (placeholder - ideally would come from server)
  getFloorData: function(floorNumber) {
    return {
      id: floorNumber,
      name: `Floor ${floorNumber}`,
      description: `Advancing to floor ${floorNumber}...`,
      node_count: {
        min: 4 + floorNumber,
        max: 6 + floorNumber
      },
      node_types: {
        question: { weight: 60, difficulty_range: [1, Math.min(floorNumber, 3)] },
        rest: { weight: 20 },
        treasure: { weight: 20 },
        elite: { weight: floorNumber > 1 ? 15 : 0, difficulty_range: [2, 3] }
      },
      boss: floorNumber >= 3 ? {
        name: "Chief Medical Physicist",
        description: "The department head has challenging questions about QA procedures.",
        difficulty: 3
      } : null
    };
  },
  
  // Generate the map data structure
  generateFloorMap: function(floorLevel, floorData) {
    console.log("Generating floor map for level", floorLevel);
    
    // Create basic structure
    const map = {
      start: { 
        id: 'start', 
        type: 'start', 
        position: { row: 0, col: Math.floor(this.config.nodesPerRow/2) }, 
        paths: [] 
      },
      nodes: {},
      boss: floorData.boss ? { 
        id: 'boss', 
        type: 'boss', 
        position: { row: this.config.rowCount + 1, col: Math.floor(this.config.nodesPerRow/2) }, 
        paths: [] 
      } : null
    };
    
    // Generate intermediate nodes in a grid pattern with random connections
    for (let row = 1; row <= this.config.rowCount; row++) {
      for (let col = 0; col < this.config.nodesPerRow; col++) {
        // Skip some nodes randomly to create variability
        if (Math.random() < 0.2 && row !== 1) continue;
        
        const nodeId = `node_${row}_${col}`;
        
        // Determine node type based on weights in floorData
        const nodeType = this.determineNodeType(floorData.node_types);
        
        // Create the node
        map.nodes[nodeId] = {
          id: nodeId,
          type: nodeType,
          position: { row, col },
          paths: [],
          visited: false,
          // For question nodes, track difficulty
          difficulty: nodeType === 'question' || nodeType === 'elite' ? 
            this.getRandomDifficulty(floorData.node_types[nodeType]?.difficulty_range) : 1,
          title: this.getNodeTitle(nodeType)
        };
      }
    }
    
    // Connect start node to first row
    const firstRowNodes = Object.values(map.nodes).filter(node => node.position.row === 1);
    firstRowNodes.forEach(node => {
      map.start.paths.push(node.id);
    });
    
    // Connect intermediate rows
    for (let row = 1; row < this.config.rowCount; row++) {
      const currentRowNodes = Object.values(map.nodes).filter(node => node.position.row === row);
      const nextRowNodes = Object.values(map.nodes).filter(node => node.position.row === row + 1);
      
      if (nextRowNodes.length === 0) continue;
      
      currentRowNodes.forEach(node => {
        // Each node connects to 1-2 nodes in the next row
        const connectionCount = Math.floor(Math.random() * this.config.branchFactor) + 1;
        
        // Sort next row nodes by proximity (column distance)
        const sortedNextNodes = [...nextRowNodes].sort((a, b) => {
          return Math.abs(a.position.col - node.position.col) - Math.abs(b.position.col - node.position.col);
        });
        
        // Connect to the closest nodes
        for (let i = 0; i < Math.min(connectionCount, sortedNextNodes.length); i++) {
          node.paths.push(sortedNextNodes[i].id);
        }
      });
    }
    
    // Connect final row to boss
    if (map.boss) {
      const finalRowNodes = Object.values(map.nodes).filter(node => node.position.row === this.config.rowCount);
      finalRowNodes.forEach(node => {
        node.paths.push('boss');
      });
    }
    
    return map;
  },
  
  // Helper functions for map generation
  determineNodeType: function(nodeTypes) {
    const totalWeight = Object.values(nodeTypes).reduce((sum, config) => sum + (config.weight || 0), 0);
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const [type, config] of Object.entries(nodeTypes)) {
      cumulativeWeight += (config.weight || 0);
      if (random <= cumulativeWeight) {
        return type;
      }
    }
    
    return 'question'; // Default fallback
  },
  
  getRandomDifficulty: function(range) {
    if (!range || range.length !== 2) return 1;
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  },
  
  getNodeTitle: function(nodeType) {
    const titles = {
      'question': ['Morning Rounds', 'Case Review', 'Patient Consult', 'Treatment Planning'],
      'shop': ['Department Store', 'Campus Bookstore', 'Equipment Vendor', 'Coffee Cart'],
      'rest': ['Break Room', 'Cafeteria', 'Library', 'Quiet Corner'],
      'treasure': ['Conference', 'Journal Club', 'Grand Rounds', 'Workshop'],
      'elite': ['Physicist Meeting', 'Challenging Case', 'Equipment Failure', 'Accreditation Review'],
      'event': ['Unexpected Call', 'Patient Emergency', 'Research Opportunity', 'Department Meeting'],
      'gamble': ['Journal Lottery', 'Research Roulette', 'Grant Application', 'Experimental Treatment'],
      'boss': ['Department Chair', 'Board Exam', 'Research Presentation', 'Clinical Trial Review']
    };
    
    return titles[nodeType] ? titles[nodeType][Math.floor(Math.random() * titles[nodeType].length)] : 'Unknown';
  },
  
  // Improved renderFloorMap function with better visuals
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
    
    // Draw connections first (so they appear behind nodes)
    this.drawConnections(ctx, mapData, width, height, true); // true for bottom-up
    
    // Draw all regular nodes
    for (const nodeId in mapData.nodes) {
        this.drawNode(ctx, mapData.nodes[nodeId], width, height, true); // true for bottom-up
    }
    
    // Draw start and boss nodes
    this.drawNode(ctx, mapData.start, width, height, true); // true for bottom-up
    if (mapData.boss) {
        this.drawNode(ctx, mapData.boss, width, height, true); // true for bottom-up
    }
    
    // Properly bind the event handler to maintain 'this' context
    const self = this;
    const handleMapClick = function(event) {
        const rect = canvas.getBoundingClientRect();
        
        // Calculate click coordinates, adjusting for any CSS scaling and DPI
        const clickX = (event.clientX - rect.left) * (canvas.width / rect.width / dpr);
        const clickY = (event.clientY - rect.top) * (canvas.height / rect.height / dpr);
        
        if (!gameState.map) return;
        
        // Check if click is on any node
        const allNodes = { ...gameState.map.nodes };
        if (gameState.map.start) allNodes['start'] = gameState.map.start;
        if (gameState.map.boss) allNodes['boss'] = gameState.map.boss;
        
        for (const nodeId in allNodes) {
            const node = allNodes[nodeId];
            
            // Skip start node (can't be clicked)
            if (nodeId === 'start') continue;
            
            // Skip already visited nodes
            if (node.visited) continue;
            
            // Calculate node position (adjust for bottom-up layout)
            let y = height - height * ((node.position.row + 0.5) / (self.config.rowCount + 2));
            const x = width * ((node.position.col + 1) / (self.config.nodesPerRow + 1));
            
            // Check if click is within node radius
            const dx = clickX - x;
            const dy = clickY - y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance <= 25 && self.canVisitNode(nodeId)) { // Slightly increased radius for better usability
                console.log("Clicked on node:", nodeId);
                
                // Add visual feedback for click
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fill();
                
                // After a short delay, visit the node
                setTimeout(() => {
                    Nodes.visitNode(nodeId);
                }, 100);
                
                break;
            }
        }
    };
    // Remove previous click handler to avoid duplicates
    if (this._currentClickHandler) {
      canvas.removeEventListener('click', this._currentClickHandler);
    }

    // Create bound handler that maintains the correct 'this' context
    this._currentClickHandler = handleMapClick.bind(this);

    // Add the new event listener
    canvas.addEventListener('click', this._currentClickHandler);
  },
  
  // Update the drawConnections function for better path rendering
  drawConnections: function(ctx, mapData, width, height, bottomUp = false) {
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    // Draw all connections
    for (const nodeId in allNodes) {
        const node = allNodes[nodeId];
        if (!node.paths || node.paths.length === 0) continue;
        
        // Calculate node position
        let startY;
        if (bottomUp) {
            startY = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
        } else {
            startY = height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
        }
        
        const startX = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
        
        node.paths.forEach(targetId => {
            const targetNode = allNodes[targetId];
            if (!targetNode) return;
            
            // Calculate target position
            let endY;
            if (bottomUp) {
                endY = height - height * ((targetNode.position.row + 0.5) / (this.config.rowCount + 2));
            } else {
                endY = height * ((targetNode.position.row + 0.5) / (this.config.rowCount + 2));
            }
            
            const endX = width * ((targetNode.position.col + 1) / (this.config.nodesPerRow + 1));
            
            // Save context for path styling
            ctx.save();
            
            // Create pixelated path effect
            // This creates a slightly jagged line for retro effect
            ctx.lineCap = 'round';
            
            // Calculate path length and angle
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Number of segments for pixelated effect
            const segments = Math.max(10, Math.floor(distance / 15));
            
            // Path offset variables for pixel effect
            const maxOffset = 1.5; // Maximum pixel offset
            
            // Style the path based on status
            if (node.visited && targetNode.visited) {
                // Path has been used - soft green with pixelated effect
                ctx.strokeStyle = '#56b886'; // Secondary color - green
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.8;
            } else if ((node.visited || nodeId === 'start') && !targetNode.visited && this.canVisitNode(targetId)) {
                // Available path - glowing green with animation
                ctx.strokeStyle = '#56b886'; // Secondary color - green
                ctx.lineWidth = 3;
                ctx.shadowColor = '#56b886';
                ctx.shadowBlur = 5;
                ctx.globalAlpha = 0.9;
                
                // Animate available paths
                const time = Date.now() / 1000;
                const pulseRate = 1.5; // Pulse every 1.5 seconds
                const pulseAmount = 0.2; // Amount to pulse (20% opacity change)
                
                // Create pulsing effect
                ctx.globalAlpha = 0.7 + Math.sin(time * pulseRate * Math.PI) * pulseAmount;
            } else if (!node.visited && !targetNode.visited) {
                // Unavailable path - very subtle gray
                ctx.strokeStyle = 'rgba(100, 100, 110, 0.15)';
                ctx.lineWidth = 1;
            } else {
                // Default - used but can't continue
                ctx.strokeStyle = 'rgba(100, 100, 110, 0.4)';
                ctx.lineWidth = 2;
            }
            
            // Draw pixelated path
            ctx.beginPath();
            
            // Start at source node
            ctx.moveTo(startX, startY);
            
            // Create slightly jagged line for pixelated effect
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = startX + dx * t;
                const y = startY + dy * t;
                
                // Add small random offset for pixelated look
                // More pronounced for visited paths, subtle for others
                let offset = maxOffset;
                if ((node.visited || nodeId === 'start') && !targetNode.visited && this.canVisitNode(targetId)) {
                    // Animated paths get less offset to appear more "active"
                    offset = maxOffset * 0.5;
                } else if (!node.visited && !targetNode.visited) {
                    // Unavailable paths get more offset to look "broken"
                    offset = maxOffset * 1.2;
                }
                
                // Generate deterministic offset based on position and nodeId
                // This ensures the jagged effect stays consistent
                const seed = (x * 100 + y) + nodeId.charCodeAt(0);
                const offsetX = (Math.sin(seed) * offset);
                const offsetY = (Math.cos(seed * 2) * offset);
                
                ctx.lineTo(x + offsetX, y + offsetY);
            }
            
            // End at target node
            ctx.lineTo(endX, endY);
            
            // Draw the path
            ctx.stroke();
            
            // Reset context
            ctx.restore();
        });
    }
  },
  
  // Update the drawNode function for better looking nodes
  drawNode: function(ctx, node, width, height, bottomUp = false) {
    // Calculate node position (adjust for bottom-up layout)
    let y;
    if (bottomUp) {
        y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
    } else {
        y = height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
    }
    
    const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
    const radius = 20; // Slightly larger radius
    
    // Create rounded pixel effect for nodes
    ctx.save();
    
    // Add subtle outer glow first
    if (this.canVisitNode(node.id) || gameState.currentNode === node.id) {
        const nodeColor = this.nodeColors[node.type] || '#5b8dd9';
        const glowSize = gameState.currentNode === node.id ? 15 : 8;
        const glowAlpha = gameState.currentNode === node.id ? 0.4 : 0.2;
        
        const gradient = ctx.createRadialGradient(
            x, y, radius - 5,
            x, y, radius + glowSize
        );
        gradient.addColorStop(0, `rgba(${this.hexToRgb(nodeColor)}, ${glowAlpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius + glowSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Create pixelated node shape
    // We'll simulate a pixelated circle by drawing a slightly jagged circle
    const pixelSize = 2; // Size of our "pixels"
    const angleSteps = 18; // Number of segments to create pixelated look
    
    ctx.beginPath();
    
    // Draw pixelated circle
    for (let i = 0; i < angleSteps; i++) {
        const angle = (i / angleSteps) * Math.PI * 2;
        const nextAngle = ((i + 1) / angleSteps) * Math.PI * 2;
        
        // Add slight variation for pixelated effect
        const r1 = radius - (Math.random() * pixelSize);
        const r2 = radius - (Math.random() * pixelSize);
        
        const x1 = x + Math.cos(angle) * r1;
        const y1 = y + Math.sin(angle) * r1;
        const x2 = x + Math.cos(nextAngle) * r2;
        const y2 = y + Math.sin(nextAngle) * r2;
        
        if (i === 0) {
            ctx.moveTo(x1, y1);
        }
        ctx.lineTo(x2, y2);
    }
    
    ctx.closePath();
    
    // Create inner gradient for more depth
    const innerGradient = ctx.createRadialGradient(
        x - radius/4, y - radius/4, 1,
        x, y, radius
    );
    
    // Style based on status
    if (gameState.currentNode === node.id) {
        // Current node styling
        const nodeColor = this.nodeColors[node.type] || '#5b8dd9';
        const lighterColor = this.lightenColor(nodeColor, 30);
        const darkerColor = this.darkenColor(nodeColor, 20);
        
        innerGradient.addColorStop(0, lighterColor);
        innerGradient.addColorStop(1, darkerColor);
        
        ctx.fillStyle = innerGradient;
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = 10;
    } else if (node.visited) {
        // Visited node - soft gray gradient
        innerGradient.addColorStop(0, 'rgba(120, 120, 130, 0.9)');
        innerGradient.addColorStop(1, 'rgba(90, 90, 100, 0.7)');
        ctx.fillStyle = innerGradient;
    } else if (this.canVisitNode(node.id)) {
        // Available node - vibrant color with gradient
        const nodeColor = this.nodeColors[node.type] || '#5b8dd9';
        const lighterColor = this.lightenColor(nodeColor, 20);
        
        innerGradient.addColorStop(0, lighterColor);
        innerGradient.addColorStop(1, nodeColor);
        
        ctx.fillStyle = innerGradient;
    } else {
        // Unavailable node - dimmed version with gradient
        const baseColor = this.nodeColors[node.type] || '#5b8dd9';
        const dimColor = this.dimColor(baseColor, 0.3);
        const dimmerColor = this.dimColor(baseColor, 0.2);
        
        innerGradient.addColorStop(0, dimColor);
        innerGradient.addColorStop(1, dimmerColor);
        
        ctx.fillStyle = innerGradient;
    }
    
    ctx.fill();
    
    // Draw border with pixelated effect
    ctx.lineWidth = gameState.currentNode === node.id ? 3 : 2;
    
    if (gameState.currentNode === node.id) {
        // Current node - bold white border with slight glow
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 3;
    } else if (node.visited) {
        // Visited node - subtle gray border
        ctx.strokeStyle = 'rgba(150, 150, 160, 0.6)';
    } else if (this.canVisitNode(node.id)) {
        // Available node - white border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    } else {
        // Unavailable node - very subtle border
        ctx.strokeStyle = 'rgba(100, 100, 110, 0.3)';
        ctx.lineWidth = 1;
    }
    
    ctx.stroke();
    
    // Draw node icon/symbol with pixelated style
    if (gameState.currentNode === node.id || node.visited || this.canVisitNode(node.id)) {
        ctx.fillStyle = '#fff'; // Bright white for better visibility
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Faded white
    }
    
    // Use pixelated font for the symbol
    ctx.font = 'bold 15px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const symbol = this.nodeSymbols[node.type] || '?';
    
    // Draw text with slight pixelated offset for retro feel
    if (gameState.currentNode === node.id) {
        // Current node - add slight bounce effect
        const bounceOffset = Math.sin(Date.now() / 300) * 2;
        ctx.fillText(symbol, x, y + bounceOffset);
    } else {
        ctx.fillText(symbol, x, y);
    }
    
    // Add difficulty indicator for question and elite nodes
    if ((node.type === 'question' || node.type === 'elite') && node.difficulty) {
        // Position stars below the node
        const starsY = y + radius + 10;
        
        if (this.canVisitNode(node.id) || node.visited) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        }
        
        // Use smaller font for the stars
        ctx.font = '8px "Press Start 2P", monospace';
        
        // Draw pixelated stars
        const stars = '★'.repeat(node.difficulty);
        ctx.fillText(stars, x, starsY);
    }
    
    // Reset shadow and restore context
    ctx.shadowBlur = 0;
    ctx.restore();
  },
  
  isPointOnLine: function(x1, y1, x2, y2, px, py, tolerance = 5) {
    // Calculate distance from point to line
    const A = py - y1;
    const B = px - x1;
    const C = y2 - y1;
    const D = x2 - x1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * D;
      yy = y1 + param * C;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy) < tolerance;
  },
  
  // Handle map click event
  handleMapClick: function(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const mapData = gameState.map;
    if (!mapData) return;
    
    // Check if click is on any node
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    const width = canvas.width;
    const height = canvas.height;
    
    for (const nodeId in allNodes) {
      const node = allNodes[nodeId];
      
      // Skip start node (can't be clicked)
      if (nodeId === 'start') continue;
      
      // Skip already visited nodes
      if (node.visited) continue;
      
      // Calculate node position (adjust for bottom-up layout)
      // Use this.config instead of MapRenderer.config
      let y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
      const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
      
      // Check if click is within node radius
      const dx = clickX - x;
      const dy = clickY - y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      // Use this instead of MapRenderer
      if (distance <= 20 && this.canVisitNode(nodeId)) { // 20 is the node radius
        console.log("Clicked on node:", nodeId);
        
        // Add visual feedback for click
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // After a short delay, visit the node
        setTimeout(() => {
          Nodes.visitNode(nodeId);
        }, 100);
        
        break;
      }
    }
  },
  
  // Improved function to determine if a node can be visited
  canVisitNode: function(nodeId) {
    if (nodeId === 'start') return false; // Can't revisit start
    
    // Get the map data
    const mapData = gameState.map;
    if (!mapData) return false;
    
    // If this is the current node, it can't be visited
    if (this.getCurrentNode() === nodeId) return false;
    
    // Get the node
    const node = mapData.nodes[nodeId] || (nodeId === 'boss' ? mapData.boss : null);
    if (!node || node.visited) return false;
    
    // Check if there's a path to this node from a visited node
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    for (const sourceId in allNodes) {
      const sourceNode = allNodes[sourceId];
      if ((sourceNode.visited || sourceId === 'start') && sourceNode.paths && sourceNode.paths.includes(nodeId)) {
        return true;
      }
    }
    
    return false;
  },
  
  // Helper function to get the current node (if any)
  getCurrentNode: function() {
    return gameState.currentNode || null;
  },
  
  // Enhanced function to dim colors with adjustable opacity
  dimColor: function(hex, opacity = 0.5) {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Dim by multiplying by opacity
    r = Math.floor(r * opacity);
    g = Math.floor(g * opacity);
    b = Math.floor(b * opacity);
    
    // Convert back to hex
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },
  // Add helper functions for color manipulation
hexToRgb: function(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
},

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

darkenColor: function(hex, percent) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Darken by percent
  r = Math.max(0, r - Math.floor(r * (percent / 100)));
  g = Math.max(0, g - Math.floor(g * (percent / 100)));
  b = Math.max(0, b - Math.floor(b * (percent / 100)));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
};

