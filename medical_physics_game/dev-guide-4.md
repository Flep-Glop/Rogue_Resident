# Medical Physics Game Developer Guide 4

## Table of Contents

1. [Introduction](#introduction)
2. [Project Status Check](#project-status-check)
3. [Final Integration](#final-integration)
   - [Resolving Migration Issues](#resolving-migration-issues)
   - [Reconciling Old and New Implementations](#reconciling-old-and-new-implementations)
4. [Feature Completion](#feature-completion)
   - [Achievement System](#achievement-system)
   - [Analytics and Feedback System](#analytics-and-feedback-system)
   - [Content Management Dashboard](#content-management-dashboard)
5. [Performance Optimization](#performance-optimization)
   - [Asset Optimization](#asset-optimization)
   - [Caching Strategy](#caching-strategy)
   - [Lazy Loading](#lazy-loading)
6. [Production Readiness](#production-readiness)
   - [Security Considerations](#security-considerations)
   - [Final Testing Checklist](#final-testing-checklist)
   - [Deployment Pipeline](#deployment-pipeline)
7. [Documentation](#documentation)
   - [User Documentation](#user-documentation)
   - [Developer Documentation](#developer-documentation)
   - [API Documentation](#api-documentation)
8. [Future Roadmap](#future-roadmap)
   - [Feature Expansion Ideas](#feature-expansion-ideas)
   - [Technology Upgrades](#technology-upgrades)
   - [Community Building](#community-building)
9. [Appendix: Code References](#appendix-code-references)

## Introduction

Welcome to Developer Guide 4 for the Medical Physics Game! This guide builds upon the previous guides to finalize our educational roguelike game. The project has undergone a significant reorganization, with a focus on maintainability, modularity, and scalability.

This guide focuses on:
1. Completing the integration of reorganized components
2. Finishing implementation of remaining core features
3. Optimizing for performance and production deployment
4. Finalizing documentation and planning future enhancements

Our goal is to ensure the reorganized codebase maintains all the functionality of the original project while benefiting from the improved architecture and structure.

## Project Status Check

**IMPORTANT: At the beginning of each development session, run these commands to check the project status.**

```bash
# Check current project structure
find . -type d -not -path "*/\.*" -not -path "*/venv*" -not -path "*/node_modules*" | sort | sed -e "s/[^-][^\/]*\//  |/g" -e "s/|\([^ ]\)/|-\1/"

# Check implementation status of key components
echo "=== CONTENT DEVELOPMENT ==="
find . -name "question*.py" -o -name "*question*.js" | grep -v "__pycache__"

echo -e "\n=== SKILL TREE IMPLEMENTATION ==="
find . -name "*skill_tree*.py" -o -name "*skill_tree*.js" | grep -v "__pycache__"

echo -e "\n=== MAP GENERATION ==="
find . -name "*map*.py" -o -name "*map*.js" | grep -v "__pycache__"

echo -e "\n=== GAME BALANCE & PROGRESSION ==="
find . -name "*difficulty*.py" -o -name "*progression*.js" | grep -v "__pycache__"

echo -e "\n=== UI COMPONENTS ==="
find . -name "*animation*.js" -o -name "*sound*.js" | grep -v "__pycache__"

echo -e "\n=== TESTING ==="
find ./tests -type f -name "test_*.py" | grep -v "__pycache__"

echo -e "\n=== DEPLOYMENT ==="
find ./config -name "production.py" | grep -v "__pycache__"

# Get a count of files by type to track progress
echo -e "\n=== FILE COUNT BY TYPE ==="
echo "Python files: $(find . -name "*.py" | grep -v "__pycache__" | wc -l)"
echo "JavaScript files: $(find . -name "*.js" | wc -l)"
echo "HTML templates: $(find . -name "*.html" | wc -l)"
echo "CSS files: $(find . -name "*.css" | wc -l)"
echo "JSON data files: $(find . -name "*.json" | wc -l)"
echo "Test files: $(find ./tests -type f | wc -l)"
```

Run these commands at the start of each development session to check the current state of the project and identify any discrepancies or areas that need attention.

## Final Integration

The reorganization has preserved all existing functionality while improving the structure. However, there may be some integration points that need attention to ensure everything works correctly in the new structure.

### Resolving Migration Issues

1. **Check for import paths that need updating:**

```bash
# Find Python files with potentially outdated imports
grep -r "import" --include="*.py" . | grep -v "__pycache__" | grep -E "from\s+(game_state|data_manager|map_generator|node_plugins)"

# Find JavaScript files with potentially outdated imports
grep -r "import" --include="*.js" . | grep -E "from\s+['\"]\.\.\/engine|['\"]\.\.\/components"
```

If you find outdated imports, update them to match the new structure:

```python
# Old:
from game_state import GameState

# New:
from backend.core.state_manager import GameState
```

2. **Fix file references in configuration:**

Check configuration files and ensure they reference the correct paths:

```python
# config/development.py
TEMPLATE_FOLDER = 'frontend/templates'
STATIC_FOLDER = 'frontend/static'
```

3. **Update API endpoints:**

Ensure API routes are correctly registered in the application:

```python
# app.py
from backend.api.routes import api_bp

def create_app(config_name='development'):
    # ...
    app.register_blueprint(api_bp, url_prefix='/api')
    # ...
```

### Reconciling Old and New Implementations

The reorganization has moved files but primarily preserved functionality. In some cases, you may have both old and new implementations. Here's how to reconcile them:

1. **Identify duplicate functionality:**

```bash
# Find potential duplicates
find . -name "*map*.py" | sort
```

2. **Compare implementations:**

```bash
# Compare implementations
diff ./map_generator.py ./backend/core/map_generator.py
```

3. **Consolidate functionality:**

For each pair of duplicated files:
- Identify any unique functionality in the old version
- Ensure the new version incorporates all features
- Update references to use the new location
- Once confirmed, remove the old file

```bash
# After verification that the new file fully replaces the old
rm ./map_generator.py
```

## Feature Completion

While most core functionality is in place, there are several systems from Developer Guide 3 that need to be completed.

### Achievement System

Implement the achievement system as described in Developer Guide 3:

```python
# backend/core/achievement_system.py
class AchievementSystem:
    def __init__(self, user_id):
        self.user_id = user_id
        self.achievements = self._load_achievements()
        self.user_achievements = self._load_user_achievements()
        
    def _load_achievements(self):
        """Load achievement definitions"""
        # Implementation to load from file or database
        return [
            {
                'id': 'perfect_floor',
                'name': 'Perfect Knowledge',
                'description': 'Complete a floor with 100% correct answers',
                'icon': 'trophy',
                'hidden': False
            },
            {
                'id': 'skill_master',
                'name': 'Skill Master',
                'description': 'Unlock 20 skill nodes',
                'icon': 'skill',
                'hidden': False
            },
            {
                'id': 'save_lives',
                'name': 'Lifesaver',
                'description': 'Successfully treat 50 patients',
                'icon': 'heart',
                'hidden': False
            },
            # More achievements...
        ]
        
    def _load_user_achievements(self):
        """Load user's unlocked achievements"""
        from backend.data.repositories.user_repo import UserRepository
        user = UserRepository.get_user_by_id(self.user_id)
        return user.achievements if hasattr(user, 'achievements') else []
        
    def unlock_achievement(self, achievement_id):
        """Unlock an achievement for the user"""
        if achievement_id in self.user_achievements:
            return False
            
        # Check if achievement exists
        achievement = next((a for a in self.achievements if a['id'] == achievement_id), None)
        if not achievement:
            return False
            
        # Add achievement to user's unlocked achievements
        self.user_achievements.append(achievement_id)
        
        # Save to repository
        from backend.data.repositories.user_repo import UserRepository
        UserRepository.update_user_achievements(self.user_id, self.user_achievements)
        
        # Trigger achievement notification
        return {
            'achievement': achievement,
            'is_new': True
        }
        
    def check_achievement_progress(self, event_type, event_data):
        """Check if an event triggers any achievements"""
        results = []
        
        if event_type == 'floor_completed':
            correct_answers = event_data.get('correct_answers', 0)
            total_questions = event_data.get('total_questions', 0)
            
            if total_questions > 0 and correct_answers == total_questions:
                result = self.unlock_achievement('perfect_floor')
                if result:
                    results.append(result)
        
        # Add more checks for other event types
        
        return results
```

Create frontend components to display achievements:

```javascript
// frontend/src/ui/components/achievement_display.js
class AchievementDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.achievements = [];
        this.fetchAchievements();
    }
    
    async fetchAchievements() {
        try {
            const response = await fetch('/api/achievements');
            this.achievements = await response.json();
            this.render();
        } catch (error) {
            console.error('Error fetching achievements:', error);
        }
    }
    
    render() {
        this.container.innerHTML = '';
        
        if (this.achievements.length === 0) {
            this.container.innerHTML = '<p class="no-achievements">No achievements unlocked yet!</p>';
            return;
        }
        
        const achievementList = document.createElement('div');
        achievementList.className = 'achievement-list';
        
        this.achievements.forEach(achievement => {
            const achievementItem = document.createElement('div');
            achievementItem.className = 'achievement-item';
            achievementItem.innerHTML = `
                <img src="/static/img/icons/${achievement.icon}.png" alt="${achievement.name}" class="achievement-icon">
                <div class="achievement-details">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    <span class="achievement-date">${achievement.unlocked_date || 'Recently unlocked'}</span>
                </div>
            `;
            achievementList.appendChild(achievementItem);
        });
        
        this.container.appendChild(achievementList);
    }
    
    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <img src="/static/img/icons/${achievement.icon}.png" alt="${achievement.name}" class="achievement-icon">
            <div class="achievement-details">
                <h4>Achievement Unlocked!</h4>
                <p>${achievement.name}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 1000);
        }, 5000);
    }
}

export default AchievementDisplay;
```

### Analytics and Feedback System

Implement the analytics and feedback systems as described in Developer Guide 3:

```python
# backend/utils/analytics.py
import time
import json
from datetime import datetime

class Analytics:
    def __init__(self, user_id=None):
        self.user_id = user_id
        self.events = []
        
    def track_event(self, event_type, event_data=None):
        """Track a user event"""
        event = {
            'type': event_type,
            'data': event_data or {},
            'timestamp': datetime.now().isoformat(),
            'user_id': self.user_id
        }
        
        self.events.append(event)
        self._store_event(event)
        
    def _store_event(self, event):
        """Store event in database or log file"""
        from backend.data.repositories.analytics_repo import AnalyticsRepository
        AnalyticsRepository.add_event(event)
        
    def track_page_view(self, page, referrer=None, time_on_page=None):
        """Track a page view"""
        self.track_event('page_view', {
            'page': page,
            'referrer': referrer,
            'time_on_page': time_on_page
        })
        
    def track_feature_usage(self, feature, action=None):
        """Track feature usage"""
        self.track_event('feature_usage', {
            'feature': feature,
            'action': action
        })
        
    def track_error(self, error_type, error_message, stack_trace=None):
        """Track an error"""
        self.track_event('error', {
            'type': error_type,
            'message': error_message,
            'stack_trace': stack_trace
        })
        
    def track_performance(self, operation, duration_ms):
        """Track operation performance"""
        self.track_event('performance', {
            'operation': operation,
            'duration_ms': duration_ms
        })

class SessionTimer:
    def __init__(self, analytics, page=None):
        self.analytics = analytics
        self.page = page
        self.start_time = None
        
    def start(self, page=None):
        """Start timing a page view"""
        if page:
            self.page = page
        self.start_time = time.time()
        
    def stop(self):
        """Stop timing and track the page view"""
        if not self.start_time or not self.page:
            return
            
        duration = int((time.time() - self.start_time) * 1000)  # Convert to ms
        self.analytics.track_page_view(self.page, time_on_page=duration)
        self.start_time = None
```

Create the feedback collection routes:

```python
# backend/api/feedback_routes.py
from flask import Blueprint, request, jsonify
from backend.data.repositories.feedback_repo import FeedbackRepository
from backend.utils.logging import GameLogger
from datetime import datetime

feedback_bp = Blueprint('feedback', __name__)
logger = GameLogger()

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
    logger.info(f"Feedback received: {feedback['category']} - Rating: {feedback['rating']}", 
               logger_name='feedback')
    
    # Store the feedback
    FeedbackRepository.add_feedback(feedback)
    
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
    logger.error(f"Bug report: {bug_report['description']}", logger_name='bugs')
    
    # Store the bug report
    FeedbackRepository.add_bug_report(bug_report)
    
    return jsonify({'message': 'Bug report submitted successfully'}), 200
```

Implement frontend feedback component:

```javascript
// frontend/src/ui/components/feedback_form.js
class FeedbackForm {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="feedback-form">
                <h3>We Value Your Feedback</h3>
                <form id="user-feedback-form">
                    <div class="form-group">
                        <label for="feedback-category">Category:</label>
                        <select id="feedback-category" name="category" required>
                            <option value="general">General</option>
                            <option value="content">Educational Content</option>
                            <option value="gameplay">Gameplay</option>
                            <option value="ui">User Interface</option>
                            <option value="performance">Performance</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="feedback-rating">Rating:</label>
                        <div class="rating-container">
                            <input type="radio" name="rating" id="rating-5" value="5"><label for="rating-5">5</label>
                            <input type="radio" name="rating" id="rating-4" value="4"><label for="rating-4">4</label>
                            <input type="radio" name="rating" id="rating-3" value="3"><label for="rating-3">3</label>
                            <input type="radio" name="rating" id="rating-2" value="2"><label for="rating-2">2</label>
                            <input type="radio" name="rating" id="rating-1" value="1"><label for="rating-1">1</label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="feedback-content">Your Feedback:</label>
                        <textarea id="feedback-content" name="content" rows="5" required></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn primary">Submit Feedback</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    attachEventListeners() {
        const form = document.getElementById('user-feedback-form');
        
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const formData = new FormData(form);
            const feedback = {
                category: formData.get('category'),
                rating: parseInt(formData.get('rating')),
                content: formData.get('content'),
                page: window.location.pathname
            };
            
            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(feedback)
                });
                
                if (response.ok) {
                    this.showSuccessMessage();
                    form.reset();
                } else {
                    this.showErrorMessage();
                }
            } catch (error) {
                console.error('Error submitting feedback:', error);
                this.showErrorMessage();
            }
        });
    }
    
    showSuccessMessage() {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'feedback-success-message';
        messageContainer.textContent = 'Thank you for your feedback!';
        
        this.container.appendChild(messageContainer);
        
        setTimeout(() => {
            this.container.removeChild(messageContainer);
        }, 3000);
    }
    
    showErrorMessage() {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'feedback-error-message';
        messageContainer.textContent = 'There was an error submitting your feedback. Please try again.';
        
        this.container.appendChild(messageContainer);
        
        setTimeout(() => {
            this.container.removeChild(messageContainer);
        }, 5000);
    }
}

export default FeedbackForm;
```

### Content Management Dashboard

Create an admin dashboard for managing educational content:

```python
# backend/api/admin_routes.py
from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from backend.data.repositories.question_repo import QuestionRepository
from backend.data.repositories.user_repo import UserRepository

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.before_request
def check_admin():
    # Ensure only admins can access these routes
    if not current_user.is_authenticated or not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

@admin_bp.route('/')
@login_required
def admin_dashboard():
    return render_template('admin/dashboard.html')

@admin_bp.route('/questions')
@login_required
def question_management():
    return render_template('admin/questions.html')

@admin_bp.route('/questions/api', methods=['GET'])
@login_required
def get_questions():
    questions = QuestionRepository.get_all_questions()
    return jsonify(questions)

@admin_bp.route('/questions/api', methods=['POST'])
@login_required
def create_question():
    data = request.json
    # Validate question data
    if not data.get('text') or not data.get('options') or data.get('correct_answer') is None:
        return jsonify({'error': 'Missing required fields'}), 400
        
    question = {
        'text': data.get('text'),
        'options': data.get('options'),
        'correct_answer': data.get('correct_answer'),
        'difficulty': data.get('difficulty', 'intermediate'),
        'category': data.get('category', 'general'),
        'explanation': data.get('explanation', ''),
        'created_by': current_user.id
    }
    
    question_id = QuestionRepository.add_question(question)
    return jsonify({'id': question_id, 'message': 'Question created successfully'}), 201

@admin_bp.route('/questions/api/<question_id>', methods=['PUT'])
@login_required
def update_question(question_id):
    data = request.json
    # Update question
    success = QuestionRepository.update_question(question_id, data)
    if success:
        return jsonify({'message': 'Question updated successfully'})
    return jsonify({'error': 'Question not found'}), 404

@admin_bp.route('/questions/api/<question_id>', methods=['DELETE'])
@login_required
def delete_question(question_id):
    # Delete question
    success = QuestionRepository.delete_question(question_id)
    if success:
        return jsonify({'message': 'Question deleted successfully'})
    return jsonify({'error': 'Question not found'}), 404

@admin_bp.route('/users')
@login_required
def user_management():
    return render_template('admin/users.html')

@admin_bp.route('/analytics')
@login_required
def analytics_dashboard():
    return render_template('admin/analytics.html')
```

Create frontend templates for the admin dashboard:

```html
<!-- frontend/templates/admin/dashboard.html -->
{% extends "base.html" %}

{% block title %}Admin Dashboard - Medical Physics Game{% endblock %}

{% block additional_css %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/screens/admin.css') }}">
{% endblock %}

{% block content %}
<div class="admin-container">
    <div class="admin-sidebar">
        <h2>Admin Panel</h2>
        <nav class="admin-nav">
            <a href="{{ url_for('admin.admin_dashboard') }}" class="active">Dashboard</a>
            <a href="{{ url_for('admin.question_management') }}">Questions</a>
            <a href="{{ url_for('admin.user_management') }}">Users</a>
            <a href="{{ url_for('admin.analytics_dashboard') }}">Analytics</a>
        </nav>
    </div>
    
    <div class="admin-content">
        <h1>Admin Dashboard</h1>
        
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <h3>Total Questions</h3>
                <div class="stat-value" id="total-questions">Loading...</div>
            </div>
            
            <div class="admin-stat-card">
                <h3>Total Users</h3>
                <div class="stat-value" id="total-users">Loading...</div>
            </div>
            
            <div class="admin-stat-card">
                <h3>Active Sessions</h3>
                <div class="stat-value" id="active-sessions">Loading...</div>
            </div>
            
            <div class="admin-stat-card">
                <h3>Avg. Score</h3>
                <div class="stat-value" id="avg-score">Loading...</div>
            </div>
        </div>
        
        <div class="admin-row">
            <div class="admin-card">
                <h3>Recent Users</h3>
                <table class="admin-table" id="recent-users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Registration Date</th>
                            <th>Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="3">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="admin-card">
                <h3>Recent Feedback</h3>
                <div id="recent-feedback">
                    <p>Loading...</p>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block additional_js %}
<script src="{{ url_for('static', filename='js/admin/dashboard.js') }}" type="module"></script>
{% endblock %}
```

## Performance Optimization

Now that the core functionality is complete, let's focus on optimizing performance for production.

### Asset Optimization

Implement the static file versioning system:

```python
# backend/utils/static_manager.py
import os
import hashlib
import json

class StaticManager:
    def __init__(self, static_dir, manifest_path):
        self.static_dir = static_dir
        self.manifest_path = manifest_path
        self.manifest = self._load_manifest()
        
    def _load_manifest(self):
        """Load the asset manifest file"""
        try:
            with open(self.manifest_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
            
    def _save_manifest(self):
        """Save the asset manifest file"""
        os.makedirs(os.path.dirname(self.manifest_path), exist_ok=True)
        with open(self.manifest_path, 'w') as f:
            json.dump(self.manifest, f, indent=2)
            
    def get_versioned_path(self, file_path):
        """Get a versioned path for a static file"""
        if file_path in self.manifest:
            return self.manifest[file_path]
            
        # Generate a versioned path
        full_path = os.path.join(self.static_dir, file_path)
        if not os.path.exists(full_path):
            return file_path
            
        # Calculate hash of file contents
        file_hash = self._calculate_file_hash(full_path)
        
        # Create versioned path
        filename, ext = os.path.splitext(file_path)
        versioned_path = f"{filename}.{file_hash[:8]}{ext}"
        
        # Update manifest
        self.manifest[file_path] = versioned_path
        self._save_manifest()
        
        return versioned_path
        
    def _calculate_file_hash(self, file_path):
        """Calculate a hash of the file contents"""
        hash_md5 = hashlib.md5()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
```

Create a build script for minifying and bundling assets:

```python
# tools/build_assets.py
import os
import subprocess
import json
from shutil import copyfile

def build_assets(static_src_dir, static_build_dir):
    """Build and optimize static assets"""
    print("Building assets...")
    
    # Create build directory if it doesn't exist
    os.makedirs(static_build_dir, exist_ok=True)
    
    # Process CSS files
    print("Processing CSS files...")
    css_dir = os.path.join(static_src_dir, 'css')
    css_build_dir = os.path.join(static_build_dir, 'css')
    os.makedirs(css_build_dir, exist_ok=True)
    
    for root, _, files in os.walk(css_dir):
        for file in files:
            if file.endswith('.css'):
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, css_dir)
                build_path = os.path.join(css_build_dir, rel_path)
                
                # Ensure the target directory exists
                os.makedirs(os.path.dirname(build_path), exist_ok=True)
                
                # Minify CSS
                print(f"Minifying {rel_path}...")
                subprocess.run([
                    'csso',
                    src_path,
                    '--output',
                    build_path
                ])
    
    # Process JavaScript files
    print("Processing JavaScript files...")
    js_dir = os.path.join(static_src_dir, 'js')
    js_build_dir = os.path.join(static_build_dir, 'js')
    os.makedirs(js_build_dir, exist_ok=True)
    
    for root, _, files in os.walk(js_dir):
        for file in files:
            if file.endswith('.js'):
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, js_dir)
                build_path = os.path.join(js_build_dir, rel_path)
                
                # Ensure the target directory exists
                os.makedirs(os.path.dirname(build_path), exist_ok=True)
                
                # Minify JavaScript
                print(f"Minifying {rel_path}...")
                subprocess.run([
                    'terser',
                    src_path,
                    '--compress',
                    '--mangle',
                    '--output',
                    build_path
                ])
    
    # Copy images
    print("Copying images...")
    img_dir = os.path.join(static_src_dir, 'img')
    img_build_dir = os.path.join(static_build_dir, 'img')
    
    if os.path.exists(img_dir):
        if not os.path.exists(img_build_dir):
            os.makedirs(img_build_dir, exist_ok=True)
        
        for root, _, files in os.walk(img_dir):
            for file in files:
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, img_dir)
                build_path = os.path.join(img_build_dir, rel_path)
                
                # Ensure the target directory exists
                os.makedirs(os.path.dirname(build_path), exist_ok=True)
                
                # Copy the file
                copyfile(src_path, build_path)
    
    print("Asset build complete!")

if __name__ == "__main__":
    build_assets(
        'frontend/static',
        'frontend/static/dist'
    )
```

### Caching Strategy

Implement a caching system for frequently accessed data:

```python
# backend/utils/cache_manager.py
import json
import time
import os
from functools import wraps

class CacheManager:
    def __init__(self, cache_dir='cache', ttl=3600):
        self.cache_dir = cache_dir
        self.ttl = ttl
        os.makedirs(cache_dir, exist_ok=True)
    
    def _get_cache_file_path(self, key):
        """Get the file path for a cache key"""
        return os.path.join(self.cache_dir, f"{key}.json")
    
    def get(self, key):
        """Get a value from the cache"""
        cache_file = self._get_cache_file_path(key)
        
        if not os.path.exists(cache_file):
            return None
        
        try:
            with open(cache_file, 'r') as f:
                data = json.load(f)
            
            # Check if the cache has expired
            if data['expires'] < time.time():
                os.remove(cache_file)
                return None
            
            return data['value']
        except (json.JSONDecodeError, KeyError, OSError):
            # If there's any error, treat it as a cache miss
            if os.path.exists(cache_file):
                os.remove(cache_file)
            return None
    
    def set(self, key, value, ttl=None):
        """Set a value in the cache"""
        if ttl is None:
            ttl = self.ttl
        
        cache_file = self._get_cache_file_path(key)
        
        data = {
            'value': value,
            'expires': time.time() + ttl
        }
        
        try:
            with open(cache_file, 'w') as f:
                json.dump(data, f)
            return True
        except OSError:
            return False
    
    def delete(self, key):
        """Delete a value from the cache"""
        cache_file = self._get_cache_file_path(key)
        
        if os.path.exists(cache_file):
            try:
                os.remove(cache_file)
                return True
            except OSError:
                return False
        return True
    
    def clear(self):
        """Clear all cache"""
        for filename in os.listdir(self.cache_dir):
            if filename.endswith('.json'):
                try:
                    os.remove(os.path.join(self.cache_dir, filename))
                except OSError:
                    pass

# Decorator for caching function results
def cached(cache_manager, key_prefix, ttl=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create a cache key based on the function name, args, and kwargs
            key_parts = [key_prefix, func.__name__]
            
            # Add args and kwargs to the key
            if args:
                key_parts.append('-'.join(str(arg) for arg in args))
            
            if kwargs:
                key_parts.append('-'.join(f"{k}={v}" for k, v in sorted(kwargs.items())))
            
            cache_key = '-'.join(key_parts)
            
            # Try to get from cache
            cached_value = cache_manager.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call the function
            result = func(*args, **kwargs)
            
            # Cache the result
            cache_manager.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator
```

Use the cache manager in repositories:

```python
# backend/data/repositories/question_repo.py
from backend.utils.cache_manager import CacheManager, cached

# Create a cache manager
cache = CacheManager(cache_dir='cache/questions', ttl=3600)

class QuestionRepository:
    @staticmethod
    @cached(cache, 'questions', ttl=3600)
    def get_all_questions():
        """Get all questions from the database"""
        # Implementation
        pass
    
    @staticmethod
    @cached(cache, 'question', ttl=3600)
    def get_question_by_id(question_id):
        """Get a question by ID"""
        # Implementation
        pass
    
    @staticmethod
    def add_question(question):
        """Add a new question"""
        # Implementation
        
        # Clear relevant caches
        cache.delete('questions-get_all_questions')
        
        return question_id
    
    @staticmethod
    def update_question(question_id, question_data):
        """Update a question"""
        # Implementation
        
        # Clear relevant caches
        cache.delete('questions-get_all_questions')
        cache.delete(f'question-get_question_by_id-{question_id}')
        
        return True
    
    @staticmethod
    def delete_question(question_id):
        """Delete a question"""
        # Implementation
        
        # Clear relevant caches
        cache.delete('questions-get_all_questions')
        cache.delete(f'question-get_question_by_id-{question_id}')
        
        return True
```

### Lazy Loading

Implement lazy loading for JavaScript modules:

```javascript
// frontend/src/core/bootstrap.js
class ModuleLoader {
    constructor() {
        this.loadedModules = {};
    }
    
    async load(moduleName) {
        if (this.loadedModules[moduleName]) {
            return this.loadedModules[moduleName];
        }
        
        try {
            const module = await this.importModule(moduleName);
            this.loadedModules[moduleName] = module;
            return module;
        } catch (error) {
            console.error(`Error loading module ${moduleName}:`, error);
            throw error;
        }
    }
    
    async importModule(moduleName) {
        switch (moduleName) {
            case 'game':
                return import('../core/game.js');
            case 'map-renderer':
                return import('../ui/components/map_renderer.js');
            case 'skill-tree':
                return import('../systems/skill_tree/skill_tree_manager.js');
            case 'character-panel':
                return import('../ui/components/character_panel.js');
            case 'achievement-display':
                return import('../ui/components/achievement_display.js');
            case 'feedback-form':
                return import('../ui/components/feedback_form.js');
            default:
                throw new Error(`Unknown module: ${moduleName}`);
        }
    }
}

// Create global module loader
window.moduleLoader = new ModuleLoader();

// Initialize app based on current page
document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.page;
    
    switch (page) {
        case 'game':
            const gameModule = await window.moduleLoader.load('game');
            const game = new gameModule.default();
            game.initialize();
            break;
        case 'character-select':
            const characterSelectModule = await import('../ui/screens/character_select.js');
            const characterSelect = new characterSelectModule.default();
            characterSelect.initialize();
            break;
        case 'skill-tree':
            const skillTreeModule = await window.moduleLoader.load('skill-tree');
            const skillTree = new skillTreeModule.default();
            skillTree.initialize();
            break;
        default:
            // Initialize common components
            break;
    }
});
```

## Production Readiness

### Security Considerations

Implement Cross-Site Request Forgery (CSRF) protection:

```python
# app.py
from flask_wtf.csrf import CSRFProtect

def create_app(config_name='development'):
    app = Flask(__name__, 
               static_folder='frontend/static',
               template_folder='frontend/templates')
    
    # Initialize CSRF protection
    csrf = CSRFProtect(app)
    
    # ... rest of the app initialization
```

Add a Content Security Policy:

```python
# config/production.py
SECURE_HEADERS = {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
}
```

Implement secure user authentication:

```python
# backend/utils/security.py
import bcrypt
import secrets
import string

def hash_password(password):
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(stored_password, provided_password):
    """Verify a password against its hash"""
    stored_bytes = stored_password.encode('utf-8')
    provided_bytes = provided_password.encode('utf-8')
    return bcrypt.checkpw(provided_bytes, stored_bytes)

def generate_token(length=32):
    """Generate a secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))
```

### Final Testing Checklist

Create a comprehensive test checklist:

```markdown
# Testing Checklist

## Functional Tests
- [ ] User authentication works (login, logout, registration)
- [ ] Character selection and creation functions correctly
- [ ] Map generation produces valid maps
- [ ] Navigation between nodes works properly
- [ ] Question system displays questions and validates answers
- [ ] Combat system functions correctly
- [ ] Skill tree allows unlocking nodes and applies effects
- [ ] Achievement system tracks and awards achievements
- [ ] Admin dashboard allows content management

## Performance Tests
- [ ] Application loads quickly (< 3s first load)
- [ ] Map rendering is smooth
- [ ] No memory leaks during extended play
- [ ] Caching system improves load times for repeated actions

## Security Tests
- [ ] CSRF protection prevents cross-site request forgery
- [ ] XSS vulnerabilities are mitigated
- [ ] Authentication system securely manages sessions
- [ ] Admin routes are protected from unauthorized access

## Cross-Browser Testing
- [ ] Application works in Chrome
- [ ] Application works in Firefox
- [ ] Application works in Safari
- [ ] Application works in Edge

## Responsive Design Testing
- [ ] Interface adapts to desktop screens
- [ ] Interface adapts to tablet screens
- [ ] Interface adapts to mobile screens (if supported)

## Accessibility Testing
- [ ] Proper heading structure
- [ ] Alt text for images
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG standards
```

### Deployment Pipeline

Set up a production deployment workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy Medical Physics Game

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest
    
    - name: Build and optimize assets
      run: |
        npm install -g csso-cli terser
        python tools/build_assets.py
    
    - name: Create production configuration
      run: |
        cp config/production.py.example config/production.py
        # Update configuration with secrets
        sed -i "s/SECRET_KEY = ''/SECRET_KEY = '${{ secrets.SECRET_KEY }}'/" config/production.py
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/medical_physics_game
          git pull
          python -m pip install -r requirements.txt
          sudo systemctl restart medical_physics_game
```

## Documentation

### User Documentation

Create a user guide explaining how to play the game:

```markdown
# Medical Physics Game - User Guide

## Introduction

Welcome to the Medical Physics Game, an educational roguelike game designed to help medical physics residents learn and apply key concepts in a fun, engaging format.

## Getting Started

### Creating an Account

1. Visit the game website at [gameurl.com](https://gameurl.com)
2. Click "Register" in the top right corner
3. Fill out the registration form with your details
4. Verify your email address through the link sent to your inbox
5. Log in with your new credentials

### Selecting a Character

Each character represents a different approach to medical physics:

- **Researcher**: Focuses on critical thinking and theoretical knowledge
- **Clinician**: Specializes in practical application and patient care
- **Technician**: Excels at equipment operation and quality assurance

Choose the character that best matches your learning style or the area you want to improve.

## Game Mechanics

### Map Navigation

The game consists of multiple floors, each represented as a map with connected nodes. Each node represents an encounter:

1. Click on a node connected to your current position to move there
2. Different node types are indicated by different colors and icons
3. Plan your path strategically to maximize learning and success

### Node Types

- **Question Nodes**: Test your knowledge with multiple-choice questions
- **Patient Case Nodes**: Apply your knowledge to clinical scenarios
- **Rest Nodes**: Recover resources and prepare for challenges ahead
- **Event Nodes**: Random events that may help or hinder your progress
- **Elite Nodes**: Challenging encounters with greater rewards
- **Boss Nodes**: Major challenges that test comprehensive understanding

### Skill Tree

As you progress, you'll earn skill points that can be spent in the skill tree:

1. Access the skill tree by clicking the "Skills" button
2. Browse available skills organized by category
3. Click on a skill to see details and requirements
4. Unlock skills to improve your character's abilities

### Combat System

Some encounters involve metaphorical "combat" representing challenging clinical scenarios:

1. Select abilities from your arsenal to address the challenge
2. Pay attention to the effectiveness of different approaches
3. Monitor your resources and adjust your strategy accordingly

## Tips for Success

- Balance exploration with preparation
- Invest skill points according to your playstyle
- Take notes on challenging questions for later review
- Don't be afraid to try different paths on subsequent playthroughs

## Need Help?

- Click the "?" icon in the game for contextual help
- Visit the Forums section to discuss strategies with other players
- Contact support at [support@gameurl.com](mailto:support@gameurl.com)
```

### Developer Documentation

Create a developer guide for future contributors:

```markdown
# Medical Physics Game - Developer Guide

## Project Overview

The Medical Physics Game is an educational roguelike game built with Python (Flask) on the backend and vanilla JavaScript on the frontend. It follows a modular architecture designed for maintainability and extensibility.

## Architecture

### Backend

- **Flask Application**: Serves the web application and API endpoints
- **Core Game Logic**: Implements game mechanics and state management
- **Data Layer**: Handles data persistence and retrieval
- **Plugin System**: Enables extensibility for different content types

### Frontend

- **Core**: Bootstrap and initialization
- **Entities**: Game objects like characters, nodes, and items
- **Systems**: Game mechanics like combat, progression, and effects
- **UI**: User interface components and screens

## Development Environment Setup

1. **Clone the repository**:
   ```
   git clone https://github.com/organization/medical-physics-game.git
   cd medical-physics-game
   ```

2. **Set up a virtual environment**:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

4. **Initialize the database**:
   ```
   flask db-init
   ```

5. **Run the application**:
   ```
   flask run
   ```

## Adding New Content

### Creating New Questions

Questions are stored in JSON format in the `data/questions` directory. To add new questions:

1. Create a new JSON file or edit an existing one
2. Follow the question schema:
   ```json
   {
     "id": "q123",
     "text": "Question text goes here?",
     "options": [
       "Option A",
       "Option B",
       "Option C",
       "Option D"
     ],
     "correct_answer": 1,  // Index of the correct option (0-based)
     "difficulty": "intermediate",
     "category": "radiation_physics",
     "explanation": "Explanation of the answer..."
   }
   ```

3. Use the question validator tool:
   ```
   python tools/content_creation/question_validator.py path/to/your/questions.json
   ```

### Creating New Node Types

To create a new type of map node:

1. Create a new node type class in `frontend/src/entities/nodes/node_types/`
2. Register the node type in `frontend/src/entities/nodes/node_registry.js`
3. Implement the backend logic in `backend/plugins/`
4. Add the node type to the node type configuration in `data/maps/node_types.json`

## Testing

Run tests using pytest:

```
pytest
```

For frontend tests, use the testing utilities in `frontend/src/utils/debug/`:

```
python -m http.server
# Open http://localhost:8000/frontend/src/utils/debug/test_runner.html
```

## Code Style Guidelines

- Python: Follow PEP 8
- JavaScript: Use camelCase for variables and functions, PascalCase for classes
- HTML/CSS: Use kebab-case for classes and IDs

## Deployment

See the deployment documentation in `docs/deployment.md` for detailed instructions on deploying to production.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
```

### API Documentation

Create comprehensive API documentation:

```markdown
# Medical Physics Game - API Documentation

## Authentication

### Login

**Endpoint**: `POST /api/login`

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
```

**Status Codes**:
- 200: Success
- 401: Invalid credentials

### Register

**Endpoint**: `POST /api/register`

**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "message": "Registration successful",
  "user_id": "string"
}
```

**Status Codes**:
- 201: Created
- 400: Bad request (e.g., username taken)

## Characters

### Get All Characters

**Endpoint**: `GET /api/characters`

**Response**:
```json
[
  {
    "id": "string",
    "name": "string",
    "archetype": "string",
    "stats": {
      "strength": "number",
      "intelligence": "number",
      "endurance": "number"
    },
    "abilities": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "cost": "number",
        "effect": "string"
      }
    ]
  }
]
```

### Create Character

**Endpoint**: `POST /api/characters`

**Request Body**:
```json
{
  "name": "string",
  "archetype": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "name": "string",
  "archetype": "string",
  "stats": {
    "strength": "number",
    "intelligence": "number",
    "endurance": "number"
  },
  "abilities": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "cost": "number",
      "effect": "string"
    }
  ]
}
```

## Game

### Start Game

**Endpoint**: `POST /api/games`

**Request Body**:
```json
{
  "character_id": "string"
}
```

**Response**:
```json
{
  "game_id": "string",
  "character": {
    "id": "string",
    "name": "string",
    "current_hp": "number",
    "max_hp": "number"
  },
  "map": {
    "width": "number",
    "height": "number",
    "grid": [
      [
        {
          "id": "string",
          "type": "string",
          "x": "number",
          "y": "number"
        }
      ]
    ],
    "paths": [
      {
        "from": "string",
        "to": "string"
      }
    ]
  },
  "current_node": "string",
  "available_nodes": [
    "string"
  ]
}
```

### Move to Node

**Endpoint**: `POST /api/games/move`

**Request Body**:
```json
{
  "node_id": "string"
}
```

**Response**:
```json
{
  "character": {
    "id": "string",
    "name": "string",
    "current_hp": "number",
    "max_hp": "number"
  },
  "current_node": "string",
  "available_nodes": [
    "string"
  ],
  "node_type": "string",
  "node_data": {
    // Varies based on node type
  }
}
```

## Questions

### Get Question

**Endpoint**: `GET /api/questions/{question_id}`

**Response**:
```json
{
  "id": "string",
  "text": "string",
  "options": [
    "string"
  ],
  "difficulty": "string",
  "category": "string"
}
```

### Answer Question

**Endpoint**: `POST /api/questions/{question_id}/answer`

**Request Body**:
```json
{
  "answer": "number"
}
```

**Response**:
```json
{
  "correct": "boolean",
  "correct_answer": "number",
  "explanation": "string",
  "rewards": {
    "skill_points": "number",
    "reputation": "number"
  }
}
```

## Skill Tree

### Get Skill Tree

**Endpoint**: `GET /api/skill-tree`

**Response**:
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "cost": "number",
    "prerequisites": [
      "string"
    ],
    "effects": [
      {
        "type": "string",
        "value": "number"
      }
    ],
    "category": "string",
    "position": {
      "x": "number",
      "y": "number"
    },
    "icon": "string"
  }
]
```

### Unlock Skill

**Endpoint**: `POST /api/skill-tree/unlock`

**Request Body**:
```json
{
  "skill_id": "string"
}
```

**Response**:
```json
{
  "success": "boolean",
  "message": "string",
  "skill_points_remaining": "number",
  "unlocked_skills": [
    "string"
  ]
}
```

## Feedback

### Submit Feedback

**Endpoint**: `POST /api/feedback`

**Request Body**:
```json
{
  "content": "string",
  "category": "string",
  "rating": "number",
  "page": "string"
}
```

**Response**:
```json
{
  "message": "Feedback submitted successfully"
}
```

**Status Codes**:
- 200: Success
- 400: Bad request (missing content)
```

## Future Roadmap

### Feature Expansion Ideas

Document ideas for future expansion:

```markdown
# Future Expansion Roadmap

## Multiplayer Mode (Q3 2023)

### Competitive Mode
- Leaderboards for highest scores
- Weekly challenges with special rewards
- Tournament system for institutions

### Collaborative Mode
- Team-based learning with complementary roles
- Shared skill trees with specialization paths
- Real-time collaboration on difficult cases

## Mobile Application (Q4 2023)

- Native apps for iOS and Android
- Optimized touch interface
- Offline play capability
- Push notifications for new content

## Content Expansion (Ongoing)

### New Specialties
- Nuclear Medicine Physics
- Health Physics
- MRI Physics
- Ultrasound Physics

### Advanced Simulation
- 3D visualization of treatment plans
- Interactive equipment simulations
- Virtual labs for experiment simulation

## Advanced Analytics (Q2 2024)

- Personalized learning algorithms
- Performance prediction
- Knowledge gap identification
- Adaptive difficulty adjustment

## Learning Management System Integration (Q3 2024)

- SCORM compliance for LMS integration
- Integration with popular platforms (Canvas, Moodle, Blackboard)
- Gradebook synchronization
- Instructor dashboards

## AI Assistant (Q4 2024)

- AI tutor for personalized guidance
- Natural language question answering
- Performance analysis and study recommendations
- Content generation assistant for educators
```

### Technology Upgrades

Plan for future technology improvements:

```markdown
# Technology Upgrade Roadmap

## Frontend Framework Migration (Q2 2023)

- Migrate from vanilla JS to a modern framework (React or Vue.js)
- Implement component-based architecture
- Improve state management
- Enhanced UI performance

## Backend Modernization (Q3 2023)

- Move to FastAPI for improved performance
- Implement async/await patterns
- GraphQL API for optimized data fetching
- Enhanced WebSocket support for real-time features

## Database Improvements (Q4 2023)

- Migrate from SQLite to PostgreSQL
- Implement database sharding for scalability
- Optimize query performance
- Enhanced data modeling

## DevOps Enhancements (Q1 2024)

- Containerization with Docker
- Kubernetes orchestration
- CI/CD pipeline improvements
- Automated testing and deployment

## Security Upgrades (Q2 2024)

- Implementation of OAuth 2.0
- Enhanced encryption for sensitive data
- Regular security audits
- Compliance with healthcare data regulations

## Performance Optimization (Ongoing)

- Code splitting and lazy loading
- Service worker implementation
- Advanced caching strategies
- Image optimization pipeline
```

### Community Building

Outline a plan for community engagement:

```markdown
# Community Building Strategy

## Community Forum (Q3 2023)

- Integrated discussion board
- Question and answer section
- Feature request voting system
- Bug reporting mechanism

## Content Creator Program (Q4 2023)

- Tools for educators to create custom content
- Sharing platform for community-created questions
- Peer review system for quality control
- Recognition program for top contributors

## Open Source Components (Q1 2024)

- Release selected components as open source
- Create contributor guidelines
- Establish governance model
- Regular community calls

## Educational Institution Partnerships (Q2 2024)

- Collaboration with medical physics programs
- Integration with curriculum
- Research partnerships
- Joint development of educational standards

## Annual Conference (Q3 2024)

- Virtual gathering of users and developers
- Workshops on effective usage
- Showcase of upcoming features
- Recognition of community achievements

## Research and Publications (Ongoing)

- Effectiveness studies
- Educational methodology research
- Technical papers on implementation
- Collaborative research with academic partners
```

## Appendix: Code References

```python
# Example: Adding a new route to the API
# backend/api/routes.py

from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__)

@api_bp.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        'status': 'online',
        'version': '1.0.0',
        'api_version': 'v1'
    })
```

```javascript
// Example: Creating a reusable UI component
// frontend/src/ui/components/tooltip.js

class Tooltip {
    constructor(options = {}) {
        this.position = options.position || 'top';
        this.theme = options.theme || 'light';
        this.showDelay = options.showDelay || 200;
        this.hideDelay = options.hideDelay || 200;
        
        this.tooltip = null;
        this.timeout = null;
        
        this.initialize();
    }
    
    initialize() {
        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = `tooltip tooltip-${this.position} tooltip-${this.theme}`;
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
        
        // Add event listeners
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            if (target.hasAttribute('data-tooltip')) {
                this.show(target);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const target = e.target;
            if (target.hasAttribute('data-tooltip')) {
                this.hide();
            }
        });
    }
    
    show(element) {
        clearTimeout(this.timeout);
        
        this.timeout = setTimeout(() => {
            // Get tooltip content
            const text = element.getAttribute('data-tooltip');
            this.tooltip.textContent = text;
            
            // Calculate position
            const rect = element.getBoundingClientRect();
            const tooltipRect = this.tooltip.getBoundingClientRect();
            
            let top, left;
            
            switch (this.position) {
                case 'top':
                    top = rect.top - tooltipRect.height - 10;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = rect.bottom + 10;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.left - tooltipRect.width - 10;
                    break;
                case 'right':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.right + 10;
                    break;
            }
            
            // Set position
            this.tooltip.style.top = `${top}px`;
            this.tooltip.style.left = `${left}px`;
            
            // Show tooltip
            this.tooltip.style.display = 'block';
            setTimeout(() => {
                this.tooltip.classList.add('tooltip-visible');
            }, 10);
        }, this.showDelay);
    }
    
    hide() {
        clearTimeout(this.timeout);
        
        this.tooltip.classList.remove('tooltip-visible');
        
        this.timeout = setTimeout(() => {
            this.tooltip.style.display = 'none';
        }, this.hideDelay);
    }
}

export default Tooltip;
```
