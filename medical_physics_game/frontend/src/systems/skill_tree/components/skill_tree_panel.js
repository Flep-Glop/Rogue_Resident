// frontend/src/systems/skill_tree/components/skill_tree_panel.js

/**
 * SkillTreePanel
 * Displays detailed information about selected skill tree nodes
 */
class SkillTreePanel {
    constructor(options = {}) {
      this.options = Object.assign({
        containerId: 'skill-tree-info',
        emptyStateMessage: 'Select a skill to view details',
        effectDescriptionFormatter: this._defaultEffectFormatter
      }, options);
      
      this.container = null;
      this.eventSystem = null;
      this.initialized = false;
    }
    
    /**
     * Initialize the panel
     * @param {Object} options Configuration options
     * @returns {SkillTreePanel} This instance for chaining
     */
    initialize(options = {}) {
      if (this.initialized) return this;
      
      // Apply any new options
      Object.assign(this.options, options);
      
      // Get container
      this.container = document.getElementById(this.options.containerId);
      if (!this.container) {
        console.error(`Skill tree info container not found: ${this.options.containerId}`);
        return this;
      }
      
      // Set up event system
      this.eventSystem = options.eventSystem || window.EventSystem;
      
      // Show empty state initially
      this._showEmptyState();
      
      this.initialized = true;
      return this;
    }
    
    /**
     * Show detailed information about a skill node
     * @param {String} nodeId Node ID
     * @param {Object} node Node data
     * @param {Boolean} isUnlocked Whether node is unlocked
     * @param {Boolean} canUnlock Whether node can be unlocked
     */
    showNodeDetails(nodeId, node, isUnlocked, canUnlock) {
      if (!this.initialized) {
        this.initialize();
      }
      
      if (!this.container || !node) {
        return;
      }
      
      // Clear previous content
      this.container.innerHTML = '';
      
      // Create details container
      const detailsContainer = document.createElement('div');
      detailsContainer.className = 'skill-details';
      
      // Create header section
      const header = this._createHeader(node, isUnlocked);
      detailsContainer.appendChild(header);
      
      // Create description section
      const description = this._createDescription(node);
      detailsContainer.appendChild(description);
      
      // Create effects section
      if (node.effects && node.effects.length > 0) {
        const effects = this._createEffectsSection(node.effects);
        detailsContainer.appendChild(effects);
      }
      
      // Create costs section
      const costs = this._createCostsSection(node.cost);
      detailsContainer.appendChild(costs);
      
      // Create action button
      if (!isUnlocked && canUnlock) {
        const actionButton = this._createActionButton(nodeId, node);
        detailsContainer.appendChild(actionButton);
      } else if (!isUnlocked) {
        const lockedMessage = this._createLockedMessage(node);
        detailsContainer.appendChild(lockedMessage);
      }
      
      // Add to container
      this.container.appendChild(detailsContainer);
    }
    
    /**
     * Show empty state message
     * @private
     */
    _showEmptyState() {
      if (!this.container) return;
      
      this.container.innerHTML = `
        <div class="skill-info-empty">
          <p>${this.options.emptyStateMessage}</p>
        </div>
      `;
    }
    
    /**
     * Create header section
     * @param {Object} node Node data
     * @param {Boolean} isUnlocked Whether node is unlocked
     * @returns {HTMLElement} Header element
     * @private
     */
    _createHeader(node, isUnlocked) {
      const header = document.createElement('div');
      header.className = 'skill-header';
      
      // Status indicator
      const statusClass = isUnlocked ? 'status-unlocked' : 'status-locked';
      
      // Specialization indicator
      let specializationClass = '';
      if (node.specialization) {
        specializationClass = `specialization-${node.specialization}`;
      }
      
      header.innerHTML = `
        <div class="skill-title-container">
          <div class="skill-icon ${statusClass}">
            <i class="skill-icon-${node.visual?.icon || 'default'}"></i>
          </div>
          <div class="skill-title-wrapper">
            <h3 class="skill-title ${specializationClass}">${node.name}</h3>
            ${node.specialization ? `<div class="skill-specialization">${node.specialization}</div>` : ''}
          </div>
        </div>
        <div class="skill-tier">Tier ${node.tier}</div>
      `;
      
      return header;
    }
    
    /**
     * Create description section
     * @param {Object} node Node data
     * @returns {HTMLElement} Description element
     * @private
     */
    _createDescription(node) {
      const description = document.createElement('div');
      description.className = 'skill-description';
      description.innerHTML = `<p>${node.description || 'No description available.'}</p>`;
      return description;
    }
    
    /**
     * Create effects section
     * @param {Array} effects Node effects
     * @returns {HTMLElement} Effects element
     * @private
     */
    _createEffectsSection(effects) {
      const effectsSection = document.createElement('div');
      effectsSection.className = 'skill-effects-section';
      
      const effectsTitle = document.createElement('h4');
      effectsTitle.className = 'section-title';
      effectsTitle.textContent = 'Effects';
      effectsSection.appendChild(effectsTitle);
      
      const effectsList = document.createElement('ul');
      effectsList.className = 'effects-list';
      
      effects.forEach(effect => {
        const effectItem = document.createElement('li');
        effectItem.className = 'effect-item';
        
        // Format effect description using the formatter
        const description = this.options.effectDescriptionFormatter(effect);
        
        effectItem.innerHTML = `
          <div class="effect-type">${effect.type}</div>
          <div class="effect-description">${description}</div>
          ${effect.condition ? `<div class="effect-condition">When: ${effect.condition}</div>` : ''}
        `;
        
        effectsList.appendChild(effectItem);
      });
      
      effectsSection.appendChild(effectsList);
      return effectsSection;
    }
    
    /**
     * Create costs section
     * @param {Object} cost Node cost
     * @returns {HTMLElement} Costs element
     * @private
     */
    _createCostsSection(cost) {
      const costsSection = document.createElement('div');
      costsSection.className = 'skill-costs-section';
      
      const costsTitle = document.createElement('h4');
      costsTitle.className = 'section-title';
      costsTitle.textContent = 'Costs';
      costsSection.appendChild(costsTitle);
      
      const costsList = document.createElement('div');
      costsList.className = 'costs-list';
      
      if (cost?.skill_points) {
        const skillPointsCost = document.createElement('div');
        skillPointsCost.className = 'cost-item';
        skillPointsCost.innerHTML = `
          <div class="cost-label">Skill Points:</div>
          <div class="cost-value">${cost.skill_points}</div>
        `;
        costsList.appendChild(skillPointsCost);
      }
      
      if (cost?.reputation) {
        const reputationCost = document.createElement('div');
        reputationCost.className = 'cost-item';
        reputationCost.innerHTML = `
          <div class="cost-label">Reputation:</div>
          <div class="cost-value">${cost.reputation}</div>
        `;
        costsList.appendChild(reputationCost);
      }
      
      costsSection.appendChild(costsList);
      return costsSection;
    }
    
    /**
     * Create action button
     * @param {String} nodeId Node ID
     * @param {Object} node Node data
     * @returns {HTMLElement} Button element
     * @private
     */
    _createActionButton(nodeId, node) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'skill-action-container';
      
      const button = document.createElement('button');
      button.className = 'skill-unlock-button';
      button.textContent = 'Unlock Skill';
      
      // Add click handler
      button.addEventListener('click', () => {
        this._notifyUnlockRequested(nodeId);
      });
      
      buttonContainer.appendChild(button);
      return buttonContainer;
    }
    
    /**
     * Create locked message
     * @param {Object} node Node data
     * @returns {HTMLElement} Message element
     * @private
     */
    _createLockedMessage(node) {
      const messageContainer = document.createElement('div');
      messageContainer.className = 'skill-locked-message';
      
      // Determine reason
      let reason = '';
      
      if (node.prerequisites && node.prerequisites.length > 0) {
        reason = 'Prerequisite skills must be unlocked first.';
      } else if (node.cost?.skill_points) {
        reason = `Requires ${node.cost.skill_points} Skill Points.`;
      } else if (node.cost?.reputation) {
        reason = `Requires ${node.cost.reputation} Reputation.`;
      } else {
        reason = 'Required conditions not met.';
      }
      
      messageContainer.innerHTML = `
        <div class="locked-icon">🔒</div>
        <p class="locked-text">${reason}</p>
      `;
      
      return messageContainer;
    }
    
    /**
     * Default effect formatter
     * @param {Object} effect Effect data
     * @returns {String} Formatted description
     * @private
     */
    _defaultEffectFormatter(effect) {
      let description = '';
      
      switch (effect.type) {
        case 'insight_gain_flat':
          description = `+${effect.value} Insight gain`;
          break;
        case 'insight_gain_multiplier':
          description = `+${(effect.value - 1) * 100}% Insight gain`;
          break;
        case 'patient_outcome_multiplier':
          description = `+${(effect.value - 1) * 100}% Patient outcomes`;
          break;
        case 'equipment_cost_reduction':
          description = `-${effect.value * 100}% Equipment costs`;
          break;
        case 'reveal_parameter':
          description = `Reveals ${effect.value} parameter in complex problems`;
          break;
        default:
          // For other types, just show type and value
          description = `${effect.type}: ${effect.value}`;
      }
      
      return description;
    }
    
    /**
     * Notify that unlock was requested
     * @param {String} nodeId Node ID to unlock
     * @private
     */
    _notifyUnlockRequested(nodeId) {
      if (this.eventSystem) {
        this.eventSystem.publish('ui.node_unlock_requested', { nodeId });
      }
    }
  }
  
  export default SkillTreePanel;