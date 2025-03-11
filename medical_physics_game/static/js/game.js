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

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game initializing...");
  
  // Show welcome message with slight delay
  setTimeout(function() {
    UiUtils.showFloatingText("Welcome to Medical Physics Residency!", "success");
  }, 1000);
  
  // Hide all interaction containers
  Nodes.hideAllInteractionContainers();
  
  // Set up event listeners for main buttons
  setupMainEventListeners();
  
  // Check for character selection parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('select') === 'true') {
    // Remove the parameter from URL
    window.history.replaceState({}, document.title, '/game');
    
    // Show character selection
    setTimeout(() => {
      if (typeof Character.showCharacterSelection === 'function') {
        Character.showCharacterSelection();
      } else {
        console.error("Character selection function not implemented");
        initializeGame();
      }
    }, 500);
  } else {
    // Initialize the game directly
    initializeGame();
  }
});

// Setup main event listeners for game UI elements
function setupMainEventListeners() {
  console.log("Setting up event listeners...");
  
  // Next floor button
  const nextFloorBtn = document.getElementById('next-floor-btn');
  if (nextFloorBtn) {
    nextFloorBtn.addEventListener('click', function() {
      if (typeof Nodes !== 'undefined' && typeof Nodes.goToNextFloor === 'function') {
        Nodes.goToNextFloor();
      }
    });
  }
  
  // Restart button in game over screen
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      ApiClient.resetGame()
        .then(() => {
          // Refresh the page to restart
          window.location.reload();
        })
        .catch(error => {
          console.error('Error resetting game:', error);
        });
    });
  }
}

// Centralized game initialization
function initializeGame() {
  // Show loading indicator
  showLoadingIndicator();
  
  // Load game state from the backend
  ApiClient.loadGameState()
    .then(data => {
      console.log("Game state loaded:", data);
      
      // Update global game state
      gameState.character = data.character;
      gameState.currentFloor = data.current_floor || 1;
      gameState.inventory = data.inventory || [];
      
      // Update character info in UI
      if (typeof Character !== 'undefined' && typeof Character.updateCharacterInfo === 'function') {
        Character.updateCharacterInfo(data.character);
      }
      
      // Update floor number display
      const floorElement = document.getElementById('current-floor');
      if (floorElement) {
        floorElement.textContent = data.current_floor || 1;
      }
      
      // Initialize inventory system
      if (typeof Character !== 'undefined' && typeof Character.initializeInventory === 'function') {
        Character.initializeInventory();
      }
      
      // Request map generation from server
      return fetch('/api/generate-floor-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          floor_number: data.current_floor || 1
        }),
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(mapData => {
      console.log("Map data received:", mapData);
      
      // Store map in game state
      gameState.map = mapData;
      
      // Remove loading indicator
      removeLoadingIndicator();
      
      // Render the map
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.renderFloorMap === 'function') {
        MapRenderer.renderFloorMap(mapData, 'floor-map');
      } else {
        console.error("Map renderer not available");
      }
      
      // Check if next floor button should be shown
      checkNextFloorButton(mapData);
    })
    .catch(error => {
      console.error('Error initializing game:', error);
      
      // Remove loading indicator
      removeLoadingIndicator();
      
      // Show error message
      showErrorMessage(error.message);
    });
}

// Show loading indicator
function showLoadingIndicator() {
  const boardContainer = document.getElementById('game-board-container');
  if (boardContainer) {
    boardContainer.innerHTML += `
      <div id="loading-indicator" class="text-center my-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Loading Medical Physics Residency...</p>
      </div>
    `;
  }
}

// Remove loading indicator
function removeLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// Show error message
function showErrorMessage(message) {
  const errorHtml = `
    <div class="alert alert-danger">
      <h4>Error Loading Game</h4>
      <p>There was a problem initializing the game: ${message}</p>
      <button onclick="window.location.reload()" class="btn btn-primary">Try Again</button>
    </div>
  `;
  
  const gameBoardContainer = document.getElementById('game-board-container');
  if (gameBoardContainer) {
    gameBoardContainer.innerHTML = errorHtml;
  }
}

// Check if next floor button should be shown
function checkNextFloorButton(mapData) {
  if (!mapData) return;
  
  // Check if all nodes are visited
  let allVisited = true;
  
  // Check regular nodes
  if (mapData.nodes) {
    Object.values(mapData.nodes).forEach(node => {
      if (!node.visited) {
        allVisited = false;
      }
    });
  }
  
  // Check boss node
  if (mapData.boss && !mapData.boss.visited) {
    allVisited = false;
  }
  
  // Show next floor button if all nodes are visited
  if (allVisited) {
    const nextFloorBtn = document.getElementById('next-floor-btn');
    if (nextFloorBtn) {
      nextFloorBtn.style.display = 'block';
    }
  }
}

// Add debug button for troubleshooting (can be removed in production)
document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    const debugButton = document.createElement('button');
    debugButton.className = 'btn btn-secondary mt-2 mb-2';
    debugButton.textContent = 'Debug Map';
    debugButton.style.fontSize = '0.7rem';
    debugButton.style.padding = '2px 8px';
    debugButton.style.opacity = '0.7';
    
    debugButton.addEventListener('click', function() {
      console.clear();
      console.log("=== DEBUG MAP STATE ===");
      
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.debugNodeStatus === 'function') {
        MapRenderer.debugNodeStatus();
      } else {
        console.log("MapRenderer debug functions not available");
      }
      
      console.log("Game State:", JSON.parse(JSON.stringify(gameState)));
    });
    
    // Insert at the beginning of the map container
    mapContainer.insertBefore(debugButton, mapContainer.firstChild);
  }
});