#!/usr/bin/env python3
"""
Map and Node Creator Tool for Medical Physics Game

This tool helps design and balance the game's map generation following
the guidelines from Developer Guide 3. It allows creators to:
1. Create node templates with various types and effects
2. Define floor themes and node distributions
3. Create event pools with choices and consequences
"""

import json
import os
import random
import uuid
from datetime import datetime

# Node types based on Developer Guide 3
NODE_TYPES = [
    "question", 
    "patient_case",
    "elite",
    "rest",
    "event",
    "treasure",
    "shop",
    "boss"
]

# Floor themes
FLOOR_THEMES = [
    "hospital_floor",
    "research_lab",
    "conference",
    "emergency_room",
    "outpatient_clinic",
    "radiation_therapy_center"
]

def create_node_template():
    """Create a new node template following the structured format"""
    node = {
        "id": f"node_{uuid.uuid4().hex[:8]}",
        "type": "question",
        "name": "",
        "description": "",
        "icon": "default_node.png",
        "difficulty": 1,
        "effects": [],
        "rewards": [],
        "requirements": [],
        "created_at": datetime.now().isoformat(),
    }
    
    print("\n=== New Node Template Creation ===")
    
    # Node name and description
    node["name"] = input("Node name: ")
    node["description"] = input("Node description: ")
    
    # Node type
    print("\nNode types:")
    for i, node_type in enumerate(NODE_TYPES):
        print(f"{i+1}. {node_type}")
    
    while True:
        try:
            type_choice = int(input("Select node type (1-8): "))
            if 1 <= type_choice <= 8:
                node["type"] = NODE_TYPES[type_choice - 1]
                break
            else:
                print("Please enter a number between 1 and 8.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Icon
    node["icon"] = input(f"\nIcon filename (default: {node['icon']}): ") or node["icon"]
    
    # Difficulty
    while True:
        try:
            difficulty = int(input("\nDifficulty level (1-5): "))
            if 1 <= difficulty <= 5:
                node["difficulty"] = difficulty
                break
            else:
                print("Please enter a number between 1 and 5.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Effects
    print("\nAdd effects (blank line to finish):")
    while True:
        effect_type = input("Effect type (e.g., 'heal', 'damage', 'buff'): ")
        if not effect_type:
            break
        
        while True:
            try:
                effect_value = input("Effect value: ")
                # Try to convert to int or float if possible
                try:
                    effect_value = int(effect_value)
                except ValueError:
                    try:
                        effect_value = float(effect_value)
                    except ValueError:
                        pass  # Keep as string if not a number
                
                effect = {
                    "type": effect_type,
                    "value": effect_value
                }
                
                node["effects"].append(effect)
                break
            except ValueError:
                print("Please enter a valid value.")
    
    # Rewards
    print("\nAdd rewards (blank line to finish):")
    while True:
        reward_type = input("Reward type (e.g., 'item', 'skill_point', 'reputation'): ")
        if not reward_type:
            break
        
        while True:
            try:
                reward_value = input("Reward value: ")
                # Try to convert to int or float if possible
                try:
                    reward_value = int(reward_value)
                except ValueError:
                    try:
                        reward_value = float(reward_value)
                    except ValueError:
                        pass  # Keep as string if not a number
                
                reward = {
                    "type": reward_type,
                    "value": reward_value
                }
                
                node["rewards"].append(reward)
                break
            except ValueError:
                print("Please enter a valid value.")
    
    # Requirements (for conditional nodes)
    if input("\nAdd requirements? (y/n): ").lower() == 'y':
        print("Add requirements (blank line to finish):")
        while True:
            req_type = input("Requirement type (e.g., 'skill', 'item', 'reputation'): ")
            if not req_type:
                break
            
            req_value = input("Requirement value: ")
            
            requirement = {
                "type": req_type,
                "value": req_value
            }
            
            node["requirements"].append(requirement)
    
    # Add type-specific fields based on node type
    if node["type"] == "question":
        node["question_filter"] = {
            "categories": [],
            "difficulty": []
        }
        
        print("\nAdd question categories (comma-separated, e.g., radiation_physics,dosimetry): ")
        categories = input().split(',')
        node["question_filter"]["categories"] = [c.strip() for c in categories if c.strip()]
        
        print("\nAdd question difficulties (comma-separated, e.g., beginner,intermediate): ")
        difficulties = input().split(',')
        node["question_filter"]["difficulty"] = [d.strip() for d in difficulties if d.strip()]
    
    elif node["type"] == "event":
        node["event_id"] = input("\nEvent ID (leave blank for random): ")
    
    elif node["type"] == "boss":
        node["boss_type"] = input("\nBoss type: ")
        while True:
            try:
                node["boss_difficulty"] = int(input("Boss difficulty (1-5): "))
                if 1 <= node["boss_difficulty"] <= 5:
                    break
                else:
                    print("Please enter a number between 1 and 5.")
            except ValueError:
                print("Please enter a valid number.")
    
    return node

def create_event():
    """Create a new event with choices and consequences"""
    event = {
        "id": f"event_{uuid.uuid4().hex[:8]}",
        "title": "",
        "description": "",
        "options": [],
        "created_at": datetime.now().isoformat()
    }
    
    print("\n=== New Event Creation ===")
    
    # Event title and description
    event["title"] = input("Event title: ")
    event["description"] = input("Event description: ")
    
    # Options
    print("\nAdd options (at least 2 required):")
    option_count = 0
    
    while option_count < 2 or input(f"Add another option? (y/n, {option_count} so far): ").lower() == 'y':
        option = {
            "text": "",
            "effects": [],
            "result": ""
        }
        
        option["text"] = input("\nOption text: ")
        
        # Effects
        print("Add effects (blank line to finish):")
        while True:
            effect_type = input("Effect type (e.g., 'reputation', 'energy', 'skill_points'): ")
            if not effect_type:
                break
            
            while True:
                try:
                    effect_value = int(input("Effect value (can be negative): "))
                    effect = {
                        "type": effect_type,
                        "value": effect_value
                    }
                    
                    option["effects"].append(effect)
                    break
                except ValueError:
                    print("Please enter a valid number.")
        
        option["result"] = input("Result text (displayed after choosing this option): ")
        
        event["options"].append(option)
        option_count += 1
    
    return event

def create_floor_config():
    """Create a floor configuration with theme and node distribution"""
    floor_config = {
        "id": f"floor_{uuid.uuid4().hex[:8]}",
        "name": "",
        "theme": "",
        "min_nodes": 15,
        "max_nodes": 20,
        "node_distribution": {
            "question": 40,
            "patient_case": 20,
            "elite": 10,
            "rest": 10,
            "event": 15,
            "treasure": 5,
            "shop": 0,
            "boss": 0
        },
        "special_nodes": [],
        "created_at": datetime.now().isoformat()
    }
    
    print("\n=== New Floor Configuration ===")
    
    # Floor name
    floor_config["name"] = input("Floor name: ")
    
    # Theme
    print("\nFloor themes:")
    for i, theme in enumerate(FLOOR_THEMES):
        print(f"{i+1}. {theme}")
    
    while True:
        try:
            theme_choice = int(input("Select theme (1-6): "))
            if 1 <= theme_choice <= 6:
                floor_config["theme"] = FLOOR_THEMES[theme_choice - 1]
                break
            else:
                print("Please enter a number between 1 and 6.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Node count
    while True:
        try:
            min_nodes = int(input("\nMinimum number of nodes: "))
            max_nodes = int(input("Maximum number of nodes: "))
            
            if min_nodes > 0 and max_nodes >= min_nodes:
                floor_config["min_nodes"] = min_nodes
                floor_config["max_nodes"] = max_nodes
                break
            else:
                print("Min nodes must be positive and max nodes must be >= min nodes.")
        except ValueError:
            print("Please enter valid numbers.")
    
    # Node distribution
    print("\nNode type distribution (percentages, should sum to 100):")
    total_percentage = 0
    
    for node_type in NODE_TYPES:
        if node_type == "boss":
            # Boss is always 0 for regular floors
            floor_config["node_distribution"]["boss"] = 0
            continue
            
        while True:
            try:
                percentage = int(input(f"Percentage for {node_type}: "))
                if percentage >= 0:
                    floor_config["node_distribution"][node_type] = percentage
                    total_percentage += percentage
                    break
                else:
                    print("Percentage cannot be negative.")
            except ValueError:
                print("Please enter a valid number.")
    
    # Validate total
    if total_percentage != 100:
        print(f"\nWarning: Node distribution percentages sum to {total_percentage}, not 100.")
        if input("Normalize percentages? (y/n): ").lower() == 'y':
            factor = 100 / total_percentage
            for node_type in NODE_TYPES:
                if node_type != "boss":
                    floor_config["node_distribution"][node_type] = round(floor_config["node_distribution"][node_type] * factor)
    
    # Special nodes
    if input("\nAdd special nodes? (y/n): ").lower() == 'y':
        print("Add special nodes (blank line to finish):")
        while True:
            node_name = input("Special node name: ")
            if not node_name:
                break
            
            node_type = input("Node type: ")
            node_description = input("Description: ")
            
            node = {
                "name": node_name,
                "type": node_type,
                "description": node_description,
                "chance": int(input("Chance of appearing (percentage): "))
            }
            
            floor_config["special_nodes"].append(node)
    
    return floor_config

def save_node_template(node):
    """Save a node template to the node templates data file"""
    file_path = "../../data/maps/node_templates.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Load existing templates
    templates = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                templates = json.load(f)
        except json.JSONDecodeError:
            templates = []
    
    # Add new template
    templates.append(node)
    
    # Save updated templates
    with open(file_path, 'w') as f:
        json.dump(templates, f, indent=2)
    
    print(f"\nNode template saved to {file_path}")

def save_event(event):
    """Save an event to the events data file"""
    file_path = "../../data/maps/events.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Load existing events
    events = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                events = json.load(f)
        except json.JSONDecodeError:
            events = []
    
    # Add new event
    events.append(event)
    
    # Save updated events
    with open(file_path, 'w') as f:
        json.dump(events, f, indent=2)
    
    print(f"\nEvent saved to {file_path}")

def save_floor_config(floor_config):
    """Save a floor configuration to the floors data file"""
    file_path = "../../data/maps/floors.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Load existing configs
    configs = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                configs = json.load(f)
        except json.JSONDecodeError:
            configs = []
    
    # Add new config
    configs.append(floor_config)
    
    # Save updated configs
    with open(file_path, 'w') as f:
        json.dump(configs, f, indent=2)
    
    print(f"\nFloor configuration saved to {file_path}")

def main():
    print("=== Medical Physics Game Map and Node Creator ===")
    print("This tool helps create and balance game content.")
    
    while True:
        print("\nChoose an option:")
        print("1. Create a new node template")
        print("2. Create a new event")
        print("3. Create a floor configuration")
        print("4. Exit")
        
        choice = input("\nChoice: ")
        
        if choice == "1":
            node = create_node_template()
            save_node_template(node)
        elif choice == "2":
            event = create_event()
            save_event(event)
        elif choice == "3":
            floor_config = create_floor_config()
            save_floor_config(floor_config)
        elif choice == "4":
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()