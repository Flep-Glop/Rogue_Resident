#!/bin/bash

echo "Fixing app routes..."

# Read the file
APP_FILE="app.py"
content=$(cat "$APP_FILE")

# Make sure render_template is imported
if ! grep -q "from flask import.*render_template" "$APP_FILE"; then
    # If render_template is not already imported, add it
    sed -i 's/from flask import Flask/from flask import Flask, render_template/' "$APP_FILE"
    echo "✅ Added render_template import"
fi

# Make sure the Flask app is configured with the correct folders
if ! grep -q "static_folder.*frontend/static" "$APP_FILE"; then
    # Replace the Flask app initialization
    sed -i 's/app = Flask(__name__)/app = Flask(__name__, static_folder="frontend\/static", template_folder="frontend\/templates")/' "$APP_FILE"
    echo "✅ Updated Flask app initialization with correct folders"
fi

# Make sure route templates use the 'pages/' prefix
sed -i 's/render_template("\([^"]*\).html")/render_template("pages\/\1.html")/' "$APP_FILE"
echo "✅ Updated template paths in routes"

echo "App routes fixes complete!"
