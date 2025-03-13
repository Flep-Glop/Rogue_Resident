// pixel_background.js - Generate retro pixel background effect for the map

// PixelBackgroundGenerator - Creates a pixelated background effect
const PixelBackgroundGenerator = {
    // Configuration
    config: {
      pixelCount: 120,         // Number of pixels to generate (increased for more coverage)
      pixelSizes: [4, 6, 8],   // Various pixel sizes for visual variety
      baseColors: [            // Color palette for the pixels
        '#5b8dd9',  // Blue
        '#56b886',  // Green
        '#f0c866',  // Yellow
        '#e67e73',  // Red
        '#9c77db',  // Purple
        '#e99c50',  // Orange
        '#4acf8b',  // Bright Green
        '#ffffff'   // White (rare)
      ],
      container: null,         // Reference to the container element
      zIndex: -10,            // z-index for the pixels (CHANGED: to -10 to ensure it's behind everything)
      animationDuration: {     // Animation duration range (in seconds)
        min: 8,
        max: 20
      }
    },
    
    // Initialize the pixel background
    initialize: function(containerId) {
      console.log("Initializing pixel background generator...");
      
      // Find the container element
      this.config.container = document.getElementById(containerId);
      
      if (!this.config.container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return this;
      }
      
      // Make sure container is position relative for absolute positioning
      const containerStyle = window.getComputedStyle(this.config.container);
      if (containerStyle.position === 'static') {
        this.config.container.style.position = 'relative';
      }
      
      // Remove existing pixels (if any)
      this.removeExistingPixels();
      
      // Generate new pixels
      this.generatePixels();
      
      return this;
    },
    
    // Remove existing pixel decorations
    removeExistingPixels: function() {
      const existingPixels = this.config.container.querySelectorAll('.pixel-decoration, .pixel-background-layer');
      existingPixels.forEach(pixel => pixel.remove());
    },
    
    // Generate pixel decorations
    generatePixels: function() {
      const { container, pixelCount, pixelSizes, baseColors, zIndex } = this.config;
      
      // Get container dimensions
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      // Create a background layer div
      const backgroundLayer = document.createElement('div');
      backgroundLayer.className = 'pixel-background-layer';
      backgroundLayer.style.position = 'absolute';
      backgroundLayer.style.top = '0';
      backgroundLayer.style.left = '0';
      backgroundLayer.style.width = '100%';
      backgroundLayer.style.height = '100%';
      backgroundLayer.style.zIndex = zIndex;
      backgroundLayer.style.pointerEvents = 'none';
      
      // Add to beginning of container to ensure it's behind everything
      container.prepend(backgroundLayer);
      
      // Generate random pixels
      for (let i = 0; i < pixelCount; i++) {
        // Create pixel element
        const pixel = document.createElement('div');
        pixel.className = 'pixel-decoration';
        
        // Random position
        const top = Math.random() * containerHeight;
        const left = Math.random() * containerWidth;
        
        // Random size
        const sizeIndex = Math.floor(Math.random() * pixelSizes.length);
        const size = pixelSizes[sizeIndex];
        
        // Random color with opacity (INCREASED opacity range from 0.3-0.8 to 0.5-1.0)
        const colorIndex = Math.floor(Math.random() * baseColors.length);
        const baseColor = baseColors[colorIndex];
        const opacity = Math.random() * 0.5 + 0.5; // Now between 0.5 and 1.0
        
        // Random animation duration
        const duration = Math.random() * 
          (this.config.animationDuration.max - this.config.animationDuration.min) + 
          this.config.animationDuration.min;
        
        // Apply styles
        pixel.style.position = 'absolute'; // Ensure absolute positioning
        pixel.style.top = `${top}px`;
        pixel.style.left = `${left}px`;
        pixel.style.width = `${size}px`;
        pixel.style.height = `${size}px`;
        pixel.style.backgroundColor = baseColor;
        pixel.style.opacity = opacity;
        pixel.style.animation = `pixel-pulse ${duration}s infinite alternate`;
        pixel.style.zIndex = zIndex; // Ensure all pixels have correct z-index
        
        // Add to background layer
        backgroundLayer.appendChild(pixel);
      }
      
      // Add a subtle pulse animation if it doesn't exist
      this.ensurePulseAnimationExists();
    },
    
    // Ensure the pulse animation keyframes are defined
    ensurePulseAnimationExists: function() {
      // Check if the animation already exists
      let animationExists = false;
      const styleSheets = document.styleSheets;
      
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const rules = styleSheets[i].cssRules || styleSheets[i].rules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].name === 'pixel-pulse') {
              animationExists = true;
              break;
            }
          }
          if (animationExists) break;
        } catch (e) {
          // Security error can happen when accessing cross-origin stylesheets
          continue;
        }
      }
      
      // Create the animation if it doesn't exist
      if (!animationExists) {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          @keyframes pixel-pulse {
            0% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
            100% { opacity: 0.5; transform: scale(1); }
          }
        `;
        document.head.appendChild(styleElement);
      }
    },
    
    // Refresh pixels (e.g., when container size changes)
    refresh: function() {
      this.removeExistingPixels();
      this.generatePixels();
    }
  };
  
  // Global access
  window.PixelBackgroundGenerator = PixelBackgroundGenerator;