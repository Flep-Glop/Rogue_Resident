// character_animation.js - Manages character sprite animations

/**
 * CharacterAnimation - Handles sprite-based character animations
 * 
 * This system provides a flexible way to handle both:
 * 1. Single image sprites (static)
 * 2. Sprite sheets (animated)
 * 3. GIF animations
 * 4. Wide sprite sheets (ability animations)
 * 
 * It can be used anywhere characters are displayed in the game.
 */
const CharacterAnimation = {
  // Track active animations
  activeAnimations: {},
  
  // Initialize animation system
  initialize: function() {
    console.log("Character Animation system initialized");
    
    // Set up resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllAnimations();
      } else {
        this.resumeAllAnimations();
      }
    });
    
    return this;
  },
  
  // Create a new animation instance for a character
  createAnimation: function(characterId, containerId, options = {}) {
    if (!characterId || !containerId) {
      console.error("Missing required parameters for createAnimation");
      return null;
    }
    
    // Get container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Animation container not found: ${containerId}`);
      return null;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Default options
    const defaultOptions = {
      initialAnimation: 'idle',
      autoPlay: true,
      loop: true,
      scale: 1,
      centerImage: true,
      adaptiveWidth: false // New option for wide sprites
    };
    
    // Merge defaults with provided options
    const animOptions = {...defaultOptions, ...options};
    
    // Get character data
    if (!window.CharacterAssets) {
      console.error("CharacterAssets not available");
      return null;
    }
    
    const character = CharacterAssets.getCharacter(characterId);
    if (!character) {
      console.error(`Character not found: ${characterId}`);
      return null;
    }
    
    // Create animation container element
    const animationContainer = document.createElement('div');
    animationContainer.className = 'character-animation-container';
    animationContainer.style.position = 'relative';
    animationContainer.style.width = '100%';
    animationContainer.style.height = '100%';
    animationContainer.style.overflow = 'hidden';
    
    if (animOptions.centerImage) {
      animationContainer.style.display = 'flex';
      animationContainer.style.justifyContent = 'center';
      animationContainer.style.alignItems = 'center';
    }
    
    container.appendChild(animationContainer);
    
    // Create animation ID
    const animationId = `anim_${characterId}_${containerId}_${Date.now()}`;
    
    // Create animation instance
    const animation = {
      id: animationId,
      characterId: characterId,
      containerId: containerId,
      container: animationContainer,
      currentAnimation: null,
      frameIndex: 0,
      animationTimer: null,
      options: animOptions,
      isPlaying: false
    };
    
    // Store in active animations
    this.activeAnimations[animationId] = animation;
    
    // Set initial animation
    if (animOptions.initialAnimation && animOptions.autoPlay) {
      this.playAnimation(animationId, animOptions.initialAnimation);
    }
    
    return animationId;
  },
  
  // Play a specific animation for a character
  playAnimation: function(animationId, animationName = 'idle', loop = null) {
    const animation = this.activeAnimations[animationId];
    if (!animation) {
      console.error(`Animation not found: ${animationId}`);
      return false;
    }
    
    // Stop any current animation
    this.stopAnimation(animationId);
    
    // Get animation data
    const animData = CharacterAssets.getCharacterAnimation(animation.characterId, animationName);
    if (!animData) {
      console.error(`Animation data not found: ${animationName}`);
      return false;
    }
    
    // Save current animation name
    animation.currentAnimation = animationName;
    
    // Override loop behavior if specified
    if (loop !== null) {
      animation.options.loop = loop;
    }
    
    // Check if this is a GIF or a sprite sheet
    const isGif = animData.file.toLowerCase().endsWith('.gif');
    
    if (isGif) {
      // Handle GIF animation (simple image element)
      this._setupGifAnimation(animation, animData);
    } else {
      // Handle sprite sheet animation
      this._setupSpriteSheetAnimation(animation, animData);
    }
    
    animation.isPlaying = true;
    return true;
  },
  
  // Set up GIF animation
  _setupGifAnimation: function(animation, animData) {
    // Get image path
    const imagePath = CharacterAssets.characters[animation.characterId].spritePath + animData.file;
    
    // Create image element
    const img = document.createElement('img');
    img.src = imagePath;
    img.className = 'character-animation-gif';
    img.style.width = 'auto';
    img.style.height = '100%';
    img.style.imageRendering = 'pixelated';
    img.style.imageRendering = 'crisp-edges';
    
    if (animation.options.scale !== 1) {
      img.style.transform = `scale(${animation.options.scale})`;
    }
    
    // Clear container and add image
    animation.container.innerHTML = '';
    animation.container.appendChild(img);
  },
  
  // Set up sprite sheet animation
  _setupSpriteSheetAnimation: function(animation, animData) {
    // Get sprite path
    const spritePath = CharacterAssets.characters[animation.characterId].spritePath + animData.file;
    
    // Handle aspect ratio for wide sprites
    const aspectRatio = animData.aspectRatio || 1;
    
    // Create sprite container
    const spriteContainer = document.createElement('div');
    spriteContainer.className = 'character-sprite-container';
    if (animation.options.adaptiveWidth && aspectRatio !== 1) {
      spriteContainer.classList.add('wide-sprite');
    }
    
    spriteContainer.style.width = '100%';
    spriteContainer.style.height = '100%';
    spriteContainer.style.position = 'relative';
    spriteContainer.style.overflow = 'visible'; // Allow content to overflow
    
    // For wide sprites, adjust container
    if (animation.options.adaptiveWidth && aspectRatio !== 1) {
      spriteContainer.style.width = `${aspectRatio * 100}%`;
      spriteContainer.style.left = `${(1 - aspectRatio) * 50}%`; // Center wider sprites
    }
    
    // Create sprite element
    const sprite = document.createElement('div');
    sprite.className = 'character-sprite';
    sprite.dataset.animation = animation.currentAnimation;
    sprite.style.width = '100%';
    sprite.style.height = '100%';
    sprite.style.backgroundImage = `url(${spritePath})`;
    sprite.style.backgroundRepeat = 'no-repeat';
    sprite.style.backgroundPosition = '0 0';
    sprite.style.backgroundSize = `${animData.frames * 100}% 100%`;
    sprite.style.imageRendering = 'pixelated';
    sprite.style.imageRendering = 'crisp-edges';
    sprite.style.position = 'absolute';
    sprite.style.top = '50%';
    sprite.style.left = '50%';
    
    // Set initial scale with centering transform
    const scale = animation.options.scale || 1;
    animation.container.style.setProperty('--character-scale', scale);
    sprite.style.transform = `translate(-50%, -50%) scale(${scale})`;
    
    // Add sprite to container
    spriteContainer.appendChild(sprite);
    
    // Clear container and add sprite
    animation.container.innerHTML = '';
    animation.container.appendChild(spriteContainer);
    
    // Set up animation
    animation.frameIndex = 0;
    animation.sprite = sprite;
    animation.frames = animData.frames;
    animation.frameSpeed = animData.speed || 200; // Default 200ms per frame
    animation.isLooping = animation.options.loop;
    
    // Add "wide-mode" class to parent avatar container for wide animations
    if (animation.options.adaptiveWidth && aspectRatio !== 1) {
      const avatarContainer = document.querySelector('.character-avatar');
      if (avatarContainer) {
        avatarContainer.classList.add('ability-mode');
        
        // Store for later removal
        animation.avatarContainer = avatarContainer;
      }
    }
    
    // Start animation loop if more than 1 frame
    if (animData.frames > 1) {
      this._advanceFrame(animation.id);
      animation.animationTimer = setInterval(() => {
        this._advanceFrame(animation.id);
      }, animation.frameSpeed);
    }
  },
  
  // Advance to next frame in sprite sheet animation
  _advanceFrame: function(animationId) {
    const animation = this.activeAnimations[animationId];
    if (!animation || !animation.sprite || !animation.frames) return;
    
    // Increment frame
    animation.frameIndex = (animation.frameIndex + 1) % animation.frames;
    
    // Calculate background position
    const posX = -(animation.frameIndex * (100 / animation.frames));
    animation.sprite.style.backgroundPosition = `${posX}% 0`;
    
    // If we've reached the end and not looping, stop animation
    if (animation.frameIndex === animation.frames - 1 && !animation.isLooping) {
      // Add a small delay before stopping so the last frame is visible
      setTimeout(() => {
        this.stopAnimation(animationId);
        
        // Signal animation complete
        const event = new CustomEvent('animationComplete', {
          detail: {
            animationId: animationId,
            animationName: animation.currentAnimation
          }
        });
        document.dispatchEvent(event);
        
        // Clean up wide mode if used
        if (animation.avatarContainer) {
          animation.avatarContainer.classList.remove('ability-mode');
        }
        
        // If the sprite container has 'wide-sprite' class, remove it
        const container = document.querySelector(`#${animation.containerId} .character-sprite-container`);
        if (container && container.classList.contains('wide-sprite')) {
          container.classList.remove('wide-sprite');
        }
      }, animation.frameSpeed / 2);
    }
  },
  
  // Stop an animation
  stopAnimation: function(animationId) {
    const animation = this.activeAnimations[animationId];
    if (!animation) return false;
    
    // Clear any running timer
    if (animation.animationTimer) {
      clearInterval(animation.animationTimer);
      animation.animationTimer = null;
    }
    
    animation.isPlaying = false;
    return true;
  },
  
  // Pause all animations (for background tabs, etc.)
  pauseAllAnimations: function() {
    for (const animId in this.activeAnimations) {
      const animation = this.activeAnimations[animId];
      
      // Remember which animations were playing
      animation.wasPlaying = animation.isPlaying;
      
      // Stop animation
      if (animation.isPlaying) {
        this.stopAnimation(animId);
      }
    }
  },
  
  // Resume all animations
  resumeAllAnimations: function() {
    for (const animId in this.activeAnimations) {
      const animation = this.activeAnimations[animId];
      
      // Resume animations that were playing
      if (animation.wasPlaying) {
        this.playAnimation(animId, animation.currentAnimation);
      }
    }
  },
  
  // Destroy an animation instance
  destroyAnimation: function(animationId) {
    const animation = this.activeAnimations[animationId];
    if (!animation) return false;
    
    // Stop animation
    this.stopAnimation(animationId);
    
    // Clear container
    if (animation.container) {
      animation.container.innerHTML = '';
    }
    
    // Remove from active animations
    delete this.activeAnimations[animationId];
    
    return true;
  },
  
  // Handle window resize
  handleResize: function() {
    // Adjust any animations that need sizing updates
    for (const animId in this.activeAnimations) {
      const animation = this.activeAnimations[animId];
      
      // Only re-adjust active animations
      if (animation.isPlaying && animation.currentAnimation) {
        // Restart animation to refresh layout
        const currentAnim = animation.currentAnimation;
        this.playAnimation(animId, currentAnim);
      }
    }
  },
  
  // Set animation scale
  setAnimationScale: function(animationId, scale) {
    const animation = this.activeAnimations[animationId];
    if (!animation) return false;
    
    animation.options.scale = scale;
    
    // Set a CSS variable for the scale that we can use in our CSS
    animation.container.style.setProperty('--character-scale', scale);
    
    // Update scale of current animation
    const elements = animation.container.querySelectorAll('.character-sprite, .character-animation-gif');
    elements.forEach(el => {
      // Use CSS transform with translate to keep centered while scaling
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    });
    
    return true;
  },
  
  // Helper method to play ability animations
  playAbilityAnimation: function(animationId, abilityName, onCompleteCallback) {
    // Get animation
    const animation = this.activeAnimations[animationId];
    if (!animation) return false;
    
    // Ensure we have a character with this ability animation
    const animData = CharacterAssets.getCharacterAnimation(animation.characterId, abilityName);
    if (!animData) {
      console.error(`Ability animation not found: ${abilityName}`);
      return false;
    }
    
    // Set up event listener for animation completion
    const listener = (event) => {
      if (event.detail.animationId === animationId) {
        document.removeEventListener('animationComplete', listener);
        
        // Return to idle
        this.playAnimation(animationId, 'idle', true);
        
        // Call callback if provided
        if (onCompleteCallback && typeof onCompleteCallback === 'function') {
          onCompleteCallback();
        }
      }
    };
    
    document.addEventListener('animationComplete', listener);
    
    // Temporarily enable wide mode
    animation.options.adaptiveWidth = true;
    
    // Play the animation non-looping
    this.playAnimation(animationId, abilityName, false);
    
    return true;
  }
};

// Initialize on script load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      CharacterAnimation.initialize();
    });
  } else {
    CharacterAnimation.initialize();
  }
}

// Make available globally
window.CharacterAnimation = CharacterAnimation;