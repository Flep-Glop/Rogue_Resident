// Simple Character Animation System

const SimpleCharacterAnimation = {
    // The active sprite element
    spriteElement: null,
    
    // Current animation state
    currentAnimation: null,
    frameIndex: 0,
    animationTimer: null,
    
    // Debug elements
    debugState: null,
    frameCounter: null,
    
    // Initialize with character container ID
    init: function(containerId) {
        // Get the container
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }
        
        // Create sprite element
        this.spriteElement = document.createElement('div');
        this.spriteElement.className = 'character-sprite';
        container.appendChild(this.spriteElement);
        
        // Set up debug elements
        this.debugState = document.getElementById('anim-state');
        this.frameCounter = document.getElementById('frame-counter');
        
        console.log('Animation system initialized');
        
        // Start with idle animation
        this.playAnimation('idle');
        
        return this;
    },
    
    // Animation definitions - edit these paths to match your file structure
    animations: {
        idle: {
            path: '/static/img/characters/resident/idle.png',
            frames: 1,
            frameRate: 1000, // Milliseconds per frame
            scale: 3,
            orientation: 'horizontal' // horizontal = multiple columns, vertical = multiple rows
        },
        walking: {
            path: '/static/img/characters/resident/walking.png',
            frames: 4,
            frameRate: 200,
            scale: 3,
            orientation: 'horizontal'
        },
        ability: {
            path: '/static/img/characters/resident/ability.png',
            frames: 6,
            frameRate: 150,
            scale: 3,
            loop: false, // Don't loop this animation
            orientation: 'horizontal'
        },
        specialAbility: {
            path: '/static/img/characters/resident/special_ability.png',
            frames: 10,
            frameRate: 120,
            scale: 3,
            loop: false,
            orientation: 'vertical' // Example of a vertical spritesheet
        }
    },
    
    // Play an animation by name
    playAnimation: function(animationName) {
        // Stop any current animation
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
        
        // Get animation data
        const anim = this.animations[animationName];
        if (!anim) {
            console.error(`Animation not found: ${animationName}`);
            return;
        }
        
        // Set current animation
        this.currentAnimation = animationName;
        this.frameIndex = 0;
        
        // Update debug info
        if (this.debugState) this.debugState.textContent = animationName;
        if (this.frameCounter) this.frameCounter.textContent = `1/${anim.frames}`;
        
        // Default orientation is horizontal if not specified
        const orientation = anim.orientation || 'horizontal';
        
        // Set sprite image and size
        this.spriteElement.style.width = '32px'; // Base size - adjust for your sprites
        this.spriteElement.style.height = '32px';
        this.spriteElement.style.transform = `scale(${anim.scale})`;
        
        // Set up sprite as background image
        this.spriteElement.style.backgroundImage = `url(${anim.path})`;
        
        // Set background size based on orientation
        if (orientation === 'horizontal') {
            // For horizontal spritesheets (width = frames * frame_width)
            this.spriteElement.style.backgroundSize = `${anim.frames * 100}% 100%`;
        } else {
            // For vertical spritesheets (height = frames * frame_height)
            this.spriteElement.style.backgroundSize = `100% ${anim.frames * 100}%`;
        }
        
        // Reset position
        this.spriteElement.style.backgroundPosition = '0% 0%';
        
        // Log that we're playing this animation
        console.log(`Playing animation: ${animationName} (${anim.frames} frames, ${orientation})`);
        
        // For single-frame animations, we're done
        if (anim.frames <= 1) return;
        
        // For multi-frame animations, start animation loop
        this.animationTimer = setInterval(() => {
            // Advance frame
            this.frameIndex = (this.frameIndex + 1) % anim.frames;
            
            // Update debug counter
            if (this.frameCounter) {
                this.frameCounter.textContent = `${this.frameIndex + 1}/${anim.frames}`;
            }
            
            // Calculate position based on orientation
            if (orientation === 'horizontal') {
                // For horizontal sprites, change the X position
                const position = -(this.frameIndex * (100 / anim.frames));
                this.spriteElement.style.backgroundPosition = `${position}% 0%`;
            } else {
                // For vertical sprites, change the Y position
                const position = -(this.frameIndex * (100 / anim.frames));
                this.spriteElement.style.backgroundPosition = `0% ${position}%`;
            }
            
            // If this is the last frame and we're not looping, stop
            if (this.frameIndex === anim.frames - 1 && anim.loop === false) {
                clearInterval(this.animationTimer);
                this.animationTimer = null;
                
                // Automatically go back to idle
                setTimeout(() => {
                    this.playAnimation('idle');
                }, 100);
            }
        }, anim.frameRate);
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Init with container ID
    SimpleCharacterAnimation.init('character-box');
    
    // Set up animation buttons
    document.getElementById('idle-btn').addEventListener('click', function() {
        SimpleCharacterAnimation.playAnimation('idle');
    });
    
    document.getElementById('walk-btn').addEventListener('click', function() {
        SimpleCharacterAnimation.playAnimation('walking');
    });
    
    document.getElementById('ability-btn').addEventListener('click', function() {
        SimpleCharacterAnimation.playAnimation('ability');
    });
    
    document.getElementById('special-btn').addEventListener('click', function() {
        SimpleCharacterAnimation.playAnimation('specialAbility');
    });
});