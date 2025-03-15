// skill_tree_ui.js - Fixed UI component to prevent duplication and layout issues

const SkillTreeUI = {
  // Config
  config: {
    controlsContainerId: 'skill-tree-controls',
    infoContainerId: 'skill-tree-info',
    filterMenuId: 'specialization-filter',
    unlockButtonId: 'unlock-skill-button',
    activateButtonId: 'activate-skill-button',
    deactivateButtonId: 'deactivate-skill-button',
    statsContainerId: 'skill-tree-stats',
    theme: 'dark',  // 'dark' or 'light'
    animationDuration: 300
  },
  
  // UI elements
  elements: {
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
  currentSpecialization: null,
  selectedNode: null,
  initialized: false,
  
  // Completely reworked initialize method for skill_tree_ui.js

  /**
   * Initialize the UI with robust container handling
   * @param {Object} options - Configuration options
   * @returns {boolean} Success status
   */
  initialize: function(options = {}) {
    console.log("Initializing skill tree UI with robust error handling");
    
    // Apply options
    Object.assign(this.config, options);
    
    // Track attempt to prevent duplicate initialization
    if (this.initialized) {
      console.log("SkillTreeUI already initialized");
      return true;
    }
    
    // Get container elements with direct DOM access to avoid null errors
    const controlsId = this.config.controlsContainerId || 'skill-tree-controls';
    const infoId = this.config.infoContainerId || 'skill-tree-info';
    
    console.log(`Looking for containers: controls=${controlsId}, info=${infoId}`);
    
    // Create a retry mechanism for container acquisition
    const getContainers = () => {
      this.elements.controls = document.getElementById(controlsId);
      this.elements.info = document.getElementById(infoId);
      
      console.log("Container check:", {
        controls: !!this.elements.controls,
        info: !!this.elements.info
      });
      
      return this.elements.controls && this.elements.info;
    };
    
    // Try to get containers immediately
    if (!getContainers()) {
      console.warn("Containers not found, will create them");
      
      // Find parent containers
      const uiContainer = document.getElementById(this.config.containerId || 'skill-tree-ui');
      
      if (!uiContainer) {
        console.error("UI container not found, cannot initialize");
        return false;
      }
      
      // Create missing elements
      if (!this.elements.controls) {
        console.log(`Creating missing controls container with ID: ${controlsId}`);
        this.elements.controls = document.createElement('div');
        this.elements.controls.id = controlsId;
        this.elements.controls.className = 'skill-tree-controls';
        uiContainer.appendChild(this.elements.controls);
      }
      
      if (!this.elements.info) {
        console.log(`Creating missing info container with ID: ${infoId}`);
        this.elements.info = document.createElement('div');
        this.elements.info.id = infoId;
        this.elements.info.className = 'skill-tree-info';
        uiContainer.appendChild(this.elements.info);
      }
      
      // Check again
      if (!getContainers()) {
        console.error("Failed to create and acquire containers");
        return false;
      }
    }
    
    // Now we've ensured containers exist
    console.log("UI containers acquired successfully");
    
    // Clear existing content to prevent duplication
    this.elements.controls.innerHTML = '';
    this.elements.info.innerHTML = '';
    
    // Create UI elements
    this.createUIElements();
    this.setupEventListeners();
    
    // Mark as initialized
    this.initialized = true;
    console.log("SkillTreeUI initialized successfully");
    
    return true;
  },
  
  // Create UI elements
  createUIElements: function() {
    console.log("Creating UI elements");
    
    // Create filter menu
    this.createFilterMenu();
    
    // Create stats panel
    this.createStatsPanel();
    
    // Create node info panel
    this.createNodeInfoPanel();
    
    // Create action buttons
    this.createActionButtons();
  },
  
  // Create filter menu - avoid duplication
  createFilterMenu: function() {
    // Check if filter menu already exists
    let existingMenu = document.getElementById(this.config.filterMenuId);
    if (existingMenu) {
      existingMenu.innerHTML = ''; // Clear existing but keep the container
      this.elements.filterMenu = existingMenu;
    } else {
      this.elements.filterMenu = document.createElement('div');
      this.elements.filterMenu.id = this.config.filterMenuId;
      this.elements.filterMenu.className = 'specialization-filter';
      this.elements.controls.appendChild(this.elements.filterMenu);
    }
    
    // Add "All" tab
    const allTab = document.createElement('div');
    allTab.className = 'filter-tab tab-all active';
    allTab.textContent = 'All';
    allTab.dataset.specialization = 'all';
    this.elements.filterMenu.appendChild(allTab);
  },
  
  // Create stats panel
  createStatsPanel: function() {
    // Create stats container if it doesn't exist
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
  
  // Create action buttons
  createActionButtons: function() {
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
  
  // Create node info panel
  createNodeInfoPanel: function() {
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
  
  setupSpecializationFilters: function(specializations) {
    console.log("Setting up specialization filters...");
    
    // Safely get filter menu element
    if (!this.elements.filterMenu) {
      console.error("Filter menu element not found");
      
      // Try to get it again
      this.elements.filterMenu = document.getElementById(this.config.filterMenuId);
      
      // If still not found, try to create it
      if (!this.elements.filterMenu) {
        console.warn("Creating missing filter menu element");
        
        if (this.elements.controls) {
          this.elements.filterMenu = document.createElement('div');
          this.elements.filterMenu.id = this.config.filterMenuId;
          this.elements.filterMenu.className = 'specialization-filter';
          this.elements.controls.appendChild(this.elements.filterMenu);
        } else {
          console.error("Controls container not found, cannot create filter menu");
          return false;
        }
      }
    }
    
    // Ensure the filter menu is empty before adding tabs
    this.elements.filterMenu.innerHTML = '';
    
    // Create "All" tab first
    const allTab = document.createElement('div');
    allTab.className = 'filter-tab tab-all active';
    allTab.textContent = 'All';
    allTab.dataset.specialization = 'all';
    this.elements.filterMenu.appendChild(allTab);
    
    // Reset specialization tabs collection
    this.elements.specializationTabs = {};
    
    // Check if specializations data is valid
    if (!specializations || typeof specializations !== 'object') {
      console.warn("Invalid specializations data:", specializations);
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
  
  // Rest of the methods remain the same...
  // ... (include all other methods from the original SkillTreeUI)
  
  // Setup event listeners
  setupEventListeners: function() {
    console.log("Setting up event listeners");
    
    // Listen for node selection
    document.addEventListener('skillNodeSelected', this.handleNodeSelected.bind(this));
    
    // Filter menu clicks
    this.elements.filterMenu.addEventListener('click', (event) => {
      if (event.target.classList.contains('filter-tab')) {
        this.handleFilterClick(event.target.dataset.specialization);
      }
    });
    
    // Action buttons
    this.elements.unlockButton.addEventListener('click', this.handleUnlockClick.bind(this));
    this.elements.activateButton.addEventListener('click', this.handleActivateClick.bind(this));
    this.elements.deactivateButton.addEventListener('click', this.handleDeactivateClick.bind(this));
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  },
  
  // Update specialization progress
  updateSpecializationProgress: function(progress, thresholds) {
    const progressList = document.querySelector('.specialization-progress-list');
    if (!progressList) return;
    
    progressList.innerHTML = '';
    
    Object.entries(progress).forEach(([specId, value]) => {
      const spec = SkillTreeManager.specializations[specId];
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
      const threshold = spec.threshold || thresholds?.normal || 5;
      const masteryThreshold = spec.mastery_threshold || thresholds?.mastery || 8;
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
  
  // Show node information
  showNodeInfo: function(nodeId) {
    const node = SkillTreeManager.getSkillById(nodeId);
    if (!node) return;
    
    // Update UI elements
    const nodeNameElement = this.elements.info.querySelector('.node-name');
    const nodeSpecElement = this.elements.info.querySelector('.node-specialization');
    const nodeDescElement = this.elements.info.querySelector('.node-description');
    const effectsListElement = this.elements.info.querySelector('.effects-list');
    const requirementsListElement = this.elements.info.querySelector('.requirements-list');
    
    if (!nodeNameElement || !nodeSpecElement || !nodeDescElement || !effectsListElement || !requirementsListElement) {
      console.error("Node info elements not found");
      return;
    }
    
    // Set node name
    nodeNameElement.textContent = node.name;
    
    // Set specialization
    nodeSpecElement.textContent = '';
    
    if (node.specialization) {
      const spec = SkillTreeManager.specializations[node.specialization];
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
        effectItem.textContent = this.formatEffectDescription(effect);
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
    const costItem = document.createElement('li');
    costItem.textContent = `Reputation cost: ${node.cost.reputation}`;
    requirementsListElement.appendChild(costItem);
    
    const pointsItem = document.createElement('li');
    pointsItem.textContent = `Skill points to activate: ${node.cost.skill_points}`;
    requirementsListElement.appendChild(pointsItem);
    
    // Prerequisite skills
    const prerequisites = SkillTreeManager.getPrerequisites(nodeId);
    if (prerequisites.length > 0) {
      const prereqItem = document.createElement('li');
      prereqItem.textContent = `Prerequisites: ${prerequisites.map(prereqId => {
        const prereqNode = SkillTreeManager.getSkillById(prereqId);
        return prereqNode ? prereqNode.name : prereqId;
      }).join(', ')}`;
      requirementsListElement.appendChild(prereqItem);
    }
    
    // Update action buttons based on node state
    this.updateActionButtons(node);
  },
  
  // Format effect description
  formatEffectDescription: function(effect) {
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
          effectText += ` (${this.formatCondition(effect.condition)})`;
        }
        break;
        
      case 'critical_insight_multiplier':
        effectText = `Critical insights give ${effect.value}x rewards`;
        break;
        
      // Add other effect types as needed
        
      default:
        effectText = `${effect.type}: ${JSON.stringify(effect.value)}`;
    }
    
    return effectText;
  },
  
  // Format condition for display
  formatCondition: function(condition) {
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
  
  // Update action buttons based on node state
  updateActionButtons: function(node) {
    const canUnlock = SkillTreeManager.canUnlockSkill(node.id);
    const canActivate = SkillTreeManager.canActivateSkill(node.id);
    const isActive = SkillTreeManager.activeSkills.includes(node.id);
    
    // Update unlock button
    this.elements.unlockButton.disabled = !canUnlock;
    
    // Update activate button
    this.elements.activateButton.disabled = !canActivate;
    
    // Update deactivate button
    this.elements.deactivateButton.disabled = !isActive || node.id === 'core_physics';
    
    // Update button visibility
    this.elements.unlockButton.style.display = node.state === 'unlockable' ? 'inline-block' : 'none';
    this.elements.activateButton.style.display = node.state === 'unlocked' ? 'inline-block' : 'none';
    this.elements.deactivateButton.style.display = node.state === 'active' ? 'inline-block' : 'none';
  },
  
  // Update stats display
  updateStats: function(reputation, skillPoints, specializationProgress) {
    // Update reputation
    const reputationElement = this.elements.statsContainer.querySelector('.reputation-value');
    if (reputationElement) {
      reputationElement.textContent = reputation;
    }
    
    // Update skill points
    const skillPointsElement = this.elements.statsContainer.querySelector('.skill-points-value');
    if (skillPointsElement) {
      skillPointsElement.textContent = skillPoints;
    }
    
    // Update specialization progress
    if (specializationProgress) {
      this.updateSpecializationProgress(
        specializationProgress,
        {
          normal: 5,   // Default threshold
          mastery: 8   // Default mastery threshold
        }
      );
    }
  },
  
  // Event Handlers
  
  // Handle node selection
  handleNodeSelected: function(event) {
    const nodeId = event.detail.nodeId;
    this.selectedNode = nodeId;
    
    console.log(`Selected node: ${nodeId}`);
    
    // Show node info
    this.showNodeInfo(nodeId);
  },
  
  // Handle filter click
  handleFilterClick: function(specialization) {
    console.log(`Filter clicked: ${specialization}`);
    
    // Update active tab
    Array.from(this.elements.filterMenu.children).forEach(tab => {
      tab.classList.remove('active');
    });
    
    const activeTab = specialization === 'all' 
      ? this.elements.filterMenu.querySelector('.tab-all') 
      : this.elements.specializationTabs[specialization];
    
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Update current specialization
    this.currentSpecialization = specialization === 'all' ? null : specialization;
    
    // Filter the tree
    SkillTreeRenderer.filterBySpecialization(this.currentSpecialization);
  },
  
  // Handle unlock button click
  handleUnlockClick: function() {
    if (!this.selectedNode) return;
    
    console.log(`Attempting to unlock skill: ${this.selectedNode}`);
    
    // Call skill tree manager to unlock
    const success = SkillTreeManager.unlockSkill(this.selectedNode);
    
    if (success) {
      // Update UI
      this.showNodeInfo(this.selectedNode);
      
      // Update stats
      this.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
      
      // Show success notification
      if (typeof UIUtils !== 'undefined') {
        UIUtils.showToast(`Skill unlocked: ${SkillTreeManager.getSkillById(this.selectedNode).name}`, 'success');
      }
    } else {
      // Show error notification
      if (typeof UIUtils !== 'undefined') {
        UIUtils.showToast('Could not unlock skill', 'error');
      }
    }
  },
  
  // Handle activate button click
  handleActivateClick: function() {
    if (!this.selectedNode) return;
    
    console.log(`Attempting to activate skill: ${this.selectedNode}`);
    
    // Call skill tree manager to activate
    const success = SkillTreeManager.activateSkill(this.selectedNode);
    
    if (success) {
      // Update UI
      this.showNodeInfo(this.selectedNode);
      
      // Update stats
      this.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
      
      // Show success notification
      if (typeof UIUtils !== 'undefined') {
        UIUtils.showToast(`Skill activated: ${SkillTreeManager.getSkillById(this.selectedNode).name}`, 'success');
      }
    } else {
      // Show error notification
      if (typeof UIUtils !== 'undefined') {
        UIUtils.showToast('Could not activate skill', 'error');
      }
    }
  },
  
  // Handle deactivate button click
  handleDeactivateClick: function() {
    if (!this.selectedNode) return;
    
    console.log(`Attempting to deactivate skill: ${this.selectedNode}`);
    
    // Call skill tree manager to deactivate
    const success = SkillTreeManager.deactivateSkill(this.selectedNode);
    
    if (success) {
      // Update UI
      this.showNodeInfo(this.selectedNode);
      
      // Update stats
      this.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
      
      // Show success notification
      if (typeof UIUtils !== 'undefined') {
        UIUtils.showToast(`Skill deactivated: ${SkillTreeManager.getSkillById(this.selectedNode).name}`, 'info');
      }
    } else {
      // Show error notification
      if (typeof UIUtils !== 'undefined') {
        UIUtils.showToast('Could not deactivate skill', 'error');
      }
    }
  },
  
  // Handle window resize
  handleResize: function() {
    // Handle resize events if needed
    console.log("Window resized");
  }
};

// Export the SkillTreeUI object
window.SkillTreeUI = SkillTreeUI;
console.log("Loaded: fixed skill_tree_ui.js");