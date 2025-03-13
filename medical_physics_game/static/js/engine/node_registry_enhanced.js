// node_registry_enhanced.js - Enhanced node registry with dynamic container generation

// Enhanced NodeRegistry
const NodeRegistryEnhanced = {
    // Node type definitions (will be loaded from JSON)
    nodeTypes: {},
    
    // Initialize with node types from JSON
    initialize: function() {
      console.log("Initializing enhanced node registry...");
      
      // Load node types configuration
      this.loadNodeTypes()
        .then(() => {
          console.log(`Loaded ${Object.keys(this.nodeTypes).length} node types`);
          
          // Create containers for all node types
          this.createContainers();
        })
        .catch(error => {
          console.error("Error loading node types:", error);
          
          // Fall back to original NodeRegistry
          if (typeof NodeRegistry !== 'undefined') {
            console.log("Falling back to original NodeRegistry");
            this.nodeTypes = NodeRegistry.nodeTypes;
          }
        });
      
      return this;
    },
    
    // Load node types from JSON configuration
    loadNodeTypes: function() {
      return fetch('/data/node_types.json')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load node types: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Normalize data to expected format
          if (data.types && Array.isArray(data.types)) {
            data.types.forEach(type => {
              this.nodeTypes[type.id] = {
                displayName: type.displayName,
                symbol: type.symbol,
                color: type.color,
                shadowColor: type.shadowColor,
                interactionContainer: type.containerName,
                weight: type.weight,
                processDataFunction: `process${this.capitalizeFirstLetter(type.id)}Data`
              };
            });
          } else {
            throw new Error("Invalid node types data format");
          }
        });
    },
    
    // Dynamic container creation
    createContainers: function() {
      console.log("Creating containers for node types...");
      
      // Get the parent element where containers should go
      const parentElement = document.querySelector('.col-md-9');
      if (!parentElement) {
        console.error("Parent element for containers not found");
        return;
      }
      
      // Create containers for all node types with interaction containers
      Object.entries(this.nodeTypes).forEach(([type, config]) => {
        // Skip if no container ID specified
        if (!config.interactionContainer) return;
        
        // Check if container already exists
        if (document.getElementById(config.interactionContainer)) {
          console.log(`Container ${config.interactionContainer} already exists, skipping`);
          return;
        }
        
        console.log(`Creating container for node type: ${type} (${config.interactionContainer})`);
        
        // Create container
        const container = document.createElement('div');
        container.id = config.interactionContainer;
        container.className = 'interaction-container';
        
        // Add basic structure
        container.innerHTML = `
          <h3>${config.displayName}</h3>
          <div id="${type}-content" class="node-content"></div>
          <button id="${type}-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        
        // Add to parent
        parentElement.appendChild(container);
        
        // Add continue button event listener
        const continueBtn = document.getElementById(`${type}-continue-btn`);
        if (continueBtn) {
          continueBtn.addEventListener('click', () => {
            if (GameState.data.currentNode) {
              GameState.completeNode(GameState.data.currentNode);
            }
          });
        }
      });
    },
    
    // Get properties of a node type
    getNodeType: function(type) {
      if (!this.nodeTypes[type]) {
        console.error(`Node type "${type}" not registered`);
        // Return a default for error handling
        return {
          displayName: "Unknown",
          symbol: "?",
          color: "#999999",
          shadowColor: "#666666",
          interactionContainer: null,
          weight: 0,
          processDataFunction: null
        };
      }
      return this.nodeTypes[type];
    },
    
    // Get all weighted node types for random generation
    getWeightedNodeTypes: function() {
      const weightedTypes = [];
      
      Object.entries(this.nodeTypes).forEach(([type, config]) => {
        if (config.weight > 0) {
          weightedTypes.push({
            type: type,
            weight: config.weight
          });
        }
      });
      
      return weightedTypes;
    },
    
    // Process node data based on type
    processNodeData: function(node) {
      if (!node) return node;
      
      const nodeType = this.getNodeType(node.type);
      
      // If a process function is defined, call it
      if (nodeType.processDataFunction && 
          typeof this[nodeType.processDataFunction] === 'function') {
        return this[nodeType.processDataFunction](node);
      }
      
      return node;
    },
    
    // Helper method
    capitalizeFirstLetter: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  };
  
  // Export globally - This doesn't replace the original NodeRegistry yet
  window.NodeRegistryEnhanced = NodeRegistryEnhanced;