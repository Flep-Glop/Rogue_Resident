# Medical Physics Game: Complete Reorganization Guide

## Table of Contents

1. [Introduction and Goals](#introduction-and-goals)
2. [Preparation Steps](#preparation-steps)
3. [New Project Structure](#new-project-structure)
4. [Migration Plan](#migration-plan)
   - [Phase 1: Create New Directory Structure](#phase-1-create-new-directory-structure)
   - [Phase 2: Migrate Backend Core](#phase-2-migrate-backend-core)
   - [Phase 3: Migrate Frontend Core](#phase-3-migrate-frontend-core)
   - [Phase 4: Migrate Game Data](#phase-4-migrate-game-data)
   - [Phase 5: Migrate UI Components](#phase-5-migrate-ui-components)
   - [Phase 6: Update Project Entry Points](#phase-6-update-project-entry-points)
5. [Detailed File Migration Reference](#detailed-file-migration-reference)
6. [Handling Dependencies](#handling-dependencies)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

## Introduction and Goals

This guide provides a comprehensive plan for reorganizing the Medical Physics Game project from its current structure to a more scalable, maintainable architecture. The reorganization aims to:

- Improve code organization and discoverability
- Separate concerns between backend, frontend, and game logic
- Enable better testability and maintainability
- Support future expansion and feature development
- Adopt modern architectural patterns

The reorganization will be conducted in phases to minimize disruption and allow for incremental testing.

## Preparation Steps

Before beginning the reorganization, take these critical preparation steps:

1. **Create a New Branch**:
   ```bash
   git checkout -b project-reorganization
   ```

2. **Backup Your Project**:
   ```bash
   cp -r medical_physics_game medical_physics_game_backup
   ```

3. **Document Current Functionality**:
   Create a checklist of all working features to verify after migration.

4. **Set Up Version Control Properly**:
   Ensure your `.gitignore` includes proper patterns:
   ```
   __pycache__/
   *.py[cod]
   *$py.class
   *.so
   .env
   .venv
   env/
   venv/
   ENV/
   .idea/
   .vscode/
   node_modules/
   ```

5. **Install Required Tools**:
   ```bash
   pip install pytest isort autopep8
   ```

## New Project Structure

Below is the detailed target structure with explanations for each component:

```
medical_physics_game/                # Project root
├── backend/                         # All server-side code
│   ├── api/                         # API endpoints
│   │   ├── __init__.py              # Module initialization
│   │   ├── routes.py                # API route definitions
│   │   ├── character_routes.py      # Character-related endpoints
│   │   ├── game_state_routes.py     # Game state endpoints
│   │   ├── item_routes.py           # Item-related endpoints
│   │   ├── question_routes.py       # Question-related endpoints
│   │   └── skill_tree_routes.py     # Skill tree endpoints
│   ├── core/                        # Core game logic
│   │   ├── __init__.py
│   │   ├── game_loop.py             # Main game loop logic
│   │   ├── combat.py                # Combat mechanics
│   │   ├── progression.py           # Player progression system
│   │   ├── event_system.py          # Game event handling
│   │   └── state_manager.py         # Game state management
│   ├── data/                        # Data access layer
│   │   ├── __init__.py
│   │   ├── models/                  # Data models
│   │   │   ├── __init__.py
│   │   │   ├── character.py         # Character model
│   │   │   ├── item.py              # Item model
│   │   │   ├── node.py              # Map node model
│   │   │   ├── question.py          # Question model
│   │   │   └── skill_tree.py        # Skill tree model
│   │   ├── repositories/            # Data access functions
│   │   │   ├── __init__.py
│   │   │   ├── character_repo.py    # Character data operations
│   │   │   ├── item_repo.py         # Item data operations
│   │   │   ├── node_repo.py         # Node data operations
│   │   │   ├── question_repo.py     # Question data operations
│   │   │   └── skill_tree_repo.py   # Skill tree data operations
│   │   └── schemas/                 # Validation schemas
│   │       ├── __init__.py
│   │       ├── character_schema.py  # Character validation
│   │       ├── item_schema.py       # Item validation 
│   │       ├── node_schema.py       # Node validation
│   │       └── skill_tree_schema.py # Skill tree validation
│   ├── plugins/                     # Plugin system
│   │   ├── __init__.py
│   │   ├── base_plugin.py           # Plugin base class
│   │   ├── plugin_manager.py        # Plugin registration and management
│   │   └── question_plugin.py       # Question plugin implementation
│   └── utils/                       # Utility functions
│       ├── __init__.py
│       ├── db_utils.py              # Database utilities
│       ├── file_utils.py            # File operations
│       ├── logging.py               # Logging configuration
│       └── validators.py            # Generic validators
├── frontend/                        # All client-side code
│   ├── src/                         # Source JavaScript
│   │   ├── core/                    # Core frontend logic
│   │   │   ├── bootstrap.js         # Application initialization
│   │   │   ├── event_system.js      # Frontend event system
│   │   │   ├── game.js              # Main game controller
│   │   │   └── state_manager.js     # Frontend state management
│   │   ├── entities/                # Game entities
│   │   │   ├── player/              # Player-related code
│   │   │   │   ├── character.js     # Character implementation
│   │   │   │   └── inventory.js     # Inventory management
│   │   │   ├── nodes/               # Node system
│   │   │   │   ├── node_factory.js  # Node creation
│   │   │   │   ├── node_registry.js # Node type registration
│   │   │   │   └── node_types/      # Specific node implementations
│   │   │   │       ├── boss.js      # Boss node
│   │   │   │       ├── elite.js     # Elite node
│   │   │   │       ├── event.js     # Event node
│   │   │   │       ├── patient.js   # Patient case node
│   │   │   │       ├── question.js  # Question node
│   │   │   │       ├── rest.js      # Rest node
│   │   │   │       ├── shop.js      # Shop node
│   │   │   │       └── treasure.js  # Treasure node
│   │   │   └── items/               # Item system
│   │   │       ├── item_factory.js  # Item creation
│   │   │       ├── item_manager.js  # Item management
│   │   │       └── item_effects.js  # Item effect implementation
│   │   ├── systems/                 # Game systems
│   │   │   ├── combat/              # Combat mechanics
│   │   │   │   ├── combat_manager.js # Combat management
│   │   │   │   └── effects/         # Combat effects
│   │   │   ├── progression/         # Progression and rewards
│   │   │   │   ├── reputation.js    # Reputation system
│   │   │   │   └── progression.js   # Player progression
│   │   │   ├── effects/             # Effects and buffs/debuffs
│   │   │   │   ├── effect_handler.js # Effect processing
│   │   │   │   ├── effect_registry.js # Effect registration
│   │   │   │   └── modular_effects.js # Modular effect system
│   │   │   └── skill_tree/          # Skill tree system
│   │   │       ├── skill_tree_manager.js # Skill tree management
│   │   │       ├── skill_tree_controller.js # Skill tree control
│   │   │       └── skill_tree_effects.js # Skill tree effects
│   │   ├── ui/                      # User interface
│   │   │   ├── components/          # Reusable UI components
│   │   │   │   ├── character_panel.js # Character stats display
│   │   │   │   ├── inventory_panel.js # Inventory interface
│   │   │   │   ├── map_renderer.js  # Map visualization
│   │   │   │   └── skill_tree_ui.js # Skill tree interface
│   │   │   ├── screens/             # Full-screen UI states
│   │   │   │   ├── character_select.js # Character selection screen
│   │   │   │   ├── game_over.js     # Game over screen
│   │   │   │   ├── main_game.js     # Main game screen
│   │   │   │   └── victory.js       # Victory screen
│   │   │   ├── hud/                 # HUD elements
│   │   │   │   ├── status_bar.js    # Player status bar
│   │   │   │   └── tooltip.js       # Tooltip system
│   │   │   └── utils/               # UI utilities
│   │   │       ├── api_client.js    # API communication
│   │   │       ├── dom_utils.js     # DOM manipulation helpers
│   │   │       └── error_handler.js # Error handling
│   │   └── utils/                   # Shared utilities
│   │       ├── math/                # Math helpers
│   │       │   ├── random.js        # Random number generation
│   │       │   └── vector.js        # Vector calculations
│   │       ├── data/                # Data processing
│   │       │   ├── serializer.js    # Data serialization
│   │       │   └── validator.js     # Client-side validation
│   │       └── debug/               # Debug tools
│   │           ├── debug_tools.js   # Debugging utilities
│   │           └── logger.js        # Client-side logging
│   ├── static/                      # Static assets
│   │   ├── css/                     # CSS files
│   │   │   ├── base/                # Base styles
│   │   │   │   ├── layout.css       # Layout definitions
│   │   │   │   ├── reset.css        # CSS reset
│   │   │   │   └── variables.css    # CSS variables
│   │   │   ├── components/          # Component styles
│   │   │   │   ├── character.css    # Character styling
│   │   │   │   ├── inventory.css    # Inventory styling
│   │   │   │   ├── map.css          # Map styling
│   │   │   │   └── nodes.css        # Node styling
│   │   │   ├── screens/             # Screen styles
│   │   │   │   ├── character_select.css # Character selection screen
│   │   │   │   ├── game.css         # Main game screen
│   │   │   │   └── skill_tree.css   # Skill tree screen
│   │   │   └── themes/              # Visual themes
│   │   │       └── retro_theme.css  # Retro visual theme
│   │   ├── img/                     # Images
│   │   │   ├── characters/          # Character images
│   │   │   ├── items/               # Item images
│   │   │   ├── nodes/               # Node images
│   │   │   └── ui/                  # UI images
│   │   └── assets/                  # Other assets
│   │       ├── fonts/               # Font files
│   │       └── audio/               # Audio files
│   └── templates/                   # HTML templates
│       ├── base.html                # Base template
│       ├── components/              # Reusable template components
│       │   └── skill_tree_modal.html # Skill tree modal
│       ├── pages/                   # Page templates
│       │   ├── character_select.html # Character selection
│       │   ├── game.html            # Main game
│       │   ├── index.html           # Landing page
│       │   └── item_editor.html     # Item editor
│       └── errors/                  # Error templates
│           ├── 404.html             # Not found
│           └── 500.html             # Server error
├── data/                           # Game data files
│   ├── characters/                 # Character definitions
│   │   └── characters.json         # Character data
│   ├── items/                      # Item definitions
│   │   └── items.json              # Item data
│   ├── maps/                       # Map definitions
│   │   └── floors.json             # Floor data
│   ├── questions/                  # Question definitions
│   │   └── questions.json          # Question data
│   ├── skill_tree/                 # Skill tree definitions
│   │   └── skill_tree.json         # Skill tree data
│   └── game_config.json            # Global game configuration
├── config/                         # Configuration files
│   ├── development.py              # Development settings
│   ├── production.py               # Production settings
│   └── test.py                     # Test settings
├── tests/                          # Test suite
│   ├── backend/                    # Backend tests
│   │   ├── api/                    # API tests
│   │   ├── core/                   # Core logic tests
│   │   ├── data/                   # Data layer tests
│   │   └── plugins/                # Plugin tests
│   ├── frontend/                   # Frontend tests
│   │   ├── core/                   # Core tests
│   │   ├── entities/               # Entity tests
│   │   ├── systems/                # System tests
│   │   └── ui/                     # UI tests
│   ├── integration/                # Integration tests
│   └── conftest.py                 # Test configuration
├── docs/                           # Documentation
│   ├── architecture.md             # Architecture overview
│   ├── api.md                      # API documentation
│   ├── game_design.md              # Game design documentation
│   └── development.md              # Development guidelines
├── tools/                          # Development tools
│   ├── data_editors/               # Data editing tools
│   │   └── item_editor.py          # Item editor
│   └── debugging/                  # Debugging tools
│       └── skill_tree_dev_tool.js  # Skill tree debugging
├── app.py                         # Application entry point
├── wsgi.py                        # WSGI entry point
├── requirements.txt               # Python dependencies
├── package.json                   # JavaScript dependencies
└── README.md                      # Project documentation
```

## Migration Plan

The migration will be conducted in six phases, each with specific goals and steps.

### Phase 1: Create New Directory Structure

**Goal**: Set up the new directory structure without moving files yet.

1. **Create root directories**:
   ```bash
   mkdir -p medical_physics_game/backend/{api,core,data/{models,repositories,schemas},plugins,utils}
   mkdir -p medical_physics_game/frontend/{src/{core,entities/{player,nodes/node_types,items},systems/{combat,progression,effects,skill_tree},ui/{components,screens,hud,utils},utils/{math,data,debug}},static/{css/{base,components,screens,themes},img/{characters,items,nodes,ui},assets/{fonts,audio}},templates/{components,pages,errors}}
   mkdir -p medical_physics_game/{data/{characters,items,maps,questions,skill_tree},config,tests/{backend,frontend,integration},docs,tools/{data_editors,debugging}}
   ```

2. **Create empty __init__.py files for all Python modules**:
   ```bash
   find medical_physics_game -type d -name "*" | grep -v "static\|templates\|img\|css\|js" | xargs -I {} touch {}/__init__.py
   ```

3. **Create placeholder README files**:
   ```bash
   echo "# Medical Physics Game" > medical_physics_game/README.md
   ```

### Phase 2: Migrate Backend Core

**Goal**: Move core Python files to their new locations.

1. **Move core game logic files**:
   
   ```bash
   # Move app.py to the project root (make a copy for now)
   cp medical_physics_game/app.py medical_physics_game/app.py.new
   
   # Move game state management
   cp medical_physics_game/game_state.py medical_physics_game/backend/core/state_manager.py
   
   # Move data management
   cp medical_physics_game/data_manager.py medical_physics_game/backend/data/repositories/__init__.py
   
   # Move database utilities
   cp medical_physics_game/db_utils.py medical_physics_game/backend/utils/db_utils.py
   
   # Move map generation
   cp medical_physics_game/map_generator.py medical_physics_game/backend/core/map_generator.py
   
   # Move node plugins
   cp medical_physics_game/node_plugins.py medical_physics_game/backend/plugins/base_plugin.py
   
   # Move question plugin
   cp medical_physics_game/plugins/question_plugin.py medical_physics_game/backend/plugins/question_plugin.py
   ```

2. **Create core model files based on data structures**:
   
   For each model file, extract relevant classes and functions from the existing code. Example for character.py:
   
   ```python
   # medical_physics_game/backend/data/models/character.py
   class Character:
       def __init__(self, id, name, max_hp, current_hp, abilities, stats):
           self.id = id
           self.name = name
           self.max_hp = max_hp
           self.current_hp = current_hp
           self.abilities = abilities
           self.stats = stats
           
   # Add methods extracted from game_state.py and data_manager.py
   ```

3. **Create repository files**:
   
   Extract data access functions from data_manager.py into appropriate repository files:
   
   ```python
   # medical_physics_game/backend/data/repositories/character_repo.py
   from backend.data.models.character import Character
   
   def get_all_characters():
       # Implementation based on data_manager.py
       pass
       
   def get_character_by_id(character_id):
       # Implementation based on data_manager.py
       pass
   ```

4. **Create API routes**:
   
   Extract API endpoints from app.py:
   
   ```python
   # medical_physics_game/backend/api/routes.py
   from flask import Blueprint
   
   api_bp = Blueprint('api', __name__)
   
   from . import character_routes, game_state_routes, item_routes, question_routes, skill_tree_routes
   ```
   
   ```python
   # medical_physics_game/backend/api/character_routes.py
   from flask import jsonify, request
   from . import api_bp
   from backend.data.repositories.character_repo import get_all_characters, get_character_by_id
   
   @api_bp.route('/characters', methods=['GET'])
   def get_characters():
       characters = get_all_characters()
       return jsonify(characters)
   ```

### Phase 3: Migrate Frontend Core

**Goal**: Reorganize JavaScript files into the new structure.

1. **Move core JS files**:
   
   ```bash
   # Move core files
   cp medical_physics_game/static/js/bootstrap.js medical_physics_game/frontend/src/core/bootstrap.js
   cp medical_physics_game/static/js/game.js medical_physics_game/frontend/src/core/game.js
   cp medical_physics_game/static/js/engine/core/event_system.js medical_physics_game/frontend/src/core/event_system.js
   cp medical_physics_game/static/js/engine/core/state_manager.js medical_physics_game/frontend/src/core/state_manager.js
   ```

2. **Move and reorganize entity files**:
   
   ```bash
   # Character-related files
   cp medical_physics_game/static/js/character_assets.js medical_physics_game/frontend/src/entities/player/character_assets.js
   cp medical_physics_game/static/js/character_select.js medical_physics_game/frontend/src/ui/screens/character_select.js
   
   # Node-related files
   cp medical_physics_game/static/js/engine/node_registry.js medical_physics_game/frontend/src/entities/nodes/node_registry.js
   cp medical_physics_game/static/js/engine/node-creator.js medical_physics_game/frontend/src/entities/nodes/node_factory.js
   
   # Component files - move to node_types directory
   mkdir -p medical_physics_game/frontend/src/entities/nodes/node_types
   cp medical_physics_game/static/js/components/boss_component.js medical_physics_game/frontend/src/entities/nodes/node_types/boss.js
   cp medical_physics_game/static/js/components/elite_component.js medical_physics_game/frontend/src/entities/nodes/node_types/elite.js
   cp medical_physics_game/static/js/components/event_component.js medical_physics_game/frontend/src/entities/nodes/node_types/event.js
   cp medical_physics_game/static/js/components/patient_case_component.js medical_physics_game/frontend/src/entities/nodes/node_types/patient.js
   cp medical_physics_game/static/js/components/question_component.js medical_physics_game/frontend/src/entities/nodes/node_types/question.js
   cp medical_physics_game/static/js/components/rest_component.js medical_physics_game/frontend/src/entities/nodes/node_types/rest.js
   cp medical_physics_game/static/js/components/shop_component.js medical_physics_game/frontend/src/entities/nodes/node_types/shop.js
   cp medical_physics_game/static/js/components/treasure_component.js medical_physics_game/frontend/src/entities/nodes/node_types/treasure.js
   
   # Item-related files
   cp medical_physics_game/static/js/engine/item_manager.js medical_physics_game/frontend/src/entities/items/item_manager.js
   cp medical_physics_game/static/js/item_editor.js medical_physics_game/frontend/src/entities/items/item_editor.js
   ```

3. **Move and reorganize system files**:
   
   ```bash
   # Effects system
   cp medical_physics_game/static/js/engine/effects/handler/effect-handler.js medical_physics_game/frontend/src/systems/effects/effect_handler.js
   cp medical_physics_game/static/js/engine/effects/handler/effect-registry.js medical_physics_game/frontend/src/systems/effects/effect_registry.js
   cp medical_physics_game/static/js/engine/modular-effects.js medical_physics_game/frontend/src/systems/effects/modular_effects.js
   
   # Skill tree system
   mkdir -p medical_physics_game/frontend/src/systems/skill_tree
   cp medical_physics_game/static/js/engine/effects/skill-tree/skill_tree_manager.js medical_physics_game/frontend/src/systems/skill_tree/skill_tree_manager.js
   cp medical_physics_game/static/js/ui/skill-tree/skill_tree_controller.js medical_physics_game/frontend/src/systems/skill_tree/skill_tree_controller.js
   cp medical_physics_game/static/js/engine/effects/skill-tree/skill-tree-store.js medical_physics_game/frontend/src/systems/skill_tree/skill_tree_store.js
   
   # Progression system
   cp medical_physics_game/static/js/engine/progression.js medical_physics_game/frontend/src/systems/progression/progression.js
   cp medical_physics_game/static/js/engine/reputation_system.js medical_physics_game/frontend/src/systems/progression/reputation.js
   ```

4. **Move and reorganize UI files**:
   
   ```bash
   # UI Components
   cp medical_physics_game/static/js/ui/character_panel.js medical_physics_game/frontend/src/ui/components/character_panel.js
   cp medical_physics_game/static/js/ui/inventory_system.js medical_physics_game/frontend/src/ui/components/inventory_panel.js
   cp medical_physics_game/static/js/ui/map_renderer.js medical_physics_game/frontend/src/ui/components/map_renderer.js
   cp medical_physics_game/static/js/ui/skill_tree_ui.js medical_physics_game/frontend/src/ui/components/skill_tree_ui.js
   
   # UI Utils
   cp medical_physics_game/static/js/ui/utils/api-client.js medical_physics_game/frontend/src/ui/utils/api_client.js
   cp medical_physics_game/static/js/ui/utils/error_handler.js medical_physics_game/frontend/src/ui/utils/error_handler.js
   
   # Utils
   cp medical_physics_game/static/js/engine/debug_tools.js medical_physics_game/frontend/src/utils/debug/debug_tools.js
   ```

5. **Move CSS files**:
   
   ```bash
   # Base CSS files
   cp medical_physics_game/static/css/base/layout.css medical_physics_game/frontend/static/css/base/layout.css
   cp medical_physics_game/static/css/base/reset.css medical_physics_game/frontend/static/css/base/reset.css
   cp medical_physics_game/static/css/base/variables.css medical_physics_game/frontend/static/css/base/variables.css
   
   # Component CSS files
   cp medical_physics_game/static/css/components/character.css medical_physics_game/frontend/static/css/components/character.css
   cp medical_physics_game/static/css/components/inventory.css medical_physics_game/frontend/static/css/components/inventory.css
   cp medical_physics_game/static/css/components/map.css medical_physics_game/frontend/static/css/components/map.css
   cp medical_physics_game/static/css/components/nodes.css medical_physics_game/frontend/static/css/components/nodes.css
   
   # Theme CSS files
   cp medical_physics_game/static/css/themes/retro-theme.css medical_physics_game/frontend/static/css/themes/retro_theme.css
   
   # Other CSS files
   cp medical_physics_game/static/css/skill_tree.css medical_physics_game/frontend/static/css/screens/skill_tree.css
   cp medical_physics_game/static/css/main.css medical_physics_game/frontend/static/css/screens/game.css
   ```

6. **Move template files**:
   
   ```bash
   # Page templates
   cp medical_physics_game/templates/index.html medical_physics_game/frontend/templates/pages/index.html
   cp medical_physics_game/templates/character_select.html medical_physics_game/frontend/templates/pages/character_select.html
   cp medical_physics_game/templates/item_editor.html medical_physics_game/frontend/templates/pages/item_editor.html
   ```

### Phase 4: Migrate Game Data

**Goal**: Reorganize JSON data files into a more structured layout.

1. **Move data files to their new locations**:
   
   ```bash
   # Character data
   cp medical_physics_game/data/characters.json medical_physics_game/data/characters/characters.json
   
   # Item data
   cp medical_physics_game/data/items.json medical_physics_game/data/items/items.json
   
   # Map data
   cp medical_physics_game/data/floors.json medical_physics_game/data/maps/floors.json
   cp medical_physics_game/data/node_types.json medical_physics_game/data/maps/node_types.json
   cp medical_physics_game/data/node-templates.json medical_physics_game/data/maps/node_templates.json
   
   # Question data
   cp medical_physics_game/data/questions.json medical_physics_game/data/questions/questions.json
   cp medical_physics_game/data/patient_cases.json medical_physics_game/data/questions/patient_cases.json
   
   # Skill tree data
   cp medical_physics_game/data/skill_tree.json medical_physics_game/data/skill_tree/skill_tree.json
   
   # Game config
   cp medical_physics_game/data/game_config.json medical_physics_game/data/game_config.json
   ```

2. **Update data files for new structure** (create a Python script to help with this):

   ```python
   # tools/data_migration.py
   import json
   import os
   
   # Load data files and update paths/references as needed
   def update_data_references():
       # Example: Update skill tree references
       with open('medical_physics_game/data/skill_tree/skill_tree.json', 'r') as f:
           skill_tree = json.load(f)
           
       # Update file references
       # ... code to update references
           
       with open('medical_physics_game/data/skill_tree/skill_tree.json', 'w') as f:
           json.dump(skill_tree, f, indent=2)
           
   if __name__ == "__main__":
       update_data_references()
   ```

   ```bash
   python tools/data_migration.py
   ```

### Phase 5: Migrate UI Components

**Goal**: Update HTML templates and ensure they work with the new structure.

1. **Create base template**:
   
   ```html
   <!-- medical_physics_game/frontend/templates/base.html -->
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>{% block title %}Medical Physics Game{% endblock %}</title>
       
       <!-- Base CSS -->
       <link rel="stylesheet" href="{{ url_for('static', filename='css/base/reset.css') }}">
       <link rel="stylesheet" href="{{ url_for('static', filename='css/base/variables.css') }}">
       <link rel="stylesheet" href="{{ url_for('static', filename='css/base/layout.css') }}">
       
       <!-- Theme CSS -->
       <link rel="stylesheet" href="{{ url_for('static', filename='css/themes/retro_theme.css') }}">
       
       {% block additional_css %}{% endblock %}
   </head>
   <body>
       <div id="app">
           {% block content %}{% endblock %}
       </div>
       
       <!-- Core scripts -->
       <script src="{{ url_for('static', filename='js/core/bootstrap.js') }}" type="module"></script>
       {% block additional_js %}{% endblock %}
   </body>
   </html>
   ```

2. **Update page templates to extend base template**:
   
   ```html
   <!-- medical_physics_game/frontend/templates/pages/game.html -->
   {% extends "base.html" %}
   
   {% block title %}Medical Physics Game - Play{% endblock %}
   
   {% block additional_css %}
   <link rel="stylesheet" href="{{ url_for('static', filename='css/components/character.css') }}">
   <link rel="stylesheet" href="{{ url_for('static', filename='css/components/inventory.css') }}">
   <link rel="stylesheet" href="{{ url_for('static', filename='css/components/map.css') }}">
   <link rel="stylesheet" href="{{ url_for('static', filename='css/components/nodes.css') }}">
   <link rel="stylesheet" href="{{ url_for('static', filename='css/screens/game.css') }}">
   {% endblock %}
   
   {% block content %}
   <div id="game-container">
       <!-- Game content here -->
   </div>
   {% endblock %}
   
   {% block additional_js %}
   <script src="{{ url_for('static', filename='js/core/game.js') }}" type="module"></script>
   {% endblock %}
   ```

3. **Create error templates**:
   
   ```html
   <!-- medical_physics_game/frontend/templates/errors/404.html -->
   {% extends "base.html" %}
   
   {% block title %}Page Not Found{% endblock %}
   
   {% block content %}
   <div class="error-container">
       <h1>404 - Page Not Found</h1>
       <p>The page you're looking for doesn't exist.</p>
       <a href="{{ url_for('index') }}">Return to Home</a>
   </div>
   {% endblock %}
   ```

### Phase 6: Update Project Entry Points

**Goal**: Create new application entry points that work with the reorganized structure.

1. **Create new app.py**:
   
   ```python
   # medical_physics_game/app.py
   from flask import Flask, render_template
   from backend.api.routes import api_bp
   
   def create_app(config_name='development'):
       app = Flask(__name__, 
                  static_folder='frontend/static',
                  template_folder='frontend/templates')
       
       # Load configuration
       if config_name == 'development':
           app.config.from_pyfile('config/development.py')
       elif config_name == 'production':
           app.config.from_pyfile('config/production.py')
       elif config_name == 'test':
           app.config.from_pyfile('config/test.py')
       
       # Register blueprints
       app.register_blueprint(api_bp, url_prefix='/api')
       
       # Error handlers
       @app.errorhandler(404)
       def page_not_found(e):
           return render_template('errors/404.html'), 404
       
       @app.errorhandler(500)
       def server_error(e):
           return render_template('errors/500.html'), 500
       
       # Routes
       @app.route('/')
       def index():
           return render_template('pages/index.html')
       
       @app.route('/character-select')
       def character_select():
           return render_template('pages/character_select.html')
       
       @app.route('/game')
       def game():
           return render_template('pages/game.html')
       
       @app.route('/item-editor')
       def item_editor():
           return render_template('pages/item_editor.html')
       
       return app
   
   if __name__ == '__main__':
       app = create_app()
       app.run(debug=True)
   ```

2. **Create WSGI entry point**:
   
   ```python
   # medical_physics_game/wsgi.py
   from app import create_app
   
   app = create_app('production')
   
   if __name__ == '__main__':
       app.run()
   ```

3. **Create configuration files**:
   
   ```python
   # medical_physics_game/config/development.py
   DEBUG = True
   SECRET_KEY = 'dev-secret-key'
   DATABASE_PATH = 'game_data.db'
   ```
   
   ```python
   # medical_physics_game/config/production.py
   DEBUG = False
   SECRET_KEY = 'production-secret-key-change-me'
   DATABASE_PATH = '/var/www/medical_physics_game/game_data.db'
   ```
   
   ```python
   # medical_physics_game/config/test.py
   DEBUG = True
   TESTING = True
   SECRET_KEY = 'test-secret-key'
   DATABASE_PATH = ':memory:'
   ```

## Detailed File Migration Reference

This section provides a detailed reference for migrating each file in the original structure to its new location, including necessary modifications.

### Backend Files

#### Python Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| app.py | app.py (root) | Rewrite using Flask factory pattern |
| data_manager.py | backend/data/repositories/__init__.py | Split into multiple repository files |
| db_utils.py | backend/utils/db_utils.py | Update imports |
| game_state.py | backend/core/state_manager.py | Extract model classes, update imports |
| map_generator.py | backend/core/map_generator.py | Update imports |
| node_plugins.py | backend/plugins/base_plugin.py | Update imports |
| plugins/question_plugin.py | backend/plugins/question_plugin.py | Update imports |

### Frontend Files

#### JavaScript Core Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| static/js/bootstrap.js | frontend/src/core/bootstrap.js | Update import paths |
| static/js/game.js | frontend/src/core/game.js | Update import paths |
| static/js/engine/core/event_system.js | frontend/src/core/event_system.js | Update import paths |
| static/js/engine/core/state_manager.js | frontend/src/core/state_manager.js | Update import paths |

#### JavaScript Entity Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| static/js/character_assets.js | frontend/src/entities/player/character_assets.js | Update import paths |
| static/js/character_select.js | frontend/src/ui/screens/character_select.js | Update import paths |
| static/js/engine/node_registry.js | frontend/src/entities/nodes/node_registry.js | Update import paths |
| static/js/engine/node-creator.js | frontend/src/entities/nodes/node_factory.js | Update import paths |

#### JavaScript Component Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| static/js/components/boss_component.js | frontend/src/entities/nodes/node_types/boss.js | Update class name, update import paths |
| static/js/components/elite_component.js | frontend/src/entities/nodes/node_types/elite.js | Update class name, update import paths |
| static/js/components/event_component.js | frontend/src/entities/nodes/node_types/event.js | Update class name, update import paths |
| static/js/components/patient_case_component.js | frontend/src/entities/nodes/node_types/patient.js | Update class name, update import paths |
| static/js/components/question_component.js | frontend/src/entities/nodes/node_types/question.js | Update class name, update import paths |
| static/js/components/rest_component.js | frontend/src/entities/nodes/node_types/rest.js | Update class name, update import paths |
| static/js/components/shop_component.js | frontend/src/entities/nodes/node_types/shop.js | Update class name, update import paths |
| static/js/components/treasure_component.js | frontend/src/entities/nodes/node_types/treasure.js | Update class name, update import paths |

#### JavaScript System Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| static/js/engine/effects/handler/effect-handler.js | frontend/src/systems/effects/effect_handler.js | Update import paths |
| static/js/engine/effects/handler/effect-registry.js | frontend/src/systems/effects/effect_registry.js | Update import paths |
| static/js/engine/modular-effects.js | frontend/src/systems/effects/modular_effects.js | Update import paths |
| static/js/engine/effects/skill-tree/skill_tree_manager.js | frontend/src/systems/skill_tree/skill_tree_manager.js | Update import paths |
| static/js/ui/skill-tree/skill_tree_controller.js | frontend/src/systems/skill_tree/skill_tree_controller.js | Update import paths |
| static/js/engine/effects/skill-tree/skill-tree-store.js | frontend/src/systems/skill_tree/skill_tree_store.js | Update import paths |
| static/js/engine/progression.js | frontend/src/systems/progression/progression.js | Update import paths |
| static/js/engine/reputation_system.js | frontend/src/systems/progression/reputation.js | Update import paths |

#### JavaScript UI Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| static/js/ui/character_panel.js | frontend/src/ui/components/character_panel.js | Update import paths |
| static/js/ui/inventory_system.js | frontend/src/ui/components/inventory_panel.js | Update class name, update import paths |
| static/js/ui/map_renderer.js | frontend/src/ui/components/map_renderer.js | Update import paths |
| static/js/ui/skill_tree_ui.js | frontend/src/ui/components/skill_tree_ui.js | Update import paths |
| static/js/ui/utils/api-client.js | frontend/src/ui/utils/api_client.js | Update import paths |
| static/js/ui/utils/error_handler.js | frontend/src/ui/utils/error_handler.js | Update import paths |

#### CSS Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| static/css/base/layout.css | frontend/static/css/base/layout.css | Update asset paths |
| static/css/base/reset.css | frontend/static/css/base/reset.css | None |
| static/css/base/variables.css | frontend/static/css/base/variables.css | None |
| static/css/components/character.css | frontend/static/css/components/character.css | Update asset paths |
| static/css/components/inventory.css | frontend/static/css/components/inventory.css | Update asset paths |
| static/css/components/map.css | frontend/static/css/components/map.css | Update asset paths |
| static/css/components/nodes.css | frontend/static/css/components/nodes.css | Update asset paths |
| static/css/themes/retro-theme.css | frontend/static/css/themes/retro_theme.css | Update asset paths |
| static/css/skill_tree.css | frontend/static/css/screens/skill_tree.css | Update asset paths |
| static/css/main.css | frontend/static/css/screens/game.css | Update asset paths |

#### Template Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| templates/index.html | frontend/templates/pages/index.html | Extend base template, update asset paths |
| templates/character_select.html | frontend/templates/pages/character_select.html | Extend base template, update asset paths |
| templates/item_editor.html | frontend/templates/pages/item_editor.html | Extend base template, update asset paths |

### Data Files

| Original Path | New Path | Required Modifications |
|---------------|----------|------------------------|
| data/characters.json | data/characters/characters.json | None |
| data/items.json | data/items/items.json | None |
| data/floors.json | data/maps/floors.json | None |
| data/node_types.json | data/maps/node_types.json | None |
| data/node-templates.json | data/maps/node_templates.json | None |
| data/questions.json | data/questions/questions.json | None |
| data/patient_cases.json | data/questions/patient_cases.json | None |
| data/skill_tree.json | data/skill_tree/skill_tree.json | None |
| data/game_config.json | data/game_config.json | None |

## Handling Dependencies

One of the key challenges in this reorganization is updating import paths and dependencies. Here's how to systematically address this:

### Python Dependencies

1. **Create import helper script**:
   
   ```python
   # tools/import_fixer.py
   import os
   import re
   
   def fix_imports_in_file(file_path):
       with open(file_path, 'r') as f:
           content = f.read()
           
       # Replace import patterns
       # Example: from data_manager import X -> from backend.data.repositories import X
       content = re.sub(r'from\s+data_manager\s+import', 'from backend.data.repositories import', content)
       content = re.sub(r'import\s+data_manager', 'import backend.data.repositories', content)
       
       # Add more replacements as needed
       
       with open(file_path, 'w') as f:
           f.write(content)
   
   def fix_imports_in_directory(directory):
       for root, _, files in os.walk(directory):
           for file in files:
               if file.endswith('.py'):
                   fix_imports_in_file(os.path.join(root, file))
   
   if __name__ == "__main__":
       fix_imports_in_directory('medical_physics_game/backend')
   ```

   ```bash
   python tools/import_fixer.py
   ```

2. **Update requirements.txt**:
   
   ```
   Flask==2.0.1
   SQLite3==3.36.0
   pytest==6.2.5
   ```

### JavaScript Dependencies

1. **Create JS import helper script**:
   
   ```javascript
   // tools/js_import_fixer.js
   const fs = require('fs');
   const path = require('path');
   
   function fixImportsInFile(filePath) {
       const content = fs.readFileSync(filePath, 'utf8');
       
       // Replace import patterns
       // Example: import { EventSystem } from '../engine/core/event_system.js'
       //       -> import { EventSystem } from '../../core/event_system.js'
       let updatedContent = content;
       
       // Add replacement logic here
       
       fs.writeFileSync(filePath, updatedContent);
   }
   
   function fixImportsInDirectory(directory) {
       const files = fs.readdirSync(directory, { withFileTypes: true });
       
       for (const file of files) {
           const fullPath = path.join(directory, file.name);
           
           if (file.isDirectory()) {
               fixImportsInDirectory(fullPath);
           } else if (file.name.endsWith('.js')) {
               fixImportsInFile(fullPath);
           }
       }
   }
   
   fixImportsInDirectory('medical_physics_game/frontend/src');
   ```

   ```bash
   node tools/js_import_fixer.js
   ```

2. **Create package.json** (if not already present):
   
   ```json
   {
     "name": "medical-physics-game",
     "version": "1.0.0",
     "description": "A roguelike medical physics educational game",
     "main": "frontend/src/core/bootstrap.js",
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1"
     },
     "dependencies": {},
     "devDependencies": {}
   }
   ```

## Testing Guide

After reorganizing the project, thorough testing is crucial to ensure everything still works correctly.

### Backend Testing

1. **Create basic test framework**:
   
   ```python
   # tests/conftest.py
   import pytest
   from app import create_app
   
   @pytest.fixture
   def app():
       app = create_app('test')
       return app
       
   @pytest.fixture
   def client(app):
       return app.test_client()
   ```

2. **Test API endpoints**:
   
   ```python
   # tests/backend/api/test_character_routes.py
   def test_get_characters(client):
       response = client.get('/api/characters')
       assert response.status_code == 200
       data = response.get_json()
       assert isinstance(data, list)
   ```

3. **Run backend tests**:
   
   ```bash
   pytest tests/backend
   ```

### Frontend Testing

1. **Manual testing checklist**:
   - Verify all pages load without errors
   - Test character selection flow
   - Test game map generation and navigation
   - Test skill tree functionality
   - Test combat mechanics
   - Test item management

2. **Browser console check**:
   - Open each page in a browser and check console for errors
   - Verify all assets load correctly
   - Test responsive design at different screen sizes

## Troubleshooting

Common issues that may arise during reorganization:

### Import Path Issues

**Problem**: After moving files, imports break because paths have changed.

**Solution**: 
- Use the provided import fixer scripts
- For Python, use relative imports (from . import X) for modules in the same package
- For JavaScript, use path aliases or relative paths

### Asset Path Issues

**Problem**: CSS/JS can't find image or font assets.

**Solution**:
- Update asset references in CSS files
- Use Flask's url_for('static', filename='...') in templates
- Create a central asset path configuration

### Database Connection Issues

**Problem**: Application can't connect to database after reorganization.

**Solution**:
- Update database path in configuration files
- Ensure db_utils.py correctly uses the configured path
- Check file permissions if using absolute paths

### Template Rendering Issues

**Problem**: Templates not found or not rendering correctly.

**Solution**:
- Check template_folder setting in Flask app
- Verify template inheritance is working (base.html)
- Check for missing blocks or incorrect block names

### Deployment Issues

**Problem**: Application works locally but fails in production.

**Solution**:
- Test with production configuration locally first
- Check file paths are correct for the production environment
- Verify static files are being served correctly