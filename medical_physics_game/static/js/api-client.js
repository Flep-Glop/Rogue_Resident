// api-client.js - API communication

window.ApiClient = {
    // Load game state from server
    loadGameState: function() {
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
    },
    
    // Start a new game
    startNewGame: function(characterId = 'resident') {
      return new Promise((resolve, reject) => {
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
          resolve(data);
        })
        .catch(error => {
          console.error('Error starting new game:', error);
          reject(error);
        });
      });
    },
    
    // Answer a question
    answerQuestion: function(nodeId, answerIndex, question) {
      return new Promise((resolve, reject) => {
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
          resolve(data);
        })
        .catch(error => {
          reject(error);
        });
      });
    },
    
    // Mark a node as visited
    markNodeVisited: function(nodeId) {
      return new Promise((resolve, reject) => {
        fetch('/api/mark-node-visited', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ node_id: nodeId }),
        })
        .then(response => response.json())
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          console.error('Error marking node as visited:', error);
          reject(error);
        });
      });
    },
    
    // Go to the next floor
    goToNextFloor: function() {
      return new Promise((resolve, reject) => {
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
          resolve(data);
        })
        .catch(error => {
          reject(error);
        });
      });
    },
    // Add to api-client.js
    saveGame: function() {
      return fetch('/api/save-game', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to save game');
        return response.json();
      });
    },

    loadGame: function(savedGameId) {
      return fetch(`/api/load-game/${savedGameId}`, {
        method: 'GET'
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to load game');
        return response.json();
      });
    },
    // Reset the game
    resetGame: function() {
      return new Promise((resolve, reject) => {
        fetch('/api/reset-game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
        .then(response => response.json())
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          console.error('Error resetting game:', error);
          reject(error);
        });
      });
    }
  };