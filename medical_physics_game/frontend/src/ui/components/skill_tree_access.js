// skill_tree_access.js - Manages skill tree modal and component access

/**
 * SkillTreeAccess - Manages the skill tree modal and coordinates initialization
 * of the skill tree components.
 */
const SkillTreeAccess = {
    // Configuration with sensible defaults
    config: {
        containerId: 'skill-tree-container',
        modalClass: 'skill-tree-panel',
        headerText: 'Specialization Tree',
        buttonText: 'Specializations',
        initializationTimeout: 100
    },
    
    // Component references
    components: {
        controller: null,
        ui: null,
        renderer: null
    },
    
    // State tracking
    state: {
        isInitialized: false,
        isVisible: false,
        isInitializing: false,
        initAttempts: 0,
        maxInitAttempts: 3
    },
    
    /**
     * Initialize the skill tree access
     * @param {Object} options - Optional configuration overrides
     * @returns {Object} The SkillTreeAccess object for chaining
     */
    initialize: function(options = {}) {
        // Prevent multiple initializations
        if (this.state.isInitialized || this.state.isInitializing) {
            console.log("Skill tree access already initialized or initializing");
            return this;
        }
        
        console.log("Initializing skill tree access...");
        this.state.isInitializing = true;
        
        // Apply configuration options
        Object.assign(this.config, options);
        
        // Create modal structure if needed
        this._ensureModalExists();
        
        // Set up event listeners
        this._setupEventListeners();
        
        // Add access buttons
        this._addAccessButtons();
        
        // Setup initialization complete
        this.state.isInitialized = true;
        this.state.isInitializing = false;
        console.log("Skill tree access initialized successfully");
        
        return this;
    },
    
    /**
     * Ensures the modal container exists in the DOM
     * @private
     */
    _ensureModalExists: function() {
        // Get or create container
        let container = document.getElementById(this.config.containerId);
        
        if (!container) {
            console.log("Creating skill tree container");
            container = document.createElement('div');
            container.id = this.config.containerId;
            container.className = 'skill-tree-container';
            document.body.appendChild(container);
        }
        
        // Check if modal panel exists
        if (!container.querySelector('.' + this.config.modalClass)) {
            console.log("Creating skill tree modal structure");
            this._createModalStructure(container);
        }
    },
    
    /**
     * Creates the modal structure inside the container
     * @private
     * @param {HTMLElement} container - The container element
     */
    _createModalStructure: function(container) {
        // Create complete panel structure with all required containers
        container.innerHTML = `
            <div class="${this.config.modalClass}">
                <div class="skill-tree-header">
                    <h2>${this.config.headerText}</h2>
                    <button class="skill-tree-close-button">&times;</button>
                </div>
                <div class="skill-tree-content">
                    <div id="skill-tree-visualization" class="skill-tree-visualization"></div>
                    <div id="skill-tree-ui" class="skill-tree-ui">
                        <div id="skill-tree-controls" class="skill-tree-controls"></div>
                        <div id="skill-tree-info" class="skill-tree-info"></div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Set up event listeners for the modal
     * @private
     */
    _setupEventListeners: function() {
        // Close button click
        const container = document.getElementById(this.config.containerId);
        if (container) {
            const closeButton = container.querySelector('.skill-tree-close-button');
            if (closeButton) {
                closeButton.addEventListener('click', this.hideSkillTree.bind(this));
            }
            
            // Close when clicking outside the panel
            container.addEventListener('click', (e) => {
                if (e.target === container) {
                    this.hideSkillTree();
                }
            });
        }
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isVisible) {
                this.hideSkillTree();
            }
        });
    },
    
    /**
     * Add skill tree access buttons to the UI
     * @private
     */
    _addAccessButtons: function() {
        const uiContainers = [
            document.querySelector('.game-ui'),
            document.querySelector('.hud-container'),
            document.querySelector('.character-selection')
        ];
        
        uiContainers.forEach(container => {
            if (container) {
                this._createAccessButton(container, 
                    container.classList.contains('character-selection') 
                        ? 'View ' + this.config.buttonText 
                        : this.config.buttonText
                );
            }
        });
    },
    
    /**
     * Create and append an access button
     * @private
     * @param {HTMLElement} parent - Parent element to append to
     * @param {string} text - Button text
     * @returns {HTMLElement} The created button
     */
    _createAccessButton: function(parent, text) {
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
        if (!this.state.isInitialized) {
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
        this.state.isVisible = true;
        
        // Initialize skill tree components if needed
        this._initializeSkillTree();
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
        this.state.isVisible = false;
    },
    
    /**
     * Initialize skill tree components
     * @private
     */
    _initializeSkillTree: function() {
        // Reset attempt counter if this is a fresh initialization
        if (!this.components.controller && !this.components.ui && !this.components.renderer) {
            this.state.initAttempts = 0;
        }
        
        // Check if we've exceeded maximum attempts
        if (this.state.initAttempts >= this.state.maxInitAttempts) {
            console.error("Failed to initialize skill tree after maximum attempts");
            this._showError("Failed to load skill tree. Please try again later.");
            return;
        }
        
        this.state.initAttempts++;
        console.log(`Initializing skill tree components (attempt ${this.state.initAttempts}/${this.state.maxInitAttempts})`);
        
        // Check for required global objects
        if (!window.SkillTreeController || !window.SkillTreeUI || !window.SkillTreeRenderer) {
            console.warn("Required skill tree components not loaded yet, retrying...");
            setTimeout(() => this._initializeSkillTree(), 300);
            return;
        }
        
        // Initialize controller if not already initialized
        if (!this.components.controller) {
            try {
                console.log("Initializing skill tree controller");
                this.components.controller = window.SkillTreeController;
                if (!this.components.controller.initialized) {
                    this.components.controller.initialize({
                        renderContainerId: 'skill-tree-visualization',
                        uiContainerId: 'skill-tree-ui',
                        controlsContainerId: 'skill-tree-controls',
                        infoContainerId: 'skill-tree-info'
                    });
                }
            } catch (error) {
                console.error("Error initializing skill tree controller:", error);
                setTimeout(() => this._initializeSkillTree(), 300);
                return;
            }
        }
        
        // Ensure UI is properly initialized
        if (!this.components.ui) {
            try {
                console.log("Initializing skill tree UI");
                this.components.ui = window.SkillTreeUI;
                if (!this.components.ui.initialized) {
                    this.components.ui.initialize({
                        containerId: 'skill-tree-ui',
                        controlsContainerId: 'skill-tree-controls',
                        infoContainerId: 'skill-tree-info'
                    });
                }
            } catch (error) {
                console.error("Error initializing skill tree UI:", error);
                setTimeout(() => this._initializeSkillTree(), 300);
                return;
            }
        }
        
        // Initialize renderer if needed
        if (!this.components.renderer) {
            try {
                console.log("Initializing skill tree renderer");
                this.components.renderer = window.SkillTreeRenderer;
                if (!this.components.renderer.initialized) {
                    this.components.renderer.initialize('skill-tree-visualization');
                }
            } catch (error) {
                console.error("Error initializing skill tree renderer:", error);
                setTimeout(() => this._initializeSkillTree(), 300);
                return;
            }
        }
        
        // Load skill tree data
        try {
            if (this.components.controller && this.components.controller.initialized) {
                console.log("Loading skill tree data");
                this.components.controller.loadSkillTree();
            }
        } catch (error) {
            console.error("Error loading skill tree data:", error);
            this._showError("Error loading skill tree data");
        }
    },
    
    /**
     * Show an error message to the user
     * @private
     * @param {string} message - Error message to display
     */
    _showError: function(message) {
        const infoPanel = document.getElementById('skill-tree-info');
        if (infoPanel) {
            infoPanel.innerHTML = `
                <div class="skill-tree-error">
                    <p>${message}</p>
                    <button class="skill-tree-retry-button">Retry</button>
                </div>
            `;
            
            const retryButton = infoPanel.querySelector('.skill-tree-retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    // Reset attempt counter and retry
                    this.state.initAttempts = 0;
                    this._initializeSkillTree();
                });
            }
        }
    },
    
    /**
     * Debug function to show skill tree component status
     * @returns {string} Debug message
     */
    debugSkillTree: function() {
        console.group("Skill Tree Debug Information");
        
        // Check containers
        const containerIds = [
            'skill-tree-container',
            'skill-tree-visualization', 
            'skill-tree-ui',
            'skill-tree-controls',
            'skill-tree-info'
        ];
        
        console.log("DOM Structure:");
        containerIds.forEach(id => {
            console.log(`- ${id}: ${document.getElementById(id) ? 'Found' : 'Missing'}`);
        });
        
        // Check components
        console.log("Components:");
        console.log(`- SkillTreeAccess: ${this.state.isInitialized ? 'Initialized' : 'Not initialized'}`);
        
        const components = [
            'SkillTreeController',
            'SkillTreeManager',
            'SkillTreeRenderer',
            'SkillTreeUI',
            'SkillEffectSystem'
        ];
        
        components.forEach(name => {
            const component = window[name];
            console.log(`- ${name}: ${component?.initialized ? 'Initialized' : 'Not initialized'}`);
        });
        
        console.groupEnd();
        
        return "Debug information logged to console. Check the console for details.";
    }
};

// Global access function for backward compatibility
window.toggleSkillTree = function() {
    if (SkillTreeAccess.state.isVisible) {
        SkillTreeAccess.hideSkillTree();
    } else {
        SkillTreeAccess.showSkillTree();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure all scripts are loaded
    setTimeout(() => {
        SkillTreeAccess.initialize();
    }, SkillTreeAccess.config.initializationTimeout);
});

// Export globally
window.SkillTreeAccess = SkillTreeAccess;

// Debug function for backward compatibility
window.debugSkillTree = function() {
    return SkillTreeAccess.debugSkillTree();
};