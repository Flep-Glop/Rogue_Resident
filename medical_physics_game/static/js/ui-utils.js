// ui-utils.js - Common UI utility functions

// UiUtils object - provides common UI helper functions
const UiUtils = {
    // Show a toast notification (will be overridden by FeedbackSystem)
    showToast: function(message, type = 'info', duration = 3000) {
      console.log(`Toast message (${type}): ${message}`);
      
      // This will be replaced by FeedbackSystem.showToast when it initializes
      // Create a temporary implementation
      const toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) return;
      
      const toast = document.createElement('div');
      toast.className = `toast show bg-${type}`;
      toast.setAttribute('role', 'alert');
      toast.innerHTML = `
        <div class="toast-header">
          <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body text-white">
          ${message}
        </div>
      `;
      
      toastContainer.appendChild(toast);
      
      toast.querySelector('.btn-close').addEventListener('click', () => {
        toast.remove();
      });
      
      setTimeout(() => {
        toast.remove();
      }, duration);
    },
    
    // Show floating text (will be overridden by FeedbackSystem)
    showFloatingText: function(text, type = 'info') {
      console.log(`Floating text (${type}): ${text}`);
      
      // This will be replaced by FeedbackSystem.showFloatingText when it initializes
      const floatingText = document.createElement('div');
      floatingText.className = `floating-text floating-text-${type}`;
      floatingText.textContent = text;
      floatingText.style.animation = 'float-up 2s ease-out';
      
      document.body.appendChild(floatingText);
      
      setTimeout(() => {
        floatingText.remove();
      }, 2000);
    },
    
    // Show a confirmation dialog
    showConfirmDialog: function(title, message, onConfirm, onCancel) {
      const dialogHtml = `
        <div class="modal fade" id="confirmDialog" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p>${message}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancelBtn">Cancel</button>
                <button type="button" class="btn btn-primary" id="confirmBtn">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Remove any existing modal
      const existingModal = document.getElementById('confirmDialog');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Add to DOM
      document.body.insertAdjacentHTML('beforeend', dialogHtml);
      
      // Get modal elements
      const modalElement = document.getElementById('confirmDialog');
      const confirmBtn = document.getElementById('confirmBtn');
      const cancelBtn = document.getElementById('cancelBtn');
      const closeBtn = modalElement.querySelector('.btn-close');
      
      // Create bootstrap modal
      let modal;
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        // Fallback if bootstrap is not available
        modalElement.style.display = 'block';
      }
      
      // Set up handlers
      const handleConfirm = () => {
        if (typeof onConfirm === 'function') {
          onConfirm();
        }
        closeModal();
      };
      
      const handleCancel = () => {
        if (typeof onCancel === 'function') {
          onCancel();
        }
        closeModal();
      };
      
      const closeModal = () => {
        if (modal) {
          modal.hide();
        } else {
          modalElement.style.display = 'none';
        }
        
        // Remove after animation
        setTimeout(() => {
          modalElement.remove();
        }, 300);
      };
      
      // Add event listeners
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeBtn.addEventListener('click', handleCancel);
    },
    
    // Format a number with commas (e.g. 1,234)
    formatNumber: function(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Format a date (based on locale)
    formatDate: function(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    },
    
    // Get a color for a value on a gradient (for heat maps, etc.)
    getColorForValue: function(value, min, max, colorStart = [0, 0, 255], colorEnd = [255, 0, 0]) {
      // Normalize value between 0 and 1
      const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
      
      // Interpolate color
      const r = Math.round(colorStart[0] + normalizedValue * (colorEnd[0] - colorStart[0]));
      const g = Math.round(colorStart[1] + normalizedValue * (colorEnd[1] - colorStart[1]));
      const b = Math.round(colorStart[2] + normalizedValue * (colorEnd[2] - colorStart[2]));
      
      return `rgb(${r}, ${g}, ${b})`;
    },
    
    // Create a loading spinner
    createSpinner: function(container, size = 'medium', message = 'Loading...') {
      // Remove any existing spinner
      this.removeSpinner(container);
      
      // Create spinner element
      const spinnerElement = document.createElement('div');
      spinnerElement.className = 'spinner-container';
      
      // Size classes
      const sizeClass = {
        small: 'spinner-border-sm',
        medium: '',
        large: 'spinner-border-lg'
      }[size] || '';
      
      // Create spinner HTML
      spinnerElement.innerHTML = `
        <div class="text-center my-3">
          <div class="spinner-border text-primary ${sizeClass}" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          ${message ? `<p class="mt-2">${message}</p>` : ''}
        </div>
      `;
      
      // Add to container
      if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
      }
      
      if (container) {
        container.appendChild(spinnerElement);
      }
      
      return spinnerElement;
    },
    
    // Remove a spinner
    removeSpinner: function(container) {
      if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
      }
      
      if (!container) return;
      
      const spinner = container.querySelector('.spinner-container');
      if (spinner) {
        spinner.remove();
      }
    },
    
    // Show a pixel-appropriate loading indicator
    showPixelLoading: function(container, message = 'Loading...') {
      if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
      }
      
      if (!container) return;
      
      // Create pixel-style loading animation
      const loadingElement = document.createElement('div');
      loadingElement.className = 'pixel-loading';
      
      loadingElement.innerHTML = `
        <div class="pixel-loading-container">
          <div class="pixel-loading-dots">
            <div class="pixel-dot"></div>
            <div class="pixel-dot"></div>
            <div class="pixel-dot"></div>
          </div>
          <p class="pixel-loading-text">${message}</p>
        </div>
      `;
      
      container.appendChild(loadingElement);
      
      return loadingElement;
    },
    
    // Add a pulsing effect to an element
    addPulseEffect: function(element, duration = 1000, color = '#3498db') {
      if (typeof element === 'string') {
        element = document.getElementById(element) || document.querySelector(element);
      }
      
      if (!element) return;
      
      // Add pulse class
      element.classList.add('pulse-effect');
      
      // Set custom pulse properties
      element.style.setProperty('--pulse-duration', `${duration}ms`);
      element.style.setProperty('--pulse-color', color);
      
      // Remove class after animation completes
      setTimeout(() => {
        element.classList.remove('pulse-effect');
      }, duration);
    },
    
    // Simplified alert (for when bootstrap is not available)
    showAlert: function(message, type = 'info', container = document.body) {
      if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
      }
      
      if (!container) return;
      
      // Create alert element
      const alertElement = document.createElement('div');
      alertElement.className = `alert alert-${type}`;
      alertElement.setAttribute('role', 'alert');
      alertElement.innerHTML = message;
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'btn-close';
      closeButton.setAttribute('aria-label', 'Close');
      closeButton.addEventListener('click', () => alertElement.remove());
      
      alertElement.appendChild(closeButton);
      
      // Add to container
      container.appendChild(alertElement);
      
      return alertElement;
    }
  };
  
  // Export globally
  window.UiUtils = UiUtils;