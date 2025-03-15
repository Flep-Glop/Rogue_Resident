// skill_tree_editor_integration.js - Integrate the editor with the main game

/**
 * Integration code for the skill tree editor
 * This provides a simple way to open the editor from inside the game
 */
const SkillTreeEditorIntegration = {
  editorInstance: null,
  editorContainerId: 'skill-tree-editor-container',
  isInitialized: false,
  
  /**
   * Initialize the editor integration
   */
  initialize: function() {
    if (this.isInitialized) return;
    
    // Create editor container
    this._createEditorContainer();
    
    // Add editor button to game UI if on the appropriate page
    this._addEditorButton();
    
    this.isInitialized = true;
    
    console.log('Skill Tree Editor Integration initialized');
  },
  
  /**
   * Create the editor container
   * @private
   */
  _createEditorContainer: function() {
    // Check if container already exists
    let container = document.getElementById(this.editorContainerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = this.editorContainerId;
      container.style.display = 'none';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.backgroundColor = '#0A0E1A';
      container.style.zIndex = '9999';
      container.style.overflow = 'hidden';
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.zIndex = '10000';
      closeButton.style.backgroundColor = '#e67e73';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '50%';
      closeButton.style.width = '30px';
      closeButton.style.height = '30px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '16px';
      closeButton.style.display = 'flex';
      closeButton.style.alignItems = 'center';
      closeButton.style.justifyContent = 'center';
      
      closeButton.addEventListener('click', () => {
        this.hideEditor();
      });
      
      // Add container for the editor
      const editorContainer = document.createElement('div');
      editorContainer.id = 'skill-tree-editor';
      editorContainer.style.width = '100%';
      editorContainer.style.height = '100%';
      
      container.appendChild(closeButton);
      container.appendChild(editorContainer);
      
      document.body.appendChild(container);
    }
  },
  
  /**
   * Add editor button to game UI
   * @private
   */
  _addEditorButton: function() {
    // Only add button in dev mode or for admins
    if (!window.DEV_MODE && !window.isAdmin) {
      console.log('Editor button not added: not in dev mode and not admin');
      return;
    }
    
    // Check if we're on a page that has the skill tree button
    const skillTreeButton = document.querySelector('.skill-tree-access-button');
    if (!skillTreeButton) {
      console.log('Skill tree button not found, cannot add editor button');
      return;
    }
    
    // Create editor button
    const editorButton = document.createElement('button');
    editorButton.textContent = 'Edit Skill Tree';
    editorButton.className = 'editor-access-button';
    editorButton.style.backgroundColor = '#4287f5';
    editorButton.style.color = 'white';
    editorButton.style.border = 'none';
    editorButton.style.borderRadius = '4px';
    editorButton.style.padding = '8px 12px';
    editorButton.style.marginLeft = '10px';
    editorButton.style.cursor = 'pointer';
    editorButton.style.fontSize = '14px';
    
    // Add click handler
    editorButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEditor();
    });
    
    // Insert after skill tree button
    skillTreeButton.parentNode.insertBefore(editorButton, skillTreeButton.nextSibling);
  },
  
  /**
   * Show the editor
   */
  showEditor: function() {
    // Get container
    const container = document.getElementById(this.editorContainerId);
    if (!container) {
      console.error('Editor container not found');
      return;
    }
    
    // Show container
    container.style.display = 'block';
    
    // Initialize editor if not already done
    if (!this.editorInstance) {
      this._initializeEditor();
    }
  },
  
  /**
   * Hide the editor
   */
  hideEditor: function() {
    // Get container
    const container = document.getElementById(this.editorContainerId);
    if (container) {
      container.style.display = 'none';
    }
  },
  
  /**
   * Initialize the skill tree editor
   * @private
   */
  _initializeEditor: function() {
    // Check if editor class is available
    if (typeof SkillTreeEditor !== 'function') {
      console.error('SkillTreeEditor class not found');
      alert('Cannot initialize skill tree editor: SkillTreeEditor class not found');
      return;
    }
    
    // Initialize editor
    this.editorInstance = new SkillTreeEditor({
      containerId: 'skill-tree-editor',
      width: 800,
      height: 600,
      onSave: (data) => {
        this._saveSkillTreeData(data);
      },
      templateUrl: '/static/templates/node_templates.json'
    });
  },
  /**
   * Initialize undo/redo system
   * @private
   */
  _initializeUndoRedo: function() {
    // Initialize history state
    this.history = {
      past: [],
      future: [],
      current: JSON.stringify(this.data)
    };
    
    // Create UI buttons for undo/redo
    const editorHeader = document.querySelector('.editor-actions');
    if (editorHeader) {
      // Create undo button
      const undoButton = document.createElement('button');
      undoButton.className = 'editor-btn editor-btn-secondary editor-undo-btn';
      undoButton.innerHTML = '↩';
      undoButton.title = 'Undo (Ctrl+Z)';
      undoButton.disabled = true;
      undoButton.addEventListener('click', () => this._undo());
      
      // Create redo button
      const redoButton = document.createElement('button');
      redoButton.className = 'editor-btn editor-btn-secondary editor-redo-btn';
      redoButton.innerHTML = '↪';
      redoButton.title = 'Redo (Ctrl+Y)';
      redoButton.disabled = true;
      redoButton.addEventListener('click', () => this._redo());
      
      // Insert at beginning of actions bar
      editorHeader.insertBefore(redoButton, editorHeader.firstChild);
      editorHeader.insertBefore(undoButton, editorHeader.firstChild);
      
      // Store references
      this.undoButton = undoButton;
      this.redoButton = redoButton;
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle if editor is visible
      if (!this.isEditorVisible()) return;
      
      // Ctrl+Z or Command+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this._undo();
      }
      
      // Ctrl+Y or Command+Y or Ctrl+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && 
          ((e.key === 'y') || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this._redo();
      }
    });
  },

  /**
   * Check if editor is currently visible
   * @private
   * @returns {Boolean} True if editor is visible
   */
  isEditorVisible: function() {
    const container = document.getElementById(this.options.containerId);
    return container && container.offsetParent !== null;
  },

  /**
   * Save current state to history
   * @private
   */
  _saveToHistory: function() {
    const currentState = JSON.stringify(this.data);
    
    // Only save if changed
    if (currentState !== this.history.current) {
      this.history.past.push(this.history.current);
      this.history.current = currentState;
      this.history.future = [];
      
      // Limit history size
      if (this.history.past.length > 50) {
        this.history.past.shift();
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
    if (this.undoButton) {
      this.undoButton.disabled = this.history.past.length === 0;
    }
    if (this.redoButton) {
      this.redoButton.disabled = this.history.future.length === 0;
    }
  },

  /**
   * Undo last action
   * @private
   */
  _undo: function() {
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
    this._renderCanvas();
    
    // Clear selection if node no longer exists
    if (this.selectedNodeId) {
      const nodeExists = this.data.nodes.some(n => n.id === this.selectedNodeId);
      if (!nodeExists) {
        this.selectedNodeId = null;
        this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
      } else {
        // Re-render selected node
        this._renderNodeEditor(this.data.nodes.find(n => n.id === this.selectedNodeId));
      }
    }
    
    // Show toast
    this._showToast('Undo successful', 'info');
  },

  /**
   * Redo last undone action
   * @private
   */
  _redo: function() {
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
    this._renderCanvas();
    
    // Clear selection if node no longer exists
    if (this.selectedNodeId) {
      const nodeExists = this.data.nodes.some(n => n.id === this.selectedNodeId);
      if (!nodeExists) {
        this.selectedNodeId = null;
        this.elements.editorPanelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit or create a new one</p></div>';
      } else {
        // Re-render selected node
        this._renderNodeEditor(this.data.nodes.find(n => n.id === this.selectedNodeId));
      }
    }
    
    // Show toast
    this._showToast('Redo successful', 'info');
  }
  /**
   * Create connections section for the node editor
   * @private
   * @param {Object} node - Node being edited
   * @returns {HTMLElement} Connection section element
   */
  _createConnectionsSection: function(node) {
    const section = document.createElement('div');
    section.className = 'editor-section';
    
    const title = document.createElement('h3');
    title.className = 'section-title';
    title.textContent = 'Connections';
    section.appendChild(title);
    
    // Incoming connections (read-only)
    const incomingTitle = document.createElement('h4');
    incomingTitle.className = 'subsection-title';
    incomingTitle.textContent = 'Incoming Connections:';
    section.appendChild(incomingTitle);
    
    const incomingList = document.createElement('div');
    incomingList.className = 'connection-list incoming';
    
    // Find nodes that connect to this one
    const incomingConnections = this.data.connections
      .filter(conn => conn.target === node.id)
      .map(conn => {
        const sourceNode = this.data.nodes.find(n => n.id === conn.source);
        return sourceNode ? sourceNode.name : conn.source;
      });
    
    if (incomingConnections.length === 0) {
      incomingList.innerHTML = '<div class="empty-state">No incoming connections</div>';
    } else {
      incomingConnections.forEach(name => {
        const item = document.createElement('div');
        item.className = 'connection-item';
        item.textContent = name;
        incomingList.appendChild(item);
      });
    }
    
    section.appendChild(incomingList);
    
    // Outgoing connections (editable)
    const outgoingTitle = document.createElement('h4');
    outgoingTitle.className = 'subsection-title';
    outgoingTitle.textContent = 'Outgoing Connections:';
    section.appendChild(outgoingTitle);
    
    const outgoingList = document.createElement('div');
    outgoingList.className = 'connection-list outgoing';
    
    // Find connections from this node
    const outgoingConnections = this.data.connections
      .filter(conn => conn.source === node.id)
      .map(conn => {
        const targetNode = this.data.nodes.find(n => n.id === conn.target);
        return {
          id: conn.target,
          name: targetNode ? targetNode.name : conn.target
        };
      });
    
    if (outgoingConnections.length === 0) {
      outgoingList.innerHTML = '<div class="empty-state">No outgoing connections</div>';
    } else {
      outgoingConnections.forEach(conn => {
        const item = document.createElement('div');
        item.className = 'connection-item';
        
        const name = document.createElement('span');
        name.textContent = conn.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'connection-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove connection';
        removeBtn.dataset.targetId = conn.id;
        
        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm(`Remove connection to "${conn.name}"?`)) {
            this._removeConnection(node.id, conn.id);
            this._renderNodeEditor(node);
          }
        });
        
        item.appendChild(name);
        item.appendChild(removeBtn);
        outgoingList.appendChild(item);
      });
    }
    
    section.appendChild(outgoingList);
    
    // Add connection control
    const addConnectionControl = document.createElement('div');
    addConnectionControl.className = 'add-connection-control';
    
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = 'new-connection-select';
    
    // Add option for none
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'Select node...';
    select.appendChild(noneOption);
    
    // Add all nodes that aren't already connected and aren't the current node
    const connectedIds = outgoingConnections.map(conn => conn.id);
    
    this.data.nodes
      .filter(n => n.id !== node.id && !connectedIds.includes(n.id))
      .forEach(n => {
        const option = document.createElement('option');
        option.value = n.id;
        option.textContent = n.name;
        select.appendChild(option);
      });
    
    const addButton = document.createElement('button');
    addButton.className = 'editor-btn editor-btn-secondary';
    addButton.textContent = 'Add Connection';
    addButton.type = 'button';
    
    addButton.addEventListener('click', () => {
      const targetId = select.value;
      if (targetId) {
        this._createConnection(node.id, targetId);
        this._renderNodeEditor(node);
      }
    });
    
    addConnectionControl.appendChild(select);
    addConnectionControl.appendChild(addButton);
    
    section.appendChild(addConnectionControl);
    
    return section;
  }
  /**
   * Save skill tree data
   * @private
   * @param {Object} data - Skill tree data to save
   */
  _saveSkillTreeData: function(data) {
    console.log('Saving skill tree data:', data);
    
    // Send data to server
    return fetch('/api/skill-tree', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('Skill tree data saved successfully:', result);
        
        // Show success message
        alert('Skill tree data saved successfully');
        
        // Reload the page to apply changes
        if (confirm('Reload the page to apply changes?')) {
          window.location.reload();
        }
        
        return result;
      })
      .catch(error => {
        console.error('Error saving skill tree data:', error);
        alert(`Error saving skill tree data: ${error.message}`);
        throw error;
      });
  }
};

// Initialize on DOM loaded if in dev mode
document.addEventListener('DOMContentLoaded', () => {
  if (window.DEV_MODE || window.isAdmin) {
    SkillTreeEditorIntegration.initialize();
  }
});

// Export for manual initialization
window.SkillTreeEditorIntegration = SkillTreeEditorIntegration;