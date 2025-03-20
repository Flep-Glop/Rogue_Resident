// character_assets.js - Character sprite and animation configuration

// Define CharacterAssets globally
window.CharacterAssets = {
  // Character data
  characters: {
    resident: {
      name: "Resident",
      description: "A new medical physics resident.",
      imagePath: "/static/img/characters/resident/idle.png",
      spritePath: "/static/img/characters/resident/",
      animations: {
        idle: {
          file: "idle.png", 
          frames: 8,
          width: 97,    // Specify the exact width
          height: 864,  // Total height of all frames
          speed: 150 
        },
        walking: {
          file: "walking.png", 
          frames: 10, 
          width: 97,    // Specify the exact width
          speed: 150
        },
        ability: {
          file: "ability.png", 
          frames: 18, 
          width: 97,    // Specify the exact width
          speed: 150
        },
        // New wide sprite special ability animation
        specialAbility: {
          file: "special_ability.png", 
          frames: 9, 
          width: 97,    // Specify the exact width
          speed: 150,
        }
      },
      stats: {
        startingInsight: 20,
        startingLives: 3,
        maxLives: 3
      },
      special_ability: {
        name: "Literature Review",
        description: "Once per floor, can skip a question node without penalty.",
        uses_per_floor: 1
      }
    },
    
    physicist: {
      name: "Junior Physicist",
      description: "More experienced with treatment planning but fewer lives.",
      imagePath: "/static/img/characters/physicist/portrait.png",
      spritePath: "/static/img/characters/physicist/",
      animations: {
        idle: {
          file: "idle.png", 
          frames: 1
        },
        walking: {
          file: "walking.png", 
          frames: 4, 
          speed: 250
        },
        ability: {
          file: "ability.png", 
          frames: 6, 
          speed: 120
        },
        specialAbility: {
          file: "special_ability.png", 
          frames: 10, 
          speed: 80,
          aspectRatio: 2.5 // Wider sprite
        }
      },
      stats: {
        startingInsight: 30,
        startingLives: 2,
        maxLives: 2
      },
      special_ability: {
        name: "Peer Review",
        description: "Can see the correct answer for one question per floor.",
        uses_per_floor: 1
      }
    },
    
    qa_specialist: {
      name: "QA Specialist",
      description: "Quality Assurance expert with deep knowledge of machine checks.",
      imagePath: "/static/img/characters/qa_specialist/portrait.png",
      spritePath: "/static/img/characters/qa_specialist/",
      animations: {
        idle: {
          file: "idle.png", 
          frames: 1
        },
        walking: {
          file: "walking.png", 
          frames: 4, 
          speed: 250
        },
        ability: {
          file: "ability.png", 
          frames: 6, 
          speed: 120
        },
        specialAbility: {
          file: "special_ability.png", 
          frames: 10, 
          speed: 80,
          aspectRatio: 2.5 // Wider sprite
        }
      },
      stats: {
        startingInsight: 25,
        startingLives: 3,
        maxLives: 3
      },
      special_ability: {
        name: "Measurement Uncertainty",
        description: "Can retry one failed question per floor.",
        uses_per_floor: 1
      }
    },
    
    debug_mode: {
      name: "Debug Physicist",
      description: "A special character with godlike powers for testing purposes.",
      imagePath: "/static/img/characters/debug_mode/portrait.png",
      spritePath: "/static/img/characters/debug_mode/",
      animations: {
        idle: {
          file: "idle.png", 
          frames: 1
        },
        walking: {
          file: "walking.png", 
          frames: 4, 
          speed: 250
        },
        ability: {
          file: "ability.png", 
          frames: 6, 
          speed: 120
        },
        specialAbility: {
          file: "special_ability.png", 
          frames: 10, 
          speed: 80,
          aspectRatio: 2.5 // Wider sprite
        }
      },
      stats: {
        startingInsight: 999,
        startingLives: 99,
        maxLives: 99
      },
      special_ability: {
        name: "Debug Override",
        description: "Can instantly complete any node without penalties.",
        uses_per_floor: 999
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
  
  // Get character portrait image path
  getCharacterImagePath: function(key) {
    const character = this.getCharacter(key);
    return character ? character.imagePath : '/static/img/characters/resident/portrait.png';
  },
  
  // Get sprite path for a specific animation
  getCharacterSpritePath: function(key, animation = "idle") {
    const character = this.getCharacter(key);
    if (!character || !character.animations || !character.animations[animation]) {
      return null; // Animation not found
    }
    
    return character.spritePath + character.animations[animation].file;
  },
  
  // Get animation data for a character
  getCharacterAnimation: function(key, animation = "idle") {
    const character = this.getCharacter(key);
    if (!character || !character.animations) return null;
    
    return character.animations[animation] || character.animations.idle;
  },
  
  // Get all available animations for a character
  getCharacterAnimations: function(key) {
    const character = this.getCharacter(key);
    if (!character || !character.animations) return [];
    
    return Object.keys(character.animations);
  },
  
  // Get character name by key
  getCharacterName: function(key) {
    const character = this.getCharacter(key);
    return character ? character.name : 'Medical Physics Resident';
  },
  
  // Get character description by key
  getCharacterDescription: function(key) {
    const character = this.getCharacter(key);
    return character ? character.description : '';
  },
  
  // Get character ID from name
  getCharacterIdFromName: function(name) {
    for (const id in this.characters) {
      if (this.characters[id].name === name) {
        return id;
      }
    }
    return 'resident'; // Default to resident
  },
  
  // Convert character ID to name
  getCharacterNameFromId: function(id) {
    const character = this.getCharacter(id);
    return character ? character.name : "Medical Physics Resident";
  }
};

console.log("CharacterAssets initialized with sprite animation data");

// Export CharacterAssets to make sure it's globally available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.CharacterAssets;
}