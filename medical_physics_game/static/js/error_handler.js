// error_handler.js - Centralized error handling system

// ErrorHandler singleton - provides consistent error handling
const ErrorHandler = {
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
        this.handleError(event.reason, 'Promise');
      });
      
      // Handle uncaught exceptions
      window.addEventListener('error', event => {
        console.error('Uncaught Error:', event.error);
        this.handleError(event.error, 'Runtime');
        
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
    
    // Handle general errors
    handleError: function(error, source = 'Unknown') {
      // Get error details
      const message = error.message || 'Unknown error occurred';
      const stack = error.stack || '';
      
      console.group(`Error [${source}]`);
      console.error(message);
      console.error(stack);
      console.groupEnd();
      
      // Show user-friendly error message
      this.showErrorToUser(message, source);
      
      // Report error for analytics (if implemented)
      this.reportError(error, source);
    },
    
    // Handle API errors
    handleApiError: function(error, url) {
      const statusCode = error.status || 0;
      
      // Different handling based on status code
      if (statusCode === 401 || statusCode === 403) {
        // Authentication or authorization issue
        this.showErrorToUser('You are not authorized to perform this action.', 'Authorization');
      } else if (statusCode === 404) {
        // Resource not found
        this.showErrorToUser('The requested resource was not found.', 'Not Found');
      } else if (statusCode >= 500) {
        // Server error
        this.showErrorToUser('A server error occurred. Please try again later.', 'Server Error');
      } else {
        // Generic error
        this.showErrorToUser(error.message || 'An API error occurred.', 'API Error');
      }
      
      // Log API error
      console.group('API Error');
      console.error(`URL: ${url}`);
      console.error(`Status: ${statusCode}`);
      console.error(`Message: ${error.message}`);
      if (error.data) console.error('Data:', error.data);
      console.groupEnd();
      
      // Report error for analytics
      this.reportError(error, 'API');
    },
    
    // Handle network errors
    handleNetworkError: function(error, url) {
      console.group('Network Error');
      console.error(`URL: ${url}`);
      console.error(`Message: ${error.message}`);
      console.groupEnd();
      
      // Show user-friendly message
      this.showErrorToUser('A network error occurred. Please check your internet connection.', 'Network');
      
      // Report error for analytics
      this.reportError(error, 'Network');
    },
    
    // Show error message to user
    showErrorToUser: function(message, source) {
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
        UiUtils.showToast(userMessage, 'danger');
      } else {
        // Fallback
        alert(`Error: ${userMessage}`);
      }
      
      // Try to recover gracefully
      this.attemptRecovery(source);
    },
    
    // Attempt to recover from error
    attemptRecovery: function(source) {
      // Recovery strategies based on error source
      switch (source) {
        case 'API':
          // For API errors, might retry or fall back to cached data
          console.log('Attempting recovery from API error...');
          break;
          
        case 'Network':
          // For network errors, might switch to offline mode
          console.log('Attempting recovery from network error...');
          break;
          
        case 'Runtime':
          // For runtime errors, might restart problematic component
          console.log('Attempting recovery from runtime error...');
          break;
          
        default:
          // Generic recovery
          console.log('Attempting recovery from error...');
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
    offerGameRestart: function() {
      // Create restart dialog
      const restartHTML = `
        <div id="error-restart-modal" class="game-modal" style="display:flex;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Game Error</h3>
            </div>
            <div class="modal-body">
              <p>The game has encountered an error and cannot continue. Would you like to restart?</p>
              <div class="mt-3 text-center">
                <button id="restart-game-btn" class="btn btn-primary">Restart Game</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add to DOM if not already present
      if (!document.getElementById('error-restart-modal')) {
        document.body.insertAdjacentHTML('beforeend', restartHTML);
        
        // Add restart button event
        document.getElementById('restart-game-btn').addEventListener('click', () => {
          window.location.reload();
        });
      }
    },
    
    // Report error for analytics
    reportError: function(error, source) {
      // In a real implementation, this would send error data to a server
      // For now, just log to console
      console.log(`[Error Report] Source: ${source}, Message: ${error.message}`);
      
      // Example implementation for error reporting
      /*
      fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          source: source,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          gameState: GameState ? GameState.getState() : null
        })
      }).catch(e => console.error('Failed to report error:', e));
      */
    }
  };
  
  // Export globally
  window.ErrorHandler = ErrorHandler;