# app.py - Flask backend
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Sample game data
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

# Sample questions
questions = {
    "node1": {
        "text": "What is the correction factor for temperature and pressure called in TG-51?",
        "options": ["PTP", "kTP", "CTP", "PTC"],
        "correct": 1,
        "explanation": "kTP is the temperature-pressure correction factor in TG-51."
    }
}

@app.route('/')
def index():
    """Render the main game page"""
    return render_template('index.html')

@app.route('/api/game-state')
def get_game_state():
    """Return the current game state"""
    return jsonify(game_state)

@app.route('/api/node/<node_id>')
def get_node(node_id):
    """Get content for a specific node"""
    # Find the node
    node = next((n for n in game_state["nodes"] if n["id"] == node_id), None)
    
    if not node:
        return jsonify({"error": "Node not found"}), 404
    
    # If it's a question node, add the question data
    if node["type"] == "question":
        node_data = {**node, "question": questions.get(node_id, {})}
    else:
        node_data = node
    
    return jsonify(node_data)

@app.route('/api/answer-question', methods=['POST'])
def answer_question():
    """Process an answer to a question"""
    data = request.json
    node_id = data.get('node_id')
    answer_index = data.get('answer_index')
    
    # Get the question
    question = questions.get(node_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    
    # Check if answer is correct
    is_correct = (answer_index == question["correct"])
    
    # Update game state
    for node in game_state["nodes"]:
        if node["id"] == node_id:
            node["visited"] = True
    
    if is_correct:
        game_state["character"]["insight"] += 10
    else:
        game_state["character"]["lives"] -= 1
    
    return jsonify({
        "correct": is_correct,
        "explanation": question["explanation"],
        "game_state": game_state
    })

if __name__ == '__main__':
    app.run(debug=True)