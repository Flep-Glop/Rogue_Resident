#!/bin/bash

echo "Fixing template paths..."

# First, let's fix the character-select.html template
character_select_path="frontend/templates/pages/character_select.html"
if [ -f "$character_select_path" ]; then
    # Make a backup
    cp "$character_select_path" "${character_select_path}.bak"
    
    # Update static file references
    sed -i 's|/static/css/|{{ url_for("static", filename="css/") }}|g' "$character_select_path"
    sed -i 's|/static/js/|{{ url_for("static", filename="js/") }}|g' "$character_select_path"
    sed -i 's|/static/img/|{{ url_for("static", filename="img/") }}|g' "$character_select_path"
    
    echo "✅ Updated static paths in character_select.html"
else
    echo "❌ character_select.html not found at $character_select_path"
fi

# Copy the missing CSS files
mkdir -p frontend/static/css
for css_file in main.css character_image_styles.css; do
    if [ -f "static/css/$css_file" ]; then
        cp -v "static/css/$css_file" "frontend/static/css/$css_file"
        echo "✅ Copied $css_file to frontend/static/css/"
    else
        echo "❌ $css_file not found in static/css/"
    fi
done

# Copy character_assets.js
mkdir -p frontend/static/js
if [ -f "static/js/character_assets.js" ]; then
    cp -v "static/js/character_assets.js" "frontend/static/js/character_assets.js"
    echo "✅ Copied character_assets.js to frontend/static/js/"
else
    # Create a basic version of the file
    cat > "frontend/static/js/character_assets.js" << 'END'
// Character data for selection screen
const characters = [
    {
        id: 'physicist',
        name: 'Physicist',
        description: 'Strong analytical skills and problem-solving abilities.',
        stats: {
            intelligence: 9,
            persistence: 7,
            adaptability: 6
        },
        abilities: ['Critical Analysis', 'Problem Solving'],
        image: '/static/img/characters/physicist.png'
    },
    {
        id: 'resident',
        name: 'Resident',
        description: 'Well-rounded with clinical knowledge and patient care experience.',
        stats: {
            intelligence: 7,
            persistence: 8,
            adaptability: 8
        },
        abilities: ['Clinical Diagnosis', 'Patient Care'],
        image: '/static/img/characters/resident.png'
    },
    {
        id: 'qa_specialist',
        name: 'QA Specialist',
        description: 'Detail-oriented with exceptional testing and validation skills.',
        stats: {
            intelligence: 8,
            persistence: 9,
            adaptability: 6
        },
        abilities: ['Detail Oriented', 'Process Improvement'],
        image: '/static/img/characters/qa_specialist.png'
    }
];

// Make characters available globally
window.gameCharacters = characters;
END
    echo "✅ Created basic character_assets.js in frontend/static/js/"
fi

# Create game.css if it doesn't exist
if [ ! -f "frontend/static/css/screens/game.css" ]; then
    mkdir -p frontend/static/css/screens
    if [ -f "static/css/main.css" ]; then
        cp -v "static/css/main.css" "frontend/static/css/screens/game.css"
        echo "✅ Copied main.css to frontend/static/css/screens/game.css"
    else
        # Create a basic CSS file
        cat > "frontend/static/css/screens/game.css" << 'END'
/* Basic game screen styles */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f0f0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #333;
    text-align: center;
}

.menu {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    background-color: #4a90e2;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background-color 0.3s;
}

.btn:hover {
    background-color: #3a7bc8;
}
END
        echo "✅ Created basic game.css in frontend/static/css/screens/"
    fi
fi

# Update app.py to ensure templates and static files work
app_py_path="app.py"
if [ -f "$app_py_path" ]; then
    # Make a backup
    cp "$app_py_path" "${app_py_path}.bak"
    
    # Make sure static_folder and template_folder are set correctly
    if ! grep -q "static_folder='frontend/static'" "$app_py_path" || ! grep -q "template_folder='frontend/templates'" "$app_py_path"; then
        # This is a bit more complex, let's use a temp file
        sed -e 's/app = Flask(__name__)/app = Flask(__name__, static_folder="frontend\/static", template_folder="frontend\/templates")/' \
            -e 's/app = Flask(__name__, static_folder="[^"]*", template_folder="[^"]*")/app = Flask(__name__, static_folder="frontend\/static", template_folder="frontend\/templates")/' \
            "$app_py_path" > "${app_py_path}.tmp"
        mv "${app_py_path}.tmp" "$app_py_path"
        echo "✅ Updated static and template folders in app.py"
    else
        echo "ℹ️ Static and template folders already set correctly in app.py"
    fi
else
    echo "❌ app.py not found"
fi

echo "Template path fixes complete!"
