// medical_physics_game/static/js/engine/effects/handlers/insight-handler.js

// Import base handler
import EffectHandler from '../effect-handler.js';

/**
 * Handler for insight-related effects
 * Handles effects like insight_gain_flat, insight_gain_multiplier, etc.
 */
class InsightHandler extends EffectHandler {
  /**
   * Apply an insight effect
   * @param {object} effect - Effect object
   * @param {object} context - Context for application
   * @returns {boolean} - Success status
   */
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
    } else if (type === 'critical_insight_multiplier') {
      return this._applyCriticalMultiplier(value, context);
    } else if (type === 'failure_conversion') {
      return this._applyFailureConversion(value, context);
    }
    
    return false;
  }
  
  /**
   * Apply a flat insight gain
   * @param {number} value - Amount to add
   * @param {object} context - Application context
   * @returns {boolean} - Success status
   * @private
   */
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
  
  /**
   * Apply an insight multiplier
   * @param {number} value - Multiplier value
   * @param {object} context - Application context
   * @returns {boolean} - Success status
   * @private
   */
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
  
  /**
   * Apply a critical insight multiplier
   * @param {number} value - Multiplier value
   * @param {object} context - Application context
   * @returns {boolean} - Success status
   * @private
   */
  _applyCriticalMultiplier(value, context) {
    // Calculate critical chance
    const difficulty = context.difficulty || 1;
    const criticalChance = 0.05 + (difficulty * 0.02);
    
    // Check if critical triggered
    const roll = Math.random();
    if (roll > criticalChance) {
      return false; // Not triggered
    }
    
    // Get base insight gain
    const baseGain = context.baseInsightGain || 0;
    
    // Apply critical multiplier
    const bonusInsight = Math.floor(baseGain * (value - 1));
    
    // Update insight in context
    if (context.updateCriticalInsight && typeof context.updateCriticalInsight === 'function') {
      context.updateCriticalInsight(bonusInsight, value);
    }
    
    console.log(`Critical insight! Applied multiplier ${value.toFixed(2)}: +${bonusInsight} bonus`);
    return true;
  }
  
  /**
   * Apply a failure conversion effect
   * @param {number} value - Conversion rate (0-1)
   * @param {object} context - Application context
   * @returns {boolean} - Success status
   * @private
   */
  _applyFailureConversion(value, context) {
    // Only apply on failure
    if (context.eventType !== 'QUESTION_WRONG') {
      return false;
    }
    
    // Get base insight gain that would have been earned
    const baseGain = context.baseInsightGain || 0;
    
    // Calculate partial insight
    const partialInsight = Math.floor(baseGain * value);
    
    // Update insight in context
    if (context.updatePartialInsight && typeof context.updatePartialInsight === 'function') {
      context.updatePartialInsight(partialInsight);
    }
    
    console.log(`Applied failure conversion: ${value * 100}% = +${partialInsight} partial insight`);
    return true;
  }
  
  /**
   * Remove an insight effect (typically not needed)
   * @param {object} effect - Effect object
   * @param {object} context - Context for removal
   * @returns {boolean} - Success status
   */
  remove(effect, context) {
    // Most insight effects don't need removal logic
    return true;
  }
}

// Export the handler
window.InsightHandler = InsightHandler;
export default InsightHandler;
