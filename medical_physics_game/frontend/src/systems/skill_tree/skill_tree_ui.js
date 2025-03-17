// frontend/src/systems/skill_tree/skill_tree_ui.js

/**
 * SkillTreeUI - Handles interactions and information display for the skill tree
 */
class SkillTreeUI {
    // Configuration
    config = {
      containerId: 'skill-tree-ui',
      controlsContainerId: 'skill-tree-controls',
      infoContainerId: 'skill-tree-info'
    };
    
    // State
    state = {
      initialized: false,
      selectedNode: null,
      reputation: 0,
      skillPointsAvailable: 0,
      specialization_progress: {},
      specializations: [],
      activeFilter: null
    };
    
    /**
     * Initialize the UI
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
      if (this.state.initialized) {
        console.log("SkillTreeUI already initialized");
        return this;
      }
      
      // Apply options
      Object.assign(this.config, options);
      
      // Get container elements
      this.container = document.getElementById(this.config.containerId);
      this.controlsContainer = document.getElementById(this.config.controlsContainerId);
      this.infoContainer = document.getElementById(this.config.infoContainerId);
      
      if (!this.container || !this.controlsContainer || !this.infoContainer) {
        console.error("SkillTreeUI container elements not found");
        return this;
      }
      
      // Initialize event listeners
      this._initEventListeners();
      
      // Show empty state
      this.showEmptyState();
      
      // Mark as initialized
      this.state.initialized = true;
      console.log("SkillTreeUI initialized");
      
      return this;
    }
    
    /**
     * Initialize event listeners
     * @private
     */
    _initEventListeners() {
      // Listen for node selection events
      document.addEventListener('skillNodeSelected', (event) => {
        const { nodeId } = event.detail;
        if (nodeId) {
          // Ask the controller for the node data
          if (window.SkillTreeController) {
            const nodeData = window.SkillTreeController.getNodeData(nodeId);
            if (nodeData) {
              this.showNodeInfo(nodeData);
            }
          }
        } else {
          this.showEmptyState();
        }
      });
    }
    
    /**
     * Setup specialization filters
     * @param {Array} specializations - Array of specialization objects
     */
    setupSpecializationFilters(specializations) {
      if (!this.controlsContainer || !specializations) return;
      
      // Save specializations
      this.state.specializations = specializations;
      
      // Clear container
      this.controlsContainer.innerHTML = '';
      
      // Create "All" filter
      const allFilter = document.createElement('div');
      allFilter.className = 'specialization-filter' + (this.state.activeFilter === null ? ' active' : '');
      allFilter.textContent = 'ALL';
      allFilter.addEventListener('click', () => this.filterBySpecialization(null));
      this.controlsContainer.appendChild(allFilter);
      
      // Create filter for each specialization
      specializations.forEach(spec => {
        const filter = document.createElement('div');
        filter.className = 'specialization-filter' + (this.state.activeFilter === spec.id ? ' active' : '');
        filter.textContent = spec.name.toUpperCase();
        filter.style.borderColor = spec.color || 'transparent';
        
        filter.addEventListener('click', () => this.filterBySpecialization(spec.id));
        
        this.controlsContainer.appendChild(filter);
      });
    }
    
    /**
     * Filter skill tree by specialization
     * @param {String} specializationId - ID of specialization to filter by, or null for all
     */
    filterBySpecialization(specializationId) {
      this.state.activeFilter = specializationId;
      
      // Update filter buttons
      Array.from(this.controlsContainer.children).forEach(filter => {
        if ((filter.textContent === 'ALL' && specializationId === null) ||
            (filter.textContent === this.state.specializations.find(s => s.id === specializationId)?.name.toUpperCase())) {
          filter.classList.add('active');
        } else {
          filter.classList.remove('active');
        }
      });
      
      // Trigger filter event
      const event = new CustomEvent('skillTreeFilter', {
        detail: { specializationId }
      });
      document.dispatchEvent(event);
    }
    
    /**
     * Show node information
     * @param {Object} node - Node data object
     */
    showNodeInfo(node) {
      if (!this.infoContainer || !node) return;
      
      // Save selected node
      this.state.selectedNode = node;
      
      // Update info panel
      this.infoContainer.innerHTML = '';
      
      // Create info content
      const infoContent = document.createElement('div');
      infoContent.className = 'skill-info-content';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'skill-info-header';
      
      const name = document.createElement('div');
      name.className = 'skill-info-name';
      name.textContent = node.name;
      
      const spec = document.createElement('div');
      spec.className = 'skill-info-specialization';
      spec.textContent = this._getSpecializationName(node.specialization);
      
      header.appendChild(name);
      header.appendChild(spec);
      
      // Create description
      const description = document.createElement('div');
      description.className = 'skill-info-description';
      description.textContent = node.description;
      
      // Create effects
      const effects = document.createElement('div');
      effects.className = 'skill-info-effects';
      
      if (node.effects && node.effects.length > 0) {
        const effectsList = document.createElement('ul');
        
        node.effects.forEach(effect => {
          const effectItem = document.createElement('li');
          effectItem.textContent = this._formatEffect(effect);
          effectsList.appendChild(effectItem);
        });
        
        effects.appendChild(effectsList);
      } else {
        effects.textContent = 'No effects';
      }
      
      // Create costs
      const costs = document.createElement('div');
      costs.className = 'skill-info-costs';
      
      if (node.cost) {
        if (node.cost.reputation) {
          const repCost = document.createElement('div');
          repCost.className = 'skill-info-cost';
          
          const repLabel = document.createElement('span');
          repLabel.className = 'cost-label';
          repLabel.textContent = 'Reputation: ';
          
          const repValue = document.createElement('span');
          repValue.className = 'cost-value';
          repValue.textContent = node.cost.reputation;
          
          repCost.appendChild(repLabel);
          repCost.appendChild(repValue);
          costs.appendChild(repCost);
        }
        
        if (node.cost.skill_points) {
          const spCost = document.createElement('div');
          spCost.className = 'skill-info-cost';
          
          const spLabel = document.createElement('span');
          spLabel.className = 'cost-label';
          spLabel.textContent = 'Skill Points: ';
          
          const spValue = document.createElement('span');
          spValue.className = 'cost-value skill-points';
          spValue.textContent = node.cost.skill_points;
          
          spCost.appendChild(spLabel);
          spCost.appendChild(spValue);
          costs.appendChild(spCost);
        }
      }
      
      // Assemble info content
      infoContent.appendChild(header);
      infoContent.appendChild(description);
      infoContent.appendChild(effects);
      infoContent.appendChild(costs);
      
      // Add action buttons
      const actions = document.createElement('div');
      actions.className = 'skill-action-buttons';
      
      // Determine possible actions based on node state
      if (node.state === 'locked') {
        // No actions for locked nodes
        const message = document.createElement('div');
        message.className = 'skill-action-message';
        message.textContent = 'This skill is locked. Unlock prerequisites first.';
        actions.appendChild(message);
      } else if (node.state === 'unlockable') {
        // Can unlock
        const unlockButton = document.createElement('button');
        unlockButton.className = 'skill-action-button unlock-button';
        unlockButton.textContent = 'UNLOCK SKILL';
        unlockButton.disabled = node.cost && node.cost.reputation > this.state.reputation;
        
        unlockButton.addEventListener('click', () => {
          if (window.SkillTreeController) {
            window.SkillTreeController.unlockSkill(node.id);
          }
        });
        
        actions.appendChild(unlockButton);
      } else if (node.state === 'unlocked') {
        // Can activate
        const activateButton = document.createElement('button');
        activateButton.className = 'skill-action-button activate-button';
        activateButton.textContent = 'ACTIVATE SKILL';
        activateButton.disabled = node.cost && node.cost.skill_points > this.state.skillPointsAvailable;
        
        activateButton.addEventListener('click', () => {
          if (window.SkillTreeController) {
            window.SkillTreeController.activateSkill(node.id);
          }
        });
        
        actions.appendChild(activateButton);
      } else if (node.state === 'active') {
        // Can deactivate (except for core skills)
        const deactivateButton = document.createElement('button');
        deactivateButton.className = 'skill-action-button deactivate-button';
        deactivateButton.textContent = 'DEACTIVATE SKILL';
        
        // Core skills can't be deactivated
        if (node.tier === 0 || (node.specialization && node.specialization === 'core')) {
          deactivateButton.disabled = true;
          deactivateButton.title = 'Core skills cannot be deactivated';
        }
        
        deactivateButton.addEventListener('click', () => {
          if (window.SkillTreeController) {
            window.SkillTreeController.deactivateSkill(node.id);
          }
        });
        
        actions.appendChild(deactivateButton);
      }
      
      // Add actions to info content
      infoContent.appendChild(actions);
      
      // Add to container
      this.infoContainer.appendChild(infoContent);
    }
    
    /**
     * Show empty state when no node is selected
     */
    showEmptyState() {
      if (!this.infoContainer) return;
      
      this.infoContainer.innerHTML = `
        <div class="skill-info-empty">
          <p>Select a skill to view details</p>
        </div>
      `;
    }
    
    /**
     * Update stats display
     * @param {Number} reputation - Current reputation
     * @param {Number} skillPoints - Available skill points
     * @param {Object} specializationProgress - Specialization progress object
     */
    updateStats(reputation, skillPoints, specializationProgress) {
      // Update state
      this.state.reputation = reputation;
      this.state.skillPointsAvailable = skillPoints;
      this.state.specialization_progress = specializationProgress;
      
      // Update UI elements
      const reputationElement = document.getElementById('reputation-value');
      if (reputationElement) {
        reputationElement.textContent = reputation;
      }
      
      const skillPointsElement = document.getElementById('skill-points-value');
      if (skillPointsElement) {
        skillPointsElement.textContent = skillPoints;
      }
      
      // If a node is selected, refresh the info panel
      // to update button states based on new stats
      if (this.state.selectedNode) {
        // Ask the controller for the latest node data
        if (window.SkillTreeController) {
          const nodeData = window.SkillTreeController.getNodeData(this.state.selectedNode.id);
          if (nodeData) {
            this.showNodeInfo(nodeData);
          }
        }
      }
    }
    
    /**
     * Get specialization name by ID
     * @private
     * @param {String} specializationId - ID of specialization
     * @returns {String} Specialization name
     */
    _getSpecializationName(specializationId) {
      if (!specializationId) return 'Core';
      
      const spec = this.state.specializations.find(s => s.id === specializationId);
      return spec ? spec.name : 'Unknown';
    }
    
    /**
     * Format effect for display
     * @private
     * @param {Object} effect - Effect object
     * @returns {String} Formatted effect description
     */
    _formatEffect(effect) {
      if (!effect || !effect.type) return 'Unknown effect';
      
      const formatMap = {
        'insight_gain_flat': `+${effect.value} Insight gain`,
        'insight_gain_multiplier': `${(effect.value * 100).toFixed(0)}% Insight gain`,
        'patient_outcome_multiplier': `${(effect.value * 100).toFixed(0)}% to patient outcomes`,
        'equipment_cost_reduction': `${(effect.value * 100).toFixed(0)}% equipment cost reduction`,
        'reveal_parameter': `Reveal ${effect.value} parameters`,
        'critical_insight_multiplier': `${(effect.value * 100).toFixed(0)}% critical insight bonus`,
        'auto_solve_chance': `${(effect.value * 100).toFixed(0)}% chance to auto-solve`,
        'failure_conversion': `Convert failures to ${(effect.value * 100).toFixed(0)}% success`,
        'recall_similar_questions': 'Recall similar questions from previous runs'
      };
      
      let baseText = formatMap[effect.type] || `${effect.type}: ${effect.value}`;
      
      // Add condition if present
      if (effect.condition) {
        baseText += ` when ${effect.condition}`;
      }
      
      return baseText;
    }
  }
  
  // Export for module use
  export default SkillTreeUI;
  
  // For backward compatibility with existing code
  window.SkillTreeUI = new SkillTreeUI();