// skill_tree_ui.js - User interface for skill tree interaction

const SkillTreeUI = {
    // Config
    config: {
      containerId: 'skill-tree-container',
      controlsId: 'skill-tree-controls',
      infoId: 'skill-tree-info',
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
    currentSpecialization: null,
    selectedNode: null,
    initialized: false,
    
    // Initialize the UI
    initialize: function(options = {}) {
      console.log("Initializing skill tree UI");
      
      // Apply options
      Object.assign(this.config, options);
      
      // Get or create container elements
      this.createUIElements();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Add theme class to body
      document.body.classList.add(`theme-${this.config.theme}`);
      
      this.initialized = true;
      
      return this;
    },
    
    // Create UI elements
    createUIElements: function() {
      console.log("Creating UI elements");
      
      // Get/create container
      this.elements.container = document.getElementById(this.config.containerId);
      if (!this.elements.container) {
        this.elements.container = document.createElement('div');
        this.elements.container.id = this.config.containerId;
        document.body.appendChild(this.elements.container);
      }
      this.elements.container.className = 'skill-tree-container';
      
      // Create control panel
      this.elements.controls = document.createElement('div');
      this.elements.controls.id = this.config.controlsId;
      this.elements.controls.className = 'skill-tree-controls';
      
      // Create info panel
      this.elements.info = document.createElement('div');
      this.elements.info.id = this.config.infoId;
      this.elements.info.className = 'skill-tree-info';
      
      // Create stats panel
      this.elements.statsContainer = document.createElement('div');
      this.elements.statsContainer.id = this.config.statsContainerId;
      this.elements.statsContainer.className = 'skill-tree-stats';
      
      // Add controls and info to container
      this.elements.container.appendChild(this.elements.controls);
      this.elements.container.appendChild(this.elements.info);
      
      // Create filter menu
      this.createFilterMenu();
      
      // Create action buttons
      this.createActionButtons();
      
      // Create stats panel
      this.createStatsPanel();
      
      // Create node info panel
      this.createNodeInfoPanel();
    },
    
    // Create filter menu
    createFilterMenu: function() {
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
    
    // Create stats panel
    createStatsPanel: function() {
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
    
    // Set up all specialization filters
    setupSpecializationFilters: function(specializations) {
      // Clear existing tabs except 'All'
      Array.from(this.elements.filterMenu.children).forEach(child => {
        if (!child.classList.contains('tab-all')) {
          this.elements.filterMenu.removeChild(child);
        }
      });
      
      // Add specialization tabs
      Object.values(specializations).forEach(spec => {
        const specTab = document.createElement('div');
        specTab.className = `filter-tab tab-${spec.id}`;
        specTab.textContent = spec.name;
        specTab.dataset.specialization = spec.id;
        
        // Add color indicator
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'color-indicator';
        colorIndicator.style.backgroundColor = spec.color;
        specTab.prepend(colorIndicator);
        
        this.elements.filterMenu.appendChild(specTab);
        this.elements.specializationTabs[spec.id] = specTab;
      });
    },
    
    // Update specialization progress
    updateSpecializationProgress: function(progress, thresholds) {
      const progressList = document.querySelector('.specialization-progress-list');
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
        
        // Add specialization status badges
        if (value >= masteryThreshold) {
          const masteryBadge = document.createElement('span');
          masteryBadge.className = 'spec-badge mastery-badge';
          masteryBadge.textContent = 'Master';
          progressItem.appendChild(masteryBadge);
        } else if (value >= threshold) {
          const specBadge = document.createElement('span');
          specBadge.className = 'spec-badge spec-badge';
          specBadge.textContent = 'Specialist';
          progressItem.appendChild(specBadge);
        }
        
        progressList.appendChild(progressItem);
      });
    },
    
    // Show node information
    showNodeInfo: function(nodeId) {
      const node = SkillTreeManager.getSkillById(nodeId);
      if (!node) return;
      
      // Update UI elements
      const nodeNameElement = document.querySelector('.node-name');
      const nodeSpecElement = document.querySelector('.node-specialization');
      const nodeDescElement = document.querySelector('.node-description');
      const effectsListElement = document.querySelector('.effects-list');
      const requirementsListElement = document.querySelector('.requirements-list');
      
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
              
            case 'reveal_parameter':
              effectText = `Reveals one parameter in complex questions`;
              break;
              
            case 'failure_conversion':
              effectText = `Convert ${effect.value * 100}% of failures into partial successes`;
              break;
              
            case 'patient_outcome_multiplier':
              effectText = `+${(effect.value - 1) * 100}% to patient outcome ratings`;
              break;
              
            case 'reveal_patient_parameter':
              effectText = `Reveal ${effect.value} hidden patient parameters`;
              break;
              
            case 'treatment_effectiveness_multiplier':
              effectText = `+${(effect.value - 1) * 100}% treatment effectiveness`;
              break;
              
            case 'time_cost_reduction':
              effectText = `${effect.value * 100}% reduced time costs`;
              if (effect.condition) {
                effectText += ` (${this.formatCondition(effect.condition)})`;
              }
              break;
              
            case 'consult_help':
              effectText = `Call for help ${effect.value} time(s) per floor`;
              break;
              
            case 'adverse_event_reduction':
              effectText = `${effect.value * 100}% reduced adverse events`;
              break;
              
            case 'preview_outcomes':
              effectText = `See expected outcomes before choosing treatments`;
              break;
              
            case 'calibration_success':
              effectText = `Equipment calibrations always succeed`;
              break;
              
            case 'malfunction_penalty_reduction':
              effectText = `${effect.value * 100}% reduced penalty from malfunctions`;
              break;
              
            case 'repair_cost_reduction':
              effectText = `${effect.value * 100}% reduced repair costs`;
              break;
              
            case 'multi_equipment_bonus':
              effectText = `+${effect.value * 100}% bonus when using multiple equipment`;
              break;
              
            case 'start_with_items':
              effectText = `Start with ${effect.value.count} ${effect.value.item_type.replace('_', ' ')}(s)`;
              break;
              
            case 'funding_multiplier':
              effectText = `+${(effect.value - 1) * 100}% funding gain`;
              break;
              
            case 'favor_usage':
              effectText = `Call in ${effect.value} favor(s) per run`;
              break;
              
            case 'insight_to_reputation_conversion':
              effectText = `Convert ${effect.value * 100}% of excess insight to reputation`;
              break;
              
            case 'companion':
              effectText = `Gain a ${effect.value.replace('_', ' ')} companion`;
              break;
              
            case 'clinical_to_reputation_conversion':
              effectText = `Convert ${effect.value * 100}% of clinical successes to reputation`;
              break;
              
            case 'multi_specialization_bonus':
              effectText = `+${effect.value * 100}% bonus when using multiple specializations`;
              break;
              
            case 'specialization_synergy':
              let boosts = '';
              for (const [specId, boost] of Object.entries(effect.value)) {
                boosts += `${specId}: +${boost * 100}%, `;
              }
              effectText = `Synergy boost: ${boosts.substring(0, boosts.length - 2)}`;
              break;
              
            default:
              // For other effects, use the value directly if it's a string
              if (typeof effect.value === 'string') {
                effectText = effect.value;
              } else {
                effectText = `${effect.type}: ${effect.value}`;
              }
          }
          
          effectItem.textContent = effectText;
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
      const reputationElement = document.querySelector('.reputation-value');
      if (reputationElement) {
        reputationElement.textContent = reputation;
      }
      
      // Update skill points
      const skillPointsElement = document.querySelector('.skill-points-value');
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
    // Add to skill_tree_ui.js
    showSkillUnlockAnimation: function(nodeId) {
      const node = document.querySelector(`.node-${nodeId}`);
      if (!node) return;
      
      // Create particle effect
      const particles = document.createElement('div');
      particles.className = 'skill-unlock-particles';
      
      // Position near node
      const rect = node.getBoundingClientRect();
      particles.style.left = `${rect.left + rect.width/2}px`;
      particles.style.top = `${rect.top + rect.height/2}px`;
      
      // Add to DOM
      document.body.appendChild(particles);
      
      // Remove after animation
      setTimeout(() => {
        document.body.removeChild(particles);
      }, 1500);
    },
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
        UIUtils.showToast(`Skill unlocked: ${SkillTreeManager.getSkillById(this.selectedNode).name}`, 'success');
      } else {
        // Show error notification
        UIUtils.showToast('Could not unlock skill', 'error');
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
        UIUtils.showToast(`Skill activated: ${SkillTreeManager.getSkillById(this.selectedNode).name}`, 'success');
      } else {
        // Show error notification
        UIUtils.showToast('Could not activate skill', 'error');
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
        UIUtils.showToast(`Skill deactivated: ${SkillTreeManager.getSkillById(this.selectedNode).name}`, 'info');
      } else {
        // Show error notification
        UIUtils.showToast('Could not deactivate skill', 'error');
      }
    },
    
    // Handle window resize
    handleResize: function() {
      // Adjust UI layout if needed
      console.log("Window resized, adjusting UI");
      
      // This is where you might adjust layout based on window size
      // For example, collapse panels on small screens, etc.
    }
  };
  
  // Export the SkillTreeUI object
  window.SkillTreeUI = SkillTreeUI;