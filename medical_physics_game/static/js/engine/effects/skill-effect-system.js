// medical_physics_game/static/js/engine/effects/skill-effect-system.js

// Import dependencies
import EffectRegistry from './effect-registry.js';
import InsightHandler from './handlers/insight-handler.js';
// Other handler imports will go here

/**
 * SkillEffectSystem - Modernized class-based implementation
 * Manages application of skill effects throughout the game
 */
class SkillEffectSystem {
  /**
   * Create a new SkillEffectSystem
   * @param {object} eventSystem - Event system for subscribing to game events
   */
  constructor(eventSystem) {
    // Dependencies
    this.eventSystem = eventSystem;
    
    // Core components
    this.registry = new EffectRegistry();
    
    // State
    this.activeEffects = new Map();
    this.initialized = false;
  }
  
  /**
   * Initialize the system and register handlers
   * @returns {SkillEffectSystem} - This instance for chaining
   */
  initialize() {
    if (this.initialized) return this;
    
    console.log("Initializing skill effect system...");
    
    // Register handlers
    this._registerHandlers();
    
    // Register event listeners
    this._registerEventListeners();
    
    this.initialized = true;
    return this;
  }
  
  /**
   * Register all effect handlers
   * @private
   */
  _registerHandlers() {
    // Register all effect handlers
    this.registry
      .registerHandler('insight_gain_flat', new InsightHandler())
      .registerHandler('insight_gain_multiplier', new InsightHandler())
      .registerHandler('critical_insight_multiplier', new InsightHandler())
      .registerHandler('failure_conversion', new InsightHandler());
    
    // Add more handlers here:
    // this.registry.registerHandler('patient_outcome_multiplier', new PatientOutcomeHandler());
    // this.registry.registerHandler('equipment_cost_reduction', new EquipmentHandler());
  }
  
  /**
   * Register event listeners
   * @private
   */
  _registerEventListeners() {
    if (!this.eventSystem) {
      console.warn("No event system provided, skipping event registration");
      return;
    }
    
    // Register for game events
    this.eventSystem.on('QUESTION_CORRECT', this._handleQuestionEvent.bind(this));
    this.eventSystem.on('QUESTION_WRONG', this._handleQuestionEvent.bind(this));
    this.eventSystem.on('PATIENT_CASE_STARTED', this._handlePatientCaseEvent.bind(this));
    this.eventSystem.on('PATIENT_CASE_COMPLETED', this._handlePatientCaseEvent.bind(this));
    this.eventSystem.on('EQUIPMENT_ACTIVATED', this._handleEquipmentEvent.bind(this));
    this.eventSystem.on('EQUIPMENT_MALFUNCTION', this._handleEquipmentEvent.bind(this));
    this.eventSystem.on('RUN_STARTED', () => {
      this.resetEffects();
      this._applyStartingEffects();
    });
    this.eventSystem.on('FLOOR_CHANGED', () => {
      this._resetPerFloorEffects();
    });
  }
  
  /**
   * Apply all effects from a skill
   * @param {object} skill - Skill object
   * @returns {boolean} - Success status
   */
  applySkillEffects(skill) {
    if (!skill || !skill.effects || !Array.isArray(skill.effects)) {
      return false;
    }
    
    console.log(`Applying effects for skill: ${skill.name}`);
    
    // Process each effect
    skill.effects.forEach((effect, index) => {
      // Create a unique ID for this effect
      const effectId = `${skill.id}_effect_${index}`;
      
      // Store the effect with its metadata
      const effectWrapper = {
        id: effectId,
        skillId: skill.id,
        skillName: skill.name,
        type: effect.type,
        value: effect.value,
        condition: effect.condition,
        usagesRemaining: this._getInitialUsages(effect)
      };
      
      this.activeEffects.set(effectId, effectWrapper);
      
      console.log(`Applied effect: ${effect.type} from ${skill.name}`);
      
      // Handle immediate effects
      this._handleImmediateEffect(effectId);
    });
    
    return true;
  }
  
  /**
   * Remove all effects from a skill
   * @param {object} skill - Skill object
   * @returns {boolean} - Success status
   */
  removeSkillEffects(skill) {
    if (!skill) return false;
    
    console.log(`Removing effects for skill: ${skill.name}`);
    
    // Find all effects for this skill
    const effectsToRemove = [];
    
    this.activeEffects.forEach((effect, effectId) => {
      if (effect.skillId === skill.id) {
        // Handle cleanup for specific effect types
        this._handleEffectRemoval(effectId);
        
        effectsToRemove.push(effectId);
      }
    });
    
    // Remove the effects
    effectsToRemove.forEach(effectId => {
      this.activeEffects.delete(effectId);
    });
    
    return effectsToRemove.length > 0;
  }
  
  /**
   * Reset all effects
   */
  resetEffects() {
    console.log("Resetting all skill effects...");
    this.activeEffects.clear();
  }
  
  /**
   * Apply effects at the start of a run
   * @private
   */
  _applyStartingEffects() {
    console.log("Applying starting effects...");
    
    // Apply effects from active skills - get them from SkillTreeManager
    if (window.SkillTreeManager && window.SkillTreeManager.activeSkills) {
      window.SkillTreeManager.activeSkills.forEach(skillId => {
        const skill = window.SkillTreeManager.getSkillById(skillId);
        if (skill) {
          this.applySkillEffects(skill);
        }
      });
    }
    
    // Apply any starting items effect
    this._processStartWithItemsEffects();
  }
  
  /**
   * Process "start_with_items" effects
   * @private
   */
  _processStartWithItemsEffects() {
    console.log("Processing 'start_with_items' effects...");
    
    // Find all active effects of type start_with_items
    const startWithItemsEffects = Array.from(this.activeEffects.values())
      .filter(effect => effect.type === 'start_with_items');
    
    // Process each effect
    startWithItemsEffects.forEach(effect => {
      const { item_type, count } = effect.value;
      
      console.log(`Adding ${count} items of type ${item_type}`);
      
      // Add to inventory - using GameState if available
      if (window.GameState && window.GameState.addInventoryItem) {
        for (let i = 0; i < count; i++) {
          // Request the item from the server based on type
          fetch(`/api/items/${item_type}/random`)
            .then(response => response.json())
            .then(item => {
              if (item && item.id) {
                window.GameState.addInventoryItem(item);
              }
            })
            .catch(error => {
              console.error(`Failed to add starting item: ${error}`);
            });
        }
      }
    });
  }
  
  /**
   * Reset effects that are per-floor
   * @private
   */
  _resetPerFloorEffects() {
    console.log("Resetting per-floor effects...");
    
    // Reset usage counters for per-floor effects
    this.activeEffects.forEach(effect => {
      // Reset consult_help, favor_usage, etc.
      if (['consult_help', 'favor_usage'].includes(effect.type)) {
        effect.usagesRemaining = effect.value;
      }
    });
  }
  
  /**
   * Handle effects that need immediate application
   * @param {string} effectId - ID of the effect
   * @private
   */
  _handleImmediateEffect(effectId) {
    const effect = this.activeEffects.get(effectId);
    if (!effect) return;
    
    switch (effect.type) {
      case 'companion':
        // Add companion to game state
        this._addCompanion(effect.value);
        break;
        
      // Add other immediate effects as needed
      // Most effects are applied in response to events, not immediately
    }
  }
  
  /**
   * Handle cleanup when removing an effect
   * @param {string} effectId - ID of the effect
   * @private
   */
  _handleEffectRemoval(effectId) {
    const effect = this.activeEffects.get(effectId);
    if (!effect) return;
    
    switch (effect.type) {
      case 'companion':
        // Remove companion
        this._removeCompanion(effect.value);
        break;
        
      // Add other cleanup as needed
    }
  }
  
  /**
   * Add a companion to the game
   * @param {string} companionType - Type of companion
   * @private
   */
  _addCompanion(companionType) {
    console.log(`Adding companion: ${companionType}`);
    
    // Request companion data from server
    fetch(`/api/companions/${companionType}`)
      .then(response => response.json())
      .then(companion => {
        if (companion && companion.id) {
          // Add to game state (if companion system exists)
          if (typeof window.CompanionSystem !== 'undefined') {
            window.CompanionSystem.addCompanion(companion);
          } else {
            console.warn('CompanionSystem not found, cannot add companion');
          }
        }
      })
      .catch(error => {
        console.error(`Failed to add companion: ${error}`);
      });
  }
  
  /**
   * Remove a companion from the game
   * @param {string} companionType - Type of companion
   * @private
   */
  _removeCompanion(companionType) {
    console.log(`Removing companion: ${companionType}`);
    
    // Remove from game state (if companion system exists)
    if (typeof window.CompanionSystem !== 'undefined') {
      window.CompanionSystem.removeCompanion(companionType);
    }
  }
  
  /**
   * Get initial usages for effects with limited uses
   * @param {object} effect - Effect object
   * @returns {number|null} - Initial usages or null if unlimited
   * @private
   */
  _getInitialUsages(effect) {
    // For effects with limited uses, store the remaining uses
    if (['consult_help', 'favor_usage'].includes(effect.type)) {
      return effect.value;
    }
    
    return null;
  }
  
  /**
   * Handle question events
   * @param {object} data - Event data
   * @private
   */
  _handleQuestionEvent(data) {
    const eventType = data.type; // QUESTION_CORRECT or QUESTION_WRONG
    const question = data.question;
    const category = question?.category_name;
    const difficulty = question?.difficulty || 1;
    
    console.log(`Handling question event: ${eventType}`);
    
    if (eventType === 'QUESTION_CORRECT') {
      // Apply insight gain effects
      this._applyInsightGainEffects(category, difficulty);
      
      // Check for critical insight
      this._checkCriticalInsight(category, difficulty);
    } else if (eventType === 'QUESTION_WRONG') {
      // Apply failure conversion effects
      this._applyFailureConversionEffects(category, difficulty);
    }
  }
  
  /**
   * Apply insight gain effects
   * @param {string} category - Question category
   * @param {number} difficulty - Question difficulty
   * @private
   */
  _applyInsightGainEffects(category, difficulty) {
    // Get base insight from game state
    let baseInsight = window.GameState?.data?.character?.insight_per_correct || 10;
    let multiplier = 1.0;
    let flatBonus = 0;
    
    // Context for effects
    const context = {
      category,
      difficulty,
      baseInsightGain: baseInsight,
      eventType: 'QUESTION_CORRECT'
    };
    
    // Process all active insight multiplier effects
    this.activeEffects.forEach(effect => {
      const handler = this.registry.getHandler(effect.type);
      
      // Skip if no handler or wrong type
      if (!handler) return;
      
      // Apply category-conditional boosts
      if (effect.type === 'insight_gain_multiplier' && 
          handler.checkCondition(effect.condition, context)) {
        multiplier *= effect.value;
      }
      
      // Apply flat bonuses
      if (effect.type === 'insight_gain_flat' && 
          handler.checkCondition(effect.condition, context)) {
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
      const currentInsight = window.GameState?.data?.character?.insight || 0;
      if (window.GameState) {
        window.GameState.updateCharacterAttribute('insight', currentInsight + totalInsight);
      }
      
      // Show feedback to user
      if (window.UIUtils) {
        window.UIUtils.showToast(`+${totalInsight} Insight (Enhanced by skills)`, 'success');
      }
    }
  }
  
  /**
   * Check for critical insight (rare bonus)
   * @param {string} category - Question category
   * @param {number} difficulty - Question difficulty
   * @private
   */
  _checkCriticalInsight(category, difficulty) {
    // Find critical insight effects
    const criticalEffects = Array.from(this.activeEffects.values())
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
      const baseInsight = window.GameState?.data?.character?.insight_per_correct || 10;
      const bonusInsight = Math.floor(baseInsight * (maxMultiplier - 1));
      
      // Update character insight
      const currentInsight = window.GameState?.data?.character?.insight || 0;
      if (window.GameState) {
        window.GameState.updateCharacterAttribute('insight', currentInsight + bonusInsight);
      }
      
      // Show feedback to user
      if (window.UIUtils) {
        window.UIUtils.showToast(`Critical Insight! +${bonusInsight} bonus Insight`, 'success');
      }
      
      // Emit event
      if (this.eventSystem) {
        this.eventSystem.emit('CRITICAL_INSIGHT', {
          baseInsight,
          bonusInsight,
          multiplier: maxMultiplier
        });
      }
    }
  }
  
  /**
   * Apply failure conversion effects
   * @param {string} category - Question category
   * @param {number} difficulty - Question difficulty
   * @private
   */
  _applyFailureConversionEffects(category, difficulty) {
    // Find failure conversion effects
    const conversionEffects = Array.from(this.activeEffects.values())
      .filter(effect => effect.type === 'failure_conversion');
    
    if (conversionEffects.length === 0) return;
    
    // Context for handlers
    const context = {
      category,
      difficulty,
      eventType: 'QUESTION_WRONG',
      baseInsightGain: window.GameState?.data?.character?.insight_per_correct || 10
    };
    
    // Get the highest conversion rate
    const maxConversion = conversionEffects.reduce((max, effect) => 
      Math.max(max, effect.value), 0);
    
    if (maxConversion > 0) {
      console.log(`Converting failure to partial success: ${maxConversion * 100}%`);
      
      // Calculate partial insight
      const baseInsight = context.baseInsightGain;
      const partialInsight = Math.floor(baseInsight * maxConversion);
      
      // Apply partial insight instead of penalty
      const currentInsight = window.GameState?.data?.character?.insight || 0;
      if (window.GameState) {
        window.GameState.updateCharacterAttribute('insight', currentInsight + partialInsight);
      }
      
      // Show feedback to user
      if (window.UIUtils) {
        window.UIUtils.showToast(`Uncertainty Principle: +${partialInsight} partial Insight`, 'info');
      }
    }
  }
  
  /**
   * Handle patient case events
   * @param {object} data - Event data
   * @private
   */
  _handlePatientCaseEvent(data) {
    const eventType = data.type;
    const patientCase = data.patientCase;
    
    console.log(`Handling patient case event: ${eventType}`);
    
    if (eventType === 'PATIENT_CASE_STARTED') {
      // Apply parameter reveal effects
      this._applyPatientParameterRevealEffects(patientCase);
    } else if (eventType === 'PATIENT_CASE_COMPLETED') {
      // Apply outcome bonuses
      if (data.outcome && data.outcome.rating) {
        this._applyPatientOutcomeEffects(data.outcome);
      }
    }
  }
  
  /**
   * Apply parameter reveal effects for patient cases
   * @param {object} patientCase - Patient case object
   * @private
   */
  _applyPatientParameterRevealEffects(patientCase) {
    if (!patientCase) return;
    
    // Find all parameter reveal effects
    const revealEffects = Array.from(this.activeEffects.values())
      .filter(effect => effect.type === 'reveal_patient_parameter');
    
    if (revealEffects.length === 0) return;
    
    // Sum up all the reveals
    const totalReveals = revealEffects.reduce((sum, effect) => 
      sum + effect.value, 0);
    
    if (totalReveals > 0) {
      console.log(`Revealing ${totalReveals} patient parameters`);
      
      // Send to patient case system if it exists
      if (typeof window.PatientCaseSystem !== 'undefined') {
        window.PatientCaseSystem.revealParameters(patientCase.id, totalReveals);
      } else {
        console.warn('PatientCaseSystem not found, cannot reveal parameters');
      }
    }
  }
  
  /**
   * Handle equipment events
   * @param {object} data - Event data
   * @private
   */
  _handleEquipmentEvent(data) {
    const eventType = data.type;
    const equipment = data.equipment;
    
    console.log(`Handling equipment event: ${eventType}`);
    
    if (eventType === 'EQUIPMENT_MALFUNCTION') {
      // Apply malfunction penalty reduction
      this._applyMalfunctionPenaltyReduction(equipment, data);
    } else if (eventType === 'EQUIPMENT_ACTIVATED') {
      // Apply multi-equipment bonus if applicable
      this._applyMultiEquipmentBonus(data);
    }
  }
  
  /**
   * Check if player has a specialization
   * @param {string} specializationId - ID of specialization
   * @returns {boolean} - Whether player has the specialization
   */
  hasSpecialization(specializationId) {
    return window.SkillTreeManager ? 
      window.SkillTreeManager.getSpecializationLevel(specializationId) > 0 : false;
  }
  
  /**
   * Count active specializations
   * @returns {number} - Count of active specializations
   */
  getSpecializationCount() {
    return window.SkillTreeManager ? 
      window.SkillTreeManager.getActiveSpecializations().length : 0;
  }
}

// Add to window for backwards compatibility
window.SkillEffectSystem = SkillEffectSystem;

// Create a helper function
window.has_specialization = function(specializationId) {
  if (window.skillEffectSystem) {
    return window.skillEffectSystem.hasSpecialization(specializationId);
  }
  return false;
};

export default SkillEffectSystem;
