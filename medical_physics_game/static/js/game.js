// game.js - Main game logic
// Add at the top of game.js
console.log("Game.js loaded");

// Modify loadGameState function to include debugging
function loadGameState() {
    console.log("loadGameState called");
    fetch('/api/game-state')
        .then(response => response.json())
        .then(data => {
            console.log("Game state loaded:", data);
            // Rest of your code...
        })
        .catch(error => console.error('Error loading game state:', error));
}

// Add debugging to showRoentgenIntroScene
function showRoentgenIntroScene() {
    console.log("Showing Roentgen intro scene");
// Define all container types for easier management
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
  
  // Map generation parameters
  const MAP_CONFIG = {
    nodesPerRow: 3,    // Number of nodes horizontally
    rowCount: 5,       // Number of rows (excluding start/boss)
    branchFactor: 2,   // How many paths forward each node can have
    minWidth: 800,     // Minimum canvas width
    minHeight: 600     // Minimum canvas height
  };
  
  // CSS for character selection screen
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
  
  .character-selection-screen h2 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #4CAF50;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
  
  .character-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin: 20px 0;
    max-width: 1200px;
  }
  
  .character-card {
    background-color: rgba(30, 30, 30, 0.7);
    border: 2px solid #555;
    border-radius: 10px;
    padding: 15px;
    width: 220px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .character-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    border-color: #4CAF50;
  }
  
  .character-card.selected {
    border-color: #4CAF50;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
    background-color: rgba(76, 175, 80, 0.2);
  }
  
  .character-icon {
    font-family: monospace;
    white-space: pre;
    font-size: 12px;
    margin-bottom: 10px;
    color: #FFC107;
    text-align: center;
  }
  
  .character-card h3 {
    font-size: 16px;
    margin-bottom: 10px;
    color: #4CAF50;
  }
  
  .character-desc {
    font-size: 12px;
    margin-bottom: 12px;
    color: #CCC;
    font-family: Arial, sans-serif;
  }
  
  .character-stats {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 12px;
    color: #FFC107;
    font-family: Arial, sans-serif;
  }
  
  .character-ability, .character-relic {
    font-size: 11px;
    margin-bottom: 10px;
    color: #DDD;
    font-family: Arial, sans-serif;
  }
  
  .character-ability strong, .character-relic strong {
    color: #2196F3;
    display: block;
    margin-bottom: 4px;
  }
  
  .character-ability p, .character-relic p {
    margin: 0;
    color: #AAA;
  }
  
  .character-selection-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  
  .eliminated-option {
    opacity: 0.6;
  }
  
  @media (max-width: 768px) {
    .character-grid {
      flex-direction: column;
    }
    
    .character-card {
      width: 100%;
      max-width: 320px;
    }
  }
  `;
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing game");
    
    // Clear any previous session storage to force intro
    sessionStorage.removeItem('introShown');
    
    // First load game state
    loadGameState();
    
    // Then check if character is selected and show intro
    setTimeout(ensureCharacterSelected, 1000);
    
    // Set up next floor button
    document.getElementById('next-floor-btn').addEventListener('click', function() {
        goToNextFloor();
    });
    
    // Add test button for debugging
    const gameTitle = document.querySelector('.game-title');
    if (gameTitle) {
        gameTitle.innerHTML += '<button onclick="showRoentgenIntroScene()" class="btn btn-info btn-sm" style="position:absolute;right:10px;top:10px">Test Intro</button>';
    }
});
  
  // Setup main button event listeners
  function setupMainEventListeners() {
    // Next floor button
    const nextFloorBtn = document.getElementById('next-floor-btn');
    if (nextFloorBtn) {
      nextFloorBtn.addEventListener('click', goToNextFloor);
    }
    
    // Restart button in game over screen
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        window.location.href = '/';
      });
    }
  }
  
  // Function to hide all containers
  function hideAllInteractionContainers() {
    // Hide all interaction containers
    const containers = document.querySelectorAll('.interaction-container');
    containers.forEach(container => {
      container.style.display = 'none';
    });
    
    // Game over is not an interaction container but should be hidden initially
    const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
    if (gameOverContainer) {
      gameOverContainer.style.display = 'none';
    }
    
    // Make sure the game board is visible
    const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
    if (gameBoardContainer) {
      gameBoardContainer.style.display = 'block';
    }
  }
  
  // Function to show a specific container and hide others
  function showContainer(containerId) {
    hideAllInteractionContainers();
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'block';
    } else {
      console.error(`Container not found: ${containerId}`);
    }
  }
  
  // Load game state from server
  function loadGameState() {
    return new Promise((resolve, reject) => {
      fetch('/api/game-state')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log("Game state loaded:", data);
          
          // Update global game state
          gameState.character = data.character;
          gameState.currentFloor = data.current_floor;
          
          resolve(data);
        })
        .catch(error => {
          console.error('Error loading game state:', error);
          reject(error);
        });
    });
  }
  
  // Initialize the game display
  function initializeGameDisplay(gameData) {
    // Update character info
    updateCharacterInfo(gameData.character);
    
    // Update floor display
    const floorDisplay = document.getElementById('current-floor');
    if (floorDisplay) {
      floorDisplay.textContent = gameData.current_floor;
    }
    
    // Initialize the floor map
    initializeFloorMap();
    
    // Hide loading screens if any
    const loadingElements = document.querySelectorAll('.loading-screen');
    loadingElements.forEach(element => {
      element.style.display = 'none';
    });
  }
  
  // Initialize inventory in game state
  function initializeInventory() {
    if (!gameState.inventory) {
      gameState.inventory = [];
    }
    
    // Create max inventory size based on character level
    gameState.maxInventorySize = 4 + Math.floor(gameState.character?.level / 2) || 5;
    
    // Render the inventory
    renderInventory();
  }
  
  // Render inventory items in the UI
  function renderInventory() {
    const inventoryContainer = document.getElementById('inventory-items');
    if (!inventoryContainer) return;
    
    // Clear current inventory display
    inventoryContainer.innerHTML = '';
    
    // Update inventory count
    const inventoryCount = document.getElementById('inventory-count');
    if (inventoryCount) {
      inventoryCount.textContent = `${gameState.inventory.length}/${gameState.maxInventorySize}`;
    }
    
    // If inventory is empty, show a message
    if (!gameState.inventory || gameState.inventory.length === 0) {
      inventoryContainer.innerHTML = '<p class="text-muted">No items yet</p>';
      return;
    }
    
    // Create item elements
    gameState.inventory.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = `inventory-item ${item.rarity || 'common'}`;
      itemElement.setAttribute('data-index', index);
      
      // Item icon based on type
      const itemIcon = getItemIcon(item);
      itemElement.innerHTML = itemIcon;
      
      // Add tooltip with item details
      const tooltip = document.createElement('div');
      tooltip.className = 'inventory-tooltip';
      tooltip.innerHTML = `
        <div class="tooltip-title">${item.name}</div>
        <div class="tooltip-desc">${item.description}</div>
        <div class="tooltip-effect">${getEffectDescription(item.effect)}</div>
        <div class="tooltip-usage">Click to use</div>
      `;
      
      itemElement.appendChild(tooltip);
      
      // Add click event to use the item
      itemElement.addEventListener('click', () => useInventoryItem(index));
      
      inventoryContainer.appendChild(itemElement);
    });
  }
  
  // Get an appropriate icon for an item based on its type
  function getItemIcon(item) {
    if (!item) return '?';
    
    const itemIcons = {
      'textbook': '📚',
      'coffee': '☕',
      'dosimeter': '📊',
      'tg51': '📋',
      'badge': '🔰',
      'calculator': '🧮',
      'manual': '📒',
      'energy_drink': '🥤',
      'checklist': '✅',
      'reference': '📖',
      'protocol': '📝',
      'coffee_mug': '☕',
      'lucky_phantom': '👻',
      'calibrated_calculator': '🧮',
      'ncrp_badge': '🔰',
      'journal_subscription': '📰'
    };
    
    // Classify by effect type if no specific icon
    if (!itemIcons[item.id]) {
      switch (item.effect?.type) {
        case 'insight_boost':
          return '💡';
        case 'restore_life':
          return '❤️';
        case 'question_hint':
          return '❓';
        case 'category_boost':
          return '📈';
        case 'extra_life':
          return '💖';
        default:
          return '🔮';
      }
    }
    
    return itemIcons[item.id];
  }
  
  // Convert effect object to readable description
  function getEffectDescription(effect) {
    if (!effect) return 'No effect';
    
    switch (effect.type) {
      case 'insight_boost':
        return `+${effect.value} Insight`;
      case 'restore_life':
        return `Restore ${effect.value} Life`;
      case 'question_hint':
        return effect.value;
      case 'category_boost':
        return effect.value;
      case 'extra_life':
        return effect.value;
      default:
        return effect.value || 'Unknown effect';
    }
  }
  
  // Add an item to inventory
  function addItemToInventory(item) {
    if (!gameState.inventory) {
      gameState.inventory = [];
    }
    
    // Check if inventory is full
    if (gameState.inventory.length >= gameState.maxInventorySize) {
      showInventoryFullDialog(item);
      return false;
    }
    
    // Add the item
    gameState.inventory.push(item);
    
    // Show feedback
    showFloatingText(`Added ${item.name} to inventory!`, 'success');
    
    // Update inventory display
    renderInventory();
    
    return true;
  }
  
  // Show dialog for full inventory
  function showInventoryFullDialog(newItem) {
    // Create modal if it doesn't exist
    if (!document.getElementById('inventory-full-modal')) {
      const modalHTML = `
        <div id="inventory-full-modal" class="game-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h4>Inventory Full!</h4>
              <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
              <p>Your inventory is full. Would you like to:</p>
              <div id="inventory-options">
                <button id="discard-new-item" class="btn btn-danger mb-2">Discard new item</button>
                <p>Or replace an existing item:</p>
                <div id="replaceable-items" class="d-flex flex-wrap gap-2 mb-3"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const modalElement = document.createElement('div');
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement.firstChild);
      
      // Add close button functionality
      document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('inventory-full-modal').style.display = 'none';
      });
    }
    
    // Populate modal with current inventory items
    const replaceableItems = document.getElementById('replaceable-items');
    replaceableItems.innerHTML = '';
    
    gameState.inventory.forEach((item, index) => {
      const itemButton = document.createElement('button');
      itemButton.className = `inventory-item ${item.rarity || 'common'} p-2`;
      itemButton.innerHTML = `
        ${getItemIcon(item)}
        <small>${item.name}</small>
      `;
      
      // Replace existing item with new one
      itemButton.addEventListener('click', () => {
        gameState.inventory[index] = newItem;
        renderInventory();
        document.getElementById('inventory-full-modal').style.display = 'none';
        showFloatingText(`Replaced ${item.name} with ${newItem.name}!`, 'warning');
      });
      
      replaceableItems.appendChild(itemButton);
    });
    
    // Set up discard button
    document.getElementById('discard-new-item').addEventListener('click', () => {
      document.getElementById('inventory-full-modal').style.display = 'none';
      showFloatingText(`Discarded ${newItem.name}`, 'danger');
    });
    
    // Show the modal
    document.getElementById('inventory-full-modal').style.display = 'flex';
  }
  
  // Use an item from inventory
  function useInventoryItem(index) {
    if (!gameState.inventory || !gameState.inventory[index]) return;
    
    const item = gameState.inventory[index];
    
    // Apply item effect
    const effectApplied = applyItemEffect(item);
    
    // If effect was applied successfully, remove from inventory
    if (effectApplied) {
      gameState.inventory.splice(index, 1);
      renderInventory();
    }
  }
  
  // Start a new game
  function startNewGame(characterId = 'resident') {
    console.log(`Starting new game with character: ${characterId}`);
    
    fetch('/api/new-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ character_id: characterId }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Update global game state
      gameState.character = data.character;
      gameState.currentFloor = data.current_floor;
      gameState.inventory = []; // Initialize empty inventory
      
      // Initialize display
      initializeGameDisplay(data);
      
      // Initialize inventory system
      initializeInventory();
      
      // Add starting relic based on character
      addStartingRelic(characterId);
      
      // Show floor transition
      showFloorTransition(data.current_floor);
    })
    .catch(error => {
      console.error('Error starting new game:', error);
      showError(`Failed to start new game: ${error.message}`);
    });
  }
  
  // Add starting relic based on character
  function addStartingRelic(characterId) {
    let relic = null;
    
    switch (characterId) {
      case 'resident':
        relic = {
          id: 'coffee_mug',
          name: 'Coffee Mug',
          description: 'A well-worn mug that helps you stay focused.',
          rarity: 'common',
          effect: {
            type: 'restore_life',
            value: 1,
            duration: 'instant'
          }
        };
        break;
        
      case 'physicist':
        relic = {
          id: 'lucky_phantom',
          name: 'Lucky Phantom',
          description: 'This phantom has been through countless calibrations.',
          rarity: 'uncommon',
          effect: {
            type: 'question_hint',
            value: 'Eliminates one wrong answer from machine QA questions.',
            duration: 'instant'
          }
        };
        break;
        
      case 'dosimetrist':
        relic = {
          id: 'calibrated_calculator',
          name: 'Calibrated Calculator',
          description: 'This calculator seems to know the answers to dosimetry problems.',
          rarity: 'uncommon',
          effect: {
            type: 'category_boost',
            value: 'All dosimetry questions give +5 insight when answered correctly.',
            duration: 'permanent'
          }
        };
        break;
        
      case 'regulatory':
        relic = {
          id: 'ncrp_badge',
          name: 'NCRP Badge',
          description: 'A badge showing your regulatory expertise.',
          rarity: 'rare',
          effect: {
            type: 'category_boost',
            value: 'Regulatory questions give double insight.',
            duration: 'permanent'
          }
        };
        break;
        
      case 'research':
        relic = {
          id: 'journal_subscription',
          name: 'Journal Subscription',
          description: 'Access to the latest research gives you an edge.',
          rarity: 'rare',
          effect: {
            type: 'insight_boost',
            value: 10,
            duration: 'instant'
          }
        };
        break;
        
      default:
        // Default relic for unknown character type
        relic = {
          id: 'textbook',
          name: 'Physics Textbook',
          description: 'A well-worn copy of a medical physics textbook.',
          rarity: 'common',
          effect: {
            type: 'insight_boost',
            value: 5,
            duration: 'instant'
          }
        };
    }
    
    if (relic) {
      addItemToInventory(relic);
    }
  }
  
  // Function to initialize the floor map
  function initializeFloorMap() {
    console.log("Initializing floor map...");
    
    // First try to load from backend
    fetch('/api/generate-floor-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        floor_number: gameState.currentFloor || 1
      }),
    })
    .then(response => response.json())
    .then(mapData => {
      console.log("Map data received from server:", mapData);
      gameState.map = mapData;
      renderFloorMap(mapData, CONTAINER_TYPES.MAP);
    })
    .catch(error => {
      console.error('Error getting map from server, using client-side generation:', error);
      
      // Fall back to client-side generation
      const floorData = getFloorData(gameState.currentFloor || 1);
      const mapData = generateFloorMap(gameState.currentFloor || 1, floorData);
      gameState.map = mapData;
      renderFloorMap(mapData, CONTAINER_TYPES.MAP);
    });
  }
  
  // Get floor data (placeholder - ideally would come from server)
  function getFloorData(floorNumber) {
    return {
      id: floorNumber,
      name: `Floor ${floorNumber}`,
      description: `Advancing to floor ${floorNumber}...`,
      node_count: {
        min: 4 + floorNumber,
        max: 6 + floorNumber
      },
      node_types: {
        question: { weight: 60, difficulty_range: [1, Math.min(floorNumber, 3)] },
        rest: { weight: 20 },
        treasure: { weight: 20 },
        elite: { weight: floorNumber > 1 ? 15 : 0, difficulty_range: [2, 3] }
      },
      boss: floorNumber >= 3 ? {
        name: "Chief Medical Physicist",
        description: "The department head has challenging questions about QA procedures.",
        difficulty: 3
      } : null
    };
  }
  
  // Generate the map data structure
  function generateFloorMap(floorLevel, floorData) {
    console.log("Generating floor map for level", floorLevel);
    
    // Create basic structure
    const map = {
      start: { 
        id: 'start', 
        type: 'start', 
        position: { row: 0, col: Math.floor(MAP_CONFIG.nodesPerRow/2) }, 
        paths: [] 
      },
      nodes: {},
      boss: floorData.boss ? { 
        id: 'boss', 
        type: 'boss', 
        position: { row: MAP_CONFIG.rowCount + 1, col: Math.floor(MAP_CONFIG.nodesPerRow/2) }, 
        paths: [] 
      } : null
    };
    
    // Generate intermediate nodes in a grid pattern with random connections
    for (let row = 1; row <= MAP_CONFIG.rowCount; row++) {
      for (let col = 0; col < MAP_CONFIG.nodesPerRow; col++) {
        // Skip some nodes randomly to create variability
        if (Math.random() < 0.2 && row !== 1) continue;
        
        const nodeId = `node_${row}_${col}`;
        
        // Determine node type based on weights in floorData
        const nodeType = determineNodeType(floorData.node_types);
        
        // Create the node
        map.nodes[nodeId] = {
          id: nodeId,
          type: nodeType,
          position: { row, col },
          paths: [],
          visited: false,
          // For question nodes, track difficulty
          difficulty: nodeType === 'question' || nodeType === 'elite' ? 
            getRandomDifficulty(floorData.node_types[nodeType]?.difficulty_range) : 1,
          title: getNodeTitle(nodeType)
        };
      }
    }
    
    // Connect start node to first row
    const firstRowNodes = Object.values(map.nodes).filter(node => node.position.row === 1);
    firstRowNodes.forEach(node => {
      map.start.paths.push(node.id);
    });
    
    // Connect intermediate rows
    for (let row = 1; row < MAP_CONFIG.rowCount; row++) {
      const currentRowNodes = Object.values(map.nodes).filter(node => node.position.row === row);
      const nextRowNodes = Object.values(map.nodes).filter(node => node.position.row === row + 1);
      
      if (nextRowNodes.length === 0) continue;
      
      currentRowNodes.forEach(node => {
        // Each node connects to 1-2 nodes in the next row
        const connectionCount = Math.floor(Math.random() * MAP_CONFIG.branchFactor) + 1;
        
        // Sort next row nodes by proximity (column distance)
        const sortedNextNodes = [...nextRowNodes].sort((a, b) => {
          return Math.abs(a.position.col - node.position.col) - Math.abs(b.position.col - node.position.col);
        });
        
        // Connect to the closest nodes
        for (let i = 0; i < Math.min(connectionCount, sortedNextNodes.length); i++) {
          node.paths.push(sortedNextNodes[i].id);
        }
      });
    }
    
    // Connect final row to boss
    if (map.boss) {
      const finalRowNodes = Object.values(map.nodes).filter(node => node.position.row === MAP_CONFIG.rowCount);
      finalRowNodes.forEach(node => {
        node.paths.push('boss');
      });
    }
    
    return map;
  }
  
  // Helper functions for map generation
  function determineNodeType(nodeTypes) {
    const totalWeight = Object.values(nodeTypes).reduce((sum, config) => sum + (config.weight || 0), 0);
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const [type, config] of Object.entries(nodeTypes)) {
      cumulativeWeight += (config.weight || 0);
      if (random <= cumulativeWeight) {
        return type;
      }
    }
    
    return 'question'; // Default fallback
  }
  
  function getRandomDifficulty(range) {
    if (!range || range.length !== 2) return 1;
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  }
  
  function getNodeTitle(nodeType) {
    const titles = {
      'question': ['Morning Rounds', 'Case Review', 'Patient Consult', 'Treatment Planning'],
      'shop': ['Department Store', 'Campus Bookstore', 'Equipment Vendor', 'Coffee Cart'],
      'rest': ['Break Room', 'Cafeteria', 'Library', 'Quiet Corner'],
      'treasure': ['Conference', 'Journal Club', 'Grand Rounds', 'Workshop'],
      'elite': ['Physicist Meeting', 'Challenging Case', 'Equipment Failure', 'Accreditation Review'],
      'event': ['Unexpected Call', 'Patient Emergency', 'Research Opportunity', 'Department Meeting'],
      'gamble': ['Journal Lottery', 'Research Roulette', 'Grant Application', 'Experimental Treatment'],
      'boss': ['Department Chair', 'Board Exam', 'Research Presentation', 'Clinical Trial Review']
    };
    
    return titles[nodeType] ? titles[nodeType][Math.floor(Math.random() * titles[nodeType].length)] : 'Unknown';
  }
  
  // Render the map to canvas
  function renderFloorMap(mapData, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error("Canvas element not found:", canvasId);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions based on map size
    const width = Math.max(MAP_CONFIG.minWidth, MAP_CONFIG.nodesPerRow * 150);
    const height = Math.max(MAP_CONFIG.minHeight, (MAP_CONFIG.rowCount + 2) * 100);
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections first (so they appear behind nodes)
    drawConnections(ctx, mapData, width, height, true); // true for bottom-up
    
    // Draw all regular nodes
    for (const nodeId in mapData.nodes) {
      drawNode(ctx, mapData.nodes[nodeId], width, height, true); // true for bottom-up
    }
    
    // Draw start and boss nodes
    drawNode(ctx, mapData.start, width, height, true); // true for bottom-up
    if (mapData.boss) {
      drawNode(ctx, mapData.boss, width, height, true); // true for bottom-up
    }
    
    // Remove any previous click handlers and add a new one
    canvas.removeEventListener('click', handleMapClick);
    canvas.addEventListener('click', handleMapClick);
  }
  
  // Update drawConnections function to highlight used paths and fade unavailable ones
  function drawConnections(ctx, mapData, width, height, bottomUp = false) {
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    // Draw all connections
    for (const nodeId in allNodes) {
      const node = allNodes[nodeId];
      if (!node.paths || node.paths.length === 0) continue;
      
      // Calculate node position (adjust for bottom-up layout)
      let startY;
      if (bottomUp) {
        // Invert Y position for bottom-up layout
        startY = height - height * ((node.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
      } else {
        startY = height * ((node.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
      }
      
      const startX = width * ((node.position.col + 1) / (MAP_CONFIG.nodesPerRow + 1));
      
      node.paths.forEach(targetId => {
        const targetNode = allNodes[targetId];
        if (!targetNode) return;
        
        // Calculate target position (adjust for bottom-up layout)
        let endY;
        if (bottomUp) {
          // Invert Y position for bottom-up layout
          endY = height - height * ((targetNode.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
        } else {
          endY = height * ((targetNode.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
        }
        
        const endX = width * ((targetNode.position.col + 1) / (MAP_CONFIG.nodesPerRow + 1));
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        // Style the path based on status
        if (node.visited && targetNode.visited) {
          // Path has been used - make bold and darker
          ctx.strokeStyle = '#2E7D32'; // Dark green
          ctx.lineWidth = 5;
        } else if ((node.visited || nodeId === 'start') && !targetNode.visited && canVisitNode(targetId)) {
          // Available path - highlight
          ctx.strokeStyle = '#4CAF50'; // Bright green
          ctx.lineWidth = 3;
          
          // Add pulsing effect to available paths
          ctx.shadowColor = '#4CAF50';
          ctx.shadowBlur = 10;
        } else if (!node.visited && !targetNode.visited) {
          // Unavailable path - fade out
          ctx.strokeStyle = 'rgba(170, 170, 170, 0.3)'; // Faded gray
          ctx.lineWidth = 1;
        } else {
          // Default - used but can't continue
          ctx.strokeStyle = 'rgba(204, 204, 204, 0.7)'; // Light gray
          ctx.lineWidth = 2;
        }
        
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      });
    }
  }
  
  // Draw a node on the canvas
  function drawNode(ctx, node, width, height, bottomUp = false) {
    const nodeColors = {
      'start': '#4CAF50',    // Green
      'boss': '#F44336',     // Red
      'question': '#2196F3', // Blue
      'elite': '#E91E63',    // Pink
      'treasure': '#FFC107', // Amber
      'rest': '#9C27B0',     // Purple
      'shop': '#00BCD4',     // Cyan
      'event': '#FF9800',    // Orange
      'gamble': '#CDDC39'    // Lime
    };
    
    // Calculate node position (adjust for bottom-up layout)
    let y;
    if (bottomUp) {
      // Invert Y position for bottom-up layout
      y = height - height * ((node.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
    } else {
      y = height * ((node.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
    }
    
    const x = width * ((node.position.col + 1) / (MAP_CONFIG.nodesPerRow + 1));
    const radius = 20;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Style based on status
    if (gameState.currentNode === node.id) {
      // Current node - add highlight/glow
      ctx.fillStyle = nodeColors[node.type] || '#333';
      ctx.shadowColor = '#FFF';
      ctx.shadowBlur = 15;
    } else if (node.visited) {
      // Visited node
      ctx.fillStyle = '#888'; // Gray
    } else if (canVisitNode(node.id)) {
      // Available node
      ctx.fillStyle = nodeColors[node.type] || '#333';
      // Add subtle pulse for available nodes
      ctx.shadowColor = nodeColors[node.type] || '#333';
      ctx.shadowBlur = 5;
    } else {
      // Unavailable node - fade out
      const color = nodeColors[node.type] || '#333';
      ctx.fillStyle = dimColor(color, 0.3); // More transparent
    }
    
    ctx.fill();
    
    // Draw border
    if (gameState.currentNode === node.id) {
      // Current node - bold border
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 3;
    } else if (node.visited) {
      // Visited node
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
    } else if (canVisitNode(node.id)) {
      // Available node
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
    } else {
      // Unavailable node
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
    }
    
    ctx.stroke();
    
    // Draw node icon/symbol based on type
    if (gameState.currentNode === node.id || node.visited || canVisitNode(node.id)) {
      ctx.fillStyle = '#fff'; // Bright white for better visibility
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; // Faded white
    }
    
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Different symbols for different node types
    const symbols = {
      'start': 'S',
      'boss': 'B',
      'question': '?',
      'elite': '!',
      'treasure': 'T',
      'rest': 'R',
      'shop': '$',
      'event': 'E',
      'gamble': 'G'
    };
    
    ctx.fillText(symbols[node.type] || '?', x, y);
    
    // Add difficulty indicator for question and elite nodes
    if ((node.type === 'question' || node.type === 'elite') && node.difficulty) {
      if (canVisitNode(node.id) || node.visited) {
        ctx.fillStyle = '#fff';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
      }
      ctx.font = '10px Arial';
      ctx.fillText('★'.repeat(node.difficulty), x, y + radius + 10);
    }
    
    // Add node title below
    if (node.title) {
      if (canVisitNode(node.id) || node.visited || gameState.currentNode === node.id) {
        ctx.fillStyle = '#fff';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
      }
      ctx.font = '12px Arial';
      ctx.fillText(node.title, x, y + radius + 25);
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }
  
  // Map click handler
  function handleMapClick(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const mapData = gameState.map;
    if (!mapData) return;
    
    // Check if click is on any node
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    const width = canvas.width;
    const height = canvas.height;
    
    for (const nodeId in allNodes) {
      const node = allNodes[nodeId];
      
      // Skip start node (can't be clicked)
      if (nodeId === 'start') continue;
      
      // Skip already visited nodes
      if (node.visited) continue;
      
      // Calculate node position (adjust for bottom-up layout)
      let y = height - height * ((node.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
      const x = width * ((node.position.col + 1) / (MAP_CONFIG.nodesPerRow + 1));
      
      // Check if click is within node radius
      const dx = clickX - x;
      const dy = clickY - y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance <= 20 && canVisitNode(nodeId)) { // 20 is the node radius
        console.log("Clicked on node:", nodeId);
        
        // Add visual feedback for click
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // After a short delay, visit the node
        setTimeout(() => {
          visitNode(nodeId);
        }, 100);
        
        break;
      }
    }
  }
  
  // Improved function to determine if a node can be visited
  function canVisitNode(nodeId) {
    if (nodeId === 'start') return false; // Can't revisit start
    
    // Get the map data
    const mapData = gameState.map;
    if (!mapData) return false;
    
    // If this is the current node, it can't be visited
    if (getCurrentNode() === nodeId) return false;
    
    // Get the node
    const node = mapData.nodes[nodeId] || (nodeId === 'boss' ? mapData.boss : null);
    if (!node || node.visited) return false;
    
    // Check if there's a path to this node from a visited node
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    for (const sourceId in allNodes) {
      const sourceNode = allNodes[sourceId];
      if ((sourceNode.visited || sourceId === 'start') && sourceNode.paths && sourceNode.paths.includes(nodeId)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Helper function to get the current node (if any)
  function getCurrentNode() {
    return gameState.currentNode || null;
  }
  
  // Enhanced function to dim colors with adjustable opacity
  function dimColor(hex, opacity = 0.5) {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Dim by multiplying by opacity
    r = Math.floor(r * opacity);
    g = Math.floor(g * opacity);
    b = Math.floor(b * opacity);
    
    // Convert back to hex
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  
  // Node visit handling
  function visitNode(nodeId) {
    console.log(`Visiting node: ${nodeId}`);
    
    // First, clear any existing event listeners to prevent duplicates
    clearEventListeners();
    
    // Mark this as the current node
    gameState.currentNode = nodeId;
    
    fetch(`/api/node/${nodeId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(nodeData => {
        console.log("Node data:", nodeData);
        
        // Handle different node types
        if (nodeData.type === 'question' || nodeData.type === 'elite' || nodeData.type === 'boss') {
          showQuestion(nodeData);
        } else if (nodeData.type === 'treasure') {
          showTreasure(nodeData);
        } else if (nodeData.type === 'rest') {
          showRestNode(nodeData);
        } else if (nodeData.type === 'event') {
          showEvent(nodeData);
        } else if (nodeData.type === 'shop') {
          showShop(nodeData);
        } else if (nodeData.type === 'gamble') {
          showGamble(nodeData);
        } else {
          // Unknown node type
          console.error(`Unknown node type: ${nodeData.type}`);
          alert(`Unknown node type: ${nodeData.type}`);
          markNodeVisited(nodeId);
        }
        
        // Update map to highlight current node
        renderFloorMap(gameState.map, CONTAINER_TYPES.MAP);
      })
      .catch(error => {
        console.error('Error visiting node:', error);
        showError(`Failed to load node: ${error.message}`);
      });
  }
  
  // Clear event listeners to prevent duplicates
  function clearEventListeners() {
    // Clear continue button
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      const newBtn = continueBtn.cloneNode(true);
      continueBtn.parentNode.replaceChild(newBtn, continueBtn);
    }
    
    // Clear question options
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
      const newContainer = optionsContainer.cloneNode(false);
      optionsContainer.parentNode.replaceChild(newContainer, optionsContainer);
    }
    
    // Clear treasure button
    const takeTreasureBtn = document.getElementById('take-treasure-btn');
    if (takeTreasureBtn) {
      const newBtn = takeTreasureBtn.cloneNode(true);
      takeTreasureBtn.parentNode.replaceChild(newBtn, takeTreasureBtn);
    }
    
    // Clear rest buttons
    const restHealBtn = document.getElementById('rest-heal-btn');
    if (restHealBtn) {
      const newBtn = restHealBtn.cloneNode(true);
      restHealBtn.parentNode.replaceChild(newBtn, restHealBtn);
    }
    
    const restStudyBtn = document.getElementById('rest-study-btn');
    if (restStudyBtn) {
      const newBtn = restStudyBtn.cloneNode(true);
      restStudyBtn.parentNode.replaceChild(newBtn, restStudyBtn);
    }
  }
  
  // Show question node
  function showQuestion(nodeData) {
    const questionContainer = document.getElementById(CONTAINER_TYPES.QUESTION);
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultDiv = document.getElementById('question-result');
    
    // Store current question for potential item use
    gameState.currentQuestion = nodeData.question;
    
    // Reset previous question state
    questionText.textContent = nodeData.question.text;
    optionsContainer.innerHTML = '';
    resultDiv.style.display = 'none';
    
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.style.display = 'none';
    }
    
    // Add options
    nodeData.question.options.forEach((option, index) => {
      const optionBtn = document.createElement('button');
      optionBtn.classList.add('btn', 'btn-outline-primary', 'option-btn', 'mb-2', 'w-100');
      optionBtn.textContent = option;
      optionBtn.addEventListener('click', function() {
        answerQuestion(nodeData.id, index, nodeData.question);
      });
      optionsContainer.appendChild(optionBtn);
    });
    
    // Show the question container
    showContainer(CONTAINER_TYPES.QUESTION);
  }
  
  // Apply a hint to the current question
  function applyQuestionHint() {
    const questionContainer = document.getElementById(CONTAINER_TYPES.QUESTION);
    if (!questionContainer || questionContainer.style.display !== 'block') return;
    
    // Get all option buttons
    const options = document.querySelectorAll('.option-btn');
    if (!options.length) return;
    
    // Get correct answer from current question
    const currentQuestion = gameState.currentQuestion;
    if (!currentQuestion) return;
    
    // Find a wrong answer to eliminate (not the correct one)
    let wrongIndexes = [];
    for (let i = 0; i < options.length; i++) {
      if (i !== currentQuestion.correct) {
        wrongIndexes.push(i);
      }
    }
    
    // Randomly select one wrong answer to eliminate
    if (wrongIndexes.length > 0) {
      const randomWrongIndex = wrongIndexes[Math.floor(Math.random() * wrongIndexes.length)];
      const wrongOption = options[randomWrongIndex];
      
      // Cross out the wrong option
      wrongOption.classList.add('eliminated-option');
      wrongOption.innerHTML = `<s>${wrongOption.innerHTML}</s> <span class="badge bg-danger">Incorrect</span>`;
      wrongOption.disabled = true;
      
      // Show feedback
      showFloatingText("Eliminated one wrong answer!", "success");
    }
  }
  
  // Answer a question
  function answerQuestion(nodeId, answerIndex, question) {
    console.log(`Answering question for node ${nodeId}, selected option ${answerIndex}`);
    
    // Disable all options to prevent multiple submissions
    const options = document.querySelectorAll('.option-btn');
    options.forEach(opt => opt.disabled = true);
    
    fetch('/api/answer-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        node_id: nodeId, 
        answer_index: answerIndex,
        question: question
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Show result
      showQuestionResult(data, answerIndex, question);
      
      // Update game state
      if (data.game_state && data.game_state.character) {
        gameState.character = data.game_state.character;
        updateCharacterInfo(gameState.character);
      }
      
      // Check for game over
      if (gameState.character.lives <= 0) {
        // Set timeout to show the result before game over
        setTimeout(() => {
          showGameOver();
        }, 2000);
      } else {
        // Set up continue button to mark node as visited
        setupContinueButton(() => {
          markNodeVisited(nodeId);
          showContainer(CONTAINER_TYPES.MAP); // Return to map
        });
      }
    })
    .catch(error => {
      console.error('Error answering question:', error);
      showError(`Error submitting answer: ${error.message}`);
      
      // Re-enable options
      options.forEach(opt => opt.disabled = false);
    });
  }
  
  // Show question result
  function showQuestionResult(data, selectedIndex, question) {
    const resultDiv = document.getElementById('question-result');
    const continueBtn = document.getElementById('continue-btn');
    
    // Create result message
    resultDiv.innerHTML = `
      <div class="alert ${data.correct ? 'alert-success' : 'alert-danger'} mt-3">
        <strong>${data.correct ? 'Correct!' : 'Incorrect!'}</strong>
        <p>${data.explanation}</p>
        <div class="mt-2">
          ${data.correct 
            ? `<span class="badge bg-success">+${data.insight_gained || 10} Insight</span>` 
            : `<span class="badge bg-danger">-1 Life</span>`}
        </div>
      </div>
    `;
    
    // Show floating feedback
    if (data.correct) {
      showFloatingText(`+${data.insight_gained || 10} Insight`, 'success');
    } else {
      showFloatingText('-1 Life', 'danger');
    }
    
    // Highlight the selected option
    const options = document.querySelectorAll('.option-btn');
    if (options[selectedIndex]) {
      options[selectedIndex].classList.add(data.correct ? 'btn-success' : 'btn-danger');
      options[selectedIndex].classList.remove('btn-outline-primary');
    }
    
    // Highlight the correct answer if the user was wrong
    if (!data.correct && question.correct !== selectedIndex) {
      options[question.correct].classList.add('btn-success');
      options[question.correct].classList.remove('btn-outline-primary');
    }
    
    // Show result and continue button
    resultDiv.style.display = 'block';
    if (continueBtn) {
      continueBtn.style.display = 'block';
    }
  }
  
  // Show treasure node
  function showTreasure(nodeData) {
    const treasureName = document.getElementById('treasure-name');
    const treasureDesc = document.getElementById('treasure-description');
    const treasureEffect = document.getElementById('treasure-effect');
    const takeTreasureBtn = document.getElementById('take-treasure-btn');
    
    if (!treasureName || !treasureDesc || !treasureEffect || !takeTreasureBtn) {
      console.error("Treasure container elements not found");
      return;
    }
    
    if (nodeData.item) {
      treasureName.textContent = nodeData.item.name;
      treasureDesc.textContent = nodeData.item.description;
      treasureEffect.textContent = nodeData.item.effect.value;
      
      // Apply item effect when button is clicked
      takeTreasureBtn.addEventListener('click', function() {
        // Add item to inventory instead of applying effect directly
        addItemToInventory(nodeData.item);
        markNodeVisited(nodeData.id);
        showContainer(CONTAINER_TYPES.MAP); // Return to map view
      });
    } else {
      treasureName.textContent = "Empty Treasure";
      treasureDesc.textContent = "It seems someone got here before you.";
      treasureEffect.textContent = "Nothing happens.";
      
      takeTreasureBtn.addEventListener('click', function() {
        markNodeVisited(nodeData.id);
        showContainer(CONTAINER_TYPES.MAP); // Return to map view
      });
    }
    
    showContainer(CONTAINER_TYPES.TREASURE);
  }
  
  // Show rest node
  function showRestNode(nodeData) {
    const restHealBtn = document.getElementById('rest-heal-btn');
    const restStudyBtn = document.getElementById('rest-study-btn');
    
    if (!restHealBtn || !restStudyBtn) {
      console.error("Rest container elements not found");
      return;
    }
    
    restHealBtn.addEventListener('click', function() {
      // Heal 1 life
      gameState.character.lives = Math.min(
        gameState.character.lives + 1,
        gameState.character.max_lives
      );
      
      markNodeVisited(nodeData.id);
      updateCharacterInfo(gameState.character);
      showContainer(CONTAINER_TYPES.MAP); // Return to map view
      
      showFloatingText('+1 Life', 'success');
    });
    
    restStudyBtn.addEventListener('click', function() {
      // Gain 5 insight
      gameState.character.insight += 5;
      
      markNodeVisited(nodeData.id);
      updateCharacterInfo(gameState.character);
      showContainer(CONTAINER_TYPES.MAP); // Return to map view
      
      showFloatingText('+5 Insight', 'info');
    });
    
    showContainer(CONTAINER_TYPES.REST);
  }
  
  // Show event node (placeholder implementation)
  function showEvent(nodeData) {
    // Create event container if it doesn't exist
    if (!document.getElementById(CONTAINER_TYPES.EVENT)) {
      const eventContainer = document.createElement('div');
      eventContainer.id = CONTAINER_TYPES.EVENT;
      eventContainer.className = 'interaction-container';
      eventContainer.innerHTML = `
        <h3 id="event-title">Event</h3>
        <p id="event-description"></p>
        <div id="event-options" class="mt-3"></div>
      `;
      document.querySelector('.col-md-9').appendChild(eventContainer);
    }
    
    // Update event content
    document.getElementById('event-title').textContent = nodeData.event?.title || 'Random Event';
    document.getElementById('event-description').textContent = nodeData.event?.description || 'A random event has occurred!';
    
    // Populate event options
    const eventsContainer = document.getElementById('event-options');
    eventsContainer.innerHTML = '';
    
    if (nodeData.event?.options && nodeData.event.options.length) {
      nodeData.event.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'btn btn-outline-warning mb-2 w-100';
        optionBtn.textContent = option.text;
        
        optionBtn.addEventListener('click', function() {
          handleEventOption(nodeData.id, index, option);
        });
        
        eventsContainer.appendChild(optionBtn);
      });
    } else {
      // Default option if no options provided
      const continueBtn = document.createElement('button');
      continueBtn.className = 'btn btn-warning';
      continueBtn.textContent = 'Continue';
      
      continueBtn.addEventListener('click', function() {
        markNodeVisited(nodeData.id);
        showContainer(CONTAINER_TYPES.MAP);
      });
      
      eventsContainer.appendChild(continueBtn);
    }
    
    showContainer(CONTAINER_TYPES.EVENT);
  }
  
  // Handle event option selection
  function handleEventOption(nodeId, optionIndex, option) {
    console.log(`Selected event option ${optionIndex} for node ${nodeId}`);
    
    // For now, just apply the effect and mark visited
    if (option.outcome && option.outcome.effect) {
      applyEventEffect(option.outcome.effect);
    }
    
    // Show outcome
    const eventContainer = document.getElementById(CONTAINER_TYPES.EVENT);
    eventContainer.innerHTML = `
      <h3>Outcome</h3>
      <p>${option.outcome && option.outcome.description ? option.outcome.description : 'You made your choice.'}</p>
      <button id="event-continue" class="btn btn-warning mt-3">Continue</button>
    `;
    
    document.getElementById('event-continue').addEventListener('click', function() {
      markNodeVisited(nodeId);
      showContainer(CONTAINER_TYPES.MAP);
    });
  }
  
  // Apply event effect
  function applyEventEffect(effect) {
    if (!effect) return;
    
    let message = '';
    
    switch (effect.type) {
      case 'insight_gain':
        gameState.character.insight += parseInt(effect.value || 0);
        message = `+${effect.value} Insight`;
        break;
      case 'insight_loss':
        gameState.character.insight = Math.max(0, gameState.character.insight - parseInt(effect.value || 0));
        message = `-${effect.value} Insight`;
        break;
      case 'gain_life':
        gameState.character.lives = Math.min(gameState.character.lives + parseInt(effect.value || 0), gameState.character.max_lives);
        message = `+${effect.value} Life`;
        break;
      case 'lose_life':
        gameState.character.lives = Math.max(0, gameState.character.lives - parseInt(effect.value || 0));
        message = `-${effect.value} Life`;
        break;
      case 'gain_item':
        message = `Gained item: ${effect.value}`;
        break;
      default:
        message = `Effect: ${effect.type}`;
        break;
    }
    
    // Update character display
    updateCharacterInfo(gameState.character);
    
    // Show feedback
    showFloatingText(message, effect.type.includes('gain') ? 'success' : 'warning');
    
    // Check for game over
    if (gameState.character.lives <= 0) {
      setTimeout(() => {
        showGameOver();
      }, 2000);
    }
  }
  
  // Show shop node (placeholder implementation)
  function showShop(nodeData) {
    // Create shop container if it doesn't exist
    if (!document.getElementById(CONTAINER_TYPES.SHOP)) {
      const shopContainer = document.createElement('div');
      shopContainer.id = CONTAINER_TYPES.SHOP;
      shopContainer.className = 'interaction-container';
      shopContainer.innerHTML = `
        <h3>Department Store</h3>
        <p>Welcome to the store! You can spend your insight points on these items.</p>
        <div id="shop-items" class="mt-3"></div>
        <button id="shop-close" class="btn btn-outline-secondary mt-3">Leave Shop</button>
      `;
      document.querySelector('.col-md-9').appendChild(shopContainer);
    }
    
    // For now, just show a simple shop interface
    const shopItemsContainer = document.getElementById('shop-items');
    shopItemsContainer.innerHTML = '<p>Coming soon! The shop will be implemented in the next update.</p>';
    
    document.getElementById('shop-close').addEventListener('click', function() {
      markNodeVisited(nodeData.id);
      showContainer(CONTAINER_TYPES.MAP);
    });
    
    showContainer(CONTAINER_TYPES.SHOP);
  }
  
  // Show gamble node (placeholder implementation)
  function showGamble(nodeData) {
    // Placeholder for gamble node
    alert("Gamble node - coming soon!");
    markNodeVisited(nodeData.id);
    showContainer(CONTAINER_TYPES.MAP);
  }
  
  // Apply an item effect
  function applyItemEffect(item) {
    if (!item || !item.effect) return false;
    
    const effect = item.effect;
    let message = '';
    let success = true;
    
    switch (effect.type) {
      case 'insight_boost':
        gameState.character.insight += parseInt(effect.value);
        message = `+${effect.value} Insight`;
        break;
        
      case 'restore_life':
        // Only use if not at full health
        if (gameState.character.lives < gameState.character.max_lives) {
          gameState.character.lives = Math.min(
            gameState.character.lives + parseInt(effect.value),
            gameState.character.max_lives
          );
          message = `+${effect.value} Life`;
        } else {
          message = "Already at full health!";
          success = false;
        }
        break;
        
      case 'extra_life':
        gameState.character.max_lives += 1;
        gameState.character.lives += 1;
        message = '+1 Max Life';
        break;
        
      case 'question_hint':
        // If not in a question, can't use this
        if (!gameState.currentNode || 
            !document.getElementById('question-container').style.display === 'block') {
          message = "Can only use during a question!";
          success = false;
        } else {
          message = "Hint applied!";
          // Apply hint logic would go here (e.g., eliminate one wrong answer)
          applyQuestionHint();
        }
        break;
        
      case 'category_boost':
        message = `Activated: ${effect.value}`;
        // Save the category boost for future questions
        if (!gameState.activeEffects) gameState.activeEffects = [];
        gameState.activeEffects.push({
          type: 'category_boost',
          value: effect.value,
          duration: effect.duration || 'floor'
        });
        break;
        
      default:
        message = `Used: ${item.name}`;
        break;
    }
    
    // Update character display if successful
    if (success) {
      updateCharacterInfo(gameState.character);
      
      // Show feedback
      showFloatingText(message, success ? 'success' : 'warning');
    } else {
      showFloatingText(message, 'warning');
    }
    
    return success;
  }
  
  // Function to mark a node as visited
  function markNodeVisited(nodeId) {
    // Update local game state
    if (gameState.map && gameState.map.nodes && gameState.map.nodes[nodeId]) {
      gameState.map.nodes[nodeId].visited = true;
    } else if (gameState.map && gameState.map.boss && gameState.map.boss.id === nodeId) {
      gameState.map.boss.visited = true;
    }
    
    // Clear current node
    gameState.currentNode = null;
    
    // Update on server
    fetch('/api/mark-node-visited', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ node_id: nodeId }),
    })
    .then(response => response.json())
    .then(data => {
      // Check if all nodes are visited
      if (data.all_nodes_visited) {
        // Show next floor button
        const nextFloorBtn = document.getElementById('next-floor-btn');
        if (nextFloorBtn) {
          nextFloorBtn.style.display = 'block';
        }
      }
      
      // Render the updated map
      renderFloorMap(gameState.map, CONTAINER_TYPES.MAP);
    })
    .catch(error => console.error('Error marking node as visited:', error));
  }
  
  // Go to the next floor
  function goToNextFloor() {
    console.log("Going to next floor...");
    
    fetch('/api/next-floor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Update global game state
      gameState.character = data.character;
      gameState.currentFloor = data.current_floor;
      gameState.currentNode = null;
      gameState.map = null;  // Clear map so new one will be generated
      
      // Update UI
      updateCharacterInfo(data.character);
      document.getElementById('current-floor').textContent = data.current_floor;
      
      // Hide next floor button
      const nextFloorBtn = document.getElementById('next-floor-btn');
      if (nextFloorBtn) {
        nextFloorBtn.style.display = 'none';
      }
      
      // Show floor transition
      showFloorTransition(data.current_floor);
      
      // Initialize new floor map
      initializeFloorMap();
    })
    .catch(error => {
      console.error('Error going to next floor:', error);
      showError(`Failed to advance to next floor: ${error.message}`);
    });
  }
  
  // Floor transition animation
  function showFloorTransition(floorNumber) {
    // Create transition element
    const transitionDiv = document.createElement('div');
    transitionDiv.className = 'floor-transition-screen';
    
    // Get floor data for description
    const floorData = getFloorData(floorNumber);
    const floorTitle = floorData.name || `Floor ${floorNumber}`;
    const floorDescription = floorData.description || "Advancing to next floor...";
    
    transitionDiv.innerHTML = `
      <div class="floor-title">${floorTitle}</div>
      <div class="floor-description">${floorDescription}</div>
    `;
    
    // Add to DOM
    document.body.appendChild(transitionDiv);
    
    // Remove after animation completes
    setTimeout(() => {
      transitionDiv.remove();
    }, 3000);
  }
  
  // Update character info display
  function updateCharacterInfo(character) {
    if (!character) return;
    
    const charInfoHtml = `
      <p><strong>Name:</strong> ${character.name}</p>
      <p><strong>Level:</strong> ${character.level}</p>
      <p><strong>Insight:</strong> ${character.insight}</p>
    `;
    
    const charInfoElement = document.getElementById('character-info');
    if (charInfoElement) {
      charInfoElement.innerHTML = charInfoHtml;
    }
    
    // Update lives visualization
    updateLivesDisplay(character.lives, character.max_lives);
    
    // Update special ability if available
    updateSpecialAbility(character.special_ability);
  }
  
  // Update lives display
  function updateLivesDisplay(lives, maxLives) {
    const livesContainer = document.getElementById('lives-container');
    if (!livesContainer) return;
    
    livesContainer.innerHTML = '';
    for (let i = 0; i < maxLives; i++) {
      const lifeIcon = document.createElement('span');
      lifeIcon.className = i < lives ? 'life-icon active' : 'life-icon inactive';
      lifeIcon.innerHTML = i < lives ? '❤️' : '🖤';
      livesContainer.appendChild(lifeIcon);
    }
  }
  
  // Update special ability display
  function updateSpecialAbility(specialAbility) {
    const abilityContainer = document.getElementById('ability-container');
    if (!abilityContainer || !specialAbility) return;
    
    abilityContainer.innerHTML = `
      <div class="card">
        <div class="card-header">Special Ability</div>
        <div class="card-body">
          <h5>${specialAbility.name}</h5>
          <p>${specialAbility.description}</p>
          <button class="btn btn-secondary ability-button" id="use-ability-btn">
            Use Ability (${specialAbility.uses_per_floor} remaining)
          </button>
        </div>
      </div>
    `;
    
    // Add event listener for ability use
    document.getElementById('use-ability-btn').addEventListener('click', useSpecialAbility);
  }
  
  // Use special ability (placeholder)
  function useSpecialAbility() {
    alert("Special ability used! This feature is coming soon.");
    // Disable the button after use
    const abilityBtn = document.getElementById('use-ability-btn');
    if (abilityBtn) {
      abilityBtn.disabled = true;
      abilityBtn.textContent = "Used (0 remaining)";
    }
  }
  
  // Show game over screen
  function showGameOver() {
    // Update final score
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement) {
      finalScoreElement.textContent = gameState.character.insight;
    }
    
    // Hide game board
    const gameBoardContainer = document.getElementById(CONTAINER_TYPES.GAME_BOARD);
    if (gameBoardContainer) {
      gameBoardContainer.style.display = 'none';
    }
    
    // Show game over
    const gameOverContainer = document.getElementById(CONTAINER_TYPES.GAME_OVER);
    if (gameOverContainer) {
      gameOverContainer.style.display = 'block';
    }
  }
  
  // Helper function to show floating text feedback
  function showFloatingText(text, type = 'info') {
    const floatingText = document.createElement('div');
    floatingText.className = `floating-text floating-text-${type}`;
    floatingText.textContent = text;
    document.body.appendChild(floatingText);
    
    // Remove after animation completes
    setTimeout(() => {
      floatingText.classList.add('floating-text-fade');
      setTimeout(() => {
        document.body.removeChild(floatingText);
      }, 1000);
    }, 1000);
  }
  
  // Show error message
  function showError(message) {
    console.error(message);
    alert(message);
  }
  
  // Generic event handler for continue button
  function setupContinueButton(onContinue) {
    const continueBtn = document.getElementById('continue-btn');
    if (!continueBtn) return;
    
    continueBtn.style.display = 'block';
    continueBtn.addEventListener('click', onContinue);
  }
  
  // Simplified reset game function
  function resetGame() {
    if (confirm("Are you sure you want to reset the game? All progress will be lost.")) {
      window.location.href = '/game';
    }
  }
  
  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  // HTML template for character selection screen
  const CHARACTER_SELECTION_HTML = `
  <div id="character-selection" class="character-selection-screen">
    <h2>Select Your Character</h2>
    <p>Choose your medical physics specialist</p>
    
    <div class="character-grid">
      <div class="character-card" data-character-id="resident">
        <div class="character-icon">
          /-\\
          |+|
         /---\\
          | |
         / | \\
        </div>
        <h3>Medical Physics Resident</h3>
        <p class="character-desc">A new resident with balanced stats and a focus on learning.</p>
        <div class="character-stats">
          <div><strong>Lives:</strong> 3</div>
          <div><strong>Insight:</strong> 20</div>
        </div>
        <div class="character-ability">
          <strong>Special Ability:</strong> Literature Review
          <p>Once per floor, can skip a question node without penalty.</p>
        </div>
        <div class="character-relic">
          <strong>Starting Relic:</strong> Coffee Mug
          <p>Can stay awake for one extra question when exhausted.</p>
        </div>
      </div>
      
      <div class="character-card" data-character-id="physicist">
        <div class="character-icon">
          .---.
          |QA!|
         /----\\
          | |
         /   \\
        </div>
        <h3>QA Specialist</h3>
        <p class="character-desc">More experienced with quality assurance but fewer lives.</p>
        <div class="character-stats">
          <div><strong>Lives:</strong> 2</div>
          <div><strong>Insight:</strong> 30</div>
        </div>
        <div class="character-ability">
          <strong>Special Ability:</strong> Measurement Uncertainty
          <p>Can retry one failed question per floor.</p>
        </div>
        <div class="character-relic">
          <strong>Starting Relic:</strong> Lucky Phantom
          <p>50% chance to auto-pass machine QA questions.</p>
        </div>
      </div>
      
      <div class="character-card" data-character-id="dosimetrist">
        <div class="character-icon">
          _/|\\_
          (o o)
         /-----\\
          || ||
         /|   |\\
        </div>
        <h3>Dosimetry Wizard</h3>
        <p class="character-desc">Expert in treatment planning with high insight but fragile.</p>
        <div class="character-stats">
          <div><strong>Lives:</strong> 2</div>
          <div><strong>Insight:</strong> 35</div>
        </div>
        <div class="character-ability">
          <strong>Special Ability:</strong> Calculation Shortcut
          <p>Dosimetry questions show one eliminated answer.</p>
        </div>
        <div class="character-relic">
          <strong>Starting Relic:</strong> Calibrated Calculator
          <p>Auto-solves basic dose calculations.</p>
        </div>
      </div>
      
      <div class="character-card" data-character-id="regulatory">
        <div class="character-icon">
          .-"-.
          |TPS|
         /-----\\
          | |
         / | \\
        </div>
        <h3>Regulatory Expert</h3>
        <p class="character-desc">Specializes in regulations with high survivability.</p>
        <div class="character-stats">
          <div><strong>Lives:</strong> 4</div>
          <div><strong>Insight:</strong> 15</div>
        </div>
        <div class="character-ability">
          <strong>Special Ability:</strong> Citation Ready
          <p>References give double insight points.</p>
        </div>
        <div class="character-relic">
          <strong>Starting Relic:</strong> NCRP Badge
          <p>Can skip one regulation question per run.</p>
        </div>
      </div>
      
      <div class="character-card" data-character-id="research">
        <div class="character-icon">
          .-^-.
          |ABR|
         /-----\\
          | |
         / | \\
        </div>
        <h3>Research Physicist</h3>
        <p class="character-desc">Focuses on theoretical knowledge with unique abilities.</p>
        <div class="character-stats">
          <div><strong>Lives:</strong> 3</div>
          <div><strong>Insight:</strong> 25</div>
        </div>
        <div class="character-ability">
          <strong>Special Ability:</strong> Experimental Approach
          <p>10% chance to gain double insight from questions.</p>
        </div>
        <div class="character-relic">
          <strong>Starting Relic:</strong> Journal Subscription
          <p>Each floor contains one additional treasure node.</p>
        </div>
      </div>
    </div>
    
    <div class="character-selection-buttons">
      <button id="select-character-btn" class="btn btn-success">Start Journey</button>
      <button id="random-character-btn" class="btn btn-primary">Random Selection</button>
      <button id="back-to-menu-btn" class="btn btn-secondary">Back to Menu</button>
    </div>
  </div>
  `;
  
  // Show character selection screen
  function showCharacterSelection() {
    // Create character selection screen if not exists
    if (!document.getElementById('character-selection')) {
      const selectionElement = document.createElement('div');
      selectionElement.innerHTML = CHARACTER_SELECTION_HTML;
      document.body.appendChild(selectionElement.firstChild);
      
      // Add event listeners
      setupCharacterSelectionEvents();
    } else {
      // Show existing selection screen
      document.getElementById('character-selection').style.display = 'flex';
    }
  }
  
  // Set up event listeners for character selection
  function setupCharacterSelectionEvents() {
    // Character card selection
    const characterCards = document.querySelectorAll('.character-card');
    let selectedCharacterId = 'resident'; // Default selection
    
    characterCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove selected class from all cards
        characterCards.forEach(c => c.classList.remove('selected'));
        
        // Add selected class to this card
        card.classList.add('selected');
        
        // Update selected character ID
        selectedCharacterId = card.getAttribute('data-character-id');
      });
    });
    
    // Select first character by default
    if (characterCards.length > 0) {
      characterCards[0].classList.add('selected');
    }
    
    // Start game button
    const selectBtn = document.getElementById('select-character-btn');
    if (selectBtn) {
      selectBtn.addEventListener('click', () => {
        startGameWithCharacter(selectedCharacterId);
      });
    }
    
    // Random character button
    const randomBtn = document.getElementById('random-character-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * characterCards.length);
        
        // Remove selected class from all cards
        characterCards.forEach(c => c.classList.remove('selected'));
        
        // Add selected class to random card
        characterCards[randomIndex].classList.add('selected');
        
        // Update selected character ID
        selectedCharacterId = characterCards[randomIndex].getAttribute('data-character-id');
        
        // Add visual feedback
        const card = characterCards[randomIndex];
        card.style.animation = 'pulse 0.5s';
        setTimeout(() => { card.style.animation = ''; }, 500);
      });
    }
    
    // Back to menu button
    const backBtn = document.getElementById('back-to-menu-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        document.getElementById('character-selection').style.display = 'none';
      });
    }
  }
  
  // Start a new game with the selected character
  function startGameWithCharacter(characterId) {
    console.log(`Starting new game with character: ${characterId}`);
    
    // Hide character selection screen
    const selectionScreen = document.getElementById('character-selection');
    if (selectionScreen) {
      selectionScreen.style.display = 'none';
    }
    
    // Show loading indicator
    showFloatingText('Preparing your journey...', 'info');
    
    // Start new game with selected character
    startNewGame(characterId);
  }
  
  // Check if the character selection should be shown on load
  function checkShowCharacterSelection() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('select') === 'true') {
      // Remove the parameter from URL to avoid showing selection again on refresh
      window.history.replaceState({}, document.title, '/game');
      // Show character selection
      setTimeout(() => {
        showCharacterSelection();
      }, 500); // Short delay to ensure everything is loaded
    }
  }
  // ASCII character animation
  function addCharacterAnimation() {
    const characterContainer = document.createElement('div');
    characterContainer.className = 'ascii-character bobbing';
    
    // Different ASCII art based on character type
    const isPhysicist = gameState.character && gameState.character.name === 'Junior Physicist';
    
    // ASCII art for the character (stylized lab coat person)
    const asciiArt = isPhysicist ? 
    `   .---.
    |   |
    /|\\__|/\\
  / |  O| \\
  /__|___|\\_\\
    |   |
    |___|
    /   \\
    /     \\` : 
    `   .---.
    |   |
    /|\\_O_/|\\
  / |   | \\
  /__|___|_\\
    |   |
    |___|
    /   \\
    /     \\`;

    characterContainer.innerText = asciiArt;
    
    // Add to the character info section
    const characterInfo = document.getElementById('character-info');
    if (characterInfo && characterInfo.parentNode) {
      characterInfo.parentNode.insertBefore(characterContainer, characterInfo);
    }
    
    // Toggle between bobbing and walking on floor change
    document.getElementById('next-floor-btn').addEventListener('click', function() {
      characterContainer.classList.remove('bobbing');
      characterContainer.classList.add('walking');
      
      setTimeout(() => {
        characterContainer.classList.remove('walking');
        characterContainer.classList.add('bobbing');
      }, 3000); // Return to bobbing after 3 seconds
    });
  }

  // Initialize the animation when the game loads
  document.addEventListener('DOMContentLoaded', function() {
    const existingInit = window.loadGameState;
    window.loadGameState = function() {
      existingInit.apply(this, arguments);
      
      // Add the character animation after loading game state
      setTimeout(addCharacterAnimation, 500);
    };
  });

  // Walking animation frames (for more advanced animation)
  const walkingFrames = [
    `   .---.
    |   |
    /|\\_O_/|\\
  / |   | \\
  /__|___|_\\
    |   |
    | _ |
    /|   |\\
  / |   | \\`,
    
    `   .---.
    |   |
    /|\\_O_/|\\
  / |   | \\
  /__|___|_\\
    |   |
    |___|
    /  |  \\
  /   |   \\`,
    
    `   .---.
    |   |
    /|\\_O_/|\\
  / |   | \\
  /__|___|_\\
    |   |
    |___|
    | _ |
    /|   |\\`,
    
    `   .---.
    |   |
    /|\\_O_/|\\
  / |   | \\
  /__|___|_\\
    |   |
    |___|
    /|   |\\
  / |   | \\`
  ];

  // Add to game.js

  // Roentgen's Ghost Intro Scene
  function showRoentgenIntroScene() {
    // Create modal for the intro scene
    const modal = document.createElement('div');
    modal.className = 'game-modal intro-scene';
    modal.style.display = 'flex';
    modal.style.zIndex = '2000';
    
    // ASCII art for Roentgen's ghost
    const roentgenAscii = 
    `    .-.-.
    (_o_o_)
    /   ^   \\
  |  \\_-_/  |
  |   | |   |~~~~~
  |   | |   |
    \\  \\_/  /
    '.___.'
    X-RAYS`;

    // Content of the intro scene
    modal.innerHTML = `
      <div class="modal-content intro-content">
        <h2 class="intro-title">A Ghostly Encounter</h2>
        
        <div class="ghost-animation">${roentgenAscii}</div>
        
        <div class="intro-text">
          <p>"Greetings, young physicist. I am the spirit of Wilhelm Röntgen, discoverer of X-rays."</p>
          <p>"Your journey through medical physics residency will be challenging, but with the right knowledge and tools, you will succeed."</p>
          <p>"Allow me to offer you a gift to aid you on your quest. Choose wisely, for each has its unique benefits."</p>
        </div>
        
        <div class="item-selection">
          <h3>Select a Starting Relic:</h3>
          <div class="relic-options">
            <div class="relic-option">
              <h4>Ancient Textbook</h4>
              <p>A well-worn copy of pioneering radiation research.</p>
              <p class="effect">Effect: Start with +15 insight points.</p>
              <button class="btn btn-primary select-relic" data-relic="textbook">Select</button>
            </div>
            
            <div class="relic-option">
              <h4>Pocket Dosimeter</h4>
              <p>An antique but reliable radiation measurement tool.</p>
              <p class="effect">Effect: Questions reveal one incorrect answer option.</p>
              <button class="btn btn-primary select-relic" data-relic="dosimeter">Select</button>
            </div>
            
            <div class="relic-option">
              <h4>Röntgen's Notebook</h4>
              <p>Personal notes from the father of diagnostic radiology.</p>
              <p class="effect">Effect: Gain an extra life.</p>
              <button class="btn btn-primary select-relic" data-relic="notebook">Select</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners to relic selection buttons
    modal.querySelectorAll('.select-relic').forEach(button => {
      button.addEventListener('click', function() {
        const relicId = this.getAttribute('data-relic');
        selectStartingRelic(relicId, modal);
      });
    });
    
    // Add CSS for the intro scene
    const style = document.createElement('style');
    style.textContent = `
      .intro-content {
        max-width: 800px;
        width: 80%;
        background-color: #f8f9fa;
        border: 2px solid #6c757d;
        border-radius: 15px;
        padding: 30px;
        box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
      }
      
      .intro-title {
        color: #3498db;
        text-align: center;
        margin-bottom: 20px;
        font-size: 28px;
      }
      
      .intro-text {
        font-size: 18px;
        margin: 20px 0;
        line-height: 1.6;
      }
      
      .intro-text p {
        margin-bottom: 15px;
      }
      
      .item-selection h3 {
        color: #9b59b6;
        text-align: center;
        margin: 30px 0 20px;
      }
      
      .relic-options {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
      }
      
      .relic-option {
        flex: 1;
        min-width: 200px;
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 15px;
        background-color: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .relic-option:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      }
      
      .relic-option h4 {
        color: #2c3e50;
        margin-bottom: 10px;
      }
      
      .relic-option .effect {
        color: #e67e22;
        font-weight: bold;
        margin: 15px 0;
      }
      
      .select-relic {
        width: 100%;
        margin-top: 10px;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Function to handle relic selection
  function selectStartingRelic(relicId, modal) {
    // Apply relic effect
    switch (relicId) {
      case 'textbook':
        gameState.character.insight += 15;
        gameState.inventory.push({
          id: "textbook",
          name: "Ancient Textbook",
          description: "A well-worn copy of pioneering radiation research.",
          rarity: "uncommon",
          effect: {
            type: "insight_boost",
            value: "Start with +15 insight points."
          }
        });
        break;
        
      case 'dosimeter':
        // Add the dosimeter to inventory
        gameState.inventory.push({
          id: "dosimeter",
          name: "Pocket Dosimeter",
          description: "An antique but reliable radiation measurement tool.",
          rarity: "rare",
          effect: {
            type: "question_hint",
            value: "Questions reveal one incorrect answer option."
          }
        });
        // Set a flag to show hints
        gameState.showQuestionHints = true;
        break;
        
      case 'notebook':
        // Add extra life
        gameState.character.max_lives += 1;
        gameState.character.lives += 1;
        gameState.inventory.push({
          id: "notebook",
          name: "Röntgen's Notebook",
          description: "Personal notes from the father of diagnostic radiology.",
          rarity: "epic",
          effect: {
            type: "extra_life",
            value: "Gain an extra life."
          }
        });
        break;
    }
    
    // Update the UI
    updateCharacterInfo(gameState.character);
    updateInventoryUI();
    
    // Show a completion message
    const content = modal.querySelector('.modal-content');
    content.innerHTML = `
      <h2 class="intro-title">Ready to Begin</h2>
      
      <div class="ghost-animation">${content.querySelector('.ghost-animation').innerHTML}</div>
      
      <div class="intro-text">
        <p>"Excellent choice. This will serve you well on your journey."</p>
        <p>"Remember, the path of a medical physicist is one of constant learning and adaptation."</p>
        <p>"I'll be watching your progress. Good luck, young physicist!"</p>
      </div>
      
      <button class="btn btn-success begin-journey">Begin Your Residency</button>
    `;
    
    // Add event listener to the begin button
    content.querySelector('.begin-journey').addEventListener('click', function() {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
        
        // Show a floor transition after a short delay
        setTimeout(() => {
          showFloorTransition(gameState.currentFloor, "Hospital Basement", "Your first day as a resident. Learn the basics in the safe environment of the basement.");
        }, 500);
      }, 500);
    });
  }
  // Add this to ensure a character is selected before game starts
  function ensureCharacterSelected() {
    console.log("Checking if character is selected");
    
    // If no character in gameState, select default
    if (!gameState.character || !gameState.character.name) {
        console.log("No character selected, using default");
        
        // Call the API to initialize with default character
        fetch('/api/new-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ character_id: 'resident' }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("New game started with default character");
            gameState = data;
            updateCharacterInfo(gameState.character);
            document.getElementById('current-floor').textContent = gameState.current_floor;
            
            // Now show the intro scene
            setTimeout(showRoentgenIntroScene, 500);
        })
        .catch(error => console.error('Error starting new game:', error));
    } else {
        // Character exists, proceed normally
        console.log("Character already selected:", gameState.character.name);
        setTimeout(showRoentgenIntroScene, 500);
    }
  }
    // Modified floor transition to include description
    function showFloorTransition(floorNumber, floorName, floorDescription) {
      const transitionScreen = document.createElement('div');
      transitionScreen.className = 'floor-transition-screen';
      
      transitionScreen.innerHTML = `
        <h1 class="floor-title">Floor ${floorNumber}</h1>
        <h2 class="floor-subtitle">${floorName}</h2>
        <p class="floor-description">${floorDescription}</p>
      `;
      
      document.body.appendChild(transitionScreen);
      
      // Remove after animation completes
      setTimeout(() => {
        transitionScreen.remove();
      }, 3000);
    }

  // Hook into game initialization to show intro
  document.addEventListener('DOMContentLoaded', function() {
    // Store the original loadGameState function
    const originalLoadGameState = window.loadGameState;
    
    // Replace with our version that shows the intro
    window.loadGameState = function() {
      originalLoadGameState.apply(this, arguments);
      
      // Show intro after a short delay (only on first load)
      if (!sessionStorage.getItem('introShown')) {
        setTimeout(() => {
          showRoentgenIntroScene();
          sessionStorage.setItem('introShown', 'true');
        }, 1000);
      }
    };
  });
}