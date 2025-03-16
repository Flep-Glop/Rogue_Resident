# backend/utils/cache.py
from functools import wraps
from datetime import datetime, timedelta
import hashlib
import json

class Cache:
    """Simple in-memory cache with expiration"""
    
    _cache = {}
    
    @classmethod
    def get(cls, key):
        """Get a value from the cache"""
        if key not in cls._cache:
            return None
            
        entry = cls._cache[key]
        
        # Check expiration
        if entry['expires'] and datetime.now() > entry['expires']:
            del cls._cache[key]
            return None
            
        return entry['value']
        
    @classmethod
    def set(cls, key, value, ttl=None):
        """Set a value in the cache with optional TTL in seconds"""
        expires = None
        if ttl:
            expires = datetime.now() + timedelta(seconds=ttl)
            
        cls._cache[key] = {
            'value': value,
            'expires': expires,
            'created': datetime.now()
        }
        
    @classmethod
    def delete(cls, key):
        """Delete a value from the cache"""
        if key in cls._cache:
            del cls._cache[key]
            return True
        return False
        
    @classmethod
    def clear(cls):
        """Clear all cache entries"""
        cls._cache.clear()
        
    @classmethod
    def has_key(cls, key):
        """Check if a key exists and is not expired"""
        if key not in cls._cache:
            return False
            
        entry = cls._cache[key]
        
        # Check expiration
        if entry['expires'] and datetime.now() > entry['expires']:
            del cls._cache[key]
            return False
            
        return True


# Caching decorator for functions
def cached(ttl=300):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key_parts = [func.__name__]
            key_parts.extend([str(arg) for arg in args])
            
            # Sort kwargs for consistent key generation
            sorted_kwargs = sorted(kwargs.items())
            key_parts.extend([f"{k}={v}" for k, v in sorted_kwargs])
            
            # Create a hash of the key
            key = hashlib.md5(json.dumps(key_parts).encode()).hexdigest()
            
            # Check cache
            cached_value = Cache.get(key)
            if cached_value is not None:
                return cached_value
                
            # Call original function if not cached
            result = func(*args, **kwargs)
            
            # Store result in cache
            Cache.set(key, result, ttl)
            
            return result
        return wrapper
    return decorator