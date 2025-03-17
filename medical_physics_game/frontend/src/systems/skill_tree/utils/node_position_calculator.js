// frontend/src/systems/skill_tree/utils/node_position_calculator.js

/**
 * NodePositionCalculator
 * Calculates optimal positions for skill tree nodes
 */
class NodePositionCalculator {
  constructor(options = {}) {
    this.options = Object.assign({
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300,
      tierSpacing: 100,
      nodeSpacing: 80,
      minDistance: 60,
      iterationCount: 50,
      attractionForce: 0.1,
      repulsionForce: 500,
      simulationEnabled: true
    }, options);
  }
  
  /**
   * Calculate optimal positions for skill tree nodes
   * @param {Array} nodes Nodes to position
   * @param {Array} connections Connections between nodes
   * @returns {Array} Nodes with updated positions
   */
  calculatePositions(nodes, connections) {
    if (!nodes || nodes.length === 0) {
      return nodes;
    }
    
    // Make a deep copy to avoid modifying original
    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    
    // If nodes already have positions and simulation is disabled, just return them
    if (!this.options.simulationEnabled && nodesCopy.every(node => node.position?.x !== undefined)) {
      return nodesCopy;
    }
    
    // First pass: Assign initial positions based on tier and specialization
    this._assignInitialPositions(nodesCopy);
    
    // Second pass: Apply force-directed layout to refine positions
    if (this.options.simulationEnabled) {
      this._applyForceDirectedLayout(nodesCopy, connections);
    }
    
    // Final pass: Ensure no nodes are too close together
    this._resolveOverlaps(nodesCopy);
    
    return nodesCopy;
  }
  
  /**
   * Assign initial positions based on tier and specialization
   * @param {Array} nodes Nodes to position
   * @private
   */
  _assignInitialPositions(nodes) {
    // Group nodes by tier and specialization
    const nodesByTier = new Map();
    
    // First pass: group nodes
    nodes.forEach(node => {
      const tier = node.tier || 0;
      
      if (!nodesByTier.has(tier)) {
        nodesByTier.set(tier, {
          nodes: [],
          bySpecialization: new Map()
        });
      }
      
      const tierData = nodesByTier.get(tier);
      tierData.nodes.push(node);
      
      // Group by specialization
      const spec = node.specialization || 'core';
      if (!tierData.bySpecialization.has(spec)) {
        tierData.bySpecialization.set(spec, []);
      }
      
      tierData.bySpecialization.get(spec).push(node);
    });
    
    // Calculate positions by tier and specialization
    nodesByTier.forEach((tierData, tier) => {
      // For tier 0 (core), position around center
      if (tier === 0) {
        const coreNodes = tierData.nodes;
        
        if (coreNodes.length === 1) {
          // Single core node at center
          coreNodes[0].position = { 
            x: this.options.centerX, 
            y: this.options.centerY 
          };
        } else {
          // Multiple core nodes in a circle
          const angleStep = (2 * Math.PI) / coreNodes.length;
          const coreRadius = this.options.nodeSpacing / 2;
          
          coreNodes.forEach((node, index) => {
            const angle = index * angleStep;
            node.position = {
              x: this.options.centerX + Math.cos(angle) * coreRadius,
              y: this.options.centerY + Math.sin(angle) * coreRadius
            };
          });
        }
      } else {
        // Calculate radius based on tier (circular layout)
        const radius = tier * this.options.tierSpacing;
        
        // Position nodes in each specialization sector
        const specializations = Array.from(tierData.bySpecialization.keys());
        const specCount = specializations.length;
        const anglePerSpec = (2 * Math.PI) / Math.max(1, specCount);
        
        specializations.forEach((spec, specIndex) => {
          const nodes = tierData.bySpecialization.get(spec);
          const nodeCount = nodes.length;
          
          // Calculate angle range for this specialization
          const startAngle = specIndex * anglePerSpec;
          // Use 80% of available angle to leave space between specializations
          const angleWidth = anglePerSpec * 0.8;
          
          nodes.forEach((node, nodeIndex) => {
            // Calculate angle within specialization sector
            const angle = startAngle + 
              (nodeCount > 1 ? (nodeIndex / (nodeCount - 1)) * angleWidth : 0);
            
            // Set position
            node.position = {
              x: this.options.centerX + Math.cos(angle) * radius,
              y: this.options.centerY + Math.sin(angle) * radius
            };
          });
        });
      }
    });
  }
  
  /**
   * Apply force-directed layout algorithm to refine positions
   * @param {Array} nodes Nodes to position
   * @param {Array} connections Connections between nodes
   * @private
   */
  _applyForceDirectedLayout(nodes, connections) {
    // Build a map for easier access to nodes by ID
    const nodeMap = new Map();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });
    
    // Create connection lookup for each node
    const nodeConnections = new Map();
    connections.forEach(conn => {
      const sourceId = conn.source;
      const targetId = conn.target;
      
      if (!nodeConnections.has(sourceId)) {
        nodeConnections.set(sourceId, []);
      }
      if (!nodeConnections.has(targetId)) {
        nodeConnections.set(targetId, []);
      }
      
      nodeConnections.get(sourceId).push(targetId);
      nodeConnections.get(targetId).push(sourceId);
    });
    
    // Run force-directed layout algorithm
    for (let i = 0; i < this.options.iterationCount; i++) {
      // Calculate forces for each node
      const forces = new Map();
      
      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { fx: 0, fy: 0 });
      });
      
      // Calculate attraction forces between connected nodes
      connections.forEach(conn => {
        const sourceNode = nodeMap.get(conn.source);
        const targetNode = nodeMap.get(conn.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Calculate distance and direction
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Optimal distance based on tier difference
        const tierDiff = Math.abs((targetNode.tier || 0) - (sourceNode.tier || 0));
        const optimalDistance = this.options.tierSpacing * (tierDiff || 1);
        
        // Calculate attractive force
        const force = (distance - optimalDistance) * this.options.attractionForce;
        
        // Apply force to both nodes in opposite directions
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        forces.get(conn.source).fx += fx;
        forces.get(conn.source).fy += fy;
        forces.get(conn.target).fx -= fx;
        forces.get(conn.target).fy -= fy;
      });
      
      // Calculate repulsion forces between all nodes
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const nodeA = nodes[j];
          const nodeB = nodes[k];
          
          // Skip if same tier or connected
          const areConnected = 
            (nodeConnections.get(nodeA.id)?.includes(nodeB.id)) || 
            (nodeConnections.get(nodeB.id)?.includes(nodeA.id));
          
          // Calculate distance and direction
          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const distanceSquared = dx * dx + dy * dy;
          const distance = Math.sqrt(distanceSquared);
          
          if (distance < 0.1) continue;
          
          // Calculate repulsive force (inversely proportional to distance squared)
          const force = this.options.repulsionForce / distanceSquared;
          
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          // Apply forces
          forces.get(nodeA.id).fx -= fx;
          forces.get(nodeA.id).fy -= fy;
          forces.get(nodeB.id).fx += fx;
          forces.get(nodeB.id).fy += fy;
        }
      }
      
      // Update node positions based on forces
      const damping = 1 - (i / this.options.iterationCount) * 0.9;
      
      nodes.forEach(node => {
        const force = forces.get(node.id);
        
        // Apply damping (slows movement over iterations)
        const moveX = force.fx * damping;
        const moveY = force.fy * damping;
        
        // Update position
        node.position.x += moveX;
        node.position.y += moveY;
        
        // Constrain to bounds
        node.position.x = Math.max(50, Math.min(this.options.width - 50, node.position.x));
        node.position.y = Math.max(50, Math.min(this.options.height - 50, node.position.y));
      });
    }
  }
  
  /**
   * Resolve node overlaps to ensure minimum distance between nodes
   * @param {Array} nodes Nodes to process
   * @private
   */
  _resolveOverlaps(nodes) {
    const minDistance = this.options.minDistance;
    let overlapping = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (overlapping && iterations < maxIterations) {
      overlapping = false;
      iterations++;
      
      // Check all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          
          // Calculate distance
          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If too close, separate them
          if (distance < minDistance) {
            overlapping = true;
            
            // Move nodes apart
            const moveDistance = (minDistance - distance) / 2;
            
            if (distance > 0.1) {
              const moveX = (dx / distance) * moveDistance;
              const moveY = (dy / distance) * moveDistance;
              
              nodeA.position.x -= moveX;
              nodeA.position.y -= moveY;
              nodeB.position.x += moveX;
              nodeB.position.y += moveY;
            } else {
              // If directly on top of each other, move in random direction
              const angle = Math.random() * Math.PI * 2;
              nodeA.position.x -= Math.cos(angle) * (minDistance / 2);
              nodeA.position.y -= Math.sin(angle) * (minDistance / 2);
              nodeB.position.x += Math.cos(angle) * (minDistance / 2);
              nodeB.position.y += Math.sin(angle) * (minDistance / 2);
            }
          }
        }
      }
    }
    
    // Center all nodes
    this._centerNodes(nodes);
  }
  
  /**
   * Center all nodes within the available space
   * @param {Array} nodes Nodes to center
   * @private
   */
  _centerNodes(nodes) {
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    });
    
    // Calculate center offset
    const centerOffsetX = (this.options.width / 2) - ((minX + maxX) / 2);
    const centerOffsetY = (this.options.height / 2) - ((minY + maxY) / 2);
    
    // Apply offset to all nodes
    nodes.forEach(node => {
      node.position.x += centerOffsetX;
      node.position.y += centerOffsetY;
    });
  }
}

export default NodePositionCalculator;