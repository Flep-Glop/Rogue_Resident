# Medical Physics Game: Testing & Verification Tools

Here's a summary of the key testing and verification scripts we created during the reorganization:

## Verification Scripts

- **`verify_structure.py`**: Checks if all expected directories and key files exist, and identifies duplicate files
- **`final_verification.py`**: Comprehensive check of API endpoints, static files, and data files

## Fixing Scripts

- **`fix_missing_js_files.sh`**: Creates/fixes missing JavaScript files in frontend/src/systems/effects
- **`fix_api_init.py`**: Fixes import issues in backend API modules
- **`fix_character_model.py`**: Repairs the character model and repository
- **`fix_item_api.py`** & **`fix_question_api.py`**: Create/fix item and question API endpoints
- **`fix_state_manager.sh`**: Fixes StateManager module exports
- **`fix_event_system.sh`**: Fixes EventSystem module exports
- **`fix_all_imports.sh`**: Checks and fixes all import statements in JavaScript files
- **`fix_template_paths.sh`**: Updates paths in templates to use Flask's url_for()
- **`fix_character_select.sh`**: Comprehensive fix for the character selection page

## Testing Scripts

- **`test_application.sh`**: Tests if the Flask application starts and API endpoints respond
- **`test_modules.html`**: HTML page to test if JavaScript modules load correctly

## Data Migration Scripts

- **`migrate_data_files.sh`**: Moves data files to their new locations
- **`copy_character_images.sh`**: Ensures character images are available in the new structure

## Cleanup Scripts

- **`cleanup_plan.sh`** or **`updated_cleanup_plan.sh`**: Scripts for safely removing old directories
- **`prepare_cleanup.sh`**: Creates a backup before cleanup

You can run any of these scripts from the project's root directory. For example:

```bash
# Check project structure
python verify_structure.py

# Test if application works
./test_application.sh

# Fix specific issues if needed
./fix_missing_js_files.sh
./fix_api_init.py

# Perform final cleanup after verifying everything works
./cleanup_plan.sh
```

These tools should help you with any future maintenance or debugging of the reorganized project structure.