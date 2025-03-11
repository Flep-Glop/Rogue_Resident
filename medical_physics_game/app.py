# app.py - Flask backend
from flask import Flask, render_template, jsonify, request, session
import json
import os
import random
import uuid
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')

# Game state will be stored in an in-memory dictionary for this demo
# In production, you would use a database
game_states = {}

# Data loading functions
def load_json_data(filename):
    """Load data from a JSON file in the data directory"""
    data_path = os.path.join('data', filename)
    try:
        with open(data_path, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {filename}: {e}")
        return {}

def save_json_data(data, filename):
    """Save data to a JSON file in the data directory"""
    data_path = os.path.join('data', filename)
    os.makedirs(os.path.dirname(data_path), exist_ok=True)
    
    with open(data_path, 'w') as file:
        json.dump(data, file, indent=2)

# Initialize data directory and files if they don't exist
def init_data_files():
    """Create data directory and initialize JSON files if they don't exist"""
    data_dir = 'data'
    os.makedirs(data_dir, exist_ok=True)
    
    # Check if each file exists, create with default content if not
    files_to_check = [
        ('questions.json', {"categories": []}),
        ('floors.json', {"floors": []}),
        ('characters.json', {"characters": []}),
        ('items.json', {"items": []}),
        ('game_config.json', {"game_title": "Medical Physics Residency Game"})
    ]
    
    for filename, default_content in files_to_check:
        file_path = os.path.join(data_dir, filename)
        if not os.path.exists(file_path):
            with open(file_path, 'w') as file:
                json.dump(default_content, file, indent=2)
            print(f"Created default {filename}")

# Initialize data when the app starts
init_data_files()

# Helper to get session game ID
def get_game_id():
    if 'game_id' not in session:
        session['game_id'] = str(uuid.uuid4())
    return session['game_id']

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

def generate_floor_layout(floor_number, floor_data):
    """Generate a floor layout with nodes and connections"""
    # Map parameters
    node_count = random.randint(
        floor_data.get('node_count', {}).get('min', 5),
        floor_data.get('node_count', {}).get('max', 8)
    )
    
    # Create basic structure
    map_layout = {
        "start": {"id": "start", "type": "start", "position": {"row": 0, "col": 1}, "paths": []},
        "nodes": {},
        "boss": None
    }
    
    # Add boss if specified
    if floor_data.get('boss'):
        map_layout["boss"] = {
            "id": "boss", 
            "type": "boss", 
            "position": {"row": 6, "col": 1}, 
            "paths": [],
            "visited": False,
            "title": floor_data.get('boss', {}).get('name', 'Boss'),
            "difficulty": floor_data.get('boss', {}).get('difficulty', 3)
        }
    
    # Node positions will be in a grid
    nodes_per_row = min(3, node_count // 2 + 1)  # Limit to 3 nodes per row
    rows = 4  # We'll use 4 rows between start and boss
    
    # Generate intermediate nodes in a grid pattern
    node_index = 0
    for row in range(1, rows + 1):
        for col in range(nodes_per_row):
            # Skip some nodes randomly to create variability
            if row > 1 and random.random() < 0.2:
                continue
                
            node_id = f"node_{row}_{col}"
            node_index += 1
            
            # Determine node type based on weights
            node_type = determine_node_type(floor_data.get('node_types', {}))
            
            # Determine difficulty for question/elite nodes
            difficulty = 1
            if node_type in ['question', 'elite'] and 'difficulty_range' in floor_data.get('node_types', {}).get(node_type, {}):
                difficulty_range = floor_data['node_types'][node_type]['difficulty_range']
                difficulty = random.randint(difficulty_range[0], difficulty_range[1])
            
            # Create node
            map_layout["nodes"][node_id] = {
                "id": node_id,
                "type": node_type,
                "position": {"row": row, "col": col},
                "paths": [],
                "visited": False,
                "difficulty": difficulty,
                "title": get_node_title(node_type)
            }
    
    # Create paths between nodes
    # Connect start to first row
    first_row_nodes = [n for n in map_layout["nodes"].values() if n["position"]["row"] == 1]
    map_layout["start"]["paths"] = [node["id"] for node in first_row_nodes]
    
    # Connect intermediate rows
    for row in range(1, rows):
        current_row_nodes = [n for n in map_layout["nodes"].values() if n["position"]["row"] == row]
        next_row_nodes = [n for n in map_layout["nodes"].values() if n["position"]["row"] == row + 1]
        
        if not next_row_nodes:
            continue
            
        for node in current_row_nodes:
            # Each node connects to 1-2 nodes in next row
            connection_count = random.randint(1, min(2, len(next_row_nodes)))
            
            # Sort by column proximity
            next_row_nodes.sort(key=lambda n: abs(n["position"]["col"] - node["position"]["col"]))
            
            # Connect to closest nodes
            node["paths"] = [next_row_nodes[i]["id"] for i in range(min(connection_count, len(next_row_nodes)))]
    
    # Connect final row to boss if there is one
    if map_layout["boss"]:
        final_row_nodes = [n for n in map_layout["nodes"].values() if n["position"]["row"] == rows]
        for node in final_row_nodes:
            node["paths"].append("boss")
    
    return map_layout

def determine_node_type(node_types):
    """Determine a random node type based on weights"""
    total_weight = sum(config.get('weight', 0) for config in node_types.values())
    r = random.uniform(0, total_weight)
    
    cumulative_weight = 0
    for node_type, config in node_types.items():
        cumulative_weight += config.get('weight', 0)
        if r <= cumulative_weight:
            return node_type
    
    return "question"  # Default

def get_node_title(node_type):
    """Get a random title for a node type"""
    titles = {
        "question": ["Morning Rounds", "Case Review", "Patient Consult", "Treatment Planning"],
        "shop": ["Department Store", "Campus Bookstore", "Equipment Vendor", "Coffee Cart"],
        "rest": ["Break Room", "Cafeteria", "Library", "Quiet Corner"],
        "treasure": ["Conference", "Journal Club", "Grand Rounds", "Workshop"],
        "elite": ["Physicist Meeting", "Challenging Case", "Equipment Failure", "Accreditation Review"],
        "event": ["Unexpected Call", "Patient Emergency", "Research Opportunity", "Department Meeting"],
        "gamble": ["Journal Lottery", "Research Roulette", "Grant Application", "Experimental Treatment"]
    }
    
    if node_type in titles:
        return random.choice(titles[node_type])
    return "Unknown"

@app.route('/api/node/<node_id>')
def get_node(node_id):
    """Get content for a specific node"""
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