from flask import Blueprint

# Create the Blueprint
api_bp = Blueprint('api', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes
from . import character_routes
