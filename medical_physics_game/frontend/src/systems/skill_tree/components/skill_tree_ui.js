/**
 * SkillTreeUI
 * Manages the UI components for the skill tree
 */
const SkillTreeUI = {
  // State tracking
  initialized: false,
  
  // UI elements
  elements: {
      container: null,
      controls: null,
      info: null
  },
  
  // Data
  skillTree: null,
  progression: null,
  
  /**
   * Initialize the UI component
   * @param {Object} config - Configuration options
   * @returns {Object} - This instance for chaining
   */
  initialize: function(config = {}) {
      if (this.initialized) {
          console.log("SkillTreeUI already initialized");
          return this;
      }
      
      console.log("Initializing SkillTreeUI...");
      
      // Store configuration
      this.config = Object.assign({
          containerId: 'skill-tree-ui',
          controlsContainerId: 'skill-tree-controls',
          infoContainerId: 'skill-tree-info'
      }, config);
      
      // Get UI elements
      this.elements.container = document.getElementById(this.config.containerId);
      this.elements.controls = document.getElementById(this.config.controlsContainerId);
      this.elements.info = document.getElementById(this.config.infoContainerId);
      
      // Check if elements exist
      if (!this.elements.container) {
          console.warn(`UI container not found: ${this.config.containerId}`);
      }
      
      if (!this.elements.controls) {
          console.warn(`Controls container not found: ${this.config.controlsContainerId}`);
      }
      
      if (!this.elements.info) {
          console.warn(`Info container not found: ${this.config.infoContainerId}`);
      }
      
      // Add event listeners
      this._setupEventListeners();
      
      // Render initial UI
      this._renderControls();
      this._renderInfoPanel();
      
      // Mark as initialized
      this.initialized = true;
      console.log("SkillTreeUI initialization complete");
      
      return this;
  },
  
  /**
   * Update the skill tree UI
   * @param {Object} skillTree - Skill tree data
   * @param {Object} progression - Player progression data
   * @returns {Boolean} - Success status
   */
  updateSkillTree: function(skillTree, progression) {
      if (!this.initialized) {
          console.error("Cannot update skill tree UI: not initialized");
          return false;
      }
      
      console.log("Updating skill tree UI...");
      
      try {
          // Store data
          this.skillTree = skillTree;
          this.progression = progression;
          
          // Update UI elements
          this._renderControls();
          
          // Update stats display
          this.updateStats(
              progression.reputation, 
              progression.skill_points_available,
              progression.specialization_progress
          );
          
          console.log("Skill tree UI updated");
          return true;
      } catch (error) {
          console.error("Error updating skill tree UI:", error);
          return false;
      }
  },
  
  /**
   * Update stats display
   * @param {Number} reputation - Current reputation
   * @param {Number} skillPoints - Available skill points
   * @param {Object} specializationProgress - Progress in each specialization
   */
  updateStats: function(reputation, skillPoints, specializationProgress) {
      const repValue = document.getElementById('reputation-value');
      if (repValue) {
          repValue.textContent = reputation || 0;
      }
      
      const pointsValue = document.getElementById('skill-points-value');
      if (pointsValue) {
          pointsValue.textContent = skillPoints || 0;
      }
      
      // Update specialization progress bars if they exist
      if (specializationProgress) {
          Object.entries(specializationProgress).forEach(([specId, progress]) => {
              const progressBar = document.getElementById(`${specId}-progress`);
              if (progressBar) {
                  progressBar.style.width = `${progress}%`;
              }
          });
      }
  },
  
  /**
   * Show node details in the info panel
   * @param {Object} node - Node data
   */
  showNodeDetails: function(node) {
      if (!this.initialized || !this.elements.info || !node) {
          return;
      }
      
      console.log(`Showing details for node: ${node.id}`);
      
      // Create content
      let content = `
          <div class="skill-info-header">
              <h3 class="skill-name">${node.name}</h3>
              <div class="skill-specialization">${this._getSpecializationName(node.specialization)}</div>
          </div>
          
          <div class="skill-description">${node.description}</div>
          
          <div class="skill-cost">
              <div class="cost-label">Cost:</div>
              <div class="cost-value">${node.cost} Skill Points</div>
          </div>
      `;
      
      // Add effects if available
      if (node.effects && node.effects.length > 0) {
          content += '<div class="skill-effects"><h4>Effects:</h4><ul>';
          
          node.effects.forEach(effect => {
              content += `<li>${this._formatEffectText(effect)}</li>`;
          });
          
          content += '</ul></div>';
      }
      
      // Add prerequisites
      if (node.prerequisites && node.prerequisites.length > 0) {
          content += '<div class="skill-prerequisites"><h4>Prerequisites:</h4><ul>';
          
          node.prerequisites.forEach(prereqId => {
              const prereqNode = this.skillTree.nodes.find(n => n.id === prereqId);
              const name = prereqNode ? prereqNode.name : prereqId;
              content += `<li>${name}</li>`;
          });
          
          content += '</ul></div>';
      }
      
      // Add action button for available nodes
      if (node.status === 'available') {
          content += `
              <button class="action-button unlock-button" id="unlock-node-btn" data-node-id="${node.id}">
                  Unlock Skill (${node.cost} Points)
              </button>
          `;
      } else if (node.status === 'unlocked') {
          content += `
              <div class="skill-unlocked-label">UNLOCKED</div>
          `;
      } else {
          content += `
              <div class="skill-locked-label">LOCKED</div>
          `;
      }
      
      // Update info panel
      this.elements.info.innerHTML = content;
      
      // Add event listener for unlock button
      const unlockBtn = document.getElementById('unlock-node-btn');
      if (unlockBtn) {
          unlockBtn.addEventListener('click', () => {
              this._handleUnlockNode(node.id);
          });
      }
  },
  
  /**
   * Format effect text
   * @param {Object} effect - Effect data
   * @returns {String} - Formatted text
   * @private
   */
  _formatEffectText: function(effect) {
      if (!effect) return '';
      
      let text = '';
      
      switch (effect.type) {
          case 'insight_gain_flat':
              text = `+${effect.value} Insight gain`;
              break;
          case 'insight_gain_multiplier':
              text = `+${(effect.value * 100).toFixed(0)}% Insight gain`;
              break;
          case 'auto_solve_chance':
              text = `${(effect.value * 100).toFixed(0)}% chance to auto-solve questions`;
              break;
          case 'patient_outcome_multiplier':
              text = `+${(effect.value * 100).toFixed(0)}% to patient outcomes`;
              break;
          case 'reveal_parameter':
              text = `Reveals parameters in problems`;
              break;
          default:
              text = `${effect.type}: ${effect.value}`;
      }
      
      // Add condition if present
      if (effect.condition) {
          text += ` (when ${effect.condition})`;
      }
      
      return text;
  },
  
  /**
   * Get specialization name from ID
   * @param {String} specializationId - Specialization ID
   * @returns {String} - Specialization name
   * @private
   */
  _getSpecializationName: function(specializationId) {
      if (!specializationId) return 'Core';
      
      if (this.skillTree && this.skillTree.specializations) {
          const spec = this.skillTree.specializations.find(s => s.id === specializationId);
          if (spec) {
              return spec.name;
          }
      }
      
      // Default names
      const names = {
          'theory': 'Theory Specialist',
          'clinical': 'Clinical Expert',
          'technical': 'Technical Savant',
          'research': 'Research Focus',
          'core': 'Core'
      };
      
      return names[specializationId] || specializationId;
  },
  
  /**
   * Handle node unlock action
   * @param {String} nodeId - ID of the node to unlock
   * @private
   */
  _handleUnlockNode: function(nodeId) {
      console.log(`Attempting to unlock node: ${nodeId}`);
      
      // Use controller if available
      if (window.SkillTreeController && window.SkillTreeController.initialized) {
          const success = window.SkillTreeController.unlockNode(nodeId);
          
          if (success) {
              console.log(`Node unlocked: ${nodeId}`);
              
              // Show updated node details
              const node = window.SkillTreeController.getNodeDetails(nodeId);
              if (node) {
                  this.showNodeDetails(node);
              }
          } else {
              console.error(`Failed to unlock node: ${nodeId}`);
          }
      } else {
          console.error("SkillTreeController not available");
      }
  },
  
  /**
   * Render specialization filters and controls
   * @private
   */
  _renderControls: function() {
      if (!this.elements.controls || !this.skillTree || !this.skillTree.specializations) {
          return;
      }
      
      const specializations = this.skillTree.specializations;
      
      // Clear existing content
      this.elements.controls.innerHTML = '';
      
      // Create filter buttons
      const filterContainer = document.createElement('div');
      filterContainer.className = 'specialization-filter';
      
      // All button
      const allButton = document.createElement('button');
      allButton.className = 'filter-button filter-all active';
      allButton.textContent = 'All';
      allButton.dataset.filter = 'all';
      
      filterContainer.appendChild(allButton);
      
      // Specialization buttons
      specializations.forEach(spec => {
          const button = document.createElement('button');
          button.className = 'filter-button';
          button.textContent = spec.name;
          button.dataset.filter = spec.id;
          button.style.borderColor = spec.color;
          
          filterContainer.appendChild(button);
      });
      
      // Add to controls
      this.elements.controls.appendChild(filterContainer);
      
      // Add event listeners
      const filterButtons = this.elements.controls.querySelectorAll('.filter-button');
      filterButtons.forEach(button => {
          button.addEventListener('click', () => {
              // Toggle active class
              filterButtons.forEach(btn => btn.classList.remove('active'));
              button.classList.add('active');
              
              // Emit filter event
              const event = new CustomEvent('skill-filter-changed', {
                  detail: { filter: button.dataset.filter }
              });
              document.dispatchEvent(event);
          });
      });
  },
  
  /**
   * Render empty info panel
   * @private
   */
  _renderInfoPanel: function() {
      if (!this.elements.info) return;
      
      this.elements.info.innerHTML = `
          <div class="skill-info-empty">
              <p>Select a skill to view details</p>
          </div>
      `;
  },
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners: function() {
      // Listen for node clicks
      document.addEventListener('skill-node-clicked', event => {
          const nodeId = event.detail.nodeId;
          
          // Get node details
          if (window.SkillTreeController && window.SkillTreeController.initialized) {
              const node = window.SkillTreeController.getNodeDetails(nodeId);
              if (node) {
                  this.showNodeDetails(node);
              }
          }
      });
  }
};

// Make globally available
window.SkillTreeUI = SkillTreeUI;