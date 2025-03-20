/**
 * CharacterAnimation - A high-level system for creating and managing
 * character sprite animations using the UniversalSpriteAnimator
 */
const CharacterAnimation = {
  // Store all active animations
  animations: {},
  
  // Track animation IDs
  nextId: 1,
  
  /**
   * Create a new character animation
   * 
   * @param {string} characterId - ID of the character from CharacterAssets
   * @param {string|HTMLElement} container - Container element or selector
   * @param {Object} options - Animation options
   * @returns {string} Animation ID
   */
  createAnimation: function(characterId, container, options = {}) {
    // Check if character exists
    if (!window.CharacterAssets || !CharacterAssets.getCharacter(characterId)) {
      console.error(`Character not found: ${characterId}`);
      return null;
    }
    
    // Get character data
    const character = CharacterAssets.getCharacter(characterId);
    
    // Get initial animation name
    const animName = options.initialAnimation || 'idle';
    
    // Check if animation exists
    if (!character.animations || !character.animations[animName]) {
      console.error(`Animation "${animName}" not found for character ${characterId}`);
      return null;
    }
    
    // Get animation data
    const anim = character.animations[animName];
    
    // Determine layout type based on animation data
    const layoutType = this._determineLayoutType(anim);
    
    // Create animator with correct options
    const animator = this._createAnimatorForLayout(
      character, 
      animName, 
      layoutType, 
      options
    );
    
    // Mount to container
    animator.mount(container);
    
    // Generate unique ID
    const animationId = `${characterId}-${this.nextId++}`;
    
    // Store animation
    this.animations[animationId] = {
      animator: animator,
      character: characterId,
      container: container,
      currentAnimation: animName,
      layoutType: layoutType,
      options: options
    };
    
    // Auto play if specified
    if (options.autoPlay !== false) {
      animator.play();
    }
    
    return animationId;
  },
  
  /**
   * Determine layout type based on animation data
   * @param {Object} anim - Animation data
   * @returns {string} Layout type
   * @private
   */
  _determineLayoutType: function(anim) {
    // Check animation properties to determine layout
    if (anim.isSequence || (anim.frames && Array.isArray(anim.frames))) {
      return 'sequence';
    }
    
    if (anim.columns && anim.rows) {
      return 'grid';
    }
    
    if (anim.isHorizontal) {
      return 'horizontal';
    }
    
    // Default to vertical layout
    return 'vertical';
  },
  
  /**
   * Create appropriate animator for the layout
   * @param {Object} character - Character data
   * @param {string} animName - Animation name
   * @param {string} layoutType - Layout type
   * @param {Object} options - Additional options
   * @returns {UniversalSpriteAnimator}
   * @private
   */
  _createAnimatorForLayout: function(character, animName, layoutType, options) {
    const anim = character.animations[animName];
    const basePath = character.spritePath || '/static/img/characters/';
    
    // Common options
    const commonOpts = {
      frameCount: anim.frames || 1,
      fps: anim.speed || 10,
      loop: options.loop !== undefined ? options.loop : true,
      autoPlay: options.autoPlay !== undefined ? options.autoPlay : true,
      scale: options.scale || 3,
      centerImage: options.centerImage !== undefined ? options.centerImage : false,
      debug: options.debug || false
    };
    
    // Create appropriate animator based on layout
    switch (layoutType) {
      case 'sequence':
        return this._createSequenceAnimator(basePath, character, anim, commonOpts);
        
      case 'grid':
        return this._createGridAnimator(basePath, character, anim, commonOpts);
        
      case 'horizontal':
        return this._createHorizontalAnimator(basePath, character, anim, commonOpts);
        
      case 'vertical':
      default:
        return this._createVerticalAnimator(basePath, character, anim, commonOpts);
    }
  },
  
  /**
   * Create a vertical sprite animator
   * @private
   */
  _createVerticalAnimator: function(basePath, character, anim, commonOpts) {
    return new UniversalSpriteAnimator({
      ...commonOpts,
      layout: 'vertical',
      imagePath: basePath + anim.file,
      frameWidth: anim.width || 96,
      frameHeight: (anim.height || 96) / anim.frames,
    });
  },
  
  /**
   * Create a horizontal sprite animator
   * @private
   */
  _createHorizontalAnimator: function(basePath, character, anim, commonOpts) {
    return new UniversalSpriteAnimator({
      ...commonOpts,
      layout: 'horizontal',
      imagePath: basePath + anim.file,
      frameWidth: (anim.width || 96) / anim.frames,
      frameHeight: anim.height || 96
    });
  },
  
  /**
   * Create a grid sprite animator
   * @private
   */
  _createGridAnimator: function(basePath, character, anim, commonOpts) {
    return new UniversalSpriteAnimator({
      ...commonOpts,
      layout: 'grid',
      imagePath: basePath + anim.file,
      frameWidth: (anim.width || 96) / anim.columns,
      frameHeight: (anim.height || 96) / anim.rows,
      columns: anim.columns,
      rows: anim.rows
    });
  },
  
  /**
   * Create a sequence sprite animator
   * @private
   */
  _createSequenceAnimator: function(basePath, character, anim, commonOpts) {
    // Generate image paths for each frame
    let imagePaths = [];
    
    if (Array.isArray(anim.frames)) {
      // Use provided frame paths
      imagePaths = anim.frames.map(frame => basePath + frame);
    } else {
      // Generate sequence paths from pattern
      for (let i = 0; i < commonOpts.frameCount; i++) {
        const index = String(i).padStart(2, '0');
        const pattern = anim.pattern || `${anim.name}_${index}.png`;
        imagePaths.push(basePath + pattern.replace('{i}', index));
      }
    }
    
    return new UniversalSpriteAnimator({
      ...commonOpts,
      layout: 'sequence',
      imagePaths: imagePaths,
      frameWidth: anim.width || 96,
      frameHeight: anim.height || 96
    });
  },
  
  /**
   * Change animation for a character
   * 
   * @param {string} animationId - Animation ID from createAnimation
   * @param {string} animationName - New animation name
   * @param {Object} options - Optional settings for the new animation
   * @returns {boolean} Success
   */
  changeAnimation: function(animationId, animationName, options = {}) {
    // Check if animation exists
    if (!this.animations[animationId]) {
      console.error(`Animation not found: ${animationId}`);
      return false;
    }
    
    const animation = this.animations[animationId];
    const character = CharacterAssets.getCharacter(animation.character);
    
    // Check if requested animation exists
    if (!character.animations[animationName]) {
      console.error(`Animation "${animationName}" not found for character ${animation.character}`);
      return false;
    }
    
    // Save current container
    const container = animation.animator.container;
    
    // Destroy previous animator
    animation.animator.pause();
    
    // Determine layout type for new animation
    const anim = character.animations[animationName];
    const layoutType = this._determineLayoutType(anim);
    
    // Merge existing options with new ones
    const newOptions = {
      ...animation.options,
      ...options
    };
    
    // Create new animator
    const animator = this._createAnimatorForLayout(
      character, 
      animationName, 
      layoutType, 
      newOptions
    );
    
    // Mount to same container
    animator.mount(container);
    
    // Update stored animation
    animation.animator = animator;
    animation.currentAnimation = animationName;
    animation.layoutType = layoutType;
    animation.options = newOptions;
    
    // Auto play if not explicitly disabled
    if (newOptions.autoPlay !== false) {
      animator.play();
    }
    
    return true;
  },
  
  /**
   * Play an animation
   * 
   * @param {string} animationId - Animation ID
   * @returns {boolean} Success
   */
  play: function(animationId) {
    if (!this.animations[animationId]) {
      console.error(`Animation not found: ${animationId}`);
      return false;
    }
    
    this.animations[animationId].animator.play();
    return true;
  },
  
  /**
   * Pause an animation
   * 
   * @param {string} animationId - Animation ID
   * @returns {boolean} Success
   */
  pause: function(animationId) {
    if (!this.animations[animationId]) {
      console.error(`Animation not found: ${animationId}`);
      return false;
    }
    
    this.animations[animationId].animator.pause();
    return true;
  },
  
  /**
   * Stop an animation
   * 
   * @param {string} animationId - Animation ID
   * @returns {boolean} Success
   */
  stop: function(animationId) {
    if (!this.animations[animationId]) {
      console.error(`Animation not found: ${animationId}`);
      return false;
    }
    
    this.animations[animationId].animator.stop();
    return true;
  },
  
  /**
   * Remove and clean up an animation
   * 
   * @param {string} animationId - Animation ID
   * @returns {boolean} Success
   */
  removeAnimation: function(animationId) {
    if (!this.animations[animationId]) {
      console.error(`Animation not found: ${animationId}`);
      return false;
    }
    
    // Stop animation
    this.animations[animationId].animator.stop();
    
    // Remove from DOM if possible
    const container = this.animations[animationId].animator.container;
    if (container) {
      container.innerHTML = '';
    }
    
    // Remove from tracking
    delete this.animations[animationId];
    
    return true;
  },
  
  /**
   * Get current animation info
   * 
   * @param {string} animationId - Animation ID
   * @returns {Object|null} Animation info
   */
  getAnimationInfo: function(animationId) {
    if (!this.animations[animationId]) {
      return null;
    }
    
    const anim = this.animations[animationId];
    return {
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

// Make available globally
window.CharacterAnimation = CharacterAnimation;
