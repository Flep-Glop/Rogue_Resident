// frontend/src/systems/skill_tree/skill_tree_renderer.js

/**
 * SkillTreeRenderer - Visualizes the skill tree with an atomic/orbital layout
 * Implements the visual design as seen in skill-tree-concept.svg
 */
class SkillTreeRenderer {
    // Configuration
    config = {
      containerId: 'skill-tree-visualization',
      width: 800,
      height: 800,
      centerX: 400,
      centerY: 400,
      nodeSize: {
        core: 30,
        major: 20,
        minor: 15,
        connector: 18
      },
      orbitRadii: [0, 100, 200, 300], // Tiers 0-3
      specializations: {
        theory: {
          color: '#87CEEB',
          darkColor: '#1D4E89',
          title: 'THEORY SPECIALIST',
          angleRange: [270, 360] // Degrees (top)
        },
        clinical: {
          color: '#90EE90',
          darkColor: '#2E8B57',
          title: 'CLINICAL EXPERT',
          angleRange: [0, 90] // Degrees (right)
        },
        technical: {
          color: '#FFA500',
          darkColor: '#B8860B',
          title: 'TECHNICAL SAVANT',
          angleRange: [90, 180] // Degrees (bottom)
        },
        research: {
          color: '#DDA0DD',
          darkColor: '#663399',
          title: 'RESEARCH FOCUS',
          angleRange: [180, 270] // Degrees (left)
        },
        core: {
          color: '#4682B4',
          darkColor: '#2A4A6A',
          title: 'CORE',
          angleRange: [0, 360] // Full circle
        },
        connector: {
          color: '#FFD700',
          darkColor: '#B8860B',
          title: 'CONNECTOR',
          angleRange: [0, 360] // Placed between specializations
        }
      }
    };
    
    // State
    state = {
      initialized: false,
      data: null,
      svg: null,
      nodesGroup: null,
      connectionsGroup: null,
      labelsGroup: null,
      viewBox: {
        x: 0,
        y: 0,
        width: this.config.width,
        height: this.config.height
      },
      zoom: 1,
      pan: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      selectedNodeId: null,
      nodeElements: new Map(), // Maps node IDs to DOM elements
      connectionElements: new Map() // Maps connection IDs to DOM elements
    };
    
    /**
     * Initialize the renderer
     * @param {String} containerId - ID of container element
     */
    initialize(containerId = null) {
      if (this.state.initialized) {
        console.log("SkillTreeRenderer already initialized");
        return this;
      }
      
      // Set container ID if provided
      if (containerId) {
        this.config.containerId = containerId;
      }
      
      // Get container element
      const container = document.getElementById(this.config.containerId);
      if (!container) {
        console.error(`Container element not found: ${this.config.containerId}`);
        return this;
      }
      
      // Create SVG element
      this.state.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.state.svg.setAttribute('width', '100%');
      this.state.svg.setAttribute('height', '100%');
      this.state.svg.setAttribute('viewBox', `0 0 ${this.config.width} ${this.config.height}`);
      this.state.svg.classList.add('skill-tree-svg');
      
      // Create groups for connections, nodes and labels
      this.state.connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.state.connectionsGroup.classList.add('connections-group');
      
      this.state.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.state.nodesGroup.classList.add('nodes-group');
      
      this.state.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.state.labelsGroup.classList.add('labels-group');
      
      // Append groups to SVG
      this.state.svg.appendChild(this.state.connectionsGroup);
      this.state.svg.appendChild(this.state.nodesGroup);
      this.state.svg.appendChild(this.state.labelsGroup);
      
      // Append SVG to container
      container.appendChild(this.state.svg);
      
      // Initialize event listeners
      this._initEventListeners();
      
      // Add orbital rings
      this._addOrbitalRings();
      
      // Mark as initialized
      this.state.initialized = true;
      console.log("SkillTreeRenderer initialized");
      
      return this;
    }
    
    /**
     * Initialize event listeners
     * @private
     */
    _initEventListeners() {
      if (!this.state.svg) return;
      
      // Add event listeners for pan and zoom
      this.state.svg.addEventListener('mousedown', this._handleMouseDown.bind(this));
      this.state.svg.addEventListener('mousemove', this._handleMouseMove.bind(this));
      this.state.svg.addEventListener('mouseup', this._handleMouseUp.bind(this));
      this.state.svg.addEventListener('wheel', this._handleWheel.bind(this));
      
      // Add click handler for node selection
      this.state.svg.addEventListener('click', this._handleClick.bind(this));
    }
    
    /**
     * Add orbital rings to visualize tiers
     * @private
     */
    _addOrbitalRings() {
      const { centerX, centerY } = this.config;
      
      // Create rings for each tier except the center
      this.config.orbitRadii.forEach((radius, index) => {
        if (index === 0) return; // Skip tier 0 (core)
        
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', centerX);
        ring.setAttribute('cy', centerY);
        ring.setAttribute('r', radius);
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#2A3A5C');
        ring.setAttribute('stroke-width', '1');
        ring.classList.add('orbital-ring');
        
        this.state.connectionsGroup.appendChild(ring);
      });
    }
    
    /**
     * Handle mouse down event
     * @private
     * @param {MouseEvent} event - Mouse event
     */
    _handleMouseDown(event) {
      // Only initiate drag if not clicking on a node
      if (!event.target.closest('.skill-node')) {
        this.state.isDragging = true;
        this.state.dragStart = {
          x: event.clientX,
          y: event.clientY
        };
        this.state.svg.style.cursor = 'grabbing';
      }
    }
    
    /**
     * Handle mouse move event
     * @private
     * @param {MouseEvent} event - Mouse event
     */
    _handleMouseMove(event) {
      if (!this.state.isDragging) return;
      
      const dx = event.clientX - this.state.dragStart.x;
      const dy = event.clientY - this.state.dragStart.y;
      
      // Update pan and drag start
      this.state.pan.x += dx;
      this.state.pan.y += dy;
      this.state.dragStart = {
        x: event.clientX,
        y: event.clientY
      };
      
      // Apply transform
      this._applyTransform();
    }
    
    /**
     * Handle mouse up event
     * @private
     * @param {MouseEvent} event - Mouse event
     */
    _handleMouseUp(event) {
      this.state.isDragging = false;
      this.state.svg.style.cursor = 'grab';
    }
    
    /**
     * Handle wheel event for zooming
     * @private
     * @param {WheelEvent} event - Wheel event
     */
    _handleWheel(event) {
      event.preventDefault();
      
      // Calculate zoom delta
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      
      // Calculate new zoom
      const newZoom = Math.max(0.5, Math.min(2, this.state.zoom + delta));
      
      // Update zoom
      this.state.zoom = newZoom;
      
      // Apply transform
      this._applyTransform();
    }
    
    /**
     * Handle click event
     * @private
     * @param {MouseEvent} event - Click event
     */
    _handleClick(event) {
      // Check if clicking on a node
      const nodeElement = event.target.closest('.skill-node');
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        this.selectNode(nodeId);
      } else {
        // Deselect if clicking outside a node
        this.selectNode(null);
      }
    }
    
    /**
     * Apply transform for pan and zoom
     * @private
     */
    _applyTransform() {
      const { centerX, centerY } = this.config;
      const { zoom, pan } = this.state;
      
      // Apply transform to all groups
      [this.state.connectionsGroup, this.state.nodesGroup, this.state.labelsGroup].forEach(group => {
        if (!group) return;
        
        group.setAttribute('transform', 
          `translate(${pan.x}, ${pan.y}) ` +
          `scale(${zoom}) ` +
          `translate(${centerX * (1 - zoom)}, ${centerY * (1 - zoom)})`
        );
      });
    }
    
    /**
     * Reset view to default
     */
    resetView() {
      this.state.zoom = 1;
      this.state.pan = { x: 0, y: 0 };
      this._applyTransform();
    }
    
    /**
     * Load skill tree data
     * @param {Object} data - Skill tree data
     */
    loadSkillTree(data) {
      if (!this.state.initialized) {
        console.error("SkillTreeRenderer not initialized");
        return this;
      }
      
      // Save data
      this.state.data = data;
      
      // Clear existing elements
      this.state.nodeElements.clear();
      this.state.connectionElements.clear();
      
      // Clear groups
      while (this.state.nodesGroup.firstChild) {
        this.state.nodesGroup.removeChild(this.state.nodesGroup.firstChild);
      }
      
      while (this.state.connectionsGroup.firstChild) {
        const child = this.state.connectionsGroup.firstChild;
        // Keep orbital rings
        if (!child.classList.contains('orbital-ring')) {
          this.state.connectionsGroup.removeChild(child);
        }
      }
      
      while (this.state.labelsGroup.firstChild) {
        this.state.labelsGroup.removeChild(this.state.labelsGroup.firstChild);
      }
      
      // Calculate node positions
      this._calculateNodePositions();
      
      // Add specialization titles
      this._addSpecializationTitles();
      
      // Render connections
      this._renderConnections();
      
      // Render nodes
      this._renderNodes();
      
      console.log("Skill tree data loaded and rendered");
      
      return this;
    }
    
    /**
     * Calculate node positions using orbital layout
     * @private
     */
    _calculateNodePositions() {
      if (!this.state.data || !this.state.data.nodes) return;
      
      const { centerX, centerY, orbitRadii } = this.config;
      
      // Group nodes by specialization and tier
      const groupedNodes = {};
      
      this.state.data.nodes.forEach(node => {
        const spec = node.specialization || 'core';
        const tier = Math.min(node.tier || 0, orbitRadii.length - 1);
        
        if (!groupedNodes[spec]) {
          groupedNodes[spec] = {};
        }
        
        if (!groupedNodes[spec][tier]) {
          groupedNodes[spec][tier] = [];
        }
        
        groupedNodes[spec][tier].push(node);
      });
      
      // Position nodes by specialization and tier
      Object.entries(groupedNodes).forEach(([spec, tiers]) => {
        const specConfig = this.config.specializations[spec] || this.config.specializations.core;
        const [startAngle, endAngle] = specConfig.angleRange;
        
        Object.entries(tiers).forEach(([tier, nodes]) => {
          // Skip empty tiers
          if (!nodes.length) return;
          
          const radius = orbitRadii[tier];
          const nodeCount = nodes.length;
          
          // Calculate angle step
          const angleStep = (endAngle - startAngle) / (nodeCount + (nodeCount > 1 ? 1 : 0));
          
          // Position nodes along the arc
          nodes.forEach((node, index) => {
            // Calculate angle (convert to radians)
            const angle = ((startAngle + angleStep * (index + 1)) * Math.PI) / 180;
            
            // Calculate position
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            // Update node position
            node.position = { x, y };
          });
        });
      });
    }
    
    /**
     * Add specialization titles to the visualization
     * @private
     */
    _addSpecializationTitles() {
      const { centerX, centerY } = this.config;
      
      // Add titles for each specialization
      Object.entries(this.config.specializations).forEach(([spec, config]) => {
        // Skip core and connector
        if (spec === 'core' || spec === 'connector') return;
        
        const [startAngle, endAngle] = config.angleRange;
        const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
        
        // Calculate position (slightly beyond the outermost ring)
        const radius = this.config.orbitRadii[this.config.orbitRadii.length - 1] * 1.15;
        const x = centerX + radius * Math.cos(midAngle);
        const y = centerY + radius * Math.sin(midAngle);
        
        // Create text element
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', config.color);
        text.setAttribute('font-size', '16');
        text.setAttribute('font-weight', 'bold');
        text.classList.add('specialization-title');
        text.textContent = config.title;
        
        this.state.labelsGroup.appendChild(text);
      });
    }
    
    /**
     * Render connections between nodes
     * @private
     */
    _renderConnections() {
      if (!this.state.data || !this.state.data.connections) return;
      
      this.state.data.connections.forEach(connection => {
        // Find source and target nodes
        const sourceNode = this.state.data.nodes.find(n => n.id === connection.source);
        const targetNode = this.state.data.nodes.find(n => n.id === connection.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Get positions
        const sourcePos = sourceNode.position;
        const targetPos = targetNode.position;
        
        if (!sourcePos || !targetPos) return;
        
        // Create connection line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourcePos.x);
        line.setAttribute('y1', sourcePos.y);
        line.setAttribute('x2', targetPos.x);
        line.setAttribute('y2', targetPos.y);
        
        // Set style based on specialization and state
        const spec = sourceNode.specialization || 'core';
        const specConfig = this.config.specializations[spec] || this.config.specializations.core;
        
        // Default to locked state
        line.setAttribute('stroke', specConfig.color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-opacity', '0.5');
        
        // Add class for state updates
        line.classList.add('skill-connection');
        line.classList.add(`skill-connection-${connection.source}-${connection.target}`);
        
        // Add data attributes
        line.setAttribute('data-source', connection.source);
        line.setAttribute('data-target', connection.target);
        
        // Store connection element
        this.state.connectionElements.set(`${connection.source}-${connection.target}`, line);
        
        // Add to connections group
        this.state.connectionsGroup.appendChild(line);
      });
    }
    
    /**
     * Render skill tree nodes
     * @private
     */
    _renderNodes() {
      if (!this.state.data || !this.state.data.nodes) return;
      
      this.state.data.nodes.forEach(node => {
        // Skip nodes without position
        if (!node.position) return;
        
        // Create node group
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('skill-node-group');
        
        // Create node circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        
        const { x, y } = node.position;
        
        // Determine node size based on type
        const nodeType = node.visual?.size || (node.tier === 0 ? 'core' : 'minor');
        const radius = this.config.nodeSize[nodeType] || this.config.nodeSize.minor;
        
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);
        
        // Set style based on specialization
        const spec = node.specialization || 'core';
        const specConfig = this.config.specializations[spec] || this.config.specializations.core;
        
        // Default to locked state
        circle.setAttribute('fill', specConfig.darkColor);
        circle.setAttribute('stroke', specConfig.color);
        circle.setAttribute('stroke-width', '2');
        
        // Add data attributes
        circle.setAttribute('data-node-id', node.id);
        circle.setAttribute('data-specialization', spec);
        circle.setAttribute('data-tier', node.tier || 0);
        
        // Add classes
        circle.classList.add('skill-node');
        circle.classList.add(`skill-node-${spec}`);
        circle.classList.add(`skill-node-tier-${node.tier || 0}`);
        circle.classList.add(`skill-node-${nodeType}`);
        circle.classList.add(`skill-node-locked`); // Default state
        
        // Add tooltip
        const tooltip = this._createNodeTooltip(node);
        group.appendChild(tooltip);
        
        // Add node to group
        group.appendChild(circle);
        
        // Add icon or label if specified
        if (node.visual?.icon) {
          const icon = this._createNodeIcon(node, x, y);
          group.appendChild(icon);
        } else {
          // Just use the first letter of the name as icon
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', x);
          text.setAttribute('y', y);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('fill', 'white');
          text.setAttribute('font-size', Math.floor(radius * 0.8));
          text.classList.add('skill-node-text');
          text.textContent = (node.name || 'Node').charAt(0);
          
          group.appendChild(text);
        }
        
        // Store node element
        this.state.nodeElements.set(node.id, {
          group,
          circle,
          position: { x, y }
        });
        
        // Add to nodes group
        this.state.nodesGroup.appendChild(group);
      });
    }
    
    /**
     * Create a tooltip for a node
     * @private
     * @param {Object} node - Node data
     * @returns {SVGElement} Tooltip element
     */
    _createNodeTooltip(node) {
      // Create foreign object for HTML content
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      tooltip.setAttribute('width', '200');
      tooltip.setAttribute('height', '150');
      tooltip.setAttribute('x', node.position.x - 100);
      tooltip.setAttribute('y', node.position.y - 170);
      tooltip.classList.add('skill-tooltip');
      tooltip.classList.add(`skill-tooltip-${node.id}`);
      
      // Create HTML content
      const tooltipContent = document.createElement('div');
      tooltipContent.classList.add('tooltip-content');
      
      // Get specialization name
      const spec = node.specialization || 'core';
      const specName = this.config.specializations[spec]?.title || 'Core';
      
      tooltipContent.innerHTML = `
        <div class="tooltip-header">
          <div class="tooltip-name">${node.name || 'Node'}</div>
          <div class="tooltip-spec">${specName}</div>
        </div>
        <div class="tooltip-description">${node.description || 'No description'}</div>
        <div class="tooltip-cost">
          ${node.cost?.reputation ? `Reputation: ${node.cost.reputation}` : ''}
          ${node.cost?.skill_points ? `Skill Points: ${node.cost.skill_points}` : ''}
        </div>
      `;
      
      tooltip.appendChild(tooltipContent);
      
      return tooltip;
    }
    
    /**
     * Create an icon for a node
     * @private
     * @param {Object} node - Node data
     * @param {Number} x - X position
     * @param {Number} y - Y position
     * @returns {SVGElement} Icon element
     */
    _createNodeIcon(node, x, y) {
      // Create text element with icon class
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', 'white');
      
      // Get node radius
      const nodeType = node.visual?.size || (node.tier === 0 ? 'core' : 'minor');
      const radius = this.config.nodeSize[nodeType] || this.config.nodeSize.minor;
      
      text.setAttribute('font-size', Math.floor(radius * 0.8));
      text.classList.add('skill-node-icon');
      
      // Map icon name to unicode or text representation
      const iconMap = {
        'atom': '⚛',
        'zap': '⚡',
        'brain': '🧠',
        'heart': '❤',
        'star': '★',
        'book': '📚',
        'tool': '🔧',
        'cpu': '🖥',
        'settings': '⚙',
        'dollar-sign': '💲',
        'flask': '🧪',
        'shield': '🛡',
        'eye': '👁',
        'check-circle': '✓',
        'users': '👥',
        'lightbulb': '💡',
        'help': '?'
      };
      
      // Get icon or fallback to question mark
      text.textContent = iconMap[node.visual?.icon] || '?';
      
      return text;
    }
    
    /**
     * Update node states (locked, unlockable, unlocked, active)
     * @param {Object} nodeStates - Map of node IDs to states
     */
    updateNodeStates(nodeStates) {
      if (!this.state.initialized || !nodeStates) return;
      
      // Update each node
      Object.entries(nodeStates).forEach(([nodeId, state]) => {
        const nodeElement = this.state.nodeElements.get(nodeId);
        if (!nodeElement) return;
        
        const { circle } = nodeElement;
        
        // Remove old state classes
        ['locked', 'unlockable', 'unlocked', 'active'].forEach(s => {
          circle.classList.remove(`skill-node-${s}`);
        });
        
        // Add new state class
        circle.classList.add(`skill-node-${state}`);
        
        // Update connection states based on node states
        this._updateConnectionStates();
      });
    }
    
    /**
     * Update connection states based on node states
     * @private
     */
    _updateConnectionStates() {
      if (!this.state.data || !this.state.data.connections) return;
      
      this.state.data.connections.forEach(connection => {
        const line = this.state.connectionElements.get(`${connection.source}-${connection.target}`);
        if (!line) return;
        
        // Find source and target nodes
        const sourceElement = this.state.nodeElements.get(connection.source);
        const targetElement = this.state.nodeElements.get(connection.target);
        
        if (!sourceElement || !targetElement) return;
        
        // Get node states from classes
        const sourceState = Array.from(sourceElement.circle.classList)
          .find(cls => cls.startsWith('skill-node-') && 
                ['locked', 'unlockable', 'unlocked', 'active'].some(s => cls === `skill-node-${s}`))
          ?.replace('skill-node-', '') || 'locked';
          
        const targetState = Array.from(targetElement.circle.classList)
          .find(cls => cls.startsWith('skill-node-') && 
                ['locked', 'unlockable', 'unlocked', 'active'].some(s => cls === `skill-node-${s}`))
          ?.replace('skill-node-', '') || 'locked';
        
        // Remove old state classes
        line.classList.remove('skill-connection-locked');
        line.classList.remove('skill-connection-unlockable');
        line.classList.remove('skill-connection-unlocked');
        line.classList.remove('skill-connection-active');
        
        // Set connection state based on node states
        if (sourceState === 'active' && targetState === 'active') {
          line.classList.add('skill-connection-active');
          line.setAttribute('stroke-width', '3');
          line.setAttribute('stroke-opacity', '1');
        } else if ((sourceState === 'active' || sourceState === 'unlocked') && 
                  (targetState === 'active' || targetState === 'unlocked')) {
          line.classList.add('skill-connection-unlocked');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('stroke-opacity', '0.8');
        } else if ((sourceState === 'active' || sourceState === 'unlocked') && 
                  targetState === 'unlockable') {
          line.classList.add('skill-connection-unlockable');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('stroke-opacity', '0.6');
        } else {
          line.classList.add('skill-connection-locked');
          line.setAttribute('stroke-width', '1');
          line.setAttribute('stroke-opacity', '0.4');
        }
      });
    }
    
    /**
     * Select a node
     * @param {String} nodeId - ID of node to select, or null to deselect
     */
    selectNode(nodeId) {
      // Deselect previous node
      if (this.state.selectedNodeId) {
        const prevNode = this.state.nodeElements.get(this.state.selectedNodeId);
        if (prevNode) {
          prevNode.circle.classList.remove('skill-node-selected');
        }
      }
      
      // Update selected node
      this.state.selectedNodeId = nodeId;
      
      if (nodeId) {
        // Select new node
        const node = this.state.nodeElements.get(nodeId);
        if (node) {
          node.circle.classList.add('skill-node-selected');
        }
        
        // Trigger event
        const event = new CustomEvent('skillNodeSelected', {
          detail: { nodeId }
        });
        document.dispatchEvent(event);
      }
    }
    
    /**
     * Get current selection
     * @returns {String|null} ID of selected node, or null if none
     */
    getSelectedNodeId() {
      return this.state.selectedNodeId;
    }
  }
  
  // Export for module use
  export default SkillTreeRenderer;
  
  // For backward compatibility with existing code
  window.SkillTreeRenderer = new SkillTreeRenderer();