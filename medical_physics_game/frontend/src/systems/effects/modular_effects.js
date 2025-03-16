// modular_effects.js - Plugin-based effect system for skill tree

const EffectRegistry = {
  // Store effect handlers
  handlers: {},
  
  /**
   * Register an effect handler
   * @param {String} effectType - Type name for the effect
   * @param {Object} handler - Handler object with apply and remove methods
   */
  register: function(effectType, handler) {
    if (!handler || typeof handler.apply !== 'function') {
      console.error(`Invalid handler for effect type: ${effectType}`);
      return false;
    }
    
    this.handlers[effectType] = handler;
    console.log(`Registered effect handler: ${effectType}`);
    return true;
  },
  
  /**
   * Get a handler for an effect type
   * @param {String} effectType - Type of effect
   * @returns {Object|null} Handler or null if not found
   */
  getHandler: function(effectType) {
    return this.handlers[effectType] || null;
  },
  
  /**
   * Apply an effect
   * @param {Object} effect - Effect object with type, value, condition
   * @param {Object} context - Context for applying the effect
   * @returns {Boolean} Success
   */
  applyEffect: function(effect, context) {
    const handler = this.getHandler(effect.type);
    
    if (!handler) {
      console.warn(`No handler found for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.apply(effect, context);
  },
  
  /**
   * Remove an effect
   * @param {Object} effect - Effect object with type, value, condition
   * @param {Object} context - Context for removing the effect
   * @returns {Boolean} Success
   */
  removeEffect: function(effect, context) {
    const handler = this.getHandler(effect.type);
    
    if (!handler || typeof handler.remove !== 'function') {
      console.warn(`No remove handler found for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.remove(effect, context);
  }
};

// Example effect handlers
const InsightGainHandler = {
  apply: function(effect, context) {
    console.log(`Applying insight gain effect: ${effect.value}`);
    // Implementation would interact with game state
    return true;
  },
  
  remove: function(effect, context) {
    console.log(`Removing insight gain effect: ${effect.value}`);
    // Implementation would interact with game state
    return true;
  }
};

const RevealParameterHandler = {
  apply: function(effect, context) {
    console.log(`Applying parameter reveal effect: ${effect.value}`);
    // Implementation would interact with game state
    return true;
  },
  
  remove: function(effect, context) {
    console.log(`Removing parameter reveal effect: ${effect.value}`);
    // Implementation would interact with game state
    return true;
  }
};

// Register default handlers
EffectRegistry.register('insight_gain_flat', InsightGainHandler);
EffectRegistry.register('insight_gain_multiplier', InsightGainHandler);
EffectRegistry.register('reveal_parameter', RevealParameterHandler);

// Integration with skill effect system
function integrateWithSkillEffectSystem() {
  // This would initialize the effect registry with the skill effect system
  // ...
  
  // Example: Override the _applyInsightGainEffects method in SkillEffectSystem
  const originalMethod = SkillEffectSystem._applyInsightGainEffects;
  
  SkillEffectSystem._applyInsightGainEffects = function(category, difficulty) {
    // Call registry handlers first
    Object.values(this.activeEffects).forEach(effect => {
      if (['insight_gain_flat', 'insight_gain_multiplier'].includes(effect.type)) {
        EffectRegistry.applyEffect(effect, { category, difficulty });
      }
    });
    
    // Call original method as fallback
    originalMethod.call(this, category, difficulty);
  };
}

// Export for use
window.EffectRegistry = EffectRegistry;