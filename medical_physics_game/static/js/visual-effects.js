/**
 * visual-effects.js - Modified with minimal changes to fix top-left stacking issue
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
        topLeftExtraMargin: 150 // ADDED: Extra margin for top-left corner
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
let windowInitialized = false; // ADDED: Flag to ensure window dimensions are ready

// Initialize the system
function init() {
    console.log("Initializing visual effects...");
    
    // ADDED: Ensure browser has fully measured the window
    windowInitialized = true;
    
    // Clean up any existing shapes
    cleanup();
    
    // Create containers
    createContainers();
    
    // Add animation styles
    addAnimationStyles();
    
    // Reset quadrant counts
    screenQuadrants = [0, 0, 0, 0];
    
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
    screenQuadrants = [0, 0, 0, 0]; // Reset quadrant counts
    
    // Remove existing containers
    const containers = [
        document.getElementById('background-shapes'),
        document.getElementById('static-shapes'),
        document.getElementById('distant-shapes')
    ];
    
    containers.forEach(container => {
        if (container) container.remove();
    });
}

// Add CSS styles for animations
function addAnimationStyles() {
    // [CSS styles code unchanged]
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
    // [Container creation code unchanged]
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
    
    // ADDED: Make sure we have valid window dimensions
    if (window.innerWidth < 100 || window.innerHeight < 100) {
        console.warn("Window dimensions seem incorrect, delaying shape creation");
        setTimeout(createAllShapes, 100);
        return;
    }
    
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

// Check if a position is in the UI protection zone
function isInProtectionZone(x, y) {
    const { uiProtection } = visualConfig;
    const centerX = window.innerWidth * uiProtection.centerX;
    const centerY = window.innerHeight * uiProtection.centerY;
    
    const halfWidth = uiProtection.width / 2 + uiProtection.margin;
    const halfHeight = uiProtection.height / 2 + uiProtection.margin;
    
    return (
        x >= centerX - halfWidth &&
        x <= centerX + halfWidth &&
        y >= centerY - halfHeight &&
        y <= centerY + halfHeight
    );
}

// Check if position is in a corner
function isInCorner(x, y) {
    const { cornerRadius, edgeMargin, topLeftExtraMargin } = visualConfig.distribution;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // MODIFIED: Special handling for top-left with extra margin
    if (x < topLeftExtraMargin && y < topLeftExtraMargin) return true;
    
    // Check other corners
    if (x > width - cornerRadius && y < cornerRadius) return true;
    if (x < cornerRadius && y > height - cornerRadius) return true;
    if (x > width - cornerRadius && y > height - cornerRadius) return true;
    
    // Check if too close to edges
    if (x < edgeMargin || x > width - edgeMargin || 
        y < edgeMargin || y > height - edgeMargin) return true;
    
    return false;
}

// Get least populated quadrant
function getLeastPopulatedQuadrant() {
    let minIndex = 0;
    for (let i = 1; i < 4; i++) {
        if (screenQuadrants[i] < screenQuadrants[minIndex]) {
            minIndex = i;
        }
    }
    return minIndex;
}

// Generate a position in a specific quadrant
function generatePositionInQuadrant(quadrant, size) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const margin = visualConfig.distribution.edgeMargin;
    const topLeftExtraMargin = visualConfig.distribution.topLeftExtraMargin; // ADDED
    
    let x, y;
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // ADDED: Limit attempts to prevent infinite loops
    
    do {
        switch (quadrant) {
            case 0: // Top-left
                // MODIFIED: Apply extra margin to top-left
                x = topLeftExtraMargin + Math.random() * (halfWidth - topLeftExtraMargin - margin);
                y = topLeftExtraMargin + Math.random() * (halfHeight - topLeftExtraMargin - margin);
                break;
            case 1: // Top-right
                x = halfWidth + margin + Math.random() * (halfWidth - 2 * margin);
                y = margin + Math.random() * (halfHeight - 2 * margin);
                break;
            case 2: // Bottom-left
                x = margin + Math.random() * (halfWidth - 2 * margin);
                y = halfHeight + margin + Math.random() * (halfHeight - 2 * margin);
                break;
            case 3: // Bottom-right
                x = halfWidth + margin + Math.random() * (halfWidth - 2 * margin);
                y = halfHeight + margin + Math.random() * (halfHeight - 2 * margin);
                break;
        }
        
        attempts++;
        
        // ADDED: Fallback if we're struggling to find a valid position
        if (attempts > MAX_ATTEMPTS) {
            // Force a position in the center of the quadrant to avoid edges/corners
            switch (quadrant) {
                case 0: // Top-left
                    x = halfWidth * 0.5;
                    y = halfHeight * 0.5;
                    break;
                case 1: // Top-right
                    x = halfWidth * 1.5;
                    y = halfHeight * 0.5;
                    break;
                case 2: // Bottom-left
                    x = halfWidth * 0.5;
                    y = halfHeight * 1.5;
                    break;
                case 3: // Bottom-right
                    x = halfWidth * 1.5;
                    y = halfHeight * 1.5;
                    break;
            }
            break;
        }
    } while ((isInCorner(x, y) || isInProtectionZone(x, y)));
    
    // Update quadrant count and return position
    screenQuadrants[quadrant]++;
    return { x, y };
}

// Generate a balanced position for shapes
function generateBalancedPosition(size) {
    const { quadrantBalance, avoidCorners } = visualConfig.distribution;
    
    // MODIFIED: Ensure the window has been properly measured
    if (!windowInitialized || window.innerWidth <= 0 || window.innerHeight <= 0) {
        console.warn("Window not properly initialized, using fallback position");
        // Return a safe fallback position (center of screen)
        return { 
            x: Math.max(300, window.innerWidth / 2),
            y: Math.max(300, window.innerHeight / 2)
        };
    }
    
    if (quadrantBalance) {
        // Use the least populated quadrant
        const quadrant = getLeastPopulatedQuadrant();
        return generatePositionInQuadrant(quadrant, size);
    } else {
        // Use completely random position but avoid corners and UI zone
        let x, y;
        let attempts = 0;
        
        do {
            x = Math.random() * window.innerWidth;
            y = Math.random() * window.innerHeight;
            attempts++;
            
            // Prevent infinite loop
            if (attempts > 50) {
                // MODIFIED: Provide safe fallback position
                x = window.innerWidth / 2;
                y = window.innerHeight / 2;
                break;
            }
        } while ((avoidCorners && isInCorner(x, y)) || isInProtectionZone(x, y));
        
        // Determine which quadrant this falls into and update counts
        const quadrant = (x > window.innerWidth / 2 ? 1 : 0) + (y > window.innerHeight / 2 ? 2 : 0);
        screenQuadrants[quadrant]++;
        
        return { x, y };
    }
}

// Create a static background shape
function createStaticShape(container) {
    const config = visualConfig.shapes.static;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Generate balanced position
    const position = generateBalancedPosition(size);
    const x = position.x;
    const y = position.y;
    
    // ADDED: Additional safety check for top-left corner
    if (x < 50 && y < 50) {
        console.warn("Shape would be positioned in top-left, adjusting");
        position.x = 100 + Math.random() * 100;
        position.y = 100 + Math.random() * 100;
    }
    
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
            left: ${position.x}px;
            top: ${position.y}px;
            opacity: ${config.opacity};
        `;
    } else {
        style = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            left: ${position.x}px;
            top: ${position.y}px;
            opacity: ${config.opacity};
        `;
    }
    
    shape.style.cssText = style;
    container.appendChild(shape);
    
    // Store for reference
    staticShapes.push({
        element: shape,
        x: position.x,
        y: position.y
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
    
    // ADDED: Additional safety check for top-left corner
    if (x < 50 && y < 50) {
        console.warn("Distant shape would be positioned in top-left, adjusting");
        position.x = 150 + Math.random() * 100;
        position.y = 150 + Math.random() * 100;
    }
    
    // Always hollow
    const colors = ['#5b8dd9', '#9c77db', '#5bbcd9'];
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
            left: ${position.x - size/2}px;
            top: ${position.y - size/2}px;
            opacity: ${config.opacity};
        `;
    } else {
        style = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border: ${borderWidth}px solid ${color};
            background-color: transparent;
            left: ${position.x - size/2}px;
            top: ${position.y - size/2}px;
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
        x: position.x,
        y: position.y,
        size: size
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
    
    // ADDED: Additional safety check for top-left corner
    if (x < 50 && y < 50) {
        console.warn("Dynamic shape would be positioned in top-left, adjusting");
        position.x = 200 + Math.random() * 100;
        position.y = 200 + Math.random() * 100;
    }
    
    // Color - 1% chance for white, rest normal colors
    let color;
    if (Math.random() < 0.01) {
        color = visualConfig.colors.contrast[0]; // White
    } else {
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
    
    // Determine shape type and create element
    const shape = document.createElement('div');
    shape.className = 'dynamic-shape';
    
    let rotationTransform = '';
    let shapeType;
    
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
    
    // Apply animations
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
    
    // Rainbow effect
    if (Math.random() < visualConfig.animation.rainbow.chance) {
        shape.classList.add('rainbow');
    }
    
    container.appendChild(shape);
    
    // Add to shapes array - this is the physics model
    shapes.push({
        element: shape,
        x: position.x,
        y: position.y,
        originX: position.x,
        originY: position.y,
        velocityX: 0,
        velocityY: 0,
        size: size,
        baseOpacity: opacity,
        color: color,
        isHollow: isHollow,
        shapeType: shapeType,
        rotation: hasRotation,
        pulse: hasPulse,
        rotationTransform: rotationTransform
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

// Check if a shape is entering the UI protected zone
function isEnteringProtectedZone(shape) {
    const { uiProtection } = visualConfig;
    const centerX = window.innerWidth * uiProtection.centerX;
    const centerY = window.innerHeight * uiProtection.centerY;
    
    const halfWidth = uiProtection.width / 2 + uiProtection.margin;
    const halfHeight = uiProtection.height / 2 + uiProtection.margin;
    
    return (
        shape.x >= centerX - halfWidth &&
        shape.x <= centerX + halfWidth &&
        shape.y >= centerY - halfHeight &&
        shape.y <= centerY + halfHeight
    );
}

// Update physics for a single shape
function updateShapePhysics(shape) {
    const physics = visualConfig.physics;
    
    // ADDED: Extra safety to prevent shapes from getting stuck in the top-left
    if (shape.x < 50 && shape.y < 50) {
        shape.x = 200 + Math.random() * 100;
        shape.y = 200 + Math.random() * 100;
        shape.originX = shape.x;
        shape.originY = shape.y;
    }
    
    // Apply friction (air resistance)
    shape.velocityX *= physics.friction;
    shape.velocityY *= physics.friction;
    
    // Return-to-origin force (spring)
    const dx = shape.originX - shape.x;
    const dy = shape.originY - shape.y;
    
    shape.velocityX += dx * physics.returnForce;
    shape.velocityY += dy * physics.returnForce;
    
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
        const { uiProtection } = visualConfig;
        const centerX = window.innerWidth * uiProtection.centerX;
        const centerY = window.innerHeight * uiProtection.centerY;
        
        const dx = shape.x - centerX;
        const dy = shape.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Calculate stronger repulsion from center of UI zone
            const repulsionStrength = 0.5; // Adjust as needed
            
            // Add velocity away from center
            shape.velocityX += (dx / distance) * repulsionStrength;
            shape.velocityY += (dy / distance) * repulsionStrength;
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
    
    // Screen wrapping with improved corner avoidance
    const buffer = shape.size;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // MODIFIED: Improved screen wrapping with corner avoidance
    if (shape.x < -buffer) {
        shape.x = width + buffer / 2;
        // Also update origin to prevent snapping back
        shape.originX = width / 2 + Math.random() * width / 4;
    }
    if (shape.x > width + buffer) {
        shape.x = -buffer / 2;
        shape.originX = width / 4 + Math.random() * width / 4;
    }
    if (shape.y < -buffer) {
        shape.y = height + buffer / 2;
        shape.originY = height / 2 + Math.random() * height / 4;
    }
    if (shape.y > height + buffer) {
        shape.y = -buffer / 2;
        shape.originY = height / 4 + Math.random() * height / 4;
    }
    
    // Update visual element with transform
    updateShapeTransform(shape);
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
    // Reset quadrant counts
    screenQuadrants = [0, 0, 0, 0];
    
    // Adjust shape positions proportionally
    shapes.forEach(shape => {
        const widthRatio = window.innerWidth / document.documentElement.clientWidth;
        const heightRatio = window.innerHeight / document.documentElement.clientHeight;
        
        // Update origin to maintain relative position
        shape.originX = shape.originX * widthRatio;
        shape.originY = shape.originY * heightRatio;
        
        // Keep shapes within bounds
        if (shape.x > window.innerWidth) {
            shape.x = window.innerWidth * Math.random();
            shape.originX = shape.x;
        }
        if (shape.y > window.innerHeight) {
            shape.y = window.innerHeight * Math.random();
            shape.originY = shape.y;
        }
        
        // ADDED: Apply special top-left corner check
        if (shape.x < 50 && shape.y < 50) {
            shape.x = 100 + Math.random() * 200;
            shape.y = 100 + Math.random() * 200;
            shape.originX = shape.x;
            shape.originY = shape.y;
        }
        
        // Update quadrant count
        const quadrant = (shape.x > window.innerWidth / 2 ? 1 : 0) + 
                        (shape.y > window.innerHeight / 2 ? 2 : 0);
        screenQuadrants[quadrant]++;
    });
    
    // Also adjust static and distant shapes
    staticShapes.forEach(shape => {
        if (shape.x > window.innerWidth || shape.y > window.innerHeight) {
            const position = generateBalancedPosition(10); // Assuming a small default size
            shape.element.style.left = `${position.x}px`;
            shape.element.style.top = `${position.y}px`;
            shape.x = position.x;
            shape.y = position.y;
        }
        
        // ADDED: Check for top-left corner
        if (shape.x < 50 && shape.y < 50) {
            shape.x = 100 + Math.random() * 200;
            shape.y = 100 + Math.random() * 200;
            shape.element.style.left = `${shape.x}px`;
            shape.element.style.top = `${shape.y}px`;
        }
    });
    
    distantShapes.forEach(shape => {
        if (shape.x > window.innerWidth || shape.y > window.innerHeight) {
            const position = generateBalancedPosition(shape.size);
            shape.element.style.left = `${position.x - shape.size/2}px`;
            shape.element.style.top = `${position.y - shape.size/2}px`;
            shape.x = position.x;
            shape.y = position.y;
        }
        
        // ADDED: Check for top-left corner
        if (shape.x < 50 && shape.y < 50) {
            shape.x = 150 + Math.random() * 200;
            shape.y = 150 + Math.random() * 200;
            shape.element.style.left = `${shape.x - shape.size/2}px`;
            shape.element.style.top = `${shape.y - shape.size/2}px`;
        }
    });
}

// ADDED: Make sure window is fully loaded before initializing
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', function() {
        setTimeout(init, 100); // Slight delay to ensure dimensions are available
    });
}

// Export initialization function
window.initVisualEffects = init;