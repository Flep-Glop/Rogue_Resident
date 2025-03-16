// skill_tree_editor.js - Modular architecture for the skill tree editor

/**
 * SkillTreeEditorCore - Core functionality for the skill tree editor
 * This module provides the essential functionality shared across all 
 * editor implementations.
 */
const SkillTreeEditorCore = {
  // Version for tracking
  version: '1.0.0',
  
  /**
   * Create a new editor instance with encapsulated state
   * @param {Object} options - Configuration options
   * @returns {Object} Editor instance
   */
  createEditor: function(options = {}) {
      // Create editor instance with default config
      const editor = {
          // Configuration with defaults
          config: {
              containerId: 'skill-tree-editor',
              width: 800,
              height: 600,
              onSave: null,
              templateUrl: '/static/templates/node_templates.json',
              autosaveInterval: 60000, // 1 minute
              undoStackSize: 50
          },
          
          // Private state - not directly accessible
          _state: {
              initialized: false,
              dataLoaded: false,
              errorState: false,
              selectedNodeId: null,
              editingConnection: null,
              isDragging: false,
              canvasScale: 1,
              canvasOffsetX: 0,
              canvasOffsetY: 0,
              renderPending: false,
              lastNodeCount: 0,
              lastConnectionCount: 0,
              filter: {
                  specialization: null,
                  tier: null,
                  searchTerm: ''
              },
              history: {
                  past: [],
                  future: [],
                  current: null
              }
          },
          
          // Data
          data: {
              specializations: [],
              nodes: [],
              connections: []
          },
          
          // DOM element references
          elements: {},
          
          // SVG elements
          svg: {
              root: null,
              connectionsGroup: null,
              nodesGroup: null
          },
          
          // Node templates
          templates: {},
          
          // Initialize editor
          initialize: function() {
              console.log("Initializing skill tree editor");
              
              // Apply options
              Object.assign(this.config, options);
              
              // Check if already initialized
              if (this._state.initialized) {
                  console.log("Editor already initialized");
                  return this;
              }
              
              // Create DOM structure
              this._createEditorDOM();
              
              // Initialize canvas
              this._initCanvas();
              
              // Set up event listeners
              this._setupEventListeners();
              
              // Initialize undo/redo system
              this._initUndoRedo();
              
              // Load templates
              this._loadTemplates()
                  .then(() => {
                      // Load skill tree data
                      return this._loadSkillTreeData();
                  })
                  .then(() => {
                      // Mark as initialized
                      this._state.initialized = true;
                      console.log("Editor initialized successfully");
                      
                      // Start autosave timer
                      this._startAutosaveTimer();
                      
                      // Initialize history with current state
                      this._state.history.current = JSON.stringify(this.data);
                      
                      // Show toast
                      this._showToast('Editor loaded successfully', 'success');
                  })
                  .catch(error => {
                      console.error("Failed to initialize editor:", error);
                      this._state.errorState = true;
                      this._showToast('Failed to initialize editor', 'error');
                  });
              
              return this;
          },
          
          // Save editor state
          save: function() {
              console.log("Saving editor state");
              
              // Call save callback if provided
              if (typeof this.config.onSave === 'function') {
                  try {
                      this.config.onSave(this.data);
                      this._showToast('Data saved successfully', 'success');
                      return true;
                  } catch (error) {
                      console.error("Error in save callback:", error);
                      this._showToast('Error saving data', 'error');
                      return false;
                  }
              }
              
              // Default implementation - save to server
              return this._saveToServer();
          },
          
          // Add required methods
          _createEditorDOM: SkillTreeEditorImplementations.createEditorDOM,
          _initCanvas: SkillTreeEditorImplementations.initCanvas,
          _setupEventListeners: SkillTreeEditorImplementations.setupEventListeners,
          _initUndoRedo: SkillTreeEditorImplementations.initUndoRedo,
          _loadTemplates: SkillTreeEditorImplementations.loadTemplates,
          _loadSkillTreeData: SkillTreeEditorImplementations.loadSkillTreeData,
          _startAutosaveTimer: SkillTreeEditorImplementations.startAutosaveTimer,
          _saveToServer: SkillTreeEditorImplementations.saveToServer,
          _showToast: SkillTreeEditorImplementations.showToast,
          
          // Node operations
          createNode: SkillTreeEditorOperations.createNode,
          updateNode: SkillTreeEditorOperations.updateNode,
          deleteNode: SkillTreeEditorOperations.deleteNode,
          selectNode: SkillTreeEditorOperations.selectNode,
          
          // Connection operations
          createConnection: SkillTreeEditorOperations.createConnection,
          deleteConnection: SkillTreeEditorOperations.deleteConnection,
          
          // Canvas operations
          renderCanvas: SkillTreeEditorCanvas.renderCanvas,
          zoomCanvas: SkillTreeEditorCanvas.zoomCanvas,
          resetCanvasView: SkillTreeEditorCanvas.resetCanvasView,
          
          // Undo/redo operations
          undo: SkillTreeEditorUndoRedo.undo,
          redo: SkillTreeEditorUndoRedo.redo,
          
          // Utils
          exportToJson: SkillTreeEditorUtils.exportToJson,
          importFromJson: SkillTreeEditorUtils.importFromJson,
          validateData: SkillTreeEditorUtils.validateData
      };
      
      // Return the editor instance
      return editor;
  }
};

/**
* SkillTreeEditorImplementations - Core implementation details
* These implementations are used by the editor instance but not exposed directly.
*/
const SkillTreeEditorImplementations = {
  /**
   * Create the DOM structure for the editor
   * @private
   */
  createEditorDOM: function() {
      // Get container element
      const containerSelector = `#${this.config.containerId}`;
      this.elements.container = document.querySelector(containerSelector);
      
      if (!this.elements.container) {
          console.error(`Container element not found: ${containerSelector}`);
          throw new Error(`Editor container not found: ${containerSelector}`);
      }
      
      // Clear container
      this.elements.container.innerHTML = '';
      this.elements.container.classList.add('editor-container');
      
      // Create header
      const header = document.createElement('div');
      header.className = 'editor-header';
      header.innerHTML = `
          <div class="editor-title">Skill Tree Editor</div>
          <div class="editor-actions">
              <button class="editor-btn editor-btn-secondary" id="editor-validate-btn">Validate</button>
              <button class="editor-btn editor-btn-primary" id="editor-save-btn">Save Changes</button>
          </div>
      `;
      this.elements.container.appendChild(header);
      
      // Create content container
      const content = document.createElement('div');
      content.className = 'editor-content';
      
      // Create sidebar
      const sidebar = document.createElement('div');
      sidebar.className = 'editor-sidebar';
      
      // Create node list section
      const nodeListSection = document.createElement('div');
      nodeListSection.className = 'sidebar-section';
      nodeListSection.innerHTML = `
          <div class="sidebar-section-title">Nodes</div>
          <div class="specialization-filter" id="specialization-filter"></div>
          <input type="text" class="form-input" id="node-search" placeholder="Search nodes...">
          <div class="node-list" id="node-list"></div>
          <div class="add-node-controls mt-3">
              <select class="form-select" id="node-template-select">
                  <option value="">Select template...</option>
              </select>
              <button class="editor-btn editor-btn-primary w-full mt-2" id="add-node-btn">Add New Node</button>
          </div>
      `;
      sidebar.appendChild(nodeListSection);
      
      // Create canvas
      const canvas = document.createElement('div');
      canvas.className = 'editor-canvas';
      canvas.innerHTML = `
          <svg id="editor-svg" width="100%" height="100%"></svg>
          <div class="canvas-controls">
              <button class="canvas-control-btn" id="zoom-in-btn">+</button>
              <button class="canvas-control-btn" id="zoom-out-btn">-</button>
              <button class="canvas-control-btn" id="reset-view-btn">↺</button>
          </div>
      `;
      
      // Create editor panel
      const panel = document.createElement('div');
      panel.className = 'editor-panel';
      panel.innerHTML = `
          <div class="editor-panel-content" id="editor-panel-content">
              <div class="empty-state">
                  <p>Select a node to edit or create a new one</p>
              </div>
          </div>
      `;
      
      // Append elements to content
      content.appendChild(sidebar);
      content.appendChild(canvas);
      content.appendChild(panel);
      
      // Append content to container
      this.elements.container.appendChild(content);
      
      // Create toast container if it doesn't exist
      let toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) {
          toastContainer = document.createElement('div');
          toastContainer.className = 'toast-container';
          document.body.appendChild(toastContainer);
      }
      
      // Store element references
      this.elements.header = header;
      this.elements.content = content;
      this.elements.sidebar = sidebar;
      this.elements.canvas = canvas;
      this.elements.panel = panel;
      this.elements.nodeList = document.getElementById('node-list');
      this.elements.specializationFilter = document.getElementById('specialization-filter');
      this.elements.nodeTemplateSelect = document.getElementById('node-template-select');
      this.elements.nodeSearch = document.getElementById('node-search');
      this.elements.addNodeBtn = document.getElementById('add-node-btn');
      this.elements.editorPanelContent = document.getElementById('editor-panel-content');
      this.elements.toastContainer = toastContainer;
      this.svg.root = document.getElementById('editor-svg');
  },
  
  /**
   * Initialize the canvas
   * @private
   */
  initCanvas: function() {
      // Create SVG groups
      this.svg.connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.svg.connectionsGroup.classList.add('connections-group');
      
      this.svg.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.svg.nodesGroup.classList.add('nodes-group');
      
      // Append groups to SVG
      this.svg.root.appendChild(this.svg.connectionsGroup);
      this.svg.root.appendChild(this.svg.nodesGroup);
      
      // Set viewBox
      this.svg.root.setAttribute('viewBox', `0 0 ${this.config.width} ${this.config.height}`);
      
      // Render initial state
      this.renderCanvas();
  },
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners: function() {
      // Add save button listener
      const saveBtn = this.elements.container.querySelector('#editor-save-btn');
      if (saveBtn) {
          saveBtn.addEventListener('click', () => this.save());
      }
      
      // Add validate button listener
      const validateBtn = this.elements.container.querySelector('#editor-validate-btn');
      if (validateBtn) {
          validateBtn.addEventListener('click', () => this.validateData());
      }
      
      // Add node button listener
      if (this.elements.addNodeBtn) {
          this.elements.addNodeBtn.addEventListener('click', () => {
              this.createNode();
          });
      }
      
      // Node template select listener
      if (this.elements.nodeTemplateSelect) {
          this.elements.nodeTemplateSelect.addEventListener('change', (e) => {
              const templateId = e.target.value;
              if (templateId) {
                  // Reset select
                  e.target.value = '';
                  this.createNode({ templateId });
              }
          });
      }
      
      // Node search listener
      if (this.elements.nodeSearch) {
          this.elements.nodeSearch.addEventListener('input', (e) => {
              this._state.filter.searchTerm = e.target.value;
              this._updateNodeList();
          });
      }
      
      // Canvas pan and zoom
      if (this.elements.canvas) {
          this.elements.canvas.addEventListener('mousedown', this._handleCanvasMouseDown.bind(this));
          this.elements.canvas.addEventListener('mousemove', this._handleCanvasMouseMove.bind(this));
          this.elements.canvas.addEventListener('mouseup', this._handleCanvasMouseUp.bind(this));
          this.elements.canvas.addEventListener('wheel', this._handleCanvasWheel.bind(this));
          
          // Prevent context menu on canvas
          this.elements.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      }
      
      // Canvas control buttons
      const zoomInBtn = this.elements.container.querySelector('#zoom-in-btn');
      const zoomOutBtn = this.elements.container.querySelector('#zoom-out-btn');
      const resetViewBtn = this.elements.container.querySelector('#reset-view-btn');
      
      if (zoomInBtn) {
          zoomInBtn.addEventListener('click', () => this.zoomCanvas(0.1));
      }
      
      if (zoomOutBtn) {
          zoomOutBtn.addEventListener('click', () => this.zoomCanvas(-0.1));
      }
      
      if (resetViewBtn) {
          resetViewBtn.addEventListener('click', () => this.resetCanvasView());
      }
      
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
          // Check if editor is focused
          if (!this._isEditorFocused()) return;
          
          // Undo: Ctrl+Z / Cmd+Z
          if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
              e.preventDefault();
              this.undo();
          }
          
          // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
          if ((e.ctrlKey || e.metaKey) && 
              (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
              e.preventDefault();
              this.redo();
          }
          
          // Delete: Del or Backspace
          if ((e.key === 'Delete' || e.key === 'Backspace') && 
              this._state.selectedNodeId) {
              // Only if not in an input field
              if (!e.target.matches('input, textarea, select')) {
                  e.preventDefault();
                  if (confirm('Delete selected node?')) {
                      this.deleteNode(this._state.selectedNodeId);
                  }
              }
          }
      });
  },
  
  /**
   * Initialize undo/redo system
   * @private
   */
  initUndoRedo: function() {
      // Initialize history state
      this._state.history = {
          past: [],
          future: [],
          current: null
      };
      
      // Create UI buttons for undo/redo
      const actionsContainer = this.elements.container.querySelector('.editor-actions');
      if (actionsContainer) {
          // Create undo button
          const undoButton = document.createElement('button');
          undoButton.className = 'editor-btn editor-btn-secondary editor-undo-btn';
          undoButton.innerHTML = '↩';
          undoButton.title = 'Undo (Ctrl+Z)';
          undoButton.disabled = true;
          undoButton.addEventListener('click', () => this.undo());
          
          // Create redo button
          const redoButton = document.createElement('button');
          redoButton.className = 'editor-btn editor-btn-secondary editor-redo-btn';
          redoButton.innerHTML = '↪';
          redoButton.title = 'Redo (Ctrl+Y)';
          redoButton.disabled = true;
          redoButton.addEventListener('click', () => this.redo());
          
          // Insert at beginning of actions bar
          actionsContainer.insertBefore(redoButton, actionsContainer.firstChild);
          actionsContainer.insertBefore(undoButton, actionsContainer.firstChild);
          
          // Store references
          this.elements.undoButton = undoButton;
          this.elements.redoButton = redoButton;
      }
  },
  
  /**
   * Load node templates
   * @private
   * @returns {Promise} Promise that resolves when templates are loaded
   */
  loadTemplates: function() {
      return fetch(this.config.templateUrl)
          .then(response => response.json())
          .then(data => {
              this.templates = data.templates || {};
              console.log(`Loaded ${Object.keys(this.templates).length} node templates`);
              
              // Populate template select
              if (this.elements.nodeTemplateSelect) {
                  // Clear existing options except the first
                  while (this.elements.nodeTemplateSelect.options.length > 1) {
                      this.elements.nodeTemplateSelect.options.remove(1);
                  }
                  
                  // Add template options
                  Object.entries(this.templates).forEach(([id, template]) => {
                      const option = document.createElement('option');
                      option.value = id;
                      option.textContent = template.name || id;
                      this.elements.nodeTemplateSelect.appendChild(option);
                  });
              }
              
              return this.templates;
          })
          .catch(error => {
              console.error('Failed to load templates:', error);
              this._showToast('Failed to load node templates', 'error');
              return {};
          });
  },
  
  /**
   * Load skill tree data
   * @private
   * @returns {Promise} Promise that resolves when data is loaded
   */
  loadSkillTreeData: function() {
      return fetch('/api/skill-tree')
          .then(response => response.json())
          .then(data => {
              this.data = data;
              console.log('Loaded skill tree data', {
                  specializations: this.data.specializations?.length || 0,
                  nodes: this.data.nodes?.length || 0,
                  connections: this.data.connections?.length || 0
              });
              
              // Update UI
              this._updateSpecializationFilter();
              this._updateNodeList();
              
              // Mark data as loaded
              this._state.dataLoaded = true;
              
              return this.data;
          })
          .catch(error => {
              console.error('Failed to load skill tree data:', error);
              this._showToast('Failed to load skill tree data', 'error');
              
              // Create empty data structure
              this.data = {
                  tree_version: '1.0',
                  specializations: [],
                  nodes: [],
                  connections: []
              };
              
              return this.data;
          });
  },
  
  /**
   * Start autosave timer
   * @private
   */
  startAutosaveTimer: function() {
      // Clear any existing timer
      if (this._autosaveTimer) {
          clearInterval(this._autosaveTimer);
      }
      
      // Set up autosave interval
      this._autosaveTimer = setInterval(() => {
          // Only save if data has been loaded and changes made
          if (this._state.dataLoaded && this._state.history.past.length > 0) {
              console.log('Auto-saving...');
              this.save();
          }
      }, this.config.autosaveInterval);
  },
  
  /**
   * Save data to server
   * @private
   * @returns {Promise<boolean>} Promise that resolves to success status
   */
  saveToServer: function() {
      // Show loading indicator
      this._showLoading('Saving skill tree data...');
      
      // Send data to server
      return fetch('/api/skill-tree', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.data)
      })
          .then(response => {
              if (!response.ok) {
                  throw new Error(`Server responded with status: ${response.status}`);
              }
              return response.json();
          })
          .then(data => {
              // Hide loading indicator
              this._hideLoading();
              
              // Show success message
              this._showToast('Skill tree data saved successfully', 'success');
              
              return true;
          })
          .catch(error => {
              console.error('Error saving skill tree data:', error);
              
              // Hide loading indicator
              this._hideLoading();
              
              // Show error message
              this._showToast('Error saving skill tree data: ' + error.message, 'error');
              
              return false;
          });
  },
  
  /**
   * Show a toast notification
   * @private
   * @param {String} message - Message to display
   * @param {String} type - Notification type (success, error, info, warning)
   */
  showToast: function(message, type = 'info') {
      if (!this.elements.toastContainer) return;
      
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      this.elements.toastContainer.appendChild(toast);
      
      // Auto-remove after a delay
      setTimeout(() => {
          if (toast.parentNode === this.elements.toastContainer) {
              this.elements.toastContainer.removeChild(toast);
          }
      }, 3000);
  },
  
  /**
   * Check if editor is the currently focused element
   * @private
   * @returns {Boolean} True if editor is focused
   */
  _isEditorFocused: function() {
      return document.activeElement === document.body || 
             this.elements.container.contains(document.activeElement);
  },
  
  /**
   * Show loading indicator
   * @private
   * @param {String} message - Loading message
   */
  _showLoading: function(message) {
      let loadingOverlay = document.getElementById('editor-loading-overlay');
      
      if (!loadingOverlay) {
          loadingOverlay = document.createElement('div');
          loadingOverlay.className = 'loading-overlay';
          loadingOverlay.id = 'editor-loading-overlay';
          
          const spinner = document.createElement('div');
          spinner.className = 'loading-spinner';
          
          const loadingText = document.createElement('div');
          loadingText.className = 'loading-text';
          loadingText.textContent = message || 'Loading...';
          
          loadingOverlay.appendChild(spinner);
          loadingOverlay.appendChild(loadingText);
          
          this.elements.container.appendChild(loadingOverlay);
      } else {
          // Update message if overlay already exists
          const loadingText = loadingOverlay.querySelector('.loading-text');
          if (loadingText) {
              loadingText.textContent = message || 'Loading...';
          }
          
          // Make sure it's visible
          loadingOverlay.style.display = 'flex';
      }
  },
  
  /**
   * Hide loading indicator
   * @private
   */
  _hideLoading: function() {
      const loadingOverlay = document.getElementById('editor-loading-overlay');
      if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
      }
  }
};

/**
* SkillTreeEditorOperations - Node and connection operations
*/
const SkillTreeEditorOperations = {
  /**
   * Create a new node
   * @param {Object} options - Node creation options
   * @returns {Object} Created node
   */
  createNode: function(options = {}) {
      // Save state before changes
      this._saveToHistory();
      
      // Generate unique ID
      const id = options.id || `node_${Date.now()}`;
      
      // Use template if specified
      let templateData = {};
      if (options.templateId && this.templates[options.templateId]) {
          templateData = this.templates[options.templateId];
      }
      
      // Create default position
      const position = options.position || {
          x: this.config.width / 2,
          y: this.config.height / 2
      };
      
      // Create node
      const node = {
          id,
          name: options.name || templateData.name || 'New Node',
          specialization: options.specialization || 
                        templateData.specialization || 
                        this._state.filter.specialization || 
                        null,
          tier: options.tier || templateData.tier || 1,
          description: options.description || templateData.description || 'Node description',
          effects: options.effects || (templateData.effects ? [...templateData.effects] : []),
          position,
          connections: options.connections || [],
          cost: options.cost || templateData.cost || {
              reputation: 10,
              skill_points: 1
          },
          visual: options.visual || templateData.visual || {
              size: 'minor',
              icon: 'help'
          }
      };
      
      // Add to data
      this.data.nodes.push(node);
      
      // Select new node
      this.selectNode(id);
      
      // Update UI
      this._updateNodeList();
      this.renderCanvas();
      
      // Show success message
      this._showToast('Node created successfully', 'success');
      
      return node;
  },
  
  /**
   * Update a node
   * @param {String} nodeId - ID of the node to update
   * @param {Object} updates - Properties to update
   * @returns {Object|null} Updated node or null if not found
   */
  updateNode: function(nodeId, updates) {
      // Find the node
      const nodeIndex = this.data.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return null;
      
      // Save state before changes
      this._saveToHistory();
      
      // Create updated node object
      const node = this.data.nodes[nodeIndex];
      
      // Apply updates
      Object.keys(updates).forEach(key => {
          // Handle nested properties
          if (key === 'cost' || key === 'visual') {
              node[key] = Object.assign({}, node[key], updates[key]);
          } else {
              node[key] = updates[key];
          }
      });
      
      // Update UI
      this._updateNodeList();
      this.renderCanvas();
      
      // Show success message
      this._showToast('Node updated successfully', 'success');
      
      return node;
  },
  
  /**
   * Delete a node
   * @param {String} nodeId - ID of the node to delete
   * @returns {Boolean} Success status
   */
  deleteNode: function(nodeId) {
      if (!nodeId) return false;
      
      // Find the node
      const nodeIndex = this.data.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return false;
      
      // Save state before changes
      this._saveToHistory();
      
      // Remove node
      this.data.nodes.splice(nodeIndex, 1);
      
      // Remove connections to/from this node
      this.data.connections = this.data.connections.filter(conn => 
          conn.source !== nodeId && conn.target !== nodeId
      );
      
      // Update UI
      if (this._state.selectedNodeId === nodeId) {
          this._state.selectedNodeId = null;
          
          // Clear editor panel
          if (this.elements.editorPanelContent) {
              this.elements.editorPanelContent.innerHTML = `
                  <div class="empty-state">
                      <p>Select a node to edit or create a new one</p>
                  </div>
              `;
          }
      }
      
      this._updateNodeList();
      this.renderCanvas();
      
      // Show success message
      this._showToast('Node deleted successfully', 'success');
      
      return true;
  },
  
  /**
   * Select a node for editing
   * @param {String} nodeId - ID of the node to select
   * @returns {Object|null} Selected node or null if not found
   */
  selectNode: function(nodeId) {
      // Find the node
      const node = this.data.nodes.find(n => n.id === nodeId);
      if (!node) return null;
      
      // Update selection state
      this._state.selectedNodeId = nodeId;
      
      // Update UI
      this._updateNodeList();
      this._renderNodeEditor(node);
      this.renderCanvas();
      
      return node;
  },
  
  /**
   * Create a connection between nodes
   * @param {String} sourceNodeId - ID of the source node
   * @param {String} targetNodeId - ID of the target node
   * @returns {Boolean} Success status
   */
  createConnection: function(sourceNodeId, targetNodeId) {
      // Check if connection already exists
      const connectionExists = this.data.connections.some(conn => 
          conn.source === sourceNodeId && conn.target === targetNodeId
      );
      
      if (connectionExists) {
          this._showToast('Connection already exists', 'warning');
          return false;
      }
      
      // Save state before changes
      this._saveToHistory();
      
      // Create connection
      this.data.connections.push({
          source: sourceNodeId,
          target: targetNodeId
      });
      
      // Update source node connections
      const sourceNode = this.data.nodes.find(n => n.id === sourceNodeId);
      if (sourceNode) {
          if (!sourceNode.connections) {
              sourceNode.connections = [];
          }
          
          if (!sourceNode.connections.includes(targetNodeId)) {
              sourceNode.connections.push(targetNodeId);
          }
      }
      
      // Re-render canvas
      this.renderCanvas();
      
      // Show success message
      this._showToast('Connection created successfully', 'success');
      
      return true;
  },
  
  /**
   * Delete a connection
   * @param {String} sourceNodeId - ID of the source node
   * @param {String} targetNodeId - ID of the target node
   * @returns {Boolean} Success status
   */
  deleteConnection: function(sourceNodeId, targetNodeId) {
      // Save state before changes
      this._saveToHistory();
      
      // Remove from connections array
      const initialLength = this.data.connections.length;
      this.data.connections = this.data.connections.filter(conn => 
          !(conn.source === sourceNodeId && conn.target === targetNodeId)
      );
      
      // Remove from source node's connections array
      const sourceNode = this.data.nodes.find(n => n.id === sourceNodeId);
      if (sourceNode && sourceNode.connections) {
          sourceNode.connections = sourceNode.connections.filter(id => id !== targetNodeId);
      }
      
      // Check if connection was removed
      const wasRemoved = initialLength > this.data.connections.length;
      
      // Re-render canvas
      this.renderCanvas();
      
      // Show message
      if (wasRemoved) {
          this._showToast('Connection removed successfully', 'success');
      } else {
          this._showToast('Connection not found', 'warning');
      }
      
      return wasRemoved;
  }
};

/**
* SkillTreeEditorCanvas - Canvas rendering and manipulation
*/
const SkillTreeEditorCanvas = {
  /**
   * Render the canvas with optimized performance
   */
  renderCanvas: function() {
      // Use requestAnimationFrame for smoother rendering
      if (this._state.renderPending) return;
      
      this._state.renderPending = true;
      requestAnimationFrame(() => {
          this._state.renderPending = false;
          
          // Clear existing content
          if (this.svg.connectionsGroup) {
              this.svg.connectionsGroup.innerHTML = '';
          }
          
          if (this.svg.nodesGroup) {
              this.svg.nodesGroup.innerHTML = '';
          }
          
          // Create document fragments for batched DOM operations
          const connectionsFragment = document.createDocumentFragment();
          const nodesFragment = document.createDocumentFragment();
          
          // Filter nodes if needed
          let nodesToDraw = this.data.nodes;
          
          if (this._state.filter.specialization !== null) {
              nodesToDraw = nodesToDraw.filter(node => 
                  node.specialization === this._state.filter.specialization || 
                  node.tier === 0 // Always show tier 0 (core) nodes
              );
          }
          
          // Create a node map for quick lookups
          const nodeMap = {};
          nodesToDraw.forEach(node => {
              nodeMap[node.id] = node;
          });
          
          // Draw connections first (they should be under nodes)
          this.data.connections.forEach(connection => {
              const sourceNode = nodeMap[connection.source];
              const targetNode = nodeMap[connection.target];
              
              // Skip if either node is not visible
              if (!sourceNode || !targetNode) return;
              
              // Get node positions
              const sourceX = sourceNode.position?.x || 0;
              const sourceY = sourceNode.position?.y || 0;
              const targetX = targetNode.position?.x || 0;
              const targetY = targetNode.position?.y || 0;
              
              // Get specialization color
              let connectionColor = '#888';
              
              if (sourceNode.specialization) {
                  const spec = this.data.specializations.find(s => s.id === sourceNode.specialization);
                  if (spec) {
                      connectionColor = spec.color;
                  }
              }
              
              // Create connection line
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', sourceX);
              line.setAttribute('y1', sourceY);
              line.setAttribute('x2', targetX);
              line.setAttribute('y2', targetY);
              line.setAttribute('stroke', connectionColor);
              line.setAttribute('stroke-width', '2');
              line.setAttribute('class', `connection connection-${connection.source} connection-${connection.target}`);
              
              // Add data attributes
              line.dataset.source = connection.source;
              line.dataset.target = connection.target;
              
              // Add event listener for connection deletion (dblclick)
              line.addEventListener('dblclick', () => {
                  if (confirm('Delete this connection?')) {
                      this.deleteConnection(connection.source, connection.target);
                  }
              });
              
              connectionsFragment.appendChild(line);
          });
          
          // Draw nodes
          nodesToDraw.forEach(node => {
              // Get node properties
              const nodeSize = node.visual?.size || 'minor';
              const x = node.position?.x || 0;
              const y = node.position?.y || 0;
              
              // Determine node color based on specialization
              let nodeColor = '#888';
              
              if (node.specialization) {
                  const spec = this.data.specializations.find(s => s.id === node.specialization);
                  if (spec) {
                      nodeColor = spec.color;
                  }
              } else if (node.id === 'core_physics' || nodeSize === 'core') {
                  nodeColor = '#4682B4';
              }
              
              // Get radius based on node size
              const radius = {
                  core: 25,
                  major: 18,
                  minor: 15,
                  connector: 12
              }[nodeSize] || 15;
              
              // Create node circle
              const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              circle.setAttribute('cx', x);
              circle.setAttribute('cy', y);
              circle.setAttribute('r', radius);
              circle.setAttribute('fill', nodeColor);
              circle.setAttribute('fill-opacity', '0.7');
              circle.setAttribute('stroke', '#fff');
              circle.setAttribute('stroke-width', node.id === this._state.selectedNodeId ? '4' : '2');
              circle.setAttribute('class', `node node-${node.id} node-size-${nodeSize}`);
              
              // Add data attributes
              circle.dataset.nodeId = node.id;
              circle.dataset.nodeName = node.name;
              
              // Add event listeners
              circle.addEventListener('click', (e) => {
                  e.stopPropagation();
                  this.selectNode(node.id);
              });
              
              // Add node to fragment
              nodesFragment.appendChild(circle);
              
              // Create node label
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('x', x);
              text.setAttribute('y', y + radius + 15);
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('fill', '#fff');
              text.setAttribute('font-size', '12');
              text.setAttribute('class', `node-label node-label-${node.id}`);
              text.textContent = node.name;
              
              // Add label to fragment
              nodesFragment.appendChild(text);
              
              // Create node icon if available
              if (node.visual?.icon) {
                  this._createNodeIcon(node, x, y, radius, nodesFragment);
              }
          });
          
          // Append fragments to their respective groups
          this.svg.connectionsGroup.appendChild(connectionsFragment);
          this.svg.nodesGroup.appendChild(nodesFragment);
          
          // Apply canvas transform
          this._applyCanvasTransform();
      });
  },
  
  /**
   * Zoom the canvas
   * @param {Number} delta - Zoom delta, positive to zoom in, negative to zoom out
   */
  zoomCanvas: function(delta) {
      // Calculate new scale
      const newScale = Math.max(
          0.5, // min zoom
          Math.min(3.0, // max zoom
              this._state.canvasScale + delta)
      );
      
      this._state.canvasScale = newScale;
      this._applyCanvasTransform();
  },
  
  /**
   * Reset the canvas view
   */
  resetCanvasView: function() {
      this._state.canvasScale = 1;
      this._state.canvasOffsetX = 0;
      this._state.canvasOffsetY = 0;
      this._applyCanvasTransform();
  }
};

/**
* SkillTreeEditorUndoRedo - Undo/redo functionality
*/
const SkillTreeEditorUndoRedo = {
  /**
   * Save current state to history
   * @private
   */
  _saveToHistory: function() {
      const currentState = JSON.stringify(this.data);
      
      // Only save if changed
      if (currentState !== this._state.history.current) {
          this._state.history.past.push(this._state.history.current);
          this._state.history.current = currentState;
          this._state.history.future = [];
          
          // Limit history size
          if (this._state.history.past.length > this.config.undoStackSize) {
              this._state.history.past.shift();
          }
          
          // Update UI
          this._updateUndoRedoButtons();
      }
  },
  
  /**
   * Update undo/redo button states
   * @private
   */
  _updateUndoRedoButtons: function() {
      if (this.elements.undoButton) {
          this.elements.undoButton.disabled = this._state.history.past.length === 0;
      }
      if (this.elements.redoButton) {
          this.elements.redoButton.disabled = this._state.history.future.length === 0;
      }
  },
  
  /**
   * Undo last action
   */
  undo: function() {
      if (this._state.history.past.length === 0) return;
      
      // Move current state to future
      this._state.history.future.push(this._state.history.current);
      
      // Get previous state
      this._state.history.current = this._state.history.past.pop();
      
      // Apply state
      this.data = JSON.parse(this._state.history.current);
      
      // Update UI
      this._updateUndoRedoButtons();
      this._updateNodeList();
      this.renderCanvas();
      
      // Clear selection if node no longer exists
      if (this._state.selectedNodeId) {
          const nodeExists = this.data.nodes.some(n => n.id === this._state.selectedNodeId);
          if (!nodeExists) {
              this._state.selectedNodeId = null;
              if (this.elements.editorPanelContent) {
                  this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
              }
          } else {
              // Re-render selected node
              this._renderNodeEditor(this.data.nodes.find(n => n.id === this._state.selectedNodeId));
          }
      }
      
      // Show toast
      this._showToast('Undo successful', 'info');
  },
  
  /**
   * Redo last undone action
   */
  redo: function() {
      if (this._state.history.future.length === 0) return;
      
      // Move current state to past
      this._state.history.past.push(this._state.history.current);
      
      // Get next state
      this._state.history.current = this._state.history.future.pop();
      
      // Apply state
      this.data = JSON.parse(this._state.history.current);
      
      // Update UI
      this._updateUndoRedoButtons();
      this._updateNodeList();
      this.renderCanvas();
      
      // Clear selection if node no longer exists
      if (this._state.selectedNodeId) {
          const nodeExists = this.data.nodes.some(n => n.id === this._state.selectedNodeId);
          if (!nodeExists) {
              this._state.selectedNodeId = null;
              if (this.elements.editorPanelContent) {
                  this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
              }
          } else {
              // Re-render selected node
              this._renderNodeEditor(this.data.nodes.find(n => n.id === this._state.selectedNodeId));
          }
      }
      
      // Show toast
      this._showToast('Redo successful', 'info');
  }
};

/**
* SkillTreeEditorUtils - Utility functions for the editor
*/
const SkillTreeEditorUtils = {
  /**
   * Export data to JSON
   * @returns {String} JSON string
   */
  exportToJson: function() {
      return JSON.stringify(this.data, null, 2);
  },
  
  /**
   * Import data from JSON
   * @param {String} json - JSON string to import
   * @returns {Boolean} Success status
   */
  importFromJson: function(json) {
      try {
          // Parse JSON
          const data = JSON.parse(json);
          
          // Validate data structure
          if (!data.specializations || !data.nodes || !data.connections) {
              throw new Error('Invalid data structure');
          }
          
          // Save current state to history
          this._saveToHistory();
          
          // Update data
          this.data = data;
          
          // Update UI
          this._updateSpecializationFilter();
          this._updateNodeList();
          this.renderCanvas();
          
          // Clear selection
          this._state.selectedNodeId = null;
          if (this.elements.editorPanelContent) {
              this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
          }
          
          // Show success message
          this._showToast('Data imported successfully', 'success');
          
          return true;
      } catch (error) {
          console.error('Error importing data:', error);
          this._showToast('Error importing data: ' + error.message, 'error');
          return false;
      }
  },
  
  /**
   * Validate the skill tree data
   * @returns {Object} Validation result with errors and warnings
   */
  validateData: function() {
      // Simple validation
      const errors = [];
      const warnings = [];
      
      // Check required top-level properties
      if (!this.data.tree_version) {
          errors.push('Missing tree_version');
      }
      
      // Check specializations
      if (!Array.isArray(this.data.specializations)) {
          errors.push('specializations must be an array');
      } else {
          this.data.specializations.forEach((spec, index) => {
              if (!spec.id) {
                  errors.push(`Specialization at index ${index} missing id`);
              }
              if (!spec.name) {
                  errors.push(`Specialization at index ${index} missing name`);
              }
          });
      }
      
      // Check nodes
      if (!Array.isArray(this.data.nodes)) {
          errors.push('nodes must be an array');
      } else {
          this.data.nodes.forEach((node, index) => {
              if (!node.id) {
                  errors.push(`Node at index ${index} missing id`);
              }
              if (!node.name) {
                  errors.push(`Node at index ${index} missing name`);
              }
              if (node.tier === undefined) {
                  errors.push(`Node at index ${index} missing tier`);
              }
              if (!node.position) {
                  errors.push(`Node at index ${index} missing position`);
              }
              if (!node.connections) {
                  errors.push(`Node at index ${index} missing connections`);
              }
              
              // Check if node has a valid specialization
              if (node.specialization && 
                  !this.data.specializations.some(s => s.id === node.specialization)) {
                  warnings.push(`Node ${node.id} has unknown specialization: ${node.specialization}`);
              }
          });
      }
      
      // Check connections
      if (!Array.isArray(this.data.connections)) {
          errors.push('connections must be an array');
      } else {
          this.data.connections.forEach((conn, index) => {
              if (!conn.source) {
                  errors.push(`Connection at index ${index} missing source`);
              }
              if (!conn.target) {
                  errors.push(`Connection at index ${index} missing target`);
              }
              
              // Check if source and target nodes exist
              if (conn.source && !this.data.nodes.some(n => n.id === conn.source)) {
                  errors.push(`Connection at index ${index} has unknown source: ${conn.source}`);
              }
              if (conn.target && !this.data.nodes.some(n => n.id === conn.target)) {
                  errors.push(`Connection at index ${index} has unknown target: ${conn.target}`);
              }
          });
      }
      
      // Show result
      if (errors.length === 0) {
          this._showToast('Validation successful!', 'success');
      } else {
          this._showToast(`Validation failed: ${errors.length} errors found`, 'error');
          
          // Log details
          console.error('Validation errors:', errors);
          if (warnings.length > 0) {
              console.warn('Validation warnings:', warnings);
          }
          
          // Show dialog with first few errors
          const errorList = errors.slice(0, 5).join('\n- ');
          alert(`Validation errors:\n- ${errorList}${errors.length > 5 ? '\n- ...' : ''}`);
      }
      
      return {
          valid: errors.length === 0,
          errors,
          warnings
      };
  }
};

// Export the module
window.SkillTreeEditor = SkillTreeEditorCore;