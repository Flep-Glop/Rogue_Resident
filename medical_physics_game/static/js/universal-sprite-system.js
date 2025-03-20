/**
 * UniversalSpriteAnimator
 * A robust sprite animation system that handles various sprite layouts:
 * - Vertical strips
 * - Horizontal strips
 * - Grid-based spritesheets
 * - Individual image sequences
 */
class UniversalSpriteAnimator {
  constructor(options) {
    // Required options
    this.imagePath = options.imagePath;
    this.frameCount = options.frameCount || 1;
    
    // Sprite layout configuration
    this.layout = options.layout || 'vertical'; // 'vertical', 'horizontal', 'grid', 'sequence'
    this.frameWidth = options.frameWidth;
    this.frameHeight = options.frameHeight;
    
    // For grid layout
    this.columns = options.columns || 1;
    this.rows = options.rows || this.frameCount;
    
    // For sequence layout (array of image paths)
    this.imagePaths = options.imagePaths || [];
    
    // Animation settings
    this.fps = options.fps || 10;
    this.loop = options.loop !== undefined ? options.loop : true;
    this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : false;
    this.scale = options.scale || 1;
    this.centerImage = options.centerImage || false;
    
    // Optional animation sequence (allows playing specific frames in any order)
    this.sequence = options.sequence || null;
    
    // Animation state
    this.currentFrame = 0;
    this.isPlaying = false;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.container = null;
    this.spriteEl = null;
    
    // For sequence layout
    this.imageElements = [];
    
    // For events
    this.eventListeners = {
      'complete': [],
      'framechange': []
    };
    
    // Frame duration in milliseconds
    this.frameDuration = 1000 / this.fps;
    
    // Debug mode
    this.debug = options.debug || false;
    
    // Validate options based on layout
    this._validateOptions();
  }
  
  /**
   * Validate options based on selected layout
   * @private
   */
  _validateOptions() {
    // Check required properties for each layout type
    switch (this.layout) {
      case 'vertical':
        if (!this.frameHeight || !this.frameWidth) {
          console.error('Vertical layout requires frameHeight and frameWidth');
        }
        break;
        
      case 'horizontal': 
        if (!this.frameHeight || !this.frameWidth) {
          console.error('Horizontal layout requires frameHeight and frameWidth');
        }
        break;
        
      case 'grid':
        if (!this.frameHeight || !this.frameWidth || !this.columns || !this.rows) {
          console.error('Grid layout requires frameHeight, frameWidth, columns and rows');
        }
        if (this.columns * this.rows < this.frameCount) {
          console.warn('Grid size is smaller than frameCount');
        }
        break;
        
      case 'sequence':
        if (!this.imagePaths || this.imagePaths.length === 0) {
          console.error('Sequence layout requires imagePaths array');
        }
        if (this.imagePaths.length !== this.frameCount) {
          console.warn(`Image paths count (${this.imagePaths.length}) doesn't match frameCount (${this.frameCount})`);
          // Adjust frameCount to match imagePaths
          this.frameCount = this.imagePaths.length;
        }
        break;
        
      default:
        console.error(`Unknown layout type: ${this.layout}`);
    }
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
    this.container.classList.add('sprite-container');
    if (this.debug) {
      this.container.classList.add('debug-mode');
    }
    
    // Create a style element if needed
    this._ensureStyles();
    
    // Set container dimensions based on frame size and scale
    this.container.style.width = `${this.frameWidth * this.scale}px`;
    this.container.style.height = `${this.frameHeight * this.scale}px`;
    
    // For centering the sprite if needed
    if (this.centerImage) {
      this.container.style.display = 'flex';
      this.container.style.justifyContent = 'center';
      this.container.style.alignItems = 'center';
    }
    
    // Create sprite element(s) based on layout type
    switch (this.layout) {
      case 'vertical':
        this._setupVerticalSprite();
        break;
        
      case 'horizontal':
        this._setupHorizontalSprite();
        break;
        
      case 'grid':
        this._setupGridSprite();
        break;
        
      case 'sequence':
        this._setupSequenceSprite();
        break;
    }
    
    // Force initial frame position
    this._jumpToFrame(0);
    
    // Auto play if specified
    if (this.autoPlay) {
      this.play();
    }
    
    return true;
  }
  
  /**
   * Ensure the sprite styles are added to the document
   * @private
   */
  _ensureStyles() {
    if (!document.getElementById('universal-sprite-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'universal-sprite-styles';
      styleEl.textContent = `
        .sprite-container {
          position: relative;
          overflow: hidden;
          display: inline-block;
        }
        
        .sprite-el {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-repeat: no-repeat;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          will-change: transform;
        }
        
        .sprite-el.vertical {
          width: 100%;
          height: ${this.frameCount * 100}%;
          background-size: 100% ${this.frameCount * 100}%;
        }
        
        .sprite-el.horizontal {
          width: ${this.frameCount * 100}%;
          height: 100%;
          background-size: ${this.frameCount * 100}% 100%;
        }
        
        .sprite-el.grid {
          width: ${this.columns * 100}%;
          height: ${this.rows * 100}%;
          background-size: ${this.columns * 100}% ${this.rows * 100}%;
        }
        
        .sprite-sequence-frame {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: none;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        .sprite-sequence-frame.active {
          display: block;
        }
        
        .debug-mode {
          border: 2px solid rgba(255, 0, 0, 0.5);
        }
      `;
      document.head.appendChild(styleEl);
    }
  }
  
  /**
   * Set up a vertically arranged sprite sheet
   * @private
   */
  _setupVerticalSprite() {
    const spriteEl = document.createElement('div');
    spriteEl.className = 'sprite-el vertical';
    
    // Set background image
    spriteEl.style.backgroundImage = `url(${this.imagePath})`;
    
    // Add to DOM
    this.container.appendChild(spriteEl);
    this.spriteEl = spriteEl;
  }
  
  /**
   * Set up a horizontally arranged sprite sheet
   * @private
   */
  _setupHorizontalSprite() {
    const spriteEl = document.createElement('div');
    spriteEl.className = 'sprite-el horizontal';
    
    // Set background image
    spriteEl.style.backgroundImage = `url(${this.imagePath})`;
    
    // Add to DOM
    this.container.appendChild(spriteEl);
    this.spriteEl = spriteEl;
  }
  
  /**
   * Set up a grid-based sprite sheet
   * @private
   */
  _setupGridSprite() {
    const spriteEl = document.createElement('div');
    spriteEl.className = 'sprite-el grid';
    
    // Set background image
    spriteEl.style.backgroundImage = `url(${this.imagePath})`;
    
    // Add to DOM
    this.container.appendChild(spriteEl);
    this.spriteEl = spriteEl;
  }
  
  /**
   * Set up a sequence of individual images
   * @private
   */
  _setupSequenceSprite() {
    // Create an image element for each frame
    this.imagePaths.forEach((path, index) => {
      const img = document.createElement('img');
      img.className = `sprite-sequence-frame ${index === 0 ? 'active' : ''}`;
      img.src = path;
      img.alt = `Frame ${index}`;
      img.style.width = `${this.frameWidth * this.scale}px`;
      img.style.height = `${this.frameHeight * this.scale}px`;
      
      this.container.appendChild(img);
      this.imageElements.push(img);
    });
  }
  
  /**
   * Jump to a specific frame immediately with no transition
   * @param {number} frameIndex
   * @private
   */
  _jumpToFrame(frameIndex) {
    if (frameIndex < 0 || frameIndex >= this.frameCount) {
      console.error(`Invalid frame index: ${frameIndex}`);
      return;
    }
    
    // Store current frame
    this.currentFrame = frameIndex;
    
    // Handle different layout types
    switch (this.layout) {
      case 'vertical':
        this._jumpToVerticalFrame(frameIndex);
        break;
        
      case 'horizontal':
        this._jumpToHorizontalFrame(frameIndex);
        break;
        
      case 'grid':
        this._jumpToGridFrame(frameIndex);
        break;
        
      case 'sequence':
        this._jumpToSequenceFrame(frameIndex);
        break;
    }
    
    // Trigger framechange event
    this._triggerEvent('framechange', { frame: frameIndex });
  }
  
  /**
   * Jump to a frame in a vertical sprite
   * @param {number} frameIndex
   * @private
   */
  _jumpToVerticalFrame(frameIndex) {
    if (!this.spriteEl) return;
    
    // Calculate exact percentage for the frame position
    const exactPercentage = -(frameIndex * (100 / this.frameCount));
    
    // Use transform for better performance
    this.spriteEl.style.transition = 'none';
    this.spriteEl.style.transform = `translateY(${exactPercentage}%)`;
    
    // Force reflow to apply styles immediately
    void this.spriteEl.offsetHeight;
    
    if (this.debug) {
      console.log(`SNAP TO FRAME ${frameIndex}, Position Y: ${exactPercentage}%`);
    }
  }
  
  /**
   * Jump to a frame in a horizontal sprite
   * @param {number} frameIndex
   * @private
   */
  _jumpToHorizontalFrame(frameIndex) {
    if (!this.spriteEl) return;
    
    // Calculate exact percentage for the frame position
    const exactPercentage = -(frameIndex * (100 / this.frameCount));
    
    // Use transform for better performance
    this.spriteEl.style.transition = 'none';
    this.spriteEl.style.transform = `translateX(${exactPercentage}%)`;
    
    // Force reflow to apply styles immediately
    void this.spriteEl.offsetHeight;
    
    if (this.debug) {
      console.log(`SNAP TO FRAME ${frameIndex}, Position X: ${exactPercentage}%`);
    }
  }
  
  /**
   * Jump to a frame in a grid sprite
   * @param {number} frameIndex
   * @private
   */
  _jumpToGridFrame(frameIndex) {
    if (!this.spriteEl) return;
    
    // Calculate grid position
    const col = frameIndex % this.columns;
    const row = Math.floor(frameIndex / this.columns);
    
    // Calculate exact percentages
    const xPercentage = -(col * (100 / this.columns));
    const yPercentage = -(row * (100 / this.rows));
    
    // Use transform for better performance
    this.spriteEl.style.transition = 'none';
    this.spriteEl.style.transform = `translate(${xPercentage}%, ${yPercentage}%)`;
    
    // Force reflow to apply styles immediately
    void this.spriteEl.offsetHeight;
    
    if (this.debug) {
      console.log(`SNAP TO FRAME ${frameIndex}, Grid: ${col}x${row}, Position: ${xPercentage}%, ${yPercentage}%`);
    }
  }
  
  /**
   * Jump to a frame in an image sequence
   * @param {number} frameIndex
   * @private
   */
  _jumpToSequenceFrame(frameIndex) {
    // Hide all images and show the current one
    this.imageElements.forEach((img, i) => {
      img.classList.toggle('active', i === frameIndex);
    });
    
    if (this.debug) {
      console.log(`SHOW FRAME ${frameIndex} (Image: ${this.imagePaths[frameIndex]})`);
    }
  }
  
  /**
   * Animation loop using requestAnimationFrame
   * @param {number} timestamp
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
      let nextFrame;
      
      // If using a custom sequence, use that for frame order
      if (this.sequence && this.sequence.length > 0) {
        const currentSequenceIndex = this.sequence.indexOf(this.currentFrame);
        const nextSequenceIndex = (currentSequenceIndex + 1) % this.sequence.length;
        nextFrame = this.sequence[nextSequenceIndex];
      } else {
        // Default sequential behavior
        nextFrame = (this.currentFrame + 1) % this.frameCount;
      }
      
      // Update sprite position with frame snapping
      this._jumpToFrame(nextFrame);
      
      // If we've reached the end and not looping, stop
      if ((this.currentFrame === this.frameCount - 1 || 
           (this.sequence && this.currentFrame === this.sequence[this.sequence.length - 1])) && 
          !this.loop) {
        this.stop();
        this._triggerEvent('complete');
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
      
      // For sequence layout, update all images
      if (this.layout === 'sequence') {
        this.imageElements.forEach(img => {
          img.style.width = `${this.frameWidth * scale}px`;
          img.style.height = `${this.frameHeight * scale}px`;
        });
      }
    }
  }
  
  /**
   * Set a custom animation sequence
   * @param {Array<number>} sequence - Array of frame indices to play in order
   */
  setSequence(sequence) {
    // Validate sequence
    if (!Array.isArray(sequence)) {
      console.error('Sequence must be an array of frame indices');
      return;
    }
    
    // Check if all frames are valid
    const invalidFrames = sequence.filter(f => f < 0 || f >= this.frameCount);
    if (invalidFrames.length > 0) {
      console.error(`Invalid frame indices in sequence: ${invalidFrames.join(', ')}`);
      return;
    }
    
    this.sequence = sequence;
    
    // If currently playing, restart with new sequence
    const wasPlaying = this.isPlaying;
    this.stop();
    if (wasPlaying) {
      this.play();
    }
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name ('complete', 'framechange')
   * @param {Function} callback - Function to call when event occurs
   */
  addEventListener(event, callback) {
    if (typeof this.eventListeners[event] !== 'undefined') {
      this.eventListeners[event].push(callback);
    } else {
      console.error(`Unknown event: ${event}`);
    }
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Function to remove
   */
  removeEventListener(event, callback) {
    if (typeof this.eventListeners[event] !== 'undefined') {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }
  
  /**
   * Trigger an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _triggerEvent(event, data = {}) {
    if (typeof this.eventListeners[event] !== 'undefined') {
      this.eventListeners[event].forEach(callback => {
        callback({
          type: event,
          target: this,
          ...data
        });
      });
    }
  }
}

// Make available globally
window.UniversalSpriteAnimator = UniversalSpriteAnimator;
