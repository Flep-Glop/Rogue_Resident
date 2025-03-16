# API package initialization

# Import the necessary modules
from flask import Blueprint

# Create a Blueprint for the API
api_bp = Blueprint('api', __name__)

# Import routes to register them with the blueprint
# These imports need to be after the api_bp is created to avoid circular imports
from . import character_routes, game_state_routes, item_routes, question_routes, skill_tree_routes
