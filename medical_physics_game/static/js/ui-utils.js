// ui-utils.js - UI helper functions

window.UiUtils = {
    // Helper function to show floating text feedback
    showFloatingText: function(text, type = 'info') {
      const floatingText = document.createElement('div');
      floatingText.className = `floating-text floating-text-${type}`;
      floatingText.textContent = text;
      document.body.appendChild(floatingText);
      
      // Remove after animation completes
      setTimeout(() => {
        floatingText.classList.add('floating-text-fade');
        setTimeout(() => {
          document.body.removeChild(floatingText);
        }, 1000);
      }, 1000);
    },
    
    // Show error message
    showError: function(message) {
      console.error(message);
      alert(message);
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
    }
  };