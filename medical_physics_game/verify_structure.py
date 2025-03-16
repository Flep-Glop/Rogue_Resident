#!/usr/bin/env python3
import os
import json
from collections import defaultdict

def check_directory_structure():
    expected_dirs = [
        "backend/api",
        "backend/core",
        "backend/data/models",
        "backend/data/repositories",
        "backend/data/schemas",
        "backend/plugins",
        "backend/utils",
        "frontend/src/core",
        "frontend/src/entities/player",
        "frontend/src/entities/nodes/node_types",
        "frontend/src/entities/items",
        "frontend/src/systems/combat",
        "frontend/src/systems/progression",
        "frontend/src/systems/effects",
        "frontend/src/systems/skill_tree",
        "frontend/src/ui/components",
        "frontend/src/ui/screens",
        "frontend/src/ui/hud",
        "frontend/src/ui/utils",
        "frontend/static/css/base",
        "frontend/static/css/components",
        "frontend/static/css/screens",
        "frontend/static/css/themes",
        "frontend/templates/pages",
        "frontend/templates/errors",
        "data/characters",
        "data/items",
        "data/maps",
        "data/questions",
        "data/skill_tree",
        "config",
        "tests/backend",
        "tests/frontend",
        "tests/integration",
        "docs",
        "tools"
    ]
    
    missing_dirs = []
    for directory in expected_dirs:
        if not os.path.exists(directory):
            missing_dirs.append(directory)
    
    return missing_dirs

def check_key_files():
    key_files = [
        # Backend core files
        "backend/core/state_manager.py",
        "backend/data/repositories/__init__.py",
        "backend/utils/db_utils.py",
        "backend/core/map_generator.py",
        "backend/plugins/base_plugin.py",
        
        # Frontend core files
        "frontend/src/core/bootstrap.js",
        "frontend/src/core/game.js",
        "frontend/src/core/event_system.js",
        "frontend/src/core/state_manager.js",
        
        # Frontend entity files
        "frontend/src/entities/nodes/node_registry.js",
        "frontend/src/entities/nodes/node_factory.js",
        
        # Frontend system files
        "frontend/src/systems/effects/effect_handler.js",
        "frontend/src/systems/effects/effect_registry.js",
        "frontend/src/systems/effects/modular_effects.js",
        "frontend/src/systems/skill_tree/skill_tree_manager.js",
        "frontend/src/systems/skill_tree/skill_tree_controller.js",
        
        # Templates
        "frontend/templates/base.html",
        "frontend/templates/errors/404.html",
        "frontend/templates/pages/index.html",
        
        # Config
        "app.py"
    ]
    
    missing_files = []
    for file in key_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    return missing_files

def find_duplicate_files():
    # Locations to check for duplicates
    locations = [
        "./static",
        "./frontend/static",
        "./medical_physics_game/frontend/static"
    ]
    
    # Store file paths by basename
    files_by_name = defaultdict(list)
    
    for location in locations:
        if not os.path.exists(location):
            continue
            
        for root, _, files in os.walk(location):
            for file in files:
                full_path = os.path.join(root, file)
                files_by_name[file].append(full_path)
    
    # Find duplicates
    duplicates = {name: paths for name, paths in files_by_name.items() 
                  if len(paths) > 1}
    
    return duplicates

if __name__ == "__main__":
    print("Verifying project structure...")
    
    missing_dirs = check_directory_structure()
    if missing_dirs:
        print("❌ Missing directories:")
        for dir in missing_dirs:
            print(f"  - {dir}")
    else:
        print("✅ All expected directories exist")
    
    missing_files = check_key_files()
    if missing_files:
        print("❌ Missing key files:")
        for file in missing_files:
            print(f"  - {file}")
    else:
        print("✅ All key files exist")
    
    duplicates = find_duplicate_files()
    if duplicates:
        print("⚠️ Duplicate files found:")
        for name, paths in duplicates.items():
            print(f"  {name}:")
            for path in paths:
                print(f"    - {path}")
    else:
        print("✅ No duplicate files found")
