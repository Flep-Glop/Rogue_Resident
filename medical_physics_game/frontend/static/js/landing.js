/**
 * Landing page script for Rogue Resident
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Landing page initialized");
    
    // Generate grid background
    createGridBackground();
    
    // Create colorful pixel particles
    createPixelParticles();
    
    // Create geometric elements
    createGeometricElements();
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            location.href = 'character-select';
        }
    });
});

/**
 * Creates the grid background
 */
function createGridBackground() {
    const container = document.getElementById('grid-background');
    const gridSize = 32; // Size of grid cells
    
    // Create horizontal grid lines
    for (let y = 0; y < window.innerHeight; y += gridSize) {
        const line = document.createElement('div');
        line.classList.add('grid-line', 'grid-line-horizontal');
        line.style.top = `${y}px`;
        container.appendChild(line);
    }
    
    // Create vertical grid lines
    for (let x = 0; x < window.innerWidth; x += gridSize) {
        const line = document.createElement('div');
        line.classList.add('grid-line', 'grid-line-vertical');
        line.style.left = `${x}px`;
        container.appendChild(line);
    }
}

/**
 * Creates floating pixel particles
 */
function createPixelParticles() {
    const container = document.getElementById('particles-container');
    const colors = [
        'rgba(91, 141, 217, 0.8)',  // Primary
        'rgba(86, 184, 134, 0.8)',  // Secondary
        'rgba(240, 200, 102, 0.8)', // Warning
        'rgba(156, 119, 219, 0.8)', // Purple
        'rgba(230, 126, 115, 0.8)'  // Danger
    ];
    
    // Create many particles
    for (let i = 0; i < 300; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 1-4px
        const size = Math.random() * 3 + 1;
        particle.style.setProperty('--particle-size', `${size}px`);
        
        // Random position
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.setProperty('--particle-color', color);
        
        // Random opacity
        const opacity = Math.random() * 0.5 + 0.3;
        particle.style.setProperty('--particle-opacity', opacity.toString());
        
        // Random animation properties
        particle.style.setProperty('--float-duration', `${Math.random() * 40 + 20}s`);
        particle.style.setProperty('--float-x', `${Math.random() * 400 - 200}px`);
        particle.style.setProperty('--float-y', `${Math.random() * 400 - 200}px`);
        particle.style.setProperty('--float-rotate', `${Math.random() * 720 - 360}deg`);
        
        // Pulse animation
        particle.style.setProperty('--pulse-duration', `${Math.random() * 4 + 2}s`);
        particle.style.setProperty('--pulse-min', `${Math.random() * 0.3 + 0.1}`);
        particle.style.setProperty('--pulse-max', `${opacity}`);
        
        container.appendChild(particle);
    }
}

/**
 * Creates large geometric elements
 */
function createGeometricElements() {
    const container = document.getElementById('geo-elements-container');
    const shapes = [
        'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond
        'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', // Hexagon
        'polygon(50% 0%, 100% 100%, 0% 100%)', // Triangle
        'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' // Octagon
    ];
    
    const colors = [
        'rgba(91, 141, 217, 0.5)',  // Primary
        'rgba(86, 184, 134, 0.5)',  // Secondary
        'rgba(240, 200, 102, 0.5)', // Warning
        'rgba(156, 119, 219, 0.5)'  // Purple
    ];
    
    // Add geometric elements
    for (let i = 0; i < 25; i++) { // Reduced count since shapes are much larger
        const element = document.createElement('div');
        element.classList.add('geo-element');
        
        // Random position
        element.style.top = `${Math.random() * 100}%`;
        element.style.left = `${Math.random() * 100}%`;
        
        // Much larger random size between 80-300px
        const size = Math.random() * 220 + 80;
        element.style.setProperty('--geo-size', `${size}px`);
        
        // Random shape
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        element.style.clipPath = shape;
        
        // Random colors
        const color1 = colors[Math.floor(Math.random() * colors.length)];
        const color2 = colors[Math.floor(Math.random() * colors.length)];
        element.style.setProperty('--geo-color', color1);
        element.style.setProperty('--geo-color-alt', color2);
        
        // Random opacity
        element.style.setProperty('--geo-opacity', `${Math.random() * 0.2 + 0.1}`);
        element.style.setProperty('--geo-min', `${Math.random() * 0.1 + 0.05}`);
        element.style.setProperty('--geo-max', `${Math.random() * 0.2 + 0.1}`);
        
        // Random animation properties
        element.style.setProperty('--geo-duration', `${Math.random() * 40 + 20}s`);
        element.style.setProperty('--geo-x', `${Math.random() * 400 - 200}px`);
        element.style.setProperty('--geo-y', `${Math.random() * 400 - 200}px`);
        element.style.setProperty('--geo-rotate', `${Math.random() * 360}deg`);
        element.style.setProperty('--geo-pulse', `${Math.random() * 6 + 3}s`);
        
        container.appendChild(element);
    }
}

/**
 * Opens options dialog
 */
function openOptions() {
    alert('Options will be available in the next update!');
}

/**
 * Opens help dialog
 */
function openHelp() {
    alert('Welcome to Rogue Resident! Navigate through each floor, answer questions correctly to gain insight, and avoid losing all your lives. Good luck!');
}