#!/bin/bash
echo "=== MASTER VERIFICATION SCRIPT ==="
echo "This script will run all verification tests and generate a report"

# Create verification status file
verification_file="verification_status.txt"
echo "# Medical Physics Game Reorganization Verification" > $verification_file
echo "Verification Date: $(date)" >> $verification_file
echo "" >> $verification_file

# Check if application is running
if ! curl -s http://localhost:5000/ > /dev/null; then
    echo "❌ Application is not running. Please start it before verification."
    echo "❌ Application not running during verification." >> $verification_file
    exit 1
fi

# Run backend API tests
echo "Running backend tests..."
./backend_test.sh > backend_results.txt
backend_status=$?
cat backend_results.txt
cat backend_results.txt >> $verification_file

if [ $backend_status -ne 0 ]; then
    echo "❌ Backend tests failed. Please fix issues before cleanup."
    exit 1
fi

# Check if JavaScript verification was completed
read -p "Have you verified all JavaScript modules work correctly? (yes/no): " js_verified
if [ "$js_verified" != "yes" ]; then
    echo "Please run JavaScript verification first:"
    echo "1. Run ./js_module_test.sh"
    echo "2. Open tests/module_test.html in your browser"
    echo "❌ JavaScript modules not verified." >> $verification_file
    exit 1
fi
echo "✅ JavaScript modules verified." >> $verification_file

# Check if frontend component verification was completed
read -p "Have you verified all frontend components work correctly? (yes/no): " frontend_verified
if [ "$frontend_verified" != "yes" ]; then
    echo "Please run frontend component verification first:"
    echo "1. Run ./frontend_test.sh"
    echo "2. Open tests/manual_verification.html in your browser"
    echo "❌ Frontend components not verified." >> $verification_file
    exit 1
fi
echo "✅ Frontend components verified." >> $verification_file

# Check if asset verification was completed
read -p "Have you verified all assets load correctly? (yes/no): " assets_verified
if [ "$assets_verified" != "yes" ]; then
    echo "Please run asset verification first:"
    echo "1. Run ./asset_verification.sh"
    echo "2. Open tests/asset_test.html in your browser"
    echo "❌ Assets not verified." >> $verification_file
    exit 1
fi
echo "✅ Assets verified." >> $verification_file

# Check if cross-browser testing was completed
read -p "Have you performed cross-browser testing? (yes/no): " browser_verified
if [ "$browser_verified" != "yes" ]; then
    echo "Please perform cross-browser testing first:"
    echo "1. Read the browser_testing_guide.md file"
    echo "2. Test in multiple browsers as instructed"
    echo "❌ Cross-browser testing not completed." >> $verification_file
    exit 1
fi
echo "✅ Cross-browser testing completed." >> $verification_file

# All verification passed, proceed with cleanup
echo "✅ All verification tests passed!" >> $verification_file
echo "" >> $verification_file
echo "✅ ALL VERIFICATION TESTS PASSED!"
echo "Ready to proceed with cleanup."

# Generate final cleanup script
cat > final_cleanup.sh << 'CLEANUP_EOF'
#!/bin/bash
echo "=== FINAL CLEANUP ==="

# Create backup first
echo "Creating final backup before cleanup..."
tar -czf medical_physics_game_pre_cleanup.tar.gz .

# Define original directories and files to remove
# Only remove files that have been migrated to the new structure
echo "Removing old directories and files..."

# Original Python files
old_python_files=(
    "app.py.old"
    "data_manager.py"
    "db_utils.py"
    "game_state.py"
    "map_generator.py"
    "node_plugins.py"
    "plugins/question_plugin.py"
)

# Original JavaScript files
old_js_dirs=(
    "static/js"
    "static/css"
)

# Original templates
old_template_files=(
    "templates"
)

# Original data files
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

# Remove old Python files
for file in "${old_python_files[@]}"; do
    if [ -f "$file" ]; then
        echo "Removing $file"
        rm "$file"
    fi
done

# Remove old JS and CSS directories
for dir in "${old_js_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "Removing $dir"
        rm -rf "$dir"
    fi
done

# Remove old templates
for dir in "${old_template_files[@]}"; do
    if [ -d "$dir" ]; then
        echo "Removing $dir"
        rm -rf "$dir"
    fi
done

# Remove old data files
for file in "${old_data_files[@]}"; do
    if [ -f "$file" ]; then
        echo "Removing $file"
        rm "$file"
    fi
done

# Remove temporary verification files
echo "Cleaning up verification files..."
rm -f tests/module_imports_test.js
rm -f tests/module_test.html
rm -f tests/asset_test.html
rm -f tests/manual_verification.html
rm -f tests/test_repositories.py
rm -f tests/test_models.py
rm -f backend_results.txt

echo "✅ Cleanup complete!"
echo "The Medical Physics Game reorganization is now finalized."
echo "Make sure to commit all changes to version control."
CLEANUP_EOF

chmod +x final_cleanup.sh
echo "Created final_cleanup.sh - run this after verification is complete"
