// map_renderer_enhancements.js - Enhanced map renderer for immersive layout

/**
 * Enhances the existing MapRenderer with features specific to the immersive layout
 */
(function() {
  // Store original methods to enhance them
  const originalInitialize = MapRenderer.initialize;
  const originalRenderMap = MapRenderer.renderMap;
  const originalGetNodeColor = MapRenderer.getNodeColor;
  
  /**
   * Enhanced initialize method
   */
  MapRenderer.initialize = function(canvasId) {
    // Call original initialize
    const result = originalInitialize.call(this, canvasId);
    
    // Add specific handling for immersive layout
    this.isImmersiveLayout = document.body.classList.contains('modern-layout');
    
    // Configure for immersive layout
    if (this.isImmersiveLayout) {
      // Adjust node spacing and size for better map view
      this.config.gridSize = 60; // Larger grid for more space between nodes
      
      // Update canvas dimensions when window resizes
      window.addEventListener('resize', this.handleResize.bind(this));
      this.handleResize();
    }
    
    return result;
  };
  
  /**
   * Handle window resize for responsive map
   */
  MapRenderer.handleResize = function() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;
    
    // Set canvas to full container size
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Force map re-render with new dimensions
    this.renderMap();
  };
  
  /**
   * Enhanced renderMap method for immersive layout
   */
  MapRenderer.renderMap = function() {
    // Call original renderMap method
    originalRenderMap.call(this);
    
    // Additional rendering for immersive layout
    if (this.isImmersiveLayout) {
      const canvas = document.getElementById(this.canvasId);
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Add subtle vignette effect around edges
      this.drawVignette(ctx, canvas.width, canvas.height);
      
      // Draw floor level indicator
      const currentFloor = GameState.data ? GameState.data.currentFloor || 1 : 1;
      this.drawEnhancedFloorIndicator(ctx, currentFloor);
    }
  };
  
  /**
   * Draw vignette effect for immersive feel
   */
  MapRenderer.drawVignette = function(ctx, width, height) {
    const gradient = ctx.createRadialGradient(
      width/2, height/2, Math.min(width, height) * 0.4, // Inner radius at 40% of smaller dimension
      width/2, height/2, Math.max(width, height) * 0.7  // Outer radius
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };
  
  /**
   * Draw enhanced floor indicator
   */
  MapRenderer.drawEnhancedFloorIndicator = function(ctx, floorNumber) {
    ctx.save();
    
    // Position in top center
    const textX = ctx.canvas.width / 2;
    const textY = 30;
    
    // Draw glowing text
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Glow effect
    ctx.shadowColor = '#5b8dd9';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`FLOOR ${floorNumber}`, textX, textY);
    
    ctx.restore();
  };
  
  /**
   * Enhanced node color method for better visibility
   */
  MapRenderer.getNodeColor = function(nodeType) {
    // Get the original color
    const originalColor = originalGetNodeColor.call(this, nodeType);
    
    // For immersive layout, we might want to enhance certain colors for better visibility
    if (this.isImmersiveLayout) {
      // Brighten certain node types for better visibility against dark background
      if (nodeType === 'shop' || nodeType === 'treasure') {
        return this.adjustColorBrightness(originalColor, 20);
      }
    }
    
    return originalColor;
  };

  /**
   * Enhanced node rendering for immersive layout
   */
  const originalDrawNode = MapRenderer.drawNode;
  MapRenderer.drawNode = function(ctx, node, width, height) {
    // Call original implementation
    originalDrawNode.call(this, ctx, node, width, height);
    
    // Add enhanced effects for immersive layout
    if (this.isImmersiveLayout && node) {
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
      
      // Add node type label below standard nodes
      if (node.type !== 'start' && node.type !== 'boss') {
        this.drawNodeLabel(ctx, node, x, y);
      }
      
      // Add special effects for available and current nodes
      if (node.state === NODE_STATE.AVAILABLE || node.state === NODE_STATE.CURRENT) {
        this.drawNodeHighlight(ctx, node, x, y);
      }
    }
  };
  
  /**
   * Draw node type label
   */
  MapRenderer.drawNodeLabel = function(ctx, node, x, y) {
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    
    // Get display name for node type
    let nodeName = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    // Replace underscores with spaces
    nodeName = nodeName.replace(/_/g, ' ');
    
    // Draw text with outline for better visibility
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(nodeName, x, y + 35);
    ctx.restore();
  };
  
  /**
   * Draw highlight effect for interactive nodes
   */
  MapRenderer.drawNodeHighlight = function(ctx, node, x, y) {
    ctx.save();
    
    // Create pulsing highlight around the node
    const time = Date.now() / 1000;
    const pulseSize = 5 + Math.sin(time * 2) * 2;
    const radius = 25 + pulseSize;
    
    // Different colors for available vs current
    let glowColor;
    if (node.state === NODE_STATE.AVAILABLE) {
      glowColor = 'rgba(91, 141, 217, 0.4)'; // Blue glow
    } else {
      glowColor = 'rgba(230, 126, 115, 0.4)'; // Red glow
    }
    
    // Draw glow circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Create gradient for better glow effect
    const gradient = ctx.createRadialGradient(
      x, y, radius - 5,
      x, y, radius + 5
    );
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.restore();
  };
})();