#!/bin/bash

echo "Fixing all templates..."

# Process all template files
template_dir="frontend/templates"
template_files=$(find "$template_dir" -type f -name "*.html")

for template in $template_files; do
    # Make a backup
    cp "$template" "${template}.bak"
    
    # Replace static file references
    sed -i 's|/static/css/|{{ url_for("static", filename="css/") }}|g' "$template"
    sed -i 's|/static/js/|{{ url_for("static", filename="js/") }}|g' "$template"
    sed -i 's|/static/img/|{{ url_for("static", filename="img/") }}|g' "$template"
    
    # Fix character_assets.js path
    sed -i 's|src="/static/js/character_assets.js"|src="{{ url_for(\'static\', filename=\'js/character_assets.js\') }}"|g' "$template"
    
    echo "✅ Updated paths in $template"
done

# Now check for specific templates that might need additional fixes
character_select="frontend/templates/pages/character_select.html"
if [ -f "$character_select" ]; then
    # Make sure it extends base.html
    if ! grep -q "{% extends \"base.html\" %}" "$character_select"; then
        # Insert the extends directive at the beginning
        sed -i '1i{% extends "base.html" %}\n\n{% block title %}Character Selection{% endblock %}\n\n{% block content %}' "$character_select"
        echo '</div>{% endblock %}' >> "$character_select"
        echo "✅ Added template inheritance to character_select.html"
    fi
fi

echo "Template fixes complete!"
