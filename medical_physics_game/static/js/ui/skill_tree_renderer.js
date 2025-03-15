// skill_tree_renderer.js - Renders the skill tree visualization

const SkillTreeRenderer = {
  // Configuration settings
  config: {
    container: null,          // DOM container element
    width: 800,               // Canvas width
    height: 800,              // Canvas height
    nodeSize: {               // Node size by type
      core: 30,
      major: 18,
      minor: 15,
      connector: 20
    },
    padding: 50,              // Padding around the canvas
    zoomLevel: 1,             // Current zoom level
    maxZoom: 2,               // Maximum zoom level
    minZoom: 0.5,             // Minimum zoom level
    panOffset: { x: 0, y: 0 }, // Pan offset
    highlightedNodes: [],     // Currently highlighted nodes
    selectedNode: null,       // Currently selected node
    hoveredNode: null,        // Currently hovered node
    specializationOpacity: 1.0, // Opacity for non-active specializations
    showLabels: true,         // Whether to show node labels
    animationSpeed: 300,      // Animation speed in ms
    theme: {
      background: '#0A0E1A',
      orbitalRings: '#2A3A5C',
      connectionDefault: '#4A5A7C',
      nodeStrokeDefault: '#FFFFFF',
      nodeStrokeWidth: 2,
      nodeStrokeSelected: '#FFD700',
      nodeStrokeHighlighted: '#FFFFFF',
      textColor: '#FFFFFF',
      specializationColors: {
        theory: '#4287f5',    // Blue
        clinical: '#42f575',  // Green
        technical: '#f59142', // Orange
        research: '#a142f5',  // Purple
        connector: '#f5d442', // Yellow
        null: '#4682B4'       // Core physics (null specialization)
      },
      nodeStateColors: {
        locked: '#555555',
        unlockable: '#888888',
        unlocked: '#BBBBBB',  
        active: '#FFFFFF'
      }
    }
  },
  
  // SVG namespace
  svgNS: 'http://www.w3.org/2000/svg',
  
  // SVG elements
  svg: null,
  nodesGroup: null,
  connectionsGroup: null,
  orbitalRingsGroup: null,
  labelsGroup: null,
  uiGroup: null,
  
  // Cached data
  nodes: {},
  connections: [],
  specializations: {},
  
  // Initialize the renderer
  initialize: function(containerId, options = {}) {
    console.log(`Initializing skill tree renderer in container: ${containerId}`);
    
    // Get container
    this.config.container = document.getElementById(containerId);
    if (!this.config.container) {
      ErrorHandler.handleError(
        new Error(`Container not found: ${containerId}`),
        "Skill Tree Renderer",
        ErrorHandler.SEVERITY.ERROR
      );
      return false;
    }
    
    // Apply options
    Object.assign(this.config, options);
    
    // Create SVG element
    this.createSVG();
    
    // Set up event listeners
    this.setupEventListeners();
    
    return true;
  },
  
  // Create the SVG canvas
  createSVG: function() {
    // Clear container
    this.config.container.innerHTML = '';
    
    // Create SVG element
    this.svg = document.createElementNS(this.svgNS, 'svg');
    this.svg.setAttribute('width', this.config.width);
    this.svg.setAttribute('height', this.config.height);
    this.svg.setAttribute('viewBox', `0 0 ${this.config.width} ${this.config.height}`);
    this.svg.style.background = this.config.theme.background;
    
    // Create groups for organization and layering
    this.orbitalRingsGroup = document.createElementNS(this.svgNS, 'g');
    this.orbitalRingsGroup.setAttribute('class', 'orbital-rings');
    
    this.connectionsGroup = document.createElementNS(this.svgNS, 'g');
    this.connectionsGroup.setAttribute('class', 'connections');
    
    this.nodesGroup = document.createElementNS(this.svgNS, 'g');
    this.nodesGroup.setAttribute('class', 'nodes');
    
    this.labelsGroup = document.createElementNS(this.svgNS, 'g');
    this.labelsGroup.setAttribute('class', 'labels');
    
    this.uiGroup = document.createElementNS(this.svgNS, 'g');
    this.uiGroup.setAttribute('class', 'ui');
    
    // Add groups to SVG in correct order (back to front)
    this.svg.appendChild(this.orbitalRingsGroup);
    this.svg.appendChild(this.connectionsGroup);
    this.svg.appendChild(this.nodesGroup);
    this.svg.appendChild(this.labelsGroup);
    this.svg.appendChild(this.uiGroup);
    
    // Add SVG to container
    this.config.container.appendChild(this.svg);
    
    console.log("SVG canvas created");
  },
  
  // Set up event listeners for interaction
  setupEventListeners: function() {
    // Pan events with mouse drag
    let dragging = false;
    let lastX, lastY;
    
    this.svg.addEventListener('mousedown', (e) => {
      // Only start drag if not on a node
      if (e.target.classList.contains('node')) return;
      
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      this.svg.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      
      this.config.panOffset.x += dx / this.config.zoomLevel;
      this.config.panOffset.y += dy / this.config.zoomLevel;
      
      this.applyTransform();
      
      lastX = e.clientX;
      lastY = e.clientY;
    });
    
    document.addEventListener('mouseup', () => {
      dragging = false;
      this.svg.style.cursor = 'default';
    });
    
    // Zoom with mouse wheel
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      // Get mouse position relative to SVG
      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Change zoom level
      const zoomDelta = -e.deltaY * 0.001;
      const newZoom = Math.max(
        this.config.minZoom,
        Math.min(
          this.config.maxZoom,
          this.config.zoomLevel + zoomDelta
        )
      );
      
      // Adjust pan offset to zoom toward mouse position
      if (newZoom !== this.config.zoomLevel) {
        const zoomRatio = newZoom / this.config.zoomLevel;
        
        // Calculate the world-coordinates for the mouse position before zoom
        const oldWorldX = (mouseX - this.config.panOffset.x) / this.config.zoomLevel;
        const oldWorldY = (mouseY - this.config.panOffset.y) / this.config.zoomLevel;
        
        // Calculate the screen-coordinates for the mouse position after zoom
        const newScreenX = oldWorldX * newZoom;
        const newScreenY = oldWorldY * newZoom;
        
        // Adjust pan offset so mouse stays over the same world position
        this.config.panOffset.x += mouseX - (this.config.panOffset.x + newScreenX);
        this.config.panOffset.y += mouseY - (this.config.panOffset.y + newScreenY);
        
        this.config.zoomLevel = newZoom;
        this.applyTransform();
      }
    });
    
    // Double-click to reset view
    this.svg.addEventListener('dblclick', (e) => {
      // Only reset if not on a node
      if (e.target.classList.contains('node')) return;
      
      this.resetView();
    });
  },
  
  // Apply pan and zoom transform
  applyTransform: function() {
    const transform = `translate(${this.config.panOffset.x}px, ${this.config.panOffset.y}px) scale(${this.config.zoomLevel})`;
    
    this.orbitalRingsGroup.style.transform = transform;
    this.connectionsGroup.style.transform = transform;
    this.nodesGroup.style.transform = transform;
    this.labelsGroup.style.transform = transform;
  },
  
  // Reset view to default
  resetView: function() {
    this.config.zoomLevel = 1;
    this.config.panOffset = { x: 0, y: 0 };
    this.applyTransform();
  },
  
  // Load skill tree data and render
  loadSkillTree: function(data) {
    console.log("Loading skill tree data");
    
    // Cache data
    this.nodes = data.nodes || {};
    this.connections = data.connections || [];
    this.specializations = data.specializations || {};
    
    // Clear existing tree
    this.clearTree();
    
    // Draw tree
    this.drawOrbitalRings();
    this.drawConnections();
    this.drawNodes();
    this.drawLabels();
    
    console.log("Skill tree rendered");
    
    return true;
  },
  
  // Clear the tree visualization
  clearTree: function() {
    this.orbitalRingsGroup.innerHTML = '';
    this.connectionsGroup.innerHTML = '';
    this.nodesGroup.innerHTML = '';
    this.labelsGroup.innerHTML = '';
  },
  
  // Draw orbital rings for visual organization
  drawOrbitalRings: function() {
    console.log("Drawing orbital rings");
    
    // Find max tier to determine number of rings
    let maxTier = 0;
    Object.values(this.nodes).forEach(node => {
      if (node.tier > maxTier) maxTier = node.tier;
    });
    
    // Draw rings for each tier
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const ringStep = Math.min(this.config.width, this.config.height) / (maxTier * 2 + 4);
    
    for (let tier = 0; tier <= maxTier; tier++) {
      const ring = document.createElementNS(this.svgNS, 'circle');
      
      ring.setAttribute('cx', centerX);
      ring.setAttribute('cy', centerY);
      ring.setAttribute('r', (tier + 1) * ringStep);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', this.config.theme.orbitalRings);
      ring.setAttribute('stroke-width', '1');
      
      this.orbitalRingsGroup.appendChild(ring);
    }
  },
  
  // Draw connections between nodes
  drawConnections: function() {
    console.log("Drawing connections between nodes");
    
    this.connections.forEach(connection => {
      const sourceNode = this.nodes[connection.source];
      const targetNode = this.nodes[connection.target];
      
      if (!sourceNode || !targetNode) {
        console.warn(`Invalid connection: ${connection.source} -> ${connection.target}`);
        return;
      }
      
      // Create line element
      const line = document.createElementNS(this.svgNS, 'line');
      
      // Set attributes
      line.setAttribute('x1', sourceNode.position.x);
      line.setAttribute('y1', sourceNode.position.y);
      line.setAttribute('x2', targetNode.position.x);
      line.setAttribute('y2', targetNode.position.y);
      
      // Determine connection style based on specialization
      let strokeColor = this.config.theme.connectionDefault;
      let strokeWidth = 1.5;
      let strokeDasharray = '';
      
      // Use proper color if nodes have the same specialization
      if (sourceNode.specialization && 
          sourceNode.specialization === targetNode.specialization) {
        strokeColor = this.config.theme.specializationColors[sourceNode.specialization];
        strokeWidth = 2;
      }
      
      // Special styling for connector specialization links
      if (sourceNode.specialization !== targetNode.specialization &&
          (sourceNode.specialization === 'connector' || targetNode.specialization === 'connector')) {
        strokeDasharray = '5,3';
        strokeColor = this.config.theme.specializationColors.connector;
      }
      
      // Apply styling
      line.setAttribute('stroke', strokeColor);
      line.setAttribute('stroke-width', strokeWidth);
      
      if (strokeDasharray) {
        line.setAttribute('stroke-dasharray', strokeDasharray);
      }
      
      // Set class for easier selection
      line.setAttribute('class', `connection 
                                from-${connection.source} 
                                to-${connection.target}
                                spec-${sourceNode.specialization || 'core'}`);
      
      // Store node IDs for reference
      line.dataset.source = connection.source;
      line.dataset.target = connection.target;
      
      // Add to connections group
      this.connectionsGroup.appendChild(line);
    });
  },
  
  // Draw skill nodes
  drawNodes: function() {
    console.log("Drawing skill nodes");
    
    Object.values(this.nodes).forEach(node => {
      // Create circle element
      const circle = document.createElementNS(this.svgNS, 'circle');
      
      // Set position
      circle.setAttribute('cx', node.position.x);
      circle.setAttribute('cy', node.position.y);
      
      // Set size based on node type
      const nodeSize = this.config.nodeSize[node.visual?.size || 'minor'];
      circle.setAttribute('r', nodeSize);
      
      // Set fill color based on specialization and state
      const specializationColor = this.config.theme.specializationColors[node.specialization || 'null'];
      const stateColor = this.config.theme.nodeStateColors[node.state || 'locked'];
      
      // Darken color for locked/unlockable states
      let fillColor = specializationColor;
      if (node.state === 'locked' || node.state === 'unlockable') {
        // Create darker version of specialization color
        const colorObj = this.hexToRgb(specializationColor);
        const darkenFactor = node.state === 'locked' ? 0.3 : 0.5;
        fillColor = `rgb(${colorObj.r * darkenFactor}, ${colorObj.g * darkenFactor}, ${colorObj.b * darkenFactor})`;
      }
      
      circle.setAttribute('fill', fillColor);
      
      // Set stroke based on state
      let strokeColor = this.config.theme.nodeStrokeDefault;
      let strokeWidth = this.config.theme.nodeStrokeWidth;
      
      if (node.id === this.config.selectedNode) {
        strokeColor = this.config.theme.nodeStrokeSelected;
        strokeWidth = 3;
      } else if (this.config.highlightedNodes.includes(node.id)) {
        strokeColor = this.config.theme.nodeStrokeHighlighted;
        strokeWidth = 3;
      }
      
      circle.setAttribute('stroke', strokeColor);
      circle.setAttribute('stroke-width', strokeWidth);
      
      // Set class for easier selection
      circle.setAttribute('class', `node 
                                node-${node.id} 
                                spec-${node.specialization || 'core'} 
                                state-${node.state || 'locked'} 
                                tier-${node.tier}`);
      
      // Store node ID for reference
      circle.dataset.nodeId = node.id;
      
      // Add event listeners for interaction
      circle.addEventListener('mouseenter', () => this.handleNodeHover(node.id, true));
      circle.addEventListener('mouseleave', () => this.handleNodeHover(node.id, false));
      circle.addEventListener('click', () => this.handleNodeClick(node.id));
      
      // Add to nodes group
      this.nodesGroup.appendChild(circle);
      
      // Add icon if specified
      if (node.visual?.icon) {
        this.addNodeIcon(node);
      }
    });
  },
  
  // Add icon to node
  addNodeIcon: function(node) {
    // Only support a few basic icons for now
    // This could be expanded with a proper icon system
    
    const iconMap = {
      'atom': '⚛',
      'brain': '🧠',
      'heart': '❤',
      'star': '★',
      'book': '📚',
      'chart': '📊',
      'lightbulb': '💡',
      'eye': '👁',
      'stethoscope': '🩺',
      'shield': '🛡',
      'target': '🎯',
      'clock': '🕒',
      'users': '👥',
      'tool': '🔧',
      'cpu': '💻',
      'settings': '⚙',
      'layers': '📑',
      'database': '🗄',
      'flask': '🧪',
      'award': '🏆',
      'dollar-sign': '💰',
      'presentation': '📊',
      'check-circle': '✓',
      'x-ray': '📷',
      'activity': '📈',
      'clipboard': '📋',
      'message': '💬',
      'file-text': '📄',
      'zap': '⚡',
      'shuffle': '🔄'
    };
    
    if (!iconMap[node.visual.icon]) return;
    
    // Create text element for icon
    const text = document.createElementNS(this.svgNS, 'text');
    
    // Position in center of node
    text.setAttribute('x', node.position.x);
    text.setAttribute('y', node.position.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    
    // Calculate font size based on node size
    const fontSize = this.config.nodeSize[node.visual?.size || 'minor'] * 0.8;
    text.setAttribute('font-size', fontSize);
    
    // Set color
    text.setAttribute('fill', this.config.theme.textColor);
    
    // Set class for easier selection
    text.setAttribute('class', `node-icon icon-${node.visual.icon}`);
    
    // Set text content with icon
    text.textContent = iconMap[node.visual.icon];
    
    // Add to nodes group
    this.nodesGroup.appendChild(text);
  },
  
  // Draw node labels
  drawLabels: function() {
    if (!this.config.showLabels) return;
    
    console.log("Drawing node labels");
    
    Object.values(this.nodes).forEach(node => {
      // Create text element
      const text = document.createElementNS(this.svgNS, 'text');
      
      // Position below node
      text.setAttribute('x', node.position.x);
      text.setAttribute('y', node.position.y + this.config.nodeSize[node.visual?.size || 'minor'] + 15);
      text.setAttribute('text-anchor', 'middle');
      
      // Set styling
      text.setAttribute('fill', this.config.theme.textColor);
      text.setAttribute('font-size', '12');
      text.setAttribute('class', `node-label label-${node.id}`);
      
      // Set text content
      text.textContent = node.name;
      
      // Make labels for locked nodes fainter
      if (node.state === 'locked') {
        text.setAttribute('opacity', '0.5');
      }
      
      // Add to labels group
      this.labelsGroup.appendChild(text);
    });
  },
  
  // Handle node hover
  handleNodeHover: function(nodeId, isHovering) {
    if (isHovering) {
      this.config.hoveredNode = nodeId;
      
      // Highlight connected nodes
      this.highlightConnectedNodes(nodeId);
      
      // Show tooltip with node info
      this.showNodeTooltip(nodeId);
    } else {
      this.config.hoveredNode = null;
      
      // Remove highlights if not the selected node
      if (nodeId !== this.config.selectedNode) {
        this.clearHighlights();
      }
      
      // Hide tooltip
      this.hideNodeTooltip();
    }
  },
  
  // Handle node click
  handleNodeClick: function(nodeId) {
    console.log(`Node clicked: ${nodeId}`);
    
    // Set as selected node
    this.selectNode(nodeId);
    
    // Trigger custom event for skill tree interaction
    const event = new CustomEvent('skillNodeSelected', {
      detail: { nodeId: nodeId }
    });
    document.dispatchEvent(event);
  },
  
  // Select a node
  selectNode: function(nodeId) {
    // Deselect previous node
    if (this.config.selectedNode) {
      const prevNode = document.querySelector(`.node-${this.config.selectedNode}`);
      if (prevNode) {
        prevNode.setAttribute('stroke', this.config.theme.nodeStrokeDefault);
        prevNode.setAttribute('stroke-width', this.config.theme.nodeStrokeWidth);
      }
    }
    
    // Select new node
    this.config.selectedNode = nodeId;
    const newNode = document.querySelector(`.node-${nodeId}`);
    if (newNode) {
      newNode.setAttribute('stroke', this.config.theme.nodeStrokeSelected);
      newNode.setAttribute('stroke-width', '3');
    }
    
    // Highlight connected nodes
    this.highlightConnectedNodes(nodeId);
  },
  
  // Highlight nodes connected to the given node
  highlightConnectedNodes: function(nodeId) {
    // Clear previous highlights
    this.clearHighlights();
    
    // Find connected nodes
    const connectedNodeIds = this.getConnectedNodes(nodeId);
    
    // Highlight connections
    connectedNodeIds.forEach(connectedId => {
      // Highlight connection between nodes
      this.highlightConnection(nodeId, connectedId);
      
      // Add to highlighted nodes
      this.config.highlightedNodes.push(connectedId);
      
      // Update node stroke
      const connectedNode = document.querySelector(`.node-${connectedId}`);
      if (connectedNode) {
        connectedNode.setAttribute('stroke', this.config.theme.nodeStrokeHighlighted);
        connectedNode.setAttribute('stroke-width', '3');
      }
    });
  },
  
  // Highlight a connection between two nodes
  highlightConnection: function(nodeId1, nodeId2) {
    // Find the connection between the nodes (in either direction)
    const connection = document.querySelector(`.connection.from-${nodeId1}.to-${nodeId2}, .connection.from-${nodeId2}.to-${nodeId1}`);
    
    if (connection) {
      connection.setAttribute('stroke-width', '3');
      connection.setAttribute('stroke', this.config.theme.nodeStrokeHighlighted);
    }
  },
  
  // Clear all highlights
  clearHighlights: function() {
    // Reset connection styling
    document.querySelectorAll('.connection').forEach(connection => {
      const source = connection.dataset.source;
      const target = connection.dataset.target;
      
      const sourceNode = this.nodes[source];
      const targetNode = this.nodes[target];
      
      // Determine default connection style based on specialization
      let strokeColor = this.config.theme.connectionDefault;
      let strokeWidth = 1.5;
      let strokeDasharray = '';
      
      // Use proper color if nodes have the same specialization
      if (sourceNode.specialization && 
          sourceNode.specialization === targetNode.specialization) {
        strokeColor = this.config.theme.specializationColors[sourceNode.specialization];
        strokeWidth = 2;
      }
      
      // Special styling for connector specialization links
      if (sourceNode.specialization !== targetNode.specialization &&
          (sourceNode.specialization === 'connector' || targetNode.specialization === 'connector')) {
        strokeDasharray = '5,3';
        strokeColor = this.config.theme.specializationColors.connector;
      }
      
      // Apply styling
      connection.setAttribute('stroke', strokeColor);
      connection.setAttribute('stroke-width', strokeWidth);
      
      if (strokeDasharray) {
        connection.setAttribute('stroke-dasharray', strokeDasharray);
      } else {
        connection.removeAttribute('stroke-dasharray');
      }
    });
    
    // Reset node styling for previously highlighted nodes
    this.config.highlightedNodes.forEach(nodeId => {
      const node = document.querySelector(`.node-${nodeId}`);
      if (node && nodeId !== this.config.selectedNode) {
        node.setAttribute('stroke', this.config.theme.nodeStrokeDefault);
        node.setAttribute('stroke-width', this.config.theme.nodeStrokeWidth);
      }
    });
    
    // Clear highlighted nodes list
    this.config.highlightedNodes = [];
  },
  
  // Show tooltip with node information
  showNodeTooltip: function(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) return;
    
    // Remove any existing tooltip
    this.hideNodeTooltip();
    
    // Create tooltip group
    const tooltip = document.createElementNS(this.svgNS, 'g');
    tooltip.setAttribute('class', 'node-tooltip');
    
    // Position tooltip near node (adjust based on position to avoid going off-screen)
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    
    // Determine tooltip position (right side of node by default)
    let tooltipX = nodeX + this.config.nodeSize[node.visual?.size || 'minor'] + 10;
    let tooltipY = nodeY - 10;
    
    // Calculate tooltip dimensions
    const tooltipWidth = 200;
    const tooltipHeight = 140;
    
    // Check if tooltip would go off-screen and adjust
    if (tooltipX + tooltipWidth > this.config.width - this.config.padding) {
      tooltipX = nodeX - tooltipWidth - this.config.nodeSize[node.visual?.size || 'minor'] - 10;
    }
    
    // Create tooltip background
    const background = document.createElementNS(this.svgNS, 'rect');
    background.setAttribute('x', tooltipX);
    background.setAttribute('y', tooltipY);
    background.setAttribute('width', tooltipWidth);
    background.setAttribute('height', tooltipHeight);
    background.setAttribute('rx', '5');
    background.setAttribute('ry', '5');
    background.setAttribute('fill', 'rgba(0,0,0,0.8)');
    background.setAttribute('stroke', this.config.theme.specializationColors[node.specialization || 'null']);
    background.setAttribute('stroke-width', '2');
    
    tooltip.appendChild(background);
    
    // Add node name
    const nameText = document.createElementNS(this.svgNS, 'text');
    nameText.setAttribute('x', tooltipX + 10);
    nameText.setAttribute('y', tooltipY + 20);
    nameText.setAttribute('fill', this.config.theme.textColor);
    nameText.setAttribute('font-weight', 'bold');
    nameText.textContent = node.name;
    
    tooltip.appendChild(nameText);
    
    // Add specialization
    if (node.specialization) {
      const specializationText = document.createElementNS(this.svgNS, 'text');
      specializationText.setAttribute('x', tooltipX + 10);
      specializationText.setAttribute('y', tooltipY + 40);
      specializationText.setAttribute('fill', this.config.theme.specializationColors[node.specialization]);
      specializationText.setAttribute('font-style', 'italic');
      
      // Get specialization name from cached data
      const specName = this.specializations[node.specialization]?.name || node.specialization;
      specializationText.textContent = specName;
      
      tooltip.appendChild(specializationText);
    }
    
    // Add description
    const descriptionText = document.createElementNS(this.svgNS, 'text');
    descriptionText.setAttribute('x', tooltipX + 10);
    descriptionText.setAttribute('y', tooltipY + 60);
    descriptionText.setAttribute('fill', this.config.theme.textColor);
    
    // Wrap text to fit tooltip width
    const words = node.description.split(' ');
    let line = '';
    let lineNumber = 0;
    const lineHeight = 20;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      
      // If line would exceed tooltip width, create a new line
      if (testLine.length * 6 > tooltipWidth - 20) {
        // Add current line
        const tspan = document.createElementNS(this.svgNS, 'tspan');
        tspan.setAttribute('x', tooltipX + 10);
        tspan.setAttribute('y', tooltipY + 60 + lineNumber * lineHeight);
        tspan.textContent = line;
        descriptionText.appendChild(tspan);
        
        // Start new line
        line = word + ' ';
        lineNumber++;
      } else {
        line = testLine;
      }
    });
    
    // Add last line
    const tspan = document.createElementNS(this.svgNS, 'tspan');
    tspan.setAttribute('x', tooltipX + 10);
    tspan.setAttribute('y', tooltipY + 60 + lineNumber * lineHeight);
    tspan.textContent = line;
    descriptionText.appendChild(tspan);
    
    tooltip.appendChild(descriptionText);
    
    // Add cost information
    const costY = tooltipY + 120;
    const costText = document.createElementNS(this.svgNS, 'text');
    costText.setAttribute('x', tooltipX + 10);
    costText.setAttribute('y', costY);
    costText.setAttribute('fill', this.config.theme.textColor);
    
    // Show different text based on node state
    if (node.state === 'locked') {
      costText.textContent = `Cost: ${node.cost.reputation} Reputation`;
    } else if (node.state === 'unlockable') {
      costText.setAttribute('fill', '#FFD700');
      costText.textContent = `Unlock: ${node.cost.reputation} Reputation`;
    } else if (node.state === 'unlocked') {
      costText.setAttribute('fill', '#00FF00');
      costText.textContent = `Activate: ${node.cost.skill_points} Skill Points`;
    } else {
      costText.setAttribute('fill', '#00FF00');
      costText.textContent = `Active`;
    }
    
    tooltip.appendChild(costText);
    
    // Add tooltip to UI group
    this.uiGroup.appendChild(tooltip);
  },
  
  // Hide the node tooltip
  hideNodeTooltip: function() {
    const tooltip = this.uiGroup.querySelector('.node-tooltip');
    if (tooltip) {
      this.uiGroup.removeChild(tooltip);
    }
  },
  
  // Filter skill tree to show only specific specializations
  filterBySpecialization: function(specializationId = null) {
    // If no specialization specified, show all
    if (specializationId === null) {
      // Reset all opacities
      document.querySelectorAll('.node, .connection').forEach(element => {
        element.style.opacity = '1';
      });
      return;
    }
    
    // Apply filtering
    document.querySelectorAll('.node, .connection').forEach(element => {
      // Check if element belongs to the specified specialization
      const spec = element.classList.toString().match(/spec-([a-z_]+)/);
      
      if (spec && spec[1] === specializationId || spec && spec[1] === 'core') {
        // Show elements for selected specialization and core
        element.style.opacity = '1';
      } else {
        // Fade others
        element.style.opacity = this.config.specializationOpacity.toString();
      }
    });
  },
  
  // Get all nodes connected to the given node
  getConnectedNodes: function(nodeId) {
    const connectedNodes = [];
    
    // Find all connections from this node
    this.connections.forEach(connection => {
      if (connection.source === nodeId) {
        connectedNodes.push(connection.target);
      } else if (connection.target === nodeId) {
        connectedNodes.push(connection.source);
      }
    });
    
    return connectedNodes;
  },
  
  // Update node states
  updateNodeStates: function(nodeStates) {
    console.log("Updating node states");
    
    Object.keys(nodeStates).forEach(nodeId => {
      const state = nodeStates[nodeId];
      
      // Update local data
      if (this.nodes[nodeId]) {
        this.nodes[nodeId].state = state;
      }
      
      // Update DOM
      const nodeElement = document.querySelector(`.node-${nodeId}`);
      if (nodeElement) {
        // Remove old state class
        nodeElement.classList.forEach(className => {
          if (className.startsWith('state-')) {
            nodeElement.classList.remove(className);
          }
        });
        
        // Add new state class
        nodeElement.classList.add(`state-${state}`);
        
        // Update fill color
        const specializationColor = this.config.theme.specializationColors[this.nodes[nodeId]?.specialization || 'null'];
        
        if (state === 'locked' || state === 'unlockable') {
          // Create darker version of specialization color
          const colorObj = this.hexToRgb(specializationColor);
          const darkenFactor = state === 'locked' ? 0.3 : 0.5;
          const fillColor = `rgb(${colorObj.r * darkenFactor}, ${colorObj.g * darkenFactor}, ${colorObj.b * darkenFactor})`;
          nodeElement.setAttribute('fill', fillColor);
        } else {
          nodeElement.setAttribute('fill', specializationColor);
        }
      }
      
      // Update label opacity
      const labelElement = document.querySelector(`.label-${nodeId}`);
      if (labelElement) {
        labelElement.setAttribute('opacity', state === 'locked' ? '0.5' : '1');
      }
    });
  },
  
  // Utility: Convert hex color to RGB object
  hexToRgb: function(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex components
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }
};

// Export the SkillTreeRenderer object
window.SkillTreeRenderer = SkillTreeRenderer;
console.log("Loaded: skill_tree_renderer.js");