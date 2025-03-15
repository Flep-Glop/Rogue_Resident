// skill_tree_validator.js - Validates skill tree data against schema

const SkillTreeValidator = {
  // Basic validation rules
  rules: {
    // Node validation rules
    node: {
      requiredFields: ['id', 'name', 'tier', 'description', 'effects', 'position', 'connections', 'cost', 'visual'],
      
      fieldValidators: {
        id: (value) => typeof value === 'string' && value.length > 0,
        name: (value) => typeof value === 'string' && value.length > 0,
        tier: (value) => Number.isInteger(value) && value >= 0,
        description: (value) => typeof value === 'string',
        effects: (value) => Array.isArray(value),
        position: (value) => typeof value === 'object' && 'x' in value && 'y' in value,
        connections: (value) => Array.isArray(value),
        cost: (value) => typeof value === 'object' && 'reputation' in value && 'skill_points' in value,
        visual: (value) => typeof value === 'object' && 'size' in value && 'icon' in value
      }
    },
    
    // Effect validation rules
    effect: {
      requiredFields: ['type', 'value'],
      
      validTypes: [
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
      ]
    },
    
    // Specialization validation rules
    specialization: {
      requiredFields: ['id', 'name', 'description', 'color', 'threshold', 'mastery_threshold'],
      
      fieldValidators: {
        id: (value) => typeof value === 'string' && value.length > 0,
        name: (value) => typeof value === 'string' && value.length > 0,
        description: (value) => typeof value === 'string',
        color: (value) => typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value),
        threshold: (value) => Number.isInteger(value) && value >= 0,
        mastery_threshold: (value) => Number.isInteger(value) && value >= 0
      }
    }
  },
  
  /**
   * Validate a complete skill tree
   * @param {Object} skillTreeData - Complete skill tree data with nodes, specializations, etc.
   * @returns {Object} Validation result with success flag and errors array
   */
  validateSkillTree: function(skillTreeData) {
    const errors = [];
    
    // Check required top-level properties
    if (!skillTreeData.tree_version) {
      errors.push('Missing tree_version');
    }
    
    // Validate specializations
    if (!Array.isArray(skillTreeData.specializations)) {
      errors.push('specializations must be an array');
    } else {
      skillTreeData.specializations.forEach((specialization, index) => {
        const specErrors = this.validateSpecialization(specialization);
        if (specErrors.length > 0) {
          errors.push(`Specialization at index ${index} (${specialization.id || 'unknown'}) has errors: ${specErrors.join(', ')}`);
        }
      });
    }
    
    // Validate nodes
    if (!Array.isArray(skillTreeData.nodes)) {
      errors.push('nodes must be an array');
    } else {
      // Create a map of specialization IDs for quick lookup
      const specializationIds = new Set(
        skillTreeData.specializations.map(spec => spec.id)
      );
      
      // Track all node IDs for connection validation
      const nodeIds = new Set();
      
      // First pass: validate each node and collect IDs
      skillTreeData.nodes.forEach((node, index) => {
        const nodeErrors = this.validateNode(node, specializationIds);
        if (nodeErrors.length > 0) {
          errors.push(`Node at index ${index} (${node.id || 'unknown'}) has errors: ${nodeErrors.join(', ')}`);
        }
        
        if (node.id) {
          if (nodeIds.has(node.id)) {
            errors.push(`Duplicate node ID: ${node.id}`);
          } else {
            nodeIds.add(node.id);
          }
        }
      });
      
      // Second pass: validate connections
      skillTreeData.nodes.forEach((node) => {
        if (node.connections) {
          node.connections.forEach((targetId) => {
            if (!nodeIds.has(targetId)) {
              errors.push(`Node ${node.id} connects to non-existent node: ${targetId}`);
            }
          });
        }
      });
    }
    
    // Validate connections (if present separately)
    if (skillTreeData.connections) {
      if (!Array.isArray(skillTreeData.connections)) {
        errors.push('connections must be an array');
      } else {
        // Create a set of node IDs for validation
        const nodeIds = new Set(
          skillTreeData.nodes.map(node => node.id)
        );
        
        skillTreeData.connections.forEach((connection, index) => {
          if (!connection.source) {
            errors.push(`Connection at index ${index} is missing source`);
          } else if (!nodeIds.has(connection.source)) {
            errors.push(`Connection at index ${index} has invalid source: ${connection.source}`);
          }
          
          if (!connection.target) {
            errors.push(`Connection at index ${index} is missing target`);
          } else if (!nodeIds.has(connection.target)) {
            errors.push(`Connection at index ${index} has invalid target: ${connection.target}`);
          }
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },
  
  /**
   * Validate a single node
   * @param {Object} node - Node object to validate
   * @param {Set} validSpecializations - Set of valid specialization IDs
   * @returns {Array} Array of error messages (empty if valid)
   */
  validateNode: function(node, validSpecializations) {
    const errors = [];
    const rules = this.rules.node;
    
    // Check required fields
    rules.requiredFields.forEach(field => {
      if (!(field in node)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Validate field types/values
    Object.entries(rules.fieldValidators).forEach(([field, validator]) => {
      if (field in node) {
        try {
          const isValid = validator(node[field]);
          if (!isValid) {
            errors.push(`Invalid value for ${field}`);
          }
        } catch (error) {
          errors.push(`Error validating ${field}: ${error.message}`);
        }
      }
    });
    
    // Validate specialization reference
    if (node.specialization !== null && 
        node.specialization !== undefined && 
        validSpecializations && 
        !validSpecializations.has(node.specialization)) {
      errors.push(`Invalid specialization: ${node.specialization}`);
    }
    
    // Validate effects
    if (Array.isArray(node.effects)) {
      node.effects.forEach((effect, index) => {
        const effectErrors = this.validateEffect(effect);
        if (effectErrors.length > 0) {
          errors.push(`Effect at index ${index} has errors: ${effectErrors.join(', ')}`);
        }
      });
    }
    
    return errors;
  },
  
  /**
   * Validate a single effect
   * @param {Object} effect - Effect object to validate
   * @returns {Array} Array of error messages (empty if valid)
   */
  validateEffect: function(effect) {
    const errors = [];
    const rules = this.rules.effect;
    
    // Check required fields
    rules.requiredFields.forEach(field => {
      if (!(field in effect)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Validate effect type
    if (effect.type && !rules.validTypes.includes(effect.type)) {
      errors.push(`Invalid effect type: ${effect.type}`);
    }
    
    return errors;
  },
  
  /**
   * Validate a single specialization
   * @param {Object} specialization - Specialization object to validate
   * @returns {Array} Array of error messages (empty if valid)
   */
  validateSpecialization: function(specialization) {
    const errors = [];
    const rules = this.rules.specialization;
    
    // Check required fields
    rules.requiredFields.forEach(field => {
      if (!(field in specialization)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Validate field types/values
    Object.entries(rules.fieldValidators).forEach(([field, validator]) => {
      if (field in specialization) {
        try {
          const isValid = validator(specialization[field]);
          if (!isValid) {
            errors.push(`Invalid value for ${field}`);
          }
        } catch (error) {
          errors.push(`Error validating ${field}: ${error.message}`);
        }
      }
    });
    
    return errors;
  },
  
  /**
   * Check for potential issues that aren't strict errors
   * @param {Object} skillTreeData - Complete skill tree data
   * @returns {Array} Array of warning messages
   */
  getWarnings: function(skillTreeData) {
    const warnings = [];
    
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
      
      // Find nodes that connect to this node
      skillTreeData.nodes.forEach(node => {
        if (node.id && !connectedToNodeIds.has(node.id) && node.id !== 'core_physics') {
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
    
    return warnings;
  }
};

// Export for use
window.SkillTreeValidator = SkillTreeValidator;