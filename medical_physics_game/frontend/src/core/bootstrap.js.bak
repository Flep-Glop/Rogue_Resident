/**
 * Application bootstrap script for Medical Physics Game
 * Initializes the game and sets up the required dependencies
 */

import { Game } from './game.js';
import { EventSystem } from './event_system.js';
import { StateManager } from './state_manager.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Medical Physics Game');
    
    // Initialize event system
    const eventSystem = new EventSystem();
    window.eventSystem = eventSystem;
    
    // Initialize state manager
    const stateManager = new StateManager();
    window.stateManager = stateManager;
    
    // Initialize page-specific functionality
    initializeCurrentPage();
});

/**
 * Initialize page-specific functionality based on current URL
 */
function initializeCurrentPage() {
    const currentPath = window.location.pathname;
    
    // Initialize appropriate page handler
    if (currentPath === '/' || currentPath.includes('/index')) {
        initializeHomePage();
    } else if (currentPath.includes('/character-select')) {
        initializeCharacterSelect();
    } else if (currentPath.includes('/game')) {
        initializeGame();
    } else if (currentPath.includes('/item-editor')) {
        initializeItemEditor();
    }
}

/**
 * Initialize home page functionality
 */
function initializeHomePage() {
    console.log('Initializing home page');
    
    // Set up event listeners for home page buttons
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            window.location.href = '/character-select';
        });
    }
    
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            // Check for saved game data
            fetch('/api/save-games')
                .then(response => response.json())
                .then(data => {
                    if (data.saves && data.saves.length > 0) {
                        window.location.href = '/game?load=true';
                    } else {
                        alert('No saved games found!');
                    }
                })
                .catch(error => {
                    console.error('Error checking save games:', error);
                    alert('Error checking save games');
                });
        });
    }
}

/**
 * Initialize character selection page
 */
function initializeCharacterSelect() {
    console.log('Initializing character select');
    
    // Dynamically import character select module
    import('../ui/screens/character_select.js')
        .then(module => {
            const characterSelect = new module.CharacterSelect();
            characterSelect.initialize();
        })
        .catch(error => {
            console.error('Error loading character select module:', error);
        });
}

/**
 * Initialize main game page
 */
function initializeGame() {
    console.log('Initializing game');
    
    // Create game instance
    const game = new Game();
    window.game = game;
    
    // Check if we're loading a saved game
    const urlParams = new URLSearchParams(window.location.search);
    const loadSave = urlParams.get('load') === 'true';
    
    // Initialize game
    game.initialize(loadSave);
}

/**
 * Initialize item editor page
 */
function initializeItemEditor() {
    console.log('Initializing item editor');
    
    // Dynamically import item editor module
    import('../entities/items/item_editor.js')
        .then(module => {
            const itemEditor = new module.ItemEditor();
            itemEditor.initialize();
        })
        .catch(error => {
            console.error('Error loading item editor module:', error);
        });
}

// Make the EventSystem and StateManager available globally for debugging
window.EventSystem = EventSystem;
window.StateManager = StateManager;