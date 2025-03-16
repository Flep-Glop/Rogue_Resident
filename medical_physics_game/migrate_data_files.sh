#!/bin/bash

# Create data directories if they don't exist
mkdir -p data/{characters,items,maps,questions,skill_tree}

# Migrate character data
if [ -f "medical_physics_game/data/characters.json" ]; then
    cp -v medical_physics_game/data/characters.json data/characters/characters.json
elif [ -f "data/characters.json" ]; then
    cp -v data/characters.json data/characters/characters.json
fi

# Migrate item data
if [ -f "medical_physics_game/data/items.json" ]; then
    cp -v medical_physics_game/data/items.json data/items/items.json
elif [ -f "data/items.json" ]; then
    cp -v data/items.json data/items/items.json
fi

# Migrate map data
if [ -f "medical_physics_game/data/floors.json" ]; then
    cp -v medical_physics_game/data/floors.json data/maps/floors.json
elif [ -f "data/floors.json" ]; then
    cp -v data/floors.json data/maps/floors.json
fi

if [ -f "medical_physics_game/data/node_types.json" ]; then
    cp -v medical_physics_game/data/node_types.json data/maps/node_types.json
elif [ -f "data/node_types.json" ]; then
    cp -v data/node_types.json data/maps/node_types.json
fi

if [ -f "medical_physics_game/data/node-templates.json" ]; then
    cp -v medical_physics_game/data/node-templates.json data/maps/node_templates.json
elif [ -f "data/node-templates.json" ]; then
    cp -v data/node-templates.json data/maps/node_templates.json
fi

# Migrate question data
if [ -f "medical_physics_game/data/questions.json" ]; then
    cp -v medical_physics_game/data/questions.json data/questions/questions.json
elif [ -f "data/questions.json" ]; then
    cp -v data/questions.json data/questions/questions.json
fi

if [ -f "medical_physics_game/data/patient_cases.json" ]; then
    cp -v medical_physics_game/data/patient_cases.json data/questions/patient_cases.json
elif [ -f "data/patient_cases.json" ]; then
    cp -v data/patient_cases.json data/questions/patient_cases.json
fi

# Migrate skill tree data
if [ -f "medical_physics_game/data/skill_tree.json" ]; then
    cp -v medical_physics_game/data/skill_tree.json data/skill_tree/skill_tree.json
elif [ -f "data/skill_tree.json" ]; then
    cp -v data/skill_tree.json data/skill_tree/skill_tree.json
fi

# Migrate game config
if [ -f "medical_physics_game/data/game_config.json" ]; then
    cp -v medical_physics_game/data/game_config.json data/game_config.json
elif [ -f "data/game_config.json" ]; then
    cp -v data/game_config.json data/game_config.json
fi

echo "Data files migration complete"
