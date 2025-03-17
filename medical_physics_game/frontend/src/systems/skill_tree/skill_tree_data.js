/**
 * Skill Tree Data Module
 * 
 * Handles data loading, parsing, and API interactions for the skill tree system.
 */

// API endpoint URLs
const API_BASE = '/api/skill-tree';

/**
 * SkillTreeData class handles all data operations for the skill tree
 */
class SkillTreeData {
  constructor() {
    this.currentTree = null;
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Load a skill tree by its ID
   * @param {string} treeId - The ID of the skill tree to load
   * @returns {Promise<Object>} - The loaded skill tree data
   */
  async loadSkillTree(treeId) {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await fetch(`${API_BASE}/${treeId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load skill tree');
      }
      
      const data = await response.json();
      this.currentTree = data;
      return data;
    } catch (error) {
      this.error = error.message;
      console.error('Error loading skill tree:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load a skill tree for a character
   * @param {string} characterClass - The character class
   * @param {string} characterId - The character ID
   * @returns {Promise<Object>} - The loaded skill tree data
   */
  async loadCharacterSkillTree(characterClass, characterId) {
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await fetch(`${API_BASE}/character/${characterClass}/${characterId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load character skill tree');
      }
      
      const data = await response.json();
      this.currentTree = data;
      return data;
    } catch (error) {
      this.error = error.message;
      console.error('Error loading character skill tree:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Award skill points to a skill tree
   * @param {string} treeId - The skill tree ID
   * @param {number} points - The number of points to award
   * @returns {Promise<Object>} - The updated skill tree data
   */
  async awardSkillPoints(treeId, points) {
    try {
      const response = await fetch(`${API_BASE}/${treeId}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ points })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to award skill points');
      }
      
      const data = await response.json();
      
      // Update our cached tree with new points value
      if (this.currentTree && this.currentTree.id === treeId) {
        this.currentTree.available_points = data.available_points;
        this.currentTree.total_earned_points = data.total_earned_points;
      }
      
      return data;
    } catch (error) {
      console.error('Error awarding skill points:', error);
      throw error;
    }
  }

  /**
   * Unlock a skill tree node
   * @param {string} treeId - The skill tree ID
   * @param {string} nodeId - The node ID to unlock
   * @returns {Promise<Object>} - The result of the operation
   */
  async unlockNode(treeId, nodeId) {
    try {
      const response = await fetch(`${API_BASE}/${treeId}/nodes/${nodeId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unlock node');
      }
      
      // Update our cached tree if we have it
      if (this.currentTree && this.currentTree.id === treeId) {
        this.currentTree.available_points = data.available_points;
        if (data.node && this.currentTree.nodes[nodeId]) {
          this.currentTree.nodes[nodeId] = data.node;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error unlocking node:', error);
      throw error;
    }
  }

  /**
   * Level up a skill tree node
   * @param {string} treeId - The skill tree ID
   * @param {string} nodeId - The node ID to level up
   * @returns {Promise<Object>} - The result of the operation
   */
  async levelUpNode(treeId, nodeId) {
    try {
      const response = await fetch(`${API_BASE}/${treeId}/nodes/${nodeId}/level-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to level up node');
      }
      
      // Update our cached tree if we have it
      if (this.currentTree && this.currentTree.id === treeId) {
        this.currentTree.available_points = data.available_points;
        if (data.node && this.currentTree.nodes[nodeId]) {
          this.currentTree.nodes[nodeId] = data.node;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error leveling up node:', error);
      throw error;
    }
  }

  /**
   * Reset a skill tree
   * @param {string} treeId - The skill tree ID to reset
   * @returns {Promise<Object>} - The result of the operation
   */
  async resetSkillTree(treeId) {
    try {
      const response = await fetch(`${API_BASE}/${treeId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset skill tree');
      }
      
      // Reload the tree to get the updated state
      await this.loadSkillTree(treeId);
      
      return data;
    } catch (error) {
      console.error('Error resetting skill tree:', error);
      throw error;
    }
  }

  /**
   * Get all active effects from the skill tree
   * @param {string} treeId - The skill tree ID
   * @returns {Promise<Object>} - The effects data
   */
  async getNodeEffects(treeId) {
    try {
      const response = await fetch(`${API_BASE}/${treeId}/effects`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get node effects');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting node effects:', error);
      throw error;
    }
  }

  /**
   * Get the total value of a specific effect type
   * @param {string} treeId - The skill tree ID
   * @param {string} effectType - The type of effect to calculate
   * @returns {Promise<number>} - The total effect value
   */
  async getTotalEffect(treeId, effectType) {
    try {
      const response = await fetch(`${API_BASE}/${treeId}/effects/${effectType}/total`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get total effect');
      }
      
      const data = await response.json();
      return data.total_value;
    } catch (error) {
      console.error('Error getting total effect:', error);
      throw error;
    }
  }

  /**
   * Check if a node can be unlocked
   * @param {string} nodeId - The node ID to check
   * @returns {boolean} - Whether the node can be unlocked
   */
  canUnlockNode(nodeId) {
    if (!this.currentTree || !this.currentTree.nodes[nodeId]) {
      return false;
    }
    
    const node = this.currentTree.nodes[nodeId];
    
    // Already unlocked
    if (node.unlocked) {
      return false;
    }
    
    // Check available points
    if (this.currentTree.available_points < node.cost) {
      return false;
    }
    
    // Check prerequisites
    for (const prereqId of node.prerequisites) {
      const prereqNode = this.currentTree.nodes[prereqId];
      if (!prereqNode || !prereqNode.unlocked) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if a node can be leveled up
   * @param {string} nodeId - The node ID to check
   * @returns {boolean} - Whether the node can be leveled up
   */
  canLevelUpNode(nodeId) {
    if (!this.currentTree || !this.currentTree.nodes[nodeId]) {
      return false;
    }
    
    const node = this.currentTree.nodes[nodeId];
    
    // Must be unlocked already
    if (!node.unlocked) {
      return false;
    }
    
    // Check if already at max level
    if (node.level >= node.max_level) {
      return false;
    }
    
    // Check available points
    if (this.currentTree.available_points < node.cost) {
      return false;
    }
    
    return true;
  }

  /**
   * Get the current tree data
   * @returns {Object|null} - The current skill tree data
   */
  getCurrentTree() {
    return this.currentTree;
  }
}

// Create a singleton instance
const skillTreeData = new SkillTreeData();

export default skillTreeData;