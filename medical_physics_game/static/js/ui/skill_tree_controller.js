// skill_tree_controller.js - Coordinates between skill tree components

const SkillTreeController = {
    // Configuration
    config: {
      renderContainerId: 'skill-tree-visualization',
      uiContainerId: 'skill-tree-ui',
      autoInitialize: true,
      loadOnInitialize: true
    },
    
    // State
    initialized: false,
    
    // Initialize the controller and components
    initialize: function(options = {}) {
      console.log("Initializing Skill Tree Controller");
      
      // Apply options
      Object.assign(this.config, options);
      
      // Create containers if they don't exist
      this.ensureContainers();
      
      // Initialize components
      this.initializeComponents()
        .then(() => {
          console.log("All skill tree components initialized");
          
          // Register for state updates
          this.registerStateListeners();
          
          // Set initialization flag
          this.initialized = true;
          
          // Load skill tree data if configured
          if (this.config.loadOnInitialize) {
            this.loadSkillTree();
          }
          
          // Trigger initialization complete event
          const event = new CustomEvent('skillTreeInitialized');
          document.dispatchEvent(event);
        })
        .catch(error => {
          ErrorHandler.handleError(
            error,
            "Skill Tree Controller Initialization",
            ErrorHandler.SEVERITY.ERROR
          );
        });
      
      return this;
    },
    
    // Ensure containers exist
    ensureContainers: function() {
      // Check/create render container
      if (!document.getElementById(this.config.renderContainerId)) {
        const renderContainer = document.createElement('div');
        renderContainer.id = this.config.renderContainerId;
        renderContainer.className = 'skill-tree-visualization';
        document.body.appendChild(renderContainer);
      }
      
      // Check/create UI container
      if (!document.getElementById(this.config.uiContainerId)) {
        const uiContainer = document.createElement('div');
        uiContainer.id = this.config.uiContainerId;
        uiContainer.className = 'skill-tree-ui';
        document.body.appendChild(uiContainer);
      }
    },
    
    // Initialize all skill tree components
    initializeComponents: function() {
      return new Promise((resolve, reject) => {
        // Initialize SkillEffectSystem first
        SkillEffectSystem.initialize()
          .then(() => {
            console.log("SkillEffectSystem initialized");
            
            // Then initialize SkillTreeManager
            return SkillTreeManager.initialize();
          })
          .then(() => {
            console.log("SkillTreeManager initialized");
            
            // Initialize the renderer
            const rendererInitialized = SkillTreeRenderer.initialize(this.config.renderContainerId, {
              width: 800,
              height: 800
            });
            
            if (!rendererInitialized) {
              throw new Error("Failed to initialize SkillTreeRenderer");
            }
            
            // Initialize the UI
            SkillTreeUI.initialize({
              containerId: this.config.uiContainerId
            });
            
            resolve();
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    
    // Register for state changes from SkillTreeManager
    registerStateListeners: function() {
      console.log("Registering state listeners");
      
      // Register for all skill tree events
      SkillTreeManager.addObserver((eventType, data) => {
        console.log(`Skill tree event: ${eventType}`, data);
        
        switch (eventType) {
          case 'skillTreeInitialized':
            this.handleSkillTreeInitialized(data);
            break;
            
          case 'skillUnlocked':
            this.handleSkillUnlocked(data);
            break;
            
          case 'skillActivated':
            this.handleSkillActivated(data);
            break;
            
          case 'skillDeactivated':
            this.handleSkillDeactivated(data);
            break;
            
          case 'reputationChanged':
            this.handleReputationChanged(data);
            break;
            
          case 'skillPointsChanged':
            this.handleSkillPointsChanged(data);
            break;
            
          case 'specializationUpdated':
            this.handleSpecializationUpdated(data);
            break;
            
          case 'skillStatesUpdated':
            this.handleSkillStatesUpdated(data);
            break;
        }
      });
      
      // Listen for specific node selection events from UI
      document.addEventListener('skillNodeSelected', (event) => {
        this.handleNodeSelected(event.detail.nodeId);
      });
    },
    
    // Load the skill tree data
    loadSkillTree: function() {
      console.log("Loading skill tree data");
      
      const skills = SkillTreeManager.skills;
      const specializations = SkillTreeManager.specializations;
      const connections = SkillTreeManager.connections;
      
      // Set up specialization filters in UI
      SkillTreeUI.setupSpecializationFilters(specializations);
      
      // Create node state map
      const nodeStates = {};
      Object.keys(skills).forEach(skillId => {
        nodeStates[skillId] = skills[skillId].state;
      });
      
      // Load data into renderer
      SkillTreeRenderer.loadSkillTree({
        nodes: skills,
        connections: connections,
        specializations: specializations
      });
      
      // Update node states
      SkillTreeRenderer.updateNodeStates(nodeStates);
      
      // Update UI stats
      SkillTreeUI.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
      
      console.log("Skill tree loaded successfully");
    },
    
    // Event Handlers
    
    // Handle skill tree initialized event
    handleSkillTreeInitialized: function(data) {
      console.log("Skill tree data initialized");
      
      // Reload the tree
      this.loadSkillTree();
    },
    
    // Handle skill unlocked event
    handleSkillUnlocked: function(data) {
      console.log(`Skill unlocked: ${data.skillId}`);
      
      // Update node states
      const nodeStates = {
        [data.skillId]: 'unlocked'
      };
      
      SkillTreeRenderer.updateNodeStates(nodeStates);
      
      // Update connected nodes that might be unlockable now
      this.updateConnectedNodeStates(data.skillId);
      
      // Update UI stats
      SkillTreeUI.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
    },
    
    // Handle skill activated event
    handleSkillActivated: function(data) {
      console.log(`Skill activated: ${data.skillId}`);
      
      // Update node state
      const nodeStates = {
        [data.skillId]: 'active'
      };
      
      SkillTreeRenderer.updateNodeStates(nodeStates);
      
      // Update UI stats
      SkillTreeUI.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
    },
    
    // Handle skill deactivated event
    handleSkillDeactivated: function(data) {
      console.log(`Skill deactivated: ${data.skillId}`);
      
      // Update node state
      const nodeStates = {
        [data.skillId]: 'unlocked'
      };
      
      SkillTreeRenderer.updateNodeStates(nodeStates);
      
      // Update UI stats
      SkillTreeUI.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
    },
    
    // Handle reputation changed event
    handleReputationChanged: function(data) {
      console.log(`Reputation changed: ${data.oldValue} -> ${data.newValue}`);
      
      // Update UI stats
      SkillTreeUI.updateStats(
        data.newValue,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
      
      // Update node states that might be affected
      this.updateAllNodeStates();
    },
    
    // Handle skill points changed event
    handleSkillPointsChanged: function(data) {
      console.log(`Skill points changed: ${data.oldValue} -> ${data.newValue}`);
      
      // Update UI stats
      SkillTreeUI.updateStats(
        SkillTreeManager.reputation,
        data.newValue,
        SkillTreeManager.specialization_progress
      );
    },
    
    // Handle specialization updated event
    handleSpecializationUpdated: function(data) {
      console.log(`Specialization updated: ${data.specializationId} (${data.oldValue} -> ${data.newValue})`);
      
      // Update UI stats
      SkillTreeUI.updateStats(
        SkillTreeManager.reputation,
        SkillTreeManager.skillPointsAvailable,
        SkillTreeManager.specialization_progress
      );
    },
    
    // Handle skill states updated event
    handleSkillStatesUpdated: function(data) {
      console.log("Skill states updated");
      
      // Create node states map
      const nodeStates = {};
      
      Object.keys(data.skills).forEach(skillId => {
        nodeStates[skillId] = data.skills[skillId].state;
      });
      
      // Update renderer
      SkillTreeRenderer.updateNodeStates(nodeStates);
    },
    
    // Handle node selected event
    handleNodeSelected: function(nodeId) {
      console.log(`Node selected: ${nodeId}`);
      
      // No additional handling needed currently, as the UI and renderer
      // both react to this event directly
    },
    
    // Helper methods
    
    // Update states of nodes connected to the given node
    updateConnectedNodeStates: function(nodeId) {
      // Find all connections from this node
      const connectedNodeIds = [];
      
      SkillTreeManager.connections.forEach(connection => {
        if (connection.source === nodeId) {
          connectedNodeIds.push(connection.target);
        }
      });
      
      // Update state of connected nodes
      const nodeStates = {};
      
      connectedNodeIds.forEach(connectedId => {
        const node = SkillTreeManager.getSkillById(connectedId);
        
        if (node) {
          nodeStates[connectedId] = node.state;
        }
      });
      
      // Apply updates
      if (Object.keys(nodeStates).length > 0) {
        SkillTreeRenderer.updateNodeStates(nodeStates);
      }
    },
    
    // Update states of all nodes
    updateAllNodeStates: function() {
      // Get all nodes
      const nodes = SkillTreeManager.skills;
      
      // Create state map
      const nodeStates = {};
      
      Object.keys(nodes).forEach(nodeId => {
        nodeStates[nodeId] = nodes[nodeId].state;
      });
      
      // Apply updates
      SkillTreeRenderer.updateNodeStates(nodeStates);
    },
    
    // Debug method to print current state
    debugState: function() {
      console.group("Skill Tree Controller - Debug State");
      
      console.log("Initialized:", this.initialized);
      console.log("Config:", this.config);
      
      SkillTreeManager.debugState();
      
      console.groupEnd();
    }
  };
  
  // Auto-initialize if configured
  document.addEventListener('DOMContentLoaded', () => {
    if (SkillTreeController.config.autoInitialize) {
      SkillTreeController.initialize();
    }
  });
  
  // Export the SkillTreeController object
  window.SkillTreeController = SkillTreeController;