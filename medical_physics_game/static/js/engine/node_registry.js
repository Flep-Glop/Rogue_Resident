// node_registry.js - Single source of truth for node type definitions

const NodeRegistry = {
  // Node type definitions
  nodeTypes: {},
  
  // Initialize and return this object for chaining
  initialize: function() {
    console.log("Initializing node registry...");
    
    // Set up hardcoded node types
    this.setupNodeTypes();
    
    return this;
  },
  
  // Set up node type definitions
  setupNodeTypes: function() {
    this.nodeTypes = {
      "start": {
        displayName: "Starting Point",
        symbol: "S",
        color: "#56b886",     // Green
        shadowColor: "#45966d",
        interactionContainer: null,  // No interaction for start node
        weight: 0  // Not randomly generated
      },
      "question": {
        displayName: "Physics Question",
        symbol: "?",
        color: "#5b8dd9",     // Blue
        shadowColor: "#4a70b0",
        interactionContainer: "question-container",
        weight: 60
      },
      "elite": {
        displayName: "Challenging Question",
        symbol: "!",
        color: "#d35db3",     // Pink
        shadowColor: "#a24b8e",
        interactionContainer: "question-container", // Reuses question container
        weight: 15
      },
      "boss": {
        displayName: "Final Assessment",
        symbol: "B",
        color: "#e67e73",     // Red
        shadowColor: "#b66059",
        interactionContainer: "question-container", // Reuses question container
        weight: 0  // Not randomly generated
      },
      "treasure": {
        displayName: "Equipment Found",
        symbol: "T",
        color: "#f0c866",     // Yellow
        shadowColor: "#c9a955",
        interactionContainer: "treasure-container",
        weight: 20
      },
      "rest": {
        displayName: "Break Room",
        symbol: "R",
        color: "#9c77db",     // Purple
        shadowColor: "#7c5cb0",
        interactionContainer: "rest-container",
        weight: 15
      },
      "event": {
        displayName: "Random Event",
        symbol: "E",
        color: "#e99c50",     // Orange
        shadowColor: "#b87d40",
        interactionContainer: "event-container",
        weight: 15
      },
      "patient_case": {
        displayName: "Patient Case",
        symbol: "P",
        color: "#4acf8b",     // Bright green
        shadowColor: "#3aaf7a",
        interactionContainer: "patient-case-container",
        weight: 25
      },
      "shop": {
        displayName: "Department Store",
        symbol: "$",
        color: "#5bbcd9",     // Cyan
        shadowColor: "#4a99b3",
        interactionContainer: "shop-container",
        weight: 10
      },
      "gamble": {
        displayName: "Research Opportunity",
        symbol: "G",
        color: "#b8d458",     // Lime
        shadowColor: "#94ab47",
        interactionContainer: "gamble-container",
        weight: 10
      }
    };
  },
  
  // Get properties of a node type
  getNodeType: function(type) {
    if (!this.nodeTypes[type]) {
      console.error(`Node type "${type}" not registered`);
      // Return a default for error handling
      return {
        displayName: type.charAt(0).toUpperCase() + type.slice(1),
        symbol: "?",
        color: "#999999",
        shadowColor: "#666666",
        interactionContainer: null,
        weight: 0
      };
    }
    return this.nodeTypes[type];
  },
  
  // Register a new node type
  registerNodeType: function(type, config) {
    this.nodeTypes[type] = {
      displayName: config.displayName || type,
      symbol: config.symbol || "?",
      color: config.color || "#999999",
      shadowColor: config.shadowColor || "#666666",
      interactionContainer: config.interactionContainer || config.containerName || `${type}-container`,
      weight: config.weight || 0
    };
    
    // Signal that a new node type was registered
    if (typeof EventSystem !== 'undefined') {
      EventSystem.emit('nodeTypeRegistered', {
        type: type,
        config: this.nodeTypes[type]
      });
    }
    
    return this; // For chaining
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
  // Override or add this method
  getAvailableNodeTypes: function(floor) {
    let availableTypes = Object.keys(this.nodeTypes).filter(type => {
      // Hide gambling, event and challenge nodes
      return !['gamble', 'event', 'challenge'].includes(type);
    });
    
    // Filter based on floor requirements if needed
    if (floor && floor.restrictedNodeTypes) {
      availableTypes = availableTypes.filter(type => 
        !floor.restrictedNodeTypes.includes(type));
    }
    
    return availableTypes;
  },
  // Get container ID for a node type
  getContainerIdForType: function(type) {
    return this.getNodeType(type).interactionContainer;
  }
};

// Export globally
window.NodeRegistry = NodeRegistry;