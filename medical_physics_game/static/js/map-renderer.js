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
    
    // Fix for the handleMapClick event binding
    renderFloorMap: function(mapData, canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error("Canvas element not found:", canvasId);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions based on map size
      const width = Math.max(this.config.minWidth, this.config.nodesPerRow * 150);
      const height = Math.max(this.config.minHeight, (this.config.rowCount + 2) * 100);
      
      canvas.width = width;
      canvas.height = height;
      
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
      const mapClickHandler = function(event) {
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
          let y = height - height * ((node.position.row + 0.5) / (self.config.rowCount + 2));
          const x = width * ((node.position.col + 1) / (self.config.nodesPerRow + 1));
          
          // Check if click is within node radius
          const dx = clickX - x;
          const dy = clickY - y;
          const distance = Math.sqrt(dx*dx + dy*dy);
          
          if (distance <= 20 && self.canVisitNode(nodeId)) { // 20 is the node radius
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
      };
      
      // Use proper binding to maintain context
      canvas.removeEventListener('click', this._currentClickHandler);
      // Explicitly bind "this" to the callback
      const boundClickHandler = mapClickHandler.bind(this);
      canvas.addEventListener('click', boundClickHandler);
      this._currentClickHandler = boundClickHandler; // Store reference for future removal
    },
    
    // Draw connections between nodes
    drawConnections: function(ctx, mapData, width, height, bottomUp = false) {
      const allNodes = { ...mapData.nodes };
      if (mapData.start) allNodes['start'] = mapData.start;
      if (mapData.boss) allNodes['boss'] = mapData.boss;
      
      // Draw all connections
      for (const nodeId in allNodes) {
        const node = allNodes[nodeId];
        if (!node.paths || node.paths.length === 0) continue;
        
        // Calculate node position (adjust for bottom-up layout)
        let startY;
        if (bottomUp) {
          // Invert Y position for bottom-up layout
          startY = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
        } else {
          startY = height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
        }
        
        const startX = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
        
        node.paths.forEach(targetId => {
          const targetNode = allNodes[targetId];
          if (!targetNode) return;
          
          // Calculate target position (adjust for bottom-up layout)
          let endY;
          if (bottomUp) {
            // Invert Y position for bottom-up layout
            endY = height - height * ((targetNode.position.row + 0.5) / (this.config.rowCount + 2));
          } else {
            endY = height * ((targetNode.position.row + 0.5) / (this.config.rowCount + 2));
          }
          
          const endX = width * ((targetNode.position.col + 1) / (this.config.nodesPerRow + 1));
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          
          // Style the path based on status
          if (node.visited && targetNode.visited) {
            // Path has been used - make bold and darker
            ctx.strokeStyle = '#2E7D32'; // Dark green
            ctx.lineWidth = 5;
          } else if ((node.visited || nodeId === 'start') && !targetNode.visited && this.canVisitNode(targetId)) {
            // Available path - highlight
            ctx.strokeStyle = '#4CAF50'; // Bright green
            ctx.lineWidth = 3;
            
            // Add pulsing effect to available paths
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 10;
          } else if (!node.visited && !targetNode.visited) {
            // Unavailable path - fade out
            ctx.strokeStyle = 'rgba(170, 170, 170, 0.3)'; // Faded gray
            ctx.lineWidth = 1;
          } else {
            // Default - used but can't continue
            ctx.strokeStyle = 'rgba(204, 204, 204, 0.7)'; // Light gray
            ctx.lineWidth = 2;
          }
          
          ctx.stroke();
          
          // Reset shadow
          ctx.shadowBlur = 0;
        });
      }
    },
    // Add to map-renderer.js
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
    // Draw a node on the canvas
    drawNode: function(ctx, node, width, height, bottomUp = false) {
      const nodeColors = {
        'start': '#4CAF50',    // Green
        'boss': '#F44336',     // Red
        'question': '#2196F3', // Blue
        'elite': '#E91E63',    // Pink
        'treasure': '#FFC107', // Amber
        'rest': '#9C27B0',     // Purple
        'shop': '#00BCD4',     // Cyan
        'event': '#FF9800',    // Orange
        'gamble': '#CDDC39'    // Lime
      };
      
      // Calculate node position (adjust for bottom-up layout)
      let y;
      if (bottomUp) {
        // Invert Y position for bottom-up layout
        y = height - height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
      } else {
        y = height * ((node.position.row + 0.5) / (this.config.rowCount + 2));
      }
      
      const x = width * ((node.position.col + 1) / (this.config.nodesPerRow + 1));
      const radius = 20;
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      // Style based on status
      if (gameState.currentNode === node.id) {
        // Current node - add highlight/glow
        ctx.fillStyle = nodeColors[node.type] || '#333';
        ctx.shadowColor = '#FFF';
        ctx.shadowBlur = 15;
      } else if (node.visited) {
        // Visited node
        ctx.fillStyle = '#888'; // Gray
      } else if (this.canVisitNode(node.id)) {
        // Available node
        ctx.fillStyle = nodeColors[node.type] || '#333';
        // Add subtle pulse for available nodes
        ctx.shadowColor = nodeColors[node.type] || '#333';
        ctx.shadowBlur = 5;
      } else {
        // Unavailable node - fade out
        const color = nodeColors[node.type] || '#333';
        ctx.fillStyle = this.dimColor(color, 0.3); // More transparent
      }
      
      ctx.fill();
      
      // Draw border
      if (gameState.currentNode === node.id) {
        // Current node - bold border
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
      } else if (node.visited) {
        // Visited node
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
      } else if (this.canVisitNode(node.id)) {
        // Available node
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
      } else {
        // Unavailable node
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
      }
      
      ctx.stroke();
      
      // Draw node icon/symbol based on type
      if (gameState.currentNode === node.id || node.visited || this.canVisitNode(node.id)) {
        ctx.fillStyle = '#fff'; // Bright white for better visibility
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; // Faded white
      }
      
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Different symbols for different node types
      const symbols = {
        'start': 'S',
        'boss': 'B',
        'question': '?',
        'elite': '!',
        'treasure': 'T',
        'rest': 'R',
        'shop': '$',
        'event': 'E',
        'gamble': 'G'
      };
      
      ctx.fillText(symbols[node.type] || '?', x, y);
      
      // Add difficulty indicator for question and elite nodes
      if ((node.type === 'question' || node.type === 'elite') && node.difficulty) {
        if (this.canVisitNode(node.id) || node.visited) {
          ctx.fillStyle = '#fff';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
        }
        ctx.font = '10px Arial';
        ctx.fillText('★'.repeat(node.difficulty), x, y + radius + 10);
      }
      
      // Add node title below
      if (node.title) {
        if (this.canVisitNode(node.id) || node.visited || gameState.currentNode === node.id) {
          ctx.fillStyle = '#fff';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
        }
        ctx.font = '12px Arial';
        ctx.fillText(node.title, x, y + radius + 25);
      }
      
      // Reset shadow
      ctx.shadowBlur = 0;
    },
    
    // Fix the handleMapClick function to use the correct 'this' reference
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
  }
};