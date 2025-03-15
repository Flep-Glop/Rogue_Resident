// skill_tree_editor.js - Visual editor for the skill tree

/**
 * Skill Tree Editor
 * A visual editor for creating and managing skill tree nodes
 */
class SkillTreeEditor {
  /**
   * Initialize the editor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = Object.assign({
      containerId: 'skill-tree-editor',
      width: 800,
      height: 600,
      onSave: null,
      templateUrl: '/static/templates/node_templates.json'
    }, options);
    
    // State
    this.initialized = false;
    this.data = {
      specializations: [],
      nodes: [],
      connections: []
    };
    this.templates = {};
    this.selectedNodeId = null;
    this.editingConnection = null;
    this.filter = {
      specialization: null,
      tier: null,
      searchTerm: ''
    };
    
    // Canvas state
    this.canvasState = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };
    
    // References to DOM elements
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
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize the editor
   * @private
   */
  _init() {
    // Get container element
    this.elements.container = document.getElementById(this.options.containerId);
    if (!this.elements.container) {
      console.error(`Container element not found: ${this.options.containerId}`);
      return;
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
        
        // Mark as initialized
        this.initialized = true;
        console.log('Skill Tree Editor initialized');
        
        // Show toast
        this._showToast('Editor loaded successfully', 'success');
      })
      .catch(error => {
        console.error('Failed to initialize Skill Tree Editor:', error);
        this._showToast('Failed to initialize editor', 'error');
      });
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
    
    // Create toast container
    this.elements.toast = document.createElement('div');
    this.elements.toast.className = 'toast-container';
    document.body.appendChild(this.elements.toast);
    
    // Cache important elements
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
    this._renderCanvas();
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Save button
    document.getElementById('editor-save-btn').addEventListener('click', this._handleSave.bind(this));
    
    // Validate button
    document.getElementById('editor-validate-btn').addEventListener('click', this._handleValidate.bind(this));
    
    // Add node button
    this.elements.addNodeBtn.addEventListener('click', this._handleAddNode.bind(this));
    
    // Node template select
    this.elements.nodeTemplateSelect.addEventListener('change', this._handleTemplateSelect.bind(this));
    
    // Node search
    this.elements.nodeSearch.addEventListener('input', this._handleSearch.bind(this));
    
    // Canvas pan and zoom
    this.elements.canvas.addEventListener('mousedown', this._handleCanvasMouseDown.bind(this));
    this.elements.canvas.addEventListener('mousemove', this._handleCanvasMouseMove.bind(this));
    this.elements.canvas.addEventListener('mouseup', this._handleCanvasMouseUp.bind(this));
    this.elements.canvas.addEventListener('wheel', this._handleCanvasWheel.bind(this));
    
    // Canvas controls
    document.getElementById('zoom-in-btn').addEventListener('click', () => this._zoom(0.1));
    document.getElementById('zoom-out-btn').addEventListener('click', () => this._zoom(-0.1));
    document.getElementById('reset-view-btn').addEventListener('click', this._resetView.bind(this));
    
    // Prevent context menu on canvas
    this.elements.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Load node templates
   * @private
   * @returns {Promise} Promise that resolves when templates are loaded
   */
  _loadTemplates() {
    return fetch(this.options.templateUrl)
      .then(response => response.json())
      .then(data => {
        this.templates = data.templates || {};
        console.log(`Loaded ${Object.keys(this.templates).length} node templates`);
        
        // Populate template select
        Object.entries(this.templates).forEach(([id, template]) => {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = template.name || id;
          this.elements.nodeTemplateSelect.appendChild(option);
        });
        
        return this.templates;
      })
      .catch(error => {
        console.error('Failed to load templates:', error);
        this._showToast('Failed to load node templates', 'error');
        return {};
      });
  }
  
  /**
   * Load skill tree data
   * @private
   * @returns {Promise} Promise that resolves when data is loaded
   */
  _loadSkillTreeData() {
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
  }
  
  /**
   * Update the specialization filter
   * @private
   */
  _updateSpecializationFilter() {
    const filter = this.elements.specializationFilter;
    filter.innerHTML = '';
    
    // Add "All" option
    const allChip = document.createElement('div');
    allChip.className = `specialization-chip ${this.filter.specialization === null ? 'selected' : ''}`;
    allChip.dataset.specialization = 'all';
    allChip.textContent = 'All';
    allChip.addEventListener('click', () => this._filterBySpecialization(null));
    filter.appendChild(allChip);
    
    // Add specialization options
    this.data.specializations.forEach(spec => {
      const chip = document.createElement('div');
      chip.className = `specialization-chip ${this.filter.specialization === spec.id ? 'selected' : ''}`;
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
   * Update the node list
   * @private
   */
  _updateNodeList() {
    const list = this.elements.nodeList;
    list.innerHTML = '';
    
    // Filter nodes
    const filteredNodes = this.data.nodes.filter(node => {
      // Filter by specialization
      if (this.filter.specialization !== null && node.specialization !== this.filter.specialization) {
        return false;
      }
      
      // Filter by tier
      if (this.filter.tier !== null && node.tier !== this.filter.tier) {
        return false;
      }
      
      // Filter by search term
      if (this.filter.searchTerm && !node.name.toLowerCase().includes(this.filter.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Sort nodes by tier, then specialization, then name
    filteredNodes.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.specialization !== b.specialization) {
        return a.specialization?.localeCompare(b.specialization || '') || 0;
      }
      return a.name.localeCompare(b.name);
    });
    
    // Create node list items
    filteredNodes.forEach(node => {
      const item = document.createElement('div');
      item.className = `node-list-item ${node.id === this.selectedNodeId ? 'selected' : ''}`;
      item.dataset.nodeId = node.id;
      
      const header = document.createElement('div');
      header.className = 'node-list-header';
      header.textContent = node.name;
      
      const subtext = document.createElement('div');
      subtext.className = 'node-list-subtext';
      
      // Get specialization name
      const spec = this.data.specializations.find(s => s.id === node.specialization);
      const specName = spec ? spec.name : 'Core';
      
      subtext.textContent = `${specName} - Tier ${node.tier}`;
      
      item.appendChild(header);
      item.appendChild(subtext);
      
      item.addEventListener('click', () => this._selectNode(node.id));
      
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
    this.filter.specialization = specializationId;
    this._updateSpecializationFilter();
    this._updateNodeList();
    this._renderCanvas();
  }
  
  /**
   * Handle search input
   * @private
   * @param {Event} event - Input event
   */
  _handleSearch(event) {
    this.filter.searchTerm = event.target.value;
    this._updateNodeList();
  }
  
  /**
   * Select a node
   * @private
   * @param {String} nodeId - ID of the node to select
   */
  _selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    this._updateNodeList();
    
    // Find the node
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Update editor panel
    this._renderNodeEditor(node);
    
    // Highlight node in canvas
    this._renderCanvas();
  }
  
  /**
   * Render the node editor
   * @private
   * @param {Object} node - Node object to edit
   */
  _renderNodeEditor(node) {
    const panel = this.elements.editorPanelContent;
    
    // Create editor form
    const form = document.createElement('form');
    form.className = 'node-editor-form';
    form.id = 'node-editor-form';
    form.onsubmit = (e) => {
      e.preventDefault();
      this._saveNodeChanges();
    };
    
    // Basic info section
    const basicInfoSection = document.createElement('div');
    basicInfoSection.className = 'editor-section';
    
    // ID field
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
    nameInput.value = node.name || '';
    
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
    tierInput.value = node.tier || 0;
    
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
    
    // Cost field
    const costGroup = document.createElement('div');
    costGroup.className = 'form-group';
    
    const costLabel = document.createElement('label');
    costLabel.className = 'form-label';
    costLabel.textContent = 'Cost';
    
    const costEditor = document.createElement('div');
    costEditor.className = 'cost-editor';
    
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
    effectsLabel.className = 'form-label';
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
        editButton.addEventListener('click', () => this._editEffect(index));
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'effect-action';
        deleteButton.innerHTML = '🗑️';
        deleteButton.type = 'button';
        deleteButton.title = 'Delete Effect';
        deleteButton.addEventListener('click', () => this._deleteEffect(index));
        
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
    addEffectButton.addEventListener('click', () => this._addEffect());
    
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
    deleteButton.addEventListener('click', () => this._deleteNode(node.id));
    
    actionButtons.appendChild(saveButton);
    actionButtons.appendChild(deleteButton);
    
    // Append all sections to form
    form.appendChild(basicInfoSection);
    form.appendChild(effectsSection);
    form.appendChild(actionButtons);
    
    // Clear panel and append form
    panel.innerHTML = '';
    panel.appendChild(form);
  }
  
  /**
   * Save node changes from the editor form
   * @private
   */
  _saveNodeChanges() {
    const form = document.getElementById('node-editor-form');
    if (!form) return;
    
    // Get form data
    const formData = new FormData(form);
    
    // Find the node
    const nodeId = this.selectedNodeId;
    if (!nodeId) return;
    
    const nodeIndex = this.data.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;
    
    // Create updated node object
    const node = this.data.nodes[nodeIndex];
    
    // Update basic properties
    node.name = formData.get('name');
    node.specialization = formData.get('specialization') || null;
    node.tier = parseInt(formData.get('tier'), 10);
    node.description = formData.get('description');
    
    // Update cost
    node.cost = {
      reputation: parseInt(formData.get('cost_reputation'), 10),
      skill_points: parseInt(formData.get('cost_skill_points'), 10)
    };
    
    // Update visual
    node.visual = {
      size: formData.get('visual_size'),
      icon: formData.get('visual_icon')
    };
    
    // Note: Effects are updated separately through the effect editor
    
    // Update UI
    this._updateNodeList();
    this._renderCanvas();
    
    // Show success message
    this._showToast('Node updated successfully', 'success');
  }
  
  /**
   * Edit an effect
   * @private
   * @param {Number} index - Index of the effect to edit
   */
  _editEffect(index) {
    const nodeId = this.selectedNodeId;
    if (!nodeId) return;
    
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node || !node.effects || !node.effects[index]) return;
    
    const effect = node.effects[index];
    
    // Create modal
    this._showEffectModal(effect, (updatedEffect) => {
      // Update effect
      node.effects[index] = updatedEffect;
      
      // Refresh editor
      this._renderNodeEditor(node);
      
      // Show success message
      this._showToast('Effect updated successfully', 'success');
    });
  }
  
  /**
   * Add a new effect
   * @private
   */
  _addEffect() {
    const nodeId = this.selectedNodeId;
    if (!nodeId) return;
    
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
      
      node.effects.push(effect);
      
      // Refresh editor
      this._renderNodeEditor(node);
      
      // Show success message
      this._showToast('Effect added successfully', 'success');
    });
  }
  
  /**
   * Delete an effect
   * @private
   * @param {Number} index - Index of the effect to delete
   */
  _deleteEffect(index) {
    const nodeId = this.selectedNodeId;
    if (!nodeId) return;
    
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node || !node.effects || !node.effects[index]) return;
    
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
   * @param {Function} onSave - Callback function when effect is saved
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
   * Delete a node
   * @private
   * @param {String} nodeId - ID of the node to delete
   */
  _deleteNode(nodeId) {
    if (!nodeId) return;
    
    if (!confirm(`Are you sure you want to delete node "${nodeId}"? This cannot be undone.`)) {
      return;
    }
    
    // Find the node
    const nodeIndex = this.data.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;
    
    // Remove node
    this.data.nodes.splice(nodeIndex, 1);
    
    // Remove connections to/from this node
    this.data.connections = this.data.connections.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    );
    
    // Update UI
    this.selectedNodeId = null;
    this._updateNodeList();
    this._renderCanvas();
    this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
    
    // Show success message
    this._showToast('Node deleted successfully', 'success');
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
    this._createNodeFromTemplate(templateId);
  }
  
  /**
   * Create a node from a template
   * @private
   * @param {String} templateId - ID of the template to use
   */
  _createNodeFromTemplate(templateId) {
    const template = this.templates[templateId];
    if (!template) return;
    
    // Generate unique ID
    const id = `node_${Date.now()}`;
    
    // Create default position
    const position = {
      x: this.options.width / 2,
      y: this.options.height / 2
    };
    
    // Create node
    const node = {
      id,
      name: template.name || 'New Node',
      specialization: this.filter.specialization || null,
      tier: 1,
      description: template.description || 'Node description',
      effects: template.effects ? [...template.effects] : [],
      position,
      connections: [],
      cost: {
        reputation: template.cost?.reputation || 10,
        skill_points: template.cost?.skill_points || 1
      },
      visual: template.visual || {
        size: 'minor',
        icon: 'help'
      }
    };
    
    // Add to data
    this.data.nodes.push(node);
    
    // Select new node
    this.selectedNodeId = id;
    
    // Update UI
    this._updateNodeList();
    this._renderNodeEditor(node);
    this._renderCanvas();
    
    // Show success message
    this._showToast('Node created successfully', 'success');
  }
  
  /**
   * Handle adding a new node
   * @private
   */
  _handleAddNode() {
    // Generate unique ID
    const id = `node_${Date.now()}`;
    
    // Create default position
    const position = {
      x: this.options.width / 2,
      y: this.options.height / 2
    };
    
    // Create node
    const node = {
      id,
      name: 'New Node',
      specialization: this.filter.specialization || null,
      tier: 1,
      description: 'Node description',
      effects: [],
      position,
      connections: [],
      cost: {
        reputation: 10,
        skill_points: 1
      },
      visual: {
        size: 'minor',
        icon: 'help'
      }
    };
    
    // Add to data
    this.data.nodes.push(node);
    
    // Select new node
    this.selectedNodeId = id;
    
    // Update UI
    this._updateNodeList();
    this._renderNodeEditor(node);
    this._renderCanvas();
    
    // Show success message
    this._showToast('Node created successfully', 'success');
  }
  
  /**
   * Show a toast notification
   * @private
   * @param {String} message - Message to display
   * @param {String} type - Notification type (success, error, info, warning)
   */
  _showToast(message, type = 'info') {
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
        this._selectNode(nodeId);
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
      this.canvasState.isDragging = true;
      this.canvasState.dragStartX = event.clientX;
      this.canvasState.dragStartY = event.clientY;
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
    if (this.canvasState.isDragging) {
      const dx = event.clientX - this.canvasState.dragStartX;
      const dy = event.clientY - this.canvasState.dragStartY;
      
      this.canvasState.offsetX += dx;
      this.canvasState.offsetY += dy;
      
      this.canvasState.dragStartX = event.clientX;
      this.canvasState.dragStartY = event.clientY;
      
      this._applyCanvasTransform();
      return;
    }
    
    // Handle connection dragging
    if (this.editingConnection) {
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
    if (this.canvasState.isDragging) {
      this.canvasState.isDragging = false;
      this.elements.canvas.style.cursor = 'grab';
    }
    
    // End connection drag
    if (this.editingConnection) {
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
    this._zoom(delta);
  }
  
  /**
   * Zoom the canvas
   * @private
   * @param {Number} delta - Zoom delta, positive to zoom in, negative to zoom out
   */
  _zoom(delta) {
    // Calculate new scale
    const newScale = Math.max(
      this.config.zoomLimits.min,
      Math.min(this.config.zoomLimits.max, this.canvasState.scale + delta)
    );
    
    this.canvasState.scale = newScale;
    this._applyCanvasTransform();
  }
  
  /**
   * Reset the canvas view
   * @private
   */
  _resetView() {
    this.canvasState.scale = 1;
    this.canvasState.offsetX = 0;
    this.canvasState.offsetY = 0;
    this._applyCanvasTransform();
  }
  
  /**
   * Apply transform to canvas SVG
   * @private
   */
  _applyCanvasTransform() {
    if (!this.connectionsGroup || !this.nodesGroup) return;
    
    const transform = `translate(${this.canvasState.offsetX},${this.canvasState.offsetY}) scale(${this.canvasState.scale})`;
    
    this.connectionsGroup.setAttribute('transform', transform);
    this.nodesGroup.setAttribute('transform', transform);
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
    this.editingConnection = {
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
    if (!this.editingConnection || !this.editingConnection.line) return;
    
    // Get mouse position relative to SVG
    const svgRect = this.svg.getBoundingClientRect();
    const x = (event.clientX - svgRect.left - this.canvasState.offsetX) / this.canvasState.scale;
    const y = (event.clientY - svgRect.top - this.canvasState.offsetY) / this.canvasState.scale;
    
    // Update line end position
    this.editingConnection.line.setAttribute('x2', x);
    this.editingConnection.line.setAttribute('y2', y);
    
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
    if (!this.editingConnection) return;
    
    // Check if dropped on a node
    const nodeElement = event.target.closest('.node');
    if (nodeElement) {
      const targetNodeId = nodeElement.dataset.nodeId;
      
      // Don't connect to self
      if (targetNodeId !== this.editingConnection.sourceNodeId) {
        this._createConnection(this.editingConnection.sourceNodeId, targetNodeId);
      }
    }
    
    // Remove temporary line
    if (this.editingConnection.line && this.editingConnection.line.parentNode) {
      this.editingConnection.line.parentNode.removeChild(this.editingConnection.line);
    }
    
    // Reset editing state
    this.editingConnection = null;
    
    // Reset node highlights
    const allNodeElements = this.svg.querySelectorAll('.node');
    allNodeElements.forEach(el => {
      el.setAttribute('stroke-width', '2');
    });
  }
  
  /**
   * Create a connection between nodes
   * @private
   * @param {String} sourceNodeId - ID of the source node
   * @param {String} targetNodeId - ID of the target node
   */
  _createConnection(sourceNodeId, targetNodeId) {
    // Check if connection already exists
    const connectionExists = this.data.connections.some(conn => 
      conn.source === sourceNodeId && conn.target === targetNodeId
    );
    
    if (connectionExists) {
      this._showToast('Connection already exists', 'warning');
      return;
    }
    
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
    this._renderCanvas();
    
    // Show success message
    this._showToast('Connection created successfully', 'success');
  }
  
  /**
   * Delete a connection
   * @private
   * @param {String} sourceNodeId - ID of the source node
   * @param {String} targetNodeId - ID of the target node
   */
  _deleteConnection(sourceNodeId, targetNodeId) {
    // Remove from connections array
    this.data.connections = this.data.connections.filter(conn => 
      !(conn.source === sourceNodeId && conn.target === targetNodeId)
    );
    
    // Remove from source node's connections array
    const sourceNode = this.data.nodes.find(n => n.id === sourceNodeId);
    if (sourceNode && sourceNode.connections) {
      sourceNode.connections = sourceNode.connections.filter(id => id !== targetNodeId);
    }
    
    // Re-render canvas
    this._renderCanvas();
    
    // Show success message
    this._showToast('Connection deleted successfully', 'success');
  }
  
  /**
   * Render the canvas
   * @private
   */
  _renderCanvas() {
    // Clear existing content
    this.connectionsGroup.innerHTML = '';
    this.nodesGroup.innerHTML = '';
    
    // Draw connections
    this._drawConnections();
    
    // Draw nodes
    this._drawNodes();
  }
  
  /**
   * Draw connections between nodes
   * @private
   */
  _drawConnections() {
    this.data.connections.forEach(conn => {
      const sourceNode = this.data.nodes.find(n => n.id === conn.source);
      const targetNode = this.data.nodes.find(n => n.id === conn.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Calculate positions
      const x1 = sourceNode.position.x;
      const y1 = sourceNode.position.y;
      const x2 = targetNode.position.x;
      const y2 = targetNode.position.y;
      
      // Create line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#888');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrow)');
      line.setAttribute('class', 'connection');
      line.dataset.source = conn.source;
      line.dataset.target = conn.target;
      
      // Add click event to delete connection
      line.addEventListener('dblclick', () => {
        if (confirm('Delete this connection?')) {
          this._deleteConnection(conn.source, conn.target);
        }
      });
      
      this.connectionsGroup.appendChild(line);
    });
  }
  
  /**
   * Draw nodes
   * @private
   */
  _drawNodes() {
    // Filter nodes if needed
    let nodesToDraw = this.data.nodes;
    
    if (this.filter.specialization !== null) {
      nodesToDraw = nodesToDraw.filter(node => 
        node.specialization === this.filter.specialization || 
        node.tier === 0 // Always show tier 0 (core) nodes
      );
    }
    
    // Draw each node
    nodesToDraw.forEach(node => {
      // Get node specialization color
      let nodeColor = '#888';
      
      if (node.specialization) {
        const spec = this.data.specializations.find(s => s.id === node.specialization);
        if (spec) {
          nodeColor = spec.color;
        }
      } else {
        // Core nodes
        nodeColor = '#4682B4';
      }
      
      // Calculate node radius
      const nodeSize = node.visual?.size || 'minor';
      const radius = {
        core: 25,
        major: 18,
        minor: 15,
        connector: 12
      }[nodeSize] || 15;
      
      // Create node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.position.x);
      circle.setAttribute('cy', node.position.y);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', nodeColor);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', node.id === this.selectedNodeId ? '4' : '2');
      circle.setAttribute('class', 'node');
      circle.dataset.nodeId = node.id;
      
      // Make node draggable
      circle.addEventListener('mousedown', (e) => {
        // Only handle left-click for dragging nodes
        if (e.button !== 0) return;
        
        e.stopPropagation();
        this._startNodeDrag(node.id, e);
      });
      
      // Add node to canvas
      this.nodesGroup.appendChild(circle);
      
      // Add node label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.position.x);
      text.setAttribute('y', node.position.y + radius + 15);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', '12');
      text.setAttribute('class', 'node-label');
      text.textContent = node.name;
      
      this.nodesGroup.appendChild(text);
    });
  }
  
  /**
   * Start dragging a node
   * @private
   * @param {String} nodeId - ID of the node to drag
   * @param {MouseEvent} event - Mouse event
   */
  _startNodeDrag(nodeId, event) {
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Mark node as being dragged
    this.draggingNode = {
      nodeId,
      startX: event.clientX,
      startY: event.clientY,
      initialPosition: { ...node.position }
    };
    
    // Add mousemove and mouseup handlers
    const handleMouseMove = (e) => {
      this._dragNode(e);
    };
    
    const handleMouseUp = (e) => {
      this._finishNodeDrag();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  /**
   * Drag a node
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _dragNode(event) {
    if (!this.draggingNode) return;
    
    const node = this.data.nodes.find(n => n.id === this.draggingNode.nodeId);
    if (!node) return;
    
    // Calculate delta from initial position
    const dx = (event.clientX - this.draggingNode.startX) / this.canvasState.scale;
    const dy = (event.clientY - this.draggingNode.startY) / this.canvasState.scale;
    
    // Update node position
    node.position = {
      x: this.draggingNode.initialPosition.x + dx,
      y: this.draggingNode.initialPosition.y + dy
    };
    
    // Update canvas
    this._renderCanvas();
  }
  
  /**
   * Finish dragging a node
   * @private
   */
  _finishNodeDrag() {
    this.draggingNode = null;
  }
  
  /**
   * Handle save button click
   * @private
   */
  _handleSave() {
    // Validate data first
    this._validateData()
      .then(validation => {
        if (!validation.valid) {
          // Show validation errors
          this._showToast(`Validation failed: ${validation.errors.length} errors found`, 'error');
          console.error('Validation errors:', validation.errors);
          
          if (confirm('Data has validation errors. Save anyway?') === false) {
            return;
          }
        }
        
        // Save data
        this._saveData();
      });
  }
  
  /**
   * Validate skill tree data
   * @private
   * @returns {Promise} Promise that resolves to validation result
   */
  _validateData() {
    // Check if validator is available
    if (typeof SchemaValidator !== 'undefined') {
      return SchemaValidator.validateSkillTree(this.data);
    }
    
    // Fallback to simple validation
    return Promise.resolve(this._simpleValidate());
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
   * Handle validate button click
   * @private
   */
  _handleValidate() {
    this._validateData()
      .then(validation => {
        if (validation.valid) {
          this._showToast('Validation successful! No errors found.', 'success');
        } else {
          this._showToast(`Validation failed: ${validation.errors.length} errors found`, 'error');
          console.error('Validation errors:', validation.errors);
          
          // Show first few errors
          const errorList = validation.errors.slice(0, 3).join('\n');
          alert(`Validation failed with the following errors:\n\n${errorList}\n\n${validation.errors.length > 3 ? `...and ${validation.errors.length - 3} more errors` : ''}`);
        }
      });
  }
  
  /**
   * Save data to server
   * @private
   */
  _saveData() {
    // Show loading indicator
    this._showLoading('Saving skill tree data...');
    
    // Call save callback if provided
    if (typeof this.options.onSave === 'function') {
      try {
        this.options.onSave(this.data);
        
        // Hide loading indicator
        this._hideLoading();
        
        // Show success message
        this._showToast('Skill tree data saved successfully', 'success');
        
        return;
      } catch (error) {
        console.error('Error in save callback:', error);
        
        // Hide loading indicator
        this._hideLoading();
        
        // Show error message
        this._showToast('Error saving skill tree data', 'error');
        
        return;
      }
    }
    
    // Send data to server
    fetch('/api/skill-tree', {
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
      })
      .catch(error => {
        console.error('Error saving skill tree data:', error);
        
        // Hide loading indicator
        this._hideLoading();
        
        // Show error message
        this._showToast('Error saving skill tree data: ' + error.message, 'error');
      });
  }
  
  /**
   * Show loading indicator
   * @private
   * @param {String} message - Loading message
   */
  _showLoading(message) {
    const loadingOverlay = document.createElement('div');
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
  }
  
  /**
   * Hide loading indicator
   * @private
   */
  _hideLoading() {
    const loadingOverlay = document.getElementById('editor-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.parentNode.removeChild(loadingOverlay);
    }
  }
}

// Export for use
window.SkillTreeEditor = SkillTreeEditor;