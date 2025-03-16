/**
 * Bootstrap application
 */
import { Game } from './game.js';
import { StateManager } from './state_manager.js';
import { EventSystem } from './event_system.js';

// Initialize the event system
const eventSystem = new EventSystem();

// Initialize the state manager
const stateManager = new StateManager();

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    const game = new Game();
    
    // Make these available globally for debugging (optional)
    window.game = game;
    window.stateManager = stateManager;
    window.eventSystem = eventSystem;
    
    // Initialize and start the game
    game.init();
    
    // Update state to indicate game has started
    stateManager.updateState({
        gameStarted: true,
        currentScreen: document.body.dataset.screen || 'main'
    });
    
    // Register navigation event listeners
    setupNavigationListeners();
    
    console.log("Game bootstrap complete!");
});

/**
 * Set up navigation-related event listeners
 */
function setupNavigationListeners() {
    // Handle character selection
    const selectButton = document.getElementById('select-button');
    if (selectButton) {
        selectButton.addEventListener('click', () => {
            const selectedCharacter = window.selectedCharacter;
            if (selectedCharacter) {
                // Store selected character in localStorage
                localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
                // Navigate to game
                window.location.href = '/game';
            }
        });
    }
    
    // Options button functionality
    const optionsButton = document.getElementById('options');
    if (optionsButton) {
        optionsButton.addEventListener('click', () => {
            alert('Options will be available in the next update!');
        });
    }
    
    // Help button functionality
    const helpButton = document.getElementById('help');
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            alert('Welcome to Medical Physics Residency! Navigate through each floor, answer questions correctly to gain insight, and avoid losing all your lives. Good luck!');
        });
    }
    
    // Space key to start
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && document.querySelector('.menu-container')) {
            window.location.href = '/character_select';
        }
    });
    
    console.log("Navigation listeners initialized");
}