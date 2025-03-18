/**
 * visual-effects.js - Rewritten with fixed mouse interactions
 */

// Configuration for visual effects
const visualConfig = {
    shapes: {
        count: 32,
        minSize: 5,
        maxSize: 65,
        colors: [
            '#5b8dd9',         // primary blue
            '#56b886',         // secondary green
            '#9c77db',         // purple
            '#5bbcd9',         // cyan
            '#e67e73',         // danger red
            '#f0c866',         // warning yellow/gold
        ],
        staticShapes: {
            count: 45,
            minSize: 2,
            maxSize: 15,
            opacity: 0.15
        },
        largeDistantShapes: {
            count: 3,
            minSize: 80,
            maxSize: 150,
            opacity: 0.05
        },
        typeDistribution: {
            square: 0.55,
            circle: 0.25,
            triangle: 0.1,
            diamond: 0.1
        },
        sizeRules: {
            largeSize: 30,
            smallSize: 20,
            mediumHollowChance: 0.5
        },
        animation: {
            rotation: {
                chance: 0.7,
                minDuration: 25,
                maxDuration: 45
            },
            pulse: {
                chance: 0.15,
                amount: 0.03,
                minDuration: 3,
                maxDuration: 7
            }
        },
        mouseInteraction: {
            radius: 200,           // INCREASED from 150 to 200
            strength: 1.0,         // DRAMATICALLY increased from 0.2 to 1.0
            friction: 0.92,        // Adjusted from 0.95 to 0.92 for less drag
            maxSpeed: 5.0,         // Dramatically increased from 1.2 to 5.0
            springStrength: 0.002, // Reduced from 0.004 to make return to origin slower
            springRadius: 150,     // Increased from 100
            jitter: 0.0005
        }
    }
};

// Global variables
let shapes = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let lastMouseX = mouseX;
let lastMouseY = mouseY;
let mouseSpeed = 0;
let mouseDirection = { x: 0, y: 0 };
let hasMouseMoved = false;

/**
 * Initialize the system
 */
function init() {
    console.log("Initializing visual effects...");
    
    // Clean up any existing shapes
    clearExistingShapes();
    
    // Add styles for animations
    addAnimationStyles();
    
    // Create containers for shapes
    createContainers();
    
    // Create shapes
    createAllShapes();
    
    // Listen for mouse movement - with error checking and throttling
    try {
        // Remove excessive logging that slows performance
        document.addEventListener('mousemove', throttle(trackMouse, 10)); // Throttle to every 10ms
        console.log("Mouse tracking enabled");
    } catch (e) {
        console.error("Error setting up mouse tracking:", e);
    }
    
    // Start animation loop with requestAnimationFrame for optimal performance
    requestAnimationFrame(updateShapes);
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    console.log("Visual effects initialization complete");
}

/**
 * Simple throttle function to prevent excessive mousemove events
 */
function throttle(func, limit) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func.apply(this, args);
        }
    };
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
 * Add CSS styles for animations and screen effects
 */
function addAnimationStyles() {
    if (!document.getElementById('shape-animation-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'shape-animation-styles';
        styleEl.textContent = `
            /* Shape animations */
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
            
            /* CRT and scanline effects */
            .crt-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at center, rgba(10, 15, 30, 0) 0%, rgba(10, 15, 30, 0.3) 100%);
                pointer-events: none;
                z-index: 9997;
                mix-blend-mode: multiply;
                opacity: 0.4;
            }
            
            .scanlines {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    to bottom,
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0.03) 50%,
                    rgba(255, 255, 255, 0) 100%
                );
                background-size: 100% 2px;
                z-index: 9998;
                pointer-events: none;
                opacity: 0.25;
            }
            
            .vignette-effect {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                box-shadow: inset 0 0 150px rgba(0, 0, 0, 0.7);
                pointer-events: none;
                z-index: 9999;
                opacity: 0.3;
            }
            
            /* Subtle flicker animation */
            @keyframes crt-flicker {
                0% { opacity: 0.4; }
                42% { opacity: 0.4; }
                43% { opacity: 0.35; }
                44% { opacity: 0.4; }
                100% { opacity: 0.4; }
            }
            
            .crt-overlay {
                animation: crt-flicker 6s infinite;
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
    
    // Add screen effects
    // CRT effect (subtle curved screen effect)
    const crtOverlay = document.createElement('div');
    crtOverlay.classList.add('crt-overlay');
    document.body.appendChild(crtOverlay);
    
    // Scanlines effect
    const scanlines = document.createElement('div');
    scanlines.classList.add('scanlines');
    document.body.appendChild(scanlines);
    
    // Vignette effect (darkened corners)
    const vignette = document.createElement('div');
    vignette.classList.add('vignette-effect');
    document.body.appendChild(vignette);
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

// [The createStaticShape and createLargeDistantShape functions remain unchanged]

/**
 * Create dynamic shape with mouse interaction
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
                transition: opacity 0.3s; /* Add transition for opacity changes */
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
    
    // Randomize initial speed slightly for more natural movement
    const initialSpeedFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2 range
    
    // Store shape info for animation - give mass based on size (for physics)
    shapes.push({
        element: shape,
        x: x,
        y: y,
        originX: x,
        originY: y,
        size: size,
        mass: Math.max(0.2, Math.min(2.0, size / 30)), // Mass affects how much it responds to forces
        speedX: (Math.random() * 0.2 - 0.1) * initialSpeedFactor,
        speedY: (Math.random() * 0.2 - 0.1) * initialSpeedFactor,
        baseOpacity: opacity,
        rotation: hasRotation,
        shapeType: shapeType
    });
}

/**
 * Track mouse movement - captures mouse position and speed
 */
function trackMouse(e) {
    // Calculate mouse speed and direction for momentum-based interactions
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    // Only calculate speed if we have previous positions
    if (hasMouseMoved) {
        const dx = currentX - lastMouseX;
        const dy = currentY - lastMouseY;
        
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction vector
        const magnitude = Math.max(0.0001, mouseSpeed);
        mouseDirection = {
            x: dx / magnitude,
            y: dy / magnitude
        };
    } else {
        hasMouseMoved = true;
    }
    
    // Update positions
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = currentX;
    mouseY = currentY;
    
    // Remove excessive logging which hurts performance
    // console.log("Mouse position:", mouseX, mouseY);
}

/**
 * Update shapes position based on physics
 */
function updateShapes() {
    const interaction = visualConfig.shapes.mouseInteraction;
    
    // Apply mouse influence based on momentum for more realistic physics
    const pushFactor = Math.min(2.0, mouseSpeed * 0.1); // Scales with mouse speed
    
    shapes.forEach(shape => {
        // Apply friction
        shape.speedX *= interaction.friction;
        shape.speedY *= interaction.friction;
        
        // Tiny random movement (jitter)
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
        
        // FIXED MOUSE INTERACTION - Complete rewrite of this section
        const dxMouse = mouseX - shape.x;
        const dyMouse = mouseY - shape.y;
        const distanceFromMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        // Only apply force if mouse is close enough
        if (distanceFromMouse < interaction.radius) {
            // Calculate repulsion force with inverse square falloff for more realistic physics
            // Closer shapes get pushed more strongly
            const distanceFactor = Math.max(0.1, distanceFromMouse / interaction.radius);
            const influenceStrength = interaction.strength * (1 / (distanceFactor * distanceFactor)) * (1 / shape.mass);
            
            // Calculate the angle from mouse to shape (for pushing away)
            const angle = Math.atan2(dyMouse, dxMouse);
            
            // Apply force in the opposite direction of the mouse (push away)
            // Force is proportional to mouse speed for momentum effect
            const forceX = -Math.cos(angle) * influenceStrength * (1 + pushFactor);
            const forceY = -Math.sin(angle) * influenceStrength * (1 + pushFactor);
            
            // Add force to current speed
            shape.speedX += forceX;
            shape.speedY += forceY;
            
            // Visual effect: Temporarily increase opacity when interacting with mouse
            const currentOpacity = parseFloat(shape.element.style.opacity) || 0.3;
            shape.element.style.opacity = Math.min(0.9, currentOpacity * 1.8);
            shape.lastInteractionTime = Date.now();
        } else if (shape.lastInteractionTime) {
            // Gradually fade opacity back to normal
            const timeSinceInteraction = Date.now() - shape.lastInteractionTime;
            if (timeSinceInteraction > 500) { // Start fading sooner (500ms instead of 1000ms)
                const fadeProgress = Math.min(1, (timeSinceInteraction - 500) / 1500);
                const targetOpacity = shape.baseOpacity || 0.3;
                const currentOpacity = parseFloat(shape.element.style.opacity) || 0.3;
                
                if (currentOpacity > targetOpacity) {
                    shape.element.style.opacity = currentOpacity - (fadeProgress * (currentOpacity - targetOpacity) * 0.1);
                }
                
                if (Math.abs(currentOpacity - targetOpacity) < 0.01) {
                    shape.lastInteractionTime = null;
                }
            }
        }
        
        // Apply speed limit - but allow faster speeds for improved effect
        const currentSpeed = Math.sqrt(shape.speedX * shape.speedX + shape.speedY * shape.speedY);
        if (currentSpeed > interaction.maxSpeed) {
            const ratio = interaction.maxSpeed / currentSpeed;
            shape.speedX *= ratio;
            shape.speedY *= ratio;
        }
        
        // Apply movement
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        
        // Wrap around screen edges with a buffer
        const buffer = Math.max(20, shape.size / 2);
        if (shape.x < -buffer) shape.x = window.innerWidth + buffer;
        if (shape.x > window.innerWidth + buffer) shape.x = -buffer;
        if (shape.y < -buffer) shape.y = window.innerHeight + buffer;
        if (shape.y > window.innerHeight + buffer) shape.y = -buffer;
        
        // Update shape position - handle transform properly
        updateShapeTransform(shape);
    });
    
    // Gradient decay of mouse speed when not moving
    mouseSpeed *= 0.95;
    
    requestAnimationFrame(updateShapes);
}

/**
 * Update shape transform while preserving rotation
 */
function updateShapeTransform(shape) {
    const element = shape.element;
    
    // Get the current transform style
    const transform = element.style.transform || '';
    let rotationPart = '';
    
    // Extract any rotation part if it exists
    if (transform.includes('rotate')) {
        const rotateMatch = transform.match(/rotate\([^)]+\)/);
        if (rotateMatch) {
            rotationPart = rotateMatch[0];
        }
    }
    
    // For diamonds, we need to preserve the 45 degree rotation
    let baseRotation = '';
    if (shape.shapeType === 'diamond' && !shape.rotation) {
        baseRotation = 'rotate(45deg)';
    }
    
    // Update the transform with position and any rotation
    if (rotationPart) {
        element.style.transform = `translate3d(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px, 0) ${rotationPart}`;
    } else if (baseRotation) {
        element.style.transform = `translate3d(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px, 0) ${baseRotation}`;
    } else {
        element.style.transform = `translate3d(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px, 0)`;
    }
}

/**
 * Handle window resize
 */
function handleResize() {
    shapes.forEach(shape => {
        // Adjust position proportionally
        const widthRatio = window.innerWidth / shape.originX;
        const heightRatio = window.innerHeight / shape.originY;
        
        // Keep shapes within bounds
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

/**
 * Create static shape (simplified version)
 */
function createStaticShape(container) {
    const config = visualConfig.shapes.staticShapes;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    const color = visualConfig.shapes.colors[Math.floor(Math.random() * visualConfig.shapes.colors.length)];
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    const shape = document.createElement('div');
    const typeRoll = Math.random();
    
    if (typeRoll < 0.6) { // Square
        shape.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${Math.random() < 0.3 ? '2px' : '0'};
            left: ${x}px;
            top: ${y}px;
            opacity: ${config.opacity};
        `;
    } else { // Circle
        shape.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            opacity: ${config.opacity};
        `;
    }
    
    container.appendChild(shape);
}

/**
 * Create large distant shape
 */
function createLargeDistantShape(container) {
    const config = visualConfig.shapes.largeDistantShapes;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    const colors = ['#5b8dd9', '#9c77db', '#5bbcd9'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    const shape = document.createElement('div');
    const isCircle = Math.random() < 0.8;
    const borderWidth = 1;
    
    if (isCircle) {
        shape.style.cssText = `
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
        shape.style.cssText = `
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
    
    // Add rotation animation
    const duration = 40 + Math.random() * 30;
    shape.style.animationDuration = `${duration}s`;
    shape.classList.add('rotate');
    
    container.appendChild(shape);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Export for external access
window.initVisualEffects = init;