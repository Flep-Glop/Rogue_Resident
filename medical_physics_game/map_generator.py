# map_generator.py - Map generation logic
import random

# Map generation parameters
MAP_CONFIG = {
    "nodesPerRow": 3,    # Number of nodes horizontally
    "rowCount": 5,       # Number of rows (excluding start/boss)
    "branchFactor": 2    # How many paths forward each node can have
}

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