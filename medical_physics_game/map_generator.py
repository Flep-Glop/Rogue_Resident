import random
import uuid

def generate_floor_layout(floor_number, floor_data):
    """Generate a diamond-shaped floor layout based on floor data with at least 10 rows"""
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
    
    # Setup grid parameters with diamond-shaped architecture
    # Maximum nodes per row will be higher in the middle rows
    max_nodes_middle = 5  # Maximum number of nodes in the middle row
    
    # Calculate the total number of rows needed (excluding start and boss)
    # Ensure we have at least MIN_ROWS rows
    rows = max(MIN_ROWS, (node_count + max_nodes_middle - 1) // max_nodes_middle)
    
    # Adjust node count if needed to ensure proper distribution
    node_count = max(node_count, rows)  # Ensure at least one node per row
    
    print(f"Generating diamond-shaped map with {node_count} nodes across {rows} rows (plus start and boss)")
    
    # Calculate nodes per row in diamond pattern
    nodes_per_row = []
    
    # First half - increasing node count
    first_half = rows // 2 + rows % 2  # Ceiling division for odd number of rows
    for i in range(first_half):
        # Linear increase from 1 to max_nodes_middle
        node_count_in_row = 1 + (i * (max_nodes_middle - 1)) // (first_half - 1) if first_half > 1 else 1
        nodes_per_row.append(node_count_in_row)
    
    # Second half - decreasing node count
    second_half = rows // 2
    for i in range(second_half):
        # Linear decrease from max_nodes_middle-1 to 1
        node_count_in_row = max(1, max_nodes_middle - (i + 1) * (max_nodes_middle - 1) // second_half if second_half > 0 else 0)
        nodes_per_row.append(node_count_in_row)
    
    # Create nodes in a diamond pattern
    node_id = 1
    
    # Keep track of created nodes by row for connection logic
    nodes_by_row = {}
    
    for row in range(1, rows + 1):
        # Get number of nodes for this row from our calculated pattern
        row_nodes = nodes_per_row[row - 1]
        nodes_by_row[row] = []
        
        for col in range(row_nodes):
            # Distribute nodes evenly across columns
            if row_nodes == 1:
                pos_col = 1  # Center if only one node
            else:
                # Map to 0-2 range for uniform distribution
                pos_col = col * (2.0 / (row_nodes - 1)) if row_nodes > 1 else 1
            
            node_type = determine_node_type(floor_data)
            node_difficulty = determine_node_difficulty(floor_data, node_type)
            
            # Create the node
            node_id_str = f"node_{node_id}"
            
            # Store the node in layout and tracking dict
            layout["nodes"][node_id_str] = {
                "id": node_id_str,
                "type": node_type,
                "title": get_node_title(node_type),
                "position": {"row": row, "col": pos_col},
                "difficulty": node_difficulty,
                "paths": [],
                "visited": False
            }
            
            # Track node by row for easier connection logic
            nodes_by_row[row].append(node_id_str)
            
            # If this is a first row node, connect from start
            if row == 1:
                layout["start"]["paths"].append(node_id_str)
            
            node_id += 1
    
    # Add boss at row rows + 1 (after all other rows)
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
    
    # Create diamond-pattern connections between nodes
    for row in range(1, rows):
        current_row_node_ids = nodes_by_row[row]
        next_row_node_ids = nodes_by_row[row + 1]
        
        if not next_row_node_ids:
            continue  # Skip if no nodes in next row
        
        # For diamond pattern, we want to create interesting connections
        # Each node should connect to 1-2 nodes in the next row
        for i, node_id_str in enumerate(current_row_node_ids):
            node = layout["nodes"][node_id_str]
            
            # Determine number of connections (1-2)
            # More nodes in current row should have fewer connections each to prevent overcrowding
            max_connections = 2 if len(current_row_node_ids) <= 3 else 1
            connections_count = random.randint(1, min(max_connections, len(next_row_node_ids)))
            
            # Determine which nodes to connect to
            # For diamond pattern, prefer connecting to nodes with similar relative position
            target_indices = []
            
            # Calculate relative position of this node in its row (0.0 to 1.0)
            if len(current_row_node_ids) > 1:
                rel_pos = i / (len(current_row_node_ids) - 1)
            else:
                rel_pos = 0.5
            
            # Find nodes in next row with closest relative positions
            if len(next_row_node_ids) > 1:
                target_indices = sorted(range(len(next_row_node_ids)), 
                                       key=lambda j: abs(j / (len(next_row_node_ids) - 1) - rel_pos))
            else:
                target_indices = [0]
            
            # Take the closest N nodes
            target_indices = target_indices[:connections_count]
            
            # Create connections
            for idx in target_indices:
                target_id = next_row_node_ids[idx]
                if target_id not in node["paths"]:
                    node["paths"].append(target_id)
            
            # Add occasional cross-connections for more interesting paths
            # 20% chance to add an extra connection to another random node
            if len(next_row_node_ids) > 2 and random.random() < 0.2:
                # Get a random node that's not already connected
                available_targets = [nid for nid in next_row_node_ids if nid not in node["paths"]]
                if available_targets:
                    random_target = random.choice(available_targets)
                    node["paths"].append(random_target)
    
    # Connect last row nodes to boss
    last_row_node_ids = nodes_by_row[rows]
    
    # Make sure at least one node connects to the boss
    if last_row_node_ids:
        # For diamond pattern, preferably connect nodes from the center
        center_nodes = last_row_node_ids
        if len(last_row_node_ids) > 2:
            # Get the middle third of nodes
            start = len(last_row_node_ids) // 3
            end = len(last_row_node_ids) - start
            center_nodes = last_row_node_ids[start:end]
        
        # Connect all center nodes to boss
        for node_id_str in center_nodes:
            node = layout["nodes"][node_id_str]
            node["paths"].append("boss")
        
        # If we only connected one node, add another random connection for redundancy
        if len(center_nodes) == 1 and len(last_row_node_ids) > 1:
            other_nodes = [nid for nid in last_row_node_ids if nid != center_nodes[0]]
            random_node_id = random.choice(other_nodes)
            layout["nodes"][random_node_id]["paths"].append("boss")
    
    # Verify that the map is valid
    if not validate_map(layout):
        print("WARNING: Generated map is not fully connected! Regenerating...")
        return generate_floor_layout(floor_number, floor_data)
    
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

def get_node_type_weights():
    """Get node type weights from configuration"""
    return {
        "question": 100,  # Question nodes are most common
        "elite": 20,      # Increased elite nodes for more challenge
        "treasure": 40,   # More treasures in diamond layout
        "rest": 30,       # More rest nodes for longer runs
        "event": 35,      # More events for variety
        "patient_case": 25,
        "shop": 20,
        "gamble": 15
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