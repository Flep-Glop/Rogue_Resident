#!/usr/bin/env python3
import re

# Read the current app.py
with open('app.py', 'r') as f:
    content = f.read()

# Check if it's already using the factory pattern
if 'def create_app' in content:
    # Update static and template folder paths
    pattern = r"app\s*=\s*Flask\s*\(\s*__name__\s*,\s*([^)]*)\)"
    
    # Prepare the new app configuration
    new_app_config = "app = Flask(__name__, "
    new_app_config += "static_folder='frontend/static', "
    new_app_config += "template_folder='frontend/templates')"
    
    # Replace the Flask app initialization
    if re.search(pattern, content):
        content = re.sub(pattern, new_app_config, content)
    else:
        # If no static/template folders were defined
        content = content.replace("app = Flask(__name__)", new_app_config)
else:
    # We need to implement the factory pattern as described in the guide
    new_content = """
from flask import Flask, render_template
from backend.api.routes import api_bp

def create_app(config_name='development'):
    app = Flask(__name__, 
               static_folder='frontend/static',
               template_folder='frontend/templates')
    
    # Load configuration
    if config_name == 'development':
        app.config.from_pyfile('config/development.py')
    elif config_name == 'production':
        app.config.from_pyfile('config/production.py')
    elif config_name == 'test':
        app.config.from_pyfile('config/test.py')
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('errors/500.html'), 500
    
    # Routes
    @app.route('/')
    def index():
        return render_template('pages/index.html')
    
    @app.route('/character-select')
    def character_select():
        return render_template('pages/character_select.html')
    
    @app.route('/game')
    def game():
        return render_template('pages/game.html')
    
    @app.route('/item-editor')
    def item_editor():
        return render_template('pages/item_editor.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
"""
    content = new_content

# Write the updated app.py
with open('app.py', 'w') as f:
    f.write(content)

print("✅ Updated app.py configuration")
