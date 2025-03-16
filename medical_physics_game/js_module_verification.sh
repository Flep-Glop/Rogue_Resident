#!/bin/bash
echo "Creating JavaScript module verification tools..."

mkdir -p tests/js

# Create a simplified test that isolates each module
cat > tests/js/module_verification.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>JavaScript Module Verification</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #2c3e50; }
        .module { margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        .pending { background-color: #fff3cd; color: #856404; }
        pre { white-space: pre-wrap; }
        button { margin-top: 10px; padding: 8px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>JavaScript Module Verification</h1>
    <p>This page tests if all core JavaScript modules in the reorganized structure load correctly.</p>
    
    <div id="results">
        <div class="module pending" id="status">Testing modules...</div>
    </div>
    
    <button id="copyButton">Copy Results</button>
    
    <h2>How to Fix Common Issues:</h2>
    <ul>
        <li><strong>Module not found</strong>: Check file paths and make sure the file exists</li>
        <li><strong>Unexpected token 'export'</strong>: Make sure you're using ES6 module syntax correctly</li>
        <li><strong>Class/function not exported</strong>: Check your export statements</li>
    </ul>
    
    <script type="module">
        const resultsContainer = document.getElementById('results');
        const statusElement = document.getElementById('status');
        let allSuccess = true;
        
        // Helper function to add a module result
        function addModuleResult(name, success, message) {
            const moduleDiv = document.createElement('div');
            moduleDiv.className = `module ${success ? 'success' : 'error'}`;
            moduleDiv.innerHTML = `
                <strong>${name}</strong>: ${success ? 'Loaded successfully' : 'Failed to load'}
                ${message ? `<pre>${message}</pre>` : ''}
            `;
            resultsContainer.appendChild(moduleDiv);
            
            if (!success) allSuccess = false;
        }
        
        // Test individual modules one by one
        async function testModule(path, name) {
            try {
                const module = await import(`../../${path}`);
                const exportNames = Object.keys(module);
                addModuleResult(
                    name, 
                    true, 
                    `Exports: ${exportNames.join(', ') || 'None (default export only)'}`
                );
                return true;
            } catch (error) {
                addModuleResult(name, false, error.message);
                return false;
            }
        }
        
        // Run the tests
        async function runTests() {
            // Core modules
            await testModule('frontend/src/core/event_system.js', 'EventSystem');
            await testModule('frontend/src/core/state_manager.js', 'StateManager');
            await testModule('frontend/src/core/game.js', 'Game');
            
            // Update status when complete
            statusElement.className = allSuccess ? 'module success' : 'module error';
            statusElement.textContent = allSuccess ? 
                'All modules loaded successfully! ✅' : 
                'Some modules failed to load. Check errors above. ❌';
        }
        
        // Run the tests
        runTests();
        
        // Copy results functionality
        document.getElementById('copyButton').addEventListener('click', () => {
            const results = Array.from(resultsContainer.querySelectorAll('.module'))
                .map(div => div.textContent.trim())
                .join('\n\n');
                
            navigator.clipboard.writeText(results)
                .then(() => alert('Results copied to clipboard!'))
                .catch(err => console.error('Failed to copy results:', err));
        });
    </script>
</body>
</html>
HTML_EOF

echo "✅ Created JavaScript module verification tool at tests/js/module_verification.html"
echo "Please open this file in your browser to check if modules are loading correctly."
