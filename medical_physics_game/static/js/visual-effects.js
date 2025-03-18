/**
 * visual-effects.js - Adds interactive visual elements to the game interface
 * This file implements decorative shapes that interact with mouse movement
 * and particle effects for button clicks
 */

// Configuration for visual effects
const visualConfig = {
    // Shape settings
    shapes: {
        count: 30,             // Number of shapes
        minSize: 5,            // Minimum shape size
        maxSize: 60,           // Maximum shape size (reduced for smoother performance)
        colors: [              // Colors matching your game theme
            '#5b8dd9',         // primary
            '#56b886',         // secondary
            '#e67e73',         // danger
            '#f0c866',         // warning
            '#9c77db',         // purple
            '#5bbcd9'          // cyan
        ],
        hollowShapesRatio: 0.6, // 60% of shapes will be hollow
        friction: 0.99,        // Very gentle friction for smooth movement
        maxSpeed: 0.15,        // Lower max speed for calmer movement
        mouseInfluence: 0.01,  // Very subtle mouse influence
        mouseRadius: 150,      // How far the mouse influence reaches
        enabledPages: [        // Only enable shapes on these pages
            'landing',         // Landing page
            'character-select' // Character selection
        ]
    },
    // Particle config for createParticleBurst function
    particles: {
        count: 15,
        size: { min: 3, max: 8 },
        speed: { min: 2, max: 5 },
        duration: 1000,
        fadeStart: 0.7,
        gravity: 0.002,
        trail: 0.5,
        glow: true,
        colors: ['#5b8dd9', '#56b886', '#e67e73', '#f0c866', '#9c77db', '#5bbcd9']
    }
}


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
    
    // Simple size distribution
    const size = visualConfig.shapes.minSize + Math.random() * (visualConfig.shapes.maxSize - visualConfig.shapes.minSize);
    
    const color = visualConfig.shapes.colors[Math.floor(Math.random() * visualConfig.shapes.colors.length)];
    
    // Random position within viewport
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    // Simple opacity based on size
    const baseOpacity = 0.2 + (Math.random() * 0.3); // Randomize opacity slightly
    
    // Determine if shape should be hollow
    const isHollow = Math.random() < visualConfig.shapes.hollowShapesRatio;
    
    // Simple shape types: circle or rounded square
    const isCircle = Math.random() < 0.7; // 70% circles, 30% rounded squares
    const borderRadius = isCircle ? '50%' : '4px';
    
    // Shape styling - different for hollow vs filled shapes
    if (isHollow) {
        // Hollow shape - no background, only border
        const borderWidth = Math.max(1, size / 20); // Scale border with shape size
        shape.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: transparent;
            border: ${borderWidth}px solid ${color};
            border-radius: ${borderRadius};
            opacity: ${baseOpacity};
            transform: translate(${x}px, ${y}px);
            pointer-events: none;
            transition: opacity 0.8s ease;
            will-change: transform;
        `;
    } else {
        // Filled shape 
        shape.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${borderRadius};
            opacity: ${baseOpacity};
            transform: translate(${x}px, ${y}px);
            pointer-events: none;
            transition: opacity 0.8s ease;
            will-change: transform;
        `;
    }
    
    container.appendChild(shape);
    
    // Very gentle initial movement
    const speedMultiplier = 0.1; // Lower initial speeds
    
    // Store shape data for animation - very simple data structure
    shapes.push({
        element: shape,
        x: x,
        y: y,
        size: size,
        speedX: (Math.random() * 0.2 - 0.1) * speedMultiplier,
        speedY: (Math.random() * 0.2 - 0.1) * speedMultiplier,
        baseOpacity: baseOpacity,
        isHollow: isHollow
    });
}

/**
 * Update shapes based on mouse position - simplified for smooth, calming movement
 */
function updateShapesWithMouseInteraction() {
    if (shapes.length === 0) {
        requestAnimationFrame(updateShapesWithMouseInteraction);
        return;
    }

    shapes.forEach(shape => {
        // Apply very gentle friction to current movement
        shape.speedX *= visualConfig.shapes.friction;
        shape.speedY *= visualConfig.shapes.friction;
        
        // Apply current movement
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        
        // Extremely gentle mouse interaction - with smooth falloff based on distance
        const dx = mouseX - shape.x;
        const dy = mouseY - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < visualConfig.shapes.mouseRadius) {
            // Calculate smooth falloff based on distance
            const influence = (1 - distance / visualConfig.shapes.mouseRadius) * visualConfig.shapes.mouseInfluence;
            
            // Move away from mouse very gently
            const angle = Math.atan2(dy, dx);
            shape.speedX -= Math.cos(angle) * influence;
            shape.speedY -= Math.sin(angle) * influence;
        }
        
        // Apply speed limit for smooth movement
        const currentSpeed = Math.sqrt(shape.speedX * shape.speedX + shape.speedY * shape.speedY);
        if (currentSpeed > visualConfig.shapes.maxSpeed) {
            const ratio = visualConfig.shapes.maxSpeed / currentSpeed;
            shape.speedX *= ratio;
            shape.speedY *= ratio;
        }
        
        // Simple, gentle wrap-around at screen edges
        const buffer = shape.size;
        if (shape.x < -buffer) shape.x = window.innerWidth + buffer;
        if (shape.x > window.innerWidth + buffer) shape.x = -buffer;
        if (shape.y < -buffer) shape.y = window.innerHeight + buffer;
        if (shape.y > window.innerHeight + buffer) shape.y = -buffer;
        
        // Apply position update with hardware acceleration hint
        shape.element.style.transform = `translate3d(${shape.x}px, ${shape.y}px, 0)`;
    });
    
    // Continue animation loop
    requestAnimationFrame(updateShapesWithMouseInteraction);
}

/**
 * Create a particle burst effect at the specified coordinates
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
    // When you add audio files, you can uncomment this
    // const sound = new Audio('/static/audio/click.mp3');
    // sound.volume = 0.3;
    // sound.play();
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize background shapes
    initBackgroundShapes();
    
    // Replace button click handlers with enhanced version that includes sound effects
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
window.playButtonSound = playButtonSound;
window.createParticleBurst = createParticleBurst;