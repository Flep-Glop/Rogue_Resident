/**
 * Client-side analytics tracking
 */
class AnalyticsClient {
  constructor() {
    this.userId = null;
    this.sessionId = this._generateSessionId();
    this.startTime = Date.now();
    this.pageViewTimers = {};
    
    // Auto-track page views
    this._setupPageViewTracking();
  }
  
  /**
   * Initialize the analytics client
   * @param {string} userId - User ID for authenticated users
   */
  initialize(userId = null) {
    this.userId = userId;
    this.trackEvent('session_start', {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Track a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} eventData - Additional event data
   */
  trackEvent(eventName, eventData = {}) {
    const event = {
      event: eventName,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      data: eventData,
      page: window.location.pathname
    };
    
    this._sendToServer('/api/analytics/event', event);
  }
  
  /**
   * Track a page view
   * @param {string} page - Page URL path
   * @param {number} timeSpentMs - Time spent on page in milliseconds
   */
  trackPageView(page, timeSpentMs = null) {
    const pageViewData = {
      page,
      referrer: document.referrer,
      timeSpentMs
    };
    
    this.trackEvent('page_view', pageViewData);
  }
  
  /**
   * Start timing how long a user spends on a page
   * @param {string} page - Page identifier
   */
  startPageViewTimer(page = null) {
    const pageId = page || window.location.pathname;
    this.pageViewTimers[pageId] = Date.now();
  }
  
  /**
   * Stop timing a page view and track the result
   * @param {string} page - Page identifier
   */
  stopPageViewTimer(page = null) {
    const pageId = page || window.location.pathname;
    if (!this.pageViewTimers[pageId]) return;
    
    const startTime = this.pageViewTimers[pageId];
    const timeSpentMs = Date.now() - startTime;
    
    delete this.pageViewTimers[pageId];
    this.trackPageView(pageId, timeSpentMs);
  }
  
  /**
   * Track an error
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   * @param {string} stackTrace - Stack trace (optional)
   */
  trackError(errorType, errorMessage, stackTrace = null) {
    this.trackEvent('error', {
      type: errorType,
      message: errorMessage,
      stackTrace: stackTrace,
      url: window.location.href
    });
  }
  
  /**
   * Track feature usage
   * @param {string} feature - Feature name
   * @param {string} action - Action performed with the feature
   */
  trackFeatureUsage(feature, action = 'used') {
    this.trackEvent('feature_usage', {
      feature,
      action
    });
  }
  
  /**
   * Generate a random session ID
   * @returns {string} - Generated session ID
   */
  _generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Set up automatic page view tracking
   */
  _setupPageViewTracking() {
    // Track initial page view
    this.startPageViewTimer();
    
    // Track when page is changed (e.g., SPA navigation)
    window.addEventListener('popstate', () => {
      this.stopPageViewTimer();
      this.startPageViewTimer();
    });
    
    // Track when user leaves the page
    window.addEventListener('beforeunload', () => {
      this.stopPageViewTimer();
      
      // Track session duration
      const sessionDurationMs = Date.now() - this.startTime;
      this.trackEvent('session_end', {
        durationMs: sessionDurationMs
      });
    });
  }
  
  /**
   * Send analytics data to the server
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Data to send
   */
  _sendToServer(endpoint, data) {
    // For development, just log to console
    console.log('Analytics:', data);
    
    // In production, send to server
    if (process.env.NODE_ENV === 'production') {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        // Use sendBeacon for events during page unload
        keepalive: endpoint.includes('session_end')
      }).catch(err => {
        console.error('Analytics error:', err);
      });
    }
  }
}

// Create and export a singleton instance
const analyticsClient = new AnalyticsClient();
export default analyticsClient;
