// Intentionally simple test for core modules only
console.log('Testing core modules...');

try {
    // Import modules individually to isolate issues
    import('../frontend/src/core/event_system.js')
        .then(module => {
            console.log('✅ event_system.js loaded successfully');
            if (module.EventSystem) {
                console.log('  EventSystem class found');
            } else {
                console.error('❌ EventSystem class not exported correctly');
            }
        })
        .catch(error => {
            console.error('❌ Failed to load event_system.js:', error.message);
        });
        
    import('../frontend/src/core/state_manager.js')
        .then(module => {
            console.log('✅ state_manager.js loaded successfully');
            if (module.StateManager) {
                console.log('  StateManager class found');
            } else {
                console.error('❌ StateManager class not exported correctly');
            }
        })
        .catch(error => {
            console.error('❌ Failed to load state_manager.js:', error.message);
        });
        
    import('../frontend/src/core/game.js')
        .then(module => {
            console.log('✅ game.js loaded successfully');
            if (module.Game) {
                console.log('  Game class found');
            } else {
                console.error('❌ Game class not exported correctly');
            }
        })
        .catch(error => {
            console.error('❌ Failed to load game.js:', error.message);
        });
} catch (error) {
    console.error('❌ General error:', error.message);
}
