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