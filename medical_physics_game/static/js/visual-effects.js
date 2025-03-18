/**
 * visual-effects.js - Optimized version with improved shape distribution
 * Fixes the issue with shapes stacking in the top left corner
 */

// Configuration
const visualConfig = {
    // Animation & physics settings
    physics: {
        repelForce: 3.0,        // How strongly shapes are pushed by mouse
        repelRadius: 200,       // How far the mouse influence reaches
        friction: 0.95,         // Air resistance (lower = more drag)
        returnForce: 0.03,      // Force pulling shapes back to origin
        maxSpeed: 15,           // Maximum velocity cap
    },
    
    // Shape counts and appearance
    shapes: {
        dynamic: {
            count: 32,          // Interactive shapes that respond to mouse
            minSize: 5,
            maxSize: 65,
            opacityRange: [0.3, 0.7],  // [min, max]
            opacityBoostNearMouse: 1.5  // How much to boost opacity near mouse
        },
        static: {
            count: 45,          // Background static shapes
            minSize: 2,
            maxSize: 15,
            opacity: 0.15
        },
        distant: {
            count: 3,           // Large distant shapes
            minSize: 80,
            maxSize: 150,
            opacity: 0.05
        }
    },
    
    // UI protection zone
    uiProtection: {
        centerX: 0.5,           // Center X position as ratio of screen width
        centerY: 0.5,           // Center Y position as ratio of screen height
        width: 500,             // Width of protected zone in pixels
        height: 350,            // Height of protected zone in pixels
        margin: 50              // Extra margin around protected zone
    },
    
    // Distribution settings
    distribution: {
        avoidCorners: true,     // Avoid placing shapes in corners
        cornerRadius: 150,      // Size of corner avoidance zones
        quadrantBalance: true,  // Try to balance shapes across screen quadrants
        edgeMargin: 100,        // Margin from screen edges
        cornerMargin: 120       // Explicit margin from corners (added for better corner avoidance)
    },
    
    // Color themes
    colors: {
        primary: [
            '#5b8dd9',         // primary blue
            '#56b886',         // secondary green
            '#9c77db',         // purple
            '#5bbcd9',         // cyan
            '#e67e73',         // danger red
            '#f0c866',         // warning yellow/gold
        ],
        contrast: [
            '#ffffff',         // white (rare)
            '#50e794',         // bright green
            '#ff5e87'          // pink
        ]
    },
    
    // Shape type distribution
    typeDistribution: {
        square: 0.55,      // 55% chance
        circle: 0.25,      // 25% chance
        triangle: 0.1,     // 10% chance
        diamond: 0.1       // 10% chance
    },
    
    // Animation settings
    animation: {
        rotation: {
            chance: 0.7,       // 70% of shapes will rotate
            minDuration: 25,   // Minimum rotation duration in seconds
            maxDuration: 45    // Maximum rotation duration in seconds
        },
        pulse: {
            chance: 0.15,      // 15% of shapes will pulse size
            minDuration: 3,    // Minimum pulse duration in seconds
            maxDuration: 7     // Maximum pulse duration in seconds
        },
        rainbow: {
            chance: 0.02       // 2% chance for rainbow color effect
        }
    },
    
    // Hollow vs filled shapes
    hollow: {
        largeSize: 30,      // Shapes larger than this are always hollow
        smallSize: 20,      // Shapes smaller than this are always filled
        mediumChance: 0.5   // 50% chance for medium shapes to be hollow
    }
};

// Global variables
let shapes = [];
let staticShapes = [];
let distantShapes = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseActive = false;
let lastInteractionTime = 0;
let screenQuadrants = [0, 0, 0, 0]; // Track shape count in each quadrant
let previousWindowWidth = window.innerWidth;
let previousWindowHeight = window.innerHeight;

// Initialize the system
function init() {
    console.log("Initializing visual effects...");
    
    // Clean up any existing shapes
    cleanup();
    
    // Create containers
    createContainers();
    
    // Add animation styles
    addAnimationStyles();
    
    // Store initial window dimensions
    previousWindowWidth = window.innerWidth;
    previousWindowHeight = window.innerHeight;
    
    // Reset quadrant counts
    resetQuadrantCounts();
    
    // Create all shape types
    createAllShapes();
    
    // Set up event listeners
    document.addEventListener('mousemove', trackMouse);
    document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget) {
            mouseActive = false;
        }
    });
    window.addEventListener('resize', handleResize);
    
    // Start animation loop
    requestAnimationFrame(updateShapes);
    
    console.log("Visual effects initialization complete");
}

// Clean up existing shapes and containers
function cleanup() {
    shapes = [];
    staticShapes = [];
    distantShapes = [];
    
    // Remove existing containers
    const containers = [
        document.getElementById('background-shapes'),
        document.getElementById('static-shapes'),
        document.getElementById('distant-shapes'),
        document.querySelector('.crt-overlay'),
        document.querySelector('.scanlines'),
        document.querySelector('.vignette-effect')
    ];
    
    containers.forEach(container => {
        if (container) container.remove();
    });
    
    resetQuadrantCounts();
}

// Reset quadrant counts
function resetQuadrantCounts() {
    screenQuadrants = [0, 0, 0, 0];
}

// Add CSS styles for animations
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

// Create containers for different types of shapes
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
    distantContainer.id = 'distant-shapes';
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
    const crtOverlay = document.createElement('div');
    crtOverlay.classList.add('crt-overlay');
    document.body.appendChild(crtOverlay);
    
    const scanlines = document.createElement('div');
    scanlines.classList.add('scanlines');
    document.body.appendChild(scanlines);
    
    const vignette = document.createElement('div');
    vignette.classList.add('vignette-effect');
    document.body.appendChild(vignette);
}

// Create all shape types
function createAllShapes() {
    const staticContainer = document.getElementById('static-shapes');
    const distantContainer = document.getElementById('distant-shapes');
    const shapesContainer = document.getElementById('background-shapes');
    
    // Create static background shapes
    for (let i = 0; i < visualConfig.shapes.static.count; i++) {
        createStaticShape(staticContainer);
    }
    
    // Create large distant shapes
    for (let i = 0; i < visualConfig.shapes.distant.count; i++) {
        createLargeDistantShape(distantContainer);
    }
    
    // Create dynamic shapes
    for (let i = 0; i < visualConfig.shapes.dynamic.count; i++) {
        createDynamicShape(shapesContainer);
    }
}

// Get the center coordinates of the UI protection zone
function getProtectionZoneCenter() {
    const { uiProtection } = visualConfig;
    return {
        x: window.innerWidth * uiProtection.centerX,
        y: window.innerHeight * uiProtection.centerY
    };
}

// Get the dimensions of the UI protection zone
function getProtectionZoneDimensions() {
    const { uiProtection } = visualConfig;
    return {
        width: uiProtection.width + 2 * uiProtection.margin,
        height: uiProtection.height + 2 * uiProtection.margin
    };
}

// Check if a position is in the UI protection zone
function isInProtectionZone(x, y) {
    const center = getProtectionZoneCenter();
    const dimensions = getProtectionZoneDimensions();
    
    const halfWidth = dimensions.width / 2;
    const halfHeight = dimensions.height / 2;
    
    return (
        x >= center.x - halfWidth &&
        x <= center.x + halfWidth &&
        y >= center.y - halfHeight &&
        y <= center.y + halfHeight
    );
}

// Check if position is in a corner or too close to the edge
function isInCornerOrEdge(x, y) {
    const { cornerMargin, edgeMargin } = visualConfig.distribution;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Check all four corners
    if (x < cornerMargin && y < cornerMargin) return true; // Top-left
    if (x > width - cornerMargin && y < cornerMargin) return true; // Top-right
    if (x < cornerMargin && y > height - cornerMargin) return true; // Bottom-left
    if (x > width - cornerMargin && y > height - cornerMargin) return true; // Bottom-right
    
    // Check edges
    if (x < edgeMargin || x > width - edgeMargin || 
        y < edgeMargin || y > height - edgeMargin) return true;
    
    return false;
}

// Get the quadrant of a position (0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right)
function getQuadrant(x, y) {
    const quarterWidth = window.innerWidth / 2;
    const quarterHeight = window.innerHeight / 2;
    
    if (x < quarterWidth && y < quarterHeight) return 0; // Top-left
    if (x >= quarterWidth && y < quarterHeight) return 1; // Top-right
    if (x < quarterWidth && y >= quarterHeight) return 2; // Bottom-left
    return 3; // Bottom-right
}

// Get the least populated quadrant
function getLeastPopulatedQuadrant() {
    let minCount = Number.MAX_SAFE_INTEGER;
    let minIndex = 0;
    
    for (let i = 0; i < 4; i++) {
        if (screenQuadrants[i] < minCount) {
            minCount = screenQuadrants[i];
            minIndex = i;
        }
    }
    
    return minIndex;
}

// Generate a valid position in a specific quadrant
function generatePositionInQuadrant(quadrant, size) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const { edgeMargin, cornerMargin } = visualConfig.distribution;
    
    let x, y;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;
    
    do {
        // Generate position based on quadrant
        switch (quadrant) {
            case 0: // Top-left
                x = cornerMargin + Math.random() * (halfWidth - cornerMargin - edgeMargin);
                y = cornerMargin + Math.random() * (halfHeight - cornerMargin - edgeMargin);
                break;
            case 1: // Top-right
                x = halfWidth + edgeMargin + Math.random() * (halfWidth - cornerMargin - edgeMargin);
                y = cornerMargin + Math.random() * (halfHeight - cornerMargin - edgeMargin);
                break;
            case 2: // Bottom-left
                x = cornerMargin + Math.random() * (halfWidth - cornerMargin - edgeMargin);
                y = halfHeight + edgeMargin + Math.random() * (halfHeight - cornerMargin - edgeMargin);
                break;
            case 3: // Bottom-right
                x = halfWidth + edgeMargin + Math.random() * (halfWidth - cornerMargin - edgeMargin);
                y = halfHeight + edgeMargin + Math.random() * (halfHeight - cornerMargin - edgeMargin);
                break;
        }
        
        attempts++;
        
        // If we've tried too many times, relax the constraints
        if (attempts > MAX_ATTEMPTS) {
            // Generate a position anywhere on screen with edge margins
            x = edgeMargin + Math.random() * (width - 2 * edgeMargin);
            y = edgeMargin + Math.random() * (height - 2 * edgeMargin);
            break;
        }
    } while (isInProtectionZone(x, y) || isInCornerOrEdge(x, y));
    
    // Increment the counter for the quadrant we're using
    screenQuadrants[quadrant]++;
    
    return { x, y };
}

// Generate a balanced position for shapes
function generateBalancedPosition(size) {
    // Get the least populated quadrant for better distribution
    const quadrant = getLeastPopulatedQuadrant();
    return generatePositionInQuadrant(quadrant, size);
}

// Create a static background shape
function createStaticShape(container) {
    const config = visualConfig.shapes.static;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Generate balanced position
    const position = generateBalancedPosition(size);
    const x = position.x;
    const y = position.y;
    
    // Static shapes are always filled
    const color = visualConfig.colors.primary[Math.floor(Math.random() * visualConfig.colors.primary.length)];
    
    // Create shape element
    const shape = document.createElement('div');
    
    // Determine shape type
    let style;
    const typeRoll = Math.random();
    
    if (typeRoll < visualConfig.typeDistribution.square) {
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
    } else {
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
    }
    
    shape.style.cssText = style;
    container.appendChild(shape);
    
    // Store for reference
    staticShapes.push({
        element: shape,
        x: x,
        y: y,
        size: size,
        quadrant: getQuadrant(x, y)
    });
}

// Create a large distant shape
function createLargeDistantShape(container) {
    const config = visualConfig.shapes.distant;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Generate balanced position
    const position = generateBalancedPosition(size);
    const x = position.x;
    const y = position.y;
    
    // Always hollow
    const colors = visualConfig.colors.primary;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Create shape element
    const shape = document.createElement('div');
    
    // Almost always circles for distant shapes
    const isCircle = Math.random() < 0.8;
    
    // Very thin border
    const borderWidth = 1;
    
    // Create style
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
    
    // Store for reference
    distantShapes.push({
        element: shape,
        x: x,
        y: y,
        size: size,
        quadrant: getQuadrant(x, y)
    });
}

// Create dynamic shape with mouse interaction
function createDynamicShape(container) {
    const dynamicConfig = visualConfig.shapes.dynamic;
    
    // Size
    const size = dynamicConfig.minSize + Math.random() * (dynamicConfig.maxSize - dynamicConfig.minSize);
    
    // Generate balanced position
    const position = generateBalancedPosition(size);
    const x = position.x;
    const y = position.y;
    
    // Color selection
    let color;
    if (Math.random() < 0.01) {
        // 1% chance for contrast color (white, bright green, or pink)
        color = visualConfig.colors.contrast[Math.floor(Math.random() * visualConfig.colors.contrast.length)];
    } else {
        // Regular color from primary palette
        color = visualConfig.colors.primary[Math.floor(Math.random() * visualConfig.colors.primary.length)];
    }
    
    // Determine if shape should be hollow based on size
    let isHollow;
    if (size > visualConfig.hollow.largeSize) {
        isHollow = true; // Large shapes are always hollow
    } else if (size < visualConfig.hollow.smallSize) {
        isHollow = false; // Small shapes are always filled
    } else {
        // Medium shapes have a chance to be hollow
        isHollow = Math.random() < visualConfig.hollow.mediumChance;
    }
    
    // Calculate base opacity
    const opacityRange = dynamicConfig.opacityRange;
    const opacity = opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]);
    
    // Create shape element
    const shape = document.createElement('div');
    shape.className = 'dynamic-shape';
    
    let rotationTransform = '';
    let shapeType;
    
    // Determine shape type based on distribution
    const typeRoll = Math.random();
    
    if (typeRoll < visualConfig.typeDistribution.square) {
        shapeType = 'square';
        const borderRadius = Math.random() < 0.3 ? '2px' : '0';
        
        if (isHollow) {
            const borderWidth = Math.max(1, size / 20);
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border: ${borderWidth}px solid ${color};
                background-color: transparent;
                border-radius: ${borderRadius};
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
            `;
        } else {
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: ${borderRadius};
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
            `;
        }
    } else if (typeRoll < visualConfig.typeDistribution.square + visualConfig.typeDistribution.circle) {
        shapeType = 'circle';
        
        if (isHollow) {
            const borderWidth = Math.max(1, size / 20);
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border: ${borderWidth}px solid ${color};
                background-color: transparent;
                border-radius: 50%;
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
            `;
        } else {
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: 50%;
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
            `;
        }
    } else if (typeRoll < visualConfig.typeDistribution.square + visualConfig.typeDistribution.circle + visualConfig.typeDistribution.triangle) {
        shapeType = 'triangle';
        
        if (isHollow) {
            // We'll use a div with a border for hollow triangles
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size * 0.866}px; /* Height of equilateral triangle */
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
                border: 1px solid ${color};
                background-color: transparent;
            `;
        } else {
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size * 0.866}px; /* Height of equilateral triangle */
                background-color: ${color};
                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
            `;
        }
    } else {
        shapeType = 'diamond';
        rotationTransform = 'rotate(45deg)';
        
        if (isHollow) {
            const borderWidth = Math.max(1, size / 20);
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border: ${borderWidth}px solid ${color};
                background-color: transparent;
                transform: rotate(45deg);
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
            `;
        } else {
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                transform: rotate(45deg);
                left: 0;
                top: 0;
                opacity: ${opacity};
                will-change: transform;
                transition: opacity 0.3s;
            `;
        }
    }
    
    // Apply animations - diamonds already have rotation transform so avoid rotation animation
    let hasRotation = shapeType !== 'diamond' && Math.random() < visualConfig.animation.rotation.chance;
    const hasPulse = !hasRotation && Math.random() < visualConfig.animation.pulse.chance;
    
    // Add animations
    if (hasRotation) {
        // Slower rotation for larger shapes
        const sizeFactor = 1 + (size / dynamicConfig.maxSize);
        const { minDuration, maxDuration } = visualConfig.animation.rotation;
        const duration = (minDuration + Math.random() * (maxDuration - minDuration)) * sizeFactor;
        
        shape.style.animationDuration = `${duration}s`;
        shape.classList.add('rotate');
    }
    
    if (hasPulse) {
        // Don't combine pulse and rotation for simplicity
        const { minDuration, maxDuration } = visualConfig.animation.pulse;
        const duration = minDuration + Math.random() * (maxDuration - minDuration);
        
        shape.style.animationDuration = `${duration}s`;
        shape.classList.add('pulse');
    }
    
    // Rainbow effect (rare)
    if (Math.random() < visualConfig.animation.rainbow.chance) {
        shape.classList.add('rainbow');
    }
    
    container.appendChild(shape);
    
    // Add to shapes array - this is the physics model
    shapes.push({
        element: shape,
        x: x,
        y: y,
        originX: x,
        originY: y,
        velocityX: 0,
        velocityY: 0,
        size: size,
        baseOpacity: opacity,
        color: color,
        isHollow: isHollow,
        shapeType: shapeType,
        rotation: hasRotation,
        pulse: hasPulse,
        rotationTransform: rotationTransform,
        quadrant: getQuadrant(x, y),
        lastRepositioned: Date.now() // Track when it was last repositioned to prevent rapid bouncing
    });
}

// Track mouse movement
function trackMouse(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
    lastInteractionTime = Date.now();
}

// Main update loop for physics
function updateShapes() {
    // Update each shape
    shapes.forEach(updateShapePhysics);
    
    // Gradually fade out mouse influence if inactive
    if (mouseActive && Date.now() - lastInteractionTime > 100) {
        mouseActive = false;
    }
    
    // Continue animation loop
    requestAnimationFrame(updateShapes);
}

// Check if a shape is entering or inside the UI protected zone
function isEnteringProtectedZone(shape) {
    return isInProtectionZone(shape.x, shape.y);
}

// Check if a shape is too close to a corner
function isNearCorner(shape) {
    return isInCornerOrEdge(shape.x, shape.y);
}

// Safe repositioning of a trapped shape
function repositionTrappedShape(shape) {
    // Only reposition if it's been more than 1 second since last repositioning
    // This prevents rapid bouncing and strange behavior
    const now = Date.now();
    if (now - shape.lastRepositioned < 1000) {
        return;
    }
    
    // Find the least populated quadrant
    const quadrant = getLeastPopulatedQuadrant();
    
    // Generate a new position in that quadrant
    const position = generatePositionInQuadrant(quadrant, shape.size);
    
    // Update the shape's position and origin
    shape.x = position.x;
    shape.y = position.y;
    shape.originX = position.x;
    shape.originY = position.y;
    
    // Reset velocity
    shape.velocityX = 0;
    shape.velocityY = 0;
    
    // Update quadrant tracking
    screenQuadrants[shape.quadrant]--;
    shape.quadrant = quadrant;
    screenQuadrants[quadrant]++;
    
    // Mark as repositioned
    shape.lastRepositioned = now;
}

// Apply "corner avoidance" force to push shapes away from screen corners
function applyCornerAvoidanceForce(shape) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cornerMargin = visualConfig.distribution.cornerMargin;
    
    // Check proximity to each corner and apply a repelling force
    
    // Top-left corner
    if (shape.x < cornerMargin && shape.y < cornerMargin) {
        const dx = cornerMargin - shape.x;
        const dy = cornerMargin - shape.y;
        shape.velocityX += dx * 0.01;
        shape.velocityY += dy * 0.01;
    }
    
    // Top-right corner
    if (shape.x > width - cornerMargin && shape.y < cornerMargin) {
        const dx = width - cornerMargin - shape.x;
        const dy = cornerMargin - shape.y;
        shape.velocityX += dx * 0.01;
        shape.velocityY += dy * 0.01;
    }
    
    // Bottom-left corner
    if (shape.x < cornerMargin && shape.y > height - cornerMargin) {
        const dx = cornerMargin - shape.x;
        const dy = height - cornerMargin - shape.y;
        shape.velocityX += dx * 0.01;
        shape.velocityY += dy * 0.01;
    }
    
    // Bottom-right corner
    if (shape.x > width - cornerMargin && shape.y > height - cornerMargin) {
        const dx = width - cornerMargin - shape.x;
        const dy = height - cornerMargin - shape.y;
        shape.velocityX += dx * 0.01;
        shape.velocityY += dy * 0.01;
    }
}

// Update physics for a single shape
function updateShapePhysics(shape) {
    const physics = visualConfig.physics;
    
    // Apply friction (air resistance)
    shape.velocityX *= physics.friction;
    shape.velocityY *= physics.friction;
    
    // Return-to-origin force (spring)
    const dx = shape.originX - shape.x;
    const dy = shape.originY - shape.y;
    
    shape.velocityX += dx * physics.returnForce;
    shape.velocityY += dy * physics.returnForce;
    
    // Apply extra corner avoidance force
    applyCornerAvoidanceForce(shape);
    
    // Mouse repulsion
    if (mouseActive) {
        const mouseDistanceX = mouseX - shape.x;
        const mouseDistanceY = mouseY - shape.y;
        const distanceSquared = mouseDistanceX * mouseDistanceX + mouseDistanceY * mouseDistanceY;
        const distanceToMouse = Math.sqrt(distanceSquared);
        
        // Only apply force if mouse is within radius
        if (distanceToMouse < physics.repelRadius && distanceToMouse > 0) {
            // Calculate repulsion strength
            const factor = 1 - (distanceToMouse / physics.repelRadius);
            const strength = factor * physics.repelForce;
            
            // Apply force away from mouse
            const forceX = -mouseDistanceX / distanceToMouse * strength;
            const forceY = -mouseDistanceY / distanceToMouse * strength;
            
            shape.velocityX += forceX;
            shape.velocityY += forceY;
            
            // Increase opacity when affected by mouse
            const opacityBoost = visualConfig.shapes.dynamic.opacityBoostNearMouse;
            const targetOpacity = Math.min(1, shape.baseOpacity * opacityBoost);
            shape.element.style.opacity = targetOpacity;
            
            // Store last time affected for fading
            shape.lastAffected = Date.now();
        } else if (shape.lastAffected) {
            // Gradually fade back to normal opacity
            const timeSinceAffected = Date.now() - shape.lastAffected;
            if (timeSinceAffected > 300) {
                const currentOpacity = parseFloat(shape.element.style.opacity);
                
                if (Math.abs(currentOpacity - shape.baseOpacity) > 0.01) {
                    // Ease back to base opacity
                    const newOpacity = currentOpacity + (shape.baseOpacity - currentOpacity) * 0.1;
                    shape.element.style.opacity = newOpacity;
                } else {
                    // Reset once we're back to normal
                    shape.element.style.opacity = shape.baseOpacity;
                    shape.lastAffected = null;
                }
            }
        }
    }
    
    // Extra repelling force from UI zone
    if (isEnteringProtectedZone(shape)) {
        const center = getProtectionZoneCenter();
        
        const dx = shape.x - center.x;
        const dy = shape.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Calculate stronger repulsion from center of UI zone
            const repulsionStrength = 0.5; // Adjust as needed
            
            // Add velocity away from center
            shape.velocityX += (dx / distance) * repulsionStrength;
            shape.velocityY += (dy / distance) * repulsionStrength;
        }
    }
    
    // Check if shape is trapped in a corner and reposition if necessary
    if (isNearCorner(shape)) {
        // Apply corner avoidance force to push it out gradually
        // If stuck for too long, reposition
        if (Math.abs(shape.velocityX) < 0.1 && Math.abs(shape.velocityY) < 0.1) {
            repositionTrappedShape(shape);
            return; // Skip the rest of the physics update
        }
    }
    
    // Apply speed limit
    const speed = Math.sqrt(shape.velocityX * shape.velocityX + shape.velocityY * shape.velocityY);
    if (speed > physics.maxSpeed) {
        shape.velocityX = (shape.velocityX / speed) * physics.maxSpeed;
        shape.velocityY = (shape.velocityY / speed) * physics.maxSpeed;
    }
    
    // Update position
    shape.x += shape.velocityX;
    shape.y += shape.velocityY;
    
    // Improved screen wrapping with increased buffer
    const buffer = shape.size * 2; // Double the buffer size for better edge handling
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (shape.x < -buffer) {
        shape.x = width + buffer / 2;
        // Also update the origin to avoid pulling back to off-screen
        shape.originX = shape.x;
    }
    if (shape.x > width + buffer) {
        shape.x = -buffer / 2;
        shape.originX = shape.x;
    }
    if (shape.y < -buffer) {
        shape.y = height + buffer / 2;
        shape.originY = shape.y;
    }
    if (shape.y > height + buffer) {
        shape.y = -buffer / 2;
        shape.originY = shape.y;
    }
    
    // Update visual element with transform
    updateShapeTransform(shape);
    
    // Update quadrant tracking if shape has moved to a different quadrant
    const currentQuadrant = getQuadrant(shape.x, shape.y);
    if (currentQuadrant !== shape.quadrant) {
        screenQuadrants[shape.quadrant]--;
        screenQuadrants[currentQuadrant]++;
        shape.quadrant = currentQuadrant;
    }
}

// Update the shape's visual transform
function updateShapeTransform(shape) {
    let transform;
    
    // Determine transform based on shape type
    if (shape.shapeType === 'diamond' && !shape.rotation) {
        // Diamond needs 45-degree rotation plus translation
        transform = `translate(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px) rotate(45deg)`;
    } else if (shape.rotation) {
        // If element has rotation animation, don't interfere with it - just translate
        transform = `translate(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px)`;
    } else {
        // Standard translation
        transform = `translate(${shape.x - shape.size/2}px, ${shape.y - shape.size/2}px)`;
    }
    
    // Apply transform
    shape.element.style.transform = transform;
}

// Handle window resize
function handleResize() {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    // Calculate ratios
    const widthRatio = currentWidth / previousWindowWidth;
    const heightRatio = currentHeight / previousWindowHeight;
    
    // Reset quadrant counts
    resetQuadrantCounts();
    
    // Update dynamic shapes
    shapes.forEach(shape => {
        // Scale positions proportionally
        shape.x *= widthRatio;
        shape.y *= heightRatio;
        shape.originX *= widthRatio;
        shape.originY *= heightRatio;
        
        // Keep within bounds
        shape.x = Math.min(Math.max(shape.x, 0), currentWidth);
        shape.y = Math.min(Math.max(shape.y, 0), currentHeight);
        shape.originX = Math.min(Math.max(shape.originX, 0), currentWidth);
        shape.originY = Math.min(Math.max(shape.originY, 0), currentHeight);
        
        // Update quadrant
        shape.quadrant = getQuadrant(shape.x, shape.y);
        screenQuadrants[shape.quadrant]++;
        
        // Update visual position
        updateShapeTransform(shape);
    });
    
    // Update static shapes
    staticShapes.forEach(shape => {
        const oldLeft = parseInt(shape.element.style.left, 10);
        const oldTop = parseInt(shape.element.style.top, 10);
        
        // Scale positions
        const newLeft = oldLeft * widthRatio;
        const newTop = oldTop * heightRatio;
        
        // Update DOM elements
        shape.element.style.left = `${newLeft}px`;
        shape.element.style.top = `${newTop}px`;
        
        // Update tracking
        shape.x = newLeft;
        shape.y = newTop;
        shape.quadrant = getQuadrant(shape.x, shape.y);
        screenQuadrants[shape.quadrant]++;
    });
    
    // Update distant shapes
    distantShapes.forEach(shape => {
        const oldLeft = parseInt(shape.element.style.left, 10);
        const oldTop = parseInt(shape.element.style.top, 10);
        
        // Scale positions
        const newLeft = oldLeft * widthRatio;
        const newTop = oldTop * heightRatio;
        
        // Update DOM elements
        shape.element.style.left = `${newLeft}px`;
        shape.element.style.top = `${newTop}px`;
        
        // Update tracking
        shape.x = newLeft + shape.size/2; // Adjust for centering
        shape.y = newTop + shape.size/2;
        shape.quadrant = getQuadrant(shape.x, shape.y);
        screenQuadrants[shape.quadrant]++;
    });
    
    // Update stored window dimensions
    previousWindowWidth = currentWidth;
    previousWindowHeight = currentHeight;
}

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', init);

// Export initialization function for external use
window.initVisualEffects = init;