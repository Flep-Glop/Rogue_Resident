// skill_tree_ui.js - UI component for the skill tree

/**
 * SkillTreeUI - Manages the UI elements and interactions for the skill tree
 */
const SkillTreeUI = {
  // Configuration with sensible defaults
  config: {
      containerId: 'skill-tree-ui',
      controlsContainerId: 'skill-tree-controls',
      infoContainerId: 'skill-tree-info',
      filterMenuId: 'specialization-filter',
      unlockButtonId: 'unlock-skill-button',
      activateButtonId: 'activate-skill-button',
      deactivateButtonId: 'deactivate-skill-button',
      statsContainerId: 'skill-tree-stats',
      theme: 'dark'  // 'dark' or 'light'
  },
  
  // UI element references
  elements: {
      container: null,
      controls: null,
      info: null,
      filterMenu: null,
      unlockButton: null,
      activateButton: null,
      deactivateButton: null,
      statsContainer: null,
      specializationTabs: {}
  },
  
  // State
  state: {
      initialized: false,
      currentSpecialization: null,
      selectedNode: null,
      errorState: false
  },
  
  /**
   * Initialize the UI
   * @param {Object} options - Configuration options
   * @returns {Boolean} Success status
   */
  initialize: function(options = {}) {
      console.log("Initializing skill tree UI");
      
      // Apply options
      Object.assign(this.config, options);
      
      // Check if already initialized
      if (this.state.initialized) {
          console.log("SkillTreeUI already initialized");
          return true;
      }
      
      // Find required containers
      const allContainersFound = this._findUIContainers();
      
      if (!allContainersFound) {
          console.warn("Some UI containers not found, attempting to create them");
          
          // Try to create missing containers
          const containerCreated = this._createMissingContainers();
          
          if (!containerCreated) {
              console.error("Failed to create UI containers");
              this.state.errorState = true;
              return false;
          }
      }
      
      // Create UI elements
      this._createUIElements();
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Set theme
      this._applyTheme(this.config.theme);
      
      // Mark as initialized
      this.state.initialized = true;
      console.log("SkillTreeUI initialized successfully");
      
      return true;
  },
  
  /**
   * Find all required UI containers
   * @private
   * @returns {Boolean} True if all containers found
   */
  _findUIContainers: function() {
      // Get main container
      this.elements.container = document.getElementById(this.config.containerId);
      
      if (!this.elements.container) {
          console.error(`UI container not found: ${this.config.containerId}`);
          return false;
      }
      
      // Get controls container
      this.elements.controls = document.getElementById(this.config.controlsContainerId);
      
      // Get info container
      this.elements.info = document.getElementById(this.config.infoContainerId);
      
      return this.elements.container && this.elements.controls && this.elements.info;
  },
  
  /**
   * Create missing containers if needed
   * @private
   * @returns {Boolean} True if containers were created successfully
   */
  _createMissingContainers: function() {
      // If main container doesn't exist, we can't do anything
      if (!this.elements.container) {
          console.error("Cannot create UI containers: main container not found");
          return false;
      }
      
      // Create controls container if needed
      if (!this.elements.controls) {
          console.log(`Creating controls container: ${this.config.controlsContainerId}`);
          this.elements.controls = document.createElement('div');
          this.elements.controls.id = this.config.controlsContainerId;
          this.elements.controls.className = 'skill-tree-controls';
          this.elements.container.appendChild(this.elements.controls);
      }
      
      // Create info container if needed
      if (!this.elements.info) {
          console.log(`Creating info container: ${this.config.infoContainerId}`);
          this.elements.info = document.createElement('div');
          this.elements.info.id = this.config.infoContainerId;
          this.elements.info.className = 'skill-tree-info';
          this.elements.container.appendChild(this.elements.info);
      }
      
      return this.elements.controls && this.elements.info;
  },
  
  /**
   * Create UI elements
   * @private
   */
  _createUIElements: function() {
      // Clear existing content
      this.elements.controls.innerHTML = '';
      this.elements.info.innerHTML = '';
      
      // Create filter menu
      this._createFilterMenu();
      
      // Create stats panel
      this._createStatsPanel();
      
      // Create node info panel
      this._createNodeInfoPanel();
      
      // Create action buttons
      this._createActionButtons();
  },
  
  /**
   * Create filter menu
   * @private
   */
  _createFilterMenu: function() {
      // Create filter menu container
      this.elements.filterMenu = document.createElement('div');
      this.elements.filterMenu.id = this.config.filterMenuId;
      this.elements.filterMenu.className = 'specialization-filter';
      
      // Add "All" tab
      const allTab = document.createElement('div');
      allTab.className = 'filter-tab tab-all active';
      allTab.textContent = 'All';
      allTab.dataset.specialization = 'all';
      this.elements.filterMenu.appendChild(allTab);
      
      // Add to controls
      this.elements.controls.appendChild(this.elements.filterMenu);
  },
  
  /**
   * Create stats panel
   * @private
   */
  _createStatsPanel: function() {
      // Create stats container
      this.elements.statsContainer = document.createElement('div');
      this.elements.statsContainer.id = this.config.statsContainerId;
      this.elements.statsContainer.className = 'skill-tree-stats';
      
      // Create reputation display
      const reputationContainer = document.createElement('div');
      reputationContainer.className = 'reputation-container';
      
      const reputationLabel = document.createElement('div');
      reputationLabel.className = 'stat-label';
      reputationLabel.textContent = 'Reputation:';
      reputationContainer.appendChild(reputationLabel);
      
      const reputationValue = document.createElement('div');
      reputationValue.className = 'stat-value reputation-value';
      reputationValue.textContent = '0';
      reputationContainer.appendChild(reputationValue);
      
      this.elements.statsContainer.appendChild(reputationContainer);
      
      // Create skill points display
      const skillPointsContainer = document.createElement('div');
      skillPointsContainer.className = 'skill-points-container';
      
      const skillPointsLabel = document.createElement('div');
      skillPointsLabel.className = 'stat-label';
      skillPointsLabel.textContent = 'Skill Points:';
      skillPointsContainer.appendChild(skillPointsLabel);
      
      const skillPointsValue = document.createElement('div');
      skillPointsValue.className = 'stat-value skill-points-value';
      skillPointsValue.textContent = '0';
      skillPointsContainer.appendChild(skillPointsValue);
      
      this.elements.statsContainer.appendChild(skillPointsContainer);
      
      // Create specialization progress section
      const specializationProgressContainer = document.createElement('div');
      specializationProgressContainer.className = 'specialization-progress-container';
      
      const progressHeader = document.createElement('h3');
      progressHeader.textContent = 'Specialization Progress';
      specializationProgressContainer.appendChild(progressHeader);
      
      const progressList = document.createElement('div');
      progressList.className = 'specialization-progress-list';
      specializationProgressContainer.appendChild(progressList);
      
      this.elements.statsContainer.appendChild(specializationProgressContainer);
      
      // Add to controls
      this.elements.controls.appendChild(this.elements.statsContainer);
  },
  
  /**
   * Create node info panel
   * @private
   */
  _createNodeInfoPanel: function() {
      const nodeInfoPanel = document.createElement('div');
      nodeInfoPanel.className = 'node-info-panel';
      
      // Node name
      const nodeName = document.createElement('h2');
      nodeName.className = 'node-name';
      nodeName.textContent = 'Select a skill node';
      nodeInfoPanel.appendChild(nodeName);
      
      // Specialization
      const nodeSpecialization = document.createElement('div');
      nodeSpecialization.className = 'node-specialization';
      nodeInfoPanel.appendChild(nodeSpecialization);
      
      // Description
      const nodeDescription = document.createElement('div');
      nodeDescription.className = 'node-description';
      nodeInfoPanel.appendChild(nodeDescription);
      
      // Effects list
      const effectsHeader = document.createElement('h3');
      effectsHeader.textContent = 'Effects';
      nodeInfoPanel.appendChild(effectsHeader);
      
      const effectsList = document.createElement('ul');
      effectsList.className = 'effects-list';
      nodeInfoPanel.appendChild(effectsList);
      
      // Requirements
      const requirementsContainer = document.createElement('div');
      requirementsContainer.className = 'node-requirements';
      
      const requirementsHeader = document.createElement('h3');
      requirementsHeader.textContent = 'Requirements';
      requirementsContainer.appendChild(requirementsHeader);
      
      const reqList = document.createElement('ul');
      reqList.className = 'requirements-list';
      requirementsContainer.appendChild(reqList);
      
      nodeInfoPanel.appendChild(requirementsContainer);
      
      // Add to info panel
      this.elements.info.appendChild(nodeInfoPanel);
  },
  
  /**
   * Create action buttons
   * @private
   */
  _createActionButtons: function() {
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'skill-action-buttons';
      
      // Create unlock button
      this.elements.unlockButton = document.createElement('button');
      this.elements.unlockButton.id = this.config.unlockButtonId;
      this.elements.unlockButton.className = 'unlock-skill-button';
      this.elements.unlockButton.textContent = 'Unlock Skill';
      this.elements.unlockButton.disabled = true;
      buttonContainer.appendChild(this.elements.unlockButton);
      
      // Create activate button
      this.elements.activateButton = document.createElement('button');
      this.elements.activateButton.id = this.config.activateButtonId;
      this.elements.activateButton.className = 'activate-skill-button';
      this.elements.activateButton.textContent = 'Activate Skill';
      this.elements.activateButton.disabled = true;
      buttonContainer.appendChild(this.elements.activateButton);
      
      // Create deactivate button
      this.elements.deactivateButton = document.createElement('button');
      this.elements.deactivateButton.id = this.config.deactivateButtonId;
      this.elements.deactivateButton.className = 'deactivate-skill-button';
      this.elements.deactivateButton.textContent = 'Deactivate Skill';
      this.elements.deactivateButton.disabled = true;
      buttonContainer.appendChild(this.elements.deactivateButton);
      
      // Add to info panel
      this.elements.info.appendChild(buttonContainer);
  },
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners: function() {
      // Listen for node selection
      document.addEventListener('skillNodeSelected', this._handleNodeSelected.bind(this));
      
      // Filter menu clicks
      if (this.elements.filterMenu) {
          this.elements.filterMenu.addEventListener('click', (event) => {
              if (event.target.classList.contains('filter-tab')) {
                  this._handleFilterClick(event.target.dataset.specialization);
              }
          });
      }
      
      // Action buttons
      if (this.elements.unlockButton) {
          this.elements.unlockButton.addEventListener('click', this._handleUnlockClick.bind(this));
      }
      
      if (this.elements.activateButton) {
          this.elements.activateButton.addEventListener('click', this._handleActivateClick.bind(this));
      }
      
      if (this.elements.deactivateButton) {
          this.elements.deactivateButton.addEventListener('click', this._handleDeactivateClick.bind(this));
      }
      
      // Error event listener
      document.addEventListener('skillTreeError', this._handleError.bind(this));
      
      // Handle window resize
      window.addEventListener('resize', this._handleResize.bind(this));
  },
  
  /**
   * Set up specialization filters
   * @param {Object} specializations - Specialization data
   * @returns {Boolean} Success status
   */
  setupSpecializationFilters: function(specializations) {
      if (!this.state.initialized) {
          console.warn("Cannot set up filters: UI not initialized");
          return false;
      }
      
      if (!this.elements.filterMenu) {
          console.error("Filter menu element not found");
          return false;
      }
      
      // Reset specialization tabs collection
      this.elements.specializationTabs = {};
      
      // Clear existing tabs
      this.elements.filterMenu.innerHTML = '';
      
      // Create "All" tab
      const allTab = document.createElement('div');
      allTab.className = 'filter-tab tab-all active';
      allTab.textContent = 'All';
      allTab.dataset.specialization = 'all';
      this.elements.filterMenu.appendChild(allTab);
      
      // Check if specializations data is valid
      if (!specializations || typeof specializations !== 'object') {
          console.warn("Invalid specializations data");
          return false;
      }
      
      // Add tabs for each specialization
      Object.values(specializations).forEach(spec => {
          if (!spec || !spec.id || !spec.name) {
              console.warn("Invalid specialization data:", spec);
              return;
          }
          
          const specTab = document.createElement('div');
          specTab.className = `filter-tab tab-${spec.id}`;
          specTab.textContent = spec.name;
          specTab.dataset.specialization = spec.id;
          
          // Add color indicator if color is available
          if (spec.color) {
              const colorIndicator = document.createElement('span');
              colorIndicator.className = 'color-indicator';
              colorIndicator.style.backgroundColor = spec.color;
              specTab.prepend(colorIndicator);
          }
          
          this.elements.filterMenu.appendChild(specTab);
          this.elements.specializationTabs[spec.id] = specTab;
      });
      
      console.log(`Set up ${Object.keys(this.elements.specializationTabs).length} specialization tabs`);
      return true;
  },
  
  /**
   * Update specialization progress display
   * @param {Object} progress - Progress data by specialization ID
   * @param {Object} thresholds - Default thresholds
   */
  updateSpecializationProgress: function(progress, thresholds = {normal: 5, mastery: 8}) {
      if (!this.state.initialized) return;
      
      const progressList = this.elements.statsContainer.querySelector('.specialization-progress-list');
      if (!progressList) return;
      
      // Clear existing items
      progressList.innerHTML = '';
      
      // Get specializations from SkillTreeManager if available
      const specializations = window.SkillTreeManager?.specializations || {};
      
      // Update each specialization's progress
      Object.entries(progress).forEach(([specId, value]) => {
          const spec = specializations[specId];
          if (!spec) return;
          
          const progressItem = document.createElement('div');
          progressItem.className = 'spec-progress-item';
          
          // Specialization name
          const specName = document.createElement('div');
          specName.className = 'spec-name';
          specName.textContent = spec.name;
          progressItem.appendChild(specName);
          
          // Progress bar container
          const progressBarContainer = document.createElement('div');
          progressBarContainer.className = 'progress-bar-container';
          
          // Progress bar
          const progressBar = document.createElement('div');
          progressBar.className = 'progress-bar';
          progressBar.style.backgroundColor = spec.color;
          
          // Calculate width
          const threshold = spec.threshold || thresholds.normal || 5;
          const masteryThreshold = spec.mastery_threshold || thresholds.mastery || 8;
          const maxValue = Math.max(masteryThreshold, value);
          const percentage = (value / maxValue) * 100;
          progressBar.style.width = `${percentage}%`;
          
          progressBarContainer.appendChild(progressBar);
          
          // Add threshold markers
          if (threshold) {
              const thresholdMarker = document.createElement('div');
              thresholdMarker.className = 'threshold-marker';
              thresholdMarker.style.left = `${(threshold / maxValue) * 100}%`;
              progressBarContainer.appendChild(thresholdMarker);
          }
          
          if (masteryThreshold) {
              const masteryMarker = document.createElement('div');
              masteryMarker.className = 'mastery-marker';
              masteryMarker.style.left = `${(masteryThreshold / maxValue) * 100}%`;
              progressBarContainer.appendChild(masteryMarker);
          }
          
          progressItem.appendChild(progressBarContainer);
          
          // Progress text
          const progressText = document.createElement('div');
          progressText.className = 'progress-text';
          progressText.textContent = `${value}/${masteryThreshold}`;
          progressItem.appendChild(progressText);
          
          progressList.appendChild(progressItem);
      });
  },
  
  /**
   * Show node information
   * @param {String} nodeId - ID of the node to display
   */
  showNodeInfo: function(nodeId) {
      if (!this.state.initialized || !nodeId) return;
      
      // Get node from SkillTreeManager
      const node = window.SkillTreeManager?.getSkillById(nodeId);
      if (!node) {
          console.warn(`Node not found: ${nodeId}`);
          return;
      }
      
      // Update UI elements
      const nodeNameElement = this.elements.info.querySelector('.node-name');
      const nodeSpecElement = this.elements.info.querySelector('.node-specialization');
      const nodeDescElement = this.elements.info.querySelector('.node-description');
      const effectsListElement = this.elements.info.querySelector('.effects-list');
      const requirementsListElement = this.elements.info.querySelector('.requirements-list');
      
      if (!nodeNameElement || !nodeSpecElement || !nodeDescElement || 
          !effectsListElement || !requirementsListElement) {
          console.error("Node info elements not found");
          return;
      }
      
      // Set node name
      nodeNameElement.textContent = node.name;
      
      // Get specializations from SkillTreeManager
      const specializations = window.SkillTreeManager?.specializations || {};
      
      // Set specialization
      nodeSpecElement.textContent = '';
      
      if (node.specialization) {
          const spec = specializations[node.specialization];
          if (spec) {
              nodeSpecElement.textContent = spec.name;
              nodeSpecElement.style.color = spec.color;
          } else {
              nodeSpecElement.textContent = node.specialization;
          }
      } else {
          nodeSpecElement.textContent = 'Core Skill';
          nodeSpecElement.style.color = '#4682B4';
      }
      
      // Set description
      nodeDescElement.textContent = node.description;
      
      // Set effects
      effectsListElement.innerHTML = '';
      
      if (node.effects && node.effects.length > 0) {
          node.effects.forEach(effect => {
              const effectItem = document.createElement('li');
              effectItem.className = 'effect-item';
              effectItem.textContent = this._formatEffectDescription(effect);
              effectsListElement.appendChild(effectItem);
          });
      } else {
          const noEffectsItem = document.createElement('li');
          noEffectsItem.textContent = 'No effects';
          effectsListElement.appendChild(noEffectsItem);
      }
      
      // Set requirements
      requirementsListElement.innerHTML = '';
      
      // Cost requirements
      if (node.cost) {
          const costItem = document.createElement('li');
          costItem.textContent = `Reputation cost: ${node.cost.reputation}`;
          requirementsListElement.appendChild(costItem);
          
          const pointsItem = document.createElement('li');
          pointsItem.textContent = `Skill points to activate: ${node.cost.skill_points}`;
          requirementsListElement.appendChild(pointsItem);
      }
      
      // Prerequisite skills
      if (window.SkillTreeManager) {
          const prerequisites = window.SkillTreeManager.getPrerequisites(nodeId);
          if (prerequisites.length > 0) {
              const prereqItem = document.createElement('li');
              prereqItem.textContent = `Prerequisites: ${prerequisites.map(prereqId => {
                  const prereqNode = window.SkillTreeManager.getSkillById(prereqId);
                  return prereqNode ? prereqNode.name : prereqId;
              }).join(', ')}`;
              requirementsListElement.appendChild(prereqItem);
          }
      }
      
      // Update action buttons based on node state
      this._updateActionButtons(node);
  },
  
  /**
   * Format an effect description for display
   * @private
   * @param {Object} effect - Effect object
   * @returns {String} Formatted description
   */
  _formatEffectDescription: function(effect) {
      if (!effect) return '';
      
      // Format effect description
      let effectText = '';
      
      switch (effect.type) {
          case 'insight_gain_flat':
              effectText = `+${effect.value} Insight gain`;
              break;
              
          case 'insight_gain_multiplier':
              effectText = `+${(effect.value - 1) * 100}% Insight gain`;
              if (effect.condition) {
                  effectText += ` (${this._formatCondition(effect.condition)})`;
              }
              break;
              
          case 'critical_insight_multiplier':
              effectText = `Critical insights give ${effect.value}x rewards`;
              break;
              
          case 'patient_outcome_multiplier':
              effectText = `+${(effect.value - 1) * 100}% to patient outcomes`;
              break;
              
          case 'equipment_cost_reduction':
              effectText = `${effect.value * 100}% reduced equipment costs`;
              break;
              
          case 'reveal_parameter':
              effectText = `Reveal ${effect.value} parameter(s) automatically`;
              break;
              
          case 'reveal_patient_parameter':
              effectText = `Reveal ${effect.value} patient parameter(s) at case start`;
              break;
              
          case 'failure_conversion':
              effectText = `Convert ${effect.value * 100}% of failures into partial success`;
              break;
              
          default:
              effectText = `${effect.type}: ${JSON.stringify(effect.value)}`;
      }
      
      return effectText;
  },
  
  /**
   * Format a condition for display
   * @private
   * @param {String} condition - Condition string
   * @returns {String} Formatted condition
   */
  _formatCondition: function(condition) {
      if (!condition) return '';
      
      // Simple string replacements for readability
      let formatted = condition
          .replace('question_category ==', 'for')
          .replace('node_type ==', 'for')
          .replace('question_difficulty >=', 'for difficulty ≥')
          .replace('equipment_count >=', 'when using ≥')
          .replace(/['"]/g, '');
      
      return formatted;
  },
  
  /**
   * Update action buttons based on node state
   * @private
   * @param {Object} node - Node object
   */
  _updateActionButtons: function(node) {
      if (!this.state.initialized || !node) return;
      
      // Get button state information from SkillTreeManager
      let canUnlock = false;
      let canActivate = false;
      let isActive = false;
      
      if (window.SkillTreeManager) {
          canUnlock = window.SkillTreeManager.canUnlockSkill(node.id);
          canActivate = window.SkillTreeManager.canActivateSkill(node.id);
          isActive = window.SkillTreeManager.activeSkills.includes(node.id);
      }
      
      // Node state can be used as fallback if SkillTreeManager is not available
      const nodeState = node.state || '';
      
      // Update unlock button
      if (this.elements.unlockButton) {
          this.elements.unlockButton.disabled = !canUnlock;
          this.elements.unlockButton.style.display = nodeState === 'unlockable' ? 'inline-block' : 'none';
      }
      
      // Update activate button
      if (this.elements.activateButton) {
          this.elements.activateButton.disabled = !canActivate;
          this.elements.activateButton.style.display = nodeState === 'unlocked' ? 'inline-block' : 'none';
      }
      
      // Update deactivate button
      if (this.elements.deactivateButton) {
          // Can't deactivate core skills
          const isCoreSkill = node.specialization === 'core' || node.tier === 0;
          this.elements.deactivateButton.disabled = !isActive || isCoreSkill;
          this.elements.deactivateButton.style.display = nodeState === 'active' ? 'inline-block' : 'none';
      }
  },
  
  /**
   * Update stats display
   * @param {Number} reputation - Current reputation
   * @param {Number} skillPoints - Available skill points
   * @param {Object} specializationProgress - Specialization progress data
   */
  updateStats: function(reputation, skillPoints, specializationProgress) {
      if (!this.state.initialized) return;
      
      // Update reputation
      const reputationElement = this.elements.statsContainer.querySelector('.reputation-value');
      if (reputationElement) {
          reputationElement.textContent = reputation || 0;
      }
      
      // Update skill points
      const skillPointsElement = this.elements.statsContainer.querySelector('.skill-points-value');
      if (skillPointsElement) {
          skillPointsElement.textContent = skillPoints || 0;
      }
      
      // Update specialization progress
      if (specializationProgress) {
          this.updateSpecializationProgress(specializationProgress);
      }
  },
  
  /**
   * Apply UI theme
   * @private
   * @param {String} theme - Theme name ('dark' or 'light')
   */
  _applyTheme: function(theme) {
      const container = document.getElementById(this.config.containerId);
      if (!container) return;
      
      // Remove existing theme classes
      container.classList.remove('theme-light', 'theme-dark');
      
      // Add new theme class
      container.classList.add(`theme-${theme}`);
  },
  
  /**
   * Handle node selection event
   * @private
   * @param {Event} event - Event object
   */
  _handleNodeSelected: function(event) {
      const nodeId = event.detail.nodeId;
      this.state.selectedNode = nodeId;
      
      console.log(`Selected node: ${nodeId}`);
      
      // Show node info
      this.showNodeInfo(nodeId);
  },
  
  /**
   * Handle filter click
   * @private
   * @param {String} specialization - Specialization ID to filter by
   */
  _handleFilterClick: function(specialization) {
      console.log(`Filter clicked: ${specialization}`);
      
      // Update active tab
      const filterTabs = this.elements.filterMenu.querySelectorAll('.filter-tab');
      filterTabs.forEach(tab => {
          tab.classList.remove('active');
      });
      
      const activeTab = specialization === 'all' 
          ? this.elements.filterMenu.querySelector('.tab-all') 
          : this.elements.specializationTabs[specialization];
      
      if (activeTab) {
          activeTab.classList.add('active');
      }
      
      // Update current specialization
      this.state.currentSpecialization = specialization === 'all' ? null : specialization;
      
      // Filter the tree
      if (window.SkillTreeRenderer && window.SkillTreeRenderer.filterBySpecialization) {
          window.SkillTreeRenderer.filterBySpecialization(this.state.currentSpecialization);
      }
  },
  
  /**
   * Handle unlock button click
   * @private
   */
  _handleUnlockClick: function() {
      if (!this.state.selectedNode) return;
      
      console.log(`Attempting to unlock skill: ${this.state.selectedNode}`);
      
      // Call skill tree manager to unlock
      if (window.SkillTreeManager && window.SkillTreeManager.unlockSkill) {
          const success = window.SkillTreeManager.unlockSkill(this.state.selectedNode);
          
          if (success) {
              // Show notification
              this._showNotification(`Skill unlocked: ${window.SkillTreeManager.getSkillById(this.state.selectedNode).name}`, 'success');
          } else {
              // Show error notification
              this._showNotification('Could not unlock skill', 'error');
          }
      }
  },
  
  /**
   * Handle activate button click
   * @private
   */
  _handleActivateClick: function() {
      if (!this.state.selectedNode) return;
      
      console.log(`Attempting to activate skill: ${this.state.selectedNode}`);
      
      // Call skill tree manager to activate
      if (window.SkillTreeManager && window.SkillTreeManager.activateSkill) {
          const success = window.SkillTreeManager.activateSkill(this.state.selectedNode);
          
          if (success) {
              // Show notification
              this._showNotification(`Skill activated: ${window.SkillTreeManager.getSkillById(this.state.selectedNode).name}`, 'success');
          } else {
              // Show error notification
              this._showNotification('Could not activate skill', 'error');
          }
      }
  },
  
  /**
   * Handle deactivate button click
   * @private
   */
  _handleDeactivateClick: function() {
      if (!this.state.selectedNode) return;
      
      console.log(`Attempting to deactivate skill: ${this.state.selectedNode}`);
      
      // Call skill tree manager to deactivate
      if (window.SkillTreeManager && window.SkillTreeManager.deactivateSkill) {
          const success = window.SkillTreeManager.deactivateSkill(this.state.selectedNode);
          
          if (success) {
              // Show notification
              this._showNotification(`Skill deactivated: ${window.SkillTreeManager.getSkillById(this.state.selectedNode).name}`, 'info');
          } else {
              // Show error notification
              this._showNotification('Could not deactivate skill', 'error');
          }
      }
  },
  
  /**
   * Handle window resize
   * @private
   */
  _handleResize: function() {
      // Adjust UI if needed for responsive behavior
  },
  
  /**
   * Show a notification
   * @private
   * @param {String} message - Message to display
   * @param {String} type - Notification type (info, success, warning, error)
   */
  _showNotification: function(message, type = 'info') {
      // Use UIUtils if available
      if (window.UIUtils && window.UIUtils.showToast) {
          window.UIUtils.showToast(message, type);
          return;
      }
      
      // Fallback notification
      console.log(`[${type.toUpperCase()}] ${message}`);
  },
  
  /**
   * Handle error event
   * @private
   * @param {Event} event - Error event
   */
  _handleError: function(event) {
      const message = event.detail.message || "An error occurred";
      
      console.error(`Skill tree error: ${message}`);
      
      // Show error in UI
      this._showNotification(message, 'error');
      
      // Update error state
      this.state.errorState = true;
  },
  
  /**
   * Get debugging information
   * @returns {Object} Debug info
   */
  getDebugInfo: function() {
      return {
          initialized: this.state.initialized,
          errorState: this.state.errorState,
          selectedNode: this.state.selectedNode,
          currentSpecialization: this.state.currentSpecialization,
          elements: {
              container: !!this.elements.container,
              controls: !!this.elements.controls,
              info: !!this.elements.info,
              filterMenu: !!this.elements.filterMenu,
              unlockButton: !!this.elements.unlockButton,
              activateButton: !!this.elements.activateButton,
              deactivateButton: !!this.elements.deactivateButton,
              statsContainer: !!this.elements.statsContainer
          },
          specializationTabs: Object.keys(this.elements.specializationTabs)
      };
  }
};

// Export globally
window.SkillTreeUI = SkillTreeUI;
console.log("Loaded: skill_tree_ui.js");