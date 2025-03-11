// game.js - Main entry point, initialization

// Define global container types
const CONTAINER_TYPES = {
  QUESTION: 'question-container',
  TREASURE: 'treasure-container',
  REST: 'rest-container',
  EVENT: 'event-container',
  SHOP: 'shop-container',
  GAMBLE: 'gamble-container',
  GAME_OVER: 'game-over-container',
  GAME_BOARD: 'game-board-container',
  NODES: 'nodes-container',
  MAP: 'floor-map'
};

// Global game state
window.gameState = {
  character: null,
  currentFloor: 1,
  currentNode: null,
  map: null,
  inventory: [],
  statusEffects: [],
  currentQuestion: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game initializing...");
  
  // Add character selection CSS
  if (!document.getElementById('character-selection-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'character-selection-style';
    styleElement.textContent = CHARACTER_SELECTION_CSS;
    document.head.appendChild(styleElement);
  }
  
  // Hide all interaction containers
  Nodes.hideAllInteractionContainers();
  
  // Set up event listeners for main buttons
  setupMainEventListeners();
  
  // Check for character selection parameter
  checkShowCharacterSelection();
  
  // Load game state
  ApiClient.loadGameState()
    .then(data => {
      initializeGameDisplay(data);
      Character.initializeInventory(); // Initialize inventory system
    })
    .catch(error => {
      console.error("Failed to load game state:", error);
      // Show character selection if no game state
      Character.showCharacterSelection();
    });
});

// Centralized game initialization
function initializeGame() {
  // Show loading indicator
  const boardContainer = document.getElementById('game-board-container');
  if (boardContainer) {
    boardContainer.innerHTML += '<div id="loading-indicator" class="text-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading game...</p></div>';
  }
  
  // Load game state from the backend
  ApiClient.loadGameState()
    .then(data => {
      gameState = data;
      Character.updateCharacterInfo(data.character);
      document.getElementById('current-floor').textContent = data.current_floor || 1;
      
      // Fetch floor configuration and continue initialization
      return fetch(`/api/floor/${data.current_floor || 1}`);
    })
    .then(response => response.json())
    .then(floorData => {
      // Generate floor map based on floor data
      const mapData = MapRenderer.generateFloorMap(gameState.current_floor, floorData);
      gameState.map = mapData;
      
      // Remove loading indicator
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
      
      // Render the map
      MapRenderer.renderFloorMap(mapData, 'floor-map');
      
      // Handle nodes that might be hidden in map view
      document.getElementById('nodes-container').style.display = 'none';
    })
    .catch(error => {
      console.error('Error initializing game:', error);
      // Show error message to user
      const errorHtml = `
        <div class="alert alert-danger">
          <h4>Error Loading Game</h4>
          <p>There was a problem initializing the game. Please try refreshing the page.</p>
          <button onclick="window.location.reload()" class="btn btn-primary">Refresh</button>
        </div>
      `;
      
      document.getElementById('game-board-container').innerHTML = errorHtml;
    });
}

// Setup main button event listeners
function setupMainEventListeners() {
  // Next floor button
  const nextFloorBtn = document.getElementById('next-floor-btn');
  if (nextFloorBtn) {
    nextFloorBtn.addEventListener('click', Nodes.goToNextFloor);
  }
  
  // Restart button in game over screen
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      window.location.href = '/';
    });
  }
}

// Initialize the game display
function initializeGameDisplay(gameData) {
  // Update character info
  Character.updateCharacterInfo(gameData.character);
  
  // Update floor display
  const floorDisplay = document.getElementById('current-floor');
  if (floorDisplay) {
    floorDisplay.textContent = gameData.current_floor;
  }
  
  // Initialize the floor map
  MapRenderer.initializeFloorMap();
  
  // Hide loading screens if any
  const loadingElements = document.querySelectorAll('.loading-screen');
  loadingElements.forEach(element => {
    element.style.display = 'none';
  });
}

// Check if the character selection should be shown on load
function checkShowCharacterSelection() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('select') === 'true') {
    // Remove the parameter from URL to avoid showing selection again on refresh
    window.history.replaceState({}, document.title, '/game');
    // Show character selection
    setTimeout(() => {
      Character.showCharacterSelection();
    }, 500); // Short delay to ensure everything is loaded
  }
}

// CSS for character selection screen - should be moved to CSS file in production
const CHARACTER_SELECTION_CSS = `
  .character-selection-screen {
    background-color: rgba(0, 0, 0, 0.85);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    padding: 20px;
    overflow-y: auto;
  }
  
  /* Rest of the CSS for character selection... */
`;