// frontend/src/systems/skill_tree/core/skill_tree_controller.js

/**
 * SkillTreeController
 * Coordinates between the skill tree manager, renderer, and UI components
 */
class SkillTreeController {
  constructor() {
    this.initialized = false;
    this.manager = null;
    this.renderer = null;
    this.eventSystem = null;
    this.state = {
      loading: false,
      error: null,
      selectedNodeId: null
    };
  }

  /**
   * Initialize the controller
   * @param {Object} options Configuration options
   * @returns {SkillTreeController} This instance for chaining
   */
  initialize(options = {}) {
    if (this.initialized) return this;
    
    // Store references to dependencies
    this.manager = options.manager;
    this.renderer = options.renderer;
    this.eventSystem = options.eventSystem;
    
    // Set up event listeners
    if (this.eventSystem) {
      // Listen for UI events
      this.eventSystem.subscribe('ui.node_selected', this.selectNode.bind(this));
      this.eventSystem.subscribe('ui.node_unlock_requested', this.unlockNode.bind(this));
      this.eventSystem.subscribe('ui.reset_view', this.resetView.bind(this));
      this.eventSystem.subscribe('ui.zoom_in', this.zoomIn.bind(this));
      this.eventSystem.subscribe('ui.zoom_out', this.zoomOut.bind(this));
      
      // Listen for direct DOM events (for backwards compatibility)
      document.addEventListener('skillNodeSelected', (event) => {
        this.selectNode(event.detail.nodeId);
      });
    }
    
    this.initialized = true;
    return this;
  }

  /**
   * Load skill tree data and player progress
   * @returns {Promise} Promise resolving with the loaded data
   */
  loadData() {
    if (!this.initialized || !this.manager) {
      return Promise.reject(new Error('Controller not properly initialized'));
    }
    
    this.state.loading = true;
    this._notifyEvent('loading_started');
    
    // Load data through the manager
    return this.manager.loadData()
      .then(data => {
        // Process data for visualization
        const visualData = this._processDataForVisualization(data);
        
        // Load data into renderer
        if (this.renderer) {
          this.renderer.loadSkillTree(visualData);
          this._updateNodeStates(data.progress);
        }
        
        this.state.loading = false;
        this._notifyEvent('data_loaded', data);
        
        return data;
      })
      .catch(error => {
        this.state.loading = false;
        this.state.error = error.message;
        this._notifyEvent('loading_error', { error: error.message });
        throw error;
      });
  }

  /**
   * Process data for visualization
   * @private
   * @param {Object} data Raw data from manager
   * @returns {Object} Processed data for renderer
   */
  _processDataForVisualization(data) {
    // For orbital renderer, we might need to modify the data structure
    // This will depend on what format your renderer expects
    
    return {
      nodes: data.data.nodes,
      connections: data.data.connections,
      specializations: data.data.specializations
    };
  }

  /**
   * Update node states in the renderer
   * @private
   * @param {Object} progress Player progress data
   */
  _updateNodeStates(progress) {
    if (!this.renderer || !progress) return;
    
    const nodeStates = {};
    
    // Create a map of node IDs to states
    progress.unlocked_skills.forEach(nodeId => {
      // Mark as unlocked
      nodeStates[nodeId] = progress.active_skills.includes(nodeId) ? 'active' : 'unlocked';
    });
    
    // Mark available nodes
    const availableNodes = this.manager.availableNodes || new Set();
    availableNodes.forEach(nodeId => {
      if (!nodeStates[nodeId]) {
        nodeStates[nodeId] = 'unlockable';
      }
    });
    
    // Update renderer
    this.renderer.updateNodeStates(nodeStates);
    
    // If a node is already selected, reselect it to update any UI
    if (this.state.selectedNodeId) {
      this.selectNode(this.state.selectedNodeId);
    }
  }

  /**
   * Select a node
   * @param {String} nodeId Node ID to select
   */
  selectNode(nodeId) {
    if (!this.initialized) return;
    
    this.state.selectedNodeId = nodeId;
    
    // Update renderer selection
    if (this.renderer) {
      this.renderer.selectNode(nodeId);
    }
    
    // Get node details
    if (this.manager && nodeId) {
      const nodeDetails = this.manager.getNodeDetails(nodeId);
      if (nodeDetails) {
        this._notifyEvent('node_details_updated', {
          nodeId,
          node: nodeDetails,
          unlocked: nodeDetails.unlocked,
          canUnlock: nodeDetails.canUnlock
        });
      }
    }
  }

  /**
   * Unlock a node
   * @param {String} nodeId Node ID to unlock
   * @returns {Boolean} Success status
   */
  unlockNode(nodeId) {
    if (!this.initialized || !this.manager) return false;
    
    // Use manager to unlock node
    const success = this.manager.unlockNode(nodeId);
    
    if (success) {
      // Update node states
      this._updateNodeStates(this.manager.progress);
      
      // Notify success
      this._notifyEvent('node_unlocked', {
        nodeId,
        node: this.manager.getNodeDetails(nodeId)
      });
    }
    
    return success;
  }

  /**
   * Save player progress
   * @returns {Promise} Promise resolving when saved
   */
  saveProgress() {
    if (!this.initialized || !this.manager) {
      return Promise.reject(new Error('Controller not properly initialized'));
    }
    
    return this.manager.saveProgress();
  }

  /**
   * Reset the view
   */
  resetView() {
    if (this.renderer) {
      this.renderer.resetView();
    }
  }

  /**
   * Zoom in
   * @param {Number} increment Zoom increment amount
   */
  zoomIn(increment = 0.1) {
    if (this.renderer) {
      // For orbital renderer which already has zoom functionality
      this.renderer.state.zoom += increment;
      this.renderer._applyTransform();
    }
  }

  /**
   * Zoom out
   * @param {Number} increment Zoom increment amount
   */
  zoomOut(increment = 0.1) {
    if (this.renderer) {
      // For orbital renderer which already has zoom functionality
      this.renderer.state.zoom -= increment;
      this.renderer._applyTransform();
    }
  }

  /**
   * Emit an event using the event system
   * @private
   * @param {String} eventName Event name
   * @param {Object} data Event data
   */
  _notifyEvent(eventName, data = {}) {
    if (this.eventSystem) {
      this.eventSystem.publish(`skill_tree.${eventName}`, data);
    }
  }
}

export default SkillTreeController;