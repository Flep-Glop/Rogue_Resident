from flask import Blueprint, request, jsonify
from datetime import datetime

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    
    if not data or not data.get('content'):
        return jsonify({'error': 'Feedback content is required'}), 400
        
    feedback = {
        'user_id': data.get('user_id'),
        'content': data.get('content'),
        'category': data.get('category', 'general'),
        'rating': data.get('rating'),
        'page': data.get('page'),
        'timestamp': datetime.now().isoformat()
    }
    
    # Log the feedback
    print(f"Feedback received: {feedback['category']} - Rating: {feedback['rating']}")
    
    # Store the feedback (placeholder for actual repository call)
    # FeedbackRepository.add_feedback(feedback)
    
    return jsonify({'message': 'Feedback submitted successfully'}), 200
    
@feedback_bp.route('/bug-report', methods=['POST'])
def submit_bug_report():
    data = request.json
    
    if not data or not data.get('description'):
        return jsonify({'error': 'Bug description is required'}), 400
        
    bug_report = {
        'user_id': data.get('user_id'),
        'description': data.get('description'),
        'steps_to_reproduce': data.get('steps_to_reproduce'),
        'expected_behavior': data.get('expected_behavior'),
        'actual_behavior': data.get('actual_behavior'),
        'browser': data.get('browser'),
        'os': data.get('os'),
        'screenshot_url': data.get('screenshot_url'),
        'timestamp': datetime.now().isoformat()
    }
    
    # Log the bug report
    print(f"Bug report: {bug_report['description']}")
    
    # Store the bug report (placeholder for actual repository call)
    # FeedbackRepository.add_bug_report(bug_report)
    
    return jsonify({'message': 'Bug report submitted successfully'}), 200