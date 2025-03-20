/**
   * Sprite Animation System
   * High-level system for managing multiple sprite animations
   */
const SpriteSystem = {
    // Store active animations
    animations: {},
    
    // Track IDs
    nextId: 1,
    
    // Initialize system
    initialize() {
      console.log('Sprite Animation System initialized');
      return this;
    },
    
    /**
     * Create a new character animation
     * @param {string} characterId Character identifier
     * @param {HTMLElement|string} container Container element or selector
     * @param {Object} options Animation options
     * @returns {string} Animation ID
     */
    createAnimation(characterId, container, options = {}) {
      // Get character data
      if (!window.CharacterAssets) {
        console.error('CharacterAssets not available');
        return null;
      }
      
      const character = CharacterAssets.getCharacter(characterId);
      if (!character) {
        console.error(`Character not found: ${characterId}`);
        return null;
      }
      
      // Get animation name
      const animName = options.animation || 'idle';
      
      // Get animation data
      if (!character.animations || !character.animations[animName]) {
        console.error(`Animation "${animName}" not found for character ${characterId}`);
        return null;
      }
      
      const animData = character.animations[animName];
      
      // Create animator instance
      const animator = new CanvasSpriteAnimator({
        imagePath: character.spritePath + animData.file,
        frameCount: animData.frames || 1,
        frameWidth: animData.width || 96,
        frameHeight: animData.height 
          ? (animData.height / animData.frames)
          : 96,
        fps: animData.speed 
          ? (1000 / animData.speed) 
          : 10,
        scale: options.scale || 3,
        loop: options.loop !== undefined ? options.loop : true,
        autoPlay: options.autoPlay !== undefined ? options.autoPlay : true,
        layout: animData.layout || 'vertical',
        columns: animData.columns || 1,
        rows: animData.rows || 1,
        offsetX: animData.offsetX || 0,
        offsetY: animData.offsetY || 0,
        debug: options.debug || false
      });
      
      // Mount to container
      const mounted = animator.mount(container);
      if (!mounted) {
        console.error('Failed to mount animator to container');
        return null;
      }
      
      // Generate unique ID
      const id = `${characterId}_${this.nextId++}`;
      
      // Store animation data
      this.animations[id] = {
        id,
        animator,
        character: characterId,
        currentAnimation: animName,
        container
      };
      
      // Set up event handlers
      if (options.onComplete) {
        animator.addEventListener('complete', options.onComplete);
      }
      
      if (options.onFrameChange) {
        animator.addEventListener('framechange', options.onFrameChange);
      }
      
      return id;
    },
    
    /**
     * Play animation
     * @param {string} id Animation ID
     * @returns {boolean} Success
     */
    play(id) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.play();
      return true;
    },
    
    /**
     * Pause animation
     * @param {string} id Animation ID
     * @returns {boolean} Success
     */
    pause(id) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.pause();
      return true;
    },
    
    /**
     * Stop animation
     * @param {string} id Animation ID
     * @returns {boolean} Success
     */
    stop(id) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.stop();
      return true;
    },
    
    /**
     * Go to specific frame
     * @param {string} id Animation ID
     * @param {number} frameIndex Frame index
     * @returns {boolean} Success
     */
    goToFrame(id, frameIndex) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.goToFrame(frameIndex);
      return true;
    },
    
    /**
     * Set animation speed
     * @param {string} id Animation ID
     * @param {number} fps Frames per second
     * @returns {boolean} Success
     */
    setSpeed(id, fps) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.setSpeed(fps);
      return true;
    },
    
    /**
     * Set animation scale
     * @param {string} id Animation ID
     * @param {number} scale Scale factor
     * @returns {boolean} Success
     */
    setScale(id, scale) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.setScale(scale);
      return true;
    },
    
    /**
     * Set custom frame sequence
     * @param {string} id Animation ID
     * @param {Array<number>} sequence Frame sequence
     * @returns {boolean} Success
     */
    setSequence(id, sequence) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.setSequence(sequence);
      return true;
    },
    
    /**
     * Change to a different animation
     * @param {string} id Animation ID
     * @param {string} animationName New animation name
     * @param {Object} options Animation options
     * @returns {boolean} Success
     */
    changeAnimation(id, animationName, options = {}) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      // Get character data
      const character = CharacterAssets.getCharacter(anim.character);
      if (!character) {
        console.error(`Character not found: ${anim.character}`);
        return false;
      }
      
      // Get animation data
      if (!character.animations || !character.animations[animationName]) {
        console.error(`Animation "${animationName}" not found for character ${anim.character}`);
        return false;
      }
      
      const animData = character.animations[animationName];
      
      // Clean up old animator
      const wasPlaying = anim.animator.isPlaying;
      anim.animator.destroy();
      
      // Create new animator
      const animator = new CanvasSpriteAnimator({
        imagePath: character.spritePath + animData.file,
        frameCount: animData.frames || 1,
        frameWidth: animData.width || 96,
        frameHeight: animData.height 
          ? (animData.height / animData.frames)
          : 96,
        fps: animData.speed 
          ? (1000 / animData.speed) 
          : 10,
        scale: options.scale || anim.animator.scale,
        loop: options.loop !== undefined ? options.loop : anim.animator.loop,
        autoPlay: options.autoPlay !== undefined ? options.autoPlay : wasPlaying,
        layout: animData.layout || 'vertical',
        columns: animData.columns || 1,
        rows: animData.rows || 1,
        offsetX: animData.offsetX || 0,
        offsetY: animData.offsetY || 0,
        debug: options.debug || anim.animator.debug
      });
      
      // Mount to container
      animator.mount(anim.container);
      
      // Update animation data
      anim.animator = animator;
      anim.currentAnimation = animationName;
      
      // Set up event handlers
      if (options.onComplete) {
        animator.addEventListener('complete', options.onComplete);
      }
      
      if (options.onFrameChange) {
        animator.addEventListener('framechange', options.onFrameChange);
      }
      
      return true;
    },
    
    /**
     * Register callback for animation completion
     * @param {string} id Animation ID
     * @param {Function} callback Callback function
     * @returns {boolean} Success
     */
    onAnimationComplete(id, callback) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.addEventListener('complete', callback);
      return true;
    },
    
    /**
     * Register callback for frame changes
     * @param {string} id Animation ID
     * @param {Function} callback Callback function
     * @returns {boolean} Success
     */
    onFrameChange(id, callback) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      anim.animator.addEventListener('framechange', callback);
      return true;
    },
    
    /**
     * Remove animation and clean up resources
     * @param {string} id Animation ID
     * @returns {boolean} Success
     */
    removeAnimation(id) {
      const anim = this.animations[id];
      if (!anim) {
        console.error(`Animation not found: ${id}`);
        return false;
      }
      
      // Clean up animator
      anim.animator.destroy();
      
      // Remove from tracking
      delete this.animations[id];
      
      return true;
    },
    
    /**
     * Remove all animations and clean up
     */
    removeAllAnimations() {
      // Clean up each animator
      Object.keys(this.animations).forEach(id => {
        this.animations[id].animator.destroy();
      });
      
      // Reset tracking
      this.animations = {};
      
      console.log('All animations removed');
    },
    
    /**
     * Get animation info
     * @param {string} id Animation ID
     * @returns {Object|null} Animation information
     */
    getAnimationInfo(id) {
      const anim = this.animations[id];
      if (!anim) return null;
      
      return {
        id: anim.id,
        character: anim.character,
        currentAnimation: anim.currentAnimation,
        isPlaying: anim.animator.isPlaying,
        currentFrame: anim.animator.currentFrame,
        frameCount: anim.animator.frameCount,
        fps: anim.animator.fps,
        scale: anim.animator.scale
      };
    }
  };
  
  // Initialize on script load
  if (typeof window !== 'undefined') {
    window.CanvasSpriteAnimator = CanvasSpriteAnimator;
    window.SpriteSystem = SpriteSystem;
    
    // Auto-initialize when document is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        SpriteSystem.initialize();
      });
    } else {
      SpriteSystem.initialize();
    }
  }