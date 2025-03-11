# app.py - Main Flask application with routes
from flask import Flask, render_template, jsonify, request, session
import os
import json
import uuid
from datetime import datetime

# Import modules
from data_manager import load_json_data, save_json_data, init_data_files
from game_state import get_game_id, create_default_game_state, game_states
from map_generator import generate_floor_layout, determine_node_type, get_node_title

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')

# Initialize data when the app starts
init_data_files()

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
    game_id = get_game_id()
    
    # Return existing game state or create new one
    if game_id in game_states:
        return jsonify(game_states[game_id])
    else:
        # Create a new default game state
        default_game_state = create_default_game_state()
        game_states[game_id] = default_game_state
        return jsonify(default_game_state)

@app.route('/character-select')
def character_select():
    """Render the character selection page"""
    return render_template('character_select.html')

@app.route('/api/characters')
def get_characters():
    """Return all available characters"""
    characters_data = load_json_data('characters.json')
    return jsonify(characters_data)

@app.route('/api/new-game', methods=['POST'])
def new_game():
    """Start a new game with the selected character"""
    data = request.json
    character_id = data.get('character_id', 'resident')  # Default to resident if not specified
    
    # Load character data
    characters = load_json_data('characters.json')
    character_data = next((c for c in characters.get('characters', []) if c['id'] == character_id), None)
    
    if not character_data:
        return jsonify({"error": "Character not found"}), 404
    
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
            "special_ability": character_data['special_ability']
        },
        "current_floor": 1,
        "created_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    
    # Store the game state
    game_states[game_id] = game_state
    
    return jsonify(game_state)

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
    
    # Get the game state
    if game_id not in game_states:
        return jsonify({"error": "Game not found"}), 404
    
    game_state = game_states[game_id]
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
    game_states[game_id] = game_state
    
    return jsonify(map_layout)

@app.route('/api/node/<node_id>')
def get_node(node_id):
    """Get content for a specific node"""
    from game_state import get_question_for_node, get_random_item, get_random_event
    
    game_id = get_game_id()
    
    # Get the game state
    if game_id not in game_states:
        return jsonify({"error": "Game not found"}), 404
    
    game_state = game_states[game_id]
    
    if 'map' not in game_state:
        return jsonify({"error": "No map generated yet"}), 400
    
    # Find the node in the map
    node = None
    if node_id == 'start':
        node = game_state['map']['start']
    elif node_id == 'boss' and game_state['map']['boss']:
        node = game_state['map']['boss']
    elif node_id in game_state['map']['nodes']:
        node = game_state['map']['nodes'][node_id]
    
    if not node:
        return jsonify({"error": "Node not found"}), 404
    
    # Process node based on type
    if node["type"] == "question" or node["type"] == "elite" or node["type"] == "boss":
        # Get a question matching the difficulty
        question_data = get_question_for_node(node)
        return jsonify({**node, "question": question_data})
    
    elif node["type"] == "treasure":
        # Get a random item
        item_data = get_random_item()
        return jsonify({**node, "item": item_data})
    
    elif node["type"] == "event":
        # Get a random event
        event_data = get_random_event()
        return jsonify({**node, "event": event_data})
    
    else:
        # Other node types don't need additional data
        return jsonify(node)

@app.route('/api/answer-question', methods=['POST'])
def answer_question():
    """Process an answer to a question"""
    data = request.json
    game_id = get_game_id()
    
    # Get the game state
    if game_id not in game_states:
        return jsonify({"error": "Game not found"}), 404
    
    game_state = game_states[game_id]
    
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
    game_states[game_id] = game_state
    
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
    
    # Get the game state
    if game_id not in game_states:
        return jsonify({"error": "Game not found"}), 404
    
    game_state = game_states[game_id]
    
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
    game_states[game_id] = game_state
    
    return jsonify({
        "game_state": game_state,
        "all_nodes_visited": all_visited
    })

@app.route('/api/next-floor', methods=['POST'])
def next_floor():
    """Advance to the next floor"""
    game_id = get_game_id()
    
    # Get the game state
    if game_id not in game_states:
        return jsonify({"error": "Game not found"}), 404
    
    game_state = game_states[game_id]
    
    # Increment floor number
    game_state["current_floor"] += 1
    
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
    game_states[game_id] = game_state
    
    return jsonify(game_state)

@app.route('/api/reset-game', methods=['POST'])
def reset_game():
    """Reset the game to a new game state"""
    game_id = get_game_id()
    
    # Create a new default game state
    game_states[game_id] = create_default_game_state()
    
    return jsonify(game_states[game_id])

if __name__ == '__main__':
    app.run(debug=True)