import time
import json
from datetime import datetime

class Analytics:
    def __init__(self, user_id=None):
        self.user_id = user_id
        self.events = []
        
    def track_event(self, event_type, event_data=None):
        """Track a user event"""
        event = {
            'type': event_type,
            'data': event_data or {},
            'timestamp': datetime.now().isoformat(),
            'user_id': self.user_id
        }
        
        self.events.append(event)
        self._store_event(event)
        
    def _store_event(self, event):
        """Store event in database or log file"""
        # Placeholder for actual repository call
        # from backend.data.repositories.analytics_repo import AnalyticsRepository
        # AnalyticsRepository.add_event(event)
        print(f"Analytics event: {event['type']} - User: {event['user_id']}")
        
    def track_page_view(self, page, referrer=None, time_on_page=None):
        """Track a page view"""
        self.track_event('page_view', {
            'page': page,
            'referrer': referrer,
            'time_on_page': time_on_page
        })
        
    def track_feature_usage(self, feature, action=None):
        """Track feature usage"""
        self.track_event('feature_usage', {
            'feature': feature,
            'action': action
        })
        
    def track_error(self, error_type, error_message, stack_trace=None):
        """Track an error"""
        self.track_event('error', {
            'type': error_type,
            'message': error_message,
            'stack_trace': stack_trace
        })
        
    def track_performance(self, operation, duration_ms):
        """Track operation performance"""
        self.track_event('performance', {
            'operation': operation,
            'duration_ms': duration_ms
        })

class SessionTimer:
    def __init__(self, analytics, page=None):
        self.analytics = analytics
        self.page = page
        self.start_time = None
        
    def start(self, page=None):
        """Start timing a page view"""
        if page:
            self.page = page
        self.start_time = time.time()
        
    def stop(self):
        """Stop timing and track the page view"""
        if not self.start_time or not self.page:
            return
            
        duration = int((time.time() - self.start_time) * 1000)  # Convert to ms
        self.analytics.track_page_view(self.page, time_on_page=duration)
        self.start_time = None
