// map-scaling.js - Enhanced map renderer with scaling options
// Save this to: medical_physics_game/static/js/ui/map-scaling.js

/**
 * MapScaling - Extension for MapRenderer to allow for dynamic map scaling
 * Enhances the existing map rendering with responsive scaling and better visuals
 */
const MapScaling = {
    // Configuration
    config: {
      baseWidth: 800,       // Original map width
      baseHeight: 600,      // Original map height
      scaleFactor: 1.0,     // Default scale factor
      autoScale: true,      // Whether to auto-scale to fit container
      maxScaleFactor: 2.0,  // Maximum allowed scale factor
      padding: 20,          // Padding around map edges
      useHiDPI: true,       // Support high DPI displays
      enhanceVisuals: true, // Use enhanced node visuals
      debugInfo: false      // Show debug info
    },
    
    // State tracking
    state: {
      originalRenderFunction: null,
      originalDrawNodeFunction: null,
      initialized: false,
      currentWidth: 0,
      currentHeight: 0,
      pixelRatio: 1
    },
    
    /**
     * Initialize map scaling
     * @param {Object} options - Configuration options
     */
    initialize: function(options = {}) {
      // Already initialized
      if (this.state.initialized) return;
      
      console.log("MapScaling: Initializing...");
      
      // Merge config options
      this.config = {...this.config, ...options};
      
      // Make sure MapRenderer exists
      if (typeof MapRenderer === 'undefined') {
        console.error("MapScaling: MapRenderer not found");
        return false;
      }
      
      // Store original functions for later reference
      this.state.originalRenderFunction = MapRenderer.renderMap;
      
      if (MapRenderer.drawNode) {
        this.state.originalDrawNodeFunction = MapRenderer.drawNode;
      }
      
      // Get pixel ratio for HiDPI support
      this.state.pixelRatio = this.config.useHiDPI ? 
        (window.devicePixelRatio || 1) : 1;
      
      // Replace rendering functions
      this.patchMapRenderer();
      
      // Add resize listener for responsive scaling
      if (this.config.autoScale) {
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initial resize calculation
        setTimeout(this.handleResize.bind(this), 100);
      }
      
      this.state.initialized = true;
      
      console.log("MapScaling: Initialized with scale factor", this.config.scaleFactor);
      
      return true;
    },
    
    /**
     * Patch the MapRenderer with enhanced functions
     */
    patchMapRenderer: function() {
      const self = this;
      
      // Replace the main render function
      MapRenderer.renderMap = function() {
        self.enhancedRenderMap.apply(this, arguments);
      };
      
      // Replace the drawNode function if it exists
      if (MapRenderer.drawNode) {
        MapRenderer.drawNode = function() {
          self.enhancedDrawNode.apply(this, arguments);
        };
      }
      
      // Add our scaling function to MapRenderer
      MapRenderer.setScale = function(scale) {
        self.setScaleFactor(scale);
      };
      
      // Add container resize detection
      MapRenderer.updateSize = function() {
        self.updateMapDimensions();
      };
      
      console.log("MapScaling: Patched MapRenderer functions");
    },
    
    /**
     * Enhanced render map function with scaling
     */
    enhancedRenderMap: function() {
      // Reference to the original MapRenderer
      const mapRenderer = this;
      
      // Get canvas and context
      const canvas = mapRenderer.canvas;
      if (!canvas) return;
      
      const ctx = mapRenderer.ctx;
      if (!ctx) return;
      
      // Ensure canvas dimensions are updated
      MapScaling.updateMapDimensions();
      
      // Apply DPI scaling for crisp rendering
      const pixelRatio = MapScaling.state.pixelRatio;
      
      // Clear canvas with the proper dimensions
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get game state and map data
      const gameState = mapRenderer.gameState || window.GameState;
      if (!gameState || !gameState.data || !gameState.data.map) {
        console.warn("MapScaling: No map data available");
        return;
      }
      
      const mapData = gameState.data.map;
      const nodes = mapData.nodes || [];
      
      // Calculate scaled node size
      const nodeRadius = 20 * MapScaling.config.scaleFactor;
      
      // Draw connections between nodes
      if (Array.isArray(nodes)) {
        // First pass: draw paths
        MapScaling.drawPaths(ctx, nodes, nodeRadius);
        
        // Second pass: draw nodes
        nodes.forEach(node => {
          if (typeof mapRenderer.drawNode === 'function') {
            mapRenderer.drawNode(ctx, node, nodeRadius);
          } else {
            // Fallback if drawNode doesn't exist
            MapScaling.drawSimpleNode(ctx, node, nodeRadius);
          }
        });
      }
      
      // Draw debug info if enabled
      if (MapScaling.config.debugInfo) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '12px monospace';
        ctx.fillText(`Map Scale: ${MapScaling.config.scaleFactor.toFixed(2)}x`, 10, 20);
        ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 10, 40);
        ctx.fillText(`Pixel Ratio: ${pixelRatio}`, 10, 60);
        ctx.restore();
      }
    },
    
    /**
     * Draw paths between nodes
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} nodes - Array of node objects
     * @param {number} nodeRadius - Radius of nodes
     */
    drawPaths: function(ctx, nodes, nodeRadius) {
      // Get game state
      const gameState = window.GameState;
      if (!gameState) return;
      
      const currentNode = gameState.data.current_node;
      const completedNodes = gameState.data.completed_nodes || [];
      
      nodes.forEach(node => {
        if (node.paths && Array.isArray(node.paths)) {
          node.paths.forEach(pathNodeId => {
            // Find the target node
            const targetNode = nodes.find(n => n.id === pathNodeId);
            if (!targetNode) return;
            
            // Calculate start and end positions
            const startX = node.position.x * MapScaling.config.scaleFactor;
            const startY = node.position.y * MapScaling.config.scaleFactor;
            const endX = targetNode.position.x * MapScaling.config.scaleFactor;
            const endY = targetNode.position.y * MapScaling.config.scaleFactor;
            
            // Calculate path properties
            const pathLength = Math.sqrt(
              Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
            );
            const angle = Math.atan2(endY - startY, endX - startX);
            
            // Determine path status
            let pathClass = 'node-path--locked';
            
            // Path is active if current node is one of the connected nodes
            if (node.id === currentNode || targetNode.id === currentNode) {
              pathClass = 'node-path--active';
            }
            
            // Path is completed if both connected nodes are completed
            if (completedNodes.includes(node.id) && completedNodes.includes(targetNode.id)) {
              pathClass = 'node-path--completed';
            }
            
            // Set path style based on status
            ctx.save();
            
            switch (pathClass) {
              case 'node-path--active':
                ctx.strokeStyle = '#5b8dd9'; // Primary blue
                ctx.lineWidth = 4 * MapScaling.config.scaleFactor;
                ctx.globalAlpha = 0.8;
                // Add glow effect
                ctx.shadowColor = '#5b8dd9';
                ctx.shadowBlur = 5 * MapScaling.config.scaleFactor;
                break;
                
              case 'node-path--completed':
                ctx.strokeStyle = '#56b886'; // Secondary green
                ctx.lineWidth = 3 * MapScaling.config.scaleFactor;
                ctx.globalAlpha = 0.6;
                break;
                
              default: // locked
                ctx.strokeStyle = '#a7adb5'; // Dark gray
                ctx.lineWidth = 2 * MapScaling.config.scaleFactor;
                ctx.globalAlpha = 0.3;
            }
            
            // Draw the path
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            ctx.restore();
          });
        }
      });
    },
    
    /**
     * Enhanced node drawing function
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} node - Node object
     * @param {number} radius - Node radius
     */
    enhancedDrawNode: function(ctx, node, radius) {
      // Only enhance if requested
      if (!MapScaling.config.enhanceVisuals) {
        // Call original draw function with scaled radius
        if (MapScaling.state.originalDrawNodeFunction) {
          return MapScaling.state.originalDrawNodeFunction.call(this, ctx, node, radius);
        } else {
          return MapScaling.drawSimpleNode(ctx, node, radius);
        }
      }
      
      // Get node position
      const x = node.position.x * MapScaling.config.scaleFactor;
      const y = node.position.y * MapScaling.config.scaleFactor;
      
      // Get game state
      const gameState = window.GameState;
      if (!gameState) return;
      
      const currentNode = gameState.data.current_node;
      const completedNodes = gameState.data.completed_nodes || [];
      
      // Determine node status
      let nodeClass = 'map-node--locked';
      
      if (node.id === currentNode) {
        nodeClass = 'map-node--current';
      } else if (completedNodes.includes(node.id)) {
        nodeClass = 'map-node--completed';
      } else if (node.available) {
        nodeClass = 'map-node--available';
      }
      
      // Get node type and corresponding color
      const nodeType = node.type || 'default';
      let color = '#808080'; // Default gray
      
      // Map node types to colors (should match CSS variables)
      const nodeColors = {
        start: '#56b886', // Secondary green
        boss: '#e67e73',  // Danger red
        question: '#5b8dd9', // Primary blue
        elite: '#d35db3', // Elite pink
        treasure: '#f0c866', // Warning yellow
        rest: '#9c77db', // Rest purple
        shop: '#5bbcd9', // Shop cyan
        event: '#e99c50', // Event orange
        gamble: '#b8d458', // Gamble lime
        patient_case: '#4acf8b' // Patient case bright green
      };
      
      // Get color based on node type
      if (nodeColors[nodeType]) {
        color = nodeColors[nodeType];
      }
      
      // Set alpha based on node status
      let alpha = 1.0;
      if (nodeClass === 'map-node--locked') {
        alpha = 0.5;
      } else if (nodeClass === 'map-node--completed') {
        alpha = 0.7;
      }
      
      // Get node icon
      const icon = this.getNodeIcon ? this.getNodeIcon(nodeType) : nodeType.charAt(0).toUpperCase();
      
      // Draw node with enhanced visual effects
      ctx.save();
      
      // For current and available nodes, add glow effect
      if (nodeClass === 'map-node--current' || nodeClass === 'map-node--available') {
        ctx.shadowColor = color;
        ctx.shadowBlur = (nodeClass === 'map-node--current' ? 15 : 8) * MapScaling.config.scaleFactor;
      }
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      
      // Add subtle border
      ctx.lineWidth = 2 * MapScaling.config.scaleFactor;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();
      
      // Draw icon
      ctx.fillStyle = (nodeType === 'treasure' ? '#333' : '#fff');
      ctx.font = `bold ${radius * 0.8}px 'Press Start 2P', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, x, y);
      
      // Add scale animation for current and available nodes
      if (nodeClass === 'map-node--current' || nodeClass === 'map-node--available') {
        const scaleKey = `scale_${node.id}`;
        if (!this[scaleKey]) {
          this[scaleKey] = {
            scale: 1,
            direction: 0.005 * (Math.random() > 0.5 ? 1 : -1)
          };
        }
        
        // Update scale
        this[scaleKey].scale += this[scaleKey].direction;
        if (this[scaleKey].scale > 1.1 || this[scaleKey].scale < 0.95) {
          this[scaleKey].direction *= -1;
        }
        
        // Apply subtle pulse scaling (only to outer glow)
        if (nodeClass === 'map-node--current') {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(x, y, radius * this[scaleKey].scale * 1.3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.restore();
        }
      }
      
      ctx.restore();
    },
    
    /**
     * Simple node drawing fallback
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} node - Node object
     * @param {number} radius - Node radius
     */
    drawSimpleNode: function(ctx, node, radius) {
      // Get node position
      const x = node.position.x * MapScaling.config.scaleFactor;
      const y = node.position.y * MapScaling.config.scaleFactor;
      
      // Draw simple colored circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#5b8dd9';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${radius * 0.7}px sans-serif`;
      
      // Draw node type initial
      const nodeType = node.type || 'default';
      ctx.fillText(nodeType.charAt(0).toUpperCase(), x, y);
    },
    
    /**
     * Update canvas dimensions based on container and scale
     */
    updateMapDimensions: function() {
      // Make sure MapRenderer exists
      if (typeof MapRenderer === 'undefined' || !MapRenderer.canvas) return;
      
      const canvas = MapRenderer.canvas;
      const container = canvas.parentElement;
      
      // Calculate new dimensions
      let newWidth, newHeight;
      
      if (this.config.autoScale && container) {
        // Get container dimensions
        const containerWidth = container.clientWidth - this.config.padding * 2;
        const containerHeight = container.clientHeight - this.config.padding * 2;
        
        // Calculate aspect ratio
        const mapAspectRatio = this.config.baseHeight / this.config.baseWidth;
        
        // Fit to container while maintaining aspect ratio
        if (containerWidth * mapAspectRatio <= containerHeight) {
          // Width constrained
          newWidth = containerWidth;
          newHeight = containerWidth * mapAspectRatio;
        } else {
          // Height constrained
          newHeight = containerHeight;
          newWidth = containerHeight / mapAspectRatio;
        }
        
        // Calculate new scale factor based on dimensions
        this.config.scaleFactor = newWidth / this.config.baseWidth;
        
        // Limit maximum scale
        if (this.config.scaleFactor > this.config.maxScaleFactor) {
          this.config.scaleFactor = this.config.maxScaleFactor;
          newWidth = this.config.baseWidth * this.config.scaleFactor;
          newHeight = this.config.baseHeight * this.config.scaleFactor;
        }
      } else {
        // Use fixed scale factor
        newWidth = this.config.baseWidth * this.config.scaleFactor;
        newHeight = this.config.baseHeight * this.config.scaleFactor;
      }
      
      // Apply high DPI scaling if enabled
      const pixelRatio = this.state.pixelRatio;
      
      // Update canvas size if changed
      if (this.state.currentWidth !== newWidth || 
          this.state.currentHeight !== newHeight) {
        
        // Set display size
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
        
        // Set actual canvas dimensions for high DPI
        canvas.width = Math.floor(newWidth * pixelRatio);
        canvas.height = Math.floor(newHeight * pixelRatio);
        
        // Scale context for high DPI displays
        if (pixelRatio !== 1 && MapRenderer.ctx) {
          MapRenderer.ctx.scale(pixelRatio, pixelRatio);
        }
        
        // Store current dimensions
        this.state.currentWidth = newWidth;
        this.state.currentHeight = newHeight;
        
        console.log(`MapScaling: Resized to ${newWidth}x${newHeight} (scale: ${this.config.scaleFactor.toFixed(2)}x)`);
      }
    },
    
    /**
     * Handle window resize event
     */
    handleResize: function() {
      this.updateMapDimensions();
      
      // Trigger a re-render if MapRenderer is available
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.renderMap === 'function') {
        MapRenderer.renderMap();
      }
    },
    
    /**
     * Set map scale factor manually
     * @param {number} scale - New scale factor
     */
    setScaleFactor: function(scale) {
      if (typeof scale !== 'number' || scale <= 0) return;
      
      // Limit maximum scale
      if (scale > this.config.maxScaleFactor) {
        scale = this.config.maxScaleFactor;
      }
      
      this.config.scaleFactor = scale;
      this.updateMapDimensions();
      
      // Trigger a re-render if MapRenderer is available
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.renderMap === 'function') {
        MapRenderer.renderMap();
      }
      
      return this.config.scaleFactor;
    },
    
    /**
     * Clean up event listeners and restore original functions
     */
    dispose: function() {
      // Remove event listeners
      window.removeEventListener('resize', this.handleResize.bind(this));
      
      // Restore original functions if they exist
      if (typeof MapRenderer !== 'undefined') {
        if (this.state.originalRenderFunction) {
          MapRenderer.renderMap = this.state.originalRenderFunction;
        }
        
        if (this.state.originalDrawNodeFunction) {
          MapRenderer.drawNode = this.state.originalDrawNodeFunction;
        }
      }
      
      this.state.initialized = false;
      
      console.log("MapScaling: Disposed");
    }
  };
  
  // Export globally
  window.MapScaling = MapScaling;