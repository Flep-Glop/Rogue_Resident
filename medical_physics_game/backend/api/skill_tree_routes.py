from flask import jsonify
from backend.api.routes import api_bp
import json
import os

@api_bp.route('/skill_tree', methods=['GET'])
def get_skill_tree():
    try:
        skill_tree_path = os.path.join('data', 'skill_tree', 'skill_tree.json')
        with open(skill_tree_path, 'r') as f:
            skill_tree = json.load(f)
        return jsonify(skill_tree)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
