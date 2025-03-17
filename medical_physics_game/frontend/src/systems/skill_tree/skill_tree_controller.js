// frontend/src/systems/skill_tree/skill_tree_controller.js

/**
 * SkillTreeController - Updated to coordinate between skill tree components with
 * improved integration and data handling
 */
class SkillTreeController {
    // Configuration
    config = {
      renderContainerId: 'skill-tree-visualization',
      uiContainerId: 'skill-tree-ui',
      controlsContainerId: 'skill-tree-controls',
      infoContainerId: 'skill-tree-info',
      autoInitialize: true,
      loadOnInitialize: false,
      initRetryDelay: 500,
      maxInitRetries: 3
    };
    
    // Component references
    components = {
      renderer: null,
      ui: null,
      effectSystem: null
    };
    
    // State
    state = {
      initialized: false,
      initAttempt: 0,
      dataLoaded: false,
      errorState: false,
      treeData: null,
      progressData: null,
      nodeData: {}, // Processed node data with states
      eventHandlersRegistered: false
    };
    
    /**
     * Initialize the controller and required components
     * @param {Object} options - Configuration options
     * @returns {Object} Controller instance
     */
    initialize(options = {}) {
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
      
      // Initialize components
      this._initializeComponents();
      
      // Register event listeners
      this._registerEventListeners();
      
      // Mark as initialized
      this.state.initialized = true;
      
      console.log("SkillTreeController initialized successfully");
      
      // Trigger initialized event
      this._triggerEvent("skillTreeControllerInitialized");
      
      return this;
    }
    
    /**
     * Check if all required dependencies are available
     * @private
     * @returns {Boolean} True if all dependencies are available
     */
    _checkDependencies() {
      return window.SkillTreeRenderer && 
             window.SkillTreeUI && 
             window.SkillEffectSystem;
    }
    
    /**
     * Initialize necessary components
     * @private
     */
    _initializeComponents() {
      // Store component references
      this.components.renderer = window.SkillTreeRenderer;
      this.components.ui = window.SkillTreeUI;
      this.components.effectSystem = window.SkillEffectSystem;
      
      // Initialize components if needed
      if (!this.components.renderer.initialized) {
        this.components.renderer.initialize(this.config.renderContainerId);
      }
      
      if (!this.components.ui.initialized) {
        this.components.ui.initialize({
          containerId: this.config.uiContainerId,
          controlsContainerId: this.config.controlsContainerId,
          infoContainerId: this.config.infoContainerId
        });
      }
      
      if (!this.components.effectSystem.initialized) {
        this.components.effectSystem.initialize();
      }
    }
    
    /**
     * Register event listeners for inter-component communication
     * @private
     */
    _registerEventListeners() {
      if (this.state.eventHandlersRegistered) {
        return;
      }
      
      console.log("Registering event listeners");
      
      // Listen for node selection
      document.addEventListener('skillNodeSelected', (event) => {
        this._handleNodeSelected(event.detail.nodeId);
      });
      
      // Listen for filter changes
      document.addEventListener('skillTreeFilter', (event) => {
        this._handleFilterChange(event.detail.specializationId);
      });
      
      this.state.eventHandlersRegistered = true;
    }
    
    /**
     * Load skill tree data
     * @param {Object} treeData - Skill tree definition data
     * @param {Object} progressData - Player progress data
     */
    loadSkillTree(treeData, progressData) {
      console.log("Loading skill tree data and progress");
      
      // Ensure components are initialized
      if (!this.state.initialized) {
        console.warn("SkillTreeController not initialized, cannot load skill tree");
        
        // Auto-init if configured
        if (this.config.autoInitialize) {
          this.initialize().then(() => this.loadSkillTree(treeData, progressData));
        }
        
        return;
      }
      
      // Store data
      this.state.treeData = treeData;
      this.state.progressData = progressData;
      
      // Process node data
      this._processNodeData();
      
      try {
        // Update UI components
        if (this.components.ui && this.components.ui.initialized) {
          // Setup specialization filters
          this.components.ui.setupSpecializationFilters(treeData.specializations);
          
          // Update stats
          this.components.ui.updateStats(
            progressData.reputation,
            progressData.skill_points_available,
            progressData.specialization_progress
          );
        }
        
        // Load data into renderer
        if (this.components.renderer && this.components.renderer.initialized) {
          // Load tree data
          this.components.renderer.loadSkillTree({
            nodes: treeData.nodes,
            connections: treeData.connections,
            specializations: treeData.specializations
          });
          
          // Update node states
          const nodeStates = {};
          
          Object.values(this.state.nodeData).forEach(node => {
            nodeStates[node.id] = node.state;
          });
          
          this.components.renderer.updateNodeStates(nodeStates);
        }
        
        // Apply effects for active skills
        if (this.components.effectSystem && this.components.effectSystem.initialized) {
          // Clear existing effects
          this.components.effectSystem._resetActiveEffects();
          
          // Apply effects for active skills
          progressData.active_skills.forEach(skillId => {
            const skill = this.state.nodeData[skillId];
            if (skill) {
              this.components.effectSystem.applySkillEffects(skill);
            }
          });
        }
        
        // Mark data as loaded
        this.state.dataLoaded = true;
        
        // Trigger loaded event
        this._triggerEvent("skillTreeDataLoaded");
      } catch (error) {
        console.error("Error loading skill tree data:", error);
        this._triggerErrorEvent("Failed to load skill tree data: " + error.message);
      }
    }
    
    /**
     * Process node data by adding state information
     * @private
     */
    _processNodeData() {
      // Create processed node data with states
      this.state.nodeData = {};
      
      const { treeData, progressData } = this.state;
      
      if (!treeData || !treeData.nodes || !progressData) {
        return;
      }
      
      // Process each node
      treeData.nodes.forEach(node => {
        // Create a copy of the node
        const processedNode = { ...node };
        
        // Determine node state
        if (progressData.active_skills.includes(node.id)) {
          processedNode.state = 'active';
        } else if (progressData.unlocked_skills.includes(node.id)) {
          processedNode.state = 'unlocked';
        } else if (this._canUnlockNode(node)) {
          processedNode.state = 'unlockable';
        } else {
          processedNode.state = 'locked';
        }
        
        // Store in node data
        this.state.nodeData[node.id] = processedNode;
      });
    }
    
    /**
     * Check if a node can be unlocked
     * @private
     * @param {Object} node - Node to check
     * @returns {Boolean} True if node can be unlocked
     */
    _canUnlockNode(node) {
      const { progressData, treeData } = this.state;
      
      // Check reputation cost
      if (node.cost && node.cost.reputation > progressData.reputation) {
        return false;
      }
      
      // Check if prerequisites are unlocked
      const connections = treeData.connections.filter(conn => conn.target === node.id);
      if (connections.length === 0) {
        // No prerequisites, can unlock if cost is met
        return true;
      }
      
      // Check if at least one prerequisite is unlocked or active
      return connections.some(conn => 
        progressData.unlocked_skills.includes(conn.source) || 
        progressData.active_skills.includes(conn.source)
      );
    }
    
    /**
     * Check if a node can be activated
     * @private
     * @param {Object} node - Node to check
     * @returns {Boolean} True if node can be activated
     */
    _canActivateNode(node) {
      const { progressData, treeData } = this.state;
      
      // Check if unlocked
      if (!progressData.unlocked_skills.includes(node.id)) {
        return false;
      }
      
      // Check if already active
      if (progressData.active_skills.includes(node.id)) {
        return false;
      }
      
      // Check skill points cost
      if (node.cost && node.cost.skill_points > progressData.skill_points_available) {
        return false;
      }
      
      // Check if at least one prerequisite is active
      const connections = treeData.connections.filter(conn => conn.target === node.id);
      if (connections.length === 0) {
        // No prerequisites, can activate if cost is met
        return true;
      }
      
      // Need at least one active prerequisite
      return connections.some(conn => progressData.active_skills.includes(conn.source));
    }
    
    /**
     * Handle node selected event
     * @private
     * @param {String} nodeId - ID of selected node
     */
    _handleNodeSelected(nodeId) {
      console.log(`Node selected: ${nodeId}`);
      
      // Update UI with node details
      if (this.components.ui && nodeId) {
        const nodeData = this.getNodeData(nodeId);
        if (nodeData) {
          this.components.ui.showNodeInfo(nodeData);
        }
      }
    }
    
    /**
     * Handle filter change event
     * @private
     * @param {String} specializationId - ID of specialization to filter by
     */
    _handleFilterChange(specializationId) {
      // Currently no additional handling needed
      console.log(`Filter changed to: ${specializationId || 'all'}`);
    }
    
    /**
     * Get node data by ID
     * @param {String} nodeId - ID of node to get
     * @returns {Object|null} Node data or null if not found
     */
    getNodeData(nodeId) {
      return this.state.nodeData[nodeId] || null;
    }
    
    /**
     * Unlock a skill node
     * @param {String} nodeId - ID of node to unlock
     * @returns {Promise<Boolean>} Promise resolving to success status
     */
    unlockSkill(nodeId) {
      const node = this.getNodeData(nodeId);
      if (!node || node.state !== 'unlockable') {
        return Promise.resolve(false);
      }
      
      // Check cost
      if (node.cost && node.cost.reputation > this.state.progressData.reputation) {
        console.log(`Not enough reputation to unlock ${node.name}`);
        return Promise.resolve(false);
      }
      
      // Deduct cost
      this.state.progressData.reputation -= node.cost?.reputation || 0;
      
      // Add to unlocked skills
      this.state.progressData.unlocked_skills.push(nodeId);
      
      // Update node state
      node.state = 'unlocked';
      
      // Update UI
      this._updateUI();
      
      // Try to save progress
      return this.saveProgress().then(() => true);
    }
    
    /**
     * Activate a skill node
     * @param {String} nodeId - ID of node to activate
     * @returns {Promise<Boolean>} Promise resolving to success status
     */
    activateSkill(nodeId) {
      const node = this.getNodeData(nodeId);
      if (!node || node.state !== 'unlocked') {
        return Promise.resolve(false);
      }
      
      // Check cost
      if (node.cost && node.cost.skill_points > this.state.progressData.skill_points_available) {
        console.log(`Not enough skill points to activate ${node.name}`);
        return Promise.resolve(false);
      }
      
      // Deduct cost
      this.state.progressData.skill_points_available -= node.cost?.skill_points || 0;
      
      // Add to active skills
      this.state.progressData.active_skills.push(nodeId);
      
      // Update node state
      node.state = 'active';
      
      // Apply effects
      if (this.components.effectSystem) {
        this.components.effectSystem.applySkillEffects(node);
      }
      
      // Update UI
      this._updateUI();
      
      // Trigger event
      this._triggerEvent('skillActivated', { skill: node });
      
      // Try to save progress
      return this.saveProgress().then(() => true);
    }
    
    /**
     * Deactivate a skill node
     * @param {String} nodeId - ID of node to deactivate
     * @returns {Promise<Boolean>} Promise resolving to success status
     */
    deactivateSkill(nodeId) {
      const node = this.getNodeData(nodeId);
      if (!node || node.state !== 'active') {
        return Promise.resolve(false);
      }
      
      // Check if core skills
      if (node.tier === 0 || (node.specialization && node.specialization === 'core')) {
        console.log(`Core skills cannot be deactivated`);
        return Promise.resolve(false);
      }
      
      // Check dependent skills
      const dependentSkills = this._getActiveDependentSkills(nodeId);
      if (dependentSkills.length > 0) {
        console.log(`Cannot deactivate ${node.name} because other skills depend on it`);
        return Promise.resolve(false);
      }
      
      // Remove from active skills
      const index = this.state.progressData.active_skills.indexOf(nodeId);
      if (index !== -1) {
        this.state.progressData.active_skills.splice(index, 1);
      }
      
      // Refund cost
      this.state.progressData.skill_points_available += node.cost?.skill_points || 0;
      
      // Update node state
      node.state = 'unlocked';
      
      // Remove effects
      if (this.components.effectSystem) {
        this.components.effectSystem.removeSkillEffects(node);
      }
      
      // Update UI
      this._updateUI();
      
      // Trigger event
      this._triggerEvent('skillDeactivated', { skill: node });
      
      // Try to save progress
      return this.saveProgress().then(() => true);
    }
    
    /**
     * Get active skills that depend on a skill
     * @private
     * @param {String} nodeId - ID of node to check
     * @returns {Array} Array of dependent skill IDs
     */
    _getActiveDependentSkills(nodeId) {
      const { treeData, progressData } = this.state;
      
      // Find all connections where this node is the source
      const dependentConnections = treeData.connections.filter(conn => conn.source === nodeId);
      
      // Check if any dependent nodes are active
      const dependentNodeIds = dependentConnections.map(conn => conn.target);
      
      // Only return active nodes that have no other active prerequisites
      return dependentNodeIds.filter(depId => {
        if (!progressData.active_skills.includes(depId)) {
          return false;
        }
        
        // Check if this node has other active prerequisites
        const prereqConnections = treeData.connections.filter(conn => conn.target === depId);
        return !prereqConnections.some(conn => 
          conn.source !== nodeId && progressData.active_skills.includes(conn.source)
        );
      });
    }
    
    /**
     * Update UI components with current state
     * @private
     */
    _updateUI() {
      // Update renderer with node states
      if (this.components.renderer) {
        const nodeStates = {};
        
        Object.values(this.state.nodeData).forEach(node => {
          nodeStates[node.id] = node.state;
        });
        
        this.components.renderer.updateNodeStates(nodeStates);
      }
      
      // Update UI with stats
      if (this.components.ui) {
        this.components.ui.updateStats(
          this.state.progressData.reputation,
          this.state.progressData.skill_points_available,
          this.state.progressData.specialization_progress
        );
      }
    }
    
    /**
     * Save progress to server
     * @returns {Promise<Boolean>} Promise resolving to success status
     */
    saveProgress() {
      // Prepare data to save
      const progressData = {
        reputation: this.state.progressData.reputation,
        unlocked_skills: this.state.progressData.unlocked_skills,
        active_skills: this.state.progressData.active_skills,
        skill_points_available: this.state.progressData.skill_points_available,
        specialization_progress: this.state.progressData.specialization_progress
      };
      
      // Save to server
      return fetch('/api/skill-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(progressData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to save progress: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Progress saved successfully");
        return true;
      })
      .catch(error => {
        console.error("Error saving progress:", error);
        return false;
      });
    }
    
    /**
     * Trigger a custom event
     * @private
     * @param {String} eventName - Name of the event
     * @param {Object} detail - Event details
     */
    _triggerEvent(eventName, detail = {}) {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    }
    
    /**
     * Trigger an error event
     * @private
     * @param {String} message - Error message
     */
    _triggerErrorEvent(message) {
      this._triggerEvent('skillTreeError', { message });
    }
    
    /**
     * Get information about controller state
     * @returns {Object} Debug information
     */
    getDebugInfo() {
      return {
        initialized: this.state.initialized,
        dataLoaded: this.state.dataLoaded,
        errorState: this.state.errorState,
        components: {
          renderer: !!this.components.renderer.initialized,
          ui: !!this.components.ui.initialized,
          effectSystem: !!this.components.effectSystem.initialized
        },
        data: {
          nodeCount: Object.keys(this.state.nodeData).length,
          unlockedCount: this.state.progressData?.unlocked_skills?.length || 0,
          activeCount: this.state.progressData?.active_skills?.length || 0
        }
      };
    }
  }
  
  // Export for module use
  export default SkillTreeController;
  
  // For backward compatibility with existing code
  window.SkillTreeController = new SkillTreeController();