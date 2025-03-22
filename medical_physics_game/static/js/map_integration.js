// Enhanced Map Integration Code - With Zoom Functionality

const MapEnhancer = {
  // Reference to original MapRenderer initialize function
  originalInitialize: null,
  
  // Zoom settings
  zoom: {
    level: 1.5, // Start at 150% zoom
    min: 1.0,
    max: 3.0,
    step: 0.25
  },

  // Setup function
  setup: function() {
    console.log("MapEnhancer: Setting up enhanced map with zoom");
    
    // Store reference to original initialize function if MapRenderer exists
    if (window.MapRenderer && typeof MapRenderer.initialize === 'function') {
      this.originalInitialize = MapRenderer.initialize;
      
      // Override the initialize function with our enhanced version
      MapRenderer.initialize = this.enhancedInitialize.bind(this);
      
      console.log("MapEnhancer: Successfully enhanced MapRenderer.initialize");
    } else {
      console.warn("MapEnhancer: MapRenderer not found or initialize is not a function");
    }
    
    // Add window resize listener to update map canvas on resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Force the map wrapper to be scrollable (critical fix)
    setTimeout(() => {
      this.forceScrollableWrapper();
      this.addZoomControls();
    }, 500);
  },
  
  // Force the map wrapper to be scrollable
  forceScrollableWrapper: function() {
    const mapWrapper = document.querySelector('.map-wrapper');
    if (mapWrapper) {
      console.log("MapEnhancer: Forcing map wrapper to be scrollable");
      mapWrapper.style.overflowY = 'auto';
      mapWrapper.style.maxHeight = '600px';
      
      // Also ensure the container isn't restricting it
      const mapContainer = document.querySelector('.map-container');
      if (mapContainer) {
        mapContainer.style.overflow = 'visible';
      }
    } else {
      console.warn("MapEnhancer: Could not find map wrapper to make scrollable");
    }
  },
  
  // Add zoom controls to the map
  addZoomControls: function() {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;
    
    // Create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'map-zoom-controls';
    zoomControls.innerHTML = `
      <button class="zoom-btn zoom-in" title="Zoom In">+</button>
      <button class="zoom-btn zoom-out" title="Zoom Out">-</button>
      <span class="zoom-level">${Math.round(this.zoom.level * 100)}%</span>
    `;
    
    // Insert zoom controls before the map wrapper
    const mapWrapper = document.querySelector('.map-wrapper');
    if (mapWrapper) {
      mapContainer.insertBefore(zoomControls, mapWrapper);
    } else {
      mapContainer.appendChild(zoomControls);
    }
    
    // Add event listeners
    const zoomInBtn = zoomControls.querySelector('.zoom-in');
    const zoomOutBtn = zoomControls.querySelector('.zoom-out');
    
    zoomInBtn.addEventListener('click', () => {
      this.changeZoom(this.zoom.step);
    });
    
    zoomOutBtn.addEventListener('click', () => {
      this.changeZoom(-this.zoom.step);
    });
    
    // Add mousewheel zoom support
    mapWrapper.addEventListener('wheel', (e) => {
      if (e.ctrlKey) { // Only zoom when Ctrl is pressed
        e.preventDefault();
        const delta = e.deltaY < 0 ? this.zoom.step : -this.zoom.step;
        this.changeZoom(delta);
      }
    });
  },
  
  // Change zoom level
  changeZoom: function(delta) {
    // Update zoom level with constraints
    this.zoom.level = Math.max(this.zoom.min, Math.min(this.zoom.max, this.zoom.level + delta));
    
    // Update the zoom level display
    const zoomLevelDisplay = document.querySelector('.zoom-level');
    if (zoomLevelDisplay) {
      zoomLevelDisplay.textContent = `${Math.round(this.zoom.level * 100)}%`;
    }
    
    // Apply zoom to the canvas
    this.resizeCanvas('floor-map');
  },
  
  // Enhanced initialize function that calls original then applies size adjustments
  enhancedInitialize: function(canvasId) {
    // Call original initialize function
    const result = this.originalInitialize.call(MapRenderer, canvasId);
    
    // After initialization, adjust the canvas size for scrolling and zooming
    this.resizeCanvas(canvasId);
    
    return result;
  },
  
  // Function to resize canvas based on container size and zoom level
  resizeCanvas: function(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn("MapEnhancer: Canvas not found:", canvasId);
      return;
    }
    
    const container = canvas.closest('.map-wrapper');
    if (!container) {
      console.warn("MapEnhancer: Map wrapper container not found");
      return;
    }
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    
    // Apply zoom to canvas dimensions
    const zoomedWidth = containerWidth * this.zoom.level;
    
    // Update canvas style with zoomed dimensions
    canvas.style.width = zoomedWidth + 'px';
    canvas.style.height = "auto"; // Height remains auto for scrolling
    
    console.log(`MapEnhancer: Canvas zoomed to ${Math.round(this.zoom.level * 100)}%, width: ${zoomedWidth}px`);
    
    // If MapRenderer has renderMap function, call it to update the display
    if (typeof MapRenderer.renderMap === 'function') {
      MapRenderer.renderMap();
    }
  },
  
  // Handle window resize
  handleResize: function() {
    // Debounce the resize operation to prevent too many calls
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      this.resizeCanvas('floor-map');
      this.forceScrollableWrapper(); // Re-apply scrollable settings on resize
    }, 250);
  }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Set up MapEnhancer
  MapEnhancer.setup();
  
  // Additional safety timeout to ensure map is scrollable after everything loads
  setTimeout(() => {
    MapEnhancer.forceScrollableWrapper();
  }, 1000);
});