// character_config.js - Global configuration for character display
window.CharacterConfig = {
  // Global scale factor for all character displays
  globalScale: 3,
  
  // Character-specific scales (overrides global)
  characterScales: {
    'resident': 3,
    'physicist': 2.8,
    'qa_specialist': 2.5,
    'debug_mode': 2.2
  },
  
  // Get scale for a specific character
  getScaleFor: function(characterId) {
    if (this.characterScales[characterId]) {
      return this.characterScales[characterId];
    }
    return this.globalScale;
  },
  
  // Set global scale for all characters
  setGlobalScale: function(scale) {
    this.globalScale = scale;
    return this;
  },
  
  // Set scale for a specific character
  setCharacterScale: function(characterId, scale) {
    this.characterScales[characterId] = scale;
    return this;
  }
};

// Make this script load before other character scripts
