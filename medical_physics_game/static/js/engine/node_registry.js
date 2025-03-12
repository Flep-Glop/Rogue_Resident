// static/js/engine/node_registry.js

const NodeRegistry = {
    // Node type definitions
    nodeTypes: {
      "start": {
        displayName: "Starting Point",
        symbol: "S",
        color: "#56b886",     // Green
        shadowColor: "#45966d",
        interactionContainer: null,  // No interaction for start node
        weight: 0,  // Not randomly generated
        processDataFunction: null  // No special processing needed
      },
      "question": {
        displayName: "Physics Question",
        symbol: "?",
        color: "#5b8dd9",     // Blue
        shadowColor: "#4a70b0",
        interactionContainer: "question-container",
        weight: 60,
        processDataFunction: "processQuestionData"
      },
      "elite": {
        displayName: "Challenging Question",
        symbol: "!",
        color: "#d35db3",     // Pink
        shadowColor: "#a24b8e",
        interactionContainer: "question-container", // Reuses question container
        weight: 15,
        processDataFunction: "processQuestionData"
      },
      "boss": {
        displayName: "Final Assessment",
        symbol: "B",
        color: "#e67e73",     // Red
        shadowColor: "#b66059",
        interactionContainer: "question-container", // Reuses question container
        weight: 0,  // Not randomly generated
        processDataFunction: "processQuestionData"
      },
      "treasure": {
        displayName: "Equipment Found",
        symbol: "T",
        color: "#f0c866",     // Yellow
        shadowColor: "#c9a955",
        interactionContainer: "treasure-container",
        weight: 20,
        processDataFunction: "processTreasureData"
      },
      "rest": {
        displayName: "Break Room",
        symbol: "R",
        color: "#9c77db",     // Purple
        shadowColor: "#7c5cb0",
        interactionContainer: "rest-container",
        weight: 15,
        processDataFunction: "processRestData"
      },
      "event": {
        displayName: "Random Event",
        symbol: "E",
        color: "#e99c50",     // Orange
        shadowColor: "#b87d40",
        interactionContainer: "event-container",
        weight: 15,
        processDataFunction: "processEventData"
      },
      "patient_case": {
        displayName: "Patient Case",
        symbol: "P",
        color: "#4acf8b",     // Bright green
        shadowColor: "#3aaf7a",
        interactionContainer: "patient-case-container",
        weight: 25,
        processDataFunction: "processPatientCaseData"
      },
      "shop": {
        displayName: "Department Store",
        symbol: "$",
        color: "#5bbcd9",     // Cyan
        shadowColor: "#4a99b3",
        interactionContainer: "shop-container",
        weight: 10,
        processDataFunction: "processShopData"
      },
      "gamble": {
        displayName: "Research Opportunity",
        symbol: "G",
        color: "#b8d458",     // Lime
        shadowColor: "#94ab47",
        interactionContainer: "gamble-container",
        weight: 10,
        processDataFunction: "processGambleData"
      }
    },
  
    // Get properties of a node type
    getNodeType: function(type) {
      if (!this.nodeTypes[type]) {
        console.error(`Node type "${type}" not registered`);
        return this.nodeTypes["question"]; // Default fallback
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
      const nodeType = this.getNodeType(node.type);
      
      // If a process function is defined, call it
      if (nodeType.processDataFunction && 
          typeof this[nodeType.processDataFunction] === 'function') {
        return this[nodeType.processDataFunction](node);
      }
      
      return node;
    },
  
    // Processing functions for different node types
    processQuestionData: function(node) {
      // Example implementation
      if (!node.question) {
        console.log("Missing question data, will be fetched from server");
      }
      return node;
    },
  
    processTreasureData: function(node) {
      // Example implementation
      if (!node.item) {
        console.log("Missing item data, will be fetched from server");
      }
      return node;
    },
  
    processEventData: function(node) {
      // Example implementation
      if (!node.event) {
        console.log("Missing event data, will be fetched from server");
      }
      return node;
    },
  
    processPatientCaseData: function(node) {
      // Example implementation
      if (!node.patient_case) {
        console.log("Missing patient case data, will be fetched from server");
      }
      return node;
    },
  
    processRestData: function(node) {
      // No special processing needed
      return node;
    },
  
    processShopData: function(node) {
      // Example implementation
      if (!node.shop_items) {
        console.log("Missing shop items, will be fetched from server");
      }
      return node;
    },
  
    processGambleData: function(node) {
      // Example implementation
      if (!node.gamble_options) {
        console.log("Missing gamble options, will be fetched from server");
      }
      return node;
    },
    // Add to node_registry.js

    // Dynamic container generator
    createNodeContainers: function() {
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
        if (document.getElementById(config.interactionContainer)) return;
        
        // Create container
        const container = document.createElement('div');
        container.id = config.interactionContainer;
        container.className = 'interaction-container';
        
        // Add basic structure
        container.innerHTML = `
            <h3>${config.displayName}</h3>
            <div id="${type}-content"></div>
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
    }
  };
  
  // Export globally
  window.NodeRegistry = NodeRegistry;