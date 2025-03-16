// medical_physics_game/static/js/utils/error_handler.js

/**
 * Enhanced Error Handler - Extends the existing error handling system with 
 * better severity management, retry logic, and error tracking.
 */

// Define severity levels for more granular error handling
const SEVERITY = Object.freeze({
  INFO: 'info',         // Non-critical information
  WARNING: 'warning',   // Potential issue, game can continue
  ERROR: 'error',       // Serious issue, feature may not work
  CRITICAL: 'critical'  // Game-breaking issue, may need restart
});

// Create enhanced ErrorHandler that maintains backward compatibility
const ErrorHandler = {
  // Export severity levels
  SEVERITY,
  
  // Configuration options
  config: {
    enableConsoleLogging: true,
    enableNotifications: true,
    notificationDuration: 5000,
    errorLogEndpoint: '/api/error-report',
    maxRetriesPerOperation: 3,
    defaultRetryDelay: 1000
  },
  
  // Statistics tracking
  stats: {
    total: 0,
    byType: {},
    byComponent: {}
  },
  
  // Initialize error handler - maintain compatibility with existing code
  initialize: function() {
    console.log("Initializing enhanced error handling system...");
    
    // Set up global error handling
    this.setupGlobalErrorHandling();
    
    return this;
  },
  
  // Set up global error handlers - maintain compatibility with existing code
  setupGlobalErrorHandling: function() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled Promise Rejection:', event.reason);
      this.handleError(event.reason, 'Unhandled Promise', this.SEVERITY.ERROR);
    });
    
    // Handle uncaught exceptions
    window.addEventListener('error', event => {
      console.error('Uncaught Error:', event.error);
      this.handleError(event.error, 'Uncaught Exception', this.SEVERITY.CRITICAL);
      
      // Prevent default browser error handling
      event.preventDefault();
    });
    
    // Patch fetch to handle API errors consistently
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Handle non-OK responses
        if (!response.ok) {
          // Try to parse error message from response
          let errorData;
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = { message: await response.text() };
            }
          } catch (parseError) {
            errorData = { 
              message: `HTTP error ${response.status}: ${response.statusText}`
            };
          }
          
          // Create an error with the response info
          const error = new Error(errorData.message || `HTTP error ${response.status}`);
          error.status = response.status;
          error.statusText = response.statusText;
          error.url = response.url;
          error.data = errorData;
          
          // Handle the error
          this.handleApiError(error, args[0]);
          
          throw error;
        }
        
        return response;
      } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          this.handleNetworkError(error, args[0]);
        }
        
        throw error;
      }
    };
  },
  
  /**
   * Configure the error handler
   * @param {Object} config - Configuration options
   */
  configure: function(config = {}) {
    Object.assign(this.config, config);
  },
  
  /**
   * Main error handling method - use this for all error handling
   * Enhanced version with better logging and severity management
   * @param {Error} error - The error object
   * @param {String} source - Error source/context
   * @param {String} severity - Error severity from SEVERITY
   * @param {Object} additionalData - Any additional data to log
   * @returns {String} Error ID for reference
   */
  handleError: function(error, source = 'Unknown', severity = SEVERITY.ERROR, additionalData = {}) {
    // Generate unique error ID for reference
    const errorId = this._generateErrorId();
    
    // Build error data object
    const errorData = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error?.message || 'Unknown error occurred',
      stack: error?.stack || '',
      source,
      severity,
      additionalData
    };
    
    // Update stats
    this.stats.total++;
    this.stats.byType[error?.name || 'Unknown'] = (this.stats.byType[error?.name || 'Unknown'] || 0) + 1;
    this.stats.byComponent[source] = (this.stats.byComponent[source] || 0) + 1;
    
    // Log error with consistent format
    if (this.config.enableConsoleLogging) {
      this._logToConsole(errorData);
    }
    
    // Show user-friendly error message based on severity
    if (this.config.enableNotifications) {
      this._showToUser(errorData);
    }
    
    // Report error for analytics
    this.reportError(errorData);
    
    // Attempt to recover
    this.attemptRecovery(source, severity);
    
    return errorId;
  },
  
  /**
   * Handle API errors - maintain compatibility with existing code
   * @param {Error} error - Error object
   * @param {String} url - URL that caused the error
   */
  handleApiError: function(error, url) {
    const statusCode = error.status || 0;
    let severity = this.SEVERITY.ERROR;
    let userMessage = '';
    
    // Determine severity and message based on status code
    if (statusCode === 401 || statusCode === 403) {
      userMessage = 'You are not authorized to perform this action.';
    } else if (statusCode === 404) {
      userMessage = 'The requested resource was not found.';
    } else if (statusCode >= 500) {
      userMessage = 'A server error occurred. Please try again later.';
      severity = this.SEVERITY.ERROR;
    } else {
      userMessage = error.message || 'An API error occurred.';
    }
    
    // Log API error details
    console.group(`API Error (${statusCode})`);
    console.error(`URL: ${url}`);
    console.error(`Status: ${statusCode}`);
    console.error(`Message: ${error.message}`);
    if (error.data) console.error('Data:', error.data);
    console.groupEnd();
    
    // Show user-friendly message
    this.showToUser(userMessage, 'API Error', severity === this.SEVERITY.CRITICAL ? 'danger' : 'warning');
    
    // Report error
    this.reportError(error, 'API', severity);
    
    // Attempt recovery
    this.attemptRecovery('API', severity);
  },
  
  /**
   * Handle network errors - maintain compatibility with existing code
   * @param {Error} error - Error object
   * @param {String} url - URL that caused the error
   */
  handleNetworkError: function(error, url) {
    console.group('Network Error');
    console.error(`URL: ${url}`);
    console.error(`Message: ${error.message}`);
    console.groupEnd();
    
    // Show user-friendly message
    this.showToUser('A network error occurred. Please check your internet connection.', 'Network', 'warning');
    
    // Report error
    this.reportError(error, 'Network', this.SEVERITY.WARNING);
    
    // Attempt recovery
    this.attemptRecovery('Network', this.SEVERITY.WARNING);
  },
  
  /**
   * Handle operation retry logic
   * @param {Function} operation - Function to retry
   * @param {Number} maxRetries - Maximum number of retries
   * @param {Number} delay - Delay between retries in ms
   * @param {Function} shouldRetry - Function to determine if retry should occur
   * @returns {Promise} Promise resolving to operation result
   */
  withRetry: async function(operation, maxRetries = null, delay = null, shouldRetry = null) {
    const retries = maxRetries ?? this.config.maxRetriesPerOperation;
    const retryDelay = delay ?? this.config.defaultRetryDelay;
    
    // Default shouldRetry function (retry on any error)
    const retryCheck = shouldRetry ?? (() => true);
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt >= retries || !retryCheck(error)) {
          throw error;
        }
        
        // Log retry attempt
        console.warn(`Operation failed, retrying (${attempt + 1}/${retries})...`, error);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // This should never be reached, but just in case
    throw lastError;
  },
  
  /**
   * Show error message to user - unified method for all error displays
   * Maintain compatibility with existing code
   */
  showToUser: function(message, source, type = 'danger') {
    // Keep message concise and user-friendly
    let userMessage = message;
    
    // Clean up common error messages
    if (message.includes('fetch failed') || message.includes('Failed to fetch')) {
      userMessage = 'Unable to connect to the game server. Please check your internet connection.';
    } else if (message.includes('Unexpected token')) {
      userMessage = 'The server returned an invalid response. Please try again.';
    } else if (message.length > 100) {
      // Truncate very long messages
      userMessage = message.substring(0, 100) + '...';
    }
    
    // Use UiUtils if available
    if (typeof UiUtils !== 'undefined' && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(userMessage, type);
    } else {
      // Fallback
      alert(`${source}: ${userMessage}`);
    }
  },
  
  /**
   * Show critical error with recovery options
   * Maintain compatibility with existing code
   */
  showCriticalError: function(message, source) {
    // Use UiUtils if available
    if (typeof UiUtils !== 'undefined' && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(`Critical Error: ${message}`, 'danger', 0); // 0 duration means persistent
    }
    
    // If game is in unrecoverable state, offer restart
    if (this.isGameBroken()) {
      this.offerGameRestart(message, source);
    }
  },
  
  /**
   * Attempt to recover from error
   * Maintain compatibility with existing code
   */
  attemptRecovery: function(source, severity) {
    // Only attempt recovery for non-critical errors
    if (severity === this.SEVERITY.CRITICAL) {
      return;
    }
    
    console.log(`Attempting recovery from ${severity} in ${source}...`);
    
    // Recovery strategies based on error source
    switch (source) {
      case 'API':
        // For API errors, might retry or fall back to cached data
        break;
        
      case 'Network':
        // For network errors, might switch to offline mode
        break;
        
      case 'Node Processing':
        // For node processing errors, try to return to map
        if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
          UI.showMapView();
        }
        break;
    }
    
    // If game is in unrecoverable state, offer restart
    if (this.isGameBroken()) {
      this.offerGameRestart();
    }
  },
  
  /**
   * Check if game is in unrecoverable state
   * Maintain compatibility with existing code
   */
  isGameBroken: function() {
    // Check critical game components
    const criticalComponents = [
      { name: 'GameState', obj: window.GameState },
      { name: 'EventSystem', obj: window.EventSystem },
      { name: 'NodeInteraction', obj: window.NodeInteraction }
    ];
    
    return criticalComponents.some(component => !component.obj);
  },
  
  /**
   * Offer game restart
   * Maintain compatibility with existing code
   */
  offerGameRestart: function(message = 'The game has encountered an error and cannot continue.', source = 'Game Error') {
    // Check if restart dialog already exists
    if (document.getElementById('error-restart-modal')) {
      return;
    }
    
    // Create restart dialog
    const restartHTML = `
      <div id="error-restart-modal" class="game-modal" style="display:flex;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${source}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
            <p>Would you like to restart the game?</p>
            <div class="mt-3 text-center">
              <button id="restart-game-btn" class="btn btn-primary">Restart Game</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', restartHTML);
    
    // Add restart button event
    document.getElementById('restart-game-btn').addEventListener('click', () => {
      window.location.reload();
    });
  },
  
  /**
   * Report error for analytics
   * Enhanced version with better data formatting
   */
  reportError: function(errorData, source, severity) {
    // Log for now
    console.log(`[Error Report] ${errorData.id} - ${errorData.source || source}: ${errorData.severity || severity}, ${errorData.message || 'Unknown error'}`);
    
    // Skip if no endpoint configured
    if (!this.config.errorLogEndpoint) {
      return;
    }
    
    // Only send errors and critical issues to server
    if ((errorData.severity || severity) !== SEVERITY.ERROR && 
        (errorData.severity || severity) !== SEVERITY.CRITICAL) {
      return;
    }
    
    // Prepare report data
    const reportData = {
      ...(typeof errorData === 'object' ? errorData : {
        message: errorData?.message,
        stack: errorData?.stack,
        source: source,
        severity: severity
      }),
      url: window.location.href,
      timestamp: new Date().toISOString(),
      gameState: window.GameState ? window.GameState.getState() : null
    };
    
    // Send to server
    try {
      fetch(this.config.errorLogEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
        // Use keepalive to ensure the request completes even if page is unloading
        keepalive: true
      }).catch(e => {
        // Log silently - we don't want errors in error reporting
        console.error('Failed to send error report:', e);
      });
    } catch (e) {
      console.error('Failed to send error report:', e);
    }
  },
  
  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats: function() {
    return { ...this.stats };
  },
  
  /**
   * Reset error statistics
   */
  resetStats: function() {
    this.stats = {
      total: 0,
      byType: {},
      byComponent: {}
    };
  },
  
  // Private helper methods
  
  /**
   * Generate a unique error ID
   * @private
   * @returns {String} Unique error ID
   */
  _generateErrorId: function() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Log error to console with appropriate formatting
   * @private
   * @param {Object} errorData - Error data object
   */
  _logToConsole: function(errorData) {
    const { severity, source, message, id, timestamp, stack } = errorData;
    
    // Format based on severity
    console.group(`${severity.toUpperCase()}: ${source}`);
    
    switch (severity) {
      case SEVERITY.INFO:
        console.info(`[${id}] ${message}`);
        break;
      case SEVERITY.WARNING:
        console.warn(`[${id}] ${message}`);
        break;
      case SEVERITY.ERROR:
      case SEVERITY.CRITICAL:
        console.error(`[${id}] ${message}`);
        console.error(stack || 'No stack trace available');
        break;
      default:
        console.log(`[${id}] ${message}`);
    }
    
    // Log additional data if present
    if (errorData.additionalData && Object.keys(errorData.additionalData).length > 0) {
      console.debug('Additional data:', errorData.additionalData);
    }
    
    console.groupEnd();
  },
  
  /**
   * Show notification to user based on error data
   * @private
   * @param {Object} errorData - Error data object
   */
  _showToUser: function(errorData) {
    const { severity, message, source } = errorData;
    
    // Format user-friendly message
    let userMessage = message;
    let type = 'info';
    
    // Map severity to UI toast type
    switch (severity) {
      case SEVERITY.INFO:
        type = 'info';
        break;
      case SEVERITY.WARNING:
        type = 'warning';
        break;
      case SEVERITY.ERROR:
        type = 'danger';
        break;
      case SEVERITY.CRITICAL:
        type = 'danger'; // Use same type but will be handled differently
        break;
    }
    
    // For critical errors, show special UI
    if (severity === SEVERITY.CRITICAL) {
      this.showCriticalError(message, source);
      return;
    }
    
    // For regular errors, just show a toast
    this.showToUser(message, source, type);
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, SEVERITY };
}

// For backward compatibility with existing code
window.ErrorHandler = ErrorHandler;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  ErrorHandler.initialize();
});