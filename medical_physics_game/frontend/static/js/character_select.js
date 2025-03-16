/**
 * Enhanced Character Selection for Medical Physics Game
 * Improved UI interactions, animations, and character management
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const characterCards = document.getElementById('character-cards');
    const characterDetails = document.getElementById('character-details');
    const carouselIndicators = document.getElementById('carousel-indicators');
    const selectButton = document.getElementById('select-button');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    
    // State
    let characters = [];
    let currentIndex = 0;
    let selectedCharacter = null;
    let characterToDelete = null;
    let isTransitioning = false;
    
    // Initialize character selection
    function initialize() {
        // Load template characters
        loadTemplateCharacters();
        
        // Set up event listeners
        setupEventListeners();
        
        // Add pixel decorations for the retro theme
        addPixelDecorations();
    }
    
    // Load template characters and custom characters
    function loadTemplateCharacters() {
        // Define default template characters
        const templateCharacters = window.gameCharacters || [];
        
        // Load custom characters from localStorage
        try {
            const customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
            
            // Format custom characters to match the standard character format
            if (customCharacters.length > 0) {
                const formattedCustomChars = customCharacters.map(char => ({
                    id: char.id,
                    name: char.name,
                    description: char.description || 'Custom character with unique abilities.',
                    stats: {
                        intelligence: char.stats.intelligence,
                        persistence: char.stats.persistence,
                        adaptability: char.stats.adaptability
                    },
                    abilities: Array.isArray(char.abilities) ? char.abilities : [],
                    image: char.image,
                    custom: true,
                    class: char.class || null
                }));
                
                // Combine template and custom characters
                characters = [...formattedCustomChars, ...templateCharacters];
            } else {
                characters = [...templateCharacters];
            }
        } catch (error) {
            console.error('Error loading custom characters:', error);
            characters = [...templateCharacters];
            
            // Show error toast
            showToast('Failed to load custom characters. Using default characters.', 'error');
        }
        
        // Render characters
        renderCharacters();
    }
    
    // Render all character cards or prompt to create
    function renderCharacters() {
        if (!characters || !Array.isArray(characters) || characters.length === 0) {
            // Show create character prompt if no characters exist
            renderCreatePrompt();
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
        
        // Clear existing cards
        characterCards.innerHTML = '';
        
        // Render character cards with an animation delay
        characters.forEach((character, index) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            if (index === currentIndex) {
                card.classList.add('active');
            }
            
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
                ${character.custom ? '<button class="delete-character-btn" data-id="' + character.id + '">×</button>' : ''}
                ${character.class ? '<div class="class-badge">' + character.class + '</div>' : ''}
            `;
            
            card.addEventListener('click', () => {
                if (!isTransitioning) {
                    selectCharacter(index);
                }
            });
            
            characterCards.appendChild(card);
            
            // Add delete character handlers
            if (character.custom) {
                const deleteBtn = card.querySelector('.delete-character-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent card click
                        characterToDelete = character;
                        showDeleteConfirmation(character);
                    });
                }
            }
        });
        
        // Create carousel indicators
        renderCarouselIndicators();
        
        // Select the first character by default
        if (characters.length > 0 && !selectedCharacter) {
            selectCharacter(0);
        }
        
        // Update carousel position
        updateCarousel();
    }
    
    // Render create character prompt
    function renderCreatePrompt() {
        // Hide carousel buttons when no characters
        if (prevButton) prevButton.style.display = 'none';
        if (nextButton) nextButton.style.display = 'none';
        
        // Hide character details section
        characterDetails.innerHTML = '';
        
        // Hide carousel indicators
        if (carouselIndicators) carouselIndicators.innerHTML = '';
        
        // Disable select button
        if (selectButton) {
            selectButton.disabled = true;
            selectButton.classList.add('disabled');
        }
        
        // Show create character prompt
        characterCards.innerHTML = '';
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
    }
    
    // Render carousel indicators (dots)
    function renderCarouselIndicators() {
        if (!carouselIndicators) return;
        
        carouselIndicators.innerHTML = '';
        
        characters.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            if (index === currentIndex) {
                dot.classList.add('active');
            }
            
            dot.addEventListener('click', () => {
                selectCharacter(index);
            });
            
            carouselIndicators.appendChild(dot);
        });
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
        
        // Set transitioning flag
        isTransitioning = true;
        
        // Update current index
        currentIndex = index;
        selectedCharacter = characters[index];
        
        // Make the selected character available globally
        window.selectedCharacter = selectedCharacter;
        
        // Update active card with animation
        const cards = document.querySelectorAll('.character-card');
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        // Update carousel indicators
        const dots = document.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Fade out current details
        if (characterDetails.innerHTML !== '') {
            characterDetails.classList.add('fade-out');
            
            setTimeout(() => {
                // Show new character details
                updateCharacterDetails();
                characterDetails.classList.remove('fade-out');
                characterDetails.classList.add('fade-in');
                
                setTimeout(() => {
                    characterDetails.classList.remove('fade-in');
                    isTransitioning = false;
                }, 300);
            }, 300);
        } else {
            // No existing details, show immediately
            updateCharacterDetails();
            characterDetails.classList.add('fade-in');
            
            setTimeout(() => {
                characterDetails.classList.remove('fade-in');
                isTransitioning = false;
            }, 300);
        }
        
        // Update carousel
        updateCarousel();
    }
    
    // Update character details display
    function updateCharacterDetails() {
        if (!selectedCharacter) return;
        
        // Format abilities
        let abilitiesHTML = '';
        if (selectedCharacter.abilities && selectedCharacter.abilities.length > 0) {
            abilitiesHTML = selectedCharacter.abilities.map(ability => {
                return `<span class="ability-tag">${ability}</span>`;
            }).join('');
        } else {
            abilitiesHTML = '<span class="no-abilities">No abilities selected</span>';
        }
        
        // Character class badge
        const classBadge = selectedCharacter.class ? 
            `<div class="detail-class-badge">${selectedCharacter.class}</div>` : '';
        
        // Format details
        characterDetails.innerHTML = `
            <div class="character-details-header">
                <h2>${selectedCharacter.name}</h2>
                ${classBadge}
                ${selectedCharacter.custom ? '<div class="detail-custom-badge">Custom</div>' : ''}
            </div>
            <p class="character-description">${selectedCharacter.description || 'A character specializing in medical physics.'}</p>
            <div class="character-stats">
                ${Object.entries(selectedCharacter.stats).map(([stat, value]) => `
                    <div class="character-stat">
                        <div class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}:</div>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${value * 10}%"></div>
                        </div>
                        <div class="stat-value">${value}</div>
                    </div>
                `).join('')}
            </div>
            <div class="abilities-section">
                <h3>Abilities</h3>
                <div class="character-abilities">
                    ${abilitiesHTML}
                </div>
            </div>
        `;
    }
    
    // Navigate carousel
    function navigateCarousel(direction) {
        if (isTransitioning) return;
        
        const totalCharacters = characters ? characters.length : 0;
        if (totalCharacters === 0) return;
        
        // Add navigation animation class
        characterCards.classList.add(direction === 'prev' ? 'slide-right' : 'slide-left');
        
        if (direction === 'prev') {
            currentIndex = (currentIndex - 1 + totalCharacters) % totalCharacters;
        } else {
            currentIndex = (currentIndex + 1) % totalCharacters;
        }
        
        // Remove animation class after transition
        setTimeout(() => {
            characterCards.classList.remove('slide-left', 'slide-right');
            selectCharacter(currentIndex);
        }, 300);
    }
    
    // Update carousel position
    function updateCarousel() {
        if (!characters || characters.length === 0) return;
        
        const cardWidth = 280 + 30; // Width + margins
        const offset = -currentIndex * cardWidth;
        characterCards.style.transform = `translateX(${offset}px)`;
    }
    
    // Show delete confirmation modal
    function showDeleteConfirmation(character) {
        if (!deleteModal) return;
        
        // Update modal text
        const modalText = deleteModal.querySelector('p');
        if (modalText) {
            modalText.textContent = `Are you sure you want to delete "${character.name}"? This action cannot be undone.`;
        }
        
        // Show modal
        deleteModal.classList.remove('hidden');
        deleteModal.classList.add('fade-in');
    }
    
    // Hide delete confirmation modal
    function hideDeleteConfirmation() {
        if (!deleteModal) return;
        
        deleteModal.classList.add('fade-out');
        
        setTimeout(() => {
            deleteModal.classList.remove('fade-in', 'fade-out');
            deleteModal.classList.add('hidden');
        }, 300);
    }
    
    // Delete a character
    function deleteCharacter(characterId) {
        try {
            // Get existing custom characters
            let customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
            
            // Filter out the character to delete
            customCharacters = customCharacters.filter(char => char.id !== characterId);
            
            // Save back to localStorage
            localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
            
            // Remove from characters array
            characters = characters.filter(char => char.id !== characterId);
            
            // Show success toast
            showToast('Character deleted successfully', 'success');
            
            // Reload characters
            renderCharacters();
            
            // Update current index if needed
            if (currentIndex >= characters.length) {
                currentIndex = Math.max(0, characters.length - 1);
            }
            
            // Update selected character
            if (characters.length > 0) {
                selectCharacter(currentIndex);
            } else {
                selectedCharacter = null;
                window.selectedCharacter = null;
                renderCreatePrompt();
            }
            
        } catch (error) {
            console.error('Error deleting character:', error);
            showToast('Failed to delete character. Please try again.', 'error');
        }
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Remove after timeout
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Add pixel decorations to the background
    function addPixelDecorations() {
        const container = document.querySelector('.pixel-container');
        if (!container) return;
        
        for (let i = 0; i < 15; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'bg-pixel';
            
            // Random position
            pixel.style.left = `${Math.random() * 100}%`;
            pixel.style.top = `${Math.random() * 100}%`;
            
            // Random size
            const size = 2 + Math.random() * 5;
            pixel.style.width = `${size}px`;
            pixel.style.height = `${size}px`;
            
            // Random color
            const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-warning)'];
            pixel.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Random animation duration and delay
            pixel.style.animationDuration = `${15 + Math.random() * 15}s`;
            pixel.style.animationDelay = `${Math.random() * 5}s`;
            
            container.appendChild(pixel);
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
                    // Add loading animation
                    selectButton.classList.add('loading');
                    selectButton.innerHTML = '<span class="spinner"></span> Loading...';
                    
                    // Store selected character in localStorage
                    localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                    
                    // Navigate to game with a small delay to show loading
                    setTimeout(() => {
                        window.location.href = '/game';
                    }, 800);
                }
            });
        }
        
        // Delete confirmation buttons
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
        
        // Close modal when clicking outside
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    hideDeleteConfirmation();
                    characterToDelete = null;
                }
            });
        }
        
        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (characters.length === 0) {
                // When in "no characters" state, 'Enter' key should trigger character creation
                if (e.key === 'Enter') {
                    window.location.href = '/character-create';
                }
                return;
            }
            
            if (e.key === 'ArrowLeft') {
                navigateCarousel('prev');
            } else if (e.key === 'ArrowRight') {
                navigateCarousel('next');
            } else if (e.key === 'Enter' && selectButton && !selectButton.disabled) {
                selectButton.click();
            } else if (e.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
                hideDeleteConfirmation();
                characterToDelete = null;
            }
        });
    }
    
    // Initialize
    initialize();
});