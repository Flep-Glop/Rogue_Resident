// frontend/src/systems/skill_tree/core/skill_tree_manager.js

/**
 * SkillTreeManager
 * Central manager for skill tree data and operations
 */
class SkillTreeManager {
    constructor() {
      this.initialized = false;
      this.data = {
        specializations: [],
        nodes: [],
        connections: []
      };
      this.progress = {
        reputation: 0,
        unlocked_skills: [],
        active_skills: [],
        skill_points_available: 0,
        specialization_progress: {}
      };
      this.apiClient = null;
      this.eventSystem = null;
      this.state = {
        loading: false,
        error: null,
        selectedNodeId: null,
        filteredSpecialization: null,
        lastSaveTime: null
      };
    }
  
    /**
     * Initialize the manager
     * @param {Object} options Configuration options
     * @returns {SkillTreeManager} This instance for chaining
     */
    initialize(options = {}) {
      if (this.initialized) return this;
      
      // Set up API client
      this.apiClient = options.apiClient || window.ApiClient;
      
      // Set up event system
      this.eventSystem = options.eventSystem || window.EventSystem;
      
      // Register event handlers
      if (this.eventSystem) {
        this.eventSystem.subscribe('node_selected', this.selectNode.bind(this));
        this.eventSystem.subscribe('node_unlock_requested', this.unlockNode.bind(this));
        this.eventSystem.subscribe('specialization_filter_changed', this.filterBySpecialization.bind(this));
      }
      
      this.initialized = true;
      return this;
    }
  
    /**
     * Load skill tree data and player progress
     * @returns {Promise} Promise resolving with loaded data
     */
    loadData() {
      if (!this.initialized) {
        console.error('SkillTreeManager must be initialized before loading data');
        return Promise.reject(new Error('Not initialized'));
      }
      
      this.state.loading = true;
      this.state.error = null;
      
      // Notify loading started
      this._notifyEvent('loading_started');
      
      // Sequential loading to ensure data consistency
      return this._loadSkillTreeData()
        .then(() => this._loadPlayerProgress())
        .then(() => {
          this.state.loading = false;
          this._notifyEvent('data_loaded', {
            data: this.data,
            progress: this.progress
          });
          return {
            data: this.data,
            progress: this.progress
          };
        })
        .catch(error => {
          this.state.loading = false;
          this.state.error = error.message;
          this._notifyEvent('loading_error', { error: error.message });
          throw error;
        });
    }
  
    /**
     * Load skill tree structure
     * @returns {Promise} Promise resolving with skill tree data
     * @private
     */
    _loadSkillTreeData() {
      // Use API client if available, otherwise use fetch
      const loadPromise = this.apiClient && this.apiClient.getSkillTree
        ? this.apiClient.getSkillTree()
        : fetch('/api/skill-tree').then(response => {
            if (!response.ok) {
              throw new Error(`Failed to load skill tree: ${response.status}`);
            }
            return response.json();
          });
        
      return loadPromise.then(data => {
        // Validate data structure
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.specializations)) {
          throw new Error('Invalid skill tree data structure');
        }
        
        // Store data
        this.data = {
          specializations: data.specializations || [],
          nodes: data.nodes || [],
          connections: data.connections || []
        };
        
        // Process data for efficient access
        this._processTreeData();
        
        return this.data;
      });
    }
  
    /**
     * Load player's skill tree progress
     * @returns {Promise} Promise resolving with progress data
     * @private
     */
    _loadPlayerProgress() {
      // Use API client if available, otherwise use fetch
      const characterId = this._getCharacterId();
      const url = characterId ? `/api/skill-progress?character_id=${characterId}` : '/api/skill-progress';
      
      const loadPromise = this.apiClient && this.apiClient.getSkillProgress
        ? this.apiClient.getSkillProgress(characterId)
        : fetch(url).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to load skill progress: ${response.status}`);
            }
            return response.json();
          });
        
      return loadPromise.then(progress => {
        // Store progress
        this.progress = {
          reputation: progress.reputation || 0,
          unlocked_skills: progress.unlocked_skills || [],
          active_skills: progress.active_skills || [],
          skill_points_available: progress.skill_points_available || 0,
          specialization_progress: progress.specialization_progress || {}
        };
        
        // Calculate derived states
        this._calculateDerivedStates();
        
        return this.progress;
      });
    }
  
    /**
     * Save player's skill tree progress
     * @returns {Promise} Promise resolving when saved
     */
    saveProgress() {
      if (!this.initialized) {
        return Promise.reject(new Error('Not initialized'));
      }
      
      this._notifyEvent('saving_started');
      
      // Use API client if available, otherwise use fetch
      const characterId = this._getCharacterId();
      const url = characterId ? `/api/skill-progress?character_id=${characterId}` : '/api/skill-progress';
      
      const savePromise = this.apiClient && this.apiClient.saveSkillProgress
        ? this.apiClient.saveSkillProgress(characterId, this.progress)
        : fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.progress)
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to save skill progress: ${response.status}`);
            }
            return response.json();
          });
      
      return savePromise
        .then(result => {
          this.state.lastSaveTime = new Date();
          this._notifyEvent('save_completed', { timestamp: this.state.lastSaveTime });
          return result;
        })
        .catch(error => {
          this._notifyEvent('save_error', { error: error.message });
          throw error;
        });
    }
  
    /**
     * Get current character ID from localStorage or other state
     * @returns {String|null} Character ID or null
     * @private
     */
    _getCharacterId() {
      try {
        const selectedCharacter = localStorage.getItem('selectedCharacter');
        if (selectedCharacter) {
          const character = JSON.parse(selectedCharacter);
          return character.id;
        }
      } catch (e) {
        console.warn('Error getting character ID:', e);
      }
      return null;
    }
  
    /**
     * Process tree data for efficient access
     * @private
     */
    _processTreeData() {
      // Create maps for faster lookups
      this.nodeMap = new Map();
      this.data.nodes.forEach(node => {
        this.nodeMap.set(node.id, node);
      });
      
      // Create specialized indexes
      this.specializationMap = new Map();
      this.data.specializations.forEach(spec => {
        this.specializationMap.set(spec.id, spec);
      });
      
      // Build node connections (both ways for easier traversal)
      this.nodeConnections = new Map();
      this.data.connections.forEach(conn => {
        if (!this.nodeConnections.has(conn.source)) {
          this.nodeConnections.set(conn.source, new Set());
        }
        if (!this.nodeConnections.has(conn.target)) {
          this.nodeConnections.set(conn.target, new Set());
        }
        
        // Add outgoing connections
        this.nodeConnections.get(conn.source).add(conn.target);
        
        // Also track inbound connections for prerequisite checking
        const targetConns = this.nodeConnections.get(conn.target);
        targetConns.add(`prev:${conn.source}`);
      });
    }
  
    /**
     * Calculate derived states after loading data
     * @private
     */
    _calculateDerivedStates() {
      // Calculate available nodes
      this.availableNodes = new Set();
      
      this.data.nodes.forEach(node => {
        if (!this.progress.unlocked_skills.includes(node.id) && this.canUnlockNode(node.id)) {
          this.availableNodes.add(node.id);
        }
      });
      
      // Calculate specialization progress percentages
      this.specializationPercentages = {};
      
      this.data.specializations.forEach(spec => {
        const specNodes = this.data.nodes.filter(node => node.specialization === spec.id);
        const unlockedSpecNodes = specNodes.filter(node => 
          this.progress.unlocked_skills.includes(node.id)
        );
        
        const percentage = specNodes.length > 0 
          ? Math.round((unlockedSpecNodes.length / specNodes.length) * 100)
          : 0;
          
        this.specializationPercentages[spec.id] = percentage;
      });
    }
  
    /**
     * Check if a node can be unlocked
     * @param {String} nodeId Node ID to check
     * @returns {Boolean} True if node can be unlocked
     */
    canUnlockNode(nodeId) {
      // Get node data
      const node = this.nodeMap.get(nodeId);
      if (!node) return false;
      
      // Already unlocked?
      if (this.progress.unlocked_skills.includes(nodeId)) {
        return false;
      }
      
      // Check skill points
      if (this.progress.skill_points_available < (node.cost?.skill_points || 0)) {
        return false;
      }
      
      // Check reputation
      if (this.progress.reputation < (node.cost?.reputation || 0)) {
        return false;
      }
      
      // Check prerequisites
      const nodeConnections = this.nodeConnections.get(nodeId);
      if (!nodeConnections) return false;
      
      // All prerequisites must be unlocked
      const prerequisites = [];
      nodeConnections.forEach(conn => {
        if (String(conn).startsWith('prev:')) {
          prerequisites.push(conn.substring(5));
        }
      });
      
      return prerequisites.every(prereqId => 
        this.progress.unlocked_skills.includes(prereqId)
      );
    }
  
    /**
     * Unlock a skill tree node
     * @param {String} nodeId Node ID to unlock
     * @returns {Boolean} Success status
     */
    unlockNode(nodeId) {
      // Check if node can be unlocked
      if (!this.canUnlockNode(nodeId)) {
        this._notifyEvent('unlock_failed', {
          nodeId,
          reason: 'Cannot unlock node'
        });
        return false;
      }
      
      // Get node data
      const node = this.nodeMap.get(nodeId);
      
      // Deduct costs
      this.progress.skill_points_available -= (node.cost?.skill_points || 0);
      
      // Add to unlocked skills
      this.progress.unlocked_skills.push(nodeId);
      
      // Update specialization progress
      if (node.specialization && !this.progress.specialization_progress[node.specialization]) {
        this.progress.specialization_progress[node.specialization] = 0;
      }
      
      if (node.specialization) {
        this.progress.specialization_progress[node.specialization]++;
      }
      
      // Recalculate derived states
      this._calculateDerivedStates();
      
      // Notify about unlock
      this._notifyEvent('node_unlocked', {
        nodeId,
        node,
        progress: this.progress
      });
      
      return true;
    }
  
    /**
     * Select a node for details view
     * @param {String} nodeId Node ID to select
     */
    selectNode(nodeId) {
      this.state.selectedNodeId = nodeId;
      
      // Get node data
      const node = this.nodeMap.get(nodeId);
      if (!node) return;
      
      // Notify about selection
      this._notifyEvent('node_details_updated', {
        nodeId,
        node,
        unlocked: this.progress.unlocked_skills.includes(nodeId),
        canUnlock: this.canUnlockNode(nodeId)
      });
    }
  
    /**
     * Filter skill tree view by specialization
     * @param {String|null} specializationId Specialization ID or null for all
     */
    filterBySpecialization(specializationId) {
      this.state.filteredSpecialization = specializationId;
      
      // Notify about filter change
      this._notifyEvent('view_filtered', {
        specialization: specializationId
      });
    }
  
    /**
     * Get current skill tree data with progress
     * @returns {Object} Combined data and progress
     */
    getSkillTreeState() {
      return {
        data: this.data,
        progress: this.progress,
        selectedNodeId: this.state.selectedNodeId,
        filteredSpecialization: this.state.filteredSpecialization,
        availableNodes: Array.from(this.availableNodes),
        specializationPercentages: this.specializationPercentages
      };
    }
  
    /**
     * Get detailed information about a node
     * @param {String} nodeId Node ID to get details for
     * @returns {Object|null} Node details or null if not found
     */
    getNodeDetails(nodeId) {
      const node = this.nodeMap.get(nodeId);
      if (!node) return null;
      
      // Get connections
      const outgoingConnections = [];
      const incomingConnections = [];
      
      const nodeConnections = this.nodeConnections.get(nodeId) || new Set();
      nodeConnections.forEach(conn => {
        if (String(conn).startsWith('prev:')) {
          const sourceId = conn.substring(5);
          incomingConnections.push({
            nodeId: sourceId,
            node: this.nodeMap.get(sourceId),
            unlocked: this.progress.unlocked_skills.includes(sourceId)
          });
        } else {
          outgoingConnections.push({
            nodeId: conn,
            node: this.nodeMap.get(conn),
            unlocked: this.progress.unlocked_skills.includes(conn)
          });
        }
      });
      
      // Get specialization info
      let specialization = null;
      if (node.specialization) {
        specialization = this.specializationMap.get(node.specialization);
      }
      
      // Calculate state
      let state = 'locked';
      if (this.progress.unlocked_skills.includes(nodeId)) {
        state = 'unlocked';
      } else if (this.canUnlockNode(nodeId)) {
        state = 'available';
      }
      
      return {
        ...node,
        state,
        unlocked: this.progress.unlocked_skills.includes(nodeId),
        canUnlock: this.canUnlockNode(nodeId),
        isSelected: this.state.selectedNodeId === nodeId,
        outgoingConnections,
        incomingConnections,
        specialization
      };
    }
  
    /**
     * Add reputation points to player progress
     * @param {Number} amount Amount to add
     * @param {String} source Source of reputation (for tracking)
     */
    addReputation(amount, source = 'generic') {
      if (amount <= 0) return;
      
      const oldReputation = this.progress.reputation;
      this.progress.reputation += amount;
      
      this._notifyEvent('reputation_changed', {
        oldValue: oldReputation,
        newValue: this.progress.reputation,
        change: amount,
        source
      });
    }
  
    /**
     * Add skill points to player progress
     * @param {Number} amount Amount to add
     * @param {String} source Source of points (for tracking)
     */
    addSkillPoints(amount, source = 'generic') {
      if (amount <= 0) return;
      
      const oldPoints = this.progress.skill_points_available;
      this.progress.skill_points_available += amount;
      
      // Recalculate available nodes
      this._calculateDerivedStates();
      
      this._notifyEvent('skill_points_changed', {
        oldValue: oldPoints,
        newValue: this.progress.skill_points_available,
        change: amount,
        source
      });
    }
  
    /**
     * Activate/deactivate a skill
     * @param {String} nodeId Node ID to toggle activation
     * @returns {Boolean} New activation state
     */
    toggleSkillActivation(nodeId) {
      // Check if node is unlocked
      if (!this.progress.unlocked_skills.includes(nodeId)) {
        return false;
      }
      
      const isActive = this.progress.active_skills.includes(nodeId);
      
      if (isActive) {
        // Deactivate skill
        this.progress.active_skills = this.progress.active_skills.filter(id => id !== nodeId);
        this._notifyEvent('skill_deactivated', { nodeId });
      } else {
        // Activate skill
        this.progress.active_skills.push(nodeId);
        this._notifyEvent('skill_activated', { nodeId });
      }
      
      return !isActive;
    }
  
    /**
     * Emit an event using the event system
     * @param {String} eventName Event name
     * @param {Object} data Event data
     * @private
     */
    _notifyEvent(eventName, data = {}) {
      if (this.eventSystem) {
        this.eventSystem.publish(`skill_tree.${eventName}`, data);
      }
    }
  }
  
  export default SkillTreeManager;