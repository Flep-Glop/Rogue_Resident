// node_components.js - Enhanced component-based system for node interactions

// NodeComponents - Registry of components for different node types
const NodeComponents = {
    // Component registry
    registry: {},
    
    // Track loaded components
    loadedComponents: {},
    
    // Initialize the component system
    initialize: function() {
      console.log("Initializing NodeComponents system...");
      
      // Load components for all registered node types
      if (typeof NodeRegistryEnhanced !== 'undefined' && NodeRegistryEnhanced.nodeTypes) {
        Object.keys(NodeRegistryEnhanced.nodeTypes).forEach(typeId => {
          // Attempt to load component if not already loaded
          this.loadComponentIfNeeded(typeId);
        });
      }
      
      // Initialize all components that have initialize methods
      this.initializeAll();
      
      return this;
    },
    
    // Register a component
    register: function(typeId, component) {
      console.log(`Registering component for node type: ${typeId}`);
      
      // Ensure all components have required methods
      const requiredMethods = ['render', 'handleAction'];
      const missingMethods = requiredMethods.filter(method => 
        typeof component[method] !== 'function'
      );
      
      if (missingMethods.length > 0) {
        console.error(`Component for ${typeId} is missing required methods: ${missingMethods.join(', ')}`);
        
        // Add missing methods with default implementations
        missingMethods.forEach(method => {
          component[method] = this.getDefaultMethod(method);
        });
      }
      
      this.registry[typeId] = component;
      this.loadedComponents[typeId] = true;
      return this; // Enable chaining
    },
    
    // Create default implementation of a method
    getDefaultMethod: function(methodName) {
      if (methodName === 'render') {
        return function(nodeData, container) {
          container.innerHTML = `
            <div class="alert alert-warning">
              <h4>Missing Render Implementation</h4>
              <p>The component for node type "${nodeData.type}" does not have a render method.</p>
            </div>
            <button id="default-continue-btn" class="btn btn-primary mt-3">Continue</button>
          `;
          
          // Add continue button handler
          const continueBtn = document.getElementById('default-continue-btn');
          if (continueBtn) {
            continueBtn.addEventListener('click', () => {
              if (GameState.data.currentNode) {
                GameState.completeNode(GameState.data.currentNode);
              }
            });
          }
        };
      } else if (methodName === 'handleAction') {
        return function(nodeData, action) {
          console.log(`Default handling action: ${action}`);
          if (action === 'continue') {
            // Complete the node
            if (typeof GameState !== 'undefined' && 
                typeof GameState.completeNode === 'function' && 
                nodeData.id) {
              GameState.completeNode(nodeData.id);
            }
          }
        };
      }
      
      // Default function that does nothing
      return function() {
        console.warn(`Default ${methodName} called - no implementation provided`);
      };
    },
    
    // Get a component by type
    getComponent: function(typeId) {
      // Try to load the component if not already registered
      this.loadComponentIfNeeded(typeId);
      
      if (!this.registry[typeId]) {
        console.warn(`No component registered for node type: ${typeId}, using default`);
        return this.registry.default;
      }
      return this.registry[typeId];
    },
    
    // Try to dynamically load a component if needed
    loadComponentIfNeeded: function(typeId) {
      if (this.registry[typeId] || this.loadedComponents[typeId]) {
        return; // Already loaded or attempted to load
      }
      
      this.loadedComponents[typeId] = true; // Mark as attempted
      
      // Convert typeId to component file name (e.g. "question" -> "question_component.js")
      const componentName = typeId.includes('_') ?
        typeId.split('_').map(part => part.toLowerCase()).join('_') :
        typeId.toLowerCase();
      
      console.log(`Attempting to load component for node type: ${typeId}`);
      
      // Try to load the component dynamically
      const script = document.createElement('script');
      script.src = `/static/js/components/${componentName}_component.js`;
      script.async = true;
      script.onerror = () => {
        console.warn(`Could not load component for node type: ${typeId}`);
      };
      document.head.appendChild(script);
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
        
        // Render error message in container
        this.renderErrorState(nodeData, container, error);
        return false;
      }
    },
    
    // Render error state in container
    renderErrorState: function(nodeData, container, error) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <h4>Error Processing Node</h4>
          <p>An error occurred while processing node type: ${nodeData.type}</p>
          <pre>${error.message}</pre>
        </div>
        <button id="error-continue-btn" class="btn btn-primary mt-3">Continue</button>
      `;
      
      // Add continue button handler
      const continueBtn = document.getElementById('error-continue-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          if (GameState.data.currentNode) {
            GameState.completeNode(GameState.data.currentNode);
          }
        });
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