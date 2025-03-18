/**
 * visual-effects.js - Adds interactive visual elements to the game interface
 * This file implements decorative shapes that interact with mouse movement
 * and particle effects for button clicks
 */

// Configuration for visual effects
const visualConfig = {
    // Shape settings
    shapes: {
        count: 30,             // More shapes
        minSize: 5,            // Smaller minimum for more variation
        maxSize: 80,           // Much larger maximum size
        sizeDistribution: 'varied', // 'uniform', 'varied', or 'extreme'
        colors: [              // Colors matching your game theme
            '#5b8dd9',         // primary
            '#56b886',         // secondary
            '#e67e73',         // danger
            '#f0c866',         // warning
            '#9c77db',         // purple
            '#5bbcd9'          // cyan
        ],
        followSpeed: 0.002,    // Drastically reduced follow speed
        interactionDistance: 10, // Slightly increased interaction distance
        interactionStrength: 0.1, // Reduced from default 2.0
        enabledPages: [        // Only enable shapes on these pages
            'landing',         // Landing page
            'character-select' // Character selection
            // 'game'          // Commented out to disable on game screen
        ]
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
    
    // Apply size distribution based on config
    let size;
    if (visualConfig.shapes.sizeDistribution === 'uniform') {
        // Uniform distribution
        size = Math.random() * (visualConfig.shapes.maxSize - visualConfig.shapes.minSize) + visualConfig.shapes.minSize;
    } else if (visualConfig.shapes.sizeDistribution === 'extreme') {
        // More small and large shapes, fewer medium shapes
        const r = Math.random();
        if (r < 0.6) { // 60% small shapes
            size = visualConfig.shapes.minSize + Math.random() * (visualConfig.shapes.maxSize - visualConfig.shapes.minSize) * 0.3;
        } else { // 40% large shapes
            size = visualConfig.shapes.minSize + (visualConfig.shapes.maxSize - visualConfig.shapes.minSize) * (0.7 + Math.random() * 0.3);
        }
    } else { // 'varied' - default
        // More varied distribution with bias toward smaller shapes
        const r = Math.pow(Math.random(), 1.5); // Power function creates more small shapes
        size = visualConfig.shapes.minSize + r * (visualConfig.shapes.maxSize - visualConfig.shapes.minSize);
    }
    
    const color = visualConfig.shapes.colors[Math.floor(Math.random() * visualConfig.shapes.colors.length)];
    
    // Random position within viewport
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    // Adjust opacity based on size for a depth effect
    const sizeRatio = (size - visualConfig.shapes.minSize) / (visualConfig.shapes.maxSize - visualConfig.shapes.minSize);
    const baseOpacity = 0.2 + (sizeRatio * 0.3); // Larger shapes are more opaque
    
    // Vary shape types
    const shapeType = Math.random();
    let borderRadius, rotation;
    
    if (shapeType < 0.6) { // 60% circles
        borderRadius = '50%';
        rotation = '0deg'; // Rotation doesn't matter for perfect circles
    } else if (shapeType < 0.9) { // 30% rounded squares
        borderRadius = Math.random() * 5 + 2 + 'px';
        rotation = Math.random() * 360 + 'deg';
    } else { // 10% diamond shapes
        borderRadius = '2px';
        rotation = '45deg';
    }
    
    // Shape styling
    shape.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: ${borderRadius};
        opacity: ${baseOpacity};
        transform: translate(${x}px, ${y}px) rotate(${rotation});
        box-shadow: 0 0 ${size/3}px rgba(255,255,255,0.2);
        pointer-events: none;
        transition: opacity 0.8s ease;
        will-change: transform, opacity;
    `;
    
    container.appendChild(shape);
    
    // Slower movement for larger shapes to create depth effect
    const speedFactor = 1 - (sizeRatio * 0.8); // Larger shapes move slower
    
    // Store shape data for animation
    shapes.push({
        element: shape,
        x: x,
        y: y,
        size: size,
        angle: Math.random() * 360,
        speedX: (Math.random() * 0.4 - 0.2) * speedFactor,
        speedY: (Math.random() * 0.4 - 0.2) * speedFactor,
        rotationSpeed: (Math.random() * 0.4 - 0.2) * speedFactor,
        baseOpacity: baseOpacity
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
        if (Math.random() < 0.005) {
            // Smaller direction changes for more stable movement
            shape.speedX += (Math.random() - 0.5) * 0.05;
            shape.speedY += (Math.random() - 0.5) * 0.05;
            
            // Limit max speed (lower for smoother movement)
            const maxSpeed = 0.3;
            const currentSpeed = Math.sqrt(shape.speedX * shape.speedX + shape.speedY * shape.speedY);
            if (currentSpeed > maxSpeed) {
                shape.speedX = (shape.speedX / currentSpeed) * maxSpeed;
                shape.speedY = (shape.speedY / currentSpeed) * maxSpeed;
            }
        }
        
        // Mouse interaction - only when mouse is close
        if (distance < visualConfig.shapes.interactionDistance) {
            // Move away from mouse with a MUCH more gentle force
            const angle = Math.atan2(dy, dx);
            
            // Use interaction strength from config - this is key to fixing the flying shapes
            const repelForce = (1 - distance / visualConfig.shapes.interactionDistance) * visualConfig.shapes.interactionStrength;
            
            // Apply gentler repulsion
            shape.x -= Math.cos(angle) * repelForce;
            shape.y -= Math.sin(angle) * repelForce;
            
            // Increase opacity when interacting
            const targetOpacity = Math.min(0.8, shape.baseOpacity * 1.5);
            const currentOpacity = parseFloat(shape.element.style.opacity);
            shape.element.style.opacity = currentOpacity + (targetOpacity - currentOpacity) * 0.1;
        } else {
            // Gradually return to normal opacity
            const currentOpacity = parseFloat(shape.element.style.opacity);
            shape.element.style.opacity = currentOpacity + (shape.baseOpacity - currentOpacity) * 0.05;
        }
        
        // Very gentle attraction to center of screen for very distant shapes
        // This prevents shapes from drifting too far away
        if (distance > window.innerWidth / 2) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const dxCenter = centerX - shape.x;
            const dyCenter = centerY - shape.y;
            
            shape.x += dxCenter * 0.00005;
            shape.y += dyCenter * 0.00005;
        }
        
        // Boundary check - wrap around screen with a buffer
        const buffer = shape.size * 2;
        if (shape.x < -buffer) shape.x = window.innerWidth + buffer;
        if (shape.x > window.innerWidth + buffer) shape.x = -buffer;
        if (shape.y < -buffer) shape.y = window.innerHeight + buffer;
        if (shape.y > window.innerHeight + buffer) shape.y = -buffer;
        
        // Update rotation more gently
        shape.angle += shape.rotationSpeed;
        
        // Apply position and rotation with hardware acceleration hint
        shape.element.style.transform = `translate3d(${shape.x}px, ${shape.y}px, 0) rotate(${shape.angle}deg)`;
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