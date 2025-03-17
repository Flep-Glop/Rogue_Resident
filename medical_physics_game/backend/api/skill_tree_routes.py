from flask import jsonify, request
from backend.api.routes import api_bp
import json
import os
from pathlib import Path

# Path to skill tree data files
DATA_DIR = Path(__file__).resolve().parents[2] / 'data'
SKILL_TREE_FILE = DATA_DIR / 'skill_tree' / 'skill_tree.json'

@api_bp.route('/skill-tree', methods=['GET'])
def get_skill_tree():
    """Get the skill tree data."""
    try:
        # Check if file exists
        if not SKILL_TREE_FILE.exists():
            # Return default data
            return jsonify({
                "specializations": [
                    {
                        "id": "core",
                        "name": "Core Competencies",
                        "description": "Fundamental medical physics knowledge",
                        "color": "#777777",
                        "threshold": 4,
                        "mastery_threshold": 8
                    },
                    {
                        "id": "theory",
                        "name": "Theory Specialist",
                        "description": "Focus on physics principles and mathematical understanding",
                        "color": "#4287f5",
                        "threshold": 5,
                        "mastery_threshold": 8
                    },
                    {
                        "id": "clinical",
                        "name": "Clinical Expert",
                        "description": "Focus on patient care and treatment application",
                        "color": "#42f575",
                        "threshold": 5,
                        "mastery_threshold": 8
                    }
                ],
                "nodes": [
                    {
                        "id": "core_physics",
                        "name": "Core Physics",
                        "specialization": "core",
                        "tier": 0,
                        "description": "Foundation of medical physics knowledge",
                        "position": {"x": 400, "y": 250},
                        "cost": {
                            "reputation": 0,
                            "skill_points": 0
                        },
                        "effects": []
                    }
                ],
                "connections": []
            })
        
        # Load skill tree data from file
        with open(SKILL_TREE_FILE, 'r') as f:
            skill_tree_data = json.load(f)
        
        return jsonify(skill_tree_data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/skill-progress', methods=['GET'])
def get_skill_progress():
    """Get the player's skill tree progress."""
    # In a real implementation, this would load from a database
    # For now, we'll return some default data
    
    # Get character ID from query parameter
    character_id = request.args.get('character_id', '')
    
    # Create a file path for this character's progress
    character_progress_file = DATA_DIR / 'skill_tree' / 'progress' / f"{character_id}.json"
    
    try:
        # Check if file exists
        if not character_progress_file.exists():
            # Return default progress
            return jsonify({
                "reputation": 10,
                "unlocked_skills": ["core_physics"],
                "active_skills": ["core_physics"],
                "skill_points_available": 3,
                "specialization_progress": {
                    "core": 1,
                    "theory": 0,
                    "clinical": 0
                }
            })
        
        # Load progress from file
        with open(character_progress_file, 'r') as f:
            progress_data = json.load(f)
        
        return jsonify(progress_data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/skill-progress', methods=['POST'])
def save_skill_progress():
    """Save the player's skill tree progress."""
    try:
        # Get data from request
        data = request.get_json()
        
        # Get character ID from query parameter
        character_id = request.args.get('character_id', '')
        
        if not character_id:
            return jsonify({"error": "Character ID is required"}), 400
        
        # Create directory if it doesn't exist
        progress_dir = DATA_DIR / 'skill_tree' / 'progress'
        os.makedirs(progress_dir, exist_ok=True)
        
        # Create a file path for this character's progress
        character_progress_file = progress_dir / f"{character_id}.json"
        
        # Save progress to file
        with open(character_progress_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        return jsonify({"status": "success"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500