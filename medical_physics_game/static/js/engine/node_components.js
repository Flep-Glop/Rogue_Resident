// node_components.js - Component-based system for node interactions

// NodeComponents - Registry of components for different node types
const NodeComponents = {
    // Component registry
    registry: {},
    
    // Register a component
    register: function(typeId, component) {
      console.log(`Registering component for node type: ${typeId}`);
      
      // Ensure all components have required methods
      const requiredMethods = ['render', 'handleAction'];
      requiredMethods.forEach(method => {
        if (typeof component[method] !== 'function') {
          console.error(`Component for ${typeId} is missing required method: ${method}`);
        }
      });
      
      this.registry[typeId] = component;
      return this; // Enable chaining
    },
    
    // Get a component by type
    getComponent: function(typeId) {
      if (!this.registry[typeId]) {
        console.warn(`No component registered for node type: ${typeId}, using default`);
        return this.registry.default;
      }
      return this.registry[typeId];
    },
    
    // Process a node with its component
    processNode: function(nodeData, container) {
      if (!nodeData || !nodeData.type) {
        console.error("Invalid node data", nodeData);
        return false;
      }
      
      const component = this.getComponent(nodeData.type);
      if (!component) {
        console.error(`No component found for node type: ${nodeData.type}`);
        return false;
      }
      
      try {
        // Render the component
        component.render(nodeData, container);
        return true;
      } catch (error) {
        console.error(`Error processing node with component ${nodeData.type}:`, error);
        return false;
      }
    },
    
    // Initialize all registered components
    initializeAll: function() {
      console.log("Initializing all node components");
      Object.entries(this.registry).forEach(([typeId, component]) => {
        if (typeof component.initialize === 'function') {
          try {
            component.initialize();
          } catch (error) {
            console.error(`Error initializing component ${typeId}:`, error);
          }
        }
      });
    }
  };
  
  // Default component (fallback for unknown types)
  NodeComponents.register('default', {
    initialize: function() {
      // Default initialization
    },
    
    render: function(nodeData, container) {
      container.innerHTML = `
        <h3>${nodeData.title || 'Unknown Node'}</h3>
        <div class="alert alert-warning">
          <p>This node type (${nodeData.type}) doesn't have a registered component.</p>
        </div>
        <button id="default-continue-btn" class="btn btn-primary mt-3">Continue</button>
      `;
      
      // Add continue button handler
      const continueBtn = document.getElementById('default-continue-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          this.handleAction(nodeData, 'continue');
        });
      }
    },
    
    handleAction: function(nodeData, action) {
      console.log(`Default component handling action: ${action}`);
      if (action === 'continue') {
        // Complete the node
        if (typeof GameState !== 'undefined' && 
            typeof GameState.completeNode === 'function' && 
            nodeData.id) {
          GameState.completeNode(nodeData.id);
        } else {
          console.error("Cannot complete node: GameState not available");
          // Fallback to UI.showMapView if available
          if (typeof UI !== 'undefined' && typeof UI.showMapView === 'function') {
            UI.showMapView();
          }
        }
      }
    }
  });
  
  // Export globally
  window.NodeComponents = NodeComponents;