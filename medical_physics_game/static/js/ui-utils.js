// ui-utils.js - UI helper functions

window.UiUtils = {
    // Helper function to show floating text feedback
    // Helper function to show floating text feedback
    showFloatingText: function(text, type = 'info') {
      const floatingText = document.createElement('div');
      floatingText.className = `floating-text floating-text-${type}`;
      
      // Add icons based on type
      let icon = '';
      switch(type) {
          case 'success': icon = '✓ '; break;
          case 'danger': icon = '✗ '; break;
          case 'warning': icon = '⚠ '; break;
          case 'info': icon = 'ℹ '; break;
      }
      
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
    
    // Floor transition animation
    showFloorTransition: function(floorNumber) {
      // Create transition screen
      const transitionDiv = document.createElement('div');
      transitionDiv.className = 'floor-transition-screen';
      
      // Get floor data to show description
      fetch(`/api/floor/${floorNumber}`)
        .then(response => response.json())
        .then(floorData => {
          transitionDiv.innerHTML = `
            <h2 class="floor-title">Floor ${floorNumber}: ${floorData.name || ''}</h2>
            <p class="floor-description">${floorData.description || ''}</p>
          `;
        })
        .catch(error => {
          // Fallback if API fails
          transitionDiv.innerHTML = `
            <h2 class="floor-title">Floor ${floorNumber}</h2>
          `;
        });
      
      document.body.appendChild(transitionDiv);
      
      // Automatically remove after animation finishes
      setTimeout(() => {
        transitionDiv.remove();
      }, 3000); // Match animation duration in CSS
    },
    
    // Modified floor transition to include description
    showFloorTransitionWithDescription: function(floorNumber, floorName, floorDescription) {
      const transitionScreen = document.createElement('div');
      transitionScreen.className = 'floor-transition-screen';
      
      transitionScreen.innerHTML = `
        <h1 class="floor-title">Floor ${floorNumber}</h1>
        <h2 class="floor-subtitle">${floorName}</h2>
        <p class="floor-description">${floorDescription}</p>
      `;
      
      document.body.appendChild(transitionScreen);
      
      // Remove after animation completes
      setTimeout(() => {
        transitionScreen.remove();
      }, 3000);
    },
    
    // Show Roentgen intro scene
    showRoentgenIntroScene: function() {
      // Implementation for Roentgen intro scene
      // ...
    },
  

  showToast: function(message, type = 'info', duration = 3000) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.error('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Use Bootstrap's toast functionality if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        
        bsToast.show();
        
        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    } else {
        // Fallback if Bootstrap JS is not available
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.opacity = 0;
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}
};