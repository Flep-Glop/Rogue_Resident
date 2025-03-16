"""
Development configuration for the Medical Physics Game.
"""

# Flask application settings
DEBUG = True
TESTING = False
SECRET_KEY = 'dev-secret-key-change-me-in-production'
SESSION_TYPE = 'filesystem'

# Application paths
STATIC_FOLDER = 'frontend/static'
TEMPLATE_FOLDER = 'frontend/templates'

# Data settings
DATABASE_PATH = 'data'
DATA_FORMAT = 'json'  # 'json' or 'sqlite'

# Game settings
DEFAULT_FLOOR = 1
MAX_FLOORS = 5
MAX_HEALTH = 100
STARTING_REPUTATION = 50

# Logging
LOG_LEVEL = 'DEBUG'
LOG_FILE = 'logs/development.log'

# Authentication (for admin features)
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'password'  # Change this in production!
