/**
 * CharacterConfig - Configuration helpers for characters and sprites
 * Provides defaults and helpers for sprite dimensions and layouts
 */
const CharacterConfig = {
  // Sprite scale factors by character
  scales: {
    'resident': 3,
    'physicist': 2.5,
    'qa_specialist': 3,
    'debug_mode': 3,
    'default': 3
  },
  
  // Default sprite dimensions
  defaults: {
    width: 96,
    height: 96,
    columns: 1,
    rows: 1,
    frames: 1,
    speed: 10 // frames per second
  },
  
  // Known sprite layout formats
  formats: {
    'vertical_strip': {
      layout: 'vertical',
      description: 'Frames stacked vertically in a single column'
    },
    'horizontal_strip': {
      layout: 'horizontal',
      description: 'Frames arranged horizontally in a single row'
    },
    'grid': {
      layout: 'grid',
      description: 'Frames arranged in a grid with multiple rows and columns'
    },
    'sequence': {
      layout: 'sequence',
      description: 'Frames as individual image files in a sequence'
    }
  },
  
  /**
   * Get recommended scale for a character
   * @param {string} characterId - Character ID
   * @returns {number} Scale factor
   */
  getScaleFor: function(characterId) {
    return this.scales[characterId] || this.scales.default;
  },
  
  /**
   * Set scale factor for a character
   * @param {string} characterId - Character ID
   * @param {number} scale - Scale factor
   */
  setScaleFor: function(characterId, scale) {
    this.scales[characterId] = scale;
  },
  
  /**
   * Calculate sprite frame dimensions based on layout type
   * 
   * @param {Object} spriteData - Basic sprite data
   * @param {string} layoutType - 'vertical', 'horizontal', 'grid', 'sequence'
   * @returns {Object} Calculated dimensions
   */
  calculateFrameDimensions: function(spriteData, layoutType) {
    const result = {
      frameWidth: spriteData.width || this.defaults.width,
      frameHeight: spriteData.height || this.defaults.height
    };
    
    switch (layoutType) {
      case 'vertical':
        result.frameHeight = result.frameHeight / (spriteData.frames || 1);
        break;
        
      case 'horizontal':
        result.frameWidth = result.frameWidth / (spriteData.frames || 1);
        break;
        
      case 'grid':
        result.frameWidth = result.frameWidth / (spriteData.columns || 1);
        result.frameHeight = result.frameHeight / (spriteData.rows || 1);
        break;
        
      case 'sequence':
        // No adjustment needed for sequence
        break;
    }
    
    return result;
  },
  
  /**
   * Determine sprite layout based on file format and properties
   * 
   * @param {Object} spriteData - Basic sprite data
   * @returns {string} Layout type
   */
  determineLayoutType: function(spriteData) {
    // If explicitly specified, use that
    if (spriteData.layout) {
      return spriteData.layout;
    }
    
    // If it's a sequence of files
    if (spriteData.isSequence || Array.isArray(spriteData.frames)) {
      return 'sequence';
    }
    
    // If it has columns and rows
    if (spriteData.columns && spriteData.rows) {
      return 'grid';
    }
    
    // If it's marked as horizontal
    if (spriteData.isHorizontal) {
      return 'horizontal';
    }
    
    // Default to vertical layout
    return 'vertical';
  },
  
  /**
   * Get image paths for a sequence animation
   * 
   * @param {string} basePath - Base path for images
   * @param {Object} spriteData - Animation data
   * @returns {Array} Image paths
   */
  getSequencePaths: function(basePath, spriteData) {
    const frames = spriteData.frames || 1;
    const paths = [];
    
    // If frames is an array, use those as paths
    if (Array.isArray(spriteData.frames)) {
      return spriteData.frames.map(frame => basePath + frame);
    }
    
    // Generate paths based on pattern
    const pattern = spriteData.pattern || '{name}_{i}.png';
    
    for (let i = 0; i < frames; i++) {
      const index = String(i).padStart(2, '0');
      const fileName = pattern
        .replace('{name}', spriteData.name || 'frame')
        .replace('{i}', index);
      
      paths.push(basePath + fileName);
    }
    
    return paths;
  },
  
  /**
   * Create standardized sprite config from animation data
   * 
   * @param {Object} spriteData - Animation data
   * @returns {Object} Standardized sprite config
   */
  standardizeSpriteConfig: function(spriteData) {
    // Start with defaults
    const config = { ...this.defaults };
    
    // Apply provided values
    Object.assign(config, spriteData);
    
    // Determine layout type
    config.layout = this.determineLayoutType(config);
    
    // Calculate frame dimensions
    const dimensions = this.calculateFrameDimensions(config, config.layout);
    config.frameWidth = dimensions.frameWidth;
    config.frameHeight = dimensions.frameHeight;
    
    return config;
  }
};

// Make available globally
window.CharacterConfig = CharacterConfig;
