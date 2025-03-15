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
  showLoadingIndicator();

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
        console.log("Initializing EventSystem");
        return EventSystem.initialize();
      }
    })
    .then(() => {
      // 3. Initialize node registry (defines node types)
      if (typeof NodeRegistry !== 'undefined' && typeof NodeRegistry.initialize === 'function') {
        console.log("Initializing NodeRegistry");
        return NodeRegistry.initialize();
      }
    })
    .then(() => {
      // 4. Initialize node components system
      if (typeof NodeComponents !== 'undefined' && typeof NodeComponents.initialize === 'function') {
        console.log("Initializing NodeComponents");
        return NodeComponents.initialize();
      }
    })
    .then(() => {
      // 5. Ensure components are loaded and registered
      if (typeof NodeSystemIntegrator !== 'undefined' && typeof NodeSystemIntegrator.initialize === 'function') {
        console.log("Initializing NodeSystemIntegrator");
        return NodeSystemIntegrator.initialize();
      }
    })
    .then(() => {
      // 6. Initialize progression manager
      if (typeof ProgressionManager !== 'undefined' && typeof ProgressionManager.initialize === 'function') {
        console.log("Initializing ProgressionManager");
        return ProgressionManager.initialize(PROGRESSION_TYPE.PATH_BASED);
      }
    })
    .then(() => {
      // 7. Initialize UI feedback system
      if (typeof FeedbackSystem !== 'undefined' && typeof FeedbackSystem.initialize === 'function') {
        console.log("Initializing FeedbackSystem");
        return FeedbackSystem.initialize();
      }
    })
    .then(() => {
      // 8. Initialize node interaction system
      if (typeof NodeInteraction !== 'undefined' && typeof NodeInteraction.initialize === 'function') {
        console.log("Initializing NodeInteraction");
        return NodeInteraction.initialize();
      }
    })
    .then(() => {
      // 9. Initialize special interactions system
      if (typeof SpecialInteractions !== 'undefined' && typeof SpecialInteractions.initialize === 'function') {
        console.log("Initializing SpecialInteractions");
        return SpecialInteractions.initialize();
      }
    })
    .then(() => {
      // 10. Initialize game state - this loads current game data
      if (typeof GameState !== 'undefined' && typeof GameState.initialize === 'function') {
        console.log("Initializing GameState");
        return GameState.initialize();
      }
    })
    .then(() => {
      // 11. Initialize item manager
      if (typeof ItemManager !== 'undefined' && typeof ItemManager.initialize === 'function') {
        console.log("Initializing ItemManager");
        return ItemManager.initialize();
      }
    })
    .then(() => {
      // 12. Initialize skill effect system - must be before skill tree manager
      if (typeof SkillEffectSystem !== 'undefined' && typeof SkillEffectSystem.initialize === 'function') {
        console.log("Initializing SkillEffectSystem");
        return SkillEffectSystem.initialize();
      }
    })
    .then(() => {
      // 13. Initialize skill tree manager
      if (typeof SkillTreeManager !== 'undefined' && typeof SkillTreeManager.initialize === 'function') {
        console.log("Initializing SkillTreeManager");
        return SkillTreeManager.initialize();
      }
    })
    .then(() => {
      // 14. Initialize map renderer after game state is loaded
      if (typeof MapRenderer !== 'undefined' && typeof MapRenderer.initialize === 'function') {
        console.log("Initializing MapRenderer");
        MapRenderer.initialize('floor-map');
      }
      
      // 15. Initialize pixel background if available
      if (typeof PixelBackgroundGenerator !== 'undefined') {
        console.log("Initializing PixelBackgroundGenerator");
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

      // 16. Force an initial map render after a slight delay
      setTimeout(() => {
        if (typeof MapRenderer !== 'undefined' && MapRenderer.renderMap) {
          console.log("Forcing initial map render...");
          MapRenderer.renderMap();
        }
      }, 500);

      // 17. Initialize character panel
      if (typeof CharacterPanel !== 'undefined' && typeof CharacterPanel.initialize === 'function') {
        console.log("Initializing CharacterPanel");
        CharacterPanel.initialize();
      }
      
      // 18. Initialize inventory system
      if (typeof InventorySystem !== 'undefined' && typeof InventorySystem.initialize === 'function') {
        console.log("Initializing InventorySystem");
        InventorySystem.initialize();
      }
      
      // 19. Initialize skill tree controller
      if (typeof SkillTreeController !== 'undefined' && 
          typeof SkillTreeController.initialize === 'function' &&
          !SkillTreeController.initialized) {
        console.log("Initializing SkillTreeController");
        SkillTreeController.initialize({
          renderContainerId: 'skill-tree-visualization',
          uiContainerId: 'skill-tree-ui',
          autoInitialize: false  // We're manually initializing
        });
      }
      
      // 20. Initialize reputation system
      if (typeof ReputationSystem !== 'undefined' && typeof ReputationSystem.initialize === 'function') {
        console.log("Initializing ReputationSystem");
        ReputationSystem.initialize();
      }
      
      // 21. Create skill tree access button
      console.log("Creating skill tree button");
      createGameSkillTreeButton(); // Use the renamed function

      // 22. Initialize save manager
      if (typeof SaveManager !== 'undefined' && typeof SaveManager.initialize === 'function') {
        console.log("Initializing SaveManager");
        SaveManager.initialize();
      }
      
      // 23. Initialize debug tools if needed
      if (typeof DebugTools !== 'undefined' && typeof DebugTools.initialize === 'function') {
        console.log("Initializing DebugTools");
        DebugTools.initialize();
      }
      
      // Remove loading indicator
      removeLoadingIndicator();
      
      // Set up event listeners for UI
      setupEventListeners();
      
      // Emit game initialized event
      if (typeof EventSystem !== 'undefined') {
        console.log("Emitting game initialized event");
        EventSystem.emit(GAME_EVENTS.GAME_INITIALIZED, GameState.getState());
      }
      
      console.log("Game initialization complete!");
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

/// Renamed to avoid conflict with skill_tree_access.js
function createGameSkillTreeButton() {
  console.log("Creating skill tree access button for game UI");
  
  // Find or create the skill tree button
  let button = document.getElementById('skill-tree-button');
  
  if (button) {
      // Button already exists, just update it
      button.innerHTML = '<span class="button-icon">⚛</span> Specializations';
      return button;
  }
  
  // Create button element
  button = document.createElement('button');
  button.id = 'skill-tree-button';
  button.className = 'skill-tree-access-button';
  button.innerHTML = '<span class="button-icon">⚛</span> Specializations';
  button.title = "View and manage your specialization tree";
  
  // Style the button
  Object.assign(button.style, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: '100',
      display: 'flex',
      alignItems: 'center',
      padding: '8px 15px',
      backgroundColor: '#4287f5',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer'
  });
  
  // Add hover effect
  button.addEventListener('mouseenter', function() {
      button.style.backgroundColor = '#5b8dd9';
      button.style.transform = 'translateY(-2px)';
  });
  
  button.addEventListener('mouseleave', function() {
      button.style.backgroundColor = '#4287f5';
      button.style.transform = 'translateY(0)';
  });
  
  // Add click event
  button.addEventListener('click', function() {
      // Make sure skill tree container exists
      initializeGameSkillTreeContainer();
      
      // Toggle skill tree visibility
      toggleGameSkillTree();
  });
  
  // Find a suitable parent element to add the button to
  const possibleParents = [
      document.querySelector('.game-controls'),
      document.querySelector('.game-ui'),
      document.querySelector('.hud-container'),
      document.querySelector('.map-container'),
      document.getElementById('game-board-container')
  ];
  
  // Add to the first found parent
  for (const parent of possibleParents) {
      if (parent) {
          parent.appendChild(button);
          console.log("Added skill tree button to:", parent);
          break;
      }
  }
  
  // If no parent found, add to body as fallback
  if (!button.parentElement) {
      document.body.appendChild(button);
      console.log("Added skill tree button to document body (fallback)");
  }
  
  return button;
}

// Replace the toggleGameSkillTree function in game.js with this version

function toggleGameSkillTree() {
  const container = document.getElementById('skill-tree-container');
  
  if (!container) {
      console.error("Skill tree container not found");
      return;
  }
  
  if (container.classList.contains('visible')) {
      // Hide skill tree
      container.classList.remove('visible');
      
      // Resume game if it was paused
      if (typeof GameState !== 'undefined' && GameState.resumeGame) {
          GameState.resumeGame();
      }
      
      // Show notification that changes are saved
      if (typeof UiUtils !== 'undefined' && UiUtils.showToast) {
          UiUtils.showToast("Specialization changes saved", "success");
      }
      
      // Re-enable UI elements that might have been disabled
      enableGameUI();
  } else {
      // Show skill tree
      container.classList.add('visible');
      
      // Pause game if possible
      if (typeof GameState !== 'undefined' && GameState.pauseGame) {
          GameState.pauseGame();
      }
      
      // Disable certain UI elements while skill tree is open
      disableGameUI();
      
      // Make sure skill tree is initialized and loaded
      ensureSkillTreeInitialized();
  }
}
// Add these functions to game.js to improve skill tree integration

// Initialize skill tree systems
function initializeSkillTreeSystems() {
  return Promise.resolve()
    .then(() => {
      console.log("Initializing skill tree systems");
      
      // 1. Initialize skill effect system first
      if (typeof SkillEffectSystem !== 'undefined' && typeof SkillEffectSystem.initialize === 'function') {
        console.log("Initializing SkillEffectSystem");
        return SkillEffectSystem.initialize();
      } else {
        console.warn("SkillEffectSystem not available");
        return Promise.resolve(null);
      }
    })
    .then(() => {
      // 2. Initialize skill tree manager
      if (typeof SkillTreeManager !== 'undefined' && typeof SkillTreeManager.initialize === 'function') {
        console.log("Initializing SkillTreeManager");
        return SkillTreeManager.initialize();
      } else {
        console.warn("SkillTreeManager not available");
        return Promise.resolve(null);
      }
    })
    .then(() => {
      // 3. Initialize skill tree controller with specified containers
      if (typeof SkillTreeController !== 'undefined' && typeof SkillTreeController.initialize === 'function') {
        console.log("Initializing SkillTreeController");
        return SkillTreeController.initialize({
          renderContainerId: 'skill-tree-visualization',
          uiContainerId: 'skill-tree-ui',
          autoInitialize: false // We're manually initializing
        });
      } else {
        console.warn("SkillTreeController not available");
        return Promise.resolve(null);
      }
    })
    .then(() => {
      // 4. Initialize reputation system
      if (typeof ReputationSystem !== 'undefined' && typeof ReputationSystem.initialize === 'function') {
        console.log("Initializing ReputationSystem");
        return ReputationSystem.initialize();
      } else {
        console.warn("ReputationSystem not available");
        return Promise.resolve(null);
      }
    })
    .then(() => {
      // 5. Make skill tree button visible after all systems are initialized
      const button = document.querySelector('.skill-tree-access-button');
      if (button) {
        button.style.display = 'flex';
      } else {
        // Create the button if it doesn't exist
        createGameSkillTreeButton();
      }
      
      console.log("Skill tree systems initialization complete");
      return true;
    })
    .catch(error => {
      console.error("Error initializing skill tree systems:", error);
      ErrorHandler.handleError(
        error,
        "Skill Tree Systems",
        ErrorHandler.SEVERITY.ERROR
      );
      return false;
    });
}

// Ensure proper skill tree container initialization
function ensureSkillTreeContainer() {
  // Check if container exists
  let container = document.getElementById('skill-tree-container');
  
  if (!container) {
    console.log("Creating skill tree container");
    container = document.createElement('div');
    container.id = 'skill-tree-container';
    
    // Create structure
    container.innerHTML = `
      <div class="skill-tree-panel">
        <div class="skill-tree-header">
          <h2>Specialization Tree</h2>
          <button class="skill-tree-close-button">&times;</button>
        </div>
        <div class="skill-tree-content">
          <div id="skill-tree-visualization" class="skill-tree-visualization">
            <div class="skill-tree-loading">
              <div class="spinner"></div>
              <p>Loading skill tree...</p>
            </div>
          </div>
          <div id="skill-tree-ui" class="skill-tree-ui"></div>
        </div>
      </div>
    `;
    
    // Add close functionality
    const closeButton = container.querySelector('.skill-tree-close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        container.classList.remove('visible');
        enableGameUI(); // Re-enable game UI when skill tree is closed
      });
    }
    
    // Add ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && container.classList.contains('visible')) {
        container.classList.remove('visible');
        enableGameUI();
      }
    });
    
    document.body.appendChild(container);
  }
  
  return container;
}

// Debug function to test skill tree
function testSkillTree() {
  console.group("Skill Tree Test");
  
  // Check if systems are initialized
  const effectSystemInitialized = typeof SkillEffectSystem !== 'undefined' && SkillEffectSystem.initialized;
  const treeManagerInitialized = typeof SkillTreeManager !== 'undefined' && SkillTreeManager.initialized;
  const treeControllerInitialized = typeof SkillTreeController !== 'undefined' && SkillTreeController.initialized;
  
  console.log("Systems initialized:", {
    SkillEffectSystem: effectSystemInitialized,
    SkillTreeManager: treeManagerInitialized,
    SkillTreeController: treeControllerInitialized
  });
  
  // Check skill tree container
  const container = document.getElementById('skill-tree-container');
  console.log("Skill tree container exists:", !!container);
  
  // Check visualization container
  const vizContainer = document.getElementById('skill-tree-visualization');
  console.log("Visualization container exists:", !!vizContainer);
  
  // Check UI container
  const uiContainer = document.getElementById('skill-tree-ui');
  console.log("UI container exists:", !!uiContainer);
  
  // If not all systems are initialized, try to initialize them
  if (!effectSystemInitialized || !treeManagerInitialized || !treeControllerInitialized) {
    console.log("Some systems not initialized, attempting initialization");
    initializeSkillTreeSystems().then(result => {
      console.log("Initialization result:", result);
    });
  }
  
  // Test container
  if (!container) {
    console.log("Creating skill tree container");
    ensureSkillTreeContainer();
  }
  
  // Show the skill tree
  const skillTreeContainer = document.getElementById('skill-tree-container');
  if (skillTreeContainer) {
    console.log("Making skill tree visible");
    skillTreeContainer.classList.add('visible');
    
    // Force controller reload if available
    if (typeof SkillTreeController !== 'undefined' && SkillTreeController.initialized) {
      console.log("Reloading skill tree data");
      SkillTreeController.loadSkillTree();
    }
  }
  
  console.groupEnd();
  return "Skill tree test complete. Check console for details.";
}

// Add this to ensure the skill tree is properly loaded
window.testSkillTree = testSkillTree;
// Renamed to avoid conflict
function initializeGameSkillTreeContainer() {
  // Check if container already exists
  let container = document.getElementById('skill-tree-container');
  
  if (!container) {
      container = document.createElement('div');
      container.id = 'skill-tree-container';
      
      // Create inner structure
      container.innerHTML = `
          <div class="skill-tree-panel">
              <div class="skill-tree-header">
                  <h2>Specialization Tree</h2>
                  <button class="skill-tree-close-button">&times;</button>
              </div>
              <div id="skill-tree-visualization"></div>
              <div id="skill-tree-ui"></div>
          </div>
      `;
      
      // Add close button functionality
      const closeButton = container.querySelector('.skill-tree-close-button');
      if (closeButton) {
          closeButton.addEventListener('click', toggleGameSkillTree);
      }
      
      document.body.appendChild(container);
      
      // Add escape key handler
      document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && container.classList.contains('visible')) {
              toggleGameSkillTree();
          }
      });
  }
  
  return container;
}

// Renamed to avoid conflict
function ensureGameSkillTreeInitialized() {
  console.log("Ensuring skill tree is initialized");
  
  // Check if SkillTreeController exists and is initialized
  if (typeof SkillTreeController !== 'undefined') {
      if (!SkillTreeController.initialized) {
          console.log("Initializing SkillTreeController");
          SkillTreeController.initialize({
              renderContainerId: 'skill-tree-visualization',
              uiContainerId: 'skill-tree-ui'
          });
      } else {
          console.log("Refreshing skill tree data");
          SkillTreeController.loadSkillTree();
      }
  } else {
      console.error("SkillTreeController not available");
      
      // Show error message in skill tree container
      const container = document.getElementById('skill-tree-visualization');
      if (container) {
          container.innerHTML = `
              <div style="padding: 20px; text-align: center;">
                  <h3>Skill Tree Not Available</h3>
                  <p>The skill tree system could not be loaded.</p>
              </div>
          `;
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
// Add these functions to the game.js file

// Disable game UI elements when skill tree is open
function disableGameUI() {
  console.log("Disabling game UI elements while skill tree is open");
  
  // Add a class to body to indicate game is paused
  document.body.classList.add('game-paused');
  
  // Disable node interactions
  const nodes = document.querySelectorAll('.node');
  nodes.forEach(node => {
    node.style.pointerEvents = 'none';
  });
  
  // Disable buttons
  const buttons = document.querySelectorAll('.game-btn, .retro-btn');
  buttons.forEach(button => {
    if (!button.classList.contains('skill-tree-close-button')) {
      button.disabled = true;
    }
  });
  
  // Hide any visible modals that might interfere
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (modal.style.display !== 'none') {
      modal.dataset.wasVisible = 'true';
      modal.style.display = 'none';
    }
  });
}

// Re-enable game UI elements when skill tree is closed
function enableGameUI() {
  console.log("Re-enabling game UI elements");
  
  // Remove paused class
  document.body.classList.remove('game-paused');
  
  // Re-enable node interactions
  const nodes = document.querySelectorAll('.node');
  nodes.forEach(node => {
    node.style.pointerEvents = 'auto';
  });
  
  // Re-enable buttons
  const buttons = document.querySelectorAll('.game-btn, .retro-btn');
  buttons.forEach(button => {
    button.disabled = false;
  });
  
  // Restore any modals that were visible
  const modals = document.querySelectorAll('.modal[data-was-visible="true"]');
  modals.forEach(modal => {
    modal.style.display = 'block';
    modal.dataset.wasVisible = 'false';
  });
}

// Function to ensure the skill tree is initialized
function ensureSkillTreeInitialized() {
  console.log("Ensuring skill tree is initialized");
  
  // Check if SkillTreeController exists and is initialized
  if (typeof SkillTreeController !== 'undefined') {
    if (!SkillTreeController.initialized) {
      console.log("Initializing SkillTreeController");
      SkillTreeController.initialize({
          renderContainerId: 'skill-tree-visualization',
          uiContainerId: 'skill-tree-ui'
      });
    } else {
      console.log("Refreshing skill tree data");
      SkillTreeController.loadSkillTree();
    }
  } else {
    console.error("SkillTreeController not available");
    
    // Show error message in skill tree container
    const container = document.getElementById('skill-tree-visualization');
    if (container) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3>Skill Tree Not Available</h3>
                <p>The skill tree system could not be loaded.</p>
            </div>
        `;
    }
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