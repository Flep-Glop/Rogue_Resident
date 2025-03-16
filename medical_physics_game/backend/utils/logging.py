# backend/utils/logging.py
import logging
import os
import json
from datetime import datetime
import inspect
import traceback

class GameLogger:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GameLogger, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.loggers = {}
        self.log_dir = os.path.join(os.path.dirname(__file__), '../../logs')
        
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
            
        # Set up default logger
        self.setup_logger('app', os.path.join(self.log_dir, 'app.log'))
        self.setup_logger('api', os.path.join(self.log_dir, 'api.log'))
        self.setup_logger('error', os.path.join(self.log_dir, 'error.log'))
        self.setup_logger('game', os.path.join(self.log_dir, 'game.log'))
        
        self._initialized = True
        
    def setup_logger(self, name, log_file, level=logging.INFO):
        """Set up a logger with a specific file handler"""
        logger = logging.getLogger(name)
        logger.setLevel(level)
        
        # Create handler
        handler = logging.FileHandler(log_file)
        handler.setLevel(level)
        
        # Create formatter
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
        handler.setFormatter(formatter)
        
        # Add handler to logger
        logger.addHandler(handler)
        
        # Store logger
        self.loggers[name] = logger
        
        return logger
        
    def get_logger(self, name='app'):
        """Get a logger by name"""
        return self.loggers.get(name)
        
    def log(self, message, level=logging.INFO, logger_name='app', include_caller=False):
        """Log a message with the specified logger"""
        logger = self.get_logger(logger_name)
        
        if not logger:
            return False
            
        if include_caller:
            # Get caller information
            caller_frame = inspect.currentframe().f_back
            caller_info = inspect.getframeinfo(caller_frame)
            
            message = f"{caller_info.filename}:{caller_info.lineno} in {caller_info.function} - {message}"
            
        logger.log(level, message)
        return True
        
    def info(self, message, logger_name='app', include_caller=False):
        """Log an info message"""
        return self.log(message, logging.INFO, logger_name, include_caller)
        
    def warning(self, message, logger_name='app', include_caller=False):
        """Log a warning message"""
        return self.log(message, logging.WARNING, logger_name, include_caller)
        
    def error(self, message, logger_name='error', include_caller=True, exc_info=None):
        """Log an error message"""
        if exc_info:
            message = f"{message}\n{traceback.format_exc()}"
            
        return self.log(message, logging.ERROR, logger_name, include_caller)
        
    def critical(self, message, logger_name='error', include_caller=True, exc_info=None):
        """Log a critical message"""
        if exc_info:
            message = f"{message}\n{traceback.format_exc()}"
            
        return self.log(message, logging.CRITICAL, logger_name, include_caller)
        
    def log_api_request(self, request, response=None, error=None):
        """Log an API request"""
        logger = self.get_logger('api')
        
        if not logger:
            return False
            
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'method': request.method,
            'path': request.path,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', '')
        }
        
        if response:
            log_data['status_code'] = response.status_code
            
        if error:
            log_data['error'] = str(error)
            
        logger.info(json.dumps(log_data))
        return True
        
    def log_game_event(self, user_id, event_type, event_data=None):
        """Log a game event"""
        logger = self.get_logger('game')
        
        if not logger:
            return False
            
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'event_type': event_type
        }
        
        if event_data:
            log_data['event_data'] = event_data
            
        logger.info(json.dumps(log_data))
        return True