/**
 * visual-effects.js - Adds interactive visual elements to the game interface
 * This file implements decorative shapes that interact with mouse movement
 * and particle effects for button clicks
 */

// Configuration for visual effects
const visualConfig = {
    // Shape settings
    shapes: {
        count: 25,             // Increase this for more shapes
        minSize: 8,            // Minimum shape size in pixels
        maxSize: 20,           // Maximum shape size in pixels
        colors: [              // Colors matching your game theme
            '#5b8dd9',         // primary
            '#56b886',         // secondary
            '#e67e73',         // danger
            '#f0c866',         // warning
            '#9c77db',         // purple
            '#5bbcd9'          // cyan
        ],
        followSpeed: 0.05,     // How quickly shapes follow the mouse (0-1)
        interactionDistance: 150  // How far shapes react to the mouse
    },
    
    // Particle burst settings
    particles: {
        count: 20,             // Particles per burst
        size: {
            min: 3,            // Minimum particle size
            max: 7             // Maximum particle size
        },
        speed: {
            min: 2,            // Minimum speed
            max: 5             // Maximum speed
        },
        duration: 1000,        // How long particles last (ms)
        colors: [              // Particle colors
            '#5b8dd9',         // primary
            '#56b886',         // secondary
            '#e67e73',         // danger
            '#f0c866',         // warning
            '#9c77db',         // purple
            '#5bbcd9'          // cyan
        ]
    }
};

// Store for all active shapes
let shapes = [];
// Mouse position tracking
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

/**
 * Initialize interactive background shapes
 */
function initBackgroundShapes() {
    // Create shape container if it doesn't exist
    let shapeContainer = document.getElementById('background-shapes');
    if (!shapeContainer) {
        shapeContainer = document.createElement('div');
        shapeContainer.id = 'background-shapes';
        shapeContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        `;
        document.body.appendChild(shapeContainer);
    }
    
    // Create shapes
    for (let i = 0; i < visualConfig.shapes.count; i++) {
        createShape(shapeContainer);
    }
    
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Start animation loop
    requestAnimationFrame(updateShapesWithMouseInteraction);
}

/**
 * Create a single decorative shape
 */
function createShape(container) {
    const shape = document.createElement('div');
    const size = Math.random() * (visualConfig.shapes.maxSize - visualConfig.shapes.minSize) + visualConfig.shapes.minSize;
    const color = visualConfig.shapes.colors[Math.floor(Math.random() * visualConfig.shapes.colors.length)];
    
    // Random position within viewport
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    // Shape styling
    shape.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        opacity: ${Math.random() * 0.4 + 0.2};
        transform: translate(${x}px, ${y}px) rotate(${Math.random() * 360}deg);
        box-shadow: 0 0 ${size/2}px rgba(255,255,255,0.3);
        pointer-events: none;
        transition: opacity 0.5s ease;
    `;
    
    container.appendChild(shape);
    
    // Store shape data for animation
    shapes.push({
        element: shape,
        x: x,
        y: y,
        size: size,
        angle: Math.random() * 360,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        rotationSpeed: Math.random() * 0.5 - 0.25
    });
}

/**
 * Update shapes based on mouse position
 * This is the function that was undefined in your error
 */
function updateShapesWithMouseInteraction() {
    shapes.forEach(shape => {
        // Calculate distance to mouse
        const dx = mouseX - shape.x;
        const dy = mouseY - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply gentle movement
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        
        // Mouse interaction
        if (distance < visualConfig.shapes.interactionDistance) {
            // Move away from mouse
            const angle = Math.atan2(dy, dx);
            const repelForce = (1 - distance / visualConfig.shapes.interactionDistance) * 2;
            
            shape.x -= Math.cos(angle) * repelForce;
            shape.y -= Math.sin(angle) * repelForce;
            
            // Increase opacity when interacting
            shape.element.style.opacity = Math.min(0.8, parseFloat(shape.element.style.opacity) + 0.05);
        } else {
            // Gradually return to normal opacity
            shape.element.style.opacity = Math.max(0.2, parseFloat(shape.element.style.opacity) - 0.01);
        }
        
        // Gentle attraction to mouse for distant shapes
        if (distance > visualConfig.shapes.interactionDistance * 2) {
            shape.x += dx * 0.0005;
            shape.y += dy * 0.0005;
        }
        
        // Boundary check - wrap around screen
        if (shape.x < -shape.size) shape.x = window.innerWidth + shape.size;
        if (shape.x > window.innerWidth + shape.size) shape.x = -shape.size;
        if (shape.y < -shape.size) shape.y = window.innerHeight + shape.size;
        if (shape.y > window.innerHeight + shape.size) shape.y = -shape.size;
        
        // Update rotation
        shape.angle += shape.rotationSpeed;
        
        // Apply position and rotation
        shape.element.style.transform = `translate(${shape.x}px, ${shape.y}px) rotate(${shape.angle}deg)`;
    });
    
    // Continue animation loop
    requestAnimationFrame(updateShapesWithMouseInteraction);
}

/**
 * Create a particle burst effect at the specified coordinates
 * This is the function that was undefined in your error
 */
function createParticleBurst(x, y, color = null) {
    // Create particle container if it doesn't exist
    let particleContainer = document.getElementById('particle-container');
    if (!particleContainer) {
        particleContainer = document.createElement('div');
        particleContainer.id = 'particle-container';
        particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(particleContainer);
    }
    
    // Use specified color or random color from config
    const burstColor = color || visualConfig.particles.colors[Math.floor(Math.random() * visualConfig.particles.colors.length)];
    
    // Create particles
    for (let i = 0; i < visualConfig.particles.count; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * (visualConfig.particles.size.max - visualConfig.particles.size.min) + visualConfig.particles.size.min;
        
        // Generate random angle and speed
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (visualConfig.particles.speed.max - visualConfig.particles.speed.min) + visualConfig.particles.speed.min;
        
        // Calculate velocity
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // Style the particle
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${burstColor};
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 9999;
        `;
        
        particleContainer.appendChild(particle);
        
        // Animate the particle
        let startTime = performance.now();
        
        function animateParticle(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = elapsed / visualConfig.particles.duration;
            
            if (progress >= 1) {
                particleContainer.removeChild(particle);
                return;
            }
            
            // Calculate current position with gravity effect
            const currentX = x + vx * elapsed;
            const currentY = y + vy * elapsed + 0.5 * 0.1 * elapsed * elapsed;
            
            // Fade out near the end of animation
            const opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
            
            // Update particle position and opacity
            particle.style.transform = `translate(${currentX - x}px, ${currentY - y}px)`;
            particle.style.opacity = opacity;
            
            requestAnimationFrame(animateParticle);
        }
        
        requestAnimationFrame(animateParticle);
    }
}

/**
 * Enhanced button sound effect
 * Replaces your existing playButtonSound function
 */
function playButtonSound(e) {
    // Create particle burst at click coordinates
    if (e && e.clientX) {
        createParticleBurst(e.clientX, e.clientY);
    } else if (e && e.target) {
        // If event but no coordinates, burst from target center
        const rect = e.target.getBoundingClientRect();
        createParticleBurst(rect.left + rect.width/2, rect.top + rect.height/2);
    }
    
    // When you add audio files, you can uncomment this
    // const sound = new Audio('/static/audio/click.mp3');
    // sound.volume = 0.3;
    // sound.play();
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize background shapes
    initBackgroundShapes();
    
    // Replace button click handlers with enhanced version that includes particle effects
    document.querySelectorAll('.retro-btn, .game-btn, .btn').forEach(button => {
        button.addEventListener('click', playButtonSound);
    });
});

// Handle window resize
window.addEventListener('resize', function() {
    // Update shapes positions to fit new window size
    shapes.forEach(shape => {
        if (shape.x > window.innerWidth) shape.x = window.innerWidth * (shape.x / window.innerWidth);
        if (shape.y > window.innerHeight) shape.y = window.innerHeight * (shape.y / window.innerHeight);
    });
});

// Export functions so they're available globally
window.updateShapesWithMouseInteraction = updateShapesWithMouseInteraction;
window.createParticleBurst = createParticleBurst;
window.playButtonSound = playButtonSound;
