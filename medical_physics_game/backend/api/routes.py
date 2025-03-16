from flask import Blueprint

api_bp = Blueprint('api', __name__)

from . import character_routes
from . import item_routes
from . import question_routes
from . import skill_tree_routes
from . import game_state_routes
