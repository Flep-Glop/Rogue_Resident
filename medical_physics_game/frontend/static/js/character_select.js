/**
 * Character Selection for Medical Physics Game
 * Handles displaying and selecting character templates and custom characters
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const characterCards = document.getElementById('character-cards');
    const characterDetails = document.getElementById('character-details');
    const selectButton = document.getElementById('select-button');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    
    // State
    let characters = [];
    let currentIndex = 0;
    let selectedCharacter = null;
    
    // Initialize character selection
    function initialize() {
        // Load template characters
        loadTemplateCharacters();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Load template characters and custom characters
    function loadTemplateCharacters() {
        // Define default template characters
        const templateCharacters = window.gameCharacters || [];
        
        // Load custom characters from localStorage
        try {
            const customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
            if (customCharacters.length > 0) {
                // Format custom characters to match the standard character format
                const formattedCustomChars = customCharacters.map(char => ({
                    id: char.id,
                    name: char.name,
                    description: char.description || 'Custom character with unique abilities.',
                    stats: {
                        intelligence: char.stats.intelligence,
                        persistence: char.stats.persistence,
                        adaptability: char.stats.adaptability
                    },
                    abilities: char.abilities,
                    image: char.image,
                    custom: true
                }));
                
                // Use only custom characters - templates are now optional
                characters = [...formattedCustomChars];
            } else {
                // No custom characters found - will show create prompt
                characters = [];
            }
        } catch (error) {
            console.error('Error loading custom characters:', error);
            characters = [];
        }
        
        // Render characters or create prompt
        renderCharacters();
    }
    
    // Render all character cards or prompt to create
    function renderCharacters() {
        if (!characters || !Array.isArray(characters)) {
            console.error('Error loading characters:', characters);
            return;
        }
        
        characterCards.innerHTML = '';
        
        // If no characters exist, show a create character prompt
        if (characters.length === 0) {
            // Hide carousel buttons when no characters
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            
            // Hide character details section
            characterDetails.innerHTML = '';
            
            // Disable select button
            if (selectButton) {
                selectButton.disabled = true;
                selectButton.classList.add('disabled');
            }
            
            // Show create character prompt
            const createPrompt = document.createElement('div');
            createPrompt.className = 'create-character-prompt';
            createPrompt.innerHTML = `
                <div class="prompt-icon">
                    <img src="/static/img/characters/debug_mode.png" alt="Create Character">
                </div>
                <h2>No Characters Found</h2>
                <p>You don't have any characters yet. Create your first character to begin your medical physics journey!</p>
                <a href="/character-create" class="retro-btn start prompt-create-btn">Create Your Character</a>
            `;
            
            characterCards.appendChild(createPrompt);
            return;
        }
        
        // Show carousel buttons when characters exist
        if (prevButton) prevButton.style.display = 'block';
        if (nextButton) nextButton.style.display = 'block';
        
        // Enable select button
        if (selectButton) {
            selectButton.disabled = false;
            selectButton.classList.remove('disabled');
        }
        
        // Render existing characters
        characters.forEach((character, index) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            if (character.custom) {
                card.classList.add('custom-character');
            }
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="character-portrait">
                    <img src="${character.image}" alt="${character.name}" onerror="this.src='/static/img/characters/debug_mode.png'">
                </div>
                <h2 class="character-name">${character.name}</h2>
                <p class="character-description">${character.description}</p>
                ${character.custom ? '<div class="custom-badge">Custom</div>' : ''}
            `;
            
            card.addEventListener('click', () => selectCharacter(index));
            characterCards.appendChild(card);
        });
        
        // Select the first character by default
        if (characters.length > 0) {
            selectCharacter(0);
            updateCarousel();
        }
    }
    
    // Select a character and show details
    function selectCharacter(index) {
        // Check if we have any characters
        if (characters.length === 0 || index < 0 || index >= characters.length) {
            // Clear selection when no characters
            selectedCharacter = null;
            window.selectedCharacter = null;
            characterDetails.innerHTML = '';
            return;
        }
        
        // Update current index
        currentIndex = index;
        selectedCharacter = characters[index];
        
        // Make the selected character available globally
        window.selectedCharacter = selectedCharacter;
        
        // Update active card
        document.querySelectorAll('.character-card').forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        // Show character details
        characterDetails.innerHTML = `
            <h2>${selectedCharacter.name}</h2>
            <div class="character-stats">
                ${Object.entries(selectedCharacter.stats).map(([stat, value]) => `
                    <div class="character-stat">
                        <div class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}:</div>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${value * 10}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="character-abilities">
                ${selectedCharacter.abilities.map(ability => `
                    <span class="ability-tag">${ability}</span>
                `).join('')}
            </div>
        `;
        
        updateCarousel();
    }
    
    // Navigate carousel
    function navigateCarousel(direction) {
        const totalCharacters = characters ? characters.length : 0;
        if (totalCharacters === 0) return;
        
        if (direction === 'prev') {
            currentIndex = (currentIndex - 1 + totalCharacters) % totalCharacters;
        } else {
            currentIndex = (currentIndex + 1) % totalCharacters;
        }
        
        selectCharacter(currentIndex);
    }
    
    // Update carousel position
    function updateCarousel() {
        if (!characters || characters.length === 0) return;
        
        const cardWidth = 270; // Width + margins
        const offset = -currentIndex * cardWidth;
        characterCards.style.transform = `translateX(${offset}px)`;
    }
    
    // Delete a character (for future implementation)
    function deleteCharacter(characterId) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this character? This cannot be undone.')) {
            return;
        }
        
        try {
            // Get existing custom characters
            let customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
            
            // Filter out the character to delete
            customCharacters = customCharacters.filter(char => char.id !== characterId);
            
            // Save back to localStorage
            localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
            
            // Reload characters
            loadTemplateCharacters();
            
            // If the selected character was deleted, select the first available character
            if (selectedCharacter && selectedCharacter.id === characterId) {
                if (characters.length > 0) {
                    selectCharacter(0);
                } else {
                    selectedCharacter = null;
                    window.selectedCharacter = null;
                }
            }
        } catch (error) {
            console.error('Error deleting character:', error);
            alert('Failed to delete character. Please try again.');
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Navigation buttons
        if (prevButton) {
            prevButton.addEventListener('click', () => navigateCarousel('prev'));
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => navigateCarousel('next'));
        }
        
        // Select button
        if (selectButton) {
            selectButton.addEventListener('click', () => {
                if (selectedCharacter) {
                    // Store selected character in localStorage
                    localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                    // Navigate to game
                    window.location.href = '/game';
                }
            });
        }
        
        // Handle keyboard navigation - only when characters exist
        document.addEventListener('keydown', (e) => {
            if (characters.length === 0) return;
            
            if (e.key === 'ArrowLeft') {
                navigateCarousel('prev');
            } else if (e.key === 'ArrowRight') {
                navigateCarousel('next');
            } else if (e.key === 'Enter' && selectButton && !selectButton.disabled) {
                selectButton.click();
            }
        });
        
        // When in "no characters" state, 'Enter' key should trigger character creation
        document.addEventListener('keydown', (e) => {
            if (characters.length === 0 && e.key === 'Enter') {
                window.location.href = '/character-create';
            }
        });
    }
    
    // Initialize
    initialize();
});