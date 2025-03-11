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
  
  // Replace the renderFloorMap function in map-renderer.js
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
      
      // First, precalculate which nodes are available to visit
      if (mapData.nodes) {
          Object.values(mapData.nodes).forEach(node => {
              if (!node.visited && node.id !== gameState.currentNode) {
                  node.available = this.canVisitNode(node.id);
              }
          });
      }
      
      if (mapData.boss && !mapData.boss.visited && mapData.boss.id !== gameState.currentNode) {
          mapData.boss.available = this.canVisitNode(mapData.boss.id);
      }
      
      // Draw connections first (so they appear behind nodes)
      this.drawConnections(ctx, mapData, width, height, true); // true for bottom-up
      
      // Draw all regular nodes
      for (const nodeId in mapData.nodes) {
          this.drawNode(ctx, mapData.nodes[nodeId], width, height, true); // true for bottom-up
      }
      
      // Draw start and boss nodes
      if (mapData.start) {
          this.drawNode(ctx, mapData.start, width, height, true);
      }
      
      if (mapData.boss) {
          this.drawNode(ctx, mapData.boss, width, height, true);
      }
      
      // Re-bind the event handler to maintain 'this' context
      // Remove previous click handler to avoid duplicates
      if (this._currentClickHandler) {
          canvas.removeEventListener('click', this._currentClickHandler);
      }

      // Create a bound handler and store it
      this._currentClickHandler = this.handleMapClick.bind(this);

      // Add the new event listener
      canvas.addEventListener('click', this._currentClickHandler);
  },
  
  // Replace drawConnections function in map-renderer.js with the following
  drawConnections: function(ctx, mapData, width, height, bottomUp = false) {
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    // Force all nodes to recalculate availability
    for (const nodeId in allNodes) {
        if (nodeId !== 'start') {
            const canVisit = this.canVisitNode(nodeId);
            allNodes[nodeId].available = canVisit;
        }
    }
    
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
            ctx.lineCap = 'round';
            
            // Calculate path length and angle
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Number of segments for pixelated effect
            const segments = Math.max(10, Math.floor(distance / 15));
            
            // Path offset variables for pixel effect
            const maxOffset = 1.5; // Maximum pixel offset
            
            // Determine path color based on game state
            let pathStyle = {
                strokeStyle: 'rgba(100, 100, 110, 0.15)', // Default: gray
                lineWidth: 1,
                globalAlpha: 0.5,
                shadowBlur: 0,
                offset: maxOffset * 1.2
            };
            
            // Check if this is the current path being traversed
            if (gameState.currentNode === nodeId || gameState.currentNode === targetId) {
                // Gold for current path
                pathStyle = {
                    strokeStyle: '#f0c866', // Gold color
                    lineWidth: 4,
                    globalAlpha: 0.9,
                    shadowColor: '#f0c866',
                    shadowBlur: 8,
                    offset: maxOffset * 0.3,
                    animate: true,
                    pulseRate: 2,
                    pulseAmount: 0.3
                };
            }
            // Check if the target node is available to visit
            else if (node.visited && targetNode.available === true) {
                // Green for available paths
                pathStyle = {
                    strokeStyle: '#56b886', // Green color
                    lineWidth: 3,
                    globalAlpha: 0.9,
                    shadowColor: '#56b886',
                    shadowBlur: 5,
                    offset: maxOffset * 0.5,
                    animate: true,
                    pulseRate: 1.5,
                    pulseAmount: 0.2
                };
            }
            // Check if path connects two visited nodes
            else if (node.visited && targetNode.visited) {
                // Muted green for completed paths
                pathStyle = {
                    strokeStyle: '#56b886', // Green color
                    lineWidth: 3,
                    globalAlpha: 0.8,
                    shadowBlur: 0,
                    offset: maxOffset * 0.7
                };
            }
            
            // Apply the styles
            ctx.strokeStyle = pathStyle.strokeStyle;
            ctx.lineWidth = pathStyle.lineWidth;
            ctx.globalAlpha = pathStyle.globalAlpha;
            
            if (pathStyle.shadowBlur > 0) {
                ctx.shadowColor = pathStyle.shadowColor;
                ctx.shadowBlur = pathStyle.shadowBlur;
            }
            
            // Add animation if needed
            if (pathStyle.animate) {
                const time = Date.now() / 1000;
                const pulseEffect = Math.sin(time * pathStyle.pulseRate * Math.PI) * pathStyle.pulseAmount;
                ctx.globalAlpha = Math.max(0.5, Math.min(1.0, pathStyle.globalAlpha + pulseEffect));
            }
            
            // Draw pixelated path
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // Create slightly jagged line for pixelated effect
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = startX + dx * t;
                const y = startY + dy * t;
                
                // Generate deterministic offset based on position and nodeId
                const seed = (x * 100 + y) + nodeId.charCodeAt(0);
                const offsetX = (Math.sin(seed) * pathStyle.offset);
                const offsetY = (Math.cos(seed * 2) * pathStyle.offset);
                
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
  
  // Replace drawNode function in map-renderer.js with the following
  drawNode: function(ctx, node, width, height, bottomUp = false) {
    // Calculate node position (adjust for bottom-up layout)
    let y;
    if (bottomUp) {
        y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
    } else {
        y = height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
    }
    
    const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
    const radius = 20; // Node radius
    
    // First, check if this node is available to visit (for non-start, non-visited nodes)
    if (node.id !== 'start' && !node.visited && !node.current) {
        node.available = this.canVisitNode(node.id);
    }
    
    // Create rounded pixel effect for nodes
    ctx.save();
    
    // Add outer glow effect for current and available nodes
    if (node.current) {
        // Current node - bright gold glow with strong pulsing
        const nodeColor = this.nodeColors[node.type] || '#5b8dd9';
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
        
        // DEBUG: Add label showing this is current
        ctx.font = '10px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('CURRENT', x, y - radius - 15);
    } else if (node.available) {
        // Available node - green glow with gentle pulsing
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
        
        // DEBUG: Add label showing this is available
        ctx.font = '10px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('AVAILABLE', x, y - radius - 15);
    } else if (node.visited) {
        // DEBUG: Add label showing this is visited
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('VISITED', x, y - radius - 15);
    }
    
    // Create pixelated node shape
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
    if (node.current) {
        // Current node - bright glowing blue/white
        const lighterColor = '#ffffff'; 
        const baseColor = this.nodeColors[node.type] || '#5b8dd9';
        
        innerGradient.addColorStop(0, lighterColor);
        innerGradient.addColorStop(1, baseColor);
        
        ctx.fillStyle = innerGradient;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
    } 
    else if (node.visited) {
        // Visited node - soft gray gradient
        innerGradient.addColorStop(0, 'rgba(120, 120, 130, 0.9)');
        innerGradient.addColorStop(1, 'rgba(90, 90, 100, 0.7)');
        ctx.fillStyle = innerGradient;
    } 
    else if (node.available) {
        // Available node - vibrant color with gradient
        const nodeColor = this.nodeColors[node.type] || '#5b8dd9';
        const lighterColor = this.lightenColor(nodeColor, 20);
        
        innerGradient.addColorStop(0, lighterColor);
        innerGradient.addColorStop(1, nodeColor);
        
        ctx.fillStyle = innerGradient;
    } 
    else {
        // Unavailable node - dimmed version
        const baseColor = this.nodeColors[node.type] || '#5b8dd9';
        const dimColor = this.dimColor(baseColor, 0.3);
        const dimmerColor = this.dimColor(baseColor, 0.2);
        
        innerGradient.addColorStop(0, dimColor);
        innerGradient.addColorStop(1, dimmerColor);
        
        ctx.fillStyle = innerGradient;
    }
    
    ctx.fill();
    
    // Draw border with pixelated effect
    ctx.lineWidth = node.current ? 3 : 2;
    
    if (node.current) {
        // Current node - bold white border with glow
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 3;
    } 
    else if (node.visited) {
        // Visited node - subtle gray border
        ctx.strokeStyle = 'rgba(150, 150, 160, 0.6)';
    } 
    else if (node.available) {
        // Available node - white border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    } 
    else {
        // Unavailable node - very subtle border
        ctx.strokeStyle = 'rgba(100, 100, 110, 0.3)';
        ctx.lineWidth = 1;
    }
    
    ctx.stroke();
    
    // Draw node icon/symbol with pixelated style
    if (node.current || node.visited || node.available) {
        ctx.fillStyle = '#fff'; // Bright white for visibility
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Faded white
    }
    
    // Use pixelated font for the symbol
    ctx.font = 'bold 15px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const symbol = this.nodeSymbols[node.type] || '?';
    
    // Draw text with slight pixelated offset for retro feel
    if (node.current) {
        // Current node - add slight bounce effect
        const bounceOffset = Math.sin(Date.now() / 300) * 2;
        ctx.fillText(symbol, x, y + bounceOffset);
    } else {
        ctx.fillText(symbol, x, y);
    }
    
    // Add node ID in small text for debugging
    ctx.font = '8px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(node.id, x, y + radius + 10);
    
    // Add difficulty indicator for question and elite nodes
    if ((node.type === 'question' || node.type === 'elite') && node.difficulty) {
        // Position stars below the node
        const starsY = y + radius + 20; // Moved down to not overlap with node ID
        
        if (node.available || node.visited) {
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
  
  // Replace the entire canVisitNode function in map-renderer.js
  canVisitNode: function(nodeId) {
    // Can't visit the start node
    if (nodeId === 'start') return false;
    
    // Get map data
    const mapData = gameState.map;
    if (!mapData) return false;
    
    // Get the node
    const targetNode = mapData.nodes[nodeId] || (nodeId === 'boss' ? mapData.boss : null);
    if (!targetNode) return false;
    
    // Debug output - renamed variable to avoid conflicts
    console.log(`Checking if can visit ${nodeId}, visited=${targetNode.visited}, row=${targetNode.position.row}`);
    
    // Already visited or current node cannot be visited
    if (targetNode.visited || gameState.currentNode === nodeId) return false;
    
    // Get node's row
    const nodeRow = targetNode.position.row;
    
    // Check if there's a path to this node from a previously visited node
    const previousRowNodes = [];
    
    // For row 1, only start node is previous
    if (nodeRow === 1) {
        if (mapData.start) previousRowNodes.push(mapData.start);
    } else {
        // For other rows, get all nodes from the previous row
        Object.values(mapData.nodes).forEach(prevRowNode => {
            if (prevRowNode.position && prevRowNode.position.row === nodeRow - 1) {
                previousRowNodes.push(prevRowNode);
            }
        });
    }
    
    // Check if any of the previous row nodes is visited and has a path to this node
    for (const prevNode of previousRowNodes) {
        if ((prevNode.visited || prevNode.id === 'start') && 
            prevNode.paths && prevNode.paths.includes(nodeId)) {
            return true;
        }
    }
    
    return false;
  },
  
  // Add these helper functions to MapRenderer in map-renderer.js

  // Helper function to get all nodes in a specific row (floor)
  getNodesInRow: function(row) {
    if (!gameState.map || !gameState.map.nodes) return [];
    
    const nodesInRow = [];
    
    // Add regular nodes in the row
    for (const nodeId in gameState.map.nodes) {
        const node = gameState.map.nodes[nodeId];
        if (node.position && node.position.row === row) {
            nodesInRow.push(node);
        }
    }
    
    // Check for special nodes (start/boss) in the row
    if (gameState.map.start && gameState.map.start.position && gameState.map.start.position.row === row) {
        nodesInRow.push(gameState.map.start);
    }
    
    if (gameState.map.boss && gameState.map.boss.position && gameState.map.boss.position.row === row) {
        nodesInRow.push(gameState.map.boss);
    }
    
    return nodesInRow;
  },

  // Helper function to check if a row has any visited nodes
  hasVisitedNodesInRow: function(row) {
    const nodesInRow = this.getNodesInRow(row);
    return nodesInRow.some(node => node.visited);
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
},

// Add this function to MapRenderer in map-renderer.js
debugNodeStatus: function() {
  if (!gameState.map) {
      console.log("No map data available for debugging");
      return;
  }
  
  console.group("Map Status Debug");
  console.log("Current Node:", gameState.currentNode);
  
  // Group nodes by row
  const nodesByRow = {};
  
  // Add regular nodes
  Object.values(gameState.map.nodes).forEach(node => {
      const row = node.position.row;
      if (!nodesByRow[row]) nodesByRow[row] = [];
      nodesByRow[row].push(node);
  });
  
  // Add special nodes
  if (gameState.map.start) {
      const row = gameState.map.start.position.row;
      if (!nodesByRow[row]) nodesByRow[row] = [];
      nodesByRow[row].push(gameState.map.start);
  }
  
  if (gameState.map.boss) {
      const row = gameState.map.boss.position.row;
      if (!nodesByRow[row]) nodesByRow[row] = [];
      nodesByRow[row].push(gameState.map.boss);
  }
  
  // Log each row
  const rows = Object.keys(nodesByRow).sort((a, b) => Number(a) - Number(b));
  rows.forEach(row => {
      console.group(`Row ${row} Nodes`);
      nodesByRow[row].forEach(node => {
          const statusFlags = [
              node.visited ? "VISITED" : "",
              node.current ? "CURRENT" : "",
              this.canVisitNode(node.id) ? "AVAILABLE" : ""
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

