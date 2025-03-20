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

// Override the spritesheet setup function to handle your specific sprite
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
      
      // Create a visible container with border for debugging
      const outerContainer = document.createElement('div');
      outerContainer.className = 'sprite-outer-container';
      outerContainer.style.width = '97px';  // Width of a single frame
      outerContainer.style.height = '108px'; // Height of a single frame (864px/8)
      outerContainer.style.position = 'relative';
      outerContainer.style.margin = '0 auto';
      outerContainer.style.border = '1px dashed yellow'; // Debug border
      outerContainer.style.overflow = 'hidden'; // Important: hide overflow
      
      // Create the sprite element
      const sprite = document.createElement('div');
      sprite.className = 'character-sprite';
      sprite.style.width = '97px';  // Width of a single frame
      sprite.style.height = '864px'; // Total height of all frames
      sprite.style.backgroundImage = `url(${imagePath})`;
      sprite.style.backgroundRepeat = 'no-repeat';
      sprite.style.position = 'absolute';
      sprite.style.left = '0';
      sprite.style.top = '0';
      
      // Add sprite to container
      outerContainer.appendChild(sprite);
      animation.container.appendChild(outerContainer);
      
      // Store references
      animation.sprite = sprite;
      animation.outerContainer = outerContainer;
      
      // Add frame indicator for debugging
      const frameIndicator = document.createElement('div');
      frameIndicator.style.position = 'absolute';
      frameIndicator.style.bottom = '5px';
      frameIndicator.style.right = '5px';
      frameIndicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
      frameIndicator.style.color = 'white';
      frameIndicator.style.padding = '3px 6px';
      frameIndicator.style.fontSize = '12px';
      frameIndicator.style.borderRadius = '3px';
      frameIndicator.style.zIndex = '10';
      frameIndicator.textContent = `Frame: 1/${frameCount}`;
      outerContainer.appendChild(frameIndicator);
      animation.frameIndicator = frameIndicator;
      
      // Store animation properties
      animation.frames = frameCount;
      animation.frameSpeed = animData.speed || 150;
      animation.frameIndex = 0;
      
      // Start animation loop
      this._updateSpritePosition(animation, 0);
      this._startAnimationLoop(animation);
      
      return true;
    } catch (error) {
      console.error("Sprite setup error:", error);
      animation.container.innerHTML = `<div style="color:red;padding:10px;">Error: ${error.message}</div>`;
      return false;
    }
  };
  
  // Override the sprite position update function
  AnimationSystem._updateSpritePosition = function(animation, frameIndex) {
    if (!animation.sprite || animation.frames <= 1) return;
    
    // For vertical spritesheet, calculate Y position
    const frameHeight = 108; // 864px / 8 frames
    const posY = -(frameIndex * frameHeight);
    
    // Apply position
    animation.sprite.style.top = `${posY}px`;
    
    // Update frame indicator
    if (animation.frameIndicator) {
      animation.frameIndicator.textContent = `Frame: ${frameIndex+1}/${animation.frames}`;
    }
    
    console.log(`Updated to frame ${frameIndex+1}/${animation.frames}, position: ${posY}px`);
  };