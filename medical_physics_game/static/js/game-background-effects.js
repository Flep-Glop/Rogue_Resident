// game-background-effects.js - Simple background particles for visual consistency
// Save this to: medical_physics_game/static/js/game-background-effects.js

const GameBackgroundEffects = {
    // Configuration
    config: {
      pixelCount: 20,          // Default number of particles
      pixelMinSize: 4,         // Minimum particle size
      pixelMaxSize: 12,        // Maximum particle size
      opacity: 0.3,            // Default opacity
      colors: [                // Color palette matching the game theme
        '#5b8dd9',            // Primary blue
        '#56b886',            // Secondary green
        '#9c77db',            // Purple
        '#d35db3',            // Pink/Elite
        '#f0c866'             // Yellow/Warning
      ],
      targetElement: null,     // Where to render the background
      speedMultiplier: 0.4,    // Slower movement for less distraction
      useGrid: true,           // Whether to draw the grid background
      gridSize: 20,            // Size of grid cells
      gridOpacity: 0.05        // Grid line opacity 
    },
    
    // State
    particles: [],
    canvas: null,
    ctx: null,
    animationFrame: null,
    isInitialized: false,
    
    /**
     * Initialize the background effects
     * @param {Object} options - Configuration options
     */
    initialize: function(options = {}) {
      // Merge options with defaults
      this.config = {...this.config, ...options};
      
      // Find target element (canvas or container)
      let targetContainer;
      if (typeof this.config.targetElement === 'string') {
        targetContainer = document.getElementById(this.config.targetElement) || 
                         document.querySelector(this.config.targetElement);
      } else if (this.config.targetElement instanceof HTMLElement) {
        targetContainer = this.config.targetElement;
      }
      
      // Fallback to body if target not found
      if (!targetContainer) {
        console.warn("GameBackgroundEffects: Target element not found, using body instead");
        targetContainer = document.body;
      }
      
      // Create a canvas for the background
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'game-background-canvas';
      
      // Position the canvas behind everything
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.zIndex = '-1';
      this.canvas.style.pointerEvents = 'none';
      
      // Insert at the beginning of target container
      if (targetContainer.firstChild) {
        targetContainer.insertBefore(this.canvas, targetContainer.firstChild);
      } else {
        targetContainer.appendChild(this.canvas);
      }
      
      // Set up canvas context
      this.ctx = this.canvas.getContext('2d');
      
      // Set canvas dimensions
      this.resizeCanvas();
      
      // Create initial particles
      this.createParticles();
      
      // Start animation loop
      this.animate();
      
      // Listen for resize events
      window.addEventListener('resize', this.resizeCanvas.bind(this));
      
      console.log("GameBackgroundEffects initialized with", this.particles.length, "particles");
      this.isInitialized = true;
      
      return true;
    },
    
    /**
     * Resize canvas to match window size
     */
    resizeCanvas: function() {
      if (!this.canvas) return;
      
      // Set canvas size to window size
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      
      // Recreate particles for new dimensions
      if (this.particles.length > 0) {
        this.createParticles();
      }
    },
    
    /**
     * Create particles based on configuration
     */
    createParticles: function() {
      if (!this.canvas) return;
      
      this.particles = [];
      
      for (let i = 0; i < this.config.pixelCount; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 
                (this.config.pixelMaxSize - this.config.pixelMinSize) + 
                this.config.pixelMinSize,
          color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
          alpha: Math.random() * (this.config.opacity - 0.1) + 0.1,
          vx: (Math.random() - 0.5) * this.config.speedMultiplier,
          vy: (Math.random() - 0.5) * this.config.speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01 * this.config.speedMultiplier,
          shape: ['circle', 'square', 'triangle', 'diamond'][Math.floor(Math.random() * 4)],
          pulseSpeed: 0.5 + Math.random(),
          pulseAmount: Math.random() * 0.2,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    },
    
    /**
     * Main animation loop
     */
    animate: function() {
      if (!this.canvas || !this.ctx) return;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw grid if enabled
      if (this.config.useGrid) {
        this.drawGrid();
      }
      
      // Get current time for animations
      const time = Date.now() / 1000;
      
      // Update and draw particles
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        
        // Apply pulse effect
        const scale = 1 + Math.sin(time * p.pulseSpeed + p.pulseOffset) * p.pulseAmount;
        const size = p.size * scale;
        
        // Wrap around edges
        if (p.x < -size) p.x = this.canvas.width + size;
        if (p.x > this.canvas.width + size) p.x = -size;
        if (p.y < -size) p.y = this.canvas.height + size;
        if (p.y > this.canvas.height + size) p.y = -size;
        
        // Draw the particle
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        
        // Set up transformations
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        
        // Choose fill or stroke for variety
        const hollow = Math.random() > 0.6;
        if (hollow) {
          this.ctx.strokeStyle = p.color;
          this.ctx.lineWidth = 2;
        } else {
          this.ctx.fillStyle = p.color;
        }
        
        // Draw the appropriate shape
        switch (p.shape) {
          case 'square':
            if (hollow) {
              this.ctx.strokeRect(-size/2, -size/2, size, size);
            } else {
              this.ctx.fillRect(-size/2, -size/2, size, size);
            }
            break;
            
          case 'triangle':
            this.ctx.beginPath();
            this.ctx.moveTo(0, -size/2);
            this.ctx.lineTo(-size/2, size/2);
            this.ctx.lineTo(size/2, size/2);
            this.ctx.closePath();
            if (hollow) {
              this.ctx.stroke();
            } else {
              this.ctx.fill();
            }
            break;
            
          case 'diamond':
            this.ctx.beginPath();
            this.ctx.moveTo(0, -size/2);
            this.ctx.lineTo(size/2, 0);
            this.ctx.lineTo(0, size/2);
            this.ctx.lineTo(-size/2, 0);
            this.ctx.closePath();
            if (hollow) {
              this.ctx.stroke();
            } else {
              this.ctx.fill();
            }
            break;
            
          default: // circle
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
            if (hollow) {
              this.ctx.stroke();
            } else {
              this.ctx.fill();
            }
        }
        
        this.ctx.restore();
      }
      
      // Continue animation loop
      this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    },
    
    /**
     * Draw grid background
     */
    drawGrid: function() {
      if (!this.ctx || !this.canvas) return;
      
      const gridSize = this.config.gridSize;
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.config.gridOpacity})`;
      this.ctx.lineWidth = 1;
      
      // Draw vertical lines
      for (let x = 0; x <= this.canvas.width; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= this.canvas.height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    },
    
    /**
     * Stop animations and clean up
     */
    dispose: function() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      
      this.particles = [];
      this.isInitialized = false;
      
      // Remove event listeners
      window.removeEventListener('resize', this.resizeCanvas.bind(this));
      
      console.log("GameBackgroundEffects disposed");
    },
    
    /**
     * Change configuration during runtime
     * @param {Object} newConfig - New configuration options
     */
    updateConfig: function(newConfig) {
      this.config = {...this.config, ...newConfig};
      this.createParticles();
    },
    
    /**
     * Switch between menu mode (more particles, brighter) and game mode (subtle)
     * @param {boolean} isMenu - Whether we're in a menu screen
     */
    setMenuMode: function(isMenu) {
      if (isMenu) {
        this.updateConfig({
          pixelCount: 40,
          opacity: 0.6,
          speedMultiplier: 0.7
        });
      } else {
        this.updateConfig({
          pixelCount: 20,
          opacity: 0.3,
          speedMultiplier: 0.4
        });
      }
    }
  };
  
  // Export globally
  window.GameBackgroundEffects = GameBackgroundEffects;