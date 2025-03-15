# app.py - Main Flask application with routes
from flask import Flask, render_template, jsonify, request, session
import os
import json
import uuid
from werkzeug.utils import secure_filename
import json
import uuid
from datetime import datetime
import copy
import sys
import traceback
import random
import json

# Import modules
from node_plugins import initialize_plugins, process_node_with_plugin, load_node_types
from data_manager import load_json_data, save_json_data, init_data_files
from map_generator import generate_floor_layout, determine_node_type, get_node_title
from game_state import create_default_game_state, get_game_id, get_question_for_node, get_random_item, get_random_relic, get_random_event, get_random_patient_case
from db_utils import save_game_state, load_game_state, delete_game_state


app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')

def get_node_types_from_config():
    """Get node types from configuration"""
    node_types_data = load_node_types()
    
    node_types = {}
    for type_data in node_types_data.get('types', []):
        node_types[type_data.get('id')] = {
            'data_function': type_data.get('dataFunction'),
            'data_key': type_data.get('dataKey')
        }
    
    return node_types

# Make session permanent
@app.before_request
def make_session_permanent():
    session.permanent = True

# Error handler for 500 errors
@app.errorhandler(500)
def handle_500_error(e):
    """Handle server errors and log details"""
    error_traceback = traceback.format_exc()
    print(f"⚠️ SERVER ERROR: {e}", file=sys.stderr)
    print(f"Traceback:\n{error_traceback}", file=sys.stderr)
    
    return jsonify({
        "error": "An internal server error occurred",
        "message": str(e),
        "traceback": error_traceback.split("\n")
    }), 500

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
initialize_plugins()

NODE_TYPES = get_node_types_from_config()


# Validate node type helper function
def validate_node_type(node):
    """Ensure node type and content are consistent"""
    # Import here to avoid circular imports
    from game_state import get_question_for_node, get_random_item, get_random_event
    
    node_type = node.get('type')
    
    # Validate node type matches title
    title_type_map = {
        'Physics Question': 'question',
        'Challenging Question': 'elite',
        'Final Assessment': 'boss',
        'Equipment Found': 'treasure',
        'Break Room': 'rest',
        'Random Event': 'event',
        'Department Store': 'shop'
    }
    
    # Fix type based on title if there's a mismatch
    title = node.get('title')
    if title and title in title_type_map and node_type != title_type_map[title]:
        print(f"Node {node.get('id')} has mismatched type ({node_type}) and title ({title})")
        node['type'] = title_type_map[title]
        node_type = node['type']  # Update node_type variable
    
    # Add content based on node type if missing
    if node_type in ['question', 'elite', 'boss'] and 'question' not in node:
        node['question'] = get_question_for_node(node)
    elif node_type == 'treasure' and 'item' not in node:
        node['item'] = get_random_item()
    elif node_type == 'event' and 'event' not in node:
        node['event'] = get_random_event()
    
    return node

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
        error_traceback = traceback.format_exc()
        print(f"⚠️ Error retrieving game state: {e}", file=sys.stderr)
        print(f"Traceback:\n{error_traceback}", file=sys.stderr)
        return jsonify({"error": f"An error occurred retrieving game state: {str(e)}",
                       "traceback": error_traceback.split("\n")}), 500

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

# In app.py, find or add this function:
@app.route('/api/floors-config', methods=['POST'])
def update_floors_config():
    """Update the floors configuration for testing"""
    try:
        # Generate a series of floors for testing
        floor_count = request.json.get('floor_count', 10)
        floors_data = {"floors": []}
        
        # Generate floor 1
        floors_data["floors"].append({
            "id": 1,
            "name": "Hospital Basement",
            "description": "Your first day as a resident. Learn the basics in the safe environment of the basement.",
            "node_count": {"min": 4, "max": 6},
            "node_types": {
                "question": {"weight": 60, "difficulty_range": [1, 1]},
                "rest": {"weight": 20},
                "treasure": {"weight": 20},
                "patient_case": { "weight": 15 }
            },
            "boss": None
        })
        
        # Generate floors 2 through floor_count-1
        for i in range(2, floor_count):
            floors_data["floors"].append({
                "id": i,
                "name": f"Floor {i}",
                "description": f"Test floor {i} with increasing difficulty.",
                "node_count": {"min": 5, "max": 7},
                "node_types": {
                    "question": {"weight": 50, "difficulty_range": [1, min(i, 3)]},
                    "elite": {"weight": 15, "difficulty_range": [2, min(i, 3)]},
                    "rest": {"weight": 15},
                    "treasure": {"weight": 20},
            "patient_case": { "weight": 15 }
                },
                "boss": None
            })
        
        # Generate final boss floor
        floors_data["floors"].append({
            "id": floor_count,
            "name": "Final Challenge",
            "description": "The ultimate challenge for your medical physics knowledge.",
            "node_count": {"min": 6, "max": 8},
            "node_types": {
                "question": {"weight": 40, "difficulty_range": [2, 3]},
                "elite": {"weight": 30, "difficulty_range": [2, 3]},
                "rest": {"weight": 15},
                "treasure": {"weight": 15},
                "patient_case": { "weight": 15 }
            },
            "boss": {
                "name": "Chief Medical Physicist",
                "description": "The department head has challenging questions about QA procedures.",
                "difficulty": 3
            }
        })
        
        # Save to floors.json
        save_json_data(floors_data, 'floors.json')
        
        return jsonify({"success": True, "floor_count": floor_count})
    except Exception as e:
        print(f"Error updating floors config: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    
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

# In the get_node route handler (around line 540), replace or enhance 
# the node processing logic to use plugins:

@app.route('/api/node/<node_id>')
def get_node(node_id):
    """Get content for a specific node"""
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
        
        # Process the node with plugin system
        processed_node = process_node_with_plugin(node)
        
        # Legacy compatibility: If plugin didn't add required data, use old system
        node_type = processed_node.get('type')
        if node_type in NODE_TYPES:
            node_config = NODE_TYPES[node_type]
            
            # If the node type needs data and it's missing, get it with legacy method
            if (node_config['data_function'] and node_config['data_key'] and 
                node_config['data_key'] not in processed_node):
                
                # Dynamically call the function
                func_name = node_config['data_function']
                if func_name in globals():
                    data = globals()[func_name](processed_node)
                    
                    # Update node with data
                    if data:
                        processed_node[node_config['data_key']] = data
        
        # Return processed node data
        return jsonify(processed_node)
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"⚠️ Error retrieving node {node_id}: {e}", file=sys.stderr)
        print(f"Traceback:\n{error_traceback}", file=sys.stderr)
        return jsonify({"error": f"An error occurred retrieving node: {str(e)}",
                       "traceback": error_traceback.split("\n")}), 500

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

@app.route('/api/debug-reset', methods=['POST'])
def debug_reset():
    """Reset the game state for debugging"""
    game_id = get_game_id()
    new_state = create_default_game_state()
    save_game_state(game_id, new_state)
    return jsonify({"success": True})

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

@app.route('/api/debug-node/<node_id>')
def debug_node(node_id):
    """Debug info for a node"""
    game_id = get_game_id()
    game_state = load_game_state(game_id)
    
    # Find the node in the map
    node = None
    if node_id == 'start':
        node = game_state['map']['start']
    elif node_id == 'boss' and 'boss' in game_state['map']:
        node = game_state['map']['boss']
    elif 'nodes' in game_state['map'] and node_id in game_state['map']['nodes']:
        node = game_state['map']['nodes'][node_id]
    
    return jsonify({
        "node_found": node is not None,
        "node_data": node,
        "node_type": node.get('type') if node else None
    })
@app.route('/api/item/random')
def get_random_items():
    """Get random items for shop"""
    try:
        # Get count parameter, default to 3
        count = request.args.get('count', 3, type=int)
        # Limit count to reasonable range
        count = max(1, min(count, 6))
        
        # Get rarity distribution based on floor
        game_id = get_game_id()
        game_state = load_game_state(game_id)
        current_floor = game_state.get('current_floor', 1) if game_state else 1
        
        # Adjust rarity chances based on floor
        rarity_weights = {
            'common': max(60 - (current_floor * 10), 30),
            'uncommon': min(25 + (current_floor * 5), 40),
            'rare': min(10 + (current_floor * 3), 25),
            'epic': min(5 + (current_floor * 2), 15)
        }
        
        # Load all items
        items_data = load_json_data('items.json')
        all_items = items_data.get('items', [])
        
        if not all_items:
            return jsonify([]), 200
        
        # Group items by rarity
        items_by_rarity = {}
        for item in all_items:
            rarity = item.get('rarity', 'common')
            if rarity not in items_by_rarity:
                items_by_rarity[rarity] = []
            items_by_rarity[rarity].append(item)
        
        # Select items based on rarity weights
        selected_items = []
        for _ in range(count):
            # Determine rarity based on weights
            rarity_roll = random.randint(1, 100)
            selected_rarity = 'common'
            cumulative = 0
            
            for rarity, weight in rarity_weights.items():
                cumulative += weight
                if rarity_roll <= cumulative:
                    selected_rarity = rarity
                    break
            
            # Get items of selected rarity
            rarity_items = items_by_rarity.get(selected_rarity, [])
            if not rarity_items:
                # Fallback to common if no items of selected rarity
                rarity_items = items_by_rarity.get('common', [])
                if not rarity_items:
                    # Fallback to any item if no common items
                    rarity_items = all_items
            
            # Select random item from rarity group
            if rarity_items:
                # Filter out duplicates
                available_items = [item for item in rarity_items if item not in selected_items]
                if available_items:
                    selected_items.append(random.choice(available_items))
                elif rarity_items:  # If no unique items, allow duplicates
                    selected_items.append(random.choice(rarity_items))
        
        return jsonify(selected_items)
    except Exception as e:
        print(f"Error getting random items: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/relic/<relic_id>')
def get_relic(relic_id):
    """Get relic data by ID"""
    relics_data = load_json_data('relics.json')
    relic = next((relic for relic in relics_data.get('relics', []) if relic.get('id') == relic_id), None)
    
    if not relic:
        return jsonify({"error": f"Relic with id '{relic_id}' not found"}), 404
        
    return jsonify(relic)

@app.route('/api/relic/random')
def get_random_relics():
    """Get random relics"""
    try:
        # Get count parameter, default to 3
        count = request.args.get('count', 3, type=int)
        # Get rarity distribution
        rarity = request.args.get('rarity', None)
        
        relics = []
        for _ in range(count):
            relics.append(get_random_relic(rarity))
            
        return jsonify(relics)
    except Exception as e:
        print(f"Error getting random relics: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Item editor page
@app.route('/item-editor')
def item_editor():
    return render_template('item_editor.html')

# API endpoint to get all items and relics
@app.route('/api/editor/items')
def get_all_items():
    try:
        # Load items from data files
        with open('data/items.json', 'r') as f:
            items_data = json.load(f)
            
        with open('data/relics.json', 'r') as f:
            relics_data = json.load(f)
            
        # Combine items and relics
        all_items = items_data.get('items', []) + relics_data.get('relics', [])
        
        return jsonify({
            'success': True,
            'items': all_items
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Get available icons
@app.route('/api/editor/icons')
def get_item_icons():
    try:
        # Get all PNG files in the items folder
        items_dir = os.path.join('static', 'img', 'items')
        icons = [f for f in os.listdir(items_dir) if f.endswith('.png')]
        
        return jsonify({
            'success': True,
            'icons': icons
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Save a single item
@app.route('/api/editor/save-item', methods=['POST'])
def save_item():
    try:
        item_data = request.json
        
        # Validate item data
        if not item_data.get('id') or not item_data.get('name'):
            return jsonify({
                'success': False,
                'error': 'Item must have an ID and name'
            })
            
        # Load existing data
        items_path = 'data/items.json'
        relics_path = 'data/relics.json'
        
        with open(items_path, 'r') as f:
            items_data = json.load(f)
            
        with open(relics_path, 'r') as f:
            relics_data = json.load(f)
            
        # Determine if this is an item or relic
        is_relic = item_data.get('itemType') == 'relic'
        
        # Find and update or add the item
        if is_relic:
            # Look for existing relic with same ID
            relic_index = next((i for i, r in enumerate(relics_data['relics']) 
                               if r['id'] == item_data.get('id')), None)
                               
            if relic_index is not None:
                # Update existing relic
                relics_data['relics'][relic_index] = item_data
            else:
                # Add new relic
                relics_data['relics'].append(item_data)
                
            # Save relics file
            with open(relics_path, 'w') as f:
                json.dump(relics_data, f, indent=2)
        else:
            # Look for existing item with same ID
            item_index = next((i for i, item in enumerate(items_data['items']) 
                              if item['id'] == item_data.get('id')), None)
                              
            if item_index is not None:
                # Update existing item
                items_data['items'][item_index] = item_data
            else:
                # Add new item
                items_data['items'].append(item_data)
                
            # Save items file
            with open(items_path, 'w') as f:
                json.dump(items_data, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Item saved successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Save all changes
@app.route('/api/editor/save-all', methods=['POST'])
def save_all_changes():
    try:
        changes = request.json.get('changes', {})
        
        if not changes:
            return jsonify({
                'success': False,
                'error': 'No changes provided'
            })
            
        # Load existing data
        items_path = 'data/items.json'
        relics_path = 'data/relics.json'
        
        with open(items_path, 'r') as f:
            items_data = json.load(f)
            
        with open(relics_path, 'r') as f:
            relics_data = json.load(f)
            
        # Process each change
        for item_id, item_data in changes.items():
            # Check if item is marked for deletion
            if item_data.get('deleted'):
                # Remove from items or relics
                items_data['items'] = [item for item in items_data['items'] if item['id'] != item_id]
                relics_data['relics'] = [relic for relic in relics_data['relics'] if relic['id'] != item_id]
                continue
                
            # Determine if this is an item or relic
            is_relic = item_data.get('itemType') == 'relic'
            
            if is_relic:
                # Look for existing relic with same ID
                relic_index = next((i for i, r in enumerate(relics_data['relics']) 
                                   if r['id'] == item_id), None)
                                   
                if relic_index is not None:
                    # Update existing relic
                    relics_data['relics'][relic_index] = item_data
                else:
                    # Add new relic
                    relics_data['relics'].append(item_data)
            else:
                # Look for existing item with same ID
                item_index = next((i for i, item in enumerate(items_data['items']) 
                                  if item['id'] == item_id), None)
                                  
                if item_index is not None:
                    # Update existing item
                    items_data['items'][item_index] = item_data
                else:
                    # Add new item
                    items_data['items'].append(item_data)
        
        # Save files
        with open(items_path, 'w') as f:
            json.dump(items_data, f, indent=2)
            
        with open(relics_path, 'w') as f:
            json.dump(relics_data, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'All changes saved successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Upload a new icon
@app.route('/api/editor/upload-icon', methods=['POST'])
def upload_icon():
    try:
        if 'icon' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            })
            
        file = request.files['icon']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            })
            
        if not file.filename.endswith('.png'):
            return jsonify({
                'success': False,
                'error': 'Only PNG files are supported'
            })
            
        # Generate a unique filename
        filename = secure_filename(file.filename)
        base, ext = os.path.splitext(filename)
        unique_filename = f"{base}_{uuid.uuid4().hex[:8]}{ext}"
        
        # Save the file
        file_path = os.path.join('static', 'img', 'items', unique_filename)
        file.save(file_path)
        
        return jsonify({
            'success': True,
            'filename': unique_filename,
            'message': 'Icon uploaded successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })
    
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

if __name__ == "__main__":
    app.run(debug=True)