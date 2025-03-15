// map_renderer.js - Enhanced version with retro styling
// This is a complete replacement for the existing file

// MapRenderer singleton - handles rendering the game map with retro styling
const MapRenderer = {
  // Configuration for map rendering
  config: {
    nodesPerRow: 3,    // Number of nodes horizontally
    rowCount: 5,       // Number of rows (excluding start/boss)
    minWidth: 800,     // Minimum canvas width
    minHeight: 600,    // Minimum canvas height
    gridSize: 50,      // Size of grid cells
    dropShadowDepth: 4 // Depth of the pixel drop shadows
  },
  
  // Get node color from registry
  getNodeColor: function(nodeType) {
    return NodeRegistry.getNodeType(nodeType).color;
  },
  
  // Get node shadow color from registry
  getNodeShadowColor: function(nodeType) {
    return NodeRegistry.getNodeType(nodeType).shadowColor;
  },
  
  // Get node symbol from registry
  getNodeSymbol: function(nodeType) {
    return NodeRegistry.getNodeType(nodeType).symbol;
  },

  // Background patterns for different floor types
  backgroundPatterns: [
    { // Hospital basement (floor 1)
      mainColor: '#292b36',
      gridColor: '#21232d',
      dotColor: '#34394d',
      accentColor: '#484e68'
    },
    { // Radiation oncology (floor 2)
      mainColor: '#2b3034',
      gridColor: '#23272a',
      dotColor: '#3a4048',
      accentColor: '#4e555f'
    },
    { // Linear accelerator room (floor 3)
      mainColor: '#2d2b36',
      gridColor: '#232130',
      dotColor: '#3d384d',
      accentColor: '#4e4668'
    }
  ],
  
  // Particle system for ambient effects
  particles: [],
  
  // Initialize with canvas ID
  initialize: function(canvasId) {
    console.log(`Initializing enhanced map renderer with canvas: ${canvasId}`);
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
    
    // Initialize particle system
    this.initParticles();
    
    // Start animation loop for particles and other effects
    this.startAnimationLoop();
    
    return this;
  },
  
  initParticles: function() {
    // Create particles based on floor
    const currentFloor = GameState.data ? GameState.data.currentFloor || 1 : 1;
    const patternIndex = Math.min(currentFloor - 1, this.backgroundPatterns.length - 1);
    const pattern = this.backgroundPatterns[patternIndex];
    
    this.particles = [];
    
    // Determine particle count based on device capability
    const isLowPowerDevice = window.navigator.hardwareConcurrency < 4 || 
                            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Adjust particle count based on device performance
    const baseCount = isLowPowerDevice ? 10 : 25;
    const floorMultiplier = isLowPowerDevice ? 3 : 8;
    const particleCount = baseCount + (Math.min(currentFloor, 5) * floorMultiplier);
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.3,
        color: i % 5 === 0 ? pattern.accentColor : pattern.dotColor,
        alpha: Math.random() * 0.4 + 0.2, // Reduced opacity
        lastX: 0, // Track last position for dirty checking
        lastY: 0
      });
    }
  },
  
  startAnimationLoop: function() {
    if (!this._animationFrame) {
      // Track frame timing for throttling
      let lastFrameTime = 0;
      const targetFPS = 20; // Limit to 20fps for particles
      const frameInterval = 1000 / targetFPS;
      
      const animate = (timestamp) => {
        // Throttle frame rate
        if (timestamp - lastFrameTime < frameInterval) {
          this._animationFrame = requestAnimationFrame(animate);
          return;
        }
        
        lastFrameTime = timestamp;
        
        // Only update if tab is visible and canvas exists
        if (!document.hidden) {
          this.updateParticles();
        }
        
        this._animationFrame = requestAnimationFrame(animate);
      };
      
      this._animationFrame = requestAnimationFrame(animate);
      
      // Add event listener for visibility changes
      document.addEventListener('visibilitychange', () => {
        lastFrameTime = 0; // Reset timing when tab becomes visible again
      });
    }
  },
  
  // Stop animation loop
  stopAnimationLoop: function() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  },
  updateParticles: function() {
    // Only proceed if canvas is visible
    const canvas = document.getElementById(this.canvasId);
    if (!canvas || canvas.offsetParent === null) return;
    
    // Don't update particles during node interactions
    if (GameState.data && GameState.data.currentNode) return;
    
    // Update particle positions
    this.particles.forEach(particle => {
      // Save last position before updating
      particle.lastX = particle.x;
      particle.lastY = particle.y;
      
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
    });
    
    // MODIFIED: Always do a full redraw to maintain correct z-ordering
    this.renderMap();
  },

  // Handle state changes from GameState
  onStateChanged: function(event, data) {
    // Respond to relevant state changes
    switch (event) {
      case 'stateInitialized':
      case 'nodeCompleted':
      case 'currentNodeChanged':
      case 'floorChanged':
        // When floor changes, update particle system
        if (event === 'floorChanged') {
          this.initParticles();
        }
        // Render the map
        this.renderMap();
        break;
    }
  },
  
  renderMap: function() {
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
    
    // Get all nodes to determine map dimensions
    const allNodes = GameState.getAllNodes();
    
    // Find the max row used by any node (to determine height)
    let maxRow = 0;
    allNodes.forEach(node => {
      if (node.position && node.position.row > maxRow) {
        maxRow = node.position.row;
      }
    });
    
    // Calculate canvas dimensions
    const canvasWidth = 800; // Fixed width for consistency
    
    // Calculate height based on rows (100px per row plus padding)
    const rowSpacing = 80; // Space between rows
    const paddingTop = 100; // Space at top
    const paddingBottom = 100; // Space at bottom
    const canvasHeight = paddingTop + (maxRow * rowSpacing) + paddingBottom;
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    // Create a map wrapper if it doesn't exist
    let mapWrapper = canvas.parentElement;
    if (!mapWrapper.classList.contains('map-wrapper')) {
      // Canvas is not in a wrapper yet
      mapWrapper = document.createElement('div');
      mapWrapper.className = 'map-wrapper';
      canvas.parentNode.insertBefore(mapWrapper, canvas);
      mapWrapper.appendChild(canvas);
    }
    
    // Update wrapper height
    mapWrapper.style.height = canvasHeight + 'px';
    
    // Get floor number for theming
    const currentFloor = GameState.data ? GameState.data.currentFloor || 1 : 1;
    const patternIndex = Math.min(currentFloor - 1, this.backgroundPatterns.length - 1);
    const pattern = this.backgroundPatterns[patternIndex];
    
    // Draw retro-style background
    this.drawRetroBackground(ctx, pattern, canvasWidth, canvasHeight);
    
    // Draw ambient floating particles (IMMEDIATELY AFTER BACKGROUND)
    this.drawParticles(ctx);
    
    // Draw connections next (on top of particles)
    this.drawConnections(ctx, canvasWidth, canvasHeight);
    
    // Draw all nodes with enhanced styling (on top of connections & particles)
    allNodes.forEach(node => {
      this.drawNode(ctx, node, canvasWidth, canvasHeight);
    });
    
    // Add subtle CRT scanline effect
    this.drawScanlines(ctx, canvasWidth, canvasHeight);
    
    // Update map title with floor number
    const mapTitle = document.querySelector('.panel-title, .map-title, h3');
    if (mapTitle && mapTitle.textContent.includes('Floor Map')) {
      mapTitle.textContent = `Floor ${currentFloor} Map`;
    }
    
    // Check if we need scroll indicators
    this.updateScrollIndicators(canvasHeight);
  },
  
  // Draw retro-styled pixelated background
  drawRetroBackground: function(ctx, pattern, width, height) {
    // Fill with main background color
    ctx.fillStyle = pattern.mainColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines with pixel precision
    ctx.strokeStyle = pattern.gridColor;
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5); // Add 0.5 for pixel-perfect lines
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0); // Add 0.5 for pixel-perfect lines
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    
    // Add small grid dots with pixelation
    for (let x = 0; x < width; x += 10) {
      for (let y = 0; y < height; y += 10) {
        if ((x % 20 === 0) && (y % 20 === 0)) {
          ctx.fillStyle = pattern.dotColor;
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    }
    
    // Add subtle vignette effect (darker around edges)
    const gradient = ctx.createRadialGradient(
      width/2, height/2, 100,
      width/2, height/2, Math.max(width, height)
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  },
  
  // Update the drawConnections function
  drawConnections: function(ctx, width, height) {
    const allNodes = GameState.getAllNodes();
    
    // Draw connections in multiple passes for layering effects
    
    // Pass 1: Draw all connection shadows
    allNodes.forEach(node => {
      if (!node.paths || node.paths.length === 0) return;
      
      // Get nodes in this row for column calculation
      const nodesInRow = this.getNodesInRow(node.position.row);
      const columnsInRow = nodesInRow.length;
      
      // Calculate the starting x position to center nodes in this row
      const rowWidth = columnsInRow * 120;
      const startX = (width - rowWidth) / 2 + 60;
      
      // Get column index of this node within its row
      const colIndex = nodesInRow.indexOf(node);
      
      // Calculate source position with centered coordinates
      const sourceRow = node.position.row;
      const startNodeX = startX + (colIndex * 120);
      const startNodeY = 100 + (sourceRow * 80);
      
      // Draw paths to each connected node
      node.paths.forEach(targetId => {
        const targetNode = GameState.getNodeById(targetId);
        if (!targetNode) return;
        
        // Get target nodes in their row for column position
        const targetNodesInRow = this.getNodesInRow(targetNode.position.row);
        const targetColumnsInRow = targetNodesInRow.length;
        
        // Calculate target row starting position
        const targetRowWidth = targetColumnsInRow * 120;
        const targetStartX = (width - targetRowWidth) / 2 + 60;
        
        // Get target's column index
        const targetColIndex = targetNodesInRow.indexOf(targetNode);
        
        // Calculate target position with centered coordinates
        const targetRow = targetNode.position.row;
        const endNodeX = targetStartX + (targetColIndex * 120);
        const endNodeY = 100 + (targetRow * 80);
        
        // Shadow color - always dark
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 5;
        
        // Draw the shadow with pixelated style
        this.drawPixelLine(ctx, startNodeX, startNodeY + 4, endNodeX, endNodeY + 4);
      });
    });
    
    // Pass 2: Draw main connections
    allNodes.forEach(node => {
      if (!node.paths || node.paths.length === 0) return;
      
      // Get nodes in this row for column calculation 
      const nodesInRow = this.getNodesInRow(node.position.row);
      const columnsInRow = nodesInRow.length;
      
      // Calculate the starting x position to center nodes in this row
      const rowWidth = columnsInRow * 120;
      const startX = (width - rowWidth) / 2 + 60;
      
      // Get column index of this node within its row
      const colIndex = nodesInRow.indexOf(node);
      
      // Calculate source position with centered coordinates
      const sourceRow = node.position.row;
      const startNodeX = startX + (colIndex * 120);
      const startNodeY = 100 + (sourceRow * 80);
      
      // Draw paths to each connected node
      node.paths.forEach(targetId => {
        const targetNode = GameState.getNodeById(targetId);
        if (!targetNode) return;
        
        // Get target nodes in their row
        const targetNodesInRow = this.getNodesInRow(targetNode.position.row);
        const targetColumnsInRow = targetNodesInRow.length;
        
        // Calculate target row starting position
        const targetRowWidth = targetColumnsInRow * 120;
        const targetStartX = (width - targetRowWidth) / 2 + 60;
        
        // Get target's column index
        const targetColIndex = targetNodesInRow.indexOf(targetNode);
        
        // Calculate target position with centered coordinates
        const targetRow = targetNode.position.row;
        const endNodeX = targetStartX + (targetColIndex * 120);
        const endNodeY = 100 + (targetRow * 80);
        
        if (node.visited || node.id === 'start') {
          if (targetNode.state === NODE_STATE.AVAILABLE) {
            // VALID PASSABLE PATH - BRIGHT GREEN
            ctx.strokeStyle = '#56b886'; // Use secondary color
            ctx.lineWidth = 3;
          } else if (targetNode.state === NODE_STATE.COMPLETED) {
            // ALREADY TAKEN PATH - Now using bright BLUE instead of gray
            ctx.strokeStyle = '#5b8dd9'; // Primary color instead of gray
            ctx.lineWidth = 3; // Increased from 2 to be more visible
          } else if (targetNode.state === NODE_STATE.CURRENT) {
            // PATH TO CURRENT NODE - BRIGHT BLUE
            ctx.strokeStyle = '#5b8dd9'; // Use primary color
            ctx.lineWidth = 3;
          } else {
            // INACCESSIBLE PATH - VERY FAINT
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
          }
        }
        
        // Also, if BOTH nodes are completed, make the path even more prominent
        if (node.visited && targetNode.visited) {
          ctx.strokeStyle = '#9c77db'; // Purple for completed connections
          ctx.lineWidth = 3;
        }
        
        // Draw the connection with pixelated style
        this.drawPixelLine(ctx, startNodeX, startNodeY, endNodeX, endNodeY);
        
        // For available paths, add direction indicators
        if (node.visited && targetNode.state === NODE_STATE.AVAILABLE) {
          this.drawPathArrow(ctx, startNodeX, startNodeY, endNodeX, endNodeY);
        }
      });
    });
  },
  
  // Complete updated drawNode function
  drawNode: function(ctx, node, width, height) {
    // Use fixed spacing for reliable positioning
    const rowSpacing = 80; // Pixels between rows
    const colSpacing = 120; // Pixels between columns
    
    // Get the number of columns in this row
    const nodesInRow = this.getNodesInRow(node.position.row);
    const columnsInRow = nodesInRow.length;
    
    // Calculate the starting x position to center nodes in this row
    const rowWidth = columnsInRow * colSpacing;
    const startX = (width - rowWidth) / 2 + colSpacing/2;
    
    // Get column index of this node within its row
    const colIndex = nodesInRow.indexOf(node);
    
    // Calculate centered position
    const x = startX + (colIndex * colSpacing);
    const y = 100 + (node.position.row * rowSpacing);
    
    // Set larger radius for boss and start nodes
    let nodeRadius = 25; // Default node radius
    if (node.type === 'boss') {
      nodeRadius = 40; // Larger radius for boss nodes
    } else if (node.type === 'start') {
      nodeRadius = 35; // Larger radius for starting nodes
    }
    
    // Save context for node styling
    ctx.save();
    
    // Determine colors based on node type and state
    let fillColor, shadowColor, strokeColor, textColor;
    
    // Set colors based on node state
    if (node.state === NODE_STATE.CURRENT) {
      fillColor = '#e67e73'; // Red for current
      shadowColor = '#b66059'; // Darker red 
      strokeColor = '#ffffff';
      textColor = '#ffffff';
    } else if (node.state === NODE_STATE.COMPLETED) {
      fillColor = '#56b886'; // Green for completed
      shadowColor = '#45966d'; // Darker green
      strokeColor = '#ffffff';
      textColor = '#ffffff';
    } else if (node.state === NODE_STATE.AVAILABLE) {
      fillColor = '#5b8dd9'; // Blue for available
      shadowColor = '#4a70b0'; // Darker blue
      strokeColor = '#ffffff';
      textColor = '#ffffff';
    } else {
      // Locked nodes - get color based on type but with reduced brightness
      const typeColor = NodeRegistry.getNodeType(node.type).color || '#999999';
      fillColor = this.adjustColorBrightness(typeColor, -30);
      shadowColor = this.adjustColorBrightness(typeColor, -60);
      strokeColor = '#666666';
      textColor = '#cccccc';
    }
    
    // Draw special shapes for start and boss nodes
    if (node.type === 'start') {
      // Draw a star shape for start
      this.drawStartNode(ctx, x, y, nodeRadius, fillColor, shadowColor, strokeColor);
    } else if (node.type === 'boss') {
      // Draw a diamond/crystal shape for boss
      this.drawBossNode(ctx, x, y, nodeRadius, fillColor, shadowColor, strokeColor);
    } else {
      // Draw standard node shape
      this.drawPixelatedNode(ctx, x, y, nodeRadius, fillColor, shadowColor, strokeColor);
    }
    
    // Draw node symbol
    ctx.fillStyle = textColor;
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const symbol = NodeRegistry.getNodeType(node.type).symbol || '?';
    ctx.fillText(symbol, x, y - 3);
    
    // Draw type indicator below
    ctx.font = '8px "Press Start 2P", monospace';
    
    // Add glow effect for available/current nodes
    if (node.state === NODE_STATE.AVAILABLE || node.state === NODE_STATE.CURRENT) {
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius + 5, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(x, y, nodeRadius - 5, x, y, nodeRadius + 10);
      
      if (node.state === NODE_STATE.AVAILABLE) {
        glow.addColorStop(0, 'rgba(91, 141, 217, 0)');
        glow.addColorStop(0.5, 'rgba(91, 141, 217, 0.3)');
        glow.addColorStop(1, 'rgba(91, 141, 217, 0)');
      } else {
        glow.addColorStop(0, 'rgba(230, 126, 115, 0)');
        glow.addColorStop(0.5, 'rgba(230, 126, 115, 0.3)');
        glow.addColorStop(1, 'rgba(230, 126, 115, 0)');
      }
      
      ctx.fillStyle = glow;
      ctx.fill();
    }
    
    ctx.restore();
  },
  
  getNodesInRow: function(rowIndex) {
    if (!GameState || !GameState.getAllNodes) return [];
    
    return GameState.getAllNodes().filter(node => 
      node.position && node.position.row === rowIndex
    ).sort((a, b) => a.position.col - b.position.col);
  },

  // Draw a star shape for start node
  drawStartNode: function(ctx, x, y, radius, fillColor, shadowColor, strokeColor) {
    const spikes = 5;
    const outerRadius = radius;
    const innerRadius = radius * 0.4;
    
    ctx.beginPath();
    
    for(let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = Math.PI * i / spikes - Math.PI / 2;
      
      if(i === 0) {
        ctx.moveTo(x + r * Math.cos(angle), y - 4 + r * Math.sin(angle));
      } else {
        ctx.lineTo(x + r * Math.cos(angle), y - 4 + r * Math.sin(angle));
      }
    }
    
    ctx.closePath();
    
    // Draw shadow
    ctx.fillStyle = shadowColor;
    ctx.fill();
    
    // Draw star raised above shadow
    ctx.beginPath();
    for(let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = Math.PI * i / spikes - Math.PI / 2;
      
      if(i === 0) {
        ctx.moveTo(x + r * Math.cos(angle), y - 8 + r * Math.sin(angle));
      } else {
        ctx.lineTo(x + r * Math.cos(angle), y - 8 + r * Math.sin(angle));
      }
    }
    
    ctx.closePath();
    
    // Fill and stroke the main shape
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  },

  // Draw a diamond/crystal shape for boss node
  drawBossNode: function(ctx, x, y, radius, fillColor, shadowColor, strokeColor) {
    const diamondHeight = radius * 2;
    const diamondWidth = radius * 1.6;
    
    // Draw shadow first
    ctx.beginPath();
    ctx.moveTo(x, y + diamondHeight/2);
    ctx.lineTo(x - diamondWidth/2, y);
    ctx.lineTo(x, y - diamondHeight/2);
    ctx.lineTo(x + diamondWidth/2, y);
    ctx.closePath();
    
    ctx.fillStyle = shadowColor;
    ctx.fill();
    
    // Draw raised boss crystal
    ctx.beginPath();
    ctx.moveTo(x, y - 4 + diamondHeight/2);
    ctx.lineTo(x - diamondWidth/2, y - 4);
    ctx.lineTo(x, y - 4 - diamondHeight/2);
    ctx.lineTo(x + diamondWidth/2, y - 4);
    ctx.closePath();
    
    // Fill and stroke the main shape
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add highlight reflection
    ctx.beginPath();
    ctx.moveTo(x - diamondWidth/4, y - 4);
    ctx.lineTo(x, y - 4 - diamondHeight/4);
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.adjustColorBrightness(fillColor, 50);
    ctx.stroke();
  },
  // Draw a pixelated node shape with 3D effect
  drawPixelatedNode: function(ctx, x, y, radius, fillColor, shadowColor, strokeColor) {
    // Draw main node shape
    ctx.beginPath();
    
    // Instead of a perfect circle, draw a pixelated octagon for retro feel
    const sides = 8;
    const angle = (2 * Math.PI) / sides;
    
    for (let i = 0; i < sides; i++) {
      const pointX = x + radius * Math.cos(i * angle);
      const pointY = y + radius * Math.sin(i * angle);
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    
    // Draw shadow underneath (offset by 4 pixels)
    ctx.fillStyle = shadowColor;
    ctx.fill();
    
    // Draw top shape
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const pointX = x + radius * Math.cos(i * angle);
      const pointY = y - 4 + radius * Math.sin(i * angle); // 4px higher
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    
    // Fill and stroke the main shape
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add highlight effect (top-left inner edge)
    ctx.beginPath();
    ctx.moveTo(x - radius/2, y - radius/2 - 4);
    ctx.lineTo(x, y - 4);
    ctx.lineTo(x + radius/2, y - radius/2 - 4);
    ctx.strokeStyle = this.adjustColorBrightness(fillColor, 30);
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  
  drawParticles: function(ctx) {
    this.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha;
      ctx.fillRect(
        Math.floor(particle.x), 
        Math.floor(particle.y), 
        particle.size, 
        particle.size
      );
    });
    
    ctx.globalAlpha = 1.0; // Reset alpha
  },
  
  // Draw CRT scanlines effect
  drawScanlines: function(ctx, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1);
    }
  },
  
  // Draw pixel-style directional arrow on paths
  drawPathArrow: function(ctx, x1, y1, x2, y2) {
    // Calculate arrow position (3/4 of the way from start to end)
    const t = 0.7; // Position along the path (0-1)
    const arrowX = x1 + (x2 - x1) * t;
    const arrowY = y1 + (y2 - y1) * t;
    
    // Calculate direction angle
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // Draw pixelated arrow
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    
    // Arrow body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -1, 8, 2);
    
    // Arrow head
    ctx.fillRect(-2, -4, 2, 8);
    ctx.fillRect(0, -3, 2, 6);
    ctx.fillRect(2, -2, 2, 4);
    ctx.fillRect(4, -1, 2, 2);
    
    ctx.restore();
  },
  
  // Draw a pixelated line for path connections
  drawPixelLine: function(ctx, x1, y1, x2, y2) {
    // Calculate line parameters
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;
    
    // Crude approach to drawing a pixelated line - could optimize with Bresenham's
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    // For thick lines, use standard stroke
    if (ctx.lineWidth > 2) {
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return;
    }
    
    // For thin lines, draw pixel by pixel with small segments
    let currentX = x1;
    let currentY = y1;
    
    while (true) {
      if ((currentX === x2) && (currentY === y2)) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
      
      // Draw small rectangle for each "pixel"
      ctx.fillRect(
        Math.floor(currentX - ctx.lineWidth/2), 
        Math.floor(currentY - ctx.lineWidth/2), 
        Math.ceil(ctx.lineWidth), 
        Math.ceil(ctx.lineWidth)
      );
    }
  },
  
  // Update the drawFloorIndicator function in map_renderer.js to use a smaller font
  drawFloorIndicator: function(ctx, floorNumber) {
    ctx.save();
    
    // Keep centered position
    const badgeX = ctx.canvas.width / 2;
    const badgeY = 30;
    
    // Adjust size to better fit text
    const badgeWidth = 120;
    const badgeHeight = 36;
    
    // Draw badge background shadow
    ctx.fillStyle = '#292b36'; // Dark shadow
    ctx.fillRect(badgeX - badgeWidth/2 + 4, badgeY - 10 + 4, badgeWidth, badgeHeight);
    
    // Draw badge main body
    ctx.fillStyle = '#3d4c60'; // Dark blue background
    ctx.fillRect(badgeX - badgeWidth/2, badgeY - 10, badgeWidth, badgeHeight);
    
    // Badge border
    ctx.strokeStyle = '#5b8dd9'; // Primary color
    ctx.lineWidth = 2;
    ctx.strokeRect(badgeX - badgeWidth/2, badgeY - 10, badgeWidth, badgeHeight);
    
    // Badge text - REDUCED FONT SIZE
    ctx.font = '14px "Press Start 2P", monospace'; // Smaller font (from 18px to 14px)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`FLOOR ${floorNumber}`, badgeX, badgeY + 8); // Adjust vertical position
    
    // Add a subtle glow effect
    ctx.shadowColor = '#5b8dd9';
    ctx.shadowBlur = 8;
    ctx.strokeRect(badgeX - badgeWidth/2, badgeY - 10, badgeWidth, badgeHeight);
    
    ctx.restore();
  },
  
  // Update scroll indicators based on content height
  updateScrollIndicators: function(canvasHeight) {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      // Remove any existing indicators
      const existingIndicators = mapContainer.querySelectorAll('.scroll-indicator');
      existingIndicators.forEach(el => el.remove());
      
      if (canvasHeight > mapContainer.clientHeight) {
        // Add scroll indicators if the content is taller than container
        
        // Top indicator (only if scrolled down)
        const topIndicator = document.createElement('div');
        topIndicator.className = 'scroll-indicator top';
        topIndicator.innerHTML = '▲';
        mapContainer.appendChild(topIndicator);
        
        // Bottom indicator
        const bottomIndicator = document.createElement('div');
        bottomIndicator.className = 'scroll-indicator bottom';
        bottomIndicator.innerHTML = '▼';
        mapContainer.appendChild(bottomIndicator);
        
        // Update indicator visibility on scroll
        mapContainer.addEventListener('scroll', function() {
          if (this.scrollTop > 20) {
            topIndicator.style.display = 'block';
          } else {
            topIndicator.style.display = 'none';
          }
          
          if (this.scrollTop + this.clientHeight >= this.scrollHeight - 20) {
            bottomIndicator.style.display = 'none';
          } else {
            bottomIndicator.style.display = 'block';
          }
        });
        
        // Trigger scroll event to set initial state
        mapContainer.dispatchEvent(new Event('scroll'));
      }
    }
  },
  
  // Update the handleMapClick function
  handleMapClick: function(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    
    // Get click coordinates relative to canvas
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Check if click is on any node
    const allNodes = GameState.getAllNodes();
    const width = canvas.width;
    
    for (const node of allNodes) {
      // Skip start node (can't be clicked)
      if (node.id === 'start') continue;
      
      // Skip nodes that are already visited
      if (node.visited) continue;
      
      // Get nodes in this row for column calculation
      const nodesInRow = this.getNodesInRow(node.position.row);
      const columnsInRow = nodesInRow.length;
      
      // Calculate the starting x position to center nodes in this row
      const rowWidth = columnsInRow * 120;
      const startX = (width - rowWidth) / 2 + 60;
      
      // Get column index of this node within its row
      const colIndex = nodesInRow.indexOf(node);
      
      // Calculate node center with centered coordinates
      const nodeRow = node.position.row;
      const nodeX = startX + (colIndex * 120);
      const nodeY = 100 + (nodeRow * 80);
      
      // Check distance from click to node center
      const dx = clickX - nodeX;
      const dy = clickY - nodeY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      const nodeRadius = 25;
      
      // Check if click is within node radius
      if (distance <= nodeRadius) {
        console.log("Clicked on node:", node.id, "- state:", node.state);
        
        // If node can be visited, process it
        if (ProgressionManager.canVisitNode(node.id)) {
          // Visual feedback for click
          this.showClickFeedback(nodeX, nodeY);
          
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
    
    // Create expanding pixel circle animation
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const radius = 5 + (i * 3);
        
        // Draw a pixelated pulse ring
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 - i/10) + ')';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        const sides = 8 + i;
        const angle = (2 * Math.PI) / sides;
        
        for (let j = 0; j < sides; j++) {
          const pointX = x + radius * Math.cos(j * angle);
          const pointY = y + radius * Math.sin(j * angle);
          
          if (j === 0) {
            ctx.moveTo(pointX, pointY);
          } else {
            ctx.lineTo(pointX, pointY);
          }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        
        // Redraw the map after the animation completes
        if (i === 9) {
          setTimeout(() => this.renderMap(), 100);
        }
      }, i * 30);
    }
  },
  
  // Helper to adjust color brightness
  adjustColorBrightness: function(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    
    // Convert back to hex
    return '#' + 
      ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1);
  }
};

// Export the MapRenderer
window.MapRenderer = MapRenderer;