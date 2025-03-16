#!/bin/bash
echo "Analyzing files for cleanup..."

# Create backup before proceeding
echo "Creating backup of current state..."
backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
tar -czf "$backup_dir/pre_cleanup_backup.tar.gz" .

# Check for old directories that should be replaced by new structure
check_old_dirs() {
    echo -e "\n=== Checking for old directories ==="
    old_dirs=(
        "static"
        "templates"
    )
    
    for dir in "${old_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo "⚠️ Found old directory: $dir (to be replaced by frontend/static and frontend/templates)"
        else
            echo "✅ Old directory not found: $dir"
        fi
    done
}

# Check for old Python files that are now in the backend structure
check_old_python_files() {
    echo -e "\n=== Checking for old Python files ==="
    old_files=(
        "app.py.old"
        "app.py.new"
        "data_manager.py"
        "db_utils.py"
        "game_state.py"
        "map_generator.py"
        "node_plugins.py"
    )
    
    for file in "${old_files[@]}"; do
        if [ -f "$file" ]; then
            echo "⚠️ Found old file: $file (should be migrated to backend/ structure)"
        else
            echo "✅ Old file not found: $file"
        fi
    done
}

# Check for old data files that are now in structured folders
check_old_data_files() {
    echo -e "\n=== Checking for old data files ==="
    old_data_files=(
        "data/characters.json"
        "data/items.json"
        "data/floors.json"
        "data/node_types.json"
        "data/node-templates.json"
        "data/questions.json"
        "data/patient_cases.json"
        "data/skill_tree.json"
    )
    
    for file in "${old_data_files[@]}"; do
        if [ -f "$file" ]; then
            echo "⚠️ Found old data file: $file (should be moved to structured data/ subdirectories)"
        else
            echo "✅ Old data file not found: $file"
        fi
    done
}

# Check for temporary migration scripts
check_temp_scripts() {
    echo -e "\n=== Checking for temporary migration/fix scripts ==="
    temp_scripts=(
        "fix_api_blueprint.sh"
        "fix_api_endpoints.sh"
        "fix_api_init.py"
        "fix_api_routes.sh"
        "fix_character_model.sh"
        "fix_character_repo.sh"
        "fix_data_loading.sh"
        "fix_item_api.py"
        "fix_missing_js_files.sh"
        "fix_question_api.py"
        "fix_question_model.sh"
        "fix_question_repo.sh"
    )
    
    for script in "${temp_scripts[@]}"; do
        if [ -f "$script" ]; then
            echo "⚠️ Found temporary script: $script (can be removed after reorganization)"
        fi
    done
}

# Run all checks
check_old_dirs
check_old_python_files
check_old_data_files
check_temp_scripts

echo -e "\n=== Analysis complete ==="
echo "Review the results above to determine what needs cleanup."
echo "To perform cleanup, run the perform_cleanup.sh script."
