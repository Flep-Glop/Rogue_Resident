import random
import uuid

def generate_floor_layout(floor_number, floor_data):
    """Generate a random floor layout based on floor data"""
    # Determine number of nodes
    min_nodes = floor_data.get('node_count', {}).get('min', 4)
    max_nodes = floor_data.get('node_count', {}).get('max', 6)
    node_count = random.randint(min_nodes, max_nodes)
    
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
    rows = max(1, (node_count + nodes_per_row - 1) // nodes_per_row)  # Ceiling division
    
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
    
    # Create connections between nodes
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
    
    # Add boss if floor has one
    if floor_data.get('boss'):
        boss_row = rows + 1
        boss_data = floor_data.get('boss')
        
        layout["boss"] = {
            "id": "boss",
            "type": "boss",
            "title": boss_data.get('name', 'Chief Medical Physicist'),
            "description": boss_data.get('description', ''),
            "position": {"row": boss_row, "col": 1},
            "difficulty": boss_data.get('difficulty', 3),
            "paths": [],
            "visited": False
        }
        
        # Connect last row nodes to boss
        last_row_nodes = [n for n in layout["nodes"].values() 
                         if n["position"]["row"] == rows]
        
        # Make sure at least one node connects to the boss
        if last_row_nodes:
            # Ensure every last row node connects to the boss
            for node in last_row_nodes:
                node["paths"].append("boss")
    
    # Validate the layout before returning
    if not validate_map(layout):
        print(f"Warning: Generated map for floor {floor_number} has validation issues.")
        # Try to fix unreachable nodes by connecting from start if needed
        allNodes = [layout["start"]] + list(layout["nodes"].values())
        if layout["boss"]:
            allNodes.append(layout["boss"])
        
        # Make additional connections if needed
        for node in allNodes:
            if node["id"] == "start" or node["id"] == "boss":
                continue
            
            is_reachable = False
            for other_node in allNodes:
                if node["id"] != other_node["id"] and "paths" in other_node and node["id"] in other_node["paths"]:
                    is_reachable = True
                    break
            
            # If node is unreachable, connect it from start
            if not is_reachable:
                print(f"Fixing unreachable node {node['id']} by connecting from start")
                layout["start"]["paths"].append(node["id"])
    
    return layout

def determine_node_type(floor_data):
    """Determine a node type based on weights in floor data"""
    node_types = floor_data.get('node_types', {
        "question": {"weight": 60},
        "rest": {"weight": 20},
        "treasure": {"weight": 20}
    })
    
    # Calculate total weight
    total_weight = sum(data.get('weight', 0) for data in node_types.values())
    
    # If no weights, return default
    if total_weight <= 0:
        return "question"
    
    # Pick a random number
    roll = random.randint(1, total_weight)
    
    # Determine node type based on weights
    current_weight = 0
    for node_type, data in node_types.items():
        current_weight += data.get('weight', 0)
        if roll <= current_weight:
            return node_type
    
    # Default fallback
    return "question"

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