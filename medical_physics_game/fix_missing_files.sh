#!/bin/bash

# Create directories if they don't exist
mkdir -p frontend/src/core
mkdir -p frontend/src/systems/effects
mkdir -p frontend/src/systems/skill_tree

# Copy game.js from the original location
if [ -f "./static/js/game.js" ]; then
    cp -v ./static/js/game.js frontend/src/core/game.js
elif [ -f "./medical_physics_game/frontend/static/js/core/game.js" ]; then
    cp -v ./medical_physics_game/frontend/static/js/core/game.js frontend/src/core/game.js
fi

# Copy effect handler files
if [ -f "./static/js/engine/effects/handler/effect-handler.js" ]; then
    cp -v ./static/js/engine/effects/handler/effect-handler.js frontend/src/systems/effects/effect_handler.js
    cp -v ./static/js/engine/effects/handler/effect-registry.js frontend/src/systems/effects/effect_registry.js
fi

# Copy skill tree manager
if [ -f "./static/js/engine/effects/skill-tree/skill_tree_manager.js" ]; then
    cp -v ./static/js/engine/effects/skill-tree/skill_tree_manager.js frontend/src/systems/skill_tree/skill_tree_manager.js
elif [ -f "./static/js/engine/skill-tree/skill_tree_manager.js" ]; then
    cp -v ./static/js/engine/skill-tree/skill_tree_manager.js frontend/src/systems/skill_tree/skill_tree_manager.js
fi

echo "Missing files copy complete"
