# app.py - Flask backend
from flask import Flask, render_template, jsonify, request
import json
import os
import random

app = Flask(__name__)

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

# Game state (for demo purposes - in production would be stored in a database)
game_state = {
    "character": {
        "name": "Medical Physics Resident",
        "level": 1,
        "lives": 3,
        "max_lives": 3,
        "insight": 20
    },
    "current_floor": 1,
    "nodes": [
        {"id": "node1", "type": "question", "title": "Morning Rounds", "difficulty": 1, "visited": False},
        {"id": "node2", "type": "rest", "title": "Break Room", "difficulty": 0, "visited": False},
        {"id": "node3", "type": "treasure", "title": "Conference", "difficulty": 1, "visited": False}
    ]
}

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
    return jsonify(game_state)

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
    
    # Set up initial game state
    global game_state
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
        "nodes": generate_floor_nodes(1)  # Generate nodes for the first floor
    }
    
    return jsonify(game_state)

def generate_floor_nodes(floor_number):
    """Generate nodes for a floor based on floor configuration"""
    floors = load_json_data('floors.json')
    floor_data = next((f for f in floors.get('floors', []) if f['id'] == floor_number), None)
    
    if not floor_data:
        # Default nodes if floor not found
        return [
            {"id": f"node{i}", "type": "question", "title": f"Question {i}", "difficulty": 1, "visited": False}
            for i in range(1, 5)
        ]
    
    # Determine number of nodes based on floor configuration
    node_count = random.randint(floor_data['node_count']['min'], floor_data['node_count']['max'])
    
    # Generate nodes based on weights
    nodes = []
    node_types = floor_data['node_types']
    
    # Calculate total weights
    total_weight = sum(node_type['weight'] for node_type in node_types.values())
    
    for i in range(1, node_count + 1):
        # Select node type based on weights
        r = random.uniform(0, total_weight)
        cumulative_weight = 0
        selected_type = "question"  # Default
        
        for node_type, config in node_types.items():
            cumulative_weight += config['weight']
            if r <= cumulative_weight:
                selected_type = node_type
                break
        
        # Determine difficulty
        if 'difficulty_range' in node_types.get(selected_type, {}):
            difficulty = random.randint(
                node_types[selected_type]['difficulty_range'][0],
                node_types[selected_type]['difficulty_range'][1]
            )
        else:
            difficulty = 1 if selected_type == "question" else 0
        
        # Generate node title
        titles = {
            "question": ["Morning Rounds", "Case Review", "Patient Consult", "Treatment Planning"],
            "rest": ["Break Room", "Cafeteria", "Library", "Quiet Corner"],
            "treasure": ["Conference", "Journal Club", "Grand Rounds", "Workshop"],
            "elite": ["Physicist Meeting", "Challenging Case", "Equipment Failure", "Accreditation Review"],
            "boss": ["Department Chair", "Board Exam", "Research Presentation", "Clinical Trial Review"]
        }
        
        title = random.choice(titles.get(selected_type, ["Unknown"]))
        
        nodes.append({
            "id": f"node{i}",
            "type": selected_type,
            "title": title,
            "difficulty": difficulty,
            "visited": False
        })
    
    # Add boss node if applicable
    if floor_data.get('boss'):
        nodes.append({
            "id": "boss",
            "type": "boss",
            "title": floor_data['boss']['name'],
            "difficulty": floor_data['boss']['difficulty'],
            "visited": False
        })
    
    return nodes

@app.route('/api/node/<node_id>')
def get_node(node_id):
    """Get content for a specific node"""
    # Find the node
    node = next((n for n in game_state["nodes"] if n["id"] == node_id), None)
    
    if not node:
        return jsonify({"error": "Node not found"}), 404
    
    # If it's a question node, add the question data
    if node["type"] == "question" or node["type"] == "elite" or node["type"] == "boss":
        # Select a random question based on difficulty
        questions_data = load_json_data('questions.json')
        all_questions = []
        
        # Collect questions of appropriate difficulty from all categories
        for category in questions_data.get('categories', []):
            for question in category.get('questions', []):
                if question.get('difficulty', 1) == node['difficulty']:
                    all_questions.append(question)
        
        if not all_questions:
            # Fallback question if none found with matching difficulty
            question_data = {
                "text": "What is the correction factor for temperature and pressure called in TG-51?",
                "options": ["PTP", "kTP", "CTP", "PTC"],
                "correct": 1,
                "explanation": "kTP is the temperature-pressure correction factor in TG-51."
            }
        else:
            # Select a random question of appropriate difficulty
            question_data = random.choice(all_questions)
        
        node_data = {**node, "question": question_data}
    elif node["type"] == "treasure":
        # For treasure nodes, select a random item
        items_data = load_json_data('items.json')
        all_items = items_data.get('items', [])
        
        if all_items:
            item = random.choice(all_items)
            node_data = {**node, "item": item}
        else:
            node_data = node
    else:
        node_data = node
    
    return jsonify(node_data)

@app.route('/api/answer-question', methods=['POST'])
def answer_question():
    """Process an answer to a question"""
    data = request.json
    node_id = data.get('node_id')
    answer_index = data.get('answer_index')
    
    # Find the node
    node = next((n for n in game_state["nodes"] if n["id"] == node_id), None)
    
    if not node:
        return jsonify({"error": "Node not found"}), 404
    
    # Get the question from the request
    question = data.get('question')
    if not question:
        return jsonify({"error": "Question data not provided"}), 400
    
    # Check if answer is correct
    is_correct = (answer_index == question.get('correct'))
    
    # Update game state
    for n in game_state["nodes"]:
        if n["id"] == node_id:
            n["visited"] = True
    
    # Load game config for rewards/penalties
    game_config = load_json_data('game_config.json')
    insight_gain = game_config.get('game_settings', {}).get('insight_per_correct_answer', 10)
    insight_penalty = game_config.get('game_settings', {}).get('insight_penalty_per_wrong_answer', 5)
    
    if is_correct:
        game_state["character"]["insight"] += insight_gain
    else:
        game_state["character"]["lives"] -= 1
        game_state["character"]["insight"] = max(0, game_state["character"]["insight"] - insight_penalty)
    
    # Check if all nodes are visited - if so, allow proceeding to next floor
    all_visited = all(n["visited"] for n in game_state["nodes"])
    
    return jsonify({
        "correct": is_correct,
        "explanation": question.get('explanation', ''),
        "game_state": game_state,
        "all_nodes_visited": all_visited
    })

@app.route('/api/next-floor', methods=['POST'])
def next_floor():
    """Advance to the next floor"""
    game_state["current_floor"] += 1
    game_state["nodes"] = generate_floor_nodes(game_state["current_floor"])
    
    # Potentially restore some lives when advancing floors
    game_config = load_json_data('game_config.json')
    lives_per_floor = game_config.get('game_settings', {}).get('lives_per_floor', 0)
    
    if lives_per_floor > 0:
        game_state["character"]["lives"] = min(
            game_state["character"]["lives"] + lives_per_floor,
            game_state["character"]["max_lives"]
        )
    
    return jsonify(game_state)

if __name__ == '__main__':
    app.run(debug=True)