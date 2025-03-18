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
    
    // Get current floor
    const currentFloor = GameState.data ? GameState.data.currentFloor || 1 : 1;
    
    // Set canvas dimensions only if needed
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    this.drawEnhancedBackground(ctx, canvas.width, canvas.height);
    
    // Draw floor title
    this.drawFloorTitle(ctx, currentFloor);
    
    // Draw connections between nodes
    this.drawHexagonalConnections(ctx, allNodes, canvas.width, canvas.height);
    
    // Draw all nodes
    allNodes.forEach(node => {
      this.drawHexagonalNode(ctx, node, canvas.width, canvas.height);
    });
  };
  
  /**
   * Draw enhanced grid background
   */
  MapRenderer.drawEnhancedBackground = function(ctx, width, height) {
    // Fill with dark blue background like in image
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid with subtle lines
    ctx.strokeStyle = '#2a3040';
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.globalAlpha = 0.4;
      ctx.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 0; x < width; x += 30) {
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
    
    // Position matching the image
    const textX = 20;
    const textY = 40;
    
    // Draw pixelated title
    ctx.font = 'bold 32px "Press Start 2P", monospace';
    ctx.fillStyle = '#5b8dd9'; // Blue title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FLOOR MAP`, textX, textY);
    
    // Add horizontal line below title matching image
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
        
        // Determine path style - simplified to match image
        let pathColor, pathWidth;
        
        pathColor = '#3d5173'; // Default blue-gray path
        pathWidth = 3;
        
        // Active paths are slightly brighter blue
        if ((node.visited || node.state === NODE_STATE.CURRENT) && 
            (targetNode.state === NODE_STATE.AVAILABLE || targetNode.state === NODE_STATE.CURRENT)) {
          pathColor = '#5b8dd9';
        }
        
        // Draw the path
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = pathWidth;
        ctx.stroke();
      });
    });
  };
  
  /**
   * Calculate position for a hexagonal node
   */
  MapRenderer.calculateHexNodePosition = function(node, width, height) {
    if (!node.position) return { x: 0, y: 0 };
    
    // Get all nodes in this row for determining centering
    const nodesInRow = this.getNodesInRow(node.position.row);
    const nodeCount = nodesInRow.length;
    
    // Calculate horizontal spacing for this row
    const rowWidth = nodeCount * 150; // Wider spacing to match image
    const startX = (width - rowWidth) / 2 + 75;
    
    // Find node's position in row
    const rowIndex = nodesInRow.indexOf(node);
    
    // Calculate the x position (centered in row)
    const x = startX + rowIndex * 150;
    
    // Calculate the y position - more vertical spacing to match image
    const y = 150 + node.position.row * 120;
    
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
    let nodeSize = 30; // Default size to match image
    if (node.type === 'boss') {
      nodeSize *= 1.1; // Slightly larger for boss
    } else if (node.type === 'start') {
      nodeSize *= 1.1; // Slightly larger for start
    }
    
    // Determine colors based on node type and state
    let fillColor, borderColor, textColor;
    
    // Get base color from node type
    switch (node.type) {
      case 'start':
        fillColor = '#56b886'; // Green
        break;
      case 'boss':
        fillColor = '#e67e73'; // Red
        break;
      case 'question':
        fillColor = '#5b8dd9'; // Blue
        break;
      case 'elite':
        fillColor = '#9c77db'; // Purple
        break;
      case 'treasure':
        fillColor = '#5bbcd9'; // Light blue
        break;
      case 'rest':
        fillColor = '#f0c866'; // Yellow
        break;
      default:
        fillColor = NodeRegistry.getNodeType(node.type).color || '#999999';
    }
    
    borderColor = 'white'; // White border for all nodes
    textColor = 'white'; // White text for all nodes
    
    // Dimmer for locked nodes
    if (node.state !== NODE_STATE.AVAILABLE && 
        node.state !== NODE_STATE.CURRENT && 
        node.state !== NODE_STATE.COMPLETED) {
      fillColor = this.adjustColorBrightness(fillColor, -40);
      borderColor = '#3a4050';
    }
    
    ctx.save();
    
    // Draw flat-top hexagon to match image
    ctx.beginPath();
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
    ctx.closePath();
    
    // Fill the hexagon
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Draw border - crisp 2px white border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw the node symbol/letter in pixel style
    let symbol = this.getNodeSymbol(node.type);
    
    // Draw pixelated letter in the center - exactly as in image
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.fillText(symbol, x, y);
    
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