// frontend/src/systems/skill_tree/skill_effect_system.js

/**
 * SkillEffectSystem - Manages and applies the effects of activated skills
 */
class SkillEffectSystem {
    // Configuration
    config = {
      debug: false
    };
    
    // State
    state = {
      initialized: false,
      activeEffects: [],
      calculatedBonuses: {
        insightGain: 1.0,
        patientOutcome: 1.0,
        equipmentCost: 1.0,
        criticalInsight: 1.0,
        revealParameters: 0,
        autoSolveChance: 0
      }
    };
    
    /**
     * Initialize the effect system
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
      if (this.state.initialized) {
        console.log("SkillEffectSystem already initialized");
        return this;
      }
      
      // Apply options
      Object.assign(this.config, options);
      
      // Register for events
      this._registerEventListeners();
      
      // Mark as initialized
      this.state.initialized = true;
      console.log("SkillEffectSystem initialized");
      
      return this;
    }
    
    /**
     * Register event listeners
     * @private
     */
    _registerEventListeners() {
      // Listen for skill activation
      document.addEventListener('skillActivated', this._handleSkillActivation.bind(this));
      
      // Listen for skill deactivation
      document.addEventListener('skillDeactivated', this._handleSkillDeactivation.bind(this));
      
      // Listen for run start (reset effects)
      document.addEventListener('runStarted', this._resetActiveEffects.bind(this));
    }
    
    /**
     * Handle skill activation
     * @private
     * @param {CustomEvent} event - Skill activation event
     */
    _handleSkillActivation(event) {
      const { skill } = event.detail;
      if (!skill) return;
      
      this.applySkillEffects(skill);
    }
    
    /**
     * Handle skill deactivation
     * @private
     * @param {CustomEvent} event - Skill deactivation event
     */
    _handleSkillDeactivation(event) {
      const { skill } = event.detail;
      if (!skill) return;
      
      this.removeSkillEffects(skill);
    }
    
    /**
     * Reset active effects
     * @private
     */
    _resetActiveEffects() {
      this.state.activeEffects = [];
      this._recalculateBonuses();
      
      if (this.config.debug) {
        console.log("Reset all skill effects");
      }
    }
    
    /**
     * Apply effects from a skill
     * @param {Object} skill - Skill data
     */
    applySkillEffects(skill) {
      if (!skill || !skill.effects) return;
      
      // For each effect in the skill
      skill.effects.forEach(effect => {
        // Create active effect entry
        const activeEffect = {
          id: `${skill.id}_${effect.type}_${Date.now()}`,
          skillId: skill.id,
          skillName: skill.name,
          type: effect.type,
          value: effect.value,
          condition: effect.condition
        };
        
        // Add to active effects
        this.state.activeEffects.push(activeEffect);
        
        if (this.config.debug) {
          console.log(`Applied skill effect: ${effect.type} from ${skill.name}`);
        }
      });
      
      // Recalculate all bonuses
      this._recalculateBonuses();
      
      // Emit event for effect changes
      this._emitEffectChanges();
    }
    
    /**
     * Remove effects from a skill
     * @param {Object} skill - Skill data
     */
    removeSkillEffects(skill) {
      if (!skill) return;
      
      // Remove all effects from this skill
      const initialCount = this.state.activeEffects.length;
      this.state.activeEffects = this.state.activeEffects.filter(effect => effect.skillId !== skill.id);
      
      if (initialCount !== this.state.activeEffects.length) {
        // Recalculate all bonuses
        this._recalculateBonuses();
        
        // Emit event for effect changes
        this._emitEffectChanges();
        
        if (this.config.debug) {
          console.log(`Removed effects from skill: ${skill.name}`);
        }
      }
    }
    
    /**
     * Recalculate all bonuses from active effects
     * @private
     */
    _recalculateBonuses() {
      // Reset calculated bonuses to defaults
      this.state.calculatedBonuses = {
        insightGain: 1.0,
        patientOutcome: 1.0,
        equipmentCost: 1.0,
        criticalInsight: 1.0,
        revealParameters: 0,
        autoSolveChance: 0
      };
      
      // Apply effects
      this.state.activeEffects.forEach(effect => {
        switch (effect.type) {
          case 'insight_gain_flat':
            // Store as flat bonuses separately
            this.state.calculatedBonuses.insightGainFlat = 
              (this.state.calculatedBonuses.insightGainFlat || 0) + effect.value;
            break;
            
          case 'insight_gain_multiplier':
            // Multiplicative stacking
            this.state.calculatedBonuses.insightGain *= effect.value;
            break;
            
          case 'patient_outcome_multiplier':
            // Multiplicative stacking
            this.state.calculatedBonuses.patientOutcome *= effect.value;
            break;
            
          case 'equipment_cost_reduction':
            // Additive stacking (capped at 90%)
            this.state.calculatedBonuses.equipmentCost = 
              Math.max(0.1, this.state.calculatedBonuses.equipmentCost - effect.value);
            break;
            
          case 'critical_insight_multiplier':
            // Take highest value
            this.state.calculatedBonuses.criticalInsight = 
              Math.max(this.state.calculatedBonuses.criticalInsight, effect.value);
            break;
            
          case 'reveal_parameter':
            // Additive stacking
            this.state.calculatedBonuses.revealParameters += 
              typeof effect.value === 'number' ? effect.value : 1;
            break;
            
          case 'auto_solve_chance':
            // Additive stacking (capped at 80%)
            this.state.calculatedBonuses.autoSolveChance = 
              Math.min(0.8, (this.state.calculatedBonuses.autoSolveChance || 0) + effect.value);
            break;
            
          case 'failure_conversion':
            // Take highest value
            this.state.calculatedBonuses.failureConversion = 
              Math.max(this.state.calculatedBonuses.failureConversion || 0, effect.value);
            break;
            
          case 'recall_similar_questions':
            // Boolean flag
            this.state.calculatedBonuses.recallSimilarQuestions = true;
            break;
            
          // Add additional effect types here
        }
      });
      
      if (this.config.debug) {
        console.log("Recalculated bonuses:", this.state.calculatedBonuses);
      }
    }
    
    /**
     * Emit event for effect changes
     * @private
     */
    _emitEffectChanges() {
      const event = new CustomEvent('skillEffectsChanged', {
        detail: {
          activeEffects: this.state.activeEffects,
          calculatedBonuses: this.state.calculatedBonuses
        }
      });
      
      document.dispatchEvent(event);
    }
    
    /**
     * Get the current value of a specific bonus
     * @param {String} bonusType - Type of bonus to get
     * @param {Object} context - Optional context for conditional bonuses
     * @returns {Number|Boolean} Bonus value
     */
    getBonus(bonusType, context = {}) {
      switch (bonusType) {
        case 'insightGain':
          return this._calculateConditionalBonus('insight_gain_multiplier', context, this.state.calculatedBonuses.insightGain);
          
        case 'insightGainFlat':
          return this._calculateConditionalBonus('insight_gain_flat', context, this.state.calculatedBonuses.insightGainFlat || 0);
          
        case 'patientOutcome':
          return this._calculateConditionalBonus('patient_outcome_multiplier', context, this.state.calculatedBonuses.patientOutcome);
          
        case 'equipmentCost':
          return this._calculateConditionalBonus('equipment_cost_reduction', context, this.state.calculatedBonuses.equipmentCost);
          
        case 'criticalInsight':
          return this._calculateConditionalBonus('critical_insight_multiplier', context, this.state.calculatedBonuses.criticalInsight);
          
        case 'revealParameters':
          return this.state.calculatedBonuses.revealParameters || 0;
          
        case 'autoSolveChance':
          return this._calculateConditionalBonus('auto_solve_chance', context, this.state.calculatedBonuses.autoSolveChance || 0);
          
        case 'failureConversion':
          return this.state.calculatedBonuses.failureConversion || 0;
          
        case 'recallSimilarQuestions':
          return this.state.calculatedBonuses.recallSimilarQuestions || false;
          
        default:
          return 0;
      }
    }
    
    /**
     * Calculate bonus considering conditions
     * @private
     * @param {String} effectType - Type of effect
     * @param {Object} context - Context for conditions
     * @param {Number} defaultValue - Default value if no conditions apply
     * @returns {Number} Calculated bonus
     */
    _calculateConditionalBonus(effectType, context, defaultValue) {
      // Start with the default calculated value
      let result = defaultValue;
      
      // Find conditional effects that match the effect type
      const conditionalEffects = this.state.activeEffects.filter(
        effect => effect.type === effectType && effect.condition
      );
      
      // If no conditional effects, return the default
      if (conditionalEffects.length === 0) {
        return result;
      }
      
      // For each conditional effect
      conditionalEffects.forEach(effect => {
        // Simple condition parser (can be expanded for more complex conditions)
        const conditionParts = effect.condition.split('==');
        if (conditionParts.length === 2) {
          const leftSide = conditionParts[0].trim();
          const rightSide = conditionParts[1].trim().replace(/['"]/g, ''); // Remove quotes
          
          // Check if condition is met
          if (context[leftSide] === rightSide) {
            switch (effectType) {
              case 'insight_gain_multiplier':
              case 'patient_outcome_multiplier':
                result *= effect.value; // Multiplicative
                break;
                
              case 'equipment_cost_reduction':
                result -= effect.value; // Additive reduction
                break;
                
              case 'auto_solve_chance':
                result += effect.value; // Additive
                break;
                
              case 'insight_gain_flat':
                result += effect.value; // Additive
                break;
                
              default:
                // For unknown types, assume multiplicative
                result *= effect.value;
            }
          }
        }
      });
      
      return result;
    }
    
    /**
     * Get all active effects
     * @returns {Array} Array of active effects
     */
    getActiveEffects() {
      return [...this.state.activeEffects];
    }
    
    /**
     * Get all calculated bonuses
     * @returns {Object} Object with all bonus values
     */
    getAllBonuses() {
      return {...this.state.calculatedBonuses};
    }
  }
  
  // Export for module use
  export default SkillEffectSystem;
  
  // For backward compatibility with existing code
  window.SkillEffectSystem = new SkillEffectSystem();