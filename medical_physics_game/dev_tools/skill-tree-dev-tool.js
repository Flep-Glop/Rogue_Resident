// skill_tree_dev_tool.js - Development tool for working with skill tree data

/**
 * Development utility for skill tree data management
 * Only for use during development, not in production
 */
const SkillTreeDevTool = {
  data: null,
  
  /**
   * Initialize the tool with skill tree data
   * @param {Object} data - Skill tree data object
   * @returns {Object} This instance for chaining
   */
  initialize: function(data) {
    this.data = data ? structuredClone(data) : {
      tree_version: "1.0",
      specializations: [],
      nodes: [],
      connections: []
    };
    
    console.log("SkillTreeDevTool initialized with data", {
      specializations: this.data.specializations?.length || 0,
      nodes: this.data.nodes?.length || 0,
      connections: this.data.connections?.length || 0
    });
    
    return this;
  },
  
  /**
   * Load skill tree data from localStorage
   * @param {String} key - Storage key to use
   * @returns {Boolean} Success flag
   */
  loadFromLocalStorage: function(key = 'skillTreeData') {
    try {
      const savedData = localStorage.getItem(key);
      if (!savedData) {
        console.log(`No saved data found with key: ${key}`);
        return false;
      }
      
      this.data = JSON.parse(savedData);
      console.log(`Loaded skill tree data from localStorage (${key})`);
      return true;
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      return false;
    }
  },
  
  /**
   * Save skill tree data to localStorage
   * @param {String} key - Storage key to use
   * @returns {Boolean} Success flag
   */
  saveToLocalStorage: function(key = 'skillTreeData') {
    try {
      localStorage.setItem(key, JSON.stringify(this.data));
      console.log(`Saved skill tree data to localStorage (${key})`);
      return true;
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
      return false;
    }
  },
  
  /**
   * Download skill tree data as a JSON file
   * @param {String} filename - Name for the download file
   */
  downloadAsJson: function(filename = 'skill_tree_data.json') {
    try {
      const jsonString = JSON.stringify(this.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Downloaded skill tree data as '${filename}'`);
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  },
  
  /**
   * Find a node by ID
   * @param {String} nodeId - Node ID to find
   * @returns {Object|null} Found node or null
   */
  findNode: function(nodeId) {
    return this.data.nodes.find(node => node.id === nodeId) || null;
  },
  
  /**
   * Add or update a node
   * @param {Object} nodeData - Node data
   * @returns {Object} The added/updated node
   */
  upsertNode: function(nodeData) {
    if (!nodeData.id) {
      throw new Error("Node data must have an id");
    }
    
    const existingIndex = this.data.nodes.findIndex(node => node.id === nodeData.id);
    
    if (existingIndex !== -1) {
      // Update existing node
      this.data.nodes[existingIndex] = { ...this.data.nodes[existingIndex], ...nodeData };
      console.log(`Updated node: ${nodeData.id}`);
      return this.data.nodes[existingIndex];
    } else {
      // Add new node
      this.data.nodes.push(nodeData);
      console.log(`Added new node: ${nodeData.id}`);
      return nodeData;
    }
  },
  
  /**
   * Delete a node by ID
   * @param {String} nodeId - ID of node to delete
   * @returns {Boolean} Success flag
   */
  deleteNode: function(nodeId) {
    const initialLength = this.data.nodes.length;
    
    // Remove node
    this.data.nodes = this.data.nodes.filter(node => node.id !== nodeId);
    
    // Remove connections to/from this node
    this.data.connections = this.data.connections.filter(
      conn => conn.source !== nodeId && conn.target !== nodeId
    );
    
    // Remove from connections arrays in other nodes
    this.data.nodes.forEach(node => {
      if (node.connections && node.connections.includes(nodeId)) {
        node.connections = node.connections.filter(id => id !== nodeId);
      }
    });
    
    const wasDeleted = initialLength > this.data.nodes.length;
    if (wasDeleted) {
      console.log(`Deleted node: ${nodeId}`);
    } else {
      console.log(`Node not found: ${nodeId}`);
    }
    
    return wasDeleted;
  },
  
  /**
   * Add a connection between nodes
   * @param {String} sourceId - Source node ID
   * @param {String} targetId - Target node ID
   * @returns {Boolean} Success flag
   */
  addConnection: function(sourceId, targetId) {
    // Validate nodes exist
    const sourceNode = this.findNode(sourceId);
    const targetNode = this.findNode(targetId);
    
    if (!sourceNode) {
      console.error(`Source node not found: ${sourceId}`);
      return false;
    }
    
    if (!targetNode) {
      console.error(`Target node not found: ${targetId}`);
      return false;
    }
    
    // Check if connection already exists
    const existingConnection = this.data.connections.some(
      conn => conn.source === sourceId && conn.target === targetId
    );
    
    if (existingConnection) {
      console.log(`Connection already exists: ${sourceId} -> ${targetId}`);
      return false;
    }
    
    // Add connection
    this.data.connections.push({ source: sourceId, target: targetId });
    
    // Also add to node's connections array
    if (!sourceNode.connections) {
      sourceNode.connections = [];
    }
    if (!sourceNode.connections.includes(targetId)) {
      sourceNode.connections.push(targetId);
    }
    
    console.log(`Added connection: ${sourceId} -> ${targetId}`);
    return true;
  },
  
  /**
   * Remove a connection between nodes
   * @param {String} sourceId - Source node ID
   * @param {String} targetId - Target node ID
   * @returns {Boolean} Success flag
   */
  removeConnection: function(sourceId, targetId) {
    // Check if connection exists
    const initialLength = this.data.connections.length;
    
    // Remove from connections array
    this.data.connections = this.data.connections.filter(
      conn => !(conn.source === sourceId && conn.target === targetId)
    );
    
    // Remove from source node's connections array
    const sourceNode = this.findNode(sourceId);
    if (sourceNode && sourceNode.connections) {
      sourceNode.connections = sourceNode.connections.filter(id => id !== targetId);
    }
    
    const wasRemoved = initialLength > this.data.connections.length;
    if (wasRemoved) {
      console.log(`Removed connection: ${sourceId} -> ${targetId}`);
    } else {
      console.log(`Connection not found: ${sourceId} -> ${targetId}`);
    }
    
    return wasRemoved;
  },
  
  /**
   * Add or update a specialization
   * @param {Object} specData - Specialization data
   * @returns {Object} The added/updated specialization
   */
  upsertSpecialization: function(specData) {
    if (!specData.id) {
      throw new Error("Specialization data must have an id");
    }
    
    const existingIndex = this.data.specializations.findIndex(spec => spec.id === specData.id);
    
    if (existingIndex !== -1) {
      // Update existing specialization
      this.data.specializations[existingIndex] = { 
        ...this.data.specializations[existingIndex], 
        ...specData 
      };
      console.log(`Updated specialization: ${specData.id}`);
      return this.data.specializations[existingIndex];
    } else {
      // Add new specialization
      this.data.specializations.push(specData);
      console.log(`Added new specialization: ${specData.id}`);
      return specData;
    }
  },
  
  /**
   * Perform a bulk operation on multiple nodes
   * @param {Function} operation - Function to apply to each node
   * @param {Object} filterCriteria - Criteria to filter nodes
   * @returns {Number} Count of affected nodes
   */
  bulkUpdateNodes: function(operation, filterCriteria = {}) {
    // Filter nodes that match the criteria
    const matchingNodes = this.data.nodes.filter(node => {
      return Object.entries(filterCriteria).every(([key, value]) => {
        if (key === 'tier') {
          return node.tier === value;
        }
        if (key === 'specialization') {
          return node.specialization === value;
        }
        return node[key] === value;
      });
    });
    
    // Apply operation to each matching node
    let count = 0;
    matchingNodes.forEach(node => {
      const updatedNode = operation(node);
      if (updatedNode) {
        this.upsertNode(updatedNode);
        count++;
      }
    });
    
    console.log(`Bulk updated ${count} nodes`);
    return count;
  },
  
  /**
   * Regenerate positions for nodes by specialization
   * @returns {Boolean} Success flag
   */
  regeneratePositions: function() {
    const centerX = 400;
    const centerY = 300;
    
    // Group nodes by tier and specialization
    const nodesByTier = {};
    
    this.data.nodes.forEach(node => {
      const tier = node.tier || 0;
      if (!nodesByTier[tier]) {
        nodesByTier[tier] = { 
          nodes: [],
          bySpecialization: {}
        };
      }
      
      nodesByTier[tier].nodes.push(node);
      
      const spec = node.specialization || 'core';
      if (!nodesByTier[tier].bySpecialization[spec]) {
        nodesByTier[tier].bySpecialization[spec] = [];
      }
      
      nodesByTier[tier].bySpecialization[spec].push(node);
    });
    
    // Position core nodes at center
    if (nodesByTier[0]) {
      const coreNodes = nodesByTier[0].nodes;
      
      if (coreNodes.length === 1) {
        // Single core node at center
        coreNodes[0].position = { x: centerX, y: centerY };
      } else {
        // Multiple core nodes in a cluster
        const coreRadius = 60;
        const angleStep = (2 * Math.PI) / coreNodes.length;
        
        coreNodes.forEach((node, index) => {
          const angle = index * angleStep;
          node.position = {
            x: centerX + Math.cos(angle) * coreRadius,
            y: centerY + Math.sin(angle) * coreRadius
          };
        });
      }
    }
    
    // Position specialization nodes in circular patterns
    const orbitRadius = [150, 250, 350, 450, 550];
    const specializations = this.data.specializations.map(spec => spec.id);
    
    // Position higher tier nodes
    for (let tier = 1; tier <= 5; tier++) {
      if (!nodesByTier[tier]) continue;
      
      // Calculate orbit angle ranges for each specialization
      const specCount = Object.keys(nodesByTier[tier].bySpecialization).length;
      const anglePerSpec = (2 * Math.PI) / specCount;
      
      Object.entries(nodesByTier[tier].bySpecialization).forEach(([spec, nodes], specIndex) => {
        const nodeCount = nodes.length;
        if (nodeCount === 0) return;
        
        // Calculate start angle for this specialization section
        const startAngle = specIndex * anglePerSpec;
        const angleRange = anglePerSpec * 0.8; // Leave some space between specializations
        
        // Position nodes within the specialization section
        const radius = orbitRadius[tier - 1] || 550;
        
        nodes.forEach((node, nodeIndex) => {
          const angleOffset = (nodeIndex / (nodeCount - 1 || 1)) * angleRange;
          const angle = startAngle + angleOffset;
          
          node.position = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          };
        });
      });
    }
    
    console.log("Regenerated node positions");
    return true;
  },
  
  /**
   * Validate the skill tree data using the validator
   * @returns {Object} Validation result with errors and warnings
   */
  validate: function() {
    // Check if validator is available
    if (typeof SkillTreeValidator === 'undefined') {
      console.error("SkillTreeValidator not available");
      return { valid: false, errors: ["Validator not available"], warnings: [] };
    }
    
    // Run validation
    const validation = SkillTreeValidator.validateSkillTree(this.data);
    const warnings = SkillTreeValidator.getWarnings(this.data);
    
    // Log results
    if (validation.valid) {
      console.log("Skill tree data is valid!");
    } else {
      console.error("Skill tree data validation failed:", validation.errors);
    }
    
    if (warnings.length > 0) {
      console.warn("Warnings:", warnings);
    }
    
    return {
      valid: validation.valid,
      errors: validation.errors || [],
      warnings: warnings
    };
  },
  
  /**
   * Fix common issues automatically
   * @returns {Number} Count of issues fixed
   */
  autoFix: function() {
    let fixCount = 0;
    
    // Fix missing connections arrays
    this.data.nodes.forEach(node => {
      if (!node.connections) {
        node.connections = [];
        fixCount++;
      }
    });
    
    // Ensure all nodes have visual properties
    this.data.nodes.forEach(node => {
      if (!node.visual) {
        node.visual = {
          size: node.tier === 0 ? 'core' : 'minor',
          icon: 'help'
        };
        fixCount++;
      } else if (!node.visual.size || !node.visual.icon) {
        node.visual.size = node.visual.size || (node.tier === 0 ? 'core' : 'minor');
        node.visual.icon = node.visual.icon || 'help';
        fixCount++;
      }
    });
    
    // Fix null positions
    this.data.nodes.forEach(node => {
      if (!node.position) {
        node.position = { x: 0, y: 0 };
        fixCount++;
      }
    });
    
    // Recreate missing specializations connection
    const missingConns = this.data.nodes.filter(node => 
      node.connections && node.connections.length > 0
    ).flatMap(node => {
      return node.connections.map(targetId => ({
        source: node.id,
        target: targetId
      }));
    });
    
    // Add missing connections to the connections array
    missingConns.forEach(conn => {
      const exists = this.data.connections.some(
        c => c.source === conn.source && c.target === conn.target
      );
      
      if (!exists) {
        this.data.connections.push(conn);
        fixCount++;
      }
    });
    
    console.log(`Fixed ${fixCount} issues`);
    return fixCount;
  }
};

// Export for use in development
window.SkillTreeDevTool = SkillTreeDevTool;