#!/bin/bash
echo "=== ASSET VERIFICATION ==="

# Check static assets
echo "Checking static assets..."

# Create test directories array
directories=(
    "frontend/static/css/base"
    "frontend/static/css/components"
    "frontend/static/css/screens"
    "frontend/static/css/themes"
    "frontend/static/img/characters"
    "frontend/static/img/items"
    "frontend/static/img/nodes"
    "frontend/static/img/ui"
    "frontend/static/assets/fonts"
    "frontend/static/assets/audio"
)

# Check if directories exist and contain files
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        fileCount=$(find "$dir" -type f | wc -l)
        if [ $fileCount -gt 0 ]; then
            echo "✅ $dir: contains $fileCount files"
        else
            echo "⚠️ $dir: directory exists but is empty"
        fi
    else
        echo "❌ $dir: directory does not exist"
    fi
done

# Create an asset test HTML page
cat > tests/asset_test.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Asset Verification</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #2c3e50; }
        .asset-group { margin-bottom: 30px; }
        .asset-item { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .success { color: green; }
        .error { color: red; }
    </style>
    
    <!-- Test CSS imports -->
    <link rel="stylesheet" href="../frontend/static/css/base/reset.css">
    <link rel="stylesheet" href="../frontend/static/css/base/variables.css">
    <link rel="stylesheet" href="../frontend/static/css/base/layout.css">
    <link rel="stylesheet" href="../frontend/static/css/themes/retro_theme.css">
    <link rel="stylesheet" href="../frontend/static/css/components/character.css">
    <link rel="stylesheet" href="../frontend/static/css/components/inventory.css">
    <link rel="stylesheet" href="../frontend/static/css/components/map.css">
    <link rel="stylesheet" href="../frontend/static/css/screens/game.css">
    <link rel="stylesheet" href="../frontend/static/css/screens/skill_tree.css">
</head>
<body>
    <h1>Asset Verification</h1>
    
    <div class="asset-group">
        <h2>CSS Stylesheets</h2>
        <div id="css-results">Testing CSS imports...</div>
    </div>
    
    <div class="asset-group">
        <h2>Character Images</h2>
        <div id="character-images"></div>
    </div>
    
    <div class="asset-group">
        <h2>Item Images</h2>
        <div id="item-images"></div>
    </div>
    
    <div class="asset-group">
        <h2>Node Images</h2>
        <div id="node-images"></div>
    </div>
    
    <script>
        // Test if CSS was loaded successfully
        window.onload = function() {
            // Test CSS loading
            const styles = document.styleSheets;
            let loadedCount = 0;
            let failedCount = 0;
            let results = '';
            
            for (let i = 0; i < styles.length; i++) {
                try {
                    const href = styles[i].href;
                    if (href && href.includes('frontend/static/css')) {
                        results += `<div class="success">✅ Loaded: ${href.split('/').pop()}</div>`;
                        loadedCount++;
                    }
                } catch (e) {
                    results += `<div class="error">❌ Failed to load CSS: ${e.message}</div>`;
                    failedCount++;
                }
            }
            
            results += `<div>Total: ${loadedCount} CSS files loaded, ${failedCount} failed</div>`;
            document.getElementById('css-results').innerHTML = results;
            
            // Load character images
            fetch('../data/characters/characters.json')
                .then(response => response.json())
                .then(data => {
                    const container = document.getElementById('character-images');
                    data.forEach(character => {
                        if (character.image) {
                            const div = document.createElement('div');
                            div.className = 'asset-item';
                            div.innerHTML = `
                                <strong>${character.name}</strong><br>
                                <img src="../frontend/static/img/characters/${character.image}" 
                                     onerror="this.onerror=null; this.src=''; this.alt='Failed to load'; this.parentNode.classList.add('error');"
                                     alt="${character.name}" style="max-width: 100px; max-height: 100px;">
                            `;
                            container.appendChild(div);
                        }
                    });
                })
                .catch(err => {
                    document.getElementById('character-images').innerHTML = 
                        `<div class="error">❌ Failed to load character data: ${err.message}</div>`;
                });
                
            // Load item images
            fetch('../data/items/items.json')
                .then(response => response.json())
                .then(data => {
                    const container = document.getElementById('item-images');
                    data.forEach(item => {
                        if (item.image) {
                            const div = document.createElement('div');
                            div.className = 'asset-item';
                            div.innerHTML = `
                                <strong>${item.name}</strong><br>
                                <img src="../frontend/static/img/items/${item.image}" 
                                     onerror="this.onerror=null; this.src=''; this.alt='Failed to load'; this.parentNode.classList.add('error');"
                                     alt="${item.name}" style="max-width: 100px; max-height: 100px;">
                            `;
                            container.appendChild(div);
                        }
                    });
                })
                .catch(err => {
                    document.getElementById('item-images').innerHTML = 
                        `<div class="error">❌ Failed to load item data: ${err.message}</div>`;
                });
                
            // Load node images
            const nodeTypes = ["boss", "elite", "event", "patient", "question", "rest", "shop", "treasure"];
            const container = document.getElementById('node-images');
            
            nodeTypes.forEach(type => {
                const div = document.createElement('div');
                div.className = 'asset-item';
                div.innerHTML = `
                    <strong>${type} node</strong><br>
                    <img src="../frontend/static/img/nodes/${type}.png" 
                         onerror="this.onerror=null; this.src=''; this.alt='Failed to load'; this.parentNode.classList.add('error');"
                         alt="${type} node" style="max-width: 100px; max-height: 100px;">
                `;
                container.appendChild(div);
            });
        };
    </script>
</body>
</html>
HTML_EOF

echo "Created asset test page at tests/asset_test.html"
echo "Please open this page in your browser to verify assets are loading correctly"
