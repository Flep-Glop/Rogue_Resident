from backend.data.models.node import Node
import json
import os

def get_all_nodes():
    """Retrieve all map nodes from the data store"""
    data_path = os.path.join(os.path.dirname(__file__), '../../../../data/maps/floors.json')
    try:
        with open(data_path, 'r') as f:
            floors_data = json.load(f)
            nodes = []
            for floor in floors_data:
                for node_data in floor.get('nodes', []):
                    nodes.append(Node.from_dict(node_data))
            return nodes
    except FileNotFoundError:
        return []

def get_nodes_by_floor(floor_id):
    """Filter nodes by floor ID"""
    data_path = os.path.join(os.path.dirname(__file__), '../../../../data/maps/floors.json')
    try:
        with open(data_path, 'r') as f:
            floors_data = json.load(f)
            for floor in floors_data:
                if str(floor.get('id')) == str(floor_id):
                    return [Node.from_dict(node_data) for node_data in floor.get('nodes', [])]
    except FileNotFoundError:
        pass
    return []
