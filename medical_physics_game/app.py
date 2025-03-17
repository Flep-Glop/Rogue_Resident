from flask import Flask, render_template, jsonify, request, send_from_directory
import os

def create_app(config_name='development'):
    app = Flask(__name__, 
               static_folder='frontend/static',
               template_folder='frontend/templates')
    
    # Load configuration
    if config_name == 'development':
        app.config['DEBUG'] = True
        app.config['SECRET_KEY'] = 'dev-secret-key'
    
    # Register blueprints - MUST import here to avoid circular imports
    from backend.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # Custom static file handling with explicit MIME types
    @app.route('/static/<path:filename>')
    def custom_static(filename):
        # Define MIME types for different file extensions
        mime_types = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon',
            '.ttf': 'font/ttf',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.eot': 'application/vnd.ms-fontobject'
        }
        
        # Get file extension
        _, file_ext = os.path.splitext(filename)
        
        # Default MIME type
        mimetype = None
        
        # Set MIME type if we know it
        if file_ext.lower() in mime_types:
            mimetype = mime_types[file_ext.lower()]
        
        return send_from_directory(app.static_folder, filename, mimetype=mimetype)

    # Test route to verify the app is working
    @app.route('/test')
    def test():
        return jsonify({"status": "ok", "message": "Flask app is working!"})

    # Routes
    @app.route('/')
    def index():
        """Render the landing page."""
        return render_template('pages/landing.html')

    @app.route('/character-select')
    def character_select():
        return render_template('pages/character_select.html')
    
    @app.route('/character-create')
    def character_create():
        """Render the character creation page."""
        return render_template('pages/character_create.html')
    @app.route('/skill-tree')
    def skill_tree():
        """Render the skill tree page."""
        return render_template('pages/skill_tree.html')
    @app.route('/game')
    def game():
        return render_template('pages/game.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)