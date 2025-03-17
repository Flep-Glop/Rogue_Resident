/**
 * Skill Tree Controller
 * 
 * Handles the business logic and state management for the skill tree.
 * Coordinates between the data layer and the UI.
 */

import skillTreeData from './skill_tree_data.js';
import { EventSystem } from '../../core/event_system.js';

class SkillTreeController {
  constructor() {
    this.eventSystem = new EventSystem();
    this.selectedNode = null;
    this.hoveredNode = null;
    this.treeId = null;
    this.characterClass = null;
    this.characterId = null;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.loadTree = this.loadTree.bind(this);
    this.selectNode = this.selectNode.bind(this);
    this.hoverNode = this.hoverNode.bind(this);
    this.unlockNode = this.unlockNode.bind(this);
    this.levelUpNode = this.levelUpNode.bind(this);
    this.resetTree = this.resetTree.bind(this);
  }

  /**
   * Initialize the controller with a character
   * @param {string} characterClass - The character class
   * @param {string} characterId - The character ID
   * @returns {Promise<Object>} - The loaded skill tree
   */
  async initialize(characterClass, characterId) {
    this.characterClass = characterClass;
    this.characterId = characterId;
    
    try {
      const tree = await skillTreeData.loadCharacterSkillTree(characterClass, characterId);
      this.treeId = tree.id;
      
      // Emit event that tree is loaded
      this.eventSystem.emit('skill_tree_loaded', { tree });
      
      return tree;
    } catch (error) {
      this.eventSystem.emit('skill_tree_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Load a skill tree by ID
   * @param {string} treeId - The skill tree ID to load
   * @returns {Promise<Object>} - The loaded skill tree
   */
  async loadTree(treeId) {
    this.treeId = treeId;
    
    try {
      const tree = await skillTreeData.loadSkillTree(treeId);
      
      // Emit event that tree is loaded
      this.eventSystem.emit('skill_tree_loaded', { tree });
      
      return tree;
    } catch (error) {
      this.eventSystem.emit('skill_tree_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Select a node
   * @param {string} nodeId - The node ID to select
   */
  selectNode(nodeId) {
    const tree = skillTreeData.getCurrentTree();
    if (!tree || !tree.nodes[nodeId]) {
      return;
    }
    
    this.selectedNode = nodeId;
    
    // Emit event for the UI to react
    this.eventSystem.emit('node_selected', { 
      nodeId, 
      node: tree.nodes[nodeId],
      canUnlock: skillTreeData.canUnlockNode(nodeId),
      canLevelUp: skillTreeData.canLevelUpNode(nodeId)
    });
  }

  /**
   * Set the hovered node
   * @param {string|null} nodeId - The node ID being hovered, or null if no longer hovering
   */
  hoverNode(nodeId) {
    const tree = skillTreeData.getCurrentTree();
    if (nodeId === this.hoveredNode) {
      return;
    }
    
    // Clear previous hover
    if (this.hoveredNode) {
      this.eventSystem.emit('node_hover_end', { 
        nodeId: this.hoveredNode 
      });
    }
    
    this.hoveredNode = nodeId;
    
    // If we're hovering over a node, emit hover event
    if (nodeId && tree && tree.nodes[nodeId]) {
      this.eventSystem.emit('node_hover_start', { 
        nodeId, 
        node: tree.nodes[nodeId],
        canUnlock: skillTreeData.canUnlockNode(nodeId),
        canLevelUp: skillTreeData.canLevelUpNode(nodeId)
      });
    }
  }

  /**
   * Unlock a skill tree node
   * @param {string} nodeId - The node ID to unlock
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async unlockNode(nodeId) {
    if (!this.treeId) {
      throw new Error('No skill tree loaded');
    }
    
    if (!skillTreeData.canUnlockNode(nodeId)) {
      return false;
    }
    
    try {
      const result = await skillTreeData.unlockNode(this.treeId, nodeId);
      
      // Emit event for the UI to react
      this.eventSystem.emit('node_unlocked', { 
        nodeId, 
        node: result.node,
        availablePoints: result.available_points
      });
      
      // If this is the selected node, update selection info
      if (nodeId === this.selectedNode) {
        this.selectNode(nodeId);
      }
      
      return true;
    } catch (error) {
      this.eventSystem.emit('skill_tree_error', { error: error.message });
      return false;
    }
  }

  /**
   * Level up a skill tree node
   * @param {string} nodeId - The node ID to level up
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async levelUpNode(nodeId) {
    if (!this.treeId) {
      throw new Error('No skill tree loaded');
    }
    
    if (!skillTreeData.canLevelUpNode(nodeId)) {
      return false;
    }
    
    try {
      const result = await skillTreeData.levelUpNode(this.treeId, nodeId);
      
      // Emit event for the UI to react
      this.eventSystem.emit('node_leveled_up', { 
        nodeId, 
        node: result.node,
        availablePoints: result.available_points
      });
      
      // If this is the selected node, update selection info
      if (nodeId === this.selectedNode) {
        this.selectNode(nodeId);
      }
      
      return true;
    } catch (error) {
      this.eventSystem.emit('skill_tree_error', { error: error.message });
      return false;
    }
  }

  /**
   * Reset the skill tree
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async resetTree() {
    if (!this.treeId) {
      throw new Error('No skill tree loaded');
    }
    
    try {
      await skillTreeData.resetSkillTree(this.treeId);
      
      // Clear selection
      this.selectedNode = null;
      
      // Emit event for the UI to react
      this.eventSystem.emit('skill_tree_reset', { 
        treeId: this.treeId 
      });
      
      return true;
    } catch (error) {
      this.eventSystem.emit('skill_tree_error', { error: error.message });
      return false;
    }
  }

  /**
   * Get the currently loaded tree
   * @returns {Object|null} - The current skill tree
   */
  getTree() {
    return skillTreeData.getCurrentTree();
  }

  /**
   * Get all active effects from nodes
   * @returns {Promise<Object>} - Object containing all effects
   */
  async getNodeEffects() {
    if (!this.treeId) {
      throw new Error('No skill tree loaded');
    }
    
    try {
      return await skillTreeData.getNodeEffects(this.treeId);
    } catch (error) {
      this.eventSystem.emit('skill_tree_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get the total value of a specific effect
   * @param {string} effectType - The effect type to calculate
   * @returns {Promise<number>} - The total effect value
   */
  async getTotalEffect(effectType) {
    if (!this.treeId) {
      throw new Error('No skill tree loaded');
    }
    
    try {
      return await skillTreeData.getTotalEffect(this.treeId, effectType);
    } catch (error) {
      this.eventSystem.emit('skill_tree_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Subscribe to events
   * @param {string} eventName - The event name
   * @param {Function} callback - The callback function
   * @returns {Function} - Unsubscribe function
   */
  on(eventName, callback) {
    return this.eventSystem.on(eventName, callback);
  }

  /**
   * Unsubscribe from events
   * @param {string} eventName - The event name
   * @param {Function} callback - The callback function
   */
  off(eventName, callback) {
    this.eventSystem.off(eventName, callback);
  }
}

// Create a singleton instance
const skillTreeController = new SkillTreeController();

export default skillTreeController;