/**
 * visual-effects.js - Modified with improved shape distribution
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
        edgeMargin: 100         // Margin from screen edges
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

// Debug configuration - enable/disable different debugging features
const DEBUG = {
    enabled: true,
    logPositions: true,
    visualizeQuadrants: true,
    highlightProtectionZone: true,
    trackShapeDistribution: true
};

// Debug counter to limit number of logs
let debugLogCounter = 0;
const MAX_DEBUG_LOGS = 20;
// 1. Add debug visualization for corner areas
function highlightCornerAreas() {
    if (!DEBUG || !DEBUG.enabled) return;
    
    const cornerRadius = visualConfig.distribution.cornerRadius;
    const edgeMargin = visualConfig.distribution.edgeMargin;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create corner visualizations
    const corners = [
        { id: 'top-left', x: 0, y: 0 },
        { id: 'top-right', x: width - cornerRadius, y: 0 },
        { id: 'bottom-left', x: 0, y: height - cornerRadius },
        { id: 'bottom-right', x: width - cornerRadius, y: height - cornerRadius }
    ];
    
    corners.forEach(corner => {
        const element = document.createElement('div');
        element.id = `corner-${corner.id}`;
        element.style.cssText = `
            position: fixed;
            top: ${corner.y}px;
            left: ${corner.x}px;
            width: ${cornerRadius}px;
            height: ${cornerRadius}px;
            border: 1px dashed rgba(255, 0, 0, 0.5);
            background-color: rgba(255, 0, 0, 0.1);
            z-index: 8000;
            pointer-events: none;
        `;
        document.body.appendChild(element);
    });
    
    // Visualize edge margins
    const edges = [
        { id: 'top', x: 0, y: 0, width: width, height: edgeMargin },
        { id: 'right', x: width - edgeMargin, y: 0, width: edgeMargin, height: height },
        { id: 'bottom', x: 0, y: height - edgeMargin, width: width, height: edgeMargin },
        { id: 'left', x: 0, y: 0, width: edgeMargin, height: height }
    ];
    
    edges.forEach(edge => {
        const element = document.createElement('div');
        element.id = `edge-${edge.id}`;
        element.style.cssText = `
            position: fixed;
            top: ${edge.y}px;
            left: ${edge.x}px;
            width: ${edge.width}px;
            height: ${edge.height}px;
            border: 1px dotted rgba(255, 165, 0, 0.5);
            background-color: rgba(255, 165, 0, 0.1);
            z-index: 7999;
            pointer-events: none;
        `;
        document.body.appendChild(element);
    });
}

// 2. Improved setup debug overlay
function setupDebugOverlay() {
    if (!DEBUG || !DEBUG.enabled) return;
    
    // Remove existing debug overlay if any
    let existingOverlay = document.getElementById('debug-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    // Create debug overlay container
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        top: auto;
        left: auto;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 350px;
        max-height: 500px;
        overflow: auto;
    `;
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'Visual Effects Debug';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    overlay.appendChild(title);
    
    // Add control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginBottom = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Shapes';
    refreshButton.style.padding = '3px 6px';
    refreshButton.style.fontSize = '10px';
    refreshButton.addEventListener('click', () => {
        cleanup();
        createContainers();
        addAnimationStyles();
        createAllShapes();
    });
    
    const highlightShapesButton = document.createElement('button');
    highlightShapesButton.textContent = 'Highlight All Shapes';
    highlightShapesButton.style.padding = '3px 6px';
    highlightShapesButton.style.fontSize = '10px';
    highlightShapesButton.addEventListener('click', () => {
        highlightAllShapes();
    });
    
    buttonContainer.appendChild(refreshButton);
    buttonContainer.appendChild(highlightShapesButton);
    overlay.appendChild(buttonContainer);
    
    // Add statistics container
    const statsContainer = document.createElement('div');
    statsContainer.id = 'debug-stats';
    overlay.appendChild(statsContainer);
    
    // Add to body
    document.body.appendChild(overlay);
    
    // Update stats periodically
    updateDebugStats();
    setInterval(updateDebugStats, 2000);
    
    // Draw debug visualizations
    if (DEBUG.visualizeQuadrants) {
        drawQuadrantVisualization();
    }
    
    if (DEBUG.highlightProtectionZone) {
        highlightProtectionZone();
    }
    
    // Highlight corner areas
    highlightCornerAreas();
    
    console.log('Debug overlay initialized');
}
// 3. Function to highlight all shapes for debugging
function highlightAllShapes() {
    // Highlight all dynamic shapes
    shapes.forEach((shape, index) => {
        const element = shape.element;
        
        // Add temporary highlight
        element.style.outline = '2px solid red';
        element.style.zIndex = '1000';
        
        // Show shape index in corner
        const label = document.createElement('div');
        label.textContent = `D${index}`;
        label.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            background-color: red;
            color: white;
            font-size: 10px;
            padding: 1px 3px;
            z-index: 1001;
            pointer-events: none;
        `;
        element.appendChild(label);
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
            element.style.outline = '';
            element.style.zIndex = '';
            if (label.parentNode === element) {
                element.removeChild(label);
            }
        }, 5000);
    });
    
    // Highlight all static shapes
    staticShapes.forEach((shape, index) => {
        const element = shape.element;
        
        // Add temporary highlight
        element.style.outline = '2px solid blue';
        element.style.zIndex = '1000';
        
        // Show shape index in corner
        const label = document.createElement('div');
        label.textContent = `S${index}`;
        label.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            background-color: blue;
            color: white;
            font-size: 10px;
            padding: 1px 3px;
            z-index: 1001;
            pointer-events: none;
        `;
        element.appendChild(label);
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
            element.style.outline = '';
            element.style.zIndex = '';
            if (label.parentNode === element) {
                element.removeChild(label);
            }
        }, 5000);
    });
    
    // Highlight all distant shapes
    distantShapes.forEach((shape, index) => {
        const element = shape.element;
        
        // Add temporary highlight
        element.style.outline = '2px solid green';
        element.style.zIndex = '1000';
        
        // Show shape index in corner
        const label = document.createElement('div');
        label.textContent = `L${index}`;
        label.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            background-color: green;
            color: white;
            font-size: 10px;
            padding: 1px 3px;
            z-index: 1001;
            pointer-events: none;
        `;
        element.appendChild(label);
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
            element.style.outline = '';
            element.style.zIndex = '';
            if (label.parentNode === element) {
                element.removeChild(label);
            }
        }, 5000);
    });
    
    console.log(`Highlighted ${shapes.length} dynamic, ${staticShapes.length} static, and ${distantShapes.length} distant shapes`);
}
// Draw lines to visualize quadrants
function drawQuadrantVisualization() {
    const quadLines = document.createElement('div');
    quadLines.id = 'quadrant-lines';
    
    // Horizontal line
    const hLine = document.createElement('div');
    hLine.style.cssText = `
        position: fixed;
        top: 50%;
        left: 0;
        width: 100%;
        height: 1px;
        background-color: rgba(255, 0, 0, 0.5);
        z-index: 9000;
        pointer-events: none;
    `;
    
    // Vertical line
    const vLine = document.createElement('div');
    vLine.style.cssText = `
        position: fixed;
        top: 0;
        left: 50%;
        width: 1px;
        height: 100%;
        background-color: rgba(255, 0, 0, 0.5);
        z-index: 9000;
        pointer-events: none;
    `;
    
    quadLines.appendChild(hLine);
    quadLines.appendChild(vLine);
    document.body.appendChild(quadLines);
}

// Highlight UI protection zone
function highlightProtectionZone() {
    const { uiProtection } = visualConfig;
    const centerX = window.innerWidth * uiProtection.centerX;
    const centerY = window.innerHeight * uiProtection.centerY;
    
    const halfWidth = uiProtection.width / 2 + uiProtection.margin;
    const halfHeight = uiProtection.height / 2 + uiProtection.margin;
    
    const zone = document.createElement('div');
    zone.id = 'protection-zone';
    zone.style.cssText = `
        position: fixed;
        top: ${centerY - halfHeight}px;
        left: ${centerX - halfWidth}px;
        width: ${uiProtection.width + 2 * uiProtection.margin}px;
        height: ${uiProtection.height + 2 * uiProtection.margin}px;
        border: 1px dashed rgba(0, 255, 0, 0.5);
        background-color: rgba(0, 255, 0, 0.1);
        z-index: 8000;
        pointer-events: none;
    `;
    
    document.body.appendChild(zone);
    
    // Log protection zone dimensions
    console.log('Protection Zone:', {
        centerX,
        centerY,
        width: uiProtection.width,
        height: uiProtection.height,
        margin: uiProtection.margin,
        top: centerY - halfHeight,
        left: centerX - halfWidth,
        right: centerX + halfWidth,
        bottom: centerY + halfHeight
    });
}

// 4. Enhanced updateDebugStats with additional information
function updateDebugStats() {
    const statsContainer = document.getElementById('debug-stats');
    if (!statsContainer) return;
    
    // Count shapes in corners
    let shapesInCorners = {
        dynamic: 0,
        static: 0,
        distant: 0
    };
    
    shapes.forEach(shape => {
        if (isInCorner(shape.x, shape.y)) {
            shapesInCorners.dynamic++;
        }
    });
    
    staticShapes.forEach(shape => {
        if (isInCorner(shape.x, shape.y)) {
            shapesInCorners.static++;
        }
    });
    
    distantShapes.forEach(shape => {
        if (isInCorner(shape.x, shape.y)) {
            shapesInCorners.distant++;
        }
    });
    
    // Calculate quadrant distribution
    let quadrantCounts = [0, 0, 0, 0];
    shapes.forEach(shape => {
        const quadrant = getQuadrantForPosition(shape.x, shape.y);
        if (quadrant >= 0 && quadrant < 4) {
            quadrantCounts[quadrant]++;
        }
    });
    
    // Create stats display
    statsContainer.innerHTML = `
        <div>Window Size: ${window.innerWidth} x ${window.innerHeight}</div>
        <div>Total Shapes: ${shapes.length + staticShapes.length + distantShapes.length}</div>
        <div>- Dynamic: ${shapes.length}</div>
        <div>- Static: ${staticShapes.length}</div>
        <div>- Distant: ${distantShapes.length}</div>
        <div>Dynamic Quadrant Distribution:</div>
        <div>- Q0 (Top Left): ${quadrantCounts[0]} (${(quadrantCounts[0] / shapes.length * 100).toFixed(1)}%)</div>
        <div>- Q1 (Top Right): ${quadrantCounts[1]} (${(quadrantCounts[1] / shapes.length * 100).toFixed(1)}%)</div>
        <div>- Q2 (Bottom Left): ${quadrantCounts[2]} (${(quadrantCounts[2] / shapes.length * 100).toFixed(1)}%)</div>
        <div>- Q3 (Bottom Right): ${quadrantCounts[3]} (${(quadrantCounts[3] / shapes.length * 100).toFixed(1)}%)</div>
        <div>Stored Quadrant Array: [${screenQuadrants.join(', ')}]</div>
        <div>Shapes in Corner Areas: 
            ${shapesInCorners.dynamic + shapesInCorners.static + shapesInCorners.distant}
            (D:${shapesInCorners.dynamic}, 
             S:${shapesInCorners.static}, 
             L:${shapesInCorners.distant})
        </div>
        <div>Last Generated Position: ${lastGeneratedPosition ? `(${lastGeneratedPosition.x.toFixed(0)}, ${lastGeneratedPosition.y.toFixed(0)})` : 'None'}</div>
    `;
}

// Determine which quadrant a position falls into
function getQuadrantForPosition(x, y) {
    const quadrant = (x > window.innerWidth / 2 ? 1 : 0) + (y > window.innerHeight / 2 ? 2 : 0);
    return quadrant;
}

// Variable to track last generated position
let lastGeneratedPosition = null;
// Global variables
let shapes = [];
let staticShapes = [];
let distantShapes = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseActive = false;
let lastInteractionTime = 0;
let screenQuadrants = [0, 0, 0, 0]; // Track shape count in each quadrant

// 6. Better initialization for all shape types
function init() {
    console.log("Initializing visual effects with corner shape protection...");
    
    // Reset debug counter
    if (typeof debugLogCounter !== 'undefined') {
        debugLogCounter = 0;
    }
    
    // Wait for proper dimensions
    if (window.innerWidth <= 0 || window.innerHeight <= 0) {
        console.warn("Window dimensions not ready yet, delaying initialization");
        setTimeout(init, 300);
        return;
    }
    
    // Log initial screen dimensions
    console.log(`Initial screen dimensions: ${window.innerWidth} x ${window.innerHeight}`);
    
    // Clean up any existing shapes
    cleanup();
    
    // Create containers
    createContainers();
    
    // Add animation styles
    addAnimationStyles();
    
    // Set up debug overlay
    if (typeof DEBUG !== 'undefined' && DEBUG.enabled) {
        setupDebugOverlay();
    }
    
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

// Add this code to the end of your existing code or replace the initialization:
// Initialize after a short delay to ensure window dimensions are properly set
window.addEventListener('DOMContentLoaded', () => {
    // Give browser a moment to fully calculate dimensions
    setTimeout(() => {
        init();
    }, 300);
});

// Fix 2: Reset the quadrant counts on init to ensure proper balancing
function cleanup() {
    shapes = [];
    staticShapes = [];
    distantShapes = [];
    
    // Explicitly set all quadrant counts to 0
    screenQuadrants = [0, 0, 0, 0];
    
    // Remove existing containers
    const containers = [
        document.getElementById('background-shapes'),
        document.getElementById('static-shapes'),
        document.getElementById('distant-shapes')
    ];
    
    containers.forEach(container => {
        if (container) container.remove();
    });
    
    // Also remove debug elements if they exist
    const debugElements = [
        document.getElementById('debug-overlay'),
        document.getElementById('quadrant-lines'),
        document.getElementById('protection-zone')
    ];
    
    debugElements.forEach(element => {
        if (element) element.remove();
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

// 7. Explicit shape creation for each type
function createAllShapes() {
    console.log("Creating all shapes with balanced distribution...");
    
    const staticContainer = document.getElementById('static-shapes');
    const distantContainer = document.getElementById('distant-shapes');
    const shapesContainer = document.getElementById('background-shapes');
    
    if (!staticContainer || !distantContainer || !shapesContainer) {
        console.error("Containers not found, cannot create shapes");
        return;
    }
    
    // Create dynamic shapes with perfect distribution
    console.log("Creating dynamic shapes...");
    const dynamicCount = visualConfig.shapes.dynamic.count;
    const dynamicPerQuadrant = Math.floor(dynamicCount / 4);
    
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const count = quadrant < (dynamicCount % 4) ? dynamicPerQuadrant + 1 : dynamicPerQuadrant;
        console.log(`Creating ${count} dynamic shapes in quadrant ${quadrant}`);
        
        for (let i = 0; i < count; i++) {
            createDynamicShapeInQuadrant(shapesContainer, quadrant);
        }
    }
    
    // Create static shapes with perfect distribution
    console.log("Creating static shapes...");
    const staticCount = visualConfig.shapes.static.count;
    const staticPerQuadrant = Math.floor(staticCount / 4);
    
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const count = quadrant < (staticCount % 4) ? staticPerQuadrant + 1 : staticPerQuadrant;
        console.log(`Creating ${count} static shapes in quadrant ${quadrant}`);
        
        for (let i = 0; i < count; i++) {
            createStaticShapeInQuadrant(staticContainer, quadrant);
        }
    }
    
    // Create distant shapes with perfect distribution
    console.log("Creating distant shapes...");
    const distantCount = visualConfig.shapes.distant.count;
    const distantPerQuadrant = Math.floor(distantCount / 4);
    
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const count = quadrant < (distantCount % 4) ? distantPerQuadrant + 1 : distantPerQuadrant;
        console.log(`Creating ${count} distant shapes in quadrant ${quadrant}`);
        
        for (let i = 0; i < count; i++) {
            createDistantShapeInQuadrant(distantContainer, quadrant);
        }
    }
    
    console.log("All shapes created");
    console.log("Dynamic:", shapes.length);
    console.log("Static:", staticShapes.length);
    console.log("Distant:", distantShapes.length);
    console.log("Final quadrant counts:", screenQuadrants);
}
function createDistantShapeInQuadrant(container, quadrant) {
    const config = visualConfig.shapes.distant;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Generate position in the specific quadrant
    const position = generatePositionInQuadrant(quadrant, size);
    const x = position.x;
    const y = position.y;
    
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
        size: size
    });
    
    // Log for debugging
    console.log(`Created distant shape at (${x}, ${y}) in quadrant ${quadrant}`);
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

// 5. Improved isInCorner function that handles all corner cases
function isInCorner(x, y) {
    const { cornerRadius, edgeMargin } = visualConfig.distribution;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Safety check for valid coordinates
    if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
        console.warn('Invalid coordinates passed to isInCorner:', x, y);
        return true; // Treat invalid coords as in corner to be safe
    }
    
    // Safety check for valid window dimensions
    if (width <= 0 || height <= 0) {
        console.warn('Invalid window dimensions in isInCorner:', width, height);
        return true;
    }
    
    // Check corners with proper math (distance from corner point)
    // Top-left corner
    if (x <= cornerRadius && y <= cornerRadius) {
        const distance = Math.sqrt(x * x + y * y);
        return distance <= cornerRadius;
    }
    
    // Top-right corner
    if (x >= width - cornerRadius && y <= cornerRadius) {
        const distance = Math.sqrt((x - width) * (x - width) + y * y);
        return distance <= cornerRadius;
    }
    
    // Bottom-left corner
    if (x <= cornerRadius && y >= height - cornerRadius) {
        const distance = Math.sqrt(x * x + (y - height) * (y - height));
        return distance <= cornerRadius;
    }
    
    // Bottom-right corner
    if (x >= width - cornerRadius && y >= height - cornerRadius) {
        const distance = Math.sqrt((x - width) * (x - width) + (y - height) * (y - height));
        return distance <= cornerRadius;
    }
    
    // Check if too close to edges (simple rectangular check)
    if (x < edgeMargin || x > width - edgeMargin || 
        y < edgeMargin || y > height - edgeMargin) {
        return true;
    }
    
    return false;
}

// Fix 1: Improved getLeastPopulatedQuadrant function
function getLeastPopulatedQuadrant() {
    console.log("Current quadrant counts:", screenQuadrants);
    
    // Find the minimum count
    let minCount = Number.MAX_SAFE_INTEGER;
    let minQuadrants = [];
    
    for (let i = 0; i < 4; i++) {
        if (screenQuadrants[i] < minCount) {
            minCount = screenQuadrants[i];
            minQuadrants = [i];
        } else if (screenQuadrants[i] === minCount) {
            minQuadrants.push(i);
        }
    }
    
    // If there are multiple quadrants with the same count, choose one randomly
    // This prevents it from always picking the first one
    const selectedQuadrant = minQuadrants[Math.floor(Math.random() * minQuadrants.length)];
    console.log("Selected quadrant:", selectedQuadrant);
    
    return selectedQuadrant;
}

// 9. Improved position generation in quadrants with more aggressive corner avoidance
function generatePositionInQuadrant(quadrant, size) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Check for valid dimensions
    if (width <= 0 || height <= 0) {
        console.error('Invalid window dimensions:', width, height);
        return { x: width/2, y: height/2 };
    }
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Use smaller effective margin to give more room
    const cornerRadius = visualConfig.distribution.cornerRadius;
    const edgeMargin = Math.min(
        visualConfig.distribution.edgeMargin,
        Math.min(halfWidth, halfHeight) * 0.15
    );
    
    let x, y;
    let attempts = 0;
    let cornerCheck = true;
    
    do {
        // Calculate safe zones within each quadrant
        // Add extra padding to avoid corners
        const padding = cornerRadius * 0.5;
        
        switch (quadrant) {
            case 0: // Top-left
                x = cornerRadius + padding + Math.random() * (halfWidth - cornerRadius - padding - edgeMargin);
                y = cornerRadius + padding + Math.random() * (halfHeight - cornerRadius - padding - edgeMargin);
                break;
            case 1: // Top-right
                x = halfWidth + edgeMargin + Math.random() * (halfWidth - cornerRadius - padding - edgeMargin);
                y = cornerRadius + padding + Math.random() * (halfHeight - cornerRadius - padding - edgeMargin);
                break;
            case 2: // Bottom-left
                x = cornerRadius + padding + Math.random() * (halfWidth - cornerRadius - padding - edgeMargin);
                y = halfHeight + edgeMargin + Math.random() * (halfHeight - cornerRadius - padding - edgeMargin);
                break;
            case 3: // Bottom-right
                x = halfWidth + edgeMargin + Math.random() * (halfWidth - cornerRadius - padding - edgeMargin);
                y = halfHeight + edgeMargin + Math.random() * (halfHeight - cornerRadius - padding - edgeMargin);
                break;
            default:
                console.error('Invalid quadrant:', quadrant);
                // Default to center
                x = width/2;
                y = height/2;
        }
        
        attempts++;
        
        // If we've tried too many times, gradually relax constraints
        if (attempts > 30) {
            cornerCheck = false; // Disable corner checking
        }
        
        // Last resort - if we still can't find a position after 50 attempts,
        // just use the current position even if it's in a protection zone
        if (attempts > 50) {
            break;
        }
    } while ((cornerCheck && isInCorner(x, y)) || isInProtectionZone(x, y));
    
    // If we had to relax constraints, log it
    if (attempts > 30) {
        console.warn(`Relaxed constraints for shape in quadrant ${quadrant} after ${attempts} attempts`);
    }
    
    // Final position check
    if (isInCorner(x, y)) {
        console.warn(`Warning: Shape at (${x}, ${y}) is still in corner after ${attempts} attempts`);
    }
    
    // Update quadrant count and return position
    screenQuadrants[quadrant]++;
    lastGeneratedPosition = { x, y };
    
    return { x, y };
}
// Modified generateBalancedPosition function with logging
function generateBalancedPosition(size) {
    const { quadrantBalance, avoidCorners } = visualConfig.distribution;
    
    // Log beginning of position generation
    if (DEBUG.enabled && DEBUG.logPositions && debugLogCounter < MAX_DEBUG_LOGS) {
        console.log(`Generating position for shape of size ${size}`);
        console.log(`Screen dimensions: ${window.innerWidth} x ${window.innerHeight}`);
        console.log(`Current quadrant counts: [${screenQuadrants.join(', ')}]`);
        debugLogCounter++;
    }
    
    let position;
    
    if (quadrantBalance) {
        // Use the least populated quadrant
        const quadrant = getLeastPopulatedQuadrant();
        
        if (DEBUG.enabled && DEBUG.logPositions && debugLogCounter < MAX_DEBUG_LOGS) {
            console.log(`Selected least populated quadrant: ${quadrant}`);
        }
        
        position = generatePositionInQuadrant(quadrant, size);
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
                console.warn('Too many attempts to find valid position, using current position');
                break;
            }
        } while ((avoidCorners && isInCorner(x, y)) || isInProtectionZone(x, y));
        
        // Determine which quadrant this falls into and update counts
        const quadrant = (x > window.innerWidth / 2 ? 1 : 0) + (y > window.innerHeight / 2 ? 2 : 0);
        screenQuadrants[quadrant]++;
        
        position = { x, y };
    }
    
    // Track last generated position for debugging
    lastGeneratedPosition = position;
    
    // Log final position
    if (DEBUG.enabled && DEBUG.logPositions && debugLogCounter < MAX_DEBUG_LOGS) {
        console.log(`Final position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
        console.log(`Updated quadrant counts: [${screenQuadrants.join(', ')}]`);
    }
    
    return position;
}

function createStaticShapeInQuadrant(container, quadrant) {
    const config = visualConfig.shapes.static;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Generate position in the specific quadrant
    const position = generatePositionInQuadrant(quadrant, size);
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
        y: y
    });
    
    // Log for debugging
    console.log(`Created static shape at (${x}, ${y}) in quadrant ${quadrant}`);
}

// Fix 4: Apply same fix to large distant shapes
function createLargeDistantShape(container) {
    const config = visualConfig.shapes.distant;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Generate balanced position using quadrant balancing
    const quadrant = getLeastPopulatedQuadrant();
    const position = generatePositionInQuadrant(quadrant, size);
    
    const x = position.x;
    const y = position.y;
    
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
        size: size
    });
}

// Fixed implementation of createDynamicShapeInQuadrant
function createDynamicShapeInQuadrant(container, quadrant) {
    // This function is just a rename of the previous createDynamicShape with forced quadrant
    
    // If the original createDynamicShape function exists, use that and return
    if (typeof createDynamicShape === 'function') {
        createDynamicShape(container, quadrant);
        return; // Important: return here to avoid continuing with the rest of the function
    }
    
    // Otherwise implement our own version
    const dynamicConfig = visualConfig.shapes.dynamic;
    const size = dynamicConfig.minSize + Math.random() * (dynamicConfig.maxSize - dynamicConfig.minSize);
    
    // Generate position in the specific quadrant
    const position = generatePositionInQuadrant(quadrant, size);
    const x = position.x;
    const y = position.y;
    
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
        rotationTransform: rotationTransform
    });
    
    console.log(`Created dynamic shape at (${x}, ${y}) in quadrant ${quadrant}`);
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
    
    // Screen wrapping
    const buffer = shape.size;
    if (shape.x < -buffer) shape.x = window.innerWidth + buffer;
    if (shape.x > window.innerWidth + buffer) shape.x = -buffer;
    if (shape.y < -buffer) shape.y = window.innerHeight + buffer;
    if (shape.y > window.innerHeight + buffer) shape.y = -buffer;
    
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
    });
    
    distantShapes.forEach(shape => {
        if (shape.x > window.innerWidth || shape.y > window.innerHeight) {
            const position = generateBalancedPosition(shape.size);
            shape.element.style.left = `${position.x - shape.size/2}px`;
            shape.element.style.top = `${position.y - shape.size/2}px`;
            shape.x = position.x;
            shape.y = position.y;
        }
    });
}

// This should go at the very end of the file, replacing any existing initialization code
// Replace or add after the current initialization code:

// Replace this line if it exists:
window.addEventListener('DOMContentLoaded', init);
// Or this line if it exists:
window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));

// With this new implementation:
window.addEventListener('load', () => {
    console.log("Window load event - ensuring proper dimensions");
    
    // Check dimensions and initialize only when ready
    if (window.innerWidth > 0 && window.innerHeight > 0) {
        console.log("Window dimensions ready on load:", window.innerWidth, window.innerHeight);
        setTimeout(init, 300); // Small delay for extra safety
    } else {
        console.warn("Window dimensions not ready yet on load event");
        
        // Wait for first resize event or force init after 1 second
        const resizeHandler = () => {
            console.log("Resize detected, window dimensions:", window.innerWidth, window.innerHeight);
            window.removeEventListener('resize', resizeHandler);
            init();
        };
        
        window.addEventListener('resize', resizeHandler);
        
        // Fallback if no resize occurs
        setTimeout(() => {
            window.removeEventListener('resize', resizeHandler);
            console.log("Forcing init after timeout");
            init();
        }, 1000);
    }
});

// Cleanup existing debug variables if needed
window.addEventListener('beforeunload', () => {
    // Remove any debug elements
    const debugElements = [
        document.getElementById('debug-overlay'),
        document.getElementById('quadrant-lines'),
        document.getElementById('protection-zone')
    ];
    
    debugElements.forEach(element => {
        if (element) element.remove();
    });
});

// Export initialization function
window.initVisualEffects = init;