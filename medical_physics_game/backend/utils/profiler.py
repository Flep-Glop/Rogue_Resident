# backend/utils/profiler.py
import time
import functools
import statistics
from datetime import datetime

class PerformanceProfiler:
    """Utility for profiling and monitoring performance"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PerformanceProfiler, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.stats = {}
        self.current_runs = {}
        self._initialized = True
        
    def start_timer(self, name):
        """Start a timer with the given name"""
        self.current_runs[name] = {
            'start_time': time.time(),
            'checkpoints': []
        }
        
    def checkpoint(self, name, checkpoint_name):
        """Record a checkpoint for a running timer"""
        if name not in self.current_runs:
            return False
            
        checkpoint = {
            'name': checkpoint_name,
            'time': time.time() - self.current_runs[name]['start_time']
        }
        
        self.current_runs[name]['checkpoints'].append(checkpoint)
        return True
        
    def stop_timer(self, name):
        """Stop a timer and record its statistics"""
        if name not in self.current_runs:
            return None
            
        end_time = time.time()
        run = self.current_runs[name]
        elapsed = end_time - run['start_time']
        
        if name not in self.stats:
            self.stats[name] = {
                'count': 0,
                'total_time': 0,
                'min_time': float('inf'),
                'max_time': 0,
                'times': [],
                'runs': []
            }
            
        stats = self.stats[name]
        stats['count'] += 1
        stats['total_time'] += elapsed
        stats['min_time'] = min(stats['min_time'], elapsed)
        stats['max_time'] = max(stats['max_time'], elapsed)
        stats['times'].append(elapsed)
        
        run_data = {
            'elapsed': elapsed,
            'checkpoints': run['checkpoints'],
            'timestamp': datetime.now().isoformat()
        }
        
        stats['runs'].append(run_data)
        
        # Keep only the last 100 runs to prevent memory issues
        if len(stats['runs']) > 100:
            stats['runs'].pop(0)
            
        # Keep only the last 1000 times for stats
        if len(stats['times']) > 1000:
            stats['times'].pop(0)
            
        # Remove from current runs
        del self.current_runs[name]
            
        return elapsed
        
    def get_stats(self, name=None):
        """Get performance statistics"""
        if name:
            stats = self.stats.get(name)
            if stats:
                # Calculate additional statistics
                times = stats['times']
                if times:
                    stats['avg_time'] = statistics.mean(times)
                    if len(times) > 1:
                        stats['std_dev'] = statistics.stdev(times)
                    else:
                        stats['std_dev'] = 0
                else:
                    stats['avg_time'] = 0
                    stats['std_dev'] = 0
            return stats
            
        # Return stats for all timers
        result = {}
        for timer_name, timer_stats in self.stats.items():
            result[timer_name] = self.get_stats(timer_name)
        return result
        
    def reset_stats(self, name=None):
        """Reset performance statistics"""
        if name:
            if name in self.stats:
                del self.stats[name]
            return
            
        # Reset all stats
        self.stats = {}


# Profiling decorator
def profile(name=None):
    """Decorator to profile a function"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            profiler = PerformanceProfiler()
            timer_name = name or f"{func.__module__}.{func.__name__}"
            
            profiler.start_timer(timer_name)
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                profiler.stop_timer(timer_name)
        return wrapper
    return decorator