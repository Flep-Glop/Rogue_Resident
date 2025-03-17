/**
 * SkillEffectSystem
 * Manages and applies skill tree effects to game mechanics
 */
const SkillEffectSystem = {
  // State tracking
  initialized: false,
  activeEffects: {},
  
  /**
   * Initialize the effect system
   * @returns {Object} - This instance for chaining
   */
  initialize: function() {
      if (this.initialized) {
          console.log("SkillEffectSystem already initialized");
          return this;
      }
      
      console.log("Initializing SkillEffectSystem...");
      
      // Reset effects
      this.activeEffects = {
          insight_gain_flat: 0,
          insight_gain_multiplier: 1,
          patient_outcome_multiplier: 1,
          auto_solve_chance: 0,
          treatment_effectiveness_multiplier: 1,
          equipment_cost_reduction: 0,
          reveal_parameter: false,
          reveal_patient_parameter: 0,
          critical_insight_multiplier: 1,
          calibration_success: 0,
          unlock_dialogue_options: false,
          unlock_experimental_treatments: false,
          time_cost_reduction: 0,
          consult_help: 0,
          adverse_event_reduction: 0,
          preview_outcomes: false,
          malfunction_penalty_reduction: 0,
          repair_cost_reduction: 0,
          reveal_equipment_internals: false,
          auto_detect_qa_issues: false,
          auto_detect_radiation_anomalies: false,
          multi_equipment_bonus: 0,
          temporary_equipment_fix: false,
          funding_multiplier: 1,
          favor_usage: 0,
          insight_to_reputation_conversion: 0,
          clinical_to_reputation_conversion: 0,
          multi_specialization_bonus: 0,
          recall_similar_questions: false,
          failure_conversion: 0
      };
      
      // Register for game events
      this._registerEvents();
      
      // Mark as initialized
      this.initialized = true;
      console.log("SkillEffectSystem initialization complete");
      
      return this;
  },
  
  /**
   * Apply effects from a skill node
   * @param {Object} node - Skill node data
   * @returns {Boolean} - Success status
   */
  applyNodeEffects: function(node) {
      if (!this.initialized) {
          console.error("Cannot apply effects: system not initialized");
          return false;
      }
      
      if (!node || !node.effects) {
          console.error("Invalid node or missing effects");
          return false;
      }
      
      console.log(`Applying effects for node: ${node.id}`);
      
      try {
          // Process each effect
          node.effects.forEach(effect => {
              this._applyEffect(effect);
          });
          
          // Emit event
          const event = new CustomEvent('skill-effects-changed', {
              detail: { 
                  nodeId: node.id,
                  effects: node.effects,
                  activeEffects: { ...this.activeEffects }
              }
          });
          document.dispatchEvent(event);
          
          console.log("Node effects applied successfully");
          return true;
      } catch (error) {
          console.error("Error applying node effects:", error);
          return false;
      }
  },
  
  /**
   * Apply a single effect
   * @param {Object} effect - Effect data
   * @private
   */
  _applyEffect: function(effect) {
      if (!effect || !effect.type) return;
      
      const type = effect.type;
      const value = effect.value;
      
      console.log(`Applying effect: ${type} = ${value}`);
      
      // Handle different effect types
      switch (type) {
          // Numeric addition effects
          case 'insight_gain_flat':
          case 'reveal_patient_parameter':
          case 'consult_help':
          case 'favor_usage':
              this.activeEffects[type] += value;
              break;
              
          // Numeric multiplication effects
          case 'insight_gain_multiplier':
          case 'patient_outcome_multiplier':
          case 'treatment_effectiveness_multiplier':
          case 'critical_insight_multiplier':
          case 'funding_multiplier':
              this.activeEffects[type] *= value;
              break;
              
          // Probability effects
          case 'auto_solve_chance':
          case 'calibration_success':
          case 'malfunction_penalty_reduction':
          case 'equipment_cost_reduction':
          case 'repair_cost_reduction':
          case 'time_cost_reduction':
          case 'adverse_event_reduction':
          case 'multi_equipment_bonus':
          case 'insight_to_reputation_conversion':
          case 'clinical_to_reputation_conversion':
          case 'multi_specialization_bonus':
          case 'failure_conversion':
              // Cap probabilities at logical limits
              this.activeEffects[type] = Math.min(1, this.activeEffects[type] + value);
              break;
              
          // Boolean effects
          case 'reveal_parameter':
          case 'unlock_dialogue_options':
          case 'unlock_experimental_treatments':
          case 'preview_outcomes':
          case 'reveal_equipment_internals':
          case 'auto_detect_qa_issues':
          case 'auto_detect_radiation_anomalies':
          case 'temporary_equipment_fix':
          case 'recall_similar_questions':
              this.activeEffects[type] = true;
              break;
              
          // Handle complex effects or items
          case 'start_with_items':
              // This would be handled when starting a new game
              console.log(`Starting with items: ${JSON.stringify(value)}`);
              break;
              
          case 'companion':
              // This would spawn a companion character
              console.log(`Companion unlocked: ${value}`);
              break;
              
          case 'specialization_synergy':
              // This handles synergy between specializations
              console.log(`Specialization synergy: ${JSON.stringify(value)}`);
              break;
              
          default:
              console.warn(`Unknown effect type: ${type}`);
      }
  },
  
  /**
   * Get current value of an effect
   * @param {String} effectType - Type of effect
   * @param {Object} context - Optional context for conditional effects
   * @returns {*} - Effect value
   */
  getEffectValue: function(effectType, context = {}) {
      if (!this.initialized || !this.activeEffects[effectType]) {
          // Return sensible defaults based on effect type
          switch (effectType) {
              case 'insight_gain_multiplier':
              case 'patient_outcome_multiplier':
              case 'treatment_effectiveness_multiplier':
              case 'critical_insight_multiplier':
              case 'funding_multiplier':
                  return 1; // Multiplicative effects default to 1
                  
              case 'insight_gain_flat':
              case 'auto_solve_chance':
              case 'equipment_cost_reduction':
              case 'reveal_patient_parameter':
              case 'time_cost_reduction':
              case 'consult_help':
              case 'adverse_event_reduction':
              case 'multi_equipment_bonus':
              case 'insight_to_reputation_conversion':
              case 'clinical_to_reputation_conversion':
              case 'multi_specialization_bonus':
              case 'failure_conversion':
                  return 0; // Additive effects default to 0
                  
              default:
                  return false; // Boolean effects default to false
          }
      }
      
      return this.activeEffects[effectType];
  },
  
  /**
   * Reset all effects
   */
  resetEffects: function() {
      this.activeEffects = {
          insight_gain_flat: 0,
          insight_gain_multiplier: 1,
          patient_outcome_multiplier: 1,
          auto_solve_chance: 0,
          treatment_effectiveness_multiplier: 1,
          equipment_cost_reduction: 0,
          reveal_parameter: false,
          reveal_patient_parameter: 0,
          critical_insight_multiplier: 1,
          calibration_success: 0,
          unlock_dialogue_options: false,
          unlock_experimental_treatments: false,
          time_cost_reduction: 0,
          consult_help: 0,
          adverse_event_reduction: 0,
          preview_outcomes: false,
          malfunction_penalty_reduction: 0,
          repair_cost_reduction: 0,
          reveal_equipment_internals: false,
          auto_detect_qa_issues: false,
          auto_detect_radiation_anomalies: false,
          multi_equipment_bonus: 0,
          temporary_equipment_fix: false,
          funding_multiplier: 1,
          favor_usage: 0,
          insight_to_reputation_conversion: 0,
          clinical_to_reputation_conversion: 0,
          multi_specialization_bonus: 0,
          recall_similar_questions: false,
          failure_conversion: 0
      };
      
      console.log("All effects reset");
  },
  
  /**
   * Register for game events
   * @private
   */
  _registerEvents: function() {
      // If game has an event system, register for events
      if (window.eventSystem) {
          console.log("Registering with game event system");
          
          // Register for question events
          window.eventSystem.subscribe('question_answered', (data) => {
              this._processQuestionAnswered(data);
          });
          
          // Register for patient case events
          window.eventSystem.subscribe('patient_case_completed', (data) => {
              this._processPatientCaseCompleted(data);
          });
      }
  },
  
  /**
   * Process question answered event
   * @param {Object} data - Event data
   * @private
   */
  _processQuestionAnswered: function(data) {
      if (!data) return;
      
      console.log("Processing question answered event:", data);
      
      // Apply insight gain effects
      if (data.correct) {
          // Calculate base insight
          let insight = data.insight || 10;
          
          // Apply flat bonus
          insight += this.getEffectValue('insight_gain_flat');
          
          // Apply multiplier
          insight *= this.getEffectValue('insight_gain_multiplier');
          
          // Apply critical insight if applicable
          if (data.critical) {
              insight *= this.getEffectValue('critical_insight_multiplier');
          }
          
          // Update insight gain
          data.insight = Math.round(insight);
          
          console.log(`Modified insight gain: ${data.insight}`);
          
          // Convert insight to reputation if applicable
          const conversionRate = this.getEffectValue('insight_to_reputation_conversion');
          if (conversionRate > 0) {
              const reputationGain = Math.floor(insight * conversionRate);
              
              if (reputationGain > 0) {
                  // Update reputation if game state manager is available
                  if (window.stateManager) {
                      const currentState = window.stateManager.getState();
                      const newReputation = (currentState.reputation || 0) + reputationGain;
                      
                      window.stateManager.updateState({
                          reputation: newReputation
                      });
                      
                      console.log(`Converted insight to ${reputationGain} reputation`);
                  }
              }
          }
      } else {
          // Apply failure conversion if applicable
          const conversionRate = this.getEffectValue('failure_conversion');
          if (conversionRate > 0) {
              // Convert some failed insight to partial insight
              const baseInsight = data.baseInsight || 10;
              const partialInsight = Math.floor(baseInsight * conversionRate);
              
              data.insight = partialInsight;
              console.log(`Converted failure to ${partialInsight} partial insight`);
          }
      }
  },
  
  /**
   * Process patient case completed event
   * @param {Object} data - Event data
   * @private
   */
  _processPatientCaseCompleted: function(data) {
      if (!data) return;
      
      console.log("Processing patient case completed event:", data);
      
      // Apply patient outcome effects
      if (data.outcome) {
          // Apply multiplier
          data.outcome *= this.getEffectValue('patient_outcome_multiplier');
          
          console.log(`Modified patient outcome: ${data.outcome}`);
          
          // Convert clinical success to reputation if applicable
          const conversionRate = this.getEffectValue('clinical_to_reputation_conversion');
          if (conversionRate > 0) {
              const reputationGain = Math.floor(data.outcome * conversionRate);
              
              if (reputationGain > 0) {
                  // Update reputation if game state manager is available
                  if (window.stateManager) {
                      const currentState = window.stateManager.getState();
                      const newReputation = (currentState.reputation || 0) + reputationGain;
                      
                      window.stateManager.updateState({
                          reputation: newReputation
                      });
                      
                      console.log(`Converted clinical outcome to ${reputationGain} reputation`);
                  }
              }
          }
      }
  }
};

// Make globally available
window.SkillEffectSystem = SkillEffectSystem;