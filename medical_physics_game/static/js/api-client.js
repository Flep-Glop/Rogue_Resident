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
          
          // Only update GameState if it exists, don't use gameState global
          if (typeof GameState !== 'undefined' && GameState.data) {
            // Update state with received data
            GameState.data.character = data.character;
            GameState.data.currentFloor = data.current_floor;
            GameState.data.inventory = data.inventory || [];
          }
          
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
  
  // Save the game
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

  // Load a saved game
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
  },

  // SKILL TREE METHODS - ADD THESE TO THE EXISTING OBJECT
  
  // Load skill tree data
  loadSkillTree: function() {
    return fetch('/api/skill-tree')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load skill tree: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error("Error loading skill tree:", error);
        // Return a promise that resolves to null, so the caller can handle the error
        return Promise.resolve(null);
      });
  },

  // Load player skill progress
  loadSkillProgress: function() {
    return fetch('/api/skill-progress')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load skill progress: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error("Error loading skill progress:", error);
        // Return default progress data
        return Promise.resolve({
          reputation: 0,
          unlocked_skills: ['core_physics'],
          active_skills: ['core_physics'],
          skill_points_available: 3,
          specialization_progress: {}
        });
      });
  },

  // Save skill progress
  saveSkillProgress: function(progressData) {
    return fetch('/api/skill-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to save skill progress: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error("Error saving skill progress:", error);
      // Return a promise that resolves to false, so the caller can handle the error
      return Promise.resolve(false);
    });
  },

  // Unlock a skill 
  unlockSkill: function(skillId) {
    return fetch(`/api/skill/unlock/${skillId}`, {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to unlock skill: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error(`Error unlocking skill ${skillId}:`, error);
      return Promise.resolve(false);
    });
  },

  // Activate a skill
  activateSkill: function(skillId) {
    return fetch(`/api/skill/activate/${skillId}`, {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to activate skill: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error(`Error activating skill ${skillId}:`, error);
      return Promise.resolve(false);
    });
  },

  // Deactivate a skill
  deactivateSkill: function(skillId) {
    return fetch(`/api/skill/deactivate/${skillId}`, {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to deactivate skill: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error(`Error deactivating skill ${skillId}:`, error);
      return Promise.resolve(false);
    });
  }
};