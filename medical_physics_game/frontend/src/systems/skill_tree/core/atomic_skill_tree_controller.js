// frontend/src/systems/skill_tree/core/atomic_skill_tree_controller.js

import AtomicSkillTreeRenderer from '../components/atomic_skill_tree_renderer.js';

/**
 * AtomicSkillTreeController
 * Controller for managing skill tree interactions and state
 */
class AtomicSkillTreeController {
  /**
   * Initialize the controller
   */
  constructor() {
    this.renderer = null;
    this.skillTreeData = null;
    this.progressData = null;
    this.apiClient = null;
    this.skillEffectSystem = null;
    
    // Element references
    this.elements = {
      visualization: null,
      infoPanel: null,
      controls: null
    };
    
    // Event handlers
    this.onNodeSelect = this._handleNodeSelect.bind(this);
    
    // Initialize flag
    this.initialized = false;
  }
  
  /**
   * Initialize the controller
   * @param {Object} options - Configuration options
   * @returns {AtomicSkillTreeController} This instance for chaining
   */
  initialize(options = {}) {
    if (this.initialized) {
      console.log("Skill tree controller already initialized");
      return this;
    }
    
    console.log("Initializing atomic skill tree controller");
    
    // Get container elements
    this.elements.visualization = document.getElementById(options.renderContainerId || 'skill-tree-visualization');
    this.elements.infoPanel = document.getElementById(options.infoContainerId || 'skill-tree-info');
    this.elements.controls = document.getElementById(options.controlsContainerId || 'skill-tree-controls');
    
    if (!this.elements.visualization) {
      console.error("Skill tree visualization container not found");
      return this;
    }
    
    // Initialize renderer
    this.renderer = new AtomicSkillTreeRenderer(options.renderContainerId || 'skill-tree-visualization');
    this.renderer.initialize();
    
    // Add event listeners
    this.elements.visualization.addEventListener("skillNodeSelected", this.onNodeSelect);
    
    // Set initialized flag
    this.initialized = true;
    console.log("Skill tree controller initialized");
    
    // Initialize effect system if available
    if (window.SkillEffectSystem) {
      this.skillEffectSystem = window.SkillEffectSystem;
      if (!this.skillEffectSystem.initialized) {
        this.skillEffectSystem.initialize();
      }
    }
    
    return this;
  }
  
  /**
   * Load skill tree data and progress
   * @param {Object} skillTreeData - Skill tree structure data
   * @param {Object} progressData - Player's progress data
   * @returns {AtomicSkillTreeController} This instance for chaining
   */
  loadSkillTree(skillTreeData, progressData) {
    if (!this.initialized || !this.renderer) {
      console.error("Controller not initialized");
      return this;
    }
    
    console.log("Loading skill tree data and progress");
    
    // Store data
    this.skillTreeData = skillTreeData;
    this.progressData = progressData;
    
    // Extract unlocked and available nodes
    const unlockedNodes = progressData.unlocked_skills || [];
    const availableNodes = this._determineAvailableNodes(unlockedNodes);
    
    // Update renderer
    this.renderer.loadSkillTree(skillTreeData, unlockedNodes, availableNodes);
    
    // Update specialization filters
    this._updateSpecializationFilters(skillTreeData.specializations);
    
    // Update stats display
    this._updateStatsDisplay();
    
    console.log("Skill tree data loaded");
    
    return this;
  }
  
  /**
   * Determine which nodes are available for unlocking
   * @private
   * @param {Array} unlockedNodes - Array of already unlocked node IDs
   * @returns {Array} Array of available node IDs
   */
  _determineAvailableNodes(unlockedNodes) {
    if (!this.skillTreeData || !this.skillTreeData.nodes) {
      return [];
    }
    
    // Find nodes that are connected to unlocked nodes but not unlocked themselves
    const availableNodes = [];
    const unlocked = new Set(unlockedNodes);
    
    // Check each node
    this.skillTreeData.nodes.forEach(node => {
      // Skip if already unlocked
      if (unlocked.has(node.id)) {
        return;
      }
      
      // Check if all prerequisites are unlocked
      const prerequisites = this._getNodePrerequisites(node.id);
      const allPrereqsUnlocked = prerequisites.every(prereqId => unlocked.has(prereqId));
      
      if (allPrereqsUnlocked && prerequisites.length > 0) {
        availableNodes.push(node.id);
      }
    });
    
    return availableNodes;
  }
  
  /**
   * Get prerequisites for a node
   * @private
   * @param {String} nodeId - Node ID
   * @returns {Array} Array of prerequisite node IDs
   */
  _getNodePrerequisites(nodeId) {
    if (!this.skillTreeData || !this.skillTreeData.connections) {
      return [];
    }
    
    // Find all connections where this node is the target
    return this.skillTreeData.connections
      .filter(conn => conn.target === nodeId)
      .map(conn => conn.source);
  }
  
  /**
   * Update specialization filters based on available specializations
   * @private
   * @param {Array} specializations - Specialization definitions
   */
  _updateSpecializationFilters(specializations) {
    if (!this.elements.controls) return;
    
    const filtersContainer = this.elements.controls;
    filtersContainer.innerHTML = '';
    
    // Create "All" filter
    const allFilter = document.createElement('div');
    allFilter.className = 'specialization-filter active';
    allFilter.dataset.specialization = 'all';
    allFilter.textContent = 'All Specializations';
    allFilter.addEventListener('click', () => this._filterBySpecialization('all'));
    filtersContainer.appendChild(allFilter);
    
    // Create filter for each specialization
    specializations.forEach(spec => {
      const filter = document.createElement('div');
      filter.className = 'specialization-filter';
      filter.dataset.specialization = spec.id;
      
      const indicator = document.createElement('span');
      indicator.className = `filter-indicator filter-${spec.id}`;
      
      const text = document.createTextNode(spec.name);
      
      filter.appendChild(indicator);
      filter.appendChild(text);
      
      filter.addEventListener('click', () => this._filterBySpecialization(spec.id));
      
      filtersContainer.appendChild(filter);
    });
  }
  
  /**
   * Filter skill tree by specialization
   * @private
   * @param {String} specializationId - Specialization ID to filter by
   */
  _filterBySpecialization(specializationId) {
    // Update filter UI
    if (this.elements.controls) {
      const filters = this.elements.controls.querySelectorAll('.specialization-filter');
      filters.forEach(filter => {
        if (filter.dataset.specialization === specializationId) {
          filter.classList.add('active');
        } else {
          filter.classList.remove('active');
        }
      });
    }
    
    // Apply filter to renderer
    // TODO: Implement filtering in renderer
    console.log(`Filtering by specialization: ${specializationId}`);
  }
  
  /**
   * Update stats display
   * @private
   */
  _updateStatsDisplay() {
    // Update reputation value
    const repElement = document.getElementById('reputation-value');
    if (repElement && this.progressData) {
      repElement.textContent = this.progressData.reputation || 0;
    }
    
    // Update skill points value
    const pointsElement = document.getElementById('skill-points-value');
    if (pointsElement && this.progressData) {
      pointsElement.textContent = this.progressData.skill_points_available || 0;
    }
    
    // Update specialization progress
    if (this.progressData && this.progressData.specialization_progress) {
      Object.entries(this.progressData.specialization_progress).forEach(([spec, progress]) => {
        const progressElement = document.getElementById(`${spec}-progress`);
        if (progressElement) {
          progressElement.textContent = progress;
        }
      });
    }
  }
  
  /**
   * Handle node selection event
   * @private
   * @param {CustomEvent} event - Node selection event
   */
  _handleNodeSelect(event) {
    const nodeId = event.detail.nodeId;
    console.log(`Node selected: ${nodeId}`);
    
    // Find node data
    const node = this.skillTreeData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Update info panel
    this._updateNodeInfoPanel(node);
  }
  
  /**
   * Update node info panel with selected node details
   * @private
   * @param {Object} node - Selected node data
   */
  _updateNodeInfoPanel(node) {
    if (!this.elements.infoPanel) return;
    
    // Determine node state
    let state = 'locked';
    if (this.progressData.unlocked_skills && this.progressData.unlocked_skills.includes(node.id)) {
      state = 'unlocked';
    } else if (this._determineAvailableNodes(this.progressData.unlocked_skills || []).includes(node.id)) {
      state = 'available';
    }
    
    // Create HTML for info panel
    let panelHTML = `
      <div class="skill-info-header">
        <h3>${node.name}</h3>
        <div class="skill-info-type ${node.specialization || 'core'}">${node.specialization || 'Core'} - Tier ${node.tier || 0}</div>
      </div>
      <div class="skill-info-description">
        <p>${node.description}</p>
      </div>
    `;
    
    // Add effects
    if (node.effects && node.effects.length > 0) {
      panelHTML += `
        <div class="skill-info-effects">
          <h4>Effects:</h4>
          <ul>
      `;
      
      node.effects.forEach(effect => {
        panelHTML += `<li>${this._formatEffectDescription(effect)}</li>`;
      });
      
      panelHTML += `
          </ul>
        </div>
      `;
    }
    
    // Add unlock button for available nodes
    if (state === 'available') {
      const canAfford = (this.progressData.reputation || 0) >= (node.cost?.reputation || 0) && 
                        (this.progressData.skill_points_available || 0) >= (node.cost?.skill_points || 0);
      
      panelHTML += `
        <div class="skill-info-actions">
          <button class="skill-action-button ${canAfford ? 'unlock' : 'disabled'}" ${canAfford ? 'onclick="window.SkillTreeController.unlockNode(\'' + node.id + '\')"' : 'disabled'}>
            Unlock (${node.cost?.reputation || 0} Rep, ${node.cost?.skill_points || 0} SP)
          </button>
        </div>
      `;
    }
    
    // Update panel content
    this.elements.infoPanel.innerHTML = panelHTML;
  }
  
  /**
   * Format effect description for display
   * @private
   * @param {Object} effect - Effect data
   * @returns {String} Formatted description
   */
  _formatEffectDescription(effect) {
    let description = "";
    
    // Handle different effect types
    switch (effect.type) {
      case "insight_gain_multiplier":
        description = `${effect.value}x Insight Gain`;
        break;
      case "insight_gain_flat":
        description = `+${effect.value} Insight`;
        break;
      case "patient_outcome_multiplier":
        description = `+${Math.round((effect.value - 1) * 100)}% Patient Outcome Rating`;
        break;
      case "critical_insight_multiplier":
        description = `${effect.value}x Critical Insight Bonus`;
        break;
      default:
        description = `${effect.type}: ${effect.value}`;
    }
    
    // Add condition if present
    if (effect.condition) {
      description += ` (when ${effect.condition})`;
    }
    
    return description;
  }
  
  /**
   * Unlock a skill node
   * @param {String} nodeId - ID of node to unlock
   * @returns {Promise} Promise resolving to success status
   */
  unlockNode(nodeId) {
    console.log(`Unlocking node: ${nodeId}`);
    
    // Find node data
    const node = this.skillTreeData.nodes.find(n => n.id === nodeId);
    if (!node) {
      return Promise.reject(new Error("Node not found"));
    }
    
    // Check if player can afford the node
    if (
      this.progressData.reputation < (node.cost?.reputation || 0) ||
      this.progressData.skill_points_available < (node.cost?.skill_points || 0)
    ) {
      return Promise.reject(new Error("Cannot afford node"));
    }
    
    // Update local progress data
    this.progressData.reputation -= (node.cost?.reputation || 0);
    this.progressData.skill_points_available -= (node.cost?.skill_points || 0);
    
    if (!this.progressData.unlocked_skills) {
      this.progressData.unlocked_skills = [];
    }
    
    this.progressData.unlocked_skills.push(nodeId);
    
    // Update specialization progress
    if (node.specialization && this.progressData.specialization_progress) {
      if (!this.progressData.specialization_progress[node.specialization]) {
        this.progressData.specialization_progress[node.specialization] = 0;
      }
      this.progressData.specialization_progress[node.specialization]++;
    }
    
    // Update UI
    this._updateStatsDisplay();
    
    // Update renderer
    const availableNodes = this._determineAvailableNodes(this.progressData.unlocked_skills);
    this.renderer.updateNodeStates(this.progressData.unlocked_skills, availableNodes);
    
    // Apply skill effects if effect system is available
    if (this.skillEffectSystem) {
      this.skillEffectSystem.applySkillEffects(node);
    }
    
    // Send update to server
    return this.saveProgress()
      .then(response => {
        // Refresh node info panel
        this._updateNodeInfoPanel(node);
        return response;
      });
  }
  
  /**
   * Save progress to server
   * @returns {Promise} Promise resolving to server response
   */
  saveProgress() {
    return new Promise((resolve, reject) => {
      // Use fetch to save progress to server
      fetch('/api/skill-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.progressData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Progress saved successfully", data);
        resolve(data);
      })
      .catch(error => {
        console.error("Error saving progress:", error);
        reject(error);
      });
    });
  }
}

// Create a global instance (singleton)
window.AtomicSkillTreeController = new AtomicSkillTreeController();

// For backward compatibility
if (!window.SkillTreeController) {
  window.SkillTreeController = window.AtomicSkillTreeController;
}

export default AtomicSkillTreeController;