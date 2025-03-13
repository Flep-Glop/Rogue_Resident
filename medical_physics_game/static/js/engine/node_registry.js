// static/js/engine/node_registry.js - Consolidated node registry

// NodeRegistry - Single source of truth for node types
const NodeRegistry = {
  // Node type definitions
  nodeTypes: {},
  
  // Track container creation
  createdContainers: {},
  
  // Track loading status
  isLoaded: false,
  
  // Initialize and return this object for chaining
  initialize: function() {
    console.log("Initializing node registry...");
    
    // Set up hardcoded node types (fallback)
    this.setupHardcodedNodeTypes();
    
    // Create containers for all node types
    this.createContainers();
    
    // Mark as loaded
    this.isLoaded = true;
    
    return this;
  },
  
  // Set up hardcoded node types as a reliable fallback
  setupHardcodedNodeTypes: function() {
    console.log("Setting up hardcoded node types");
    
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
    
    // Create container if needed
    if (this.nodeTypes[type].interactionContainer) {
      this.createContainerForType(type);
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
  
  // Dynamic container creation for all node types
  createContainers: function() {
    console.log("Creating containers for all node types...");
    
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
      
      this.createContainerForType(type);
    });
  },
  
  // Create a container for a specific node type
  createContainerForType: function(type) {
    const config = this.getNodeType(type);
    const containerId = config.interactionContainer;
    
    // Skip if no container ID specified
    if (!containerId) return;
    
    // Skip if already created
    if (this.createdContainers[containerId]) return;
    
    // Check if container already exists
    if (document.getElementById(containerId)) {
      this.createdContainers[containerId] = true;
      return;
    }
    
    // Get the parent element where containers should go
    const parentElement = document.querySelector('.col-md-9');
    if (!parentElement) {
      console.error("Parent element for containers not found");
      return;
    }
    
    console.log(`Creating container for node type: ${type} (${containerId})`);
    
    // Create container
    const container = document.createElement('div');
    container.id = containerId;
    container.className = 'interaction-container';
    
    // Add basic structure based on node type
    switch (type) {
      case 'question':
      case 'elite':
      case 'boss':
        container.innerHTML = `
          <h3 id="question-title">${config.displayName}</h3>
          <p id="question-text"></p>
          <div id="options-container"></div>
          <div id="question-result" style="display: none;"></div>
          <button id="continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
        `;
        break;
        
      case 'treasure':
        container.innerHTML = `
          <h3>Treasure Found!</h3>
          <div id="treasure-content"></div>
          <button id="treasure-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        break;
        
      case 'rest':
        container.innerHTML = `
          <h3>Rest Area</h3>
          <p>Take a moment to rest and recuperate.</p>
          <div id="rest-options">
            <button id="rest-heal-btn" class="btn btn-success mb-2">Heal (+1 Life)</button>
            <button id="rest-study-btn" class="btn btn-primary mb-2">Study (+5 Insight)</button>
          </div>
          <button id="rest-continue-btn" class="btn btn-secondary mt-3">Continue</button>
        `;
        break;
        
      case 'event':
        container.innerHTML = `
          <h3 id="event-title">Event</h3>
          <div class="event-image-container mb-3">
            <div class="event-icon">📝</div>
          </div>
          <p id="event-description" class="event-description"></p>
          <div id="event-options" class="event-options-container"></div>
          <div id="event-result" class="alert mt-3" style="display: none;"></div>
          <button id="event-continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
        `;
        break;
        
      case 'patient_case':
        container.innerHTML = `
          <div class="patient-case-header">
            <h3 id="patient-case-title">Patient Case</h3>
            <div class="case-progress-bar">
              <div class="progress-fill" id="case-progress-fill"></div>
            </div>
          </div>
          <p id="case-description" class="case-description"></p>
          <div id="stage-container"></div>
          <button id="patient-case-continue-btn" class="btn btn-primary mt-3" style="display: none;">Continue</button>
        `;
        break;
        
      case 'shop':
        container.innerHTML = `
          <h3>Department Store</h3>
          <div id="shop-content"></div>
          <button id="shop-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        break;
        
      case 'gamble':
        container.innerHTML = `
          <h3>Research Roulette</h3>
          <div id="gamble-content"></div>
          <button id="gamble-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
        break;
        
      default:
        container.innerHTML = `
          <h3>${config.displayName}</h3>
          <div id="${type}-content"></div>
          <button id="${type}-continue-btn" class="btn btn-primary mt-3">Continue</button>
        `;
    }
    
    // Add to parent
    parentElement.appendChild(container);
    
    // Add continue button event listener (for basic functionality)
    const continueBtn = container.querySelector(`#${type}-continue-btn, #continue-btn`);
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        if (GameState.data.currentNode) {
          GameState.completeNode(GameState.data.currentNode);
        }
      });
    }
    
    // Mark as created
    this.createdContainers[containerId] = true;
  }
};

// Export globally
window.NodeRegistry = NodeRegistry;