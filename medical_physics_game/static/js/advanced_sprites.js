// static/js/advanced_sprites.js

/**
 * Enhanced sprite system that handles different sprite dimensions and layouts
 */
class SpriteManager {
    constructor() {
        this.sprites = {};
        this.spriteConfigs = {};
    }

    /**
     * Register a sprite configuration
     * @param {string} id - Unique identifier for this sprite
     * @param {Object} config - Configuration object for the sprite
     * @param {string} config.src - Path to the sprite image
     * @param {number} config.frameWidth - Width of each frame in pixels
     * @param {number} config.frameHeight - Height of each frame in pixels
     * @param {number} config.rows - Number of rows in the sprite sheet
     * @param {number} config.columns - Number of columns in the sprite sheet
     * @param {Object} config.animations - Map of animation names to frame sequences
     */
    registerSprite(id, config) {
        this.spriteConfigs[id] = {
            src: config.src,
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight,
            rows: config.rows || 1,
            columns: config.columns || 1,
            totalFrames: (config.rows || 1) * (config.columns || 1),
            animations: config.animations || {},
            loaded: false
        };
        
        // Preload the image
        const img = new Image();
        img.onload = () => {
            this.spriteConfigs[id].loaded = true;
            this.spriteConfigs[id].image = img;
        };
        img.src = config.src;
    }

    /**
     * Create a sprite instance
     * @param {string} configId - The sprite configuration to use
     * @param {HTMLElement} container - DOM element to append the sprite to
     * @returns {Object} - The sprite instance
     */
    createSprite(configId, container) {
        if (!this.spriteConfigs[configId]) {
            console.error(`Sprite config ${configId} not found`);
            return null;
        }

        const config = this.spriteConfigs[configId];
        const id = `sprite-${configId}-${Date.now()}`;
        
        // Create sprite element
        const spriteElement = document.createElement('div');
        spriteElement.id = id;
        spriteElement.className = 'game-sprite';
        spriteElement.style.width = `${config.frameWidth}px`;
        spriteElement.style.height = `${config.frameHeight}px`;
        spriteElement.style.backgroundImage = `url(${config.src})`;
        spriteElement.style.backgroundRepeat = 'no-repeat';
        
        if (container) {
            container.appendChild(spriteElement);
        }
        
        // Create sprite instance
        const sprite = {
            id,
            element: spriteElement,
            configId,
            currentAnimation: null,
            currentFrame: 0,
            animationInterval: null,
            position: { x: 0, y: 0 },
            scale: { x: 1, y: 1 },
            visible: true,
            
            // Methods
            setPosition(x, y) {
                this.position.x = x;
                this.position.y = y;
                this.element.style.left = `${x}px`;
                this.element.style.top = `${y}px`;
                return this;
            },
            
            setScale(x, y) {
                this.scale.x = x;
                this.scale.y = y || x;
                this.element.style.transform = `scale(${x}, ${y || x})`;
                return this;
            },
            
            setVisible(visible) {
                this.visible = visible;
                this.element.style.display = visible ? 'block' : 'none';
                return this;
            },
            
            setFrame(frameNumber) {
                const config = SpriteManager.instance.spriteConfigs[this.configId];
                if (frameNumber >= config.totalFrames) {
                    console.warn(`Frame ${frameNumber} out of bounds for sprite ${this.configId}`);
                    return this;
                }
                
                // Calculate row and column for the frame
                const row = Math.floor(frameNumber / config.columns);
                const col = frameNumber % config.columns;
                
                // Set background position
                const bgPosX = -(col * config.frameWidth);
                const bgPosY = -(row * config.frameHeight);
                this.element.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
                this.currentFrame = frameNumber;
                return this;
            },
            
            play(animationName, frameRate = 12, loop = true) {
                const config = SpriteManager.instance.spriteConfigs[this.configId];
                const animation = config.animations[animationName];
                
                if (!animation) {
                    console.error(`Animation ${animationName} not found for sprite ${this.configId}`);
                    return this;
                }
                
                // Clear any existing animation
                if (this.animationInterval) {
                    clearInterval(this.animationInterval);
                    this.animationInterval = null;
                }
                
                this.currentAnimation = animationName;
                let frameIndex = 0;
                
                // Set initial frame
                this.setFrame(animation.frames[frameIndex]);
                
                // Start animation loop
                this.animationInterval = setInterval(() => {
                    frameIndex = (frameIndex + 1) % animation.frames.length;
                    
                    // If we've reached the end and it's not a looping animation
                    if (frameIndex === 0 && !loop) {
                        clearInterval(this.animationInterval);
                        this.animationInterval = null;
                        this.currentAnimation = null;
                        
                        // Trigger onComplete callback if provided
                        if (animation.onComplete) {
                            animation.onComplete(this);
                        }
                        return;
                    }
                    
                    this.setFrame(animation.frames[frameIndex]);
                }, 1000 / frameRate);
                
                return this;
            },
            
            stop() {
                if (this.animationInterval) {
                    clearInterval(this.animationInterval);
                    this.animationInterval = null;
                }
                this.currentAnimation = null;
                return this;
            },
            
            destroy() {
                this.stop();
                if (this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
                delete SpriteManager.instance.sprites[this.id];
            },
            
            // Hitbox calculation
            getHitbox() {
                const rect = this.element.getBoundingClientRect();
                return {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            },
            
            // Collision detection
            collidesWith(otherSprite) {
                const a = this.getHitbox();
                const b = otherSprite.getHitbox();
                
                return !(
                    a.x + a.width < b.x ||
                    a.x > b.x + b.width ||
                    a.y + a.height < b.y ||
                    a.y > b.y + b.height
                );
            }
        };
        
        // Store the sprite instance
        this.sprites[id] = sprite;
        return sprite;
    }
    
    /**
     * Remove all sprites
     */
    clear() {
        Object.values(this.sprites).forEach(sprite => sprite.destroy());
    }
}

// Singleton instance
SpriteManager.instance = new SpriteManager();

// Export the singleton
window.SpriteManager = SpriteManager.instance;