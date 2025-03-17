// frontend/src/systems/skill_tree/components/atomic_skill_tree_renderer.js

/**
 * AtomicSkillTreeRenderer
 * A specialized renderer for the atomic-themed skill tree
 * Inspired by Path of Exile's radial skill tree design
 */
class AtomicSkillTreeRenderer {
    /**
     * Initialize the renderer
     * @param {string} containerId - ID of container element
     */
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.svg = null;
      this.connectionsGroup = null;
      this.nodesGroup = null;
      this.particlesGroup = null;
      this.effectsGroup = null;
      this.toolTip = null;
      
      // View state
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      
      // Data state
      this.nodes = [];
      this.connections = [];
      this.unlocked = [];
      this.available = [];
      this.selectedNode = null;
      
      // Visual configuration
      this.config = {
        baseNodeRadius: {
          core: 30,
          major: 20,
          minor: 15,
          connector: 18
        },
        orbitalRings: [0, 85, 175, 275, 350, 450],
        specializationAngles: {
          theory: 0,          // Top
          clinical: Math.PI/2, // Right
          technical: Math.PI,  // Bottom
          research: -Math.PI/2 // Left
        },
        colors: {
          theory: "#4287f5",
          clinical: "#42f575",
          technical: "#f59142",
          research: "#a142f5",
          core: "#4682B4",
          connector: "#FFD700"
        },
        pulseFrequency: 2000  // ms
      };
      
      // Animation frame ID
      this.animationFrameId = null;
      
      // Particle system
      this.particles = [];
      this.lastParticleTime = 0;
      
      // Initialize renderer
      this.initialized = false;
    }
    
    /**
     * Initialize the renderer
     * @returns {AtomicSkillTreeRenderer} Instance for chaining
     */
    initialize() {
      if (this.initialized) {
        console.log("Renderer already initialized");
        return this;
      }
      
      console.log("Initializing atomic skill tree renderer");
      
      if (!this.container) {
        console.error("Container element not found");
        return this;
      }
      
      // Create SVG element
      this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this.svg.setAttribute("class", "atomic-skill-tree");
      this.svg.setAttribute("width", "100%");
      this.svg.setAttribute("height", "100%");
      this.svg.setAttribute("viewBox", "-500 -500 1000 1000");
      this.container.appendChild(this.svg);
      
      // Create layer groups (rendering order is important)
      this.orbitalGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.orbitalGroup.classList.add("orbital-rings");
      this.svg.appendChild(this.orbitalGroup);
      
      this.connectionsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.connectionsGroup.classList.add("connections");
      this.svg.appendChild(this.connectionsGroup);
      
      this.particlesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.particlesGroup.classList.add("particles");
      this.svg.appendChild(this.particlesGroup);
      
      this.nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.nodesGroup.classList.add("nodes");
      this.svg.appendChild(this.nodesGroup);
      
      this.effectsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.effectsGroup.classList.add("effects");
      this.svg.appendChild(this.effectsGroup);
      
      // Create orbital ring filter for glow effect
      this.createFilters();
      
      // Create tooltip
      this.toolTip = document.createElement("div");
      this.toolTip.classList.add("skill-tooltip");
      this.toolTip.style.position = "absolute";
      this.toolTip.style.display = "none";
      this.container.appendChild(this.toolTip);
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Start animation loop
      this._startAnimationLoop();
      
      this.initialized = true;
      console.log("Atomic skill tree renderer initialized");
      
      return this;
    }
    
    /**
     * Create SVG filters for visual effects
     */
    createFilters() {
      // Create defs section
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      this.svg.appendChild(defs);
      
      // Glow filter for orbital rings
      const orbitalFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      orbitalFilter.setAttribute("id", "orbital-glow");
      orbitalFilter.setAttribute("x", "-50%");
      orbitalFilter.setAttribute("y", "-50%");
      orbitalFilter.setAttribute("width", "200%");
      orbitalFilter.setAttribute("height", "200%");
      
      const gaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      gaussianBlur.setAttribute("in", "SourceGraphic");
      gaussianBlur.setAttribute("stdDeviation", "2");
      gaussianBlur.setAttribute("result", "blur");
      
      orbitalFilter.appendChild(gaussianBlur);
      defs.appendChild(orbitalFilter);
      
      // Node glow filters for each specialization
      const specializations = ['theory', 'clinical', 'technical', 'research', 'core', 'connector'];
      
      specializations.forEach(spec => {
        const color = this.config.colors[spec];
        
        // Node glow filter
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", `${spec}-glow`);
        filter.setAttribute("x", "-50%");
        filter.setAttribute("y", "-50%");
        filter.setAttribute("width", "200%");
        filter.setAttribute("height", "200%");
        
        const gaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        gaussianBlur.setAttribute("in", "SourceGraphic");
        gaussianBlur.setAttribute("stdDeviation", "3");
        gaussianBlur.setAttribute("result", "blur");
        
        filter.appendChild(gaussianBlur);
        defs.appendChild(filter);
        
        // Connection gradient
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        gradient.setAttribute("id", `${spec}-connection`);
        
        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", color);
        stop1.setAttribute("stop-opacity", "0.7");
        
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", color);
        stop2.setAttribute("stop-opacity", "0.9");
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
      });
      
      // Particle filter
      const particleFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      particleFilter.setAttribute("id", "particle-blur");
      particleFilter.setAttribute("x", "-50%");
      particleFilter.setAttribute("y", "-50%");
      particleFilter.setAttribute("width", "200%");
      particleFilter.setAttribute("height", "200%");
      
      const particleBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      particleBlur.setAttribute("in", "SourceGraphic");
      particleBlur.setAttribute("stdDeviation", "1");
      particleBlur.setAttribute("result", "blur");
      
      particleFilter.appendChild(particleBlur);
      defs.appendChild(particleFilter);
    }
    
    /**
     * Load and render the skill tree
     * @param {Object} data - Skill tree data
     * @param {Array} data.nodes - Node definitions
     * @param {Array} data.connections - Connection definitions
     * @param {Array} unlockedNodes - Array of unlocked node IDs
     * @param {Array} availableNodes - Array of available node IDs
     */
    loadSkillTree(data, unlockedNodes = [], availableNodes = []) {
      console.log("Loading skill tree data");
      
      this.nodes = data.nodes || [];
      this.connections = data.connections || [];
      this.unlocked = unlockedNodes;
      this.available = availableNodes;
      
      // Generate atomic node positions if not already defined
      this._generateAtomicPositions();
      
      // Render the tree
      this.render();
      
      return this;
    }
    
    /**
     * Generate atomic-style positioning for nodes
     * @private
     */
    _generateAtomicPositions() {
      console.log("Generating atomic node positions");
      
      // Group nodes by tier and specialization
      const nodesByTierAndSpec = {};
      
      this.nodes.forEach(node => {
        const tier = node.tier || 0;
        const spec = node.specialization || 'core';
        
        if (!nodesByTierAndSpec[tier]) {
          nodesByTierAndSpec[tier] = {};
        }
        
        if (!nodesByTierAndSpec[tier][spec]) {
          nodesByTierAndSpec[tier][spec] = [];
        }
        
        nodesByTierAndSpec[tier][spec].push(node);
      });
      
      // Position core nodes (tier 0) at center
      if (nodesByTierAndSpec[0] && nodesByTierAndSpec[0].core) {
        const coreNodes = nodesByTierAndSpec[0].core;
        
        if (coreNodes.length === 1) {
          // Single core node at exact center
          coreNodes[0].position = { x: 0, y: 0 };
        } else {
          // Multiple core nodes in a tight cluster
          const coreRadius = 30;
          const angleStep = (2 * Math.PI) / coreNodes.length;
          
          coreNodes.forEach((node, index) => {
            const angle = index * angleStep;
            node.position = {
              x: Math.cos(angle) * coreRadius,
              y: Math.sin(angle) * coreRadius
            };
          });
        }
      }
      
      // Position specialized nodes in orbital rings
      for (let tier = 1; tier <= 5; tier++) {
        if (!nodesByTierAndSpec[tier]) continue;
        
        // Get orbital radius for this tier
        const radius = this.config.orbitalRings[tier];
        
        // Count total specializations in this tier
        const specs = Object.keys(nodesByTierAndSpec[tier]);
        
        // Position nodes for each specialization
        specs.forEach(spec => {
          const nodes = nodesByTierAndSpec[tier][spec];
          
          // Get base angle for this specialization
          let baseAngle = 0;
          if (spec === 'theory') baseAngle = this.config.specializationAngles.theory;
          else if (spec === 'clinical') baseAngle = this.config.specializationAngles.clinical;
          else if (spec === 'technical') baseAngle = this.config.specializationAngles.technical;
          else if (spec === 'research') baseAngle = this.config.specializationAngles.research;
          else if (spec === 'connector') {
            // Special case: place connectors between specializations
            this._placeConnectorNodes(nodes, tier);
            return;
          }
          
          // Angle span for this specialization (60 degrees = Pi/3 radians)
          const spanAngle = Math.PI / 3;
          
          // Place nodes within the span
          const nodeCount = nodes.length;
          
          if (nodeCount === 1) {
            // Single node at the base angle
            nodes[0].position = {
              x: Math.cos(baseAngle) * radius,
              y: Math.sin(baseAngle) * radius
            };
          } else {
            // Multiple nodes distributed within span
            nodes.forEach((node, index) => {
              const angle = baseAngle - (spanAngle / 2) + (spanAngle * index / (nodeCount - 1));
              node.position = {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
              };
            });
          }
        });
      }
    }
    
    /**
     * Place connector nodes between specializations
     * @private
     * @param {Array} nodes - Connector nodes to place
     * @param {Number} tier - Tier level
     */
    _placeConnectorNodes(nodes, tier) {
      if (!nodes || nodes.length === 0) return;
      
      // Get orbital radius
      const radius = this.config.orbitalRings[tier];
      
      // Define positions between specializations
      const connectorPositions = [
        { angle: Math.PI/4, specs: ['theory', 'clinical'] },     // Between theory and clinical
        { angle: 3*Math.PI/4, specs: ['clinical', 'technical'] }, // Between clinical and technical
        { angle: 5*Math.PI/4, specs: ['technical', 'research'] }, // Between technical and research
        { angle: 7*Math.PI/4, specs: ['research', 'theory'] }     // Between research and theory
      ];
      
      // Assign positions to connector nodes
      // We'll try to match connections in the node data to appropriate positions
      const assignedPositions = new Set();
      
      nodes.forEach(node => {
        // Find node's connected specializations
        const connections = this._findNodeConnections(node.id);
        const connectedSpecs = new Set();
        
        connections.forEach(conn => {
          const connectedNode = this._findNodeById(conn.source === node.id ? conn.target : conn.source);
          if (connectedNode && connectedNode.specialization) {
            connectedSpecs.add(connectedNode.specialization);
          }
        });
        
        // Find best position match
        let bestPosition = null;
        let bestMatch = 0;
        
        connectorPositions.forEach((pos, index) => {
          if (assignedPositions.has(index)) return;
          
          // Count matching specializations
          let matches = 0;
          pos.specs.forEach(spec => {
            if (connectedSpecs.has(spec)) matches++;
          });
          
          if (matches > bestMatch) {
            bestMatch = matches;
            bestPosition = { index, pos };
          }
        });
        
        // Assign best position or fallback
        if (bestPosition) {
          assignedPositions.add(bestPosition.index);
          node.position = {
            x: Math.cos(bestPosition.pos.angle) * radius,
            y: Math.sin(bestPosition.pos.angle) * radius
          };
        } else {
          // Fallback: assign to any unassigned position
          for (let i = 0; i < connectorPositions.length; i++) {
            if (!assignedPositions.has(i)) {
              assignedPositions.add(i);
              const angle = connectorPositions[i].angle;
              node.position = {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
              };
              break;
            }
          }
          
          // Last resort: random position on the orbital
          if (!node.position) {
            const angle = Math.random() * 2 * Math.PI;
            node.position = {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            };
          }
        }
      });
    }
    
    /**
     * Find all connections for a node
     * @private
     * @param {String} nodeId - Node ID
     * @returns {Array} Array of connection objects
     */
    _findNodeConnections(nodeId) {
      return this.connections.filter(conn => 
        conn.source === nodeId || conn.target === nodeId
      );
    }
    
    /**
     * Find a node by its ID
     * @private
     * @param {String} nodeId - Node ID to find
     * @returns {Object|null} Node object or null if not found
     */
    _findNodeById(nodeId) {
      return this.nodes.find(node => node.id === nodeId) || null;
    }
    
    /**
     * Render the skill tree
     */
    render() {
      // Clear existing elements
      this.orbitalGroup.innerHTML = '';
      this.connectionsGroup.innerHTML = '';
      this.nodesGroup.innerHTML = '';
      this.particlesGroup.innerHTML = '';
      
      // Draw orbital rings
      this._drawOrbitalRings();
      
      // Draw connections
      this._drawConnections();
      
      // Draw nodes
      this._drawNodes();
      
      console.log("Skill tree rendered");
      
      return this;
    }
    
    /**
     * Draw orbital rings
     * @private
     */
    _drawOrbitalRings() {
      // Skip the first orbital (core)
      for (let i = 1; i < this.config.orbitalRings.length; i++) {
        const radius = this.config.orbitalRings[i];
        
        // Create ring
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", 0);
        ring.setAttribute("cy", 0);
        ring.setAttribute("r", radius);
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "rgba(120, 140, 255, 0.15)");
        ring.setAttribute("stroke-width", 1);
        ring.setAttribute("filter", "url(#orbital-glow)");
        ring.classList.add("orbital-ring");
        
        this.orbitalGroup.appendChild(ring);
      }
    }
    
    /**
     * Draw skill tree connections
     * @private
     */
    _drawConnections() {
      this.connections.forEach(conn => {
        const sourceNode = this._findNodeById(conn.source);
        const targetNode = this._findNodeById(conn.target);
        
        if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) {
          console.warn(`Cannot draw connection: ${conn.source} -> ${conn.target}`);
          return;
        }
        
        // Determine connection state
        let state = 'locked';
        if (this.unlocked.includes(sourceNode.id) && this.unlocked.includes(targetNode.id)) {
          state = 'active';
        } else if (
          (this.unlocked.includes(sourceNode.id) && this.available.includes(targetNode.id)) || 
          (this.unlocked.includes(targetNode.id) && this.available.includes(sourceNode.id))
        ) {
          state = 'available';
        }
        
        // Determine connection color
        let connColor = "#888888";
        let specialization = sourceNode.specialization || 'core';
        if (this.config.colors[specialization]) {
          connColor = this.config.colors[specialization];
        }
        
        // Create path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // Calculate control points for curved path
        const x1 = sourceNode.position.x;
        const y1 = sourceNode.position.y;
        const x2 = targetNode.position.x;
        const y2 = targetNode.position.y;
        
        // Use straight lines for now, we'll curve them if needed
        const d = `M ${x1} ${y1} L ${x2} ${y2}`;
        
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-width", 2);
        path.setAttribute("data-source", conn.source);
        path.setAttribute("data-target", conn.target);
        path.setAttribute("data-state", state);
        
        // Apply appropriate styling based on state
        if (state === 'active') {
          path.setAttribute("stroke", connColor);
          path.setAttribute("stroke-opacity", "0.9");
          path.setAttribute("stroke-dasharray", "none");
          
          // Add particles to this connection if it's active
          this._addParticlesToConnection(sourceNode, targetNode, connColor);
        } else if (state === 'available') {
          path.setAttribute("stroke", connColor);
          path.setAttribute("stroke-opacity", "0.6");
          path.setAttribute("stroke-dasharray", "5,3");
        } else {
          path.setAttribute("stroke", "#444444");
          path.setAttribute("stroke-opacity", "0.3");
          path.setAttribute("stroke-dasharray", "3,3");
        }
        
        this.connectionsGroup.appendChild(path);
      });
    }
    
    /**
     * Draw skill tree nodes
     * @private
     */
    _drawNodes() {
      this.nodes.forEach(node => {
        if (!node.position) {
          console.warn(`Node ${node.id} has no position`);
          return;
        }
        
        // Determine node state
        let state = 'locked';
        if (this.unlocked.includes(node.id)) {
          state = 'unlocked';
        } else if (this.available.includes(node.id)) {
          state = 'available';
        }
        
        // Get specialization and node size
        const specialization = node.specialization || 'core';
        const nodeType = (node.visual && node.visual.size) || 'minor';
        
        // Get base radius for this node type
        const baseRadius = this.config.baseNodeRadius[nodeType] || 15;
        
        // Create node group
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `skill-node node-${state} ${specialization}-node ${nodeType}-node`);
        g.setAttribute("data-node-id", node.id);
        g.setAttribute("transform", `translate(${node.position.x}, ${node.position.y})`);
        
        // Create node circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", 0);
        circle.setAttribute("cy", 0);
        circle.setAttribute("r", baseRadius);
        
        // Apply visual styles based on state and specialization
        let fillColor = "#333333";
        let strokeColor = "#666666";
        let strokeWidth = 1;
        let filterUrl = "";
        
        if (specialization && this.config.colors[specialization]) {
          if (state === 'unlocked') {
            fillColor = this.config.colors[specialization];
            strokeColor = "#FFFFFF";
            strokeWidth = 2;
            filterUrl = `url(#${specialization}-glow)`;
          } else if (state === 'available') {
            fillColor = this.config.colors[specialization] + "80"; // 50% opacity
            strokeColor = "#AAAAAA";
            strokeWidth = 2;
          } else {
            fillColor = "#333333";
            strokeColor = this.config.colors[specialization] + "40"; // 25% opacity
            strokeWidth = 1;
          }
        }
        
        // Check if this is the selected node
        if (this.selectedNode === node.id) {
          strokeColor = "#FFFFFF";
          strokeWidth = 3;
        }
        
        // Apply styles
        circle.setAttribute("fill", fillColor);
        circle.setAttribute("stroke", strokeColor);
        circle.setAttribute("stroke-width", strokeWidth);
        
        if (filterUrl && state === 'unlocked') {
          circle.setAttribute("filter", filterUrl);
        }
        
        g.appendChild(circle);
        
        // Add icon or symbol if available
        if (node.visual && node.visual.icon) {
          this._addNodeIcon(g, node.visual.icon, state);
        }
        
        // Add node label (only for major/core nodes or when zoomed in)
        if (nodeType === 'core' || nodeType === 'major') {
          const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("x", 0);
          label.setAttribute("y", baseRadius + 12);
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("fill", "#FFFFFF");
          label.setAttribute("font-size", "10");
          label.setAttribute("class", "node-label");
          label.textContent = node.name;
          g.appendChild(label);
        }
        
        // Add pulse animation for available nodes
        if (state === 'available') {
          const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          pulse.setAttribute("cx", 0);
          pulse.setAttribute("cy", 0);
          pulse.setAttribute("r", baseRadius);
          pulse.setAttribute("fill", "none");
          pulse.setAttribute("stroke", this.config.colors[specialization] || "#FFFFFF");
          pulse.setAttribute("stroke-width", 1);
          pulse.setAttribute("class", "node-pulse");
          
          // Add CSS-based pulse animation
          pulse.style.animation = `pulse-node 2s infinite`;
          
          g.appendChild(pulse);
        }
        
        // Add event listeners for interaction
        g.addEventListener("mouseenter", () => this._handleNodeHover(node, true));
        g.addEventListener("mouseleave", () => this._handleNodeHover(node, false));
        g.addEventListener("click", () => this._handleNodeClick(node));
        
        this.nodesGroup.appendChild(g);
      });
    }
    
    /**
     * Add an icon to a node
     * @private
     * @param {SVGElement} nodeGroup - Node group element
     * @param {String} iconType - Icon identifier
     * @param {String} state - Node state
     */
    _addNodeIcon(nodeGroup, iconType, state) {
      // Map of icon types to symbols/characters
      const iconMap = {
        'atom': '⚛',
        'brain': '🧠',
        'radiation': '☢',
        'star': '★',
        'chart': '📊',
        'book': '📚',
        'lightbulb': '💡',
        'eye': '👁',
        'shuffle': '🔄',
        'heart': '❤',
        'stethoscope': '⚕',
        'target': '🎯',
        'message': '💬',
        'clock': '⏰',
        'users': '👥',
        'shield': '🛡',
        'file-text': '📄',
        'tool': '🔧',
        'cpu': '🖥',
        'settings': '⚙',
        'check-circle': '✓',
        'zap': '⚡',
        'dollar-sign': '💲',
        'layers': '📋',
        'book-open': '📖',
        'award': '🏆',
        'flask': '🧪',
        'user-plus': '👤+',
        'presentation': '📊',
        'x-ray': '🔍',
        'activity': '📈',
        'clipboard': '📋',
        'database': '🗄',
        'help': '?'
      };
      
      // Get icon or fallback to question mark
      const iconChar = iconMap[iconType] || '?';
      
      // Create text element for icon
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
      icon.setAttribute("x", 0);
      icon.setAttribute("y", 0);
      icon.setAttribute("text-anchor", "middle");
      icon.setAttribute("dominant-baseline", "central");
      icon.setAttribute("fill", state === 'locked' ? "#888888" : "#FFFFFF");
      icon.setAttribute("font-size", "12");
      icon.setAttribute("class", "node-icon");
      icon.setAttribute("pointer-events", "none");
      icon.textContent = iconChar;
      
      nodeGroup.appendChild(icon);
    }
    
    /**
     * Add particles to an active connection
     * @private
     * @param {Object} sourceNode - Source node
     * @param {Object} targetNode - Target node
     * @param {String} color - Connection color
     */
    _addParticlesToConnection(sourceNode, targetNode, color) {
      // Store connection info for animation system
      this.particles.push({
        source: { x: sourceNode.position.x, y: sourceNode.position.y },
        target: { x: targetNode.position.x, y: targetNode.position.y },
        color: color,
        active: true
      });
    }
    
    /**
     * Handle node hover events
     * @private
     * @param {Object} node - Node data
     * @param {Boolean} isEntering - Whether mouse is entering (true) or leaving (false)
     */
    _handleNodeHover(node, isEntering) {
      // Update node highlighting
      const nodeElement = this.svg.querySelector(`[data-node-id="${node.id}"]`);
      
      if (nodeElement) {
        // Update visual state
        if (isEntering) {
          nodeElement.classList.add("node-hover");
          
          // Show tooltip
          this._showNodeTooltip(node);
        } else {
          nodeElement.classList.remove("node-hover");
          
          // Hide tooltip
          this._hideNodeTooltip();
        }
      }
    }
    
    /**
     * Show node tooltip
     * @private
     * @param {Object} node - Node data
     */
    _showNodeTooltip(node) {
      if (!this.toolTip) return;
      
      // Get node position relative to container
      const svgRect = this.svg.getBoundingClientRect();
      const x = node.position.x * this.scale + this.offsetX + svgRect.left;
      const y = node.position.y * this.scale + this.offsetY + svgRect.top;
      
      // Build tooltip content
      let tooltipContent = `
        <div class="tooltip-header">
          <h3>${node.name}</h3>
          <span class="tooltip-type">${node.specialization || 'Core'} - Tier ${node.tier || 0}</span>
        </div>
        <div class="tooltip-body">
          <p>${node.description}</p>
      `;
      
      // Add effects if available
      if (node.effects && node.effects.length > 0) {
        tooltipContent += `<div class="tooltip-effects"><h4>Effects:</h4><ul>`;
        
        node.effects.forEach(effect => {
          tooltipContent += `<li>${this._formatEffectDescription(effect)}</li>`;
        });
        
        tooltipContent += `</ul></div>`;
      }
      
      // Add cost information
      if (node.cost) {
        tooltipContent += `
          <div class="tooltip-cost">
            <span>Cost: ${node.cost.reputation || 0} Reputation, ${node.cost.skill_points || 0} Skill Points</span>
          </div>
        `;
      }
      
      tooltipContent += `</div>`;
      
      // Update tooltip content and position
      this.toolTip.innerHTML = tooltipContent;
      this.toolTip.style.left = `${x + 20}px`;
      this.toolTip.style.top = `${y}px`;
      this.toolTip.style.display = "block";
    }
    
    /**
     * Format effect description for tooltip
     * @private
     * @param {Object} effect - Effect data
     * @returns {String} Formatted description
     */
    _formatEffectDescription(effect) {
      let description = "";
      
      // Handle different effect types
      switch (effect.type) {
        case "insight_gain_multiplier":
          description = `${effect.value}x Insight Gain`;
          break;
        case "insight_gain_flat":
          description = `+${effect.value} Insight`;
          break;
        case "patient_outcome_multiplier":
          description = `+${Math.round((effect.value - 1) * 100)}% Patient Outcome Rating`;
          break;
        case "critical_insight_multiplier":
          description = `${effect.value}x Critical Insight Bonus`;
          break;
        default:
          description = `${effect.type}: ${effect.value}`;
      }
      
      // Add condition if present
      if (effect.condition) {
        description += ` (when ${effect.condition})`;
      }
      
      return description;
    }
    
    /**
     * Hide node tooltip
     * @private
     */
    _hideNodeTooltip() {
      if (this.toolTip) {
        this.toolTip.style.display = "none";
      }
    }
    
    /**
     * Handle node click events
     * @private
     * @param {Object} node - Node data
     */
    _handleNodeClick(node) {
      console.log(`Node clicked: ${node.id}`);
      
      // Track selected node
      this.selectedNode = node.id;
      
      // Trigger custom event
      const event = new CustomEvent("skillNodeSelected", {
        detail: { nodeId: node.id }
      });
      
      this.container.dispatchEvent(event);
      
      // Update visuals
      this.render();
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
      // Pan and zoom interaction
      this.svg.addEventListener("mousedown", (e) => {
        if (e.button === 0) { // Left mouse button
          this.isDragging = true;
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          this.svg.style.cursor = "grabbing";
        }
      });
      
      window.addEventListener("mousemove", (e) => {
        if (this.isDragging) {
          const dx = e.clientX - this.dragStartX;
          const dy = e.clientY - this.dragStartY;
          
          this.offsetX += dx;
          this.offsetY += dy;
          
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          
          this._applyTransform();
        }
      });
      
      window.addEventListener("mouseup", () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.svg.style.cursor = "grab";
        }
      });
      
      // Zoom on wheel
      this.svg.addEventListener("wheel", (e) => {
        e.preventDefault();
        
        // Calculate zoom factor
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(2.0, this.scale + delta));
        
        // Get mouse position relative to SVG
        const svgRect = this.svg.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left - this.offsetX;
        const mouseY = e.clientY - svgRect.top - this.offsetY;
        
        // Adjust offset to zoom toward mouse position
        this.offsetX -= mouseX * (newScale - this.scale) / this.scale;
        this.offsetY -= mouseY * (newScale - this.scale) / this.scale;
        
        this.scale = newScale;
        
        this._applyTransform();
      });
    }
    
    /**
     * Apply transform to SVG elements
     * @private
     */
    _applyTransform() {
      const transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      
      this.orbitalGroup.style.transform = transform;
      this.connectionsGroup.style.transform = transform;
      this.nodesGroup.style.transform = transform;
      this.particlesGroup.style.transform = transform;
      this.effectsGroup.style.transform = transform;
    }
    
    /**
     * Start animation loop
     * @private
     */
    _startAnimationLoop() {
      // Cancel any existing animation
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      
      const animate = (timestamp) => {
        // Update particle animations
        this._updateParticles(timestamp);
        
        // Continue animation loop
        this.animationFrameId = requestAnimationFrame(animate);
      };
      
      // Start animation loop
      this.animationFrameId = requestAnimationFrame(animate);
    }
    
    /**
     * Update particle effects
     * @private
     * @param {Number} timestamp - Animation timestamp
     */
    _updateParticles(timestamp) {
      // Clear particles
      this.particlesGroup.innerHTML = '';
      
      // Check if it's time to create new particles
      if (timestamp - this.lastParticleTime > 300) { // Create particles every 300ms
        this.lastParticleTime = timestamp;
        
        // Create new particles for active connections
        this.particles.forEach(connection => {
          if (!connection.active) return;
          
          // Create particle
          const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          
          // Get random position along the connection line
          const progress = Math.random();
          const x = connection.source.x + (connection.target.x - connection.source.x) * progress;
          const y = connection.source.y + (connection.target.y - connection.source.y) * progress;
          
          // Set particle attributes
          particle.setAttribute("cx", x);
          particle.setAttribute("cy", y);
          particle.setAttribute("r", 2 + Math.random() * 2);
          particle.setAttribute("fill", connection.color);
          particle.setAttribute("filter", "url(#particle-blur)");
          particle.setAttribute("opacity", 0.7);
          
          // Add custom properties for animation
          particle.dataset.sourceX = connection.source.x;
          particle.dataset.sourceY = connection.source.y;
          particle.dataset.targetX = connection.target.x;
          particle.dataset.targetY = connection.target.y;
          particle.dataset.progress = progress;
          particle.dataset.speed = 0.005 + Math.random() * 0.01;
          
          this.particlesGroup.appendChild(particle);
        });
      }
      
      // Animate existing particles
      const particles = Array.from(this.particlesGroup.querySelectorAll("circle"));
      
      particles.forEach(particle => {
        // Get animation parameters
        let progress = parseFloat(particle.dataset.progress);
        const speed = parseFloat(particle.dataset.speed);
        const sourceX = parseFloat(particle.dataset.sourceX);
        const sourceY = parseFloat(particle.dataset.sourceY);
        const targetX = parseFloat(particle.dataset.targetX);
        const targetY = parseFloat(particle.dataset.targetY);
        
        // Update progress
        progress += speed;
        
        if (progress >= 1) {
          // Remove particle when it reaches the end
          this.particlesGroup.removeChild(particle);
        } else {
          // Update position
          const x = sourceX + (targetX - sourceX) * progress;
          const y = sourceY + (targetY - sourceY) * progress;
          
          particle.setAttribute("cx", x);
          particle.setAttribute("cy", y);
          particle.dataset.progress = progress;
          
          // Fade out near the end
          if (progress > 0.8) {
            particle.setAttribute("opacity", (1 - progress) * 3.5);
          }
        }
      });
    }
    
    /**
     * Zoom the canvas by a delta amount
     * @param {Number} delta - Amount to change zoom (positive for zoom in, negative for zoom out)
     */
    zoomCanvas(delta) {
      const newScale = Math.max(0.5, Math.min(2.0, this.scale + delta));
      this.scale = newScale;
      this._applyTransform();
    }
    
    /**
     * Reset the view to the original position and scale
     */
    resetView() {
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this._applyTransform();
    }
    
    /**
     * Get the current selected node ID
     * @returns {String|null} Selected node ID or null if none selected
     */
    getSelectedNode() {
      return this.selectedNode;
    }
    
    /**
     * Set selected node
     * @param {String} nodeId - Node ID to select
     */
    setSelectedNode(nodeId) {
      this.selectedNode = nodeId;
      this.render();
    }
    
    /**
     * Update unlocked and available nodes
     * @param {Array} unlockedNodes - Array of unlocked node IDs
     * @param {Array} availableNodes - Array of available node IDs
     */
    updateNodeStates(unlockedNodes, availableNodes) {
      this.unlocked = unlockedNodes;
      this.available = availableNodes;
      this.render();
    }
  }
  
  // Export the renderer
  export default AtomicSkillTreeRenderer;