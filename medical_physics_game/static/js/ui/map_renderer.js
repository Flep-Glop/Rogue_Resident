// map_renderer.js - Enhanced version with retro styling and fog of war
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
    dropShadowDepth: 4, // Depth of the pixel drop shadows
    fogOfWarEnabled: true, // Enable fog of war effect
    fogOfWarDistance: 20,  // Number of rows ahead that are visible
    nodeRevealAnimations: true // Enable node reveal animations
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
  
  // Store newly revealed nodes for animations
  newlyRevealedNodes: [],
  
  // Fog of war state
  fogOfWar: {
    visible: true,
    fadingNodes: new Set(), // Store nodes that are fading in
    lastVisibleRow: 0,      // Last visible row (for fog calculation)
    revealSpeed: 300        // Milliseconds for node reveal animation
  },
  
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
        // Initial setup
        this.renderMap();
        break;
      
      case 'nodeCompleted':
        // When a node is completed, update fog of war calculation
        this.updateFogOfWarCalculation();
        this.renderMap();
        break;
        
      case 'currentNodeChanged':
        // When current node changes, update fog and do reveal animations
        this.updateFogOfWarCalculation();
        this.prepareNodeRevealAnimations();
        this.renderMap();
        break;
        
      case 'floorChanged':
        // When floor changes, update particle system and reset fog
        this.initParticles();
        this.resetFogOfWar();
        this.renderMap();
        break;
    }
  },
  
  // Reset fog of war when changing floors
  resetFogOfWar: function() {
    this.fogOfWar.lastVisibleRow = 0;
    this.fogOfWar.fadingNodes = new Set();
    this.newlyRevealedNodes = [];
  },
  
  // Update fog of war calculation based on current progress
  updateFogOfWarCalculation: function() {
    if (!this.config.fogOfWarEnabled || !GameState.data) return;
    
    // Find the max row of any visited node
    let maxVisitedRow = 0;
    
    // Include the current node
    if (GameState.data.currentNode) {
      const currentNode = GameState.getNodeById(GameState.data.currentNode);
      if (currentNode && currentNode.position && currentNode.position.row > maxVisitedRow) {
        maxVisitedRow = currentNode.position.row;
      }
    }
    
    // Check all nodes for visited status
    const allNodes = GameState.getAllNodes();
    allNodes.forEach(node => {
      if (node.visited && node.position && node.position.row > maxVisitedRow) {
        maxVisitedRow = node.position.row;
      }
    });
    
    // Update last visible row for fog calculation
    // Allow visibility a certain number of rows ahead
    this.fogOfWar.lastVisibleRow = maxVisitedRow + this.config.fogOfWarDistance;
  },
  
  // Prepare nodes for reveal animations
  prepareNodeRevealAnimations: function() {
    if (!this.config.nodeRevealAnimations) return;
    
    // Only proceed if we have GameState data
    if (!GameState.data || !GameState.data.currentNode) return;
    
    const currentNode = GameState.getNodeById(GameState.data.currentNode);
    if (!currentNode) return;
    
    // Reset the newly revealed nodes array
    this.newlyRevealedNodes = [];
    
    // Get all nodes connected to the current node
    if (currentNode.paths && currentNode.paths.length > 0) {
      currentNode.paths.forEach(targetId => {
        const targetNode = GameState.getNodeById(targetId);
        if (targetNode && !targetNode.visited && targetNode.state === NODE_STATE.AVAILABLE) {
          // This is a newly available node - add to reveal list
          this.newlyRevealedNodes.push(targetId);
          
          // Add to fading nodes set
          this.fogOfWar.fadingNodes.add(targetId);
          
          // Remove from fading set after animation completes
          setTimeout(() => {
            this.fogOfWar.fadingNodes.delete(targetId);
            // Trigger a redraw after animation
            this.renderMap();
          }, this.fogOfWar.revealSpeed);
        }
      });
    }
  },
  
  // This is the key modification to fix the stretched map issue and add fog of war
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
    
    // Increase the logical dimensions for a larger map
    this.logicalWidth = 1200; // Increased from 800
    
    // Calculate height based on rows (more spacing for larger map)
    const rowSpacing = 100; // Increased from 80
    const paddingTop = 120; // Increased from 100
    const paddingBottom = 120; // Increased from 100
    
    // Ensure a much taller map for scrolling
    const minHeight = 1000; // Increased from 600
    this.logicalHeight = Math.max(minHeight, paddingTop + (maxRow * rowSpacing) + paddingBottom);
    
    // Get the container dimensions for display size
    const container = canvas.closest('.map-wrapper');
    const displayWidth = container ? container.clientWidth : this.logicalWidth;
    const displayHeight = container ? container.clientHeight : this.logicalHeight;
    
    // Important! Set BOTH the canvas dimensions AND the CSS style
    // 1. Set the internal canvas size (where drawing happens)
    canvas.width = this.logicalWidth;
    canvas.height = this.logicalHeight;
    
    // 2. Set the display size with CSS - maintain aspect ratio
    // Calculate proper height based on aspect ratio
    const aspectRatio = this.logicalHeight / this.logicalWidth;
    const properHeight = displayWidth * aspectRatio;
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = properHeight + 'px';
    
    // Calculate the scale factors between internal and display size
    this.scaleX = displayWidth / this.logicalWidth;
    this.scaleY = properHeight / this.logicalHeight;
    
    // Clear the canvas
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
    
    // Get floor number for theming
    const currentFloor = GameState.data ? GameState.data.currentFloor || 1 : 1;
    const patternIndex = Math.min(currentFloor - 1, this.backgroundPatterns.length - 1);
    const pattern = this.backgroundPatterns[patternIndex];
    
    // Draw background, particles, connections, and nodes...
    this.drawRetroBackground(ctx, pattern, this.logicalWidth, this.logicalHeight);
    this.drawParticles(ctx);
    this.drawConnections(ctx, this.logicalWidth, this.logicalHeight);
    
    // Draw all nodes
    allNodes.forEach(node => {
      this.drawNode(ctx, node, this.logicalWidth, this.logicalHeight);
    });
    
    // Draw fog of war effect
    if (this.config.fogOfWarEnabled) {
      this.drawFogOfWar(ctx, this.logicalWidth, this.logicalHeight);
    }
    
    // Add subtle CRT scanline effect
    this.drawScanlines(ctx, this.logicalWidth, this.logicalHeight);
    
    // Update map title with floor number
    const mapTitle = document.querySelector('.panel-title, .map-title, h3');
    if (mapTitle && mapTitle.textContent.includes('Floor Map')) {
      mapTitle.textContent = `Floor ${currentFloor} Map`;
    }
    
    // Check if we need scroll indicators
    this.updateScrollIndicators(this.logicalHeight);
  },
  
  // Draw fog of war effect
  drawFogOfWar: function(ctx, width, height) {
    if (!GameState.data) return;
    
    // Only draw fog of war if it's visible in settings
    if (!this.fogOfWar.visible) return;
    
    // Get the last visible row from fog of war state
    const lastVisibleRow = this.fogOfWar.lastVisibleRow;
    
    // Calculate the y-position where fog starts
    const rowSpacing = 80;
    const paddingTop = 100;
    const fogStartY = paddingTop + (lastVisibleRow * rowSpacing) - 20; // Start slightly above last visible row
    
    // Create a gradient for the fog effect
    const gradient = ctx.createLinearGradient(0, fogStartY, 0, fogStartY + 400);
    gradient.addColorStop(0, "rgba(15, 22, 49, 0)");
    gradient.addColorStop(0.2, "rgba(15, 22, 49, 0.4)"); // Less opacity (0.7 → 0.4)
    gradient.addColorStop(0.6, "rgba(15, 22, 49, 0.6)"); // Less opacity (0.85 → 0.6)
    gradient.addColorStop(1, "rgba(15, 22, 49, 0.8)"); // Less opacity (0.95 → 0.8)
    
    // Apply gradient to fog area
    ctx.fillStyle = gradient;
    ctx.fillRect(0, fogStartY, width, height - fogStartY);
    
    // Add a subtle haze over entire map for atmosphere
    ctx.fillStyle = "rgba(15, 22, 49, 0.15)";
    ctx.fillRect(0, 0, width, height);
  },
  
  drawRetroBackground: function(ctx, pattern, width, height) {
    // Clear the canvas to make it fully transparent
    ctx.clearRect(0, 0, width, height);
    
    // No background fill
    // No grid lines
    // No dots
    // No vignette
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
        
        // Check if this connection is in fog of war
        const inFog = this.isNodeInFog(targetNode);
        const sourceInFog = this.isNodeInFog(node);
        
        if (node.visited || node.id === 'start') {
          if (targetNode.state === NODE_STATE.AVAILABLE) {
            // VALID PASSABLE PATH - BRIGHT GREEN
            const baseColor = '#56b886'; // Use secondary color
            ctx.strokeStyle = inFog ? this.adjustColorBrightness(baseColor, -60) : baseColor;
            ctx.lineWidth = 3;
          } else if (targetNode.state === NODE_STATE.COMPLETED) {
            // ALREADY TAKEN PATH - Now using bright BLUE instead of gray
            const baseColor = '#5b8dd9'; // Primary color instead of gray
            ctx.strokeStyle = inFog ? this.adjustColorBrightness(baseColor, -60) : baseColor;
            ctx.lineWidth = 3; // Increased from 2 to be more visible
          } else if (targetNode.state === NODE_STATE.CURRENT) {
            // PATH TO CURRENT NODE - BRIGHT BLUE
            const baseColor = '#5b8dd9'; // Use primary color
            ctx.strokeStyle = inFog ? this.adjustColorBrightness(baseColor, -60) : baseColor;
            ctx.lineWidth = 3;
          } else {
            // INACCESSIBLE PATH - VERY FAINT
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 0;
          }
        } else {
          // All other paths - extremely faint
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.lineWidth = 0;
        }
        
        // Also, if BOTH nodes are completed, make the path even more prominent
        if (node.visited && targetNode.visited) {
          const baseColor = '#9c77db'; // Purple for completed connections
          ctx.strokeStyle = inFog ? this.adjustColorBrightness(baseColor, -60) : baseColor;
          ctx.lineWidth = 3;
        }
        
        // Only draw if at least one node is not in fog
        if (!sourceInFog || !inFog) {
          // If both ends are in fog, don't draw
          // If only one end is in fog, make it faded
          if (sourceInFog || inFog) {
            ctx.globalAlpha = 0.4; // Fade out paths partially in fog
          }
          
          // Draw the connection with pixelated style
          this.drawPixelLine(ctx, startNodeX, startNodeY, endNodeX, endNodeY);
          
          // Reset alpha
          ctx.globalAlpha = 1.0;
          
          // For available paths, add direction indicators
          if (node.visited && targetNode.state === NODE_STATE.AVAILABLE && !inFog) {
            this.drawPathArrow(ctx, startNodeX, startNodeY, endNodeX, endNodeY);
          }
        }
      });
    });
  },
  
  // Check if a node is obscured by fog of war
  isNodeInFog: function(node) {
    if (!this.config.fogOfWarEnabled || !node || !node.position) {
      return false;
    }
    
    // Nodes beyond the visible area are in fog
    return node.position.row > this.fogOfWar.lastVisibleRow;
  },
  
  // Update the drawNode function to ensure nodes are properly drawn
  drawNode: function(ctx, node, width, height) {
    // Use fixed spacing for reliable positioning
    const rowSpacing = 100; // Increase from 80 to 100 for more vertical space
    const colSpacing = 150; // Increase from 120 to 150 for more horizontal space
    
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
    const y = 120 + (node.position.row * rowSpacing); // Move down by increasing from 100 to 120
    
    // Debug output to console
    console.log(`Drawing node ${node.id} at position (${x}, ${y}), row: ${node.position.row}, col: ${node.position.col}`);
    
    // Check if node is in fog of war
    const inFog = this.isNodeInFog(node);
    
    // If in fog and not visited, draw as silhouette only
    if (inFog && !node.visited && node.state !== NODE_STATE.CURRENT) {
      this.drawNodeSilhouette(ctx, node, x, y);
      return;
    }
    
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
    
    // Check if this is a newly revealed node for animation
    const isNewlyRevealed = this.newlyRevealedNodes.includes(node.id);
    const isFading = this.fogOfWar.fadingNodes.has(node.id);
    
    // Apply reveal animation if needed
    if (isNewlyRevealed && isFading) {
      // Scale and opacity animation
      const progress = Math.min(1, this.fogOfWar.fadingNodes.size / 3); // 0-1 value
      
      // Apply scale to context
      ctx.globalAlpha = 0.5 + (0.5 * progress);
      ctx.translate(x, y);
      ctx.scale(0.8 + (0.2 * progress), 0.8 + (0.2 * progress));
      ctx.translate(-x, -y);
      
      // Brighten the colors for reveal effect
      fillColor = this.adjustColorBrightness(fillColor, 30 * progress);
      
      // Add glow effect for revealing
      ctx.shadowColor = fillColor;
      ctx.shadowBlur = 15 * (1 - progress);
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
    if ((node.state === NODE_STATE.AVAILABLE || node.state === NODE_STATE.CURRENT) && !inFog) {
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
  
  // Draw a node silhouette for nodes in fog of war
  drawNodeSilhouette: function(ctx, node, x, y) {
    ctx.save();
    
    // Determine radius based on node type
    let nodeRadius = 25; // Default node radius
    if (node.type === 'boss') {
      nodeRadius = 40;
    } else if (node.type === 'start') {
      nodeRadius = 35;
    }
    
    // Use a dark silhouette fill
    const fillColor = 'rgba(30, 35, 60, 0.4)';
    const strokeColor = 'rgba(60, 70, 100, 0.3)';
    
    // Draw a simple circle for the silhouette
    ctx.beginPath();
    ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add a small question mark for unknown nodes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y);
    
    ctx.restore();
  },
  
  // Update node drawing to match character cards
  drawNodeCard: function(ctx, x, y, width, height, fillColor, shadowColor) {
    // Draw shadow
    ctx.fillStyle = shadowColor;
    ctx.fillRect(x - width/2, y - height/2 + 4, width, height);
    
    // Draw main card
    ctx.fillStyle = fillColor;
    ctx.fillRect(x - width/2, y - height/2, width, height);
    
    // Add highlight
    ctx.beginPath();
    ctx.moveTo(x - width/2, y - height/2);
    ctx.lineTo(x + width/2, y - height/2);
    ctx.strokeStyle = this.adjustColorBrightness(fillColor, 30);
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  
  getNodesInRow: function(rowIndex) {
    if (!GameState || !GameState.getAllNodes) return [];
    
    return GameState.getAllNodes().filter(node => 
      node.position && node.position.row === rowIndex
    ).sort((a, b) => a.position.col - b.position.col);
  },

  // Draw a hexagon shape for start node
  drawStartNode: function(ctx, x, y, radius, fillColor, shadowColor, strokeColor) {
    const sides = 6; // Hexagon has 6 sides
    const angleOffset = Math.PI / 6; // Rotate slightly to make flat sides at top/bottom
    
    // Draw shadow first
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i / sides) + angleOffset;
      const pointX = x + radius * Math.cos(angle);
      const pointY = y + radius * Math.sin(angle) + 4; // Add 4px for shadow offset
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    ctx.fillStyle = shadowColor;
    ctx.fill();
    
    // Draw main hexagon
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i / sides) + angleOffset;
      const pointX = x + radius * Math.cos(angle);
      const pointY = y + radius * Math.sin(angle);
      
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
    
    // Add highlight effect
    ctx.beginPath();
    const highlightAngle1 = angleOffset - Math.PI/6;
    const highlightAngle2 = angleOffset + Math.PI/6;
    ctx.moveTo(x + (radius * 0.6) * Math.cos(highlightAngle1), 
              y + (radius * 0.6) * Math.sin(highlightAngle1));
    ctx.lineTo(x + (radius * 0.6) * Math.cos(highlightAngle2), 
              y + (radius * 0.6) * Math.sin(highlightAngle2));
    ctx.strokeStyle = this.adjustColorBrightness(fillColor, 50);
    ctx.lineWidth = 1;
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
  
  updateScrollIndicators: function(canvasHeight) {
    // Function intentionally left empty to disable scroll indicators
  },
  
  // Also update the click handler to properly translate coordinates
  handleMapClick: function(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const mapWrapper = canvas.closest('.map-wrapper');
    
    // Get click coordinates relative to canvas display size
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top + (mapWrapper ? mapWrapper.scrollTop : 0); // Account for scroll position
    
    // Convert to internal canvas coordinates using scale factors
    const clickX = displayX / this.scaleX;
    const clickY = displayY / this.scaleY;
    
    console.log(`Click at display(${displayX},${displayY}) -> canvas(${clickX},${clickY})`);
    
    // Check if click is on any node
    const allNodes = GameState.getAllNodes();
    const width = canvas.width; // Using internal width
    
    for (const node of allNodes) {
      // Skip start node (can't be clicked)
      if (node.id === 'start') continue;
      
      // Skip nodes that are already visited
      if (node.visited) continue;
      
      // Skip nodes in fog of war
      if (this.config.fogOfWarEnabled && this.isNodeInFog(node)) continue;
      
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