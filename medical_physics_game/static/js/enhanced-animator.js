/**
 * EnhancedSpriteAnimator - Specialized for your resident idle animation
 * This version focuses on displaying your specific sprite correctly
 */
class EnhancedSpriteAnimator {
  constructor(options) {
    // Container element (to be set in mount)
    this.container = null;
    
    // Required configuration
    this.imagePath = options.imagePath || '/static/img/characters/resident/idle.png';
    this.frameCount = options.frameCount || 8;
    this.frameWidth = options.frameWidth || 97;
    this.frameHeight = options.frameHeight || 108; // 864px ÷ 8 frames
    
    // Optional settings with defaults
    this.fps = options.fps || 5;
    this.scale = options.scale || 4; // Increased scale to see better
    this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : false;
    this.loop = options.loop !== undefined ? options.loop : true;
    this.debug = options.debug || false;
    
    // Animation state
    this.currentFrame = 0;
    this.isPlaying = false;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.frameDuration = 1000 / this.fps;
    
    // Canvas elements (for precise rendering)
    this.canvas = null;
    this.ctx = null;
    this.spriteImage = null;
    
    // Load sprite sheet
    this._loadSpriteSheet();
  }
  
  /**
   * Load the sprite sheet image
   * @private
   */
  _loadSpriteSheet() {
    this.spriteImage = new Image();
    this.spriteImage.src = this.imagePath;
    
    // Enable crossOrigin if needed
    if (this.imagePath.startsWith('http')) {
      this.spriteImage.crossOrigin = 'Anonymous';
    }
    
    // Debug info
    if (this.debug) {
      this.spriteImage.onload = () => {
        console.log(`Sprite sheet loaded: ${this.spriteImage.width}×${this.spriteImage.height}px`);
      };
      
      this.spriteImage.onerror = (err) => {
        console.error('Error loading sprite sheet:', err);
      };
    }
  }
  
  /**
   * Mount the animator to a DOM element
   * @param {string|HTMLElement} container - Container element or selector
   * @returns {boolean} Success
   */
  mount(container) {
    // Find container element
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
    
    if (this.debug) {
      this.container.style.border = '1px solid red';
    }
    
    // Create canvas element for better control
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
    
    // Add debug info if needed
    if (this.debug) {
      const debugInfo = document.createElement('div');
      debugInfo.style.position = 'absolute';
      debugInfo.style.bottom = '0';
      debugInfo.style.left = '0';
      debugInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
      debugInfo.style.color = 'white';
      debugInfo.style.padding = '4px';
      debugInfo.style.fontSize = '10px';
      debugInfo.textContent = `Frame: 1/${this.frameCount}`;
      debugInfo.id = `${this.container.id}-debug`;
      this.container.appendChild(debugInfo);
    }
    
    // Draw initial frame
    if (this.spriteImage.complete) {
      this._drawFrame(0);
    } else {
      this.spriteImage.onload = () => {
        this._drawFrame(0);
        
        // Auto-play if enabled
        if (this.autoPlay) {
          this.play();
        }
      };
    }
    
    return true;
  }
  
  /**
   * Draw a specific frame to the canvas
   * @param {number} frameIndex - Index of frame to draw
   * @private
   */
  _drawFrame(frameIndex) {
    if (!this.ctx || !this.spriteImage) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate source rectangle (where to clip from sprite sheet)
    const sx = 0;
    const sy = frameIndex * this.frameHeight;
    const sWidth = this.frameWidth;
    const sHeight = this.frameHeight;
    
    // Calculate destination rectangle (where to draw on canvas)
    const dx = 0;
    const dy = 0;
    const dWidth = this.frameWidth * this.scale;
    const dHeight = this.frameHeight * this.scale;
    
    // Draw frame
    this.ctx.drawImage(
      this.spriteImage,
      sx, sy, sWidth, sHeight,
      dx, dy, dWidth, dHeight
    );
    
    // Update debug info if needed
    if (this.debug) {
      const debugInfo = document.getElementById(`${this.container.id}-debug`);
      if (debugInfo) {
        debugInfo.textContent = `Frame: ${frameIndex + 1}/${this.frameCount}`;
      }
    }
  }
  
  /**
   * Animation loop
   * @param {number} timestamp - Animation timestamp
   * @private
   */
  _animationLoop(timestamp) {
    if (!this.isPlaying) return;
    
    // Calculate time passed since last frame
    const elapsed = timestamp - this.lastFrameTime;
    
    // If enough time has passed, advance to next frame
    if (elapsed >= this.frameDuration) {
      // Update time tracking with adjustment to prevent drift
      this.lastFrameTime = timestamp - (elapsed % this.frameDuration);
      
      // Advance frame
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      
      // Draw the new frame
      this._drawFrame(this.currentFrame);
      
      // If we've reached the end and not looping, stop
      if (this.currentFrame === this.frameCount - 1 && !this.loop) {
        this.stop();
        if (typeof this.onComplete === 'function') {
          this.onComplete();
        }
        return;
      }
    }
    
    // Continue animation loop
    this.animationId = requestAnimationFrame(this._animationLoop.bind(this));
  }
  
  /**
   * Start or resume animation
   */
  play() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this._animationLoop.bind(this));
    
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
    this._drawFrame(0);
    
    if (this.debug) {
      console.log('Animation stopped');
    }
  }
  
  /**
   * Go to a specific frame
   * @param {number} frameIndex - Frame to display
   */
  goToFrame(frameIndex) {
    if (frameIndex < 0 || frameIndex >= this.frameCount) {
      console.error(`Invalid frame index: ${frameIndex}`);
      return;
    }
    
    this.pause();
    this.currentFrame = frameIndex;
    this._drawFrame(frameIndex);
  }
  
  /**
   * Set animation speed
   * @param {number} fps - Frames per second
   */
  setSpeed(fps) {
    this.fps = fps;
    this.frameDuration = 1000 / fps;
  }
  
  /**
   * Set animation scale
   * @param {number} scale - Scale factor
   */
  setScale(scale) {
    this.scale = scale;
    
    if (this.canvas) {
      this.canvas.width = this.frameWidth * scale;
      this.canvas.height = this.frameHeight * scale;
      this.container.style.width = `${this.frameWidth * scale}px`;
      this.container.style.height = `${this.frameHeight * scale}px`;
      
      // Redraw current frame with new scale
      this._drawFrame(this.currentFrame);
    }
  }
}

// Export to global scope
window.EnhancedSpriteAnimator = EnhancedSpriteAnimator;
