// character_assets.js - Central manager for character images and animations
// Place this file in: medical_physics_game/static/js/character_assets.js

const CharacterAssets = {
    // Character image data
    characters: {
        'resident': {
            imagePath: '/static/img/characters/resident.png',
            // You can add animation frames later if needed
            animationFrames: [
                '/static/img/characters/resident.png',
                // Add more frames if you create them
            ]
        },
        'physicist': {
            imagePath: '/static/img/characters/physicist.png',
            animationFrames: [
                '/static/img/characters/physicist.png',
                // Add more frames if you create them
            ]
        },
        'qa_specialist': {
            imagePath: '/static/img/characters/qa_specialist.png',
            animationFrames: [
                '/static/img/characters/qa_specialist.png',
                // Add more frames if you create them
            ]
        },
        'debug_mode': {
            imagePath: '/static/img/characters/debug_mode.png',
            animationFrames: [
                '/static/img/characters/debug_mode.png',
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
            
        return this.characters[characterId]?.imagePath || '/static/img/characters/resident.png';
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