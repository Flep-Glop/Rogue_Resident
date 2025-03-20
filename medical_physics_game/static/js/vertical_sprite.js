/**
 * VerticalSpriteAnimator
 * A simple class to animate vertical sprite sheets
 */
class VerticalSpriteAnimator {
    constructor(options) {
      // Required options
      this.imagePath = options.imagePath;
      this.frameCount = options.frameCount || 1;
      this.frameWidth = options.frameWidth;
      this.frameHeight = options.frameHeight;
      this.fps = options.fps || 10;
      
      // Optional settings
      this.loop = options.loop !== undefined ? options.loop : true;
      this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : false;
      this.scale = options.scale || 1;
      
      // Animation state
      this.currentFrame = 0;
      this.isPlaying = false;
      this.animationId = null;
      this.lastFrameTime = 0;
      this.container = null;
      this.sprite = null;
      
      // Frame duration in milliseconds
      this.frameDuration = 1000 / this.fps;
      
      // Debug mode
      this.debug = options.debug || false;
    }
    
    /**
     * Mount the sprite to a DOM element
     * @param {HTMLElement|string} container - DOM element or selector
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
      
      // Clear container
      this.container.innerHTML = '';
      
      // Add debug class if needed
      if (this.debug) {
        this.container.classList.add('debug-mode');
      }
      
      // Create sprite container with proper dimensions
      const spriteContainer = document.createElement('div');
      spriteContainer.className = 'sprite-container';
      
      // Set dimensions based on frame size and scale
      spriteContainer.style.width = `${this.frameWidth * this.scale}px`;
      spriteContainer.style.height = `${this.frameHeight * this.scale}px`;
      
      // Create sprite element
      const sprite = document.createElement('div');
      sprite.className = 'vertical-sprite';
      sprite.style.backgroundImage = `url(${this.imagePath})`;
      sprite.style.width = '100%';
      sprite.style.height = `${this.frameCount * 100}%`;
      sprite.style.backgroundSize = '100% 100%';
      
      // Initial position
      this._updateSpritePosition(0);
      
      // Add to DOM
      spriteContainer.appendChild(sprite);
      this.container.appendChild(spriteContainer);
      this.sprite = sprite;
      
      // Auto play if specified
      if (this.autoPlay) {
        this.play();
      }
      
      return true;
    }
    
    /**
     * Update sprite position for the given frame
     * @param {number} frameIndex 
     */
    _updateSpritePosition(frameIndex) {
      if (!this.sprite) return;
      
      // For vertical sprite sheets, we need to adjust the top position
      const position = -(frameIndex * (100 / this.frameCount));
      this.sprite.style.top = `${position}%`;
    }
    
    /**
     * Animation loop using requestAnimationFrame
     * @param {number} timestamp 
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
        
        // Update sprite position
        this._updateSpritePosition(this.currentFrame);
        
        // If we've reached the end and not looping, stop
        if (this.currentFrame === this.frameCount - 1 && !this.loop) {
          this.stop();
          return;
        }
      }
      
      // Continue animation loop
      this.animationId = requestAnimationFrame(this._animationLoop.bind(this));
    }
    
    /**
     * Start or resume the animation
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
     * Pause the animation
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
     * Stop the animation and reset to first frame
     */
    stop() {
      this.pause();
      this.currentFrame = 0;
      this._updateSpritePosition(0);
      
      if (this.debug) {
        console.log('Animation stopped');
      }
    }
    
    /**
     * Go to a specific frame and pause
     * @param {number} frameIndex 
     */
    goToFrame(frameIndex) {
      if (frameIndex < 0 || frameIndex >= this.frameCount) {
        console.error(`Invalid frame index: ${frameIndex}`);
        return;
      }
      
      this.pause();
      this.currentFrame = frameIndex;
      this._updateSpritePosition(frameIndex);
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
     * @param {number} scale 
     */
    setScale(scale) {
      this.scale = scale;
      
      // Update container size if mounted
      if (this.container) {
        const spriteContainer = this.container.querySelector('.sprite-container');
        if (spriteContainer) {
          spriteContainer.style.width = `${this.frameWidth * scale}px`;
          spriteContainer.style.height = `${this.frameHeight * scale}px`;
        }
      }
    }
  }
  
  // Make available globally
  window.VerticalSpriteAnimator = VerticalSpriteAnimator;