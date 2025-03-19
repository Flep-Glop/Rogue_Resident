// character_loader.js - Helper script to ensure characters load properly

document.addEventListener('DOMContentLoaded', function() {
    console.log('Character loader initializing...');
    
    // Check if CharacterAssets exists
    if (!window.CharacterAssets) {
      console.error('CharacterAssets is not defined! Loading fallback...');
      loadFallbackCharacterAssets();
    } else {
      console.log('CharacterAssets found, verifying methods...');
      verifyCharacterAssetsMethods();
    }
    
    // Preload character images to prevent loading issues
    preloadCharacterImages();
  });
  
  // Verify that CharacterAssets has all required methods
  function verifyCharacterAssetsMethods() {
    const requiredMethods = [
      'getCharacterKeys',
      'getCharacter',
      'getCharacterImagePath',
      'getCharacterIdFromName',
      'getCharacterNameFromId'
    ];
    
    let missing = false;
    
    requiredMethods.forEach(method => {
      if (typeof window.CharacterAssets[method] !== 'function') {
        console.error(`Missing required method in CharacterAssets: ${method}`);
        missing = true;
        
        // Add placeholder method to prevent errors
        window.CharacterAssets[method] = function() {
          console.warn(`Called placeholder for missing method: ${method}`);
          return null;
        };
      }
    });
    
    if (missing) {
      console.warn('Some CharacterAssets methods were missing and replaced with placeholders');
    } else {
      console.log('All required CharacterAssets methods verified ✓');
    }
  }
  
  // Preload all character images to prevent display issues
  function preloadCharacterImages() {
    const characterIds = ['resident', 'physicist', 'qa_specialist', 'debug_mode'];
    const imagePaths = [];
    
    // Get image paths from CharacterAssets if available
    if (window.CharacterAssets && typeof window.CharacterAssets.getCharacterImagePath === 'function') {
      characterIds.forEach(id => {
        imagePaths.push(window.CharacterAssets.getCharacterImagePath(id));
      });
    } else {
      // Fallback to direct paths
      characterIds.forEach(id => {
        imagePaths.push(`/static/img/characters/${id}.png`);
      });
    }
    
    // Also add a default fallback
    imagePaths.push('/static/img/characters/resident.png');
    
    // Deduplicate paths
    const uniquePaths = [...new Set(imagePaths)];
    
    console.log(`Preloading ${uniquePaths.length} character images...`);
    
    // Preload each image
    uniquePaths.forEach(path => {
      const img = new Image();
      img.onload = function() {
        console.log(`✓ Image loaded: ${path}`);
      };
      img.onerror = function() {
        console.error(`✗ Failed to load image: ${path}`);
      };
      img.src = path;
    });
  }
  
  // Create fallback CharacterAssets if the main one fails to load
  function loadFallbackCharacterAssets() {
    console.warn('Loading fallback CharacterAssets');
    
    window.CharacterAssets = {
      characters: {
        resident: {
          name: "Resident Physician",
          imagePath: "/static/img/characters/resident.png"
        },
        physicist: {
          name: "Medical Physicist",
          imagePath: "/static/img/characters/physicist.png"
        },
        qa_specialist: {
          name: "QA Specialist",
          imagePath: "/static/img/characters/qa_specialist.png"
        },
        debug_mode: {
          name: "Debug Physicist",
          imagePath: "/static/img/characters/debug_mode.png"
        }
      },
      
      getCharacterKeys: function() {
        return Object.keys(this.characters);
      },
      
      getCharacter: function(key) {
        return this.characters[key] || this.characters.resident;
      },
      
      getCharacterImagePath: function(key) {
        const character = this.getCharacter(key);
        return character ? character.imagePath : '/static/img/characters/resident.png';
      },
      
      getCharacterIdFromName: function(name) {
        for (const id in this.characters) {
          if (this.characters[id].name === name) {
            return id;
          }
        }
        return 'resident';
      },
      
      getCharacterNameFromId: function(id) {
        const character = this.getCharacter(id);
        return character ? character.name : "Resident Physician";
      }
    };
    
    console.log('Fallback CharacterAssets loaded');
  }
  
  // Export helper to check for image existence
  window.characterImageExists = function(path, callback) {
    const img = new Image();
    img.onload = function() {
      callback(true);
    };
    img.onerror = function() {
      callback(false);
    };
    img.src = path;
  };