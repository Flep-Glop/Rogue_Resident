// map-renderer-enhancements.js - Enhanced visual cohesion for map rendering

/**
 * Enhances MapRenderer with additional visual effects for a more cohesive look
 * This extends the existing MapRenderer object with new visual functionality
 */
(function() {
  // Store original methods to enhance them
  const originalInitialize = MapRenderer.initialize;
  const originalRenderMap = MapRenderer.renderMap;
  const originalDrawNode = MapRenderer.drawNode;
  const originalDrawConnections = MapRenderer.drawConnections;
  
  /**
   * Enhanced initialize method
   */
  MapRenderer.initialize = function(canvasId) {
    // Call original initialize
    const result = originalInitialize.call(this, canvasId);
    
    // Configure enhanced visual settings
    this.enhancedVisuals = {
      enabled: true,
      glowStrength: 0.6,
      pathWidth: 4,
      nodeShadowDepth: 5,
      backgroundGridSize: 20,
      backgroundGridOpacity: 0.05
    };
    
    // Add window resize handler for responsive canvas
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log("Enhanced map renderer initialized with improved visuals");
    return result;
  };
  
  /**
   * Handle window resize for responsive map
   */
  MapRenderer.handleResize = function() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;
    
    // Get parent container dimensions
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Set canvas dimensions to match container
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Maintain aspect ratio while filling container
    const mapWidth = Math.max(800, containerWidth);
    const mapHeight = Math.max(600, containerHeight);
    
    // Force a re-render with new dimensions
    this.renderMap();
  };
  
  /**
   * Enhanced renderMap with additional visual effects
   */
  MapRenderer.renderMap = function() {
    // Get canvas and context
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
    
    // Find the max row used by any node
    let maxRow = 0;
    allNodes.forEach(node => {
      if (node.position && node.position.row > maxRow) {
        maxRow = node.position.row;
      }
    });
    
    // Calculate canvas dimensions
    const canvasWidth = canvas.width || 800;
    
    // Calculate height based on rows (100px per row plus padding)
    const rowSpacing = 80; // Space between rows
    const paddingTop = 100; // Space at top
    const paddingBottom = 120; // Space at bottom
    const calculatedHeight = paddingTop + (maxRow * rowSpacing) + paddingBottom;
    
    // Use the maximum of calculated height or canvas height to ensure content fits
    const canvasHeight = Math.max(calculatedHeight, canvas.height || 600);
    
    // Set canvas dimensions if needed
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
    
    // Get floor number for theming
    const currentFloor = GameState.data ? GameState.data.currentFloor || 1 : 1;
    const patternIndex = Math.min(currentFloor - 1, this.backgroundPatterns.length - 1);
    const pattern = this.backgroundPatterns[patternIndex];
    
    // Draw retro-style background with enhanced grid
    this.drawEnhancedBackground(ctx, pattern, canvasWidth, canvasHeight);
    
    // Draw ambient floating particles
    this.drawParticles(ctx);
    
    // Draw enhanced glow effect paths for connections
    this.drawEnhancedConnections(ctx, canvasWidth, canvasHeight);
    
    // Draw all nodes with enhanced styling
    allNodes.forEach(node => {
      this.drawEnhancedNode(ctx, node, canvasWidth, canvasHeight);
    });
    
    // Add subtle CRT scanline effect
    this.drawScanlines(ctx, canvasWidth, canvasHeight);
    
    // Draw floor indicator with enhanced style
    this.drawEnhancedFloorIndicator(ctx, currentFloor);
  };
  
  /**
   * Draw enhanced background with depth and grid effects
   */
  MapRenderer.drawEnhancedBackground = function(ctx, pattern, width, height) {
    // Fill with main background color
    ctx.fillStyle = pattern.mainColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw enhanced grid with subtle gradient
    const gridSize = this.enhancedVisuals.backgroundGridSize;
    ctx.strokeStyle = pattern.gridColor;
    ctx.lineWidth = 1;
    
    // Draw grid with subtle transparency gradient
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.globalAlpha = 0.05 + Math.sin(y * 0.01) * 0.02; // Subtle variation
      ctx.stroke();
    }
    
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.globalAlpha = 0.05 + Math.sin(x * 0.01) * 0.02; // Subtle variation
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
    
    // Add depth to grid with subtle dot highlights
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        if ((x % (gridSize * 2) === 0) && (y % (gridSize * 2) === 0)) {
          ctx.fillStyle = pattern.dotColor;
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    }
    
    // Add vignette effect with improved gradient
    const gradient = ctx.createRadialGradient(
      width/2, height/2, Math.min(width, height) * 0.4,
      width/2, height/2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle floor-specific ambient color overlay
    const floorColor = this.backgroundPatterns[patternIndex].accentColor;
    ctx.fillStyle = this.hexToRgba(floorColor, 0.03);
    ctx.fillRect(0, 0, width, height);
  };
  
  /**
   * Draw enhanced connections with glow effects
   */
  MapRenderer.drawEnhancedConnections = function(ctx, width, height) {
    // Call original connections method first
    originalDrawConnections.call(this, ctx, width, height);
    
    // Get all nodes
    const allNodes = GameState.getAllNodes();
    
    // Draw additional glow effects for active paths
    allNodes.forEach(node => {
      if (!node.paths || node.paths.length === 0) return;
      
      // Get nodes in this row for positioning
      const nodesInRow = this.getNodesInRow(node.position.row);
      const columnsInRow = nodesInRow.length;
      
      // Calculate positions
      const rowWidth = columnsInRow * 120;
      const startX = (width - rowWidth) / 2 + 60;
      const colIndex = nodesInRow.indexOf(node);
      const sourceRow = node.position.row;
      const startNodeX = startX + (colIndex * 120);
      const startNodeY = 100 + (sourceRow * 80);
      
      // Only enhance connections for visited or active nodes
      if (node.visited || node.id === 'start' || node.state === NODE_STATE.CURRENT) {
        // Draw paths to each connected node
        node.paths.forEach(targetId => {
          const targetNode = GameState.getNodeById(targetId);
          if (!targetNode) return;
          
          // Get target positioning
          const targetNodesInRow = this.getNodesInRow(targetNode.position.row);
          const targetColumnsInRow = targetNodesInRow.length;
          const targetRowWidth = targetColumnsInRow * 120;
          const targetStartX = (width - targetRowWidth) / 2 + 60;
          const targetColIndex = targetNodesInRow.indexOf(targetNode);
          const targetRow = targetNode.position.row;
          const endNodeX = targetStartX + (targetColIndex * 120);
          const endNodeY = 100 + (targetRow * 80);
          
          // Only add glow to available or current paths
          if (targetNode.state === NODE_STATE.AVAILABLE || 
              targetNode.state === NODE_STATE.CURRENT ||
              (node.visited && targetNode.visited)) {
            
            // Determine color based on path state
            let glowColor;
            if (targetNode.state === NODE_STATE.AVAILABLE) {
              glowColor = '#56b886'; // Secondary/green glow
            } else if (targetNode.state === NODE_STATE.CURRENT) {
              glowColor = '#5b8dd9'; // Primary/blue glow
            } else if (node.visited && targetNode.visited) {
              glowColor = '#9c77db'; // Purple for completed
            } else {
              return; // Skip other path types
            }
            
            // Draw glowing path effect using shadows
            ctx.save();
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = this.enhancedVisuals.pathWidth;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = 0.7;
            
            // Draw the glowing path
            ctx.beginPath();
            ctx.moveTo(startNodeX, startNodeY);
            ctx.lineTo(endNodeX, endNodeY);
            ctx.stroke();
            
            ctx.restore();
          }
        });
      }
    });
  };
  
  /**
   * Draw enhanced node with better styling and effects
   */
  MapRenderer.drawEnhancedNode = function(ctx, node, width, height) {
    // Call the original node drawing method first
    originalDrawNode.call(this, ctx, node, width, height);
    
    // Skip if node doesn't have position
    if (!node.position) return;
    
    // Get nodes in this row for column calculation
    const nodesInRow = this.getNodesInRow(node.position.row);
    const columnsInRow = nodesInRow.length;
    
    // Calculate the starting x position to center nodes in this row
    const rowWidth = columnsInRow * 120;
    const startX = (width - rowWidth) / 2 + 60;
    
    // Get column index of this node within its row
    const colIndex = nodesInRow.indexOf(node);
    
    // Calculate centered position
    const x = startX + (colIndex * 120);
    const y = 100 + (node.position.row * 80);
    
    // Set node radius
    let nodeRadius = 25; // Default node radius
    if (node.type === 'boss') {
      nodeRadius = 40; // Larger radius for boss nodes
    } else if (node.type === 'start') {
      nodeRadius = 35; // Larger radius for starting nodes
    }
    
    // Enhanced state-specific effects
    if (node.state === NODE_STATE.AVAILABLE) {
      // Add pulsing glow for available nodes
      this.drawNodeGlow(ctx, x, y, nodeRadius, '#56b886', 0.6);
      
      // Add subtle movement indicator below the node
      this.drawNodeMovementIndicator(ctx, x, y + nodeRadius + 15);
    } else if (node.state === NODE_STATE.CURRENT) {
      // Add stronger pulsing glow for current node
      this.drawNodeGlow(ctx, x, y, nodeRadius, '#e67e73', 0.7);
    }
    
    // Add node type label below node
    if (node.type !== 'start' && node.type !== 'boss') {
      this.drawNodeTypeLabel(ctx, node, x, y + nodeRadius + 15);
    }
  };
  
  /**
   * Draw glowing effect around node
   */
  MapRenderer.drawNodeGlow = function(ctx, x, y, radius, color, intensity) {
    const time = Date.now() / 1000;
    const pulseSize = Math.sin(time * 2) * 3;
    const glowRadius = radius + 5 + pulseSize;
    
    ctx.save();
    
    // Outer glow
    const gradient = ctx.createRadialGradient(
      x, y, radius - 2,
      x, y, glowRadius + 10
    );
    gradient.addColorStop(0, this.hexToRgba(color, intensity * 0.7));
    gradient.addColorStop(0.5, this.hexToRgba(color, intensity * 0.3));
    gradient.addColorStop(1, this.hexToRgba(color, 0));
    
    ctx.beginPath();
    ctx.arc(x, y, glowRadius + 10, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.restore();
  };
  
  /**
   * Draw movement indicator arrow below node
   */
  MapRenderer.drawNodeMovementIndicator = function(ctx, x, y) {
    const time = Date.now() / 1000;
    const bounce = Math.sin(time * 3) * 3;
    
    ctx.save();
    ctx.translate(x, y + bounce);
    
    // Draw arrow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    // Triangle arrow
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(6, -6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  };
  
  /**
   * Draw node type label below the node
   */
  MapRenderer.drawNodeTypeLabel = function(ctx, node, x, y) {
    ctx.save();
    
    // Set text style
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    
    // Format node type name
    let nodeType = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    nodeType = nodeType.replace(/_/g, ' ');
    
    // Draw text
    ctx.fillText(nodeType, x, y);
    
    ctx.restore();
  };
  
  /**
   * Draw enhanced floor indicator
   */
  MapRenderer.drawEnhancedFloorIndicator = function(ctx, floorNumber) {
    ctx.save();
    
    // Position in top center
    const badgeX = ctx.canvas.width / 2;
    const badgeY = 30;
    
    // Draw badge background with shadow
    const badgeWidth = 140;
    const badgeHeight = 40;
    
    // Background shadow
    ctx.fillStyle = '#292b36';
    ctx.fillRect(badgeX - badgeWidth/2 + 4, badgeY - badgeHeight/2 + 4, badgeWidth, badgeHeight);
    
    // Badge main body
    ctx.fillStyle = '#3d4c60';
    ctx.fillRect(badgeX - badgeWidth/2, badgeY - badgeHeight/2, badgeWidth, badgeHeight);
    
    // Badge border with glow
    ctx.strokeStyle = '#5b8dd9';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#5b8dd9';
    ctx.shadowBlur = 10;
    ctx.strokeRect(badgeX - badgeWidth/2, badgeY - badgeHeight/2, badgeWidth, badgeHeight);
    
    // Reset shadow for text
    ctx.shadowBlur = 0;
    
    // Badge title text
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#5b8dd9';
    ctx.shadowBlur = 8;
    ctx.fillText(`FLOOR ${floorNumber}`, badgeX, badgeY + 5);
    
    ctx.restore();
  };
  
  /**
   * Utility function to convert hex color to rgba
   */
  MapRenderer.hexToRgba = function(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
})();