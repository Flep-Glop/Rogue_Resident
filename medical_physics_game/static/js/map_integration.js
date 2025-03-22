// Enhanced Map Integration Code - Fixed for proper scrolling

const MapEnhancer = {
  // Reference to original MapRenderer initialize function
  originalInitialize: null,

  // Setup function
  setup: function() {
    console.log("MapEnhancer: Setting up enhanced map scrolling");
    
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
  
  // Enhanced initialize function that calls original then applies size adjustments
  enhancedInitialize: function(canvasId) {
    // Call original initialize function
    const result = this.originalInitialize.call(MapRenderer, canvasId);
    
    // After initialization, adjust the canvas size for scrolling
    this.resizeCanvas(canvasId);
    
    return result;
  },
  
  // Function to resize canvas based on container size
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
    
    // CRITICAL FIX: Ensure the canvas has its full height for scrolling
    // but only adjust the width to fit the container
    const containerWidth = container.clientWidth;
    
    // Update canvas style width but NOT height (to preserve scrolling)
    canvas.style.width = containerWidth + 'px';
    
    // Don't restrict the height in the style - let it be scrollable
    // This is critical - setting height:100% would prevent scrolling
    canvas.style.height = "auto"; 
    
    console.log(`MapEnhancer: Canvas dimensions set for scrolling, width: ${containerWidth}px, height: auto (scrollable)`);
    
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