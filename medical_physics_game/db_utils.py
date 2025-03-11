import sqlite3
import json
from datetime import datetime
import os
import traceback

def save_game_state(game_id, state):
    """Save a game state to the database"""
    try:
        # Ensure the directory exists for the database
        db_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(db_dir, 'game_data.db')
        
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Make sure the table exists
        c.execute('''
        CREATE TABLE IF NOT EXISTS game_states
        (game_id TEXT PRIMARY KEY, game_state TEXT, last_updated TEXT)
        ''')
        
        # Handle None values by setting default empty JSON object
        game_state_json = json.dumps(state or {})
        
        # Update or insert the game state
        c.execute(
            "INSERT OR REPLACE INTO game_states VALUES (?, ?, ?)",
            (game_id, game_state_json, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving game state: {e}")
        print(traceback.format_exc())
        return False

def load_game_state(game_id):
    """Load a game state from the database"""
    try:
        # Ensure the directory exists for the database
        db_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(db_dir, 'game_data.db')
        
        # Check if database exists
        if not os.path.exists(db_path):
            print(f"Database file not found: {db_path}")
            return None
        
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Make sure the table exists
        c.execute('''
        CREATE TABLE IF NOT EXISTS game_states
        (game_id TEXT PRIMARY KEY, game_state TEXT, last_updated TEXT)
        ''')
        
        c.execute("SELECT game_state FROM game_states WHERE game_id = ?", (game_id,))
        result = c.fetchone()
        conn.close()
        
        if result:
            try:
                return json.loads(result[0])
            except json.JSONDecodeError as e:
                print(f"Error decoding game state JSON: {e}")
                return None
        return None
    except Exception as e:
        print(f"Error loading game state: {e}")
        print(traceback.format_exc())
        return None

def delete_game_state(game_id):
    """Delete a game state from the database"""
    try:
        # Ensure the directory exists for the database
        db_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(db_dir, 'game_data.db')
        
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("DELETE FROM game_states WHERE game_id = ?", (game_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error deleting game state: {e}")
        print(traceback.format_exc())
        return False

def get_all_game_states():
    """Get all game states from the database"""
    try:
        # Ensure the directory exists for the database
        db_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(db_dir, 'game_data.db')
        
        # Check if database exists
        if not os.path.exists(db_path):
            print(f"Database file not found: {db_path}")
            return []
        
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Make sure the table exists
        c.execute('''
        CREATE TABLE IF NOT EXISTS game_states
        (game_id TEXT PRIMARY KEY, game_state TEXT, last_updated TEXT)
        ''')
        
        c.execute("SELECT game_id, game_state, last_updated FROM game_states")
        results = c.fetchall()
        conn.close()
        
        game_states = []
        for game_id, game_state, last_updated in results:
            try:
                game_states.append({
                    "game_id": game_id,
                    "game_state": json.loads(game_state),
                    "last_updated": last_updated
                })
            except json.JSONDecodeError as e:
                print(f"Error decoding game state for {game_id}: {e}")
                continue
        
        return game_states
    except Exception as e:
        print(f"Error getting all game states: {e}")
        print(traceback.format_exc())
        return []