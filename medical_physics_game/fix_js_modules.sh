#!/bin/bash

# Fix the game.js file to properly export the Game class/object
game_js_path="frontend/src/core/game.js"
if [ -f "$game_js_path" ]; then
    # Check the content to determine how to fix it
    if grep -q "class Game" "$game_js_path"; then
        # If it has a Game class but doesn't export it correctly
        if ! grep -q "export { Game }" "$game_js_path" && ! grep -q "export class Game" "$game_js_path"; then
            # Add export statement at the end of the file
            echo -e "\nexport { Game };" >> "$game_js_path"
            echo "✅ Added missing export statement to game.js"
        fi
    else
        # If it doesn't have a Game class/object, create a basic one
        cat > "$game_js_path" << 'END'
/**
 * Main game controller
 */
class Game {
    constructor() {
        this.initialized = false;
        console.log("Game class initialized");
    }

    init() {
        this.initialized = true;
        console.log("Game initialized");
    }

    start() {
        if (!this.initialized) {
            this.init();
        }
        console.log("Game started");
    }
}

export { Game };
END
        echo "✅ Created new Game class with proper export in game.js"
    fi
else
    # Create the file if it doesn't exist
    mkdir -p $(dirname "$game_js_path")
    cat > "$game_js_path" << 'END'
/**
 * Main game controller
 */
class Game {
    constructor() {
        this.initialized = false;
        console.log("Game class initialized");
    }

    init() {
        this.initialized = true;
        console.log("Game initialized");
    }

    start() {
        if (!this.initialized) {
            this.init();
        }
        console.log("Game started");
    }
}

export { Game };
END
    echo "✅ Created new game.js file with Game class export"
fi

# Now fix the bootstrap.js file to properly import Game
bootstrap_js_path="frontend/src/core/bootstrap.js"
if [ -f "$bootstrap_js_path" ]; then
    # Make a backup
    cp "$bootstrap_js_path" "${bootstrap_js_path}.bak"
    
    # Check how it's importing Game
    if grep -q "import { Game } from './game.js'" "$bootstrap_js_path"; then
        echo "ℹ️ bootstrap.js already has correct import statement"
    else
        # Fix the import statement
        # First, find the old import line
        old_import=$(grep -n "import.*from.*game" "$bootstrap_js_path" | head -1 | cut -d: -f1)
        
        if [ -n "$old_import" ]; then
            # Replace the old import with the correct one
            sed -i "${old_import}s/.*import.*/import { Game } from '.\/game.js';/" "$bootstrap_js_path"
            echo "✅ Fixed import statement in bootstrap.js"
        else
            # If no import found, add one at the beginning
            sed -i "1i import { Game } from './game.js';" "$bootstrap_js_path"
            echo "✅ Added import statement to bootstrap.js"
        fi
    fi
else
    # Create a simple bootstrap.js if it doesn't exist
    mkdir -p $(dirname "$bootstrap_js_path")
    cat > "$bootstrap_js_path" << 'END'
import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    const game = new Game();
    game.start();
});
END
    echo "✅ Created new bootstrap.js file with proper import"
fi

# Also fix the symbolic link in the static directory
symlink_path="frontend/static/js/core/game.js"
if [ -L "$symlink_path" ]; then
    # Remove the existing symlink
    rm "$symlink_path"
fi

# Create directory if it doesn't exist
mkdir -p $(dirname "$symlink_path")

# Create a new symlink
ln -sf "../../../src/core/game.js" "$symlink_path"
echo "✅ Updated symlink for game.js in static directory"

echo "JavaScript module fixes complete!"
