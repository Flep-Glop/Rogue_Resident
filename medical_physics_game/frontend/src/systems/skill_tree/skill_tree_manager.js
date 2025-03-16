// skill_tree_manager.js - Core manager for skill tree functionality and state
// Refactored version with improved modularity and separation of concerns

// Import core modules (these would be separate files in the actual implementation)
import { SKILL_STATES, NODE_SIZES } from './skill_tree_constants.js';
import { CoreClusterNodes } from './skill_tree_data.js';
import { ApiClient } from '../api/api_client.js';
import { ErrorHandler } from '../utils/error_handler.js';

/**
 * SkillTreeManager - Core module that manages skill tree functionality and state
 * This implementation uses a revealing module pattern for better encapsulation
 */
const SkillTreeManager = (function() {
  // Private state
  const _state = {
    initialized: false,
    dataLoaded: false,
    errorState: false
  };
  
  // Core data structures with defaults
  let _data = {
    skills: {},                  // All skills
    specializations: {},         // All specializations
    connections: [],             // All skill connections
    unlockedSkills: [],          // Permanently unlocked skills
    activeSkills: [],            // Active skills in current run
    specialization_progress: {}, // Progress in each specialization
    skillPointsAvailable: 0,     // Skill points for current run
    reputation: 0                // Meta-currency for unlocking
  };
  
  // Observer registry with typed subscriptions
  const _observers = {
    global: [],
    skillTreeInitialized: [],
    skillUnlocked: [],
    skillActivated: [],
    skillDeactivated: [],
    specializationUpdated: [],
    reputationChanged: [],
    skillPointsChanged: []
  };
  
  /**
   * Initialize the manager
   * @returns {Promise} Promise that resolves when initialized
   */
  function initialize() {
    console.log("Initializing skill tree manager...");
    
    if (_state.initialized) {
      console.log("SkillTreeManager already initialized");
      return Promise.resolve();
    }
    
    // Load skill tree data with improved error handling
    return _loadSkillTreeData()
      .then(() => {
        // Connect to game state
        _connectToGameState();
        
        // Load player progress
        return _loadPlayerProgress();
      })
      .then(() => {
        // Set initialized flag
        _state.initialized = true;
        
        // Notify observers
        _notifyObservers('skillTreeInitialized', {
          skills: _data.skills,
          specializations: _data.specializations,
          unlockedSkills: _data.unlockedSkills,
          activeSkills: _data.activeSkills,
          specialization_progress: _data.specialization_progress
        });
        
        console.log("Skill tree manager initialized successfully");
        return Promise.resolve();
      })
      .catch(error => {
        // Handle error and create fallback data
        console.error("Error initializing skill tree manager:", error);
        
        ErrorHandler.handleError(
          error,
          "Skill Tree Initialization",
          ErrorHandler.SEVERITY.ERROR
        );
        
        _createFallbackData();
        _state.initialized = true;
        
        console.log("Skill tree manager initialized with fallback data");
        return Promise.resolve();
      });
  }
  
  /**
   * Load skill tree data from the server
   * @private
   * @returns {Promise} Promise that resolves with skill tree data
   */
  function _loadSkillTreeData() {
    return ApiClient.get('/api/skill-tree')
      .then(data => {
        if (!data) {
          throw new Error("Failed to load skill tree data: empty response");
        }
        
        // Process skill tree data
        _processSkillTreeData(data);
        _state.dataLoaded = true;
        
        return data;
      });
  }
  
  /**
   * Process skill tree data from JSON
   * @private
   * @param {Object} data - Skill tree data from server
   */
  function _processSkillTreeData(data) {
    console.log("Processing skill tree data...");
    
    // Process specializations
    data.specializations.forEach(spec => {
      _data.specializations[spec.id] = spec;
      _data.specialization_progress[spec.id] = 0;
    });
    
    // Ensure core specialization exists
    if (!_data.specializations["core"]) {
      _data.specializations["core"] = {
        "id": "core",
        "name": "Core Competencies",
        "description": "Fundamental medical physics knowledge",
        "color": "#777777", // Grey color for core nodes
        "threshold": 4,
        "mastery_threshold": 4
      };
      _data.specialization_progress["core"] = 0;
    }
    
    // Replace core_physics node with core cluster if it exists
    let hasCorePhysics = false;
    for (let i = 0; i < data.nodes.length; i++) {
      if (data.nodes[i].id === "core_physics") {
        hasCorePhysics = true;
        // Remove this node - we'll replace it with the cluster
        data.nodes.splice(i, 1);
        break;
      }
    }
    
    // If core_physics was found, add the cluster nodes instead
    if (hasCorePhysics) {
      // Add all nodes from the cluster
      Object.values(CoreClusterNodes).forEach(node => {
        data.nodes.push(node);
      });
      
      // Update connections for core cluster
      _updateConnectionsForCoreCluster(data.connections);
    }
    
    // Process skills
    data.nodes.forEach(node => {
      _data.skills[node.id] = node;
      
      // Initialize skill state
      node.state = SKILL_STATES.LOCKED;
    });
    
    // Process connections
    _data.connections = data.connections;
    
    console.log(`Processed ${Object.keys(_data.skills).length} skills and ${Object.keys(_data.specializations).length} specializations`);
  }
  
  /**
   * Helper to update connections when replacing core_physics with the cluster
   * @private
   * @param {Array} connections - Array of connections to update
   */
  function _updateConnectionsForCoreCluster(connections) {
    // Get core node IDs
    const CORE_NODE_IDS = Object.keys(CoreClusterNodes);
    
    // Remove connections to/from core_physics
    for (let i = connections.length - 1; i >= 0; i--) {
      if (connections[i].source === "core_physics" || connections[i].target === "core_physics") {
        connections.splice(i, 1);
      }
    }
    
    // Add connections between core nodes
    connections.push({"source": "radiation_physics", "target": "medical_instrumentation"});
    connections.push({"source": "radiation_physics", "target": "patient_care"});
    connections.push({"source": "medical_instrumentation", "target": "medical_science"});
    connections.push({"source": "patient_care", "target": "medical_science"});
    
    // Add connections to specialization nodes
    connections.push({"source": "radiation_physics", "target": "quantum_comprehension"});
    connections.push({"source": "radiation_physics", "target": "radiation_detection"});
    connections.push({"source": "medical_instrumentation", "target": "calibration_expert"});
    connections.push({"source": "medical_instrumentation", "target": "machine_whisperer"});
    connections.push({"source": "patient_care", "target": "bedside_manner"});
    connections.push({"source": "patient_care", "target": "diagnostic_intuition"});
    connections.push({"source": "medical_science", "target": "literature_review"});
    connections.push({"source": "medical_science", "target": "scholarly_memory"});
  }
  
  /**
   * Connect to game state for events
   * @private
   */
  function _connectToGameState() {
    // Register for game state changes if GameState exists
    if (window.GameState && window.GameState.addObserver) {
      window.GameState.addObserver((eventType, data) => {
        // Handle character updates (reputation changes)
        if (eventType === 'characterUpdated' && data.reputation !== _data.reputation) {
          setReputation(data.reputation || 0);
        }
      });
    }
    
    // Register event listeners if EventSystem exists
    if (window.EventSystem && window.EventSystem.on) {
      window.EventSystem.on('RUN_STARTED', () => {
        resetActiveSkills();
        updateAllSkillStates();
      });
      
      window.EventSystem.on('RUN_COMPLETED', () => {
        // Save the skill tree progress when a run completes
        saveProgress();
      });
    }
  }
  
  /**
   * Load player progress from server
   * @private
   * @returns {Promise} Promise that resolves when player progress is loaded
   */
  function _loadPlayerProgress() {
    console.log("Loading player skill tree progress...");
    
    // Use our ApiClient to load progress
    return ApiClient.loadSkillProgress()
      .then(data => {
        if (!data) {
          throw new Error("Failed to load skill progress data");
        }
        
        // Set reputation
        _data.reputation = data.reputation || 0;
        
        // Set unlocked skills (ensure core nodes are always included)
        _data.unlockedSkills = data.unlocked_skills || [];
        
        // Get core node IDs
        const CORE_NODE_IDS = Object.keys(CoreClusterNodes);
        
        // Check if we need to migrate from core_physics to core cluster
        if (_data.unlockedSkills.includes('core_physics')) {
          // Remove core_physics
          const index = _data.unlockedSkills.indexOf('core_physics');
          if (index !== -1) {
            _data.unlockedSkills.splice(index, 1);
          }
          
          // Add all core cluster nodes
          CORE_NODE_IDS.forEach(nodeId => {
            if (!_data.unlockedSkills.includes(nodeId)) {
              _data.unlockedSkills.push(nodeId);
            }
          });
        } else {
          // Just ensure all core nodes are included
          CORE_NODE_IDS.forEach(nodeId => {
            if (!_data.unlockedSkills.includes(nodeId)) {
              _data.unlockedSkills.push(nodeId);
            }
          });
        }
        
        // Set active skills (ensure core nodes are always included)
        _data.activeSkills = data.active_skills || [];
        
        // Migrate active skills from core_physics if needed
        if (_data.activeSkills.includes('core_physics')) {
          // Remove core_physics
          const index = _data.activeSkills.indexOf('core_physics');
          if (index !== -1) {
            _data.activeSkills.splice(index, 1);
          }
          
          // Add all core cluster nodes
          CORE_NODE_IDS.forEach(nodeId => {
            if (!_data.activeSkills.includes(nodeId)) {
              _data.activeSkills.push(nodeId);
            }
          });
        } else {
          // Just ensure all core nodes are included
          CORE_NODE_IDS.forEach(nodeId => {
            if (!_data.activeSkills.includes(nodeId)) {
              _data.activeSkills.push(nodeId);
            }
          });
        }
        
        // Set skill points available
        _data.skillPointsAvailable = data.skill_points_available || 3;
        
        // Load specialization progress
        if (data.specialization_progress) {
          // Initialize all specializations to 0 first
          Object.keys(_data.specializations).forEach(specId => {
            _data.specialization_progress[specId] = 0;
          });
          
          // Then update with actual progress
          Object.keys(data.specialization_progress).forEach(specId => {
            if (_data.specialization_progress[specId] !== undefined) {
              _data.specialization_progress[specId] = data.specialization_progress[specId];
            }
          });
        } else {
          // Initialize all to 0
          Object.keys(_data.specializations).forEach(specId => {
            _data.specialization_progress[specId] = 0;
          });
        }
        
        // Update all skill states
        updateAllSkillStates();
        
        console.log(`Loaded player progress: ${_data.unlockedSkills.length} unlocked skills, ${_data.reputation} reputation`);
        
        return true;
      })
      .catch(error => {
        ErrorHandler.handleError(
          error,
          "Loading Skill Progress",
          ErrorHandler.SEVERITY.WARNING
        );
        
        console.warn("Using default progress data due to load failure:", error);
        
        // Create empty progress data on error
        _createDefaultProgressData();
        
        return false;
      });
  }
  
  /**
   * Create default player progress data
   * @private
   */
  function _createDefaultProgressData() {
    const CORE_NODE_IDS = Object.keys(CoreClusterNodes);
    
    _data.reputation = 10; // Start with 10 reputation to unlock something
    _data.unlockedSkills = [...CORE_NODE_IDS]; // All core cluster nodes
    _data.activeSkills = [...CORE_NODE_IDS];   // All core cluster nodes active
    _data.skillPointsAvailable = 3;            // Start with some skill points
    
    // Initialize specialization progress to zero
    Object.keys(_data.specializations).forEach(specId => {
      _data.specialization_progress[specId] = 0;
    });
    
    // Update all skill states
    updateAllSkillStates();
  }
  
  /**
   * Create fallback data in case of error
   * @private
   */
  function _createFallbackData() {
    console.log("Creating fallback skill tree data with core cluster");
    
    // Create basic specializations
    _data.specializations = {
      "core": {
        "id": "core",
        "name": "Core Competencies",
        "description": "Fundamental medical physics knowledge",
        "color": "#777777", // Grey color for core nodes
        "threshold": 4,
        "mastery_threshold": 4
      },
      "theory": {
        "id": "theory",
        "name": "Theory Specialist",
        "description": "Focus on physics principles and mathematical understanding",
        "color": "#4287f5",
        "threshold": 5,
        "mastery_threshold": 8
      },
      "clinical": {
        "id": "clinical",
        "name": "Clinical Expert",
        "description": "Focus on patient care and treatment application",
        "color": "#42f575",
        "threshold": 5,
        "mastery_threshold": 8
      }
    };
    
    // Create basic skills
    _data.skills = {
      // Add the core cluster nodes
      ...CoreClusterNodes,
      
      // Add a few basic skill nodes (simplified from original)
      "quantum_comprehension": {
        "id": "quantum_comprehension",
        "name": "Quantum Comprehension",
        "specialization": "theory",
        "tier": 1,
        "description": "Increases Insight gained from quantum physics questions by 25%",
        "effects": [
          {
            "type": "insight_gain_multiplier",
            "condition": "question_category == 'quantum'",
            "value": 1.25
          }
        ],
        "position": {"x": 300, "y": 150},
        "connections": [],
        "cost": {
          "reputation": 10,
          "skill_points": 2
        },
        "state": SKILL_STATES.LOCKED,
        "visual": {
          "size": NODE_SIZES.MINOR,
          "icon": "brain"
        }
      }
      // Other basic nodes would be added here
    };
    
    // Create connections
    _data.connections = [
      // Connections between core nodes
      {"source": "radiation_physics", "target": "medical_instrumentation"},
      {"source": "radiation_physics", "target": "patient_care"},
      {"source": "medical_instrumentation", "target": "medical_science"},
      {"source": "patient_care", "target": "medical_science"},
      
      // Connections to specialization nodes
      {"source": "radiation_physics", "target": "quantum_comprehension"}
    ];
    
    // Initialize specialization progress
    _data.specialization_progress = {
      "core": 0,
      "theory": 0,
      "clinical": 0
    };
    
    // Set all core cluster nodes as unlocked and active
    const CORE_NODE_IDS = Object.keys(CoreClusterNodes);
    _data.unlockedSkills = [...CORE_NODE_IDS];
    _data.activeSkills = [...CORE_NODE_IDS];
    _data.skillPointsAvailable = 3;
    _data.reputation = 10;
    
    // Update all skill states
    updateAllSkillStates();
    
    console.log("Fallback skill tree data created");
  }
  
  /**
   * Save progress to server
   * @returns {Promise} Promise that resolves to success status
   */
  function saveProgress() {
    console.log("Saving skill tree progress...");
    
    // Prepare data to save
    const progressData = {
      reputation: _data.reputation,
      unlocked_skills: _data.unlockedSkills,
      active_skills: _data.activeSkills,
      skill_points_available: _data.skillPointsAvailable,
      specialization_progress: _data.specialization_progress
    };
    
    return ApiClient.saveSkillProgress(progressData)
      .then(() => {
        console.log("Skill tree progress saved successfully");
        return true;
      })
      .catch(error => {
        ErrorHandler.handleError(
          error,
          "Saving Skill Progress",
          ErrorHandler.SEVERITY.WARNING
        );
        
        console.log("Failed to save skill progress, will try again later");
        // Schedule a retry
        setTimeout(() => saveProgress(), 30000);
        
        return false;
      });
  }
  
  /**
   * Update all skill states
   */
  function updateAllSkillStates() {
    console.log("Updating all skill states...");
    
    // Update each skill
    Object.values(_data.skills).forEach(skill => {
      // Check if skill is unlocked
      if (_data.unlockedSkills.includes(skill.id)) {
        // Check if skill is active
        if (_data.activeSkills.includes(skill.id)) {
          skill.state = SKILL_STATES.ACTIVE;
        } else {
          skill.state = SKILL_STATES.UNLOCKED;
        }
      } else {
        // Check if skill is unlockable
        if (canUnlockSkill(skill.id)) {
          skill.state = SKILL_STATES.UNLOCKABLE;
        } else {
          skill.state = SKILL_STATES.LOCKED;
        }
      }
    });
    
    // Notify observers
    _notifyObservers('skillStatesUpdated', {
      skills: _data.skills
    });
  }
  
  /**
   * Unlock a skill
   * @param {String} skillId - ID of the skill to unlock
   * @returns {Boolean} Success status
   */
  function unlockSkill(skillId) {
    console.log(`Attempting to unlock skill: ${skillId}`);
    
    // Get the skill
    const skill = getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      console.error(`Skill not found: ${skillId}`);
      return false;
    }
    
    // Check if already unlocked
    if (_data.unlockedSkills.includes(skillId)) {
      console.log(`Skill ${skillId} is already unlocked`);
      return true;
    }
    
    // Check if can unlock
    if (!canUnlockSkill(skillId)) {
      console.error(`Cannot unlock skill ${skillId}: prerequisites not met or insufficient reputation`);
      return false;
    }
    
    // Deduct reputation cost
    const reputationCost = skill.cost.reputation || 0;
    _data.reputation -= reputationCost;
    
    // Add to unlocked skills
    _data.unlockedSkills.push(skillId);
    
    // Update specialization progress
    if (skill.specialization) {
      updateSpecializationProgress(skill.specialization);
    }
    
    // Update skill states
    updateAllSkillStates();
    
    // Notify observers
    _notifyObservers('skillUnlocked', {
      skillId: skillId,
      skill: skill,
      remainingReputation: _data.reputation
    });
    
    // Notify reputation change
    _notifyObservers('reputationChanged', {
      oldValue: _data.reputation + reputationCost,
      newValue: _data.reputation,
      change: -reputationCost
    });
    
    // Save progress
    saveProgress();
    
    console.log(`Skill ${skillId} unlocked successfully`);
    return true;
  }
  
  /**
   * Activate a skill for the current run
   * @param {String} skillId - ID of the skill to activate
   * @returns {Boolean} Success status
   */
  function activateSkill(skillId) {
    console.log(`Attempting to activate skill: ${skillId}`);
    
    // Get the skill
    const skill = getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      console.error(`Skill not found: ${skillId}`);
      return false;
    }
    
    // Check if already active
    if (_data.activeSkills.includes(skillId)) {
      console.log(`Skill ${skillId} is already active`);
      return true;
    }
    
    // Check if can activate
    if (!canActivateSkill(skillId)) {
      console.error(`Cannot activate skill ${skillId}: not unlocked or insufficient skill points`);
      return false;
    }
    
    // Deduct skill points
    const skillPointCost = skill.cost.skill_points || 0;
    _data.skillPointsAvailable -= skillPointCost;
    
    // Add to active skills
    _data.activeSkills.push(skillId);
    
    // Update skill states
    updateAllSkillStates();
    
    // Notify observers
    _notifyObservers('skillActivated', {
      skillId: skillId,
      skill: skill,
      remainingSkillPoints: _data.skillPointsAvailable
    });
    
    // Notify skill points change
    _notifyObservers('skillPointsChanged', {
      oldValue: _data.skillPointsAvailable + skillPointCost,
      newValue: _data.skillPointsAvailable,
      change: -skillPointCost
    });
    
    // Apply skill effects
    if (window.SkillEffectSystem && window.SkillEffectSystem.applySkillEffects) {
      window.SkillEffectSystem.applySkillEffects(skill);
    }
    
    console.log(`Skill ${skillId} activated successfully`);
    return true;
  }
  
  /**
   * Deactivate a skill
   * @param {String} skillId - ID of the skill to deactivate
   * @returns {Boolean} Success status
   */
  function deactivateSkill(skillId) {
    console.log(`Attempting to deactivate skill: ${skillId}`);
    
    // Get the skill
    const skill = getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      console.error(`Skill not found: ${skillId}`);
      return false;
    }
    
    // Check if already inactive
    if (!_data.activeSkills.includes(skillId)) {
      console.log(`Skill ${skillId} is not active`);
      return true;
    }
    
    // Special case: can't deactivate core skills
    const CORE_NODE_IDS = Object.keys(CoreClusterNodes);
    if (CORE_NODE_IDS.includes(skillId)) {
      console.error(`Cannot deactivate core skill: ${skillId}`);
      return false;
    }
    
    // Check if other skills depend on this one being active
    const dependentSkills = getActiveDependentSkills(skillId);
    if (dependentSkills.length > 0) {
      console.error(`Cannot deactivate skill ${skillId}: other active skills depend on it: ${dependentSkills.join(', ')}`);
      return false;
    }
    
    // Refund skill points
    const skillPointCost = skill.cost.skill_points || 0;
    _data.skillPointsAvailable += skillPointCost;
    
    // Remove from active skills
    const index = _data.activeSkills.indexOf(skillId);
    if (index !== -1) {
      _data.activeSkills.splice(index, 1);
    }
    
    // Update skill states
    updateAllSkillStates();
    
    // Notify observers
    _notifyObservers('skillDeactivated', {
      skillId: skillId,
      skill: skill,
      remainingSkillPoints: _data.skillPointsAvailable
    });
    
    // Notify skill points change
    _notifyObservers('skillPointsChanged', {
      oldValue: _data.skillPointsAvailable - skillPointCost,
      newValue: _data.skillPointsAvailable,
      change: skillPointCost
    });
    
    // Remove skill effects
    if (window.SkillEffectSystem && window.SkillEffectSystem.removeSkillEffects) {
      window.SkillEffectSystem.removeSkillEffects(skill);
    }
    
    console.log(`Skill ${skillId} deactivated successfully`);
    return true;
  }
  
  /**
   * Reset active skills (for new run)
   */
  function resetActiveSkills() {
    console.log("Resetting active skills for new run...");
    
    // Get core node IDs
    const CORE_NODE_IDS = Object.keys(CoreClusterNodes);
    
    // Remove all effects first
    _data.activeSkills.forEach(skillId => {
      const skill = getSkillById(skillId);
      if (skill && window.SkillEffectSystem && window.SkillEffectSystem.removeSkillEffects) {
        window.SkillEffectSystem.removeSkillEffects(skill);
      }
    });
    
    // Keep only core skills
    _data.activeSkills = _data.activeSkills.filter(skillId => 
      CORE_NODE_IDS.includes(skillId)
    );
    
    // Reset skill points
    _data.skillPointsAvailable = _calculateStartingSkillPoints();
    
    // Update skill states
    updateAllSkillStates();
    
    // Re-apply core skill effects
    _data.activeSkills.forEach(skillId => {
      const skill = getSkillById(skillId);
      if (skill && window.SkillEffectSystem && window.SkillEffectSystem.applySkillEffects) {
        window.SkillEffectSystem.applySkillEffects(skill);
      }
    });
    
    // Notify observers
    _notifyObservers('skillsReset', {
      activeSkills: _data.activeSkills,
      skillPointsAvailable: _data.skillPointsAvailable
    });
    
    console.log(`Active skills reset. Available skill points: ${_data.skillPointsAvailable}`);
  }
  
  /**
   * Calculate starting skill points for a run
   * @private
   * @returns {Number} Number of skill points
   */
  function _calculateStartingSkillPoints() {
    // Base skill points
    let points = 3;
    
    // Bonus from character level
    if (window.GameState && 
        window.GameState.data && 
        window.GameState.data.character && 
        window.GameState.data.character.level) {
      points += Math.floor(window.GameState.data.character.level / 2);
    }
    
    // Bonus from specializations
    const specializations = getActiveSpecializations();
    if (specializations.length > 0) {
      points += specializations.length;
    }
    
    return points;
  }
  
  /**
   * Check if a skill can be unlocked
   * @param {String} skillId - ID of the skill to check
   * @returns {Boolean} True if skill can be unlocked
   */
  function canUnlockSkill(skillId) {
    // Get the skill
    const skill = getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      return false;
    }
    
    // Check if already unlocked
    if (_data.unlockedSkills.includes(skillId)) {
      return false;
    }
    
    // Check reputation cost
    const reputationCost = skill.cost.reputation || 0;
    if (_data.reputation < reputationCost) {
      return false;
    }
    
    // Check prerequisites
    return arePrerequisitesMet(skillId);
  }
  
  /**
   * Check if a skill can be activated
   * @param {String} skillId - ID of the skill to check
   * @returns {Boolean} True if skill can be activated
   */
  function canActivateSkill(skillId) {
    // Get the skill
    const skill = getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      return false;
    }
    
    // Check if already active
    if (_data.activeSkills.includes(skillId)) {
      return false;
    }
    
    // Check if unlocked
    if (!_data.unlockedSkills.includes(skillId)) {
      return false;
    }
    
    // Check skill point cost
    const skillPointCost = skill.cost.skill_points || 0;
    if (_data.skillPointsAvailable < skillPointCost) {
      return false;
    }
    
    // Check if prerequisites are active
    return arePrerequisitesActive(skillId);
  }
  
  /**
   * Check if all prerequisites for a skill are met
   * @param {String} skillId - ID of the skill to check
   * @returns {Boolean} True if prerequisites are met
   */
  function arePrerequisitesMet(skillId) {
    const prerequisites = getPrerequisites(skillId);
    
    // If no prerequisites, always met
    if (prerequisites.length === 0) {
      return true;
    }
    
    // Check if at least one prerequisite is unlocked
    return prerequisites.some(prereqId => _data.unlockedSkills.includes(prereqId));
  }
  
  /**
   * Check if all prerequisites for a skill are active
   * @param {String} skillId - ID of the skill to check
   * @returns {Boolean} True if prerequisites are active
   */
  function arePrerequisitesActive(skillId) {
    const prerequisites = getPrerequisites(skillId);
    
    // If no prerequisites, always met
    if (prerequisites.length === 0) {
      return true;
    }
    
    // Check if at least one prerequisite is active
    return prerequisites.some(prereqId => _data.activeSkills.includes(prereqId));
  }
  
  /**
   * Get prerequisites for a skill
   * @param {String} skillId - ID of the skill to check
   * @returns {Array} Array of prerequisite skill IDs
   */
  function getPrerequisites(skillId) {
    const prerequisites = [];
    
    // Find connections where this skill is the target
    _data.connections.forEach(connection => {
      if (connection.target === skillId) {
        prerequisites.push(connection.source);
      }
    });
    
    return prerequisites;
  }
  
  /**
   * Get active skills that depend on a skill
   * @param {String} skillId - ID of the skill to check
   * @returns {Array} Array of dependent skill IDs
   */
  function getActiveDependentSkills(skillId) {
    const dependents = [];
    
    // Find active skills that have this skill as a prerequisite
    _data.activeSkills.forEach(activeSkillId => {
      // Skip self
      if (activeSkillId === skillId) return;
      
      // Check if this skill depends on the target skill
      const prerequisites = getPrerequisites(activeSkillId);
      if (prerequisites.includes(skillId)) {
        // Only add if this is the only active prerequisite
        const activePrereqs = prerequisites.filter(prereqId => 
          _data.activeSkills.includes(prereqId) && prereqId !== skillId
        );
        
        if (activePrereqs.length === 0) {
          dependents.push(activeSkillId);
        }
      }
    });
    
    return dependents;
  }
  
  /**
   * Update specialization progress
   * @param {String} specializationId - ID of the specialization to update
   */
  function updateSpecializationProgress(specializationId) {
    if (!_data.specializations[specializationId]) return;
    
    // Count unlocked skills in this specialization
    let count = 0;
    _data.unlockedSkills.forEach(skillId => {
      const skill = getSkillById(skillId);
      if (skill && skill.specialization === specializationId) {
        count++;
      }
    });
    
    // Update progress
    const oldValue = _data.specialization_progress[specializationId];
    _data.specialization_progress[specializationId] = count;
    
    // Notify observers if changed
    if (oldValue !== count) {
      _notifyObservers('specializationUpdated', {
        specializationId: specializationId,
        oldValue: oldValue,
        newValue: count
      });
      
      // Check for threshold achievements
      _checkSpecializationThresholds(specializationId, oldValue, count);
    }
  }
  
  /**
   * Check for specialization threshold achievements
   * @private
   * @param {String} specializationId - ID of the specialization
   * @param {Number} oldValue - Old progress value
   * @param {Number} newValue - New progress value
   */
  function _checkSpecializationThresholds(specializationId, oldValue, newValue) {
    const spec = _data.specializations[specializationId];
    if (!spec) return;
    
    // Check regular threshold
    if (oldValue < spec.threshold && newValue >= spec.threshold) {
      console.log(`Specialization threshold achieved: ${specializationId}`);
      
      // Show notification if UIUtils exists
      if (window.UIUtils && window.UIUtils.showToast) {
        window.UIUtils.showToast(`Specialization achieved: ${spec.name}`, 'success');
      }
      
      // Emit event if EventSystem exists
      if (window.EventSystem && window.EventSystem.emit) {
        window.EventSystem.emit('SPECIALIZATION_ACHIEVED', {
          specializationId: specializationId,
          name: spec.name,
          level: 1
        });
      }
    }
    
    // Check mastery threshold
    if (oldValue < spec.mastery_threshold && newValue >= spec.mastery_threshold) {
      console.log(`Specialization mastery achieved: ${specializationId}`);
      
      // Show notification if UIUtils exists
      if (window.UIUtils && window.UIUtils.showToast) {
        window.UIUtils.showToast(`Mastery achieved: ${spec.name}`, 'success');
      }
      
      // Emit event if EventSystem exists
      if (window.EventSystem && window.EventSystem.emit) {
        window.EventSystem.emit('SPECIALIZATION_MASTERY_ACHIEVED', {
          specializationId: specializationId,
          name: spec.name,
          level: 2
        });
      }
    }
  }
  
  /**
   * Get active specializations
   * @returns {Array} Array of active specialization IDs
   */
  function getActiveSpecializations() {
    const active = [];
    
    Object.keys(_data.specialization_progress).forEach(specId => {
      const spec = _data.specializations[specId];
      const progress = _data.specialization_progress[specId];
      
      // Add if threshold is met
      if (spec && progress >= spec.threshold) {
        active.push(specId);
      }
    });
    
    return active;
  }
  
  /**
   * Get specialization level (0=none, 1=specialist, 2=master)
   * @param {String} specializationId - ID of the specialization
   * @returns {Number} Specialization level
   */
  function getSpecializationLevel(specializationId) {
    const spec = _data.specializations[specializationId];
    const progress = _data.specialization_progress[specializationId];
    
    if (!spec || progress === undefined) return 0;
    
    if (progress >= spec.mastery_threshold) return 2;
    if (progress >= spec.threshold) return 1;
    return 0;
  }
  
  /**
   * Add reputation (from achievements, etc.)
   * @param {Number} amount - Amount of reputation to add
   * @returns {Boolean} Success status
   */
  function addReputation(amount) {
    if (amount <= 0) return false;
    
    const oldValue = _data.reputation;
    _data.reputation += amount;
    
    // Notify observers
    _notifyObservers('reputationChanged', {
      oldValue: oldValue,
      newValue: _data.reputation,
      change: amount
    });
    
    // Update skill states
    updateAllSkillStates();
    
    // Save progress
    saveProgress();
    
    return true;
  }
  
  /**
   * Set reputation directly (from save/load)
   * @param {Number} amount - Amount of reputation to set
   */
  function setReputation(amount) {
    if (amount < 0) amount = 0;
    
    const oldValue = _data.reputation;
    _data.reputation = amount;
    
    // Notify observers if different
    if (oldValue !== amount) {
      _notifyObservers('reputationChanged', {
        oldValue: oldValue,
        newValue: _data.reputation,
        change: amount - oldValue
      });
      
      // Update skill states
      updateAllSkillStates();
    }
  }
  
  /**
   * Add skill points
   * @param {Number} amount - Amount of skill points to add
   * @returns {Boolean} Success status
   */
  function addSkillPoints(amount) {
    if (amount <= 0) return false;
    
    const oldValue = _data.skillPointsAvailable;
    _data.skillPointsAvailable += amount;
    
    // Notify observers
    _notifyObservers('skillPointsChanged', {
      oldValue: oldValue,
      newValue: _data.skillPointsAvailable,
      change: amount
    });
    
    return true;
  }
  
  /**
   * Get a skill by ID
   * @param {String} skillId - ID of the skill to get
   * @returns {Object|null} Skill object or null if not found
   */
  function getSkillById(skillId) {
    return _data.skills[skillId] || null;
  }
  
  /**
   * Get all skills connected to a skill
   * @param {String} skillId - ID of the skill to check
   * @returns {Array} Array of connected skill IDs
   */
  function getConnectedSkills(skillId) {
    const connected = [];
    
    // Find connections where this skill is the source
    _data.connections.forEach(connection => {
      if (connection.source === skillId) {
        connected.push(connection.target);
      }
    });
    
    // Find connections where this skill is the target
    _data.connections.forEach(connection => {
      if (connection.target === skillId) {
        connected.push(connection.source);
      }
    });
    
    return connected;
  }
  
  /**
   * Get skills in a specialization
   * @param {String} specializationId - ID of the specialization
   * @returns {Array} Array of skill objects
   */
  function getSkillsInSpecialization(specializationId) {
    return Object.values(_data.skills).filter(skill => 
      skill.specialization === specializationId
    );
  }
  
  /**
   * Debug helper to log current state
   */
  function debugState() {
    console.group("Skill Tree Manager Debug");
    console.log("Reputation:", _data.reputation);
    console.log("Skill Points Available:", _data.skillPointsAvailable);
    console.log("Unlocked Skills:", _data.unlockedSkills);
    console.log("Active Skills:", _data.activeSkills);
    
    console.group("Specialization Progress");
    Object.keys(_data.specialization_progress).forEach(specId => {
      const spec = _data.specializations[specId];
      const progress = _data.specialization_progress[specId];
      console.log(`${spec.name}: ${progress}/${spec.threshold} (${getSpecializationLevel(specId)})`);
    });
    console.groupEnd();
    
    console.groupEnd();
  }
  
  /**
   * Add observer for skill tree events
   * @param {Function|Object} observer - Observer function or object
   * @param {String} eventType - Type of event to observe, or 'global' for all
   * @returns {Boolean} Success status
   */
  function addObserver(observer, eventType = 'global') {
    if (typeof observer !== 'function' && 
        typeof observer.onSkillTreeChanged !== 'function') {
      console.error("Invalid observer:", observer);
      return false;
    }
    
    // Check if event type exists
    if (!_observers[eventType]) {
      console.warn(`Unknown event type: ${eventType}, defaulting to global`);
      eventType = 'global';
    }
    
    // Add observer
    _observers[eventType].push(observer);
    return true;
  }
  
  /**
   * Remove observer
   * @param {Function|Object} observer - Observer to remove
   * @param {String} eventType - Type of event, or 'global' for all
   * @returns {Boolean} Success status
   */
  function removeObserver(observer, eventType = 'global') {
    // Check if event type exists
    if (!_observers[eventType]) {
      console.warn(`Unknown event type: ${eventType}, defaulting to global`);
      eventType = 'global';
    }
    
    // Find and remove observer
    const index = _observers[eventType].indexOf(observer);
    if (index !== -1) {
      _observers[eventType].splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * Notify observers of an event
   * @private
   * @param {String} eventType - Type of event
   * @param {Object} data - Event data
   */
  function _notifyObservers(eventType, data) {
    console.log(`Skill tree update: ${eventType}`);
    
    try {
      // First notify event-specific observers
      if (_observers[eventType]) {
        _observers[eventType].forEach(observer => {
          try {
            if (typeof observer === 'function') {
              observer(eventType, data);
            } else if (typeof observer.onSkillTreeChanged === 'function') {
              observer.onSkillTreeChanged(eventType, data);
            }
          } catch (error) {
            if (window.ErrorHandler) {
              window.ErrorHandler.handleError(
                error,
                `Observer Notification (${eventType})`, 
                window.ErrorHandler.SEVERITY.WARNING
              );
            } else {
              console.error(`Error in observer for ${eventType}:`, error);
            }
          }
        });
      }
      
      // Then notify global observers
      _observers.global.forEach(observer => {
        try {
          if (typeof observer === 'function') {
            observer(eventType, data);
          } else if (typeof observer.onSkillTreeChanged === 'function') {
            observer.onSkillTreeChanged(eventType, data);
          }
        } catch (error) {
          if (window.ErrorHandler) {
            window.ErrorHandler.handleError(
              error,
              `Global Observer Notification (${eventType})`, 
              window.ErrorHandler.SEVERITY.WARNING
            );
          } else {
            console.error(`Error in global observer for ${eventType}:`, error);
          }
        }
      });
    } catch (error) {
      if (window.ErrorHandler) {
        window.ErrorHandler.handleError(
          error,
          `Observer Notification System (${eventType})`, 
          window.ErrorHandler.SEVERITY.ERROR
        );
      } else {
        console.error(`Error in observer notification system:`, error);
      }
    }
  }
  
  // Public API
  return {
    // Properties to expose
    get skills() { return _data.skills; },
    get specializations() { return _data.specializations; },
    get connections() { return _data.connections; },
    get unlockedSkills() { return _data.unlockedSkills; },
    get activeSkills() { return _data.activeSkills; },
    get specialization_progress() { return _data.specialization_progress; },
    get skillPointsAvailable() { return _data.skillPointsAvailable; },
    get reputation() { return _data.reputation; },
    get initialized() { return _state.initialized; },
    
    // Core methods
    initialize,
    saveProgress,
    updateAllSkillStates,
    resetActiveSkills,
    
    // Skill operations
    unlockSkill,
    activateSkill,
    deactivateSkill,
    canUnlockSkill,
    canActivateSkill,
    arePrerequisitesMet,
    arePrerequisitesActive,
    getPrerequisites,
    getActiveDependentSkills,
    
    // Specialization methods
    updateSpecializationProgress,
    getActiveSpecializations,
    getSpecializationLevel,
    
    // Resource management
    addReputation,
    setReputation,
    addSkillPoints,
    
    // Helper methods
    getSkillById,
    getConnectedSkills,
    getSkillsInSpecialization,
    debugState,
    
    // Observer methods
    addObserver,
    removeObserver
  };
})();

// Export for module use
export default SkillTreeManager;

// For backward compatibility with existing code
window.SkillTreeManager = SkillTreeManager;