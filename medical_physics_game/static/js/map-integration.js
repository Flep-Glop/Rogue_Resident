// Enhanced Map Integration Code

// This code helps resize the map canvas to fit the larger container
const MapEnhancer = {
  // Reference to original MapRenderer initialize function
  originalInitialize: null,

  // Setup function
  setup: function() {
    // Store reference to original initialize function if MapRenderer exists
    if (window.MapRenderer && typeof MapRenderer.initialize === 'function') {
      this.originalInitialize = MapRenderer.initialize;
      
      // Override the initialize function with our enhanced version
      MapRenderer.initialize = this.enhancedInitialize.bind(this);
      
      console.log("MapEnhancer: MapRenderer.initialize has been enhanced");
    } else {
      console.warn("MapEnhancer: MapRenderer not found or initialize is not a function");
    }
    
    // Add window resize listener to update map canvas on resize
    window.addEventListener('resize', this.handleResize.bind(this));
  },
  
  // Enhanced initialize function that calls original then applies size adjustments
  enhancedInitialize: function(canvasId) {
    // Call original initialize function
    const result = this.originalInitialize.call(MapRenderer, canvasId);
    
    // After initialization, adjust the canvas size to fit container
    this.resizeCanvas(canvasId);
    
    return result;
  },
  
  // Function to resize canvas based on container size
  resizeCanvas: function(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const container = canvas.closest('.map-wrapper');
    if (!container) return;
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Update canvas size in CSS (preserves pixelated rendering)
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    
    console.log(`MapEnhancer: Resized canvas to ${containerWidth}x${containerHeight}`);
    
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
    }, 250);
  }
};

// Set up mock game state if needed for development testing
function setupMockGameState() {
  // Only create mock data if GameState exists but has no data
  if (typeof GameState !== 'undefined' && 
      (!GameState.data || !GameState.data.nodes || GameState.data.nodes.length === 0)) {
    
    console.log("Setting up mock game state for testing");
    
    // Mock node types that match your node_types.json
    const NODE_TYPES = {
      START: 'start',
      BOSS: 'boss',
      QUESTION: 'question',
      ELITE: 'elite',
      TREASURE: 'treasure',
      REST: 'rest',
      SHOP: 'shop',
      EVENT: 'event',
      GAMBLE: 'gamble',
      PATIENT_CASE: 'patient_case'
    };
    
    // Define node states for rendering
    window.NODE_STATE = {
      LOCKED: 'locked',
      AVAILABLE: 'available',
      CURRENT: 'current',
      COMPLETED: 'completed'
    };
    
    // Create mock map data (simplified version of what your map generator produces)
    const mockNodes = [
      {
        id: 'start',
        type: NODE_TYPES.START,
        position: { row: 0, col: 1 },
        paths: ['node1', 'node2', 'node3'],
        state: NODE_STATE.COMPLETED,
        visited: true
      },
      {
        id: 'node1',
        type: NODE_TYPES.REST,
        position: { row: 1, col: 0 },
        paths: ['node4', 'node5'],
        state: NODE_STATE.AVAILABLE
      },
      {
        id: 'node2',
        type: NODE_TYPES.QUESTION,
        position: { row: 1, col: 1 },
        paths: ['node5', 'node6'],
        state: NODE_STATE.AVAILABLE
      },
      {
        id: 'node3',
        type: NODE_TYPES.QUESTION,
        position: { row: 1, col: 2 },
        paths: ['node6', 'node7'],
        state: NODE_STATE.AVAILABLE
      },
      {
        id: 'node4',
        type: NODE_TYPES.QUESTION,
        position: { row: 2, col: 0 },
        paths: ['node8'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node5',
        type: NODE_TYPES.TREASURE,
        position: { row: 2, col: 1 },
        paths: ['node8', 'node9'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node6',
        type: NODE_TYPES.TREASURE,
        position: { row: 2, col: 2 },
        paths: ['node9', 'node10'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node7',
        type: NODE_TYPES.SHOP,
        position: { row: 3, col: 0 },
        paths: ['node11'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node8',
        type: NODE_TYPES.QUESTION,
        position: { row: 3, col: 1 },
        paths: ['node11', 'node12'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node9',
        type: NODE_TYPES.QUESTION,
        position: { row: 3, col: 2 },
        paths: ['node12', 'node13'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node10',
        type: NODE_TYPES.QUESTION,
        position: { row: 4, col: 0 },
        paths: ['boss'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node11',
        type: NODE_TYPES.TREASURE,
        position: { row: 4, col: 1 },
        paths: ['boss'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node12',
        type: NODE_TYPES.QUESTION,
        position: { row: 4, col: 2 },
        paths: ['boss'],
        state: NODE_STATE.LOCKED
      },
      {
        id: 'node13',
        type: NODE_TYPES.BOSS,
        position: { row: 5, col: 1 },
        paths: [],
        state: NODE_STATE.LOCKED
      }
    ];
    
    // Set up mock helper functions if needed
    if (!GameState.getAllNodes) {
      GameState.getAllNodes = function() {
        return GameState.data.nodes;
      };
    }
    
    if (!GameState.getNodeById) {
      GameState.getNodeById = function(id) {
        return GameState.data.nodes.find(node => node.id === id);
      };
    }
    
    // Set mock data in GameState
    GameState.data = {
      currentFloor: 1,
      nodes: mockNodes,
      character: {
        name: 'Medical Resident',
        id: 'resident',
        level: 1,
        lives: 3,
        max_lives: 3,
        insight: 70,
        max_insight: 100,
        special_ability: {
          name: 'Literature Review',
          description: 'Skip a question node without penalty',
          uses_per_floor: 1,
          remaining_uses: 1
        }
      }
    };
    
    // Mock NodeRegistry if needed
    if (typeof NodeRegistry === 'undefined' || !NodeRegistry.getNodeType) {
      window.NodeRegistry = {
        getNodeType: function(type) {
          const nodeTypes = {
            start: { color: '#5d9cff', shadowColor: '#4a7cc7', symbol: 'S' },
            boss: { color: '#e67e73', shadowColor: '#c5655c', symbol: 'B' },
            question: { color: '#5b8dd9', shadowColor: '#4a70b0', symbol: '?' },
            elite: { color: '#9c77db', shadowColor: '#7a5cac', symbol: 'E' },
            treasure: { color: '#ffcc55', shadowColor: '#d9aa48', symbol: 'T' },
            rest: { color: '#45e17c', shadowColor: '#36b362', symbol: 'R' },
            shop: { color: '#5d9cff', shadowColor: '#4a7cc7', symbol: '$' },
            event: { color: '#9c77db', shadowColor: '#7a5cac', symbol: '!' },
            gamble: { color: '#ffcc55', shadowColor: '#d9aa48', symbol: 'G' },
            patient_case: { color: '#9c77db', shadowColor: '#7a5cac', symbol: 'P' }
          };
          
          return nodeTypes[type] || { color: '#8b8fa9', shadowColor: '#6e7285', symbol: '?' };
        }
      };
    }
    
    // Trigger character update event if EventSystem exists
    if (typeof EventSystem !== 'undefined' && EventSystem.emit) {
      EventSystem.emit('CHARACTER_UPDATED', GameState.data.character);
    }
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Set up MapEnhancer
  MapEnhancer.setup();
  
  // Setup mock game state for testing if needed
  setupMockGameState();
});
