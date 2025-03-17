/**
 * Character Selection System
 * Improved version with better error handling, more robust state management,
 * and improved performance.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create or ensure EventSystem is available
    window.EventSystem = {
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
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        },
        unsubscribe: function(event, callback) {
            if (!this.events[event]) return;
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        },
        clear: function(event) {
            if (event) {
                this.events[event] = [];
            } else {
                this.events = {};
            }
        }
    };

    // State management using a more structured approach
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
            // Register a listener for back button navigation to clean up
            window.addEventListener('beforeunload', () => {
                EventSystem.clear();
            });
            
            // Start loading characters
            this.loadCharacters();
            
            // Log that initialization is complete
            console.log('Character State Manager initialized');
        },

        getState: function() {
            return {...this.state};
        },

        setState: function(newState) {
            const oldState = {...this.state};
            this.state = {...this.state, ...newState};
            
            // Determine which parts of state changed for targeted updates
            const changedProps = Object.keys(newState).filter(
                key => oldState[key] !== newState[key]
            );
            
            // Only publish event if something actually changed
            if (changedProps.length > 0) {
                EventSystem.publish('stateChanged', {
                    state: this.state,
                    changedProps
                });
            }
        },

        loadCharacters: function() {
            this.setState({isLoading: true, error: null});
            console.log('Loading characters...');
            
            // Create a promise for each data source
            const apiPromise = fetch('/api/characters')
                .then(response => {
                    if (!response.ok) {
                        console.warn('API response not OK', response.status);
                        return [];
                    }
                    return response.json();
                })
                .catch(error => {
                    console.warn('API character fetch error:', error);
                    return [];
                });
                
            // Safely load from localStorage with fallback
            const localPromise = new Promise(resolve => {
                try {
                    const customChars = JSON.parse(localStorage.getItem('customCharacters') || '[]');
                    resolve(Array.isArray(customChars) ? customChars : []);
                } catch (error) {
                    console.warn('Error parsing custom characters:', error);
                    resolve([]);
                }
            });
            
            // Get template characters from window.gameCharacters
            const templatePromise = Promise.resolve(
                Array.isArray(window.gameCharacters) ? window.gameCharacters : []
            );
            
            // Wait for all sources and combine results
            Promise.all([apiPromise, localPromise, templatePromise])
                .then(([apiChars, localChars, templateChars]) => {
                    console.log(`Loaded characters - API: ${apiChars.length}, Local: ${localChars.length}, Template: ${templateChars.length}`);
                    this.processCharacters([...localChars, ...templateChars, ...apiChars]);
                })
                .catch(error => {
                    console.error('Error loading characters:', error);
                    this.setState({
                        isLoading: false, 
                        error: 'Failed to load characters'
                    });
                    UI.showToast('Error loading characters. Please try refreshing the page.', 'error');
                });
        },

        processCharacters: function(characters) {
            // Ensure all characters have required properties
            const processedChars = characters.map(char => ({
                id: char.id || Date.now() + Math.random().toString(36).substring(2, 9),
                name: char.name || 'Unnamed Character',
                max_hp: char.max_hp || 100,
                current_hp: char.current_hp || 100,
                abilities: Array.isArray(char.abilities) ? char.abilities : [],
                stats: char.stats || { intelligence: 5, persistence: 5, adaptability: 5 },
                custom: !!char.custom,
                image: char.image || '/static/img/characters/debug_mode.png',
                description: char.description || 'A medical physics adventurer'
            }));
            
            // Deduplicate characters based on ID
            const uniqueChars = [];
            const seenIds = new Set();
            
            processedChars.forEach(char => {
                const charId = String(char.id);
                if (!seenIds.has(charId)) {
                    seenIds.add(charId);
                    uniqueChars.push(char);
                }
            });
            
            // Sort characters (custom first, then standard)
            uniqueChars.sort((a, b) => {
                if (a.custom && !b.custom) return -1;
                if (!a.custom && b.custom) return 1;
                return a.name.localeCompare(b.name);
            });
            
            this.setState({
                characters: uniqueChars,
                isLoading: false
            });
            
            // Set up visible characters
            this.updateVisibleCharacters();
            
            // Select first character by default if available
            if (uniqueChars.length > 0) {
                this.selectCharacter(0);
            }
            
            console.log('Characters processed:', uniqueChars.length);
        },

        // Update which characters are visible in the party lineup
        updateVisibleCharacters: function() {
            const { characters, centerIndex, maxVisibleCharacters } = this.state;
            
            if (characters.length === 0) {
                this.setState({ visibleCharacters: [] });
                return;
            }
            
            // Calculate correct center index
            const safeCenter = Math.min(Math.max(0, centerIndex), characters.length - 1);
            
            // Calculate how many characters to show on each side of center
            const sideCount = Math.floor(maxVisibleCharacters / 2);
            
            // Simple calculation with bounds checking
            const startIdx = Math.max(0, safeCenter - sideCount);
            const endIdx = Math.min(characters.length, startIdx + maxVisibleCharacters);
            
            // Adjust start if we have room at the end
            const finalStartIdx = Math.max(0, endIdx - maxVisibleCharacters);
            
            // Get the visible characters
            const visibleCharacters = characters.slice(finalStartIdx, endIdx);
            
            this.setState({ 
                visibleCharacters,
                centerIndex: safeCenter
            });
            
            console.log(`Showing characters ${finalStartIdx}-${endIdx} with center at ${safeCenter}`);
        },

        selectCharacter: function(index) {
            const { characters } = this.state;
            
            if (index < 0 || index >= characters.length) {
                console.warn(`Attempted to select invalid character index: ${index}`);
                return;
            }
            
            console.log(`Selecting character at index ${index}: ${characters[index].name}`);
            
            this.setState({ 
                selectedCharacterIndex: index,
                centerIndex: index
            });
            
            // Update visible characters based on new center
            this.updateVisibleCharacters();
            
            // Publish character selected event
            EventSystem.publish('characterSelected', characters[index]);
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
            // Get current state info
            const { characters, selectedCharacterIndex } = this.state;
            const currentSelected = characters[selectedCharacterIndex];
            
            console.log(`Deleting character with ID: ${id}`);
            
            // Get custom characters from localStorage
            try {
                let customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
                
                // Remove character with matching id
                customCharacters = customCharacters.filter(char => String(char.id) !== String(id));
                
                // Save back to localStorage
                localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
                
                // Try to delete from server if API is available
                fetch(`/api/characters/${id}`, {
                    method: 'DELETE'
                }).catch(error => {
                    console.warn('Could not delete from server, character removed from local storage only:', error);
                });
                
                // Update current state - remove character
                const updatedCharacters = this.state.characters.filter(char => String(char.id) !== String(id));
                
                // Find index of currently selected character in new array
                let newSelectedIndex = null;
                
                if (currentSelected && String(currentSelected.id) !== String(id)) {
                    // Find the index of the currently selected character in the new array
                    newSelectedIndex = updatedCharacters.findIndex(
                        char => String(char.id) === String(currentSelected.id)
                    );
                }
                
                // If we couldn't find it or it was the deleted character
                if (newSelectedIndex === -1 || newSelectedIndex === null) {
                    // Select the first character or null if empty
                    newSelectedIndex = updatedCharacters.length > 0 ? 0 : null;
                }
                
                console.log(`New selected index after deletion: ${newSelectedIndex}`);
                
                // Update state with new characters and selected index
                this.setState({
                    characters: updatedCharacters,
                    selectedCharacterIndex: newSelectedIndex
                });
                
                // Update visible characters
                this.updateVisibleCharacters();
                
                // If we have a selected character, publish event
                if (newSelectedIndex !== null) {
                    EventSystem.publish('characterSelected', updatedCharacters[newSelectedIndex]);
                }
                
                UI.showToast('Character deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting character:', error);
                UI.showToast('Error deleting character', 'error');
            }
        },

        saveSelection: function() {
            if (this.state.selectedCharacterIndex === null) {
                console.warn('Attempted to save with no character selected');
                return;
            }
            
            const selectedCharacter = this.state.characters[this.state.selectedCharacterIndex];
            console.log(`Saving selected character: ${selectedCharacter.name}`);
            
            // Save to localStorage
            try {
                localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                
                // Navigate to game
                window.location.href = '/game';
            } catch (error) {
                console.error('Error saving character selection:', error);
                UI.showToast('Error saving character selection', 'error');
            }
        }
    };

    // UI Manager with better component organization
    const UI = {
        elements: {
            characterLineup: document.getElementById('character-lineup'),
            characterDetails: document.getElementById('character-details'),
            selectButton: document.getElementById('select-button'),
            prevButton: document.getElementById('prev-character'),
            nextButton: document.getElementById('next-character'),
            sideStats: document.querySelector('.character-side-info'),
            selectedCharNameElement: document.getElementById('selected-character-name')
        },

        init: function() {
            console.log('Initializing UI Manager');
            this.validateRequiredElements();
            this.setupEventListeners();
            this.setupStateSubscription();
        },
        
        validateRequiredElements: function() {
            // Log warnings for missing elements
            for (const [key, element] of Object.entries(this.elements)) {
                if (!element) {
                    console.warn(`Required UI element not found: ${key}`);
                }
            }
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
            
            // Add document-level handler for delete buttons
            document.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.delete-btn');
                if (deleteBtn) {
                    e.stopPropagation(); // Prevent character selection
                    const id = deleteBtn.dataset.id;
                    if (id) {
                        this.confirmDelete(id);
                    }
                }
            });
        },

        setupStateSubscription: function() {
            // Subscribe to state changes
            EventSystem.subscribe('stateChanged', (data) => {
                const { state, changedProps } = data;
                
                // Only update UI components that need to change
                if (changedProps.includes('visibleCharacters') || 
                    changedProps.includes('selectedCharacterIndex') ||
                    changedProps.includes('isLoading')) {
                    this.renderCharacterLineup(state);
                }
                
                if (changedProps.includes('selectedCharacterIndex') ||
                    changedProps.includes('characters')) {
                    this.updateSelectButton(state);
                    this.updateNavigationButtons(state);
                }
                
                // Show loading state if needed
                if (changedProps.includes('isLoading') && state.isLoading) {
                    this.showLoadingState();
                }
                
                // Show error if present
                if (changedProps.includes('error') && state.error) {
                    this.showToast(state.error, 'error');
                }
            });
            
            // Handle character selection
            EventSystem.subscribe('characterSelected', (character) => {
                if (character) {
                    this.updateCharacterDetails(character);
                    this.updateSideInfo(character);
                }
            });
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
                        <div class="new-text">Create Character</div>
                    </a>
                `;
                return;
            }
            
            // Create visible character figures
            state.visibleCharacters.forEach((character) => {
                const absoluteIndex = state.characters.findIndex(c => c.id === character.id);
                const isSelected = absoluteIndex === state.selectedCharacterIndex;
                
                const figure = document.createElement('div');
                figure.className = 'character-figure';
                figure.dataset.id = character.id;
                
                if (isSelected) {
                    figure.classList.add('selected');
                }
                
                // Create figure HTML
                figure.innerHTML = `
                    <div class="selection-indicator">
                        <i class="fas fa-caret-down"></i>
                    </div>
                    <div class="character-avatar">
                        <img src="${character.image}" 
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
            if (state.characters.length < 5 || 
                state.centerIndex + Math.floor(state.maxVisibleCharacters / 2) >= state.characters.length - 1) {
                const newSlot = document.createElement('a');
                newSlot.href = '/character-create';
                newSlot.className = 'new-character-slot';
                newSlot.innerHTML = `
                    <div class="new-icon">+</div>
                    <div class="new-text">Create Character</div>
                `;
                this.elements.characterLineup.appendChild(newSlot);
            }
        },

        updateCharacterDetails: function(character) {
            if (!this.elements.characterDetails) return;
            
            // Create stats HTML
            let statsHtml = '';
            if (character.stats) {
                // Get stats with defaults
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
            
            // Fallback description if missing
            const description = character.description || 'A medical physics adventurer';
            
            // Assemble details panel
            this.elements.characterDetails.innerHTML = `
                <h3 class="character-detail-name">${character.name}</h3>
                <p class="character-description">${description}</p>
                ${statsHtml}
                ${abilitiesHtml}
            `;
        },
        
        updateSideInfo: function(character) {
            if (!this.elements.sideStats) return;
            
            // Update HP value
            const hpValue = this.elements.sideStats.querySelector('.side-stat:nth-child(1) .side-stat-value');
            if (hpValue) {
                hpValue.textContent = character.max_hp || 100;
            }
            
            // Update selected character name in button
            if (this.elements.selectedCharNameElement) {
                this.elements.selectedCharNameElement.textContent = character.name;
            }
        },

        updateSelectButton: function(state) {
            if (!this.elements.selectButton) return;
            
            // Disable if no character selected
            const hasSelection = state.selectedCharacterIndex !== null;
            this.elements.selectButton.disabled = !hasSelection;
            
            // Update button text/icon
            if (hasSelection) {
                const selectedName = state.characters[state.selectedCharacterIndex]?.name || 'Character';
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
            const character = state.characters.find(c => String(c.id) === String(id));
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
            if (type === 'warning') icon = 'exclamation-triangle';
            
            // Add content
            toast.innerHTML = `
                <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
                <div class="toast-message">${message}</div>
            `;
            
            // Add to container
            toastContainer.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);
            
            // Remove after delay
            setTimeout(() => {
                toast.classList.add('fadeout');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }
    };

    function setupSkillTreeButton() {
        // Find the skill tree button
        const skillTreeBtn = document.querySelector('.skill-tree-button');
        
        if (skillTreeBtn) {
            // Update the href attribute to point to the skill tree page
            skillTreeBtn.href = '/skill-tree';
            
            // Add click event handler
            skillTreeBtn.addEventListener('click', function(e) {
                // If there's no selected character, prevent navigation
                const state = CharacterStateManager.getState();
                if (state.selectedCharacterIndex === null) {
                    e.preventDefault();
                    UI.showToast('Please select a character first', 'warning');
                    return;
                }
            });
            
            console.log("Skill tree button initialized");
        }
    }

    // Initialize background effects
    function initBackgroundEffects() {
        // Generate star background
        const starBg = document.getElementById('star-bg');
        if (starBg) {
            // Create a limited number of stars for better performance
            const fragmentStars = document.createDocumentFragment();
            for (let i = 0; i < 70; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 4}s`;
                star.style.width = `${1 + Math.random() * 2}px`;
                star.style.height = star.style.width;
                fragmentStars.appendChild(star);
            }
            starBg.appendChild(fragmentStars);
        }

        // Add lab equipment to background
        const labEnvironment = document.querySelector('.lab-environment');
        if (labEnvironment) {
            // Use document fragment for better performance
            const fragmentEquipment = document.createDocumentFragment();
            
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
                elem.className = 'lab-equipment';
                elem.style.position = 'absolute';
                elem.style.width = `${item.width}px`;
                elem.style.height = `${item.height}px`;
                
                if (item.top) elem.style.top = `${item.top}px`;
                if (item.left) elem.style.left = `${item.left}px`;
                if (item.right) elem.style.right = `${item.right}px`;
                if (item.bottom) elem.style.bottom = `${item.bottom}px`;
                
                fragmentEquipment.appendChild(elem);
            });
            
            labEnvironment.appendChild(fragmentEquipment);
        }
    }
    
    /**
     * Initialize enhanced visual effects
     */
    function initEnhancedVisualEffects() {
        // Create floating pixels
        createFloatingPixels();
        
        // Create dust particles
        createDustParticles();
        
        // Add character selection flash effect
        addCharacterSelectionEffects();
    }

    /**
     * Create floating pixels in the background
     */
    function createFloatingPixels() {
        const container = document.querySelector('.character-selection-container');
        if (!container) return;
        
        // Create floating pixels
        const pixelCount = 15;
        const colors = [
            'var(--color-primary-dark)',
            'var(--color-secondary-dark)',
            'var(--color-warning)',
            'var(--color-accent-purple)'
        ];
        
        for (let i = 0; i < pixelCount; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'floating-pixel';
            
            // Random position
            pixel.style.left = `${5 + Math.random() * 90}%`;
            pixel.style.top = `${10 + Math.random() * 80}%`;
            
            // Random size
            const size = 3 + Math.random() * 12;
            pixel.style.width = `${size}px`;
            pixel.style.height = `${size}px`;
            
            // Random color
            pixel.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Random opacity
            pixel.style.opacity = 0.1 + Math.random() * 0.3;
            
            // Random animation delay
            pixel.style.animationDelay = `${Math.random() * 5}s`;
            
            // Random animation duration
            pixel.style.animationDuration = `${5 + Math.random() * 10}s`;
            
            // Add to container
            container.appendChild(pixel);
        }
    }

    /**
     * Create dust particles in the lower part of the screen
     */
    function createDustParticles() {
        const container = document.querySelector('.character-party-stage');
        if (!container) return;
        
        // Create dust particles
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'dust-particle';
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            
            // Random size
            const size = 1 + Math.random() * 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random opacity
            particle.style.opacity = 0.3 + Math.random() * 0.5;
            
            // Random animation delay
            particle.style.animationDelay = `${Math.random() * 10}s`;
            
            // Random animation duration
            particle.style.animationDuration = `${7 + Math.random() * 13}s`;
            
            // Add to container
            container.appendChild(particle);
        }
    }

    /**
     * Add character selection flash effect
     */
    function addCharacterSelectionEffects() {
        // Add click effects to character figures
        const characterFigures = document.querySelectorAll('.character-figure');
        
        characterFigures.forEach(figure => {
            figure.addEventListener('click', function() {
                // Add screen flash effect
                const flash = document.createElement('div');
                flash.className = 'screen-flash';
                document.body.appendChild(flash);
                
                // Remove after animation completes
                setTimeout(() => {
                    flash.remove();
                }, 300);
            });
        });
        
        // Add click effect to action buttons
        const actionButtons = document.querySelectorAll('.action-button');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Don't add effect if button is disabled
                if (button.disabled) return;
                
                // Add subtle screen shake
                document.body.classList.add('screen-shake');
                
                // Remove after a short delay
                setTimeout(() => {
                    document.body.classList.remove('screen-shake');
                }, 500);
            });
        });
    }

    // Add screen shake animation to CSS
    const style = document.createElement('style');
    style.textContent = `
    @keyframes screenShake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
    }

    .screen-shake {
    animation: screenShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    transform-origin: center center;
    }`;
    document.head.appendChild(style);

    // Call the enhanced visual effects in your init() function
    function init() {
        console.log('Initializing Character Selection Screen');
        UI.init();
        CharacterStateManager.init();
        setupSkillTreeButton();
        
        // Initialize visual effects with a slight delay for better page load
        setTimeout(() => {
            initBackgroundEffects();
            initEnhancedVisualEffects(); // Add this line
        }, 100);
    }

    // Run initialization
    init();
});