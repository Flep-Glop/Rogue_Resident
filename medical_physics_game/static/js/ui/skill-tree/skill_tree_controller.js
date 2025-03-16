// skill_tree_controller.js - Coordinates between skill tree components

/**
 * SkillTreeController - Coordinates between skill tree components with
 * improved error handling and initialization sequence.
 */
const SkillTreeController = {
  // Configuration
  config: {
      renderContainerId: 'skill-tree-visualization',
      uiContainerId: 'skill-tree-ui',
      controlsContainerId: 'skill-tree-controls',
      infoContainerId: 'skill-tree-info',
      autoInitialize: true,
      loadOnInitialize: true,
      initRetryDelay: 500,
      maxInitRetries: 3
  },
  
  // Component references
  components: {
      manager: null,
      renderer: null,
      ui: null,
      effectSystem: null
  },
  
  // State
  state: {
      initialized: false,
      initAttempt: 0,
      dataLoaded: false,
      errorState: false,
      eventHandlersRegistered: false
  },
  
  /**
   * Initialize the controller and required components
   * @param {Object} options - Configuration options
   * @returns {Object} Controller instance
   */
  initialize: function(options = {}) {
      // Apply options
      Object.assign(this.config, options);
      
      console.log("SkillTreeController initializing...");
      
      // If already initialized, just return
      if (this.state.initialized) {
          console.log("SkillTreeController already initialized");
          return this;
      }
      
      // Increment attempt counter
      this.state.initAttempt++;
      
      // Check if dependencies are available
      if (!this._checkDependencies()) {
          // If max retries reached, show error
          if (this.state.initAttempt >= this.config.maxInitRetries) {
              console.error("Failed to initialize SkillTreeController: dependencies not available");
              this.state.errorState = true;
              this._triggerErrorEvent("Failed to initialize skill tree: missing dependencies");
              return this;
          }
          
          // Retry after delay
          console.log(`Retrying SkillTreeController initialization (${this.state.initAttempt}/${this.config.maxInitRetries})...`);
          setTimeout(() => this.initialize(options), this.config.initRetryDelay);
          return this;
      }
      
      // Initialize components in sequence
      this._initializeComponents()
          .then(() => {
              // Register event listeners
              this._registerEventListeners();
              
              // Mark as initialized
              this.state.initialized = true;
              
              console.log("SkillTreeController initialized successfully");
              
              // Load skill tree data if configured
              if (this.config.loadOnInitialize) {
                  this.loadSkillTree();
              }
              
              // Dispatch initialized event
              this._triggerEvent("skillTreeControllerInitialized");
          })
          .catch(error => {
              console.error("Error initializing SkillTreeController:", error);
              
              // If max retries reached, show error
              if (this.state.initAttempt >= this.config.maxInitRetries) {
                  console.error("Failed to initialize SkillTreeController after max retries");
                  this.state.errorState = true;
                  this._triggerErrorEvent("Failed to initialize skill tree: " + error.message);
                  return this;
              }
              
              // Retry after delay
              console.log(`Retrying SkillTreeController initialization (${this.state.initAttempt}/${this.config.maxInitRetries})...`);
              setTimeout(() => this.initialize(options), this.config.initRetryDelay);
          });
      
      return this;
  },
  
  /**
   * Check if all required dependencies are available
   * @private
   * @returns {Boolean} True if all dependencies are available
   */
  _checkDependencies: function() {
      return window.SkillTreeManager && 
             window.SkillTreeRenderer && 
             window.SkillTreeUI && 
             window.SkillEffectSystem;
  },
  
  /**
   * Initialize all components in the correct sequence
   * @private
   * @returns {Promise} Promise that resolves when all components are initialized
   */
  _initializeComponents: function() {
      return new Promise((resolve, reject) => {
          // First initialize the effect system
          this._initializeComponent('effectSystem', window.SkillEffectSystem)
              .then(() => {
                  // Then initialize the manager
                  return this._initializeComponent('manager', window.SkillTreeManager);
              })
              .then(() => {
                  // Initialize renderer and UI in parallel
                  return Promise.all([
                      this._initializeComponent('renderer', window.SkillTreeRenderer, {
                          containerId: this.config.renderContainerId
                      }),
                      this._initializeComponent('ui', window.SkillTreeUI, {
                          containerId: this.config.uiContainerId,
                          controlsContainerId: this.config.controlsContainerId,
                          infoContainerId: this.config.infoContainerId
                      })
                  ]);
              })
              .then(() => {
                  resolve();
              })
              .catch(error => {
                  reject(error);
              });
      });
  },
  
  /**
   * Initialize a single component
   * @private
   * @param {String} componentName - Name of the component reference to update
   * @param {Object} component - Component to initialize
   * @param {Object} options - Component-specific options
   * @returns {Promise} Promise that resolves when component is initialized
   */
  _initializeComponent: function(componentName, component, options = {}) {
      return new Promise((resolve, reject) => {
          if (!component) {
              reject(new Error(`Component not available: ${componentName}`));
              return;
          }
          
          try {
              // Store component reference
              this.components[componentName] = component;
              
              // Skip if already initialized
              if (component.initialized) {
                  console.log(`${componentName} already initialized`);
                  resolve();
                  return;
              }
              
              // Initialize the component
              console.log(`Initializing ${componentName}...`);
              const result = component.initialize(options);
              
              // Handle promise or value result
              if (result instanceof Promise) {
                  result.then(() => {
                      console.log(`${componentName} initialized successfully`);
                      resolve();
                  }).catch(err => {
                      reject(new Error(`Failed to initialize ${componentName}: ${err.message}`));
                  });
              } else {
                  // Assume success if not a promise
                  console.log(`${componentName} initialized successfully`);
                  resolve();
              }
          } catch (error) {
              reject(new Error(`Error initializing ${componentName}: ${error.message}`));
          }
      });
  },
  
  /**
   * Register event listeners for inter-component communication
   * @private
   */
  _registerEventListeners: function() {
      if (this.state.eventHandlersRegistered) {
          return;
      }
      
      console.log("Registering event listeners");
      
      // Register with SkillTreeManager for events
      if (this.components.manager && this.components.manager.addObserver) {
          this.components.manager.addObserver(this._handleManagerEvent.bind(this));
      }
      
      // Listen for node selection
      document.addEventListener('skillNodeSelected', (event) => {
          this._handleNodeSelected(event.detail.nodeId);
      });
      
      this.state.eventHandlersRegistered = true;
  },
  
  /**
   * Load skill tree data
   */
  loadSkillTree: function() {
      console.log("Loading skill tree data");
      
      // Ensure components are initialized
      if (!this.state.initialized) {
          console.warn("SkillTreeController not initialized, cannot load skill tree");
          
          // Auto-init if configured
          if (this.config.autoInitialize) {
              this.initialize().then(() => this.loadSkillTree());
          }
          
          return;
      }
      
      // Get data from SkillTreeManager
      try {
          if (!this.components.manager) {
              throw new Error("SkillTreeManager not available");
          }
          
          const skills = this.components.manager.skills;
          const specializations = this.components.manager.specializations;
          const connections = this.components.manager.connections;
          
          // Update UI
          if (this.components.ui && this.components.ui.initialized) {
              try {
                  // Setup specialization filters
                  this.components.ui.setupSpecializationFilters(specializations);
                  
                  // Update stats
                  this.components.ui.updateStats(
                      this.components.manager.reputation,
                      this.components.manager.skillPointsAvailable,
                      this.components.manager.specialization_progress
                  );
              } catch (error) {
                  console.error("Error updating UI:", error);
              }
          }
          
          // Load data into renderer
          if (this.components.renderer && this.components.renderer.initialized) {
              try {
                  // Load tree data
                  this.components.renderer.loadSkillTree({
                      nodes: skills,
                      connections: connections,
                      specializations: specializations
                  });
                  
                  // Update node states
                  const nodeStates = {};
                  Object.keys(skills).forEach(skillId => {
                      nodeStates[skillId] = skills[skillId].state;
                  });
                  
                  this.components.renderer.updateNodeStates(nodeStates);
              } catch (error) {
                  console.error("Error updating renderer:", error);
              }
          }
          
          // Mark data as loaded
          this.state.dataLoaded = true;
          
          // Trigger loaded event
          this._triggerEvent("skillTreeDataLoaded");
      } catch (error) {
          console.error("Error loading skill tree data:", error);
          this._triggerErrorEvent("Failed to load skill tree data: " + error.message);
      }
  },
  
  /**
   * Handle events from SkillTreeManager
   * @private
   * @param {String} eventType - Event type
   * @param {Object} data - Event data
   */
  _handleManagerEvent: function(eventType, data) {
      console.log(`Handling manager event: ${eventType}`);
      
      switch (eventType) {
          case 'skillUnlocked':
              this._handleSkillUnlocked(data);
              break;
              
          case 'skillActivated':
              this._handleSkillActivated(data);
              break;
              
          case 'skillDeactivated':
              this._handleSkillDeactivated(data);
              break;
              
          case 'reputationChanged':
              this._handleReputationChanged(data);
              break;
              
          case 'skillPointsChanged':
              this._handleSkillPointsChanged(data);
              break;
              
          case 'skillStatesUpdated':
              this._handleSkillStatesUpdated(data);
              break;
      }
  },
  
  /**
   * Handle skill unlocked event
   * @private
   * @param {Object} data - Event data
   */
  _handleSkillUnlocked: function(data) {
      // Update renderer with new state
      if (this.components.renderer && this.components.renderer.initialized) {
          const nodeStates = { [data.skillId]: 'unlocked' };
          this.components.renderer.updateNodeStates(nodeStates);
      }
      
      // Update UI stats
      this._updateStats();
      
      // Update connected nodes
      this._updateConnectedNodeStates(data.skillId);
  },
  
  /**
   * Handle skill activated event
   * @private
   * @param {Object} data - Event data
   */
  _handleSkillActivated: function(data) {
      // Update renderer with new state
      if (this.components.renderer && this.components.renderer.initialized) {
          const nodeStates = { [data.skillId]: 'active' };
          this.components.renderer.updateNodeStates(nodeStates);
      }
      
      // Update UI stats
      this._updateStats();
  },
  
  /**
   * Handle skill deactivated event
   * @private
   * @param {Object} data - Event data
   */
  _handleSkillDeactivated: function(data) {
      // Update renderer with new state
      if (this.components.renderer && this.components.renderer.initialized) {
          const nodeStates = { [data.skillId]: 'unlocked' };
          this.components.renderer.updateNodeStates(nodeStates);
      }
      
      // Update UI stats
      this._updateStats();
  },
  
  /**
   * Handle reputation changed event
   * @private
   * @param {Object} data - Event data
   */
  _handleReputationChanged: function(data) {
      // Update UI stats
      this._updateStats();
      
      // Update all node states as thresholds may have changed
      this._updateAllNodeStates();
  },
  
  /**
   * Handle skill points changed event
   * @private
   * @param {Object} data - Event data
   */
  _handleSkillPointsChanged: function(data) {
      // Update UI stats
      this._updateStats();
  },
  
  /**
   * Handle skill states updated event
   * @private
   * @param {Object} data - Event data
   */
  _handleSkillStatesUpdated: function(data) {
      // Create node states map
      const nodeStates = {};
      
      Object.keys(data.skills).forEach(skillId => {
          nodeStates[skillId] = data.skills[skillId].state;
      });
      
      // Update renderer
      if (this.components.renderer && this.components.renderer.initialized) {
          this.components.renderer.updateNodeStates(nodeStates);
      }
  },
  
  /**
   * Handle node selected event
   * @private
   * @param {String} nodeId - ID of selected node
   */
  _handleNodeSelected: function(nodeId) {
      console.log(`Node selected: ${nodeId}`);
      
      // No additional handling needed as UI and renderer
      // listen for this event directly
  },
  
  /**
   * Update states of nodes connected to the given node
   * @private
   * @param {String} nodeId - ID of the node
   */
  _updateConnectedNodeStates: function(nodeId) {
      if (!this.components.manager) return;
      
      // Find all connections from this node
      const connectedNodeIds = [];
      
      this.components.manager.connections.forEach(connection => {
          if (connection.source === nodeId) {
              connectedNodeIds.push(connection.target);
          }
      });
      
      // Update state of connected nodes
      const nodeStates = {};
      
      connectedNodeIds.forEach(connectedId => {
          const node = this.components.manager.getSkillById(connectedId);
          
          if (node) {
              nodeStates[connectedId] = node.state;
          }
      });
      
      // Apply updates to renderer
      if (Object.keys(nodeStates).length > 0 && 
          this.components.renderer && 
          this.components.renderer.initialized) {
          this.components.renderer.updateNodeStates(nodeStates);
      }
  },
  
  /**
   * Update all node states
   * @private
   */
  _updateAllNodeStates: function() {
      if (!this.components.manager) return;
      
      // Get all nodes
      const nodes = this.components.manager.skills;
      
      // Create state map
      const nodeStates = {};
      
      Object.keys(nodes).forEach(nodeId => {
          nodeStates[nodeId] = nodes[nodeId].state;
      });
      
      // Apply updates to renderer
      if (this.components.renderer && this.components.renderer.initialized) {
          this.components.renderer.updateNodeStates(nodeStates);
      }
  },
  
  /**
   * Update UI stats
   * @private
   */
  _updateStats: function() {
      if (!this.components.ui || !this.components.ui.initialized) return;
      if (!this.components.manager) return;
      
      try {
          this.components.ui.updateStats(
              this.components.manager.reputation,
              this.components.manager.skillPointsAvailable,
              this.components.manager.specialization_progress
          );
      } catch (error) {
          console.error("Error updating UI stats:", error);
      }
  },
  
  /**
   * Trigger a custom event
   * @private
   * @param {String} eventName - Name of the event
   * @param {Object} detail - Event details
   */
  _triggerEvent: function(eventName, detail = {}) {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
  },
  
  /**
   * Trigger an error event
   * @private
   * @param {String} message - Error message
   */
  _triggerErrorEvent: function(message) {
      this._triggerEvent('skillTreeError', { message });
  },
  
  /**
   * Get debugging information about the controller state
   * @returns {Object} Debug information
   */
  getDebugInfo: function() {
      return {
          initialized: this.state.initialized,
          initAttempt: this.state.initAttempt,
          dataLoaded: this.state.dataLoaded,
          errorState: this.state.errorState,
          eventHandlersRegistered: this.state.eventHandlersRegistered,
          components: {
              manager: !!this.components.manager,
              renderer: !!this.components.renderer,
              ui: !!this.components.ui,
              effectSystem: !!this.components.effectSystem
          },
          componentStatus: {
              manager: this.components.manager?.initialized || false,
              renderer: this.components.renderer?.initialized || false,
              ui: this.components.ui?.initialized || false,
              effectSystem: this.components.effectSystem?.initialized || false
          },
          containers: {
              renderContainerId: this.config.renderContainerId,
              uiContainerId: this.config.uiContainerId,
              renderContainerExists: !!document.getElementById(this.config.renderContainerId),
              uiContainerExists: !!document.getElementById(this.config.uiContainerId)
          }
      };
  },
  
  /**
   * Log debug information to console
   */
  debugState: function() {
      console.group("Skill Tree Controller - Debug State");
      
      const info = this.getDebugInfo();
      console.log("Controller Status:", {
          initialized: info.initialized,
          initAttempt: info.initAttempt,
          dataLoaded: info.dataLoaded,
          errorState: info.errorState
      });
      
      console.log("Component Status:", info.componentStatus);
      console.log("Container Status:", info.containers);
      
      if (this.components.manager) {
          this.components.manager.debugState();
      }
      
      console.groupEnd();
  }
};

// Auto-initialize if configured
document.addEventListener('DOMContentLoaded', () => {
  if (SkillTreeController.config.autoInitialize) {
      // Slight delay to ensure all scripts are loaded
      setTimeout(() => {
          SkillTreeController.initialize();
      }, 100);
  }
});

// Export globally
window.SkillTreeController = SkillTreeController;