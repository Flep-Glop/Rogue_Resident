/**
 * Character Party Selection
 * 
 * This module handles the character party selection screen functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // State management
    const CharacterStateManager = {
        state: {
            characters: [],
            selectedCharacterIndex: null,
            isLoading: false,
            error: null,
            visibleCharacters: [],
            centerIndex: 0,
            maxVisibleCharacters: 5
        },

        init: function() {
            this.loadCharacters();
        },

        getState: function() {
            return {...this.state};
        },

        setState: function(newState) {
            this.state = {...this.state, ...newState};
            EventSystem.publish('stateChanged', this.state);
        },

        loadCharacters: function() {
            this.setState({isLoading: true, error: null});
            
            try {
                // Load template characters from global variable
                const templateCharacters = window.gameCharacters || [];
                
                // Load custom characters from localStorage
                let customCharacters = [];
                try {
                    customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
                } catch (e) {
                    console.error('Error parsing custom characters:', e);
                    UI.showToast('Error loading custom characters', 'error');
                }
                
                // API call to get server-side characters
                fetch('/api/characters')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch characters');
                        }
                        return response.json();
                    })
                    .then(serverCharacters => {
                        this.processCharacters([...customCharacters, ...templateCharacters, ...serverCharacters]);
                    })
                    .catch(error => {
                        console.error('Error fetching characters from API:', error);
                        this.processCharacters([...customCharacters, ...templateCharacters]);
                    });
            } catch (error) {
                console.error('Error loading characters:', error);
                this.setState({
                    isLoading: false, 
                    error: 'Failed to load characters'
                });
                UI.showToast('Error loading characters', 'error');
            }
        },

        processCharacters: function(characters) {
            // Deduplicate characters based on ID
            const uniqueCharacters = Array.from(
                new Map(characters.map(char => [char.id, char])).values()
            );
            
            // Sort characters (custom first, then standard)
            uniqueCharacters.sort((a, b) => {
                if (a.custom && !b.custom) return -1;
                if (!a.custom && b.custom) return 1;
                return 0;
            });
            
            this.setState({
                characters: uniqueCharacters,
                isLoading: false
            });
            
            // Set up visible characters
            this.updateVisibleCharacters();
            
            // Select first character by default if available
            if (uniqueCharacters.length > 0) {
                this.selectCharacter(0);
            }
        },

        // Update which characters are visible in the party lineup
        updateVisibleCharacters: function() {
            const { characters, centerIndex, maxVisibleCharacters } = this.state;
            
            if (characters.length === 0) {
                this.setState({ visibleCharacters: [] });
                return;
            }
            
            // Calculate how many characters to show on each side of center
            const sideCount = Math.floor(maxVisibleCharacters / 2);
            
            // Calculate start and end indices
            let startIdx = centerIndex - sideCount;
            let endIdx = centerIndex + sideCount;
            
            // Adjust if out of bounds
            if (startIdx < 0) {
                endIdx = Math.min(endIdx - startIdx, characters.length - 1);
                startIdx = 0;
            }
            
            if (endIdx >= characters.length) {
                startIdx = Math.max(0, startIdx - (endIdx - characters.length + 1));
                endIdx = characters.length - 1;
            }
            
            // Get the visible characters
            const visibleCharacters = characters.slice(startIdx, endIdx + 1);
            
            this.setState({ 
                visibleCharacters,
                centerIndex
            });
        },

        selectCharacter: function(index) {
            if (index < 0 || index >= this.state.characters.length) return;
            
            this.setState({ 
                selectedCharacterIndex: index,
                centerIndex: index
            });
            
            // Update visible characters based on new center
            this.updateVisibleCharacters();
            
            EventSystem.publish('characterSelected', this.state.characters[index]);
        },

        nextCharacter: function() {
            const { selectedCharacterIndex, characters } = this.state;
            if (selectedCharacterIndex < characters.length - 1) {
                this.selectCharacter(selectedCharacterIndex + 1);
            }
        },

        prevCharacter: function() {
            const { selectedCharacterIndex } = this.state;
            if (selectedCharacterIndex > 0) {
                this.selectCharacter(selectedCharacterIndex - 1);
            }
        },

        deleteCharacter: function(id) {
            // Get custom characters from localStorage
            let customCharacters = [];
            try {
                customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
                
                // Remove character with matching id
                customCharacters = customCharacters.filter(char => char.id != id);
                
                // Save back to localStorage
                localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
                
                // Try to delete from server if API is available
                fetch(`/api/characters/${id}`, {
                    method: 'DELETE'
                }).catch(error => {
                    console.log('Could not delete from server, character removed from local storage only');
                });
                
                // Update current state
                const updatedCharacters = this.state.characters.filter(char => char.id != id);
                
                // Update selected index if needed
                let newSelectedIndex = this.state.selectedCharacterIndex;
                if (updatedCharacters.length === 0) {
                    newSelectedIndex = null;
                } else if (this.state.selectedCharacterIndex >= updatedCharacters.length) {
                    newSelectedIndex = updatedCharacters.length - 1;
                }
                
                this.setState({
                    characters: updatedCharacters,
                    selectedCharacterIndex: newSelectedIndex
                });
                
                // Update visible characters
                this.updateVisibleCharacters();
                
                UI.showToast('Character deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting character:', error);
                UI.showToast('Error deleting character', 'error');
            }
        },

        saveSelection: function() {
            if (this.state.selectedCharacterIndex === null) return;
            
            const selectedCharacter = this.state.characters[this.state.selectedCharacterIndex];
            
            // Save to localStorage
            localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
            
            // Navigate to game
            window.location.href = '/game';
        }
    };

    // UI Manager
    const UI = {
        elements: {
            characterLineup: document.getElementById('character-lineup'),
            characterDetails: document.getElementById('character-details'),
            selectButton: document.getElementById('select-button'),
            prevButton: document.getElementById('prev-character'),
            nextButton: document.getElementById('next-character')
        },

        init: function() {
            this.setupEventListeners();
            this.setupStateSubscription();
        },

        setupEventListeners: function() {
            // Select button
            if (this.elements.selectButton) {
                this.elements.selectButton.addEventListener('click', () => {
                    CharacterStateManager.saveSelection();
                });
            }
            
            // Navigation buttons
            if (this.elements.prevButton) {
                this.elements.prevButton.addEventListener('click', () => {
                    CharacterStateManager.prevCharacter();
                });
            }
            
            if (this.elements.nextButton) {
                this.elements.nextButton.addEventListener('click', () => {
                    CharacterStateManager.nextCharacter();
                });
            }
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    CharacterStateManager.prevCharacter();
                } else if (e.key === 'ArrowRight') {
                    CharacterStateManager.nextCharacter();
                } else if (e.key === 'Enter') {
                    if (CharacterStateManager.getState().selectedCharacterIndex !== null) {
                        CharacterStateManager.saveSelection();
                    }
                }
            });
        },

        setupStateSubscription: function() {
            EventSystem.subscribe('stateChanged', (state) => {
                this.updateUI(state);
            });
            
            EventSystem.subscribe('characterSelected', (character) => {
                this.updateCharacterDetails(character);
            });
        },

        updateUI: function(state) {
            this.renderCharacterLineup(state);
            this.updateSelectButton(state);
            
            // Show loading state if needed
            if (state.isLoading) {
                this.showLoadingState();
            }
            
            // Show error if present
            if (state.error) {
                this.showToast(state.error, 'error');
            }
            
            // Update navigation buttons
            this.updateNavigationButtons(state);
        },

        showLoadingState: function() {
            if (!this.elements.characterLineup) return;
            
            this.elements.characterLineup.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading characters...</div>
                </div>
            `;
        },

        renderCharacterLineup: function(state) {
            if (!this.elements.characterLineup) return;
            
            // Early return if still loading
            if (state.isLoading) return;
            
            // Clear container
            this.elements.characterLineup.innerHTML = '';
            
            if (state.characters.length === 0) {
                // Show empty state with just the "new character" slot
                this.elements.characterLineup.innerHTML = `
                    <a href="/character-create" class="new-character-slot">
                        <div class="new-icon">+</div>
                    </a>
                `;
                return;
            }
            
            // Create visible character figures
            state.visibleCharacters.forEach((character, index) => {
                const absoluteIndex = state.characters.indexOf(character);
                const isSelected = absoluteIndex === state.selectedCharacterIndex;
                
                const figure = document.createElement('div');
                figure.className = 'character-figure';
                
                if (isSelected) {
                    figure.classList.add('selected');
                }
                
                // Create figure HTML
                figure.innerHTML = `
                    <div class="selection-indicator">
                        <i class="fas fa-caret-down"></i>
                    </div>
                    <div class="character-avatar">
                        <img src="${character.image || '/static/img/characters/debug_mode.png'}" 
                             alt="${character.name}"
                             onerror="this.src='/static/img/characters/debug_mode.png'">
                        ${character.custom ? '<div class="custom-badge">Custom</div>' : ''}
                        ${character.custom ? '<button class="delete-btn" data-id="' + character.id + '" aria-label="Delete character"><i class="fas fa-times"></i></button>' : ''}
                    </div>
                    <div class="character-name">${character.name}</div>
                `;
                
                // Add click event to select character
                figure.addEventListener('click', (e) => {
                    // Don't select if clicking delete button
                    if (e.target.closest('.delete-btn')) return;
                    CharacterStateManager.selectCharacter(absoluteIndex);
                });
                
                // Add to lineup
                this.elements.characterLineup.appendChild(figure);
            });
            
            // Add "new character" slot at the end if we're showing the last characters
            if (state.centerIndex + Math.floor(state.maxVisibleCharacters / 2) >= state.characters.length - 1) {
                const newSlot = document.createElement('a');
                newSlot.href = '/character-create';
                newSlot.className = 'new-character-slot';
                newSlot.innerHTML = '<div class="new-icon">+</div>';
                this.elements.characterLineup.appendChild(newSlot);
            }
            
            // Add delete button event listeners
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    this.confirmDelete(id);
                });
            });
        },

        updateCharacterDetails: function(character) {
            if (!this.elements.characterDetails) return;
            
            // Create stats HTML
            let statsHtml = '';
            if (character.stats) {
                // Get stats
                const stats = {
                    intelligence: character.stats.intelligence || 5,
                    persistence: character.stats.persistence || 5,
                    adaptability: character.stats.adaptability || 5
                };
                
                // Calculate percentages for bars
                const intelligenceWidth = (stats.intelligence / 10) * 100;
                const persistenceWidth = (stats.persistence / 10) * 100;
                const adaptabilityWidth = (stats.adaptability / 10) * 100;
                
                statsHtml = `
                    <div class="character-stats">
                        <div class="stat-group stat-intelligence">
                            <div class="stat-label">Intelligence: ${stats.intelligence}</div>
                            <div class="stat-bar-container">
                                <div class="stat-bar" style="width: ${intelligenceWidth}%"></div>
                            </div>
                        </div>
                        <div class="stat-group stat-persistence">
                            <div class="stat-label">Persistence: ${stats.persistence}</div>
                            <div class="stat-bar-container">
                                <div class="stat-bar" style="width: ${persistenceWidth}%"></div>
                            </div>
                        </div>
                        <div class="stat-group stat-adaptability">
                            <div class="stat-label">Adaptability: ${stats.adaptability}</div>
                            <div class="stat-bar-container">
                                <div class="stat-bar" style="width: ${adaptabilityWidth}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Create abilities HTML
            let abilitiesHtml = '';
            if (character.abilities && character.abilities.length > 0) {
                abilitiesHtml = `
                    <div class="ability-label">Abilities:</div>
                    <div class="character-abilities">
                        ${character.abilities.map(ability => `
                            <span class="ability-tag">${ability}</span>
                        `).join('')}
                    </div>
                `;
            }
            
            // Assemble details panel
            this.elements.characterDetails.innerHTML = `
                <h3 class="character-detail-name">${character.name}</h3>
                ${character.description ? `<p class="character-description">${character.description}</p>` : ''}
                ${statsHtml}
                ${abilitiesHtml}
            `;
        },

        updateSelectButton: function(state) {
            if (!this.elements.selectButton) return;
            
            // Disable if no character selected
            this.elements.selectButton.disabled = state.selectedCharacterIndex === null;
            
            // Update button text/icon
            if (state.selectedCharacterIndex !== null) {
                const selectedName = state.characters[state.selectedCharacterIndex].name;
                this.elements.selectButton.innerHTML = `<i class="fas fa-check"></i> Play as ${selectedName}`;
            } else {
                this.elements.selectButton.innerHTML = 'Select Character';
            }
        },
        
        updateNavigationButtons: function(state) {
            // Update visibility of navigation buttons
            const { selectedCharacterIndex, characters } = state;
            
            if (this.elements.prevButton) {
                this.elements.prevButton.disabled = selectedCharacterIndex <= 0;
                this.elements.prevButton.style.visibility = characters.length <= 1 ? 'hidden' : 'visible';
            }
            
            if (this.elements.nextButton) {
                this.elements.nextButton.disabled = selectedCharacterIndex >= characters.length - 1;
                this.elements.nextButton.style.visibility = characters.length <= 1 ? 'hidden' : 'visible';
            }
        },

        // Confirm delete with modal
        confirmDelete: function(id) {
            // Find character name
            const state = CharacterStateManager.getState();
            const character = state.characters.find(c => c.id == id);
            const characterName = character ? character.name : 'this character';
            
            // Simple confirm for now - could be enhanced with a custom modal
            if (confirm(`Are you sure you want to delete ${characterName}?`)) {
                CharacterStateManager.deleteCharacter(id);
            }
        },

        // Show toast notifications
        showToast: function(message, type = 'info') {
            // Create toast container if it doesn't exist
            let toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'toast-container';
                document.body.appendChild(toastContainer);
            }
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            // Set icon based on type
            let icon = 'info-circle';
            if (type === 'success') icon = 'check-circle';
            if (type === 'error') icon = 'exclamation-circle';
            
            // Add content
            toast.innerHTML = `
                <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
                <div class="toast-message">${message}</div>
            `;
            
            // Add to container
            toastContainer.appendChild(toast);
            
            // Remove after delay
            setTimeout(() => {
                toast.classList.add('fadeout');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }
    };

    // Event System
    const EventSystem = {
        events: {},
        subscribe: function(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
            return () => this.unsubscribe(event, callback);
        },
        publish: function(event, data) {
            if (!this.events[event]) return;
            this.events[event].forEach(callback => callback(data));
        },
        unsubscribe: function(event, callback) {
            if (!this.events[event]) return;
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    };

    // Background effects
    function initBackgroundEffects() {
        // Generate star background
        const starBg = document.getElementById('star-bg');
        if (starBg) {
            // Create stars
            for (let i = 0; i < 70; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 4}s`;
                star.style.width = `${1 + Math.random() * 2}px`;
                star.style.height = star.style.width;
                starBg.appendChild(star);
            }
        }

        // Add lab equipment to background
        const labEnvironment = document.querySelector('.lab-environment');
        if (labEnvironment) {
            // Add some simple lab equipment shapes
            const equipment = [
                { width: 40, height: 80, top: 30, left: 80 },
                { width: 60, height: 40, top: 30, left: 80 + 50 },
                { width: 30, height: 60, top: 30, left: 80 + 50 + 70 },
                { width: 50, height: 90, top: 30, right: 80 },
                { width: 70, height: 30, top: 130, right: 80 + 80 }
            ];
            
            equipment.forEach(item => {
                const elem = document.createElement('div');
                elem.style.position = 'absolute';
                elem.style.width = `${item.width}px`;
                elem.style.height = `${item.height}px`;
                elem.style.backgroundColor = 'var(--color-lab-equipment, #2a3049)';
                elem.style.borderRadius = '3px';
                elem.style.border = '1px solid rgba(91, 141, 217, 0.3)';
                
                if (item.top) elem.style.top = `${item.top}px`;
                if (item.left) elem.style.left = `${item.left}px`;
                if (item.right) elem.style.right = `${item.right}px`;
                if (item.bottom) elem.style.bottom = `${item.bottom}px`;
                
                labEnvironment.appendChild(elem);
            });
        }
    }

    // Initialize the module
    function init() {
        UI.init();
        CharacterStateManager.init();
        initBackgroundEffects();
        
        console.log('Character Party Selection module initialized');
    }

    // Run initialization
    init();
});