from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
import uuid
import random
from datetime import datetime

# Import game modules
from data_manager import load_json_data
from map_generator import generate_floor_layout, validate_map
from game_state import (create_default_game_state, get_game_id, 
                        get_question_for_node, get_random_item, 
                        get_random_event, get_random_patient_case)
from node_plugins import initialize_plugins, process_node_with_plugin

# Initialize Flask app
app = Flask(__name__, static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'medical_physics_game_secret_key')

# Initialize the node plugins
initialize_plugins()

# Game data storage (in memory for development)
# In production, use a proper database
game_states = {}
saved_games = {}

# ===== HELPER FUNCTIONS =====

def get_current_game_state():
    """Get the current game state for the session"""
    game_id = get_game_id()
    
    # Create a new game state if none exists
    if game_id not in game_states:
        game_states[game_id] = create_default_game_state()
    
    return game_states[game_id]

def update_game_state(game_state):
    """Update the current game state in storage"""
    game_id = get_game_id()
    game_state['last_updated'] = datetime.now().isoformat()
    game_states[game_id] = game_state
    return game_state

def generate_floor_map(floor_number):
    """Generate a map for the specified floor"""
    # Load floor configurations
    floors_data = load_json_data('floors.json')
    
    # Get floor configuration for this floor
    floor_data = None
    for floor in floors_data.get('floors', []):
        if floor.get('id') == floor_number:
            floor_data = floor
            break
    
    # Use default floor config if none found
    if not floor_data:
        floor_data = {
            "id": floor_number,
            "name": f"Floor {floor_number}",
            "description": "A mysterious floor in the hospital.",
            "node_count": {"min": 15, "max": 25}
        }
    
    # Generate the map layout
    layout = generate_floor_layout(floor_number, floor_data)
    
    # Validate the layout
    is_valid = validate_map(layout)
    if not is_valid:
        print(f"WARNING: Generated map for floor {floor_number} failed validation!")
    
    return layout

def process_node_for_client(node):
    """Process a node to add necessary data for the client"""
    return process_node_with_plugin(node)

# ===== FRONTEND ROUTES =====

@app.route('/')
def index():
    """Render the game's landing page"""
    return render_template('landing.html')

@app.route('/game')
def game():
    """Render the main game page"""
    return render_template('index.html')

@app.route('/character-select')
def character_select():
    """Render character selection page"""
    return render_template('character_select.html')

@app.route('/select')
def select():
    """Redirect to character selection"""
    return redirect(url_for('game', select='true'))

@app.route('/editor')
def editor():
    """Render the item editor page"""
    return render_template('item_editor.html')

@app.route('/item-editor')
def item_editor():
    """Redirect to editor"""
    return redirect(url_for('editor'))

# ===== GAME STATE ROUTES =====

@app.route('/api/game-state', methods=['GET'])
def get_game_state():
    """Get the current game state"""
    return jsonify(get_current_game_state())

@app.route('/api/new-game', methods=['POST'])
def start_new_game():
    """Start a new game with the selected character"""
    data = request.get_json() or {}
    character_id = data.get('character_id', 'resident')
    
    # Create default game state
    game_state = create_default_game_state()
    
    # Customize based on character
    if character_id == 'physicist':
        game_state['character']['name'] = 'Experienced Physicist'
        game_state['character']['insight'] = 30
    elif character_id == 'dosimetrist':
        game_state['character']['name'] = 'Medical Dosimetrist'
        game_state['character']['max_lives'] = 4
        game_state['character']['lives'] = 4
    
    # Store the game state
    update_game_state(game_state)
    
    return jsonify(game_state)

@app.route('/api/next-floor', methods=['POST'])
def go_to_next_floor():
    """Advance to the next floor"""
    game_state = get_current_game_state()
    
    # Check if eligible to go to next floor
    # In a real implementation, check if current floor is completed
    
    # Increment floor
    current_floor = game_state.get('current_floor', 1)
    game_state['current_floor'] = current_floor + 1
    
    # Any bonuses for completing a floor
    if game_state.get('character'):
        # Extra insight for completing a floor
        game_state['character']['insight'] += 15
        # Heal 1 life point
        game_state['character']['lives'] = min(
            game_state['character']['lives'] + 1,
            game_state['character']['max_lives']
        )
    
    # Update the game state
    update_game_state(game_state)
    
    return jsonify(game_state)

@app.route('/api/reset-game', methods=['POST'])
def reset_game():
    """Reset the current game"""
    game_id = get_game_id()
    if game_id in game_states:
        del game_states[game_id]
    
    # Create a new game state
    game_state = create_default_game_state()
    update_game_state(game_state)
    
    return jsonify(game_state)

# ===== CHARACTER ROUTES =====

@app.route('/api/characters', methods=['GET'])
def get_characters():
    """Get all available characters"""
    # Example characters - in production, these would come from a database
    characters = [
        {
            "id": "resident",
            "name": "Medical Physics Resident",
            "description": "A balanced character with average stats for all beginners.",
            "starting_stats": {
                "lives": 3,
                "max_lives": 3,
                "insight": 20,
                "level": 1
            },
            "special_ability": {
                "name": "Medical Intuition",
                "description": "See one incorrect answer on a question node.",
                "uses_per_floor": 1
            }
        },
        {
            "id": "physicist",
            "name": "Experienced Physicist",
            "description": "Starts with higher insight but fewer lives.",
            "starting_stats": {
                "lives": 2,
                "max_lives": 2,
                "insight": 30,
                "level": 1
            },
            "special_ability": {
                "name": "Deep Knowledge",
                "description": "Gain double insight from question nodes.",
                "uses_per_floor": 2
            }
        },
        {
            "id": "dosimetrist",
            "name": "Medical Dosimetrist",
            "description": "Starts with more lives but less insight.",
            "starting_stats": {
                "lives": 4,
                "max_lives": 4,
                "insight": 15,
                "level": 1
            },
            "special_ability": {
                "name": "Careful Planning",
                "description": "Avoid losing a life once per floor.",
                "uses_per_floor": 1
            }
        }
    ]
    
    return jsonify({"characters": characters})

# ===== MAP AND NODE ROUTES =====

@app.route('/api/generate-floor-map', methods=['POST'])
def generate_map_endpoint():
    """Generate a map for the specified floor"""
    data = request.get_json() or {}
    floor_number = data.get('floor_number', 1)
    
    # Get current game state
    game_state = get_current_game_state()
    
    # Generate the floor map
    layout = generate_floor_map(floor_number)
    
    return jsonify(layout)

@app.route('/api/mark-node-visited', methods=['POST'])
def mark_node_visited():
    """Mark a node as visited and update the game state"""
    data = request.get_json() or {}
    node_id = data.get('node_id')
    
    if not node_id:
        return jsonify({"error": "Node ID is required"}), 400
    
    # Get current game state
    game_state = get_current_game_state()
    
    # In a real implementation, update the node's visited status in the game state
    
    return jsonify({"success": True, "node_id": node_id})

# ===== QUESTION ROUTES =====

@app.route('/api/get-question', methods=['GET'])
def get_question_endpoint():
    """Get a question for a node based on node type and ID"""
    node_id = request.args.get('node_id')
    node_type = request.args.get('type', 'question')
    
    if not node_id:
        return jsonify({"error": "Node ID is required"}), 400
    
    # Create a mock node object
    node = {
        "id": node_id,
        "type": node_type,
        "difficulty": int(request.args.get('difficulty', 1))
    }
    
    # Get a question for the node
    question = get_question_for_node(node)
    
    if not question:
        return jsonify({"error": "No question found"}), 404
    
    return jsonify({"question": question})

@app.route('/api/answer-question', methods=['POST'])
def answer_question():
    """Process an answer to a question"""
    data = request.get_json() or {}
    node_id = data.get('node_id')
    answer_index = data.get('answer_index')
    question_data = data.get('question')
    
    if any(x is None for x in [node_id, answer_index, question_data]):
        return jsonify({"error": "Missing required data"}), 400
    
    # Get current game state
    game_state = get_current_game_state()
    
    # Determine if the answer is correct
    correct_index = question_data.get('correct')
    is_correct = answer_index == correct_index
    
    # Update game state based on answer
    if is_correct:
        # Award insight
        if game_state.get('character'):
            base_insight = 10
            # Apply any bonuses
            insight_bonus = 0
            if game_state.get('insight_bonus_percent'):
                insight_bonus = int(base_insight * (game_state['insight_bonus_percent'] / 100))
            
            total_insight = base_insight + insight_bonus
            game_state['character']['insight'] += total_insight
            
            # Include the insight gained in the response
            result = {
                "correct": True,
                "explanation": question_data.get('explanation', 'Correct answer!'),
                "insight_gained": total_insight
            }
    else:
        # Lose a life for incorrect answer
        if game_state.get('character'):
            game_state['character']['lives'] = max(0, game_state['character']['lives'] - 1)
        
        result = {
            "correct": False,
            "explanation": question_data.get('explanation', 'Incorrect answer.'),
            "insight_gained": 0
        }
    
    # Update the game state
    update_game_state(game_state)
    
    # Include the updated game state in the response
    result["game_state"] = game_state
    
    return jsonify(result)

# ===== ITEM AND RELIC ROUTES =====

@app.route('/api/item/<item_id>', methods=['GET'])
def get_item(item_id):
    """Get a specific item by ID"""
    from data_manager import load_json_data
    
    # Load items data
    items_data = load_json_data('items.json')
    
    # Get all items
    items = items_data.get('items', [])
    
    # Find the item by ID
    item = next((item for item in items if item.get('id') == item_id), None)
    
    if not item:
        return jsonify({"error": "Item not found"}), 404
        
    return jsonify(item)

@app.route('/api/item/random', methods=['GET'])
def get_random_item_endpoint():
    """Get random items"""
    count = int(request.args.get('count', 1))
    rarity = request.args.get('rarity')
    
    # Get random items
    items = []
    for _ in range(count):
        item = get_random_item(rarity)
        if item:
            items.append(item)
    
    return jsonify(items)

@app.route('/api/item/all', methods=['GET'])
def get_all_items():
    """Get all available items"""
    from data_manager import load_json_data
    
    # Load items data
    items_data = load_json_data('items.json')
    
    # Get all items
    items = items_data.get('items', [])
    
    return jsonify(items)

@app.route('/api/relic/<relic_id>', methods=['GET'])
def get_relic(relic_id):
    """Get a specific relic by ID"""
    from data_manager import load_json_data
    
    # Load relics data
    relics_data = load_json_data('relics.json')
    
    # Get all relics
    relics = relics_data.get('relics', [])
    
    # Find the relic by ID
    relic = next((relic for relic in relics if relic.get('id') == relic_id), None)
    
    if not relic:
        return jsonify({"error": "Relic not found"}), 404
        
    return jsonify(relic)

@app.route('/api/relic/all', methods=['GET'])
def get_all_relics():
    """Get all available relics"""
    from data_manager import load_json_data
    
    # Load relics data
    relics_data = load_json_data('relics.json')
    
    # Get all relics
    relics = relics_data.get('relics', [])
    
    return jsonify(relics)

# ===== SAVE/LOAD ROUTES =====

@app.route('/api/save-game', methods=['POST'])
def save_game():
    """Save the current game state"""
    game_state = get_current_game_state()
    
    # Generate a save ID
    save_id = str(uuid.uuid4())
    
    # Add timestamp
    save_data = {
        "id": save_id,
        "timestamp": datetime.now().isoformat(),
        "game_state": game_state
    }
    
    # Store the save
    saved_games[save_id] = save_data
    
    return jsonify({"success": True, "save_id": save_id})

@app.route('/api/load-game/<save_id>', methods=['GET'])
def load_game(save_id):
    """Load a saved game"""
    if save_id not in saved_games:
        return jsonify({"error": "Save not found"}), 404
    
    # Get the save data
    save_data = saved_games[save_id]
    
    # Update the current game state
    game_state = save_data.get('game_state', create_default_game_state())
    update_game_state(game_state)
    
    return jsonify(game_state)

@app.route('/api/saved-games', methods=['GET'])
def get_saved_games():
    """Get list of saved games"""
    save_list = []
    
    for save_id, save_data in saved_games.items():
        save_list.append({
            "id": save_id,
            "timestamp": save_data.get('timestamp', ''),
            "floor": save_data.get('game_state', {}).get('current_floor', 1)
        })
    
    # Sort by timestamp, newest first
    save_list.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    return jsonify(save_list)

# ===== DEBUG ROUTES =====

@app.route('/api/debug-reset', methods=['POST'])
def debug_reset():
    """Reset the game state (debug endpoint)"""
    game_id = get_game_id()
    if game_id in game_states:
        del game_states[game_id]
    
    # Clear saved games
    saved_games.clear()
    
    return jsonify({"success": True, "message": "Game state reset"})

@app.route('/api/debug/info', methods=['GET'])
def debug_info():
    """Get debug info about the current session"""
    return jsonify({
        "session_id": session.get('id', None),
        "game_id": get_game_id(),
        "game_states_count": len(game_states),
        "saved_games_count": len(saved_games)
    })

# Run the app if executed directly
if __name__ == '__main__':
    app.run(debug=True)