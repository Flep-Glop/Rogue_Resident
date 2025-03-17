/**
 * Skill Tree System - Main Entry Point
 * 
 * This file exports the main components of the skill tree system
 * and provides initialization functions.
 */

import skillTreeController from './skill_tree_controller.js';
import SkillTreeRenderer from './skill_tree_renderer.js';
import SkillTreeUI from './skill_tree_ui.js';
import skillTreeData from './skill_tree_data.js';

/**
 * Initialize the skill tree system with a specific character
 * @param {Object} options - Configuration options
 * @param {string} options.characterClass - The character class
 * @param {string} options.characterId - The character ID
 * @param {string} options.canvasId - ID of the canvas element
 * @param {string} options.infoPanelId - ID of the info panel element
 * @param {string} options.controlsId - ID of the controls container
 * @returns {Promise<Object>} - The initialized controller
 */
async function initializeSkillTree(options = {}) {
  const {
    characterClass,
    characterId,
    canvasId = 'skill-tree-canvas',
    infoPanelId = 'skill-tree-info',
    controlsId = 'skill-tree-controls'
  } = options;
  
  if (!characterClass || !characterId) {
    throw new Error('Character class and ID are required');
  }
  
  // Initialize UI
  const ui = new SkillTreeUI({
    canvasId,
    infoPanelId,
    controlsId
  });
  
  // Initialize system with character
  await ui.initialize(characterClass, characterId);
  
  return skillTreeController;
}

/**
 * Initialize the skill tree system with a specific tree ID
 * @param {Object} options - Configuration options
 * @param {string} options.treeId - The tree ID
 * @param {string} options.canvasId - ID of the canvas element
 * @param {string} options.infoPanelId - ID of the info panel element
 * @param {string} options.controlsId - ID of the controls container
 * @returns {Promise<Object>} - The initialized controller
 */
async function loadSkillTree(options = {}) {
  const {
    treeId,
    canvasId = 'skill-tree-canvas',
    infoPanelId = 'skill-tree-info',
    controlsId = 'skill-tree-controls'
  } = options;
  
  if (!treeId) {
    throw new Error('Tree ID is required');
  }
  
  // Create UI
  const ui = new SkillTreeUI({
    canvasId,
    infoPanelId,
    controlsId
  });
  
  // Load the tree
  const tree = await skillTreeController.loadTree(treeId);
  
  // Initialize renderer
  ui.renderer.initialize(tree);
  
  return skillTreeController;
}

// Export the main components and initialization functions
export default {
  initialize: initializeSkillTree,
  load: loadSkillTree,
  controller: skillTreeController,
  data: skillTreeData,
  SkillTreeRenderer,
  SkillTreeUI
};