#!/bin/bash
echo "Preparing to clean up old files and directories..."

# Verify that we want to proceed
read -p "Have you verified all functionality works with the new structure? (yes/no): " verified
if [ "$verified" != "yes" ]; then
    echo "Please verify all functionality before proceeding with cleanup."
    exit 1
fi

echo "Creating final backup before cleanup..."
final_backup_dir="final_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$final_backup_dir"
tar -czf "$final_backup_dir/final_pre_cleanup.tar.gz" .

echo "Proceeding with cleanup..."

# Remove old directories
old_dirs=(
    "static"
    "templates"
)

for dir in "${old_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "Removing old directory: $dir"
        rm -rf "$dir"
    fi
done

# Remove old Python files
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
        echo "Removing old file: $file"
        rm "$file"
    fi
done

# Remove old data files
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
        echo "Removing old data file: $file"
        rm "$file"
    fi
done

# Remove temporary scripts
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
        echo "Removing temporary script: $script"
        rm "$script"
    fi
done

echo "Cleanup complete!"
echo "The project has been fully reorganized to the new structure."
echo "Final backup was created at: $final_backup_dir/final_pre_cleanup.tar.gz"
