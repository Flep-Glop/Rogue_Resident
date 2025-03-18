/**
 * visual-effects.js - Complete rewrite with diagnostics and debugging
 * This version logs issues and implements a simplified physics model
 * to determine why the mouse interaction isn't working
 */

// Create diagnostic overlay
let diagnosticsEnabled = true;  // Set to true to enable visual diagnostics
let debugInfo = {
    mousePosition: { x: 0, y: 0 },
    shapesNearMouse: 0,
    forcesApplied: 0,
    lastEvent: null
};

// Simplified configuration
const config = {
    // Basic settings
    shapesCount: 30,
    debugLayer: true,
    
    // Shape appearance
    colors: ['#5b8dd9', '#56b886', '#9c77db', '#5bbcd9', '#e67e73', '#f0c866'],
    minSize: 10,
    maxSize: 60,
    
    // Physics settings - simplified
    repelForce: 3.0,     // Strength of repulsion (higher = stronger push)
    repelRadius: 200,    // How far the mouse influence reaches
    friction: 0.95,      // Air resistance (lower = more drag)
    returnForce: 0.03,   // Force pulling shapes back to origin
    maxSpeed: 15,        // Maximum velocity cap
    
    // Animation settings
    fadeInDuration: 1000  // ms for shapes to fade in
};

// Global variables
let shapes = [];
let mouseX = -1000;  // Start off-screen
let mouseY = -1000;
let mouseActive = false;
let debugOverlay = null;
let debugMouseIndicator = null;
let frameCount = 0;
let startTime = Date.now();

// Initialize the system
function init() {
    console.log("🚀 Initializing visual effects with diagnostics...");
    
    // Clear any existing elements
    cleanup();
    
    // Create container
    const container = document.createElement('div');
    container.id = 'fx-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
        overflow: hidden;
    `;
    document.body.appendChild(container);
    
    // Create diagnostic overlay if enabled
    if (diagnosticsEnabled) {
        createDiagnosticOverlay();
    }
    
    // Create shapes
    createShapes(container);
    
    // Set up event listeners
    setupEventListeners();
    
    // Start animation loop
    requestAnimationFrame(updateFrame);
    
    console.log("✅ Initialization complete - watching for mouse interactions");
}

// Clean up any existing elements
function cleanup() {
    // Remove existing containers
    const oldContainer = document.getElementById('fx-container');
    if (oldContainer) oldContainer.remove();
    
    const oldDebug = document.getElementById('fx-debug-overlay');
    if (oldDebug) oldDebug.remove();
    
    // Reset state
    shapes = [];
}

// Create diagnostic overlay
function createDiagnosticOverlay() {
    debugOverlay = document.createElement('div');
    debugOverlay.id = 'fx-debug-overlay';
    debugOverlay.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: #fff;
        font-family: monospace;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 12px;
        pointer-events: none;
        line-height: 1.5;
    `;
    document.body.appendChild(debugOverlay);
    
    // Create a visual indicator for the mouse position
    debugMouseIndicator = document.createElement('div');
    debugMouseIndicator.id = 'fx-mouse-indicator';
    debugMouseIndicator.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255,0,0,0.5);
        border: 2px solid red;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9999;
        opacity: 0.7;
    `;
    document.body.appendChild(debugMouseIndicator);
    
    // Create a circle to show the repel radius
    const radiusIndicator = document.createElement('div');
    radiusIndicator.id = 'fx-radius-indicator';
    radiusIndicator.style.cssText = `
        position: fixed;
        width: ${config.repelRadius * 2}px;
        height: ${config.repelRadius * 2}px;
        border-radius: 50%;
        border: 1px dashed rgba(255,0,0,0.5);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9998;
        opacity: 0.3;
    `;
    document.body.appendChild(radiusIndicator);
}

// Update debug info
function updateDebugInfo() {
    if (!diagnosticsEnabled || !debugOverlay) return;
    
    const now = Date.now();
    const fps = Math.round(frameCount / ((now - startTime) / 1000));
    
    debugOverlay.innerHTML = `
        <strong>Visual Effects Diagnostics</strong><br>
        Mouse: ${Math.round(mouseX)}, ${Math.round(mouseY)} | Mouse Active: ${mouseActive}<br>
        Shapes: ${shapes.length} | Near Mouse: ${debugInfo.shapesNearMouse}<br>
        Forces Applied: ${debugInfo.forcesApplied} | FPS: ${fps}<br>
        Last Event: ${debugInfo.lastEvent || 'None'}<br>
    `;
    
    // Update mouse indicator position
    if (debugMouseIndicator) {
        debugMouseIndicator.style.left = `${mouseX}px`;
        debugMouseIndicator.style.top = `${mouseY}px`;
        
        // Show/hide based on mouse activity
        debugMouseIndicator.style.opacity = mouseActive ? '0.7' : '0.2';
    }
    
    // Update radius indicator
    const radiusIndicator = document.getElementById('fx-radius-indicator');
    if (radiusIndicator) {
        radiusIndicator.style.left = `${mouseX}px`;
        radiusIndicator.style.top = `${mouseY}px`;
        radiusIndicator.style.opacity = mouseActive ? '0.3' : '0.1';
    }
}

// Create shapes
function createShapes(container) {
    console.log(`Creating ${config.shapesCount} shapes...`);
    
    for (let i = 0; i < config.shapesCount; i++) {
        // Random properties
        const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        
        // Calculate position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        // Create visual element
        const element = document.createElement('div');
        element.className = 'fx-shape';
        element.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            transform: translate(${x}px, ${y}px);
            opacity: 0;
            transition: opacity 1s ease;
            will-change: transform;
        `;
        container.appendChild(element);
        
        // Fade in
        setTimeout(() => {
            element.style.opacity = '0.6';
        }, 10 + i * 50);
        
        // Add to shapes array
        shapes.push({
            element: element,
            size: size,
            x: x,
            y: y,
            originX: x,
            originY: y,
            velocityX: 0,
            velocityY: 0,
            color: color,
            id: i
        });
    }
}

// Set up event listeners
function setupEventListeners() {
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        mouseActive = true;
        debugInfo.lastEvent = `mousemove ${Date.now()}`;
    });
    
    // Track when mouse leaves window
    document.addEventListener('mouseout', (e) => {
        if (e.relatedTarget === null) {
            mouseActive = false;
            debugInfo.lastEvent = `mouseout ${Date.now()}`;
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Update shape origins proportionally
        shapes.forEach(shape => {
            shape.originX = (shape.originX / window.innerWidth) * window.innerWidth;
            shape.originY = (shape.originY / window.innerHeight) * window.innerHeight;
        });
    });
    
    // Add keyboard controls for testing
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd') {
            diagnosticsEnabled = !diagnosticsEnabled;
            const debugElements = [
                document.getElementById('fx-debug-overlay'),
                document.getElementById('fx-mouse-indicator'),
                document.getElementById('fx-radius-indicator')
            ];
            
            debugElements.forEach(el => {
                if (el) el.style.display = diagnosticsEnabled ? 'block' : 'none';
            });
        }
    });
    
    console.log("Event listeners attached");
}

// Main update loop
function updateFrame() {
    frameCount++;
    
    // Reset debug counters
    debugInfo.shapesNearMouse = 0;
    debugInfo.forcesApplied = 0;
    
    // Update physics for each shape
    shapes.forEach(updateShapePhysics);
    
    // Update debug info
    if (frameCount % 5 === 0) { // Update every 5 frames to reduce overhead
        updateDebugInfo();
    }
    
    // Continue animation loop
    requestAnimationFrame(updateFrame);
}

// Update physics for a single shape
function updateShapePhysics(shape) {
    // Apply friction (air resistance)
    shape.velocityX *= config.friction;
    shape.velocityY *= config.friction;
    
    // Return-to-origin force (spring)
    const dx = shape.originX - shape.x;
    const dy = shape.originY - shape.y;
    
    shape.velocityX += dx * config.returnForce;
    shape.velocityY += dy * config.returnForce;
    
    // Mouse repulsion - simplified physics
    if (mouseActive) {
        const mouseDistanceX = mouseX - shape.x;
        const mouseDistanceY = mouseY - shape.y;
        const distanceSquared = mouseDistanceX * mouseDistanceX + mouseDistanceY * mouseDistanceY;
        const distanceToMouse = Math.sqrt(distanceSquared);
        
        // Only apply force if mouse is within radius
        if (distanceToMouse < config.repelRadius) {
            // Count shapes near mouse for debugging
            debugInfo.shapesNearMouse++;
            
            // Calculate repulsion force
            const repelMultiplier = 1 - (distanceToMouse / config.repelRadius);
            const forceMagnitude = repelMultiplier * config.repelForce;
            
            // IMPORTANT: Add repulsion vector (away from mouse)
            // This is the key part that might be failing
            if (distanceToMouse > 0) { // Avoid division by zero
                const forceX = -mouseDistanceX / distanceToMouse * forceMagnitude;
                const forceY = -mouseDistanceY / distanceToMouse * forceMagnitude;
                
                shape.velocityX += forceX;
                shape.velocityY += forceY;
                
                debugInfo.forcesApplied++;
                
                // Debug visual - change color when affected
                if (diagnosticsEnabled) {
                    shape.element.style.backgroundColor = 'rgba(255,0,0,0.5)';
                    // Reset after a short time
                    setTimeout(() => {
                        shape.element.style.backgroundColor = shape.color;
                    }, 200);
                }
            }
        }
    }
    
    // Apply speed limit
    const speed = Math.sqrt(shape.velocityX * shape.velocityX + shape.velocityY * shape.velocityY);
    if (speed > config.maxSpeed) {
        shape.velocityX = (shape.velocityX / speed) * config.maxSpeed;
        shape.velocityY = (shape.velocityY / speed) * config.maxSpeed;
    }
    
    // Update position
    shape.x += shape.velocityX;
    shape.y += shape.velocityY;
    
    // Screen wrapping
    // If shape goes off one edge, wrap to the other side
    const buffer = shape.size;
    
    if (shape.x < -buffer) shape.x = window.innerWidth + buffer;
    if (shape.x > window.innerWidth + buffer) shape.x = -buffer;
    if (shape.y < -buffer) shape.y = window.innerHeight + buffer;
    if (shape.y > window.innerHeight + buffer) shape.y = -buffer;
    
    // Update DOM element
    // IMPORTANT: We use transform for performance reasons
    shape.element.style.transform = `translate(${shape.x}px, ${shape.y}px)`;
}

// Expose diagnostic functions
window.fxDiagnostics = {
    toggleDiagnostics: () => {
        diagnosticsEnabled = !diagnosticsEnabled;
        const debugElements = [
            document.getElementById('fx-debug-overlay'),
            document.getElementById('fx-mouse-indicator'),
            document.getElementById('fx-radius-indicator')
        ];
        
        debugElements.forEach(el => {
            if (el) el.style.display = diagnosticsEnabled ? 'block' : 'none';
        });
        return `Diagnostics ${diagnosticsEnabled ? 'enabled' : 'disabled'}`;
    },
    
    getState: () => {
        return {
            mousePosition: { x: mouseX, y: mouseY },
            mouseActive: mouseActive,
            shapes: shapes.length,
            debugInfo: debugInfo,
            config: config
        };
    },
    
    testForce: (force) => {
        if (force !== undefined) config.repelForce = force;
        return `Repel force set to ${config.repelForce}`;
    }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export initialization function for external use
window.initVisualEffects = init;