// progression.js - Game progression rules and validation

// Progression types
const PROGRESSION_TYPE = {
  ROW_BASED: 'row_based',  // Must complete entire rows before progressing
  PATH_BASED: 'path_based', // Can progress along any valid path
  MIXED: 'mixed'           // Combination of rules
};

// ProgressionManager singleton - enforces game progression rules
const ProgressionManager = {
  // Default progression type
  type: PROGRESSION_TYPE.ROW_BASED,
  
  // Initialize with specified progression type
  initialize: function(progressionType = PROGRESSION_TYPE.ROW_BASED) {
    console.log(`Initializing progression manager with type: ${progressionType}`);
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
    
    // Format array of IDs for logging
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
    
    // IMPORTANT: Simple validation that works for all progression types
    // If we get here, the node can be visited
    console.log("Node " + nodeId + " can be visited - path is valid");
    return true;
  },
  
  // Validate row-based progression (must be on the current row)
  validateRowBasedProgression: function(nodeId) {
    const node = GameState.getNodeById(nodeId);
    if (!node || !node.position) return false;
    
    // Get all nodes in the current map
    const allNodes = GameState.getAllNodes();
    
    // Find the lowest incomplete row
    let lowestIncompleteRow = 99;
    allNodes.forEach(n => {
      if (n.id !== 'start' && !n.visited && n.position && n.position.row < lowestIncompleteRow) {
        lowestIncompleteRow = n.position.row;
      }
    });
    
    // Node must be in the lowest incomplete row
    return node.position.row === lowestIncompleteRow;
  },
  
  // Validate path-based progression (can follow any valid path)
  validatePathBasedProgression: function(node) {
    // Get nodes that connect to this node
    const connectedNodes = this.getConnectedNodes(node.id);
    
    // Node is available if any connecting node is visited
    return connectedNodes.some(prevNode => prevNode.visited || prevNode.id === 'start');
  },
  
  // Get all nodes that connect to a given node
  getConnectedNodes: function(nodeId) {
    const connectedNodes = [];
    const allNodes = GameState.getAllNodes();
    
    // Check each node for paths that include this node
    allNodes.forEach(node => {
      if (node.paths && node.paths.includes(nodeId)) {
        connectedNodes.push(node);
      }
    });
    
    return connectedNodes;
  },
  
  // Check map structure for validation issues
  validateMapStructure: function() {
    console.log("Validating map structure...");
    
    const allNodes = GameState.getAllNodes();
    let issues = [];
    
    switch (this.type) {
      case PROGRESSION_TYPE.ROW_BASED:
        // In row-based progression, connections should only go to the next row
        allNodes.forEach(node => {
          if (!node.paths || node.id === 'boss') return;
          
          const sourceRow = node.position?.row;
          if (sourceRow === undefined) return;
          
          node.paths.forEach(targetId => {
            const target = GameState.getNodeById(targetId);
            if (!target || target.position?.row === undefined) return;
            
            // Check if target is in the next row (or same row for certain nodes)
            const rowDiff = target.position.row - sourceRow;
            
            if (rowDiff !== 1 && !(rowDiff === 0 && sourceRow === 0)) {
              issues.push({
                type: 'invalid_connection',
                source: node.id,
                target: targetId,
                message: `Connection from ${node.id} (row ${sourceRow}) to ${targetId} (row ${target.position.row}) is invalid for row-based progression.`
              });
            }
          });
        });
        break;
      
      case PROGRESSION_TYPE.PATH_BASED:
        // In path-based progression, we check for unreachable nodes
        allNodes.forEach(node => {
          if (node.id === 'start') return;
          
          const connectedNodes = this.getConnectedNodes(node.id);
          if (connectedNodes.length === 0) {
            issues.push({
              type: 'unreachable_node',
              node: node.id,
              message: `Node ${node.id} is unreachable (no incoming connections).`
            });
          }
        });
        break;
    }
    
    // Log issues
    if (issues.length > 0) {
      console.warn(`Found ${issues.length} issues with map structure:`);
      issues.forEach(issue => console.warn(`- ${issue.message}`));
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