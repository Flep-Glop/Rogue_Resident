// game.js - Main game initialization and startup
// Add to the top of game.js or in the console:
function resetGame() {
  fetch('/api/debug-reset', { method: 'POST' })
    .then(() => window.location.reload());
}
// Call resetGame() in console to restart
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

  // Debug: Force Next Floor button
  const debugNextFloorBtn = document.createElement('button');
  debugNextFloorBtn.className = 'btn btn-warning mt-2 mb-2 ms-2';
  debugNextFloorBtn.textContent = 'Debug: Force Next Floor';
  debugNextFloorBtn.style.fontSize = '0.7rem';
  debugNextFloorBtn.style.padding = '2px 8px';

  debugNextFloorBtn.addEventListener('click', function() {
    console.log("DEBUG: Force proceeding to next floor");
    
    // Force floor completion
    if (typeof GameState !== 'undefined') {
      // Show the next floor button
      const nextFloorBtn = document.getElementById('next-floor-btn');
      if (nextFloorBtn) {
        nextFloorBtn.style.display = 'block';
        console.log("Next floor button made visible");
      }
      
      // Direct call to go to next floor
      if (typeof GameState.goToNextFloor === 'function') {
        GameState.goToNextFloor()
          .then(() => {
            console.log("Successfully advanced to next floor");
          })
          .catch(error => {
            console.error('Error going to next floor:', error);
            UiUtils.showToast('Failed to proceed to next floor: ' + error.message, 'danger');
          });
      }
    }
  });

  // Complete Floor button (for testing)
  const completeFloorBtn = document.getElementById('complete-floor-btn');
  if (completeFloorBtn) {
    completeFloorBtn.addEventListener('click', function() {
      console.log("Complete Floor button clicked - applying row-based completion");
      
      // 1. Get all nodes
      const allNodes = GameState.getAllNodes();
      
      // 2. Get max row (excluding boss)
      const maxRow = Math.max(...allNodes.filter(n => n.id !== 'boss').map(n => n.position ? n.position.row : 0));
      
      // 3. For each row, mark one node as visited
      for (let row = 1; row <= maxRow; row++) {
        // Get all nodes in this row
        const rowNodes = allNodes.filter(n => n.position && n.position.row === row);
        
        if (rowNodes.length > 0) {
          // Pick one random node to mark as completed
          const randomIndex = Math.floor(Math.random() * rowNodes.length);
          const selectedNode = rowNodes[randomIndex];
          
          console.log(`Marking node ${selectedNode.id} as completed for row ${row}`);
          selectedNode.visited = true;
          selectedNode.state = NODE_STATE.COMPLETED;
        }
      }
      
      // 4. Clear current node
      GameState.data.currentNode = null;
      
      // 5. Update all node states to set boss as available
      GameState.updateAllNodeStates();
      
      // 6. Re-render the map
      if (typeof MapRenderer !== 'undefined' && MapRenderer.renderMap) {
        MapRenderer.renderMap();
      }
      
      // Show success message
      UiUtils.showToast("Floor ready for boss! One node completed per row.", "success");
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
  
  // Add debug buttons to map container
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    // Create a debug button container
    const debugButtonContainer = document.createElement('div');
    debugButtonContainer.className = 'debug-buttons mb-2';
    debugButtonContainer.style.display = 'flex';
    debugButtonContainer.style.gap = '5px';
    
    // Add all debug buttons to the container
    debugButtonContainer.appendChild(debugBtn);
    debugButtonContainer.appendChild(debugNextFloorBtn);
    
    // Insert at the beginning of map container
    mapContainer.insertBefore(debugButtonContainer, mapContainer.firstChild);
  }
}

// Initialize the game
function initializeGame() {
  // Show loading indicator
  showLoadingIndicator();
  
  // Initialize error handler first for robust error handling
  if (typeof ErrorHandler !== 'undefined' && typeof ErrorHandler.initialize === 'function') {
    ErrorHandler.initialize();
  }
  
  // Initialize event system
  if (typeof EventSystem !== 'undefined' && typeof EventSystem.initialize === 'function') {
    EventSystem.initialize();
  }
  
  // Initialize progression manager
  if (typeof ProgressionManager !== 'undefined' && typeof ProgressionManager.initialize === 'function') {
    ProgressionManager.initialize(PROGRESSION_TYPE.PATH_BASED);
  }
  
  // Initialize UI feedback system
  if (typeof FeedbackSystem !== 'undefined' && typeof FeedbackSystem.initialize === 'function') {
    FeedbackSystem.initialize();
  }
  
  // Initialize node interaction system
  if (typeof NodeInteraction !== 'undefined' && typeof NodeInteraction.initialize === 'function') {
    NodeInteraction.initialize();
  }
  
  // Initialize special interactions system
  if (typeof SpecialInteractions !== 'undefined' && typeof SpecialInteractions.initialize === 'function') {
    SpecialInteractions.initialize();
  }
  
  // Initialize game state
  if (typeof GameState !== 'undefined' && typeof GameState.initialize === 'function') {
    GameState.initialize()
      .then(() => {
        // Initialize map renderer
        if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.initialize === 'function') {
          MapRenderer.initialize('floor-map');
        }
        // Add this after MapRenderer initialization in game.js (or somewhere appropriate)
        // This forces an immediate render of the map after initialization

        // Wait for a moment to make sure all the components have initialized
        setTimeout(() => {
          // Check if MapRenderer exists and has been initialized
          if (typeof MapRenderer !== 'undefined' && MapRenderer.renderMap) {
            console.log("Forcing initial map render...");
            MapRenderer.renderMap();
          }
        }, 500);

        // Alternatively, you can call this debug function to help diagnose any issues
        function debugMapRenderer() {
          console.group("Map Renderer Debug");
          
          // Check if canvas exists
          const canvas = document.getElementById('floor-map');
          if (!canvas) {
            console.error("Canvas element 'floor-map' not found!");
          } else {
            console.log("Canvas element found:", canvas);
            console.log("Canvas dimensions:", {
              width: canvas.width,
              height: canvas.height,
              styleWidth: canvas.style.width,
              styleHeight: canvas.style.height
            });
            
            // Check if context can be created
            try {
              const ctx = canvas.getContext('2d');
              console.log("Canvas context created successfully");
              
              // Try drawing a simple shape to test
              ctx.fillStyle = 'red';
              ctx.fillRect(100, 100, 50, 50);
              console.log("Test shape drawn");
            } catch (e) {
              console.error("Error creating canvas context:", e);
            }
          }
          
          // Check if MapRenderer is initialized
          if (typeof MapRenderer === 'undefined') {
            console.error("MapRenderer not defined!");
          } else {
            console.log("MapRenderer exists");
            console.log("Has renderMap method:", typeof MapRenderer.renderMap === 'function');
            
            // Check other important methods
            console.log("Has initialize method:", typeof MapRenderer.initialize === 'function');
            console.log("Has drawNodes method:", typeof MapRenderer.drawNodes === 'function');
            
            // Check if map data exists
            if (GameState && GameState.data && GameState.data.map) {
              console.log("Map data exists in GameState");
              console.log("Nodes count:", Object.keys(GameState.data.map.nodes || {}).length);
            } else {
              console.error("No map data found in GameState");
            }
          }
          
          console.groupEnd();
        }

        // Call the debug function to diagnose map rendering issues
        // You can add this to your console or call it directly
        // debugMapRenderer();
        // Initialize character panel
        if (typeof CharacterPanel !== 'undefined' && typeof CharacterPanel.initialize === 'function') {
          CharacterPanel.initialize();
        }
        
        // Initialize inventory system
        if (typeof InventorySystem !== 'undefined' && typeof InventorySystem.initialize === 'function') {
          InventorySystem.initialize();
        }
        
        // Initialize save manager
        if (typeof SaveManager !== 'undefined' && typeof SaveManager.initialize === 'function') {
          SaveManager.initialize();
        }
        
        // Initialize debug tools if needed
        if (typeof DebugTools !== 'undefined' && typeof DebugTools.initialize === 'function') {
          DebugTools.initialize();
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
        if (typeof ErrorHandler !== 'undefined' && typeof ErrorHandler.handleError === 'function') {
          ErrorHandler.handleError(error, 'Initialization');
        } else {
          showErrorMessage(error.message);
        }
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