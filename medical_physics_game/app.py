# app.py - Main Flask application with routes
from flask import Flask, render_template, jsonify, request, session
import os
import json
import uuid
from datetime import datetime
import copy

# Import modules
from data_manager import load_json_data, save_json_data, init_data_files
from map_generator import generate_floor_layout, determine_node_type, get_node_title
from game_state import create_default_game_state, get_game_id
from db_utils import save_game_state, load_game_state, delete_game_state

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')


# Make session permanent
@app.before_request
def make_session_permanent():
    session.permanent = True

# Near the top of app.py, after imports
from datetime import timedelta

# In the Flask app initialization
app.permanent_session_lifetime = timedelta(days=7)  # Sessions last 7 days

# Option: Use SQLite instead of in-memory storage
import sqlite3

# Initialize database
def init_db():
    conn = sqlite3.connect('game_data.db')
    c = conn.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS game_states
    (game_id TEXT PRIMARY KEY, game_state TEXT, last_updated TEXT)
    ''')
    conn.commit()
    conn.close()

# Initialize data when the app starts
init_data_files()
init_db()

# Dictionary to store saved games
saved_games = {}
# Routes
@app.route('/')
def landing():
    """Render the landing page"""
    game_config = load_json_data('game_config.json')
    return render_template('landing.html', config=game_config)

@app.route('/game')
def game():
    """Render the main game page"""
    return render_template('index.html')

@app.route('/api/game-state')
def get_game_state():
    """Return the current game state"""
    try:
        game_id = get_game_id()
        
        # Load from database or create new state
        game_state = load_game_state(game_id)
        if not game_state:
            # Create a new default game state
            game_state = create_default_game_state()
            save_success = save_game_state(game_id, game_state)
            if not save_success:
                return jsonify({"error": "Failed to save new game state"}), 500
        
        return jsonify(game_state)
    except Exception as e:
        print(f"Error retrieving game state: {e}")
        return jsonify({"error": f"An error occurred retrieving game state: {str(e)}"}), 500

@app.route('/character-select')
def character_select():
    """Render the character selection page"""
    return render_template('character_select.html')

@app.route('/api/characters')
def get_characters():
    """Return all available characters"""
    characters_data = load_json_data('characters.json')
    return jsonify(characters_data)

@app.route('/api/item/<item_id>')
def get_item(item_id):
    """Get item data by ID"""
    items_data = load_json_data('items.json')
    item = next((item for item in items_data.get('items', []) if item.get('id') == item_id), None)
    
    if not item:
        return jsonify({"error": f"Item with id '{item_id}' not found"}), 404
        
    return jsonify(item)

@app.route('/api/new-game', methods=['POST'])
def new_game():
    """Start a new game with the selected character"""
    try:
        data = request.json or {}
        character_id = data.get('character_id', 'resident')  # Default to resident if not specified
        
        # Validate character_id is a string
        if not isinstance(character_id, str):
            return jsonify({"error": "Invalid character ID format"}), 400
        
        # Load character data
        characters = load_json_data('characters.json')
        character_data = next((c for c in characters.get('characters', []) if c['id'] == character_id), None)
        
        if not character_data:
            return jsonify({"error": f"Character '{character_id}' not found"}), 404
        
        # Get a unique game ID
        game_id = get_game_id()
        
        # Set up initial game state
        game_state = {
            "character": {
                "name": character_data['name'],
                "level": character_data['starting_stats']['level'],
                "lives": character_data['starting_stats']['lives'],
                "max_lives": character_data['starting_stats']['max_lives'],
                "insight": character_data['starting_stats']['insight'],
                "special_ability": character_data['special_ability'].copy() if character_data['special_ability'] else None
            },
            "current_floor": 1,
            "inventory": [],
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        # Add remaining uses to special ability
        if game_state["character"]["special_ability"]:
            game_state["character"]["special_ability"]["remaining_uses"] = game_state["character"]["special_ability"].get("uses_per_floor", 1)
        
        # Store the game state in the database
        if save_game_state(game_id, game_state):
            return jsonify(game_state)
        else:
            return jsonify({"error": "Failed to save game state"}), 500
    except Exception as e:
        print(f"Error starting new game: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/floor/<int:floor_id>')
def get_floor(floor_id):
    """Get floor data by ID"""
    floors_data = load_json_data('floors.json')
    floor = next((f for f in floors_data.get('floors', []) if f.get('id') == floor_id), None)
    
    if not floor:
        return jsonify({"name": "Unknown Floor", "description": ""}), 404
        
    return jsonify(floor)

@app.route('/api/generate-floor-map', methods=['POST'])
def generate_floor_map():
    """Generate a map for the current floor"""
    data = request.json or {}
    game_id = get_game_id()
    
    # Get the game state from database
    game_state = load_game_state(game_id)
    if not game_state:
        return jsonify({"error": "Game not found"}), 404
    
    floor_number = data.get('floor_number', game_state.get('current_floor', 1))
    
    # Load floor data
    floors_data = load_json_data('floors.json')
    floor_data = next((f for f in floors_data.get('floors', []) if f.get('id') == floor_number), None)
    
    if not floor_data:
        # Use default floor data
        floor_data = {
            "node_count": {"min": 5, "max": 8},
            "node_types": {
                "question": {"weight": 50, "difficulty_range": [1, min(floor_number, 3)]},
                "rest": {"weight": 20},
                "treasure": {"weight": 15},
                "elite": {"weight": 15 if floor_number > 1 else 0, "difficulty_range": [2, 3]}
            },
            "boss": {
                "name": "Chief Medical Physicist",
                "description": "The department head has challenging questions about QA procedures.",
                "difficulty": 3
            } if floor_number >= 3 else None
        }
    
    # Generate the map layout
    map_layout = generate_floor_layout(floor_number, floor_data)
    
    # Update game state with the map
    game_state['map'] = map_layout
    game_state['last_updated'] = datetime.now().isoformat()
    save_game_state(game_id, game_state)
    
    return jsonify(map_layout)

@app.route('/api/node/<node_id>')
def get_node(node_id):
    """Get content for a specific node"""
    from game_state import get_question_for_node, get_random_item, get_random_event
    
    try:
        game_id = get_game_id()
        
        # Get the game state from database
        game_state = load_game_state(game_id)
        if not game_state:
            return jsonify({"error": "Game not found"}), 404
        
        if 'map' not in game_state:
            return jsonify({"error": "No map generated yet"}), 400
        
        # Find the node in the map
        node = None
        if node_id == 'start':
            node = game_state['map']['start']
        elif node_id == 'boss' and 'boss' in game_state['map'] and game_state['map']['boss']:
            node = game_state['map']['boss']
        elif 'nodes' in game_state['map'] and node_id in game_state['map']['nodes']:
            node = game_state['map']['nodes'][node_id]
        
        if not node:
            return jsonify({"error": f"Node {node_id} not found in map"}), 404
        
        # Process node based on type
        if node["type"] == "question" or node["type"] == "elite" or node["type"] == "boss":
            # Get a question matching the difficulty
            question_data = get_question_for_node(node)
            if not question_data:
                return jsonify({"error": "Failed to generate a question"}), 500
            return jsonify({**node, "question": question_data})
        
        elif node["type"] == "treasure":
            # Get a random item
            item_data = get_random_item()
            if not item_data:
                return jsonify({"error": "Failed to generate an item"}), 500
            return jsonify({**node, "item": item_data})
        
        elif node["type"] == "event":
            # Get a random event
            event_data = get_random_event()
            if not event_data:
                return jsonify({"error": "Failed to generate an event"}), 500
            return jsonify({**node, "event": event_data})
        
        else:
            # Other node types don't need additional data
            return jsonify(node)
    except Exception as e:
        print(f"Error retrieving node {node_id}: {e}")
        return jsonify({"error": f"An error occurred retrieving node: {str(e)}"}), 500

@app.route('/api/answer-question', methods=['POST'])
def answer_question():
    """Process an answer to a question"""
    data = request.json
    game_id = get_game_id()

    # Validate required fields
    if not all(k in data for k in ('node_id', 'answer_index', 'question')):
        return jsonify({"error": "Missing required fields"}), 400
        
    # Validate answer_index is an integer and within range
    try:
        answer_index = int(data.get('answer_index'))
        if answer_index < 0 or answer_index >= len(data.get('question', {}).get('options', [])):
            return jsonify({"error": "Answer index out of range"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid answer index"}), 400
    
    # Get the game state from database
    game_state = load_game_state(game_id)
    if not game_state:
        return jsonify({"error": "Game not found"}), 404
    
    node_id = data.get('node_id')
    answer_index = data.get('answer_index')
    question = data.get('question')
    
    if not question:
        return jsonify({"error": "Question data not provided"}), 400
    
    # Check if answer is correct
    is_correct = (answer_index == question.get('correct'))
    
    # Load game config for rewards/penalties
    game_config = load_json_data('game_config.json')
    insight_gain = game_config.get('game_settings', {}).get('insight_per_correct_answer', 10)
    insight_penalty = game_config.get('game_settings', {}).get('insight_penalty_per_wrong_answer', 5)
    
    # Update character stats
    if is_correct:
        game_state["character"]["insight"] += insight_gain
    else:
        game_state["character"]["lives"] -= 1
        game_state["character"]["insight"] = max(0, game_state["character"]["insight"] - insight_penalty)
    
    # Update game state
    game_state['last_updated'] = datetime.now().isoformat()
    save_game_state(game_id, game_state)
    
    return jsonify({
        "correct": is_correct,
        "explanation": question.get('explanation', ''),
        "insight_gained": insight_gain if is_correct else 0,
        "game_state": game_state
    })

@app.route('/api/mark-node-visited', methods=['POST'])
def mark_node_visited():
    """Mark a node as visited"""
    data = request.json
    game_id = get_game_id()
    
    # Get the game state from database
    game_state = load_game_state(game_id)
    if not game_state:
        return jsonify({"error": "Game not found"}), 404
    
    if 'map' not in game_state:
        return jsonify({"error": "No map generated yet"}), 400
    
    node_id = data.get('node_id')
    
    # Find and mark the node as visited
    if node_id == 'boss' and game_state['map']['boss']:
        game_state['map']['boss']['visited'] = True
    elif node_id in game_state['map']['nodes']:
        game_state['map']['nodes'][node_id]['visited'] = True
    else:
        return jsonify({"error": "Node not found"}), 404
    
    # Check if all nodes are visited
    all_visited = True
    for node in game_state['map']['nodes'].values():
        if not node['visited']:
            all_visited = False
            break
    
    # Include boss in check if present
    if game_state['map']['boss'] and not game_state['map']['boss']['visited']:
        all_visited = False
    
    # Update game state
    game_state['last_updated'] = datetime.now().isoformat()
    save_game_state(game_id, game_state)
    
    return jsonify({
        "game_state": game_state,
        "all_nodes_visited": all_visited
    })

@app.route('/api/save-inventory', methods=['POST'])
def save_inventory():
    """Save the player's inventory"""
    data = request.json
    game_id = get_game_id()
    
    # Get the game state from database
    game_state = load_game_state(game_id)
    if not game_state:
        return jsonify({"error": "Game not found"}), 404
    
    # Update inventory
    game_state['inventory'] = data.get('inventory', [])
    
    # Update game state
    game_state['last_updated'] = datetime.now().isoformat()
    save_game_state(game_id, game_state)
    
    return jsonify({"success": True})

@app.route('/api/next-floor', methods=['POST'])
def next_floor():
    """Advance to the next floor"""
    game_id = get_game_id()
    
    # Get the game state from database
    game_state = load_game_state(game_id)
    if not game_state:
        return jsonify({"error": "Game not found"}), 404
    
    # Increment floor number
    game_state["current_floor"] += 1
    
    # Reset special ability uses for the new floor
    if "character" in game_state and "special_ability" in game_state["character"] and game_state["character"]["special_ability"]:
        uses_per_floor = game_state["character"]["special_ability"].get("uses_per_floor", 1)
        game_state["character"]["special_ability"]["remaining_uses"] = uses_per_floor
    
    # Potentially restore some lives when advancing floors
    game_config = load_json_data('game_config.json')
    lives_per_floor = game_config.get('game_settings', {}).get('lives_per_floor', 0)
    
    if lives_per_floor > 0:
        game_state["character"]["lives"] = min(
            game_state["character"]["lives"] + lives_per_floor,
            game_state["character"]["max_lives"]
        )
    
    # Clear current map
    if 'map' in game_state:
        del game_state['map']
    
    # Update game state
    game_state['last_updated'] = datetime.now().isoformat()
    save_game_state(game_id, game_state)
    
    return jsonify(game_state)

@app.route('/api/reset-game', methods=['POST'])
def reset_game():
    """Reset the game to a new game state"""
    game_id = get_game_id()
    
    # Create a new default game state
    game_state = create_default_game_state()
    
    # Save to database
    if save_game_state(game_id, game_state):
        return jsonify(game_state)
    else:
        return jsonify({"error": "Failed to reset game"}), 500

@app.route('/api/save-game', methods=['POST'])
def save_game():
    game_id = get_game_id()
    
    # Load current game state
    game_state = load_game_state(game_id)
    if not game_state:
        return jsonify({"error": "No active game to save"}), 404
    
    # Create a save ID that's different from the session game ID
    save_id = str(uuid.uuid4())
    
    # Copy the game state and save with the new ID
    if save_game_state(save_id, game_state):
        return jsonify({"save_id": save_id})
    else:
        return jsonify({"error": "Failed to save game"}), 500

@app.route('/api/load-game/<save_id>', methods=['GET'])
def load_game(save_id):
    # Load the saved game
    saved_game = load_game_state(save_id)
    if not saved_game:
        return jsonify({"error": "Saved game not found"}), 404
    
    # Load the saved game into the current session
    game_id = get_game_id()
    if save_game_state(game_id, saved_game):
        return jsonify(saved_game)
    else:
        return jsonify({"error": "Failed to load game"}), 500
    
@app.route('/api/test-db')
def test_db():
    """Test the database connection and operations"""
    try:
        # Create test game state
        test_id = "test-" + str(uuid.uuid4())
        test_state = {
            "test": True,
            "timestamp": datetime.now().isoformat()
        }
        
        # Test save
        save_result = save_game_state(test_id, test_state)
        
        # Test load
        load_result = load_game_state(test_id)
        
        # Test delete
        delete_result = delete_game_state(test_id)
        
        return jsonify({
            "success": True,
            "save_result": save_result,
            "load_result": load_result,
            "delete_result": delete_result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })