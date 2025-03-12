import uuid
import random
from datetime import datetime
from flask import session

def create_default_game_state():
    """Create a default game state for new players"""
    return {
        "character": {
            "name": "Medical Physics Resident",
            "level": 1,
            "lives": 3,
            "max_lives": 3,
            "insight": 20,
            "special_ability": None
        },
        "current_floor": 1,
        "inventory": [],
        "created_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }

def get_game_id():
    """Get or create a game ID for the current session"""
    if 'game_id' not in session:
        session['game_id'] = str(uuid.uuid4())
    return session['game_id']

def get_question_for_node(node):
    """Get a question matching the node's difficulty and category if specified"""
    from data_manager import load_json_data
    
    # Load questions data
    questions_data = load_json_data('questions.json')
    
    # Default to first category if no category specified
    category_id = node.get('category', None)
    difficulty = node.get('difficulty', 1)
    
    # Get all categories
    categories = questions_data.get('categories', [])
    if not categories:
        return None
    
    # Filter by category if specified
    if category_id:
        category = next((c for c in categories if c.get('id') == category_id), None)
        if category:
            categories = [category]
    
    # Collect all questions matching the difficulty
    matching_questions = []
    for category in categories:
        for question in category.get('questions', []):
            if question.get('difficulty', 1) == difficulty:
                # Add category name to question for reference
                question_copy = question.copy()
                question_copy['category_name'] = category.get('name', 'Unknown')
                matching_questions.append(question_copy)
    
    # If no matching questions, try with any difficulty
    if not matching_questions:
        for category in categories:
            for question in category.get('questions', []):
                question_copy = question.copy()
                question_copy['category_name'] = category.get('name', 'Unknown')
                matching_questions.append(question_copy)
    
    # If still no questions, return None
    if not matching_questions:
        return None
    
    # Return a random question
    return random.choice(matching_questions)

def get_random_item(rarity=None):
    """Get a random item, optionally filtered by rarity"""
    from data_manager import load_json_data
    
    # Load items data
    items_data = load_json_data('items.json')
    
    # Get all items
    items = items_data.get('items', [])
    
    # Filter by rarity if specified
    if rarity:
        items = [item for item in items if item.get('rarity') == rarity]
    
    # If no items, return None
    if not items:
        return None
    
    # Calculate weights based on rarity if not filtered
    if not rarity:
        weighted_items = []
        for item in items:
            # Give higher weight to common items
            weight = 1
            if item.get('rarity') == 'common':
                weight = 4
            elif item.get('rarity') == 'uncommon':
                weight = 3
            elif item.get('rarity') == 'rare':
                weight = 2
            elif item.get('rarity') == 'epic':
                weight = 1
            
            # Add item to weighted list
            for _ in range(weight):
                weighted_items.append(item)
        
        # Choose from weighted list
        return random.choice(weighted_items) if weighted_items else None
    
    # Return random item
    return random.choice(items)

def get_random_event():
    """Get a random event from the events data"""
    from data_manager import load_json_data
    
    # Load events data
    events_data = load_json_data('events.json')
    
    # Get all events
    events = events_data.get('events', [])
    
    # If no events, return None
    if not events:
        return None
    
    # Return a random event
    return random.choice(events)

def calculate_reward(node_type, difficulty=1):
    """Calculate rewards for completing a node"""
    base_insight = 10
    
    if node_type == "question":
        return base_insight
    elif node_type == "elite":
        return base_insight * 1.5
    elif node_type == "boss":
        return base_insight * 2
    
    # Default reward
    return base_insight