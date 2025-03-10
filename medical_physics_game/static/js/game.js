// game.js - Main game logic

// Game state
let gameState = {
    character: {},
    currentFloor: 1,
    nodes: []
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadGameState();
    
    // Set up next floor button
    document.getElementById('next-floor-btn').addEventListener('click', function() {
        goToNextFloor();
    });
});

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

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}