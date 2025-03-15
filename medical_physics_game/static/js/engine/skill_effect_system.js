// skill_effect_system.js - Handles skill effect application

// SkillEffectSystem - Manages all skill effect applications
const SkillEffectSystem = {
    // Track all active effects
    activeEffects: {},
    
    // Initialize the effect system
    initialize: function() {
      console.log("Initializing skill effect system...");
      
      // Register game events listeners
      this._registerEventListeners();
      
      return Promise.resolve(this);
    },
    
    // Register event listeners
    _registerEventListeners: function() {
      // Listen for question events
      EventSystem.on(GAME_EVENTS.QUESTION_CORRECT, this._handleQuestionEvent.bind(this));
      EventSystem.on(GAME_EVENTS.QUESTION_WRONG, this._handleQuestionEvent.bind(this));
      
      // Listen for patient case events
      EventSystem.on(GAME_EVENTS.PATIENT_CASE_STARTED, this._handlePatientCaseEvent.bind(this));
      EventSystem.on(GAME_EVENTS.PATIENT_CASE_COMPLETED, this._handlePatientCaseEvent.bind(this));
      
      // Listen for equipment events
      EventSystem.on(GAME_EVENTS.EQUIPMENT_ACTIVATED, this._handleEquipmentEvent.bind(this));
      EventSystem.on(GAME_EVENTS.EQUIPMENT_MALFUNCTION, this._handleEquipmentEvent.bind(this));
      
      // Listen for run events
      EventSystem.on(GAME_EVENTS.RUN_STARTED, () => {
        this.resetEffects();
        this._applyStartingEffects();
      });
      
      EventSystem.on(GAME_EVENTS.FLOOR_CHANGED, () => {
        this._resetPerFloorEffects();
      });
    },
    
    // Apply effects at the start of a run
    _applyStartingEffects: function() {
      console.log("Applying starting effects...");
      
      // Apply effects from active skills
      SkillTreeManager.activeSkills.forEach(skillId => {
        const skill = SkillTreeManager.getSkillById(skillId);
        if (skill) {
          this.applySkillEffects(skill);
        }
      });
      
      // Apply any starting items effect
      this._processStartWithItemsEffects();
    },
    
    // Process "start_with_items" effects
    _processStartWithItemsEffects: function() {
      console.log("Processing 'start_with_items' effects...");
      
      // Find all active effects of type start_with_items
      const startWithItemsEffects = Object.values(this.activeEffects)
        .filter(effect => effect.type === 'start_with_items');
      
      // Process each effect
      startWithItemsEffects.forEach(effect => {
        const { item_type, count } = effect.value;
        
        console.log(`Adding ${count} items of type ${item_type}`);
        
        // Add to inventory
        for (let i = 0; i < count; i++) {
          // Request the item from the server based on type
          fetch(`/api/items/${item_type}/random`)
            .then(response => response.json())
            .then(item => {
              if (item && item.id) {
                GameState.addInventoryItem(item);
              }
            })
            .catch(error => {
              console.error(`Failed to add starting item: ${error}`);
            });
        }
      });
    },
    
    // Reset effects that are per-floor
    _resetPerFloorEffects: function() {
      console.log("Resetting per-floor effects...");
      
      // Reset usage counters for per-floor effects
      Object.keys(this.activeEffects).forEach(effectId => {
        const effect = this.activeEffects[effectId];
        
        // Reset consult_help, favor_usage, etc.
        if (['consult_help', 'favor_usage'].includes(effect.type)) {
          effect.usagesRemaining = effect.value;
        }
      });
    },
    
    // Reset all effects
    resetEffects: function() {
      console.log("Resetting all skill effects...");
      this.activeEffects = {};
    },
    
    // Apply all effects from a skill
    applySkillEffects: function(skill) {
      if (!skill || !skill.effects) return;
      
      console.log(`Applying effects for skill: ${skill.name}`);
      
      // Process each effect
      skill.effects.forEach((effect, index) => {
        // Create a unique ID for this effect
        const effectId = `${skill.id}_effect_${index}`;
        
        // Store the effect with its metadata
        this.activeEffects[effectId] = {
          id: effectId,
          skillId: skill.id,
          skillName: skill.name,
          type: effect.type,
          value: effect.value,
          condition: effect.condition,
          usagesRemaining: this._getInitialUsages(effect)
        };
        
        console.log(`Applied effect: ${effect.type} from ${skill.name}`);
        
        // Handle immediate effects
        this._handleImmediateEffect(effectId);
      });
    },
    
    // Get initial usages for effects with limited uses
    _getInitialUsages: function(effect) {
      // For effects with limited uses, store the remaining uses
      if (['consult_help', 'favor_usage'].includes(effect.type)) {
        return effect.value;
      }
      
      return null;
    },
    
    // Handle effects that need immediate application
    _handleImmediateEffect: function(effectId) {
      const effect = this.activeEffects[effectId];
      if (!effect) return;
      
      switch (effect.type) {
        case 'insight_gain_flat':
          // Will be applied when insight is gained
          break;
          
        case 'reveal_parameter':
        case 'reveal_patient_parameter':
          // Will be applied when questions/patient cases start
          break;
          
        case 'unlock_dialogue_options':
        case 'unlock_experimental_treatments':
          // These modify available options, nothing to do immediately
          break;
          
        case 'companion':
          // Add companion to game state
          this._addCompanion(effect.value);
          break;
          
        // Add other immediate effects as needed
      }
    },
    
    // Remove all effects from a skill
    removeSkillEffects: function(skill) {
      if (!skill) return;
      
      console.log(`Removing effects for skill: ${skill.name}`);
      
      // Find and remove all effects from this skill
      Object.keys(this.activeEffects).forEach(effectId => {
        if (this.activeEffects[effectId].skillId === skill.id) {
          // Handle cleanup for specific effect types
          this._handleEffectRemoval(effectId);
          
          // Remove the effect
          delete this.activeEffects[effectId];
        }
      });
    },
    
    // Handle cleanup when removing an effect
    _handleEffectRemoval: function(effectId) {
      const effect = this.activeEffects[effectId];
      if (!effect) return;
      
      switch (effect.type) {
        case 'companion':
          // Remove companion
          this._removeCompanion(effect.value);
          break;
          
        // Add other cleanup as needed
      }
    },
    
    // Add a companion to the game
    _addCompanion: function(companionType) {
      console.log(`Adding companion: ${companionType}`);
      
      // Request companion data from server
      fetch(`/api/companions/${companionType}`)
        .then(response => response.json())
        .then(companion => {
          if (companion && companion.id) {
            // Add to game state (if companion system exists)
            if (typeof CompanionSystem !== 'undefined') {
              CompanionSystem.addCompanion(companion);
            } else {
              console.warn('CompanionSystem not found, cannot add companion');
            }
          }
        })
        .catch(error => {
          console.error(`Failed to add companion: ${error}`);
        });
    },
    
    // Remove a companion from the game
    _removeCompanion: function(companionType) {
      console.log(`Removing companion: ${companionType}`);
      
      // Remove from game state (if companion system exists)
      if (typeof CompanionSystem !== 'undefined') {
        CompanionSystem.removeCompanion(companionType);
      }
    },
    
    // Event handlers for game events
    
    // Handle question events
    _handleQuestionEvent: function(data) {
      const eventType = data.type; // QUESTION_CORRECT or QUESTION_WRONG
      const question = data.question;
      const category = question?.category_name;
      const difficulty = question?.difficulty || 1;
      
      console.log(`Handling question event: ${eventType}`);
      
      if (eventType === GAME_EVENTS.QUESTION_CORRECT) {
        // Apply insight gain effects
        this._applyInsightGainEffects(category, difficulty);
        
        // Check for critical insight
        this._checkCriticalInsight(category, difficulty);
      } else if (eventType === GAME_EVENTS.QUESTION_WRONG) {
        // Apply failure conversion effects
        this._applyFailureConversionEffects(category, difficulty);
      }
    },
    
    // Apply insight gain effects
    _applyInsightGainEffects: function(category, difficulty) {
      let baseInsight = GameState.data.character?.insight_per_correct || 10;
      let multiplier = 1.0;
      let flatBonus = 0;
      
      // Process all active insight multiplier effects
      Object.values(this.activeEffects).forEach(effect => {
        // Apply category-conditional boosts
        if (effect.type === 'insight_gain_multiplier' && 
            this._checkCondition(effect.condition, { category, difficulty })) {
          multiplier *= effect.value;
        }
        
        // Apply flat bonuses
        if (effect.type === 'insight_gain_flat' && 
            this._checkCondition(effect.condition, { category, difficulty })) {
          flatBonus += effect.value;
        }
        
        // Apply category-specific bonuses
        if (effect.type === 'category_boost' && 
            category && category.toLowerCase().includes(effect.condition?.toLowerCase())) {
          // Parse the value to extract the insight boost
          try {
            const insightMatch = effect.value.match(/\+(\d+) insight/i);
            if (insightMatch && insightMatch[1]) {
              flatBonus += parseInt(insightMatch[1]);
            }
          } catch (e) {
            console.error("Error parsing category boost effect:", e);
          }
        }
      });
      
      // Calculate total insight gain
      const totalInsight = Math.floor((baseInsight * multiplier) + flatBonus);
      
      // Apply the insight gain if different from base
      if (totalInsight !== baseInsight) {
        console.log(`Modified insight gain: ${baseInsight} -> ${totalInsight} (×${multiplier.toFixed(2)} + ${flatBonus})`);
        
        // Update character insight
        const currentInsight = GameState.data.character?.insight || 0;
        GameState.updateCharacterAttribute('insight', currentInsight + totalInsight);
        
        // Show feedback to user
        UIUtils.showToast(`+${totalInsight} Insight (Enhanced by skills)`, 'success');
      }
    },
    
    // Check for critical insight (rare bonus)
    _checkCriticalInsight: function(category, difficulty) {
      // Find critical insight effects
      const criticalEffects = Object.values(this.activeEffects)
        .filter(effect => effect.type === 'critical_insight_multiplier');
      
      if (criticalEffects.length === 0) return;
      
      // 5% base chance for critical, increases with difficulty
      const criticalChance = 0.05 + (difficulty * 0.02);
      const roll = Math.random();
      
      if (roll <= criticalChance) {
        console.log("Critical insight triggered!");
        
        // Get the highest multiplier
        const maxMultiplier = criticalEffects.reduce((max, effect) => 
          Math.max(max, effect.value), 2.0);
        
        // Apply additional insight
        const baseInsight = GameState.data.character?.insight_per_correct || 10;
        const bonusInsight = Math.floor(baseInsight * (maxMultiplier - 1));
        
        // Update character insight
        const currentInsight = GameState.data.character?.insight || 0;
        GameState.updateCharacterAttribute('insight', currentInsight + bonusInsight);
        
        // Show feedback to user
        UIUtils.showToast(`Critical Insight! +${bonusInsight} bonus Insight`, 'success');
        
        // Emit event
        EventSystem.emit(GAME_EVENTS.CRITICAL_INSIGHT, {
          baseInsight,
          bonusInsight,
          multiplier: maxMultiplier
        });
      }
    },
    
    // Apply failure conversion effects
    _applyFailureConversionEffects: function(category, difficulty) {
      // Find failure conversion effects
      const conversionEffects = Object.values(this.activeEffects)
        .filter(effect => effect.type === 'failure_conversion');
      
      if (conversionEffects.length === 0) return;
      
      // Get the highest conversion rate
      const maxConversion = conversionEffects.reduce((max, effect) => 
        Math.max(max, effect.value), 0);
      
      if (maxConversion > 0) {
        console.log(`Converting failure to partial success: ${maxConversion * 100}%`);
        
        // Calculate partial insight
        const baseInsight = GameState.data.character?.insight_per_correct || 10;
        const partialInsight = Math.floor(baseInsight * maxConversion);
        
        // Apply partial insight instead of penalty
        const currentInsight = GameState.data.character?.insight || 0;
        GameState.updateCharacterAttribute('insight', currentInsight + partialInsight);
        
        // Show feedback to user
        UIUtils.showToast(`Uncertainty Principle: +${partialInsight} partial Insight`, 'info');
      }
    },
    
    // Handle patient case events
    _handlePatientCaseEvent: function(data) {
      const eventType = data.type;
      const patientCase = data.patientCase;
      
      console.log(`Handling patient case event: ${eventType}`);
      
      if (eventType === GAME_EVENTS.PATIENT_CASE_STARTED) {
        // Apply parameter reveal effects
        this._applyPatientParameterRevealEffects(patientCase);
      } else if (eventType === GAME_EVENTS.PATIENT_CASE_COMPLETED) {
        // Apply outcome bonuses
        if (data.outcome && data.outcome.rating) {
          this._applyPatientOutcomeEffects(data.outcome);
        }
      }
    },
    
    // Apply parameter reveal effects for patient cases
    _applyPatientParameterRevealEffects: function(patientCase) {
      if (!patientCase) return;
      
      // Find all parameter reveal effects
      const revealEffects = Object.values(this.activeEffects)
        .filter(effect => effect.type === 'reveal_patient_parameter');
      
      if (revealEffects.length === 0) return;
      
      // Sum up all the reveals
      const totalReveals = revealEffects.reduce((sum, effect) => 
        sum + effect.value, 0);
      
      if (totalReveals > 0) {
        console.log(`Revealing ${totalReveals} patient parameters`);
        
        // Send to patient case system if it exists
        if (typeof PatientCaseSystem !== 'undefined') {
          PatientCaseSystem.revealParameters(patientCase.id, totalReveals);
        } else {
          console.warn('PatientCaseSystem not found, cannot reveal parameters');
        }
      }
    },
    
    // Apply outcome bonuses for patient cases
    _applyPatientOutcomeEffects: function(outcome) {
      if (!outcome || !outcome.rating) return;
      
      let outcomeMultiplier = 1.0;
      
      // Find all patient outcome multiplier effects
      const outcomeEffects = Object.values(this.activeEffects)
        .filter(effect => effect.type === 'patient_outcome_multiplier');
      
      // Calculate multiplier
      outcomeEffects.forEach(effect => {
        outcomeMultiplier *= effect.value;
      });
      
      if (outcomeMultiplier > 1.0) {
        console.log(`Applying patient outcome multiplier: ${outcomeMultiplier.toFixed(2)}`);
        
        // Apply to all outcome values
        if (outcome.insight) {
          const bonusInsight = Math.floor(outcome.insight * (outcomeMultiplier - 1));
          outcome.insight = Math.floor(outcome.insight * outcomeMultiplier);
          
          // Add to character
          const currentInsight = GameState.data.character?.insight || 0;
          GameState.updateCharacterAttribute('insight', currentInsight + bonusInsight);
          
          // Show feedback
          UIUtils.showToast(`+${bonusInsight} bonus Insight from Clinical Skills`, 'success');
        }
        
        if (outcome.reputation) {
          const bonusRep = Math.floor(outcome.reputation * (outcomeMultiplier - 1));
          outcome.reputation = Math.floor(outcome.reputation * outcomeMultiplier);
          
          // Add to reputation
          SkillTreeManager.addReputation(bonusRep);
          
          // Show feedback
          UIUtils.showToast(`+${bonusRep} bonus Reputation from Clinical Skills`, 'success');
        }
      }
      
      // Check for clinical to reputation conversion
      this._applyClinicalToReputationConversion(outcome);
    },
    
    // Apply clinical success to reputation conversion
    _applyClinicalToReputationConversion: function(outcome) {
      if (!outcome || !outcome.rating) return;
      
      // Find conversion effects
      const conversionEffects = Object.values(this.activeEffects)
        .filter(effect => effect.type === 'clinical_to_reputation_conversion');
      
      if (conversionEffects.length === 0) return;
      
      // Get highest conversion rate
      const maxConversion = conversionEffects.reduce((max, effect) => 
        Math.max(max, effect.value), 0);
      
      if (maxConversion > 0 && outcome.rating >= 4) {
        // For high ratings (4-5), convert some success to reputation
        const baseConversion = Math.floor(outcome.insight * maxConversion);
        
        if (baseConversion > 0) {
          console.log(`Converting clinical success to reputation: +${baseConversion}`);
          
          // Add to reputation
          SkillTreeManager.addReputation(baseConversion);
          
          // Show feedback
          UIUtils.showToast(`Academic Presentation: +${baseConversion} Reputation from clinical work`, 'success');
        }
      }
    },
    
    // Handle equipment events
    _handleEquipmentEvent: function(data) {
      const eventType = data.type;
      const equipment = data.equipment;
      
      console.log(`Handling equipment event: ${eventType}`);
      
      if (eventType === GAME_EVENTS.EQUIPMENT_MALFUNCTION) {
        // Apply malfunction penalty reduction
        this._applyMalfunctionPenaltyReduction(equipment, data);
      } else if (eventType === GAME_EVENTS.EQUIPMENT_ACTIVATED) {
        // Apply multi-equipment bonus if applicable
        this._applyMultiEquipmentBonus(data);
      }
    },
    
    // Apply malfunction penalty reduction
    _applyMalfunctionPenaltyReduction: function(equipment, data) {
      if (!equipment || !data.penalty) return;
      
      // Find malfunction penalty reduction effects
      const reductionEffects = Object.values(this.activeEffects)
        .filter(effect => effect.type === 'malfunction_penalty_reduction');
      
      if (reductionEffects.length === 0) return;
      
      // Get highest reduction
      const maxReduction = reductionEffects.reduce((max, effect) => 
        Math.max(max, effect.value), 0);
      
      if (maxReduction > 0) {
        console.log(`Reducing malfunction penalty by ${maxReduction * 100}%`);
        
        // Apply reduction to penalty
        const originalPenalty = data.penalty;
        data.penalty = Math.floor(originalPenalty * (1 - maxReduction));
        
        // Show feedback
        UIUtils.showToast(`Machine Whisperer: Reduced malfunction penalty by ${maxReduction * 100}%`, 'info');
      }
    },
    
    // Apply multi-equipment bonus
    _applyMultiEquipmentBonus: function(data) {
      if (!data.equipmentCount || data.equipmentCount < 2) return;
      
      // Find multi-equipment bonus effects
      const bonusEffects = Object.values(this.activeEffects)
        .filter(effect => 
          effect.type === 'multi_equipment_bonus' && 
          this._checkCondition(effect.condition, { equipment_count: data.equipmentCount })
        );
      
      if (bonusEffects.length === 0) return;
      
      // Get highest bonus
      const maxBonus = bonusEffects.reduce((max, effect) => 
        Math.max(max, effect.value), 0);
      
      if (maxBonus > 0) {
        console.log(`Applying multi-equipment bonus: +${maxBonus * 100}%`);
        
        // Apply to effectiveness
        if (data.effectiveness) {
          data.effectiveness *= (1 + maxBonus);
        }
        
        // Apply to outcome
        if (data.outcome) {
          if (data.outcome.insight) {
            data.outcome.insight = Math.floor(data.outcome.insight * (1 + maxBonus));
          }
          
          if (data.outcome.funding) {
            data.outcome.funding = Math.floor(data.outcome.funding * (1 + maxBonus));
          }
        }
        
        // Show feedback
        UIUtils.showToast(`Systems Approach: +${maxBonus * 100}% bonus for using multiple equipment`, 'success');
      }
    },
    
    // Helper function to check if a condition is met
    _checkCondition: function(condition, context) {
      if (!condition) return true; // No condition = always true
      
      try {
        // For simple string conditions, check for category matches
        if (typeof condition === 'string') {
          // Parse condition string
          const parts = condition.split('==');
          
          if (parts.length === 2) {
            const leftSide = parts[0].trim();
            const rightSide = parts[1].trim().replace(/['"]/g, ''); // Remove quotes
            
            // Handle question category
            if (leftSide === 'question_category' && context.category) {
              return context.category.toLowerCase().includes(rightSide.toLowerCase());
            }
            
            // Handle node type
            if (leftSide === 'node_type' && context.nodeType) {
              return context.nodeType === rightSide;
            }
            
            // Handle difficulty checks
            if (leftSide === 'question_difficulty' && context.difficulty) {
              const operator = condition.includes('>=') ? '>=' : 
                              condition.includes('<=') ? '<=' :
                              condition.includes('>') ? '>' :
                              condition.includes('<') ? '<' : '==';
              
              const diffValue = parseInt(rightSide);
              
              switch (operator) {
                case '>=': return context.difficulty >= diffValue;
                case '<=': return context.difficulty <= diffValue;
                case '>': return context.difficulty > diffValue;
                case '<': return context.difficulty < diffValue;
                default: return context.difficulty === diffValue;
              }
            }
            
            // Handle equipment count
            if (leftSide === 'equipment_count' && context.equipment_count) {
              const countValue = parseInt(rightSide);
              return context.equipment_count >= countValue;
            }
          }
        }
        
        // For complex conditions, we would need a full expression evaluator
        // This is a simplified approach
        return true;
        
      } catch (error) {
        console.error("Error evaluating condition:", error);
        return false;
      }
    },
    
    // Check if player has a specialization
    hasSpecialization: function(specializationId) {
      return SkillTreeManager.getSpecializationLevel(specializationId) > 0;
    },
    
    // Count active specializations
    getSpecializationCount: function() {
      return SkillTreeManager.getActiveSpecializations().length;
    }
  };
  
  // Export the SkillEffectSystem object
  window.SkillEffectSystem = SkillEffectSystem;
  
  // Helper function to check specialization for conditions
  window.has_specialization = function(specializationId) {
    return SkillEffectSystem.hasSpecialization(specializationId);
  };