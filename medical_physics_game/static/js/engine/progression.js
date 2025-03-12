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
    
    // Replace the canVisitNode method in ProgressionManager with this fixed version

    canVisitNode: function(nodeId) {
      console.log(`Checking if can visit node: ${nodeId}`);
      
      // Can't visit if there's already a current node
      if (GameState.data.currentNode) {
        console.log("Can't visit - there's already a current node");
        return false;
      }
      
      // Get the node
      const node = GameState.getNodeById(nodeId);
      if (!node) {
        console.log(`Can't visit - node ${nodeId} not found`);
        return false;
      }
      
      // Can't visit start node
      if (nodeId === 'start') {
        console.log("Can't visit the start node");
        return false;
      }
      
      // Already visited nodes cannot be visited again
      if (node.visited) {
        console.log(`Can't visit - node ${nodeId} already visited`);
        return false;
      }
      
      console.log(`Node ${nodeId} state:`, node.state);
      
      // Must be available to visit
      if (node.state !== NODE_STATE.AVAILABLE) {
        console.log(`Can't visit - node ${nodeId} is not available (state: ${node.state})`);
        return false;
      }
      
      // Get nodes that connect to this node
      const connectedNodes = this.getConnectedNodes(nodeId);
      console.log(`Connected nodes to ${nodeId}:`, connectedNodes.map(n => n.id));
      
      // Check if any connected node is visited
      const hasVisitedConnection = connectedNodes.some(prevNode => 
        prevNode.visited || prevNode.id === 'start'
      );
      
      if (!hasVisitedConnection) {
        console.log(`Can't visit - no connected nodes to ${nodeId} are visited`);
        return false;
      }
      
      console.log(`Node ${nodeId} can be visited`);
      return true;
    },
    
    // Validate row-based progression (must complete entire rows)
    validateRowBasedProgression: function(node) {
      // Get node's row
      const nodeRow = node.position.row;
      
      // Row 1 nodes are accessible from start
      if (nodeRow === 1) {
        const startNode = GameState.getNodeById('start');
        return startNode && startNode.paths && startNode.paths.includes(node.id);
      }
      
      // For rows > 1, the entire previous row must be completed
      const previousRowComplete = GameState.isRowCompleted(nodeRow - 1);
      if (!previousRowComplete) return false;
      
      // Additionally, there must be a path from a completed node in the previous row
      const connectedNodes = this.getConnectedNodes(node.id);
      return connectedNodes.some(prevNode => 
        prevNode.position.row === nodeRow - 1 && 
        (prevNode.visited || prevNode.id === 'start')
      );
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