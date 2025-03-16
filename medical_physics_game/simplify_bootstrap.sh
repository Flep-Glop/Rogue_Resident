#!/bin/bash

echo "Creating simplified bootstrap.js..."

bootstrap_js_path="frontend/src/core/bootstrap.js"
mkdir -p $(dirname "$bootstrap_js_path")

cat > "$bootstrap_js_path" << 'END'
/**
 * Bootstrap application
 */
import { Game } from './game.js';
import { StateManager } from './state_manager.js';
import { EventSystem } from './event_system.js';

// Initialize the event system
const eventSystem = new EventSystem();

// Initialize the state manager
const stateManager = new StateManager();

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    const game = new Game();
    
    // Make these available globally for debugging (optional)
    window.game = game;
    window.stateManager = stateManager;
    window.eventSystem = eventSystem;
    
    // Initialize and start the game
    game.init();
    
    // Update state to indicate game has started
    stateManager.updateState({
        gameStarted: true,
        currentScreen: 'game'
    });
    
    console.log("Game bootstrap complete!");
});
END

echo "✅ Created simplified bootstrap.js"

# Update the symlink
symlink_path="frontend/static/js/core/bootstrap.js"
if [ -L "$symlink_path" ]; then
    rm "$symlink_path"
fi
mkdir -p $(dirname "$symlink_path")
ln -sf "../../../src/core/bootstrap.js" "$symlink_path"
echo "✅ Updated symlink for bootstrap.js in static directory"

echo "Bootstrap simplification complete!"
