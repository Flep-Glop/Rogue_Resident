/**
 * Skill Tree Renderer
 * 
 * Handles the visual rendering of the skill tree using HTML5 Canvas.
 * Responsible for drawing nodes, connections, and handling interactions.
 */

import skillTreeController from './skill_tree_controller.js';

class SkillTreeRenderer {
  /**
   * Create a new SkillTreeRenderer
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tree = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.nodeRadius = 30;
    this.selectedNodeId = null;
    this.hoveredNodeId = null;
    this.nodeImages = {};
    
    // Colors and styles
    this.colors = {
      background: '#1a1a2e',
      connection: '#4a4a6a',
      connectionActive: '#6a7fe3',
      nodeBorder: '#ffffff',
      nodeFill: '#2a2a4a',
      nodeFillUnlocked: '#3a5fe3',
      nodeFillHover: '#4a6af3',
      nodeFillSelected: '#5a7aff',
      text: '#ffffff',
      levelIndicator: '#ffcc00'
    };
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.render = this.render.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.getNodeAtPosition = this.getNodeAtPosition.bind(this);
    
    // Initialize event listeners
    this._initEventListeners();
  }

  /**
   * Initialize the renderer with a skill tree
   * @param {Object} tree - The skill tree data
   */
  initialize(tree) {
    this.tree = tree;
    this.selectedNodeId = null;
    this.hoveredNodeId = null;
    
    // Center the tree
    this._centerTree();
    
    // Pre-load node icons
    this._loadNodeIcons();
    
    // Initial render
    this.render();
  }

  /**
   * Center the tree in the canvas
   * @private
   */
  _centerTree() {
    if (!this.tree || !this.tree.nodes) {
      return;
    }
    
    // Find the bounding box of all nodes
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    Object.values(this.tree.nodes).forEach(node => {
      minX = Math.min(minX, node.x_position);
      maxX = Math.max(maxX, node.x_position);
      minY = Math.min(minY, node.y_position);
      maxY = Math.max(maxY, node.y_position);
    });
    
    // Center the tree
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const treeCenterX = minX + treeWidth / 2;
    const treeCenterY = minY + treeHeight / 2;
    
    this.offsetX = this.canvas.width / 2 - treeCenterX * this.scale;
    this.offsetY = this.canvas.height / 2 - treeCenterY * this.scale;
  }

  /**
   * Pre-load node icons
   * @private
   */
  _loadNodeIcons() {
    if (!this.tree || !this.tree.nodes) {
      return;
    }
    
    // Load icons for nodes
    Object.values(this.tree.nodes).forEach(node => {
      if (node.icon && !this.nodeImages[node.icon]) {
        const img = new Image();
        img.src = `/static/img/skill_tree/${node.icon}`;
        this.nodeImages[node.icon] = img;
      }
    });
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel);
    
    // Controller events
    skillTreeController.on('node_selected', event => {
      this.selectedNodeId = event.nodeId;
      this.render();
    });
    
    skillTreeController.on('node_unlocked', () => {
      this.render();
    });
    
    skillTreeController.on('node_leveled_up', () => {
      this.render();
    });
    
    skillTreeController.on('skill_tree_reset', () => {
      this.selectedNodeId = null;
      this.render();
    });
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Handle dragging
    if (this.isDragging) {
      const deltaX = mouseX - this.lastMouseX;
      const deltaY = mouseY - this.lastMouseY;
      
      this.offsetX += deltaX;
      this.offsetY += deltaY;
      
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
      
      this.render();
      return;
    }
    
    // Check if hovering over a node
    const nodeId = this.getNodeAtPosition(mouseX, mouseY);
    
    if (nodeId !== this.hoveredNodeId) {
      this.hoveredNodeId = nodeId;
      
      // Update controller
      skillTreeController.hoverNode(nodeId);
      
      // Re-render
      this.render();
    }
  }

  /**
   * Handle mouse down event
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Check if clicking on a node
    const nodeId = this.getNodeAtPosition(mouseX, mouseY);
    
    if (nodeId) {
      // Select the node
      skillTreeController.selectNode(nodeId);
    } else {
      // Start dragging
      this.isDragging = true;
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * Handle mouse up event
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Handle mouse wheel event
   * @param {WheelEvent} event - The wheel event
   */
  handleWheel(event) {
    event.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate point under mouse in world space
    const worldX = (mouseX - this.offsetX) / this.scale;
    const worldY = (mouseY - this.offsetY) / this.scale;
    
    // Adjust scale
    const zoomFactor = 0.1;
    const delta = event.deltaY > 0 ? -zoomFactor : zoomFactor;
    const newScale = Math.max(0.5, Math.min(2.0, this.scale + delta));
    
    // Only apply if scale actually changed
    if (newScale !== this.scale) {
      // Adjust offset to zoom toward mouse position
      this.offsetX = mouseX - worldX * newScale;
      this.offsetY = mouseY - worldY * newScale;
      this.scale = newScale;
      
      this.render();
    }
  }

  /**
   * Get the node at a specific position
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @returns {string|null} - The node ID or null if no node at position
   */
  getNodeAtPosition(x, y) {
    if (!this.tree || !this.tree.nodes) {
      return null;
    }
    
    // Check each node
    for (const [nodeId, node] of Object.entries(this.tree.nodes)) {
      const nodeX = node.x_position * this.scale + this.offsetX;
      const nodeY = node.y_position * this.scale + this.offsetY;
      const radius = this.nodeRadius * this.scale;
      
      // Check if within node circle
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      
      if (distance <= radius) {
        return nodeId;
      }
    }
    
    return null;
  }

  /**
   * Render the skill tree
   */
  render() {
    if (!this.ctx || !this.tree) {
      return;
    }
    
    // Clear canvas
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections first
    this._drawConnections();
    
    // Draw nodes
    this._drawNodes();
    
    // Draw UI elements
    this._drawUI();
  }

  /**
   * Draw node connections
   * @private
   */
  _drawConnections() {
    if (!this.tree || !this.tree.nodes) {
      return;
    }
    
    this.ctx.lineWidth = 3 * this.scale;
    
    // Draw each connection
    Object.values(this.tree.nodes).forEach(node => {
      const nodeX = node.x_position * this.scale + this.offsetX;
      const nodeY = node.y_position * this.scale + this.offsetY;
      
      // Draw connections to prerequisites
      node.prerequisites.forEach(prereqId => {
        const prereq = this.tree.nodes[prereqId];
        if (prereq) {
          const prereqX = prereq.x_position * this.scale + this.offsetX;
          const prereqY = prereq.y_position * this.scale + this.offsetY;
          
          // Choose color based on unlock status
          if (prereq.unlocked && node.unlocked) {
            this.ctx.strokeStyle = this.colors.connectionActive;
          } else {
            this.ctx.strokeStyle = this.colors.connection;
          }
          
          // Draw line
          this.ctx.beginPath();
          this.ctx.moveTo(prereqX, prereqY);
          this.ctx.lineTo(nodeX, nodeY);
          this.ctx.stroke();
        }
      });
    });
  }

  /**
   * Draw skill tree nodes
   * @private
   */
  _drawNodes() {
    if (!this.tree || !this.tree.nodes) {
      return;
    }
    
    // Draw each node
    Object.entries(this.tree.nodes).forEach(([nodeId, node]) => {
      const nodeX = node.x_position * this.scale + this.offsetX;
      const nodeY = node.y_position * this.scale + this.offsetY;
      const radius = this.nodeRadius * this.scale;
      
      // Determine fill color
      let fillColor = this.colors.nodeFill;
      
      if (nodeId === this.selectedNodeId) {
        fillColor = this.colors.nodeFillSelected;
      } else if (nodeId === this.hoveredNodeId) {
        fillColor = this.colors.nodeFillHover;
      } else if (node.unlocked) {
        fillColor = this.colors.nodeFillUnlocked;
      }
      
      // Draw node circle
      this.ctx.beginPath();
      this.ctx.arc(nodeX, nodeY, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
      
      // Draw border
      this.ctx.lineWidth = 2 * this.scale;
      this.ctx.strokeStyle = this.colors.nodeBorder;
      this.ctx.stroke();
      
      // Draw icon if available
      if (node.icon && this.nodeImages[node.icon] && this.nodeImages[node.icon].complete) {
        const iconSize = radius * 1.2;
        this.ctx.drawImage(
          this.nodeImages[node.icon], 
          nodeX - iconSize / 2, 
          nodeY - iconSize / 2, 
          iconSize, 
          iconSize
        );
      }
      
      // Draw node name
      this.ctx.font = `${12 * this.scale}px Arial`;
      this.ctx.fillStyle = this.colors.text;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.name, nodeX, nodeY + radius + 15 * this.scale);
      
      // Draw level indicator if unlocked
      if (node.unlocked && node.max_level > 1) {
        this.ctx.font = `bold ${14 * this.scale}px Arial`;
        this.ctx.fillStyle = this.colors.levelIndicator;
        this.ctx.fillText(`${node.level}/${node.max_level}`, nodeX, nodeY - radius - 10 * this.scale);
      }
    });
  }

  /**
   * Draw UI elements
   * @private
   */
  _drawUI() {
    if (!this.tree) {
      return;
    }
    
    // Draw available points
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = this.colors.text;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Available Points: ${this.tree.available_points}`, 20, 30);
    
    // Draw instructions
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Drag to pan, scroll to zoom', 20, this.canvas.height - 20);
  }

  /**
   * Resize the canvas
   * @param {number} width - The new width
   * @param {number} height - The new height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }
}

export default SkillTreeRenderer;