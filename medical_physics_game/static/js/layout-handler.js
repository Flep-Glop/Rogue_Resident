// layout-handler.js - Handles the modern immersive layout for Medical Physics Residency

/**
 * ModernLayout - Manages the new immersive layout with full-screen map and overlay panels
 */
const ModernLayout = {
  // Configuration
  config: {
    sidebarWidth: 280,
    mobileBreakpoint: 768,
    tabletBreakpoint: 992
  },
  
  /**
   * Initialize the modern layout
   */
  initialize: function() {
    console.log("Initializing modern layout...");
    
    // Create sidebar container for character and inventory panels
    this.createSidebar();
    
    // Set up resize handling
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initial resize check
    this.handleResize();
    
    // Set up event listener for map updates
    if (typeof EventSystem !== 'undefined') {
      EventSystem.on(GAME_EVENTS.MAP_UPDATED, this.onMapUpdated.bind(this));
    }
    
    // Add the modern layout class to body
    document.body.classList.add('modern-layout');
    
    return true;
  },
  
  /**
   * Create sidebar container for character and inventory panels
   */
  createSidebar: function() {
    // Check if sidebar already exists
    if (document.querySelector('.game-sidebar')) {
      return;
    }
    
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.className = 'game-sidebar';
    
    // Get the game board container
    const gameBoard = document.getElementById('game-board-container');
    if (!gameBoard) {
      console.error("Game board container not found");
      return;
    }
    
    // Move character stats and inventory to sidebar
    const characterStats = document.querySelector('.character-stats');
    const inventoryContainer = document.querySelector('.inventory-container');
    
    if (characterStats) {
      sidebar.appendChild(characterStats);
    }
    
    if (inventoryContainer) {
      sidebar.appendChild(inventoryContainer);
    }
    
    // Add sidebar to game board
    gameBoard.appendChild(sidebar);
    
    console.log("Sidebar created successfully");
  },
  
  /**
   * Handle window resize events
   */
  handleResize: function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adjust map container to fill screen
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100vh';
      mapContainer.style.maxHeight = 'none';
    }
    
    // Adjust sidebar based on screen size
    const sidebar = document.querySelector('.game-sidebar');
    if (sidebar) {
      if (width <= this.config.mobileBreakpoint) {
        sidebar.classList.add('mobile-view');
        sidebar.classList.remove('tablet-view');
      } else if (width <= this.config.tabletBreakpoint) {
        sidebar.classList.add('tablet-view');
        sidebar.classList.remove('mobile-view');
      } else {
        sidebar.classList.remove('mobile-view', 'tablet-view');
      }
    }
    
    // Force map re-render to adjust to new dimensions
    if (typeof MapRenderer !== 'undefined' && MapRenderer.renderMap) {
      // Small delay to ensure DOM updates complete
      setTimeout(() => {
        MapRenderer.renderMap();
      }, 100);
    }
  },
  
  /**
   * Handle map update events
   */
  onMapUpdated: function() {
    // Ensure map fills available space
    const canvas = document.getElementById('floor-map');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
  },
  
  /**
   * Apply modern styling to interaction containers
   */
  styleInteractionContainers: function() {
    // Style all interaction containers
    const containers = document.querySelectorAll('.interaction-container');
    containers.forEach(container => {
      // Apply backdrop filter for glass effect
      container.style.backdropFilter = 'blur(5px)';
      container.style.backgroundColor = 'rgba(41, 43, 54, 0.95)';
      
      // Add subtle glow effect based on node type
      let glowColor = '#5b8dd9'; // Default primary blue
      
      // Determine container type by ID
      if (container.id) {
        if (container.id.includes('question')) {
          glowColor = 'rgba(91, 141, 217, 0.5)'; // Blue
        } else if (container.id.includes('treasure')) {
          glowColor = 'rgba(240, 200, 102, 0.5)'; // Yellow
        } else if (container.id.includes('shop')) {
          glowColor = 'rgba(91, 188, 217, 0.5)'; // Cyan
        } else if (container.id.includes('rest')) {
          glowColor = 'rgba(156, 119, 219, 0.5)'; // Purple
        } else if (container.id.includes('boss')) {
          glowColor = 'rgba(230, 126, 115, 0.5)'; // Red
        }
      }
      
      container.style.boxShadow = `0 0 20px ${glowColor}`;
    });
  }
};

// Initialize layout when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Add small delay to ensure other systems initialize first
  setTimeout(() => {
    ModernLayout.initialize();
  }, 500);
});