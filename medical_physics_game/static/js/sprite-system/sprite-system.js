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
  // Simple debugger for sprite system migrations
window.SpriteDebug = {
  // Log active animations
  logAnimations: function() {
    console.group('Active SpriteSystem Animations');
    
    if (typeof SpriteSystem === 'undefined') {
      console.error('SpriteSystem not available');
      console.groupEnd();
      return;
    }
    
    const animations = SpriteSystem.animations;
    const count = Object.keys(animations).length;
    
    console.log(`Total active animations: ${count}`);
    
    for (const id in animations) {
      const anim = animations[id];
      const info = SpriteSystem.getAnimationInfo(id);
      
      console.log(`Animation ID: ${id}`, {
        character: info.character,
        animation: info.currentAnimation,
        playing: info.isPlaying,
        frame: `${info.currentFrame + 1}/${info.frameCount}`
      });
    }
    
    console.groupEnd();
  },
  
  // Check for old animation systems
  checkLegacySystems: function() {
    console.group('Animation Systems Check');
    
    const systems = {
      'SpriteSystem': typeof SpriteSystem !== 'undefined',
      'CharacterAnimation': typeof CharacterAnimation !== 'undefined',
      'FixedVerticalSpriteAnimator': typeof FixedVerticalSpriteAnimator !== 'undefined',
      'UniversalSpriteAnimator': typeof UniversalSpriteAnimator !== 'undefined',
      'SpriteManager': typeof SpriteManager !== 'undefined',
      'EnhancedSpriteAnimator': typeof EnhancedSpriteAnimator !== 'undefined',
      'SimpleSpriteSystem': typeof SimpleSpriteSystem !== 'undefined'
    };
    
    console.table(systems);
    console.groupEnd();
  },
  
  // Test sprite animation
  testAnimation: function(characterId, containerId, animation = 'idle') {
    if (typeof SpriteSystem === 'undefined') {
      console.error('SpriteSystem not available');
      return null;
    }
    
    // Create test container if not provided
    let container = null;
    if (containerId) {
      container = document.getElementById(containerId);
    }
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'sprite-test-container';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.width = '128px';
      container.style.height = '128px';
      container.style.backgroundColor = 'rgba(0,0,0,0.5)';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    
    // Create test animation
    const animId = SpriteSystem.createAnimation(
      characterId,
      container,
      {
        animation: animation,
        scale: 3,
        autoPlay: true,
        debug: true
      }
    );
    
    console.log(`Test animation created: ${animId}`);
    return animId;
  },
  
  // Compare old and new systems
  compareAnimations: function(characterId = 'resident') {
    if (typeof SpriteSystem === 'undefined') {
      console.error('SpriteSystem not available');
      return;
    }
    
    // Create test containers
    const testDiv = document.createElement('div');
    testDiv.innerHTML = `
      <div style="position:fixed; top:20px; right:20px; z-index:9999; 
                  background:rgba(0,0,0,0.8); padding:10px; border-radius:5px;">
        <h3 style="color:white; margin:0 0 10px 0; font-size:14px;">Animation Comparison</h3>
        <div style="display:flex; gap:10px;">
          <div>
            <p style="color:white; margin:0 0 5px 0; font-size:12px;">New System</p>
            <div id="new-system-test" style="width:96px; height:96px; background:rgba(255,255,255,0.1);"></div>
          </div>
          <div>
            <p style="color:white; margin:0 0 5px 0; font-size:12px;">Old System</p>
            <div id="old-system-test" style="width:96px; height:96px; background:rgba(255,255,255,0.1);"></div>
          </div>
        </div>
        <button id="close-test" style="margin-top:10px; padding:5px; font-size:12px;">Close</button>
      </div>
    `;
    document.body.appendChild(testDiv);
    
    // Create animations
    const newAnimId = SpriteSystem.createAnimation(
      characterId,
      document.getElementById('new-system-test'),
      {
        animation: 'idle',
        scale: 2,
        autoPlay: true
      }
    );
    
    // Create old system animation if available
    let oldAnimId = null;
    if (typeof CharacterAnimation !== 'undefined' && 
        typeof CharacterAnimation.createAnimation === 'function') {
      oldAnimId = CharacterAnimation.createAnimation(
        characterId,
        document.getElementById('old-system-test'),
        {
          initialAnimation: 'idle',
          scale: 2,
          autoPlay: true
        }
      );
    } else {
      document.getElementById('old-system-test').innerHTML = 
        '<p style="color:red; font-size:10px;">Old system not available</p>';
    }
    
    // Add close button handler
    document.getElementById('close-test').addEventListener('click', function() {
      // Clean up animations
      if (newAnimId) SpriteSystem.removeAnimation(newAnimId);
      if (oldAnimId && typeof CharacterAnimation !== 'undefined' && 
          typeof CharacterAnimation.removeAnimation === 'function') {
        CharacterAnimation.removeAnimation(oldAnimId);
      }
      
      // Remove test div
      document.body.removeChild(testDiv);
    });
  }
};

// Console help message
console.log(
  '%cSprite System Migration Tools Available',
  'background: #4a70b0; color: white; padding: 5px; border-radius: 3px;'
);
console.log(
  '%cTry these commands:\n' +
  '- SpriteDebug.logAnimations()\n' +
  '- SpriteDebug.checkLegacySystems()\n' +
  '- SpriteDebug.testAnimation("resident")\n' +
  '- SpriteDebug.compareAnimations()',
  'color: #5b8dd9;'
);

// Simple debugger for sprite system migrations
window.SpriteDebug = {
    // Log active animations
    logAnimations: function() {
      console.group('Active SpriteSystem Animations');
      
      if (typeof SpriteSystem === 'undefined') {
        console.error('SpriteSystem not available');
        console.groupEnd();
        return;
      }
      
      const animations = SpriteSystem.animations;
      const count = Object.keys(animations).length;
      
      console.log(`Total active animations: ${count}`);
      
      for (const id in animations) {
        const anim = animations[id];
        const info = SpriteSystem.getAnimationInfo(id);
        
        console.log(`Animation ID: ${id}`, {
          character: info.character,
          animation: info.currentAnimation,
          playing: info.isPlaying,
          frame: `${info.currentFrame + 1}/${info.frameCount}`
        });
      }
      
      console.groupEnd();
    },
    
    // Check for old animation systems
    checkLegacySystems: function() {
      console.group('Animation Systems Check');
      
      const systems = {
        'SpriteSystem': typeof SpriteSystem !== 'undefined',
        'CharacterAnimation': typeof CharacterAnimation !== 'undefined',
        'FixedVerticalSpriteAnimator': typeof FixedVerticalSpriteAnimator !== 'undefined',
        'UniversalSpriteAnimator': typeof UniversalSpriteAnimator !== 'undefined',
        'SpriteManager': typeof SpriteManager !== 'undefined',
        'EnhancedSpriteAnimator': typeof EnhancedSpriteAnimator !== 'undefined',
        'SimpleSpriteSystem': typeof SimpleSpriteSystem !== 'undefined'
      };
      
      console.table(systems);
      console.groupEnd();
    },
    
    // Test sprite animation
    testAnimation: function(characterId, containerId, animation = 'idle') {
      if (typeof SpriteSystem === 'undefined') {
        console.error('SpriteSystem not available');
        return null;
      }
      
      // Create test container if not provided
      let container = null;
      if (containerId) {
        container = document.getElementById(containerId);
      }
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'sprite-test-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.width = '128px';
        container.style.height = '128px';
        container.style.backgroundColor = 'rgba(0,0,0,0.5)';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
      }
      
      // Create test animation
      const animId = SpriteSystem.createAnimation(
        characterId,
        container,
        {
          animation: animation,
          scale: 3,
          autoPlay: true,
          debug: true
        }
      );
      
      console.log(`Test animation created: ${animId}`);
      return animId;
    },
    
    // Compare old and new systems
    compareAnimations: function(characterId = 'resident') {
      if (typeof SpriteSystem === 'undefined') {
        console.error('SpriteSystem not available');
        return;
      }
      
      // Create test containers
      const testDiv = document.createElement('div');
      testDiv.innerHTML = `
        <div style="position:fixed; top:20px; right:20px; z-index:9999; 
                    background:rgba(0,0,0,0.8); padding:10px; border-radius:5px;">
          <h3 style="color:white; margin:0 0 10px 0; font-size:14px;">Animation Comparison</h3>
          <div style="display:flex; gap:10px;">
            <div>
              <p style="color:white; margin:0 0 5px 0; font-size:12px;">New System</p>
              <div id="new-system-test" style="width:96px; height:96px; background:rgba(255,255,255,0.1);"></div>
            </div>
            <div>
              <p style="color:white; margin:0 0 5px 0; font-size:12px;">Old System</p>
              <div id="old-system-test" style="width:96px; height:96px; background:rgba(255,255,255,0.1);"></div>
            </div>
          </div>
          <button id="close-test" style="margin-top:10px; padding:5px; font-size:12px;">Close</button>
        </div>
      `;
      document.body.appendChild(testDiv);
      
      // Create animations
      const newAnimId = SpriteSystem.createAnimation(
        characterId,
        document.getElementById('new-system-test'),
        {
          animation: 'idle',
          scale: 2,
          autoPlay: true
        }
      );
      
      // Create old system animation if available
      let oldAnimId = null;
      if (typeof CharacterAnimation !== 'undefined' && 
          typeof CharacterAnimation.createAnimation === 'function') {
        oldAnimId = CharacterAnimation.createAnimation(
          characterId,
          document.getElementById('old-system-test'),
          {
            initialAnimation: 'idle',
            scale: 2,
            autoPlay: true
          }
        );
      } else {
        document.getElementById('old-system-test').innerHTML = 
          '<p style="color:red; font-size:10px;">Old system not available</p>';
      }
      
      // Add close button handler
      document.getElementById('close-test').addEventListener('click', function() {
        // Clean up animations
        if (newAnimId) SpriteSystem.removeAnimation(newAnimId);
        if (oldAnimId && typeof CharacterAnimation !== 'undefined' && 
            typeof CharacterAnimation.removeAnimation === 'function') {
          CharacterAnimation.removeAnimation(oldAnimId);
        }
        
        // Remove test div
        document.body.removeChild(testDiv);
      });
    }
  };
  
  // Console help message
  console.log(
    '%cSprite System Migration Tools Available',
    'background: #4a70b0; color: white; padding: 5px; border-radius: 3px;'
  );
  console.log(
    '%cTry these commands:\n' +
    '- SpriteDebug.logAnimations()\n' +
    '- SpriteDebug.checkLegacySystems()\n' +
    '- SpriteDebug.testAnimation("resident")\n' +
    '- SpriteDebug.compareAnimations()',
    'color: #5b8dd9;'
  );
// Add this function to your SpriteSystem object

/**
 * Create a new animation (extended to support NPCs)
 * @param {string} entityId Character or NPC identifier
 * @param {HTMLElement|string} container Container element or selector
 * @param {Object} options Animation options
 * @returns {string} Animation ID
 */
SpriteSystem.createAnimation = function(entityId, container, options = {}) {
  // Check if this is an NPC first
  if (window.NPCAssets && NPCAssets.getNPC(entityId)) {
    return this._createNPCAnimation(entityId, container, options);
  }
  
  // Otherwise, assume it's a player character
  return this._createCharacterAnimation(entityId, container, options);
};

/**
 * Create a character animation (internal method)
 * @private
 */
SpriteSystem._createCharacterAnimation = function(characterId, container, options = {}) {
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
  const id = `character_${characterId}_${this.nextId++}`;
  
  // Store animation data
  this.animations[id] = {
    id,
    animator,
    entityType: 'character',
    entityId: characterId,
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
};

/**
 * Create an NPC animation (internal method)
 * @private
 */
SpriteSystem._createNPCAnimation = function(npcId, container, options = {}) {
  // Get NPC data
  if (!window.NPCAssets) {
    console.error('NPCAssets not available');
    return null;
  }
  
  const npc = NPCAssets.getNPC(npcId);
  if (!npc) {
    console.error(`NPC not found: ${npcId}`);
    return null;
  }
  
  // Get animation name
  const animName = options.animation || 'idle';
  
  // Get animation data
  if (!npc.animations || !npc.animations[animName]) {
    console.error(`Animation "${animName}" not found for NPC ${npcId}`);
    return null;
  }
  
  const animData = npc.animations[animName];
  
  // Create animator instance
  const animator = new CanvasSpriteAnimator({
    imagePath: npc.spritePath + animData.file,
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
  const id = `npc_${npcId}_${this.nextId++}`;
  
  // Store animation data
  this.animations[id] = {
    id,
    animator,
    entityType: 'npc',
    entityId: npcId,
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
};

/**
 * Change to a different animation - updated to handle NPCs
 * @param {string} id Animation ID
 * @param {string} animationName New animation name
 * @param {Object} options Animation options
 * @returns {boolean} Success
 */
SpriteSystem.changeAnimation = function(id, animationName, options = {}) {
  const anim = this.animations[id];
  if (!anim) {
    console.error(`Animation not found: ${id}`);
    return false;
  }
  
  // Check entity type and get appropriate data
  let entityData, animations;
  
  if (anim.entityType === 'npc' && window.NPCAssets) {
    entityData = NPCAssets.getNPC(anim.entityId);
    if (!entityData) {
      console.error(`NPC not found: ${anim.entityId}`);
      return false;
    }
    animations = entityData.animations;
  } else {
    // Assume character
    if (!window.CharacterAssets) {
      console.error('CharacterAssets not available');
      return false;
    }
    entityData = CharacterAssets.getCharacter(anim.entityId);
    if (!entityData) {
      console.error(`Character not found: ${anim.entityId}`);
      return false;
    }
    animations = entityData.animations;
  }
  
  // Get animation data
  if (!animations || !animations[animationName]) {
    console.error(`Animation "${animationName}" not found for ${anim.entityType} ${anim.entityId}`);
    return false;
  }
  
  const animData = animations[animationName];
  
  // Clean up old animator
  const wasPlaying = anim.animator.isPlaying;
  anim.animator.destroy();
  
  // Create new animator
  const animator = new CanvasSpriteAnimator({
    imagePath: entityData.spritePath + animData.file,
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
