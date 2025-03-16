from flask import Flask, render_template, jsonify

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
    
    @app.route('/game')
    def game():
        return render_template('pages/game.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
