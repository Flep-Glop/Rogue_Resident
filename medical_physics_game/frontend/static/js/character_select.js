// New simplified character_select.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded for character selection');
    
    // DOM elements
    const characterContainer = document.getElementById('character-container');
    const selectButton = document.getElementById('select-button');
    
    // State
    let characters = [];
    let selectedCharacter = null;
    
    // Load characters
    function loadCharacters() {
        // Load template characters
        const templateCharacters = window.gameCharacters || [];
        console.log('Characters available:', templateCharacters);
        
        // Load custom characters
        const customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
        
        // Combine all characters
        characters = [...customCharacters, ...templateCharacters];
        console.log('Total characters loaded:', characters.length);
        
        // Render the characters
        renderCharacters();
        
        // Select first character by default
        if (characters.length > 0) {
            selectCharacter(0);
        }
    }
    
    // Render characters in a simple grid
    function renderCharacters() {
        if (!characterContainer) return;
        
        // Clear container
        characterContainer.innerHTML = '';
        
        if (characters.length === 0) {
            // Show message if no characters
            characterContainer.innerHTML = `
                <div class="empty-message">
                    <p>No characters found. Create your first character!</p>
                </div>
            `;
            if (selectButton) selectButton.disabled = true;
            return;
        }
        
        // Create character cards
        characters.forEach((character, index) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="card-avatar">
                    <img src="${character.image || '/static/img/characters/debug_mode.png'}" alt="${character.name}">
                </div>
                <h3 class="card-name">${character.name}</h3>
                <div class="card-stats">
                    ${Object.entries(character.stats || {}).map(([stat, value]) => `
                        <div class="stat-item">
                            <span class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${value * 10}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="card-abilities">
                    ${character.abilities ? character.abilities.map(ability => `
                        <span class="ability-tag">${ability}</span>
                    `).join('') : ''}
                </div>
                ${character.custom ? '<button class="delete-btn" data-id="' + character.id + '">×</button>' : ''}
            `;
            
            // Add click event
            card.addEventListener('click', () => {
                selectCharacter(index);
            });
            
            // Add to container
            characterContainer.appendChild(card);
        });
        
        // Set up delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Are you sure you want to delete this character?')) {
                    deleteCharacter(id);
                }
            });
        });
    }
    
    // Select character
    function selectCharacter(index) {
        if (index < 0 || index >= characters.length) return;
        
        selectedCharacter = characters[index];
        console.log('Selected character:', selectedCharacter);
        
        // Update selected state
        document.querySelectorAll('.character-card').forEach((card, i) => {
            if (i === index) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        
        // Enable select button
        if (selectButton) {
            selectButton.disabled = false;
        }
    }
    
    // Delete character
    function deleteCharacter(id) {
        // Get custom characters
        let customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
        
        // Remove character
        customCharacters = customCharacters.filter(char => char.id != id);
        
        // Save back to localStorage
        localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
        
        // Reload characters
        characters = characters.filter(char => char.id != id);
        
        // Re-render
        renderCharacters();
        
        // Select first character if available
        if (characters.length > 0) {
            selectCharacter(0);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Select button
        if (selectButton) {
            selectButton.addEventListener('click', () => {
                if (!selectedCharacter) return;
                
                // Save selection to localStorage
                localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                
                // Navigate to game
                window.location.href = '/game';
            });
        }
    }
    
    // Initialize
    loadCharacters();
    setupEventListeners();
});