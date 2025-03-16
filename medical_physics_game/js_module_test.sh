#!/bin/bash
echo "=== JAVASCRIPT MODULE VERIFICATION ==="

# Create a test file that imports all core modules
cat > tests/module_imports_test.js << 'JS_EOF'
// Core modules test
import { EventSystem } from '../frontend/src/core/event_system.js';
import { StateManager } from '../frontend/src/core/state_manager.js';
import { Game } from '../frontend/src/core/game.js';

// Entity modules test
import { Character } from '../frontend/src/entities/player/character.js';
import { NodeRegistry } from '../frontend/src/entities/nodes/node_registry.js';
import { NodeFactory } from '../frontend/src/entities/nodes/node_factory.js';

// Node type modules test
import { BossNode } from '../frontend/src/entities/nodes/node_types/boss.js';
import { QuestionNode } from '../frontend/src/entities/nodes/node_types/question.js';
import { RestNode } from '../frontend/src/entities/nodes/node_types/rest.js';
import { ShopNode } from '../frontend/src/entities/nodes/node_types/shop.js';

// System modules test
import { EffectHandler } from '../frontend/src/systems/effects/effect_handler.js';
import { SkillTreeManager } from '../frontend/src/systems/skill_tree/skill_tree_manager.js';
import { ProgressionSystem } from '../frontend/src/systems/progression/progression.js';

// UI modules test
import { CharacterPanel } from '../frontend/src/ui/components/character_panel.js';
import { MapRenderer } from '../frontend/src/ui/components/map_renderer.js';
import { APIClient } from '../frontend/src/ui/utils/api_client.js';

console.log('✅ All modules imported successfully!');

// Test module functionality
function testModules() {
    console.log('Testing EventSystem...');
    const events = new EventSystem();
    events.on('test', () => console.log('EventSystem works!'));
    events.emit('test');
    
    console.log('Testing StateManager...');
    const state = new StateManager();
    state.setState('test', 'value');
    console.log(`StateManager getState: ${state.getState('test')}`);
    
    console.log('Testing NodeRegistry...');
    const registry = new NodeRegistry();
    registry.register('test', {});
    console.log(`NodeRegistry getNodeType: ${registry.getNodeType('test') !== null}`);
    
    console.log('✅ Module functionality verified!');
}

// Run tests when DOM is loaded
document.addEventListener('DOMContentLoaded', testModules);
JS_EOF

# Create HTML test page for modules
cat > tests/module_test.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>JavaScript Module Verification</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        #results { margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>JavaScript Module Verification</h1>
    <p>This page tests if all JavaScript modules load correctly.</p>
    <p>Check browser console for detailed results.</p>
    <div id="results">Running tests...</div>
    
    <script type="module">
        import * as ModuleTest from './module_imports_test.js';
        
        // Listen for errors
        let hasErrors = false;
        window.addEventListener('error', (event) => {
            document.getElementById('results').innerHTML += `
                <div class="error">❌ Error: ${event.message}</div>
            `;
            hasErrors = true;
        });
        
        // Check results after a delay
        setTimeout(() => {
            if (!hasErrors) {
                document.getElementById('results').innerHTML = `
                    <div class="success">✅ All modules loaded successfully!</div>
                    <p>No import errors detected.</p>
                `;
            }
        }, 2000);
    </script>
</body>
</html>
HTML_EOF

echo "Created JavaScript module tests:"
echo " - tests/module_imports_test.js"
echo " - tests/module_test.html"
echo "Please open tests/module_test.html in your browser to verify modules"
