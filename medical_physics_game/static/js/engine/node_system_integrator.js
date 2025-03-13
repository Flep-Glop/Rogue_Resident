// node_system_integrator.js - Manages node system migration 

// NodeSystemIntegrator - Handles transition to component-based system
const NodeSystemIntegrator = {
    // Track if integration is complete
    isIntegrated: false,
    
    // Track components that need to be created
    pendingComponents: [],
    
    // Initialize the enhanced node system
    initialize: function() {
      console.log("Initializing node system integrator...");
      
      // Check for old NodeRegistry
      const hasLegacySystem = typeof window.NodeRegistry !== 'undefined' && 
                             window.NodeRegistry !== NodeRegistry;
      
      if (hasLegacySystem) {
        console.log("Found legacy NodeRegistry, will migrate node types");
        this.migrateLegacyNodeTypes();
      }
      
      // Check which components we need
      this.identifyNeededComponents();
      
      // If any components are missing, log warnings
      if (this.pendingComponents.length > 0) {
        console.warn(`Missing components for ${this.pendingComponents.length} node types:`);
        this.pendingComponents.forEach(type => {
          console.warn(`- Missing component for node type: ${type}`);
        });
      }
      
      // Success!
      this.isIntegrated = true;
      console.log("Node system integration complete");
      
      return true;
    },
    
    // Migrate node types from legacy NodeRegistry if it exists
    migrateLegacyNodeTypes: function() {
      if (typeof window.NodeRegistry === 'undefined' || 
          window.NodeRegistry === NodeRegistry) {
        return false;
      }
      
      const legacyNodeRegistry = window.NodeRegistry;
      
      // Save legacy node types
      Object.entries(legacyNodeRegistry.nodeTypes || {}).forEach(([typeId, config]) => {
        // Skip if already in new registry
        if (NodeRegistry.nodeTypes[typeId]) {
          return;
        }
        
        console.log(`Migrating node type from legacy system: ${typeId}`);
        
        // Convert to new format
        const newConfig = {
          id: typeId,
          displayName: config.displayName || typeId,
          symbol: config.symbol || "?",
          color: config.color || "#999999",
          shadowColor: config.shadowColor || "#666666",
          containerName: config.interactionContainer || `${typeId}-container`,
          weight: config.weight || 0
        };
        
        // Register with new system
        NodeRegistry.registerNodeType(typeId, newConfig);
      });
      
      return true;
    },
    
    // Identify which components need to be created
    identifyNeededComponents: function() {
      this.pendingComponents = [];
      
      // Check each node type in the registry
      Object.keys(NodeRegistry.nodeTypes).forEach(typeId => {
        // Skip if component already exists
        if (NodeComponents.registry[typeId]) {
          return;
        }
        
        // Add to pending components
        this.pendingComponents.push(typeId);
      });
      
      return this.pendingComponents;
    },
    
    // Create a skeleton component for a node type
    createSkeletonComponent: function(typeId) {
      if (!typeId) return null;
      
      console.log(`Creating skeleton component for node type: ${typeId}`);
      
      // Create basic component with required methods
      const component = {
        initialize: function() {
          console.log(`Initializing ${typeId} component`);
        },
        
        render: function(nodeData, container) {
          console.log(`Rendering ${typeId} node`, nodeData);
          
          // Create basic UI
          container.innerHTML = `
            <h3>${nodeData.title || NodeRegistry.getNodeType(typeId).displayName}</h3>
            <div class="node-content" id="${typeId}-content">
              <div class="alert alert-warning">
                <p>This is an auto-generated component for node type: ${typeId}</p>
                <p>Create a proper component implementation in:</p>
                <pre>/static/js/components/${typeId}_component.js</pre>
              </div>
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
        
        handleAction: function(nodeData, action) {
          console.log(`${typeId} component handling action: ${action}`);
          
          if (action === 'continue') {
            // Complete the node
            if (GameState.data.currentNode) {
              GameState.completeNode(nodeData.id);
            }
          }
        }
      };
      
      // Register with NodeComponents
      NodeComponents.register(typeId, component);
      
      return component;
    },
    
    // Create skeleton components for all missing components
    createSkeletonComponents: function() {
      this.pendingComponents.forEach(typeId => {
        this.createSkeletonComponent(typeId);
      });
      
      // Reset pending components
      this.pendingComponents = [];
    },
    
    // Get migration status
    getMigrationStatus: function() {
      // Check what components are still missing
      this.identifyNeededComponents();
      
      return {
        isIntegrated: this.isIntegrated,
        pendingComponents: this.pendingComponents,
        componentCount: Object.keys(NodeComponents.registry).length,
        nodeTypeCount: Object.keys(NodeRegistry.nodeTypes).length
      };
    }
  };
  
  // Export globally
  window.NodeSystemIntegrator = NodeSystemIntegrator;