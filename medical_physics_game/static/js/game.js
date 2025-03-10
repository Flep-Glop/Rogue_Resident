// game.js - Main game logic

// Game state
let gameState = {
    character: {},
    currentFloor: 1,
    nodes: []
};

function hideAllInteractionContainers() {
    const containers = document.querySelectorAll('.interaction-container');
    containers.forEach(container => {
        container.style.display = 'none';
    });
    
    // Also hide game over if visible
    document.getElementById('game-over-container').style.display = 'none';
}

// Call this at the beginning of initialization
document.addEventListener('DOMContentLoaded', function() {
    hideAllInteractionContainers();
    loadGameState();
    
    // Set up next floor button
    document.getElementById('next-floor-btn').addEventListener('click', function() {
        goToNextFloor();
    });
});
// Add near the top of your game.js file
console.log = function(message) {
    // Keep the original console.log functionality
    window._originalConsoleLog = window._originalConsoleLog || console.log;
    window._originalConsoleLog.apply(console, arguments);
    
    // Add visible debugging on the page
    const debugDiv = document.getElementById('debug-output') || 
        (function() {
            const div = document.createElement('div');
            div.id = 'debug-output';
            div.style.position = 'fixed';
            div.style.bottom = '10px';
            div.style.right = '10px';
            div.style.backgroundColor = 'rgba(0,0,0,0.7)';
            div.style.color = 'white';
            div.style.padding = '10px';
            div.style.maxHeight = '200px';
            div.style.overflowY = 'scroll';
            div.style.zIndex = '9999';
            document.body.appendChild(div);
            return div;
        })();
    
    debugDiv.innerHTML += `<div>${message}</div>`;
};

// Add to generateFloorMap function
function generateFloorMap() {
    console.log("Attempting to generate floor map...");
    
    // Use a simpler approach for testing
    const mapData = {
        "start": {"id": "start", "type": "start", "position": {"row": 0, "col": 2}, "paths": ["node_1", "node_2"]},
        "nodes": {
            "node_1": {"id": "node_1", "type": "question", "position": {"row": 1, "col": 1}, "paths": [], "visited": false},
            "node_2": {"id": "node_2", "type": "rest", "position": {"row": 1, "col": 3}, "paths": [], "visited": false}
        },
        "boss": null
    };
    
    console.log("Creating test map data");
    gameState.map = mapData;
    
    // Test render function
    renderFloorMap(mapData, 'floor-map');
    
    return;
    
    // Original code can be skipped for now
    fetch('/api/generate-floor-map', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(mapData => {
        console.log("Map data received:", mapData);
        gameState.map = mapData;
        renderFloorMap(mapData, 'floor-map');
    })
    .catch(error => console.error('Error generating floor map:', error));
}
// Load the current game state
function loadGameState() {
    fetch('/api/game-state')
        .then(response => response.json())
        .then(data => {
            gameState = data;
            updateCharacterInfo(data.character);
            document.getElementById('current-floor').textContent = data.current_floor;
            renderNodes(data.nodes);
        })
        .catch(error => console.error('Error loading game state:', error));
}

// Update character info display
function updateCharacterInfo(character) {
    const charInfoHtml = `
        <p><strong>Name:</strong> ${character.name}</p>
        <p><strong>Level:</strong> ${character.level}</p>
        <p><strong>Lives:</strong> ${character.lives}/${character.max_lives}</p>
        <p><strong>Insight:</strong> ${character.insight}</p>
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
}

// Render the nodes for the current floor
function renderNodes(nodes) {
    const nodesContainer = document.getElementById('nodes-container');
    nodesContainer.innerHTML = '';
    
    nodes.forEach(node => {
        const nodeClass = `node-card node-${node.type} ${node.visited ? 'visited' : ''}`;
        const difficultyStars = '★'.repeat(node.difficulty || 0);
        
        const nodeHtml = `
            <div class="${nodeClass}" data-node-id="${node.id}">
                <div class="node-title">${node.title}</div>
                <div class="node-type">${capitalizeFirstLetter(node.type)}</div>
                <div class="node-difficulty">
                    ${difficultyStars}
                </div>
            </div>
        `;
        nodesContainer.innerHTML += nodeHtml;
    });
    
    // Add click event listeners
    document.querySelectorAll('.node-card:not(.visited)').forEach(nodeEl => {
        nodeEl.addEventListener('click', function() {
            const nodeId = this.getAttribute('data-node-id');
            visitNode(nodeId);
        });
    });
    
    // Check if all nodes are visited
    const allVisited = nodes.every(node => node.visited);
    const nextFloorBtn = document.getElementById('next-floor-btn');
    
    if (allVisited && nextFloorBtn) {
        nextFloorBtn.style.display = 'block';
    } else if (nextFloorBtn) {
        nextFloorBtn.style.display = 'none';
    }
}

// Visit a node
function visitNode(nodeId) {
    fetch(`/api/node/${nodeId}`)
        .then(response => response.json())
        .then(nodeData => {
            // Handle different node types
            if (nodeData.type === 'question' || nodeData.type === 'elite' || nodeData.type === 'boss') {
                showQuestion(nodeData);
            } else if (nodeData.type === 'treasure') {
                showTreasure(nodeData);
            } else if (nodeData.type === 'rest') {
                useRestNode(nodeData);
            } else {
                // Handle other node types
                alert(`Visiting ${nodeData.type} node: ${nodeData.title}`);
                // Mark as visited and reload
                loadGameState();
            }
        })
        .catch(error => console.error('Error visiting node:', error));
}

// Show a question
function showQuestion(nodeData) {
    const questionContainer = document.getElementById('question-container');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    
    // Display the question
    questionText.textContent = nodeData.question.text;
    optionsContainer.innerHTML = '';
    
    // Add options
    nodeData.question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.classList.add('option-btn');
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', function() {
            answerQuestion(nodeData.id, index, nodeData.question);
        });
        optionsContainer.appendChild(optionBtn);
    });
    
    // Hide any other containers
    document.getElementById('treasure-container').style.display = 'none';
    document.getElementById('rest-container').style.display = 'none';
    
    // Show the question container
    questionContainer.style.display = 'block';
}

// Show treasure
function showTreasure(nodeData) {
    const treasureContainer = document.getElementById('treasure-container');
    const treasureName = document.getElementById('treasure-name');
    const treasureDesc = document.getElementById('treasure-description');
    const treasureEffect = document.getElementById('treasure-effect');
    
    if (nodeData.item) {
        treasureName.textContent = nodeData.item.name;
        treasureDesc.textContent = nodeData.item.description;
        treasureEffect.textContent = nodeData.item.effect.value;
        
        // Apply item effect (simplified)
        document.getElementById('take-treasure-btn').addEventListener('click', function() {
            treasureContainer.style.display = 'none';
            
            // Mark node as visited
            const node = gameState.nodes.find(n => n.id === nodeData.id);
            if (node) {
                node.visited = true;
            }
            
            // Apply effect
            if (nodeData.item.effect.type === 'insight_boost') {
                gameState.character.insight += parseInt(nodeData.item.effect.value);
            } else if (nodeData.item.effect.type === 'restore_life') {
                gameState.character.lives = Math.min(
                    gameState.character.lives + parseInt(nodeData.item.effect.value),
                    gameState.character.max_lives
                );
            } else if (nodeData.item.effect.type === 'extra_life') {
                gameState.character.max_lives += 1;
                gameState.character.lives += 1;
            }
            
            // Update UI
            updateCharacterInfo(gameState.character);
            renderNodes(gameState.nodes);
        });
    } else {
        treasureName.textContent = "Empty Treasure";
        treasureDesc.textContent = "It seems someone got here before you.";
        treasureEffect.textContent = "Nothing happens.";
    }
    
    // Hide any other containers
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('rest-container').style.display = 'none';
    
    // Show the treasure container
    treasureContainer.style.display = 'block';
}

// Use rest node
function useRestNode(nodeData) {
    const restContainer = document.getElementById('rest-container');
    
    // Set up rest actions
    document.getElementById('rest-heal-btn').addEventListener('click', function() {
        // Heal 1 life
        gameState.character.lives = Math.min(
            gameState.character.lives + 1,
            gameState.character.max_lives
        );
        
        // Mark node as visited
        const node = gameState.nodes.find(n => n.id === nodeData.id);
        if (node) {
            node.visited = true;
        }
        
        // Hide rest container
        restContainer.style.display = 'none';
        
        // Update UI
        updateCharacterInfo(gameState.character);
        renderNodes(gameState.nodes);
    });
    
    document.getElementById('rest-study-btn').addEventListener('click', function() {
        // Gain 5 insight
        gameState.character.insight += 5;
        
        // Mark node as visited
        const node = gameState.nodes.find(n => n.id === nodeData.id);
        if (node) {
            node.visited = true;
        }
        
        // Hide rest container
        restContainer.style.display = 'none';
        
        // Update UI
        updateCharacterInfo(gameState.character);
        renderNodes(gameState.nodes);
    });
    
    // Hide any other containers
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('treasure-container').style.display = 'none';
    
    // Show the rest container
    restContainer.style.display = 'block';
}

// Answer a question
function answerQuestion(nodeId, answerIndex, question) {
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
    .then(response => response.json())
    .then(data => {
        // Show result
        const resultDiv = document.getElementById('question-result');
        resultDiv.innerHTML = `
            <div class="alert ${data.correct ? 'alert-success' : 'alert-danger'} mt-3">
                <strong>${data.correct ? 'Correct!' : 'Incorrect!'}</strong>
                <p>${data.explanation}</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // Highlight the selected option
        const options = document.querySelectorAll('.option-btn');
        options[answerIndex].classList.add(data.correct ? 'correct' : 'incorrect');
        
        // Disable all options
        options.forEach(opt => opt.disabled = true);
        
        // Show continue button
        document.getElementById('continue-btn').style.display = 'block';
        document.getElementById('continue-btn').addEventListener('click', function() {
            // Reset and hide question container
            document.getElementById('question-container').style.display = 'none';
            document.getElementById('question-result').style.display = 'none';
            document.getElementById('continue-btn').style.display = 'none';
            
            // Update game state
            gameState = data.game_state;
            updateCharacterInfo(data.game_state.character);
            renderNodes(data.game_state.nodes);
            
            // Check for game over
            if (data.game_state.character.lives <= 0) {
                showGameOver();
            }
        });
    })
    .catch(error => console.error('Error answering question:', error));
}

// Show game over screen
function showGameOver() {
    document.getElementById('game-over-container').style.display = 'block';
    document.getElementById('game-board-container').style.display = 'none';
    
    document.getElementById('restart-btn').addEventListener('click', function() {
        window.location.href = '/';
    });
}

// Go to the next floor
function goToNextFloor() {
    fetch('/api/next-floor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(data => {
        gameState = data;
        updateCharacterInfo(data.character);
        document.getElementById('current-floor').textContent = data.current_floor;
        renderNodes(data.nodes);
        
        // Hide next floor button
        document.getElementById('next-floor-btn').style.display = 'none';
        
        // Show floor transition animation
        showFloorTransition(data.current_floor);
    })
    .catch(error => console.error('Error going to next floor:', error));
}

// Show floor transition
function showFloorTransition(floorNumber) {
    const transitionDiv = document.createElement('div');
    transitionDiv.className = 'floor-transition';
    transitionDiv.innerHTML = `<h2>Floor ${floorNumber}</h2>`;
    document.body.appendChild(transitionDiv);
    
    setTimeout(() => {
        transitionDiv.classList.add('fade-out');
        setTimeout(() => {
            transitionDiv.remove();
        }, 1000);
    }, 2000);
}

// Add to your game.js
function resetGame() {
    window.location.href = '/game';
}

// Add a button to your HTML (can be temporary for debugging)
document.querySelector('.game-title').innerHTML += '<button onclick="resetGame()" style="position:absolute;right:10px;top:10px">Reset Game</button>';
<button onclick="testMap()" class="btn btn-warning">Test Map</button>
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
    console.log("Generating floor map...");
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
  function testMap() {
    console.log("Testing map rendering...");
    const testMapData = {
        "start": {"id": "start", "type": "start", "position": {"row": 0, "col": 2}, "paths": ["node_1", "node_2"]},
        "nodes": {
            "node_1": {"id": "node_1", "type": "question", "position": {"row": 1, "col": 1}, "paths": [], "visited": false},
            "node_2": {"id": "node_2", "type": "rest", "position": {"row": 1, "col": 3}, "paths": [], "visited": false}
        },
        "boss": null
    };
    renderFloorMap(testMapData, 'floor-map');
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


