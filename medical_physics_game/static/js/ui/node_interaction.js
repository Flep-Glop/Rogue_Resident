// node_interaction.js - Thin delegation layer for node interactions

// Define container types (for backward compatibility)
const CONTAINER_TYPES = {
  QUESTION: 'question-container',
  TREASURE: 'treasure-container',
  REST: 'rest-container',
  EVENT: 'event-container',
  SHOP: 'shop-container',
  GAMBLE: 'gamble-container',
  PATIENT_CASE: 'patient-case-container',
  GAME_OVER: 'game-over-container',
  GAME_BOARD: 'game-board-container',
  MAP: 'floor-map'
};

// NodeInteraction singleton - handles node interactions via component system
const NodeInteraction = {
  // Current node data
  currentNodeData: null,
  
  // Initialize
  initialize: function() {
    console.log("Initializing node interaction system...");
    
    // Register for events
    EventSystem.on(GAME_EVENTS.NODE_SELECTED, this.visitNode.bind(this));
    
    return this;
  },
  
  // Hide all interaction containers
  hideAllContainers: function() {
    // Hide all interaction containers
    const containers = document.querySelectorAll('.interaction-container');
    containers.forEach(container => {
      container.style.display = 'none';
    });
    
    // Hide game over container if it exists
    const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
    if (gameOverContainer) {
      gameOverContainer.style.display = 'none';
    }
  },
  
  // Show a container - now a thin wrapper around modal creation
  showContainer: function(containerId) {
    this.hideAllContainers();
    
    const container = document.getElementById(containerId);
    if (container) {
      // Create a modal overlay if it doesn't exist
      let modalOverlay = document.getElementById('node-modal-overlay');
      if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'node-modal-overlay';
        modalOverlay.className = 'node-modal-overlay';
        document.body.appendChild(modalOverlay);
      }

      // Create modal content container if it doesn't exist
      let modalContent = document.getElementById('node-modal-content');
      if (!modalContent) {
        modalContent = document.createElement('div');
        modalContent.id = 'node-modal-content';
        modalContent.className = 'node-modal-content';
        modalOverlay.appendChild(modalContent);
      }

      // Move the container into the modal
      modalContent.innerHTML = ''; // Clear previous content
      modalContent.appendChild(container);
      container.style.display = 'block'; // Make sure it's visible

      // Add close button if needed
      if (!document.getElementById('modal-close-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.id = 'modal-close-btn';
        closeBtn.className = 'node-modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => {
          // Return to map on close
          if (GameState.data.currentNode) {
            // If there's an active node, call completeNode
            GameState.completeNode(GameState.data.currentNode);
          } else {
            // Otherwise just return to map
            this.showMapView();
          }
        });
        modalContent.insertBefore(closeBtn, modalContent.firstChild);
      }

      // Show the modal
      modalOverlay.style.display = 'flex';
      
      // Notify of container change
      EventSystem.emit(GAME_EVENTS.UI_CONTAINER_CHANGED, containerId);
    } else {
      console.error(`Container not found: ${containerId}`);
    }
  },
  
  // Show the map view
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
    
    // Make sure game board is visible
    const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
    if (gameBoardContainer) {
      gameBoardContainer.style.display = 'block';
    }
  },
  
  // Visit a node
  visitNode: function(nodeId) {
    console.log(`Attempting to visit node: ${nodeId}`);
    
    // Set current node in game state
    GameState.setCurrentNode(nodeId);
    
    // Request node data from server
    fetch(`/api/node/${nodeId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(nodeData => {
        console.log("Node data received:", nodeData);
        this.currentNodeData = nodeData;
        
        // Validate and fix node data
        nodeData = this.validateNodeData(nodeData);
        
        // Process the node - now just delegates to the component system
        this.processNodeContent(nodeData);
      })
      .catch(error => {
        console.error('Error loading node:', error);
        UiUtils.showToast(`Failed to load node: ${error.message}`, 'danger');
        
        // Clear current node on error
        GameState.setCurrentNode(null);
      });
  },

  // Validate and fix node data for consistency
  validateNodeData: function(nodeData) {
    if (!nodeData) return nodeData;
    
    console.log("Validating node data for consistency:", nodeData);
    
    // Check if node type and content are mismatched
    const hasItem = nodeData.item !== undefined;
    const hasQuestion = nodeData.question !== undefined;
    const hasEvent = nodeData.event !== undefined;
    
    // Check for title/type mismatch
    const titleTypeMap = {
      'Physics Question': 'question',
      'Challenging Question': 'elite',
      'Final Assessment': 'boss',
      'Equipment Found': 'treasure',
      'Break Room': 'rest',
      'Random Event': 'event',
      'Department Store': 'shop'
    };
    
    // Fix type based on title if needed
    if (nodeData.title && titleTypeMap[nodeData.title] && nodeData.type !== titleTypeMap[nodeData.title]) {
      console.warn(`Node ${nodeData.id} has mismatched type (${nodeData.type}) and title (${nodeData.title})`);
      console.log(`Fixing node type from ${nodeData.type} to ${titleTypeMap[nodeData.title]}`);
      nodeData.type = titleTypeMap[nodeData.title];
    }
    
    // Handle content mismatches
    if (hasItem && (nodeData.type === 'question' || nodeData.type === 'elite' || nodeData.type === 'boss')) {
      console.warn(`Node ${nodeData.id} is type ${nodeData.type} but has item data`);
      console.log("Converting item data to placeholder question data");
      
      // Create placeholder question data
      nodeData.question = {
        id: `placeholder_${nodeData.id}`,
        text: `What is the effect of the ${nodeData.item.name}?`,
        options: [
          `${nodeData.item.effect.value}`,
          "It has no effect",
          "It decreases insight",
          "It's harmful to patients"
        ],
        correct: 0,
        explanation: `The ${nodeData.item.name} ${nodeData.item.effect.value}`,
        difficulty: nodeData.difficulty || 1
      };
      
      // Keep the item for later use
      nodeData._originalItem = nodeData.item;
      delete nodeData.item;
    }
    else if (hasQuestion && nodeData.type === 'treasure') {
      console.warn(`Node ${nodeData.id} is type treasure but has question data`);
      console.log("Converting question data to placeholder item data");
      
      // Create placeholder item data
      nodeData.item = {
        id: `placeholder_${nodeData.id}`,
        name: "Study Notes",
        description: "Notes about " + nodeData.question.text,
        rarity: "common",
        effect: {
          type: "insight_boost",
          value: 5,
          duration: "instant"
        }
      };
      
      // Keep the question for later
      nodeData._originalQuestion = nodeData.question;
      delete nodeData.question;
    }
    
    return nodeData;
  },
  
  // Process node content - now just delegates to the component system
  processNodeContent: function(nodeData) {
    console.log("Processing node type:", nodeData.type);
    
    // Get node type config from registry
    const nodeType = NodeRegistry.getNodeType(nodeData.type);
    
    // Get container ID from registry
    const containerId = nodeType.interactionContainer;
    
    // If no container defined for this type, complete the node and return
    if (!containerId) {
      console.log(`No interaction container defined for node type: ${nodeData.type}`);
      GameState.completeNode(nodeData.id);
      return;
    }
    
    // Make sure container exists
    NodeRegistry.createContainerForType(nodeData.type);
    
    // Show the container
    this.showContainer(containerId);
    
    // Get the container element
    const container = document.getElementById(containerId);
    
    // Use component system to render and handle the node
    if (container && typeof NodeComponents !== 'undefined') {
      NodeComponents.processNode(nodeData, container);
    } else {
      console.error(`Container ${containerId} not found or NodeComponents not available`);
      // Fallback - complete the node to prevent getting stuck
      GameState.completeNode(nodeData.id);
    }
  },
  
  // Show game over screen
  showGameOver: function() {
    console.log("Game over!");
    
    // Update final score
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement && GameState.data.character) {
      finalScoreElement.textContent = GameState.data.character.insight;
    }
    
    // Hide game board
    const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
    if (gameBoardContainer) {
      gameBoardContainer.style.display = 'none';
    }
    
    // Show game over screen
    const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
    if (gameOverContainer) {
      gameOverContainer.style.display = 'block';
    }
    
    // Emit game over event
    EventSystem.emit(GAME_EVENTS.GAME_OVER, {
      finalScore: GameState.data.character?.insight || 0,
      floorReached: GameState.data.currentFloor || 1
    });
  }
};

// Export globally
window.NodeInteraction = NodeInteraction;
window.CONTAINER_TYPES = CONTAINER_TYPES;