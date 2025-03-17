"""
Skill Tree API Routes for the Medical Physics Game.
This file defines the API endpoints for skill tree operations.
"""
from flask import Blueprint, jsonify, request

from backend.core.skill_tree_manager import SkillTreeManager

# Create blueprint
skill_tree_bp = Blueprint('skill_tree', __name__, url_prefix='/api/skill-tree')

# Create manager instance
skill_tree_manager = SkillTreeManager()


@skill_tree_bp.route('/<tree_id>', methods=['GET'])
def get_skill_tree(tree_id):
    """Get a skill tree by its ID."""
    tree = skill_tree_manager.get_skill_tree(tree_id)
    if tree is None:
        return jsonify({"error": "Skill tree not found"}), 404
    
    return jsonify(tree.to_dict())


@skill_tree_bp.route('/character/<character_class>/<character_id>', methods=['GET'])
def get_character_skill_tree(character_class, character_id):
    """Get or create a skill tree for a character."""
    try:
        tree = skill_tree_manager.get_skill_tree_for_character(character_class, character_id)
        return jsonify(tree.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@skill_tree_bp.route('/<tree_id>/points', methods=['POST'])
def award_skill_points(tree_id):
    """Award skill points to a character's skill tree."""
    data = request.get_json()
    if not data or 'points' not in data:
        return jsonify({"error": "Points value required"}), 400
    
    try:
        points = int(data['points'])
        if points <= 0:
            return jsonify({"error": "Points must be positive"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Points must be a valid integer"}), 400
    
    success = skill_tree_manager.award_skill_points(tree_id, points)
    if not success:
        return jsonify({"error": "Failed to award points"}), 404
    
    # Get updated tree to return current state
    tree = skill_tree_manager.get_skill_tree(tree_id)
    
    return jsonify({
        "success": True,
        "tree_id": tree_id,
        "points_awarded": points,
        "available_points": tree.available_points,
        "total_earned_points": tree.total_earned_points
    })


@skill_tree_bp.route('/<tree_id>/nodes/<node_id>/unlock', methods=['POST'])
def unlock_node(tree_id, node_id):
    """Unlock a skill tree node."""
    success, result = skill_tree_manager.unlock_node(tree_id, node_id)
    
    if not success:
        return jsonify({"success": False, **result}), 400
    
    return jsonify({"success": True, **result})


@skill_tree_bp.route('/<tree_id>/nodes/<node_id>/level-up', methods=['POST'])
def level_up_node(tree_id, node_id):
    """Level up a skill tree node."""
    success, result = skill_tree_manager.level_up_node(tree_id, node_id)
    
    if not success:
        return jsonify({"success": False, **result}), 400
    
    return jsonify({"success": True, **result})


@skill_tree_bp.route('/<tree_id>/reset', methods=['POST'])
def reset_skill_tree(tree_id):
    """Reset a character's skill tree."""
    success = skill_tree_manager.reset_skill_tree(tree_id)
    
    if not success:
        return jsonify({"success": False, "error": "Failed to reset skill tree"}), 404
    
    # Get updated tree to return current state
    tree = skill_tree_manager.get_skill_tree(tree_id)
    
    return jsonify({
        "success": True,
        "tree_id": tree_id,
        "available_points": tree.available_points
    })


@skill_tree_bp.route('/<tree_id>/effects', methods=['GET'])
def get_node_effects(tree_id):
    """Get all active effects from unlocked nodes in a skill tree."""
    effects = skill_tree_manager.get_node_effects(tree_id)
    
    return jsonify({
        "tree_id": tree_id,
        "effects": effects
    })


@skill_tree_bp.route('/<tree_id>/effects/<effect_type>/total', methods=['GET'])
def get_total_effect(tree_id, effect_type):
    """Get the total value of a specific effect type."""
    total = skill_tree_manager.calculate_total_effect(tree_id, effect_type)
    
    return jsonify({
        "tree_id": tree_id,
        "effect_type": effect_type,
        "total_value": total
    })


def register_routes(app):
    """Register routes with the Flask app."""
    app.register_blueprint(skill_tree_bp)