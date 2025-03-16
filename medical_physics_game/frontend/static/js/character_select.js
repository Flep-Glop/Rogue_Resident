/**
 * Modern Character Selection System
 * Integrates 3D card rotation, smooth transitions, and improved UI
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded for character selection');
    
    // DOM elements
    const characterCards = document.getElementById('character-cards');
    const carouselIndicators = document.getElementById('carousel-indicators');
    const selectButton = document.getElementById('select-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    
    // State
    let characters = [];
    let currentIndex = 0;
    let selectedCharacter = null;
    let characterToDelete = null;
    let totalCharacters = 0;
    let isTransitioning = false;
    let cardRotation = 0;
    
    // Log availability of key elements
    const elementsToCheck = ['character-cards', 'prev-button', 'next-button', 'select-button'];
    elementsToCheck.forEach(id => {
        const element = document.getElementById(id);
        console.log(`Element #${id} exists:`, !!element);
    });
    
    /**
     * Initialize the character selection screen
     */
    function initialize() {
        // Load characters
        loadCharacters();
        
        // Set up event listeners
        setupEventListeners();
        
        // Add background particle effect
        initializeParticles();
    }
    
    /**
     * Load characters from templates and localStorage
     */
    function loadCharacters() {
        try {
            // Load template characters
            const templateCharacters = window.gameCharacters || [];
            console.log('Characters available:', templateCharacters);
            
            // Load custom characters
            const customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
            
            // Format custom characters
            const formattedCustomChars = customCharacters.map(char => ({
                id: char.id,
                name: char.name,
                description: char.description || 'Custom character with unique abilities.',
                stats: {
                    intelligence: char.stats?.intelligence || 5,
                    persistence: char.stats?.persistence || 5,
                    adaptability: char.stats?.adaptability || 5
                },
                abilities: Array.isArray(char.abilities) ? char.abilities : [],
                image: char.image || '/static/img/characters/debug_mode.png',
                custom: true,
                class: char.class || null
            }));
            
            // Combine all characters
            characters = [...formattedCustomChars, ...templateCharacters];
            totalCharacters = characters.length;
            
            console.log('Total characters loaded:', totalCharacters);
            
            // Render the characters
            renderCharacters();
            
            // Set the first character as selected by default
            if (characters.length > 0) {
                selectCharacter(0, true);
            }
            
        } catch (error) {
            console.error('Error loading characters:', error);
            showToast('Failed to load characters. Please try refreshing the page.', 'error');
        }
    }
    
    /**
     * Render character cards in the carousel
     */
    function renderCharacters() {
        if (!characters || characters.length === 0) {
            showCreateCharacterPrompt();
            return;
        }
        
        // Clear containers
        characterCards.innerHTML = '';
        carouselIndicators.innerHTML = '';
        
        console.log('Rendering', characters.length, 'characters');
        
        // Create cards with improved 3D positioning
        characters.forEach((character, index) => {
            // Create card
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.index = index;
            
            // Position card in 3D space - FIXED POSITIONING
            const rotationAngle = index * (360 / totalCharacters);
            const zOffset = -100; // Reduced from -120 to -100
            
            // Calculate position on a circle
            // For a proper carousel where only one card is prominently displayed at a time
            const radius = 250; // Reduced from 300 to 250
            const angleRad = (rotationAngle * Math.PI) / 180;
            const x = Math.sin(angleRad) * radius;
            const z = Math.cos(angleRad) * radius + zOffset;
            
            // Apply transform 
            if (index === currentIndex) {
                // Current card should be front and center with increased z-index
                card.style.transform = `translateZ(50px) scale(1.1)`;
                card.style.zIndex = '10';
                card.style.opacity = '1';
                card.classList.add('active');
            } else {
                card.style.transform = `translateX(${x}px) translateZ(${z}px)`;
                card.style.zIndex = '1';
                card.style.opacity = '0.8'; // Increased from 0.7 to 0.8
            }
            
            // Card content
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-avatar">
                        <img src="${character.image}" alt="${character.name}" onerror="this.src='/static/img/characters/debug_mode.png'">
                    </div>
                    <h2 class="card-name">${character.name}</h2>
                    ${character.custom ? '<span class="custom-badge">Custom</span>' : ''}
                </div>
                <div class="card-content">
                    <p class="card-desc">${character.description || 'A medical physics adventurer'}</p>
                    <div class="card-stats">
                        ${Object.entries(character.stats).map(([stat, value]) => `
                            <div class="stat-item">
                                <div class="stat-label">
                                    <span class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                                    <span class="stat-value">${value}</span>
                                </div>
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
                </div>
                ${character.custom ? '<button class="delete-character-btn" data-id="' + character.id + '">×</button>' : ''}
            `;
            
            // Add click event to select character
            card.addEventListener('click', () => {
                console.log('Card clicked:', index);
                selectCharacter(index);
            });
            
            // Add card to carousel
            characterCards.appendChild(card);
            
            // Add indicator dot
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            if (index === currentIndex) {
                dot.classList.add('active');
            }
            dot.dataset.index = index;
            dot.addEventListener('click', () => {
                console.log('Dot clicked:', index);
                selectCharacter(index);
            });
            carouselIndicators.appendChild(dot);
        });
        
        // Set up delete buttons for custom characters
        document.querySelectorAll('.delete-character-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const charId = parseInt(btn.getAttribute('data-id'));
                characterToDelete = characters.find(c => c.id === charId);
                showDeleteConfirmation(characterToDelete);
            });
        });
        
        // Update button state
        updateButtonState();
    }
    
    /**
     * Show card for creating a character when none exist
     */
    function showCreateCharacterPrompt() {
        characterCards.innerHTML = `
            <div class="create-character-card">
                <div class="create-icon">
                    <img src="/static/img/characters/debug_mode.png" alt="Create Character">
                </div>
                <h3>No Characters Found</h3>
                <p>Create your first character to begin your medical physics journey!</p>
            </div>
        `;
        
        selectButton.disabled = true;
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        
        // Hide indicators
        carouselIndicators.innerHTML = '';
    }
    
    /**
     * Select a character and update the UI
     */
    function selectCharacter(index, skipAnimation = false) {
        if (index < 0 || index >= characters.length || isTransitioning) return;
        
        console.log('Selecting character:', index);
        isTransitioning = true;
        currentIndex = index;
        selectedCharacter = characters[index];
        
        // Update window selection for other parts of the app
        window.selectedCharacter = selectedCharacter;
        
        // Calculate new rotation angle for the carousel
        cardRotation = (index * (360 / totalCharacters)) * -1;
        
        // Instead of rotating the entire container, we'll reposition each card
        document.querySelectorAll('.character-card').forEach((card, i) => {
            const rotationAngle = ((i - index) * (360 / totalCharacters)) % 360;
            const zOffset = -100; // Reduced from -120 to -100
            
            // Calculate position on a circle
            const radius = 250; // Reduced from 300 to 250
            const angleRad = (rotationAngle * Math.PI) / 180;
            const x = Math.sin(angleRad) * radius;
            const z = Math.cos(angleRad) * radius + zOffset;
            
            if (skipAnimation) {
                card.style.transition = 'none';
            } else {
                card.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
            
            // Apply transform
            if (i === index) {
                // Current card should be front and center
                card.style.transform = `translateZ(50px) scale(1.1)`;
                card.style.zIndex = '10';
                card.style.opacity = '1';
                card.classList.add('active');
            } else {
                card.style.transform = `translateX(${x}px) translateZ(${z}px)`;
                card.style.zIndex = '1';
                card.style.opacity = '0.8';
                card.classList.remove('active');
            }
            
            if (skipAnimation) {
                setTimeout(() => {
                    card.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }, 50);
            }
        });
        
        // Update indicator dots
        document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Enable selection button
        selectButton.disabled = false;
        
        // End transition after animation
        setTimeout(() => {
            isTransitioning = false;
        }, 800);
        
        // Update button state
        updateButtonState();
    }
    
    /**
     * Update navigation button state
     */
    function updateButtonState() {
        prevButton.disabled = characters.length <= 1;
        nextButton.disabled = characters.length <= 1;
        
        prevButton.style.display = characters.length > 0 ? 'flex' : 'none';
        nextButton.style.display = characters.length > 0 ? 'flex' : 'none';
        
        selectButton.disabled = characters.length === 0;
    }
    
    /**
     * Navigate between characters
     */
    function navigateCarousel(direction) {
        if (isTransitioning || characters.length <= 1) return;
        
        console.log('Navigating carousel:', direction);
        
        let newIndex;
        if (direction === 'prev') {
            newIndex = (currentIndex - 1 + characters.length) % characters.length;
        } else {
            newIndex = (currentIndex + 1) % characters.length;
        }
        
        selectCharacter(newIndex);
    }
    
    /**
     * Show delete confirmation
     */
    function showDeleteConfirmation(character) {
        if (!deleteModal) return;
        
        const modalText = deleteModal.querySelector('p');
        if (modalText) {
            modalText.textContent = `Are you sure you want to delete "${character.name}"? This action cannot be undone.`;
        }
        
        // Show modal with animation
        deleteModal.classList.remove('hidden');
        setTimeout(() => {
            deleteModal.querySelector('.modal-content').classList.add('show');
        }, 10);
    }
    
    /**
     * Hide delete confirmation
     */
    function hideDeleteConfirmation() {
        if (!deleteModal) return;
        
        // Hide with animation
        deleteModal.querySelector('.modal-content').classList.remove('show');
        setTimeout(() => {
            deleteModal.classList.add('hidden');
        }, 300);
    }
    
    /**
     * Delete a character
     */
    function deleteCharacter(characterId) {
        try {
            // Get custom characters
            let customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
            
            // Remove character
            customCharacters = customCharacters.filter(char => char.id !== characterId);
            
            // Save back to localStorage
            localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
            
            // Remove from current characters array
            characters = characters.filter(char => char.id !== characterId);
            totalCharacters = characters.length;
            
            // Show success toast
            showToast('Character deleted successfully', 'success');
            
            // Rebuild carousel
            renderCharacters();
            
            // If no characters left
            if (characters.length === 0) {
                showCreateCharacterPrompt();
                selectedCharacter = null;
                window.selectedCharacter = null;
            } else {
                // Select first character or nearest one
                let newIndex = Math.min(currentIndex, characters.length - 1);
                selectCharacter(newIndex, true);
            }
            
        } catch (error) {
            console.error('Error deleting character:', error);
            showToast('Failed to delete character', 'error');
        }
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        // Create toast container if needed
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * Initialize background particles
     */
    function initializeParticles() {
        // Already implemented in HTML
        console.log('Particles initialized');
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Navigation buttons
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                console.log('Previous button clicked');
                navigateCarousel('prev');
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                console.log('Next button clicked');
                navigateCarousel('next');
            });
        }
        
        // Select button
        if (selectButton) {
            selectButton.addEventListener('click', () => {
                if (!selectedCharacter) return;
                
                // Add loading state
                selectButton.disabled = true;
                selectButton.innerHTML = '<span class="spinner"></span> Loading...';
                
                // Save selection to localStorage
                localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                
                // Navigate with delay to show loading state
                setTimeout(() => {
                    window.location.href = '/game';
                }, 800);
            });
        }
        
        // Delete confirmation
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                if (characterToDelete) {
                    deleteCharacter(characterToDelete.id);
                    hideDeleteConfirmation();
                    characterToDelete = null;
                }
            });
        }
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                hideDeleteConfirmation();
                characterToDelete = null;
            });
        }
        
        // Close modal on background click
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    hideDeleteConfirmation();
                    characterToDelete = null;
                }
            });
        }
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Skip if any modal is open
            if (deleteModal && !deleteModal.classList.contains('hidden')) return;
            
            if (e.key === 'ArrowLeft') {
                navigateCarousel('prev');
            } else if (e.key === 'ArrowRight') {
                navigateCarousel('next');
            } else if (e.key === 'Enter' && !selectButton.disabled) {
                selectButton.click();
            }
        });
        
        // Mouse wheel navigation - FIXED VERSION MOVED INSIDE INITIALIZATION
        document.addEventListener('wheel', (e) => {
            // Skip if transitioning or modal open
            if (isTransitioning || (deleteModal && !deleteModal.classList.contains('hidden'))) return;
            
            // Detect direction
            if (e.deltaY > 0) {
                navigateCarousel('next');
            } else if (e.deltaY < 0) {
                navigateCarousel('prev');
            }
        }, { passive: true });
    }
    
    // Initialize the selection screen
    initialize();
    console.log('Character selection initialized');
});