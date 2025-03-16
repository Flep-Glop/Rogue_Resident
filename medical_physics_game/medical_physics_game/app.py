from flask import Flask, render_template
from backend.api import api_bp

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
        return "Game Page"  # We'll implement this later
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
