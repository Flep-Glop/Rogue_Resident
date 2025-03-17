// frontend/static/js/skill_tree_page.js

/**
 * Skill Tree Page
 * Integrates all skill tree components and connects to the API
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the skill tree
    initializeSkillTree();
    
    // Generate star background
    generateStarBackground();
  });
  
  /**
   * Initialize the skill tree system
   */
  function initializeSkillTree() {
    console.log("Initializing skill tree page...");
    
    // First initialize the components in the correct order
    initializeComponents()
      .then(() => {
        // Load skill tree data from the API
        return loadSkillTreeData();
      })
      .then((data) => {
        console.log("Skill tree data loaded");
      })
      .catch(error => {
        console.error("Error initializing skill tree:", error);
        showError("Failed to initialize skill tree. Please try again later.");
      });
  }
  
  /**
   * Initialize all required components
   * @returns {Promise} Promise that resolves when all components are initialized
   */
  function initializeComponents() {
    return new Promise((resolve, reject) => {
      try {
        // Check for required components
        if (!window.SkillEffectSystem || !window.SkillTreeUI || 
            !window.SkillTreeRenderer || !window.SkillTreeController) {
          reject(new Error("Required skill tree components not found"));
          return;
        }
        
        // Step 1: Initialize Effect System
        if (!window.SkillEffectSystem.initialized) {
          window.SkillEffectSystem.initialize();
        }
        
        // Step 2: Initialize Renderer
        if (!window.SkillTreeRenderer.initialized) {
          window.SkillTreeRenderer.initialize('skill-tree-visualization');
        }
        
        // Step 3: Initialize UI
        if (!window.SkillTreeUI.initialized) {
          window.SkillTreeUI.initialize({
            containerId: 'skill-tree-ui',
            controlsContainerId: 'skill-tree-controls',
            infoContainerId: 'skill-tree-info'
          });
        }
        
        // Step 4: Initialize Controller
        if (!window.SkillTreeController.initialized) {
          window.SkillTreeController.initialize();
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Load skill tree data from the API
   * @returns {Promise} Promise that resolves with skill tree data
   */
  function loadSkillTreeData() {
    return new Promise((resolve, reject) => {
      // Show loading indicator
      showLoading(true);
      
      // Fetch skill tree data
      fetch('/api/skill-tree')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load skill tree data: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          // Load player progress
          return fetch('/api/skill-progress')
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to load skill progress: ${response.status} ${response.statusText}`);
              }
              return response.json();
            })
            .then(progress => {
              // Update UI with character stats
              updateStatsDisplay(progress.reputation, progress.skill_points_available, progress.specialization_progress);
              
              // Load skill tree with progress data
              window.SkillTreeController.loadSkillTree(data, progress);
              
              // Hide loading indicator
              showLoading(false);
              
              resolve(data);
            });
        })
        .catch(error => {
          console.error("Error loading skill tree data:", error);
          showLoading(false);
          showError("Failed to load skill tree data. Please try again later.");
          reject(error);
        });
    });
  }
  
  /**
   * Update stats display
   * @param {Number} reputation - Current reputation
   * @param {Number} skillPoints - Available skill points
   * @param {Object} specializationProgress - Progress in each specialization
   */
  function updateStatsDisplay(reputation, skillPoints, specializationProgress) {
    const repValue = document.getElementById('reputation-value');
    if (repValue) {
      repValue.textContent = reputation;
    }
    
    const pointsValue = document.getElementById('skill-points-value');
    if (pointsValue) {
      pointsValue.textContent = skillPoints;
    }
    
    // Update UI component stats
    if (window.SkillTreeUI && window.SkillTreeUI.initialized) {
      window.SkillTreeUI.updateStats(reputation, skillPoints, specializationProgress);
    }
  }
  
  /**
   * Generate star background for visual effect
   */
  function generateStarBackground() {
    const starBg = document.getElementById('star-bg');
    if (!starBg) return;
    
    // Clear existing stars
    starBg.innerHTML = '';
    
    // Create stars
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.width = `${1 + Math.random() * 2}px`;
      star.style.height = star.style.width;
      star.style.animationDelay = `${Math.random() * 4}s`;
      
      starBg.appendChild(star);
    }
  }
  
  /**
   * Show or hide loading indicator
   * @param {Boolean} show - Whether to show or hide
   */
  function showLoading(show) {
    // Look for existing loading overlay
    let loadingOverlay = document.querySelector('.loading-overlay');
    
    if (show) {
      // Create if it doesn't exist
      if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        loadingOverlay.appendChild(spinner);
        
        // Add to visualization container
        const container = document.querySelector('.skill-tree-visualization-container');
        if (container) {
          container.appendChild(loadingOverlay);
        } else {
          document.body.appendChild(loadingOverlay);
        }
      }
      
      // Show it
      loadingOverlay.style.display = 'flex';
    } else if (loadingOverlay) {
      // Hide it
      loadingOverlay.style.display = 'none';
    }
  }
  
  /**
   * Show error message
   * @param {String} message - Error message to display
   */
  function showError(message) {
    const infoPanel = document.getElementById('skill-tree-info');
    if (!infoPanel) return;
    
    infoPanel.innerHTML = `
      <div class="skill-info-error">
        <p>${message}</p>
        <button class="action-button" onclick="initializeSkillTree()">Retry</button>
      </div>
    `;
  }