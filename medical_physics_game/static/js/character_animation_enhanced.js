// UPDATED CHARACTER ANIMATION SYSTEM - PERMANENT IMPLEMENTATION

// 1. First, add these CSS styles to your character_sprites.css or directly to your HTML
const newStyles = `
/* Improved character display containers */
.character-avatar {
    width: 400px !important;
    height: 300px !important;
    border: 2px solid #5b8dd9 !important;
    background-color: rgba(91, 141, 217, 0.1) !important;
    position: relative !important;
    margin: 0 auto 20px auto !important;
    overflow: visible !important;
}

.character-avatar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 25px 25px;
    pointer-events: none;
    z-index: 5;
}

.sprite-container {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    position: relative !important;
}

.character-sprite {
    image-rendering: pixelated !important;
    image-rendering: crisp-edges !important;
}

/* Hide redundant visualizer */
.debug-visualizer {
    display: none !important;
}
`;

// 2. Add this function to your AnimationSystem object
AnimationSystem._setupSpritesheet = function(animation, animData) {
    try {
        // Clear container
        animation.container.innerHTML = '';
        
        // Get paths and info
        const characterId = animation.characterId;
        const animationName = animation.currentAnimation;
        const imagePath = `/static/img/characters/${characterId}/${animationName}.png`;
        const frameCount = animData.frames || 1;
        
        console.log(`Setting up ${frameCount}-frame animation from ${imagePath}`);
        
        if (frameCount > 1) {
            // MULTI-FRAME APPROACH
            // Create an outer container for better positioning
            const outerContainer = document.createElement('div');
            outerContainer.className = 'sprite-outer-container';
            outerContainer.style.width = '200px';  // Explicit width - WIDER
            outerContainer.style.height = '200px'; // Explicit height
            outerContainer.style.position = 'relative';
            outerContainer.style.margin = '0 auto';
            outerContainer.style.border = '1px dashed rgba(255,255,255,0.3)';
            
            // Create the sprite element
            const sprite = document.createElement('div');
            sprite.className = 'character-sprite';
            sprite.style.width = `${frameCount * 100}%`;
            sprite.style.height = '100%';
            sprite.style.backgroundImage = `url(${imagePath})`;
            sprite.style.backgroundRepeat = 'no-repeat';
            sprite.style.backgroundSize = `${frameCount * 100}% 100%`;
            sprite.style.position = 'absolute';
            sprite.style.left = '0';
            sprite.style.top = '0';
            
            // Add sprite to container
            outerContainer.appendChild(sprite);
            animation.container.appendChild(outerContainer);
            
            // Store references
            animation.sprite = sprite;
            
            // Add frame indicator
            const frameIndicator = document.createElement('div');
            frameIndicator.style.position = 'absolute';
            frameIndicator.style.bottom = '5px';
            frameIndicator.style.right = '5px';
            frameIndicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
            frameIndicator.style.color = 'white';
            frameIndicator.style.padding = '3px 6px';
            frameIndicator.style.fontSize = '12px';
            frameIndicator.style.borderRadius = '3px';
            frameIndicator.textContent = `Frame: 1/${frameCount}`;
            outerContainer.appendChild(frameIndicator);
            animation.frameIndicator = frameIndicator;
        } else {
            // SINGLE-FRAME APPROACH
            // Create an image with better sizing
            const img = document.createElement('img');
            img.src = imagePath;
            img.className = 'character-sprite';
            img.style.display = 'block';
            img.style.maxWidth = '200px';  // WIDER
            img.style.maxHeight = '200px';
            img.style.margin = '0 auto';
            img.style.imageRendering = 'pixelated';
            
            // Apply scale
            const scale = animation.options.scale || 1;
            img.style.transform = `scale(${scale})`;
            
            animation.container.appendChild(img);
            animation.sprite = img;
        }
        
        // Store animation properties
        animation.frames = frameCount;
        animation.frameSpeed = animData.speed || 200;
        animation.frameIndex = 0;
        
        // For multi-frame animations, set initial position and start animation
        if (frameCount > 1) {
            this._updateSpritePosition(animation, 0);
            this._startAnimationLoop(animation);
        }
        
        return true;
    } catch (error) {
        console.error("Sprite setup error:", error);
        animation.container.innerHTML = `<div style="color:red;padding:10px;">Error: ${error.message}</div>`;
        return false;
    }
};

// 3. Add this function to permanently apply the styles when the page loads
function initializeAnimationStyles() {
    // Add styles to head
    const styleEl = document.createElement('style');
    styleEl.textContent = newStyles;
    document.head.appendChild(styleEl);
    
    console.log("Animation styles initialized");
}

// 4. Call initialization function when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimationStyles);
} else {
    initializeAnimationStyles();
}
// Add this to your character_animation_enhanced.js file

// Add this to character_animation_enhanced.js - completely replace your existing overrides

// SUPER AGGRESSIVE DEBUG VERSION
AnimationSystem._setupSpritesheet = function(animation, animData) {
    try {
      // Clear container and add debug info
      animation.container.innerHTML = '<div style="color:yellow;padding:5px;background:rgba(0,0,0,0.5);position:absolute;top:0;left:0;z-index:999;">Debug: Setting up sprite</div>';
      
      // Get paths and info
      const characterId = animation.characterId;
      const animationName = animation.currentAnimation;
      const imagePath = `/static/img/characters/${characterId}/${animationName}.png`;
      const frameCount = animData.frames || 1;
      
      console.log(`Setting up ${frameCount}-frame animation from ${imagePath}`);
      
      // DIRECT IMAGE APPROACH - bypass all the complex container setup
      // Create a single image element
      const img = document.createElement('img');
      img.src = imagePath;
      img.className = 'debug-sprite-image';
      img.style.position = 'absolute';
      img.style.top = '0';
      img.style.left = '0';
      img.style.width = '97px';
      img.style.height = '108px'; // Show only one frame (864/8)
      img.style.objectFit = 'cover';
      img.style.objectPosition = '0 0'; // Start at first frame
      img.style.zIndex = '100'; // Force to front
      img.style.border = '3px solid red'; // Obvious border
      img.style.background = 'rgba(255,0,0,0.2)'; // Red tint for debugging
      img.style.imageRendering = 'pixelated';
      
      // Add to container
      animation.container.appendChild(img);
      animation.sprite = img;
      
      // Add frame indicator with high z-index
      const frameIndicator = document.createElement('div');
      frameIndicator.style.position = 'absolute';
      frameIndicator.style.bottom = '5px';
      frameIndicator.style.right = '5px';
      frameIndicator.style.backgroundColor = 'red';
      frameIndicator.style.color = 'white';
      frameIndicator.style.padding = '3px 6px';
      frameIndicator.style.fontSize = '12px';
      frameIndicator.style.borderRadius = '3px';
      frameIndicator.style.zIndex = '101'; // Above the image
      frameIndicator.textContent = `Frame: 1/${frameCount}`;
      animation.container.appendChild(frameIndicator);
      animation.frameIndicator = frameIndicator;
      
      // Store animation properties
      animation.frames = frameCount;
      animation.frameSpeed = animData.speed || 200;
      animation.frameIndex = 0;
      
      // Make the character avatar container visible
      const avatarEl = document.getElementById('character-avatar');
      if (avatarEl) {
        avatarEl.style.border = '5px solid lime';
        avatarEl.style.background = 'rgba(0,0,0,0.5)';
        avatarEl.style.position = 'relative';
        avatarEl.style.zIndex = '50';
        avatarEl.style.overflow = 'visible';
        avatarEl.style.minHeight = '150px';
      }
      
      // Start animation loop
      this._startAnimationLoop(animation);
      
      // FORCE PARENT CONTAINERS TO BE VISIBLE
      let parent = animation.container.parentElement;
      while (parent) {
        parent.style.display = 'block';
        parent.style.visibility = 'visible';
        parent.style.opacity = '1';
        parent = parent.parentElement;
      }
      
      console.log("✅ Sprite setup complete with debug mode");
      return true;
    } catch (error) {
      console.error("🔴 Sprite setup error:", error);
      animation.container.innerHTML = `<div style="color:red;padding:10px;z-index:999;position:relative;">Error: ${error.message}</div>`;
      return false;
    }
  };
  
  // Update the frame advancement function for the direct image approach
  AnimationSystem._advanceFrame = function(animationId) {
    const animation = this.activeAnimations[animationId];
    if (!animation || !animation.sprite) return;
    
    try {
      // Increment frame with wrap-around
      animation.frameIndex = (animation.frameIndex + 1) % animation.frames;
      
      // Calculate object position for sprite
      const frameHeight = 108; // 864px / 8 frames
      const posY = -(animation.frameIndex * frameHeight);
      
      // Set object-position to show the current frame
      animation.sprite.style.objectPosition = `0px ${posY}px`;
      
      // Update frame indicator
      if (animation.frameIndicator) {
        animation.frameIndicator.textContent = `Frame: ${animation.frameIndex+1}/${animation.frames}`;
        animation.frameIndicator.style.backgroundColor = 'red';
      }
      
      console.log(`Frame updated to: ${animation.frameIndex+1}/${animation.frames}, position: ${posY}px`);
    } catch (error) {
      console.error("🔴 Error advancing frame:", error);
    }
  };
  
  // Add this global CSS through JavaScript to ensure it's applied
  function addEmergencyCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* EMERGENCY OVERRIDE STYLES */
      .character-avatar, #character-avatar, [id^="character-sprite"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 50 !important;
        min-height: 150px !important;
        overflow: visible !important;
      }
      
      .debug-sprite-image {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Force all parent containers to be visible */
      .character-details, .character-avatar-container {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    console.log("🆘 Emergency CSS applied");
  }
  
  // Call this immediately
  addEmergencyCSS();
  
  // After page load, check if containers exist
  setTimeout(function() {
    console.log("Character Avatar Element:", document.getElementById('character-avatar'));
    console.log("Character Sprite Container:", document.getElementById('character-sprite-container'));
    
    // Check if any sprite animations are active
    console.log("Active Animations:", Object.keys(AnimationSystem.activeAnimations).length);
    
    // Force play the animation again
    if (window.residentAnimationId) {
      AnimationSystem.playAnimation(window.residentAnimationId, 'idle', true);
      console.log("🔄 Animation restarted");
    }
  }, 1000);