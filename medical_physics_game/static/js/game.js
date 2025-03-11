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

// Update the document ready function to properly initialize the game
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game initializing...");
  
  // Hide all interaction containers
  Nodes.hideAllInteractionContainers();
  
  // Set up event listeners for main buttons
  setupMainEventListeners();
  
  // Check for character selection parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('select') === 'true') {
    // Remove the parameter from URL to avoid showing selection again on refresh
    window.history.replaceState({}, document.title, '/game');
    // Show character selection
    setTimeout(() => {
      if (typeof Character.showCharacterSelection === 'function') {
        Character.showCharacterSelection();
      } else {
        console.error("Character selection function not implemented");
        // Fallback to normal game initialization
        initializeGame();
      }
    }, 500); // Short delay to ensure everything is loaded
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
      Nodes.goToNextFloor();
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
  
  // Rest area buttons
  const restHealBtn = document.getElementById('rest-heal-btn');
  if (restHealBtn) {
    restHealBtn.addEventListener('click', function() {
      if (gameState.character.lives < gameState.character.max_lives) {
        gameState.character.lives += 1;
        Character.updateCharacterInfo(gameState.character);
        UiUtils.showFloatingText('+1 Life', 'success');
        document.getElementById('rest-heal-btn').disabled = true;
      } else {
        UiUtils.showFloatingText('Already at full health!', 'warning');
      }
    });
  }
  
  // Rest study button
  const restStudyBtn = document.getElementById('rest-study-btn');
  if (restStudyBtn) {
    restStudyBtn.addEventListener('click', function() {
      gameState.character.insight += 5;
      Character.updateCharacterInfo(gameState.character);
      UiUtils.showFloatingText('+5 Insight', 'success');
      document.getElementById('rest-study-btn').disabled = true;
    });
  }
  
  // Rest continue button
  const restContinueBtn = document.getElementById('rest-continue-btn');
  if (restContinueBtn) {
    restContinueBtn.addEventListener('click', function() {
      if (gameState.currentNode) {
        Nodes.markNodeVisited(gameState.currentNode);
        Nodes.showContainer(CONTAINER_TYPES.MAP);
      }
    });
  }
  
  // Treasure continue button
  const treasureContinueBtn = document.getElementById('treasure-continue-btn');
  if (treasureContinueBtn) {
    treasureContinueBtn.addEventListener('click', function() {
      if (gameState.currentNode) {
        Nodes.markNodeVisited(gameState.currentNode);
        Nodes.showContainer(CONTAINER_TYPES.MAP);
      }
    });
  }
}
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
      // Update global game state
      gameState.character = data.character;
      gameState.currentFloor = data.current_floor || 1;
      
      // Update character info in UI
      Character.updateCharacterInfo(data.character);
      document.getElementById('current-floor').textContent = data.current_floor || 1;
      
      // Initialize inventory system
      Character.initializeInventory();
      
      // Fetch floor configuration and continue initialization
      return fetch(`/api/floor/${data.current_floor || 1}`);
    })
    .then(response => response.json())
    .then(floorData => {
      // Generate floor map based on floor data
      console.log("Floor data:", floorData);
      
      // Request map generation from the server
      return fetch('/api/generate-floor-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          floor_number: gameState.currentFloor || 1
        }),
      });
    })
    .then(response => response.json())
    .then(mapData => {
      console.log("Map data received from server:", mapData);
      gameState.map = mapData;
      
      // Remove loading indicator
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
      
      // Render the map
      if (typeof MapRenderer.renderFloorMap === 'function') {
        MapRenderer.renderFloorMap(mapData, 'floor-map');
      } else {
        console.error("Map renderer function not available");
      }
      
      // Hide the nodes container (if it exists)
      const nodesContainer = document.getElementById('nodes-container');
      if (nodesContainer) {
        nodesContainer.style.display = 'none';
      }
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