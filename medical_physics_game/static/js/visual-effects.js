/**
 * visual-effects.js - Complete file with grid-based shape distribution
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

// Global variables
let shapes = [];
let staticShapes = [];
let distantShapes = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseActive = false;
let lastInteractionTime = 0;
let screenQuadrants = [0, 0, 0, 0]; // Track shape count in each quadrant
let lastGeneratedPosition = null; // Track last position for debugging

// Grid-based positioning system
function createGridBasedPositioning() {
    // Calculate how many grid cells we can fit in each quadrant
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Split the screen into a grid
    const GRID_CELLS_X = 20; // Horizontal cells across entire screen
    const GRID_CELLS_Y = 16; // Vertical cells across entire screen
    
    // Calculate grid cell size
    const CELL_WIDTH = width / GRID_CELLS_X;
    const CELL_HEIGHT = height / GRID_CELLS_Y;
    
    // Create a grid to track which cells are occupied
    // Start with all cells as unoccupied (false)
    let occupiedCells = Array(GRID_CELLS_Y).fill().map(() => Array(GRID_CELLS_X).fill(false));
    
    // Mark cells in UI protection zone as occupied
    const { uiProtection } = visualConfig;
    const centerX = width * uiProtection.centerX;
    const centerY = height * uiProtection.centerY;
    const halfWidth = uiProtection.width / 2 + uiProtection.margin;
    const halfHeight = uiProtection.height / 2 + uiProtection.margin;
    
    // Mark UI protection zone cells as occupied
    const leftCell = Math.floor((centerX - halfWidth) / CELL_WIDTH);
    const rightCell = Math.ceil((centerX + halfWidth) / CELL_WIDTH);
    const topCell = Math.floor((centerY - halfHeight) / CELL_HEIGHT);
    const bottomCell = Math.ceil((centerY + halfHeight) / CELL_HEIGHT);
    
    for (let y = topCell; y <= bottomCell; y++) {
        for (let x = leftCell; x <= rightCell; x++) {
            if (y >= 0 && y < GRID_CELLS_Y && x >= 0 && x < GRID_CELLS_X) {
                occupiedCells[y][x] = true;
            }
        }
    }
    
    // Mark corner cells as occupied
    const cornerRadius = Math.ceil(visualConfig.distribution.cornerRadius / CELL_WIDTH);
    for (let y = 0; y < cornerRadius; y++) {
        for (let x = 0; x < cornerRadius; x++) {
            // Top-left corner
            if (y < GRID_CELLS_Y && x < GRID_CELLS_X) {
                occupiedCells[y][x] = true;
            }
            // Top-right corner
            if (y < GRID_CELLS_Y && GRID_CELLS_X - x - 1 >= 0) {
                occupiedCells[y][GRID_CELLS_X - x - 1] = true;
            }
            // Bottom-left corner
            if (GRID_CELLS_Y - y - 1 >= 0 && x < GRID_CELLS_X) {
                occupiedCells[GRID_CELLS_Y - y - 1][x] = true;
            }
            // Bottom-right corner
            if (GRID_CELLS_Y - y - 1 >= 0 && GRID_CELLS_X - x - 1 >= 0) {
                occupiedCells[GRID_CELLS_Y - y - 1][GRID_CELLS_X - x - 1] = true;
            }
        }
    }
    
    // Debug: Log the grid 
    console.log("Grid size:", GRID_CELLS_X, "x", GRID_CELLS_Y);
    console.log("Cell size:", CELL_WIDTH, "x", CELL_HEIGHT);
    
    // Create arrays of available cells by quadrant
    let availableCellsByQuadrant = [[], [], [], []];
    
    // Half points for quadrant division
    const halfX = GRID_CELLS_X / 2;
    const halfY = GRID_CELLS_Y / 2;
    
    // Fill the available cells arrays
    for (let y = 0; y < GRID_CELLS_Y; y++) {
        for (let x = 0; x < GRID_CELLS_X; x++) {
            if (!occupiedCells[y][x]) {
                // Determine quadrant
                const quadrant = (x >= halfX ? 1 : 0) + (y >= halfY ? 2 : 0);
                availableCellsByQuadrant[quadrant].push({ x, y });
            }
        }
    }
    
    // Log available cells count by quadrant
    console.log("Available cells by quadrant:",
        availableCellsByQuadrant.map(cells => cells.length)
    );
    
    // Method to get a position in a specific quadrant
    function getPositionInQuadrant(quadrant, size) {
        const availableCells = availableCellsByQuadrant[quadrant];
        
        if (availableCells.length === 0) {
            console.warn(`No available cells in quadrant ${quadrant}, using random position`);
            // Fallback to random position in quadrant
            const halfWidth = width / 2;
            const halfHeight = height / 2;
            let x, y;
            
            switch (quadrant) {
                case 0: // Top-left
                    x = size + Math.random() * (halfWidth - size * 2);
                    y = size + Math.random() * (halfHeight - size * 2);
                    break;
                case 1: // Top-right
                    x = halfWidth + size + Math.random() * (halfWidth - size * 2);
                    y = size + Math.random() * (halfHeight - size * 2);
                    break;
                case 2: // Bottom-left
                    x = size + Math.random() * (halfWidth - size * 2);
                    y = halfHeight + size + Math.random() * (halfHeight - size * 2);
                    break;
                case 3: // Bottom-right
                    x = halfWidth + size + Math.random() * (halfWidth - size * 2);
                    y = halfHeight + size + Math.random() * (halfHeight - size * 2);
                    break;
            }
            
            lastGeneratedPosition = { x, y };
            return { x, y };
        }
        
        // Get a random available cell
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        const cell = availableCells[randomIndex];
        
        // Remove this cell from available cells
        availableCellsByQuadrant[quadrant] = availableCellsByQuadrant[quadrant].filter((_, i) => i !== randomIndex);
        
        // Calculate a position within the cell with some jitter
        const x = (cell.x + 0.2 + Math.random() * 0.6) * CELL_WIDTH;
        const y = (cell.y + 0.2 + Math.random() * 0.6) * CELL_HEIGHT;
        
        // Mark the cell as occupied
        occupiedCells[cell.y][cell.x] = true;
        
        // Track the shape in our quadrant counts
        screenQuadrants[quadrant]++;
        
        lastGeneratedPosition = { x, y };
        return { x, y };
    }
    
    // Return the positioning method
    return { getPositionInQuadrant };
}

// Improved setup debug overlay with better positioning
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
        padding: 8px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 10px;
        z-index: 10000;
        max-width: 300px;
        max-height: 300px;
        overflow: auto;
    `;
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'Visual Effects Debug';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    overlay.appendChild(title);
    
    // Add collapse button
    const collapseButton = document.createElement('button');
    collapseButton.textContent = '−';
    collapseButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        color: white;
        font-size: 14px;
        cursor: pointer;
        padding: 2px 6px;
    `;
    
    let isCollapsed = false;
    collapseButton.addEventListener('click', () => {
        const statsContainer = document.getElementById('debug-stats');
        const buttonContainer = document.getElementById('debug-buttons');
        
        if (isCollapsed) {
            // Expand
            if (statsContainer) statsContainer.style.display = 'block';
            if (buttonContainer) buttonContainer.style.display = 'flex';
            collapseButton.textContent = '−';
            isCollapsed = false;
        } else {
            // Collapse
            if (statsContainer) statsContainer.style.display = 'none';
            if (buttonContainer) buttonContainer.style.display = 'none';
            collapseButton.textContent = '+';
            isCollapsed = true;
        }
    });
    
    overlay.appendChild(collapseButton);
    
    // Add control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'debug-buttons';
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

// Updated debug stats with improved information
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
        <div>- Q0 (Top Left): ${quadrantCounts[0]} (${shapes.length ? (quadrantCounts[0] / shapes.length * 100).toFixed(1) : 0}%)</div>
        <div>- Q1 (Top Right): ${quadrantCounts[1]} (${shapes.length ? (quadrantCounts[1] / shapes.length * 100).toFixed(1) : 0}%)</div>
        <div>- Q2 (Bottom Left): ${quadrantCounts[2]} (${shapes.length ? (quadrantCounts[2] / shapes.length * 100).toFixed(1) : 0}%)</div>
        <div>- Q3 (Bottom Right): ${quadrantCounts[3]} (${shapes.length ? (quadrantCounts[3] / shapes.length * 100).toFixed(1) : 0}%)</div>
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

// Function to visualize the grid for debugging
function visualizeGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Split the screen into a grid
    const GRID_CELLS_X = 20;
    const GRID_CELLS_Y = 16;
    
    // Calculate grid cell size
    const CELL_WIDTH = width / GRID_CELLS_X;
    const CELL_HEIGHT = height / GRID_CELLS_Y;
    
    // Create a container for the grid visualization
    const gridVisualization = document.createElement('div');
    gridVisualization.id = 'grid-visualization';
    gridVisualization.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5000;
    `;
    
    // Create grid lines
    for (let x = 1; x < GRID_CELLS_X; x++) {
        const line = document.createElement('div');
        line.style.cssText = `
            position: absolute;
            top: 0;
            left: ${x * CELL_WIDTH}px;
            width: 1px;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.1);
            pointer-events: none;
        `;
        gridVisualization.appendChild(line);
    }
    
    for (let y = 1; y < GRID_CELLS_Y; y++) {
        const line = document.createElement('div');
        line.style.cssText = `
            position: absolute;
            top: ${y * CELL_HEIGHT}px;
            left: 0;
            width: 100%;
            height: 1px;
            background-color: rgba(255, 255, 255, 0.1);
            pointer-events: none;
        `;
        gridVisualization.appendChild(line);
    }
    
    // Highlight quadrants with different colors
    const quadrants = [
        { x: 0, y: 0, width: width/2, height: height/2, color: 'rgba(255, 0, 0, 0.05)' },
        { x: width/2, y: 0, width: width/2, height: height/2, color: 'rgba(0, 255, 0, 0.05)' },
        { x: 0, y: height/2, width: width/2, height: height/2, color: 'rgba(0, 0, 255, 0.05)' },
        { x: width/2, y: height/2, width: width/2, height: height/2, color: 'rgba(255, 255, 0, 0.05)' }
    ];
    
    quadrants.forEach((q, i) => {
        const quadrant = document.createElement('div');
        quadrant.style.cssText = `
            position: absolute;
            top: ${q.y}px;
            left: ${q.x}px;
            width: ${q.width}px;
            height: ${q.height}px;
            background-color: ${q.color};
            pointer-events: none;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: monospace;
            font-size: 24px;
            color: rgba(255, 255, 255, 0.2);
        `;
        quadrant.textContent = `Q${i}`;
        gridVisualization.appendChild(quadrant);
    });
    
    document.body.appendChild(gridVisualization);
    
    // Add a toggle button to show/hide the grid - FIXED VERSION WITH ID
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Grid';
    toggleButton.id = 'toggle-grid-button'; // Add ID for easy selection
    toggleButton.style.cssText = `
        position: fixed;
        bottom: 50px;
        right: 10px;
        z-index: 10001;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        padding: 5px 10px;
        font-size: 12px;
        cursor: pointer;
    `;
    
    toggleButton.addEventListener('click', () => {
        const grid = document.getElementById('grid-visualization');
        if (grid) {
            grid.style.display = grid.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    document.body.appendChild(toggleButton);
}

// Helper function to determine which quadrant a position falls into
function getQuadrantForPosition(x, y) {
    const quadrant = (x > window.innerWidth / 2 ? 1 : 0) + (y > window.innerHeight / 2 ? 2 : 0);
    return quadrant;
}

// Function to highlight corners for debugging
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

// Function to highlight all shapes for debugging
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

// Initialize the system with grid-based positioning
function initWithGridPositioning() {
    console.log("Initializing visual effects with grid-based positioning...");
    
    // Reset debug counter
    if (typeof debugLogCounter !== 'undefined') {
        debugLogCounter = 0;
    }
    
    // Wait for proper dimensions
    if (window.innerWidth <= 0 || window.innerHeight <= 0) {
        console.warn("Window dimensions not ready yet, delaying initialization");
        setTimeout(initWithGridPositioning, 300);
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
    
    // Visualize the grid system (if in debug mode)
    if (typeof DEBUG !== 'undefined' && DEBUG.enabled) {
        visualizeGrid();
    }
    
    // Create all shapes with grid-based positioning
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
    
    console.log("Visual effects initialization complete with grid-based positioning");
}

// Reset the quadrant counts and clean up elements
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
        document.getElementById('protection-zone'),
        document.getElementById('grid-visualization')
    ];
    
    debugElements.forEach(element => {
        if (element) element.remove();
    });
    
    // Remove corner highlights
    const cornerElements = Array.from(document.querySelectorAll('[id^="corner-"]'));
    cornerElements.forEach(element => {
        if (element) element.remove();
    });
    
    // Remove edge highlights
    const edgeElements = Array.from(document.querySelectorAll('[id^="edge-"]'));
    edgeElements.forEach(element => {
        if (element) element.remove();
    });
    
    // Fixed: Remove the toggle grid button (using standard DOM methods)
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent === 'Toggle Grid') {
            button.remove();
        }
    });
}

// A function to apply our fix when the page loads
function applyVisualEffectsFix() {
    // Wait for the original script to load
    setTimeout(() => {
        // Replace the problematic function with our fixed version
        if (typeof cleanup !== 'undefined') {
            cleanup = cleanupFixed;
            console.log('Applied visual-effects.js patch: Fixed cleanup function');
        }
    }, 500);
}

// Apply our fix
applyVisualEffectsFix();

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

// Create all shapes using grid-based positioning
function createAllShapes() {
    console.log("Creating all shapes with grid-based positioning...");
    
    const staticContainer = document.getElementById('static-shapes');
    const distantContainer = document.getElementById('distant-shapes');
    const shapesContainer = document.getElementById('background-shapes');
    
    if (!staticContainer || !distantContainer || !shapesContainer) {
        console.error("Containers not found, cannot create shapes");
        return;
    }
    
    // Create the grid-based positioning system
    const gridPositioning = createGridBasedPositioning();
    
    // Reset quadrant counts
    screenQuadrants = [0, 0, 0, 0];
    
    // Create dynamic shapes with perfect distribution
    const dynamicCount = visualConfig.shapes.dynamic.count;
    const dynamicPerQuadrant = Math.floor(dynamicCount / 4);
    
    console.log("Creating dynamic shapes...");
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const count = quadrant < (dynamicCount % 4) ? dynamicPerQuadrant + 1 : dynamicPerQuadrant;
        console.log(`Creating ${count} dynamic shapes in quadrant ${quadrant}`);
        
        for (let i = 0; i < count; i++) {
            createDynamicShapeInQuadrant(shapesContainer, quadrant, gridPositioning);
        }
    }
    
    // Static shapes with perfect distribution
    const staticCount = visualConfig.shapes.static.count;
    const staticPerQuadrant = Math.floor(staticCount / 4);
    
    console.log("Creating static shapes...");
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const count = quadrant < (staticCount % 4) ? staticPerQuadrant + 1 : staticPerQuadrant;
        console.log(`Creating ${count} static shapes in quadrant ${quadrant}`);
        
        for (let i = 0; i < count; i++) {
            createStaticShapeInQuadrant(staticContainer, quadrant, gridPositioning);
        }
    }
    
    // Distant shapes with perfect distribution
    const distantCount = visualConfig.shapes.distant.count;
    const distantPerQuadrant = Math.floor(distantCount / 4);
    
    console.log("Creating distant shapes...");
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const count = quadrant < (distantCount % 4) ? distantPerQuadrant + 1 : distantPerQuadrant;
        console.log(`Creating ${count} distant shapes in quadrant ${quadrant}`);
        
        for (let i = 0; i < count; i++) {
            createDistantShapeInQuadrant(distantContainer, quadrant, gridPositioning);
        }
    }
    
    console.log("All shapes created");
    console.log("Dynamic:", shapes.length);
    console.log("Static:", staticShapes.length);
    console.log("Distant:", distantShapes.length);
    console.log("Final quadrant counts:", screenQuadrants);
}

// Create a dynamic shape in a specific quadrant
function createDynamicShapeInQuadrant(container, quadrant, gridPositioning) {
    const dynamicConfig = visualConfig.shapes.dynamic;
    const size = dynamicConfig.minSize + Math.random() * (dynamicConfig.maxSize - dynamicConfig.minSize);
    
    // Use grid positioning to get a position in this quadrant
    const position = gridPositioning.getPositionInQuadrant(quadrant, size);
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
        rotationTransform: rotationTransform,
        quadrant: quadrant
    });
    
    console.log(`Created dynamic shape at (${x.toFixed(0)}, ${y.toFixed(0)}) in quadrant ${quadrant}`);
}

// Create a static shape in a specific quadrant
function createStaticShapeInQuadrant(container, quadrant, gridPositioning) {
    const config = visualConfig.shapes.static;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Use grid positioning to get a position in this quadrant
    const position = gridPositioning.getPositionInQuadrant(quadrant, size);
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
        quadrant: quadrant
    });
    
    console.log(`Created static shape at (${x.toFixed(0)}, ${y.toFixed(0)}) in quadrant ${quadrant}`);
}

// Create a distant shape in a specific quadrant
function createDistantShapeInQuadrant(container, quadrant, gridPositioning) {
    const config = visualConfig.shapes.distant;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    
    // Use grid positioning to get a position in this quadrant
    const position = gridPositioning.getPositionInQuadrant(quadrant, size);
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
        size: size,
        quadrant: quadrant
    });
    
    console.log(`Created distant shape at (${x.toFixed(0)}, ${y.toFixed(0)}) in quadrant ${quadrant}`);
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

// Check if a position is in a corner
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

// Track mouse movement
function trackMouse(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
    lastInteractionTime = Date.now();
}

// Update physics for all shapes
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
    // Not rebalancing on resize, as that would require recreating all shapes
    // Instead, let shapes stay where they are and just adjust boundaries
    console.log("Window resized to:", window.innerWidth, "x", window.innerHeight);
    
    // Cleanup debug elements and recreate them
    if (DEBUG && DEBUG.enabled) {
        const debugElements = [
            document.getElementById('quadrant-lines'),
            document.getElementById('protection-zone'),
            document.getElementById('grid-visualization')
        ];
        
        debugElements.forEach(element => {
            if (element) element.remove();
        });
        
        // Remove corner highlights
        const cornerElements = Array.from(document.querySelectorAll('[id^="corner-"]'));
        cornerElements.forEach(element => {
            if (element) element.remove();
        });
        
        // Remove edge highlights
        const edgeElements = Array.from(document.querySelectorAll('[id^="edge-"]'));
        edgeElements.forEach(element => {
            if (element) element.remove();
        });
        
        // Recreate debug visualizations
        if (DEBUG.visualizeQuadrants) {
            drawQuadrantVisualization();
        }
        
        if (DEBUG.highlightProtectionZone) {
            highlightProtectionZone();
        }
        
        highlightCornerAreas();
        visualizeGrid();
    }
}

// Initialize when window loads
window.addEventListener('load', () => {
    console.log("Window load event - ensuring proper dimensions");
    
    // Check dimensions and initialize only when ready
    if (window.innerWidth > 0 && window.innerHeight > 0) {
        console.log("Window dimensions ready on load:", window.innerWidth, window.innerHeight);
        setTimeout(initWithGridPositioning, 300); // Small delay for extra safety
    } else {
        console.warn("Window dimensions not ready yet on load event");
        
        // Wait for first resize event or force init after 1 second
        const resizeHandler = () => {
            console.log("Resize detected, window dimensions:", window.innerWidth, window.innerHeight);
            window.removeEventListener('resize', resizeHandler);
            initWithGridPositioning();
        };
        
        window.addEventListener('resize', resizeHandler);
        
        // Fallback if no resize occurs
        setTimeout(() => {
            window.removeEventListener('resize', resizeHandler);
            console.log("Forcing init after timeout");
            initWithGridPositioning();
        }, 1000);
    }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    // Remove any debug elements
    const debugElements = [
        document.getElementById('debug-overlay'),
        document.getElementById('quadrant-lines'),
        document.getElementById('protection-zone'),
        document.getElementById('grid-visualization')
    ];
    
    debugElements.forEach(element => {
        if (element) element.remove();
    });
    
    // Remove corner highlights
    const cornerElements = Array.from(document.querySelectorAll('[id^="corner-"]'));
    cornerElements.forEach(element => {
        if (element) element.remove();
    });
    
    // Remove edge highlights
    const edgeElements = Array.from(document.querySelectorAll('[id^="edge-"]'));
    edgeElements.forEach(element => {
        if (element) element.remove();
    });
});

// Export initialization function
window.initVisualEffects = initWithGridPositioning;