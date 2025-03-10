// Updated initialization code for game.js

// Game state with expanded structure
let gameState = {
    character: {},
    currentFloor: 1,
    nodes: [],
    map: null,          // Floor map data
    currentNode: null,  // Currently visiting node ID
    inventory: [],      // Player's items
    statusEffects: [],  // Active buffs/debuffs
    runStats: {         // Stats for the current run
        floorsCompleted: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        itemsFound: 0,
        insightGained: 0
    }
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    
    // Set up next floor button
    document.getElementById('next-floor-btn').addEventListener('click', function() {
        goToNextFloor();
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // ESC key to close modals
        if (event.key === 'Escape') {
            // Close any open modals or containers
            const containers = document.querySelectorAll('.interaction-container');
            containers.forEach(container => {
                if (container.style.display === 'block') {
                    container.style.display = 'none';
                    
                    // If a node was being visited, mark it as visited
                    if (gameState.currentNode) {
                        markNodeVisited(gameState.currentNode);
                        gameState.currentNode = null;
                    }
                }
            });
        }
    });
});

// Initialize the game
function initializeGame() {
    loadGameState();
}

// Load the current game state
function loadGameState() {
    fetch('/api/game-state')
        .then(response => response.json())
        .then(data => {
            gameState = {
                ...gameState,
                character: data.character,
                currentFloor: data.current_floor,
                nodes: data.nodes
            };
            
            updateCharacterInfo(data.character);
            document.getElementById('current-floor').textContent = data.current_floor;
            
            // Initialize inventory if not present
            if (!gameState.inventory) {
                gameState.inventory = [];
            }
            
            // Update inventory UI
            updateInventoryUI();
            
            // Generate and render floor map
            generateFloorMap();
        })
        .catch(error => console.error('Error loading game state:', error));
}

// Generate floor map
function generateFloorMap() {
    fetch('/api/generate-floor-map', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(mapData => {
        gameState.map = mapData;
        renderFloorMap(mapData, 'floor-map');
    })
    .catch(error => console.error('Error generating floor map:', error));
}

// Update character info display with enhanced UI
function updateCharacterInfo(character) {
    const insightPercentage = Math.min(100, character.insight / 2); // Scale for visual bar
    const healthPercentage = (character.lives / character.max_lives) * 100;
    
    const charInfoHtml = `
        <p><strong>Name:</strong> ${character.name}</p>
        <p><strong>Level:</strong> ${character.level}</p>
        
        <p class="mb-1"><strong>Lives:</strong> ${character.lives}/${character.max_lives}</p>
        <div class="stat-bar-container">
            <div class="stat-bar health-bar" style="width: ${healthPercentage}%"></div>
        </div>
        
        <p class="mb-1 mt-2"><strong>Insight:</strong> ${character.insight}</p>
        <div class="stat-bar-container">
            <div class="stat-bar insight-bar" style="width: ${insightPercentage}%"></div>
        </div>
    `;
    document.getElementById('character-info').innerHTML = charInfoHtml;
    
    // Update lives visualization
    const livesContainer = document.getElementById('lives-container');
    if (livesContainer) {
        livesContainer.innerHTML = '';
        for (let i = 0; i < character.max_lives; i++) {
            const lifeIcon = document.createElement('span');
            lifeIcon.className = i < character.lives ? 'life-icon active' : 'life-icon';
            lifeIcon.innerHTML = '❤️';
            livesContainer.appendChild(lifeIcon);
        }
    }
    
    // Update special ability button if character has one
    if (character.special_ability) {
        const abilityContainer = document.getElementById('ability-container');
        abilityContainer.innerHTML = `
            <button id="special-ability-btn" class="ability-button w-100" title="${character.special_ability.description}">
                ${character.special_ability.name}
                <span class="badge bg-secondary">${character.special_ability.uses_per_floor} use${character.special_ability.uses_per_floor !== 1 ? 's' : ''} per floor</span>
            </button>
        `;
        
        // Add event listener for ability button
        document.getElementById('special-ability-btn').addEventListener('click', function() {
            useSpecialAbility(character.special_ability);
        });
    }
}

// Update inventory UI
function updateInventoryUI() {
    const container = document.getElementById('inventory-items');
    const countElement = document.getElementById('inventory-count');
    
    if (!gameState.inventory || gameState.inventory.length === 0) {
        container.innerHTML = '<p class="text-muted">No items yet</p>';
        countElement.textContent = '0/5';
        return;
    }
    
    // Update count
    countElement.textContent = `${gameState.inventory.length}/5`;
    
    // Clear container
    container.innerHTML = '';
    
    // Add items
    gameState.inventory.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item ${item.rarity}`;
        
        // Different symbols for different item types
        const symbols = {
            'textbook': '📚',
            'coffee': '☕',
            'dosimeter': '📏',
            'tg51': '📄',
            'badge': '🏅'
        };
        
        itemElement.innerHTML = `
            <span>${symbols[item.id] || '❓'}</span>
            <div class="inventory-tooltip">${item.name}</div>
        `;
        
        // Add click event to show item details
        itemElement.addEventListener('click', function() {
            showItemDetails(item);
        });
        
        container.appendChild(itemElement);
    });
}

// Show item details
function showItemDetails(item) {
    // Create modal for item details
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.id = 'item-details-modal';
    
    const rarityClass = {
        'common': 'text-secondary',
        'uncommon': 'text-info',
        'rare': 'text-primary',
        'epic': 'text-warning'
    };
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title ${rarityClass[item.rarity] || ''}">${item.name}</h5>
                <button type="button" class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <p>${item.description}</p>
                <div class="alert alert-info">
                    <strong>Effect:</strong> ${item.effect.value}
                </div>
                <p><small>Rarity: ${capitalizeFirstLetter(item.rarity)}</small></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary close-modal-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Add close event listeners
    modal.querySelector('.close-modal').addEventListener('click', function() {
        modal.remove();
    });
    
    modal.querySelector('.close-modal-btn').addEventListener('click', function() {
        modal.remove();
    });
    
    // Close on click outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Use special ability
function useSpecialAbility(ability) {
    // Handle different ability types
    switch (ability.name) {
        case 'Literature Review':
            // Skip a question node without penalty
            showToast('Ability used: Literature Review - You can skip a question node without penalty.', 'info');
            // This would need additional logic to implement
            break;
            
        case 'Peer Review':
            // See the correct answer for one question
            showToast('Ability used: Peer Review - You will see the correct answer for your next question.', 'info');
            // Set a flag in game state
            gameState.peerReviewActive = true;
            break;
            
        default:
            console.log('Unknown ability:', ability.name);
    }
    
    // Disable ability button
    document.getElementById('special-ability-btn').disabled = true;
}

// Show a toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize the toast (would need Bootstrap JS)
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after animation
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Check floor progress
function checkFloorProgress() {
    // If using map system, check if boss is accessible
    if (gameState.map && gameState.map.boss) {
        const bossAccessible = canVisitNode('boss');
        
        if (bossAccessible) {
            document.getElementById('next-floor-btn').style.display = 'block';
        }
    } else {
        // Old system: check if all nodes are visited
        const allVisited = gameState.nodes.every(node => node.visited);
        
        if (allVisited) {
            document.getElementById('next-floor-btn').style.display = 'block';
        }
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add to game.js

// Map generation parameters
const MAP_CONFIG = {
    nodesPerRow: 3,    // Number of nodes horizontally
    rowCount: 5,       // Number of rows (excluding start/boss)
    branchFactor: 2,   // How many paths forward each node can have
    minWidth: 800,     // Minimum canvas width
    minHeight: 600     // Minimum canvas height
  };
  
  function generateFloorMap(floorLevel, floorData) {
    // Create basic structure
    const map = {
      start: { id: 'start', type: 'start', position: { row: 0, col: 1 }, paths: [] },
      nodes: {},
      boss: floorData.boss ? { id: 'boss', type: 'boss', position: { row: MAP_CONFIG.rowCount + 1, col: 1 }, paths: [] } : null
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
    
    // Connect paths between nodes
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
  
  // Helper functions
  function determineNodeType(nodeTypes) {
    const totalWeight = Object.values(nodeTypes).reduce((sum, config) => sum + config.weight, 0);
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const [type, config] of Object.entries(nodeTypes)) {
      cumulativeWeight += config.weight;
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
  
  // Render the map to a canvas element
  function renderFloorMap(mapData, canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions based on map size
    const width = Math.max(MAP_CONFIG.minWidth, MAP_CONFIG.nodesPerRow * 150);
    const height = Math.max(MAP_CONFIG.minHeight, (MAP_CONFIG.rowCount + 2) * 100);
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections first (so they appear behind nodes)
    drawConnections(ctx, mapData, width, height);
    
    // Draw all regular nodes
    for (const nodeId in mapData.nodes) {
      drawNode(ctx, mapData.nodes[nodeId], width, height);
    }
    
    // Draw start and boss nodes
    drawNode(ctx, mapData.start, width, height);
    if (mapData.boss) {
      drawNode(ctx, mapData.boss, width, height);
    }
  }
  
  function drawConnections(ctx, mapData, width, height) {
    const allNodes = { ...mapData.nodes };
    if (mapData.start) allNodes['start'] = mapData.start;
    if (mapData.boss) allNodes['boss'] = mapData.boss;
    
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 3;
    
    // Draw all connections
    for (const nodeId in allNodes) {
      const node = allNodes[nodeId];
      if (!node.paths || node.paths.length === 0) continue;
      
      const startX = width * ((node.position.col + 1) / (MAP_CONFIG.nodesPerRow + 1));
      const startY = height * ((node.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
      
      node.paths.forEach(targetId => {
        const targetNode = allNodes[targetId];
        if (!targetNode) return;
        
        const endX = width * ((targetNode.position.col + 1) / (MAP_CONFIG.nodesPerRow + 1));
        const endY = height * ((targetNode.position.row + 0.5) / (MAP_CONFIG.rowCount + 2));
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        // If the path is available to travel (both nodes are either unvisited or the first is visited)
        if (!node.visited && !targetNode.visited && getCurrentNode() === null) {
          ctx.strokeStyle = '#aaa'; // Unavailable
        } else if ((node.visited || nodeId === 'start') && !targetNode.visited) {
          ctx.strokeStyle = '#4CAF50'; // Available
        } else {
          ctx.strokeStyle = '#ccc'; // Already traveled
        }
        
        ctx.stroke();
      });
    }
  }
  
  function drawNode(ctx, node, width, height) {
    const nodeColors = {
      'start': '#4CAF50',
      'boss': '#F44336',
      'question': '#2196F3',
      'elite': '#E91E63',
      'treasure': '#FFC107',
      'rest': '#9C27B0',
      'shop': '#00BCD4',
      'event': '#FF9800',
      'gamble': '#CDDC39'
    };
    
    const x = width * ((node.position.col + 1) / (MAP_CONFIG.nodesPerRow + 1));
    const y = height * ((node.position.row +.5) / (MAP_CONFIG.rowCount + 2));
    const radius = 20;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Fill based on type and status
    if (node.visited) {
      ctx.fillStyle = '#888'; // Visited
    } else if (canVisitNode(node.id)) {
      ctx.fillStyle = nodeColors[node.type] || '#333';
    } else {
      // Apply a dimmed version of the node color
      const color = nodeColors[node.type] || '#333';
      ctx.fillStyle = dimColor(color);
    }
    
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw node icon/symbol based on type
    ctx.fillStyle = '#fff';
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
      ctx.font = '10px Arial';
      ctx.fillText(node.difficulty, x, y + radius + 10);
    }
    
    // Add node title below
    if (node.title) {
      ctx.font = '12px Arial';
      ctx.fillText(node.title, x, y + radius + 20);
    }
    
    // Add click handler for the node
    canvas.addEventListener('click', function(event) {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      const dx = clickX - x;
      const dy = clickY - y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance <= radius && canVisitNode(node.id)) {
        visitNode(node.id);
      }
    });
  }
  
  // Helper function to determine if a node can be visited
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
  
  // Helper function to dim a color
  function dimColor(hex) {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Dim by multiplying by 0.5
    r = Math.floor(r * 0.5);
    g = Math.floor(g * 0.5);
    b = Math.floor(b * 0.5);
    
    // Convert back to hex
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }


// Add to game.js

// Shop functionality
function showShop(nodeData) {
    const shopContainer = document.createElement('div');
    shopContainer.id = 'shop-container';
    shopContainer.className = 'interaction-container';
    
    // Create shop content
    shopContainer.innerHTML = `
        <h3>Department Store</h3>
        <p>You have ${gameState.character.insight} insight points to spend.</p>
        <div id="shop-items"></div>
        <button id="leave-shop-btn" class="btn btn-secondary mt-3">Leave Shop</button>
    `;
    
    // Add to DOM
    document.querySelector('.col-md-9').appendChild(shopContainer);
    
    // Hide other interaction containers
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('treasure-container').style.display = 'none';
    document.getElementById('rest-container').style.display = 'none';
    
    // Show shop container
    shopContainer.style.display = 'block';
    
    // Get shop items (3-5 random items)
    generateShopItems();
    
    // Handle leave button
    document.getElementById('leave-shop-btn').addEventListener('click', function() {
        shopContainer.style.display = 'none';
        
        // Mark node as visited
        markNodeVisited(nodeData.id);
    });
}

function generateShopItems() {
    // Fetch all items and filter/select some for the shop
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            const items = data.items || [];
            const shopItems = [];
            
            // Select 3-5 random items
            const itemCount = Math.floor(Math.random() * 3) + 3;
            
            // Fisher-Yates shuffle algorithm
            const shuffled = [...items];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Take first n items
            for (let i = 0; i < Math.min(itemCount, shuffled.length); i++) {
                const item = shuffled[i];
                
                // Add price based on rarity
                const rarityPrices = {
                    'common': 25,
                    'uncommon': 50,
                    'rare': 75,
                    'epic': 100
                };
                
                const basePrice = rarityPrices[item.rarity] || 50;
                // Add some random variation to prices
                const price = Math.floor(basePrice * (0.8 + Math.random() * 0.4));
                
                shopItems.push({
                    ...item,
                    price
                });
            }
            
            renderShopItems(shopItems);
        })
        .catch(error => {
            console.error('Error fetching items:', error);
            document.getElementById('shop-items').innerHTML = '<p>No items available.</p>';
        });
}

function renderShopItems(items) {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<p>No items available.</p>';
        return;
    }
    
    // Create a card for each item
    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'card mb-3';
        
        const rarityColorClass = {
            'common': 'text-secondary',
            'uncommon': 'text-info',
            'rare': 'text-primary',
            'epic': 'text-warning'
        };
        
        const canAfford = gameState.character.insight >= item.price;
        
        itemCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title ${rarityColorClass[item.rarity] || ''}">${item.name}</h5>
                <p class="card-text">${item.description}</p>
                <div class="alert alert-info">
                    <strong>Effect:</strong> ${item.effect.value}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">${item.price} insight</span>
                    <button class="btn btn-success buy-item-btn" data-item-id="${item.id}" 
                        ${canAfford ? '' : 'disabled'}>
                        ${canAfford ? 'Purchase' : 'Not enough insight'}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(itemCard);
    });
    
    // Add event listeners to buy buttons
    document.querySelectorAll('.buy-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            const item = items.find(i => i.id === itemId);
            
            if (item && gameState.character.insight >= item.price) {
                // Purchase the item
                gameState.character.insight -= item.price;
                
                // Apply item effect
                applyItemEffect(item);
                
                // Update UI
                updateCharacterInfo(gameState.character);
                
                // Remove the item from the shop
                this.closest('.card').remove();
                
                // Show purchase message
                const message = document.createElement('div');
                message.className = 'alert alert-success mt-3';
                message.textContent = `You purchased ${item.name}!`;
                container.prepend(message);
                
                // Remove message after 3 seconds
                setTimeout(() => message.remove(), 3000);
                
                // Update shop message
                document.querySelector('#shop-container p').textContent = 
                    `You have ${gameState.character.insight} insight points to spend.`;
                
                // Disable buy buttons if can't afford
                document.querySelectorAll('.buy-item-btn').forEach(button => {
                    const buttonItem = items.find(i => i.id === button.getAttribute('data-item-id'));
                    if (buttonItem && gameState.character.insight < buttonItem.price) {
                        button.disabled = true;
                        button.textContent = 'Not enough insight';
                    }
                });
            }
        });
    });
}

// Random Event functionality
function showEvent(nodeData) {
    // Generate a random event
    fetch('/api/random-event')
        .then(response => response.json())
        .then(eventData => {
            displayEvent(eventData);
        })
        .catch(error => {
            console.error('Error fetching random event:', error);
            // Fallback to hardcoded event if API fails
            const fallbackEvent = {
                title: "Unexpected Discovery",
                description: "While reviewing patient data, you notice an unusual pattern in the treatment outcomes.",
                options: [
                    {
                        text: "Investigate further (requires technical knowledge)",
                        outcome: {
                            description: "Your investigation reveals a potential improvement to the treatment protocol. The department is impressed by your diligence.",
                            effect: {
                                type: "insight_gain",
                                value: 15
                            }
                        },
                        requirementType: "insight_check",
                        requirementValue: 30
                    },
                    {
                        text: "Consult with a senior physicist",
                        outcome: {
                            description: "The senior physicist appreciates your caution. Together, you verify the finding, which proves to be significant but not groundbreaking.",
                            effect: {
                                type: "insight_gain",
                                value: 10
                            }
                        }
                    },
                    {
                        text: "Ignore it as a statistical anomaly",
                        outcome: {
                            description: "Later, a colleague makes the same observation and publishes a paper on it. You missed an opportunity.",
                            effect: {
                                type: "insight_loss",
                                value: 5
                            }
                        }
                    }
                ]
            };
            
            displayEvent(fallbackEvent);
        });
}

function displayEvent(eventData) {
    const eventContainer = document.createElement('div');
    eventContainer.id = 'event-container';
    eventContainer.className = 'interaction-container';
    
    // Create event content
    eventContainer.innerHTML = `
        <h3>${eventData.title}</h3>
        <p>${eventData.description}</p>
        <div id="event-options"></div>
    `;
    
    // Add to DOM
    document.querySelector('.col-md-9').appendChild(eventContainer);
    
    // Hide other interaction containers
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('treasure-container').style.display = 'none';
    document.getElementById('rest-container').style.display = 'none';
    
    // Show event container
    eventContainer.style.display = 'block';
    
    // Add options
    const optionsContainer = document.getElementById('event-options');
    
    eventData.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'btn btn-outline-primary mt-2 w-100 text-start';
        
        // Check if the option has requirements
        let canChoose = true;
        let requirementText = '';
        
        if (option.requirementType && option.requirementValue) {
            if (option.requirementType === 'insight_check') {
                canChoose = gameState.character.insight >= option.requirementValue;
                requirementText = `(Requires ${option.requirementValue} insight)`;
            } else if (option.requirementType === 'item_check') {
                // Check if player has the item
                canChoose = gameState.inventory && gameState.inventory.some(item => item.id === option.requirementValue);
                requirementText = `(Requires specific item)`;
            }
        }
        
        optionButton.textContent = `${option.text} ${requirementText}`;
        
        if (!canChoose) {
            optionButton.disabled = true;
            optionButton.classList.add('text-muted');
        }
        
        optionButton.addEventListener('click', function() {
            handleEventChoice(eventData, option);
        });
        
        optionsContainer.appendChild(optionButton);
    });
}

function handleEventChoice(eventData, selectedOption) {
    const eventContainer = document.getElementById('event-container');
    const outcome = selectedOption.outcome;
    
    // Clear options
    document.getElementById('event-options').innerHTML = '';
    
    // Display outcome
    const outcomeElement = document.createElement('div');
    outcomeElement.className = 'alert alert-info mt-3';
    outcomeElement.innerHTML = `
        <p>${outcome.description}</p>
    `;
    eventContainer.appendChild(outcomeElement);
    
    // Apply effect
    if (outcome.effect) {
        applyEventEffect(outcome.effect);
    }
    
    // Add continue button
    const continueButton = document.createElement('button');
    continueButton.id = 'continue-event-btn';
    continueButton.className = 'btn btn-primary mt-3';
    continueButton.textContent = 'Continue';
    
    continueButton.addEventListener('click', function() {
        eventContainer.style.display = 'none';
        
        // Mark node as visited
        const nodeId = eventData.nodeId;
        markNodeVisited(nodeId);
    });
    
    eventContainer.appendChild(continueButton);
}

function applyEventEffect(effect) {
    switch (effect.type) {
        case 'insight_gain':
            gameState.character.insight += effect.value;
            displayFloatingText(`+${effect.value} insight`, 'success');
            break;
        case 'insight_loss':
            gameState.character.insight = Math.max(0, gameState.character.insight - effect.value);
            displayFloatingText(`-${effect.value} insight`, 'danger');
            break;
        case 'gain_life':
            gameState.character.lives = Math.min(
                gameState.character.lives + effect.value,
                gameState.character.max_lives
            );
            displayFloatingText(`+${effect.value} life`, 'success');
            break;
        case 'lose_life':
            gameState.character.lives = Math.max(0, gameState.character.lives - effect.value);
            displayFloatingText(`-${effect.value} life`, 'danger');
            
            // Check for game over
            if (gameState.character.lives <= 0) {
                setTimeout(() => {
                    showGameOver();
                }, 1000);
            }
            break;
        case 'gain_item':
            // This would need an API to get the item by ID
            fetch(`/api/item/${effect.value}`)
                .then(response => response.json())
                .then(item => {
                    // Add item to inventory
                    if (!gameState.inventory) gameState.inventory = [];
                    gameState.inventory.push(item);
                    
                    displayFloatingText(`Gained item: ${item.name}`, 'info');
                })
                .catch(error => console.error('Error fetching item:', error));
            break;
    }
    
    // Update UI
    updateCharacterInfo(gameState.character);
}

// Gamble node functionality
function showGamble(nodeData) {
    const gambleContainer = document.createElement('div');
    gambleContainer.id = 'gamble-container';
    gambleContainer.className = 'interaction-container';
    
    // Create gamble content
    gambleContainer.innerHTML = `
        <h3>Research Roulette</h3>
        <p>You can gamble your insight points for a chance at greater rewards... or losses.</p>
        
        <div class="gamble-options">
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Safe Bet</h5>
                    <p class="card-text">Stake 10 insight points.</p>
                    <p><strong>Odds:</strong> 60% to win 15 points (net +5)<br>40% to lose your stake</p>
                    <button class="btn btn-outline-primary gamble-btn" data-stake="10" data-win-chance="0.6" data-win-amount="15">Place Bet</button>
                </div>
            </div>
            
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Moderate Risk</h5>
                    <p class="card-text">Stake 20 insight points.</p>
                    <p><strong>Odds:</strong> 50% to win 40 points (net +20)<br>50% to lose your stake</p>
                    <button class="btn btn-outline-warning gamble-btn" data-stake="20" data-win-chance="0.5" data-win-amount="40">Place Bet</button>
                </div>
            </div>
            
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">High Risk</h5>
                    <p class="card-text">Stake 30 insight points.</p>
                    <p><strong>Odds:</strong> 30% to win 90 points (net +60)<br>70% to lose your stake</p>
                    <button class="btn btn-outline-danger gamble-btn" data-stake="30" data-win-chance="0.3" data-win-amount="90">Place Bet</button>
                </div>
            </div>
        </div>
        
        <div id="gamble-result" class="mt-3" style="display: none;"></div>
        
        <button id="leave-gamble-btn" class="btn btn-secondary mt-3">Leave Without Gambling</button>
    `;
    
    // Add to DOM
    document.querySelector('.col-md-9').appendChild(gambleContainer);
    
    // Hide other interaction containers
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('treasure-container').style.display = 'none';
    document.getElementById('rest-container').style.display = 'none';
    
    // Show gamble container
    gambleContainer.style.display = 'block';
    
    // Add event listeners to gamble buttons
    document.querySelectorAll('.gamble-btn').forEach(btn => {
        const stake = parseInt(btn.getAttribute('data-stake'));
        
        // Disable button if not enough insight
        if (gameState.character.insight < stake) {
            btn.disabled = true;
            btn.textContent = 'Not enough insight';
        }
        
        btn.addEventListener('click', function() {
            const winChance = parseFloat(this.getAttribute('data-win-chance'));
            const winAmount = parseInt(this.getAttribute('data-win-amount'));
            
            // Process the gamble
            processGamble(stake, winChance, winAmount);
            
            // Disable all gamble buttons after a choice is made
            document.querySelectorAll('.gamble-btn').forEach(button => {
                button.disabled = true;
            });
        });
    });
    
    // Handle leave button
    document.getElementById('leave-gamble-btn').addEventListener('click', function() {
        gambleContainer.style.display = 'none';
        
        // Mark node as visited
        markNodeVisited(nodeData.id);
    });
}

function processGamble(stake, winChance, winAmount) {
    // Deduct the stake
    gameState.character.insight -= stake;
    
    // Determine outcome
    const isWin = Math.random() < winChance;
    
    // Update insight based on outcome
    if (isWin) {
        gameState.character.insight += winAmount;
    }
    
    // Display result
    const resultContainer = document.getElementById('gamble-result');
    resultContainer.style.display = 'block';
    
    if (isWin) {
        resultContainer.innerHTML = `
            <div class="alert alert-success">
                <h4>Success!</h4>
                <p>Your research gamble paid off! You gained ${winAmount} insight points.</p>
                <p>Net change: +${winAmount - stake} insight</p>
            </div>
        `;
        
        // Show floating text
        displayFloatingText(`+${winAmount - stake} insight`, 'success');
    } else {
        resultContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4>Failure!</h4>
                <p>Your research gamble didn't pan out. You lost your stake of ${stake} insight points.</p>
                <p>Net change: -${stake} insight</p>
            </div>
        `;
        
        // Show floating text
        displayFloatingText(`-${stake} insight`, 'danger');
    }
    
    // Change the leave button to "Continue"
    document.getElementById('leave-gamble-btn').textContent = 'Continue';
    
    // Update character info
    updateCharacterInfo(gameState.character);
}

// Helper function to mark a node as visited
function markNodeVisited(nodeId) {
    // Find the node
    const node = gameState.map.nodes[nodeId];
    if (node) {
        node.visited = true;
    }
    
    // Update the game state through API
    fetch('/api/mark-node-visited', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            node_id: nodeId
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Update game state and UI
        gameState = data.game_state;
        updateCharacterInfo(gameState.character);
        
        // Check if all nodes are visited or if a path to the boss is available
        checkFloorProgress();
    })
    .catch(error => console.error('Error marking node as visited:', error));
}

// Display floating text for effects
function displayFloatingText(text, type) {
    const floatingText = document.createElement('div');
    floatingText.className = `floating-text floating-text-${type}`;
    floatingText.textContent = text;
    
    document.body.appendChild(floatingText);
    
    // Animate and remove
    setTimeout(() => {
        floatingText.classList.add('floating-text-fade');
        setTimeout(() => {
            floatingText.remove();
        }, 1000);
    }, 100);
}