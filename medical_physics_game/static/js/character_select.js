// Add this to the script section of character_select.html
// Or create a separate file and include it with a script tag

// Character selection logic with carousel functionality
let selectedCharacter = null;
let characters = [];
let currentCharacterIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    fetchCharacters();
    
    // Set up carousel navigation
    document.getElementById('prev-character').addEventListener('click', function() {
        navigateCarousel(-1);
    });
    
    document.getElementById('next-character').addEventListener('click', function() {
        navigateCarousel(1);
    });
    
    // Set up start button
    document.getElementById('start-game-btn').addEventListener('click', function() {
        if (selectedCharacter) {
            startNewGame(selectedCharacter);
        }
    });
    
    // Set up keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            navigateCarousel(-1);
        } else if (e.key === 'ArrowRight') {
            navigateCarousel(1);
        } else if (e.key === 'Enter' && selectedCharacter) {
            startNewGame(selectedCharacter);
        }
    });
});

function fetchCharacters() {
    fetch('/api/characters')
        .then(response => response.json())
        .then(data => {
            characters = data.characters;
            renderCharacters(characters);
        })
        .catch(error => {
            console.error('Error loading characters:', error);
            document.getElementById('character-carousel').innerHTML = 
                '<p class="error">Failed to load characters. Please try again.</p>';
        });
}

function renderCharacters(characters) {
    const carousel = document.getElementById('character-carousel');
    const indicators = document.getElementById('carousel-indicators');
    const counter = document.getElementById('character-counter');
    
    // Clear any existing content
    carousel.innerHTML = '';
    indicators.innerHTML = '';
    
    // Initialize animation containers to track them
    window.characterAnimations = [];
    
    // Create cards for each character
    characters.forEach((character, index) => {
        const card = document.createElement('div');
        card.className = `character-card ${index === 0 ? 'active' : ''}`;
        card.dataset.characterId = character.id;
        card.dataset.index = index;
        
        // Calculate bar widths based on stats
        const maxLives = 10; // Normalize to max of 10 lives
        const maxInsight = 100; // Normalize to max of 100 insight
        const maxLevel = 10; // Normalize to max of 10 levels
        
        const livesPercent = Math.min(100, (character.starting_stats.lives / maxLives) * 100);
        const insightPercent = Math.min(100, (character.starting_stats.insight / maxInsight) * 100);
        const levelPercent = Math.min(100, (character.starting_stats.level / maxLevel) * 100);
        
        // CHANGE THIS PART: Create a sprite container instead of direct img
        card.innerHTML = `
            <div class="character-header">
                <h3>${character.name}</h3>
            </div>
            <div class="character-avatar">
                <div id="character-sprite-${index}" class="character-sprite-container"></div>
            </div>
            <div class="character-description">
                <p>${character.description}</p>
            </div>
            <div class="character-stats">
                <div class="stat-row">
                    <div class="stat-label">Lives</div>
                    <div class="stat-bar-container">
                        <div class="stat-bar lives" style="width: ${livesPercent}%"></div>
                        <div class="stat-value">${character.starting_stats.lives}/${character.starting_stats.max_lives}</div>
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Insight</div>
                    <div class="stat-bar-container">
                        <div class="stat-bar insight" style="width: ${insightPercent}%"></div>
                        <div class="stat-value">${character.starting_stats.insight}</div>
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Level</div>
                    <div class="stat-bar-container">
                        <div class="stat-bar level" style="width: ${levelPercent}%"></div>
                        <div class="stat-value">${character.starting_stats.level}</div>
                    </div>
                </div>
            </div>
            <div class="special-ability">
                <div class="ability-header">
                    ${character.special_ability.name}
                    <span>${character.special_ability.uses_per_floor || 1}/floor</span>
                </div>
                <div class="ability-description">
                    ${character.special_ability.description}
                </div>
            </div>
        `;
        
        carousel.appendChild(card);
        
        // Add indicator
        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
        indicator.dataset.index = index;
        
        // Handle indicator click
        indicator.addEventListener('click', function() {
            setActiveCharacter(index);
            navigateToCharacter(index);
        });
        
        indicators.appendChild(indicator);
        
        // WITH THIS:
        setTimeout(() => {
            const container = document.getElementById(`character-sprite-${index}`);
            if (!container) return;
            
            // Only animate the resident character for now
            if (character.id === 'resident' && typeof SpriteSystem !== 'undefined') {
                // Get scale from config if available
                const scale = window.CharacterConfig ? 
                    CharacterConfig.getScaleFor(character.id) : 3;
                
                const animId = SpriteSystem.createAnimation(
                    character.id,
                    container,
                    {
                        animation: 'idle',
                        autoPlay: true,
                        loop: true,
                        scale: scale
                    }
                );
                
                // Store animation ID for later reference
                window.characterAnimations[index] = animId;
                
                console.log(`Created sprite animation for ${character.id} with ID: ${animId}`);
            } else {
                // Use static image for non-resident characters
                const imagePath = CharacterAssets.getCharacterImagePath(character.id);
                const scale = window.CharacterConfig ? 
                    CharacterConfig.getScaleFor(character.id) : 3;
                    
                container.innerHTML = `
                    <img src="${imagePath}" alt="${character.name}" 
                        class="pixel-character-img" 
                        style="transform: scale(${scale});">
                `;
            }
        }, 100);
    });
    
    // Show counter
    counter.textContent = `Character 1 of ${characters.length}`;
    
    // Set up initial state
    setActiveCharacter(0);
    
    // Enable the start button
    document.getElementById('start-game-btn').disabled = false;
}

// Navigate the carousel
function navigateCarousel(direction) {
    const newIndex = (currentCharacterIndex + direction + characters.length) % characters.length;
    navigateToCharacter(newIndex);
}

// WITH THIS VERSION:
function navigateToCharacter(index) {
    // Update current index
    currentCharacterIndex = index;
    
    // Set the selected character to the current active one
    selectedCharacter = characters[index].id;
    
    // Update active state
    setActiveCharacter(index);
    
    // Update counter
    const counter = document.getElementById('character-counter');
    counter.textContent = `Character ${index + 1} of ${characters.length}`;
    
    // Add visual highlight to active card
    document.querySelectorAll('.character-card').forEach(card => {
        if (parseInt(card.dataset.index) === index) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Update indicators
    document.querySelectorAll('.carousel-indicator').forEach(indicator => {
        if (parseInt(indicator.dataset.index) === index) {
            indicator.classList.add('selected');
        } else {
            indicator.classList.remove('selected');
        }
    });
    
    // Special animation for the resident character
    if (characters[index].id === 'resident' && window.characterAnimations[index]) {
        const animId = window.characterAnimations[index];
        
        // Check which system is handling this animation
        if (typeof SpriteSystem !== 'undefined' && SpriteSystem.animations[animId]) {
            // Reset animation to playing state
            SpriteSystem.stop(animId);
            SpriteSystem.play(animId);
        } else if (typeof CharacterAnimation !== 'undefined' && 
                  typeof CharacterAnimation.resetAnimation === 'function') {
            // Legacy system
            CharacterAnimation.resetAnimation(animId);
        }
    }
    
    // Play sound
    playNavigationSound();
}

// Set the active character
function setActiveCharacter(index) {
    // Update cards
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('active');
        if (parseInt(card.dataset.index) === index) {
            card.classList.add('active');
        }
    });
    
    // Update indicators
    document.querySelectorAll('.carousel-indicator').forEach(indicator => {
        indicator.classList.remove('active');
        if (parseInt(indicator.dataset.index) === index) {
            indicator.classList.add('active');
        }
    });
}

// Start a new game
function startNewGame(characterId) {
    // If no character is explicitly provided, use the currently active one
    if (!characterId) {
        characterId = selectedCharacter;
    }
    
    // Make sure we have a character selected
    if (!characterId && characters.length > 0) {
        characterId = characters[currentCharacterIndex].id;
    }
    
    // Ensure we have a valid ID before proceeding
    if (!characterId) {
        console.error("No character selected");
        return;
    }

    fetch('/api/new-game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character_id: characterId }),
    })
    .then(response => response.json())
    .then(data => {
        // Redirect to the game page
        window.location.href = '/game';
    })
    .catch(error => console.error('Error starting new game:', error));
}

// Sound effects
function playNavigationSound() {
    // When we add audio files, we'll uncomment this
    // const sound = new Audio('/static/audio/navigate.mp3');
    // sound.volume = 0.2;
    // sound.play();
}