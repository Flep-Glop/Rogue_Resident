#!/bin/bash

echo "Fixing state_manager.js module export..."

# Fix the state_manager.js file
state_manager_path="frontend/src/core/state_manager.js"
if [ -f "$state_manager_path" ]; then
    # Make a backup
    cp "$state_manager_path" "${state_manager_path}.bak"
    
    # Check if it has a StateManager class/object
    if grep -q "class StateManager" "$state_manager_path"; then
        # Check if it's already exported properly
        if ! grep -q "export { StateManager }" "$state_manager_path" && ! grep -q "export class StateManager" "$state_manager_path"; then
            # Add export statement at the end of the file
            echo -e "\nexport { StateManager };" >> "$state_manager_path"
            echo "✅ Added missing export statement to state_manager.js"
        else
            echo "ℹ️ StateManager is already exported correctly"
        fi
    else
        # If it doesn't have a StateManager class/object, create a basic one
        cat > "$state_manager_path" << 'END'
/**
 * Game state management
 */
class StateManager {
    constructor() {
        this.state = {
            gameStarted: false,
            currentScreen: 'main',
            playerStats: {},
            gameProgress: {}
        };
        console.log("StateManager initialized");
    }

    getState() {
        return this.state;
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        console.log("State updated:", this.state);
    }

    resetState() {
        this.state = {
            gameStarted: false,
            currentScreen: 'main',
            playerStats: {},
            gameProgress: {}
        };
        console.log("State reset to default");
    }
}

export { StateManager };
END
        echo "✅ Created new StateManager class with proper export in state_manager.js"
    fi
else
    # Create the file if it doesn't exist
    mkdir -p $(dirname "$state_manager_path")
    cat > "$state_manager_path" << 'END'
/**
 * Game state management
 */
class StateManager {
    constructor() {
        this.state = {
            gameStarted: false,
            currentScreen: 'main',
            playerStats: {},
            gameProgress: {}
        };
        console.log("StateManager initialized");
    }

    getState() {
        return this.state;
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        console.log("State updated:", this.state);
    }

    resetState() {
        this.state = {
            gameStarted: false,
            currentScreen: 'main',
            playerStats: {},
            gameProgress: {}
        };
        console.log("State reset to default");
    }
}

export { StateManager };
END
    echo "✅ Created new state_manager.js file with StateManager class export"
fi

# Fix the bootstrap.js file to properly import StateManager
bootstrap_js_path="frontend/src/core/bootstrap.js"
if [ -f "$bootstrap_js_path" ]; then
    # Check if it already imports StateManager correctly
    if grep -q "import { StateManager } from './state_manager.js'" "$bootstrap_js_path"; then
        echo "ℹ️ bootstrap.js already has correct StateManager import statement"
    else
        # Find the line where it imports StateManager
        state_manager_import=$(grep -n "import.*StateManager.*from" "$bootstrap_js_path" | head -1 | cut -d: -f1)
        
        if [ -n "$state_manager_import" ]; then
            # Replace the old import with the correct one
            sed -i "${state_manager_import}s/.*import.*/import { StateManager } from '.\/state_manager.js';/" "$bootstrap_js_path"
            echo "✅ Fixed StateManager import statement in bootstrap.js"
        else
            # If no import found, add one at the beginning
            game_import_line=$(grep -n "import.*Game.*from" "$bootstrap_js_path" | head -1 | cut -d: -f1)
            if [ -n "$game_import_line" ]; then
                # Add after the Game import
                sed -i "${game_import_line}a import { StateManager } from './state_manager.js';" "$bootstrap_js_path"
            else
                # Add at the beginning
                sed -i "1i import { StateManager } from './state_manager.js';" "$bootstrap_js_path"
            fi
            echo "✅ Added StateManager import statement to bootstrap.js"
        fi
    fi
fi

# Fix the symbolic link in the static directory
symlink_path="frontend/static/js/core/state_manager.js"
if [ -L "$symlink_path" ]; then
    # Remove the existing symlink
    rm "$symlink_path"
fi

# Create directory if it doesn't exist
mkdir -p $(dirname "$symlink_path")

# Create a new symlink
ln -sf "../../../src/core/state_manager.js" "$symlink_path"
echo "✅ Updated symlink for state_manager.js in static directory"

echo "StateManager module fixes complete!"
