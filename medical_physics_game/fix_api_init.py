#!/usr/bin/env python3
import os

# The path to the API init file
api_init_path = 'backend/api/__init__.py'

# Create a proper __init__.py file
with open(api_init_path, 'w') as f:
    f.write("""# API package initialization

# Import the necessary modules
from flask import Blueprint

# Create a Blueprint for the API
api_bp = Blueprint('api', __name__)

# Import routes to register them with the blueprint
# These imports need to be after the api_bp is created to avoid circular imports
from . import character_routes, game_state_routes, item_routes, question_routes, skill_tree_routes
""")

print(f"✅ Fixed {api_init_path}")

# Make sure the routes.py file exists
routes_file = 'backend/api/routes.py'
if not os.path.exists(routes_file):
    with open(routes_file, 'w') as f:
        f.write("""from flask import Blueprint

# This file is primarily for re-exporting the blueprint
from . import api_bp
""")
    print(f"✅ Created {routes_file}")

# Create empty route files if they don't exist
routes = ['character_routes.py', 'game_state_routes.py', 'item_routes.py', 
          'question_routes.py', 'skill_tree_routes.py']

for route in routes:
    route_path = f'backend/api/{route}'
    if not os.path.exists(route_path):
        route_base = route.split('_')[0]
        with open(route_path, 'w') as f:
            f.write(f"""from flask import jsonify, request
from . import api_bp

@api_bp.route('/api/{route_base}s', methods=['GET'])
def get_{route_base}s():
    # Placeholder implementation
    return jsonify({{"status": "ok", "message": "{route_base.capitalize()} endpoint working"}})
""")
        print(f"✅ Created {route_path}")
