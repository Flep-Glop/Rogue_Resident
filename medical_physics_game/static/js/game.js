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
    debugButtonContainer.appendChild(debugSummaryBtn);
    debugButtonContainer.appendChild(debugNextFloorBtn);
    // 4. Debug Boss Test button
    const debugBossTestBtn = document.createElement('button');
    debugBossTestBtn.className = 'btn btn-danger mt-2 mb-2 ms-2';
    debugBossTestBtn.textContent = 'Test Boss';
    debugBossTestBtn.style.fontSize = '0.7rem';
    debugBossTestBtn.style.padding = '2px 8px';

    debugBossTestBtn.addEventListener('click', function() {
      console.log("DEBUG: Testing boss encounter");
      
      if (typeof GameState !== 'undefined' && typeof NodeInteraction !== 'undefined') {
        // First approach: try to use an existing boss node if it exists
        if (GameState.data && GameState.data.map && GameState.data.map.boss) {
          console.log("Using existing boss node");
          NodeInteraction.visitNode('boss');
        } else {
          // Second approach: create a mock boss node
          console.log("Creating mock boss node for testing");
          
          const mockBossNode = {
            id: 'boss_test',
            type: 'boss',
            title: 'Quantum Professor Challenge',
            position: {row: 0, col: 0},
            paths: [],
            visited: false,
            question: {
              text: "What principle describes the quantum nature of radiation?",
              options: [
                "Wave-particle duality",
                "Mass-energy equivalence",
                "Thermodynamic equilibrium",
                "Bernoulli's principle"
              ],
              correct: 0,
              explanation: "Wave-particle duality is a fundamental quantum concept that describes how particles like photons exhibit both wave and particle properties."
            }
          };
          
          // Store the original function
          const originalGetNodeById = GameState.getNodeById;
          
          // Override temporarily
          GameState.getNodeById = function(nodeId) {
            if (nodeId === 'boss_test') {
              return mockBossNode;
            }
            return originalGetNodeById.call(GameState, nodeId);
          };
          
          // Visit the mock boss
          GameState.setCurrentNode('boss_test');
          NodeInteraction.visitNode('boss_test');
          
          // Restore original function
          setTimeout(() => {
            GameState.getNodeById = originalGetNodeById;
            console.log("Restored original getNodeById function");
          }, 1000);
        }
      } else {
        console.error("GameState or NodeInteraction not available");
        if (typeof UiUtils !== 'undefined') {
          UiUtils.showToast("Cannot test boss - game systems not initialized", "danger");
        }
      }
    });

    // Add the boss test button to the container
    debugButtonContainer.appendChild(debugBossTestBtn);
    // Insert at the beginning of map container
    mapContainer.insertBefore(debugButtonContainer, mapContainer.firstChild);
    
    console.log("Debug buttons added:", {
      container: debugButtonContainer,
      buttonCount: debugButtonContainer.childElementCount,
      summaryBtn: debugSummaryBtn,
      nextFloorBtn: debugNextFloorBtn
    });
  } else {
    console.error("Map container not found, debug buttons not added");
  }
}

// Function to initialize the game with improved architecture
function initializeGame() {
  // Show loading indicator
  function showLoadingIndicator() {
    const boardContainer = document.getElementById('game-board-container');
    if (boardContainer) {
      boardContainer.innerHTML += `
        <div id="loading-indicator" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Initializing Medical Physics Adventure...</p>
          <div class="progress mt-3" style="height: 10px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" style="width: 0%"></div>
          </div>
        </div>
      `;
      
      // Animate progress bar
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress > 95) {
            clearInterval(interval);
            progress = 100;
          }
          progressBar.style.width = `${progress}%`;
        }, 300);
      }
    }
  }
  // Initialize in the correct order for dependencies
  Promise.resolve()
    .then(() => {
      console.log("Starting game initialization");
      
      // 1. Initialize error handler first for robust error handling
      if (typeof ErrorHandler !== 'undefined' && typeof ErrorHandler.initialize === 'function') {
        return ErrorHandler.initialize();
      }
    })
    .then(() => {
      // 2. Initialize event system
      if (typeof EventSystem !== 'undefined' && typeof EventSystem.initialize === 'function') {
        return EventSystem.initialize();
      }
    })
    .then(() => {
      // 3. Initialize node registry (defines node types)
      if (typeof NodeRegistry !== 'undefined' && typeof NodeRegistry.initialize === 'function') {
        return NodeRegistry.initialize();
      }
    })
    .then(() => {
      // Make sure this runs before loading component scripts
      if (typeof NodeComponents !== 'undefined' && typeof NodeComponents.initialize === 'function') {
        return NodeComponents.initialize();
      }
    })
    .then(() => {
      // Then ensure components are loaded and registered
      if (typeof NodeSystemIntegrator !== 'undefined' && typeof NodeSystemIntegrator.initialize === 'function') {
        return NodeSystemIntegrator.initialize();
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
    // Add to the initialization chain in game.js
    .then(() => {
      // Initialize item manager
      if (typeof ItemManager !== 'undefined' && typeof ItemManager.initialize === 'function') {
        ItemManager.initialize();
      }
    })
    .then(() => {
      // 10. Initialize map renderer after game state is loaded
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.initialize === 'function') {
        MapRenderer.initialize('floor-map');
      }
        // Initialize pixel background after map renderer
        if (typeof PixelBackgroundGenerator !== 'undefined') {
          PixelBackgroundGenerator.initialize('floor-map');
          
          // Add event handler to refresh pixels when map is redrawn
          if (typeof EventSystem !== 'undefined') {
            EventSystem.on(GAME_EVENTS.MAP_UPDATED, function() {
              // Short delay to ensure the map is fully rendered
              setTimeout(function() {
                PixelBackgroundGenerator.refresh();
              }, 100);
            });
          }
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
      
      // 14. Initialize skill effect system
      if (typeof SkillEffectSystem !== 'undefined' && typeof SkillEffectSystem.initialize === 'function') {
        return SkillEffectSystem.initialize();
      }
    })

    .then(() => {
      // 15. Initialize skill tree manager
      if (typeof SkillTreeManager !== 'undefined' && typeof SkillTreeManager.initialize === 'function') {
        return SkillTreeManager.initialize();
      }
    })
    .then(() => {
      // 16. Initialize skill tree controller
      if (typeof SkillTreeController !== 'undefined' && 
          typeof SkillTreeController.initialize === 'function' &&
          !SkillTreeController.initialized) {
        SkillTreeController.initialize();
      }
      
      // 17. Initialize reputation system
      if (typeof ReputationSystem !== 'undefined' && typeof ReputationSystem.initialize === 'function') {
        ReputationSystem.initialize();
      }
      
      // 18. Create skill tree access button
      createSkillTreeButton();

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
      
      // Emit game initialized event
      if (typeof EventSystem !== 'undefined') {
        EventSystem.emit(GAME_EVENTS.GAME_INITIALIZED, GameState.getState());
      }
    })
    .catch(error => {
      console.error('Error initializing game:', error);
      if (typeof ErrorHandler !== 'undefined' && typeof ErrorHandler.handleError === 'function') {
        ErrorHandler.handleError(error, 'Initialization', ErrorHandler.SEVERITY.CRITICAL);
      } else {
        showErrorMessage(error.message);
      }
    });
}

function createSkillTreeButton() {
  console.log("Creating skill tree access button");
  
  // Create button element
  const button = document.createElement('button');
  button.id = 'skill-tree-button';
  button.className = 'game-btn game-btn--primary skill-tree-access-button';
  button.innerHTML = '<span class="button-icon">⚛</span> Skill Tree';
  button.title = "View and manage your skills";
  
  // Add click event
  button.addEventListener('click', toggleSkillTree);
  
  // Find your game controls container and append the button
  const controlsContainer = document.querySelector('.game-controls') || document.body;
  controlsContainer.appendChild(button);
}

/**
 * Toggle skill tree visibility
 */
function toggleSkillTree() {
  const container = document.getElementById('skill-tree-container');
  
  if (!container) return;
  
  if (container.classList.contains('visible')) {
    // Hide skill tree
    container.classList.remove('visible');
    
    // Resume game if it was paused
    if (typeof GameState !== 'undefined' && GameState.resumeGame) {
      GameState.resumeGame();
    }
  } else {
    // Show skill tree
    container.classList.add('visible');
    
    // Pause game if possible
    if (typeof GameState !== 'undefined' && GameState.pauseGame) {
      GameState.pauseGame();
    }
    
    // Make sure skill tree is initialized
    if (!SkillTreeController.initialized) {
      SkillTreeController.initialize();
    }
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

function refreshPixelBackground(pixelCount) {
  // Allow overriding the pixel count
  if (pixelCount && typeof pixelCount === 'number') {
    PixelBackgroundGenerator.config.pixelCount = pixelCount;
  }
  
  // Refresh the pixel background
  PixelBackgroundGenerator.refresh();
  
  console.log(`Refreshed pixel background with ${PixelBackgroundGenerator.config.pixelCount} pixels`);
}

// Example usage: 
// refreshPixelBackground(200);  // Increase to 200 pixels
// refreshPixelBackground(50);   // Decrease to 50 pixels

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