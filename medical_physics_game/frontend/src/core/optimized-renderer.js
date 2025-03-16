// skill_tree_renderer.js
export class SkillTreeRenderer {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = Object.assign({
      width: 800,
      height: 600,
      nodeRadius: {
        core: 30,
        major: 18,
        minor: 15,
        connector: 12
      }
    }, options);
    
    // State
    this.svgContainer = null;
    this.svg = null;
    this.connectionsGroup = null;
    this.nodesGroup = null;
    this.labelsGroup = null;
    this.data = null;
    this.renderState = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isDirty: false,
      filter: null,
      selectedNodeId: null
    };
    
    // Virtual elements - track state without immediate DOM updates
    this.virtualNodes = new Map();
    this.virtualConnections = new Map();
    this.virtualLabels = new Map();
    
    // Request animation frame ID
    this.rafId = null;
  }
  
  initialize() {
    // Get container
    this.svgContainer = document.getElementById(this.containerId);
    if (!this.svgContainer) {
      throw new Error(`Container not found: ${this.containerId}`);
    }
    
    // Create SVG element if not exists
    this._createSvgStructure();
    
    // Set up event listeners
    this._setupEventListeners();
    
    return this;
  }
  
  loadData(data) {
    this.data = data;
    this._resetVirtualElements();
    this._createVirtualElements();
    this.renderState.isDirty = true;
    this._scheduleRender();
    return this;
  }
  
  _createSvgStructure() {
    // Clear container
    this.svgContainer.innerHTML = '';
    
    // Create SVG element
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Create groups
    this.connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Append groups to SVG
    this.svg.appendChild(this.connectionsGroup);
    this.svg.appendChild(this.nodesGroup);
    this.svg.appendChild(this.labelsGroup);
    
    // Append SVG to container
    this.svgContainer.appendChild(this.svg);
  }
  
  _setupEventListeners() {
    // Pan and zoom events
    // Node selection events
    // ...
  }
  
  _resetVirtualElements() {
    this.virtualNodes.clear();
    this.virtualConnections.clear();
    this.virtualLabels.clear();
  }
  
  _createVirtualElements() {
    if (!this.data) return;
    
    // Create virtual nodes
    if (this.data.nodes) {
      this.data.nodes.forEach(node => {
        this.virtualNodes.set(node.id, {
          data: node,
          element: null, // Will be created during render
          visible: true,
          selected: node.id === this.renderState.selectedNodeId
        });
      });
    }
    
    // Create virtual connections
    if (this.data.connections) {
      this.data.connections.forEach((conn, index) => {
        const id = `conn-${conn.source}-${conn.target}`;
        this.virtualConnections.set(id, {
          data: conn,
          element: null, // Will be created during render
          visible: true
        });
      });
    }
  }
  
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
  
  _render() {
    if (!this.renderState.isDirty) return;
    
    console.time('render');
    
    // Create document fragments for batch DOM updates
    const nodesFragment = document.createDocumentFragment();
    const connectionsFragment = document.createDocumentFragment();
    const labelsFragment = document.createDocumentFragment();
    
    // Clear existing elements
    this.nodesGroup.innerHTML = '';
    this.connectionsGroup.innerHTML = '';
    this.labelsGroup.innerHTML = '';
    
    // Render connections
    this._renderConnections(connectionsFragment);
    
    // Render nodes
    this._renderNodes(nodesFragment);
    
    // Render labels
    this._renderLabels(labelsFragment);
    
    // Append fragments to DOM in a single batch
    this.connectionsGroup.appendChild(connectionsFragment);
    this.nodesGroup.appendChild(nodesFragment);
    this.labelsGroup.appendChild(labelsFragment);
    
    // Apply transform
    this._applyTransform();
    
    // Reset dirty flag
    this.renderState.isDirty = false;
    
    console.timeEnd('render');
  }
  
  _renderNodes(fragment) {
    // Render visible nodes to fragment
    this.virtualNodes.forEach(vNode => {
      if (!vNode.visible) return;
      
      const node = vNode.data;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      // Set attributes
      circle.setAttribute('cx', node.position.x);
      circle.setAttribute('cy', node.position.y);
      circle.setAttribute('r', this._getNodeRadius(node));
      circle.setAttribute('fill', this._getNodeColor(node));
      circle.setAttribute('class', `node ${vNode.selected ? 'selected' : ''}`);
      circle.dataset.nodeId = node.id;
      
      // Store element reference
      vNode.element = circle;
      
      // Add to fragment
      fragment.appendChild(circle);
      
      // Create node icon if needed
      this._createNodeIcon(node, fragment);
    });
  }
  
  _renderConnections(fragment) {
    // Similar implementation for connections
    // ...
  }
  
  _renderLabels(fragment) {
    // Similar implementation for labels
    // ...
  }
  
  // Helper methods
  _getNodeRadius(node) {
    const size = node.visual?.size || 'minor';
    return this.options.nodeRadius[size] || this.options.nodeRadius.minor;
  }
  
  _getNodeColor(node) {
    // Implementation...
  }
  
  _createNodeIcon(node, fragment) {
    // Implementation...
  }
  
  _applyTransform() {
    const transform = `translate(${this.renderState.offsetX},${this.renderState.offsetY}) scale(${this.renderState.scale})`;
    this.connectionsGroup.setAttribute('transform', transform);
    this.nodesGroup.setAttribute('transform', transform);
    this.labelsGroup.setAttribute('transform', transform);
  }
  
  // Public API methods
  updateNodeState(nodeId, state) {
    const vNode = this.virtualNodes.get(nodeId);
    if (vNode) {
      vNode.data.state = state;
      this.renderState.isDirty = true;
      this._scheduleRender();
    }
  }
  
  selectNode(nodeId) {
    // Clear previous selection
    this.virtualNodes.forEach(vNode => {
      vNode.selected = false;
    });
    
    // Set new selection
    const vNode = this.virtualNodes.get(nodeId);
    if (vNode) {
      vNode.selected = true;
      this.renderState.selectedNodeId = nodeId;
    } else {
      this.renderState.selectedNodeId = null;
    }
    
    this.renderState.isDirty = true;
    this._scheduleRender();
    
    return vNode?.data || null;
  }
  
  filter(specialization) {
    this.renderState.filter = specialization;
    
    // Update visibility of nodes and connections
    this.virtualNodes.forEach(vNode => {
      vNode.visible = !specialization || 
                      vNode.data.specialization === specialization ||
                      vNode.data.tier === 0; // Always show tier 0 nodes
    });
    
    // Update connections based on visible nodes
    this.virtualConnections.forEach(vConn => {
      const sourceVisible = this.virtualNodes.get(vConn.data.source)?.visible;
      const targetVisible = this.virtualNodes.get(vConn.data.target)?.visible;
      vConn.visible = sourceVisible && targetVisible;
    });
    
    this.renderState.isDirty = true;
    this._scheduleRender();
  }
  
  zoom(delta) {
    const newScale = Math.max(0.5, Math.min(3.0, this.renderState.scale + delta));
    
    if (newScale !== this.renderState.scale) {
      this.renderState.scale = newScale;
      this.renderState.isDirty = true;
      this._scheduleRender();
    }
  }
  
  pan(dx, dy) {
    this.renderState.offsetX += dx;
    this.renderState.offsetY += dy;
    this.renderState.isDirty = true;
    this._scheduleRender();
  }
  
  resetView() {
    this.renderState.scale = 1;
    this.renderState.offsetX = 0;
    this.renderState.offsetY = 0;
    this.renderState.isDirty = true;
    this._scheduleRender();
  }
}
