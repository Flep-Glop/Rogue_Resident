# game_state.py - Game state management
import json
import os
import uuid
import random
from flask import session
from datetime import datetime
from data_manager import load_json_data

# Game state will be stored in an in-memory dictionary for this demo
# In production, you would use a database
game_states = {}

# Helper to get session game ID
def get_game_id():
    if 'game_id' not in session:
        session['game_id'] = str(uuid.uuid4())
    return session['game_id']

def create_default_game_state():
    """Create a default game state for new games"""
    characters = load_json_data('characters.json')
    character_data = next((c for c in characters.get('characters', []) if c['id'] == 'resident'), None)
    
    if not character_data:
        # Fallback default character
        character_data = {
            "name": "Medical Physics Resident",
            "starting_stats": {
                "level": 1,
                "lives": 3,
                "max_lives": 3,
                "insight": 20
            },
            "special_ability": {
                "name": "Literature Review",
                "description": "Once per floor, can skip a question node without penalty.",
                "uses_per_floor": 1
            }
        }
    
    return {
        "character": {
            "name": character_data['name'],
            "level": character_data['starting_stats']['level'],
            "lives": character_data['starting_stats']['lives'],
            "max_lives": character_data['starting_stats']['max_lives'],
            "insight": character_data['starting_stats']['insight'],
            "special_ability": character_data['special_ability']
        },
        "current_floor": 1,
        "created_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }

def get_question_for_node(node):
    """Get a question appropriate for the node's difficulty"""
    questions_data = load_json_data('questions.json')
    all_questions = []
    
    # Collect questions of appropriate difficulty from all categories
    for category in questions_data.get('categories', []):
        for question in category.get('questions', []):
            if question.get('difficulty', 1) == node.get('difficulty', 1):
                # Add category info to the question
                question_with_category = {
                    **question,
                    'category': category.get('name', 'Unknown')
                }
                all_questions.append(question_with_category)
    
    if not all_questions:
        # Fallback question if none found with matching difficulty
        return {
            "text": "What is the correction factor for temperature and pressure called in TG-51?",
            "options": ["PTP", "kTP", "CTP", "PTC"],
            "correct": 1,
            "explanation": "kTP is the temperature-pressure correction factor in TG-51.",
            "category": "Radiation Physics"
        }
    
    # Return a random question
    return random.choice(all_questions)

def get_random_item():
    """Get a random item based on rarity"""
    items_data = load_json_data('items.json')
    all_items = items_data.get('items', [])
    
    if not all_items:
        return None
    
    # Group items by rarity
    items_by_rarity = {}
    for item in all_items:
        rarity = item.get('rarity', 'common')
        if rarity not in items_by_rarity:
            items_by_rarity[rarity] = []
        items_by_rarity[rarity].append(item)
    
    # Rarity weights
    rarity_weights = {
        'common': 60,
        'uncommon': 30,
        'rare': 9,
        'epic': 1
    }
    
    # Pick rarity based on weights
    total_weight = sum(rarity_weights.values())
    r = random.uniform(0, total_weight)
    
    cumulative_weight = 0
    selected_rarity = 'common'  # Default
    
    for rarity, weight in rarity_weights.items():
        cumulative_weight += weight
        if r <= cumulative_weight:
            selected_rarity = rarity
            break
    
    # Get all items of selected rarity
    items = items_by_rarity.get(selected_rarity, [])
    
    # If no items of selected rarity, use any item
    if not items:
        items = all_items
    
    # Return a random item
    return random.choice(items)

def get_random_event():
    """Get a random event"""
    events_data = load_json_data('events.json')
    all_events = events_data.get('events', [])
    
    if not all_events:
        # Return a default event if none found
        return {
            "title": "Unexpected Discovery",
            "description": "While reviewing patient data, you notice something unusual.",
            "options": [
                {
                    "text": "Investigate further",
                    "outcome": {
                        "description": "Your investigation reveals important information.",
                        "effect": {
                            "type": "insight_gain",
                            "value": 10
                        }
                    }
                },
                {
                    "text": "Ignore it",
                    "outcome": {
                        "description": "You decide it's not important.",
                        "effect": {
                            "type": "insight_loss",
                            "value": 5
                        }
                    }
                }
            ]
        }
    
    # Return a random event
    return random.choice(all_events)