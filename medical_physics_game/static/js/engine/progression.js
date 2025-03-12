// progression.js - Game progression rules and validation

// Progression types
const PROGRESSION_TYPE = {
  ROW_BASED: 'row_based',  // Must progress row by row (but can skip nodes)
  PATH_BASED: 'path_based', // Can progress along any valid path
  MIXED: 'mixed'           // Combination of rules
};

// ProgressionManager singleton - enforces game progression rules
const ProgressionManager = {
  // Default progression type
  type: PROGRESSION_TYPE.PATH_BASED, // Changed to PATH_BASED to allow more freedom
  
  // Initialize with specified progression type
  initialize: function(progressionType) {
    if (!progressionType) progressionType = PROGRESSION_TYPE.PATH_BASED;
    console.log("Initializing progression manager with type: " + progressionType);
    this.type = progressionType;
    return this;
  },
  
  // Check if a node can be visited
  canVisitNode: function(nodeId) {
    console.log("Checking if can visit node: " + nodeId);
    
    // Rule 1: Can't visit if there's already a current node
    if (GameState.data.currentNode) {
      console.log("Can't visit - there's already a current node");
      return false;
    }
    
    // Rule 2: Can't visit if node doesn't exist
    const node = GameState.getNodeById(nodeId);
    if (!node) {
      console.log("Can't visit - node " + nodeId + " not found");
      return false;
    }
    
    // Rule 3: Can't visit start node
    if (nodeId === 'start') {
      console.log("Can't visit the start node");
      return false;
    }
    
    // Rule 4: Can't revisit completed nodes
    if (node.visited) {
      console.log("Can't visit - node " + nodeId + " already visited");
      return false;
    }
    
    console.log("Node " + nodeId + " state: " + node.state);
    
    // Rule 5: Must have a DIRECT PATH from a completed node
    const connectedNodes = this.getConnectedNodes(nodeId);
    
    // Format array of IDs for logging without using map function
    let nodeIds = [];
    for (let i = 0; i < connectedNodes.length; i++) {
      nodeIds.push(connectedNodes[i].id);
    }
    console.log("Connected nodes to " + nodeId + " are: " + nodeIds.join(', '));
    
    // Check if any connected node is visited
    let hasVisitedConnection = false;
    for (let i = 0; i < connectedNodes.length; i++) {
      if (connectedNodes[i].visited || connectedNodes[i].id === 'start') {
        hasVisitedConnection = true;
        break;
      }
    }
    
    if (!hasVisitedConnection) {
      console.log("Can't visit - no connected nodes to " + nodeId + " are visited");
      return false;
    }
    
    console.log("Node " + nodeId + " can be visited - path is valid");
    return true;
  },
  
  // Get all nodes that connect to a given node
  getConnectedNodes: function(nodeId) {
    const connectedNodes = [];
    const allNodes = GameState.getAllNodes();
    
    // Check each node for paths that include this node
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      if (node.paths && node.paths.indexOf(nodeId) !== -1) {
        connectedNodes.push(node);
      }
    }
    
    return connectedNodes;
  },
  
  // Check map structure for validation issues
  validateMapStructure: function() {
    console.log("Validating map structure...");
    
    const allNodes = GameState.getAllNodes();
    let issues = [];
    
    // In any progression mode, we check for unreachable nodes
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      if (node.id === 'start') continue;
      
      const connectedNodes = this.getConnectedNodes(node.id);
      if (connectedNodes.length === 0) {
        issues.push({
          type: 'unreachable_node',
          node: node.id,
          message: "Node " + node.id + " is unreachable (no incoming connections)."
        });
      }
    }
    
    // Log issues
    if (issues.length > 0) {
      console.warn("Found " + issues.length + " issues with map structure:");
      for (let i = 0; i < issues.length; i++) {
        console.warn("- " + issues[i].message);
      }
    } else {
      console.log("Map structure validation passed.");
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  },
  
  // Check if the next floor is accessible
  canAccessNextFloor: function() {
    // Can only go to next floor if current floor is complete
    return GameState.checkFloorCompletion();
  }
};

// Export the ProgressionManager
window.ProgressionManager = ProgressionManager;
window.PROGRESSION_TYPE = PROGRESSION_TYPE;