#!/bin/bash

echo "Fixing remaining issues..."

# 1. Fix template files
mkdir -p frontend/templates/pages
mkdir -p frontend/templates/errors

# Create base.html if it doesn't exist
if [ ! -f "frontend/templates/base.html" ]; then
    cat > frontend/templates/base.html << 'END'
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
END
    echo "✅ Created frontend/templates/base.html"
fi

# Create 404.html if it doesn't exist
if [ ! -f "frontend/templates/errors/404.html" ]; then
    cat > frontend/templates/errors/404.html << 'END'
{% extends "base.html" %}

{% block title %}Page Not Found{% endblock %}

{% block content %}
<div class="error-container">
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="{{ url_for('index') }}">Return to Home</a>
</div>
{% endblock %}
END
    echo "✅ Created frontend/templates/errors/404.html"
fi

# Create 500.html if it doesn't exist
if [ ! -f "frontend/templates/errors/500.html" ]; then
    cat > frontend/templates/errors/500.html << 'END'
{% extends "base.html" %}

{% block title %}Server Error{% endblock %}

{% block content %}
<div class="error-container">
    <h1>500 - Server Error</h1>
    <p>Something went wrong on our end. Please try again later.</p>
    <a href="{{ url_for('index') }}">Return to Home</a>
</div>
{% endblock %}
END
    echo "✅ Created frontend/templates/errors/500.html"
fi

# Create index.html if it doesn't exist
if [ ! -f "frontend/templates/pages/index.html" ]; then
    if [ -f "templates/index.html" ]; then
        cp -v templates/index.html frontend/templates/pages/index.html
    else
        cat > frontend/templates/pages/index.html << 'END'
{% extends "base.html" %}

{% block title %}Medical Physics Game{% endblock %}

{% block additional_css %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/screens/game.css') }}">
{% endblock %}

{% block content %}
<div class="container">
    <h1>Medical Physics Game</h1>
    <div class="menu">
        <a href="{{ url_for('character_select') }}" class="btn">Start Game</a>
        <a href="{{ url_for('item_editor') }}" class="btn">Item Editor</a>
    </div>
</div>
{% endblock %}
END
    fi
    echo "✅ Created frontend/templates/pages/index.html"
fi

# Copy other page templates if they exist
for template in character_select.html game.html item_editor.html; do
    if [ -f "templates/${template}" ] && [ ! -f "frontend/templates/pages/${template}" ]; then
        cp -v templates/${template} frontend/templates/pages/${template}
        echo "✅ Copied ${template} to frontend/templates/pages/"
    fi
done

# 2. Fix static file paths
# Convert any retro-theme.css to retro_theme.css
if [ -f "frontend/static/css/themes/retro-theme.css" ] && [ ! -f "frontend/static/css/themes/retro_theme.css" ]; then
    cp -v frontend/static/css/themes/retro-theme.css frontend/static/css/themes/retro_theme.css
    echo "✅ Created retro_theme.css from retro-theme.css"
fi

# 3. Create missing JS directories for organization
mkdir -p frontend/static/js/core
mkdir -p frontend/static/js/components
mkdir -p frontend/static/js/utils

# 4. Create symbolic links for frontend/static/js files to help with transitions
for file in core/game.js core/bootstrap.js core/event_system.js core/state_manager.js; do
    if [ -f "frontend/src/${file}" ] && [ ! -f "frontend/static/js/${file}" ]; then
        mkdir -p $(dirname "frontend/static/js/${file}")
        ln -sf "../../../src/${file}" "frontend/static/js/${file}"
        echo "✅ Created symlink for ${file}"
    fi
done

echo "Fixes applied successfully!"
