#!/bin/bash
# Script to create missing files and directories for Medical Physics Game reorganization

# Create base directories if they don't exist
mkdir -p medical_physics_game/backend/api
mkdir -p medical_physics_game/backend/core
mkdir -p medical_physics_game/backend/data/models
mkdir -p medical_physics_game/backend/data/repositories
mkdir -p medical_physics_game/backend/data/schemas
mkdir -p medical_physics_game/backend/plugins
mkdir -p medical_physics_game/backend/utils
mkdir -p medical_physics_game/frontend/src/core
mkdir -p medical_physics_game/frontend/src/entities/player
mkdir -p medical_physics_game/frontend/src/entities/nodes/node_types
mkdir -p medical_physics_game/frontend/src/entities/items
mkdir -p medical_physics_game/frontend/src/systems/combat
mkdir -p medical_physics_game/frontend/src/systems/progression
mkdir -p medical_physics_game/frontend/src/systems/effects
mkdir -p medical_physics_game/frontend/src/systems/skill_tree
mkdir -p medical_physics_game/frontend/src/ui/components
mkdir -p medical_physics_game/frontend/src/ui/screens
mkdir -p medical_physics_game/frontend/src/ui/hud
mkdir -p medical_physics_game/frontend/src/ui/utils
mkdir -p medical_physics_game/frontend/src/utils/math
mkdir -p medical_physics_game/frontend/src/utils/data
mkdir -p medical_physics_game/frontend/src/utils/debug
mkdir -p medical_physics_game/frontend/static/css/base
mkdir -p medical_physics_game/frontend/static/css/components
mkdir -p medical_physics_game/frontend/static/css/screens
mkdir -p medical_physics_game/frontend/static/css/themes
mkdir -p medical_physics_game/frontend/static/img/characters
mkdir -p medical_physics_game/frontend/static/img/items
mkdir -p medical_physics_game/frontend/static/img/nodes
mkdir -p medical_physics_game/frontend/static/img/ui
mkdir -p medical_physics_game/frontend/static/assets/fonts
mkdir -p medical_physics_game/frontend/static/assets/audio
mkdir -p medical_physics_game/frontend/templates/components
mkdir -p medical_physics_game/frontend/templates/pages
mkdir -p medical_physics_game/frontend/templates/errors
mkdir -p medical_physics_game/data/characters
mkdir -p medical_physics_game/data/items
mkdir -p medical_physics_game/data/maps
mkdir -p medical_physics_game/data/questions
mkdir -p medical_physics_game/data/skill_tree
mkdir -p medical_physics_game/config
mkdir -p medical_physics_game/tests/backend
mkdir -p medical_physics_game/tests/frontend
mkdir -p medical_physics_game/tests/integration
mkdir -p medical_physics_game/docs
mkdir -p medical_physics_game/tools/data_editors
mkdir -p medical_physics_game/tools/debugging

# Create empty __init__.py files for all Python packages
find medical_physics_game -type d -not -path "*/\.*" -not -path "*/static*" -not -path "*/templates*" -not -path "*/img*" -not -path "*/css*" -not -path "*/data*" -exec touch {}/__init__.py \;

# Create API route stub files
for route in game_state_routes item_routes question_routes skill_tree_routes; do
    cat > medical_physics_game/backend/api/${route}.py << EOF
"""
${route//_/ } API routes for the Medical Physics Game.
"""

from flask import jsonify, request
from . import api_bp

# Add route implementations here
EOF
done

# Create empty base templates
cat > medical_physics_game/frontend/templates/base.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Medical Physics Game{% endblock %}</title>
    
    <!-- Base CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/base/reset.css') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/base/variables.css') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/base/layout.css') }}">
    
    <!-- Theme CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/themes/retro_theme.css') }}">
    
    {% block additional_css %}{% endblock %}
</head>
<body>
    <div id="app">
        {% block content %}{% endblock %}
    </div>
    
    <!-- Core scripts -->
    <script src="{{ url_for('static', filename='js/core/bootstrap.js') }}" type="module"></script>
    {% block additional_js %}{% endblock %}
</body>
</html>
EOF

# Create error templates
cat > medical_physics_game/frontend/templates/errors/404.html << EOF
{% extends "base.html" %}

{% block title %}Page Not Found{% endblock %}

{% block content %}
<div class="error-container">
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="{{ url_for('index') }}">Return to Home</a>
</div>
{% endblock %}
EOF

cat > medical_physics_game/frontend/templates/errors/500.html << EOF
{% extends "base.html" %}

{% block title %}Server Error{% endblock %}

{% block content %}
<div class="error-container">
    <h1>500 - Server Error</h1>
    <p>Something went wrong on our end. Please try again later.</p>
    <a href="{{ url_for('index') }}">Return to Home</a>
</div>
{% endblock %}
EOF

# Create page templates
cat > medical_physics_game/frontend/templates/pages/index.html << EOF
{% extends "base.html" %}

{% block title %}Medical Physics Game{% endblock %}

{% block content %}
<div class="home-container">
    <h1>Medical Physics Game</h1>
    <div class="button-container">
        <button id="new-game-btn" class="primary-button">New Game</button>
        <button id="continue-btn" class="secondary-button">Continue</button>
    </div>
</div>
{% endblock %}
EOF

# Create basic CSS files
cat > medical_physics_game/frontend/static/css/base/reset.css << EOF
/* Reset CSS */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
}
EOF

cat > medical_physics_game/frontend/static/css/base/variables.css << EOF
/* CSS Variables */
:root {
    /* Colors */
    --primary-color: #4a90e2;
    --secondary-color: #50e3c2;
    --background-color: #f8f9fa;
    --text-color: #333;
    --error-color: #e74c3c;
    --success-color: #2ecc71;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* Font sizes */
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-md: 1rem;
    --font-size-lg: 1.25rem;
    --font-size-xl: 1.5rem;
    --font-size-xxl: 2rem;
}
EOF

# Create WSGI file
cat > medical_physics_game/wsgi.py << EOF
"""
WSGI entry point for the Medical Physics Game.
"""

from app import create_app

app = create_app('production')

if __name__ == '__main__':
    app.run()
EOF

# Create requirements.txt
cat > medical_physics_game/requirements.txt << EOF
Flask==2.0.1
pytest==6.2.5
isort==5.9.3
autopep8==1.5.7
Werkzeug==2.0.1
Jinja2==3.0.1
MarkupSafe==2.0.1
itsdangerous==2.0.1
click==8.0.1
EOF

# Create README.md
cat > medical_physics_game/README.md << EOF
# Medical Physics Game

A roguelike educational game for learning medical physics concepts.

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`
3. Run the application:
   \`\`\`
   python app.py
   \`\`\`

## Project Structure

The project follows a modular architecture with clear separation of backend, frontend, and data components:

- \`backend/\`: Server-side code (API, game logic, data access)
- \`frontend/\`: Client-side code (UI, JavaScript, assets)
- \`data/\`: Game data files (characters, questions, maps)
- \`config/\`: Configuration files
- \`tests/\`: Test suite
- \`docs/\`: Documentation
- \`tools/\`: Development and debugging tools

## Development

For development, run the application with debug mode enabled:

\`\`\`
python app.py
\`\`\`

## Testing

Run tests with pytest:

\`\`\`
pytest
\`\`\`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
EOF

echo "Missing files and directories created successfully."