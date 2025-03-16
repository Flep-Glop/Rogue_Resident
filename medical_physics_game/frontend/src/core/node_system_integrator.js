// static/js/engine/node_system_integrator.js - Simplified version

// NodeSystemIntegrator - Handles loading and validation of node components
const NodeSystemIntegrator = {
  // Track missing components
  missingComponents: [],
  
  // Initialize the enhanced node system
  initialize: function() {
    console.log("Initializing node system integrator...");
    
    // Check which components we need
    this.checkComponentAvailability();
    
    // If any components are missing, create skeletons for them
    if (this.missingComponents.length > 0) {
      console.warn(`Missing components for ${this.missingComponents.length} node types:`);
      this.missingComponents.forEach(type => {
        console.warn(`- Creating skeleton component for: ${type}`);
        this.createSkeletonComponent(type);
      });
    }
    
    // Success!
    console.log("Node system integration complete");
    
    return this;
  },
  
  // Check which node types need components
  checkComponentAvailability: function() {
    this.missingComponents = [];
    
    // Check each node type in NodeRegistry
    if (typeof NodeRegistry !== 'undefined' && NodeRegistry.nodeTypes) {
      Object.keys(NodeRegistry.nodeTypes).forEach(typeId => {
        // Skip start node which doesn't need a component
        if (typeId === 'start') return;
        
        // Skip if component already exists
        if (typeof NodeComponents !== 'undefined' && 
            NodeComponents.registry && 
            NodeComponents.registry[typeId]) {
          return;
        }
        
        // Add to missing components
        this.missingComponents.push(typeId);
      });
    }
    
    return this.missingComponents;
  },
  
  // Create a skeleton component for a node type
  createSkeletonComponent: function(typeId) {
    if (!typeId || typeId === 'start') return null;
    
    console.log(`Creating skeleton component for node type: ${typeId}`);
    
    // Skip if NodeComponents not available
    if (typeof NodeComponents === 'undefined' || !NodeComponents.register) {
      console.error("Cannot create skeleton component: NodeComponents not available");
      return null;
    }
    
    // Get node type config to use for display name
    const nodeType = NodeRegistry.getNodeType(typeId);
    const displayName = nodeType.displayName || typeId;
    
    // Create basic component with required methods
    const component = {
      initialize: function() {
        console.log(`Initializing ${typeId} component (skeleton)`);
      },
      
      render: function(nodeData, container) {
        console.log(`Rendering ${typeId} node (skeleton)`, nodeData);
        
        // Create basic UI
        container.innerHTML = `
          <h3>${nodeData.title || displayName}</h3>
          <div class="alert alert-warning">
            <p>This is an auto-generated component for node type: ${typeId}</p>
            <p>For full functionality, create a proper component implementation in:</p>
            <pre>/static/js/components/${typeId}_component.js</pre>
          </div>
          <div id="${typeId}-content">
            ${this.generateNodeContent(nodeData)}
          </div>
          <button id="${typeId}-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        
        // Add continue button handler
        const continueBtn = document.getElementById(`${typeId}-continue-btn`);
        if (continueBtn) {
          continueBtn.addEventListener('click', () => {
            this.handleAction(nodeData, 'continue');
          });
        }
      },
      
      // Generate some content based on node data
      generateNodeContent: function(nodeData) {
        let content = '';
        
        // Display node fields
        Object.entries(nodeData).forEach(([key, value]) => {
          // Skip internal fields and complex objects
          if (key.startsWith('_') || key === 'type' || key === 'id' || 
              key === 'position' || key === 'paths' || 
              typeof value === 'object') {
            return;
          }
          
          content += `<p><strong>${key}:</strong> ${value}</p>`;
        });
        
        // If node has an item, show its info
        if (nodeData.item) {
          content += `
            <div class="card mb-3">
              <div class="card-header">${nodeData.item.name}</div>
              <div class="card-body">
                <p>${nodeData.item.description}</p>
                <p><strong>Rarity:</strong> ${nodeData.item.rarity || 'common'}</p>
                <p><strong>Effect:</strong> ${nodeData.item.effect?.value || 'None'}</p>
              </div>
            </div>
          `;
        }
        
        // If node has a question, show its text
        if (nodeData.question) {
          content += `
            <div class="card mb-3">
              <div class="card-header">Question</div>
              <div class="card-body">
                <p>${nodeData.question.text}</p>
              </div>
            </div>
          `;
        }
        
        return content;
      },
      
      handleAction: function(nodeData, action) {
        console.log(`${typeId} component handling action: ${action} (skeleton)`);
        
        if (action === 'continue') {
          // Complete the node
          if (GameState && GameState.data && GameState.data.currentNode) {
            GameState.completeNode(nodeData.id);
          }
        }
      }
    };
    
    // Register with NodeComponents
    NodeComponents.register(typeId, component);
    
    return component;
  },
  
  // Create any missing components
  createMissingComponents: function() {
    this.checkComponentAvailability();
    this.missingComponents.forEach(typeId => {
      this.createSkeletonComponent(typeId);
    });
    
    // Reset list
    this.missingComponents = [];
  }
};

// Export globally
window.NodeSystemIntegrator = NodeSystemIntegrator;