// skill_tree_access.js - Fixed layout structure

// Function to toggle skill tree visibility
function toggleSkillTree() {
    const container = document.getElementById('skill-tree-container');
    if (!container) {
        console.error("Skill tree container not found");
        return;
    }
    
    // Toggle visibility
    container.classList.toggle('visible');
    
    // If now visible, ensure skill tree is loaded
    if (container.classList.contains('visible')) {
        // Refresh skill tree data if needed
        if (typeof SkillTreeController !== 'undefined' && SkillTreeController.initialized) {
            SkillTreeController.loadSkillTree();
        }
    }
}

// Function to create skill tree access button
function createSkillTreeButton(parentElement, label = "Specialization Tree") {
    if (!parentElement) {
        console.error("Parent element not provided for skill tree button");
        return null;
    }
    
    const button = document.createElement('button');
    button.className = 'skill-tree-access-button';
    button.textContent = label;
    button.addEventListener('click', toggleSkillTree);
    
    parentElement.appendChild(button);
    return button;
}

// Initialize skill tree container with proper structure
function initializeSkillTreeContainer() {
    // Check if container already exists
    let container = document.getElementById('skill-tree-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'skill-tree-container';
        
        // Create inner structure with proper content divs
        container.innerHTML = `
            <div class="skill-tree-panel">
                <div class="skill-tree-header">
                    <h2>Specialization Tree</h2>
                    <button class="skill-tree-close-button">&times;</button>
                </div>
                <div class="skill-tree-content">
                    <div id="skill-tree-visualization"></div>
                    <div id="skill-tree-ui">
                        <div id="skill-tree-controls" class="skill-tree-controls"></div>
                        <div id="skill-tree-info" class="skill-tree-info"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add close button functionality
        const closeButton = container.querySelector('.skill-tree-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', toggleSkillTree);
        }
        
        document.body.appendChild(container);
    }
    
    return container;
}

// Function to set up skill tree access in game
function setupSkillTreeAccess() {
    // Initialize container with proper structure
    initializeSkillTreeContainer();
    
    // Add button to game UI (during run)
    const gameUI = document.querySelector('.game-ui') || document.querySelector('.hud-container');
    if (gameUI) {
        createSkillTreeButton(gameUI, "Specializations");
    }
    
    // Add button to character selection screen
    const characterSelection = document.querySelector('.character-selection');
    if (characterSelection) {
        createSkillTreeButton(characterSelection, "View Specializations");
    }
    
    // Initialize skill tree components if not already initialized
    if (typeof SkillTreeController !== 'undefined' && !SkillTreeController.initialized) {
        SkillTreeController.initialize({
            renderContainerId: 'skill-tree-visualization',
            uiContainerId: 'skill-tree-ui',
            controlsContainerId: 'skill-tree-controls',
            infoContainerId: 'skill-tree-info'
        });
    }
}

// Call setup on document ready
document.addEventListener('DOMContentLoaded', setupSkillTreeAccess);

// Make functions globally available
window.toggleSkillTree = toggleSkillTree;
window.setupSkillTreeAccess = setupSkillTreeAccess;