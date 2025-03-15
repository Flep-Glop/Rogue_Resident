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
    
    // Inside SkillTreeController
    initialize: function(options = {}) {
      console.log("SkillTreeController initializing with options:", options);
      
      // Apply options
      Object.assign(this.config, options);
      
      // Check if containers exist
      console.log("DOM elements present:", {
        renderContainerId: this.config.renderContainerId,
        uiContainerId: this.config.uiContainerId,
        renderContainer: document.getElementById(this.config.renderContainerId) !== null,
        uiContainer: document.getElementById(this.config.uiContainerId) !== null
      });
      
      // Create containers if they don't exist
      this.ensureContainers();
      
      // Check containers again after ensuring they exist
      console.log("DOM elements after ensureContainers:", {
        renderContainer: document.getElementById(this.config.renderContainerId) !== null,
        uiContainer: document.getElementById(this.config.uiContainerId) !== null
      });
      
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
          console.error("Failed to initialize SkillTreeController components:", error);
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
    /**
     * Check if required DOM containers exist
     * @returns {Promise} Promise that resolves when containers are ready
     */
    checkContainers: function() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 5;
        
        const checkForContainers = () => {
          attempts++;
          
          const renderContainer = document.getElementById(this.config.renderContainerId);
          const uiContainer = document.getElementById(this.config.uiContainerId);
          
          console.log("Checking for containers (attempt " + attempts + "):", {
            renderContainer: !!renderContainer,
            uiContainer: !!uiContainer
          });
          
          if (renderContainer && uiContainer) {
            resolve();
            return;
          }
          
          if (attempts >= maxAttempts) {
            if (!renderContainer) {
              console.error("Render container not found after " + maxAttempts + " attempts");
            }
            if (!uiContainer) {
              console.error("UI container not found after " + maxAttempts + " attempts");
            }
            
            // Try to create missing containers as a last resort
            this.ensureContainers();
            
            // Resolve anyway to continue initialization
            resolve();
            return;
          }
          
          setTimeout(checkForContainers, 200);
        };
        
        checkForContainers();
      });
    },

    /**
     * Initialize a component with retry logic
     * @param {Function} initFunction - Component initialization function to call
     * @param {String} componentName - Name of the component for logging
     * @param {Number} maxRetries - Maximum number of retries
     * @returns {Promise} Promise that resolves when initialization is complete
     */
    initializeWithRetry: function(initFunction, componentName, maxRetries = 3) {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const attemptInitialization = () => {
          attempts++;
          console.log(`Initializing ${componentName} (attempt ${attempts}/${maxRetries})...`);
          
          try {
            // Call the initialization function (which should return a promise)
            Promise.resolve(initFunction())
              .then(result => {
                resolve(result);
              })
              .catch(error => {
                console.error(`${componentName} initialization failed (attempt ${attempts}/${maxRetries}):`, error);
                
                if (attempts < maxRetries) {
                  console.log(`Retrying ${componentName} initialization in 500ms...`);
                  setTimeout(attemptInitialization, 500);
                } else {
                  console.error(`${componentName} initialization failed after ${maxRetries} attempts`);
                  reject(error);
                }
              });
          } catch (error) {
            console.error(`Error during ${componentName} initialization (attempt ${attempts}/${maxRetries}):`, error);
            
            if (attempts < maxRetries) {
              console.log(`Retrying ${componentName} initialization in 500ms...`);
              setTimeout(attemptInitialization, 500);
            } else {
              console.error(`${componentName} initialization failed after ${maxRetries} attempts`);
              reject(error);
            }
          }
        };
        
        attemptInitialization();
      });
    },
    /**
     * Initialize all components with improved error handling and dependency checks
     * @returns {Promise} Promise that resolves when initialization is complete
     */
    initializeComponents: function() {
      console.log("Initializing skill tree components with improved error handling...");
      
      return new Promise((resolve, reject) => {
        // First check if DOM containers exist
        this.checkContainers()
          .then(() => {
            // Initialize SkillEffectSystem first
            return this.initializeWithRetry(
              SkillEffectSystem.initialize.bind(SkillEffectSystem),
              "SkillEffectSystem",
              3
            );
          })
          .then(() => {
            console.log("SkillEffectSystem initialized");
            
            // Then initialize SkillTreeManager
            return this.initializeWithRetry(
              SkillTreeManager.initialize.bind(SkillTreeManager),
              "SkillTreeManager",
              3
            );
          })
          .then(() => {
            console.log("SkillTreeManager initialized");
            
            // Initialize the renderer with error handling
            try {
              const rendererInitialized = SkillTreeRenderer.initialize(this.config.renderContainerId, {
                width: 800,
                height: 800
              });
              
              if (!rendererInitialized) {
                throw new Error("Failed to initialize SkillTreeRenderer");
              }
              
              console.log("SkillTreeRenderer initialized");
            } catch (error) {
              console.error("SkillTreeRenderer initialization failed:", error);
              // Continue despite renderer error
            }
            
            // Initialize the UI with error handling
            try {
              SkillTreeUI.initialize({
                containerId: this.config.uiContainerId,
                controlsContainerId: this.config.controlsContainerId,
                infoContainerId: this.config.infoContainerId
              });
              
              console.log("SkillTreeUI initialized");
            } catch (error) {
              console.error("SkillTreeUI initialization failed:", error);
              // Continue despite UI error
            }
            
            // Complete initialization even if some components failed
            resolve();
          })
          .catch(error => {
            console.error("Component initialization failed:", error);
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
    
    /**
     * Load skill tree data with improved error handling
     */
    loadSkillTree: function() {
      console.log("Loading skill tree data with improved error handling");
      
      // Check if manager is initialized
      if (!SkillTreeManager.initialized) {
        console.warn("SkillTreeManager not initialized, cannot load skill tree");
        return;
      }
      
      try {
        const skills = SkillTreeManager.skills;
        const specializations = SkillTreeManager.specializations;
        const connections = SkillTreeManager.connections;
        
        console.log(`Loading skill tree with ${Object.keys(skills).length} skills, ${Object.keys(specializations).length} specializations`);
        
        // Set up specialization filters in UI with error handling and retry logic
        const setupUI = () => {
          if (SkillTreeUI.initialized && typeof SkillTreeUI.setupSpecializationFilters === 'function') {
            try {
              SkillTreeUI.setupSpecializationFilters(specializations);
              
              // After filters are set up, try to update stats too
              if (typeof SkillTreeUI.updateStats === 'function') {
                try {
                  SkillTreeUI.updateStats(
                    SkillTreeManager.reputation,
                    SkillTreeManager.skillPointsAvailable,
                    SkillTreeManager.specialization_progress
                  );
                } catch (error) {
                  console.error("Failed to update UI stats:", error);
                }
              }
              
              return true;
            } catch (error) {
              console.error("Failed to set up specialization filters:", error);
              return false;
            }
          } else {
            console.warn("SkillTreeUI not initialized or missing setupSpecializationFilters method");
            return false;
          }
        };

        // Try immediately
        if (!setupUI()) {
          // If failed, try again after a brief delay
          console.log("Will retry UI setup after delay...");
          setTimeout(() => {
            // If SkillTreeAccess is available, try to repair UI first
            if (typeof SkillTreeAccess !== 'undefined' && 
                typeof SkillTreeAccess.ensureSkillTreeUI === 'function') {
              SkillTreeAccess.ensureSkillTreeUI();
            }
            
            // Try UI setup again
            setupUI();
          }, 300);
        }
        
        // Create node state map
        const nodeStates = {};
        Object.keys(skills).forEach(skillId => {
          nodeStates[skillId] = skills[skillId].state;
        });
        
        // Load data into renderer with error handling
        if (SkillTreeRenderer.initialized) {
          try {
            SkillTreeRenderer.loadSkillTree({
              nodes: skills,
              connections: connections,
              specializations: specializations
            });
          } catch (error) {
            console.error("Failed to load skill tree in renderer:", error);
          }
          
          // Update node states
          try {
            SkillTreeRenderer.updateNodeStates(nodeStates);
          } catch (error) {
            console.error("Failed to update node states in renderer:", error);
          }
        } else {
          console.warn("SkillTreeRenderer not initialized, cannot load skill tree visualization");
        }
        
        // Update UI stats with error handling
        if (SkillTreeUI.initialized && typeof SkillTreeUI.updateStats === 'function') {
          try {
            SkillTreeUI.updateStats(
              SkillTreeManager.reputation,
              SkillTreeManager.skillPointsAvailable,
              SkillTreeManager.specialization_progress
            );
          } catch (error) {
            console.error("Failed to update UI stats:", error);
          }
        } else {
          console.warn("SkillTreeUI not initialized or missing updateStats method");
        }
        
        console.log("Skill tree loaded successfully");
      } catch (error) {
        console.error("Error loading skill tree:", error);
        ErrorHandler.handleError(
          error,
          "Skill Tree Loading",
          ErrorHandler.SEVERITY.ERROR
        );
      }
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
  console.log("Loaded: skill_tree_controller.js");