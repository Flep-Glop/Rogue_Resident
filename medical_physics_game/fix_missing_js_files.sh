#!/bin/bash

echo "Fixing missing JavaScript files..."

# Create directories if needed
mkdir -p frontend/src/systems/effects

# Check if the effect handler files exist in the engine/effects/handler directory
if [ -f "./static/js/engine/effects/handler/effect-handler.js" ]; then
    # Copy effect-handler.js to effect_handler.js
    cp -v ./static/js/engine/effects/handler/effect-handler.js frontend/src/systems/effects/effect_handler.js
    echo "✅ Created effect_handler.js"
    
    # Copy effect-registry.js to effect_registry.js if it exists
    if [ -f "./static/js/engine/effects/handler/effect-registry.js" ]; then
        cp -v ./static/js/engine/effects/handler/effect-registry.js frontend/src/systems/effects/effect_registry.js
        echo "✅ Created effect_registry.js"
    else
        # Create a placeholder if not found
        cat > frontend/src/systems/effects/effect_registry.js << 'END'
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
END
        echo "✅ Created placeholder effect_registry.js"
    fi
else
    # Create placeholders if not found
    cat > frontend/src/systems/effects/effect_handler.js << 'END'
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
END
    
    cat > frontend/src/systems/effects/effect_registry.js << 'END'
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
END
    echo "✅ Created placeholder effect files"
fi

echo "JavaScript file fixes complete!"
