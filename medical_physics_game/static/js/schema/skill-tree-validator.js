// enhanced-skill-tree-validator.js - Robust validation for skill tree data

/**
 * Enhanced SkillTreeValidator - Provides comprehensive validation
 * for skill tree data with detailed error reporting and value normalization
 */
const EnhancedSkillTreeValidator = {
  // Schema constants
  SCHEMA: {
    NODE_SIZES: ['core', 'major', 'minor', 'connector'],
    EFFECT_TYPES: [
      'insight_gain_flat',
      'insight_gain_multiplier',
      'patient_outcome_multiplier',
      'equipment_cost_reduction',
      'reveal_parameter',
      'reveal_patient_parameter',
      'critical_insight_multiplier',
      'auto_solve_chance',
      'calibration_success',
      'unlock_dialogue_options',
      'unlock_experimental_treatments',
      'time_cost_reduction',
      'consult_help',
      'adverse_event_reduction',
      'preview_outcomes',
      'malfunction_penalty_reduction',
      'repair_cost_reduction',
      'reveal_equipment_internals',
      'auto_detect_qa_issues',
      'auto_detect_radiation_anomalies',
      'multi_equipment_bonus',
      'temporary_equipment_fix',
      'start_with_items',
      'funding_multiplier',
      'favor_usage',
      'insight_to_reputation_conversion',
      'clinical_to_reputation_conversion',
      'multi_specialization_bonus',
      'companion',
      'specialization_synergy',
      'recall_similar_questions',
      'failure_conversion'
    ],
    NODE_STATES: ['locked', 'unlockable', 'unlocked', 'active']
  },
  
  /**
   * Validate the entire skill tree data structure
   * @param {Object} skillTreeData - Complete skill tree data with nodes, specializations, etc.
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with success flag, errors, warnings, and normalized data
   */
  validateSkillTree: function(skillTreeData, options = {}) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      normalizedData: null
    };
    
    // Handle null/undefined input
    if (!skillTreeData) {
      result.errors.push('Skill tree data is null or undefined');
      return result;
    }
    
    // Handle non-object input
    if (typeof skillTreeData !== 'object') {
      result.errors.push(`Skill tree data must be an object, got ${typeof skillTreeData}`);
      return result;
    }
    
    // Create a deep copy for normalization
    const normalizedData = this._deepClone(skillTreeData);
    
    // Check required top-level properties
    if (!normalizedData.tree_version) {
      result.errors.push('Missing tree_version');
      if (options.addMissingFields) {
        normalizedData.tree_version = "1.0";
        result.warnings.push('Added default tree_version: "1.0"');
      }
    }
    
    // Validate and normalize specializations
    if (!Array.isArray(normalizedData.specializations)) {
      result.errors.push('specializations must be an array');
      if (options.addMissingFields) {
        normalizedData.specializations = [];
        result.warnings.push('Created empty specializations array');
      }
    } else {
      // Process each specialization
      for (let i = 0; i < normalizedData.specializations.length; i++) {
        const specValidation = this.validateSpecialization(normalizedData.specializations[i], options);
        
        // Add validation errors with context
        specValidation.errors.forEach(error => {
          result.errors.push(`Specialization at index ${i} (${normalizedData.specializations[i].id || 'unknown'}): ${error}`);
        });
        
        // Add validation warnings with context
        specValidation.warnings.forEach(warning => {
          result.warnings.push(`Specialization at index ${i} (${normalizedData.specializations[i].id || 'unknown'}): ${warning}`);
        });
        
        // Update normalized data
        if (specValidation.normalizedData) {
          normalizedData.specializations[i] = specValidation.normalizedData;
        }
      }
    }
    
    // Create specialization ID set for node validation
    const specializationIds = new Set(
      normalizedData.specializations.map(spec => spec.id)
    );
    
    // Validate and normalize nodes
    if (!Array.isArray(normalizedData.nodes)) {
      result.errors.push('nodes must be an array');
      if (options.addMissingFields) {
        normalizedData.nodes = [];
        result.warnings.push('Created empty nodes array');
      }
    } else {
      // Track node IDs for duplicate checking
      const nodeIds = new Set();
      
      // Process each node
      for (let i = 0; i < normalizedData.nodes.length; i++) {
        const nodeValidation = this.validateNode(normalizedData.nodes[i], {
          ...options,
          specializationIds,
          existingNodeIds: nodeIds
        });
        
        // Add validation errors with context
        nodeValidation.errors.forEach(error => {
          result.errors.push(`Node at index ${i} (${normalizedData.nodes[i].id || 'unknown'}): ${error}`);
        });
        
        // Add validation warnings with context
        nodeValidation.warnings.forEach(warning => {
          result.warnings.push(`Node at index ${i} (${normalizedData.nodes[i].id || 'unknown'}): ${warning}`);
        });
        
        // Update normalized data
        if (nodeValidation.normalizedData) {
          normalizedData.nodes[i] = nodeValidation.normalizedData;
        }
        
        // Track node ID for duplicate checking
        if (normalizedData.nodes[i].id) {
          nodeIds.add(normalizedData.nodes[i].id);
        }
      }
      
      // Now validate connections between nodes
      this._validateNodeConnections(normalizedData.nodes, result);
    }
    
    // Validate connections array if present
    if (normalizedData.connections) {
      if (!Array.isArray(normalizedData.connections)) {
        result.errors.push('connections must be an array');
        if (options.addMissingFields) {
          normalizedData.connections = [];
          result.warnings.push('Created empty connections array');
        }
      } else {
        // Create a set of node IDs for validation
        const nodeIds = new Set(
          normalizedData.nodes.map(node => node.id)
        );
        
        // Track unique connections for duplicate checking
        const uniqueConnections = new Set();
        
        // Process each connection
        for (let i = 0; i < normalizedData.connections.length; i++) {
          const conn = normalizedData.connections[i];
          
          // Check for required fields
          if (!conn.source) {
            result.errors.push(`Connection at index ${i} is missing source`);
          } else if (!nodeIds.has(conn.source)) {
            result.errors.push(`Connection at index ${i} has invalid source: ${conn.source}`);
          }
          
          if (!conn.target) {
            result.errors.push(`Connection at index ${i} is missing target`);
          } else if (!nodeIds.has(conn.target)) {
            result.errors.push(`Connection at index ${i} has invalid target: ${conn.target}`);
          }
          
          // Check for duplicate connections
          if (conn.source && conn.target) {
            const connKey = `${conn.source}->${conn.target}`;
            if (uniqueConnections.has(connKey)) {
              result.warnings.push(`Duplicate connection from ${conn.source} to ${conn.target}`);
            } else {
              uniqueConnections.add(connKey);
            }
          }
        }
      }
    }
    
    // Check for consistency between nodes.connections and connections array
    if (Array.isArray(normalizedData.nodes) && Array.isArray(normalizedData.connections)) {
      this._validateConnectionConsistency(normalizedData, result);
    }
    
    // Set result properties
    result.valid = result.errors.length === 0;
    result.normalizedData = normalizedData;
    
    return result;
  },
  
  /**
   * Validate a specialization object
   * @param {Object} specialization - Specialization object to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateSpecialization: function(specialization, options = {}) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      normalizedData: null
    };
    
    // Handle null/undefined input
    if (!specialization) {
      result.errors.push('Specialization is null or undefined');
      return result;
    }
    
    // Create a normalized copy
    const normalizedSpec = this._deepClone(specialization);
    
    // Required fields
    const requiredFields = ['id', 'name', 'description', 'color', 'threshold', 'mastery_threshold'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (normalizedSpec[field] === undefined) {
        result.errors.push(`Missing required field: ${field}`);
        
        // Add default values if enabled
        if (options.addMissingFields) {
          switch (field) {
            case 'id':
              normalizedSpec.id = `spec_${Date.now()}`;
              result.warnings.push(`Added generated id: ${normalizedSpec.id}`);
              break;
            case 'name':
              normalizedSpec.name = normalizedSpec.id ? `${normalizedSpec.id} Specialization` : 'New Specialization';
              result.warnings.push(`Added default name: ${normalizedSpec.name}`);
              break;
            case 'description':
              normalizedSpec.description = 'No description provided';
              result.warnings.push(`Added default description`);
              break;
            case 'color':
              normalizedSpec.color = '#888888';
              result.warnings.push(`Added default color: #888888`);
              break;
            case 'threshold':
              normalizedSpec.threshold = 5;
              result.warnings.push(`Added default threshold: 5`);
              break;
            case 'mastery_threshold':
              normalizedSpec.mastery_threshold = 8;
              result.warnings.push(`Added default mastery_threshold: 8`);
              break;
          }
        }
      }
    });
    
    // Validate field types and values
    if (normalizedSpec.id !== undefined) {
      if (typeof normalizedSpec.id !== 'string') {
        result.errors.push(`id must be a string, got ${typeof normalizedSpec.id}`);
      } else if (normalizedSpec.id.trim() === '') {
        result.errors.push('id cannot be empty');
      }
    }
    
    if (normalizedSpec.name !== undefined) {
      if (typeof normalizedSpec.name !== 'string') {
        result.errors.push(`name must be a string, got ${typeof normalizedSpec.name}`);
      } else if (normalizedSpec.name.trim() === '') {
        result.errors.push('name cannot be empty');
      }
    }
    
    if (normalizedSpec.description !== undefined && typeof normalizedSpec.description !== 'string') {
      result.errors.push(`description must be a string, got ${typeof normalizedSpec.description}`);
    }
    
    if (normalizedSpec.color !== undefined) {
      if (typeof normalizedSpec.color !== 'string') {
        result.errors.push(`color must be a string, got ${typeof normalizedSpec.color}`);
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(normalizedSpec.color)) {
        result.errors.push(`color must be a valid hex color code (e.g., #FF5500), got ${normalizedSpec.color}`);
        if (options.fixInvalidValues) {
          normalizedSpec.color = '#888888';
          result.warnings.push(`Fixed invalid color to default: #888888`);
        }
      }
    }
    
    if (normalizedSpec.threshold !== undefined) {
      if (typeof normalizedSpec.threshold !== 'number') {
        result.errors.push(`threshold must be a number, got ${typeof normalizedSpec.threshold}`);
        if (options.fixInvalidValues) {
          normalizedSpec.threshold = 5;
          result.warnings.push(`Fixed invalid threshold to default: 5`);
        }
      } else if (normalizedSpec.threshold < 0) {
        result.errors.push(`threshold cannot be negative, got ${normalizedSpec.threshold}`);
        if (options.fixInvalidValues) {
          normalizedSpec.threshold = 0;
          result.warnings.push(`Fixed negative threshold to 0`);
        }
      }
    }
    
    if (normalizedSpec.mastery_threshold !== undefined) {
      if (typeof normalizedSpec.mastery_threshold !== 'number') {
        result.errors.push(`mastery_threshold must be a number, got ${typeof normalizedSpec.mastery_threshold}`);
        if (options.fixInvalidValues) {
          normalizedSpec.mastery_threshold = 8;
          result.warnings.push(`Fixed invalid mastery_threshold to default: 8`);
        }
      } else if (normalizedSpec.mastery_threshold < 0) {
        result.errors.push(`mastery_threshold cannot be negative, got ${normalizedSpec.mastery_threshold}`);
        if (options.fixInvalidValues) {
          normalizedSpec.mastery_threshold = 0;
          result.warnings.push(`Fixed negative mastery_threshold to 0`);
        }
      }
    }
    
    // Check threshold consistency
    if (typeof normalizedSpec.threshold === 'number' && 
        typeof normalizedSpec.mastery_threshold === 'number' && 
        normalizedSpec.threshold > normalizedSpec.mastery_threshold) {
      result.warnings.push(`threshold (${normalizedSpec.threshold}) is greater than mastery_threshold (${normalizedSpec.mastery_threshold})`);
      if (options.fixInvalidValues) {
        normalizedSpec.mastery_threshold = normalizedSpec.threshold + 3;
        result.warnings.push(`Fixed mastery_threshold to ${normalizedSpec.mastery_threshold}`);
      }
    }
    
    // Set result properties
    result.valid = result.errors.length === 0;
    result.normalizedData = normalizedSpec;
    
    return result;
  },
  
  /**
   * Validate a node object
   * @param {Object} node - Node object to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateNode: function(node, options = {}) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      normalizedData: null
    };
    
    // Handle null/undefined input
    if (!node) {
      result.errors.push('Node is null or undefined');
      return result;
    }
    
    // Create a normalized copy
    const normalizedNode = this._deepClone(node);
    
    // Required fields
    const requiredFields = [
      'id', 'name', 'tier', 'description', 'effects', 'position', 'connections', 'cost', 'visual'
    ];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (normalizedNode[field] === undefined) {
        result.errors.push(`Missing required field: ${field}`);
        
        // Add default values if enabled
        if (options.addMissingFields) {
          switch (field) {
            case 'id':
              normalizedNode.id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
              result.warnings.push(`Added generated id: ${normalizedNode.id}`);
              break;
            case 'name':
              normalizedNode.name = normalizedNode.id ? `${normalizedNode.id} Node` : 'New Node';
              result.warnings.push(`Added default name: ${normalizedNode.name}`);
              break;
            case 'tier':
              normalizedNode.tier = 1;
              result.warnings.push(`Added default tier: 1`);
              break;
            case 'description':
              normalizedNode.description = 'No description provided';
              result.warnings.push(`Added default description`);
              break;
            case 'effects':
              normalizedNode.effects = [];
              result.warnings.push(`Added empty effects array`);
              break;
            case 'position':
              normalizedNode.position = { x: 0, y: 0 };
              result.warnings.push(`Added default position: {x: 0, y: 0}`);
              break;
            case 'connections':
              normalizedNode.connections = [];
              result.warnings.push(`Added empty connections array`);
              break;
            case 'cost':
              normalizedNode.cost = { reputation: 10, skill_points: 1 };
              result.warnings.push(`Added default cost: {reputation: 10, skill_points: 1}`);
              break;
            case 'visual':
              normalizedNode.visual = { size: 'minor', icon: 'help' };
              result.warnings.push(`Added default visual: {size: 'minor', icon: 'help'}`);
              break;
          }
        }
      }
    });
    
    // Check if ID already exists
    if (normalizedNode.id && options.existingNodeIds && 
        options.existingNodeIds.has(normalizedNode.id) && 
        !options.isUpdate) {
      result.errors.push(`Duplicate node ID: ${normalizedNode.id}`);
      if (options.fixInvalidValues) {
        normalizedNode.id = `${normalizedNode.id}_${Date.now()}`;
        result.warnings.push(`Fixed duplicate ID to: ${normalizedNode.id}`);
      }
    }
    
    // Validate field types and values
    if (normalizedNode.id !== undefined) {
      if (typeof normalizedNode.id !== 'string') {
        result.errors.push(`id must be a string, got ${typeof normalizedNode.id}`);
      } else if (normalizedNode.id.trim() === '') {
        result.errors.push('id cannot be empty');
      }
    }
    
    if (normalizedNode.name !== undefined) {
      if (typeof normalizedNode.name !== 'string') {
        result.errors.push(`name must be a string, got ${typeof normalizedNode.name}`);
      } else if (normalizedNode.name.trim() === '') {
        result.errors.push('name cannot be empty');
      }
    }
    
    if (normalizedNode.tier !== undefined) {
      if (typeof normalizedNode.tier !== 'number') {
        result.errors.push(`tier must be a number, got ${typeof normalizedNode.tier}`);
        if (options.fixInvalidValues) {
          normalizedNode.tier = 1;
          result.warnings.push(`Fixed invalid tier to default: 1`);
        }
      } else if (normalizedNode.tier < 0) {
        result.errors.push(`tier cannot be negative, got ${normalizedNode.tier}`);
        if (options.fixInvalidValues) {
          normalizedNode.tier = 0;
          result.warnings.push(`Fixed negative tier to 0`);
        }
      }
    }
    
    if (normalizedNode.description !== undefined && typeof normalizedNode.description !== 'string') {
      result.errors.push(`description must be a string, got ${typeof normalizedNode.description}`);
      if (options.fixInvalidValues) {
        normalizedNode.description = 'No description provided';
        result.warnings.push(`Fixed invalid description to default`);
      }
    }
    
    // Validate specialization reference
    if (normalizedNode.specialization !== undefined && 
        normalizedNode.specialization !== null) {
      if (typeof normalizedNode.specialization !== 'string') {
        result.errors.push(`specialization must be a string or null, got ${typeof normalizedNode.specialization}`);
        if (options.fixInvalidValues) {
          normalizedNode.specialization = null;
          result.warnings.push(`Fixed invalid specialization to null`);
        }
      } else if (options.specializationIds && 
                !options.specializationIds.has(normalizedNode.specialization)) {
        result.errors.push(`specialization references unknown specialization: ${normalizedNode.specialization}`);
        if (options.fixInvalidValues) {
          normalizedNode.specialization = null;
          result.warnings.push(`Fixed invalid specialization reference to null`);
        }
      }
    }
    
    // Validate effects
    if (normalizedNode.effects !== undefined) {
      if (!Array.isArray(normalizedNode.effects)) {
        result.errors.push(`effects must be an array, got ${typeof normalizedNode.effects}`);
        if (options.fixInvalidValues) {
          normalizedNode.effects = [];
          result.warnings.push(`Fixed invalid effects to empty array`);
        }
      } else {
        // Validate each effect
        for (let i = 0; i < normalizedNode.effects.length; i++) {
          const effectValidation = this.validateEffect(normalizedNode.effects[i], options);
          
          // Add validation errors with context
          effectValidation.errors.forEach(error => {
            result.errors.push(`effect[${i}]: ${error}`);
          });
          
          // Add validation warnings with context
          effectValidation.warnings.forEach(warning => {
            result.warnings.push(`effect[${i}]: ${warning}`);
          });
          
          // Update normalized data
          if (effectValidation.normalizedData) {
            normalizedNode.effects[i] = effectValidation.normalizedData;
          }
        }
      }
    }
    
    // Validate position
    if (normalizedNode.position !== undefined) {
      if (typeof normalizedNode.position !== 'object' || normalizedNode.position === null) {
        result.errors.push(`position must be an object, got ${typeof normalizedNode.position}`);
        if (options.fixInvalidValues) {
          normalizedNode.position = { x: 0, y: 0 };
          result.warnings.push(`Fixed invalid position to default: {x: 0, y: 0}`);
        }
      } else {
        // Check x and y coordinates
        if (normalizedNode.position.x === undefined) {
          result.errors.push('position is missing x coordinate');
          if (options.fixInvalidValues) {
            normalizedNode.position.x = 0;
            result.warnings.push(`Added default x coordinate: 0`);
          }
        } else if (typeof normalizedNode.position.x !== 'number') {
          result.errors.push(`position.x must be a number, got ${typeof normalizedNode.position.x}`);
          if (options.fixInvalidValues) {
            normalizedNode.position.x = 0;
            result.warnings.push(`Fixed invalid x coordinate to default: 0`);
          }
        }
        
        if (normalizedNode.position.y === undefined) {
          result.errors.push('position is missing y coordinate');
          if (options.fixInvalidValues) {
            normalizedNode.position.y = 0;
            result.warnings.push(`Added default y coordinate: 0`);
          }
        } else if (typeof normalizedNode.position.y !== 'number') {
          result.errors.push(`position.y must be a number, got ${typeof normalizedNode.position.y}`);
          if (options.fixInvalidValues) {
            normalizedNode.position.y = 0;
            result.warnings.push(`Fixed invalid y coordinate to default: 0`);
          }
        }
      }
    }
    
    // Validate connections
    if (normalizedNode.connections !== undefined) {
      if (!Array.isArray(normalizedNode.connections)) {
        result.errors.push(`connections must be an array, got ${typeof normalizedNode.connections}`);
        if (options.fixInvalidValues) {
          normalizedNode.connections = [];
          result.warnings.push(`Fixed invalid connections to empty array`);
        }
      }
      // Note: We validate the actual connection targets in a separate pass
    }
    
    // Validate cost
    if (normalizedNode.cost !== undefined) {
      if (typeof normalizedNode.cost !== 'object' || normalizedNode.cost === null) {
        result.errors.push(`cost must be an object, got ${typeof normalizedNode.cost}`);
        if (options.fixInvalidValues) {
          normalizedNode.cost = { reputation: 10, skill_points: 1 };
          result.warnings.push(`Fixed invalid cost to default: {reputation: 10, skill_points: 1}`);
        }
      } else {
        // Check reputation cost
        if (normalizedNode.cost.reputation === undefined) {
          result.errors.push('cost is missing reputation field');
          if (options.fixInvalidValues) {
            normalizedNode.cost.reputation = 10;
            result.warnings.push(`Added default reputation cost: 10`);
          }
        } else if (typeof normalizedNode.cost.reputation !== 'number') {
          result.errors.push(`cost.reputation must be a number, got ${typeof normalizedNode.cost.reputation}`);
          if (options.fixInvalidValues) {
            normalizedNode.cost.reputation = 10;
            result.warnings.push(`Fixed invalid reputation cost to default: 10`);
          }
        } else if (normalizedNode.cost.reputation < 0) {
          result.errors.push(`cost.reputation cannot be negative, got ${normalizedNode.cost.reputation}`);
          if (options.fixInvalidValues) {
            normalizedNode.cost.reputation = 0;
            result.warnings.push(`Fixed negative reputation cost to 0`);
          }
        }
        
        // Check skill points cost
        if (normalizedNode.cost.skill_points === undefined) {
          result.errors.push('cost is missing skill_points field');
          if (options.fixInvalidValues) {
            normalizedNode.cost.skill_points = 1;
            result.warnings.push(`Added default skill points cost: 1`);
          }
        } else if (typeof normalizedNode.cost.skill_points !== 'number') {
          result.errors.push(`cost.skill_points must be a number, got ${typeof normalizedNode.cost.skill_points}`);
          if (options.fixInvalidValues) {
            normalizedNode.cost.skill_points = 1;
            result.warnings.push(`Fixed invalid skill points cost to default: 1`);
          }
        } else if (normalizedNode.cost.skill_points < 0) {
          result.errors.push(`cost.skill_points cannot be negative, got ${normalizedNode.cost.skill_points}`);
          if (options.fixInvalidValues) {
            normalizedNode.cost.skill_points = 0;
            result.warnings.push(`Fixed negative skill points cost to 0`);
          }
        }
      }
    }
    
    // Validate visual
    if (normalizedNode.visual !== undefined) {
      if (typeof normalizedNode.visual !== 'object' || normalizedNode.visual === null) {
        result.errors.push(`visual must be an object, got ${typeof normalizedNode.visual}`);
        if (options.fixInvalidValues) {
          normalizedNode.visual = { size: 'minor', icon: 'help' };
          result.warnings.push(`Fixed invalid visual to default: {size: 'minor', icon: 'help'}`);
        }
      } else {
        // Check size
        if (normalizedNode.visual.size === undefined) {
          result.errors.push('visual is missing size field');
          if (options.fixInvalidValues) {
            normalizedNode.visual.size = 'minor';
            result.warnings.push(`Added default size: 'minor'`);
          }
        } else if (typeof normalizedNode.visual.size !== 'string') {
          result.errors.push(`visual.size must be a string, got ${typeof normalizedNode.visual.size}`);
          if (options.fixInvalidValues) {
            normalizedNode.visual.size = 'minor';
            result.warnings.push(`Fixed invalid size to default: 'minor'`);
          }
        } else if (!this.SCHEMA.NODE_SIZES.includes(normalizedNode.visual.size)) {
          result.errors.push(`visual.size must be one of [${this.SCHEMA.NODE_SIZES.join(', ')}], got '${normalizedNode.visual.size}'`);
          if (options.fixInvalidValues) {
            normalizedNode.visual.size = 'minor';
            result.warnings.push(`Fixed invalid size to default: 'minor'`);
          }
        }
        
        // Check icon
        if (normalizedNode.visual.icon === undefined) {
          result.errors.push('visual is missing icon field');
          if (options.fixInvalidValues) {
            normalizedNode.visual.icon = 'help';
            result.warnings.push(`Added default icon: 'help'`);
          }
        } else if (typeof normalizedNode.visual.icon !== 'string') {
          result.errors.push(`visual.icon must be a string, got ${typeof normalizedNode.visual.icon}`);
          if (options.fixInvalidValues) {
            normalizedNode.visual.icon = 'help';
            result.warnings.push(`Fixed invalid icon to default: 'help'`);
          }
        }
      }
    }
    
    // Validate state if present
    if (normalizedNode.state !== undefined) {
      if (typeof normalizedNode.state !== 'string') {
        result.errors.push(`state must be a string, got ${typeof normalizedNode.state}`);
        if (options.fixInvalidValues) {
          normalizedNode.state = 'locked';
          result.warnings.push(`Fixed invalid state to default: 'locked'`);
        }
      } else if (!this.SCHEMA.NODE_STATES.includes(normalizedNode.state)) {
        result.errors.push(`state must be one of [${this.SCHEMA.NODE_STATES.join(', ')}], got '${normalizedNode.state}'`);
        if (options.fixInvalidValues) {
          normalizedNode.state = 'locked';
          result.warnings.push(`Fixed invalid state to default: 'locked'`);
        }
      }
    }
    
    // Set result properties
    result.valid = result.errors.length === 0;
    result.normalizedData = normalizedNode;
    
    return result;
  },
  
  /**
   * Validate an effect object
   * @param {Object} effect - Effect object to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateEffect: function(effect, options = {}) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      normalizedData: null
    };
    
    // Handle null/undefined input
    if (!effect) {
      result.errors.push('Effect is null or undefined');
      return result;
    }
    
    // Create a normalized copy
    const normalizedEffect = this._deepClone(effect);
    
    // Required fields
    const requiredFields = ['type', 'value'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (normalizedEffect[field] === undefined) {
        result.errors.push(`Missing required field: ${field}`);
        
        // Add default values if enabled
        if (options.addMissingFields) {
          switch (field) {
            case 'type':
              normalizedEffect.type = 'insight_gain_flat';
              result.warnings.push(`Added default type: 'insight_gain_flat'`);
              break;
            case 'value':
              normalizedEffect.value = 1;
              result.warnings.push(`Added default value: 1`);
              break;
          }
        }
      }
    });
    
    // Validate effect type
    if (normalizedEffect.type !== undefined) {
      if (typeof normalizedEffect.type !== 'string') {
        result.errors.push(`type must be a string, got ${typeof normalizedEffect.type}`);
        if (options.fixInvalidValues) {
          normalizedEffect.type = 'insight_gain_flat';
          result.warnings.push(`Fixed invalid type to default: 'insight_gain_flat'`);
        }
      } else if (!this.SCHEMA.EFFECT_TYPES.includes(normalizedEffect.type)) {
        result.errors.push(`type must be one of the valid effect types, got '${normalizedEffect.type}'`);
        if (options.fixInvalidValues) {
          normalizedEffect.type = 'insight_gain_flat';
          result.warnings.push(`Fixed invalid type to default: 'insight_gain_flat'`);
        }
      }
    }
    
    // Validate effect value based on type
    if (normalizedEffect.type && normalizedEffect.value !== undefined) {
      const expectedType = this._getExpectedValueType(normalizedEffect.type);
      const actualType = typeof normalizedEffect.value;
      
      if (expectedType !== 'any' && actualType !== expectedType) {
        result.errors.push(`value for effect type '${normalizedEffect.type}' should be a ${expectedType}, got ${actualType}`);
        
        if (options.fixInvalidValues) {
          // Set appropriate default value based on effect type
          normalizedEffect.value = this._getDefaultValue(normalizedEffect.type);
          result.warnings.push(`Fixed invalid value to default: ${JSON.stringify(normalizedEffect.value)}`);
        }
      }
      
      // Additional validation for specific effect types
      if (expectedType === 'number' && actualType === 'number') {
        // For multiplier effects, ensure value is positive
        if (normalizedEffect.type.includes('_multiplier') && normalizedEffect.value <= 0) {
          result.errors.push(`value for multiplier effect must be positive, got ${normalizedEffect.value}`);
          if (options.fixInvalidValues) {
            normalizedEffect.value = 1.1;  // 10% increase
            result.warnings.push(`Fixed non-positive multiplier to default: 1.1`);
          }
        }
        
        // For chance effects, ensure value is between 0 and 1
        if (normalizedEffect.type.includes('_chance') && (normalizedEffect.value < 0 || normalizedEffect.value > 1)) {
          result.errors.push(`value for chance effect must be between 0 and 1, got ${normalizedEffect.value}`);
          if (options.fixInvalidValues) {
            normalizedEffect.value = Math.max(0, Math.min(1, normalizedEffect.value));
            result.warnings.push(`Clamped chance value to: ${normalizedEffect.value}`);
          }
        }
      }
    }
    
    // Validate condition if present
    if (normalizedEffect.condition !== undefined && 
        normalizedEffect.condition !== null && 
        typeof normalizedEffect.condition !== 'string') {
      result.errors.push(`condition must be a string or null, got ${typeof normalizedEffect.condition}`);
      if (options.fixInvalidValues) {
        normalizedEffect.condition = null;
        result.warnings.push(`Fixed invalid condition to null`);
      }
    }
    
    // Set result properties
    result.valid = result.errors.length === 0;
    result.normalizedData = normalizedEffect;
    
    return result;
  },
  
  /**
   * Get additional warnings about potential issues that aren't strict errors
   * @param {Object} skillTreeData - Complete skill tree data
   * @returns {Array} Array of warning messages
   */
  getWarnings: function(skillTreeData) {
    const warnings = [];
    
    // Skip if input is invalid
    if (!skillTreeData || typeof skillTreeData !== 'object') {
      return warnings;
    }
    
    // Check for orphaned nodes (not connected to anything)
    if (Array.isArray(skillTreeData.nodes)) {
      const nodeIds = new Set();
      const connectedToNodeIds = new Set();
      
      // Collect all node IDs
      skillTreeData.nodes.forEach(node => {
        if (node.id) nodeIds.add(node.id);
      });
      
      // Collect all connected node IDs
      skillTreeData.nodes.forEach(node => {
        if (Array.isArray(node.connections)) {
          node.connections.forEach(targetId => {
            connectedToNodeIds.add(targetId);
          });
        }
      });
      
      // Alternative connections array
      if (Array.isArray(skillTreeData.connections)) {
        skillTreeData.connections.forEach(conn => {
          if (conn.target) connectedToNodeIds.add(conn.target);
        });
      }
      
      // Find nodes that aren't connected to by any other node
      // Exclude tier 0 nodes (usually core/starter nodes)
      skillTreeData.nodes.forEach(node => {
        if (node.id && 
            !connectedToNodeIds.has(node.id) && 
            node.tier !== 0 && 
            node.id !== 'core_physics') {
          warnings.push(`Node ${node.id} may be orphaned (nothing connects to it)`);
        }
      });
    }
    
    // Check for duplicate node positions
    if (Array.isArray(skillTreeData.nodes)) {
      const positions = new Map();
      
      skillTreeData.nodes.forEach(node => {
        if (node.position) {
          const posKey = `${node.position.x},${node.position.y}`;
          if (positions.has(posKey)) {
            warnings.push(`Node ${node.id} has the same position as ${positions.get(posKey)}`);
          } else {
            positions.set(posKey, node.id);
          }
        }
      });
    }
    
    // Check for very high costs
    if (Array.isArray(skillTreeData.nodes)) {
      skillTreeData.nodes.forEach(node => {
        if (node.cost) {
          if (node.cost.reputation > 50) {
            warnings.push(`Node ${node.id} has a very high reputation cost: ${node.cost.reputation}`);
          }
          if (node.cost.skill_points > 10) {
            warnings.push(`Node ${node.id} has a very high skill point cost: ${node.cost.skill_points}`);
          }
        }
      });
    }
    
    // Check for nodes with many connections
    if (Array.isArray(skillTreeData.nodes)) {
      skillTreeData.nodes.forEach(node => {
        if (Array.isArray(node.connections) && node.connections.length > 5) {
          warnings.push(`Node ${node.id} connects to many nodes (${node.connections.length}), which may affect visualization`);
        }
      });
    }
    
    // Check for specializations with no nodes
    if (Array.isArray(skillTreeData.specializations) && Array.isArray(skillTreeData.nodes)) {
      const specializationCounts = {};
      
      // Initialize counts
      skillTreeData.specializations.forEach(spec => {
        if (spec.id) specializationCounts[spec.id] = 0;
      });
      
      // Count nodes per specialization
      skillTreeData.nodes.forEach(node => {
        if (node.specialization && specializationCounts[node.specialization] !== undefined) {
          specializationCounts[node.specialization]++;
        }
      });
      
      // Check for empty specializations
      Object.entries(specializationCounts).forEach(([specId, count]) => {
        if (count === 0) {
          warnings.push(`Specialization ${specId} has no nodes assigned to it`);
        }
      });
    }
    
    return warnings;
  },
  
  // PRIVATE HELPER METHODS
  
  /**
   * Validate connections between nodes
   * @private
   * @param {Array} nodes - Array of node objects
   * @param {Object} result - Result object to update with errors/warnings
   */
  _validateNodeConnections: function(nodes, result) {
    if (!Array.isArray(nodes)) return;
    
    // Create a set of all node IDs for validation
    const nodeIds = new Set(nodes.map(node => node.id).filter(Boolean));
    
    // Validate connections for each node
    nodes.forEach((node, index) => {
      if (!node.connections || !Array.isArray(node.connections)) return;
      
      // Check each connection
      node.connections.forEach(targetId => {
        if (!nodeIds.has(targetId)) {
          result.errors.push(`Node at index ${index} (${node.id || 'unknown'}) connects to non-existent node: ${targetId}`);
        }
      });
      
      // Check for self-connections
      if (node.connections.includes(node.id)) {
        result.warnings.push(`Node ${node.id} connects to itself, which may cause issues`);
      }
      
      // Check for duplicate connections in array
      const uniqueConnections = new Set();
      node.connections.forEach(targetId => {
        if (uniqueConnections.has(targetId)) {
          result.warnings.push(`Node ${node.id} has duplicate connection to ${targetId}`);
        } else {
          uniqueConnections.add(targetId);
        }
      });
    });
  },
  
  /**
   * Validate consistency between nodes.connections and connections array
   * @private
   * @param {Object} data - Skill tree data
   * @param {Object} result - Result object to update with errors/warnings
   */
  _validateConnectionConsistency: function(data, result) {
    if (!Array.isArray(data.nodes) || !Array.isArray(data.connections)) return;
    
    // Create a map of connections from the connections array
    const connectionMap = new Map();
    data.connections.forEach(conn => {
      if (conn.source && conn.target) {
        const key = `${conn.source}->${conn.target}`;
        connectionMap.set(key, true);
      }
    });
    
    // Check if all node.connections entries are in the connections array
    data.nodes.forEach(node => {
      if (!node.id || !Array.isArray(node.connections)) return;
      
      node.connections.forEach(targetId => {
        const key = `${node.id}->${targetId}`;
        if (!connectionMap.has(key)) {
          result.warnings.push(`Node ${node.id} has connection to ${targetId} in connections property but not in connections array`);
        }
      });
    });
    
    // Check if all connections array entries are in node.connections
    data.connections.forEach(conn => {
      if (!conn.source || !conn.target) return;
      
      // Find source node
      const sourceNode = data.nodes.find(node => node.id === conn.source);
      if (sourceNode) {
        // Check if connection exists in node's connections array
        if (!Array.isArray(sourceNode.connections) || !sourceNode.connections.includes(conn.target)) {
          result.warnings.push(`Connection from ${conn.source} to ${conn.target} exists in connections array but not in source node's connections property`);
        }
      }
    });
  },
  
  /**
   * Get the expected value type for a given effect type
   * @private
   * @param {String} effectType - Effect type
   * @returns {String} Expected value type ('number', 'boolean', 'string', 'object', or 'any')
   */
  _getExpectedValueType: function(effectType) {
    // Default to 'any' if effect type is unknown
    if (!effectType || !this.SCHEMA.EFFECT_TYPES.includes(effectType)) {
      return 'any';
    }
    
    // Map effect types to expected value types
    const numberValueEffects = [
      'insight_gain_flat',
      'insight_gain_multiplier',
      'patient_outcome_multiplier',
      'equipment_cost_reduction',
      'critical_insight_multiplier',
      'auto_solve_chance',
      'calibration_success',
      'time_cost_reduction',
      'adverse_event_reduction',
      'malfunction_penalty_reduction',
      'repair_cost_reduction',
      'multi_equipment_bonus',
      'funding_multiplier',
      'insight_to_reputation_conversion',
      'clinical_to_reputation_conversion',
      'multi_specialization_bonus',
      'failure_conversion'
    ];
    
    const integerValueEffects = [
      'reveal_parameter',
      'reveal_patient_parameter',
      'consult_help',
      'favor_usage'
    ];
    
    const booleanValueEffects = [
      'unlock_dialogue_options',
      'unlock_experimental_treatments',
      'preview_outcomes',
      'reveal_equipment_internals',
      'auto_detect_qa_issues',
      'auto_detect_radiation_anomalies',
      'temporary_equipment_fix',
      'recall_similar_questions'
    ];
    
    const stringValueEffects = [
      'companion'
    ];
    
    const objectValueEffects = [
      'start_with_items',
      'specialization_synergy'
    ];
    
    if (numberValueEffects.includes(effectType)) {
      return 'number';
    } else if (integerValueEffects.includes(effectType)) {
      return 'number';  // Integers are still of type 'number' in JS
    } else if (booleanValueEffects.includes(effectType)) {
      return 'boolean';
    } else if (stringValueEffects.includes(effectType)) {
      return 'string';
    } else if (objectValueEffects.includes(effectType)) {
      return 'object';
    }
    
    return 'any';
  },
  
  /**
   * Get a default value for a given effect type
   * @private
   * @param {String} effectType - Effect type
   * @returns {*} Default value appropriate for the effect type
   */
  _getDefaultValue: function(effectType) {
    // Default values for different effect types
    switch (effectType) {
      // Flat bonus effects
      case 'insight_gain_flat':
        return 5;
        
      // Multiplier effects (percentage increase)
      case 'insight_gain_multiplier':
      case 'patient_outcome_multiplier':
      case 'funding_multiplier':
        return 1.15;  // 15% increase
        
      // Reduction effects (percentage decrease)
      case 'equipment_cost_reduction':
      case 'time_cost_reduction':
      case 'adverse_event_reduction':
      case 'malfunction_penalty_reduction':
      case 'repair_cost_reduction':
        return 0.2;  // 20% reduction
        
      // Chance-based effects
      case 'auto_solve_chance':
      case 'calibration_success':
        return 0.25;  // 25% chance
        
      // Boolean effects
      case 'unlock_dialogue_options':
      case 'unlock_experimental_treatments':
      case 'preview_outcomes':
      case 'reveal_equipment_internals':
      case 'auto_detect_qa_issues':
      case 'auto_detect_radiation_anomalies':
      case 'temporary_equipment_fix':
      case 'recall_similar_questions':
        return true;
      
      // Integer effects
      case 'reveal_parameter':
      case 'reveal_patient_parameter':
      case 'consult_help':
      case 'favor_usage':
        return 1;
        
      // Object effects
      case 'start_with_items':
        return {
          item_type: 'research_paper',
          count: 1
        };
        
      case 'specialization_synergy':
        return {
          theory_boost: 0.1,
          clinical_boost: 0.1
        };
        
      // String effects
      case 'companion':
        return 'research_assistant';
        
      // Conversion effects
      case 'insight_to_reputation_conversion':
      case 'clinical_to_reputation_conversion':
      case 'multi_specialization_bonus':
      case 'failure_conversion':
        return 0.1;  // 10% conversion rate
        
      // Default fallback
      default:
        return 1;
    }
  },
  
  /**
   * Create a deep copy of an object
   * @private
   * @param {*} obj - Object to clone
   * @returns {*} Deep clone of the object
   */
  _deepClone: function(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      console.error('Deep clone failed:', e);
      return structuredClone ? structuredClone(obj) : { ...obj };
    }
  }
};

// Export for use in module environments if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedSkillTreeValidator;
}

// Globally expose the enhanced validator
window.EnhancedSkillTreeValidator = EnhancedSkillTreeValidator;