/**
 * Landing page initialization and effects
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize grid background
    initGridBackground();
    
    // Initialize particles
    initParticles();
    
    // Initialize geometric elements
    initGeoElements();
    
    // Set up button event listeners
    document.getElementById('new-game-btn').addEventListener('click', () => {
        window.location.href = 'character-select';
    });
    
    document.getElementById('continue-btn').addEventListener('click', () => {
        window.location.href = 'game';
    });
    
    document.getElementById('options-btn').addEventListener('click', openOptions);
    
    document.getElementById('help-btn').addEventListener('click', openHelp);
    
    // Space key event listener
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            window.location.href = 'character-select';
        }
    });
    
    console.log("Landing page initialized");
});

/**
 * Initialize grid background
 */
function initGridBackground() {
    const container = document.getElementById('grid-background');
    if (!container) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Create horizontal grid lines
    for (let y = 0; y < viewportHeight; y += 40) {
        const line = document.createElement('div');
        line.className = 'grid-line grid-line-horizontal';
        line.style.top = `${y}px`;
        container.appendChild(line);
    }
    
    // Create vertical grid lines
    for (let x = 0; x < viewportWidth; x += 40) {
        const line = document.createElement('div');
        line.className = 'grid-line grid-line-vertical';
        line.style.left = `${x}px`;
        container.appendChild(line);
    }
}

/**
 * Initialize particles
 */
function initParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position
        const x = Math.random() * viewportWidth;
        const y = Math.random() * viewportHeight;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Random size
        const size = 1 + Math.random() * 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random animation properties
        const floatX = -200 + Math.random() * 400;
        const floatY = -200 + Math.random() * 400;
        const floatDuration = 15 + Math.random() * 30;
        const pulseDuration = 2 + Math.random() * 4;
        
        particle.style.setProperty('--float-x', `${floatX}px`);
        particle.style.setProperty('--float-y', `${floatY}px`);
        particle.style.setProperty('--float-duration', `${floatDuration}s`);
        particle.style.setProperty('--pulse-duration', `${pulseDuration}s`);
        
        // Set a delay
        particle.style.animationDelay = `${Math.random() * 10}s`;
        
        container.appendChild(particle);
    }
}

/**
 * Initialize geometric elements
 */
function initGeoElements() {
    const container = document.getElementById('geo-elements-container');
    if (!container) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const shapes = ['square', 'circle', 'triangle', 'diamond'];
    
    // Create geometric elements
    for (let i = 0; i < 15; i++) {
        const element = document.createElement('div');
        element.className = 'geo-element';
        
        // Random position
        const x = Math.random() * viewportWidth;
        const y = Math.random() * viewportHeight;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        // Random size
        const size = 20 + Math.random() * 60;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        
        // Random shape
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        if (shape === 'circle') {
            element.style.borderRadius = '50%';
        } else if (shape === 'triangle') {
            element.style.width = '0';
            element.style.height = '0';
            element.style.border = `${size/2}px solid transparent`;
            element.style.borderBottomColor = 'var(--color-primary)';
            element.style.borderRight = 'none';
            element.style.borderLeft = 'none';
            element.style.borderTop = 'none';
        } else if (shape === 'diamond') {
            element.style.transform = 'rotate(45deg)';
        }
        
        // Random animation properties
        const floatX = -300 + Math.random() * 600;
        const floatY = -300 + Math.random() * 600;
        const floatDuration = 30 + Math.random() * 60;
        const geoDuration = 4 + Math.random() * 8;
        
        element.style.setProperty('--geo-x', `${floatX}px`);
        element.style.setProperty('--geo-y', `${floatY}px`);
        element.style.setProperty('--geo-duration', `${floatDuration}s`);
        element.style.setProperty('--geo-pulse', `${geoDuration}s`);
        
        // Random color variation
        if (Math.random() > 0.5) {
            element.style.setProperty('--geo-color', 'var(--color-primary)');
            element.style.setProperty('--geo-color-alt', 'var(--color-secondary)');
        } else {
            element.style.setProperty('--geo-color', 'var(--color-secondary)');
            element.style.setProperty('--geo-color-alt', 'var(--color-primary)');
        }
        
        // Set a delay
        element.style.animationDelay = `${Math.random() * 10}s`;
        
        container.appendChild(element);
    }
}

/**
 * Open options modal
 */
function openOptions() {
    alert('Options will be available in the next update!');
}

/**
 * Open help modal
 */
function openHelp() {
    alert('Welcome to Rogue Resident! Navigate through each floor, answer questions correctly to gain insight, and avoid losing all your lives. Good luck!');
}