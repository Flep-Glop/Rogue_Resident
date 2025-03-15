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
    // Set up skill tree container
    initializeSkillTreeContainer();
    
    // Add skill tree button after character selection is complete
    document.addEventListener('charactersLoaded', enhanceCharacterSelection);
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
// Add this code to character_select.js (or at the end of your script block in character_select.html)

// Initialize skill tree container when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up skill tree container
    initializeSkillTreeContainer();
    
    // Add skill tree button after character selection is complete
    document.addEventListener('charactersLoaded', enhanceCharacterSelection);
});

// Initialize skill tree container
function initializeSkillTreeContainer() {
    // Check if container already exists
    let container = document.getElementById('skill-tree-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'skill-tree-container';
        
        // Create inner structure
        container.innerHTML = `
            <div class="skill-tree-panel">
                <div class="skill-tree-header">
                    <h2>Specialization Tree</h2>
                    <button class="skill-tree-close-button">&times;</button>
                </div>
                <div id="skill-tree-visualization"></div>
                <div id="skill-tree-ui"></div>
            </div>
        `;
        
        // Add close button functionality
        const closeButton = container.querySelector('.skill-tree-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', toggleSkillTree);
        }
        
        document.body.appendChild(container);
    }
    
    return container;
}

// Add skill tree button to character cards
function enhanceCharacterSelection() {
    console.log("Enhancing character selection with specialization tree buttons");
    
    // Add button below each character card
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach(card => {
        // Check if button already exists
        if (card.querySelector('.skill-tree-access-button')) return;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'character-buttons';
        buttonContainer.style.textAlign = 'center';
        buttonContainer.style.marginTop = '10px';
        
        // Create specialization button
        const specButton = document.createElement('button');
        specButton.className = 'skill-tree-access-button';
        specButton.textContent = 'View Specializations';
        
        // Get character ID
        const characterId = card.dataset.characterId;
        
        // Add button click handler
        specButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent character selection when clicking button
            
            // Update selected character first
            selectedCharacter = characterId;
            const index = parseInt(card.dataset.index);
            navigateToCharacter(index);
            
            // Show skill tree
            toggleSkillTree();
        });
        
        buttonContainer.appendChild(specButton);
        
        // Add button container to card - right before the special ability section
        const specialAbility = card.querySelector('.special-ability');
        if (specialAbility) {
            card.insertBefore(buttonContainer, specialAbility);
        } else {
            card.appendChild(buttonContainer);
        }
    });
    
    // Add CSS for the button if needed
    addSkillTreeStyles();
}

// Function to toggle skill tree visibility
function toggleSkillTree() {
    const container = document.getElementById('skill-tree-container');
    if (!container) {
        console.error("Skill tree container not found");
        return;
    }
    
    // Toggle visibility
    container.classList.toggle('visible');
    
    // If now visible, ensure skill tree is loaded
    if (container.classList.contains('visible')) {
        // Initialize skill tree if needed
        initializeSkillTree();
    }
}

// Initialize skill tree (or load character's skill tree)
function initializeSkillTree() {
    // Get the selected character ID
    const characterId = selectedCharacter;
    
    if (!characterId) {
        console.warn("No character selected for skill tree");
        return;
    }
    
    console.log(`Loading skill tree for character: ${characterId}`);
    
    // Check if required libraries are loaded
    if (typeof SkillTreeController === 'undefined') {
        console.error("SkillTreeController not available. Loading required scripts...");
        
        // Load required scripts dynamically
        loadSkillTreeScripts().then(() => {
            // Initialize skill tree after scripts are loaded
            initializeSkillTreeComponents(characterId);
        });
    } else {
        // Initialize skill tree directly
        initializeSkillTreeComponents(characterId);
    }
}

// Initialize skill tree components
function initializeSkillTreeComponents(characterId) {
    // Check if already initialized
    if (typeof SkillTreeController !== 'undefined' && SkillTreeController.initialized) {
        // Just load character skill tree
        if (typeof SkillTreeManager !== 'undefined' && 
            typeof SkillTreeManager.loadCharacterSkillTree === 'function') {
            SkillTreeManager.loadCharacterSkillTree(characterId);
        }
        return;
    }
    
    // Initialize components in the right order
    if (typeof SkillEffectSystem !== 'undefined' && !SkillEffectSystem.initialized) {
        SkillEffectSystem.initialize();
    }
    
    if (typeof SkillTreeManager !== 'undefined' && !SkillTreeManager.initialized) {
        SkillTreeManager.initialize();
    }
    
    if (typeof SkillTreeController !== 'undefined' && !SkillTreeController.initialized) {
        SkillTreeController.initialize({
            renderContainerId: 'skill-tree-visualization',
            uiContainerId: 'skill-tree-ui'
        });
    }
}

// Load required skill tree scripts dynamically
function loadSkillTreeScripts() {
    return new Promise((resolve, reject) => {
        const scripts = [
            '/static/js/engine/skill_effect_system.js',
            '/static/js/engine/skill_tree_manager.js',
            '/static/js/ui/skill_tree_renderer.js',
            '/static/js/ui/skill_tree_ui.js',
            '/static/js/ui/skill_tree_controller.js'
        ];
        
        let loaded = 0;
        
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loaded++;
                if (loaded === scripts.length) {
                    resolve();
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    });
}

// Add required CSS styles for skill tree button and modal
function addSkillTreeStyles() {
    // Check if styles already added
    if (document.getElementById('skill-tree-access-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'skill-tree-access-styles';
    styleEl.textContent = `
        /* Skill Tree Modal Container */
        #skill-tree-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 1000;
            display: none;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        
        #skill-tree-container.visible {
            display: flex;
        }
        
        /* Skill Tree Panel */
        .skill-tree-panel {
            width: 90%;
            height: 90%;
            max-width: 1400px;
            background-color: #1A1E2A;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: skill-tree-panel-enter 0.3s ease forwards;
        }
        
        @keyframes skill-tree-panel-enter {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        
        /* Skill Tree Header */
        .skill-tree-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background-color: #2A2E3A;
            border-bottom: 1px solid #444444;
        }
        
        .skill-tree-header h2 {
            margin: 0;
            font-size: 18px;
            color: white;
        }
        
        .skill-tree-close-button {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 4px;
        }
        
        .skill-tree-close-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Skill Tree Access Button */
        .skill-tree-access-button {
            background-color: #4287f5;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            margin-top: 10px;
        }
        
        .skill-tree-access-button:hover {
            background-color: #5b8dd9;
            transform: translateY(-2px);
        }
        
        .skill-tree-access-button:before {
            content: '⚛';
            margin-right: 8px;
        }
    `;
    
    document.head.appendChild(styleEl);
}

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
    // Modify fetchCharacters function to emit an event when characters are loaded
    const originalFetchCharacters = fetchCharacters;
    fetchCharacters = function() {
        originalFetchCharacters();
        
        // Add a delay to allow characters to be rendered
        setTimeout(() => {
            // Dispatch event that characters have been loaded
            const event = new CustomEvent('charactersLoaded');
            document.dispatchEvent(event);
        }, 1000);
    };
}

// Updated renderCharacters function
function renderCharacters(characters) {
    const carousel = document.getElementById('character-carousel');
    const indicators = document.getElementById('carousel-indicators');
    const counter = document.getElementById('character-counter');
    
    // Clear any existing content
    carousel.innerHTML = '';
    indicators.innerHTML = '';
    
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
        
        // Get character image path using the CharacterAssets helper
        const imagePath = CharacterAssets.getCharacterImagePath(character.id);
        
        card.innerHTML = `
            <div class="character-header">
                <h3>${character.name}</h3>
            </div>
            <div class="character-avatar">
                <img src="${imagePath}" alt="${character.name}" class="pixel-character-img">
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
    });
    
    // Show counter
    counter.textContent = `Character 1 of ${characters.length}`;
    
    // Set up initial state
    setActiveCharacter(0);
    
    // Enable the start button immediately - it will use the active character
    document.getElementById('start-game-btn').disabled = false;
}

// Navigate the carousel
function navigateCarousel(direction) {
    const newIndex = (currentCharacterIndex + direction + characters.length) % characters.length;
    navigateToCharacter(newIndex);
}

// Navigate to specific character
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