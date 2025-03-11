// game.js - Main game initialization and startup

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game initializing...");
  
  // Show welcome message with slight delay
  setTimeout(function() {
    UiUtils.showFloatingText("Welcome to Medical Physics Residency!", "success");
  }, 1000);
  
  // Create UI object to hold UI management functions
  window.UI = {
    showMapView: function() {
      // Show game board
      const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
      if (gameBoardContainer) {
        gameBoardContainer.style.display = 'block';
      }
      
      // Hide all interaction containers
      if (typeof NodeInteraction !== 'undefined' && 
          typeof NodeInteraction.hideAllContainers === 'function') {
        NodeInteraction.hideAllContainers();
      }
    }
  };
  
  // Check for character selection parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('select') === 'true') {
    // Remove the parameter from URL to avoid showing selection again on refresh
    window.history.replaceState({}, document.title, '/game');
    
    // Show character selection
    setTimeout(() => {
      if (typeof Character !== 'undefined' && typeof Character.showCharacterSelection === 'function') {
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

// Setup event listeners for game UI elements
function setupEventListeners() {
  console.log("Setting up event listeners...");
  
  // Next floor button
  const nextFloorBtn = document.getElementById('next-floor-btn');
  if (nextFloorBtn) {
    nextFloorBtn.addEventListener('click', function() {
      // Use GameState to handle floor advancement
      if (typeof GameState !== 'undefined' && 
          typeof GameState.goToNextFloor === 'function') {
        GameState.goToNextFloor()
          .catch(error => {
            console.error('Error going to next floor:', error);
            UiUtils.showToast('Failed to proceed to next floor', 'danger');
          });
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
  
  // Debug button
  const debugBtn = document.createElement('button');
  debugBtn.className = 'btn btn-secondary mt-2 mb-2';
  debugBtn.textContent = 'Debug Map';
  debugBtn.style.fontSize = '0.7rem';
  debugBtn.style.padding = '2px 8px';
  debugBtn.style.opacity = '0.7';
  
  debugBtn.addEventListener('click', function() {
    console.clear();
    console.log("=== DEBUG MAP STATE ===");
    
    if (typeof GameState !== 'undefined' && typeof GameState.debugState === 'function') {
      GameState.debugState();
    }
    
    if (typeof EventSystem !== 'undefined' && typeof EventSystem.debugEvents === 'function') {
      EventSystem.debugEvents();
    }
    
    console.log("Game State:", JSON.stringify(GameState.getState(), null, 2));
  });
  
  // Add debug button to map container
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    mapContainer.insertBefore(debugBtn, mapContainer.firstChild);
  }
}

// Initialize the game
function initializeGame() {
  // Show loading indicator
  showLoadingIndicator();
  
  // Initialize event system first
  if (typeof EventSystem !== 'undefined' && typeof EventSystem.initialize === 'function') {
    EventSystem.initialize();
  }
  
  // Initialize progression manager
  if (typeof ProgressionManager !== 'undefined' && typeof ProgressionManager.initialize === 'function') {
    ProgressionManager.initialize(PROGRESSION_TYPE.ROW_BASED);
  }
  
  // Initialize node interaction system
  if (typeof NodeInteraction !== 'undefined' && typeof NodeInteraction.initialize === 'function') {
    NodeInteraction.initialize();
  }
  
  // Initialize game state
  if (typeof GameState !== 'undefined' && typeof GameState.initialize === 'function') {
    GameState.initialize()
      .then(() => {
        // Initialize map renderer
        if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.initialize === 'function') {
          MapRenderer.initialize('floor-map');
        }
        
        // Initialize inventory system
        if (typeof Character !== 'undefined' && typeof Character.initializeInventory === 'function') {
          Character.initializeInventory();
        }
        
        // Remove loading indicator
        removeLoadingIndicator();
        
        // Set up event listeners for UI
        setupEventListeners();
        
        // Validate map structure
        if (typeof ProgressionManager !== 'undefined' && 
            typeof ProgressionManager.validateMapStructure === 'function') {
          ProgressionManager.validateMapStructure();
        }
        
        // Emit game initialized event
        if (typeof EventSystem !== 'undefined') {
          EventSystem.emit(GAME_EVENTS.GAME_INITIALIZED, GameState.getState());
        }
      })
      .catch(error => {
        console.error('Error initializing game:', error);
        showErrorMessage(error.message);
      });
  } else {
    console.error("Game state manager not available");
    showErrorMessage("Game state manager not available");
  }
}

// Helper functions for UI
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

function removeLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

function showErrorMessage(message) {
  // Remove loading indicator
  removeLoadingIndicator();
  
  // Show error message
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