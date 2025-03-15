// skill_tree_renderer.js - Renders the skill tree visualization

const SkillTreeRenderer = {
  // Configuration
  config: {
    width: 800,
    height: 800,
    nodeRadius: {
      core: 30,
      major: 18,
      minor: 15,
      connector: 12
    },
    nodeSpacing: 120,
    orbitRadius: [75, 175, 275, 350],
    zoomLimits: {
      min: 0.5,
      max: 2.0
    },
    colors: {
      background: '#0A0E1A',
      orbits: '#2A3A5C',
      text: '#FFFFFF',
      textShadow: '#000000',
      tooltip: 'rgba(0, 0, 0, 0.8)',
      tooltipText: '#FFFFFF',
      connectionDefault: '#333333',
      nodeStroke: '#FFFFFF'
    },
    theme: 'dark'
  },
  
  // SVG elements
  svg: null,
  svgContainer: null,
  nodesGroup: null,
  connectionsGroup: null,
  labelsGroup: null,
  tooltipGroup: null,
  orbitsGroup: null,
  zoom: null,
  
  // State
  initialized: false,
  currentTransform: { k: 1, x: 0, y: 0 },
  selectedNode: null,
  hoveredNode: null,
  specializations: {},
  nodes: {},
  connections: [],
  nodeElements: {},
  
  // Initialize the renderer
  initialize: function(containerId, options = {}) {
    console.log(`Initializing skill tree renderer in container: ${containerId}`);
    
    // Apply options
    Object.assign(this.config, options);
    
    // Get container element
    this.svgContainer = document.getElementById(containerId);
    if (!this.svgContainer) {
      console.error(`Container element not found: ${containerId}`);
      return false;
    }
    
    // Create SVG element
    this.createSvgCanvas();
    
    // Set up zoom and pan behavior if d3 is available
    this.setupZoomAndPan();
    
    // Add event listeners
    this.setupEventListeners();
    
    this.initialized = true;
    
    return true;
  },
  
  // Create SVG canvas - improved
  createSvgCanvas: function() {
    // Clear existing content
    if (this.svg) {
      this.svgContainer.innerHTML = '';
    }
    
    // Create loading indicator
    const loading = document.createElement('div');
    loading.className = 'skill-tree-loading';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loading.appendChild(spinner);
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Loading skill tree...';
    loading.appendChild(loadingText);
    
    this.svgContainer.appendChild(loading);
    
    // Create SVG element
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', `0 0 ${this.config.width} ${this.config.height}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.setAttribute('class', 'skill-tree-svg');
    
    // Create main groups
    this.orbitsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.orbitsGroup.setAttribute('class', 'orbits-group');
    
    this.connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.connectionsGroup.setAttribute('class', 'connections-group');
    
    this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesGroup.setAttribute('class', 'nodes-group');
    
    this.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsGroup.setAttribute('class', 'labels-group');
    
    this.tooltipGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.tooltipGroup.setAttribute('class', 'tooltip-group');
    this.tooltipGroup.style.pointerEvents = 'none';
    
    // Append groups in correct order
    this.svg.appendChild(this.orbitsGroup);
    this.svg.appendChild(this.connectionsGroup);
    this.svg.appendChild(this.nodesGroup);
    this.svg.appendChild(this.labelsGroup);
    this.svg.appendChild(this.tooltipGroup);
    
    // Add SVG to container - insert before loading
    this.svgContainer.insertBefore(this.svg, loading);
    
    // Remove loading after a short delay
    setTimeout(() => {
      if (loading.parentNode === this.svgContainer) {
        this.svgContainer.removeChild(loading);
      }
    }, 1000);

    console.log('SVG canvas created');
  },
  
  // Set up zoom and pan behavior
  setupZoomAndPan: function() {
    // Check if d3 is available
    if (typeof d3 !== 'undefined') {
      // Create zoom behavior
      this.zoom = d3.zoom()
        .scaleExtent([this.config.zoomLimits.min, this.config.zoomLimits.max])
        .on('zoom', (event) => {
          this.currentTransform = event.transform;
          
          // Apply transform to all groups
          this.orbitsGroup.setAttribute('transform', event.transform);
          this.connectionsGroup.setAttribute('transform', event.transform);
          this.nodesGroup.setAttribute('transform', event.transform);
          this.labelsGroup.setAttribute('transform', event.transform);
          
          // Update labels visibility based on zoom level
          this.updateLabelsVisibility(event.transform.k);
        });
      
      // Apply zoom behavior to SVG
      d3.select(this.svg).call(this.zoom);
    } else {
      // Fallback to manual pan/zoom implementation if d3 is not available
      this.setupManualZoomAndPan();
    }
  },
  
  // Manual zoom and pan implementation without d3
  setupManualZoomAndPan: function() {
    let isDragging = false;
    let startX, startY;
    let lastX = 0, lastY = 0;
    let scale = 1;
    
    // Mouse wheel for zoom
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(
        this.config.zoomLimits.min,
        Math.min(this.config.zoomLimits.max, scale + delta)
      );
      
      const scaleChange = newScale / scale;
      scale = newScale;
      
      // Apply transform
      lastX = lastX * scaleChange;
      lastY = lastY * scaleChange;
      
      this.currentTransform = { k: scale, x: lastX, y: lastY };
      this.applyTransform();
      
      // Update labels visibility
      this.updateLabelsVisibility(scale);
    });
    
    // Mouse down for pan
    this.svg.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left mouse button
        isDragging = true;
        startX = e.clientX - lastX;
        startY = e.clientY - lastY;
        this.svg.style.cursor = 'grabbing';
      }
    });
    
    // Mouse move for pan
    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        lastX = e.clientX - startX;
        lastY = e.clientY - startY;
        
        this.currentTransform = { k: scale, x: lastX, y: lastY };
        this.applyTransform();
      }
    });
    
    // Mouse up to stop panning
    window.addEventListener('mouseup', () => {
      isDragging = false;
      this.svg.style.cursor = 'grab';
    });
    
    // Set initial cursor
    this.svg.style.cursor = 'grab';
  },
  
  // Apply transform to all groups
  applyTransform: function() {
    const transform = `translate(${this.currentTransform.x}, ${this.currentTransform.y}) scale(${this.currentTransform.k})`;
    
    this.orbitsGroup.setAttribute('transform', transform);
    this.connectionsGroup.setAttribute('transform', transform);
    this.nodesGroup.setAttribute('transform', transform);
    this.labelsGroup.setAttribute('transform', transform);
  },
  
  // Update labels visibility based on zoom level
  updateLabelsVisibility: function(zoomLevel) {
    const labels = this.labelsGroup.querySelectorAll('text');
    
    if (zoomLevel < 0.7) {
      // Hide all labels if zoom is too low
      labels.forEach(label => {
        label.style.opacity = '0';
      });
    } else {
      // Show labels with scaling opacity based on zoom
      const opacity = Math.min(1, (zoomLevel - 0.7) * 3.3);
      
      labels.forEach(label => {
        label.style.opacity = `${opacity}`;
      });
    }
  },
  
  // Set up event listeners
  setupEventListeners: function() {
    // Double-click to reset zoom
    this.svg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.resetZoom();
    });
    
    // Touch events for mobile
    if ('ontouchstart' in window) {
      this.setupTouchEvents();
    }
    
    // Window resize event
    window.addEventListener('resize', this.handleResize.bind(this));
  },
  
  // Reset zoom to default
  resetZoom: function() {
    if (typeof d3 !== 'undefined' && this.zoom) {
      d3.select(this.svg).transition().duration(750).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
    } else {
      this.currentTransform = { k: 1, x: 0, y: 0 };
      this.applyTransform();
      this.updateLabelsVisibility(1);
    }
  },
  
  // Handle window resize
  handleResize: function() {
    // Adjust viewBox if needed
    // Note: SVG with preserveAspectRatio should handle this automatically
  },
  
  // Improved load skill tree function with proper position calculations
  loadSkillTree: function(data) {
    console.log('Loading skill tree data');
    
    // Store data
    this.specializations = data.specializations || {};
    this.nodes = data.nodes || {};
    this.connections = data.connections || [];
    
    // Calculate proper positions if needed
    this._ensureNodePositions();
    
    // Render the tree
    this.renderSkillTree();
    
    // Center the view
    setTimeout(() => {
      this.centerView();
    }, 100);
    
    return true;
  },

  // Ensure all nodes have proper positions
  _ensureNodePositions: function() {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    // Group nodes by tier for orbital layout
    const nodesByTier = {};
    let maxTier = 0;
    
    // First pass - group nodes and find max tier
    Object.values(this.nodes).forEach(node => {
      const tier = node.tier || 0;
      maxTier = Math.max(maxTier, tier);
      
      if (!nodesByTier[tier]) {
        nodesByTier[tier] = [];
      }
      
      nodesByTier[tier].push(node);
    });
    
    // Make sure orbital radius array has enough entries
    while (this.config.orbitRadius.length <= maxTier) {
      const lastRadius = this.config.orbitRadius[this.config.orbitRadius.length - 1];
      const newRadius = lastRadius + 100;
      this.config.orbitRadius.push(newRadius);
    }
    
    // Second pass - calculate positions if needed
    Object.entries(nodesByTier).forEach(([tier, nodes]) => {
      const tierInt = parseInt(tier);
      
      // Core node (tier 0) goes in center
      if (tierInt === 0) {
        nodes.forEach(node => {
          if (!node.position) {
            node.position = { x: centerX, y: centerY };
          }
        });
        return;
      }
      
      // Get orbit radius for this tier
      const orbitRadius = this.config.orbitRadius[tierInt - 1];
      const count = nodes.length;
      
      // Calculate angle step based on number of nodes
      const angleStep = (Math.PI * 2) / count;
      
      // Position nodes around the orbit that don't have explicit positions
      nodes.forEach((node, index) => {
        if (!node.position) {
          // Calculate position based on angle
          const angle = index * angleStep;
          const x = centerX + Math.cos(angle) * orbitRadius;
          const y = centerY + Math.sin(angle) * orbitRadius;
          
          node.position = { x, y };
        }
      });
    });
  },
  // Add new method to center the view
  centerView: function() {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    // If d3 is available
    if (typeof d3 !== 'undefined' && this.zoom) {
      d3.select(this.svg).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(0.8)
      );
    } else {
      this.currentTransform = { k: 0.8, x: 0, y: 0 };
      this.applyTransform();
    }
  },

  // Render the entire skill tree
  renderSkillTree: function() {
    console.log('Rendering skill tree...');
    
    // Clear existing content
    this.orbitsGroup.innerHTML = '';
    this.connectionsGroup.innerHTML = '';
    this.nodesGroup.innerHTML = '';
    this.labelsGroup.innerHTML = '';
    this.tooltipGroup.innerHTML = '';
    
    // Reset collections
    this.nodeElements = {};
    
    // Draw orbits
    this.drawOrbitalRings();
    
    // Draw connections between nodes
    this.drawConnections();
    
    // Draw nodes
    this.drawNodes();
    
    // Draw labels
    this.drawNodeLabels();
    
    console.log('Skill tree rendered');
  },
  
  // Draw orbital rings
  drawOrbitalRings: function() {
    console.log('Drawing orbital rings');
    
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    // Draw each orbit
    this.config.orbitRadius.forEach(radius => {
      const orbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      orbit.setAttribute('cx', centerX);
      orbit.setAttribute('cy', centerY);
      orbit.setAttribute('r', radius);
      orbit.setAttribute('fill', 'none');
      orbit.setAttribute('stroke', this.config.colors.orbits);
      orbit.setAttribute('stroke-width', '1');
      orbit.setAttribute('stroke-opacity', '0.5');
      
      this.orbitsGroup.appendChild(orbit);
    });
  },
  
  // Draw connections between nodes
  drawConnections: function() {
    console.log('Drawing connections between nodes');
    
    // Create a map for quick node lookups
    const nodeMap = {};
    Object.values(this.nodes).forEach(node => {
      nodeMap[node.id] = node;
    });
    
    // Draw each connection
    this.connections.forEach(connection => {
      const sourceNode = nodeMap[connection.source];
      const targetNode = nodeMap[connection.target];
      
      if (!sourceNode || !targetNode) {
        console.warn(`Connection ${connection.source} -> ${connection.target} references missing node(s)`);
        return;
      }
      
      // Get node positions
      const sourceX = sourceNode.position?.x || 0;
      const sourceY = sourceNode.position?.y || 0;
      const targetX = targetNode.position?.x || 0;
      const targetY = targetNode.position?.y || 0;
      
      // Get specialization color
      let connectionColor = this.config.colors.connectionDefault;
      
      if (sourceNode.specialization && this.specializations[sourceNode.specialization]) {
        connectionColor = this.specializations[sourceNode.specialization].color;
      }
      
      // Create connection line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', sourceX);
      line.setAttribute('y1', sourceY);
      line.setAttribute('x2', targetX);
      line.setAttribute('y2', targetY);
      line.setAttribute('stroke', connectionColor);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-opacity', '0.6');
      line.setAttribute('class', `connection connection-${connection.source} connection-${connection.target}`);
      
      // Add data attributes
      line.dataset.source = connection.source;
      line.dataset.target = connection.target;
      
      this.connectionsGroup.appendChild(line);
    });
  },
  
  // Improved drawing of nodes with better visibility
  drawNodes: function() {
    console.log('Drawing skill nodes');
    
    // Draw each node
    Object.values(this.nodes).forEach(node => {
      // Get node properties
      const nodeSize = node.visual?.size || 'minor';
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      
      // Determine node color based on specialization
      let nodeColor = this.config.colors.connectionDefault;
      
      if (node.specialization && this.specializations[node.specialization]) {
        nodeColor = this.specializations[node.specialization].color;
      } else if (node.id === 'core_physics' || nodeSize === 'core') {
        nodeColor = this.config.colors.core || '#4682B4';
      }
      
      // Get radius based on node size
      const radius = this.config.nodeRadius[nodeSize] || this.config.nodeRadius.minor;
      
      // Create node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', nodeColor);
      
      // Set fill opacity based on state
      let fillOpacity = 0.7;
      switch (node.state) {
        case 'locked': fillOpacity = 0.3; break;
        case 'unlockable': fillOpacity = 0.6; break;
        case 'unlocked': fillOpacity = 0.8; break;
        case 'active': fillOpacity = 1.0; break;
      }
      
      circle.setAttribute('fill-opacity', fillOpacity);
      circle.setAttribute('stroke', this.config.colors.nodeStroke);
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', `node node-${node.id} node-${node.state} node-size-${nodeSize}`);
      
      // Add data attributes
      circle.dataset.nodeId = node.id;
      circle.dataset.nodeName = node.name;
      circle.dataset.nodeState = node.state;
      
      // Add event listeners
      circle.addEventListener('mouseenter', this.handleNodeMouseEnter.bind(this, node));
      circle.addEventListener('mouseleave', this.handleNodeMouseLeave.bind(this, node));
      circle.addEventListener('click', this.handleNodeClick.bind(this, node));
      
      // Add node to group
      this.nodesGroup.appendChild(circle);
      
      // Store node element for later reference
      this.nodeElements[node.id] = circle;
      
      // Create node icon if available
      if (node.visual?.icon) {
        this.createNodeIcon(node, x, y, radius);
      }
    });
  },
  
  // Create node icon
  createNodeIcon: function(node, x, y, radius) {
    const iconSize = radius * 0.7;
    
    // Create icon text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', iconSize);
    text.setAttribute('fill', this.config.colors.text);
    text.setAttribute('class', `node-icon node-icon-${node.id}`);
    text.style.pointerEvents = 'none';
    
    // Determine icon character
    let iconChar = '';
    
    // This is a simple mapping - in a real implementation, you'd use an icon font
    // or define a complete mapping of icon names to characters
    switch (node.visual.icon) {
      case 'atom': iconChar = '⚛'; break;
      case 'brain': iconChar = '🧠'; break;
      case 'radiation': iconChar = '☢'; break;
      case 'star': iconChar = '★'; break;
      case 'chart': iconChar = '📊'; break;
      case 'book': iconChar = '📚'; break;
      case 'lightbulb': iconChar = '💡'; break;
      case 'eye': iconChar = '👁'; break;
      case 'shuffle': iconChar = '🔄'; break;
      case 'heart': iconChar = '❤'; break;
      case 'stethoscope': iconChar = '⚕'; break;
      case 'target': iconChar = '🎯'; break;
      case 'message': iconChar = '💬'; break;
      case 'clock': iconChar = '⏰'; break;
      case 'users': iconChar = '👥'; break;
      case 'shield': iconChar = '🛡'; break;
      case 'file-text': iconChar = '📄'; break;
      case 'tool': iconChar = '🔧'; break;
      case 'cpu': iconChar = '🖥'; break;
      case 'settings': iconChar = '⚙'; break;
      case 'check-circle': iconChar = '✓'; break;
      case 'zap': iconChar = '⚡'; break;
      case 'dollar-sign': iconChar = '💲'; break;
      case 'layers': iconChar = '📋'; break;
      case 'book-open': iconChar = '📖'; break;
      case 'award': iconChar = '🏆'; break;
      case 'flask': iconChar = '🧪'; break;
      case 'user-plus': iconChar = '👤+'; break;
      case 'presentation': iconChar = '📊'; break;
      case 'x-ray': iconChar = '🔍'; break;
      case 'activity': iconChar = '📈'; break;
      case 'clipboard': iconChar = '📋'; break;
      case 'database': iconChar = '🗄'; break;
      default: iconChar = '?';
    }
    
    text.textContent = iconChar;
    
    // Add icon to nodes group
    this.nodesGroup.appendChild(text);
  },
  
  // Draw node labels
  drawNodeLabels: function() {
    console.log('Drawing node labels');
    
    // Draw label for each node
    Object.values(this.nodes).forEach(node => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      
      // Create label text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y + this.config.nodeRadius.minor + 15);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', this.config.colors.text);
      text.setAttribute('class', `node-label node-label-${node.id}`);
      text.style.pointerEvents = 'none';
      
      // Add text shadow for better readability
      text.style.textShadow = `1px 1px 2px ${this.config.colors.textShadow}`;
      
      // Set text content
      text.textContent = node.name;
      
      // Add label to group
      this.labelsGroup.appendChild(text);
    });
  },
  
  // Event Handlers
  
  // Handle node mouse enter
  handleNodeMouseEnter: function(node, event) {
    // Skip if tooltip is already visible for this node
    if (this.hoveredNode === node.id) return;
    
    this.hoveredNode = node.id;
    
    // Show tooltip
    this.showNodeTooltip(node);
    
    // Highlight node and connections
    this.highlightNodeAndConnections(node.id);
  },
  
  // Handle node mouse leave
  handleNodeMouseLeave: function(node, event) {
    this.hoveredNode = null;
    
    // Hide tooltip
    this.hideNodeTooltip();
    
    // Remove highlights, unless this node is selected
    if (this.selectedNode !== node.id) {
      this.unhighlightAll();
    }
  },
  
  // Handle node click
  handleNodeClick: function(node, event) {
    event.stopPropagation();
    
    // Set as selected node
    this.selectedNode = node.id;
    
    // Highlight node and connections
    this.highlightNodeAndConnections(node.id);
    
    // Trigger custom event
    const customEvent = new CustomEvent('skillNodeSelected', {
      detail: {
        nodeId: node.id,
        node: node
      }
    });
    
    document.dispatchEvent(customEvent);
  },
  
  // Show node tooltip
  showNodeTooltip: function(node) {
    // Clear existing tooltip
    this.tooltipGroup.innerHTML = '';
    
    const x = node.position?.x || 0;
    const y = node.position?.y || 0;
    
    // Create tooltip rectangle
    const tooltipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    tooltipRect.setAttribute('rx', '5');
    tooltipRect.setAttribute('ry', '5');
    tooltipRect.setAttribute('fill', this.config.colors.tooltip);
    
    // Create tooltip title
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', x);
    titleText.setAttribute('y', y - 40);
    titleText.setAttribute('text-anchor', 'middle');
    titleText.setAttribute('font-size', '14');
    titleText.setAttribute('font-weight', 'bold');
    titleText.setAttribute('fill', this.config.colors.tooltipText);
    titleText.textContent = node.name;
    
    // Create tooltip description
    const descText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    descText.setAttribute('x', x);
    descText.setAttribute('y', y - 20);
    descText.setAttribute('text-anchor', 'middle');
    descText.setAttribute('font-size', '12');
    descText.setAttribute('fill', this.config.colors.tooltipText);
    
    // Truncate description if too long
    const maxLength = 30;
    let description = node.description || '';
    if (description.length > maxLength) {
      description = description.substring(0, maxLength) + '...';
    }
    
    descText.textContent = description;
    
    // Create tooltip state text
    const stateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    stateText.setAttribute('x', x);
    stateText.setAttribute('y', y - 60);
    stateText.setAttribute('text-anchor', 'middle');
    stateText.setAttribute('font-size', '12');
    stateText.setAttribute('fill', this.config.colors.tooltipText);
    
    // Get state display text
    let stateDisplay = 'Unknown';
    switch (node.state) {
      case 'locked': stateDisplay = 'Locked'; break;
      case 'unlockable': stateDisplay = 'Can Unlock'; break;
      case 'unlocked': stateDisplay = 'Unlocked'; break;
      case 'active': stateDisplay = 'Active'; break;
    }
    
    stateText.textContent = stateDisplay;
    
    // Position tooltip background
    tooltipRect.setAttribute('x', x - 100);
    tooltipRect.setAttribute('y', y - 80);
    tooltipRect.setAttribute('width', 200);
    tooltipRect.setAttribute('height', 70);
    
    // Add elements to tooltip group
    this.tooltipGroup.appendChild(tooltipRect);
    this.tooltipGroup.appendChild(stateText);
    this.tooltipGroup.appendChild(titleText);
    this.tooltipGroup.appendChild(descText);
  },
  
  // Hide node tooltip
  hideNodeTooltip: function() {
    this.tooltipGroup.innerHTML = '';
  },
  
  // Highlight node and its connections
  highlightNodeAndConnections: function(nodeId) {
    // Reset all nodes and connections to normal state
    this.unhighlightAll();
    
    // Highlight the node
    const nodeElement = this.nodeElements[nodeId];
    if (nodeElement) {
      nodeElement.setAttribute('stroke-width', '3');
      nodeElement.style.filter = 'brightness(120%)';
    }
    
    // Find and highlight connections
    const connections = this.connectionsGroup.querySelectorAll(
      `.connection-${nodeId}`
    );
    
    connections.forEach(connection => {
      connection.setAttribute('stroke-width', '3');
      connection.style.strokeOpacity = '1';
      
      // Get the connected node ID
      const sourceId = connection.dataset.source;
      const targetId = connection.dataset.target;
      const connectedId = sourceId === nodeId ? targetId : sourceId;
      
      // Highlight the connected node
      const connectedElement = this.nodeElements[connectedId];
      if (connectedElement) {
        connectedElement.setAttribute('stroke-width', '3');
        connectedElement.style.filter = 'brightness(110%)';
      }
    });
  },
  
  // Remove all highlights
  unhighlightAll: function() {
    // Reset nodes
    Object.values(this.nodeElements).forEach(nodeElement => {
      nodeElement.setAttribute('stroke-width', '2');
      nodeElement.style.filter = '';
    });
    
    // Reset connections
    const connections = this.connectionsGroup.querySelectorAll('.connection');
    connections.forEach(connection => {
      connection.setAttribute('stroke-width', '2');
      connection.style.strokeOpacity = '0.6';
    });
  },
  
  // Update node states
  updateNodeStates: function(nodeStates) {
    console.log('Updating node states');
    
    // Update each node state
    Object.entries(nodeStates).forEach(([nodeId, state]) => {
      const nodeElement = this.nodeElements[nodeId];
      if (!nodeElement) return;
      
      // Update data attribute
      nodeElement.dataset.nodeState = state;
      
      // Remove old state classes
      nodeElement.classList.remove('node-locked', 'node-unlockable', 'node-unlocked', 'node-active');
      
      // Add new state class
      nodeElement.classList.add(`node-${state}`);
      
      // Update visual appearance based on state
      switch (state) {
        case 'locked':
          nodeElement.setAttribute('fill-opacity', '0.3');
          break;
        case 'unlockable':
          nodeElement.setAttribute('fill-opacity', '0.6');
          nodeElement.style.filter = 'brightness(110%)';
          break;
        case 'unlocked':
          nodeElement.setAttribute('fill-opacity', '0.8');
          break;
        case 'active':
          nodeElement.setAttribute('fill-opacity', '1');
          nodeElement.style.filter = 'brightness(120%)';
          break;
      }
    });
  },
  
  // Filter the tree by specialization
  filterBySpecialization: function(specializationId) {
    // If no specialization selected, show all nodes
    if (!specializationId) {
      Object.values(this.nodeElements).forEach(nodeElement => {
        nodeElement.style.opacity = '1';
      });
      
      // Show all connections
      const connections = this.connectionsGroup.querySelectorAll('.connection');
      connections.forEach(connection => {
        connection.style.opacity = '1';
      });
      
      // Show all labels
      const labels = this.labelsGroup.querySelectorAll('.node-label');
      labels.forEach(label => {
        label.style.opacity = '1';
      });
      
      return;
    }
    
    // Create a set to track nodes in this specialization and connected nodes
    const visibleNodes = new Set();
    
    // Add nodes of the selected specialization
    Object.values(this.nodes).forEach(node => {
      if (node.specialization === specializationId || node.id === 'core_physics') {
        visibleNodes.add(node.id);
      }
    });
    
    // Update visibility of nodes
    Object.entries(this.nodeElements).forEach(([nodeId, element]) => {
      if (visibleNodes.has(nodeId)) {
        element.style.opacity = '1';
      } else {
        element.style.opacity = '0.2';
      }
    });
    
    // Update visibility of connections
    const connections = this.connectionsGroup.querySelectorAll('.connection');
    connections.forEach(connection => {
      const sourceId = connection.dataset.source;
      const targetId = connection.dataset.target;
      
      if (visibleNodes.has(sourceId) && visibleNodes.has(targetId)) {
        connection.style.opacity = '1';
      } else {
        connection.style.opacity = '0.2';
      }
    });
    
    // Update visibility of labels
    const labels = this.labelsGroup.querySelectorAll('.node-label');
    labels.forEach(label => {
      const nodeId = label.classList[1].replace('node-label-', '');
      
      if (visibleNodes.has(nodeId)) {
        label.style.opacity = '1';
      } else {
        label.style.opacity = '0.2';
      }
    });
  },
  
  // Calculate node positions in orbital layout
  calculateOrbitalPositions: function() {
    // Center point
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    // Group nodes by tier
    const nodesByTier = {};
    
    Object.values(this.nodes).forEach(node => {
      const tier = node.tier || 0;
      
      if (!nodesByTier[tier]) {
        nodesByTier[tier] = [];
      }
      
      nodesByTier[tier].push(node);
    });
    
    // Calculate positions for each tier
    Object.entries(nodesByTier).forEach(([tier, nodes]) => {
      const tierInt = parseInt(tier);
      
      // Skip tier 0 (core node)
      if (tierInt === 0) {
        nodes.forEach(node => {
          node.position = { x: centerX, y: centerY };
        });
        return;
      }
      
      // Get orbit radius for this tier
      const orbitRadius = this.config.orbitRadius[tierInt - 1] || 
                          this.config.orbitRadius[this.config.orbitRadius.length - 1];
      
      // Calculate angle step
      const angleStep = (Math.PI * 2) / nodes.length;
      
      // Assign positions
      nodes.forEach((node, index) => {
        const angle = index * angleStep;
        
        // Calculate position
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius;
        
        node.position = { x, y };
      });
    });
  }
};

// Export the SkillTreeRenderer object
window.SkillTreeRenderer = SkillTreeRenderer;
console.log("Loaded: skill_tree_renderer.js");