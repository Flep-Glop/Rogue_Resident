/**
 * Skill Tree UI
 * 
 * Handles the user interface elements for the skill tree.
 * Manages the info panel, buttons, and user interactions.
 */

import skillTreeController from './skill_tree_controller.js';
import SkillTreeRenderer from './skill_tree_renderer.js';

class SkillTreeUI {
  /**
   * Create a new SkillTreeUI
   * @param {Object} options - Configuration options
   * @param {string} options.canvasId - ID of the canvas element
   * @param {string} options.infoPanelId - ID of the info panel element
   * @param {string} options.controlsId - ID of the controls container
   */
  constructor(options = {}) {
    // Get DOM elements
    this.canvas = document.getElementById(options.canvasId || 'skill-tree-canvas');
    this.infoPanel = document.getElementById(options.infoPanelId || 'skill-tree-info');
    this.controls = document.getElementById(options.controlsId || 'skill-tree-controls');
    
    // Create renderer
    this.renderer = new SkillTreeRenderer(this.canvas);
    
    // State
    this.selectedNode = null;
    this.characterClass = null;
    this.characterId = null;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleUnlockClick = this.handleUnlockClick.bind(this);
    this.handleLevelUpClick = this.handleLevelUpClick.bind(this);
    this.handleResetClick = this.handleResetClick.bind(this);
    this.updateInfoPanel = this.updateInfoPanel.bind(this);
    
    // Initialize event listeners
    this._initEventListeners();
    
    // Initial resize
    this.handleResize();
  }

  /**
   * Initialize the UI with a character
   * @param {string} characterClass - The character class
   * @param {string} characterId - The character ID
   */
  async initialize(characterClass, characterId) {
    this.characterClass = characterClass;
    this.characterId = characterId;
    
    try {
      // Initialize controller and load tree
      const tree = await skillTreeController.initialize(characterClass, characterId);
      
      // Initialize renderer
      this.renderer.initialize(tree);
      
      // Update UI
      this._setupControlButtons();
      this._updateAvailablePoints(tree.available_points);
      
      // Clear info panel initially
      this.infoPanel.innerHTML = '<div class="info-message">Select a skill to view details</div>';
      
      return tree;
    } catch (error) {
      this._showError(error.message);
      throw error;
    }
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Window resize
    window.addEventListener('resize', this.handleResize);
    
    // Controller events
    skillTreeController.on('node_selected', this.updateInfoPanel);
    
    skillTreeController.on('node_hover_start', event => {
      if (!this.selectedNode) {
        this.updateInfoPanel(event);
      }
    });
    
    skillTreeController.on('node_hover_end', () => {
      if (!this.selectedNode) {
        this.infoPanel.innerHTML = '<div class="info-message">Select a skill to view details</div>';
      }
    });
    
    skillTreeController.on('node_unlocked', event => {
      this._updateAvailablePoints(event.availablePoints);
      this.updateInfoPanel({
        nodeId: event.nodeId,
        node: event.node,
        canUnlock: false,
        canLevelUp: skillTreeController.getTree().available_points >= event.node.cost
      });
    });
    
    skillTreeController.on('node_leveled_up', event => {
      this._updateAvailablePoints(event.availablePoints);
      this.updateInfoPanel({
        nodeId: event.nodeId,
        node: event.node,
        canUnlock: false,
        canLevelUp: event.node.level < event.node.max_level && 
                   skillTreeController.getTree().available_points >= event.node.cost
      });
    });
    
    skillTreeController.on('skill_tree_reset', () => {
      const tree = skillTreeController.getTree();
      this._updateAvailablePoints(tree.available_points);
      this.infoPanel.innerHTML = '<div class="info-message">Skill tree has been reset</div>';
      this.selectedNode = null;
    });
    
    skillTreeController.on('skill_tree_error', event => {
      this._showError(event.error);
    });
  }

  /**
   * Set up control buttons
   * @private
   */
  _setupControlButtons() {
    // Reset button
    const resetButton = document.createElement('button');
    resetButton.classList.add('control-button', 'reset-button');
    resetButton.textContent = 'Reset Skill Tree';
    resetButton.addEventListener('click', this.handleResetClick);
    
    // Clear existing buttons
    this.controls.innerHTML = '';
    
    // Add points display
    const pointsDisplay = document.createElement('div');
    pointsDisplay.id = 'available-points';
    pointsDisplay.classList.add('points-display');
    pointsDisplay.textContent = 'Available Points: 0';
    
    // Add buttons
    this.controls.appendChild(pointsDisplay);
    this.controls.appendChild(resetButton);
  }

  /**
   * Update the available points display
   * @param {number} points - The available points
   * @private
   */
  _updateAvailablePoints(points) {
    const pointsDisplay = document.getElementById('available-points');
    if (pointsDisplay) {
      pointsDisplay.textContent = `Available Points: ${points}`;
    }
  }

  /**
   * Show an error message
   * @param {string} message - The error message
   * @private
   */
  _showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = message;
    
    // Clear existing content
    this.infoPanel.innerHTML = '';
    this.infoPanel.appendChild(errorDiv);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (this.infoPanel.contains(errorDiv)) {
        errorDiv.remove();
        
        // Restore previous content if there was a selected node
        if (this.selectedNode) {
          const node = skillTreeController.getTree().nodes[this.selectedNode];
          this.updateInfoPanel({
            nodeId: this.selectedNode,
            node
          });
        } else {
          this.infoPanel.innerHTML = '<div class="info-message">Select a skill to view details</div>';
        }
      }
    }, 5000);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.canvas) {
      // Set canvas to fill its container
      const containerRect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = containerRect.width;
      this.canvas.height = containerRect.height;
      
      // Update renderer
      this.renderer.resize(this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Handle unlock button click
   */
  async handleUnlockClick() {
    if (!this.selectedNode) {
      return;
    }
    
    try {
      await skillTreeController.unlockNode(this.selectedNode);
    } catch (error) {
      this._showError(error.message);
    }
  }

  /**
   * Handle level up button click
   */
  async handleLevelUpClick() {
    if (!this.selectedNode) {
      return;
    }
    
    try {
      await skillTreeController.levelUpNode(this.selectedNode);
    } catch (error) {
      this._showError(error.message);
    }
  }

  /**
   * Handle reset button click
   */
  async handleResetClick() {
    if (confirm('Are you sure you want to reset your skill tree? All spent points will be refunded.')) {
      try {
        await skillTreeController.resetTree();
      } catch (error) {
        this._showError(error.message);
      }
    }
  }

  /**
   * Update the info panel with node details
   * @param {Object} data - The node data
   * @param {string} data.nodeId - The node ID
   * @param {Object} data.node - The node object
   * @param {boolean} data.canUnlock - Whether the node can be unlocked
   * @param {boolean} data.canLevelUp - Whether the node can be leveled up
   */
  updateInfoPanel(data) {
    if (!data.node) {
      return;
    }
    
    // Set as selected node
    this.selectedNode = data.nodeId;
    
    // Create content
    const content = document.createElement('div');
    content.classList.add('node-info');
    
    // Node header
    const header = document.createElement('div');
    header.classList.add('node-header');
    
    const title = document.createElement('h3');
    title.textContent = data.node.name;
    header.appendChild(title);
    
    if (data.node.unlocked && data.node.max_level > 1) {
      const level = document.createElement('div');
      level.classList.add('node-level');
      level.textContent = `Level ${data.node.level}/${data.node.max_level}`;
      header.appendChild(level);
    }
    
    content.appendChild(header);
    
    // Node description
    const description = document.createElement('div');
    description.classList.add('node-description');
    description.textContent = data.node.description;
    content.appendChild(description);
    
    // Node effects
    if (data.node.effects && data.node.effects.length > 0) {
      const effectsContainer = document.createElement('div');
      effectsContainer.classList.add('node-effects');
      
      const effectsTitle = document.createElement('h4');
      effectsTitle.textContent = 'Effects:';
      effectsContainer.appendChild(effectsTitle);
      
      const effectsList = document.createElement('ul');
      data.node.effects.forEach(effect => {
        const effectItem = document.createElement('li');
        
        // Format effect based on type
        if (effect.type === 'stat_boost' || effect.type === 'knowledge_boost') {
          const statName = effect.type === 'stat_boost' ? effect.stat : 'Knowledge';
          effectItem.textContent = `+${effect.value * (data.node.unlocked ? data.node.level : 1)} ${statName}`;
        } else if (effect.type === 'unlock_feature') {
          effectItem.textContent = `Unlocks: ${effect.feature}`;
        } else {
          effectItem.textContent = `${effect.type}: ${effect.value}`;
        }
        
        effectsList.appendChild(effectItem);
      });
      
      effectsContainer.appendChild(effectsList);
      content.appendChild(effectsContainer);
    }
    
    // Prerequisites
    if (data.node.prerequisites && data.node.prerequisites.length > 0 && !data.node.unlocked) {
      const prereqContainer = document.createElement('div');
      prereqContainer.classList.add('node-prerequisites');
      
      const prereqTitle = document.createElement('h4');
      prereqTitle.textContent = 'Prerequisites:';
      prereqContainer.appendChild(prereqTitle);
      
      const prereqList = document.createElement('ul');
      
      // Get tree data
      const tree = skillTreeController.getTree();
      
      data.node.prerequisites.forEach(prereqId => {
        const prereqNode = tree.nodes[prereqId];
        const prereqItem = document.createElement('li');
        
        if (prereqNode) {
          prereqItem.textContent = prereqNode.name;
          
          // Indicate if prerequisite is met
          if (prereqNode.unlocked) {
            prereqItem.classList.add('prerequisite-met');
          } else {
            prereqItem.classList.add('prerequisite-unmet');
          }
        } else {
          prereqItem.textContent = prereqId;
          prereqItem.classList.add('prerequisite-unknown');
        }
        
        prereqList.appendChild(prereqItem);
      });
      
      prereqContainer.appendChild(prereqList);
      content.appendChild(prereqContainer);
    }
    
    // Cost
    const costContainer = document.createElement('div');
    costContainer.classList.add('node-cost');
    costContainer.textContent = `Cost: ${data.node.cost} point${data.node.cost !== 1 ? 's' : ''}`;
    content.appendChild(costContainer);
    
    // Action buttons
    const actionContainer = document.createElement('div');
    actionContainer.classList.add('node-actions');
    
    if (!data.node.unlocked && (data.canUnlock === true)) {
      const unlockButton = document.createElement('button');
      unlockButton.classList.add('action-button', 'unlock-button');
      unlockButton.textContent = 'Unlock';
      unlockButton.addEventListener('click', this.handleUnlockClick);
      actionContainer.appendChild(unlockButton);
    } else if (data.node.unlocked && data.node.level < data.node.max_level && (data.canLevelUp === true)) {
      const levelUpButton = document.createElement('button');
      levelUpButton.classList.add('action-button', 'level-up-button');
      levelUpButton.textContent = 'Level Up';
      levelUpButton.addEventListener('click', this.handleLevelUpClick);
      actionContainer.appendChild(levelUpButton);
    }
    
    content.appendChild(actionContainer);
    
    // Update panel
    this.infoPanel.innerHTML = '';
    this.infoPanel.appendChild(content);
  }
}

export default SkillTreeUI;