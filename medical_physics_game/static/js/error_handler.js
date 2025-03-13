// error_handler.js - Centralized error handling system

// ErrorHandler singleton - provides consistent error handling
const ErrorHandler = {
  // Error severity levels
  SEVERITY: {
    INFO: 'info',         // Non-critical information
    WARNING: 'warning',   // Potential issue, game can continue
    ERROR: 'error',       // Serious issue, feature may not work
    CRITICAL: 'critical'  // Game-breaking issue, may need restart
  },
  
  // Initialize error handler
  initialize: function() {
    console.log("Initializing error handling system...");
    
    // Set up global error handling
    this.setupGlobalErrorHandling();
    
    return this;
  },
  
  // Set up global error handlers
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
  
  // Main error handling method - use this for all error handling
  handleError: function(error, source = 'Unknown', severity = this.SEVERITY.ERROR) {
    // Get error details
    const message = error?.message || 'Unknown error occurred';
    const stack = error?.stack || '';
    
    // Log error with consistent format
    console.group(`${severity.toUpperCase()}: ${source}`);
    console.error(message);
    if (stack) console.error(stack);
    console.groupEnd();
    
    // Show user-friendly error message based on severity
    if (severity === this.SEVERITY.INFO) {
      this.showToUser(message, source, 'info');
    } else if (severity === this.SEVERITY.WARNING) {
      this.showToUser(message, source, 'warning');
    } else if (severity === this.SEVERITY.ERROR) {
      this.showToUser(message, source, 'danger');
    } else if (severity === this.SEVERITY.CRITICAL) {
      this.showCriticalError(message, source);
    }
    
    // Report error for analytics
    this.reportError(error, source, severity);
    
    // Attempt to recover
    this.attemptRecovery(source, severity);
  },
  
  // Handle API errors
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
  
  // Handle network errors
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
  
  // Show error message to user - unified method for all error displays
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
  
  // Show critical error with recovery options
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
  
  // Attempt to recover from error
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
  
  // Check if game is in unrecoverable state
  isGameBroken: function() {
    // Check critical game components
    const criticalComponents = [
      { name: 'GameState', obj: window.GameState },
      { name: 'EventSystem', obj: window.EventSystem },
      { name: 'NodeInteraction', obj: window.NodeInteraction }
    ];
    
    return criticalComponents.some(component => !component.obj);
  },
  
  // Offer game restart
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
  
  // Report error for analytics
  reportError: function(error, source, severity) {
    // Log for now, but in production would send to server
    console.log(`[Error Report] Source: ${source}, Severity: ${severity}, Message: ${error?.message || 'Unknown error'}`);
    
    // Example implementation for error reporting to server
    /*
    try {
      fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error?.message,
          stack: error?.stack,
          source: source,
          severity: severity,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          gameState: GameState ? GameState.getState() : null
        })
      }).catch(e => console.error('Failed to report error:', e));
    } catch (e) {
      console.error('Failed to send error report:', e);
    }
    */
  }
};

// Export globally
window.ErrorHandler = ErrorHandler;