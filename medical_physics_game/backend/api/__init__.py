from flask import Blueprint

# Create the Blueprint
api_bp = Blueprint('api', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes
from . import character_routes
from . import game_state_routes
from . import item_routes
from . import question_routes
from . import skill_tree_routes
