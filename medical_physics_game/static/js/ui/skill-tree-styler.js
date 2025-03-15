// skill-tree-styler.js - Enhances the skill tree with custom styling and effects

/**
 * Handles enhancement of the skill tree with retro styling and effects
 */
const SkillTreeStyler = {
    // Configuration
    config: {
      containerId: 'skill-tree-container',
      stylesheetPath: '/static/css/custom-skill-tree.css'
    },
    
    // State
    initialized: false,
    
    /**
     * Initialize the styler
     */
    initialize: function() {
      console.log("Initializing skill tree styler...");
      
      if (this.initialized) {
        console.log("Skill tree styler already initialized");
        return this;
      }
      
      // Load custom styles
      this.loadStylesheet();
      
      // Add pixel corners to panel when it appears
      this.setupMutationObserver();
      
      // Add event listeners
      document.addEventListener('skillTreeInitialized', this.enhanceSkillTree.bind(this));
      
      // Mark as initialized
      this.initialized = true;
      console.log("Skill tree styler initialized");
      
      return this;
    },
    
    /**
     * Load the custom stylesheet
     */
    loadStylesheet: function() {
      // Check if stylesheet already exists
      const existingStylesheet = document.querySelector(`link[href="${this.config.stylesheetPath}"]`);
      if (existingStylesheet) {
        return;
      }
      
      // Create and append the stylesheet link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = this.config.stylesheetPath;
      
      // Add to document head
      document.head.appendChild(link);
      console.log("Custom skill tree stylesheet loaded");
    },
    
    /**
     * Set up a mutation observer to watch for skill tree appearing in DOM
     */
    setupMutationObserver: function() {
      // Create an observer to watch for the skill tree container becoming visible
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const container = mutation.target;
            if (container.classList.contains('visible')) {
              this.enhanceSkillTree();
            }
          }
        });
      });
      
      // Start observing
      const container = document.getElementById(this.config.containerId);
      if (container) {
        observer.observe(container, { attributes: true });
      } else {
        // If container doesn't exist yet, check again later
        setTimeout(() => {
          const container = document.getElementById(this.config.containerId);
          if (container) {
            observer.observe(container, { attributes: true });
          }
        }, 1000);
      }
    },
    
    /**
     * Enhance the skill tree with additional styling elements
     */
    enhanceSkillTree: function() {
      console.log("Enhancing skill tree with retro styling...");
      
      // Add pixel corners to the panel
      this.addPixelCorners();
      
      // Enhance nodes with custom glows based on specialization
      this.enhanceNodes();
      
      // Add additional ambient effects
      this.addAmbientEffects();
    },
    
    /**
     * Add pixel corners to the skill tree panel
     */
    addPixelCorners: function() {
      const panel = document.querySelector('.skill-tree-panel');
      if (!panel) return;
      
      // Check if corners already exist
      if (panel.querySelector('.pixel-corner-bl')) return;
      
      // Create bottom left corner
      const cornerBL = document.createElement('div');
      cornerBL.className = 'pixel-corner-bl';
      panel.appendChild(cornerBL);
      
      // Create bottom right corner
      const cornerBR = document.createElement('div');
      cornerBR.className = 'pixel-corner-br';
      panel.appendChild(cornerBR);
      
      console.log("Added pixel corners to skill tree panel");
    },
    
    /**
     * Enhance the nodes with custom glows and effects
     */
    enhanceNodes: function() {
      // Wait for the SVG to be fully loaded
      setTimeout(() => {
        // Get all node elements
        const nodes = document.querySelectorAll('.node');
        if (nodes.length === 0) return;
        
        nodes.forEach(node => {
          // Get node data
          const nodeId = node.dataset.nodeId;
          
          // Get specialization from SkillTreeManager if available
          if (window.SkillTreeManager && window.SkillTreeManager.getSkillById) {
            const skill = window.SkillTreeManager.getSkillById(nodeId);
            if (skill && skill.specialization) {
              // Add data attribute for specialization
              node.dataset.specialization = skill.specialization;
              
              // Add a subtle glow based on specialization
              switch (skill.specialization) {
                case 'theory':
                  node.style.filter = "drop-shadow(0 0 3px var(--st-theory-color))";
                  break;
                case 'clinical':
                  node.style.filter = "drop-shadow(0 0 3px var(--st-clinical-color))";
                  break;
                case 'technical':
                  node.style.filter = "drop-shadow(0 0 3px var(--st-technical-color))";
                  break;
                case 'research':
                  node.style.filter = "drop-shadow(0 0 3px var(--st-research-color))";
                  break;
                case 'connector':
                  node.style.filter = "drop-shadow(0 0 3px var(--st-connector-color))";
                  break;
              }
            }
          }
        });
        
        console.log("Enhanced nodes with custom styling");
      }, 1000); // Give the SVG time to render
    },
    
    /**
     * Add ambient effects to the skill tree
     */
    addAmbientEffects: function() {
      // Get the visualization container
      const visualization = document.getElementById('skill-tree-visualization');
      if (!visualization) return;
      
      // Add a subtle pulsing to active nodes
      const activeNodes = document.querySelectorAll('.node-active');
      activeNodes.forEach(node => {
        // Add a subtle animation
        node.style.animation = 'pulse-node 2s infinite alternate';
      });
      
      console.log("Added ambient effects to skill tree");
    }
  };
  
  // Initialize on DOM content loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize with a small delay to ensure other scripts are loaded
    setTimeout(() => {
      SkillTreeStyler.initialize();
    }, 500);
  });
  
  // Export globally
  window.SkillTreeStyler = SkillTreeStyler;