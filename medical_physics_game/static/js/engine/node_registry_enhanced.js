// node_registry_enhanced.js - Primary registry for node types with dynamic container generation

// Enhanced NodeRegistry
const NodeRegistry = {
    // Node type definitions
    nodeTypes: {},
    
    // Track container creation
    createdContainers: {},
    
    // Track loading status
    isLoaded: false,
    
    // Initialize with node types from JSON
    initialize: function() {
      console.log("Initializing node registry...");
      
      // Load node types configuration
      return this.loadNodeTypes()
        .then(() => {
          console.log(`Loaded ${Object.keys(this.nodeTypes).length} node types`);
          
          // Create containers for all node types
          this.createContainers();
          
          // Mark as loaded
          this.isLoaded = true;
          return this;
        })
        .catch(error => {
          console.error("Error loading node types:", error);
          
          // Fall back to hardcoded node types
          this.fallbackToHardcodedTypes();
          return this;
        });
    },
    
    // Load node types from JSON configuration
    loadNodeTypes: function() {
      return fetch('/static/js/data/node_types.json')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load node types: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Normalize data to expected format
          if (data.types && Array.isArray(data.types)) {
            data.types.forEach(type => {
              this.nodeTypes[type.id] = this.normalizeNodeType(type);
            });
          } else {
            throw new Error("Invalid node types data format");
          }
        });
    },
    
    // Convert node type from JSON format to internal format
    normalizeNodeType: function(type) {
      return {
        displayName: type.displayName || type.id,
        symbol: type.symbol || "?",
        color: type.color || "#999999",
        shadowColor: type.shadowColor || "#666666",
        interactionContainer: type.containerName || `${type.id}-container`,
        weight: type.weight || 0,
        dataFunction: type.dataFunction || null,
        dataKey: type.dataKey || null,
        processDataFunction: this.getProcessFunctionName(type.id)
      };
    },
    
    // Generate the process function name for a node type
    getProcessFunctionName: function(typeId) {
      if (typeId.includes('_')) {
        // Handle types with underscores (e.g., "patient_case" -> "processPatientCaseData")
        return 'process' + typeId.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('') + 'Data';
      } else {
        // Simple types (e.g., "question" -> "processQuestionData")
        return 'process' + typeId.charAt(0).toUpperCase() + typeId.slice(1) + 'Data';
      }
    },
    
    // Fall back to hardcoded node types if JSON loading fails
    fallbackToHardcodedTypes: function() {
      console.log("Using hardcoded node types as fallback");
      
      this.nodeTypes = {
        "question": {
          displayName: "Physics Question",
          symbol: "?",
          color: "#5b8dd9",
          shadowColor: "#4a70b0",
          interactionContainer: "question-container",
          weight: 60,
          dataFunction: "get_question_for_node",
          dataKey: "question",
          processDataFunction: "processQuestionData"
        },
        "elite": {
          displayName: "Challenging Question",
          symbol: "!",
          color: "#d35db3",
          shadowColor: "#a24b8e",
          interactionContainer: "question-container",
          weight: 15,
          dataFunction: "get_question_for_node",
          dataKey: "question",
          processDataFunction: "processEliteData"
        },
        "boss": {
          displayName: "Final Assessment",
          symbol: "B",
          color: "#e67e73",
          shadowColor: "#b66059",
          interactionContainer: "question-container",
          weight: 0,
          dataFunction: "get_question_for_node",
          dataKey: "question",
          processDataFunction: "processBossData"
        },
        "treasure": {
          displayName: "Equipment Found",
          symbol: "T",
          color: "#f0c866",
          shadowColor: "#c9a955",
          interactionContainer: "treasure-container",
          weight: 20,
          dataFunction: "get_random_item",
          dataKey: "item",
          processDataFunction: "processTreasureData"
        },
        "rest": {
          displayName: "Break Room",
          symbol: "R",
          color: "#9c77db",
          shadowColor: "#7c5cb0",
          interactionContainer: "rest-container",
          weight: 15,
          dataFunction: null,
          dataKey: null,
          processDataFunction: "processRestData"
        },
        "event": {
          displayName: "Random Event",
          symbol: "E",
          color: "#e99c50",
          shadowColor: "#b87d40",
          interactionContainer: "event-container",
          weight: 15,
          dataFunction: "get_random_event",
          dataKey: "event",
          processDataFunction: "processEventData"
        },
        "patient_case": {
          displayName: "Patient Case",
          symbol: "P",
          color: "#4acf8b",
          shadowColor: "#3aaf7a",
          interactionContainer: "patient-case-container",
          weight: 25,
          dataFunction: "get_random_patient_case",
          dataKey: "patient_case",
          processDataFunction: "processPatientCaseData"
        },
        "shop": {
          displayName: "Department Store",
          symbol: "$",
          color: "#5bbcd9",
          shadowColor: "#4a99b3",
          interactionContainer: "shop-container",
          weight: 10,
          dataFunction: "get_shop_items",
          dataKey: "shop_items",
          processDataFunction: "processShopData"
        },
        "gamble": {
          displayName: "Research Opportunity",
          symbol: "G",
          color: "#b8d458",
          shadowColor: "#94ab47",
          interactionContainer: "gamble-container",
          weight: 10,
          dataFunction: "get_gamble_options",
          dataKey: "gamble_options",
          processDataFunction: "processGambleData"
        }
      };
    },
    
    // Dynamic container creation
    createContainers: function() {
      console.log("Creating containers for node types...");
      
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
        
        // Skip if already created
        if (this.createdContainers[config.interactionContainer]) return;
        
        // Check if container already exists in DOM
        if (document.getElementById(config.interactionContainer)) {
          this.createdContainers[config.interactionContainer] = true;
          return;
        }
        
        console.log(`Creating container for node type: ${type} (${config.interactionContainer})`);
        
        // Create container
        const container = document.createElement('div');
        container.id = config.interactionContainer;
        container.className = 'interaction-container';
        
        // Add to parent
        parentElement.appendChild(container);
        
        // Mark as created
        this.createdContainers[config.interactionContainer] = true;
      });
    },
    
    // Get properties of a node type
    getNodeType: function(type) {
      if (!this.nodeTypes[type]) {
        console.warn(`Node type "${type}" not registered, using default`);
        // Return a default for error handling
        return {
          displayName: type.charAt(0).toUpperCase() + type.slice(1),
          symbol: "?",
          color: "#999999",
          shadowColor: "#666666",
          interactionContainer: null,
          weight: 0,
          processDataFunction: null
        };
      }
      return this.nodeTypes[type];
    },
    
    // Register a new node type
    registerNodeType: function(type, config) {
      this.nodeTypes[type] = this.normalizeNodeType({
        id: type,
        ...config
      });
      
      // Create container if needed
      if (this.nodeTypes[type].interactionContainer && !this.createdContainers[this.nodeTypes[type].interactionContainer]) {
        this.createContainerForType(type);
      }
      
      return this;
    },
    
    // Create container for a specific node type
    createContainerForType: function(type) {
      const config = this.nodeTypes[type];
      if (!config || !config.interactionContainer) return;
      
      // Skip if already created
      if (this.createdContainers[config.interactionContainer]) return;
      
      // Get the parent element where containers should go
      const parentElement = document.querySelector('.col-md-9');
      if (!parentElement) {
        console.error("Parent element for containers not found");
        return;
      }
      
      // Check if container already exists
      if (document.getElementById(config.interactionContainer)) {
        this.createdContainers[config.interactionContainer] = true;
        return;
      }
      
      console.log(`Creating container for node type: ${type} (${config.interactionContainer})`);
      
      // Create container
      const container = document.createElement('div');
      container.id = config.interactionContainer;
      container.className = 'interaction-container';
      
      // Add to parent
      parentElement.appendChild(container);
      
      // Mark as created
      this.createdContainers[config.interactionContainer] = true;
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
      if (!node) return node;
      
      const nodeType = this.getNodeType(node.type);
      
      // If a process function is defined, call it
      if (nodeType.processDataFunction && 
          typeof this[nodeType.processDataFunction] === 'function') {
        return this[nodeType.processDataFunction](node);
      }
      
      return node;
    }
  };
  
  // Export globally - This replaces the original NodeRegistry and NodeRegistryEnhanced
  window.NodeRegistry = NodeRegistry;