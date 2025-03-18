// enhanced-hexagonal-map-renderer.js - Adds hexagonal nodes and responsive layout

/**
 * Enhances MapRenderer with hexagonal nodes and better positioning
 */
(function() {
  // Store original methods
  const originalInitialize = MapRenderer.initialize;
  const originalRenderMap = MapRenderer.renderMap;
  const originalDrawNode = MapRenderer.drawNode;
  
  /**
   * Enhanced initialize method
   */
  MapRenderer.initialize = function(canvasId) {
    // Call original initialize
    const result = originalInitialize.call(this, canvasId);
    
    // Configure for hexagonal nodes
    this.hexagonalConfig = {
      enabled: true,
      // More space between rows for hexagons
      rowSpacing: 120,
      // More space between columns
      colSpacing: 150,
      // Top padding for the map
      paddingTop: 150,
      // Size of hexagons (distance from center to corner)
      nodeSize: 30,
      // Pixel size for node borders (thicker for pixelated look)
      borderWidth: 2,
      // Maintain aspect ratio for responsive canvas
      maintainAspectRatio: true,
      // Use flat-top orientation (false) or pointy-top (true)
      pointyTop: false,
      // Grid size for background
      gridSize: 30,
      // Letter style (pixelated)
      pixelLetters: true
    };
    
    // Add window resize handler with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResponsiveResize();
      }, 200); // 200ms debounce
    });
    
    // Initial resize handling
    this.handleResponsiveResize();
    
    console.log("Enhanced hexagonal map renderer initialized");
    return result;
  };
  
  /**
   * Handle responsive resize for better layout
   */
  MapRenderer.handleResponsiveResize = function() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;
    
    // Get container dimensions
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Get current game state to determine map size needs
    const allNodes = GameState.getAllNodes ? GameState.getAllNodes() : [];
    
    // Find max row and column
    let maxRow = 0;
    let maxCol = 0;
    let rowCounts = {};
    
    allNodes.forEach(node => {
      if (!node.position) return;
      
      maxRow = Math.max(maxRow, node.position.row);
      
      // Track how many nodes in each row
      rowCounts[node.position.row] = (rowCounts[node.position.row] || 0) + 1;
    });
    
    // Find max columns in any row
    Object.keys(rowCounts).forEach(row => {
      maxCol = Math.max(maxCol, rowCounts[row]);
    });
    
    // Calculate minimum required dimensions
    const minRequiredWidth = this.hexagonalConfig.paddingTop + 
                           maxCol * this.hexagonalConfig.colSpacing + 100;
    const minRequiredHeight = this.hexagonalConfig.paddingTop + 
                            maxRow * this.hexagonalConfig.rowSpacing + 100;
    
    // Set canvas size to container size, ensuring it's large enough for content
    const canvasWidth = Math.max(containerWidth, minRequiredWidth);
    const canvasHeight = Math.max(containerHeight, minRequiredHeight);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Force re-render with new dimensions
    this.renderMap();
  };
  
  /**
   * Override the renderMap method
   */
  MapRenderer.renderMap = function() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get all nodes
    const allNodes = GameState.getAllNodes();
    
    // Get current floor for theming
    const currentFloor = GameState.data ? GameState.data.currentFloor || 1 : 1;
    const patternIndex = Math.min(currentFloor - 1, this.backgroundPatterns.length - 1);
    const pattern = this.backgroundPatterns[patternIndex];
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw enhanced grid background
    this.drawEnhancedGridBackground(ctx, canvas.width, canvas.height, pattern);
    
    // Draw floor title
    this.drawFloorTitle(ctx, currentFloor);
    
    // Draw connections between nodes
    this.drawHexagonalConnections(ctx, allNodes, canvas.width, canvas.height);
    
    // Draw all nodes with hexagonal styling
    allNodes.forEach(node => {
      this.drawHexagonalNode(ctx, node, canvas.width, canvas.height);
    });
  };
  
  /**
   * Draw enhanced grid background
   */
  MapRenderer.drawEnhancedGridBackground = function(ctx, width, height, pattern) {
    // Fill with main background color
    ctx.fillStyle = '#1a1f2e'; // Darker blue background like in Image 3
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid with subtle lines
    const gridSize = this.hexagonalConfig.gridSize;
    ctx.strokeStyle = '#2a3040'; // Subtle grid lines
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5); // 0.5 offset for crisp lines
      ctx.lineTo(width, y + 0.5);
      ctx.globalAlpha = 0.4;
      ctx.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.globalAlpha = 0.4;
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
  };
  
  /**
   * Draw floor title in the pixelated style
   */
  MapRenderer.drawFloorTitle = function(ctx, floorNumber) {
    ctx.save();
    
    // Position at top left like in Image 3
    const textX = 20;
    const textY = 40;
    
    // Draw pixelated title
    ctx.font = 'bold 32px "Press Start 2P", monospace';
    ctx.fillStyle = '#5b8dd9'; // Blue title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FLOOR MAP`, textX, textY);
    
    // Add floor number as subtitle if beyond floor 1
    if (floorNumber > 1) {
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.fillStyle = '#56b886'; // Green subtitle
      ctx.fillText(`FLOOR ${floorNumber}`, textX, textY + 30);
    }
    
    // Add horizontal line below title
    ctx.strokeStyle = '#5b8dd9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, textY + 40);
    ctx.lineTo(ctx.canvas.width, textY + 40);
    ctx.stroke();
    
    ctx.restore();
  };
  
  /**
   * Draw connections between hexagonal nodes
   */
  MapRenderer.drawHexagonalConnections = function(ctx, allNodes, width, height) {
    // Calculate node positions first
    const nodePositions = {};
    
    allNodes.forEach(node => {
      if (!node.position) return;
      
      const pos = this.calculateHexNodePosition(node, width, height);
      nodePositions[node.id] = pos;
    });
    
    // Now draw all connections
    allNodes.forEach(node => {
      if (!node.paths || node.paths.length === 0 || !node.position) return;
      
      const startPos = nodePositions[node.id];
      if (!startPos) return;
      
      // Draw paths to each connected node
      node.paths.forEach(targetId => {
        const targetNode = GameState.getNodeById(targetId);
        if (!targetNode || !targetNode.position) return;
        
        const endPos = nodePositions[targetId];
        if (!endPos) return;
        
        // Determine path style based on node states
        let pathColor, pathWidth, pathAlpha;
        
        if (node.visited && targetNode.visited) {
          // Completed path
          pathColor = '#56b886'; // Green
          pathWidth = 3;
          pathAlpha = 0.7;
        } else if (node.visited && targetNode.state === NODE_STATE.AVAILABLE) {
          // Available path
          pathColor = '#5b8dd9'; // Blue
          pathWidth = 3;
          pathAlpha = 0.9;
        } else if (node.state === NODE_STATE.CURRENT || targetNode.state === NODE_STATE.CURRENT) {
          // Current node path
          pathColor = '#e67e73'; // Red
          pathWidth = 3;
          pathAlpha = 0.9;
        } else {
          // Inactive path
          pathColor = '#3a4050'; // Dark gray
          pathWidth = 2;
          pathAlpha = 0.5;
        }
        
        // Draw the path
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = pathWidth;
        ctx.globalAlpha = pathAlpha;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });
    });
  };
  
  /**
   * Calculate position for a hexagonal node
   */
  MapRenderer.calculateHexNodePosition = function(node, width, height) {
    if (!node.position) return { x: 0, y: 0 };
    
    // Get all nodes in this row to determine centering
    const nodesInRow = this.getNodesInRow(node.position.row);
    const nodeCount = nodesInRow.length;
    
    // Calculate horizontal spacing for this row
    const rowWidth = nodeCount * this.hexagonalConfig.colSpacing;
    const startX = (width - rowWidth) / 2 + this.hexagonalConfig.colSpacing / 2;
    
    // Find node's position in row (index)
    const rowIndex = nodesInRow.indexOf(node);
    
    // Calculate the x position (centered in row)
    const x = startX + rowIndex * this.hexagonalConfig.colSpacing;
    
    // Calculate the y position
    const y = this.hexagonalConfig.paddingTop + node.position.row * this.hexagonalConfig.rowSpacing;
    
    return { x, y };
  };
  
  /**
   * Draw a hexagonal node
   */
  MapRenderer.drawHexagonalNode = function(ctx, node, width, height) {
    if (!node.position) return;
    
    // Get position
    const pos = this.calculateHexNodePosition(node, width, height);
    const x = pos.x;
    const y = pos.y;
    
    // Determine node size based on type
    let nodeSize = this.hexagonalConfig.nodeSize;
    if (node.type === 'boss') {
      nodeSize *= 1.2;
    } else if (node.type === 'start') {
      nodeSize *= 1.1;
    }
    
    // Determine colors based on node type and state
    let fillColor, borderColor, textColor;
    
    // Get base color from node type
    fillColor = NodeRegistry.getNodeType(node.type).color || '#999999';
    
    // Adjust based on state
    if (node.state === NODE_STATE.CURRENT) {
      borderColor = '#FFFFFF';
      textColor = '#FFFFFF';
    } else if (node.state === NODE_STATE.COMPLETED) {
      borderColor = '#56b886'; // Green border for completed
      textColor = '#FFFFFF';
      fillColor = this.adjustColorBrightness(fillColor, -20); // Darker fill
    } else if (node.state === NODE_STATE.AVAILABLE) {
      borderColor = '#FFFFFF';
      textColor = '#FFFFFF';
    } else {
      borderColor = '#3a4050'; // Dark border for locked
      textColor = '#FFFFFF';
      fillColor = this.adjustColorBrightness(fillColor, -40); // Much darker fill
    }
    
    // Draw the hexagon shape - flat-top orientation
    ctx.save();
    
    // Draw shadow/glow based on state
    if (node.state === NODE_STATE.AVAILABLE) {
      // Available nodes get a glow
      this.drawHexagonalGlow(ctx, x, y, nodeSize, '#5b8dd9', 0.3);
    } else if (node.state === NODE_STATE.CURRENT) {
      // Current node gets a brighter glow
      this.drawHexagonalGlow(ctx, x, y, nodeSize, '#e67e73', 0.5);
    }
    
    // Draw main hexagon shape with pixel-perfect corners
    ctx.beginPath();
    
    if (this.hexagonalConfig.pointyTop) {
      // Pointy-top orientation
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + nodeSize * Math.cos(angle);
        const hy = y + nodeSize * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(Math.floor(hx) + 0.5, Math.floor(hy) + 0.5);
        } else {
          ctx.lineTo(Math.floor(hx) + 0.5, Math.floor(hy) + 0.5);
        }
      }
    } else {
      // Flat-top orientation (like in Image 3)
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + nodeSize * Math.cos(angle);
        const hy = y + nodeSize * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(Math.floor(hx) + 0.5, Math.floor(hy) + 0.5);
        } else {
          ctx.lineTo(Math.floor(hx) + 0.5, Math.floor(hy) + 0.5);
        }
      }
    }
    
    ctx.closePath();
    
    // Fill the hexagon
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = this.hexagonalConfig.borderWidth;
    ctx.stroke();
    
    // Draw the node symbol/letter in pixel style
    let symbol = this.getNodeSymbol(node.type);
    
    // Draw pixelated letter in the center
    if (this.hexagonalConfig.pixelLetters) {
      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.fillText(symbol, x, y);
    } else {
      // Use regular font as fallback
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.fillText(symbol, x, y);
    }
    
    ctx.restore();
  };
  
  /**
   * Draw a glow effect for hexagonal nodes
   */
  MapRenderer.drawHexagonalGlow = function(ctx, x, y, size, color, intensity) {
    const glowSize = size + 5;
    
    ctx.save();
    
    // Draw outer glow
    ctx.beginPath();
    if (this.hexagonalConfig.pointyTop) {
      // Pointy-top orientation
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + glowSize * Math.cos(angle);
        const hy = y + glowSize * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
    } else {
      // Flat-top orientation
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + glowSize * Math.cos(angle);
        const hy = y + glowSize * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
    }
    ctx.closePath();
    
    // Create gradient for glow
    const gradient = ctx.createRadialGradient(x, y, size * 0.8, x, y, glowSize * 1.2);
    gradient.addColorStop(0, this.hexToRgba(color, intensity));
    gradient.addColorStop(1, this.hexToRgba(color, 0));
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.restore();
  };
  
  /**
   * Utility to convert hex color to rgba
   */
  MapRenderer.hexToRgba = function(hex, alpha) {
    // Handle invalid hex values
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
      return `rgba(100, 100, 100, ${alpha})`; // Fallback gray color
    }
    
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return `rgba(100, 100, 100, ${alpha})`; // Fallback
    }
  };
  
  /**
   * Helper to adjust color brightness
   */
  MapRenderer.adjustColorBrightness = function(hex, percent) {
    // Handle invalid hex values
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
      return hex; // Return unchanged
    }
    
    try {
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
    } catch (e) {
      return hex; // Return unchanged
    }
  };
  
  /**
   * Get node symbol based on type
   */
  MapRenderer.getNodeSymbol = function(nodeType) {
    // Get symbol from registry, or provide default mapping
    const symbolMap = {
      'start': 'S',
      'boss': 'B',
      'question': 'Q',
      'elite': 'E',
      'treasure': 'T',
      'rest': 'R',
      'shop': '$',
      'event': '!',
      'gamble': 'G',
      'patient_case': 'P'
    };
    
    // Try to get from registry first
    const registryType = NodeRegistry.getNodeType(nodeType);
    if (registryType && registryType.symbol) {
      return registryType.symbol;
    }
    
    // Fall back to our mapping
    return symbolMap[nodeType] || '?';
  };
})();