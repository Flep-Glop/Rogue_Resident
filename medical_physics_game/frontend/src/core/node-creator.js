// node_creator.js - Helper for creating skill tree nodes

/**
 * Loads node templates and provides functions to create nodes easily
 */
const NodeCreator = {
  templates: {},
  
  /**
   * Initialize with templates
   * @param {Object} templates - Node templates
   */
  initialize: function(templates) {
    this.templates = templates || {};
    console.log(`Initialized NodeCreator with ${Object.keys(this.templates).length} templates`);
    return this;
  },
  
  /**
   * Create a node using a template
   * @param {Object} nodeData - Basic node data 
   * @param {String} templateName - Name of template to use
   * @returns {Object} Complete node object
   */
  createFromTemplate: function(nodeData, templateName) {
    // Get template or empty object if not found
    const template = this.templates[templateName] || {};
    
    // Merge template with node data (node data takes precedence)
    const node = {
      // Required properties with defaults
      id: nodeData.id || `node_${Date.now()}`,
      name: nodeData.name || "New Node",
      specialization: nodeData.specialization || null,
      tier: nodeData.tier || 1,
      description: nodeData.description || "Node description",
      position: nodeData.position || { x: 0, y: 0 },
      connections: nodeData.connections || [],
      cost: nodeData.cost || { reputation: 10, skill_points: 1 },
      
      // Properties that might come from template
      effects: nodeData.effects || template.effects || [],
      visual: nodeData.visual || template.visual || { size: "minor", icon: "help" }
    };
    
    return node;
  },
  
  /**
   * Export nodes to JSON format
   * @param {Array} nodes - Array of nodes to export
   * @returns {String} JSON string
   */
  exportToJson: function(nodes) {
    return JSON.stringify(nodes, null, 2);
  },
  
  /**
   * Create a series of connected nodes
   * @param {Array} nodeDataArray - Array of node data objects
   * @param {String} templateName - Template to use for all nodes
   * @param {Boolean} autoConnect - Whether to automatically connect nodes in sequence
   * @returns {Array} Array of complete node objects
   */
  createNodeChain: function(nodeDataArray, templateName, autoConnect = true) {
    const nodes = [];
    
    nodeDataArray.forEach((nodeData, index) => {
      const node = this.createFromTemplate(nodeData, templateName);
      
      // Auto-connect to previous node if not the first node
      if (autoConnect && index > 0) {
        const prevNodeId = nodeDataArray[index - 1].id;
        if (!node.connections.includes(prevNodeId)) {
          node.connections.push(prevNodeId);
        }
      }
      
      nodes.push(node);
    });
    
    return nodes;
  },
  
  /**
   * Create a complete specialization branch
   * @param {String} specializationId - ID of the specialization
   * @param {String} startNodeId - ID of the node to connect to
   * @param {Array} nodeDataArray - Array of node data for the branch
   * @returns {Object} Object containing nodes and connections
   */
  createSpecializationBranch: function(specializationId, startNodeId, nodeDataArray) {
    const nodes = [];
    const connections = [];
    let prevNodeId = startNodeId;
    
    nodeDataArray.forEach((nodeData) => {
      // Ensure the specialization is set
      nodeData.specialization = nodeData.specialization || specializationId;
      
      // Create the node
      const node = this.createFromTemplate(nodeData, nodeData.template || null);
      
      // Create connection from previous node
      connections.push({
        source: prevNodeId,
        target: node.id
      });
      
      prevNodeId = node.id;
      nodes.push(node);
    });
    
    return {
      nodes,
      connections
    };
  }
};

// For use in development console or scripts
window.NodeCreator = NodeCreator;