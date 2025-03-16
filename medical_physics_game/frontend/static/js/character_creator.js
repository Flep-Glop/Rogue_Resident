/**
 * Enhanced Character Creator for Medical Physics Game
 * Improved UI interactions and feedback
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
    
    // Available abilities with descriptions
    const availableAbilities = [
        { 
            name: 'Critical Analysis',
            description: 'Enhances problem identification and analytical reasoning.',
            category: 'Academic'
        },
        { 
            name: 'Problem Solving',
            description: 'Improves ability to find solutions to complex challenges.',
            category: 'Academic'
        },
        { 
            name: 'Clinical Diagnosis',
            description: 'Faster and more accurate clinical assessments.',
            category: 'Clinical'
        },
        { 
            name: 'Patient Care',
            description: 'Better rapport with patients and improved care outcomes.',
            category: 'Clinical'
        },
        { 
            name: 'Detail Oriented',
            description: 'Notices fine details that others might miss.',
            category: 'Professional'
        },
        { 
            name: 'Process Improvement',
            description: 'Identifies and implements workflow optimizations.',
            category: 'Professional'
        },
        { 
            name: 'Radiation Safety',
            description: 'Enhanced knowledge of radiation protection protocols.',
            category: 'Technical'
        },
        { 
            name: 'Equipment Mastery',
            description: 'Better understanding of imaging and therapy equipment.',
            category: 'Technical'
        },
        { 
            name: 'Research Methodology',
            description: 'Improved data collection and experimental design.',
            category: 'Academic'
        },
        { 
            name: 'Team Communication',
            description: 'More effective at sharing information with colleagues.',
            category: 'Professional'
        },
        { 
            name: 'Technical Writing',
            description: 'Creates clear documentation and professional reports.',
            category: 'Academic'
        },
        { 
            name: 'Data Analysis',
            description: 'Better interpretation of quantitative information.',
            category: 'Technical'
        }
    ];
    
    // Character class templates with starting attribute bias
    const characterClasses = [
        {
            id: 'physicist',
            name: 'Medical Physicist',
            description: 'Specializes in the technical aspects of medical physics with strong analytical skills.',
            attributeBias: { intelligence: 2, persistence: 1, adaptability: 0 },
            recommendedAbilities: ['Critical Analysis', 'Research Methodology', 'Equipment Mastery']
        },
        {
            id: 'clinician',
            name: 'Clinical Specialist',
            description: 'Focuses on patient care and clinical applications of medical physics.',
            attributeBias: { intelligence: 1, persistence: 0, adaptability: 2 },
            recommendedAbilities: ['Clinical Diagnosis', 'Patient Care', 'Team Communication']
        },
        {
            id: 'researcher',
            name: 'Research Scientist',
            description: 'Dedicated to advancing medical physics through experimentation and innovation.',
            attributeBias: { intelligence: 2, persistence: 2, adaptability: -1 },
            recommendedAbilities: ['Research Methodology', 'Technical Writing', 'Data Analysis']
        },
        {
            id: 'consultant',
            name: 'Quality Consultant',
            description: 'Ensures safety standards and process quality in medical physics applications.',
            attributeBias: { intelligence: 1, persistence: 2, adaptability: 0 },
            recommendedAbilities: ['Detail Oriented', 'Process Improvement', 'Radiation Safety']
        }
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
    
    // Add class selection if it exists in the DOM
    const classSelectionElement = document.getElementById('class-selection');
    
    // State
    let state = {
        currentAvatarPage: 1,
        avatarsPerPage: 6,
        selectedAvatar: avatarImages[0],
        characterName: '',
        selectedClass: null,
        attributes: {
            intelligence: 5,
            persistence: 5,
            adaptability: 5
        },
        pointsRemaining: TOTAL_ATTRIBUTE_POINTS,
        selectedAbilities: [],
        abilitySearchFilter: '',
        abilityCategory: 'all'
    };
    
    // Calculate total attribute points used
    function calculatePointsUsed() {
        return state.attributes.intelligence + 
               state.attributes.persistence + 
               state.attributes.adaptability - 
               (3 * MIN_ATTRIBUTE_VALUE); // Subtract minimum values since we start at MIN_ATTRIBUTE_VALUE
    }
    
    // Calculate points remaining
    function calculatePointsRemaining() {
        return TOTAL_ATTRIBUTE_POINTS - calculatePointsUsed();
    }
    
    // Update UI based on state
    function updateUI() {
        // Update points remaining
        state.pointsRemaining = calculatePointsRemaining();
        pointsRemainingElement.textContent = state.pointsRemaining;
        
        // Update points remaining style based on remaining points
        if (state.pointsRemaining <= 0) {
            pointsRemainingElement.classList.add('empty');
        } else {
            pointsRemainingElement.classList.remove('empty');
        }
        
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
            
            // Update button appearance based on state
            if (elements.minus.disabled) {
                elements.minus.classList.add('disabled');
            } else {
                elements.minus.classList.remove('disabled');
            }
            
            if (elements.plus.disabled) {
                elements.plus.classList.add('disabled');
            } else {
                elements.plus.classList.remove('disabled');
            }
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
        
        // Update character creation button text
        if (!isNameValid) {
            createCharacterBtn.setAttribute('data-tooltip', 'Please enter a character name');
        } else if (!hasAbilities) {
            createCharacterBtn.setAttribute('data-tooltip', 'Please select at least one ability');
        } else {
            createCharacterBtn.setAttribute('data-tooltip', 'Create your character and start the adventure!');
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
                // Add a selection animation
                avatarItem.classList.add('selecting');
                setTimeout(() => {
                    avatarItem.classList.remove('selecting');
                    state.selectedAvatar = avatarPath;
                    renderAvatarGrid();
                    updateUI();
                }, 200);
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
    
    // Render class selection if the element exists
    function renderClassSelection() {
        if (!classSelectionElement) return;
        
        classSelectionElement.innerHTML = '';
        
        // Create class cards
        characterClasses.forEach(charClass => {
            const classCard = document.createElement('div');
            classCard.className = 'class-card';
            
            if (state.selectedClass && state.selectedClass.id === charClass.id) {
                classCard.classList.add('selected');
            }
            
            classCard.innerHTML = `
                <h3>${charClass.name}</h3>
                <p>${charClass.description}</p>
                <div class="class-attributes">
                    <div class="class-attribute">INT: ${charClass.attributeBias.intelligence > 0 ? '+' : ''}${charClass.attributeBias.intelligence}</div>
                    <div class="class-attribute">PER: ${charClass.attributeBias.persistence > 0 ? '+' : ''}${charClass.attributeBias.persistence}</div>
                    <div class="class-attribute">ADP: ${charClass.attributeBias.adaptability > 0 ? '+' : ''}${charClass.attributeBias.adaptability}</div>
                </div>
            `;
            
            classCard.addEventListener('click', () => {
                // Update selected class
                state.selectedClass = charClass;
                
                // Apply class attribute bias
                applyClassAttributeBias(charClass);
                
                // Render class selection again
                renderClassSelection();
                
                // Update abilities - show recommended
                renderAbilitiesLists();
                
                // Update UI
                updateUI();
            });
            
            classSelectionElement.appendChild(classCard);
        });
    }
    
    // Apply class attribute bias
    function applyClassAttributeBias(charClass) {
        // Reset attributes to base 5
        state.attributes.intelligence = 5;
        state.attributes.persistence = 5;
        state.attributes.adaptability = 5;
        
        // Apply bias
        state.attributes.intelligence += charClass.attributeBias.intelligence;
        state.attributes.persistence += charClass.attributeBias.persistence;
        state.attributes.adaptability += charClass.attributeBias.adaptability;
        
        // Ensure values are within bounds
        for (const attribute in state.attributes) {
            if (state.attributes[attribute] < MIN_ATTRIBUTE_VALUE) {
                state.attributes[attribute] = MIN_ATTRIBUTE_VALUE;
            } else if (state.attributes[attribute] > MAX_ATTRIBUTE_VALUE) {
                state.attributes[attribute] = MAX_ATTRIBUTE_VALUE;
            }
        }
    }
    
    // Filter abilities
    function filterAbilities() {
        let filtered = [...availableAbilities];
        
        // Apply search filter
        if (state.abilitySearchFilter) {
            const search = state.abilitySearchFilter.toLowerCase();
            filtered = filtered.filter(ability => 
                ability.name.toLowerCase().includes(search) || 
                ability.description.toLowerCase().includes(search)
            );
        }
        
        // Apply category filter
        if (state.abilityCategory !== 'all') {
            filtered = filtered.filter(ability => 
                ability.category === state.abilityCategory
            );
        }
        
        return filtered;
    }
    
    // Render abilities lists
    function renderAbilitiesLists() {
        // Render available abilities
        abilitiesAvailableElement.innerHTML = '';
        
        // Filter abilities
        const filteredAbilities = filterAbilities();
        
        // Sort abilities by recommended status if a class is selected
        if (state.selectedClass) {
            filteredAbilities.sort((a, b) => {
                const aRecommended = state.selectedClass.recommendedAbilities.includes(a.name);
                const bRecommended = state.selectedClass.recommendedAbilities.includes(b.name);
                
                if (aRecommended && !bRecommended) return -1;
                if (!aRecommended && bRecommended) return 1;
                return 0;
            });
        }
        
        // Get available abilities (not already selected)
        const availableForSelection = filteredAbilities.filter(
            ability => !state.selectedAbilities.some(selected => selected.name === ability.name)
        );
        
        // Add ability search and filter if more than 5 abilities
        if (availableAbilities.length > 5 && !document.getElementById('ability-search')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'ability-search-container';
            searchContainer.innerHTML = `
                <input type="text" id="ability-search" placeholder="Search abilities..." class="ability-search">
                <div class="ability-categories">
                    <button class="ability-category-btn ${state.abilityCategory === 'all' ? 'active' : ''}" data-category="all">All</button>
                    <button class="ability-category-btn ${state.abilityCategory === 'Academic' ? 'active' : ''}" data-category="Academic">Academic</button>
                    <button class="ability-category-btn ${state.abilityCategory === 'Clinical' ? 'active' : ''}" data-category="Clinical">Clinical</button>
                    <button class="ability-category-btn ${state.abilityCategory === 'Professional' ? 'active' : ''}" data-category="Professional">Professional</button>
                    <button class="ability-category-btn ${state.abilityCategory === 'Technical' ? 'active' : ''}" data-category="Technical">Technical</button>
                </div>
            `;
            
            // Add search and category filter event listeners
            setTimeout(() => {
                const searchInput = document.getElementById('ability-search');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        state.abilitySearchFilter = e.target.value;
                        renderAbilitiesLists();
                    });
                    
                    // Set initial value from state
                    searchInput.value = state.abilitySearchFilter;
                }
                
                // Category buttons
                document.querySelectorAll('.ability-category-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        state.abilityCategory = button.dataset.category;
                        renderAbilitiesLists();
                    });
                });
            }, 0);
            
            abilitiesAvailableElement.appendChild(searchContainer);
        }
        
        // Display no results message if nothing found
        if (availableForSelection.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-abilities-message';
            noResults.textContent = 'No abilities match your filter';
            abilitiesAvailableElement.appendChild(noResults);
        }
        
        // Render each available ability
        availableForSelection.forEach(ability => {
            const abilityItem = document.createElement('div');
            abilityItem.className = 'ability-item';
            
            // Highlight recommended abilities
            if (state.selectedClass && state.selectedClass.recommendedAbilities.includes(ability.name)) {
                abilityItem.classList.add('recommended');
            }
            
            abilityItem.innerHTML = `
                <div class="ability-header">
                    <span class="ability-name">${ability.name}</span>
                    <span class="ability-category">${ability.category}</span>
                </div>
                <div class="ability-description">${ability.description}</div>
                ${state.selectedClass && state.selectedClass.recommendedAbilities.includes(ability.name) ? 
                    '<div class="recommended-badge">Recommended</div>' : ''}
            `;
            
            abilityItem.addEventListener('click', () => {
                if (state.selectedAbilities.length < MAX_ABILITIES) {
                    state.selectedAbilities.push(ability);
                    renderAbilitiesLists();
                    updatePreviewAbilities();
                    updateUI();
                    
                    // Add selection animation
                    abilityItem.classList.add('selecting');
                }
            });
            
            abilitiesAvailableElement.appendChild(abilityItem);
        });
        
        // Render selected abilities
        abilitiesSelectedElement.innerHTML = '';
        
        // Show message if no abilities selected
        if (state.selectedAbilities.length === 0) {
            const noSelected = document.createElement('div');
            noSelected.className = 'no-abilities-message';
            noSelected.textContent = 'Select up to two abilities';
            abilitiesSelectedElement.appendChild(noSelected);
        }
        
        // Render selected abilities
        state.selectedAbilities.forEach(ability => {
            const abilityItem = document.createElement('div');
            abilityItem.className = 'ability-item selected';
            
            abilityItem.innerHTML = `
                <div class="ability-header">
                    <span class="ability-name">${ability.name}</span>
                    <span class="ability-category">${ability.category}</span>
                </div>
                <div class="ability-description">${ability.description}</div>
                <button class="remove-ability-btn">✕</button>
            `;
            
            // Find and attach event listener to the remove button
            setTimeout(() => {
                const removeBtn = abilityItem.querySelector('.remove-ability-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent triggering abilityItem click
                        
                        // Remove from selected abilities
                        state.selectedAbilities = state.selectedAbilities.filter(a => a.name !== ability.name);
                        
                        // Update UI
                        renderAbilitiesLists();
                        updatePreviewAbilities();
                        updateUI();
                    });
                }
            }, 0);
            
            abilitiesSelectedElement.appendChild(abilityItem);
        });
        
        // Show remaining slots indicator
        const slotsIndicator = document.createElement('div');
        slotsIndicator.className = 'slots-indicator';
        slotsIndicator.textContent = `${state.selectedAbilities.length}/${MAX_ABILITIES} slots used`;
        abilitiesSelectedElement.appendChild(slotsIndicator);
    }
    
    // Update preview abilities
    function updatePreviewAbilities() {
        previewAbilities.innerHTML = '';
        
        state.selectedAbilities.forEach(ability => {
            const abilityElement = document.createElement('div');
            abilityElement.className = 'preview-ability';
            abilityElement.textContent = ability.name;
            
            // Add a tooltip with the ability description
            abilityElement.setAttribute('data-tooltip', ability.description);
            
            previewAbilities.appendChild(abilityElement);
        });
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    // Initialize the UI
    function initialize() {
        // Render avatar grid
        renderAvatarGrid();
        
        // Render class selection if it exists
        renderClassSelection();
        
        // Create objects for abilities
        state.selectedAbilities = [];
        
        // Render abilities lists
        renderAbilitiesLists();
        
        // Update all UI elements
        updateUI();
        
        // Set up event listeners
        setupEventListeners();
        
        // Add UI enhancement - floating pixels
        addFloatingPixels();
    }
    
    // Add floating pixel decorations
    function addFloatingPixels() {
        const container = document.querySelector('.pixel-container');
        if (!container) return;
        
        for (let i = 0; i < 20; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'floating-pixel';
            
            // Random position
            pixel.style.left = `${Math.random() * 100}%`;
            pixel.style.top = `${Math.random() * 100}%`;
            
            // Random size
            const size = 2 + Math.random() * 4;
            pixel.style.width = `${size}px`;
            pixel.style.height = `${size}px`;
            
            // Random color
            const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-warning)'];
            pixel.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Random animation
            pixel.style.animationDuration = `${10 + Math.random() * 20}s`;
            pixel.style.animationDelay = `${Math.random() * 5}s`;
            
            container.appendChild(pixel);
        }
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
                    // Add animation
                    elements.value.classList.add('value-change');
                    setTimeout(() => elements.value.classList.remove('value-change'), 300);
                    
                    state.attributes[attribute]--;
                    updateUI();
                }
            });
            
            elements.plus.addEventListener('click', () => {
                if (state.attributes[attribute] < MAX_ATTRIBUTE_VALUE && state.pointsRemaining > 0) {
                    // Add animation
                    elements.value.classList.add('value-change');
                    setTimeout(() => elements.value.classList.remove('value-change'), 300);
                    
                    state.attributes[attribute]++;
                    updateUI();
                }
            });
        }
        
        // Create character button
        createCharacterBtn.addEventListener('click', () => {
            if (validateCharacter()) {
                // Add loading animation
                createCharacterBtn.classList.add('loading');
                createCharacterBtn.innerHTML = '<span class="spinner"></span> Creating...';
                
                // Save with delay to show loading state
                setTimeout(() => {
                    saveCharacter();
                }, 800);
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Enter key to submit when form is valid
            if (e.key === 'Enter' && document.activeElement === characterNameInput) {
                if (validateCharacter()) {
                    saveCharacter();
                }
            }
        });
    }
    
    // Validate character before saving
    function validateCharacter() {
        let isValid = true;
        let errors = [];
        
        // Clear previous errors
        document.querySelectorAll('.error-text').forEach(el => el.remove());
        document.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));
        
        // Validate name
        if (!state.characterName.trim()) {
            errors.push('Character name is required');
            characterNameInput.classList.add('error-border');
            
            // Add error message
            const nameError = document.createElement('div');
            nameError.className = 'error-text';
            nameError.textContent = 'Character name is required';
            characterNameInput.parentNode.appendChild(nameError);
            
            isValid = false;
        } else {
            characterNameInput.classList.remove('error-border');
        }
        
        // Validate abilities
        if (state.selectedAbilities.length === 0) {
            errors.push('At least one ability must be selected');
            abilitiesSelectedElement.classList.add('error-border');
            
            // Add error message
            const abilitiesError = document.createElement('div');
            abilitiesError.className = 'error-text';
            abilitiesError.textContent = 'Select at least one ability';
            abilitiesSelectedElement.parentNode.appendChild(abilitiesError);
            
            isValid = false;
        } else {
            abilitiesSelectedElement.classList.remove('error-border');
        }
        
        // Display errors if any (using toast notifications)
        if (!isValid) {
            errors.forEach(error => {
                showToast(error, 'error');
            });
        }
        
        return isValid;
    }
    
    // Save character
    function saveCharacter() {
        // Map selected abilities to just the objects with name and description
        const abilitiesForStorage = state.selectedAbilities.map(ability => ability.name);
        
        // Create character object
        const character = {
            id: Date.now(), // Generate a unique ID
            name: state.characterName,
            max_hp: 100, // Default value
            current_hp: 100, // Default value
            abilities: abilitiesForStorage,
            stats: {
                intelligence: state.attributes.intelligence,
                persistence: state.attributes.persistence,
                adaptability: state.attributes.adaptability
            },
            level: 1,
            image: state.selectedAvatar,
            custom: true, // Flag to indicate this is a custom character
            class: state.selectedClass ? state.selectedClass.id : null,
            description: state.selectedClass ? 
                `A custom ${state.selectedClass.name.toLowerCase()} specializing in medical physics.` : 
                'A custom character specializing in medical physics.'
        };
        
        // Try to save to the server first if API is available
        createCharacterBtn.disabled = true;
        
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
            
            // Show success message
            showToast('Character created successfully!', 'success');
            
            // Show success animation
            const container = document.querySelector('.pixel-container');
            if (container) {
                container.classList.add('success-animation');
            }
            
            // Navigate to the game with a slight delay
            setTimeout(() => {
                window.location.href = '/game';
            }, 1500);
        })
        .catch(error => {
            console.error('Error saving character to server:', error);
            
            // Show warning that we're falling back to local storage
            showToast('Saving to server failed, using local storage instead', 'warning');
            
            // Fallback to localStorage only approach
            saveToLocalStorage(character);
            
            // Navigate to the game with a delay
            setTimeout(() => {
                window.location.href = '/game';
            }, 1500);
        })
        .finally(() => {
            createCharacterBtn.disabled = false;
            createCharacterBtn.innerHTML = 'Create Character';
            createCharacterBtn.classList.remove('loading');
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