# db_utils.py - Database utility functions
import sqlite3
import json
from datetime import datetime

def save_game_state(game_id, state):
    """Save a game state to the database"""
    try:
        conn = sqlite3.connect('game_data.db')
        c = conn.cursor()
        c.execute(
            "INSERT OR REPLACE INTO game_states VALUES (?, ?, ?)",
            (game_id, json.dumps(state), datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving game state: {e}")
        return False

def load_game_state(game_id):
    """Load a game state from the database"""
    try:
        conn = sqlite3.connect('game_data.db')
        c = conn.cursor()
        c.execute("SELECT game_state FROM game_states WHERE game_id = ?", (game_id,))
        result = c.fetchone()
        conn.close()
        
        if result:
            return json.loads(result[0])
        return None
    except Exception as e:
        print(f"Error loading game state: {e}")
        return None

def delete_game_state(game_id):
    """Delete a game state from the database"""
    try:
        conn = sqlite3.connect('game_data.db')
        c = conn.cursor()
        c.execute("DELETE FROM game_states WHERE game_id = ?", (game_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error deleting game state: {e}")
        return False

def get_all_game_states():
    """Get all game states from the database"""
    try:
        conn = sqlite3.connect('game_data.db')
        c = conn.cursor()
        c.execute("SELECT game_id, game_state, last_updated FROM game_states")
        results = c.fetchall()
        conn.close()
        
        game_states = []
        for game_id, game_state, last_updated in results:
            game_states.append({
                "game_id": game_id,
                "game_state": json.loads(game_state),
                "last_updated": last_updated
            })
        
        return game_states
    except Exception as e:
        print(f"Error getting all game states: {e}")
        return []