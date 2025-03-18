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
        followSpeed: 0.01,     // How quickly shapes follow the mouse (lowered for more independence)
        interactionDistance: 150,  // How far shapes react to the mouse
        enabledPages: [        // Only enable shapes on these pages
            'landing',         // Landing page
            'character-select' // Character selection
            // 'game'          // Commented out to disable on game screen
        ]
    },
    
    // Particle burst settings
    particles: {
        count: 30,             // Increased particle count
        size: {
            min: 4,            // Slightly larger minimum
            max: 10            // Larger maximum
        },
        speed: {
            min: 1,            // Slower minimum speed for longer trails
            max: 4             // Slightly reduced maximum speed
        },
        duration: 2500,        // Much longer duration (2.5 seconds)
        fadeStart: 0.6,        // When particles start to fade (proportion of duration)
        trail: 0.3,            // Trail effect intensity (0-1)
        gravity: 0.03,         // Reduced gravity for more floating effect
        colors: [              // Particle colors
            '#5b8dd9',         // primary
            '#56b886',         // secondary
            '#e67e73',         // danger
            '#f0c866',         // warning
            '#9c77db',         // purple
            '#5bbcd9'          // cyan
        ],
        glow: true             // Add glow effect to particles
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
    // Check if we should enable shapes on this page
    if (!shouldEnableShapesOnCurrentPage()) {
        return; // Don't create shapes on this page
    }

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
 * Determine if shapes should be enabled on the current page
 */
function shouldEnableShapesOnCurrentPage() {
    // Get the current path
    const path = window.location.pathname;
    
    // Check against enabled pages
    return visualConfig.shapes.enabledPages.some(page => {
        if (page === 'landing' && (path === '/' || path.includes('landing'))) {
            return true;
        }
        return path.includes(page);
    });
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
    if (shapes.length === 0) {
        requestAnimationFrame(updateShapesWithMouseInteraction);
        return;
    }

    shapes.forEach(shape => {
        // Calculate distance to mouse
        const dx = mouseX - shape.x;
        const dy = mouseY - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply gentle independent movement
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        
        // Occasionally change direction slightly for more organic movement
        if (Math.random() < 0.01) {
            shape.speedX += (Math.random() - 0.5) * 0.1;
            shape.speedY += (Math.random() - 0.5) * 0.1;
            
            // Limit max speed
            const maxSpeed = 0.5;
            const currentSpeed = Math.sqrt(shape.speedX * shape.speedX + shape.speedY * shape.speedY);
            if (currentSpeed > maxSpeed) {
                shape.speedX = (shape.speedX / currentSpeed) * maxSpeed;
                shape.speedY = (shape.speedY / currentSpeed) * maxSpeed;
            }
        }
        
        // Mouse interaction - only when mouse is close
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
        
        // Much gentler attraction to center of screen for very distant shapes
        // This prevents shapes from drifting too far away
        if (distance > window.innerWidth / 2) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const dxCenter = centerX - shape.x;
            const dyCenter = centerY - shape.y;
            
            shape.x += dxCenter * 0.0001;
            shape.y += dyCenter * 0.0001;
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
    
    // Create particles - use 2-3 colors for variety
    const colorCount = 2 + Math.floor(Math.random() * 2);
    const burstColors = [];
    
    for (let i = 0; i < colorCount; i++) {
        burstColors.push(visualConfig.particles.colors[Math.floor(Math.random() * visualConfig.particles.colors.length)]);
    }
    
    // Create particles
    for (let i = 0; i < visualConfig.particles.count; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * (visualConfig.particles.size.max - visualConfig.particles.size.min) + visualConfig.particles.size.min;
        
        // Pick a random color from our generated colors
        const particleColor = color || burstColors[i % burstColors.length];
        
        // Generate random angle and speed - vary speeds for more natural burst
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (visualConfig.particles.speed.max - visualConfig.particles.speed.min) + visualConfig.particles.speed.min;
        
        // Add small variation to starting position for more natural burst
        const startX = x + (Math.random() - 0.5) * 5;
        const startY = y + (Math.random() - 0.5) * 5;
        
        // Calculate velocity with slight randomness
        const vx = Math.cos(angle) * speed * (0.8 + Math.random() * 0.4);
        const vy = Math.sin(angle) * speed * (0.8 + Math.random() * 0.4);
        
        // Add glow effect if enabled
        const glowEffect = visualConfig.particles.glow ? 
            `box-shadow: 0 0 ${size * 1.5}px ${particleColor}; filter: blur(${size/6}px);` : '';
        
        // Style the particle
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${particleColor};
            border-radius: 50%;
            left: ${startX}px;
            top: ${startY}px;
            pointer-events: none;
            z-index: 9999;
            ${glowEffect}
            transform-origin: center center;
        `;
        
        particleContainer.appendChild(particle);
        
        // Animate the particle
        let startTime = performance.now();
        const duration = visualConfig.particles.duration * (0.8 + Math.random() * 0.4); // Vary duration
        const fadeStartPoint = visualConfig.particles.fadeStart; // When to start fading
        
        // Individual particle gravity factor for varied paths
        const gravity = visualConfig.particles.gravity * (0.7 + Math.random() * 0.6);
        
        // Track previous positions for trail effect
        let prevX = startX;
        let prevY = startY;
        
        function animateParticle(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                particleContainer.removeChild(particle);
                return;
            }
            
            // Add "easing" to slow down particles at the end
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            
            // Calculate current position with gentle gravity effect
            const currentX = startX + vx * elapsed * (1 - progress * 0.3); // Slow down over time
            const currentY = startY + vy * elapsed * (1 - progress * 0.3) + gravity * elapsed * elapsed;
            
            // Calculate movement delta for this frame
            const deltaX = currentX - prevX;
            const deltaY = currentY - prevY;
            
            // Store current position for next frame
            prevX = currentX;
            prevY = currentY;
            
            // Fade out gradually 
            const opacity = progress > fadeStartPoint ? 
                1 - ((progress - fadeStartPoint) / (1 - fadeStartPoint)) : 1;
            
            // Shrink slightly as it fades
            const scale = 1 - (progress * 0.4);
            
            // Trail effect - stretch based on speed and direction
            const trailFactor = visualConfig.particles.trail;
            const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const stretch = 1 + (speed * trailFactor);
            const angle = Math.atan2(deltaY, deltaX);
            
            // Update particle position, opacity and scale with trail effect
            particle.style.transform = `translate(${currentX - startX}px, ${currentY - startY}px) 
                                        rotate(${angle}rad) 
                                        scale(${stretch * scale}, ${scale})`;
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