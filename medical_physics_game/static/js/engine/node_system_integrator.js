// node_system_integrator.js - Integrates the new node system with the existing game

// NodeSystemIntegrator - Connects enhanced node system with existing code
const NodeSystemIntegrator = {
    // Track if integration is active
    isIntegrated: false,
    
    // Initialize the enhanced node system
    initialize: function() {
      console.log("Initializing node system integrator...");
      
      // Check if required components exist
      if (typeof NodeRegistryEnhanced === 'undefined') {
        console.error("NodeRegistryEnhanced not found, cannot integrate");
        return false;
      }
      
      if (typeof NodeComponents === 'undefined') {
        console.error("NodeComponents not found, cannot integrate");
        return false;
      }
      
      // Initialize enhanced node registry
      NodeRegistryEnhanced.initialize();
      
      // Initialize node components
      NodeComponents.initializeAll();
      
      // Integrate with NodeInteraction if possible
      this.integrateWithNodeInteraction();
      
      // Mark as integrated
      this.isIntegrated = true;
      console.log("Node system integration complete");
      
      return true;
    },
    
    // Integrate with existing NodeInteraction
    integrateWithNodeInteraction: function() {
      if (typeof NodeInteraction === 'undefined') {
        console.error("NodeInteraction not found, cannot integrate");
        return false;
      }
      
      console.log("Integrating with NodeInteraction...");
      
      // Save reference to original methods
      const originalProcessNodeContent = NodeInteraction.processNodeContent;
      
      // Override processNodeContent method
      NodeInteraction.processNodeContent = function(nodeData) {
        console.log("Enhanced processNodeContent called for node type:", nodeData.type);
        
        // Check if we have a component for this node type
        const component = NodeComponents.getComponent(nodeData.type);
        
        if (component) {
          // Get node type config from registry
          const nodeType = NodeRegistryEnhanced.getNodeType(nodeData.type);
          
          // Get container ID from registry
          const containerId = nodeType.interactionContainer;
          
          // If no container defined for this type, complete the node and return
          if (!containerId) {
            console.log(`No interaction container defined for node type: ${nodeData.type}`);
            GameState.completeNode(nodeData.id);
            return;
          }
          
          // Show the container
          this.showContainer(containerId);
          
          // Get the container element
          const container = document.getElementById(containerId);
          
          // Use component to render the node
          if (container) {
            NodeComponents.processNode(nodeData, container);
          } else {
            console.error(`Container ${containerId} not found`);
          }
        } else {
          // Fall back to original implementation
          originalProcessNodeContent.call(this, nodeData);
        }
      };
      
      console.log("NodeInteraction integration complete");
      return true;
    },
    
    // Provide a node creation helper
    createNodeType: function(typeConfig) {
      if (!typeConfig || !typeConfig.id) {
        console.error("Invalid node type configuration");
        return false;
      }
      
      console.log(`Creating new node type: ${typeConfig.id}`);
      
      // Add to NodeRegistryEnhanced
      NodeRegistryEnhanced.nodeTypes[typeConfig.id] = {
        displayName: typeConfig.displayName || typeConfig.id,
        symbol: typeConfig.symbol || "?",
        color: typeConfig.color || "#999999",
        shadowColor: typeConfig.shadowColor || "#666666",
        interactionContainer: typeConfig.containerId || `${typeConfig.id}-container`,
        weight: typeConfig.weight || 0,
        processDataFunction: typeConfig.processFunction || null
      };
      
      // Create container if needed
      if (!document.getElementById(typeConfig.containerId)) {
        this.createContainer(typeConfig);
      }
      
      return true;
    },
    
    // Create a container for a node type
    createContainer: function(typeConfig) {
      const parentElement = document.querySelector('.col-md-9');
      if (!parentElement) {
        console.error("Parent element for containers not found");
        return false;
      }
      
      const containerId = typeConfig.containerId || `${typeConfig.id}-container`;
      
      // Create container
      const container = document.createElement('div');
      container.id = containerId;
      container.className = 'interaction-container';
      
      // Add basic structure
      container.innerHTML = `
        <h3>${typeConfig.displayName || typeConfig.id}</h3>
        <div id="${typeConfig.id}-content" class="node-content"></div>
        <button id="${typeConfig.id}-continue-btn" class="btn btn-primary mt-3">Continue</button>
      `;
      
      // Add to parent
      parentElement.appendChild(container);
      
      // Add continue button event listener
      const continueBtn = document.getElementById(`${typeConfig.id}-continue-btn`);
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          if (GameState.data.currentNode) {
            GameState.completeNode(GameState.data.currentNode);
          }
        });
      }
      
      console.log(`Created container for node type: ${typeConfig.id}`);
      return true;
    }
  };
  
  // Export globally
  window.NodeSystemIntegrator = NodeSystemIntegrator;