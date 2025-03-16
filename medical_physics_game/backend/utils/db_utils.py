"""
Database utilities for the Medical Physics Game.
Provides functions for working with data storage.
"""

import os
import json
import sqlite3
from pathlib import Path

# Determine the base directory for data files
def get_data_path():
    """
    Get the path to the data directory.
    
    Returns:
        str: Path to the data directory
    """
    # Check if we're in the new structure or old structure
    if os.path.exists('data'):
        # New structure - data at project root
        return 'data'
    elif os.path.exists('../data'):
        # New structure - running from subdirectory
        return '../data'
    else:
        # Default to current directory
        return '.'

def get_connection():
    """
    Get a connection to the SQLite database.
    
    Returns:
        sqlite3.Connection: Database connection
    """
    db_path = os.path.join(get_data_path(), 'game_data.db')
    return sqlite3.connect(db_path)

def execute_query(query, params=None):
    """
    Execute a SQL query and return results.
    
    Args:
        query (str): SQL query to execute
        params (tuple, optional): Parameters for the query
        
    Returns:
        list: Query results
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
            
        results = cursor.fetchall()
        conn.commit()
        return results
    finally:
        conn.close()

def read_json_file(file_path):
    """
    Read and parse a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        dict or list: Parsed JSON data
    """
    # Ensure file path is relative to data directory
    if not os.path.isabs(file_path):
        file_path = os.path.join(get_data_path(), file_path)
        
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def write_json_file(file_path, data):
    """
    Write data to a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        data (dict or list): Data to write
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Ensure file path is relative to data directory
    if not os.path.isabs(file_path):
        file_path = os.path.join(get_data_path(), file_path)
        
    # Ensure directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except (IOError, TypeError):
        return False

def ensure_data_dirs():
    """
    Ensure all required data directories exist.
    """
    base_path = get_data_path()
    
    # Create required subdirectories
    directories = [
        'characters',
        'items',
        'maps',
        'questions',
        'skill_tree'
    ]
    
    for directory in directories:
        dir_path = os.path.join(base_path, directory)
        os.makedirs(dir_path, exist_ok=True)
        
    return True
