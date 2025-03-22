// node_components.js - Component registry and management system for node interactions

const NodeComponents = {
  // Component registry
  registry: {},
  
  // Track container creation status
  createdContainers: {},
  
  // Track loaded components
  loadedComponents: {},
  
  // Initialize the component system
  initialize: function() {
    console.log("Initializing NodeComponents system...");
    
    // Register for node type registration events
    if (typeof EventSystem !== 'undefined') {
      EventSystem.on('nodeTypeRegistered', this.onNodeTypeRegistered.bind(this));
    }
    
    // Load components for all registered node types
    if (typeof NodeRegistry !== 'undefined' && NodeRegistry.nodeTypes) {
      Object.keys(NodeRegistry.nodeTypes).forEach(typeId => {
        // Attempt to load component if not already loaded
        this.loadComponentIfNeeded(typeId);
      });
    }
    if (typeof EventSystem !== 'undefined') {
      EventSystem.on(GAME_EVENTS.FLOOR_CHANGED, () => {
        this.resetContainers(); 
      });
      
      // Also reset containers on game initialization
      EventSystem.on(GAME_EVENTS.GAME_INITIALIZED, () => {
        this.resetContainers();
      });
    }
    // Create containers for all node types
    this.createAllContainers();
    
    // Initialize all components that have initialize methods
    this.initializeAll();
    
    // Register default component
    this.registerDefaultComponent();
    
    return this;
  },
  
  // Handle node type registration
  onNodeTypeRegistered: function(data) {
    const { type } = data;
    
    // Create container for the new type
    this.createContainerForType(type);
    
    // Try to load the component if needed
    this.loadComponentIfNeeded(type);
  },
  
  // Register a component for a node type
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
        component[method] = this.getDefaultMethod(method, typeId);
      });
    }
    
    this.registry[typeId] = component;
    this.loadedComponents[typeId] = true;
    
    // Initialize the component if the system is already initialized
    if (typeof component.initialize === 'function') {
      try {
        component.initialize();
      } catch (error) {
        ErrorHandler.handleError(error, `Component Initialization (${typeId})`);
      }
    }
    
    return this; // Enable chaining
  },
  
  // Create default implementation of a method
  getDefaultMethod: function(methodName, typeId) {
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
      console.warn(`Default ${methodName} called for ${typeId} - no implementation provided`);
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
  
  // Try to dynamically load a component for a node type
  loadComponentIfNeeded: function(typeId) {
    if (this.registry[typeId] || this.loadedComponents[typeId] || typeId === 'start') {
      return; // Already loaded, attempted to load, or start node (which needs no component)
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
      // Create a skeleton component for this type
      this.createSkeletonComponent(typeId);
    };
    
    document.head.appendChild(script);
  },
  
  // Create containers for all node types with interaction containers
  createAllContainers: function() {
    console.log("Creating containers for all node types...");
    
    if (typeof NodeRegistry !== 'undefined' && NodeRegistry.nodeTypes) {
      Object.entries(NodeRegistry.nodeTypes).forEach(([type, config]) => {
        if (config.interactionContainer) {
          this.createContainerForType(type);
        }
      });
    }
  },
  
  // Replace the createContainerForType function in node_components.js
  createContainerForType: function(type) {
    if (!NodeRegistry) return;
    
    const containerId = NodeRegistry.getContainerIdForType(type);
    
    // Skip if no container ID specified
    if (!containerId) return;
    
    // IMPORTANT: Reset our tracking state - always verify if container actually exists in DOM
    this.createdContainers[containerId] = false;
    
    // Check if container already exists in DOM (not just in our tracking variable)
    if (document.getElementById(containerId)) {
      console.log(`Container ${containerId} already exists in DOM`);
      this.createdContainers[containerId] = true;
      return;
    }
    
    console.log(`Creating container for node type: ${type} (${containerId})`);
    
    // Get the parent element where containers should go
    let parentElement = document.querySelector('.col-md-9');
    if (!parentElement) {
      parentElement = document.querySelector('#game-board-container');
    }
    if (!parentElement) {
      parentElement = document.querySelector('.game-board-container');
    }
    
    if (!parentElement) {
      console.error("Parent element for containers not found");

      // Fallback - create a container in the body if nothing else works
      const gameBoard = document.createElement('div');
      gameBoard.id = 'game-board-container';
      gameBoard.className = 'game-board-container col-md-9';
      document.body.appendChild(gameBoard);

      // Now use this as the parent
      parentElement = gameBoard;
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = containerId;
    container.className = 'interaction-container';
    
    // Add basic structure based on node type
    switch (type) {
      case 'question':
      case 'elite':
      case 'boss':
        container.innerHTML = `
          <h3 id="question-title">${NodeRegistry.getNodeType(type).displayName}</h3>
          <p id="question-text"></p>
          <div id="options-container"></div>
          <div id="question-result" style="display: none;"></div>
          <button id="continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
        `;
        break;
      
      // Other cases remain the same...
      
      default:
        container.innerHTML = `
          <h3>${NodeRegistry.getNodeType(type).displayName}</h3>
          <div id="${type}-content"></div>
          <button id="${type}-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
    }
    
    // Add to parent
    parentElement.appendChild(container);
    
    // Mark as created
    this.createdContainers[containerId] = true;
    
    console.log(`Container ${containerId} successfully created and added to DOM`);
  },
  
  // Add this function to NodeComponents
  resetContainers: function() {
    console.log("Resetting NodeComponents container tracking...");
    
    // Reset container tracking
    this.createdContainers = {};
    
    // Check if any container elements exist and recreate them if needed
    if (typeof NodeRegistry !== 'undefined' && NodeRegistry.nodeTypes) {
      Object.entries(NodeRegistry.nodeTypes).forEach(([type, config]) => {
        if (config.interactionContainer) {
          // Force recreation of all containers
          this.createContainerForType(type);
        }
      });
    }
  },

  // Process a node with its component
  processNode: function(nodeData, container) {
    if (!nodeData || !nodeData.type) {
      ErrorHandler.handleError(new Error("Invalid node data"), "Node Processing");
      return false;
    }
    
    const component = this.getComponent(nodeData.type);
    if (!component) {
      ErrorHandler.handleError(new Error(`No component found for node type: ${nodeData.type}`), "Node Processing");
      return false;
    }
    
    try {
      // Render the component
      component.render(nodeData, container);
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, `Component Rendering (${nodeData.type})`);
      // Render error state in container
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
  
  // Create a skeleton component for a node type
  createSkeletonComponent: function(typeId) {
    if (!typeId || typeId === 'start') return null;
    
    console.log(`Creating skeleton component for node type: ${typeId}`);
    
    // Get node type config to use for display name
    let displayName = typeId;
    if (NodeRegistry && NodeRegistry.getNodeType) {
      const nodeType = NodeRegistry.getNodeType(typeId);
      displayName = nodeType.displayName || typeId;
    }
    
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
    this.register(typeId, component);
    
    return component;
  },
  
  // Initialize all registered components
  initializeAll: function() {
    console.log("Initializing all node components");
    Object.entries(this.registry).forEach(([typeId, component]) => {
      if (typeof component.initialize === 'function') {
        try {
          component.initialize();
        } catch (error) {
          ErrorHandler.handleError(error, `Component Initialization (${typeId})`);
        }
      }
    });
  },
  
  // Register default component (fallback for unknown types)
  registerDefaultComponent: function() {
    this.register('default', {
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
  }
};

// Export globally
window.NodeComponents = NodeComponents;