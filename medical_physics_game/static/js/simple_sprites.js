// Create a new file called simple_sprites.js

const SimpleSpriteSystem = {
    // Track active animations
    animations: {},
    
    // Create animation
    create(characterId, containerId, options = {}) {
      // Get container
      const container = document.getElementById(containerId);
      if (!container) return null;
      
      // Clear container
      container.innerHTML = '';
      
      // Create sprite element
      const spriteEl = document.createElement('div');
      spriteEl.className = 'simple-sprite';
      container.appendChild(spriteEl);
      
      // Create animation instance
      const id = `sprite_${Date.now()}`;
      this.animations[id] = {
        id,
        element: spriteEl,
        character: characterId,
        currentAnim: null,
        frameIndex: 0,
        frameCount: 0,
        frameTimer: null,
        options: {
          scale: options.scale || 3,
          frameRate: options.frameRate || 6
        }
      };
      
      // Play initial animation if specified
      if (options.initialAnim) {
        this.play(id, options.initialAnim);
      }
      
      return id;
    },
    
    // Play animation
    play(id, animName) {
      const anim = this.animations[id];
      if (!anim) return false;
      
      // Stop current animation
      this.stop(id);
      
      // Get animation data
      const charData = window.CharacterAssets.getCharacter(anim.character);
      if (!charData || !charData.animations || !charData.animations[animName]) {
        console.error(`Animation not found: ${animName}`);
        return false;
      }
      
      const animData = charData.animations[animName];
      const imagePath = `${charData.spritePath}${animData.file}`;
      const frameCount = animData.frames || 1;
      
      // Save current animation state
      anim.currentAnim = animName;
      anim.frameCount = frameCount;
      anim.frameIndex = 0;
      
      // Set up sprite element
      anim.element.style.width = '100%';
      anim.element.style.height = '100%';
      anim.element.style.backgroundImage = `url(${imagePath})`;
      anim.element.style.backgroundSize = `${frameCount * 100}% 100%`;
      anim.element.style.backgroundPosition = '0% 0%';
      anim.element.style.backgroundRepeat = 'no-repeat';
      anim.element.style.transform = `scale(${anim.options.scale})`;
      anim.element.style.transformOrigin = 'center center';
      
      // For multi-frame animations, start animation loop
      if (frameCount > 1) {
        const fps = 1000 / (animData.speed || (1000 / anim.options.frameRate));
        
        anim.frameTimer = setInterval(() => {
          // Increment frame
          anim.frameIndex = (anim.frameIndex + 1) % frameCount;
          
          // Update background position
          const position = -(anim.frameIndex * (100 / frameCount));
          anim.element.style.backgroundPosition = `${position}% 0%`;
        }, fps);
      }
      
      return true;
    },
    
    // Stop animation
    stop(id) {
      const anim = this.animations[id];
      if (!anim) return;
      
      if (anim.frameTimer) {
        clearInterval(anim.frameTimer);
        anim.frameTimer = null;
      }
    }
  };