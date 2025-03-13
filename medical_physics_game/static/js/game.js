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
  
  // Find this code in game.js (around line 16-29) and replace it with this version:

  // Create UI object to hold UI management functions
  window.UI = {
    showMapView: function() {
      // Hide the modal overlay if it exists
      const modalOverlay = document.getElementById('node-modal-overlay');
      if (modalOverlay) {
        modalOverlay.style.display = 'none';
        
        // Return containers to their original place
        const modalContent = document.getElementById('node-modal-content');
        if (modalContent) {
          // Move all interaction containers back to their original parent
          const containers = modalContent.querySelectorAll('.interaction-container');
          const gameBoard = document.querySelector('.col-md-9');
          
          if (gameBoard) {
            containers.forEach(container => {
              gameBoard.appendChild(container);
              container.style.display = 'none'; // Hide them
            });
          }
        }
      }

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
  
  // ======== DEBUG BUTTONS SECTION ========
  // Find map container to add debug buttons
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    // Create a single debug button container
    const debugButtonContainer = document.createElement('div');
    debugButtonContainer.className = 'debug-buttons mb-2';
    debugButtonContainer.style.display = 'flex';
    debugButtonContainer.style.gap = '5px';
    
    // 1. Debug Map button
    const debugMapBtn = document.createElement('button');
    debugMapBtn.className = 'btn btn-secondary mt-2 mb-2';
    debugMapBtn.textContent = 'Debug Map';
    debugMapBtn.style.fontSize = '0.7rem';
    debugMapBtn.style.padding = '2px 8px';
    debugMapBtn.style.opacity = '0.7';
    
    debugMapBtn.addEventListener('click', function() {
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
    
    // 2. Debug Summary button
    const debugSummaryBtn = document.createElement('button');
    debugSummaryBtn.className = 'btn btn-info mt-2 mb-2 ms-2';
    debugSummaryBtn.textContent = 'Copy Debug Summary';
    debugSummaryBtn.style.fontSize = '0.7rem';
    debugSummaryBtn.style.padding = '2px 8px';
    
    debugSummaryBtn.addEventListener('click', function() {
      console.log("Debug summary button clicked");
      if (typeof DebugTools !== 'undefined') {
        if (typeof DebugTools.generateStateSummary === 'function') {
          console.log("Calling generateStateSummary function");
          DebugTools.generateStateSummary();
        } else {
          console.error("DebugTools exists but generateStateSummary function not found");
          UiUtils.showToast("Debug summary function not available", "warning");
        }
      } else {
        console.error("DebugTools not available");
        UiUtils.showToast("Debug tools not available", "warning");
      }
    });
    
    // 3. Debug Next Floor button
    const debugNextFloorBtn = document.createElement('button');
    debugNextFloorBtn.className = 'btn btn-warning mt-2 mb-2 ms-2';
    debugNextFloorBtn.textContent = 'Force Next Floor';
    debugNextFloorBtn.style.fontSize = '0.7rem';
    debugNextFloorBtn.style.padding = '2px 8px';
    
    debugNextFloorBtn.addEventListener('click', function() {
      console.log("DEBUG: Force proceeding to next floor");
      
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
    
    // Add all buttons to the container
    debugButtonContainer.appendChild(debugMapBtn);
    debugButtonContainer.appendChild(debugSummaryBtn);
    debugButtonContainer.appendChild(debugNextFloorBtn);
    
    // Insert at the beginning of map container
    mapContainer.insertBefore(debugButtonContainer, mapContainer.firstChild);
    
    console.log("Debug buttons added:", {
      container: debugButtonContainer,
      buttonCount: debugButtonContainer.childElementCount,
      mapBtn: debugMapBtn,
      summaryBtn: debugSummaryBtn,
      nextFloorBtn: debugNextFloorBtn
    });
  } else {
    console.error("Map container not found, debug buttons not added");
  }
}

// Function to initialize the game
function initializeGame() {
  // Show loading indicator
  showLoadingIndicator();
  
  // Initialize in the correct order for dependencies
  Promise.resolve()
    .then(() => {
      // 1. Initialize error handler first for robust error handling
      if (typeof ErrorHandler !== 'undefined' && typeof ErrorHandler.initialize === 'function') {
        ErrorHandler.initialize();
      }
      
      // 2. Initialize event system
      if (typeof EventSystem !== 'undefined' && typeof EventSystem.initialize === 'function') {
        return EventSystem.initialize();
      }
    })
    .then(() => {
      // 3. Initialize node registry (consolidated version)
      if (typeof NodeRegistry !== 'undefined' && typeof NodeRegistry.initialize === 'function') {
        return NodeRegistry.initialize();
      }
    })
    .then(() => {
      // 4. Initialize component system
      if (typeof NodeComponents !== 'undefined' && typeof NodeComponents.initialize === 'function') {
        return NodeComponents.initialize();
      }
    })
    .then(() => {
      // 5. Initialize progression manager
      if (typeof ProgressionManager !== 'undefined' && typeof ProgressionManager.initialize === 'function') {
        return ProgressionManager.initialize(PROGRESSION_TYPE.PATH_BASED);
      }
    })
    .then(() => {
      // 6. Initialize UI feedback system
      if (typeof FeedbackSystem !== 'undefined' && typeof FeedbackSystem.initialize === 'function') {
        return FeedbackSystem.initialize();
      }
    })
    .then(() => {
      // 7. Initialize node interaction system
      if (typeof NodeInteraction !== 'undefined' && typeof NodeInteraction.initialize === 'function') {
        return NodeInteraction.initialize();
      }
    })
    .then(() => {
      // 8. Initialize special interactions system
      if (typeof SpecialInteractions !== 'undefined' && typeof SpecialInteractions.initialize === 'function') {
        return SpecialInteractions.initialize();
      }
    })
    .then(() => {
      // 9. Initialize game state - this loads current game data
      if (typeof GameState !== 'undefined' && typeof GameState.initialize === 'function') {
        return GameState.initialize();
      }
    })
    .then(() => {
      // 10. Initialize map renderer after game state is loaded
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.initialize === 'function') {
        MapRenderer.initialize('floor-map');
      }

      // 11. Force an initial map render after a slight delay
      setTimeout(() => {
        if (typeof MapRenderer !== 'undefined' && MapRenderer.renderMap) {
          console.log("Forcing initial map render...");
          MapRenderer.renderMap();
        }
      }, 500);

      // 12. Initialize character panel
      if (typeof CharacterPanel !== 'undefined' && typeof CharacterPanel.initialize === 'function') {
        CharacterPanel.initialize();
      }
      
      // 13. Initialize inventory system
      if (typeof InventorySystem !== 'undefined' && typeof InventorySystem.initialize === 'function') {
        InventorySystem.initialize();
      }
      
      // 14. Initialize save manager
      if (typeof SaveManager !== 'undefined' && typeof SaveManager.initialize === 'function') {
        SaveManager.initialize();
      }
      
      // 15. Initialize debug tools if needed
      if (typeof DebugTools !== 'undefined' && typeof DebugTools.initialize === 'function') {
        DebugTools.initialize();
      }
      
      // Remove loading indicator
      removeLoadingIndicator();
      
      // Set up event listeners for UI
      setupEventListeners();
      
      // Validate map structure if applicable
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