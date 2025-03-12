// feedback_system.js - Unified user feedback system

// FeedbackSystem singleton - handles visual feedback
const FeedbackSystem = {
  // Toast container element
  toastContainer: null,
  
  // Track if we're currently showing feedback to prevent recursion
  _isShowingFeedback: false,
  
  // Initialize feedback system
  initialize: function() {
    console.log("Initializing feedback system...");
    
    // Get or create toast container
    this.toastContainer = document.querySelector('.toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(this.toastContainer);
    }
    
    // Register for feedback events
    EventSystem.on(GAME_EVENTS.UI_TOAST_SHOWN, this.handleToastEvent.bind(this));
    EventSystem.on(GAME_EVENTS.UI_FEEDBACK_SHOWN, this.handleFeedbackEvent.bind(this));
    
    // Override UiUtils methods to use this system
    if (typeof UiUtils !== 'undefined') {
      UiUtils.showToast = this.showToast.bind(this);
      UiUtils.showFloatingText = this.showFloatingText.bind(this);
    }
    
    return this;
  },
  
  // Event handler for toast events to prevent recursion
  handleToastEvent: function(data) {
    // Only process if we're not already showing a toast from our own code
    if (!this._isShowingFeedback) {
      this._showToastImplementation(data.message, data.type, data.duration);
    }
  },
  
  // Event handler for feedback events to prevent recursion
  handleFeedbackEvent: function(data) {
    // Only process if we're not already showing feedback from our own code
    if (!this._isShowingFeedback) {
      this._showFloatingTextImplementation(data.text, data.type);
    }
  },
  
  // Show a toast notification
  showToast: function(message, type = 'info', duration = 3000) {
    // Prevent infinite recursion by checking flag
    if (this._isShowingFeedback) return;
    
    // Set flag to prevent recursion
    this._isShowingFeedback = true;
    
    // Show the toast
    this._showToastImplementation(message, type, duration);
    
    // Emit event (only if called directly, not from an event handler)
    EventSystem.emit(GAME_EVENTS.UI_TOAST_SHOWN, { message, type, duration });
    
    // Reset flag
    this._isShowingFeedback = false;
  },
  
  // Internal implementation of toast display
  _showToastImplementation: function(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toast.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">${this.getTypeIcon(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    // Add to container
    this.toastContainer.appendChild(toast);
    
    // Add close button event
    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.fadeOutElement(toast, function() {
          toast.remove();
        });
      });
    }
    
    // Auto remove after duration
    setTimeout(() => {
      this.fadeOutElement(toast, function() {
        toast.remove();
      });
    }, duration);
  },
  
  // Show floating text feedback
  showFloatingText: function(text, type = 'info') {
    // Prevent infinite recursion by checking flag
    if (this._isShowingFeedback) return;
    
    // Set flag to prevent recursion
    this._isShowingFeedback = true;
    
    // Show the floating text
    this._showFloatingTextImplementation(text, type);
    
    // Emit event
    EventSystem.emit(GAME_EVENTS.UI_FEEDBACK_SHOWN, { text, type });
    
    // Reset flag
    this._isShowingFeedback = false;
  },
  
  // Internal implementation of floating text
  _showFloatingTextImplementation: function(text, type = 'info') {
    // Create floating text element
    const floatingText = document.createElement('div');
    floatingText.className = `floating-text floating-text-${type}`;
    
    // Add icon based on type
    let icon = this.getTypeIcon(type);
    
    floatingText.innerHTML = `<span class="float-icon">${icon}</span>${text}`;
    document.body.appendChild(floatingText);
    
    // Add animation classes gradually for better effect
    setTimeout(() => {
      floatingText.classList.add('floating-text-active');
      
      // Remove after animation completes
      setTimeout(() => {
        floatingText.classList.add('floating-text-fade');
        setTimeout(() => {
          document.body.removeChild(floatingText);
        }, 1000);
      }, 1500);
    }, 10);
  },
  
  // Show floor transition animation
  showFloorTransition: function(floorNumber) {
    // Fetch floor data to show description
    fetch(`/api/floor/${floorNumber}`)
      .then(response => response.json())
      .then(floorData => {
        // Create transition screen
        const transitionDiv = document.createElement('div');
        transitionDiv.className = 'floor-transition-screen';
        
        transitionDiv.innerHTML = `
          <h1 class="floor-title">Floor ${floorNumber}</h1>
          <h2 class="floor-subtitle">${floorData.name || ''}</h2>
          <p class="floor-description">${floorData.description || ''}</p>
        `;
        
        document.body.appendChild(transitionDiv);
        
        // Remove after animation completes
        setTimeout(() => {
          transitionDiv.remove();
        }, 3000);
      })
      .catch(error => {
        // Fallback if API fails
        const transitionDiv = document.createElement('div');
        transitionDiv.className = 'floor-transition-screen';
        
        transitionDiv.innerHTML = `
          <h1 class="floor-title">Floor ${floorNumber}</h1>
        `;
        
        document.body.appendChild(transitionDiv);
        
        // Remove after animation completes
        setTimeout(() => {
          transitionDiv.remove();
        }, 3000);
      });
  },
  
  // Helper function to fade out an element
  fadeOutElement: function(element, callback) {
    element.style.transition = 'opacity 0.5s';
    element.style.opacity = '0';
    
    setTimeout(() => {
      if (typeof callback === 'function') {
        callback();
      }
    }, 500);
  },
  
  // Get icon for notification type
  getTypeIcon: function(type) {
    switch (type) {
      case 'success': return '✓';
      case 'danger': return '✗';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  }
};

// Export globally
window.FeedbackSystem = FeedbackSystem;

// Add helper functions to UiUtils if it doesn't exist
if (typeof window.UiUtils === 'undefined') {
  window.UiUtils = {
    showToast: function(message, type, duration) {
      if (FeedbackSystem && typeof FeedbackSystem.showToast === 'function') {
        FeedbackSystem.showToast(message, type, duration);
      } else {
        console.log(`Toast (${type}): ${message}`);
      }
    },
    
    showFloatingText: function(text, type) {
      if (FeedbackSystem && typeof FeedbackSystem.showFloatingText === 'function') {
        FeedbackSystem.showFloatingText(text, type);
      } else {
        console.log(`Floating Text (${type}): ${text}`);
      }
    },
    
    showFloorTransition: function(floorNumber) {
      if (FeedbackSystem && typeof FeedbackSystem.showFloorTransition === 'function') {
        FeedbackSystem.showFloorTransition(floorNumber);
      } else {
        console.log(`Floor Transition: ${floorNumber}`);
      }
    }
  };
}