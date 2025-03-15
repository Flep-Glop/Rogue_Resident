// skill_tree_access.js - Properly manages skill tree modal creation and access

/**
 * Handles the skill tree modal access, ensuring proper DOM structure
 * and initialization sequence to prevent "querySelector on null" errors.
 */
const SkillTreeAccess = {
    // Configuration
    config: {
        containerId: 'skill-tree-container',
        visualizationId: 'skill-tree-visualization',
        uiId: 'skill-tree-ui',
        controlsId: 'skill-tree-controls',
        infoId: 'skill-tree-info',
        headerText: 'Specialization Tree',
        buttonText: 'Specializations'
    },
    
    // State tracking
    isInitialized: false,
    isVisible: false,
    
    /**
     * Initialize the skill tree access (DOM structure and event handlers)
     * @returns {Object} The SkillTreeAccess object (for chaining)
     */
    initialize: function() {
        console.log("Initializing skill tree access...");
        
        if (this.isInitialized) {
            console.log("Skill tree access already initialized");
            return this;
        }
        
        // Create modal container with full structure
        this.createModalStructure();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Track initialization
        this.isInitialized = true;
        console.log("Skill tree access initialized successfully");
        
        // Add buttons to the UI
        this.addAccessButtons();
        
        return this;
    },
    
    createModalStructure: function() {
        console.log("Creating skill tree modal structure...");
        
        // Check if container already exists
        let container = document.getElementById(this.config.containerId);
        
        // If container already exists, completely rebuild its structure
        if (container) {
            console.log("Rebuilding existing skill tree container structure...");
            container.innerHTML = ''; // Clear existing content
        } else {
            // Create container
            container = document.createElement('div');
            container.id = this.config.containerId;
            container.className = 'skill-tree-container';
            document.body.appendChild(container);
        }
        
        // Create complete panel structure with all required containers
        container.innerHTML = `
            <div class="skill-tree-panel">
                <div class="skill-tree-header">
                    <h2>${this.config.headerText}</h2>
                    <button class="skill-tree-close-button">&times;</button>
                </div>
                <div class="skill-tree-content">
                    <div id="${this.config.visualizationId}" class="skill-tree-visualization"></div>
                    <div id="${this.config.uiId}" class="skill-tree-ui">
                        <div id="${this.config.controlsId}" class="skill-tree-controls"></div>
                        <div id="${this.config.infoId}" class="skill-tree-info"></div>
                    </div>
                </div>
            </div>
        `;
        
        console.log("Skill tree modal structure created with all containers");
    },
    
    /**
     * Verify and fix container structure if needed
     * @param {HTMLElement} container - The container element
     */
    verifyContainerStructure: function(container) {
        // Check for visualization container
        if (!document.getElementById(this.config.visualizationId)) {
            console.warn("Missing visualization container, fixing...");
            const content = container.querySelector('.skill-tree-content');
            
            if (content) {
                const vizDiv = document.createElement('div');
                vizDiv.id = this.config.visualizationId;
                vizDiv.className = 'skill-tree-visualization';
                content.appendChild(vizDiv);
            } else {
                console.error("Cannot find .skill-tree-content to add visualization container");
            }
        }
        
        // Check for UI container
        if (!document.getElementById(this.config.uiId)) {
            console.warn("Missing UI container, fixing...");
            const content = container.querySelector('.skill-tree-content');
            
            if (content) {
                const uiDiv = document.createElement('div');
                uiDiv.id = this.config.uiId;
                uiDiv.className = 'skill-tree-ui';
                
                // Add controls and info sections
                uiDiv.innerHTML = `
                    <div id="${this.config.controlsId}" class="skill-tree-controls"></div>
                    <div id="${this.config.infoId}" class="skill-tree-info"></div>
                `;
                
                content.appendChild(uiDiv);
            } else {
                console.error("Cannot find .skill-tree-content to add UI container");
            }
        }
        
        // Check for controls container
        if (!document.getElementById(this.config.controlsId)) {
            console.warn("Missing controls container, fixing...");
            const uiDiv = document.getElementById(this.config.uiId);
            
            if (uiDiv) {
                const controlsDiv = document.createElement('div');
                controlsDiv.id = this.config.controlsId;
                controlsDiv.className = 'skill-tree-controls';
                uiDiv.appendChild(controlsDiv);
            } else {
                console.error("Cannot find UI container to add controls");
            }
        }
        
        // Check for info container
        if (!document.getElementById(this.config.infoId)) {
            console.warn("Missing info container, fixing...");
            const uiDiv = document.getElementById(this.config.uiId);
            
            if (uiDiv) {
                const infoDiv = document.createElement('div');
                infoDiv.id = this.config.infoId;
                infoDiv.className = 'skill-tree-info';
                uiDiv.appendChild(infoDiv);
            } else {
                console.error("Cannot find UI container to add info section");
            }
        }
    },
    
    /**
     * Set up event handlers for the modal
     */
    setupEventHandlers: function() {
        // Get close button
        const closeButton = document.querySelector(`#${this.config.containerId} .skill-tree-close-button`);
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideSkillTree();
            });
        } else {
            console.warn("Close button not found in skill tree modal");
        }
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideSkillTree();
            }
        });
        
        // Close when clicking outside the panel
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.addEventListener('click', (e) => {
                // Check if click is directly on the container (not its children)
                if (e.target === container) {
                    this.hideSkillTree();
                }
            });
        }
    },
    
    /**
     * Add skill tree access buttons to the UI
     */
    addAccessButtons: function() {
        // Try to add to game UI
        const gameUI = document.querySelector('.game-ui') || document.querySelector('.hud-container');
        if (gameUI) {
            this.createAccessButton(gameUI, this.config.buttonText);
        }
        
        // Try to add to character selection
        const characterSelection = document.querySelector('.character-selection');
        if (characterSelection) {
            this.createAccessButton(characterSelection, 'View ' + this.config.buttonText);
        }
    },
    
    /**
     * Create and append an access button
     * @param {HTMLElement} parent - Parent element to append to
     * @param {string} text - Button text
     * @returns {HTMLElement} The created button
     */
    createAccessButton: function(parent, text) {
        // Check if button already exists
        const existingButton = parent.querySelector('.skill-tree-access-button');
        if (existingButton) {
            return existingButton;
        }
        
        // Create button
        const button = document.createElement('button');
        button.className = 'skill-tree-access-button';
        button.textContent = text;
        
        // Add click handler
        button.addEventListener('click', () => {
            this.showSkillTree();
        });
        
        // Append to parent
        parent.appendChild(button);
        
        return button;
    },
    
    /**
     * Show the skill tree modal
     */
    showSkillTree: function() {
        console.log("Showing skill tree");
        
        // Ensure initialized
        if (!this.isInitialized) {
            this.initialize();
        }
        
        // Get container
        const container = document.getElementById(this.config.containerId);
        if (!container) {
            console.error("Cannot show skill tree: container not found");
            return;
        }
        
        // Show the container
        container.classList.add('visible');
        this.isVisible = true;
        
        // Initialize skill tree components if needed
        this.initializeSkillTree();
    },
    
    /**
     * Hide the skill tree modal
     */
    hideSkillTree: function() {
        console.log("Hiding skill tree");
        
        // Get container
        const container = document.getElementById(this.config.containerId);
        if (!container) {
            return;
        }
        
        // Hide the container
        container.classList.remove('visible');
        this.isVisible = false;
    },
    /**
     * Ensure skill tree UI is ready
     * @returns {boolean} Whether UI is ready
     */
    ensureSkillTreeUI: function() {
        // If UI is not initialized but the controller thinks it is
        if (!SkillTreeUI.initialized && SkillTreeController.initialized) {
        console.log("Attempting to repair SkillTreeUI initialization...");
        
        // Try to initialize UI again
        if (SkillTreeUI.initialize({
            containerId: this.config.uiId,
            controlsContainerId: this.config.controlsId,
            infoContainerId: this.config.infoId
        })) {
            console.log("Successfully re-initialized SkillTreeUI");
            return true;
        } else {
            console.warn("Failed to repair SkillTreeUI initialization");
            return false;
        }
        }
        
        return SkillTreeUI.initialized;
    },

    /**
     * Show debug information about the skill tree components
     */
    showDebugInfo: function() {
        console.group("Skill Tree Components Debug Info");
        
        // Access
        console.log("SkillTreeAccess:", {
        initialized: this.isInitialized,
        visible: this.isVisible,
        containers: {
            main: !!document.getElementById(this.config.containerId),
            visualization: !!document.getElementById(this.config.visualizationId),
            ui: !!document.getElementById(this.config.uiId),
            controls: !!document.getElementById(this.config.controlsId),
            info: !!document.getElementById(this.config.infoId)
        }
        });
        
        // Controller
        if (typeof SkillTreeController !== 'undefined') {
        console.log("SkillTreeController:", {
            initialized: SkillTreeController.initialized
        });
        }
        
        // Manager
        if (typeof SkillTreeManager !== 'undefined') {
        console.log("SkillTreeManager:", {
            initialized: SkillTreeManager.initialized,
            skillCount: Object.keys(SkillTreeManager.skills || {}).length,
            specializationCount: Object.keys(SkillTreeManager.specializations || {}).length
        });
        }
        
        // Renderer
        if (typeof SkillTreeRenderer !== 'undefined') {
        console.log("SkillTreeRenderer:", {
            initialized: SkillTreeRenderer.initialized,
            svgCreated: !!SkillTreeRenderer.svg
        });
        }
        
        // UI
        if (typeof SkillTreeUI !== 'undefined') {
        console.log("SkillTreeUI:", {
            initialized: SkillTreeUI.initialized,
            elements: {
            controls: !!SkillTreeUI.elements?.controls,
            info: !!SkillTreeUI.elements?.info,
            filterMenu: !!SkillTreeUI.elements?.filterMenu
            }
        });
        }
        
        console.groupEnd();
    },
    // Add this to skill_tree_access.js
    debugSkillTree: function() {
        console.group("Skill Tree Debug Information");
        
        // Check containers
        console.log("DOM Structure:");
        console.log(`- Main container: ${document.getElementById(this.config.containerId) ? 'Found' : 'Missing'}`);
        console.log(`- Visualization: ${document.getElementById(this.config.visualizationId) ? 'Found' : 'Missing'}`);
        console.log(`- UI container: ${document.getElementById(this.config.uiId) ? 'Found' : 'Missing'}`);
        console.log(`- Controls: ${document.getElementById(this.config.controlsId) ? 'Found' : 'Missing'}`);
        console.log(`- Info panel: ${document.getElementById(this.config.infoId) ? 'Found' : 'Missing'}`);
        
        // Check components
        console.log("Components:");
        console.log(`- SkillTreeAccess: ${this.isInitialized ? 'Initialized' : 'Not initialized'}`);
        console.log(`- SkillTreeController: ${window.SkillTreeController?.initialized ? 'Initialized' : 'Not initialized'}`);
        console.log(`- SkillTreeManager: ${window.SkillTreeManager?.initialized ? 'Initialized' : 'Not initialized'}`);
        console.log(`- SkillTreeRenderer: ${window.SkillTreeRenderer?.initialized ? 'Initialized' : 'Not initialized'}`);
        console.log(`- SkillTreeUI: ${window.SkillTreeUI?.initialized ? 'Initialized' : 'Not initialized'}`);
        console.log(`- SkillEffectSystem: ${window.SkillEffectSystem?.initialized ? 'Initialized' : 'Not initialized'}`);
        
        console.groupEnd();
        
        // Return a message for the console
        return "Debug information logged to console. Check the console for details.";
    },

    initializeSkillTree: function() {
        // Only proceed if we have a valid container structure
        if (!document.getElementById(this.config.visualizationId) || 
            !document.getElementById(this.config.uiId)) {
          console.error("Cannot initialize skill tree: containers not ready");
          return;
        }
        
        // Initialize controller if available and not already initialized
        if (typeof SkillTreeController !== 'undefined') {
          if (!SkillTreeController.initialized) {
            console.log("Initializing skill tree controller...");
            SkillTreeController.initialize({
              renderContainerId: this.config.visualizationId,
              uiContainerId: this.config.uiId,
              controlsContainerId: this.config.controlsId,
              infoContainerId: this.config.infoId
            });
          } else {
            // Ensure UI is properly initialized before refreshing data
            this.ensureSkillTreeUI();
            
            // Refresh data if already initialized
            console.log("Refreshing skill tree data...");
            SkillTreeController.loadSkillTree();
          }
        } else {
          console.warn("SkillTreeController not available");
        }
      }
};

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure all scripts are loaded
    setTimeout(() => {
        SkillTreeAccess.initialize();
    }, 100);
});

// Export globally
window.SkillTreeAccess = SkillTreeAccess;

// Legacy support for older code
window.toggleSkillTree = function() {
    if (SkillTreeAccess.isVisible) {
        SkillTreeAccess.hideSkillTree();
    } else {
        SkillTreeAccess.showSkillTree();
    }
};