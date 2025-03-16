// medical_physics_game/static/js/engine/effects/effect-registry.js

/**
 * Registry for effect handlers
 * Manages registration and retrieval of handlers for different effect types
 */
class EffectRegistry {
  constructor() {
    this.handlers = new Map();
  }
  
  /**
   * Register a handler for an effect type
   * @param {string} effectType - Type of effect
   * @param {object} handler - Handler object with apply and remove methods
   * @returns {EffectRegistry}
   */
  registerHandler(effectType, handler) {
    if (!handler || typeof handler.apply !== 'function') {
      throw new Error(`Invalid handler for effect type: ${effectType}`);
    }
    
    this.handlers.set(effectType, handler);
    console.log(`Registered effect handler: ${effectType}`);
    return this;
  }
  
  /**
   * Get a handler for an effect type
   * @param {string} effectType - Type of effect
   * @returns {object|null} - Handler or null if not found
   */
  getHandler(effectType) {
    return this.handlers.get(effectType) || null;
  }
  
  /**
   * Apply an effect using its registered handler
   * @param {object} effect - Effect object
   * @param {object} context - Context for effect application
   * @returns {boolean} - Success status
   */
  applyEffect(effect, context) {
    const handler = this.getHandler(effect.type);
    
    if (!handler) {
      console.warn(`No handler found for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.apply(effect, context);
  }
  
  /**
   * Remove an effect using its registered handler
   * @param {object} effect - Effect object
   * @param {object} context - Context for effect removal
   * @returns {boolean} - Success status
   */
  removeEffect(effect, context) {
    const handler = this.getHandler(effect.type);
    
    if (!handler || typeof handler.remove !== 'function') {
      console.warn(`No remove handler found for effect type: ${effect.type}`);
      return false;
    }
    
    return handler.remove(effect, context);
  }
}

// Export the class
window.EffectRegistry = EffectRegistry;
export default EffectRegistry;
