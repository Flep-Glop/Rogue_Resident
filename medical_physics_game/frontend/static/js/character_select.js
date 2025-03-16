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
        // Define fallback characters in case the game assets aren't loaded
        const fallbackCharacters = [
            {
                id: 'physicist',
                name: 'Physicist',
                description: 'Strong analytical skills and problem-solving abilities.',
                stats: {
                    intelligence: 9,
                    persistence: 7,
                    adaptability: 6
                },
                abilities: ['Critical Analysis', 'Problem Solving'],
                image: '/static/img/characters/physicist.png'
            },
            {
                id: 'resident',
                name: 'Resident',
                description: 'Well-rounded with clinical knowledge and patient care experience.',
                stats: {
                    intelligence: 7,
                    persistence: 8,
                    adaptability: 8
                },
                abilities: ['Clinical Diagnosis', 'Patient Care'],
                image: '/static/img/characters/resident.png'
            },
            {
                id: 'qa_specialist',
                name: 'QA Specialist',
                description: 'Detail-oriented with exceptional testing and validation skills.',
                stats: {
                    intelligence: 8,
                    persistence: 9,
                    adaptability: 6
                },
                abilities: ['Detail Oriented', 'Process Improvement'],
                image: '/static/img/characters/qa_specialist.png'
            }
        ];
        
        // Try to load character data from window.gameCharacters (set by character_assets.js)
        // If not available, use the fallback characters
        let templateCharacters = window.gameCharacters || fallbackCharacters;
        
        // Load custom characters from localStorage
        try {
            const customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
            if (customCharacters.length > 0) {
                // Format custom characters to match the standard character format
                const formattedCustomChars = customCharacters.map(char => ({
                    id: char.id,
                    name: char.name,
                    description: 'Custom character with unique abilities.',
                    stats: {
                        intelligence: char.stats.intelligence,
                        persistence: char.stats.persistence,
                        adaptability: char.stats.adaptability
                    },
                    abilities: char.abilities,
                    image: char.image,
                    custom: true
                }));
                
                // Add custom characters to the beginning of the array
                characters = [...formattedCustomChars, ...templateCharacters];
            } else {
                characters = templateCharacters;
            }
        } catch (error) {
            console.error('Error loading custom characters:', error);
            characters = templateCharacters;
        }
        
        // Render characters
        renderCharacters();
    }
    
    // Render all character cards
    function renderCharacters() {
        if (!characters || !Array.isArray(characters)) {
            console.error('Error loading characters:', characters);
            return;
        }
        
        characterCards.innerHTML = '';
        
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
        selectCharacter(0);
        updateCarousel();
    }
    
    // Select a character and show details
    function selectCharacter(index) {
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
    
    // Set up event listeners
    function setupEventListeners() {
        // Navigation buttons
        prevButton.addEventListener('click', () => navigateCarousel('prev'));
        nextButton.addEventListener('click', () => navigateCarousel('next'));
        
        // Select button
        selectButton.addEventListener('click', () => {
            if (selectedCharacter) {
                // Store selected character in localStorage
                localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                // Navigate to game
                window.location.href = '/game';
            }
        });
        
        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                navigateCarousel('prev');
            } else if (e.key === 'ArrowRight') {
                navigateCarousel('next');
            } else if (e.key === 'Enter') {
                selectButton.click();
            }
        });
    }
    
    // Initialize
    initialize();
});