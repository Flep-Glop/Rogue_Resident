from flask import Blueprint

# Create the API blueprint
api_bp = Blueprint('api', __name__)

# Import routes AFTER creating the blueprint to avoid circular imports
from backend.api import character_routes
from backend.api import item_routes
from backend.api import question_routes
from backend.api import skill_tree_routes
from backend.api import game_state_routes
