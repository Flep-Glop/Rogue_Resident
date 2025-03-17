/**
 * SkillTreeRenderer
 * Handles the visual rendering of the skill tree
 */
const SkillTreeRenderer = {
  // State tracking
  initialized: false,
  svg: null,
  container: null,
  
  // View properties
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  
  // Rendering properties
  nodeSize: 60,
  nodeSpacing: 150,
  
  /**
   * Initialize the renderer
   * @param {String} containerId - ID of the container element
   * @returns {Object} - This instance for chaining
   */
  initialize: function(containerId) {
      if (this.initialized) {
          console.log("SkillTreeRenderer already initialized");
          return this;
      }
      
      console.log("Initializing SkillTreeRenderer...");
      
      // Store container
      this.container = document.getElementById(containerId);
      if (!this.container) {
          console.error(`Container not found: ${containerId}`);
          return this;
      }
      
      // Create SVG element
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.setAttribute('class', 'skill-tree-svg');
      this.svg.setAttribute('width', '100%');
      this.svg.setAttribute('height', '100%');
      this.container.appendChild(this.svg);
      
      // Create groups for paths and nodes
      this.pathsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.pathsGroup.setAttribute('class', 'skill-tree-paths');
      
      this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.nodesGroup.setAttribute('class', 'skill-tree-nodes');
      
      this.svg.appendChild(this.pathsGroup);
      this.svg.appendChild(this.nodesGroup);
      
      // Add event listeners
      this._setupEventListeners();
      
      // Mark as initialized
      this.initialized = true;
      console.log("SkillTreeRenderer initialization complete");
      
      return this;
  },
  
  /**
   * Render the skill tree
   * @param {Object} skillTree - Skill tree data
   * @param {Object} progression - Player progression data
   * @returns {Boolean} - Success status
   */
  renderSkillTree: function(skillTree, progression) {
      if (!this.initialized) {
          console.error("Cannot render skill tree: renderer not initialized");
          return false;
      }
      
      if (!skillTree || !skillTree.nodes) {
          console.error("Invalid skill tree data");
          return false;
      }
      
      console.log("Rendering skill tree...");
      
      try {
          // Clear existing content
          while (this.pathsGroup.firstChild) {
              this.pathsGroup.removeChild(this.pathsGroup.firstChild);
          }
          
          while (this.nodesGroup.firstChild) {
              this.nodesGroup.removeChild(this.nodesGroup.firstChild);
          }
          
          // Get data
          const nodes = skillTree.nodes || [];
          const connections = skillTree.connections || [];
          const unlockedNodes = progression?.unlocked_skills || [];
          const availableNodes = skillTree?.available_nodes || [];
          
          // Calculate node positions
          this._calculateNodePositions(nodes);
          
          // Render connections
          this._renderConnections(connections, nodes, unlockedNodes, availableNodes);
          
          // Render nodes
          this._renderNodes(nodes, unlockedNodes, availableNodes);
          
          // Apply pan and zoom
          this._applyTransform();
          
          console.log("Skill tree rendering complete");
          return true;
      } catch (error) {
          console.error("Error rendering skill tree:", error);
          return false;
      }
  },
  
  /**
   * Calculate positions for nodes
   * @param {Array} nodes - Skill tree nodes
   * @private
   */
  _calculateNodePositions: function(nodes) {
      // Group nodes by tier
      const tierGroups = {};
      
      nodes.forEach(node => {
          const tier = node.tier || 0;
          if (!tierGroups[tier]) {
              tierGroups[tier] = [];
          }
          tierGroups[tier].push(node);
      });
      
      // Calculate positions by tier
      const tiers = Object.keys(tierGroups).sort((a, b) => a - b);
      
      tiers.forEach(tier => {
          const nodesInTier = tierGroups[tier];
          const tierY = tier * this.nodeSpacing + 100;
          
          // Position nodes horizontally
          const tierWidth = nodesInTier.length * this.nodeSpacing;
          const startX = -tierWidth / 2 + this.nodeSpacing / 2;
          
          nodesInTier.forEach((node, index) => {
              node._x = startX + index * this.nodeSpacing;
              node._y = tierY;
          });
      });
  },
  
  /**
   * Render connections between nodes
   * @param {Array} connections - Connection definitions
   * @param {Array} nodes - Skill tree nodes
   * @param {Array} unlockedNodes - IDs of unlocked nodes
   * @param {Array} availableNodes - IDs of available nodes
   * @private
   */
  _renderConnections: function(connections, nodes, unlockedNodes, availableNodes) {
      connections.forEach(connection => {
          // Find source and target nodes
          const sourceNode = nodes.find(node => node.id === connection.source);
          const targetNode = nodes.find(node => node.id === connection.target);
          
          if (!sourceNode || !targetNode) return;
          
          // Determine connection state
          let connectionState = 'locked';
          
          if (unlockedNodes.includes(sourceNode.id) && unlockedNodes.includes(targetNode.id)) {
              connectionState = 'unlocked';
          } else if (unlockedNodes.includes(sourceNode.id) && availableNodes.includes(targetNode.id)) {
              connectionState = 'available';
          }
          
          // Create path
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          path.setAttribute('x1', sourceNode._x);
          path.setAttribute('y1', sourceNode._y);
          path.setAttribute('x2', targetNode._x);
          path.setAttribute('y2', targetNode._y);
          path.setAttribute('class', `skill-connection skill-connection-${connectionState}`);
          
          // Add to paths group
          this.pathsGroup.appendChild(path);
      });
  },
  
  /**
   * Render skill tree nodes
   * @param {Array} nodes - Skill tree nodes
   * @param {Array} unlockedNodes - IDs of unlocked nodes
   * @param {Array} availableNodes - IDs of available nodes
   * @private
   */
  _renderNodes: function(nodes, unlockedNodes, availableNodes) {
      nodes.forEach(node => {
          // Determine node state
          let nodeState = 'locked';
          
          if (unlockedNodes.includes(node.id)) {
              nodeState = 'unlocked';
          } else if (availableNodes.includes(node.id)) {
              nodeState = 'available';
          }
          
          // Create node group
          const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          nodeGroup.setAttribute('class', `skill-node-group`);
          nodeGroup.setAttribute('data-node-id', node.id);
          nodeGroup.setAttribute('data-node-state', nodeState);
          
          // Create node circle
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', node._x);
          circle.setAttribute('cy', node._y);
          circle.setAttribute('r', this.nodeSize / 2);
          circle.setAttribute('class', `skill-node skill-node-${nodeState}`);
          
          // Add specialization color
          if (node.specialization) {
              // Find specialization color
              const specColor = this._getSpecializationColor(node.specialization);
              if (specColor) {
                  circle.style.fill = specColor;
              }
          }
          
          nodeGroup.appendChild(circle);
          
          // Create node label
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', node._x);
          label.setAttribute('y', node._y + this.nodeSize / 2 + 15);
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('class', `skill-node-label`);
          label.textContent = node.name;
          
          nodeGroup.appendChild(label);
          
          // Add click handler for available nodes
          if (nodeState === 'available') {
              nodeGroup.style.cursor = 'pointer';
              nodeGroup.addEventListener('click', () => {
                  this._handleNodeClick(node.id);
              });
          }
          
          // Add node to group
          this.nodesGroup.appendChild(nodeGroup);
      });
  },
  
  /**
   * Get color for a specialization
   * @param {String} specializationId - Specialization ID
   * @returns {String|null} - Color or null if not found
   * @private
   */
  _getSpecializationColor: function(specializationId) {
      // Default colors
      const colors = {
          'theory': '#4287f5',
          'clinical': '#42f575',
          'technical': '#f59142',
          'research': '#a142f5',
          'core': '#888888'
      };
      
      return colors[specializationId] || null;
  },
  
  /**
   * Handle node click
   * @param {String} nodeId - ID of the clicked node
   * @private
   */
  _handleNodeClick: function(nodeId) {
      // Emit event
      const event = new CustomEvent('skill-node-clicked', {
          detail: { nodeId }
      });
      document.dispatchEvent(event);
      
      // If controller is available, use it
      if (window.SkillTreeController && window.SkillTreeController.initialized) {
          window.SkillTreeController.getNodeDetails(nodeId);
      }
  },
  
  /**
   * Apply pan and zoom transform
   * @private
   */
  _applyTransform: function() {
      const transform = `translate(${this.offsetX}, ${this.offsetY}) scale(${this.scale})`;
      this.pathsGroup.setAttribute('transform', transform);
      this.nodesGroup.setAttribute('transform', transform);
  },
  
  /**
   * Set up event listeners for pan and zoom
   * @private
   */
  _setupEventListeners: function() {
      if (!this.svg) return;
      
      // Pan state
      let isPanning = false;
      let startX = 0;
      let startY = 0;
      
      // Mouse down - start pan
      this.svg.addEventListener('mousedown', event => {
          if (event.button === 0) { // Left mouse button
              isPanning = true;
              startX = event.clientX;
              startY = event.clientY;
              this.svg.style.cursor = 'grabbing';
          }
      });
      
      // Mouse move - pan
      window.addEventListener('mousemove', event => {
          if (isPanning) {
              const dx = event.clientX - startX;
              const dy = event.clientY - startY;
              
              this.offsetX += dx;
              this.offsetY += dy;
              
              startX = event.clientX;
              startY = event.clientY;
              
              this._applyTransform();
          }
      });
      
      // Mouse up - end pan
      window.addEventListener('mouseup', () => {
          if (isPanning) {
              isPanning = false;
              this.svg.style.cursor = 'grab';
          }
      });
      
      // Mouse wheel - zoom
      this.svg.addEventListener('wheel', event => {
          event.preventDefault();
          
          // Zoom in or out
          const delta = -Math.sign(event.deltaY) * 0.1;
          this.zoomCanvas(delta);
      });
  },
  
  /**
   * Zoom the canvas
   * @param {Number} delta - Amount to zoom (positive = zoom in, negative = zoom out)
   */
  zoomCanvas: function(delta) {
      // Calculate new scale with limits
      const newScale = Math.max(0.5, Math.min(2, this.scale + delta));
      
      this.scale = newScale;
      this._applyTransform();
  },
  
  /**
   * Reset view to default
   */
  resetView: function() {
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this._applyTransform();
  }
};

// Make globally available
window.SkillTreeRenderer = SkillTreeRenderer;