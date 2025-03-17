/**
 * SkillTreeController
 * Manages the skill tree system and coordinates between UI, renderer, and data
 */
const SkillTreeController = {
  // State tracking
  initialized: false,
  skillTree: null,
  progression: null,
  
  /**
   * Initialize the skill tree controller
   * @param {Object} config - Optional configuration settings
   * @returns {Object} - This instance for chaining
   */
  initialize: function(config = {}) {
      if (this.initialized) {
          console.log("SkillTreeController already initialized");
          return this;
      }
      
      console.log("Initializing SkillTreeController...");
      
      // Store configuration
      this.config = Object.assign({
          renderContainerId: 'skill-tree-visualization',
          uiContainerId: 'skill-tree-ui',
          controlsContainerId: 'skill-tree-controls',
          infoContainerId: 'skill-tree-info'
      }, config);
      
      // Initialize component references
      this.ui = window.SkillTreeUI;
      this.renderer = window.SkillTreeRenderer;
      this.effectSystem = window.SkillEffectSystem;
      
      // Mark as initialized
      this.initialized = true;
      console.log("SkillTreeController initialization complete");
      
      return this;
  },
  
  /**
   * Load the skill tree data
   * @param {Object} skillTreeData - Skill tree data
   * @param {Object} progressData - Player progression data
   * @returns {Boolean} - Success status
   */
  loadSkillTree: function(skillTreeData, progressData) {
      console.log("Loading skill tree data...");
      
      if (!this.initialized) {
          console.error("Cannot load skill tree: controller not initialized");
          return false;
      }
      
      try {
          // Store data
          this.skillTree = skillTreeData;
          this.progression = progressData;
          
          // Process data
          this._processSkillTreeData();
          
          // Initialize components with data
          if (this.ui && this.ui.initialized) {
              this.ui.updateSkillTree(this.skillTree, this.progression);
          }
          
          if (this.renderer && this.renderer.initialized) {
              this.renderer.renderSkillTree(this.skillTree, this.progression);
          }
          
          console.log("Skill tree data loaded successfully");
          return true;
      } catch (error) {
          console.error("Error loading skill tree data:", error);
          return false;
      }
  },
  
  /**
   * Process and prepare skill tree data
   * @private
   */
  _processSkillTreeData: function() {
      if (!this.skillTree || !this.progression) return;
      
      // Extract key details
      const nodes = this.skillTree.nodes || [];
      const unlockedNodes = this.progression.unlocked_skills || [];
      
      // Calculate available nodes
      const availableNodes = [];
      
      // Check each node
      nodes.forEach(node => {
          if (!unlockedNodes.includes(node.id)) {
              // Check prerequisites
              const prerequisites = node.prerequisites || [];
              const allPrereqsMet = prerequisites.every(prereq => 
                  unlockedNodes.includes(prereq)
              );
              
              if (allPrereqsMet) {
                  availableNodes.push(node.id);
              }
          }
      });
      
      // Store processed data
      this.skillTree.available_nodes = availableNodes;
  },
  
  /**
   * Unlock a skill node
   * @param {String} nodeId - ID of the node to unlock
   * @returns {Boolean} - Success status
   */
  unlockNode: function(nodeId) {
      if (!this.progression || !this.skillTree) {
          console.error("Cannot unlock node: data not loaded");
          return false;
      }
      
      try {
          // Get node details
          const node = this.skillTree.nodes.find(n => n.id === nodeId);
          if (!node) {
              console.error(`Node not found: ${nodeId}`);
              return false;
          }
          
          // Check if player has enough points
          const cost = node.cost || 0;
          if (this.progression.skill_points_available < cost) {
              console.error("Not enough skill points to unlock node");
              return false;
          }
          
          // Unlock the node
          this.progression.unlocked_skills.push(nodeId);
          this.progression.skill_points_available -= cost;
          
          // Update UI and renderer
          this._processSkillTreeData();
          
          if (this.ui && this.ui.initialized) {
              this.ui.updateSkillTree(this.skillTree, this.progression);
          }
          
          if (this.renderer && this.renderer.initialized) {
              this.renderer.renderSkillTree(this.skillTree, this.progression);
          }
          
          // Apply effects
          if (this.effectSystem && this.effectSystem.initialized) {
              this.effectSystem.applyNodeEffects(node);
          }
          
          console.log(`Node unlocked: ${nodeId}`);
          return true;
      } catch (error) {
          console.error("Error unlocking node:", error);
          return false;
      }
  },
  
  /**
   * Save player progression
   * @returns {Promise} - Promise that resolves with save result
   */
  saveProgress: function() {
      return new Promise((resolve, reject) => {
          if (!this.progression) {
              reject(new Error("No progression data to save"));
              return;
          }
          
          // Create payload
          const payload = {
              reputation: this.progression.reputation,
              unlocked_skills: this.progression.unlocked_skills,
              active_skills: this.progression.active_skills,
              skill_points_available: this.progression.skill_points_available,
              specialization_progress: this.progression.specialization_progress
          };
          
          // Send to API
          fetch('/api/skill-progress', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error(`Failed to save progress: ${response.status} ${response.statusText}`);
              }
              return response.json();
          })
          .then(data => {
              console.log("Progress saved successfully");
              resolve(data);
          })
          .catch(error => {
              console.error("Error saving progress:", error);
              reject(error);
          });
      });
  },
  
  /**
   * Get node details
   * @param {String} nodeId - ID of the node
   * @returns {Object|null} - Node details or null if not found
   */
  getNodeDetails: function(nodeId) {
      if (!this.skillTree || !this.skillTree.nodes) {
          return null;
      }
      
      const node = this.skillTree.nodes.find(n => n.id === nodeId);
      if (!node) {
          return null;
      }
      
      // Determine node status
      let status = 'locked';
      
      if (this.progression.unlocked_skills.includes(nodeId)) {
          status = 'unlocked';
      } else if (this.skillTree.available_nodes.includes(nodeId)) {
          status = 'available';
      }
      
      // Return node with additional details
      return {
          ...node,
          status
      };
  }
};

// Make globally available
window.SkillTreeController = SkillTreeController;