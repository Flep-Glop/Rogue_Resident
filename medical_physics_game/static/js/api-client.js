// api-client.js - Enhanced API communication with consistent error handling

/**
 * API Client for Medical Physics Residency Game
 * Handles all server communication with consistent patterns
 */
window.ApiClient = {
  /**
   * Makes a standardized API request with consistent error handling
   * @param {string} endpoint - API endpoint path
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {Object} data - Request payload for POST/PUT requests
   * @returns {Promise} - Promise resolving to JSON response
   */
  _apiRequest: function(endpoint, method = 'GET', data = null) {
    // Set up request options
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && data !== null) {
      options.body = JSON.stringify(data);
    }
    
    // Log API request
    console.log(`API Request: ${method} ${endpoint}`, data ? data : '');
    
    // Make the request
    return fetch(endpoint, options)
      .then(response => {
        if (!response.ok) {
          // Create detailed error message
          const errorMessage = `API error (${response.status}) on ${endpoint}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        return response.json();
      })
      .then(data => {
        // Log success (abridged for large responses)
        console.log(`API Response: ${endpoint}`, 
          typeof data === 'object' ? '[Response data received]' : data);
        return data;
      })
      .catch(error => {
        // Enhance error with more context
        const enhancedError = new Error(`${error.message} (${endpoint})`);
        enhancedError.originalError = error;
        enhancedError.endpoint = endpoint;
        throw enhancedError;
      });
  },
  
  /**
   * Load game state from server
   * @returns {Promise} Game state data
   */
  loadGameState: function() {
    return this._apiRequest('/api/game-state')
      .then(data => {
        // Update GameState if it exists
        if (typeof GameState !== 'undefined' && GameState.data) {
          GameState.data.character = data.character;
          GameState.data.currentFloor = data.current_floor;
          GameState.data.inventory = data.inventory || [];
        }
        return data;
      });
  },
  
  /**
   * Start a new game with specified character
   * @param {string} characterId - Character identifier
   * @returns {Promise} New game state data
   */
  startNewGame: function(characterId = 'resident') {
    // Validate input
    if (!characterId) {
      return Promise.reject(new Error("Character ID is required"));
    }
    
    return this._apiRequest('/api/new-game', 'POST', { 
      character_id: characterId 
    });
  },
  
  /**
   * Answer a question node
   * @param {string} nodeId - ID of the question node
   * @param {number} answerIndex - Index of the selected answer
   * @param {Object} questionData - Question data object
   * @returns {Promise} Answer result data
   */
  answerQuestion: function(nodeId, answerIndex, questionData) {
    // Validate required inputs
    if (!nodeId) {
      console.error("Missing nodeId in answerQuestion");
      return Promise.reject(new Error("Missing node ID"));
    }
    
    if (typeof answerIndex !== 'number') {
      console.error("Invalid answerIndex in answerQuestion:", answerIndex);
      return Promise.reject(new Error("Invalid answer index"));
    }
    
    // Format data as expected by the API
    const requestData = {
      node_id: nodeId,
      answer_index: answerIndex,
      // Include only necessary question data
      question_id: questionData?.id,
      question_correct: questionData?.correct
    };
    
    return this._apiRequest('/api/answer-question', 'POST', requestData);
  },
  
  /**
   * Mark a node as visited
   * @param {string} nodeId - ID of the node to mark as visited
   * @returns {Promise} Updated node data
   */
  markNodeVisited: function(nodeId) {
    // Validate input
    if (!nodeId) {
      return Promise.reject(new Error("Node ID is required"));
    }
    
    return this._apiRequest('/api/mark-node-visited', 'POST', { node_id: nodeId });
  },
  
  /**
   * Proceed to the next floor
   * @returns {Promise} New floor data
   */
  goToNextFloor: function() {
    return this._apiRequest('/api/next-floor', 'POST', {});
  },
  
  /**
   * Save the current game state
   * @returns {Promise} Save result data with save ID
   */
  saveGame: function() {
    return this._apiRequest('/api/save-game', 'POST', {});
  },
  
  /**
   * Load a saved game by ID
   * @param {string} savedGameId - ID of the saved game to load
   * @returns {Promise} Loaded game state
   */
  loadGame: function(savedGameId) {
    // Validate input
    if (!savedGameId) {
      return Promise.reject(new Error("Save game ID is required"));
    }
    
    return this._apiRequest(`/api/load-game/${savedGameId}`);
  },
  
  /**
   * Reset the game state
   * @returns {Promise} Reset confirmation
   */
  resetGame: function() {
    return this._apiRequest('/api/reset-game', 'POST', {});
  },
  
  /**
   * Debug-only API to get information about server state
   * @returns {Promise} Debug information
   */
  getDebugInfo: function() {
    if (!window.DebugTools?.debugMode) {
      console.warn("Debug API called without debug mode enabled");
    }
    return this._apiRequest('/api/debug-info')
      .catch(error => {
        console.warn("Debug info not available:", error.message);
        return { available: false, message: error.message };
      });
  }
};