#!/bin/bash

echo "Medical Physics Game - Updated Cleanup Plan"
echo "=========================================="
echo
echo "This script will help you safely clean up the reorganized project."
echo "Please follow these steps carefully:"
echo

# Create backup
echo "Step 1: Create a backup"
BACKUP_FILE="medical_physics_game_backup_$(date +%Y%m%d).tar.gz"
echo "Creating backup: $BACKUP_FILE"
tar -czvf "$BACKUP_FILE" .
echo "✅ Backup created"
echo

echo "Step 2: Verify JavaScript modules work correctly"
echo "Before proceeding, please verify that:"
echo "- No JavaScript errors appear in the browser console"
echo "- Game initialization logs appear in the console"
echo "- All interactive elements work correctly"
echo
read -p "Have you verified JavaScript modules work correctly? (yes/no): " verified_js

if [ "$verified_js" != "yes" ]; then
    echo "Please verify JavaScript modules before proceeding with cleanup."
    exit 1
fi

echo
echo "Step 3: Verify the application works end-to-end"
echo "Run the application and test thoroughly before proceeding:"
echo "  python app.py"
echo "Access the application at http://localhost:5000"
echo "Verify that all pages load correctly and functionality works."
echo
read -p "Have you verified the application works end-to-end? (yes/no): " verified

if [ "$verified" != "yes" ]; then
    echo "Please verify the application before proceeding with cleanup."
    exit 1
fi

echo
echo "Step 4: Remove nested medical_physics_game directory"
echo "This will remove the nested directory structure."
read -p "Are you sure you want to remove medical_physics_game/? (yes/no): " remove_nested

if [ "$remove_nested" = "yes" ]; then
    rm -rf medical_physics_game/
    echo "✅ Nested directory removed"
else
    echo "Skipping nested directory removal"
fi

echo
echo "Step 5: Final cleanup (DANGER ZONE)"
echo "This will remove the original static/ and templates/ directories."
echo "Only proceed if you're absolutely sure everything works correctly."
read -p "Are you sure you want to remove static/ and templates/? (yes/no): " remove_orig

if [ "$remove_orig" = "yes" ]; then
    rm -rf static/ templates/
    echo "✅ Original directories removed"
else
    echo "Skipping original directory removal"
fi

echo
echo "Cleanup complete!"
echo "Remember to keep the backup ($BACKUP_FILE) for a few weeks"
echo "until you're absolutely sure everything works correctly."
