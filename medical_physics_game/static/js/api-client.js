// api-client.js - Optimized API communication module

window.ApiClient = {
  // Base configuration
  config: {
    baseUrl: '',  // Empty for same-origin requests
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    retryAttempts: 1,
    retryDelay: 1000,
  },

  // Make a generic API request with built-in error handling
  request: async function(endpoint, options = {}) {
    const url = this.config.baseUrl + endpoint;
    const method = options.method || 'GET';
    
    const fetchOptions = {
      method,
      headers: { ...this.config.defaultHeaders, ...options.headers },
      ...(options.body && { body: JSON.stringify(options.body) })
    };
    
    let attempts = 0;
    const maxAttempts = options.retryAttempts || this.config.retryAttempts;
    
    while (attempts <= maxAttempts) {
      try {
        const response = await fetch(url, fetchOptions);
        
        // Check for HTTP error responses
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        return data;
      } catch (error) {
        attempts++;
        
        // Log the error
        console.error(`API Request Error (${method} ${endpoint}):`, error);
        
        // If we've reached max attempts, throw the error
        if (attempts > maxAttempts) {
          throw error;
        }
        
        // Otherwise wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
  },
  
  // ===== GAME STATE ENDPOINTS =====
  
  // Load game state from server
  loadGameState: async function() {
    console.log("Loading game state from server...");
    
    try {
      const data = await this.request('/api/game-state');
      console.log("Game state loaded:", data);
      
      // Only update GameState if it exists, don't use gameState global
      if (typeof GameState !== 'undefined' && GameState.data) {
        // Update state with received data
        GameState.data.character = data.character;
        GameState.data.currentFloor = data.current_floor;
        GameState.data.inventory = data.inventory || [];
      }
      
      return data;
    } catch (error) {
      console.error('Error loading game state:', error);
      throw error;
    }
  },
  
  // Start a new game
  startNewGame: async function(characterId = 'resident') {
    console.log(`Starting new game with character: ${characterId}`);
    
    return this.request('/api/new-game', {
      method: 'POST',
      body: { character_id: characterId }
    });
  },
  
  // Answer a question
  answerQuestion: async function(nodeId, answerIndex, question) {
    return this.request('/api/answer-question', {
      method: 'POST',
      body: { 
        node_id: nodeId, 
        answer_index: answerIndex,
        question: question
      }
    });
  },
  
  // Mark a node as visited
  markNodeVisited: async function(nodeId) {
    return this.request('/api/mark-node-visited', {
      method: 'POST',
      body: { node_id: nodeId }
    });
  },
  
  // Go to the next floor
  goToNextFloor: async function() {
    return this.request('/api/next-floor', {
      method: 'POST',
      body: {}
    });
  },
  
  // Save the game
  saveGame: async function() {
    return this.request('/api/save-game', {
      method: 'POST',
      body: {}
    });
  },

  // Load a saved game
  loadGame: async function(savedGameId) {
    return this.request(`/api/load-game/${savedGameId}`);
  },
  
  // Reset the game
  resetGame: async function() {
    return this.request('/api/reset-game', {
      method: 'POST',
      body: {}
    });
  },
  
  // ===== ITEM & RELIC ENDPOINTS =====
  
  // Get a specific item by ID
  getItem: async function(itemId) {
    return this.request(`/api/item/${itemId}`);
  },
  
  // Get random items
  getRandomItems: async function(count = 1) {
    return this.request(`/api/item/random?count=${count}`);
  },
  
  // Get all items
  getAllItems: async function() {
    return this.request('/api/item/all');
  },
  
  // Get a specific relic by ID
  getRelic: async function(relicId) {
    return this.request(`/api/relic/${relicId}`);
  },
  
  // Get all relics
  getAllRelics: async function() {
    return this.request('/api/relic/all');
  },
  
  // ===== QUESTION ENDPOINTS =====
  
  // Get a question for a specific node
  getQuestion: async function(nodeId, nodeType = 'question') {
    return this.request(`/api/get-question?node_id=${nodeId}&type=${nodeType}`);
  },
  
  // ===== DEBUG ENDPOINTS =====
  
  // Debug reset
  debugReset: async function() {
    return this.request('/api/debug-reset', {
      method: 'POST',
      body: {}
    });
  }
};