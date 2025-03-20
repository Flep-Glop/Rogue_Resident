/**
 * Canvas Sprite Animator
 * A robust, canvas-based sprite animation system optimized for pixel art
 * and retro-style game character animations.
 */
class CanvasSpriteAnimator {
    /**
     * Create a new sprite animator
     * @param {Object} options Configuration options
     * @param {string} options.imagePath Path to sprite sheet image
     * @param {number} options.frameCount Number of frames in the animation
     * @param {number} options.frameWidth Width of each frame in pixels
     * @param {number} options.frameHeight Height of each frame in pixels
     * @param {number} [options.fps=10] Frames per second
     * @param {number} [options.scale=1] Scaling factor
     * @param {boolean} [options.loop=true] Whether to loop the animation
     * @param {boolean} [options.autoPlay=false] Whether to start playing immediately
     * @param {string} [options.layout='vertical'] Sprite layout ('vertical', 'horizontal', 'grid')
     * @param {number} [options.columns] Number of columns (for grid layout)
     * @param {number} [options.rows] Number of rows (for grid layout)
     * @param {number} [options.offsetX=0] Horizontal offset for drawing
     * @param {number} [options.offsetY=0] Vertical offset for drawing
     * @param {boolean} [options.debug=false] Enable debug rendering
     */
    constructor(options) {
      // Required options
      this.imagePath = options.imagePath;
      this.frameCount = options.frameCount || 1;
      this.frameWidth = options.frameWidth;
      this.frameHeight = options.frameHeight;
      
      // Optional settings
      this.fps = options.fps || 10;
      this.scale = options.scale || 1;
      this.loop = options.loop !== undefined ? options.loop : true;
      this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : false;
      this.layout = options.layout || 'vertical';
      this.columns = options.columns || 1;
      this.rows = options.rows || 1;
      this.offsetX = options.offsetX || 0;
      this.offsetY = options.offsetY || 0;
      this.debug = options.debug || false;
      
      // Animation state
      this.currentFrame = 0;
      this.isPlaying = false;
      this.animationId = null;
      this.lastFrameTime = 0;
      this.frameDuration = 1000 / this.fps;
      
      // DOM elements
      this.container = null;
      this.canvas = null;
      this.ctx = null;
      
      // Event callbacks
      this.callbacks = {
        complete: [],
        framechange: []
      };
      
      // Custom animation sequence
      this.sequence = null;
      
      // Load sprite image
      this.loadSpriteImage();
    }
    
    /**
     * Load the sprite sheet image
     */
    loadSpriteImage() {
      this.spriteImage = new Image();
      this.spriteImage.src = this.imagePath;
      
      // Enable cross-origin if from another domain
      if (this.imagePath.startsWith('http') && 
          !this.imagePath.includes(window.location.hostname)) {
        this.spriteImage.crossOrigin = 'Anonymous';
      }
      
      // Log errors if in debug mode
      if (this.debug) {
        this.spriteImage.onload = () => {
          console.log(`Sprite image loaded: ${this.spriteImage.width}x${this.spriteImage.height}`);
        };
        
        this.spriteImage.onerror = (err) => {
          console.error(`Failed to load sprite image: ${this.imagePath}`, err);
        };
      }
    }
    
    /**
     * Mount the animator to a DOM element
     * @param {HTMLElement|string} container Container element or selector
     * @returns {boolean} Success
     */
    mount(container) {
      // Get container element
      if (typeof container === 'string') {
        this.container = document.querySelector(container);
      } else {
        this.container = container;
      }
      
      if (!this.container) {
        console.error('Container element not found');
        return false;
      }
      
      // Clear any existing content
      this.container.innerHTML = '';
      
      // Set container styles
      this.container.style.width = `${this.frameWidth * this.scale}px`;
      this.container.style.height = `${this.frameHeight * this.scale}px`;
      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
      
      // Create canvas element
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.frameWidth * this.scale;
      this.canvas.height = this.frameHeight * this.scale;
      this.canvas.style.display = 'block';
      this.canvas.style.imageRendering = 'pixelated';
      
      // Get 2D context
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
      
      // Add canvas to container
      this.container.appendChild(this.canvas);
      
      // Add debug overlay if needed
      if (this.debug) {
        this.createDebugOverlay();
      }
      
      // Wait for image to load if needed
      if (this.spriteImage.complete) {
        this.drawFrame(0);
        
        // Auto-play if enabled
        if (this.autoPlay) {
          this.play();
        }
      } else {
        this.spriteImage.onload = () => {
          this.drawFrame(0);
          
          // Auto-play if enabled
          if (this.autoPlay) {
            this.play();
          }
        };
      }
      
      return true;
    }
    
    /**
     * Create debug overlay
     * @private
     */
    createDebugOverlay() {
      const debugOverlay = document.createElement('div');
      debugOverlay.className = 'sprite-debug-overlay';
      debugOverlay.style.position = 'absolute';
      debugOverlay.style.bottom = '0';
      debugOverlay.style.left = '0';
      debugOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
      debugOverlay.style.color = 'white';
      debugOverlay.style.padding = '4px';
      debugOverlay.style.fontSize = '10px';
      debugOverlay.style.fontFamily = 'monospace';
      debugOverlay.style.pointerEvents = 'none';
      debugOverlay.textContent = `Frame: 1/${this.frameCount}`;
      debugOverlay.id = 'debug-overlay-' + Date.now();
      this.container.appendChild(debugOverlay);
      
      // Add border to container
      this.container.style.border = '1px solid rgba(255,0,0,0.5)';
      
      // Store reference
      this.debugOverlay = debugOverlay;
    }
    
    /**
     * Update debug overlay
     * @private
     */
    updateDebugOverlay() {
      if (!this.debugOverlay) return;
      
      this.debugOverlay.textContent = `Frame: ${this.currentFrame + 1}/${this.frameCount} | FPS: ${this.fps}`;
    }
    
    /**
     * Draw a specific frame
     * @param {number} frameIndex Frame to draw
     * @private
     */
    drawFrame(frameIndex) {
      if (!this.ctx || !this.spriteImage || !this.spriteImage.complete) return;
      
      // Store current frame
      this.currentFrame = frameIndex;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Calculate source rectangle based on layout
      let sx, sy;
      
      switch(this.layout) {
        case 'horizontal':
          sx = frameIndex * this.frameWidth;
          sy = 0;
          break;
          
        case 'grid':
          sx = (frameIndex % this.columns) * this.frameWidth;
          sy = Math.floor(frameIndex / this.columns) * this.frameHeight;
          break;
          
        case 'vertical':
        default:
          sx = 0;
          sy = frameIndex * this.frameHeight;
          break;
      }
      
      // Calculate destination rectangle with offsets
      const dx = this.offsetX * this.scale;
      const dy = this.offsetY * this.scale;
      const dWidth = this.frameWidth * this.scale;
      const dHeight = this.frameHeight * this.scale;
      
      // Draw the frame
      this.ctx.drawImage(
        this.spriteImage,
        sx, sy, this.frameWidth, this.frameHeight,
        dx, dy, dWidth, dHeight
      );
      
      // Draw debug info if enabled
      if (this.debug) {
        this.drawDebugInfo();
        this.updateDebugOverlay();
      }
      
      // Trigger framechange event
      this.triggerEvent('framechange', { frame: frameIndex });
    }
    
    /**
     * Draw debug visualization
     * @private
     */
    drawDebugInfo() {
      // Draw frame border
      this.ctx.strokeStyle = 'rgba(255,0,0,0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(
        this.offsetX * this.scale, 
        this.offsetY * this.scale, 
        this.frameWidth * this.scale, 
        this.frameHeight * this.scale
      );
      
      // Draw center point
      this.ctx.fillStyle = 'rgba(0,255,0,0.5)';
      this.ctx.beginPath();
      this.ctx.arc(
        (this.offsetX + this.frameWidth/2) * this.scale, 
        (this.offsetY + this.frameHeight/2) * this.scale, 
        3, 0, Math.PI * 2
      );
      this.ctx.fill();
    }
    
    /**
     * Animation loop
     * @param {number} timestamp Current time
     * @private
     */
    animationLoop(timestamp) {
      if (!this.isPlaying) return;
      
      // Calculate time passed since last frame
      const elapsed = timestamp - this.lastFrameTime;
      
      // If enough time has passed, advance to next frame
      if (elapsed >= this.frameDuration) {
        // Update time tracking with adjustment to prevent drift
        this.lastFrameTime = timestamp - (elapsed % this.frameDuration);
        
        // Determine next frame
        let nextFrame;
        
        // If using custom sequence, use that
        if (this.sequence && this.sequence.length > 0) {
          const currentIndex = this.sequence.indexOf(this.currentFrame);
          const nextIndex = (currentIndex + 1) % this.sequence.length;
          nextFrame = this.sequence[nextIndex];
          
          // Check if we've reached the end and should stop
          if (nextIndex === 0 && !this.loop) {
            this.stop();
            this.triggerEvent('complete');
            return;
          }
        } else {
          // Standard sequential frames
          nextFrame = (this.currentFrame + 1) % this.frameCount;
          
          // Check if we've reached the end and should stop
          if (nextFrame === 0 && !this.loop) {
            this.stop();
            this.triggerEvent('complete');
            return;
          }
        }
        
        // Draw the new frame
        this.drawFrame(nextFrame);
      }
      
      // Continue animation loop
      this.animationId = requestAnimationFrame(this.animationLoop.bind(this));
    }
    
    /**
     * Start or resume animation
     */
    play() {
      if (this.isPlaying) return;
      
      this.isPlaying = true;
      this.lastFrameTime = performance.now();
      this.animationId = requestAnimationFrame(this.animationLoop.bind(this));
      
      if (this.debug) {
        console.log('Animation started');
      }
    }
    
    /**
     * Pause animation
     */
    pause() {
      if (!this.isPlaying) return;
      
      this.isPlaying = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      if (this.debug) {
        console.log('Animation paused');
      }
    }
    
    /**
     * Stop animation and reset to first frame
     */
    stop() {
      this.pause();
      this.currentFrame = 0;
      this.drawFrame(0);
      
      if (this.debug) {
        console.log('Animation stopped');
      }
    }
    
    /**
     * Go to a specific frame
     * @param {number} frameIndex Frame to display
     */
    goToFrame(frameIndex) {
      if (frameIndex < 0 || frameIndex >= this.frameCount) {
        console.error(`Invalid frame index: ${frameIndex}`);
        return;
      }
      
      // Pause and draw the specified frame
      this.pause();
      this.drawFrame(frameIndex);
    }
    
    /**
     * Set animation speed
     * @param {number} fps Frames per second
     */
    setSpeed(fps) {
      this.fps = fps;
      this.frameDuration = 1000 / fps;
      
      if (this.debug) {
        console.log(`Animation speed set to ${fps} fps`);
        this.updateDebugOverlay();
      }
    }
    
    /**
     * Set animation scale
     * @param {number} scale Scale factor
     */
    setScale(scale) {
      this.scale = scale;
      
      if (this.canvas) {
        // Update canvas size
        this.canvas.width = this.frameWidth * scale;
        this.canvas.height = this.frameHeight * scale;
        
        // Update container size
        this.container.style.width = `${this.frameWidth * scale}px`;
        this.container.style.height = `${this.frameHeight * scale}px`;
        
        // Re-disable image smoothing (gets reset when canvas is resized)
        this.ctx.imageSmoothingEnabled = false;
        
        // Redraw current frame
        this.drawFrame(this.currentFrame);
      }
      
      if (this.debug) {
        console.log(`Animation scale set to ${scale}x`);
      }
    }
    
    /**
     * Set custom animation sequence
     * @param {Array<number>} sequence Array of frame indices
     */
    setSequence(sequence) {
      if (!Array.isArray(sequence)) {
        console.error('Sequence must be an array of frame indices');
        return;
      }
      
      // Validate frames
      for (const frameIndex of sequence) {
        if (frameIndex < 0 || frameIndex >= this.frameCount) {
          console.error(`Invalid frame index in sequence: ${frameIndex}`);
          return;
        }
      }
      
      this.sequence = sequence;
      
      if (this.debug) {
        console.log(`Custom sequence set: ${sequence.join(', ')}`);
      }
    }
    
    /**
     * Clear custom animation sequence
     */
    clearSequence() {
      this.sequence = null;
      
      if (this.debug) {
        console.log('Custom sequence cleared');
      }
    }
    
    /**
     * Add event listener
     * @param {string} event Event name ('complete' or 'framechange')
     * @param {Function} callback Callback function
     */
    addEventListener(event, callback) {
      if (this.callbacks[event]) {
        this.callbacks[event].push(callback);
      } else {
        console.error(`Unknown event: ${event}`);
      }
    }
    
    /**
     * Remove event listener
     * @param {string} event Event name
     * @param {Function} callback Callback function
     */
    removeEventListener(event, callback) {
      if (this.callbacks[event]) {
        this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
      }
    }
    
    /**
     * Trigger event
     * @param {string} event Event name
     * @param {Object} data Event data
     * @private
     */
    triggerEvent(event, data = {}) {
      if (this.callbacks[event]) {
        for (const callback of this.callbacks[event]) {
          callback({
            type: event,
            target: this,
            ...data
          });
        }
      }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
      // Stop animation
      this.pause();
      
      // Remove canvas from container
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      
      // Clean up debug overlay
      if (this.debugOverlay && this.debugOverlay.parentNode) {
        this.debugOverlay.parentNode.removeChild(this.debugOverlay);
      }
      
      // Clear event listeners
      this.callbacks = {
        complete: [],
        framechange: []
      };
      
      // Clear references
      this.container = null;
      this.canvas = null;
      this.ctx = null;
      this.debugOverlay = null;
      
      if (this.debug) {
        console.log('Animator destroyed and resources cleaned up');
      }
    }
  }