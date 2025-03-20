/**
 * FixedVerticalSpriteAnimator
 * An improved class to animate vertical sprite sheets with frame snapping
 */
class FixedVerticalSpriteAnimator {
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
    this.spriteEl = null;
    
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
    
    // Add classes for styling
    this.container.classList.add('fixed-sprite-container');
    if (this.debug) {
      this.container.classList.add('debug-mode');
    }
    
    // Create a style element if needed
    if (!document.getElementById('fixed-sprite-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'fixed-sprite-styles';
      styleEl.textContent = `
        .fixed-sprite-container {
          position: relative;
          overflow: hidden;
          display: inline-block;
        }
        
        .fixed-sprite-el {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: ${this.frameCount * 100}%;
          background-repeat: no-repeat;
          background-size: 100% ${this.frameCount * 100}%;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          will-change: transform;
          transform: translateY(0);
        }
        
        .debug-mode {
          border: 2px solid red;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    // Set container dimensions based on frame size and scale
    this.container.style.width = `${this.frameWidth * this.scale}px`;
    this.container.style.height = `${this.frameHeight * this.scale}px`;
    
    // Create sprite element using a div with background image
    const spriteEl = document.createElement('div');
    spriteEl.className = 'fixed-sprite-el';
    
    // Set background image
    spriteEl.style.backgroundImage = `url(${this.imagePath})`;
    
    // Add to DOM
    this.container.appendChild(spriteEl);
    this.spriteEl = spriteEl;
    
    // Force initial frame position
    this._jumpToFrame(0);
    
    // Auto play if specified
    if (this.autoPlay) {
      this.play();
    }
    
    return true;
  }
  
  /**
   * Jump to a specific frame immediately with no transition
   * @param {number} frameIndex 
   */
  _jumpToFrame(frameIndex) {
    if (!this.spriteEl) return;
    
    // Calculate exact percentage for the frame position
    const exactPercentage = -(frameIndex * (100 / this.frameCount));
    
    // Use transform for better performance
    // Important: Disable any transitions
    this.spriteEl.style.transition = 'none';
    this.spriteEl.style.transform = `translateY(${exactPercentage}%)`;
    
    // Force reflow to apply styles immediately
    void this.spriteEl.offsetHeight;
    
    if (this.debug) {
      console.log(`SNAP TO FRAME ${frameIndex}, Position: ${exactPercentage}%`);
    }
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
      
      // Update sprite position with frame snapping
      this._jumpToFrame(this.currentFrame);
      
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
    this._jumpToFrame(0);
    
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
    this._jumpToFrame(frameIndex);
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
      this.container.style.width = `${this.frameWidth * scale}px`;
      this.container.style.height = `${this.frameHeight * scale}px`;
    }
  }
}

// Make available globally
window.FixedVerticalSpriteAnimator = FixedVerticalSpriteAnimator;