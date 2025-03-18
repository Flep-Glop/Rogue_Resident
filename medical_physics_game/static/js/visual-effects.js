// Create CRT and scanline effects
function createCRTEffects() {
    // Create CRT overlay
    const crtOverlay = document.createElement('div');
    crtOverlay.className = 'crt-overlay';
    
    // Create scanlines
    const scanlines = document.createElement('div');
    scanlines.className = 'scanlines';
    
    // Style the CRT overlay
    Object.assign(crtOverlay.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 3,
      background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.3) 90%)',
      opacity: config.crtEffectStrength,
      mixBlendMode: 'multiply'
    });
    
    // Style the scanlines
    Object.assign(scanlines.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 4,
      background: `linear-gradient(
        to bottom,
        transparent ${100 - config.scanlineSpacing}%,
        rgba(0, 0, 0, ${config.scanlineOpacity}) ${100 - config.scanlineSpacing}%,
        rgba(0, 0, 0, ${config.scanlineOpacity}) 100%
      )`,
      backgroundSize: `100% ${config.scanlineSpacing}px`,
      opacity: config.scanlineOpacity * 2
    });
    
    // Add flicker animation to CRT
    crtOverlay.innerHTML = `
      <style>
        @keyframes crtFlicker {
          0% { opacity: ${config.crtEffectStrength}; }
          3% { opacity: ${config.crtEffectStrength * 0.8}; }
          6% { opacity: ${config.crtEffectStrength}; }
          92% { opacity: ${config.crtEffectStrength}; }
          94% { opacity: ${config.crtEffectStrength * 0.8}; }
          96% { opacity: ${config.crtEffectStrength}; }
        }
        .crt-overlay {
          animation: crtFlicker 10s infinite;
        }
        
        @keyframes scanlineScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 ${config.scanlineSpacing * 2}px; }
        }
        .scanlines {
          animation: scanlineScroll 1s linear infinite;
        }
      </style>
    `;
    
    // Add to container
    container.appendChild(crtOverlay);
    container.appendChild(scanlines);
  }/**
 * visual-effects.js - Dynamic background effects for Rogue Resident
 * This script creates an interactive, multi-layered background with various geometric shapes
 * that respond to mouse movements and create a visually engaging experience.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if pixel-container exists, which is the main container in the landing page
  const container = document.querySelector('.pixel-container');
  if (!container) {
    console.warn('Pixel container not found, background effects disabled');
    return;
  }
  
  // Create and initialize canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'background-canvas';
  
  // Apply styles to position canvas behind all content but above the grid background
  Object.assign(canvas.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none', // Allow clicks to pass through
    imageRendering: 'pixelated' // Keep the retro pixel aesthetic
  });
  
  // Insert canvas into the pixel-container before other elements
  container.insertBefore(canvas, container.firstChild);
  
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions to window size
  function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set canvas background to match the dark blue from the screenshot
    canvas.style.backgroundColor = '#0f1631';
  }
  setCanvasSize();
  
  // Track mouse position
  let mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    moving: false,
    lastMove: Date.now()
  };
  
  // Configuration variables for the visual effects
  const config = {
    // UI area to protect (center of screen where game content is)
    uiBox: {
      get x() { return canvas.width * 0.3; },
      get y() { return canvas.height * 0.2; },
      get width() { return canvas.width * 0.4; },
      get height() { return canvas.height * 0.6; }
    },
    colors: {
      primary: '#8be8e5',    // Bright cyan (matches the image)
      secondary: '#5b8dd9',  // Blue
      accent1: '#f0c866',    // Yellow
      accent2: '#d35db3',    // Pink/purple
      accent3: '#9c77db',    // Purple
      dark: '#0f1631'        // Dark blue background (matches your screenshot)
    },
    // Increased number and size of shapes
    maxDynamicShapes: window.innerWidth < 768 ? 10 : 20,
    maxStaticShapes: window.innerWidth < 768 ? 15 : 25,
    maxDistantShapes: window.innerWidth < 768 ? 5 : 10,
    // Mouse influence distance and force
    mouseInfluenceRadius: 150,
    mouseForce: 0.8,
    // Larger shapes, especially for distant background ones
    minShapeSize: 6,
    maxShapeSize: 40,
    distantShapeMinSize: 150,
    distantShapeMaxSize: 400,
    // CRT effect settings
    crtEffectStrength: 0.4,
    scanlineSpacing: 3,      // Space between scan lines
    scanlineOpacity: 0.2     // How visible scan lines are
  };
  });
  
  /**
   * Shape Classes
   */
  
  // Base Shape class with common properties and methods
  class Shape {
    constructor(options = {}) {
      this.x = options.x || Math.random() * canvas.width;
      this.y = options.y || Math.random() * canvas.height;
      this.size = options.size || (Math.random() * (config.maxShapeSize - config.minShapeSize) + config.minShapeSize);
      
      // Ensure size is even for better pixel alignment in retro aesthetic
      this.size = Math.round(this.size / 2) * 2;
      
      // Create a color with random opacity
      const colorKeys = Object.keys(config.colors);
      const baseColor = options.color || config.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
      const alpha = options.alpha || (Math.random() * 0.5 + 0.1);
      this.color = this.hexToRgba(baseColor, alpha);
      
      // Movement and animation properties
      this.vx = options.vx || (Math.random() - 0.5) * 0.4;
      this.vy = options.vy || (Math.random() - 0.5) * 0.4;
      this.rotation = options.rotation || 0;
      this.rotationSpeed = options.rotationSpeed || (Math.random() - 0.5) * 0.02;
      
      // Whether this shape is hollow
      this.hollow = options.hollow || Math.random() > 0.6;
      
      // Pulsing animation
      this.baseSize = this.size;
      this.pulseAmplitude = options.pulseAmplitude || (Math.random() * 0.2);
      this.pulseSpeed = options.pulseSpeed || (0.5 + Math.random() * 2);
      this.pulseOffset = Math.random() * Math.PI * 2; // Random starting phase
      
      // Set a shape ID for tracking
      this.id = Math.random().toString(36).substring(2, 9);
    }
    
    // Convert hex color to rgba
    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      // Increase base alpha to ensure visibility against the dark background
      alpha = alpha * 1.5;
      // Cap at 1.0
      alpha = Math.min(alpha, 1.0);
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Apply pulsing effect to size
    pulse(time) {
      const scaleFactor = 1 + Math.sin(time * this.pulseSpeed + this.pulseOffset) * this.pulseAmplitude;
      this.size = this.baseSize * scaleFactor;
    }
    
    // Check if the shape is inside the protected UI area
    isInUIArea() {
      return (
        this.x > config.uiBox.x && 
        this.x < config.uiBox.x + config.uiBox.width && 
        this.y > config.uiBox.y && 
        this.y < config.uiBox.y + config.uiBox.height
      );
    }
    
    // Apply mouse influence to dynamic shapes
    applyMouseInfluence() {
      if (!mouse.moving) return;
      
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < config.mouseInfluenceRadius) {
        // Calculate force (stronger when closer)
        const force = (config.mouseInfluenceRadius - distance) / config.mouseInfluenceRadius;
        // Apply repulsion force
        this.vx += (dx / distance) * force * config.mouseForce;
        this.vy += (dy / distance) * force * config.mouseForce;
      }
    }
    
    // Move the shape based on its velocity
    move() {
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      
      // Apply friction to gradually slow down
      this.vx *= 0.98;
      this.vy *= 0.98;
      
      // Wrap around screen edges
      if (this.x < -this.size) this.x = canvas.width + this.size;
      if (this.x > canvas.width + this.size) this.x = -this.size;
      if (this.y < -this.size) this.y = canvas.height + this.size;
      if (this.y > canvas.height + this.size) this.y = -this.size;
    }
    
    // Draw method to be implemented by subclasses
    draw(ctx) {
      // Placeholder
    }
  }
  
  // Circle shape
  class Circle extends Shape {
    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      if (this.hollow) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      ctx.restore();
    }
  }
  
  // Square shape
  class Square extends Shape {
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      if (this.hollow) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
      } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      }
      ctx.restore();
    }
  }
  
  // Triangle shape
  class Triangle extends Shape {
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      ctx.beginPath();
      const height = this.size * Math.sqrt(3) / 2;
      
      // Draw an equilateral triangle
      ctx.moveTo(0, -height / 2);
      ctx.lineTo(-this.size / 2, height / 2);
      ctx.lineTo(this.size / 2, height / 2);
      ctx.closePath();
      
      if (this.hollow) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      ctx.restore();
    }
  }
  
  // Diamond shape
  class Diamond extends Shape {
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, 0);
      ctx.lineTo(0, this.size / 2);
      ctx.lineTo(-this.size / 2, 0);
      ctx.closePath();
      
      if (this.hollow) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      ctx.restore();
    }
  }
  
  // Create distant large background shapes
  class DistantShape extends Shape {
    constructor(options = {}) {
      options.size = options.size || 
        (Math.random() * (config.distantShapeMaxSize - config.distantShapeMinSize) + config.distantShapeMinSize);
      options.alpha = options.alpha || (Math.random() * 0.04 + 0.01); // Very low opacity
      options.vx = options.vx || (Math.random() - 0.5) * 0.05; // Slower movement
      options.vy = options.vy || (Math.random() - 0.5) * 0.05;
      options.rotationSpeed = options.rotationSpeed || (Math.random() - 0.5) * 0.001; // Slower rotation
      options.pulseSpeed = options.pulseSpeed || (0.1 + Math.random() * 0.3); // Slower pulse
      
      super(options);
      
      // Always hollow
      this.hollow = true;
      this.lineWidth = Math.random() * 3 + 1;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      ctx.beginPath();
      
      // Distant shapes can be irregular polygons
      const points = Math.floor(Math.random() * 4) + 5; // 5-8 points
      const angleStep = (Math.PI * 2) / points;
      
      for (let i = 0; i < points; i++) {
        const radius = this.size / 2 * (0.8 + Math.sin(i * 2) * 0.2);
        const angle = i * angleStep;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.lineWidth;
      ctx.stroke();
      
      ctx.restore();
    }
  }
  
  // Create shape collections for each layer
  let dynamicShapes = [];
  let staticShapes = [];
  let distantShapes = [];
  
  // Initialize shapes with good distribution
  function initShapes() {
    // Clear existing shapes
    dynamicShapes = [];
    staticShapes = [];
    distantShapes = [];
    
    // Create distant background shapes
    for (let i = 0; i < config.maxDistantShapes; i++) {
      createDistantShape();
    }
    
    // Create static middle-layer shapes
    for (let i = 0; i < config.maxStaticShapes; i++) {
      createStaticShape();
    }
    
    // Create dynamic foreground shapes
    for (let i = 0; i < config.maxDynamicShapes; i++) {
      createDynamicShape();
    }
  }
  
  // Create shapes with distribution across quadrants
  function createDynamicShape() {
    // Determine which quadrant to place the shape in to ensure better distribution
    const quadrant = dynamicShapes.length % 4;
    let x, y;
    
    // Get quadrant boundaries
    switch(quadrant) {
      case 0: // Top-left
        x = Math.random() * (canvas.width / 2);
        y = Math.random() * (canvas.height / 2);
        break;
      case 1: // Top-right
        x = (canvas.width / 2) + Math.random() * (canvas.width / 2);
        y = Math.random() * (canvas.height / 2);
        break;
      case 2: // Bottom-left
        x = Math.random() * (canvas.width / 2);
        y = (canvas.height / 2) + Math.random() * (canvas.height / 2);
        break;
      case 3: // Bottom-right
        x = (canvas.width / 2) + Math.random() * (canvas.width / 2);
        y = (canvas.height / 2) + Math.random() * (canvas.height / 2);
        break;
    }
    
    // Avoid UI area
    if (
      x > config.uiBox.x && 
      x < config.uiBox.x + config.uiBox.width && 
      y > config.uiBox.y && 
      y < config.uiBox.y + config.uiBox.height
    ) {
      // Place it outside the UI area
      if (Math.random() > 0.5) {
        x = Math.random() > 0.5 ? config.uiBox.x - 10 : config.uiBox.x + config.uiBox.width + 10;
      } else {
        y = Math.random() > 0.5 ? config.uiBox.y - 10 : config.uiBox.y + config.uiBox.height + 10;
      }
    }
    
    // Create random shape
    const shapeType = Math.floor(Math.random() * 4);
    let shape;
    
    switch(shapeType) {
      case 0:
        shape = new Circle({ x, y });
        break;
      case 1:
        shape = new Square({ x, y });
        break;
      case 2:
        shape = new Triangle({ x, y });
        break;
      case 3:
        shape = new Diamond({ x, y });
        break;
    }
    
    dynamicShapes.push(shape);
  }
  
  // Create static middle-layer shapes
  function createStaticShape() {
    // Use similar distribution as dynamic shapes but different settings
    const quadrant = staticShapes.length % 4;
    let x, y;
    
    switch(quadrant) {
      case 0: // Top-left
        x = Math.random() * (canvas.width / 2);
        y = Math.random() * (canvas.height / 2);
        break;
      case 1: // Top-right
        x = (canvas.width / 2) + Math.random() * (canvas.width / 2);
        y = Math.random() * (canvas.height / 2);
        break;
      case 2: // Bottom-left
        x = Math.random() * (canvas.width / 2);
        y = (canvas.height / 2) + Math.random() * (canvas.height / 2);
        break;
      case 3: // Bottom-right
        x = (canvas.width / 2) + Math.random() * (canvas.width / 2);
        y = (canvas.height / 2) + Math.random() * (canvas.height / 2);
        break;
    }
    
    // Avoid UI area
    if (
      x > config.uiBox.x && 
      x < config.uiBox.x + config.uiBox.width && 
      y > config.uiBox.y && 
      y < config.uiBox.y + config.uiBox.height
    ) {
      // Place it outside the UI area
      if (Math.random() > 0.5) {
        x = Math.random() > 0.5 ? config.uiBox.x - 10 : config.uiBox.x + config.uiBox.width + 10;
      } else {
        y = Math.random() > 0.5 ? config.uiBox.y - 10 : config.uiBox.y + config.uiBox.height + 10;
      }
    }
    
    // Create with reduced movement and interactivity
    const shapeType = Math.floor(Math.random() * 4);
    let shape;
    
    const options = {
      x,
      y,
      // Slower movement
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      // Lower opacity
      alpha: Math.random() * 0.3 + 0.05,
      // Slower rotation
      rotationSpeed: (Math.random() - 0.5) * 0.01
    };
    
    switch(shapeType) {
      case 0:
        shape = new Circle(options);
        break;
      case 1:
        shape = new Square(options);
        break;
      case 2:
        shape = new Triangle(options);
        break;
      case 3:
        shape = new Diamond(options);
        break;
    }
    
    staticShapes.push(shape);
  }
  
  // Create distant background shapes
  function createDistantShape() {
    // Distribute evenly
    const index = distantShapes.length;
    const totalShapes = config.maxDistantShapes;
    const xSegment = canvas.width / totalShapes;
    const x = xSegment * index + xSegment / 2 + (Math.random() - 0.5) * xSegment;
    const y = Math.random() * canvas.height;
    
    // Create with very slow movement and higher opacity
    const shape = new DistantShape({ 
      x, 
      y,
      // Occasionally create extra-large shapes for dramatic effect
      size: Math.random() > 0.7 ? 
        config.distantShapeMaxSize * 1.5 : // Super large
        Math.random() * (config.distantShapeMaxSize - config.distantShapeMinSize) + config.distantShapeMinSize
    });
    distantShapes.push(shape);
  }
  
  // Track mouse movement
  function trackMouse(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.moving = true;
    mouse.lastMove = Date.now();
    
    // Reset mouse moving flag after a delay
    setTimeout(() => {
      if (Date.now() - mouse.lastMove > 100) {
        mouse.moving = false;
      }
    }, 150);
  }
  
  // Main animation loop
  function animate() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get time for animations
    const time = Date.now() / 1000;
    
    // Draw grid pattern to maintain the existing look
    drawGridPattern();
    
    // Update and draw distant background shapes
    distantShapes.forEach(shape => {
      shape.move();
      shape.pulse(time);
      shape.draw(ctx);
    });
    
    // Update and draw static middle-layer shapes
    staticShapes.forEach(shape => {
      shape.move();
      shape.pulse(time);
      shape.draw(ctx);
    });
    
    // Update and draw dynamic foreground shapes
    dynamicShapes.forEach(shape => {
      shape.applyMouseInfluence();
      shape.move();
      shape.pulse(time);
      shape.draw(ctx);
    });
    
    // Add CRT "jitter" effect occasionally
    if (Math.random() < 0.001) { // Very rare jitter
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.drawImage(
        canvas, 
        Math.random() * 4 - 2, Math.random() * 4 - 2, // Slight offset
        canvas.width, canvas.height
      );
      ctx.restore();
    }
    
    // Continue animation loop
    requestAnimationFrame(animate);
  }
  
  // Function to draw the grid pattern as seen in the screenshot
  function drawGridPattern() {
    // Set grid line colors and opacity
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Define grid size (match the existing grid in your screenshot)
    const gridSize = 20;
    
    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
  
  // Event listeners
  window.addEventListener('mousemove', trackMouse);
  window.addEventListener('touchmove', e => {
    trackMouse({
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY
    });
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    setCanvasSize();
    initShapes();
  });
  
  // Initialize and start animation
  initShapes();
  animate();
  
  // Add occasional new shape creation to keep things interesting
  setInterval(() => {
    // Randomly add a new shape or replace an old one
    if (dynamicShapes.length < config.maxDynamicShapes) {
      createDynamicShape();
    } else if (Math.random() > 0.7) {
      // Replace a random shape
      const index = Math.floor(Math.random() * dynamicShapes.length);
      dynamicShapes.splice(index, 1);
      createDynamicShape();
    }
  }, 3000);
  
  // Add debug message to console to confirm script is running
  console.log('Rogue Resident background effects initialized');
  
  // Add a special floating pixel effect when a button is hovered
  const buttons = document.querySelectorAll('.retro-btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      // Create 5 particles when hovering over buttons
      for (let i = 0; i < 5; i++) {
        const x = button.getBoundingClientRect().left + Math.random() * button.offsetWidth;
        const y = button.getBoundingClientRect().top + Math.random() * button.offsetHeight;
        
        // Use button's background color for particles
        const computedStyle = window.getComputedStyle(button);
        const color = computedStyle.backgroundColor;
        
        // Create a small shape at button position
        const size = Math.random() * 6 + 4;
        const options = {
          x, 
          y,
          size,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1, // Float upward
          alpha: 0.7,
          color: button.style.backgroundColor || '#5b8dd9'
        };
        
        // Add shape based on random type
        const shapeType = Math.floor(Math.random() * 4);
        let shape;
        
        switch(shapeType) {
          case 0: shape = new Circle(options); break;
          case 1: shape = new Square(options); break;
          case 2: shape = new Triangle(options); break;
          case 3: shape = new Diamond(options); break;
        }
        
        // Add to dynamic shapes array
        dynamicShapes.push(shape);
        
        // Remove after animation
        setTimeout(() => {
          const index = dynamicShapes.indexOf(shape);
          if (index > -1) {
            dynamicShapes.splice(index, 1);
          }
        }, 2000);
      }
    });
  });
  
  // For debugging and development
  window.bgEffects = {
    config,
    shapes: {
      dynamic: dynamicShapes,
      static: staticShapes,
      distant: distantShapes
    },
    // Export functions for external control
    reinitialize: initShapes
  };
