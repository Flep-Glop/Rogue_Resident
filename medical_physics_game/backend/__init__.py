"""
Backend package initialization.
This module initializes the backend components of the Medical Physics Game.
"""

import os
import sys

# Add the project root directory to the path to enable absolute imports
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

# Import key components for easier access
from backend.core.state_manager import get_game_state
from backend.utils.db_utils import get_data_path, ensure_data_dirs

# Ensure data directories exist on import
ensure_data_dirs()
