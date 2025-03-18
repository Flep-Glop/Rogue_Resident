/**
 * visual-effects.js - Complete rewrite for stable, properly working animation
 */

// Configuration for visual effects
const visualConfig = {
    // Shape settings
    shapes: {
        count: 32,             // Reduced count for better visual spacing
        minSize: 5,            // Minimum shape size
        maxSize: 65,           // Maximum shape size
        colors: [              // Colors matching your game theme with balanced distribution
            '#5b8dd9',         // primary blue
            '#56b886',         // secondary green
            '#9c77db',         // purple
            '#5bbcd9',         // cyan
            '#e67e73',         // danger red (less to keep it calming)
            '#f0c866',         // warning yellow/gold
            '#f0c866'          // duplicate yellow/gold for better balance
        ],
        staticShapes: {
            count: 45,         // Background static shapes
            minSize: 2,        // Smaller size for background shapes
            maxSize: 15,       // Max size for background shapes
            opacity: 0.15      // Reduced opacity for more subtle background
        },
        largeDistantShapes: {
            count: 3,          // Number of extra large distant shapes
            minSize: 80,       // Minimum size for large distant shapes
            maxSize: 150,      // Maximum size for large distant shapes
            opacity: 0.05      // Very low opacity for distant feel
        },
        typeDistribution: {
            square: 0.55,      // 55% squares
            circle: 0.25,      // 25% circles
            triangle: 0.1,     // 10% triangles
            diamond: 0.1       // 10% diamonds
        },
        // Rules for hollow vs. filled shapes
        sizeRules: {
            largeSize: 30,     // Shapes larger than this are always hollow
            smallSize: 20,     // Shapes smaller than this are always filled
            mediumHollowChance: 0.5 // 50% chance for medium shapes to be hollow
        },
        // Animation settings
        animation: {
            rotation: {
                chance: 0.3,       // 30% of shapes will rotate
                minDuration: 25,   // Minimum rotation duration in seconds
                maxDuration: 45    // Maximum rotation duration in seconds
            },
            pulse: {
                chance: 0.15,      // 15% of shapes will pulse size
                amount: 0.03,      // 3% size change
                minDuration: 3,    // Minimum pulse duration in seconds
                maxDuration: 7     // Maximum pulse duration in seconds
            }
        },
        mouseInteraction: {
            radius: 150,       // How far mouse influence reaches
            strength: 0.015,   // Strength of mouse influence
            friction: 0.985,   // Friction to slow movement
            maxSpeed: 0.15,    // Speed limit
            springStrength: 0.004, // How strongly shapes return to origin
            springRadius: 100, // How far shapes can drift before spring force
            jitter: 0.0005     // Tiny random movement
        }
    }
};

// Global variables
let shapes = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

/**
 * Initialize the system
 */
function init() {
    // Clean up any existing shapes
    clearExistingShapes();
    
    // Add styles for animations
    addAnimationStyles();
    
    // Create containers for shapes
    createContainers();
    
    // Create shapes
    createAllShapes();
    
    // Listen for mouse movement
    document.addEventListener('mousemove', trackMouse);
    
    // Start animation loop
    requestAnimationFrame(updateShapes);
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
}

/**
 * Clean up any existing shapes
 */
function clearExistingShapes() {
    shapes = [];
    
    // Remove existing containers
    const containers = [
        document.getElementById('background-shapes'),
        document.getElementById('static-shapes'),
        document.getElementById('large-distant-shapes')
    ];
    
    containers.forEach(container => {
        if (container) container.remove();
    });
}

/**
 * Add CSS styles for animations
 */
function addAnimationStyles() {
    if (!document.getElementById('shape-animation-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'shape-animation-styles';
        styleEl.textContent = `
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.03); }
                100% { transform: scale(1); }
            }
            
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            
            .rotate {
                animation-name: rotate;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
            }
            
            .pulse {
                animation-name: pulse;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
            }
            
            .rainbow {
                animation: rainbow 3s linear infinite;
            }
        `;
        document.head.appendChild(styleEl);
    }
}

/**
 * Create containers for different types of shapes
 */
function createContainers() {
    // Static background shapes container
    const staticContainer = document.createElement('div');
    staticContainer.id = 'static-shapes';
    staticContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
    `;
    document.body.appendChild(staticContainer);
    
    // Large distant shapes container
    const distantContainer = document.createElement('div');
    distantContainer.id = 'large-distant-shapes';
    distantContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    document.body.appendChild(distantContainer);
    
    // Active shapes container
    const shapesContainer = document.createElement('div');
    shapesContainer.id = 'background-shapes';
    shapesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
    `;
    document.body.appendChild(shapesContainer);
}

/**
 * Create all shape types
 */
function createAllShapes() {
    const staticContainer = document.getElementById('static-shapes');
    const distantContainer = document.getElementById('large-distant-shapes');
    const shapesContainer = document.getElementById('background-shapes');
    
    // Create static background shapes
    for (let i = 0; i < visualConfig.shapes.staticShapes.count; i++) {
        createStaticShape(staticContainer);
    }
    
    // Create large distant shapes
    for (let i = 0; i < visualConfig.shapes.largeDistantShapes.count; i++) {
        createLargeDistantShape(distantContainer);
    }
    
    // Create dynamic shapes
    for (let i = 0; i < visualConfig.shapes.count; i++) {
        createDynamicShape(shapesContainer);
    }
}

/**
 * Create a static background shape
 */
function createStaticShape(container) {
    const config = visualConfig.shapes.staticShapes;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Static shapes are always filled
    const color = visualConfig.shapes.colors[Math.floor(Math.random() * visualConfig.shapes.colors.length)];
    
    // Random position
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    // Create shape element
    const shape = document.createElement('div');
    
    // Determine shape type
    let shapeType, style;
    const typeRoll = Math.random();
    
    if (typeRoll < visualConfig.shapes.typeDistribution.square) {
        shapeType = 'square';
        const borderRadius = Math.random() < 0.3 ? '2px' : '0';
        style = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${borderRadius};
            left: ${x}px;
            top: ${y}px;
            opacity: ${config.opacity};
        `;
    } else if (typeRoll < visualConfig.shapes.typeDistribution.square + visualConfig.shapes.typeDistribution.circle) {
        shapeType = 'circle';
        style = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            opacity: ${config.opacity};
        `;
    } else if (typeRoll < visualConfig.shapes.typeDistribution.square + visualConfig.shapes.typeDistribution.circle + visualConfig.shapes.typeDistribution.triangle) {
        shapeType = 'triangle';
        style = `
            position: absolute;
            width: 0;
            height: 0;
            border-left: ${size/2}px solid transparent;
            border-right: ${size/2}px solid transparent;
            border-bottom: ${size}px solid ${color};
            left: ${x}px;
            top: ${y}px;
            opacity: ${config.opacity};
        `;
    } else {
        shapeType = 'diamond';
        style = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            transform: rotate(45deg);
            left: ${x}px;
            top: ${y}px;
            opacity: ${config.opacity};
        `;
    }
    
    shape.style.cssText = style;
    container.appendChild(shape);
}

/**
 * Create a large distant shape
 */
function createLargeDistantShape(container) {
    const config = visualConfig.shapes.largeDistantShapes;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Always hollow
    const colors = ['#5b8dd9', '#9c77db', '#5bbcd9'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Random position
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    // Create shape element
    const shape = document.createElement('div');
    
    // Almost always circles for distant shapes
    const isCircle = Math.random() < 0.8;
    
    // Very thin border
    const borderWidth = 1;
    
    // Long rotation animation
    let style;
    
    if (isCircle) {
        style = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border: ${borderWidth}px solid ${color};
            background-color: transparent;
            border-radius: 50%;
            left: ${x - size/2}px;
            top: ${y - size/2}px;
            opacity: ${config.opacity};
        `;
    } else {
        style = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border: ${borderWidth}px solid ${color};
            background-color: transparent;
            left: ${x - size/2}px;
            top: ${y - size/2}px;
            opacity: ${config.opacity};
        `;
    }
    
    shape.style.cssText = style;
    
    // Add rotation animation
    const duration = 40 + Math.random() * 30;
    shape.style.animationDuration = `${duration}s`;
    shape.classList.add('rotate');
    
    container.appendChild(shape);
}

/**
 * Create a dynamic shape with mouse interaction
 */
function createDynamicShape(container) {
    // Size
    const minSize = visualConfig.shapes.minSize;
    const maxSize = visualConfig.shapes.maxSize;
    const size = minSize + Math.random() * (maxSize - minSize);
    
    // Color - 1% chance for white, rest normal colors
    let color;
    if (Math.random() < 0.01) {
        color = '#ffffff'; // Rare white shape
    } else {
        color = visualConfig.shapes.colors[Math.floor(Math.random() * visualConfig.shapes.colors.length)];
    }
    
    // Random position
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    // Determine if shape should be hollow based on size
    let isHollow;
    if (size > visualConfig.shapes.sizeRules.largeSize) {
        isHollow = true; // Large shapes are always hollow
    } else if (size < visualConfig.shapes.sizeRules.smallSize) {
        isHollow = false; // Small shapes are always filled
    } else {
        // Medium shapes have a chance to be hollow
        isHollow = Math.random() < visualConfig.shapes.sizeRules.mediumHollowChance;
    }
    
    // Opacity based on size (larger = more transparent)
    let opacity;
    if (size > 40) {
        opacity = 0.2 + (Math.random() * 0.1);
    } else if (size > 25) {
        opacity = 0.25 + (Math.random() * 0.1);
    } else {
        opacity = 0.3 + (Math.random() * 0.15);
    }
    
    // Determine shape type
    let shapeType, style;
    const typeRoll = Math.random();
    
    if (typeRoll < visualConfig.shapes.typeDistribution.square) {
        shapeType = 'square';
        const borderRadius = Math.random() < 0.3 ? '2px' : '0';
        
        if (isHollow) {
            const borderWidth = Math.max(1, size / 20);
            style = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border: ${borderWidth}px solid ${color};
                background-color: transparent;
                border-radius: ${borderRadius};
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        } else {
            style = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: ${borderRadius};
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        }
    } else if (typeRoll < visualConfig.shapes.typeDistribution.square + visualConfig.shapes.typeDistribution.circle) {
        shapeType = 'circle';
        
        if (isHollow) {
            const borderWidth = Math.max(1, size / 20);
            style = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border: ${borderWidth}px solid ${color};
                background-color: transparent;
                border-radius: 50%;
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        } else {
            style = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: 50%;
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        }
    } else if (typeRoll < visualConfig.shapes.typeDistribution.square + visualConfig.shapes.typeDistribution.circle + visualConfig.shapes.typeDistribution.triangle) {
        shapeType = 'triangle';
        
        if (isHollow) {
            // Hollow triangles are trickier - use border trick
            style = `
                position: absolute;
                width: 0;
                height: 0;
                border-left: ${size/2}px solid transparent;
                border-right: ${size/2}px solid transparent;
                border-bottom: ${size}px solid transparent;
                box-shadow: 0 0 0 1px ${color};
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        } else {
            style = `
                position: absolute;
                width: 0;
                height: 0;
                border-left: ${size/2}px solid transparent;
                border-right: ${size/2}px solid transparent;
                border-bottom: ${size}px solid ${color};
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        }
    } else {
        shapeType = 'diamond';
        
        if (isHollow) {
            const borderWidth = Math.max(1, size / 20);
            style = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border: ${borderWidth}px solid ${color};
                background-color: transparent;
                transform: rotate(45deg);
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        } else {
            style = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                transform: rotate(45deg);
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                opacity: ${opacity};
                will-change: transform;
            `;
        }
    }
    
    // Create shape element
    const shape = document.createElement('div');
    shape.style.cssText = style;
    
    // Apply animations
    const hasRotation = Math.random() < visualConfig.shapes.animation.rotation.chance;
    const hasPulse = Math.random() < visualConfig.shapes.animation.pulse.chance;
    
    // Add animations
    if (hasRotation) {
        // Slower rotation for larger shapes
        const sizeFactor = 1 + (size / maxSize);
        const minDuration = visualConfig.shapes.animation.rotation.minDuration;
        const maxDuration = visualConfig.shapes.animation.rotation.maxDuration;
        const duration = (minDuration + Math.random() * (maxDuration - minDuration)) * sizeFactor;
        
        shape.style.animationDuration = `${duration}s`;
        shape.classList.add('rotate');
    }
    
    if (hasPulse && !hasRotation) {
        // Don't combine pulse and rotation for simplicity
        const minDuration = visualConfig.shapes.animation.pulse.minDuration;
        const maxDuration = visualConfig.shapes.animation.pulse.maxDuration;
        const duration = minDuration + Math.random() * (maxDuration - minDuration);
        
        shape.style.animationDuration = `${duration}s`;
        shape.classList.add('pulse');
    }
    
    // 2% chance for rainbow effect
    if (Math.random() < 0.02) {
        shape.classList.add('rainbow');
    }
    
    container.appendChild(shape);
    
    // Store shape info for animation
    shapes.push({
        element: shape,
        x: x,
        y: y,
        originX: x,
        originY: y,
        size: size,
        speedX: (Math.random() * 0.1 - 0.05) * visualConfig.shapes.mouseInteraction.maxSpeed,
        speedY: (Math.random() * 0.1 - 0.05) * visualConfig.shapes.mouseInteraction.maxSpeed
    });
}

/**
 * Track mouse movement
 */
function trackMouse(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

/**
 * Update shapes position based on physics
 */
function updateShapes() {
    const interaction = visualConfig.shapes.mouseInteraction;
    
    shapes.forEach(shape => {
        // Apply friction
        shape.speedX *= interaction.friction;
        shape.speedY *= interaction.friction;
        
        // Tiny random movement
        if (Math.random() < 0.02) {
            shape.speedX += (Math.random() - 0.5) * interaction.jitter;
            shape.speedY += (Math.random() - 0.5) * interaction.jitter;
        }
        
        // Spring force to return to origin
        const dxOrigin = shape.originX - shape.x;
        const dyOrigin = shape.originY - shape.y;
        const distanceFromOrigin = Math.sqrt(dxOrigin * dxOrigin + dyOrigin * dyOrigin);
        
        if (distanceFromOrigin > interaction.springRadius) {
            const springFactor = interaction.springStrength * 
                Math.pow((distanceFromOrigin - interaction.springRadius) / 100, 1.5);
            
            shape.speedX += dxOrigin * springFactor;
            shape.speedY += dyOrigin * springFactor;
        }
        
        // Mouse interaction
        const dxMouse = mouseX - shape.x;
        const dyMouse = mouseY - shape.y;
        const distanceFromMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distanceFromMouse < interaction.radius) {
            const influence = (1 - distanceFromMouse / interaction.radius) * interaction.strength;
            
            const angle = Math.atan2(dyMouse, dxMouse);
            shape.speedX -= Math.cos(angle) * influence;
            shape.speedY -= Math.sin(angle) * influence;
        }
        
        // Apply speed limit
        const currentSpeed = Math.sqrt(shape.speedX * shape.speedX + shape.speedY * shape.speedY);
        if (currentSpeed > interaction.maxSpeed) {
            const ratio = interaction.maxSpeed / currentSpeed;
            shape.speedX *= ratio;
            shape.speedY *= ratio;
        }
        
        // Apply movement
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        
        // Wrap around screen edges
        const buffer = shape.size / 2;
        if (shape.x < -buffer) shape.x = window.innerWidth + buffer;
        if (shape.x > window.innerWidth + buffer) shape.x = -buffer;
        if (shape.y < -buffer) shape.y = window.innerHeight + buffer;
        if (shape.y > window.innerHeight + buffer) shape.y = -buffer;
        
        // Update shape position
        const transform = shape.element.style.transform;
        let baseTransform = '';
        
        // Need to preserve any rotation in transform
        if (transform.includes('rotate')) {
            baseTransform = transform.replace(/translate\([^)]+\)/, '');
            shape.element.style.transform = `translate(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px) ${baseTransform}`;
        } else {
            shape.element.style.transform = `translate(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px)`;
        }
    });
    
    requestAnimationFrame(updateShapes);
}

/**
 * Handle window resize
 */
function handleResize() {
    shapes.forEach(shape => {
        // Adjust position proportionally
        if (shape.x > window.innerWidth) {
            shape.x = window.innerWidth * Math.random();
            shape.originX = shape.x;
        }
        if (shape.y > window.innerHeight) {
            shape.y = window.innerHeight * Math.random();
            shape.originY = shape.y;
        }
    });
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Export for external access
window.initVisualEffects = init;