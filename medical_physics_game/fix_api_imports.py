#!/usr/bin/env python3
import os

# Fix the import in backend/api/__init__.py
api_init_path = 'backend/api/__init__.py'

if os.path.exists(api_init_path):
    with open(api_init_path, 'r') as f:
        content = f.read()
    
    # Fix incorrect import syntax
    content = content.replace('from . import backend.core', 'from .. import core')
    content = content.replace('from . import backend.data', 'from .. import data')
    content = content.replace('from . import backend.plugins', 'from .. import plugins')
    content = content.replace('from . import backend.utils', 'from .. import utils')
    
    with open(api_init_path, 'w') as f:
        f.write(content)
    
    print(f"✅ Fixed imports in {api_init_path}")
    
# Create a simple init file if it doesn't exist
else:
    os.makedirs(os.path.dirname(api_init_path), exist_ok=True)
    with open(api_init_path, 'w') as f:
        f.write("# API package initialization\n")
    print(f"✅ Created {api_init_path}")

# Create a proper routes.py file
routes_file = 'backend/api/routes.py'
if not os.path.exists(routes_file):
    with open(routes_file, 'w') as f:
        f.write("""from flask import Blueprint

api_bp = Blueprint('api', __name__)

# Import routes to register them with the blueprint
from . import character_routes
from . import game_state_routes
from . import item_routes
from . import question_routes
from . import skill_tree_routes
""")
    print(f"✅ Created {routes_file}")

# Create empty route files if they don't exist
routes = ['character_routes.py', 'game_state_routes.py', 'item_routes.py', 
          'question_routes.py', 'skill_tree_routes.py']

for route in routes:
    route_path = f'backend/api/{route}'
    if not os.path.exists(route_path):
        with open(route_path, 'w') as f:
            f.write(f"""from flask import jsonify, request
from . import api_bp

@api_bp.route('/{route.split('_')[0]}s', methods=['GET'])
def get_all():
    # Placeholder - replace with actual implementation
    return jsonify({{"status": "ok", "message": "This endpoint is not fully implemented yet"}})
""")
        print(f"✅ Created {route_path}")
