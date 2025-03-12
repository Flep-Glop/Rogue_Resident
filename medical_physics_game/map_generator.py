import random
import uuid

def generate_floor_layout(floor_number, floor_data):
    """Generate a random floor layout based on floor data with at least 10 rows"""
    # Determine number of nodes
    min_nodes = floor_data.get('node_count', {}).get('min', 15)  # Increased default minimum
    max_nodes = floor_data.get('node_count', {}).get('max', 25)  # Increased default maximum
    node_count = random.randint(min_nodes, max_nodes)
    
    # IMPORTANT: Set minimum rows to 10
    MIN_ROWS = 10
    
    # Create layout structure
    layout = {
        "start": {
            "id": "start",
            "type": "start",
            "position": {"row": 0, "col": 1},
            "paths": [],
            "visited": True
        },
        "nodes": {},
        "boss": None
    }
    
    # Setup grid parameters
    nodes_per_row = 3  # Fixed number of columns
    
    # Ensure we have at least MIN_ROWS rows
    # Calculate how many nodes we need for MIN_ROWS (excluding start and boss)
    min_required_nodes = (MIN_ROWS - 1) * nodes_per_row
    
    # Adjust node count if needed
    node_count = max(node_count, min_required_nodes)
    
    # Calculate rows based on node count
    rows = max(MIN_ROWS - 1, (node_count + nodes_per_row - 1) // nodes_per_row)
    
    print(f"Generating map with {node_count} nodes across {rows} rows (plus start and boss)")
    
    # Create nodes in a grid pattern
    node_id = 1
    for row in range(1, rows + 1):
        # Calculate how many nodes in this row
        row_nodes = min(nodes_per_row, node_count - (row - 1) * nodes_per_row)
        
        for col in range(row_nodes):
            # Distribute nodes evenly across columns
            if row_nodes == 1:
                pos_col = 1  # Center if only one node
            else:
                pos_col = col * (2.0 / (row_nodes - 1))  # Distribute nodes
            
            node_type = determine_node_type(floor_data)
            node_difficulty = determine_node_difficulty(floor_data, node_type)
            
            # Create the node
            node_id_str = f"node_{node_id}"
            layout["nodes"][node_id_str] = {
                "id": node_id_str,
                "type": node_type,
                "title": get_node_title(node_type),
                "position": {"row": row, "col": pos_col},
                "difficulty": node_difficulty,
                "paths": [],
                "visited": False
            }
            
            # If this is a first row node, connect from start
            if row == 1:
                layout["start"]["paths"].append(node_id_str)
            
            node_id += 1
    
    # Add boss at row MIN_ROWS (after all other rows)
    boss_row = rows + 1
    
    # Get boss data from floor_data or create default
    boss_data = floor_data.get('boss', {
        "name": "Chief Medical Physicist",
        "description": "The final challenge of this floor.",
        "difficulty": min(3, floor_number)
    })
    
    # Always add a boss node at the bottom
    layout["boss"] = {
        "id": "boss",
        "type": "boss",
        "title": boss_data.get('name', 'Boss'),
        "description": boss_data.get('description', ''),
        "position": {"row": boss_row, "col": 1},  # Center the boss
        "difficulty": boss_data.get('difficulty', min(3, floor_number)),
        "paths": [],
        "visited": False
    }
    
    # Create connections between nodes (rows 1 to rows-1)
    for row in range(1, rows):
        # Get nodes in current row
        current_row_nodes = [n for n in layout["nodes"].values() 
                            if n["position"]["row"] == row]
        
        # Get nodes in next row
        next_row_nodes = [n for n in layout["nodes"].values() 
                          if n["position"]["row"] == row + 1]
        
        if not next_row_nodes:
            continue  # Skip if no nodes in next row
        
        # Connect each node in current row to at least one node in next row
        for node in current_row_nodes:
            # Determine number of connections (1-2)
            connections_count = random.randint(1, min(2, len(next_row_nodes)))
            
            # Sort next row nodes by column proximity for more natural paths
            sorted_next_nodes = sorted(next_row_nodes, 
                key=lambda n: abs(n["position"]["col"] - node["position"]["col"]))
            
            # Connect to the closest nodes
            for target_node in sorted_next_nodes[:connections_count]:
                # Add path if not already connected
                if target_node["id"] not in node["paths"]:
                    node["paths"].append(target_node["id"])
    
    # Connect last row nodes to boss
    last_row_nodes = [n for n in layout["nodes"].values() 
                     if n["position"]["row"] == rows]
    
    # Make sure at least one node connects to the boss
    if last_row_nodes:
        for node in last_row_nodes:
            node["paths"].append("boss")
    
    return layout

# Update the determine_node_type function:
def determine_node_type(floor_data):
    """Determine a node type based on weights in floor data"""
    # Get default weights from configuration
    default_weights = get_node_type_weights()
    
    # Override with floor-specific weights if provided
    node_types = floor_data.get('node_types', {})
    
    # Build combined weights
    weights = {}
    for node_type, weight in default_weights.items():
        # Use floor weight if specified, otherwise use default
        weights[node_type] = node_types.get(node_type, {}).get('weight', weight)
    
    # Calculate total weight
    total_weight = sum(weights.values())
    
    # If no weights, return default
    if total_weight <= 0:
        return "question"
    
    # Pick a random number
    roll = random.randint(1, total_weight)
    
    # Determine node type based on weights
    current_weight = 0
    for node_type, weight in weights.items():
        current_weight += weight
        if roll <= current_weight:
            return node_type
    
    # Default fallback
    return "question"

# Import node type weights from JavaScript registry
def get_node_type_weights():
    """Get node type weights from configuration"""
    return {
        "question": 60,
        "elite": 15,
        "treasure": 20,
        "rest": 15,
        "event": 15,
        "patient_case": 25,
        "shop": 10,
        "gamble": 10
    }

def determine_node_difficulty(floor_data, node_type):
    """Determine difficulty for a node based on floor data"""
    # Get difficulty range for node type
    difficulty_range = floor_data.get('node_types', {}).get(node_type, {}).get('difficulty_range', [1, 1])
    
    # Get min and max difficulty, defaulting to 1 if not specified
    min_difficulty = difficulty_range[0] if len(difficulty_range) > 0 else 1
    max_difficulty = difficulty_range[1] if len(difficulty_range) > 1 else min_difficulty
    
    # Get random difficulty in range
    return random.randint(min_difficulty, max_difficulty)

def get_node_title(node_type):
    """Get a descriptive title for a node based on its type"""
    titles = {
        "start": "Starting Point",
        "question": "Physics Question",
        "elite": "Challenging Question",
        "boss": "Final Assessment",
        "patient_case": "Patient Case",
        "treasure": "Equipment Found",
        "rest": "Break Room",
        "shop": "Department Store",
        "event": "Random Event",
        "gamble": "Research Opportunity"
    }
    
    return titles.get(node_type, "Unknown Node")

def validate_map(layout):
    """Validate a generated map to ensure all nodes are reachable"""
    # Check if layout is valid
    if not layout or not isinstance(layout, dict):
        return False
    
    # Check if start node exists
    if "start" not in layout:
        return False
    
    # Check if nodes exist
    if "nodes" not in layout or not layout["nodes"]:
        return False
    
    # Check if all nodes are reachable from start
    reachable = set(["start"])
    new_nodes = True
    
    # Keep exploring until no new nodes are found
    while new_nodes:
        new_nodes = False
        for node_id in list(reachable):
            # Get the node
            node = None
            if node_id == "start":
                node = layout["start"]
            elif node_id == "boss" and "boss" in layout:
                node = layout["boss"]
            elif node_id in layout["nodes"]:
                node = layout["nodes"][node_id]
            
            # If node not found, skip
            if not node:
                continue
            
            # Check paths from this node
            for path in node.get("paths", []):
                if path not in reachable:
                    reachable.add(path)
                    new_nodes = True
    
    # Check if all nodes are reachable
    all_nodes = set(["start"] + list(layout["nodes"].keys()))
    if "boss" in layout:
        all_nodes.add("boss")
    
    return all_nodes.issubset(reachable)