// frontend/src/systems/skill_tree/utils/skill_tree_api.js

class SkillTreeAPI {
    constructor(options = {}) {
      this.baseUrl = options.baseUrl || '/api';
      this.defaultErrorHandler = options.errorHandler || console.error;
    }
    
    /**
     * Get skill tree structure
     * @returns {Promise} Promise resolving with skill tree data
     */
    getSkillTree() {
      return this._fetchWithErrorHandling(`${this.baseUrl}/skill-tree`);
    }
    
    /**
     * Get player's skill tree progress
     * @param {String} characterId Character ID
     * @returns {Promise} Promise resolving with progress data
     */
    getSkillProgress(characterId) {
      const url = characterId 
        ? `${this.baseUrl}/skill-progress?character_id=${characterId}`
        : `${this.baseUrl}/skill-progress`;
      
      return this._fetchWithErrorHandling(url);
    }
    
    /**
     * Save player's skill tree progress
     * @param {String} characterId Character ID
     * @param {Object} progress Progress data to save
     * @returns {Promise} Promise resolving when saved
     */
    saveSkillProgress(characterId, progress) {
      const url = characterId 
        ? `${this.baseUrl}/skill-progress?character_id=${characterId}`
        : `${this.baseUrl}/skill-progress`;
      
      return this._fetchWithErrorHandling(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
    }
    
    /**
     * Fetch with standardized error handling
     * @private
     */
    _fetchWithErrorHandling(url, options = {}) {
      return fetch(url, options)
        .then(response => {
          if (!response.ok) {
            return response.json()
              .then(errorData => {
                throw new Error(errorData.error || `HTTP error ${response.status}`);
              })
              .catch(error => {
                if (error instanceof SyntaxError) {
                  throw new Error(`HTTP error ${response.status}`);
                }
                throw error;
              });
          }
          return response.json();
        })
        .catch(error => {
          this.defaultErrorHandler(error);
          throw error;
        });
    }
  }
  
  export default SkillTreeAPI;