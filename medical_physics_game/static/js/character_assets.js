// character_assets.js - Complete fix with all required methods

// Define CharacterAssets globally to avoid scope issues
// Check if it's already defined first
if (typeof window.CharacterAssets === 'undefined') {
  // Define CharacterAssets as a global object
  window.CharacterAssets = {
    // Character data
    characters: {
      physicist: {
        name: "Medical Physicist",
        description: "Specializes in physics concepts and measurements.",
        imagePath: "/static/img/characters/physicist.png",
        stats: {
          startingInsight: 50,
          startingLives: 3,
          maxLives: 5
        },
        perks: [
          "Starts with extra insight",
          "Better understanding of radiation physics"
        ]
      },
      resident: {
        name: "Resident Physician",
        description: "Medical doctor in radiation oncology training.",
        imagePath: "/static/img/characters/resident.png",
        stats: {
          startingInsight: 30,
          startingLives: 4,
          maxLives: 6
        },
        perks: [
          "More resilient to mistakes",
          "Better at patient cases"
        ]
      },
      qa_specialist: {
        name: "QA Specialist",
        description: "Expert in quality assurance procedures.",
        imagePath: "/static/img/characters/qa_specialist.png",
        stats: {
          startingInsight: 40,
          startingLives: 3,
          maxLives: 5
        },
        perks: [
          "Finds more errors in setups",
          "Better at practical questions"
        ]
      },
      debug_mode: {
        name: "Debug Physicist",
        description: "A special character with godlike powers for testing purposes.",
        imagePath: "/static/img/characters/debug_mode.png",
        stats: {
          startingInsight: 999,
          startingLives: 99,
          maxLives: 99
        },
        perks: [
          "Developer testing mode",
          "All questions are automatically answered correctly"
        ]
      }
    },

    // Character progression data
    progression: {
      levelThresholds: [0, 100, 250, 450, 700, 1000, 1500, 2000, 3000, 5000],
      
      unlockables: {
        level2: {
          characters: ["resident"],
          items: ["basic_manual"]
        },
        level3: {
          characters: ["qa_specialist"],
          items: ["advanced_dosimeter"]
        }
      }
    },
    
    // Get all character keys
    getCharacterKeys: function() {
      return Object.keys(this.characters);
    },
    
    // Get character data by key
    getCharacter: function(key) {
      return this.characters[key] || null;
    },
    
    // Get character image path by key
    getCharacterImagePath: function(key) {
      const character = this.getCharacter(key);
      return character ? character.imagePath : '/static/img/characters/default.png';
    },
    
    // Get character name by key
    getCharacterName: function(key) {
      const character = this.getCharacter(key);
      return character ? character.name : 'Unknown Character';
    },
    
    // Get character description by key
    getCharacterDescription: function(key) {
      const character = this.getCharacter(key);
      return character ? character.description : '';
    },
    
    // Get character stats by key
    getCharacterStats: function(key) {
      const character = this.getCharacter(key);
      return character ? character.stats : null;
    },
    
    // Get character perks by key
    getCharacterPerks: function(key) {
      const character = this.getCharacter(key);
      return character ? character.perks : [];
    },
    
    // Get progression level based on experience
    getProgressionLevel: function(experience) {
      const thresholds = this.progression.levelThresholds;
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (experience >= thresholds[i]) {
          return i;
        }
      }
      return 0;
    },
    
    // Check if a character is unlocked at the given level
    isCharacterUnlocked: function(characterKey, level) {
      // The physicist is always unlocked
      if (characterKey === 'physicist') return true;
      
      // Check unlockables for this character
      for (let i = 1; i <= level; i++) {
        const unlockKey = `level${i}`;
        const unlocks = this.progression.unlockables[unlockKey];
        
        if (unlocks && unlocks.characters && unlocks.characters.includes(characterKey)) {
          return true;
        }
      }
      
      return false;
    },
    
    // MISSING METHOD: Convert character name to ID
    getCharacterIdFromName: function(name) {
      // Search for character with matching name
      for (const charId in this.characters) {
        if (this.characters[charId].name === name) {
          return charId;
        }
      }
      
      // If exact match not found, try case-insensitive partial match
      const lowerName = name.toLowerCase();
      for (const charId in this.characters) {
        if (this.characters[charId].name.toLowerCase().includes(lowerName)) {
          return charId;
        }
      }
      
      // Default to resident if no match found
      console.warn(`Character name "${name}" not found, defaulting to resident`);
      return "resident";
    },
    
    // Convert character ID to name
    getCharacterNameFromId: function(id) {
      const character = this.getCharacter(id);
      return character ? character.name : "Unknown Character";
    }
  };
  
  console.log("CharacterAssets initialized with all required methods");
} else {
  console.warn("CharacterAssets already defined, adding missing methods if needed");
  
  // Add the missing method if it doesn't exist
  if (typeof window.CharacterAssets.getCharacterImagePath !== 'function') {
    window.CharacterAssets.getCharacterImagePath = function(key) {
      const character = this.getCharacter(key);
      return character ? character.imagePath : '/static/img/characters/default.png';
    };
    console.log("Added missing getCharacterImagePath method to existing CharacterAssets");
  }
  
  // Add the missing getCharacterIdFromName method
  if (typeof window.CharacterAssets.getCharacterIdFromName !== 'function') {
    window.CharacterAssets.getCharacterIdFromName = function(name) {
      // Search for character with matching name
      for (const charId in this.characters) {
        if (this.characters[charId].name === name) {
          return charId;
        }
      }
      
      // If exact match not found, try case-insensitive partial match
      const lowerName = name.toLowerCase();
      for (const charId in this.characters) {
        if (this.characters[charId].name.toLowerCase().includes(lowerName)) {
          return charId;
        }
      }
      
      // Default to resident if no match found
      console.warn(`Character name "${name}" not found, defaulting to resident`);
      return "resident";
    };
    console.log("Added missing getCharacterIdFromName method to existing CharacterAssets");
  }
  
  // Add the missing getCharacterNameFromId method
  if (typeof window.CharacterAssets.getCharacterNameFromId !== 'function') {
    window.CharacterAssets.getCharacterNameFromId = function(id) {
      const character = this.getCharacter(id);
      return character ? character.name : "Unknown Character";
    };
    console.log("Added missing getCharacterNameFromId method to existing CharacterAssets");
  }
  
  // Make sure debug_mode character is added if it doesn't exist
  if (!window.CharacterAssets.characters.debug_mode) {
    window.CharacterAssets.characters.debug_mode = {
      name: "Debug Physicist",
      description: "A special character with godlike powers for testing purposes.",
      imagePath: "/static/img/characters/debug_mode.png",
      stats: {
        startingInsight: 999,
        startingLives: 99,
        maxLives: 99
      },
      perks: [
        "Developer testing mode",
        "All questions are automatically answered correctly"
      ]
    };
    console.log("Added missing debug_mode character to CharacterAssets");
  }
}

// Export CharacterAssets to make sure it's globally available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.CharacterAssets;
}