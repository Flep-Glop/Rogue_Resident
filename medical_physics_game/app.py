"""
Main application entry point for the Medical Physics Game.
Uses Flask to serve the game's web interface.
"""

from flask import Flask, render_template, jsonify, request, redirect, url_for
import os
import json
import logging
from logging.handlers import RotatingFileHandler

def create_app(config_name='development'):
    """
    Create and configure the Flask application.
    
    Args:
        config_name (str): Configuration name to use
        
    Returns:
        Flask: Configured Flask application
    """
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
    
    # Set up logging
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/medical_physics_game.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Medical Physics Game startup')
    
    # Register API routes
    from backend.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Initialize database and make sure data directories exist
    from backend.utils.db_utils import ensure_data_dirs
    ensure_data_dirs()
    
    # Error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('errors/500.html'), 500
    
    # Main routes
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
    
    # Development routes - only available in development mode
    if app.config.get('DEBUG', False):
        @app.route('/debug')
        def debug():
            """Debug page for development."""
            from backend.core.state_manager import get_game_state
            
            game_state = get_game_state()
            debug_info = {
                'game_state': {
                    'current_floor': game_state.current_floor,
                    'current_node_id': game_state.current_node_id,
                    'visited_nodes': game_state.visited_nodes,
                    'score': game_state.score,
                    'reputation': game_state.reputation,
                    'game_over': game_state.game_over
                },
                'character': game_state.character.to_dict() if game_state.character else None,
                'config': {
                    'debug': app.config.get('DEBUG', False),
                    'testing': app.config.get('TESTING', False),
                    'database_path': app.config.get('DATABASE_PATH', 'unknown')
                }
            }
            
            return render_template('pages/debug.html', debug_info=debug_info)
    
    return app

# Development server
if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, host='0.0.0.0', port=5000)
