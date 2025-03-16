// medical_physics_game/static/js/engine/skill-tree/skill-tree-store.js

/**
 * Store for skill tree data and state management
 * Provides a central source of truth for skill tree data
 */
class SkillTreeStore {
  constructor() {
    // Initial state
    this._state = {
      skills: {},
      specializations: {},
      connections: [],
      unlockedSkills: [],
      activeSkills: [],
      specialization_progress: {},
      reputation: 0,
      skillPointsAvailable: 0,
      loading: false,
      error: null,
      selectedNodeId: null,
      filter: {
        specialization: null,
        tier: null,
        searchTerm: ''
      }
    };
    
    // Subscribers
    this._subscribers = new Set();
    
    // History for undo/redo
    this._history = {
      past: [],
      future: []
    };
  }
  
  /**
   * Get the current state (immutable)
   * @returns {object} - Frozen copy of state
   */
  getState() {
    return Object.freeze({...this._state});
  }
  
  /**
   * Get a specific slice of state
   * @param {string} path - Dot-notation path to state value
   * @returns {any} - Value at path
   */
  get(path) {
    const parts = path.split('.');
    let value = this._state;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    // Return a copy for arrays and objects
    if (Array.isArray(value)) {
      return [...value];
    } else if (value !== null && typeof value === 'object') {
      return {...value};
    }
    
    return value;
  }
  
  /**
   * Get a node by ID
   * @param {string} nodeId - Node ID
   * @returns {object|null} - Node or null if not found
   */
  getNode(nodeId) {
    return this._state.skills[nodeId] ? {...this._state.skills[nodeId]} : null;
  }
  
  /**
   * Update state
   * @param {object} action - Action object
   * @returns {SkillTreeStore} - This instance for chaining
   */
  dispatch(action) {
    // Save current state to history
    this._history.past.push({...this._state});
    this._history.future = [];
    
    // Call reducer to update state
    this._state = this._reducer(this._state, action);
    
    // Notify subscribers
    this._notifySubscribers(action);
    
    return this;
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Subscriber must be a function');
    }
    
    this._subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this._subscribers.delete(callback);
    };
  }
  
  /**
   * Undo the last action
   * @returns {boolean} - Success status
   */
  undo() {
    if (this._history.past.length === 0) {
      return false;
    }
    
    // Move current state to future
    this._history.future.push({...this._state});
    
    // Restore previous state
    this._state = this._history.past.pop();
    
    // Notify subscribers
    this._notifySubscribers({type: 'UNDO'});
    
    return true;
  }
  
  /**
   * Redo the last undone action
   * @returns {boolean} - Success status
   */
  redo() {
    if (this._history.future.length === 0) {
      return false;
    }
    
    // Move current state to past
    this._history.past.push({...this._state});
    
    // Restore future state
    this._state = this._history.future.pop();
    
    // Notify subscribers
    this._notifySubscribers({type: 'REDO'});
    
    return true;
  }
  
  /**
   * Main reducer
   * @param {object} state - Current state
   * @param {object} action - Action object
   * @returns {object} - New state
   * @private
   */
  _reducer(state, action) {
    switch (action.type) {
      case 'INITIALIZE':
        return this._handleInitialize(state, action);
        
      case 'LOAD_DATA':
        return {
          ...state,
          loading: true,
          error: null
        };
        
      case 'LOAD_DATA_SUCCESS':
        return this._handleLoadDataSuccess(state, action);
        
      case 'LOAD_DATA_FAILURE':
        return {
          ...state,
          loading: false,
          error: action.error
        };
        
      case 'SELECT_NODE':
        return {
          ...state,
          selectedNodeId: action.nodeId
        };
        
      case 'FILTER_BY_SPECIALIZATION':
        return {
          ...state,
          filter: {
            ...state.filter,
            specialization: action.specialization
          }
        };
        
      case 'UNLOCK_SKILL':
        return this._handleUnlockSkill(state, action);
        
      case 'ACTIVATE_SKILL':
        return this._handleActivateSkill(state, action);
        
      case 'DEACTIVATE_SKILL':
        return this._handleDeactivateSkill(state, action);
        
      case 'UPDATE_REPUTATION':
        return {
          ...state,
          reputation: action.reputation
        };
        
      case 'UPDATE_SKILL_POINTS':
        return {
          ...state,
          skillPointsAvailable: action.skillPoints
        };
        
      default:
        return state;
    }
  }
  
  /**
   * Handler for INITIALIZE action
   * @param {object} state - Current state
   * @param {object} action - Action object
   * @returns {object} - New state
   * @private
   */
  _handleInitialize(state, action) {
    return {
      ...state,
      skills: {},
      specializations: {},
      connections: [],
      unlockedSkills: [],
      activeSkills: [],
      specialization_progress: {},
      reputation: 0,
      skillPointsAvailable: 0,
      loading: false,
      error: null,
      selectedNodeId: null
    };
  }
  
  /**
   * Handler for LOAD_DATA_SUCCESS action
   * @param {object} state - Current state
   * @param {object} action - Action object
   * @returns {object} - New state
   * @private
   */
  _handleLoadDataSuccess(state, action) {
    const { skills, specializations, connections, unlockedSkills, activeSkills, specialization_progress, reputation, skillPointsAvailable } = action.data;
    
    // Convert arrays to objects for faster lookups
    const skillsObj = Array.isArray(skills) 
      ? skills.reduce((obj, skill) => {
          obj[skill.id] = skill;
          return obj;
        }, {})
      : skills || {};
    
    const specializationsObj = Array.isArray(specializations)
      ? specializations.reduce((obj, spec) => {
          obj[spec.id] = spec;
          return obj;
        }, {})
      : specializations || {};
    
    return {
      ...state,
      skills: skillsObj,
      specializations: specializationsObj,
      connections: connections || [],
      unlockedSkills: unlockedSkills || [],
      activeSkills: activeSkills || [],
      specialization_progress: specialization_progress || {},
      reputation: reputation || 0,
      skillPointsAvailable: skillPointsAvailable || 0,
      loading: false,
      error: null
    };
  }
  
  /**
   * Handler for UNLOCK_SKILL action
   * @param {object} state - Current state
   * @param {object} action - Action object
   * @returns {object} - New state
   * @private
   */
  _handleUnlockSkill(state, action) {
    const { skillId } = action;
    
    // Check if skill exists
    if (!state.skills[skillId]) {
      return state;
    }
    
    // Check if already unlocked
    if (state.unlockedSkills.includes(skillId)) {
      return state;
    }
    
    // Check if can afford
    const cost = state.skills[skillId].cost?.reputation || 0;
    if (state.reputation < cost) {
      return state;
    }
    
    // Add to unlocked skills and deduct reputation
    return {
      ...state,
      unlockedSkills: [...state.unlockedSkills, skillId],
      reputation: state.reputation - cost
    };
  }
  
  /**
   * Handler for ACTIVATE_SKILL action
   * @param {object} state - Current state
   * @param {object} action - Action object
   * @returns {object} - New state
   * @private
   */
  _handleActivateSkill(state, action) {
    const { skillId } = action;
    
    // Check if skill exists
    if (!state.skills[skillId]) {
      return state;
    }
    
    // Check if unlocked
    if (!state.unlockedSkills.includes(skillId)) {
      return state;
    }
    
    // Check if already active
    if (state.activeSkills.includes(skillId)) {
      return state;
    }
    
    // Check if can afford
    const cost = state.skills[skillId].cost?.skill_points || 0;
    if (state.skillPointsAvailable < cost) {
      return state;
    }
    
    // Add to active skills and deduct skill points
    return {
      ...state,
      activeSkills: [...state.activeSkills, skillId],
      skillPointsAvailable: state.skillPointsAvailable - cost
    };
  }
  
  /**
   * Handler for DEACTIVATE_SKILL action
   * @param {object} state - Current state
   * @param {object} action - Action object
   * @returns {object} - New state
   * @private
   */
  _handleDeactivateSkill(state, action) {
    const { skillId } = action;
    
    // Check if skill exists
    if (!state.skills[skillId]) {
      return state;
    }
    
    // Check if active
    if (!state.activeSkills.includes(skillId)) {
      return state;
    }
    
    // Remove from active skills and refund skill points
    const cost = state.skills[skillId].cost?.skill_points || 0;
    return {
      ...state,
      activeSkills: state.activeSkills.filter(id => id !== skillId),
      skillPointsAvailable: state.skillPointsAvailable + cost
    };
  }
  
  /**
   * Notify subscribers of state change
   * @param {object} action - Action that caused the change
   * @private
   */
  _notifySubscribers(action) {
    const state = this.getState();
    
    this._subscribers.forEach(callback => {
      try {
        callback(state, action);
      } catch (error) {
        console.error('Error in subscriber:', error);
      }
    });
  }
}

// Action creators
const actions = {
  initialize() {
    return { type: 'INITIALIZE' };
  },
  
  loadData() {
    return { type: 'LOAD_DATA' };
  },
  
  loadDataSuccess(data) {
    return { type: 'LOAD_DATA_SUCCESS', data };
  },
  
  loadDataFailure(error) {
    return { type: 'LOAD_DATA_FAILURE', error };
  },
  
  selectNode(nodeId) {
    return { type: 'SELECT_NODE', nodeId };
  },
  
  filterBySpecialization(specialization) {
    return { type: 'FILTER_BY_SPECIALIZATION', specialization };
  },
  
  unlockSkill(skillId) {
    return { type: 'UNLOCK_SKILL', skillId };
  },
  
  activateSkill(skillId) {
    return { type: 'ACTIVATE_SKILL', skillId };
  },
  
  deactivateSkill(skillId) {
    return { type: 'DEACTIVATE_SKILL', skillId };
  },
  
  updateReputation(reputation) {
    return { type: 'UPDATE_REPUTATION', reputation };
  },
  
  updateSkillPoints(skillPoints) {
    return { type: 'UPDATE_SKILL_POINTS', skillPoints };
  }
};

// Create singleton instance
const skillTreeStore = new SkillTreeStore();

// Export store and actions
window.SkillTreeStore = skillTreeStore;
window.SkillTreeActions = actions;

export { skillTreeStore, actions };
export default skillTreeStore;
