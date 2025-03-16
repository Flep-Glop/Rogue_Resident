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
    
    // Array of colors
    const colors = [
        'var(--color-primary)',
        'var(--color-secondary)',
        'var(--color-warning)',
        'var(--color-danger)',
        'var(--color-accent-purple)',
        'var(--color-accent-cyan)'
    ];
    
    // Create particles
    for (let i = 0; i < 80; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position
        const x = Math.random() * viewportWidth;
        const y = Math.random() * viewportHeight;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Random size
        const size = 2 + Math.random() * 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = color;
        
        // Random animation properties
        const floatX = -200 + Math.random() * 400;
        const floatY = -200 + Math.random() * 400;
        const floatDuration = 15 + Math.random() * 30;
        const pulseDuration = 2 + Math.random() * 4;
        const rotate = Math.random() * 360;
        
        particle.style.setProperty('--float-x', `${floatX}px`);
        particle.style.setProperty('--float-y', `${floatY}px`);
        particle.style.setProperty('--float-rotate', `${rotate}deg`);
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
    
    const shapes = ['square', 'circle', 'diamond'];
    
    // Array of colors
    const colors = [
        'var(--color-primary)',
        'var(--color-secondary)',
        'var(--color-warning)',
        'var(--color-danger)',
        'var(--color-accent-purple)',
        'var(--color-accent-cyan)'
    ];
    
    // Store elements for mouse interaction
    window.geoElements = [];
    
    // Create geometric elements
    for (let i = 0; i < 25; i++) {
        const element = document.createElement('div');
        element.className = 'geo-element';
        
        // Random position
        const x = Math.random() * viewportWidth;
        const y = Math.random() * viewportHeight;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        // Store initial position for mouse interaction
        element.dataset.initialX = x;
        element.dataset.initialY = y;
        element.dataset.velocityX = 0;
        element.dataset.velocityY = 0;
        
        // Random size
        const size = 20 + Math.random() * 60;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        
        // Random filled or outline
        const isFilled = Math.random() > 0.5;
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        if (isFilled) {
            element.style.backgroundColor = color;
            element.style.borderColor = 'transparent';
            element.style.opacity = '0.3'; // Lower opacity for filled shapes
            element.classList.add('filled');
        } else {
            element.style.borderColor = color;
            element.style.borderWidth = '2px';
            element.style.borderStyle = 'solid';
            element.style.backgroundColor = 'transparent';
        }
        
        // Random shape
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        if (shape === 'circle') {
            element.style.borderRadius = '50%';
        } else if (shape === 'diamond') {
            element.style.transform = 'rotate(45deg)';
        }
        
        // Random animation properties
        const floatX = -300 + Math.random() * 600;
        const floatY = -300 + Math.random() * 600;
        const floatDuration = 30 + Math.random() * 60;
        const geoDuration = 4 + Math.random() * 8;
        const rotate = Math.random() * 360;
        
        element.style.setProperty('--geo-x', `${floatX}px`);
        element.style.setProperty('--geo-y', `${floatY}px`);
        element.style.setProperty('--geo-rotate', `${rotate}deg`);
        element.style.setProperty('--geo-duration', `${floatDuration}s`);
        element.style.setProperty('--geo-pulse', `${geoDuration}s`);
        
        // Random color alternation
        const altColor = colors[Math.floor(Math.random() * colors.length)];
        element.style.setProperty('--geo-color', color);
        element.style.setProperty('--geo-color-alt', altColor);
        
        // Set a delay
        element.style.animationDelay = `${Math.random() * 10}s`;
        
        container.appendChild(element);
        
        // Store element for mouse interaction
        window.geoElements.push(element);
    }
    
    // Add filled pixels (smaller shapes)
    for (let i = 0; i < 40; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel-element';
        
        // Random position
        const x = Math.random() * viewportWidth;
        const y = Math.random() * viewportHeight;
        pixel.style.left = `${x}px`;
        pixel.style.top = `${y}px`;
        
        // Store initial position for mouse interaction
        pixel.dataset.initialX = x;
        pixel.dataset.initialY = y;
        pixel.dataset.velocityX = 0;
        pixel.dataset.velocityY = 0;
        
        // Random size (smaller)
        const size = 4 + Math.random() * 8;
        pixel.style.width = `${size}px`;
        pixel.style.height = `${size}px`;
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        pixel.style.backgroundColor = color;
        
        // Random shape (some squares, some circles)
        if (Math.random() > 0.5) {
            pixel.style.borderRadius = '50%';
        }
        
        // Random animation properties
        const floatX = -200 + Math.random() * 400;
        const floatY = -200 + Math.random() * 400;
        const floatDuration = 20 + Math.random() * 40;
        const pulseDuration = 2 + Math.random() * 4;
        
        pixel.style.setProperty('--float-x', `${floatX}px`);
        pixel.style.setProperty('--float-y', `${floatY}px`);
        pixel.style.setProperty('--float-duration', `${floatDuration}s`);
        pixel.style.setProperty('--pulse-duration', `${pulseDuration}s`);
        
        // Set a delay
        pixel.style.animationDelay = `${Math.random() * 10}s`;
        
        container.appendChild(pixel);
        
        // Store element for mouse interaction
        window.geoElements.push(pixel);
    }
    
    // Add mouse interaction
    initMouseInteraction();
}

/**
 * Initialize mouse interaction with geometric elements
 */
function initMouseInteraction() {
    if (!window.geoElements || window.geoElements.length === 0) return;
    
    // Mouse position
    let mouseX = -1000;
    let mouseY = -1000;
    let mouseActive = false;
    
    // Track mouse position
    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        mouseActive = true;
        
        // Temporarily disable animations when mouse is active
        window.geoElements.forEach(element => {
            element.classList.add('mouse-interactive');
        });
    });
    
    // Mouse leave document
    document.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
        mouseActive = false;
        
        // Re-enable animations
        setTimeout(() => {
            window.geoElements.forEach(element => {
                element.classList.remove('mouse-interactive');
            });
        }, 1000);
    });
    
    // Animation frame for smooth interaction
    function updateElementsPosition() {
        const interactionDistance = 200; // How far mouse influences elements
        const maxForce = 40; // Maximum force applied
        const friction = 0.95; // Friction to slow down elements when force is removed
        
        window.geoElements.forEach(element => {
            // Skip elements that don't have initial positions stored
            if (!element.dataset.initialX || !element.dataset.initialY) return;
            
            // Get initial position
            const initialX = parseFloat(element.dataset.initialX);
            const initialY = parseFloat(element.dataset.initialY);
            
            // Get current position and velocity
            let velocityX = parseFloat(element.dataset.velocityX) || 0;
            let velocityY = parseFloat(element.dataset.velocityY) || 0;
            
            // Calculate element center
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate distance to mouse
            const dx = centerX - mouseX;
            const dy = centerY - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Apply force based on distance
            if (distance < interactionDistance && mouseActive) {
                // Normalize direction
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                // Calculate force (stronger when closer)
                const force = (interactionDistance - distance) / interactionDistance * maxForce;
                
                // Apply force
                velocityX += dirX * force * 0.1;
                velocityY += dirY * force * 0.1;
            }
            
            // Apply return to original position force
            velocityX += (initialX - rect.left) * 0.01;
            velocityY += (initialY - rect.top) * 0.01;
            
            // Apply friction
            velocityX *= friction;
            velocityY *= friction;
            
            // Update position
            const currentLeft = rect.left + velocityX;
            const currentTop = rect.top + velocityY;
            
            element.style.left = `${currentLeft}px`;
            element.style.top = `${currentTop}px`;
            
            // Store updated velocity
            element.dataset.velocityX = velocityX;
            element.dataset.velocityY = velocityY;
        });
        
        // Continue animation
        requestAnimationFrame(updateElementsPosition);
    }
    
    // Start animation loop
    requestAnimationFrame(updateElementsPosition);
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