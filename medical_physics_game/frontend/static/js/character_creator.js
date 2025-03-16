/**
 * Modern Character Creator
 * Featuring animated tabs, 3D avatar rotation, and interactive attribute sliders
 */

document.addEventListener('DOMContentLoaded', function() {
    // Modify these constants in character_creator.js
    const MAX_ATTRIBUTE_VALUE = 10;
    const MIN_ATTRIBUTE_VALUE = 1;
    const ADJUSTABLE_POINTS = 3; // Changed from 15 to 3
    const BASE_ATTRIBUTE_VALUE = 5; // Default value for attributes
    
    // State
    let state = {
        currentTab: 'avatar',
        avatarRotation: 0,
        selectedAvatar: null,
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
    
    // Character data (from assets)
    const characterTemplates = window.gameCharacters || [];
    
    // Avatar data
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
    
    // Update the character class templates to include a starting ability
    const characterClasses = [
        {
            id: 'physicist',
            name: 'Medical Physicist',
            description: 'Specializes in the technical aspects of medical physics with strong analytical skills.',
            attributeBias: { intelligence: 2, persistence: 1, adaptability: 0 },
            startingAbility: 'Critical Analysis', // Added starting ability
            startingRelic: 'Physics Textbook', // Optional starting relic
            recommendedAbilities: ['Research Methodology', 'Equipment Mastery'],
            icon: 'atom'
        },
        {
            id: 'clinician',
            name: 'Clinical Specialist',
            description: 'Focuses on patient care and clinical applications of medical physics.',
            attributeBias: { intelligence: 1, persistence: 0, adaptability: 2 },
            startingAbility: 'Clinical Diagnosis', // Added starting ability
            startingRelic: 'Medical Chart', // Optional starting relic
            recommendedAbilities: ['Patient Care', 'Team Communication'],
            icon: 'user-md'
        },
        {
            id: 'researcher',
            name: 'Research Scientist',
            description: 'Dedicated to advancing medical physics through experimentation and innovation.',
            attributeBias: { intelligence: 2, persistence: 2, adaptability: -1 },
            startingAbility: 'Research Methodology', // Added starting ability
            startingRelic: 'Lab Journal', // Optional starting relic
            recommendedAbilities: ['Technical Writing', 'Data Analysis'],
            icon: 'flask'
        },
        {
            id: 'consultant',
            name: 'Quality Consultant',
            description: 'Ensures safety standards and process quality in medical physics applications.',
            attributeBias: { intelligence: 1, persistence: 2, adaptability: 0 },
            startingAbility: 'Detail Oriented', // Added starting ability
            startingRelic: 'Quality Manual', // Optional starting relic
            recommendedAbilities: ['Process Improvement', 'Radiation Safety'],
            icon: 'clipboard-check'
        }
    ];
    
    // DOM elements
    const creationTabs = document.querySelectorAll('.creation-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const avatarGrid = document.getElementById('avatar-grid');
    const selectedAvatarPreview = document.getElementById('selected-avatar-preview');
    const classCards = document.getElementById('class-cards');
    const pointsRemainingElement = document.getElementById('points-remaining');
    const availableAbilitiesList = document.getElementById('available-abilities');
    const selectedAbilitiesList = document.getElementById('selected-abilities');
    const createCharacterBtn = document.getElementById('create-character-btn');
    
    // Attribute slider elements
    const attributeSliders = {
        intelligence: document.getElementById('intelligence-slider'),
        persistence: document.getElementById('persistence-slider'),
        adaptability: document.getElementById('adaptability-slider')
    };
    
    const attributeValues = {
        intelligence: document.getElementById('intelligence-value'),
        persistence: document.getElementById('persistence-value'),
        adaptability: document.getElementById('adaptability-value')
    };
    
    const attributeProgresses = {
        intelligence: document.getElementById('intelligence-progress'),
        persistence: document.getElementById('persistence-progress'),
        adaptability: document.getElementById('adaptability-progress')
    };
    
    // Preview elements
    const previewAvatarImg = document.getElementById('preview-avatar-img');
    const previewName = document.getElementById('preview-name');
    const previewClass = document.getElementById('preview-class');
    const previewIntelligence = document.getElementById('preview-intelligence');
    const previewPersistence = document.getElementById('preview-persistence');
    const previewAdaptability = document.getElementById('preview-adaptability');
    const previewAbilities = document.getElementById('preview-abilities');
    
    // Get elements for avatar rotation
    const rotateLeftBtn = document.getElementById('rotate-left');
    const rotateRightBtn = document.getElementById('rotate-right');
    
    // Get navigation buttons
    const prevButtons = document.querySelectorAll('[data-prev-tab]');
    const nextButtons = document.querySelectorAll('[data-next-tab]');
    
    // Updated initialize function to adjust the tab navigation
    function initialize() {
        // Set default state
        state.selectedAvatar = avatarImages[0];
        
        // Render avatars
        renderAvatarGrid();
        
        // Render class cards
        renderClassCards();
        
        // Initialize attributes
        updateAttributeDisplay();
        
        // Initialize abilities list
        renderAbilitiesLists();
        
        // Update preview
        updatePreview();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update navigation to skip abilities if a class is selected
        updateTabNavigation();
    }
    
    // Add function to update tab navigation
    function updateTabNavigation() {
        // Get next button on attributes tab
        const attributesNextBtn = document.querySelector('[data-next-tab="abilities"]');
        
        // Get previous button on preview tab
        const previewPrevBtn = document.querySelector('[data-prev-tab="abilities"]');
        
        // If we have a class selected, update navigation to skip abilities tab
        if (state.selectedClass) {
            // Update attributes tab's next button to go to preview
            if (attributesNextBtn) {
                attributesNextBtn.dataset.nextTab = "preview";
            }
            
            // Update preview tab's prev button to go to attributes
            if (previewPrevBtn) {
                previewPrevBtn.dataset.prevTab = "attributes";
            }
        } else {
            // Restore default navigation
            if (attributesNextBtn) {
                attributesNextBtn.dataset.nextTab = "abilities";
            }
            
            if (previewPrevBtn) {
                previewPrevBtn.dataset.prevTab = "abilities";
            }
        }
    }

    // Switch between tabs
    function switchTab(tabName) {
        // Update state
        state.currentTab = tabName;
        
        // Update tab buttons
        creationTabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update tab content visibility
        tabContents.forEach(content => {
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // Scroll to top of container
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Render avatar grid
    function renderAvatarGrid() {
        if (!avatarGrid) return;
        
        avatarGrid.innerHTML = '';
        
        // Create avatar items
        avatarImages.forEach((avatarPath, index) => {
            const avatarItem = document.createElement('div');
            avatarItem.className = 'avatar-item';
            
            if (avatarPath === state.selectedAvatar) {
                avatarItem.classList.add('selected');
            }
            
            const img = document.createElement('img');
            img.src = avatarPath;
            img.alt = `Avatar ${index + 1}`;
            img.onerror = function() {
                this.src = '/static/img/characters/debug_mode.png';
            };
            
            avatarItem.appendChild(img);
            
            // Add click event
            avatarItem.addEventListener('click', () => {
                state.selectedAvatar = avatarPath;
                
                // Update preview
                selectedAvatarPreview.src = avatarPath;
                
                // Reset rotation
                state.avatarRotation = 0;
                updateAvatarRotation();
                
                // Update avatar selection
                document.querySelectorAll('.avatar-item').forEach(item => {
                    item.classList.remove('selected');
                });
                avatarItem.classList.add('selected');
                
                // Update preview
                updatePreview();
            });
            
            avatarGrid.appendChild(avatarItem);
        });
        
        // Update selected avatar preview
        selectedAvatarPreview.src = state.selectedAvatar;
    }
    
    // Update avatar rotation
    function updateAvatarRotation() {
        if (selectedAvatarPreview) {
            selectedAvatarPreview.style.transform = `rotateY(${state.avatarRotation}deg)`;
        }
    }
    
    // Modify the renderClassCards function to reflect the starting ability
    function renderClassCards() {
        if (!classCards) return;
        
        classCards.innerHTML = '';
        
        characterClasses.forEach(characterClass => {
            const classCard = document.createElement('div');
            classCard.className = 'class-card';
            
            if (state.selectedClass && state.selectedClass.id === characterClass.id) {
                classCard.classList.add('selected');
            }
            
            classCard.innerHTML = `
                <div class="class-header">
                    <div class="class-name">${characterClass.name}</div>
                    <div class="class-icon">
                        <i class="fas fa-${characterClass.icon || 'star'}"></i>
                    </div>
                </div>
                <div class="class-description">
                    ${characterClass.description}
                </div>
                <div class="class-attributes">
                    <div class="class-attribute">
                        INT: <span class="attribute-value ${characterClass.attributeBias.intelligence > 0 ? 'positive' : characterClass.attributeBias.intelligence < 0 ? 'negative' : ''}">${characterClass.attributeBias.intelligence > 0 ? '+' : ''}${characterClass.attributeBias.intelligence}</span>
                    </div>
                    <div class="class-attribute">
                        PER: <span class="attribute-value ${characterClass.attributeBias.persistence > 0 ? 'positive' : characterClass.attributeBias.persistence < 0 ? 'negative' : ''}">${characterClass.attributeBias.persistence > 0 ? '+' : ''}${characterClass.attributeBias.persistence}</span>
                    </div>
                    <div class="class-attribute">
                        ADP: <span class="attribute-value ${characterClass.attributeBias.adaptability > 0 ? 'positive' : characterClass.attributeBias.adaptability < 0 ? 'negative' : ''}">${characterClass.attributeBias.adaptability > 0 ? '+' : ''}${characterClass.attributeBias.adaptability}</span>
                    </div>
                </div>
                <div class="starting-ability">
                    <span class="ability-label">Starting Ability:</span>
                    <span class="ability-value">${characterClass.startingAbility}</span>
                </div>
                ${characterClass.startingRelic ? `
                <div class="starting-relic">
                    <span class="relic-label">Starting Relic:</span>
                    <span class="relic-value">${characterClass.startingRelic}</span>
                </div>
                ` : ''}
            `;
            
            classCard.addEventListener('click', () => {
                // Update selected class
                state.selectedClass = characterClass;
                
                // Reset attributes
                resetAttributes();
                
                // Apply class attribute bias and starting ability
                applyClassAttributeBias(characterClass);
                
                // Update class selection
                document.querySelectorAll('.class-card').forEach(card => {
                    card.classList.remove('selected');
                });
                classCard.classList.add('selected');
                
                // Update preview
                updatePreview();
                
                // Add this line to update tab navigation when class is selected
                updateTabNavigation();
            });
            
            classCards.appendChild(classCard);
        });
    }
    
    // Reset attributes to default
    function resetAttributes() {
        state.attributes = {
            intelligence: 5,
            persistence: 5,
            adaptability: 5
        };
        
        // Update sliders
        for (const attribute in attributeSliders) {
            if (attributeSliders[attribute]) {
                attributeSliders[attribute].value = 5;
            }
        }
        
        // Recalculate points
        recalculatePoints();
        
        // Update display
        updateAttributeDisplay();
    }
    
    // Update the applyClassAttributeBias function to reset points and grant starting ability
    function applyClassAttributeBias(characterClass) {
        if (!characterClass) return;
        
        // Reset attributes to base values first
        state.attributes = {
            intelligence: BASE_ATTRIBUTE_VALUE,
            persistence: BASE_ATTRIBUTE_VALUE,
            adaptability: BASE_ATTRIBUTE_VALUE
        };
        
        // Apply bias to attributes
        for (const attribute in characterClass.attributeBias) {
            const newValue = state.attributes[attribute] + characterClass.attributeBias[attribute];
            
            // Ensure value is within bounds
            state.attributes[attribute] = Math.max(
                MIN_ATTRIBUTE_VALUE,
                Math.min(MAX_ATTRIBUTE_VALUE, newValue)
            );
            
            // Update slider
            if (attributeSliders[attribute]) {
                attributeSliders[attribute].value = state.attributes[attribute];
            }
        }
        
        // Reset points to the adjustable amount
        state.pointsRemaining = ADJUSTABLE_POINTS;
        
        // Auto-assign the starting ability
        state.selectedAbilities = [];
        const startingAbility = availableAbilities.find(a => a.name === characterClass.startingAbility);
        if (startingAbility) {
            state.selectedAbilities.push(startingAbility);
        }
        
        // Update display
        updateAttributeDisplay();
        renderAbilitiesLists();
    }
    
    // Update recalculatePoints function to work with the new system
    function recalculatePoints() {
        // Only count points used for adjustments after class selection
        if (!state.selectedClass) {
            // If no class selected, use old system temporarily
            const pointsUsed = Object.values(state.attributes).reduce((total, value) => {
                return total + (value - MIN_ATTRIBUTE_VALUE);
            }, 0);
            state.pointsRemaining = TOTAL_ATTRIBUTE_POINTS - pointsUsed;
        } else {
            // Calculate based on deviations from class base values
            let pointsUsed = 0;
            
            // Get base attributes including class bias
            const baseAttributes = {
                intelligence: BASE_ATTRIBUTE_VALUE,
                persistence: BASE_ATTRIBUTE_VALUE,
                adaptability: BASE_ATTRIBUTE_VALUE
            };
            
            // Apply class bias
            for (const attribute in state.selectedClass.attributeBias) {
                baseAttributes[attribute] += state.selectedClass.attributeBias[attribute];
            }
            
            // Calculate points used by comparing current to base
            for (const attribute in state.attributes) {
                const currentValue = state.attributes[attribute];
                const baseValue = baseAttributes[attribute];
                const difference = currentValue - baseValue;
                
                if (difference > 0) {
                    // Using points for increase
                    pointsUsed += difference;
                } else if (difference < 0) {
                    // Gaining points from decrease
                    pointsUsed -= difference / 2; // Make lowering stats less efficient
                }
            }
            
            state.pointsRemaining = ADJUSTABLE_POINTS - pointsUsed;
        }
    }
    
    // Update attribute display
    function updateAttributeDisplay() {
        // Update points remaining
        pointsRemainingElement.textContent = state.pointsRemaining;
        
        if (state.pointsRemaining <= 0) {
            pointsRemainingElement.classList.add('empty');
        } else {
            pointsRemainingElement.classList.remove('empty');
        }
        
        // Update attribute values and progress bars
        for (const attribute in state.attributes) {
            const value = state.attributes[attribute];
            
            // Update value display
            if (attributeValues[attribute]) {
                attributeValues[attribute].textContent = value;
            }
            
            // Update progress bar
            if (attributeProgresses[attribute]) {
                const percentage = (value / MAX_ATTRIBUTE_VALUE) * 100;
                attributeProgresses[attribute].style.width = `${percentage}%`;
            }
            
            // Update slider
            if (attributeSliders[attribute]) {
                attributeSliders[attribute].value = value;
                
                // Disable if at max or no points
                attributeSliders[attribute].disabled = 
                    (value >= MAX_ATTRIBUTE_VALUE) || 
                    (state.pointsRemaining <= 0 && value < MAX_ATTRIBUTE_VALUE);
            }
        }
    }
    
    // Update ability selection to show starting ability as locked
    function renderAbilitiesLists() {
        // Update available count
        document.getElementById('available-count').textContent = availableAbilities.length;
        
        // Update selected count - show 1/2 initially if class is selected
        const maxSelectableAbilities = 1; // Changed from 2 to 1 (since starting ability is automatic)
        document.getElementById('selected-count').textContent = state.selectedAbilities.length;
        document.getElementById('ability-slots').textContent = `/${maxSelectableAbilities + 1}`; // +1 for starting ability
        
        // Filter abilities based on search and category
        const filteredAbilities = availableAbilities.filter(ability => {
            // Apply search filter
            const searchMatch = !state.abilitySearchFilter || 
                ability.name.toLowerCase().includes(state.abilitySearchFilter.toLowerCase()) ||
                ability.description.toLowerCase().includes(state.abilitySearchFilter.toLowerCase());
                
            // Apply category filter
            const categoryMatch = state.abilityCategory === 'all' || 
                ability.category === state.abilityCategory;
                
            // Skip starting ability from selected class
            const notStartingAbility = !state.selectedClass || ability.name !== state.selectedClass.startingAbility;
            
            return searchMatch && categoryMatch && notStartingAbility;
        });
        
        // Sort by recommended if class is selected
        if (state.selectedClass) {
            filteredAbilities.sort((a, b) => {
                const aRecommended = state.selectedClass.recommendedAbilities.includes(a.name);
                const bRecommended = state.selectedClass.recommendedAbilities.includes(b.name);
                
                if (aRecommended && !bRecommended) return -1;
                if (!aRecommended && bRecommended) return 1;
                return 0;
            });
        }
        
        // Clear available abilities list
        availableAbilitiesList.innerHTML = '';
        
        // Add available abilities (not already selected)
        filteredAbilities.forEach(ability => {
            // Skip if already selected
            if (state.selectedAbilities.some(a => a.name === ability.name)) {
                return;
            }
            
            const abilityItem = document.createElement('div');
            abilityItem.className = 'ability-item';
            
            // Check if recommended by selected class
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
            
            // Add click event to select (only if not at max)
            abilityItem.addEventListener('click', () => {
                // Can only select additional ability if we have less than max
                if (state.selectedAbilities.length <= maxSelectableAbilities) {
                    // Filter out non-starting abilities
                    const nonStartingAbilities = state.selectedAbilities.filter(a => 
                        !state.selectedClass || a.name !== state.selectedClass.startingAbility
                    );
                    
                    // If we already have a non-starting ability, replace it
                    if (nonStartingAbilities.length > 0) {
                        // Remove the non-starting ability
                        state.selectedAbilities = state.selectedAbilities.filter(a => 
                            state.selectedClass && a.name === state.selectedClass.startingAbility
                        );
                    }
                    
                    // Add the new ability
                    state.selectedAbilities.push(ability);
                    renderAbilitiesLists();
                    updatePreview();
                } else {
                    // Show message that max abilities are selected
                    showToast('Maximum abilities selected', 'info');
                }
            });
            
            availableAbilitiesList.appendChild(abilityItem);
        });
        
        // Add no results message if needed
        if (filteredAbilities.length === 0 || availableAbilitiesList.children.length === 0) {
            availableAbilitiesList.innerHTML = `
                <div class="no-abilities">
                    <div class="no-abilities-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <p>No abilities match your filter</p>
                </div>
            `;
        }
        
        // Clear selected abilities list
        selectedAbilitiesList.innerHTML = '';
        
        // Add selected abilities
        if (state.selectedAbilities.length === 0) {
            selectedAbilitiesList.innerHTML = `
                <div class="no-abilities">
                    <div class="no-abilities-icon">
                        <i class="fas fa-magic"></i>
                    </div>
                    <p>Select a class to get your starting ability</p>
                </div>
            `;
        } else {
            state.selectedAbilities.forEach(ability => {
                const abilityItem = document.createElement('div');
                abilityItem.className = 'ability-item selected';
                
                // Determine if this is the starting ability
                const isStartingAbility = state.selectedClass && ability.name === state.selectedClass.startingAbility;
                
                if (isStartingAbility) {
                    abilityItem.classList.add('starting-ability');
                }
                
                abilityItem.innerHTML = `
                    <div class="ability-header">
                        <span class="ability-name">${ability.name}</span>
                        <span class="ability-category">${ability.category}</span>
                    </div>
                    <div class="ability-description">${ability.description}</div>
                    ${isStartingAbility ? 
                        '<div class="starting-badge">Starting Ability</div>' : 
                        '<div class="remove-ability" data-ability="' + ability.name + '">×</div>'}
                `;
                
                selectedAbilitiesList.appendChild(abilityItem);
            });
            
            // Add remove ability handlers (only for non-starting abilities)
            document.querySelectorAll('.remove-ability').forEach(btn => {
                btn.addEventListener('click', () => {
                    const abilityName = btn.dataset.ability;
                    state.selectedAbilities = state.selectedAbilities.filter(a => a.name !== abilityName);
                    renderAbilitiesLists();
                    updatePreview();
                });
            });
        }
    }
    
    // Update character preview
    function updatePreview() {
        // Update avatar
        previewAvatarImg.src = state.selectedAvatar;
        
        // Update name
        previewName.textContent = state.characterName || 'New Character';
        
        // Update class
        previewClass.textContent = state.selectedClass ? state.selectedClass.name : 'No Class Selected';
        
        // Update attributes
        previewIntelligence.textContent = state.attributes.intelligence;
        previewPersistence.textContent = state.attributes.persistence;
        previewAdaptability.textContent = state.attributes.adaptability;
        
        // Update abilities
        if (state.selectedAbilities.length === 0) {
            previewAbilities.innerHTML = '<span class="no-abilities">No abilities selected</span>';
        } else {
            previewAbilities.innerHTML = '';
            state.selectedAbilities.forEach(ability => {
                const abilityTag = document.createElement('div');
                abilityTag.className = 'preview-ability-tag';
                abilityTag.textContent = ability.name;
                previewAbilities.appendChild(abilityTag);
            });
        }
    }
    
    // Validate character before saving
    function validateCharacter() {
        let isValid = true;
        let errors = [];
        
        // Check name
        if (!state.characterName || state.characterName.trim() === '') {
            errors.push('Character name is required');
            isValid = false;
        }
        
        // Check abilities
        if (state.selectedAbilities.length === 0) {
            errors.push('At least one ability must be selected');
            isValid = false;
        }
        
        // Display errors
        if (!isValid) {
            errors.forEach(error => {
                showToast(error, 'error');
            });
        }
        
        return isValid;
    }
    
    // Save character
    function saveCharacter() {
        // Get starting relic if class is selected
        const startingRelic = state.selectedClass ? state.selectedClass.startingRelic : null;
        
        // Create character object
        const character = {
            id: Date.now(),
            name: state.characterName,
            max_hp: 100,
            current_hp: 100,
            abilities: state.selectedAbilities.map(a => a.name),
            stats: { ...state.attributes },
            level: 1,
            custom: true,
            image: state.selectedAvatar,
            class: state.selectedClass ? state.selectedClass.id : null,
            startingRelic: startingRelic, // Add starting relic
            description: state.selectedClass ? 
                `A custom ${state.selectedClass.name.toLowerCase()} specializing in medical physics.` : 
                'A custom character specializing in medical physics.'
        };
        
        // Try to save to server
        createCharacterBtn.disabled = true;
        createCharacterBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        createCharacterBtn.classList.add('button-loading');
        
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
            
            // Also save to localStorage
            saveToLocalStorage(savedCharacter);
            
            // Show success message
            showToast('Character created successfully!', 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/game';
            }, 1500);
        })
        .catch(error => {
            console.error('Error saving character to server:', error);
            
            // Fallback to localStorage only
            showToast('Saving to server failed, using local storage instead', 'warning');
            saveToLocalStorage(character);
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/game';
            }, 1500);
        })
        .finally(() => {
            createCharacterBtn.disabled = false;
            createCharacterBtn.innerHTML = '<i class="fas fa-save"></i> Create Character';
            createCharacterBtn.classList.remove('button-loading');
        });
    }
    
    // Save to localStorage
    function saveToLocalStorage(character) {
        // Get existing characters or initialize empty array
        let customCharacters = JSON.parse(localStorage.getItem('customCharacters') || '[]');
        
        // Add new character
        customCharacters.push(character);
        
        // Save updated list
        localStorage.setItem('customCharacters', JSON.stringify(customCharacters));
        
        // Also save as selected character
        localStorage.setItem('selectedCharacter', JSON.stringify(character));
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        // Create container if needed
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
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
    
    // Setup event listeners
    function setupEventListeners() {
        // Tab switching
        creationTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.tab);
            });
        });
        
        // Avatar rotation
        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', () => {
                state.avatarRotation -= 30;
                updateAvatarRotation();
            });
        }
        
        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', () => {
                state.avatarRotation += 30;
                updateAvatarRotation();
            });
        }
        
        // Character name input
        const nameInput = document.querySelector('input[name="character-name"]');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                state.characterName = e.target.value;
                updatePreview();
            });
        }
        
        // Attribute sliders
        for (const attribute in attributeSliders) {
            if (attributeSliders[attribute]) {
                attributeSliders[attribute].addEventListener('input', (e) => {
                    const newValue = parseInt(e.target.value);
                    const oldValue = state.attributes[attribute];
                    
                    // Calculate point change
                    const pointChange = newValue - oldValue;
                    
                    // Check if we have enough points
                    if (pointChange > 0 && state.pointsRemaining < pointChange) {
                        // Reset to previous value
                        e.target.value = oldValue;
                        return;
                    }
                    
                    // Update attribute value
                    state.attributes[attribute] = newValue;
                    
                    // Recalculate points
                    recalculatePoints();
                    
                    // Update display
                    updateAttributeDisplay();
                    
                    // Update preview
                    updatePreview();
                });
            }
        }
        
        // Ability search
        const abilitySearch = document.getElementById('ability-search');
        if (abilitySearch) {
            abilitySearch.addEventListener('input', (e) => {
                state.abilitySearchFilter = e.target.value;
                renderAbilitiesLists();
            });
        }
        
        // Ability category filters
        const filterButtons = document.querySelectorAll('.filter-button');
        if (filterButtons) {
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Update active filter
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Update state
                    state.abilityCategory = button.dataset.category;
                    
                    // Update list
                    renderAbilitiesLists();
                });
            });
        }
        
        // Tab navigation
        prevButtons.forEach(button => {
            button.addEventListener('click', () => {
                const prevTab = button.dataset.prevTab;
                if (prevTab) {
                    switchTab(prevTab);
                }
            });
        });
        
        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                const nextTab = button.dataset.nextTab;
                if (nextTab) {
                    switchTab(nextTab);
                }
            });
        });
        
        // Create character button
        if (createCharacterBtn) {
            createCharacterBtn.addEventListener('click', () => {
                if (validateCharacter()) {
                    saveCharacter();
                }
            });
        }
    }
    
    // Initialize the UI
    initialize();
});