/**
 * Character Creator for Medical Physics Game
 * Handles the character creation UI and functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const MAX_ATTRIBUTE_VALUE = 10;
    const MIN_ATTRIBUTE_VALUE = 1;
    const TOTAL_ATTRIBUTE_POINTS = 15;
    const MAX_ABILITIES = 2;
    
    // Get character templates data
    const characterTemplates = window.gameCharacters || [];
    
    // Avatar data
    // In a real implementation, this would be loaded from a server
    const avatarImages = [
        '/static/img/characters/physicist.png',
        '/static/img/characters/resident.png',
        '/static/img/characters/qa_specialist.png',
        '/static/img/characters/debug_mode.png'
        // Add more avatar paths here
    ];
    
    // Available abilities
    const availableAbilities = [
        'Critical Analysis',
        'Problem Solving',
        'Clinical Diagnosis',
        'Patient Care',
        'Detail Oriented',
        'Process Improvement',
        'Radiation Safety',
        'Equipment Mastery',
        'Research Methodology',
        'Team Communication',
        'Technical Writing',
        'Data Analysis'
    ];
    
    // DOM Elements
    const avatarGrid = document.getElementById('avatar-grid');
    const prevAvatarBtn = document.getElementById('prev-avatar');
    const nextAvatarBtn = document.getElementById('next-avatar');
    const avatarPageNum = document.getElementById('avatar-page-num');
    const avatarTotalPages = document.getElementById('avatar-total-pages');
    
    const characterNameInput = document.getElementById('character-name');
    const pointsRemainingElement = document.getElementById('points-remaining');
    
    const attributeElements = {
        intelligence: {
            minus: document.getElementById('intelligence-minus'),
            value: document.getElementById('intelligence-value'),
            plus: document.getElementById('intelligence-plus'),
            fill: document.getElementById('intelligence-fill')
        },
        persistence: {
            minus: document.getElementById('persistence-minus'),
            value: document.getElementById('persistence-value'),
            plus: document.getElementById('persistence-plus'),
            fill: document.getElementById('persistence-fill')
        },
        adaptability: {
            minus: document.getElementById('adaptability-minus'),
            value: document.getElementById('adaptability-value'),
            plus: document.getElementById('adaptability-plus'),
            fill: document.getElementById('adaptability-fill')
        }
    };
    
    const abilitiesAvailableElement = document.getElementById('abilities-available');
    const abilitiesSelectedElement = document.getElementById('abilities-selected');
    
    const previewAvatar = document.getElementById('preview-avatar').querySelector('img');
    const previewName = document.getElementById('preview-name');
    const previewIntelligence = document.getElementById('preview-intelligence');
    const previewPersistence = document.getElementById('preview-persistence');
    const previewAdaptability = document.getElementById('preview-adaptability');
    const previewAbilities = document.getElementById('preview-abilities');
    
    const createCharacterBtn = document.getElementById('create-character-btn');
    
    // State
    let state = {
        currentAvatarPage: 1,
        avatarsPerPage: 6,
        selectedAvatar: avatarImages[0],
        characterName: '',
        attributes: {
            intelligence: 5,
            persistence: 5,
            adaptability: 5
        },
        pointsRemaining: TOTAL_ATTRIBUTE_POINTS,
        selectedAbilities: []
    };
    
    // Calculate total attribute points used
    function calculatePointsUsed() {
        return state.attributes.intelligence + 
               state.attributes.persistence + 
               state.attributes.adaptability;
    }
    
    // Calculate points remaining
    function calculatePointsRemaining() {
        const initialPoints = TOTAL_ATTRIBUTE_POINTS + 3 * MIN_ATTRIBUTE_VALUE; // Add minimum values since we start at MIN_ATTRIBUTE_VALUE
        const pointsUsed = calculatePointsUsed();
        return initialPoints - pointsUsed;
    }
    
    // Update UI based on state
    function updateUI() {
        // Update points remaining
        state.pointsRemaining = calculatePointsRemaining();
        pointsRemainingElement.textContent = state.pointsRemaining;
        
        // Update attribute displays
        for (const attribute in state.attributes) {
            const value = state.attributes[attribute];
            const elements = attributeElements[attribute];
            
            // Update value
            elements.value.textContent = value;
            
            // Update fill bar (scale to percentage)
            const percentage = (value / MAX_ATTRIBUTE_VALUE) * 100;
            elements.fill.style.width = `${percentage}%`;
            
            // Handle button states
            elements.minus.disabled = value <= MIN_ATTRIBUTE_VALUE;
            elements.plus.disabled = value >= MAX_ATTRIBUTE_VALUE || state.pointsRemaining <= 0;
        }
        
        // Update preview
        previewName.textContent = state.characterName || 'New Character';
        previewIntelligence.textContent = state.attributes.intelligence;
        previewPersistence.textContent = state.attributes.persistence;
        previewAdaptability.textContent = state.attributes.adaptability;
        
        // Update preview avatar
        previewAvatar.src = state.selectedAvatar;
        
        // Update create button state
        const isNameValid = state.characterName.trim().length > 0;
        const hasAbilities = state.selectedAbilities.length > 0;
        createCharacterBtn.disabled = !isNameValid || !hasAbilities;
        
        if (!isNameValid || !hasAbilities) {
            createCharacterBtn.classList.add('disabled');
        } else {
            createCharacterBtn.classList.remove('disabled');
        }
    }
    
    // Render avatars grid
    function renderAvatarGrid() {
        avatarGrid.innerHTML = '';
        
        const startIndex = (state.currentAvatarPage - 1) * state.avatarsPerPage;
        const endIndex = Math.min(startIndex + state.avatarsPerPage, avatarImages.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const avatarPath = avatarImages[i];
            const avatarItem = document.createElement('div');
            avatarItem.className = 'avatar-item';
            
            if (avatarPath === state.selectedAvatar) {
                avatarItem.classList.add('selected');
            }
            
            const img = document.createElement('img');
            img.src = avatarPath;
            img.alt = `Avatar ${i+1}`;
            img.onerror = function() {
                this.src = '/static/img/characters/debug_mode.png';
            };
            
            avatarItem.appendChild(img);
            avatarItem.addEventListener('click', () => {
                state.selectedAvatar = avatarPath;
                renderAvatarGrid();
                updateUI();
            });
            
            avatarGrid.appendChild(avatarItem);
        }
        
        // Update pagination
        const totalPages = Math.ceil(avatarImages.length / state.avatarsPerPage);
        avatarPageNum.textContent = state.currentAvatarPage;
        avatarTotalPages.textContent = totalPages;
        
        // Update navigation buttons
        prevAvatarBtn.disabled = state.currentAvatarPage <= 1;
        nextAvatarBtn.disabled = state.currentAvatarPage >= totalPages;
    }
    
    // Render abilities lists
    function renderAbilitiesLists() {
        // Render available abilities
        abilitiesAvailableElement.innerHTML = '';
        
        const filteredAvailableAbilities = availableAbilities.filter(
            ability => !state.selectedAbilities.includes(ability)
        );
        
        filteredAvailableAbilities.forEach(ability => {
            const abilityItem = document.createElement('div');
            abilityItem.className = 'ability-item';
            abilityItem.textContent = ability;
            
            abilityItem.addEventListener('click', () => {
                if (state.selectedAbilities.length < MAX_ABILITIES) {
                    state.selectedAbilities.push(ability);
                    renderAbilitiesLists();
                    updatePreviewAbilities();
                    updateUI();
                }
            });
            
            abilitiesAvailableElement.appendChild(abilityItem);
        });
        
        // Render selected abilities
        abilitiesSelectedElement.innerHTML = '';
        
        state.selectedAbilities.forEach(ability => {
            const abilityItem = document.createElement('div');
            abilityItem.className = 'ability-item';
            abilityItem.textContent = ability;
            
            abilityItem.addEventListener('click', () => {
                const index = state.selectedAbilities.indexOf(ability);
                if (index !== -1) {
                    state.selectedAbilities.splice(index, 1);
                    renderAbilitiesLists();
                    updatePreviewAbilities();
                    updateUI();
                }
            });
            
            abilitiesSelectedElement.appendChild(abilityItem);
        });
    }
    
    // Update preview abilities
    function updatePreviewAbilities() {
        previewAbilities.innerHTML = '';
        
        state.selectedAbilities.forEach(ability => {
            const abilityElement = document.createElement('div');
            abilityElement.className = 'preview-ability';
            abilityElement.textContent = ability;
            previewAbilities.appendChild(abilityElement);
        });
    }
    
    // Initialize the UI
    function initialize() {
        // Render avatar grid
        renderAvatarGrid();
        
        // Render abilities lists
        renderAbilitiesLists();
        
        // Update all UI elements
        updateUI();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Avatar navigation
        prevAvatarBtn.addEventListener('click', () => {
            if (state.currentAvatarPage > 1) {
                state.currentAvatarPage--;
                renderAvatarGrid();
            }
        });
        
        nextAvatarBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(avatarImages.length / state.avatarsPerPage);
            if (state.currentAvatarPage < totalPages) {
                state.currentAvatarPage++;
                renderAvatarGrid();
            }
        });
        
        // Character name input
        characterNameInput.addEventListener('input', (e) => {
            state.characterName = e.target.value;
            updateUI();
        });
        
        // Attribute buttons
        for (const attribute in attributeElements) {
            const elements = attributeElements[attribute];
            
            elements.minus.addEventListener('click', () => {
                if (state.attributes[attribute] > MIN_ATTRIBUTE_VALUE) {
                    state.attributes[attribute]--;
                    updateUI();
                }
            });
            
            elements.plus.addEventListener('click', () => {
                if (state.attributes[attribute] < MAX_ATTRIBUTE_VALUE && state.pointsRemaining > 0) {
                    state.attributes[attribute]++;
                    updateUI();
                }
            });
        }
        
        // Create character button
        createCharacterBtn.addEventListener('click', () => {
            if (validateCharacter()) {
                saveCharacter();
            }
        });
    }
    
    // Validate character before saving
    function validateCharacter() {
        let isValid = true;
        let errors = [];
        
        // Validate name
        if (!state.characterName.trim()) {
            errors.push('Character name is required');
            characterNameInput.classList.add('error-border');
            isValid = false;
        } else {
            characterNameInput.classList.remove('error-border');
        }
        
        // Validate abilities
        if (state.selectedAbilities.length === 0) {
            errors.push('At least one ability must be selected');
            abilitiesSelectedElement.parentElement.classList.add('error-border');
            isValid = false;
        } else {
            abilitiesSelectedElement.parentElement.classList.remove('error-border');
        }
        
        // Display errors if any
        if (!isValid) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
        }
        
        return isValid;
    }
    
    // Save character
    function saveCharacter() {
        // Create character object
        const character = {
            id: Date.now(), // Generate a unique ID
            name: state.characterName,
            max_hp: 100, // Default value
            current_hp: 100, // Default value
            abilities: state.selectedAbilities,
            stats: {
                intelligence: state.attributes.intelligence,
                persistence: state.attributes.persistence,
                adaptability: state.attributes.adaptability
            },
            level: 1,
            image: state.selectedAvatar,
            custom: true // Flag to indicate this is a custom character
        };
        
        // Try to save to the server first if API is available
        createCharacterBtn.disabled = true;
        createCharacterBtn.textContent = 'Creating...';
        
        fetch('/api/characters/custom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(character)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save character to server');
            }
            return response.json();
        })
        .then(savedCharacter => {
            console.log('Character saved to server:', savedCharacter);
            
            // Still save to localStorage as fallback/cache
            saveToLocalStorage(savedCharacter);
            
            // Navigate to the game
            window.location.href = '/game';
        })
        .catch(error => {
            console.error('Error saving character to server:', error);
            
            // Fallback to localStorage only approach
            saveToLocalStorage(character);
            
            // Navigate to the game
            window.location.href = '/game';
        })
        .finally(() => {
            createCharacterBtn.disabled = false;
            createCharacterBtn.textContent = 'Create Character';
        });
    }
    
    // Helper to save to localStorage
    function saveToLocalStorage(character) {
        // Get existing custom characters or initialize empty array
        let customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
        
        // Add the new character
        customCharacters.push(character);
        
        // Save to localStorage
        localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
        
        // Save as selected character
        localStorage.setItem('selectedCharacter', JSON.stringify(character));
    }
    
    // Starting point - initialize the UI
    initialize();
});