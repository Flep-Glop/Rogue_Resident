// medical_physics_game/static/js/ui/skill_tree_editor.js

/**
 * SkillTreeEditor
 * A comprehensive visual editor for creating and managing skill tree nodes
 * This is a consolidated version that combines functionality from both editor implementations
 */
class SkillTreeEditor {
  /**
   * Initialize the editor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default configuration
    this.options = Object.assign({
      containerId: 'skill-tree-editor',
      width: 800,
      height: 600,
      onSave: null,
      templateUrl: '/static/templates/node_templates.json',
      autosaveInterval: 60000, // 1 minute
      undoStackSize: 50
    }, options);
    
    // Initialize state
    this.state = {
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
      }
    };
    
    // Core data structures
    this.data = {
      specializations: [],
      nodes: [],
      connections: []
    };
    
    // Templates for creating new nodes
    this.templates = {};
    
    // For undo/redo system
    this.history = {
      past: [],
      future: [],
      current: null
    };
    
    // Element references
    this.elements = {
      container: null,
      sidebar: null,
      canvas: null,
      panel: null,
      nodeList: null,
      toast: null
    };
    
    // SVG elements
    this.svg = null;
    this.connectionsGroup = null;
    this.nodesGroup = null;
    
    // Initialize the editor
    this.initialize();
  }
  
  /**
   * Initialize the editor
   * @returns {SkillTreeEditor} The editor instance for chaining
   */
  initialize() {
    console.log("Initializing skill tree editor...");
    
    // Check if already initialized
    if (this.state.initialized) {
      console.log("Skill tree editor already initialized");
      return this;
    }
    
    // Get container element
    this.elements.container = document.getElementById(this.options.containerId);
    if (!this.elements.container) {
      console.error(`Container element not found: ${this.options.containerId}`);
      this.state.errorState = true;
      return this;
    }
    
    // Create editor structure
    this._createEditorDOM();
    
    // Load templates
    this._loadTemplates()
      .then(() => {
        // Load skill tree data
        return this._loadSkillTreeData();
      })
      .then(() => {
        // Initialize canvas
        this._initCanvas();
        
        // Initialize event listeners
        this._initEventListeners();
        
        // Initialize undo/redo system
        this._initUndoRedo();
        
        // Mark as initialized
        this.state.initialized = true;
        console.log('Skill Tree Editor initialized');
        
        // Initialize history with current state
        this.history.current = JSON.stringify(this.data);
        
        // Show toast
        this._showToast('Editor loaded successfully', 'success');
        
        // Start autosave timer if configured
        if (this.options.autosaveInterval > 0) {
          this._startAutosaveTimer();
        }
      })
      .catch(error => {
        console.error('Failed to initialize Skill Tree Editor:', error);
        this.state.errorState = true;
        this._showToast('Failed to initialize editor', 'error');
        
        // If ErrorHandler is available, report the error
        if (window.ErrorHandler) {
          window.ErrorHandler.handleError(
            error,
            'Skill Tree Editor Initialization',
            window.ErrorHandler.SEVERITY.ERROR
          );
        }
      });
    
    return this;
  }
  
  /**
   * Create the DOM structure for the editor
   * @private
   */
  _createEditorDOM() {
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
    this.elements.sidebar = document.createElement('div');
    this.elements.sidebar.className = 'editor-sidebar';
    
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
    this.elements.sidebar.appendChild(nodeListSection);
    
    // Create canvas
    this.elements.canvas = document.createElement('div');
    this.elements.canvas.className = 'editor-canvas';
    this.elements.canvas.innerHTML = `
      <svg id="editor-svg" width="100%" height="100%"></svg>
      <div class="canvas-controls">
        <button class="canvas-control-btn" id="zoom-in-btn">+</button>
        <button class="canvas-control-btn" id="zoom-out-btn">-</button>
        <button class="canvas-control-btn" id="reset-view-btn">↺</button>
      </div>
    `;
    
    // Create editor panel
    this.elements.panel = document.createElement('div');
    this.elements.panel.className = 'editor-panel';
    this.elements.panel.innerHTML = `
      <div class="editor-panel-content" id="editor-panel-content">
        <div class="empty-state">
          <p>Select a node to edit or create a new one</p>
        </div>
      </div>
    `;
    
    // Append elements to content
    content.appendChild(this.elements.sidebar);
    content.appendChild(this.elements.canvas);
    content.appendChild(this.elements.panel);
    
    // Append content to container
    this.elements.container.appendChild(content);
    
    // Create or find toast container
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    this.elements.toast = toastContainer;
    
    // Store references to important elements
    this.elements.nodeList = document.getElementById('node-list');
    this.elements.specializationFilter = document.getElementById('specialization-filter');
    this.elements.nodeTemplateSelect = document.getElementById('node-template-select');
    this.elements.nodeSearch = document.getElementById('node-search');
    this.elements.addNodeBtn = document.getElementById('add-node-btn');
    this.elements.editorPanelContent = document.getElementById('editor-panel-content');
    this.svg = document.getElementById('editor-svg');
  }
  
  /**
   * Initialize the canvas
   * @private
   */
  _initCanvas() {
    // Create SVG groups
    this.connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.connectionsGroup.classList.add('connections-group');
    
    this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesGroup.classList.add('nodes-group');
    
    // Append groups to SVG
    this.svg.appendChild(this.connectionsGroup);
    this.svg.appendChild(this.nodesGroup);
    
    // Set viewBox
    this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    
    // Render initial state
    this.renderCanvas();
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Save button
    const saveBtn = this.elements.container.querySelector('#editor-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', this.save.bind(this));
    }
    
    // Validate button
    const validateBtn = this.elements.container.querySelector('#editor-validate-btn');
    if (validateBtn) {
      validateBtn.addEventListener('click', this.validateData.bind(this));
    }
    
    // Add node button
    if (this.elements.addNodeBtn) {
      this.elements.addNodeBtn.addEventListener('click', this.createNode.bind(this));
    }
    
    // Node template select
    if (this.elements.nodeTemplateSelect) {
      this.elements.nodeTemplateSelect.addEventListener('change', this._handleTemplateSelect.bind(this));
    }
    
    // Node search
    if (this.elements.nodeSearch) {
      this.elements.nodeSearch.addEventListener('input', this._handleSearch.bind(this));
    }
    
    // Canvas pan and zoom
    this.elements.canvas.addEventListener('mousedown', this._handleCanvasMouseDown.bind(this));
    this.elements.canvas.addEventListener('mousemove', this._handleCanvasMouseMove.bind(this));
    this.elements.canvas.addEventListener('mouseup', this._handleCanvasMouseUp.bind(this));
    this.elements.canvas.addEventListener('wheel', this._handleCanvasWheel.bind(this));
    
    // Canvas control buttons
    const zoomInBtn = this.elements.container.querySelector('#zoom-in-btn');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => this.zoomCanvas(0.1));
    }
    
    const zoomOutBtn = this.elements.container.querySelector('#zoom-out-btn');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.zoomCanvas(-0.1));
    }
    
    const resetViewBtn = this.elements.container.querySelector('#reset-view-btn');
    if (resetViewBtn) {
      resetViewBtn.addEventListener('click', this.resetCanvasView.bind(this));
    }
    
    // Prevent context menu on canvas (for right-click actions)
    this.elements.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Document-level keyboard shortcuts
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
  }
  
  /**
   * Handle keyboard shortcuts
   * @private
   * @param {KeyboardEvent} event - The keyboard event
   */
  _handleKeyDown(event) {
    // Check if editor is focused
    if (!this._isEditorFocused()) {
      return;
    }
    
    // Undo: Ctrl+Z / Cmd+Z
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    }
    
    // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
    if ((event.ctrlKey || event.metaKey) && 
        (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      this.redo();
    }
    
    // Delete: Del or Backspace
    if ((event.key === 'Delete' || event.key === 'Backspace') && 
        this.state.selectedNodeId && 
        !event.target.matches('input, textarea, select')) {
      event.preventDefault();
      
      // Confirm deletion
      if (confirm('Delete selected node?')) {
        this.deleteNode(this.state.selectedNodeId);
      }
    }
    
    // Save: Ctrl+S / Cmd+S
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.save();
    }
  }
  
  /**
   * Check if editor is focused
   * @private
   * @returns {Boolean} True if editor is focused
   */
  _isEditorFocused() {
    return document.activeElement === document.body || 
           this.elements.container.contains(document.activeElement);
  }
  
  /**
   * Initialize undo/redo system
   * @private
   */
  _initUndoRedo() {
    // Initialize history state
    this.history = {
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
  }
  
  /**
   * Start autosave timer
   * @private
   */
  _startAutosaveTimer() {
    // Clear any existing timer
    if (this._autosaveTimer) {
      clearInterval(this._autosaveTimer);
    }
    
    // Set up autosave interval
    this._autosaveTimer = setInterval(() => {
      // Only save if data has been loaded and changes made
      if (this.state.dataLoaded && this.history.past.length > 0) {
        console.log('Auto-saving...');
        this.save();
      }
    }, this.options.autosaveInterval);
  }
  
  /**
   * Load node templates
   * @private
   * @returns {Promise} Promise that resolves when templates are loaded
   */
  _loadTemplates() {
    return fetch(this.options.templateUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load templates: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
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
        
        // If ErrorHandler is available, report the error
        if (window.ErrorHandler) {
          window.ErrorHandler.handleError(
            error,
            'Template Loading',
            window.ErrorHandler.SEVERITY.WARNING
          );
        }
        
        return {};
      });
  }
  
  /**
   * Load skill tree data
   * @private
   * @returns {Promise} Promise that resolves when data is loaded
   */
  _loadSkillTreeData() {
    // Use ApiClient if available, otherwise use fetch directly
    const loadPromise = window.ApiClient && window.ApiClient.loadSkillTree
      ? window.ApiClient.loadSkillTree()
      : fetch('/api/skill-tree').then(response => response.json());
    
    return loadPromise
      .then(data => {
        if (!data) {
          throw new Error('Empty response when loading skill tree data');
        }
        
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
        this.state.dataLoaded = true;
        
        return this.data;
      })
      .catch(error => {
        console.error('Failed to load skill tree data:', error);
        this._showToast('Failed to load skill tree data', 'error');
        
        // If ErrorHandler is available, report the error
        if (window.ErrorHandler) {
          window.ErrorHandler.handleError(
            error,
            'Skill Tree Loading',
            window.ErrorHandler.SEVERITY.ERROR
          );
        }
        
        // Create empty data structure
        this.data = {
          tree_version: '1.0',
          specializations: [],
          nodes: [],
          connections: []
        };
        
        return this.data;
      });
  }
  
  /**
   * Save data to server
   * @private
   * @returns {Promise<boolean>} Promise that resolves to success status
   */
  _saveToServer() {
    this._showLoading('Saving skill tree data...');
    
    // Use ApiClient if available, otherwise use fetch directly
    const savePromise = window.ApiClient && window.ApiClient.saveSkillTree
      ? window.ApiClient.saveSkillTree(this.data)
      : fetch('/api/skill-tree', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.data)
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          return response.json();
        });
    
    return savePromise
      .then(data => {
        this._hideLoading();
        this._showToast('Skill tree data saved successfully', 'success');
        return true;
      })
      .catch(error => {
        console.error('Error saving skill tree data:', error);
        this._hideLoading();
        this._showToast('Error saving skill tree data: ' + error.message, 'error');
        
        // If ErrorHandler is available, report the error
        if (window.ErrorHandler) {
          window.ErrorHandler.handleError(
            error,
            'Skill Tree Saving',
            window.ErrorHandler.SEVERITY.ERROR
          );
        }
        
        return false;
      });
  }
  
  /**
   * Update the specialization filter
   * @private
   */
  _updateSpecializationFilter() {
    const filter = this.elements.specializationFilter;
    if (!filter) return;
    
    filter.innerHTML = '';
    
    // Add "All" option
    const allChip = document.createElement('div');
    allChip.className = `specialization-chip ${this.state.filter.specialization === null ? 'selected' : ''}`;
    allChip.dataset.specialization = 'all';
    allChip.textContent = 'All';
    allChip.addEventListener('click', () => this._filterBySpecialization(null));
    filter.appendChild(allChip);
    
    // Add specialization options
    this.data.specializations.forEach(spec => {
      const chip = document.createElement('div');
      chip.className = `specialization-chip ${this.state.filter.specialization === spec.id ? 'selected' : ''}`;
      chip.dataset.specialization = spec.id;
      
      const colorDot = document.createElement('span');
      colorDot.className = 'color-dot';
      colorDot.style.backgroundColor = spec.color;
      
      chip.appendChild(colorDot);
      chip.appendChild(document.createTextNode(spec.name));
      
      chip.addEventListener('click', () => this._filterBySpecialization(spec.id));
      filter.appendChild(chip);
    });
  }
  
  /**
   * Update the node list based on current filters
   * @private
   */
  _updateNodeList() {
    const list = this.elements.nodeList;
    if (!list) return;
    
    list.innerHTML = '';
    
    // Filter nodes
    const filteredNodes = this.data.nodes.filter(node => {
      // Filter by specialization
      if (this.state.filter.specialization !== null && 
          node.specialization !== this.state.filter.specialization) {
        return false;
      }
      
      // Filter by tier
      if (this.state.filter.tier !== null && 
          node.tier !== this.state.filter.tier) {
        return false;
      }
      
      // Filter by search term
      if (this.state.filter.searchTerm && 
          !node.name.toLowerCase().includes(this.state.filter.searchTerm.toLowerCase()) &&
          !node.id.toLowerCase().includes(this.state.filter.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Sort nodes by tier, then specialization, then name
    filteredNodes.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.specialization !== b.specialization) {
        return (a.specialization || '').localeCompare(b.specialization || '');
      }
      return a.name.localeCompare(b.name);
    });
    
    // Create node list items
    filteredNodes.forEach(node => {
      const item = document.createElement('div');
      item.className = `node-list-item ${node.id === this.state.selectedNodeId ? 'selected' : ''}`;
      item.dataset.nodeId = node.id;
      
      const header = document.createElement('div');
      header.className = 'node-list-header';
      header.textContent = node.name;
      
      const subtext = document.createElement('div');
      subtext.className = 'node-list-subtext';
      
      // Get specialization name
      let specName = 'Core';
      if (node.specialization) {
        const spec = this.data.specializations.find(s => s.id === node.specialization);
        if (spec) specName = spec.name;
      }
      
      subtext.textContent = `${specName} - Tier ${node.tier}`;
      
      item.appendChild(header);
      item.appendChild(subtext);
      
      item.addEventListener('click', () => this.selectNode(node.id));
      
      list.appendChild(item);
    });
    
    // Add empty state if no nodes
    if (filteredNodes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No nodes match your filter criteria';
      list.appendChild(emptyState);
    }
  }
  
  /**
   * Filter nodes by specialization
   * @private
   * @param {String|null} specializationId - Specialization ID to filter by, or null for all
   */
  _filterBySpecialization(specializationId) {
    this.state.filter.specialization = specializationId;
    this._updateSpecializationFilter();
    this._updateNodeList();
    this.renderCanvas();
  }
  
  /**
   * Handle search input
   * @private
   * @param {Event} event - Input event
   */
  _handleSearch(event) {
    this.state.filter.searchTerm = event.target.value;
    this._updateNodeList();
  }
  
  /**
   * Handle template selection
   * @private
   * @param {Event} event - Change event
   */
  _handleTemplateSelect(event) {
    const templateId = event.target.value;
    if (!templateId) return;
    
    // Reset select
    event.target.value = '';
    
    // Create node from template
    this.createNodeFromTemplate(templateId);
  }
  
  /**
   * Handle canvas mouse down event
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _handleCanvasMouseDown(event) {
    // Check if clicking on a node
    const nodeElement = event.target.closest('.node');
    
    if (nodeElement) {
      const nodeId = nodeElement.dataset.nodeId;
      
      // Left click selects node
      if (event.button === 0) {
        this.selectNode(nodeId);
        return;
      }
      
      // Right click starts connection
      if (event.button === 2) {
        this._startConnectionDrag(nodeId, event);
        return;
      }
      
      return;
    }
    
    // Start canvas drag
    if (event.button === 0) {
      this.state.isDragging = true;
      this.state.dragStartX = event.clientX;
      this.state.dragStartY = event.clientY;
      this.elements.canvas.style.cursor = 'grabbing';
    }
  }
  
  /**
   * Handle canvas mouse move event
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _handleCanvasMouseMove(event) {
    // Handle dragging canvas
    if (this.state.isDragging) {
      const dx = event.clientX - this.state.dragStartX;
      const dy = event.clientY - this.state.dragStartY;
      
      this.state.canvasOffsetX += dx;
      this.state.canvasOffsetY += dy;
      
      this.state.dragStartX = event.clientX;
      this.state.dragStartY = event.clientY;
      
      this._applyCanvasTransform();
      return;
    }
    
    // Handle connection dragging
    if (this.state.editingConnection) {
      this._updateConnectionDrag(event);
    }
  }
  
  /**
   * Handle canvas mouse up event
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _handleCanvasMouseUp(event) {
    // End canvas drag
    if (this.state.isDragging) {
      this.state.isDragging = false;
      this.elements.canvas.style.cursor = 'grab';
    }
    
    // End connection drag
    if (this.state.editingConnection) {
      this._finishConnectionDrag(event);
    }
  }
  
  /**
   * Handle canvas wheel event for zooming
   * @private
   * @param {WheelEvent} event - Wheel event
   */
  _handleCanvasWheel(event) {
    event.preventDefault();
    
    // Calculate zoom delta
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.zoomCanvas(delta);
  }
  
  /**
   * Show a toast notification
   * @private
   * @param {String} message - Message to display
   * @param {String} type - Notification type (success, error, info, warning)
   */
  _showToast(message, type = 'info') {
    // Try to use UIUtils if available
    if (window.UIUtils && window.UIUtils.showToast) {
      window.UIUtils.showToast(message, type);
      return;
    }
    
    // Otherwise use internal toast
    if (!this.elements.toast) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    this.elements.toast.appendChild(toast);
    
    // Auto-remove after a delay
    setTimeout(() => {
      if (toast.parentNode === this.elements.toast) {
        this.elements.toast.removeChild(toast);
      }
    }, 3000);
  }
  
  /**
   * Show loading indicator
   * @private
   * @param {String} message - Loading message
   */
  _showLoading(message) {
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
  }
  
  /**
   * Hide loading indicator
   * @private
   */
  _hideLoading() {
    const loadingOverlay = document.getElementById('editor-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
  
  // =====================================
  // PUBLIC API METHODS
  // =====================================
  
  /**
   * Save changes to the server
   * @returns {Promise<boolean>} Promise that resolves to success status
   */
  save() {
    console.log("Saving skill tree data");
    
    // Validate data first
    return this.validateData()
      .then(validation => {
        if (!validation.valid) {
          // Show validation errors
          this._showToast(`Validation failed: ${validation.errors.length} errors found`, 'error');
          console.error('Validation errors:', validation.errors);
          
          if (!confirm('Data has validation errors. Save anyway?')) {
            return false;
          }
        }
        
        // Call save callback if provided
        if (typeof this.options.onSave === 'function') {
          try {
            this.options.onSave(this.data);
            this._showToast('Data saved successfully via callback', 'success');
            return true;
          } catch (error) {
            console.error("Error in save callback:", error);
            this._showToast('Error saving data via callback', 'error');
            
            // Try server save as fallback
            return this._saveToServer();
          }
        } else {
          // Save to server
          return this._saveToServer();
        }
      });
  }
  
  /**
   * Validate skill tree data
   * @returns {Promise<Object>} Promise resolving to validation result
   */
  validateData() {
    // Check if validator is available
    if (window.SkillTreeValidator) {
      const result = window.SkillTreeValidator.validateSkillTree(this.data);
      
      // Show result
      if (result.valid) {
        this._showToast('Validation successful! No errors found.', 'success');
      } else {
        this._showToast(`Validation failed: ${result.errors.length} errors found`, 'error');
        console.error('Validation errors:', result.errors);
        
        // Show first few errors
        const errorList = result.errors.slice(0, 3).join('\n');
        alert(`Validation failed with the following errors:\n\n${errorList}\n\n${result.errors.length > 3 ? `...and ${result.errors.length - 3} more errors` : ''}`);
      }
      
      return Promise.resolve(result);
    }
    
    // Fallback to simple validation
    const validation = this._simpleValidate();
    
    // Show result
    if (validation.valid) {
      this._showToast('Basic validation successful!', 'success');
    } else {
      this._showToast(`Validation failed: ${validation.errors.length} errors found`, 'error');
      console.error('Validation errors:', validation.errors);
      
      // Show first few errors
      const errorList = validation.errors.slice(0, 3).join('\n');
      alert(`Validation failed with the following errors:\n\n${errorList}\n\n${validation.errors.length > 3 ? `...and ${validation.errors.length - 3} more errors` : ''}`);
    }
    
    return Promise.resolve(validation);
  }
  
  /**
   * Simple validation for the data
   * @private
   * @returns {Object} Validation result
   */
  _simpleValidate() {
    const errors = [];
    
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
      });
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * Create a new node
   * @param {Object} [options] - Optional node properties
   * @returns {Object} Created node
   */
  createNode(options = {}) {
    // Save state before changes
    this._saveToHistory();
    
    // Generate unique ID
    const id = options.id || `node_${Date.now()}`;
    
    // Create default position
    const position = options.position || {
      x: this.options.width / 2,
      y: this.options.height / 2
    };
    
    // Create node
    const node = {
      id,
      name: options.name || 'New Node',
      specialization: options.specialization || this.state.filter.specialization || null,
      tier: options.tier || 1,
      description: options.description || 'Node description',
      effects: options.effects || [],
      position,
      connections: options.connections || [],
      cost: options.cost || {
        reputation: 10,
        skill_points: 1
      },
      visual: options.visual || {
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
  }
  
  /**
   * Create a node from a template
   * @param {String} templateId - ID of the template to use
   * @returns {Object} Created node
   */
  createNodeFromTemplate(templateId) {
    const template = this.templates[templateId];
    if (!template) {
      this._showToast('Template not found', 'error');
      return null;
    }
    
    // Generate unique ID
    const id = `node_${Date.now()}`;
    
    // Create default position
    const position = {
      x: this.options.width / 2,
      y: this.options.height / 2
    };
    
    // Save state before changes
    this._saveToHistory();
    
    // Create node
    const node = {
      id,
      name: template.name || 'New Node',
      specialization: this.state.filter.specialization || template.specialization || null,
      tier: template.tier || 1,
      description: template.description || 'Node description',
      effects: template.effects ? [...template.effects] : [],
      position,
      connections: [],
      cost: template.cost || {
        reputation: 10,
        skill_points: 1
      },
      visual: template.visual || {
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
    this._showToast('Node created from template', 'success');
    
    return node;
  }
  
  /**
   * Update a node
   * @param {String} nodeId - ID of the node to update
   * @param {Object} updates - Properties to update
   * @returns {Object|null} Updated node or null if not found
   */
  updateNode(nodeId, updates) {
    // Find the node
    const nodeIndex = this.data.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return null;
    
    // Save state before changes
    this._saveToHistory();
    
    // Update node
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
  }
  
  /**
   * Delete a node
   * @param {String} nodeId - ID of the node to delete
   * @returns {Boolean} Success status
   */
  deleteNode(nodeId) {
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
    if (this.state.selectedNodeId === nodeId) {
      this.state.selectedNodeId = null;
      
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
  }
  
  /**
   * Select a node for editing
   * @param {String} nodeId - ID of the node to select
   * @returns {Object|null} Selected node or null if not found
   */
  selectNode(nodeId) {
    // Find the node
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // Update selection state
    this.state.selectedNodeId = nodeId;
    
    // Update UI
    this._updateNodeList();
    this._renderNodeEditor(node);
    this.renderCanvas();
    
    return node;
  }
  
  /**
   * Create a connection between nodes
   * @param {String} sourceNodeId - ID of the source node
   * @param {String} targetNodeId - ID of the target node
   * @returns {Boolean} Success status
   */
  createConnection(sourceNodeId, targetNodeId) {
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
  }
  
  /**
   * Delete a connection
   * @param {String} sourceNodeId - ID of the source node
   * @param {String} targetNodeId - ID of the target node
   * @returns {Boolean} Success status
   */
  deleteConnection(sourceNodeId, targetNodeId) {
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
  
  /**
   * Start dragging a connection
   * @private
   * @param {String} sourceNodeId - ID of the source node
   * @param {MouseEvent} event - Mouse event
   */
  _startConnectionDrag(sourceNodeId, event) {
    const sourceNode = this.data.nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;
    
    // Create temporary line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'connection-line dragging');
    line.setAttribute('x1', sourceNode.position.x);
    line.setAttribute('y1', sourceNode.position.y);
    line.setAttribute('x2', sourceNode.position.x);
    line.setAttribute('y2', sourceNode.position.y);
    
    this.connectionsGroup.appendChild(line);
    
    // Set editing state
    this.state.editingConnection = {
      sourceNodeId,
      line
    };
  }
  
  /**
   * Update connection being dragged
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _updateConnectionDrag(event) {
    if (!this.state.editingConnection || !this.state.editingConnection.line) return;
    
    // Get mouse position relative to SVG
    const svgRect = this.svg.getBoundingClientRect();
    const x = (event.clientX - svgRect.left - this.state.canvasOffsetX) / this.state.canvasScale;
    const y = (event.clientY - svgRect.top - this.state.canvasOffsetY) / this.state.canvasScale;
    
    // Update line end position
    this.state.editingConnection.line.setAttribute('x2', x);
    this.state.editingConnection.line.setAttribute('y2', y);
    
    // Highlight node under cursor
    this._highlightNodeUnderCursor(event);
  }
  
  /**
   * Highlight node under cursor during connection dragging
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _highlightNodeUnderCursor(event) {
    // Reset highlights
    const allNodeElements = this.svg.querySelectorAll('.node');
    allNodeElements.forEach(el => {
      el.setAttribute('stroke-width', '2');
    });
    
    // Check if cursor is over a node
    const nodeElement = event.target.closest('.node');
    if (nodeElement) {
      nodeElement.setAttribute('stroke-width', '4');
    }
  }
  
  /**
   * Finish dragging a connection
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _finishConnectionDrag(event) {
    if (!this.state.editingConnection) return;
    
    // Check if dropped on a node
    const nodeElement = event.target.closest('.node');
    if (nodeElement) {
      const targetNodeId = nodeElement.dataset.nodeId;
      
      // Don't connect to self
      if (targetNodeId !== this.state.editingConnection.sourceNodeId) {
        this.createConnection(this.state.editingConnection.sourceNodeId, targetNodeId);
      }
    }
    
    // Remove temporary line
    if (this.state.editingConnection.line && this.state.editingConnection.line.parentNode) {
      this.state.editingConnection.line.parentNode.removeChild(this.state.editingConnection.line);
    }
    
    // Reset editing state
    this.state.editingConnection = null;
    
    // Reset node highlights
    const allNodeElements = this.svg.querySelectorAll('.node');
    allNodeElements.forEach(el => {
      el.setAttribute('stroke-width', '2');
    });
  }
  
  /**
   * Render the canvas with optimized performance
   */
  renderCanvas() {
    // Use requestAnimationFrame for smoother rendering
    if (this.state.renderPending) return;
    
    this.state.renderPending = true;
    requestAnimationFrame(() => {
      this.state.renderPending = false;
      
      // Clear existing content
      this.connectionsGroup.innerHTML = '';
      this.nodesGroup.innerHTML = '';
      
      // Create document fragments for batched DOM operations
      const connectionsFragment = document.createDocumentFragment();
      const nodesFragment = document.createDocumentFragment();
      
      // Filter nodes if needed
      let nodesToDraw = this.data.nodes;
      
      if (this.state.filter.specialization !== null) {
        nodesToDraw = nodesToDraw.filter(node => 
          node.specialization === this.state.filter.specialization || 
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
        circle.setAttribute('stroke-width', node.id === this.state.selectedNodeId ? '4' : '2');
        circle.setAttribute('class', `node node-${node.id} node-size-${nodeSize}`);
        
        // Add data attributes
        circle.dataset.nodeId = node.id;
        circle.dataset.nodeName = node.name;
        
        // Add event listeners
        circle.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectNode(node.id);
        });
        
        circle.addEventListener('mousedown', (e) => {
          // Only handle right-click for connection dragging
          if (e.button === 2) {
            e.stopPropagation();
            this._startConnectionDrag(node.id, e);
          }
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
      this.connectionsGroup.appendChild(connectionsFragment);
      this.nodesGroup.appendChild(nodesFragment);
      
      // Apply canvas transform
      this._applyCanvasTransform();
    });
  }
  
  /**
   * Create a node icon
   * @private
   * @param {Object} node - Node data
   * @param {Number} x - X position
   * @param {Number} y - Y position
   * @param {Number} radius - Node radius
   * @param {DocumentFragment} fragment - Fragment to append to
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
    text.setAttribute('fill', '#fff');
    text.setAttribute('class', `node-icon node-icon-${node.id}`);
    text.style.pointerEvents = 'none';
    
    // Determine icon character
    let iconChar = '';
    
    // This is a simple mapping of icon names to characters
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
    
    // Add icon to fragment
    fragment.appendChild(text);
  }
  
  /**
   * Render the node editor panel
   * @private
   * @param {Object} node - Node to edit
   */
  _renderNodeEditor(node) {
    const panel = this.elements.editorPanelContent;
    if (!panel || !node) return;
    
    try {
      // Clear previous content
      panel.innerHTML = '';
      
      const form = document.createElement('form');
      form.className = 'node-editor-form';
      form.id = 'node-editor-form';
      
      // Prevent default form submission and use our handler
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._saveNodeChanges(node.id);
      });
      
      // Basic information section
      const basicInfoSection = document.createElement('div');
      basicInfoSection.className = 'editor-section';
      
      // ID field (disabled)
      const idGroup = document.createElement('div');
      idGroup.className = 'form-group';
      
      const idLabel = document.createElement('label');
      idLabel.className = 'form-label';
      idLabel.textContent = 'ID';
      
      const idInput = document.createElement('input');
      idInput.className = 'form-input';
      idInput.name = 'id';
      idInput.type = 'text';
      idInput.value = node.id;
      idInput.disabled = true;
      
      idGroup.appendChild(idLabel);
      idGroup.appendChild(idInput);
      basicInfoSection.appendChild(idGroup);
      
      // Name field
      const nameGroup = document.createElement('div');
      nameGroup.className = 'form-group';
      
      const nameLabel = document.createElement('label');
      nameLabel.className = 'form-label';
      nameLabel.textContent = 'Name';
      
      const nameInput = document.createElement('input');
      nameInput.className = 'form-input';
      nameInput.name = 'name';
      nameInput.type = 'text';
      nameInput.value = node.name;
      nameInput.required = true;
      
      nameGroup.appendChild(nameLabel);
      nameGroup.appendChild(nameInput);
      basicInfoSection.appendChild(nameGroup);
      
      // Specialization field
      const specGroup = document.createElement('div');
      specGroup.className = 'form-group';
      
      const specLabel = document.createElement('label');
      specLabel.className = 'form-label';
      specLabel.textContent = 'Specialization';
      
      const specSelect = document.createElement('select');
      specSelect.className = 'form-select';
      specSelect.name = 'specialization';
      
      // Add null option for core
      const nullOption = document.createElement('option');
      nullOption.value = '';
      nullOption.textContent = 'Core (None)';
      nullOption.selected = !node.specialization;
      specSelect.appendChild(nullOption);
      
      // Add specialization options
      this.data.specializations.forEach(spec => {
        const option = document.createElement('option');
        option.value = spec.id;
        option.textContent = spec.name;
        option.selected = node.specialization === spec.id;
        specSelect.appendChild(option);
      });
      
      specGroup.appendChild(specLabel);
      specGroup.appendChild(specSelect);
      basicInfoSection.appendChild(specGroup);
      
      // Tier field
      const tierGroup = document.createElement('div');
      tierGroup.className = 'form-group';
      
      const tierLabel = document.createElement('label');
      tierLabel.className = 'form-label';
      tierLabel.textContent = 'Tier';
      
      const tierInput = document.createElement('input');
      tierInput.className = 'form-input';
      tierInput.name = 'tier';
      tierInput.type = 'number';
      tierInput.min = 0;
      tierInput.max = 5;
      tierInput.value = node.tier;
      
      tierGroup.appendChild(tierLabel);
      tierGroup.appendChild(tierInput);
      basicInfoSection.appendChild(tierGroup);
      
      // Description field
      const descGroup = document.createElement('div');
      descGroup.className = 'form-group';
      
      const descLabel = document.createElement('label');
      descLabel.className = 'form-label';
      descLabel.textContent = 'Description';
      
      const descInput = document.createElement('textarea');
      descInput.className = 'form-textarea';
      descInput.name = 'description';
      descInput.value = node.description || '';
      
      descGroup.appendChild(descLabel);
      descGroup.appendChild(descInput);
      basicInfoSection.appendChild(descGroup);
      
      // Cost fields
      const costGroup = document.createElement('div');
      costGroup.className = 'form-group';
      
      const costLabel = document.createElement('label');
      costLabel.className = 'form-label';
      costLabel.textContent = 'Cost';
      
      const costEditor = document.createElement('div');
      costEditor.className = 'cost-editor';
      
      // Reputation cost
      const repGroup = document.createElement('div');
      repGroup.className = 'cost-field form-group';
      
      const repLabel = document.createElement('label');
      repLabel.className = 'form-label';
      repLabel.textContent = 'Reputation';
      
      const repInput = document.createElement('input');
      repInput.className = 'form-input';
      repInput.name = 'cost_reputation';
      repInput.type = 'number';
      repInput.min = 0;
      repInput.value = node.cost?.reputation || 0;
      
      repGroup.appendChild(repLabel);
      repGroup.appendChild(repInput);
      
      // Skill points cost
      const spGroup = document.createElement('div');
      spGroup.className = 'cost-field form-group';
      
      const spLabel = document.createElement('label');
      spLabel.className = 'form-label';
      spLabel.textContent = 'Skill Points';
      
      const spInput = document.createElement('input');
      spInput.className = 'form-input';
      spInput.name = 'cost_skill_points';
      spInput.type = 'number';
      spInput.min = 0;
      spInput.value = node.cost?.skill_points || 0;
      
      spGroup.appendChild(spLabel);
      spGroup.appendChild(spInput);
      
      costEditor.appendChild(repGroup);
      costEditor.appendChild(spGroup);
      
      costGroup.appendChild(costLabel);
      costGroup.appendChild(costEditor);
      basicInfoSection.appendChild(costGroup);
      
      // Visual settings
      const visualGroup = document.createElement('div');
      visualGroup.className = 'form-group';
      
      const visualLabel = document.createElement('label');
      visualLabel.className = 'form-label';
      visualLabel.textContent = 'Visual';
      
      const visualEditor = document.createElement('div');
      visualEditor.className = 'visual-editor';
      
      // Node size
      const sizeGroup = document.createElement('div');
      sizeGroup.className = 'form-group';
      
      const sizeLabel = document.createElement('label');
      sizeLabel.className = 'form-label';
      sizeLabel.textContent = 'Size';
      
      const sizeSelect = document.createElement('select');
      sizeSelect.className = 'form-select';
      sizeSelect.name = 'visual_size';
      
      ['core', 'major', 'minor', 'connector'].forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size.charAt(0).toUpperCase() + size.slice(1);
        option.selected = node.visual?.size === size;
        sizeSelect.appendChild(option);
      });
      
      sizeGroup.appendChild(sizeLabel);
      sizeGroup.appendChild(sizeSelect);
      
      // Node icon
      const iconGroup = document.createElement('div');
      iconGroup.className = 'form-group';
      
      const iconLabel = document.createElement('label');
      iconLabel.className = 'form-label';
      iconLabel.textContent = 'Icon';
      
      const iconInput = document.createElement('input');
      iconInput.className = 'form-input';
      iconInput.name = 'visual_icon';
      iconInput.type = 'text';
      iconInput.value = node.visual?.icon || '';
      
      const iconHelp = document.createElement('div');
      iconHelp.className = 'form-help';
      iconHelp.textContent = 'e.g., atom, brain, star, eye, book';
      
      iconGroup.appendChild(iconLabel);
      iconGroup.appendChild(iconInput);
      iconGroup.appendChild(iconHelp);
      
      visualEditor.appendChild(sizeGroup);
      visualEditor.appendChild(iconGroup);
      
      visualGroup.appendChild(visualLabel);
      visualGroup.appendChild(visualEditor);
      
      basicInfoSection.appendChild(visualGroup);
      
      // Effects section
      const effectsSection = document.createElement('div');
      effectsSection.className = 'editor-section';
      
      const effectsLabel = document.createElement('div');
      effectsLabel.className = 'section-title';
      effectsLabel.textContent = 'Effects';
      
      const effectsList = document.createElement('div');
      effectsList.className = 'effects-list';
      
      if (node.effects && node.effects.length > 0) {
        node.effects.forEach((effect, index) => {
          const effectItem = document.createElement('div');
          effectItem.className = 'effect-item';
          effectItem.dataset.index = index;
          
          const effectHeader = document.createElement('div');
          effectHeader.className = 'effect-header';
          
          const effectType = document.createElement('div');
          effectType.className = 'effect-type';
          effectType.textContent = effect.type;
          
          const effectActions = document.createElement('div');
          effectActions.className = 'effect-actions';
          
          const editButton = document.createElement('button');
          editButton.className = 'effect-action';
          editButton.innerHTML = '✏️';
          editButton.type = 'button';
          editButton.title = 'Edit Effect';
          editButton.addEventListener('click', () => this._editEffect(node.id, index));
          
          const deleteButton = document.createElement('button');
          deleteButton.className = 'effect-action';
          deleteButton.innerHTML = '🗑️';
          deleteButton.type = 'button';
          deleteButton.title = 'Delete Effect';
          deleteButton.addEventListener('click', () => this._deleteEffect(node.id, index));
          
          effectActions.appendChild(editButton);
          effectActions.appendChild(deleteButton);
          
          effectHeader.appendChild(effectType);
          effectHeader.appendChild(effectActions);
          
          const effectDetails = document.createElement('div');
          effectDetails.className = 'effect-details';
          
          const effectValue = document.createElement('div');
          effectValue.className = 'effect-value';
          effectValue.textContent = `Value: ${JSON.stringify(effect.value)}`;
          
          effectDetails.appendChild(effectValue);
          
          if (effect.condition) {
            const effectCondition = document.createElement('div');
            effectCondition.className = 'effect-condition';
            effectCondition.textContent = `Condition: ${effect.condition}`;
            effectDetails.appendChild(effectCondition);
          }
          
          effectItem.appendChild(effectHeader);
          effectItem.appendChild(effectDetails);
          
          effectsList.appendChild(effectItem);
        });
      } else {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No effects defined for this node';
        effectsList.appendChild(emptyState);
      }
      
      // Add effect control
      const addEffectControl = document.createElement('div');
      addEffectControl.className = 'add-effect-control';
      
      const addEffectButton = document.createElement('button');
      addEffectButton.className = 'editor-btn editor-btn-secondary';
      addEffectButton.textContent = 'Add Effect';
      addEffectButton.type = 'button';
      addEffectButton.addEventListener('click', () => this._addEffect(node.id));
      
      addEffectControl.appendChild(addEffectButton);
      
      effectsSection.appendChild(effectsLabel);
      effectsSection.appendChild(effectsList);
      effectsSection.appendChild(addEffectControl);
      
      // Action buttons
      const actionButtons = document.createElement('div');
      actionButtons.className = 'form-actions mt-3';
      
      const saveButton = document.createElement('button');
      saveButton.className = 'editor-btn editor-btn-primary';
      saveButton.textContent = 'Save Changes';
      saveButton.type = 'submit';
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'editor-btn editor-btn-danger';
      deleteButton.textContent = 'Delete Node';
      deleteButton.type = 'button';
      deleteButton.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete node "${node.name}"?`)) {
          this.deleteNode(node.id);
        }
      });
      
      actionButtons.appendChild(saveButton);
      actionButtons.appendChild(deleteButton);
      
      // Append all sections to form
      form.appendChild(basicInfoSection);
      form.appendChild(effectsSection);
      form.appendChild(actionButtons);
      
      // Add the form to the panel
      panel.appendChild(form);
    } catch (error) {
      console.error("Error rendering node editor:", error);
      
      // Show error recovery UI
      panel.innerHTML = `
        <div class="error-state">
          <h3>Error Loading Editor</h3>
          <p>${error.message}</p>
          <button class="editor-btn editor-btn-primary" id="retry-editor-btn">Retry</button>
        </div>
      `;
      
      const retryButton = document.getElementById('retry-editor-btn');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this._renderNodeEditor(node);
        });
      }
      
      // Report error if ErrorHandler exists
      if (window.ErrorHandler) {
        window.ErrorHandler.handleError(
          error,
          'Node Editor Rendering',
          window.ErrorHandler.SEVERITY.WARNING
        );
      }
    }
  }
  
  /**
   * Save node changes from the editor form
   * @private
   * @param {String} nodeId - ID of the node being edited
   */
  _saveNodeChanges(nodeId) {
    const form = document.getElementById('node-editor-form');
    if (!form) return;
    
    // Get form data
    const formData = new FormData(form);
    
    // Find the node
    if (!nodeId) return;
    
    // Create updates object
    const updates = {
      name: formData.get('name'),
      specialization: formData.get('specialization') || null,
      tier: parseInt(formData.get('tier'), 10),
      description: formData.get('description'),
      cost: {
        reputation: parseInt(formData.get('cost_reputation'), 10),
        skill_points: parseInt(formData.get('cost_skill_points'), 10)
      },
      visual: {
        size: formData.get('visual_size'),
        icon: formData.get('visual_icon')
      }
    };
    
    // Update the node
    this.updateNode(nodeId, updates);
  }
  
  /**
   * Add an effect to a node
   * @private
   * @param {String} nodeId - ID of the node
   */
  _addEffect(nodeId) {
    // Find the node
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Create new effect
    const newEffect = {
      type: 'insight_gain_flat',
      value: 1,
      condition: null
    };
    
    // Show effect editor
    this._showEffectModal(newEffect, (effect) => {
      // Add effect to node
      if (!node.effects) {
        node.effects = [];
      }
      
      // Save state before changes
      this._saveToHistory();
      
      node.effects.push(effect);
      
      // Refresh editor
      this._renderNodeEditor(node);
      
      // Show success message
      this._showToast('Effect added successfully', 'success');
    });
  }
  
  /**
   * Edit an effect
   * @private
   * @param {String} nodeId - ID of the node
   * @param {Number} index - Index of the effect to edit
   */
  _editEffect(nodeId, index) {
    // Find the node
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node || !node.effects || !node.effects[index]) return;
    
    const effect = node.effects[index];
    
    // Show effect editor
    this._showEffectModal(effect, (updatedEffect) => {
      // Save state before changes
      this._saveToHistory();
      
      // Update effect
      node.effects[index] = updatedEffect;
      
      // Refresh editor
      this._renderNodeEditor(node);
      
      // Show success message
      this._showToast('Effect updated successfully', 'success');
    });
  }
  
  /**
   * Delete an effect
   * @private
   * @param {String} nodeId - ID of the node
   * @param {Number} index - Index of the effect to delete
   */
  _deleteEffect(nodeId, index) {
    // Find the node
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node || !node.effects || !node.effects[index]) return;
    
    // Save state before changes
    this._saveToHistory();
    
    // Remove effect
    node.effects.splice(index, 1);
    
    // Refresh editor
    this._renderNodeEditor(node);
    
    // Show success message
    this._showToast('Effect deleted successfully', 'success');
  }
  
  /**
   * Show effect editor modal
   * @private
   * @param {Object} effect - Effect to edit
   * @param {Function} onSave - Callback when effect is saved
   */
  _showEffectModal(effect, onSave) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('div');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = 'Edit Effect';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Create form
    const form = document.createElement('form');
    form.className = 'effect-edit-form';
    form.id = 'effect-edit-form';
    
    // Type select
    const typeGroup = document.createElement('div');
    typeGroup.className = 'form-group';
    
    const typeLabel = document.createElement('label');
    typeLabel.className = 'form-label';
    typeLabel.textContent = 'Effect Type';
    
    const typeSelect = document.createElement('select');
    typeSelect.className = 'form-select';
    typeSelect.name = 'type';
    
    // Add effect type options
    const effectTypes = [
      'insight_gain_flat',
      'insight_gain_multiplier',
      'patient_outcome_multiplier',
      'equipment_cost_reduction',
      'reveal_parameter',
      'reveal_patient_parameter',
      'critical_insight_multiplier',
      'auto_solve_chance',
      'calibration_success',
      'unlock_dialogue_options',
      'unlock_experimental_treatments',
      'time_cost_reduction',
      'consult_help',
      'adverse_event_reduction',
      'preview_outcomes',
      'malfunction_penalty_reduction',
      'repair_cost_reduction',
      'reveal_equipment_internals',
      'auto_detect_qa_issues',
      'auto_detect_radiation_anomalies',
      'multi_equipment_bonus',
      'temporary_equipment_fix',
      'start_with_items',
      'funding_multiplier',
      'favor_usage',
      'insight_to_reputation_conversion',
      'clinical_to_reputation_conversion',
      'multi_specialization_bonus',
      'companion',
      'specialization_synergy',
      'recall_similar_questions',
      'failure_conversion'
    ];
    
    effectTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      option.selected = effect.type === type;
      typeSelect.appendChild(option);
    });
    
    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(typeSelect);
    
    // Value input
    const valueGroup = document.createElement('div');
    valueGroup.className = 'form-group';
    
    const valueLabel = document.createElement('label');
    valueLabel.className = 'form-label';
    valueLabel.textContent = 'Value';
    
    const valueInput = document.createElement('input');
    valueInput.className = 'form-input';
    valueInput.name = 'value';
    valueInput.type = 'text';
    valueInput.value = JSON.stringify(effect.value);
    
    const valueHelp = document.createElement('div');
    valueHelp.className = 'form-help';
    valueHelp.textContent = 'Enter a number, text in quotes, true/false, or a JSON object';
    
    valueGroup.appendChild(valueLabel);
    valueGroup.appendChild(valueInput);
    valueGroup.appendChild(valueHelp);
    
    // Condition input
    const conditionGroup = document.createElement('div');
    conditionGroup.className = 'form-group';
    
    const conditionLabel = document.createElement('label');
    conditionLabel.className = 'form-label';
    conditionLabel.textContent = 'Condition (optional)';
    
    const conditionInput = document.createElement('input');
    conditionInput.className = 'form-input';
    conditionInput.name = 'condition';
    conditionInput.type = 'text';
    conditionInput.value = effect.condition || '';
    
    const conditionHelp = document.createElement('div');
    conditionHelp.className = 'form-help';
    conditionHelp.textContent = 'e.g., question_category == "quantum" or leave blank for no condition';
    
    conditionGroup.appendChild(conditionLabel);
    conditionGroup.appendChild(conditionInput);
    conditionGroup.appendChild(conditionHelp);
    
    // Append all to form
    form.appendChild(typeGroup);
    form.appendChild(valueGroup);
    form.appendChild(conditionGroup);
    
    modalBody.appendChild(form);
    
    // Modal footer
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'editor-btn editor-btn-secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    const saveButton = document.createElement('button');
    saveButton.className = 'editor-btn editor-btn-primary';
    saveButton.textContent = 'Save Effect';
    saveButton.addEventListener('click', () => {
      // Get form data
      const formData = new FormData(form);
      
      // Parse value
      let value;
      try {
        value = JSON.parse(formData.get('value'));
      } catch (error) {
        // If not valid JSON, use as string
        value = formData.get('value');
      }
      
      // Create updated effect
      const updatedEffect = {
        type: formData.get('type'),
        value: value,
        condition: formData.get('condition') || null
      };
      
      // Call save callback
      onSave(updatedEffect);
      
      // Close modal
      document.body.removeChild(modal);
    });
    
    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(saveButton);
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    
    modal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modal);
  }
  
  /**
   * Apply canvas transform
   * @private
   */
  _applyCanvasTransform() {
    if (!this.connectionsGroup || !this.nodesGroup) return;
    
    const transform = `translate(${this.state.canvasOffsetX},${this.state.canvasOffsetY}) scale(${this.state.canvasScale})`;
    
    this.connectionsGroup.setAttribute('transform', transform);
    this.nodesGroup.setAttribute('transform', transform);
  }
  
  /**
   * Zoom the canvas
   * @param {Number} delta - Zoom delta, positive to zoom in, negative to zoom out
   */
  zoomCanvas(delta) {
    // Calculate new scale
    const newScale = Math.max(
      0.5, // min zoom
      Math.min(3.0, // max zoom
          this.state.canvasScale + delta)
    );
    
    this.state.canvasScale = newScale;
    this._applyCanvasTransform();
  }
  
  /**
   * Reset the canvas view
   */
  resetCanvasView() {
    this.state.canvasScale = 1;
    this.state.canvasOffsetX = 0;
    this.state.canvasOffsetY = 0;
    this._applyCanvasTransform();
  }
  
  /**
   * Save current state to history
   * @private
   */
  _saveToHistory() {
    const currentState = JSON.stringify(this.data);
    
    // Only save if changed
    if (currentState !== this.history.current) {
      this.history.past.push(this.history.current);
      this.history.current = currentState;
      this.history.future = [];
      
      // Limit history size
      if (this.history.past.length > this.options.undoStackSize) {
        this.history.past.shift();
      }
      
      // Update UI
      this._updateUndoRedoButtons();
    }
  }
  
  /**
   * Update undo/redo button states
   * @private
   */
  _updateUndoRedoButtons() {
    if (this.elements.undoButton) {
      this.elements.undoButton.disabled = this.history.past.length === 0;
    }
    if (this.elements.redoButton) {
      this.elements.redoButton.disabled = this.history.future.length === 0;
    }
  }
  
  /**
   * Undo last action
   */
  undo() {
    if (this.history.past.length === 0) return;
    
    // Move current state to future
    this.history.future.push(this.history.current);
    
    // Get previous state
    this.history.current = this.history.past.pop();
    
    // Apply state
    this.data = JSON.parse(this.history.current);
    
    // Update UI
    this._updateUndoRedoButtons();
    this._updateNodeList();
    this.renderCanvas();
    
    // Clear selection if node no longer exists
    if (this.state.selectedNodeId) {
      const nodeExists = this.data.nodes.some(n => n.id === this.state.selectedNodeId);
      if (!nodeExists) {
        this.state.selectedNodeId = null;
        if (this.elements.editorPanelContent) {
          this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
        }
      } else {
        // Re-render selected node
        this._renderNodeEditor(this.data.nodes.find(n => n.id === this.state.selectedNodeId));
      }
    }
    
    // Show toast
    this._showToast('Undo successful', 'info');
  }
  
  /**
   * Redo last undone action
   */
  redo() {
    if (this.history.future.length === 0) return;
    
    // Move current state to past
    this.history.past.push(this.history.current);
    
    // Get next state
    this.history.current = this.history.future.pop();
    
    // Apply state
    this.data = JSON.parse(this.history.current);
    
    // Update UI
    this._updateUndoRedoButtons();
    this._updateNodeList();
    this.renderCanvas();
    
    // Clear selection if node no longer exists
    if (this.state.selectedNodeId) {
      const nodeExists = this.data.nodes.some(n => n.id === this.state.selectedNodeId);
      if (!nodeExists) {
        this.state.selectedNodeId = null;
        if (this.elements.editorPanelContent) {
          this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
        }
      } else {
        // Re-render selected node
        this._renderNodeEditor(this.data.nodes.find(n => n.id === this.state.selectedNodeId));
      }
    }
    
    // Show toast
    this._showToast('Redo successful', 'info');
  }
  
  /**
   * Export data to JSON
   * @returns {String} JSON string
   */
  exportToJson() {
    return JSON.stringify(this.data, null, 2);
  }
  
  /**
   * Import data from JSON
   * @param {String} json - JSON string to import
   * @returns {Boolean} Success status
   */
  importFromJson(json) {
    try {
      // Parse JSON
      const data = JSON.parse(json);
      
      // Validate data structure
      if (!data.specializations || !data.nodes || !Array.isArray(data.nodes)) {
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
      this.state.selectedNodeId = null;
      if (this.elements.editorPanelContent) {
        this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
      }
      
      // Show success message
      this._showToast('Data imported successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      this._showToast('Error importing data: ' + error.message, 'error');
      
      // Report error if ErrorHandler exists
      if (window.ErrorHandler) {
        window.ErrorHandler.handleError(
          error,
          'Data Import',
          window.ErrorHandler.SEVERITY.ERROR
        );
      }
      
      return false;
    }
  }
}

// For backward compatibility and global access
window.SkillTreeEditor = SkillTreeEditor;