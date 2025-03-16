/**
 * Effect Registry - manages registration of effects
 */
class EffectRegistry {
    constructor() {
        this.effects = {};
    }
    
    register(id, effect) {
        this.effects[id] = effect;
    }
    
    get(id) {
        return this.effects[id] || null;
    }
    
    getAll() {
        return this.effects;
    }
}

export default new EffectRegistry();
