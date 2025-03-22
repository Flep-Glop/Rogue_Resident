// character-panel-fix.js - Fixes character loading issues
document.addEventListener('DOMContentLoaded', function() {
    // Add a delay to ensure GameState is loaded
    setTimeout(function() {
      // Check if character panel is still loading
      const charInfoElement = document.getElementById('character-info');
      if (charInfoElement && charInfoElement.innerText.includes('Loading')) {
        console.log("Applying character panel fix...");
        
        // Force character display update if GameState is available
        if (window.GameState && window.GameState.data && window.GameState.data.character) {
          if (window.CharacterPanel && typeof window.CharacterPanel.updateCharacterDisplay === 'function') {
            window.CharacterPanel.updateCharacterDisplay(GameState.data.character);
            
            // Also fix the scaling issue by finding and updating the character image
            const charImg = document.querySelector('.pixel-character-img');
            if (charImg) {
              charImg.style.transform = 'scale(1.5)';
            }
            
            console.log("Character panel fixed successfully!");
          }
        }
      }
    }, 1000); // Wait 1 second after page load
  });