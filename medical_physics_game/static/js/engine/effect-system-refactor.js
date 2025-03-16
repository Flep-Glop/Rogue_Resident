// effect_system/effect_registry.js
export class EffectRegistry {
  constructor() {
    this.handlers = new Map();
  }
  
  registerHandler(effectType, handler) {
    if (!handler || typeof handler.apply !== 'function') {
      throw new Error(`Invalid handler for effect type: ${effectType}`);
    }
    
    this.handlers.set(effectType, handler);
    console.log(`Registered effect handler: ${effectType}`);
    return this;
  }
  
  getHandler(effectType) {
    return this.handlers.get(effectType) || null;
  }
  
  applyEffect(effect, context) {
    const handler = this.getHandler(effect.type);
    
    if (!handler) {
      console.warn(`No handler found for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.apply(effect, context);
  }
  
  removeEffect(effect, context) {
    const handler = this.getHandler(effect.type);
    
    if (!handler || typeof handler.remove !== 'function') {
      console.warn(`No remove handler found for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.remove(effect, context);
  }
}

// effect_system/effect_handler.js
export class EffectHandler {
  constructor() {
    // Base implementation
  }
  
  apply(effect, context) {
    throw new Error('apply() must be implemented by subclass');
  }
  
  remove(effect, context) {
    // Default implementation - override as needed
    return true;
  }
  
  checkCondition(condition, context) {
    if (!condition) return true; // No condition = always true
    
    // Handle different condition types
    if (typeof condition === 'string') {
      return this._evaluateStringCondition(condition, context);
    } else if (typeof condition === 'function') {
      return condition(context);
    } else if (typeof condition === 'object') {
      return this._evaluateObjectCondition(condition, context);
    }
    
    return false;
  }
  
  _evaluateStringCondition(condition, context) {
    // Handle string conditions like "question_category == 'quantum'"
    const operators = ['==', '!=', '>=', '<=', '>', '<'];
    let operator = '';
    let parts = [];
    
    // Find operator
    for (const op of operators) {
      if (condition.includes(op)) {
        operator = op;
        parts = condition.split(op).map(p => p.trim());
        break;
      }
    }
    
    if (parts.length !== 2) return false;
    
    const leftSide = parts[0];
    let rightSide = parts[1].replace(/['"]/g, ''); // Remove quotes
    
    // Get value from context
    const leftValue = this._getValueFromContext(leftSide, context);
    
    // Try to convert right side to appropriate type
    if (!isNaN(rightSide)) {
      rightSide = parseFloat(rightSide);
    } else if (rightSide === 'true') {
      rightSide = true;
    } else if (rightSide === 'false') {
      rightSide = false;
    }
    
    // Compare values
    switch (operator) {
      case '==': return leftValue == rightSide;
      case '!=': return leftValue != rightSide;
      case '>=': return leftValue >= rightSide;
      case '<=': return leftValue <= rightSide;
      case '>': return leftValue > rightSide;
      case '<': return leftValue < rightSide;
      default: return false;
    }
  }
  
  _evaluateObjectCondition(condition, context) {
    // Handle object conditions - could have AND/OR logic, etc.
    return false; // Implement as needed
  }
  
  _getValueFromContext(path, context) {
    // Handle nested paths like "question.category"
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  }
}

// effect_system/handlers/insight_gain_handler.js
import { EffectHandler } from '../effect_handler.js';

export class InsightGainHandler extends EffectHandler {
  apply(effect, context) {
    // Check condition first
    if (!this.checkCondition(effect.condition, context)) {
      return false;
    }
    
    const { type, value } = effect;
    
    // Handle based on effect type
    if (type === 'insight_gain_flat') {
      return this._applyFlatGain(value, context);
    } else if (type === 'insight_gain_multiplier') {
      return this._applyMultiplier(value, context);
    }
    
    return false;
  }
  
  _applyFlatGain(value, context) {
    // Get current insight
    const currentInsight = context.currentInsight || 0;
    
    // Apply flat bonus
    const newInsight = currentInsight + value;
    
    // Update insight in context
    if (context.updateInsight && typeof context.updateInsight === 'function') {
      context.updateInsight(newInsight);
    }
    
    console.log(`Applied flat insight gain: +${value}`);
    return true;
  }
  
  _applyMultiplier(value, context) {
    // Get base insight gain
    const baseGain = context.baseInsightGain || 0;
    
    // Apply multiplier
    const bonusInsight = Math.floor(baseGain * (value - 1));
    
    // Update total gain in context
    if (context.updateInsightGain && typeof context.updateInsightGain === 'function') {
      context.updateInsightGain(baseGain + bonusInsight);
    }
    
    console.log(`Applied insight multiplier ${value.toFixed(2)}: +${bonusInsight} bonus`);
    return true;
  }
  
  remove(effect, context) {
    // Implement if effects need cleanup on removal
    return true;
  }
}

// effect_system/skill_effect_system.js
import { EffectRegistry } from './effect_registry.js';
import { InsightGainHandler } from './handlers/insight_gain_handler.js';
import { PatientOutcomeHandler } from './handlers/patient_outcome_handler.js';
import { EquipmentHandler } from './handlers/equipment_handler.js';
// Import other handlers...

export class SkillEffectSystem {
  constructor(eventSystem) {
    this.registry = new EffectRegistry();
    this.activeEffects = new Map(); // effectId -> effect
    this.eventSystem = eventSystem;
    this.initialized = false;
  }
  
  initialize() {
    if (this.initialized) return this;
    
    // Register handlers
    this._registerHandlers();
    
    // Register event listeners
    this._registerEventListeners();
    
    this.initialized = true;
    console.log("Skill effect system initialized");
    
    return this;
  }
  
  _registerHandlers() {
    // Register all effect handlers
    this.registry
      .registerHandler('insight_gain_flat', new InsightGainHandler())
      .registerHandler('insight_gain_multiplier', new InsightGainHandler())
      .registerHandler('patient_outcome_multiplier', new PatientOutcomeHandler())
      .registerHandler('equipment_cost_reduction', new EquipmentHandler())
      // Register other handlers...
  }
  
  _registerEventListeners() {
    // Register for game events
    if (this.eventSystem) {
      this.eventSystem.on('QUESTION_CORRECT', this._handleQuestionEvent.bind(this));
      this.eventSystem.on('QUESTION_WRONG', this._handleQuestionEvent.bind(this));
      this.eventSystem.on('PATIENT_CASE_STARTED', this._handlePatientCaseEvent.bind(this));
      this.eventSystem.on('PATIENT_CASE_COMPLETED', this._handlePatientCaseEvent.bind(this));
      // Register for other events...
    }
  }
  
  applyEffects(skill) {
    if (!skill || !skill.effects || !Array.isArray(skill.effects)) {
      return false;
    }
    
    console.log(`Applying effects for skill: ${skill.name}`);
    
    skill.effects.forEach((effect, index) => {
      // Create a unique ID for this effect
      const effectId = `${skill.id}_effect_${index}`;
      
      // Store effect with metadata
      const effectWrapper = {
        id: effectId,
        skillId: skill.id,
        skillName: skill.name,
        ...effect,
        usagesRemaining: this._getInitialUsages(effect)
      };
      
      this.activeEffects.set(effectId, effectWrapper);
      
      console.log(`Applied effect: ${effect.type} from ${skill.name}`);
    });
    
    return true;
  }
  
  removeEffects(skill) {
    if (!skill) return false;
    
    console.log(`Removing effects for skill: ${skill.name}`);
    
    // Find and remove effects for this skill
    const effectsToRemove = [];
    
    this.activeEffects.forEach((effect, effectId) => {
      if (effect.skillId === skill.id) {
        effectsToRemove.push(effectId);
      }
    });
    
    // Remove the effects
    effectsToRemove.forEach(effectId => {
      const effect = this.activeEffects.get(effectId);
      
      // Apply removal logic
      const handler = this.registry.getHandler(effect.type);
      if (handler) {
        handler.remove(effect, {});
      }
      
      this.activeEffects.delete(effectId);
    });
    
    return effectsToRemove.length > 0;
  }
  
  _getInitialUsages(effect) {
    // For effects with limited uses, return the initial count
    if (['consult_help', 'favor_usage'].includes(effect.type)) {
      return effect.value;
    }
    
    return null;
  }
  
  // Event handlers
  _handleQuestionEvent(data) {
    const eventType = data.type;
    const question = data.question;
    const category = question?.category_name;
    const difficulty = question?.difficulty || 1;
    
    console.log(`Handling question event: ${eventType}`);
    
    if (eventType === 'QUESTION_CORRECT') {
      this._applyInsightGainEffects(category, difficulty);
    } else if (eventType === 'QUESTION_WRONG') {
      this._applyFailureConversionEffects(category, difficulty);
    }
  }
  
  _applyInsightGainEffects(category, difficulty) {
    // Base insight from game state
    const baseInsight = 10; // Replace with actual game state value
    
    // Context for effect application
    const context = {
      category,
      difficulty,
      baseInsightGain: baseInsight,
      currentInsight: 0, // Fill from game state
      totalGain: baseInsight,
      
      // Callbacks
      updateInsightGain: (newTotal) => {
        context.totalGain = newTotal;
      },
      updateInsight: (newInsight) => {
        // Update game state with new insight value
        console.log(`Updating insight: ${context.currentInsight} -> ${newInsight}`);
        context.currentInsight = newInsight;
      }
    };
    
    // Find and apply relevant effects
    let multiplier = 1.0;
    let flatBonus = 0;
    
    // Process multipliers first, then flat bonuses
    this.activeEffects.forEach(effect => {
      if (effect.type === 'insight_gain_multiplier') {
        const handler = this.registry.getHandler(effect.type);
        if (handler && handler.checkCondition(effect.condition, context)) {
          multiplier *= effect.value;
        }
      }
    });
    
    // Update context with multiplier
    context.totalGain = Math.floor(baseInsight * multiplier);
    
    // Then process flat bonuses
    this.activeEffects.forEach(effect => {
      if (effect.type === 'insight_gain_flat') {
        const handler = this.registry.getHandler(effect.type);
        if (handler && handler.checkCondition(effect.condition, context)) {
          flatBonus += effect.value;
        }
      }
    });
    
    // Calculate final insight gain
    const totalInsight = context.totalGain + flatBonus;
    
    // Actually apply the insight gain
    if (totalInsight !== baseInsight) {
      console.log(`Modified insight gain: ${baseInsight} -> ${totalInsight} (×${multiplier.toFixed(2)} + ${flatBonus})`);
      
      // Update game state with the new insight value
      // Assuming GameState exists and has this method
      if (window.GameState) {
        const currentInsight = window.GameState.data.character?.insight || 0;
        window.GameState.updateCharacterAttribute('insight', currentInsight + totalInsight);
      }
    }
    
    return totalInsight;
  }
  
  _handlePatientCaseEvent(data) {
    // Implementation...
  }
  
  // Add more event handlers and utility methods...
}
