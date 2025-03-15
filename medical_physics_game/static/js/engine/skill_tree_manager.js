// skill_tree_manager.js - Manages skill tree functionality and state

// Define the new core cluster nodes
const CORE_CLUSTER_NODES = {
  "radiation_physics": {
    "id": "radiation_physics",
    "name": "Radiation Physics",
    "specialization": "core",
    "tier": 0,
    "description": "Understanding of radiation behavior and interactions with matter.",
    "effects": [
      {
        "type": "insight_gain_flat",
        "value": 2,
        "condition": null
      }
    ],
    "position": {"x": 370, "y": 280},
    "connections": ["quantum_comprehension", "radiation_detection"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": "minor",
      "icon": "zap"
    }
  },
  "medical_instrumentation": {
    "id": "medical_instrumentation",
    "name": "Medical Instrumentation",
    "specialization": "core",
    "tier": 0,
    "description": "Knowledge of medical imaging and therapy devices.",
    "effects": [
      {
        "type": "equipment_cost_reduction",
        "value": 0.1,
        "condition": null
      }
    ],
    "position": {"x": 430, "y": 280},
    "connections": ["calibration_expert", "machine_whisperer"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": "minor",
      "icon": "tool"
    }
  },
  "patient_care": {
    "id": "patient_care",
    "name": "Patient Care",
    "specialization": "core",
    "tier": 0,
    "description": "Fundamentals of patient care and safety protocols.",
    "effects": [
      {
        "type": "patient_outcome_multiplier",
        "value": 1.1,
        "condition": null
      }
    ],
    "position": {"x": 370, "y": 320},
    "connections": ["bedside_manner", "diagnostic_intuition"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": "minor",
      "icon": "heart"
    }
  },
  "medical_science": {
    "id": "medical_science",
    "name": "Medical Science",
    "specialization": "core",
    "tier": 0,
    "description": "Scientific principles underlying medical physics.",
    "effects": [
      {
        "type": "insight_gain_multiplier",
        "value": 1.05,
        "condition": null
      }
    ],
    "position": {"x": 430, "y": 320},
    "connections": ["literature_review", "scholarly_memory"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": "minor",
      "icon": "book"
    }
  }
};

// Get a list of all core node IDs for easier reference
const CORE_NODE_IDS = Object.keys(CORE_CLUSTER_NODES);

// Define skill states as constants
const SKILL_STATE = {
  LOCKED: 'locked',       // Cannot be unlocked yet (prerequisites not met)
  UNLOCKABLE: 'unlockable', // Can be unlocked (prerequisites met, reputation cost affordable)
  UNLOCKED: 'unlocked',   // Unlocked but not active in current run
  ACTIVE: 'active'        // Unlocked and active in current run
};

// SkillTreeManager singleton - manages all skill tree functionality
const SkillTreeManager = {
  // Core skill tree data
  skills: {},                  // All skills from skill_tree.json
  specializations: {},         // All specializations from skill_tree.json
  connections: [],             // All skill connections
  unlockedSkills: [],          // Skill IDs that are permanently unlocked
  activeSkills: [],            // Skill IDs that are active in current run
  specialization_progress: {}, // Current progress in each specialization
  skillPointsAvailable: 0,     // Skill points available for current run
  reputation: 0,               // Meta-currency for unlocking skills
  initialized: false,          // Flag to track initialization state
  
  // Event observers with typed subscriptions
  observers: {
    // Global observers receive all events
    global: [],
    // Event-specific observers
    skillTreeInitialized: [],
    skillUnlocked: [],
    skillActivated: [],
    skillDeactivated: [],
    specializationUpdated: [],
    reputationChanged: [],
    skillPointsChanged: []
  },
  
  initialize: function() {
    console.log("Initializing skill tree manager...");
    
    if (this.initialized) {
      console.log("SkillTreeManager already initialized - skipping initialization");
      return Promise.resolve(this);
    }
    
    // Load skill tree data with improved error handling
    return fetch('/api/skill-tree')
      .then(response => {
        if (!response.ok) {
          console.error(`API error: ${response.status} when loading skill tree data`);
          throw new Error(`Failed to load skill tree data: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Skill tree data loaded successfully");
        
        // Process skill tree data
        this._processSkillTreeData(data);
        
        // Connect to game state
        this._connectToGameState();
        
        // Load player progress
        return this._loadPlayerProgress();
      })
      .then(() => {
        // Set initialized flag
        this.initialized = true;
        
        // Notify observers
        this.notifyObservers('skillTreeInitialized', {
          skills: this.skills,
          specializations: this.specializations,
          unlockedSkills: this.unlockedSkills,
          activeSkills: this.activeSkills,
          specialization_progress: this.specialization_progress
        });
        
        console.log("Skill tree manager initialized successfully");
        return this;
      })
      .catch(error => {
        // Handle error and create fallback data
        console.error("Error initializing skill tree manager:", error);
        
        ErrorHandler.handleError(
          error,
          "Skill Tree Initialization",
          ErrorHandler.SEVERITY.ERROR
        );
        
        this._createFallbackData();
        this.initialized = true;
        
        console.log("Skill tree manager initialized with fallback data");
        return this;
      });
  },
  
  // Process skill tree data from JSON
  _processSkillTreeData: function(data) {
    console.log("Processing skill tree data...");
    
    // Process specializations
    data.specializations.forEach(spec => {
      this.specializations[spec.id] = spec;
      this.specialization_progress[spec.id] = 0;
    });
    
    // Ensure core specialization exists
    if (!this.specializations["core"]) {
      this.specializations["core"] = {
        "id": "core",
        "name": "Core Competencies",
        "description": "Fundamental medical physics knowledge",
        "color": "#777777", // Grey color for core nodes
        "threshold": 4,
        "mastery_threshold": 4
      };
      this.specialization_progress["core"] = 0;
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
      Object.values(CORE_CLUSTER_NODES).forEach(node => {
        data.nodes.push(node);
      });
      
      // Update connections
      this._updateConnectionsForCoreCluster(data.connections);
    }
    
    // Process skills
    data.nodes.forEach(node => {
      this.skills[node.id] = node;
      
      // Initialize skill state
      node.state = SKILL_STATE.LOCKED;
    });
    
    // Process connections
    this.connections = data.connections;
    
    console.log(`Processed ${Object.keys(this.skills).length} skills and ${Object.keys(this.specializations).length} specializations`);
  },
  
  // Helper to update connections when replacing core_physics with the cluster
  _updateConnectionsForCoreCluster: function(connections) {
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
  },
  
  // Connect to game state
  _connectToGameState: function() {
    // Register for game state changes
    GameState.addObserver((eventType, data) => {
      // Handle character updates (reputation changes)
      if (eventType === 'characterUpdated' && data.reputation !== this.reputation) {
        this.setReputation(data.reputation || 0);
      }
      
      // Handle floor changes (reset active skills)
      if (eventType === 'floorChanging') {
        // Reset active skills for next floor/run if needed
        // This would be where we'd implement any per-floor skill reset logic
      }
    });
    
    // Register event listeners
    EventSystem.on(GAME_EVENTS.RUN_STARTED, () => {
      this.resetActiveSkills();
      this.updateAllSkillStates();
    });
    
    EventSystem.on(GAME_EVENTS.RUN_COMPLETED, () => {
      // Save the skill tree progress when a run completes
      this.saveProgress();
    });
  },
  
  // Load player progress from server
  _loadPlayerProgress: function() {
    console.log("Loading player skill tree progress...");
    
    // Use our ApiClient to load progress
    return ApiClient.loadSkillProgress()
      .then(data => {
        if (!data) {
          throw new Error("Failed to load skill progress data");
        }
        
        // Set reputation
        this.reputation = data.reputation || 0;
        
        // Set unlocked skills (ensure core nodes are always included)
        this.unlockedSkills = data.unlocked_skills || [];
        
        // Check if we need to migrate from core_physics to core cluster
        if (this.unlockedSkills.includes('core_physics')) {
          // Remove core_physics
          const index = this.unlockedSkills.indexOf('core_physics');
          if (index !== -1) {
            this.unlockedSkills.splice(index, 1);
          }
          
          // Add all core cluster nodes
          CORE_NODE_IDS.forEach(nodeId => {
            if (!this.unlockedSkills.includes(nodeId)) {
              this.unlockedSkills.push(nodeId);
            }
          });
        } else {
          // Just ensure all core nodes are included
          CORE_NODE_IDS.forEach(nodeId => {
            if (!this.unlockedSkills.includes(nodeId)) {
              this.unlockedSkills.push(nodeId);
            }
          });
        }
        
        // Set active skills (ensure core nodes are always included)
        this.activeSkills = data.active_skills || [];
        
        // Migrate active skills from core_physics if needed
        if (this.activeSkills.includes('core_physics')) {
          // Remove core_physics
          const index = this.activeSkills.indexOf('core_physics');
          if (index !== -1) {
            this.activeSkills.splice(index, 1);
          }
          
          // Add all core cluster nodes
          CORE_NODE_IDS.forEach(nodeId => {
            if (!this.activeSkills.includes(nodeId)) {
              this.activeSkills.push(nodeId);
            }
          });
        } else {
          // Just ensure all core nodes are included
          CORE_NODE_IDS.forEach(nodeId => {
            if (!this.activeSkills.includes(nodeId)) {
              this.activeSkills.push(nodeId);
            }
          });
        }
        
        // Set skill points available
        this.skillPointsAvailable = data.skill_points_available || 3;
        
        // Load specialization progress
        if (data.specialization_progress) {
          // Initialize all specializations to 0 first
          Object.keys(this.specializations).forEach(specId => {
            this.specialization_progress[specId] = 0;
          });
          
          // Then update with actual progress
          Object.keys(data.specialization_progress).forEach(specId => {
            if (this.specialization_progress[specId] !== undefined) {
              this.specialization_progress[specId] = data.specialization_progress[specId];
            }
          });
        } else {
          // Initialize all to 0
          Object.keys(this.specializations).forEach(specId => {
            this.specialization_progress[specId] = 0;
          });
        }
        
        // Update all skill states
        this.updateAllSkillStates();
        
        console.log(`Loaded player progress: ${this.unlockedSkills.length} unlocked skills, ${this.reputation} reputation`);
        
        // If no skills are loaded (new player), add a debug message
        if (this.unlockedSkills.length <= CORE_NODE_IDS.length) {
          console.log("New player detected, only core skills are unlocked");
        }
        
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
        this.reputation = 10; // Start with 10 reputation to unlock something
        this.unlockedSkills = [...CORE_NODE_IDS]; // All core cluster nodes
        this.activeSkills = [...CORE_NODE_IDS];   // All core cluster nodes active
        this.skillPointsAvailable = 3;            // Start with some skill points
        
        // Initialize specialization progress to zero
        Object.keys(this.specializations).forEach(specId => {
          this.specialization_progress[specId] = 0;
        });
        
        // Update all skill states
        this.updateAllSkillStates();
        
        return false;
      });
  },
  
  // Create fallback data in case of error
  _createFallbackData: function() {
    console.log("Creating fallback skill tree data with core cluster");
    
    // Create basic specializations
    this.specializations = {
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
    
    // Create basic skills with the core cluster nodes
    this.skills = {
      // Add the core cluster nodes
      ...CORE_CLUSTER_NODES,
      
      // Add a few basic skill nodes
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
        "state": SKILL_STATE.LOCKED,
        "visual": {
          "size": "minor",
          "icon": "brain"
        }
      },
      "bedside_manner": {
        "id": "bedside_manner",
        "name": "Bedside Manner",
        "specialization": "clinical",
        "tier": 1,
        "description": "+30% to patient outcome ratings",
        "effects": [
          {
            "type": "patient_outcome_multiplier",
            "condition": null,
            "value": 1.3
          }
        ],
        "position": {"x": 500, "y": 150},
        "connections": [],
        "cost": {
          "reputation": 10,
          "skill_points": 2
        },
        "state": SKILL_STATE.LOCKED,
        "visual": {
          "size": "minor",
          "icon": "heart"
        }
      },
      "radiation_detection": {
        "id": "radiation_detection",
        "name": "Radiation Detection",
        "specialization": "technical",
        "tier": 3,
        "description": "Identify radiation anomalies automatically",
        "effects": [
          {
            "type": "auto_detect_radiation_anomalies",
            "condition": null,
            "value": true
          }
        ],
        "position": {"x": 220, "y": 620},
        "connections": [],
        "cost": {
          "reputation": 20,
          "skill_points": 3
        },
        "visual": {
          "size": "minor",
          "icon": "zap"
        }
      },
      "machine_whisperer": {
        "id": "machine_whisperer",
        "name": "Machine Whisperer",
        "specialization": "technical",
        "tier": 2,
        "description": "40% reduced penalty from malfunctions",
        "effects": [
          {
            "type": "malfunction_penalty_reduction",
            "condition": null,
            "value": 0.4
          }
        ],
        "position": {"x": 250, "y": 550},
        "connections": [],
        "cost": {
          "reputation": 15,
          "skill_points": 3
        },
        "visual": {
          "size": "minor",
          "icon": "cpu"
        }
      },
      "calibration_expert": {
        "id": "calibration_expert",
        "name": "Calibration Expert",
        "specialization": "technical",
        "tier": 1,
        "description": "Equipment calibrations always succeed",
        "effects": [
          {
            "type": "calibration_success",
            "condition": null,
            "value": 1.0
          }
        ],
        "position": {"x": 300, "y": 450},
        "connections": [],
        "cost": {
          "reputation": 10,
          "skill_points": 2
        },
        "visual": {
          "size": "minor",
          "icon": "tool"
        }
      },
      "diagnostic_intuition": {
        "id": "diagnostic_intuition",
        "name": "Diagnostic Intuition",
        "specialization": "clinical",
        "tier": 2,
        "description": "Reveal one hidden patient parameter at case start",
        "effects": [
          {
            "type": "reveal_patient_parameter",
            "condition": null,
            "value": 1
          }
        ],
        "position": {"x": 450, "y": 50},
        "connections": [],
        "cost": {
          "reputation": 15,
          "skill_points": 3
        },
        "visual": {
          "size": "minor",
          "icon": "stethoscope"
        }
      },
      "literature_review": {
        "id": "literature_review",
        "name": "Literature Review",
        "specialization": "research",
        "tier": 1,
        "description": "Start runs with 3 research papers",
        "effects": [
          {
            "type": "start_with_items",
            "condition": null,
            "value": {
              "item_type": "research_paper",
              "count": 3
            }
          }
        ],
        "position": {"x": 500, "y": 450},
        "connections": [],
        "cost": {
          "reputation": 10,
          "skill_points": 2
        },
        "visual": {
          "size": "minor",
          "icon": "book-open"
        }
      },
      "scholarly_memory": {
        "id": "scholarly_memory",
        "name": "Scholarly Memory",
        "specialization": "theory",
        "tier": 3,
        "description": "Remember similar questions from past runs",
        "effects": [
          {
            "type": "recall_similar_questions",
            "condition": null,
            "value": true
          }
        ],
        "position": {"x": 300, "y": 0},
        "connections": [],
        "cost": {
          "reputation": 20,
          "skill_points": 3
        },
        "visual": {
          "size": "minor",
          "icon": "book"
        }
      }
    };
    
    // Create connections for the cluster 
    this.connections = [
      // Connections between core nodes
      {"source": "radiation_physics", "target": "medical_instrumentation"},
      {"source": "radiation_physics", "target": "patient_care"},
      {"source": "medical_instrumentation", "target": "medical_science"},
      {"source": "patient_care", "target": "medical_science"},
      
      // Connections to specialization nodes
      {"source": "radiation_physics", "target": "quantum_comprehension"},
      {"source": "radiation_physics", "target": "radiation_detection"},
      {"source": "medical_instrumentation", "target": "calibration_expert"},
      {"source": "medical_instrumentation", "target": "machine_whisperer"},
      {"source": "patient_care", "target": "bedside_manner"},
      {"source": "patient_care", "target": "diagnostic_intuition"},
      {"source": "medical_science", "target": "literature_review"},
      {"source": "medical_science", "target": "scholarly_memory"}
    ];
    
    // Initialize specialization progress
    this.specialization_progress = {
      "core": 0,
      "theory": 0,
      "clinical": 0
    };
    
    // Set all core cluster nodes as unlocked and active
    this.unlockedSkills = [...CORE_NODE_IDS];
    this.activeSkills = [...CORE_NODE_IDS];
    this.skillPointsAvailable = 3;
    this.reputation = 10;
    
    // Update all skill states
    this.updateAllSkillStates();
    
    console.log("Fallback skill tree data created with:", {
      skills: Object.keys(this.skills).length,
      specializations: Object.keys(this.specializations).length,
      connections: this.connections.length
    });
  },
  
  // Save progress to server
  saveProgress: function() {
    console.log("Saving skill tree progress...");
    
    // Prepare data to save
    const progressData = {
      reputation: this.reputation,
      unlocked_skills: this.unlockedSkills,
      active_skills: this.activeSkills,
      skill_points_available: this.skillPointsAvailable,
      specialization_progress: this.specialization_progress
    };
    
    return fetch('/api/skill-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to save skill progress: ${response.status}`);
      }
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
      setTimeout(() => this.saveProgress(), 30000);
      
      return false;
    });
  },
  
  // Update all skill states
  updateAllSkillStates: function() {
    console.log("Updating all skill states...");
    
    // Update each skill
    Object.values(this.skills).forEach(skill => {
      // Check if skill is unlocked
      if (this.unlockedSkills.includes(skill.id)) {
        // Check if skill is active
        if (this.activeSkills.includes(skill.id)) {
          skill.state = SKILL_STATE.ACTIVE;
        } else {
          skill.state = SKILL_STATE.UNLOCKED;
        }
      } else {
        // Check if skill is unlockable
        if (this.canUnlockSkill(skill.id)) {
          skill.state = SKILL_STATE.UNLOCKABLE;
        } else {
          skill.state = SKILL_STATE.LOCKED;
        }
      }
    });
    
    // Notify observers
    this.notifyObservers('skillStatesUpdated', {
      skills: this.skills
    });
  },
  
  // Unlock a skill
  unlockSkill: function(skillId) {
    console.log(`Attempting to unlock skill: ${skillId}`);
    
    // Get the skill
    const skill = this.getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      console.error(`Skill not found: ${skillId}`);
      return false;
    }
    
    // Check if already unlocked
    if (this.unlockedSkills.includes(skillId)) {
      console.log(`Skill ${skillId} is already unlocked`);
      return true;
    }
    
    // Check if can unlock
    if (!this.canUnlockSkill(skillId)) {
      console.error(`Cannot unlock skill ${skillId}: prerequisites not met or insufficient reputation`);
      return false;
    }
    
    // Deduct reputation cost
    const reputationCost = skill.cost.reputation || 0;
    this.reputation -= reputationCost;
    
    // Add to unlocked skills
    this.unlockedSkills.push(skillId);
    
    // Update specialization progress
    if (skill.specialization) {
      this.updateSpecializationProgress(skill.specialization);
    }
    
    // Update skill states
    this.updateAllSkillStates();
    
    // Notify observers
    this.notifyObservers('skillUnlocked', {
      skillId: skillId,
      skill: skill,
      remainingReputation: this.reputation
    });
    
    // Notify reputation change
    this.notifyObservers('reputationChanged', {
      oldValue: this.reputation + reputationCost,
      newValue: this.reputation,
      change: -reputationCost
    });
    
    // Save progress
    this.saveProgress();
    
    console.log(`Skill ${skillId} unlocked successfully`);
    return true;
  },
  
  // Activate a skill for the current run
  activateSkill: function(skillId) {
    console.log(`Attempting to activate skill: ${skillId}`);
    
    // Get the skill
    const skill = this.getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      console.error(`Skill not found: ${skillId}`);
      return false;
    }
    
    // Check if already active
    if (this.activeSkills.includes(skillId)) {
      console.log(`Skill ${skillId} is already active`);
      return true;
    }
    
    // Check if can activate
    if (!this.canActivateSkill(skillId)) {
      console.error(`Cannot activate skill ${skillId}: not unlocked or insufficient skill points`);
      return false;
    }
    
    // Deduct skill points
    const skillPointCost = skill.cost.skill_points || 0;
    this.skillPointsAvailable -= skillPointCost;
    
    // Add to active skills
    this.activeSkills.push(skillId);
    
    // Update skill states
    this.updateAllSkillStates();
    
    // Notify observers
    this.notifyObservers('skillActivated', {
      skillId: skillId,
      skill: skill,
      remainingSkillPoints: this.skillPointsAvailable
    });
    
    // Notify skill points change
    this.notifyObservers('skillPointsChanged', {
      oldValue: this.skillPointsAvailable + skillPointCost,
      newValue: this.skillPointsAvailable,
      change: -skillPointCost
    });
    
    // Apply skill effects
    SkillEffectSystem.applySkillEffects(skill);
    
    console.log(`Skill ${skillId} activated successfully`);
    return true;
  },
  
  // Deactivate a skill
  deactivateSkill: function(skillId) {
    console.log(`Attempting to deactivate skill: ${skillId}`);
    
    // Get the skill
    const skill = this.getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      console.error(`Skill not found: ${skillId}`);
      return false;
    }
    
    // Check if already inactive
    if (!this.activeSkills.includes(skillId)) {
      console.log(`Skill ${skillId} is not active`);
      return true;
    }
    
    // Special case: can't deactivate core skills
    if (CORE_NODE_IDS.includes(skillId)) {
      console.error(`Cannot deactivate core skill: ${skillId}`);
      return false;
    }
    
    // Check if other skills depend on this one being active
    const dependentSkills = this.getActiveDependentSkills(skillId);
    if (dependentSkills.length > 0) {
      console.error(`Cannot deactivate skill ${skillId}: other active skills depend on it: ${dependentSkills.join(', ')}`);
      return false;
    }
    
    // Refund skill points
    const skillPointCost = skill.cost.skill_points || 0;
    this.skillPointsAvailable += skillPointCost;
    
    // Remove from active skills
    const index = this.activeSkills.indexOf(skillId);
    if (index !== -1) {
      this.activeSkills.splice(index, 1);
    }
    
    // Update skill states
    this.updateAllSkillStates();
    
    // Notify observers
    this.notifyObservers('skillDeactivated', {
      skillId: skillId,
      skill: skill,
      remainingSkillPoints: this.skillPointsAvailable
    });
    
    // Notify skill points change
    this.notifyObservers('skillPointsChanged', {
      oldValue: this.skillPointsAvailable - skillPointCost,
      newValue: this.skillPointsAvailable,
      change: skillPointCost
    });
    
    // Remove skill effects
    SkillEffectSystem.removeSkillEffects(skill);
    
    console.log(`Skill ${skillId} deactivated successfully`);
    return true;
  },
  
  // Reset active skills (for new run)
  resetActiveSkills: function() {
    console.log("Resetting active skills for new run...");
    
    // Remove all effects first
    this.activeSkills.forEach(skillId => {
      const skill = this.getSkillById(skillId);
      if (skill) {
        SkillEffectSystem.removeSkillEffects(skill);
      }
    });
    
    // Keep only core skills
    this.activeSkills = this.activeSkills.filter(skillId => 
      CORE_NODE_IDS.includes(skillId)
    );
    
    // Reset skill points
    this.skillPointsAvailable = this._calculateStartingSkillPoints();
    
    // Update skill states
    this.updateAllSkillStates();
    
    // Re-apply core skill effects
    this.activeSkills.forEach(skillId => {
      const skill = this.getSkillById(skillId);
      if (skill) {
        SkillEffectSystem.applySkillEffects(skill);
      }
    });
    
    // Notify observers
    this.notifyObservers('skillsReset', {
      activeSkills: this.activeSkills,
      skillPointsAvailable: this.skillPointsAvailable
    });
    
    console.log(`Active skills reset. Available skill points: ${this.skillPointsAvailable}`);
  },
  
  // Calculate starting skill points for a run
  _calculateStartingSkillPoints: function() {
    // Base skill points
    let points = 3;
    
    // Bonus from character level
    if (GameState.data.character && GameState.data.character.level) {
      points += Math.floor(GameState.data.character.level / 2);
    }
    
    // Bonus from specializations
    const specializations = this.getActiveSpecializations();
    if (specializations.length > 0) {
      points += specializations.length;
    }
    
    return points;
  },
  
  // Check if a skill can be unlocked
  canUnlockSkill: function(skillId) {
    // Get the skill
    const skill = this.getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      return false;
    }
    
    // Check if already unlocked
    if (this.unlockedSkills.includes(skillId)) {
      return false;
    }
    
    // Check reputation cost
    const reputationCost = skill.cost.reputation || 0;
    if (this.reputation < reputationCost) {
      return false;
    }
    
    // Check prerequisites
    return this.arePrerequisitesMet(skillId);
  },
  
  // Check if a skill can be activated
  canActivateSkill: function(skillId) {
    // Get the skill
    const skill = this.getSkillById(skillId);
    
    // Validate skill exists
    if (!skill) {
      return false;
    }
    
    // Check if already active
    if (this.activeSkills.includes(skillId)) {
      return false;
    }
    
    // Check if unlocked
    if (!this.unlockedSkills.includes(skillId)) {
      return false;
    }
    
    // Check skill point cost
    const skillPointCost = skill.cost.skill_points || 0;
    if (this.skillPointsAvailable < skillPointCost) {
      return false;
    }
    
    // Check if prerequisites are active
    return this.arePrerequisitesActive(skillId);
  },
  
  // Check if all prerequisites for a skill are met
  arePrerequisitesMet: function(skillId) {
    const prerequisites = this.getPrerequisites(skillId);
    
    // If no prerequisites, always met
    if (prerequisites.length === 0) {
      return true;
    }
    
    // Check if at least one prerequisite is unlocked
    return prerequisites.some(prereqId => this.unlockedSkills.includes(prereqId));
  },
  
  // Check if all prerequisites for a skill are active
  arePrerequisitesActive: function(skillId) {
    const prerequisites = this.getPrerequisites(skillId);
    
    // If no prerequisites, always met
    if (prerequisites.length === 0) {
      return true;
    }
    
    // Check if at least one prerequisite is active
    return prerequisites.some(prereqId => this.activeSkills.includes(prereqId));
  },
  
  // Get prerequisites for a skill
  getPrerequisites: function(skillId) {
    const prerequisites = [];
    
    // Find connections where this skill is the target
    this.connections.forEach(connection => {
      if (connection.target === skillId) {
        prerequisites.push(connection.source);
      }
    });
    
    return prerequisites;
  },
  
  // Get active skills that depend on a skill
  getActiveDependentSkills: function(skillId) {
    const dependents = [];
    
    // Find active skills that have this skill as a prerequisite
    this.activeSkills.forEach(activeSkillId => {
      // Skip self
      if (activeSkillId === skillId) return;
      
      // Check if this skill depends on the target skill
      const prerequisites = this.getPrerequisites(activeSkillId);
      if (prerequisites.includes(skillId)) {
        // Only add if this is the only active prerequisite
        const activePrereqs = prerequisites.filter(prereqId => 
          this.activeSkills.includes(prereqId) && prereqId !== skillId
        );
        
        if (activePrereqs.length === 0) {
          dependents.push(activeSkillId);
        }
      }
    });
    
    return dependents;
  },
  
  // Update specialization progress
  updateSpecializationProgress: function(specializationId) {
    if (!this.specializations[specializationId]) return;
    
    // Count unlocked skills in this specialization
    let count = 0;
    this.unlockedSkills.forEach(skillId => {
      const skill = this.getSkillById(skillId);
      if (skill && skill.specialization === specializationId) {
        count++;
      }
    });
    
    // Update progress
    const oldValue = this.specialization_progress[specializationId];
    this.specialization_progress[specializationId] = count;
    
    // Notify observers if changed
    if (oldValue !== count) {
      this.notifyObservers('specializationUpdated', {
        specializationId: specializationId,
        oldValue: oldValue,
        newValue: count
      });
      
      // Check for threshold achievements
      this._checkSpecializationThresholds(specializationId, oldValue, count);
    }
  },
  
  // Check for specialization threshold achievements
  _checkSpecializationThresholds: function(specializationId, oldValue, newValue) {
    const spec = this.specializations[specializationId];
    if (!spec) return;
    
    // Check regular threshold
    if (oldValue < spec.threshold && newValue >= spec.threshold) {
      console.log(`Specialization threshold achieved: ${specializationId}`);
      
      // Show notification
      UIUtils.showToast(`Specialization achieved: ${spec.name}`, 'success');
      
      // Emit event
      EventSystem.emit(GAME_EVENTS.SPECIALIZATION_ACHIEVED, {
        specializationId: specializationId,
        name: spec.name,
        level: 1
      });
    }
    
    // Check mastery threshold
    if (oldValue < spec.mastery_threshold && newValue >= spec.mastery_threshold) {
      console.log(`Specialization mastery achieved: ${specializationId}`);
      
      // Show notification
      UIUtils.showToast(`Mastery achieved: ${spec.name}`, 'success');
      
      // Emit event
      EventSystem.emit(GAME_EVENTS.SPECIALIZATION_MASTERY_ACHIEVED, {
        specializationId: specializationId,
        name: spec.name,
        level: 2
      });
    }
  },
  
  // Get active specializations
  getActiveSpecializations: function() {
    const active = [];
    
    Object.keys(this.specialization_progress).forEach(specId => {
      const spec = this.specializations[specId];
      const progress = this.specialization_progress[specId];
      
      // Add if threshold is met
      if (spec && progress >= spec.threshold) {
        active.push(specId);
      }
    });
    
    return active;
  },
  
  // Get specialization level (0=none, 1=specialist, 2=master)
  getSpecializationLevel: function(specializationId) {
    const spec = this.specializations[specializationId];
    const progress = this.specialization_progress[specializationId];
    
    if (!spec || progress === undefined) return 0;
    
    if (progress >= spec.mastery_threshold) return 2;
    if (progress >= spec.threshold) return 1;
    return 0;
  },
  
  // Add reputation (from achievements, etc.)
  addReputation: function(amount) {
    if (amount <= 0) return false;
    
    const oldValue = this.reputation;
    this.reputation += amount;
    
    // Notify observers
    this.notifyObservers('reputationChanged', {
      oldValue: oldValue,
      newValue: this.reputation,
      change: amount
    });
    
    // Update skill states
    this.updateAllSkillStates();
    
    // Save progress
    this.saveProgress();
    
    return true;
  },
  
  // Set reputation directly (from save/load)
  setReputation: function(amount) {
    if (amount < 0) amount = 0;
    
    const oldValue = this.reputation;
    this.reputation = amount;
    
    // Notify observers if different
    if (oldValue !== amount) {
      this.notifyObservers('reputationChanged', {
        oldValue: oldValue,
        newValue: this.reputation,
        change: amount - oldValue
      });
      
      // Update skill states
      this.updateAllSkillStates();
    }
  },
  
  // Add skill points
  addSkillPoints: function(amount) {
    if (amount <= 0) return false;
    
    const oldValue = this.skillPointsAvailable;
    this.skillPointsAvailable += amount;
    
    // Notify observers
    this.notifyObservers('skillPointsChanged', {
      oldValue: oldValue,
      newValue: this.skillPointsAvailable,
      change: amount
    });
    
    return true;
  },
  
  // Helper functions
  
  // Get a skill by ID
  getSkillById: function(skillId) {
    return this.skills[skillId];
  },
  
  // Get all skills connected to a skill
  getConnectedSkills: function(skillId) {
    const connected = [];
    
    // Find connections where this skill is the source
    this.connections.forEach(connection => {
      if (connection.source === skillId) {
        connected.push(connection.target);
      }
    });
    
    // Find connections where this skill is the target
    this.connections.forEach(connection => {
      if (connection.target === skillId) {
        connected.push(connection.source);
      }
    });
    
    return connected;
  },
  
  // Get skills in a specialization
  getSkillsInSpecialization: function(specializationId) {
    return Object.values(this.skills).filter(skill => 
      skill.specialization === specializationId
    );
  },
  
  // Debug helper to log current state
  debugState: function() {
    console.group("Skill Tree Manager Debug");
    console.log("Reputation:", this.reputation);
    console.log("Skill Points Available:", this.skillPointsAvailable);
    console.log("Unlocked Skills:", this.unlockedSkills);
    console.log("Active Skills:", this.activeSkills);
    
    console.group("Specialization Progress");
    Object.keys(this.specialization_progress).forEach(specId => {
      const spec = this.specializations[specId];
      const progress = this.specialization_progress[specId];
      console.log(`${spec.name}: ${progress}/${spec.threshold} (${this.getSpecializationLevel(specId)})`);
    });
    console.groupEnd();
    
    console.groupEnd();
  },
  
  // Observer pattern functions - similar to GameState
  
  // Add observer
  addObserver: function(observer, eventType = 'global') {
    if (typeof observer !== 'function' && 
        typeof observer.onSkillTreeChanged !== 'function') {
      console.error("Invalid observer:", observer);
      return false;
    }
    
    // Check if event type exists
    if (!this.observers[eventType]) {
      console.warn(`Unknown event type: ${eventType}, defaulting to global`);
      eventType = 'global';
    }
    
    // Add observer
    this.observers[eventType].push(observer);
    return true;
  },
  
  // Remove observer
  removeObserver: function(observer, eventType = 'global') {
    // Check if event type exists
    if (!this.observers[eventType]) {
      console.warn(`Unknown event type: ${eventType}, defaulting to global`);
      eventType = 'global';
    }
    
    // Find and remove observer
    const index = this.observers[eventType].indexOf(observer);
    if (index !== -1) {
      this.observers[eventType].splice(index, 1);
      return true;
    }
    
    return false;
  },
  
  // Notify observers
  notifyObservers: function(eventType, data) {
    console.log(`Skill tree update: ${eventType}`, data);
    
    try {
      // First notify event-specific observers
      if (this.observers[eventType]) {
        this.observers[eventType].forEach(observer => {
          try {
            if (typeof observer === 'function') {
              observer(eventType, data);
            } else if (typeof observer.onSkillTreeChanged === 'function') {
              observer.onSkillTreeChanged(eventType, data);
            }
          } catch (error) {
            ErrorHandler.handleError(
              error,
              `Observer Notification (${eventType})`, 
              ErrorHandler.SEVERITY.WARNING
            );
          }
        });
      }
      
      // Then notify global observers
      this.observers.global.forEach(observer => {
        try {
          if (typeof observer === 'function') {
            observer(eventType, data);
          } else if (typeof observer.onSkillTreeChanged === 'function') {
            observer.onSkillTreeChanged(eventType, data);
          }
        } catch (error) {
          ErrorHandler.handleError(
            error,
            `Global Observer Notification (${eventType})`, 
            ErrorHandler.SEVERITY.WARNING
          );
        }
      });
    } catch (error) {
      ErrorHandler.handleError(
        error,
        `Observer Notification System (${eventType})`, 
        ErrorHandler.SEVERITY.ERROR
      );
    }
  }
};

// Export the SkillTreeManager object and constants
window.SkillTreeManager = SkillTreeManager;
window.SKILL_STATE = SKILL_STATE;
console.log("Loaded: skill_tree_manager.js");