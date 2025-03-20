// character_assets.js - Simplified for single character implementation

// Define CharacterAssets globally
window.CharacterAssets = {
  // Character data
  characters: {
    resident: {
      name: "Resident",
      description: "A new resident.",
      imagePath: "/static/img/characters/resident/portrait.png",
      spritePath: "/static/img/characters/resident/",
      animations: {
        idle: {file: "idle.png", frames: 1},
        walking: {file: "walking.png", frames: 4, speed: 250},
        ability: {file: "ability.png", frames: 6, speed: 120}
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
    // Since we only have one character, default to resident
    return "resident";
  },
  
  // Convert character ID to name
  getCharacterNameFromId: function(id) {
    const character = this.getCharacter(id);
    return character ? character.name : "Medical Physics Resident";
  }
};

console.log("CharacterAssets initialized with resident character sprite data");

// Export CharacterAssets to make sure it's globally available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.CharacterAssets;
}