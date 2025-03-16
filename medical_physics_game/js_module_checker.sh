#!/bin/bash
echo "Creating improved JavaScript module tests..."

# Create a directory for module tests if it doesn't exist
mkdir -p tests/js

# Create a module test for core modules
cat > tests/js/core_test.js << 'JS_EOF'
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
JS_EOF

# Create HTML test page for core modules
cat > tests/js/core_test.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Core Modules Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        .results { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>Core Modules Test</h1>
    <p>This simplified test checks if your core JavaScript modules load correctly.</p>
    <ol>
        <li>Open your browser's developer console (F12)</li>
        <li>Check for any errors in loading the modules</li>
        <li>Fix any reported issues</li>
    </ol>
    
    <div class="results">
        <p>Results will appear in the browser console</p>
    </div>
    
    <script type="module" src="core_test.js"></script>
</body>
</html>
HTML_EOF

echo "Created improved JavaScript module tests"
echo "Please open tests/js/core_test.html in your browser"
echo "Check the browser console for results"
