#!/bin/bash

# Create directories if they don't exist
mkdir -p frontend/src/systems/skill_tree
mkdir -p frontend/src/systems/effects
mkdir -p frontend/src/entities/nodes
mkdir -p frontend/src/ui/components

# Migrate skill tree files
cp -v ./static/js/engine/effects/skill-tree/skill_tree_manager.js frontend/src/systems/skill_tree/skill_tree_manager.js
cp -v ./static/js/engine/effects/skill-tree/skill-tree-store.js frontend/src/systems/skill_tree/skill_tree_store.js
cp -v ./static/js/ui/skill-tree/skill_tree_controller.js frontend/src/systems/skill_tree/skill_tree_controller.js

# Migrate effects files
cp -v ./static/js/engine/effects/handler/effect-handler.js frontend/src/systems/effects/effect_handler.js
cp -v ./static/js/engine/effects/handler/effect-registry.js frontend/src/systems/effects/effect_registry.js
cp -v ./static/js/engine/modular-effects.js frontend/src/systems/effects/modular_effects.js

# Migrate node-related files
cp -v ./static/js/engine/node_registry.js frontend/src/entities/nodes/node_registry.js
cp -v ./static/js/engine/node-creator.js frontend/src/entities/nodes/node_factory.js

# Verify the migrations
echo "Verifying migrations..."
for file in frontend/src/systems/skill_tree/*.js frontend/src/systems/effects/*.js frontend/src/entities/nodes/*.js; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file is missing"
  fi
done
