/**
 * Character Selection Module
 * 
 * This module handles the character selection screen functionality
 * following the project's architectural patterns and best practices.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Event System - aligned with frontend/src/core/event_system.js approach
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

    // Character State Manager
    const CharacterStateManager = {
        state: {
            characters: [],
            selectedCharacterIndex: null,
            isLoading: false,
            error: null
        },

        // Initialize state
        init: function() {
            this.loadCharacters();
        },

        // Get the current state
        getState: function() {
            return {...this.state};
        },

        // Update the state and publish changes
        setState: function(newState) {
            this.state = {...this.state, ...newState};
            EventSystem.publish('stateChanged', this.state);
        },

        // Load characters from various sources
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
                    // Create a toast notification for the error
                    UI.showToast('Error loading custom characters', 'error');
                }
                
                // API call to get server-side characters if available
                fetch('/api/characters')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch characters');
                        }
                        return response.json();
                    })
                    .then(serverCharacters => {
                        // Process server characters if available
                        this.processCharacters([...customCharacters, ...templateCharacters, ...serverCharacters]);
                    })
                    .catch(error => {
                        console.error('Error fetching characters from API:', error);
                        // Fallback to local characters
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

        // Process and normalize character data
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
            
            // Select first character by default if available
            if (uniqueCharacters.length > 0) {
                this.selectCharacter(0);
            }
        },

        // Select a character by index
        selectCharacter: function(index) {
            if (index < 0 || index >= this.state.characters.length) return;
            
            this.setState({selectedCharacterIndex: index});
            EventSystem.publish('characterSelected', this.state.characters[index]);
        },

        // Delete a character
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
                
                UI.showToast('Character deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting character:', error);
                UI.showToast('Error deleting character', 'error');
            }
        },

        // Save selected character
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
            characterGrid: document.getElementById('character-grid'),
            selectButton: document.getElementById('select-button'),
            createButton: document.getElementById('create-button'),
            backButton: document.getElementById('back-button')
        },

        // Initialize UI
        init: function() {
            this.setupEventListeners();
            this.setupStateSubscription();
        },

        // Setup event listeners for UI elements
        setupEventListeners: function() {
            // Select button
            if (this.elements.selectButton) {
                this.elements.selectButton.addEventListener('click', () => {
                    CharacterStateManager.saveSelection();
                });
            }
            
            // Create button and back button use standard navigation via links
        },

        // Subscribe to state changes
        setupStateSubscription: function() {
            EventSystem.subscribe('stateChanged', (state) => {
                this.updateUI(state);
            });
            
            EventSystem.subscribe('characterSelected', (character) => {
                this.updateSelectedCharacter(character);
            });
        },

        // Update UI based on state
        updateUI: function(state) {
            this.renderCharacterGrid(state);
            this.updateSelectButton(state);
            
            // Show loading state if needed
            if (state.isLoading) {
                this.showLoadingState();
            }
            
            // Show error if present
            if (state.error) {
                this.showToast(state.error, 'error');
            }
        },

        // Show loading state
        showLoadingState: function() {
            if (!this.elements.characterGrid) return;
            
            this.elements.characterGrid.innerHTML = `
                <div class="empty-state loading-state">
                    <div class="loading-spinner"></div>
                    <div class="empty-state-text">Loading characters...</div>
                </div>
            `;
        },

        // Render the character grid
        renderCharacterGrid: function(state) {
            if (!this.elements.characterGrid) return;
            
            // Early return if still loading
            if (state.isLoading) return;
            
            // Clear container
            this.elements.characterGrid.innerHTML = '';
            
            if (state.characters.length === 0) {
                // Show empty state
                this.elements.characterGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="empty-state-text">No characters found</div>
                        <div class="empty-state-subtext">Create your first character to begin your journey!</div>
                    </div>
                `;
                return;
            }
            
            // Create character cards
            state.characters.forEach((character, index) => {
                const card = document.createElement('div');
                card.className = 'character-card';
                
                // Add selected class if this is the selected character
                if (index === state.selectedCharacterIndex) {
                    card.classList.add('selected');
                }
                
                // Create stat bars HTML
                let statsHtml = '';
                if (character.stats) {
                    // Get stats
                    const stats = {
                        intelligence: character.stats.intelligence || 5,
                        persistence: character.stats.persistence || 5,
                        adaptability: character.stats.adaptability || 5
                    };
                    
                    // Create HTML for each stat
                    statsHtml = `
                        <div class="character-stats">
                            <div class="stat-row stat-intelligence">
                                <div class="stat-label">Intelligence</div>
                                <div class="stat-bar-container">
                                    <div class="stat-bar" style="width: ${stats.intelligence * 10}%"></div>
                                </div>
                            </div>
                            <div class="stat-row stat-persistence">
                                <div class="stat-label">Persistence</div>
                                <div class="stat-bar-container">
                                    <div class="stat-bar" style="width: ${stats.persistence * 10}%"></div>
                                </div>
                            </div>
                            <div class="stat-row stat-adaptability">
                                <div class="stat-label">Adaptability</div>
                                <div class="stat-bar-container">
                                    <div class="stat-bar" style="width: ${stats.adaptability * 10}%"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // Create abilities HTML
                let abilitiesHtml = '';
                if (character.abilities && character.abilities.length > 0) {
                    abilitiesHtml = `
                        <div class="character-abilities">
                            ${character.abilities.map(ability => `
                                <span class="ability-tag">${ability}</span>
                            `).join('')}
                        </div>
                    `;
                }
                
                // Construct card HTML
                card.innerHTML = `
                    <div class="character-avatar">
                        <img src="${character.image || '/static/img/characters/debug_mode.png'}" 
                             alt="${character.name}"
                             onerror="this.src='/static/img/characters/debug_mode.png'">
                    </div>
                    <h3 class="character-name">${character.name}</h3>
                    ${statsHtml}
                    ${abilitiesHtml}
                    ${character.custom ? '<div class="custom-badge">Custom</div>' : ''}
                    ${character.custom ? '<button class="delete-btn" data-id="' + character.id + '" aria-label="Delete character"><i class="fas fa-times"></i></button>' : ''}
                `;
                
                // Add click event to select character
                card.addEventListener('click', (e) => {
                    // Don't select if clicking delete button
                    if (e.target.closest('.delete-btn')) return;
                    CharacterStateManager.selectCharacter(index);
                });
                
                // Add to grid
                this.elements.characterGrid.appendChild(card);
            });
            
            // Add delete button event listeners
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    this.confirmDelete(id);
                });
            });
        },

        // Update select button state
        updateSelectButton: function(state) {
            if (!this.elements.selectButton) return;
            
            // Disable if no character selected
            this.elements.selectButton.disabled = state.selectedCharacterIndex === null;
            
            // Update button text/icon to show selected state
            if (state.selectedCharacterIndex !== null) {
                this.elements.selectButton.innerHTML = `<i class="fas fa-check"></i> Play as ${state.characters[state.selectedCharacterIndex].name}`;
            } else {
                this.elements.selectButton.innerHTML = 'Select Character';
            }
        },

        // Update selected character styles
        updateSelectedCharacter: function(character) {
            // Remove selected class from all cards
            document.querySelectorAll('.character-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Find the card for the selected character and add selected class
            const characterCards = document.querySelectorAll('.character-card');
            characterCards.forEach((card, index) => {
                if (index === CharacterStateManager.getState().selectedCharacterIndex) {
                    card.classList.add('selected');
                    
                    // Scroll to selected card if needed
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
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

    // Initialize the module
    function init() {
        UI.init();
        CharacterStateManager.init();
        
        console.log('Character Selection module initialized');
    }

    // Run initialization
    init();
});