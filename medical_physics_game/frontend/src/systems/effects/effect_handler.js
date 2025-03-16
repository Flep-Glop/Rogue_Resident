/**
 * Effect Handler - processes game effects
 */
import EffectRegistry from './effect_registry.js';

class EffectHandler {
    constructor() {
        this.activeEffects = [];
    }
    
    applyEffect(target, effectId, params = {}) {
        const effect = EffectRegistry.get(effectId);
        if (!effect) {
            console.warn(`Effect ${effectId} not found in registry`);
            return false;
        }
        
        const activeEffect = {
            id: effectId,
            target,
            params,
            startTime: Date.now()
        };
        
        this.activeEffects.push(activeEffect);
        return effect.apply(target, params);
    }
    
    update() {
        // Process active effects
    }
}

export default new EffectHandler();
