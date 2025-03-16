// medical_physics_game/static/js/utils/api_client.js

/**
 * Enhanced API Client - Provides consistent error handling and response processing
 * for all server communication. Extends the existing API client with better timeout
 * handling, more robust error processing, and standardized API methods.
 */

// Import ErrorHandler if using ES modules
// import { ErrorHandler } from './error_handler.js';

/**
 * ApiClient - Handles all server communication with consistent error handling
 * and response processing
 */
const ApiClient = {
  /**
   * Base URL for API endpoints
   * Defaults to current host
   */
  baseUrl: '',
  
  /**
   * Default request timeout in milliseconds
   */
  timeout: 15000,
  
  /**
   * Default headers for all requests
   */
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  
  /**
   * Configure the API client
   * @param {Object} config - Configuration options
   */
  configure: function(config = {}) {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.timeout) this.timeout = config.timeout;
    if (config.headers) this.defaultHeaders = { ...this.defaultHeaders, ...config.headers };
  },
  
  /**
   * Make a GET request
   * @param {String} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise} Promise resolving to the response data
   */
  get: async function(endpoint, options = {}) {
    return this._fetch(endpoint, { 
      method: 'GET',
      ...options
    });
  },
  
  /**
   * Make a POST request
   * @param {String} endpoint - API endpoint
   * @param {Object} data - Data to send
   * @param {Object} options - Additional fetch options
   * @returns {Promise} Promise resolving to the response data
   */
  post: async function(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  /**
   * Make a PUT request
   * @param {String} endpoint - API endpoint
   * @param {Object} data - Data to send
   * @param {Object} options - Additional fetch options
   * @returns {Promise} Promise resolving to the response data
   */
  put: async function(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  /**
   * Make a DELETE request
   * @param {String} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise} Promise resolving to the response data
   */
  delete: async function(endpoint, options = {}) {
    return this._fetch(endpoint, {
      method: 'DELETE',
      ...options
    });
  },
  
  /**
   * Core fetch method with error handling and timeout
   * @private
   * @param {String} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} Promise resolving to the response data
   */
  _fetch: async function(endpoint, options = {}) {
    const url = this._buildUrl(endpoint);
    
    // Merge default headers with options
    const fetchOptions = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    fetchOptions.signal = controller.signal;
    
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Handle error responses
      if (!response.ok) {
        throw await this._createApiError(response);
      }
      
      // Return JSON if content exists, otherwise empty object
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {};
    } catch (error) {
      // Cleanup timeout
      clearTimeout(timeoutId);
      
      // Handle timeout and other errors
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout: ${url}`);
        
        // Report error if ErrorHandler exists
        if (window.ErrorHandler) {
          window.ErrorHandler.handleError(
            timeoutError,
            'API Timeout',
            window.ErrorHandler.SEVERITY.WARNING,
            { url, timeout: this.timeout }
          );
        }
        
        throw timeoutError;
      }
      
      // Report error if ErrorHandler exists and not already reported
      if (window.ErrorHandler && !error._reported) {
        window.ErrorHandler.handleError(
          error,
          'API Request',
          window.ErrorHandler.SEVERITY.ERROR,
          { url, method: options.method }
        );
        error._reported = true;
      }
      
      throw error;
    }
  },
  
  /**
   * Build a complete URL from an endpoint
   * @private
   * @param {String} endpoint - API endpoint
   * @returns {String} Complete URL
   */
  _buildUrl: function(endpoint) {
    // If endpoint already starts with http, it's absolute
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Ensure endpoint starts with slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  },
  
  /**
   * Create an API error with additional information
   * @private
   * @param {Response} response - Fetch response
   * @returns {Error} Enhanced error object
   */
  _createApiError: async function(response) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    let errorData = {};
    
    try {
      // Try to parse JSON error response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        if (errorData.message) {
          errorMessage = `API Error: ${errorData.message}`;
        }
      } else {
        // Try to get text error
        const text = await response.text();
        if (text) {
          errorMessage = `API Error: ${text}`;
        }
      }
    } catch (e) {
      // Ignore additional errors during error parsing
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = errorData;
    error.response = response;
    
    return error;
  },
  
  // ============================================
  // GAME STATE METHODS - PRESERVE EXISTING FUNCTIONALITY
  // ============================================
  
  /**
   * Load game state from server
   * @returns {Promise} Promise resolving to game state data
   */
  loadGameState: function() {
    return this.get('/api/game-state')
      .then(data => {
        console.log("Game state loaded:", data);
          
        // Only update GameState if it exists, don't use gameState global
        if (typeof GameState !== 'undefined' && GameState.data) {
          // Update state with received data
          GameState.data.character = data.character;
          GameState.data.currentFloor = data.current_floor;
          GameState.data.inventory = data.inventory || [];
        }
          
        return data;
      });
  },
  
  /**
   * Start a new game
   * @param {String} characterId - ID of selected character
   * @returns {Promise} Promise resolving to new game data
   */
  startNewGame: function(characterId = 'resident') {
    console.log(`Starting new game with character: ${characterId}`);
      
    return this.post('/api/new-game', { character_id: characterId });
  },
  
  /**
   * Answer a question
   * @param {String} nodeId - ID of the node
   * @param {Number} answerIndex - Index of selected answer
   * @param {Object} question - Question data
   * @returns {Promise} Promise resolving to result data
   */
  answerQuestion: function(nodeId, answerIndex, question) {
    return this.post('/api/answer-question', { 
      node_id: nodeId, 
      answer_index: answerIndex,
      question: question
    });
  },
  
  /**
   * Mark a node as visited
   * @param {String} nodeId - ID of the node
   * @returns {Promise} Promise resolving to result data
   */
  markNodeVisited: function(nodeId) {
    return this.post('/api/mark-node-visited', { node_id: nodeId });
  },
  
  /**
   * Go to the next floor
   * @returns {Promise} Promise resolving to next floor data
   */
  goToNextFloor: function() {
    return this.post('/api/next-floor', {});
  },
  
  /**
   * Save the game
   * @returns {Promise} Promise resolving to save result
   */
  saveGame: function() {
    return this.post('/api/save-game', {});
  },

  /**
   * Load a saved game
   * @param {String} savedGameId - ID of saved game
   * @returns {Promise} Promise resolving to loaded game data
   */
  loadGame: function(savedGameId) {
    return this.get(`/api/load-game/${savedGameId}`);
  },
  
  /**
   * Reset the game
   * @returns {Promise} Promise resolving to reset result
   */
  resetGame: function() {
    return this.post('/api/reset-game', {});
  },

  // ============================================
  // SKILL TREE METHODS
  // ============================================
  
  /**
   * Load the skill tree data
   * @returns {Promise} Promise resolving to skill tree data
   */
  loadSkillTree: function() {
    return this.get('/api/skill-tree')
      .catch(error => {
        console.error("Error loading skill tree:", error);
        // Return a promise that resolves to null, so the caller can handle the error
        return null;
      });
  },
  
  /**
   * Save skill tree data (admin only)
   * @param {Object} data - Skill tree data to save
   * @returns {Promise} Promise resolving when data is saved
   */
  saveSkillTree: function(data) {
    return this.post('/api/skill-tree', data);
  },

  /**
   * Load player's skill tree progress
   * @returns {Promise} Promise resolving to player progress
   */
  loadSkillProgress: function() {
    return this.get('/api/skill-progress')
      .catch(error => {
        console.error("Error loading skill progress:", error);
        // Return default progress data
        return {
          reputation: 0,
          unlocked_skills: ['core_physics'],
          active_skills: ['core_physics'],
          skill_points_available: 3,
          specialization_progress: {}
        };
      });
  },

  /**
   * Save player's skill tree progress
   * @param {Object} data - Progress data to save
   * @returns {Promise} Promise resolving when progress is saved
   */
  saveSkillProgress: function(data) {
    return this.post('/api/skill-progress', data)
      .catch(error => {
        console.error("Error saving skill progress:", error);
        // Return a promise that resolves to false, so the caller can handle the error
        return false;
      });
  },

  /**
   * Unlock a skill 
   * @param {String} skillId - ID of the skill to unlock
   * @returns {Promise} Promise resolving to unlock result
   */
  unlockSkill: function(skillId) {
    return this.post(`/api/skill/unlock/${skillId}`, {})
      .catch(error => {
        console.error(`Error unlocking skill ${skillId}:`, error);
        return false;
      });
  },

  /**
   * Activate a skill
   * @param {String} skillId - ID of the skill to activate
   * @returns {Promise} Promise resolving to activation result
   */
  activateSkill: function(skillId) {
    return this.post(`/api/skill/activate/${skillId}`, {})
      .catch(error => {
        console.error(`Error activating skill ${skillId}:`, error);
        return false;
      });
  },

  /**
   * Deactivate a skill
   * @param {String} skillId - ID of the skill to deactivate
   * @returns {Promise} Promise resolving to deactivation result
   */
  deactivateSkill: function(skillId) {
    return this.post(`/api/skill/deactivate/${skillId}`, {})
      .catch(error => {
        console.error(`Error deactivating skill ${skillId}:`, error);
        return false;
      });
  }
};

// For module use - if using ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient };
}

// For backward compatibility with existing code
window.ApiClient = ApiClient;

// Initialize with default configuration
ApiClient.configure({
  // Use empty baseUrl to use same origin
  baseUrl: '',
  timeout: 15000
});