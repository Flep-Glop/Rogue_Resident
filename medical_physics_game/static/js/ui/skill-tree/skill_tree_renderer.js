// skill_tree_renderer.js - Enhanced version combining features and optimization

/**
 * SkillTreeRenderer - Class for rendering interactive skill trees
 * Combines the feature-rich original implementation with performance optimizations
 */
export class SkillTreeRenderer {
  /**
   * Create a new SkillTreeRenderer
   * @param {string} containerId - ID of the container element
   * @param {Object} options - Configuration options
   */
  constructor(containerId, options = {}) {
    // Store container ID
    this.containerId = containerId;
    
    // Default configuration with merged options
    this.config = Object.assign({
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
    }, options);
    
    // SVG elements - will be initialized later
    this.svg = null;
    this.svgContainer = null;
    this.nodesGroup = null;
    this.connectionsGroup = null;
    this.labelsGroup = null;
    this.tooltipGroup = null;
    this.orbitsGroup = null;
    this.zoom = null;
    
    // State management
    this.initialized = false;
    this.currentTransform = { k: 1, x: 0, y: 0 };
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // Virtual DOM elements for performance optimization
    this.virtualNodes = new Map();
    this.virtualConnections = new Map();
    this.virtualLabels = new Map();
    
    // Data storage
    this.specializations = {};
    this.nodes = {};
    this.connections = [];
    this.nodeElements = {};
    
    // Rendering state
    this.renderState = {
      isDirty: false,
      filter: null
    };
    
    // Request animation frame ID
    this.rafId = null;
  }
  
  /**
   * Initialize the renderer
   * @return {SkillTreeRenderer} This instance for chaining
   */
  initialize() {
    console.log(`Initializing skill tree renderer in container: ${this.containerId}`);
    
    // Get container element
    this.svgContainer = document.getElementById(this.containerId);
    if (!this.svgContainer) {
      console.error(`Container element not found: ${this.containerId}`);
      return this;
    }
    
    // Create SVG element and structure
    this.createSvgCanvas();
    
    // Set up zoom and pan behavior
    this.setupZoomAndPan();
    
    // Add event listeners
    this.setupEventListeners();
    
    this.initialized = true;
    
    return this;
  }
  
  /**
   * Create SVG canvas and structure
   */
  createSvgCanvas() {
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
  }
  
  /**
   * Set up zoom and pan behavior
   */
  setupZoomAndPan() {
    // Check if d3 is available
    if (typeof d3 !== 'undefined') {
      // Create zoom behavior
      this.zoom = d3.zoom()
        .scaleExtent([this.config.zoomLimits.min, this.config.zoomLimits.max])
        .on('zoom', (event) => {
          this.currentTransform = event.transform;
          
          // Apply transform to all groups
          this.applyTransform();
          
          // Update labels visibility based on zoom level
          this.updateLabelsVisibility(event.transform.k);
        });
      
      // Apply zoom behavior to SVG
      d3.select(this.svg).call(this.zoom);
    } else {
      // Fallback to manual pan/zoom implementation if d3 is not available
      this.setupManualZoomAndPan();
    }
  }
  
  /**
   * Manual zoom and pan implementation without d3
   */
  setupManualZoomAndPan() {
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
  }
  
  /**
   * Apply transform to all groups
   */
  applyTransform() {
    const transform = `translate(${this.currentTransform.x}, ${this.currentTransform.y}) scale(${this.currentTransform.k})`;
    
    this.orbitsGroup.setAttribute('transform', transform);
    this.connectionsGroup.setAttribute('transform', transform);
    this.nodesGroup.setAttribute('transform', transform);
    this.labelsGroup.setAttribute('transform', transform);
  }
  
  /**
   * Update labels visibility based on zoom level
   * @param {number} zoomLevel - Current zoom level
   */
  updateLabelsVisibility(zoomLevel) {
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
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
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
  }
  
  /**
   * Setup touch events for mobile devices
   * Placeholder - would need implementation for mobile touch handling
   */
  setupTouchEvents() {
    // Implement touch gesture handling here if needed
    console.log("Touch events would be set up here");
  }
  
  /**
   * Reset zoom to default
   */
  resetZoom() {
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
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Adjust viewBox if needed
    // Note: SVG with preserveAspectRatio should handle this automatically
  }
  
  /**
   * Load skill tree data
   * @param {Object} data - Skill tree data with nodes, connections and specializations
   * @return {SkillTreeRenderer} This instance for chaining
   */
  loadSkillTree(data) {
    console.log('Loading skill tree data');
    
    // Store data
    this.specializations = data.specializations || {};
    this.nodes = data.nodes || {};
    this.connections = data.connections || [];
    
    // Reset virtual DOM elements
    this.virtualNodes.clear();
    this.virtualConnections.clear();
    this.virtualLabels.clear();
    
    // Calculate proper positions if needed
    this._ensureNodePositions();
    
    // Create virtual nodes and connections
    this._createVirtualElements();
    
    // Mark as dirty and schedule render
    this.renderState.isDirty = true;
    this._scheduleRender();
    
    // Center the view
    setTimeout(() => {
      this.centerView();
    }, 100);
    
    return this;
  }

  /**
   * Create virtual DOM elements from data
   * For performance optimization by batching DOM updates
   */
  _createVirtualElements() {
    // Create virtual nodes
    Object.entries(this.nodes).forEach(([id, node]) => {
      this.virtualNodes.set(id, {
        data: node,
        element: null,
        visible: true,
        selected: id === this.selectedNode,
        hovered: id === this.hoveredNode
      });
    });
    
    // Create virtual connections
    this.connections.forEach(conn => {
      const id = `conn-${conn.source}-${conn.target}`;
      this.virtualConnections.set(id, {
        data: conn,
        element: null,
        visible: true
      });
    });
  }
  
  /**
   * Ensure all nodes have proper positions
   * Implements orbital layout and core cluster positioning
   */
  _ensureNodePositions() {
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
      
      // Special handling for tier 0 (core cluster)
      if (tierInt === 0) {
        // Check if we have multiple core nodes (our cluster)
        if (nodes.length > 1) {
          // Identify core nodes
          const coreNodes = nodes.filter(node => 
            node.specialization === 'core' || 
            ['radiation_physics', 'medical_instrumentation', 'patient_care', 'medical_science'].includes(node.id)
          );
          
          // Position core nodes in a small cluster
          if (coreNodes.length > 0) {
            const clusterRadius = 40; // Radius for the cluster
            const angleStep = (Math.PI * 2) / coreNodes.length;
            
            coreNodes.forEach((node, index) => {
              if (!node.position || !node.position.x || !node.position.y) {
                const angle = index * angleStep;
                const x = centerX + Math.cos(angle) * clusterRadius;
                const y = centerY + Math.sin(angle) * clusterRadius;
                
                node.position = { x, y };
              }
            });
            
            // Position any remaining tier 0 nodes at center
            const nonCoreNodes = nodes.filter(node => !coreNodes.includes(node));
            nonCoreNodes.forEach(node => {
              if (!node.position) {
                node.position = { x: centerX, y: centerY };
              }
            });
          } else {
            // Fallback: position all at center
            nodes.forEach(node => {
              if (!node.position) {
                node.position = { x: centerX, y: centerY };
              }
            });
          }
        } else {
          // Single core node - place at center
          nodes.forEach(node => {
            if (!node.position) {
              node.position = { x: centerX, y: centerY };
            }
          });
        }
        return;
      }
      
      // Other tiers follow orbital layout
      const orbitRadius = this.config.orbitRadius[tierInt - 1];
      const count = nodes.length;
      const angleStep = (Math.PI * 2) / count;
      
      nodes.forEach((node, index) => {
        if (!node.position) {
          const angle = index * angleStep;
          const x = centerX + Math.cos(angle) * orbitRadius;
          const y = centerY + Math.sin(angle) * orbitRadius;
          
          node.position = { x, y };
        }
      });
    });
  }

  /**
   * Schedule a render using requestAnimationFrame
   * For performance optimization
   */
  _scheduleRender() {
    // Cancel any pending render
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    // Schedule new render
    this.rafId = requestAnimationFrame(() => {
      this._render();
    });
  }
  
  /**
   * Render the skill tree with virtual DOM approach
   * Batch DOM updates for better performance
   */
  _render() {
    if (!this.renderState.isDirty) return;
    
    console.time('render');
    
    // Create document fragments for batch DOM updates
    const nodesFragment = document.createDocumentFragment();
    const connectionsFragment = document.createDocumentFragment();
    const labelsFragment = document.createDocumentFragment();
    const orbitsFragment = document.createDocumentFragment();
    
    // Clear existing elements
    this.nodesGroup.innerHTML = '';
    this.connectionsGroup.innerHTML = '';
    this.labelsGroup.innerHTML = '';
    this.orbitsGroup.innerHTML = '';
    this.tooltipGroup.innerHTML = '';
    
    // Reset node elements collection
    this.nodeElements = {};
    
    // Draw orbital rings
    this._renderOrbitalRings(orbitsFragment);
    
    // Draw connections between nodes
    this._renderConnections(connectionsFragment);
    
    // Draw nodes
    this._renderNodes(nodesFragment);
    
    // Draw labels
    this._renderLabels(labelsFragment);
    
    // Append fragments to DOM in a single batch
    this.orbitsGroup.appendChild(orbitsFragment);
    this.connectionsGroup.appendChild(connectionsFragment);
    this.nodesGroup.appendChild(nodesFragment);
    this.labelsGroup.appendChild(labelsFragment);
    
    // Apply transform
    this.applyTransform();
    
    // Reset dirty flag
    this.renderState.isDirty = false;
    
    console.timeEnd('render');
    
    console.log('Skill tree rendered');
  }
  
  /**
   * Render the orbital rings
   * @param {DocumentFragment} fragment - Document fragment to append to
   */
  _renderOrbitalRings(fragment) {
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
      
      fragment.appendChild(orbit);
    });
  }
  
  /**
   * Render connections between nodes
   * @param {DocumentFragment} fragment - Document fragment to append to
   */
  _renderConnections(fragment) {
    // Create a map for quick node lookups
    const nodeMap = {};
    Object.values(this.nodes).forEach(node => {
      nodeMap[node.id] = node;
    });
    
    // Render each connection
    this.virtualConnections.forEach((vConn, id) => {
      if (!vConn.visible) return;
      
      const connection = vConn.data;
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
      
      // Store element reference
      vConn.element = line;
      
      fragment.appendChild(line);
    });
  }
  
  /**
   * Render nodes
   * @param {DocumentFragment} fragment - Document fragment to append to
   */
  _renderNodes(fragment) {
    // Render each node
    this.virtualNodes.forEach((vNode, id) => {
      if (!vNode.visible) return;
      
      const node = vNode.data;
      
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
      
      // Set classes based on state
      const classes = [`node node-${node.id}`, `node-${node.state}`, `node-size-${nodeSize}`];
      if (vNode.selected) classes.push('selected');
      if (vNode.hovered) classes.push('hovered');
      
      circle.setAttribute('class', classes.join(' '));
      
      // Add data attributes
      circle.dataset.nodeId = node.id;
      circle.dataset.nodeName = node.name;
      circle.dataset.nodeState = node.state;
      
      // Add event listeners
      circle.addEventListener('mouseenter', this.handleNodeMouseEnter.bind(this, node));
      circle.addEventListener('mouseleave', this.handleNodeMouseLeave.bind(this, node));
      circle.addEventListener('click', this.handleNodeClick.bind(this, node));
      
      // Store element reference
      vNode.element = circle;
      this.nodeElements[node.id] = circle;
      
      fragment.appendChild(circle);
      
      // Create node icon if available
      if (node.visual?.icon) {
        this._createNodeIcon(node, x, y, radius, fragment);
      }
    });
  }
  
  /**
   * Create node icon
   * @param {Object} node - Node data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Node radius
   * @param {DocumentFragment} fragment - Document fragment to append to
   */
  _createNodeIcon(node, x, y, radius, fragment) {
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
    
    fragment.appendChild(text);
  }
  
  /**
   * Render node labels
   * @param {DocumentFragment} fragment - Document fragment to append to
   */
  _renderLabels(fragment) {
    // Render label for each node
    this.virtualNodes.forEach((vNode, id) => {
      if (!vNode.visible) return;
      
      const node = vNode.data;
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
      
      // Set opacity based on state
      let opacity = '0'; // Hidden by default
      if (vNode.selected || vNode.hovered || node.state === 'active') {
        opacity = '1'; // Show if selected, hovered, or active
      }
      
      text.style.opacity = opacity;
      text.style.transition = 'opacity 0.2s ease';
      
      // Add text shadow for better readability
      text.style.textShadow = `1px 1px 2px ${this.config.colors.textShadow}`;
      
      // Set text content
      text.textContent = node.name;
      
      fragment.appendChild(text);
    });
  }
  
  // Event Handlers
  
  /**
   * Handle node mouse enter
   * @param {Object} node - Node data
   * @param {Event} event - Mouse event
   */
  handleNodeMouseEnter(node, event) {
    // Skip if tooltip is already visible for this node
    if (this.hoveredNode === node.id) return;
    
    this.hoveredNode = node.id;
    
    // Update virtual node state
    const vNode = this.virtualNodes.get(node.id);
    if (vNode) {
      vNode.hovered = true;
    }
    
    // Show tooltip
    this.showNodeTooltip(node);
    
    // Highlight node and connections
    this.highlightNodeAndConnections(node.id);
    
    // Show label
    const label = this.labelsGroup.querySelector(`.node-label-${node.id}`);
    if (label) {
      label.style.opacity = '1';
    }
  }
  
  /**
   * Handle node mouse leave
   * @param {Object} node - Node data
   * @param {Event} event - Mouse event
   */
  handleNodeMouseLeave(node, event) {
    this.hoveredNode = null;
    
    // Update virtual node state
    const vNode = this.virtualNodes.get(node.id);
    if (vNode) {
      vNode.hovered = false;
    }
    
    // Hide tooltip
    this.hideNodeTooltip();
    
    // Remove highlights, unless this node is selected
    if (this.selectedNode !== node.id) {
      this.unhighlightAll();
      
      // Hide label if not active or selected
      if (node.state !== 'active') {
        const label = this.labelsGroup.querySelector(`.node-label-${node.id}`);
        if (label) {
          label.style.opacity = '0';
        }
      }
    }
  }
  
  /**
   * Handle node click
   * @param {Object} node - Node data
   * @param {Event} event - Mouse event
   */
  handleNodeClick(node, event) {
    event.stopPropagation();
    
    // Set as selected node
    this.selectedNode = node.id;
    
    // Update virtual node states
    this.virtualNodes.forEach((vNode, id) => {
      vNode.selected = (id === node.id);
    });
    
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
  }
  
  /**
   * Show node tooltip
   * @param {Object} node - Node data
   */
  showNodeTooltip(node) {
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
  }
  
  /**
   * Hide node tooltip
   */
  hideNodeTooltip() {
    this.tooltipGroup.innerHTML = '';
  }
  
  /**
   * Highlight node and its connections
   * @param {string} nodeId - Node ID to highlight
   */
  highlightNodeAndConnections(nodeId) {
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
  }
  
  /**
   * Remove all highlights
   */
  unhighlightAll() {
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
  }
  
  /**
   * Highlight the core cluster of nodes
   */
  highlightCoreCluster() {
    // Find core nodes
    const coreNodeIds = Object.values(this.nodes)
      .filter(node => node.specialization === 'core')
      .map(node => node.id);
    
    // Get connections between core nodes
    const coreConnections = this.connectionsGroup.querySelectorAll('.connection');
    Array.from(coreConnections).forEach(connection => {
      const sourceId = connection.dataset.source;
      const targetId = connection.dataset.target;
      
      if (coreNodeIds.includes(sourceId) && coreNodeIds.includes(targetId)) {
        // Highlight core connections
        connection.setAttribute('stroke-width', '3');
        connection.style.strokeOpacity = '0.8';
        connection.style.stroke = '#777777'; // Grey color for core
      }
    });
    
    // Highlight core nodes
    coreNodeIds.forEach(nodeId => {
      const nodeElement = this.nodeElements[nodeId];
      if (nodeElement) {
        nodeElement.style.filter = 'brightness(110%)';
      }
    });
  }
  
  /**
   * Center the view on the skill tree
   */
  centerView() {
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
  }
  
  /**
   * Update node states
   * @param {Object} nodeStates - Map of node IDs to states
   */
  updateNodeStates(nodeStates) {
    console.log('Updating node states');
    
    // Update each node state in data and virtual DOM
    Object.entries(nodeStates).forEach(([nodeId, state]) => {
      // Update node data
      if (this.nodes[nodeId]) {
        this.nodes[nodeId].state = state;
      }
      
      // Update virtual node
      const vNode = this.virtualNodes.get(nodeId);
      if (vNode) {
        vNode.data.state = state;
      }
      
      // Update DOM if it exists
      const nodeElement = this.nodeElements[nodeId];
      if (nodeElement) {
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
      }
    });
    
    // Mark as dirty and schedule render for full update
    this.renderState.isDirty = true;
    this._scheduleRender();
  }
  
  /**
   * Filter the tree by specialization
   * @param {string} specializationId - Specialization ID to filter by or null for all
   */
  filterBySpecialization(specializationId) {
    this.renderState.filter = specializationId;
    
    // If no specialization selected, show all nodes
    if (!specializationId) {
      this.virtualNodes.forEach(vNode => {
        vNode.visible = true;
      });
      
      this.virtualConnections.forEach(vConn => {
        vConn.visible = true;
      });
    } else {
      // Create a set to track nodes in this specialization and connected nodes
      const visibleNodes = new Set();
      
      // Add nodes of the selected specialization
      Object.values(this.nodes).forEach(node => {
        if (node.specialization === specializationId || node.id === 'core_physics') {
          visibleNodes.add(node.id);
        }
      });
      
      // Update visibility of nodes
      this.virtualNodes.forEach((vNode, id) => {
        vNode.visible = visibleNodes.has(id);
      });
      
      // Update visibility of connections
      this.virtualConnections.forEach((vConn, id) => {
        const sourceId = vConn.data.source;
        const targetId = vConn.data.target;
        
        vConn.visible = visibleNodes.has(sourceId) && visibleNodes.has(targetId);
      });
    }
    
    // Mark as dirty and schedule render
    this.renderState.isDirty = true;
    this._scheduleRender();
  }
}

// Export the SkillTreeRenderer object
window.SkillTreeRenderer = SkillTreeRenderer;
console.log("Loaded: Enhanced skill_tree_renderer.js");