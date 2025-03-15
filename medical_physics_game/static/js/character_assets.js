// character_assets.js - Central manager for character images and animations
// Place this file in: medical_physics_game/static/js/character_assets.js

const CharacterAssets = {
    // Character image data
    characters: {
        'resident': {
            imagePath: '/static/images/characters/resident.png',
            // You can add animation frames later if needed
            animationFrames: [
                '/static/images/characters/resident.png',
                // Add more frames if you create them
            ]
        },
        'physicist': {
            imagePath: '/static/images/characters/physicist.png',
            animationFrames: [
                '/static/images/characters/physicist.png',
                // Add more frames if you create them
            ]
        },
        'qa_specialist': {
            imagePath: '/static/images/characters/qa_specialist.png',
            animationFrames: [
                '/static/images/characters/qa_specialist.png',
                // Add more frames if you create them
            ]
        },
        'debug_mode': {
            imagePath: '/static/images/characters/debug_mode.png',
            animationFrames: [
                '/static/images/characters/debug_mode.png',
                // Add more frames if you create them
            ]
        }
    },
    
    // Get character ID from name
    getCharacterIdFromName: function(characterName) {
        if (characterName.includes('Physicist')) return 'physicist';
        if (characterName.includes('QA')) return 'qa_specialist';
        if (characterName.includes('Debug')) return 'debug_mode';
        return 'resident'; // Default
    },
    
    // Get image path for a character
    getCharacterImagePath: function(characterIdOrName) {
        // If given a name, convert to ID
        const characterId = characterIdOrName.includes(' ') ? 
            this.getCharacterIdFromName(characterIdOrName) : characterIdOrName;
            
        return this.characters[characterId]?.imagePath || '/static/images/characters/resident.png';
    },
    
    // Get animation frames for a character
    getAnimationFrames: function(characterIdOrName) {
        // If given a name, convert to ID
        const characterId = characterIdOrName.includes(' ') ? 
            this.getCharacterIdFromName(characterIdOrName) : characterIdOrName;
            
        return this.characters[characterId]?.animationFrames || 
               this.characters['resident'].animationFrames;
    }
};

// Make it globally available
window.CharacterAssets = CharacterAssets;