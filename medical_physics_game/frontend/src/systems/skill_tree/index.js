// frontend/src/systems/skill_tree/index.js

/**
 * Skill Tree System - Main Integration Point
 * 
 * This file serves as the main entry point for the skill tree system.
 * It exports all components and provides simplified integration functions.
 */

// Import core components
import SkillTreeManager from './core/skill_tree_manager.js';
import SkillTreeController from './core/skill_tree_controller.js';
import SkillEffectSystem from './core/skill_effect_system.js';
import SkillTreeData from './core/skill_tree_data.js';

// Import UI components
import SkillTreeRenderer from './components/skill_tree_renderer.js'; // Using the orbital renderer
import SkillTreeUI from './components/skill_tree_ui.js';
import SkillTreePanel from './components/skill_tree_panel.js';
import SkillTreeControls from './components/skill_tree_controls.js';

// Import utilities
import SkillTreeAPI from './utils/skill_tree_api.js';
import SkillTreeParser from './utils/skill_tree_parser.js';
import NodePositionCalculator from './utils/node_position_calculator.js';

// Create main component instances
export const skillTreeManager = new SkillTreeManager();
export const skillTreeController = new SkillTreeController();
export const skillEffectSystem = new SkillEffectSystem();
export const skillTreeRenderer = window.SkillTreeRenderer; // Use the existing instance from skill_tree_renderer.js
export const skillTreeUI = new SkillTreeUI();

/**
 * Initialize the skill tree system
 * @param {Object} options Configuration options
 * @returns {Promise} Promise that resolves when initialization is complete
 */
export function initialize(options = {}) {
  // Set up event system
  const eventSystem = options.eventSystem || window.EventSystem;
  
  // Set up API client
  const apiClient = options.apiClient || new SkillTreeAPI({
    baseUrl: options.apiBaseUrl || '/api'
  });
  
  // Step 1: Initialize core systems
  skillEffectSystem.initialize();
  
  // Step 2: Initialize manager
  skillTreeManager.initialize({
    apiClient,
    eventSystem
  });
  
  // Step 3: Initialize controller
  skillTreeController.initialize({
    manager: skillTreeManager,
    eventSystem,
    renderer: skillTreeRenderer
  });
  
  // Step 4: Initialize UI components
  skillTreeUI.initialize({
    containerSelector: options.containerSelector || '#skill-tree-container',
    controlsContainerId: options.controlsContainerId || 'skill-tree-controls',
    infoContainerId: options.infoContainerId || 'skill-tree-info',
    eventSystem
  });
  
  // Step 5: Initialize renderer (using the containerId option)
  skillTreeRenderer.initialize(options.visualizationSelector || 'skill-tree-visualization');
  
  // Load data if autoLoad is enabled
  if (options.autoLoad !== false) {
    return skillTreeController.loadData();
  }
  
  return Promise.resolve({
    manager: skillTreeManager,
    controller: skillTreeController,
    renderer: skillTreeRenderer,
    ui: skillTreeUI
  });
}

console.log('Skill Tree System initialized successfully', {
    manager: skillTreeManager.initialized,
    controller: skillTreeController.initialized,
    renderer: skillTreeRenderer.initialized,
    ui: skillTreeUI.initialized
  });


/**
 * Load the skill tree data
 * @returns {Promise} Promise resolving with loaded data
 */
export function loadSkillTree() {
  return skillTreeController.loadData();
}

/**
 * Save the skill tree progress
 * @returns {Promise} Promise resolving when saved
 */
export function saveSkillTree() {
  return skillTreeController.saveProgress();
}

/**
 * Apply skill effects to character stats
 * @param {Object} character Character stats to modify
 * @returns {Object} Modified character stats
 */
export function applySkillEffects(character) {
  return skillEffectSystem.applyEffects(character);
}

// Export all components for advanced usage
export {
  SkillTreeManager,
  SkillTreeController,
  SkillEffectSystem,
  SkillTreeData,
  SkillTreeRenderer,
  SkillTreeUI,
  SkillTreePanel,
  SkillTreeControls,
  SkillTreeAPI,
  SkillTreeParser,
  NodePositionCalculator
};

// Backward compatibility
const skillTree = {
  initialize,
  loadSkillTree,
  saveSkillTree,
  applySkillEffects,
  manager: skillTreeManager,
  controller: skillTreeController,
  renderer: skillTreeRenderer,
  ui: skillTreeUI,
  effectSystem: skillEffectSystem
};

// Export default object
export default skillTree;

// Global reference for backward compatibility
window.SkillTree = skillTree;