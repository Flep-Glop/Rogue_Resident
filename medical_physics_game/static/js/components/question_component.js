// question_component.js - Complete implementation with item support
// Handles question, elite, and boss nodes with comprehensive error handling

const QuestionComponent = ComponentUtils.createComponent('question', {
  // Initialize component
  initialize: function() {
    console.log("Initializing question component");
    
    // Initialize UI state for persistence across renders
    this.setUiState('questionAnswered', false);
    this.setUiState('selectedOptionIndex', null);
    this.setUiState('currentNodeData', null);
    this.setUiState('resultData', null);
    this.setUiState('errorState', false);
    this.setUiState('usedSecondChance', false);
    this.setUiState('inventoryVisible', false);
    
    // Register for state updates
    if (window.GameState && GameState.addObserver) {
      GameState.addObserver((eventType, data) => {
        // Reset component UI state whenever a new node is selected
        if (eventType === 'currentNodeChanged') {
          this.resetComponentState();
        }
      });
    }
    
    // Subscribe to design bridge changes if available
    if (window.DesignBridge && window.DesignBridge.subscribe) {
      window.DesignBridge.subscribe(this.onDesignChanged.bind(this));
    }
  },
  
  // Reset component state for new questions
  resetComponentState: function() {
    this.setUiState('questionAnswered', false);
    this.setUiState('selectedOptionIndex', null);
    this.setUiState('resultData', null);
    this.setUiState('errorState', false);
    this.setUiState('usedSecondChance', false);
    this.setUiState('inventoryVisible', false);
    // Keep currentNodeData for reference until we get new data
  },
  
  // Handle design system changes
  onDesignChanged: function(designBridge) {
    // If we have an active question, update colors dynamically
    const container = document.getElementById('question-container');
    if (container && container.style.display !== 'none') {
      // Refresh UI elements with new design tokens if needed
      this.refreshDesignTokens(container);
    }
  },
  
  // Apply design tokens to the container
  refreshDesignTokens: function(container) {
    if (!window.DesignBridge || !container) return;
    
    // Update primary color elements
    const primaryElements = container.querySelectorAll('.btn-primary, .badge-primary');
    primaryElements.forEach(el => {
      el.style.backgroundColor = DesignBridge.colors?.primary || '#5b8dd9';
    });
    
    // Update success color elements
    const successElements = container.querySelectorAll('.btn-success, .badge-success');
    successElements.forEach(el => {
      el.style.backgroundColor = DesignBridge.colors?.secondary || '#56b886';
    });
    
    // Update danger color elements
    const dangerElements = container.querySelectorAll('.btn-danger, .badge-danger');
    dangerElements.forEach(el => {
      el.style.backgroundColor = DesignBridge.colors?.danger || '#e67e73';
    });
  },
  
  // Render the question UI - main entry point
  render: function(nodeData, container) {
    console.log("Rendering question component", nodeData);
    
    // Always store the latest node data we received
    if (nodeData && nodeData.id) {
      this.setUiState('currentNodeData', nodeData);
    } else {
      // Try to recover from missing node data
      nodeData = this.recoverNodeData() || nodeData;
    }
    
    // Show error state if we've had an unrecoverable error
    if (this.getUiState('errorState')) {
      this.renderErrorState(container, nodeData);
      return;
    }
    
    // Validate node data
    if (!nodeData || !nodeData.id) {
      console.error("Invalid node data provided to question component:", nodeData);
      this.renderErrorState(container, nodeData);
      return;
    }
    
    // Handle missing question data
    if (!nodeData.question) {
      console.warn("Missing question data in node:", nodeData);
      this.handleMissingQuestionData(nodeData, container);
      return;
    }
    
    // Main question rendering for valid data
    this.renderQuestionUI(nodeData, container);
  },
  
  // Try to recover node data if it's missing
  recoverNodeData: function() {
    // First check if we have it in UI state
    const storedNodeData = this.getUiState('currentNodeData');
    if (storedNodeData && storedNodeData.id) {
      console.log("Recovered node data from UI state:", storedNodeData.id);
      return storedNodeData;
    }
    
    // Try to get from GameState
    if (window.GameState && GameState.data && GameState.data.currentNode) {
      const currentNodeId = GameState.data.currentNode;
      const nodeData = GameState.getNodeById(currentNodeId);
      if (nodeData && nodeData.id) {
        console.log("Recovered node data from GameState:", nodeData.id);
        return nodeData;
      }
    }
    
    console.error("Could not recover node data");
    return null;
  },
  
  // Handle missing question data
  handleMissingQuestionData: function(nodeData, container) {
    // Show loading state
    container.innerHTML = `
      <div class="game-panel shadow-md">
        <h3 class="game-panel__title">Loading Question...</h3>
        <div class="text-center p-md">
          <div class="spinner-border mb-sm"></div>
          <p>Retrieving question data...</p>
        </div>
      </div>
    `;
    
    // Try to fetch question data from server
    this.fetchQuestionData(nodeData)
      .then(updatedNodeData => {
        // Success - update UI state
        this.setUiState('currentNodeData', updatedNodeData);
        // Re-render with complete data
        this.render(updatedNodeData, container);
      })
      .catch(error => {
        console.error("Failed to fetch question data:", error);
        // Create fallback question data
        const updatedNodeData = this.createFallbackQuestion(nodeData);
        // Update UI state
        this.setUiState('currentNodeData', updatedNodeData);
        // Try rendering with fallback data
        this.render(updatedNodeData, container);
      });
  },
  
  // Fetch question data from server
  fetchQuestionData: function(nodeData) {
    console.log("Attempting to fetch question data for node:", nodeData.id);
    
    return new Promise((resolve, reject) => {
      // Exit early for invalid node
      if (!nodeData || !nodeData.id) {
        reject(new Error("Invalid node data"));
        return;
      }
      
      // Try to fetch from endpoint
      fetch(`/api/get-question?node_id=${nodeData.id}&type=${nodeData.type || 'question'}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch question data: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.question) {
            throw new Error("API response missing question data");
          }
          
          // Create a copy of the node data with the question
          const updatedNodeData = {...nodeData, question: data.question};
          resolve(updatedNodeData);
        })
        .catch(error => {
          console.error("Error fetching question data:", error);
          reject(error);
        });
        
      // Add timeout for the request
      setTimeout(() => {
        reject(new Error("Request timed out"));
      }, 5000);
    });
  },
  
  // Create fallback question when no question data is available
  createFallbackQuestion: function(nodeData) {
    const isElite = nodeData.type === 'elite';
    const isBoss = nodeData.type === 'boss';
    
    // Different fallback questions based on node type
    let fallbackQuestion;
    
    if (isBoss) {
      fallbackQuestion = {
        text: "According to ALARA principle, what should be minimized in radiation protection?",
        options: [
          "Radiation exposure",
          "Patient comfort",
          "Treatment time",
          "Equipment costs"
        ],
        correct: 0,
        explanation: "The ALARA (As Low As Reasonably Achievable) principle states that radiation exposure should be kept as low as reasonably achievable.",
        difficulty: 3
      };
    } else if (isElite) {
      fallbackQuestion = {
        text: "Which of the following is NOT a type of radiation interaction with matter?",
        options: [
          "Photoelectric effect",
          "Compton scattering",
          "Quantum tunneling",
          "Pair production"
        ],
        correct: 2,
        explanation: "Quantum tunneling is a quantum mechanical phenomenon, not a type of radiation interaction with matter.",
        difficulty: 2
      };
    } else {
      fallbackQuestion = {
        text: "What is the primary goal of medical physics?",
        options: [
          "Ensuring the safe use of radiation in medicine",
          "Maximizing radiation dose to all tissues",
          "Eliminating the need for physicians",
          "Avoiding the use of technology in healthcare"
        ],
        correct: 0,
        explanation: "Medical physics focuses on the safe and effective applications of physics principles in medical settings.",
        difficulty: 1
      };
    }
    
    // Create a copy of the node data with the fallback question
    return {...nodeData, question: fallbackQuestion};
  },
  
  // Render error state
  renderErrorState: function(container, nodeData) {
    // Mark that we've entered error state
    this.setUiState('errorState', true);
    
    // Create error UI
    container.innerHTML = `
      <div class="game-panel shadow-md">
        <div class="alert alert-danger">
          <h4>Error Loading Question</h4>
          <p>Unable to load question data. Please try refreshing the page.</p>
        </div>
        <button id="error-continue-btn" class="btn btn-primary mt-3">Continue</button>
      </div>
    `;
    
    // Bind continue button
    this.bindAction('error-continue-btn', 'click', 'continue', { 
      nodeData: nodeData || this.getUiState('currentNodeData')
    });
  },
  
  // Main question UI rendering
  renderQuestionUI: function(nodeData, container) {
    // Get colors from design bridge
    const questionColor = window.DesignBridge?.colors?.nodeQuestion || '#5b8dd9';
    const primaryColor = window.DesignBridge?.colors?.primary || '#5b8dd9';
    
    // Determine node type styling
    const isElite = nodeData.type === 'elite';
    const isBoss = nodeData.type === 'boss';
    
    // Choose panel style based on node type
    const panelClass = isElite ? 'game-panel--warning' : 
                      isBoss ? 'game-panel--danger' : 'game-panel--primary';
    
    // Create question UI
    container.innerHTML = `
      <div class="game-panel ${panelClass} anim-fade-in">
        <div class="game-panel__title flex justify-between items-center">
          <div>${this.getQuestionTitle(nodeData)}</div>
          <div>${this.getDifficultyBadge(nodeData.question.difficulty)}</div>
        </div>
        
        <div class="p-sm mb-md bg-dark-alt rounded-md">
          <p id="question-text" class="text-light">${nodeData.question?.text || 'No question text available'}</p>
          ${this.getCategoryTag(nodeData.question)}
        </div>
        
        <div class="item-button-container">
          <button id="show-inventory-btn" class="game-btn game-btn--secondary mb-sm">
            <i class="fas fa-backpack mr-xs"></i> Use Item
          </button>
        </div>
        
        <div id="question-inventory-panel" class="inventory-panel mb-md" style="display: none;">
          <div class="inventory-panel__header">
            <h4>Select an item to use</h4>
            <button id="close-inventory-btn" class="close-btn">&times;</button>
          </div>
          <div id="question-inventory-items" class="inventory-panel__items">
            <p class="text-center">Loading items...</p>
          </div>
        </div>
        
        <div id="options-container" class="mb-lg"></div>
        
        <div id="question-result" class="alert mb-md" style="display: none;"></div>
        
        <button id="continue-btn" class="game-btn game-btn--primary w-full anim-pulse-scale" style="display: none;">
          Continue
        </button>
      </div>
    `;
    
    // Add options
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer && nodeData.question?.options) {
      this.renderOptions(optionsContainer, nodeData.question.options, nodeData);
    }
    
    // Bind inventory toggle buttons
    this.bindAction('show-inventory-btn', 'click', 'toggleInventory');
    this.bindAction('close-inventory-btn', 'click', 'toggleInventory');
    
    // If question was already answered in this session, show the result
    if (this.getUiState('questionAnswered') && 
        this.getUiState('selectedOptionIndex') !== null && 
        this.getUiState('resultData')) {
      
      this.showQuestionResult(
        this.getUiState('resultData'),
        this.getUiState('selectedOptionIndex'),
        nodeData.question
      );
      
      // Disable all options
      this.disableOptions(optionsContainer);
      
      // Show continue button
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'block';
        this.bindAction('continue-btn', 'click', 'continue', { nodeData });
      }
    }
    
    // If inventory was visible, show it
    if (this.getUiState('inventoryVisible')) {
      const inventoryPanel = document.getElementById('question-inventory-panel');
      if (inventoryPanel) {
        inventoryPanel.style.display = 'block';
        this.renderInventoryItems();
      }
    }
    
    // Apply design tokens if available
    if (window.DesignBridge) {
      this.refreshDesignTokens(container);
    }
  },
  
  toggleInventory: function() {
    console.log("toggleInventory called");
    const panel = document.getElementById('question-inventory-panel');
    console.log("Panel found:", !!panel);
    
    if (!panel) return;
    
    const isVisible = panel.style.display !== 'none';
    console.log("Is currently visible:", isVisible);
    
    // IMPORTANT: This is a possible bug - for elements with inline style="display: none",
    // the first toggle might not work because of how browsers handle defaulting styles
    if (panel.style.display === '') {
      panel.style.display = 'none'; // Ensure we start with a defined state
    }
    
    // Force the display opposite of current
    panel.style.display = isVisible ? 'none' : 'block';
    console.log("Setting display to:", panel.style.display);
    
    // Update UI state
    this.setUiState('inventoryVisible', !isVisible);
    
    // If showing the panel, load items
    if (!isVisible) {
      console.log("Panel becoming visible, rendering items");
      this.renderInventoryItems();
    }
  },
  
  renderInventoryItems: function() {
    console.log("renderInventoryItems called");
    const container = document.getElementById('question-inventory-items');
    console.log("Items container found:", !!container);
    
    if (!container) return;
    
    // Get inventory from game state
    const inventory = window.GameState?.data?.inventory || [];
    console.log("Inventory items:", inventory);
    
    // Clear container and show message if no items
    if (!inventory || inventory.length === 0) {
      console.log("No items in inventory");
      container.innerHTML = '<p class="text-center text-muted">No items in inventory</p>';
      return;
    }
    
    // Generate HTML for items
    let html = '<div class="inventory-grid">';
    
    inventory.forEach(item => {
      const rarity = item.rarity || 'common';
      console.log("Rendering item:", item.id, item.name);
      
      // Simpler item HTML to reduce potential issues
      html += `
        <div class="inventory-item inventory-item--${rarity}" data-item-id="${item.id}">
          <div class="inventory-item__inner">
            ${this.getItemIcon(item)}
          </div>
          <div class="item-tooltip">
            <div class="item-tooltip__header">
              <span>${item.name}</span>
            </div>
            <div class="item-tooltip__body">
              <p>${item.description}</p>
              <button class="use-item-btn" data-item-id="${item.id}">Use Item</button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Use a more straightforward event binding approach
    const useButtons = container.querySelectorAll('.use-item-btn');
    console.log("Found use buttons:", useButtons.length);
    
    useButtons.forEach(button => {
      const itemId = button.getAttribute('data-item-id');
      console.log("Setting up click handler for item:", itemId);
      
      // Use a cleaner approach to binding that preserves 'this' context
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log("Item button clicked:", itemId);
        
        // Find the item in inventory
        const item = inventory.find(i => i.id === itemId);
        if (item) {
          this.useItem({ item: item });
        } else {
          console.error("Item not found in inventory:", itemId);
        }
      };
    });
  },
  
  // Get icon for an item
  getItemIcon: function(item) {
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" class="inventory-item__icon pixelated">`;
    }
    
    // Use design bridge for colors if available
    const iconColor = window.DesignBridge?.colors?.primary || "#5b8dd9";
    
    // Map common item types to icons
    const itemName = (item.name || '').toLowerCase();
    let iconClass = "box";
    
    if (itemName.includes('book') || itemName.includes('manual')) {
      iconClass = "book";
    } else if (itemName.includes('potion') || itemName.includes('vial')) {
      iconClass = "flask";
    } else if (itemName.includes('shield') || itemName.includes('armor')) {
      iconClass = "shield-alt";
    } else if (itemName.includes('dosimeter') || itemName.includes('detector') || itemName.includes('badge')) {
      iconClass = "id-badge";
    }
    
    return `<i class="fas fa-${iconClass}" style="color: ${iconColor};" class="inventory-item__icon"></i>`;
  },
  
  // Complete implementation of useItem function
  useItem: function(data) {
    console.log("useItem called with data:", data);
    
    if (!data || !data.item) {
      console.error("Missing item data in useItem");
      this.showToast("Error: Item data is missing", "danger");
      return;
    }
    
    const item = data.item;
    console.log(`Using item: ${item.id} - ${item.name}`);
    
    // First, check if inventory exists in GameState
    if (!window.GameState || !window.GameState.data || !Array.isArray(window.GameState.data.inventory)) {
      console.error("GameState or inventory is not properly initialized");
      this.showToast("Game system not fully loaded", "danger");
      return;
    }
    
    // Find the item in inventory
    const inventory = window.GameState.data.inventory;
    const itemIndex = inventory.findIndex(i => i.id === item.id);
    
    if (itemIndex === -1) {
      console.error(`Item ${item.id} not found in inventory`);
      this.showToast("Item not found in inventory", "warning");
      return;
    }
    
    // Create a simple ItemManager if it doesn't exist
    if (!window.ItemManager) {
      console.log("Creating minimal ItemManager");
      window.ItemManager = {
        useItem: function(itemId) {
          return true; // Always succeed for now
        },
        removeItemFromInventory: function(itemId) {
          const inventory = window.GameState.data.inventory;
          const itemIndex = inventory.findIndex(i => i.id === itemId);
          if (itemIndex !== -1) {
            inventory.splice(itemIndex, 1);
            console.log(`Removed item ${itemId} from inventory`);
            
            // Trigger event for inventory update if EventSystem exists
            if (window.EventSystem && typeof EventSystem.emit === 'function') {
              EventSystem.emit('INVENTORY_UPDATED', inventory);
            }
            return true;
          }
          return false;
        }
      };
    }
    
    // Try to use the item via ItemManager
    const success = window.ItemManager.useItem(item.id);
    
    if (success) {
      // Hide inventory panel
      this.toggleInventory();
      
      // Show feedback
      this.showToast(`Used ${item.name}!`, "success");
      
      // Apply item effect to question
      this.applyItemEffectToQuestion(item);
      
      // Remove item from inventory
      window.ItemManager.removeItemFromInventory(item.id);
      
      // Save game state if API client is available
      if (window.ApiClient && typeof ApiClient.saveInventory === 'function') {
        ApiClient.saveInventory({ inventory: window.GameState.data.inventory })
          .catch(err => console.error("Failed to save inventory:", err));
      }
      
    } else {
      this.showToast("Failed to use item", "danger");
    }
    
    // Re-render inventory to reflect changes
    setTimeout(() => this.renderInventoryItems(), 100);
  },
  
  applyItemEffectToQuestion: function(item) {
    // Handle different effect types
    switch(item.effect.type) {
      case "eliminateOption":
        this.eliminateIncorrectOption(item);
        break;
        
      case "heal":
        // Healing is handled by ItemManager directly
        this.showFloatingText(`+${item.effect.value} Life`, "success");
        break;
        
      default:
        console.log(`Unhandled effect type: ${item.effect.type}`);
    }
  },
  
  // Eliminate an incorrect option with an item
  eliminateIncorrectOption: function(item) {
    if (!this.getUiState('currentNodeData') || 
        !this.getUiState('currentNodeData').question || 
        typeof this.getUiState('currentNodeData').question.correct !== 'number') {
      this.showToast("Can't determine correct answer", "warning");
      return;
    }
    
    const question = this.getUiState('currentNodeData').question;
    const correctIndex = question.correct;
    
    // Get all option buttons
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;
    
    const options = optionsContainer.querySelectorAll('.game-option:not(.disabled):not(.eliminated-option)');
    
    // Find incorrect options
    const incorrectOptions = Array.from(options).filter((option, index) => {
      const optionIndex = parseInt(option.dataset.index);
      return optionIndex !== correctIndex;
    });
    
    // If we have incorrect options, choose one randomly to eliminate
    if (incorrectOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
      const optionToEliminate = incorrectOptions[randomIndex];
      
      // Mark as eliminated
      optionToEliminate.classList.add('eliminated-option');
      optionToEliminate.style.opacity = '0.5';
      optionToEliminate.innerHTML = `<s>${optionToEliminate.textContent}</s> <span class="badge badge-danger float-right">Eliminated</span>`;
      optionToEliminate.disabled = true;
      
      // Show feedback
      this.showFloatingText("Incorrect option eliminated!", "success");
    } else {
      this.showToast("No incorrect options available to eliminate", "warning");
    }
  },
  
  // Render question options
  renderOptions: function(container, options, nodeData) {
    if (!container || !options || !options.length) return;
    
    // Check if we should eliminate an option
    let eliminatedIndex = null;
    if (GameState.data?.questionEffects?.eliminateOption && 
        nodeData.question && 
        typeof nodeData.question.correct === 'number') {
      
      // Find a wrong option to eliminate
      const wrongOptions = [];
      options.forEach((option, index) => {
        if (index !== nodeData.question.correct) {
          wrongOptions.push(index);
        }
      });
      
      // Randomly select one wrong option to eliminate
      if (wrongOptions.length > 0) {
        const randomIndex = Math.floor(Math.random() * wrongOptions.length);
        eliminatedIndex = wrongOptions[randomIndex];
        
        // Reset the effect after using it
        GameState.data.questionEffects.eliminateOption = false;
        
        // Show feedback
        this.showToast("One incorrect option has been eliminated!", "primary");
      }
    }
    
    // Check for second chance from relics
    const hasSecondChance = GameState.data?.hasSecondChance || false;
    
    // Create option buttons
    options.forEach((option, index) => {
      const isEliminated = index === eliminatedIndex;
      
      const optionEl = document.createElement('button');
      optionEl.className = `game-option w-full mb-sm ${isEliminated ? 'eliminated-option' : ''}`;
      optionEl.dataset.index = index;
      
      // Add strike-through for eliminated options
      if (isEliminated) {
        optionEl.innerHTML = `<s>${option}</s> <span class="badge badge-danger float-right">Eliminated</span>`;
        optionEl.disabled = true;
      } else {
        optionEl.textContent = option;
        
        // Add second chance badge if applicable
        if (hasSecondChance && !this.getUiState('questionAnswered')) {
          const badgeSpan = document.createElement('span');
          badgeSpan.className = 'badge badge-secondary float-right second-chance-badge';
          badgeSpan.textContent = '2nd Chance Available';
          optionEl.appendChild(badgeSpan);
        }
        
        // Bind click handler
        this.bindAction(optionEl, 'click', 'answer', { 
          index: index,
          nodeData: nodeData
        });
      }
      
      container.appendChild(optionEl);
    });
  },
  
  // Disable all option buttons
  disableOptions: function(container) {
    if (!container) return;
    
    const buttons = container.querySelectorAll('.game-option');
    buttons.forEach(button => {
      button.disabled = true;
      button.classList.add('disabled');
    });
  },
  
  // Get appropriate title based on node type
  getQuestionTitle: function(nodeData) {
    if (!nodeData) return 'Question';
    
    if (nodeData.type === 'elite') {
      return 'Challenging Question';
    } else if (nodeData.type === 'boss') {
      return 'Final Assessment';
    } else {
      return nodeData.title || 'Physics Question';
    }
  },
  
  // Get difficulty badge
  getDifficultyBadge: function(difficulty) {
    if (!difficulty) return '';
    
    const difficultyText = difficulty === 1 ? 'Easy' : 
                          difficulty === 2 ? 'Medium' : 'Hard';
    
    const badgeClass = difficulty === 1 ? 'badge-secondary' : 
                      difficulty === 2 ? 'badge-warning' : 'badge-danger';
    
    return `<span class="badge ${badgeClass}">Difficulty: ${difficultyText}</span>`;
  },
  
  // Get category tag if available
  getCategoryTag: function(question) {
    if (!question || !question.category_name) return '';
    
    return `
      <div class="mt-xs">
        <span class="badge badge-primary">${question.category_name}</span>
      </div>
    `;
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Question component handling action: ${action}`, data);
    
    // Special case for toggleInventory which doesn't need node data
    if (action === 'toggleInventory') {
      this.toggleInventory();
      return;
    }
    
    // Find the best node data available for other actions
    const bestNodeData = data?.nodeData || nodeData || this.getUiState('currentNodeData');
    
    if (!bestNodeData || !bestNodeData.id) {
      console.error("Missing node data in handleAction", {action, data});
      this.showToast("An error occurred. Please try again.", "danger");
      return;
    }
    
    // Always update our stored node data with the best available data
    this.setUiState('currentNodeData', bestNodeData);
    
    // Switch on action type
    switch (action) {
      case 'answer':
        // Ensure we have both node data and an answer index
        if (typeof data.index !== 'number') {
          console.error("Missing answer index:", data);
          return;
        }
        this.answerQuestion(bestNodeData, data.index);
        break;
        
      case 'continue':
        this.completeNode(bestNodeData);
        break;
        
      case 'useItem':
        this.useItem(data);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  },
  
  // Answer a question with comprehensive error handling and second chance support
  answerQuestion: function(nodeData, answerIndex) {
    // Validate inputs extensively
    if (!nodeData || !nodeData.id) {
      console.error("Invalid node data in answerQuestion:", nodeData);
      this.showToast("Error processing question. Please refresh the page.", "danger");
      return;
    }
    
    // Check for question data
    if (!nodeData.question) {
      console.error("Missing question data in node:", nodeData);
      
      // Try to create fallback question
      nodeData = this.createFallbackQuestion(nodeData);
      if (!nodeData.question) {
        this.showToast("Error: Question data is missing. Please refresh the page.", "danger");
        return;
      }
    }
    
    // Check if this is a second attempt
    const isSecondAttempt = this.getUiState('usedSecondChance');
    const hasSecondChance = GameState.data?.hasSecondChance && !isSecondAttempt;
    
    console.log(`Answering question for node ${nodeData.id}, selected option ${answerIndex}`);
    console.log("Question data:", nodeData.question);
    
    // Save selected option in UI state
    this.setUiState('selectedOptionIndex', answerIndex);
    
    // Disable all options to prevent multiple submissions
    const optionsContainer = document.getElementById('options-container');
    this.disableOptions(optionsContainer);
    
    // Apply visual feedback immediately
    const selectedOption = optionsContainer.querySelector(`.game-option[data-index="${answerIndex}"]`);
    if (selectedOption) {
      selectedOption.classList.add('anim-pulse-opacity');
    }
    
    // Call API to check answer
    ApiClient.answerQuestion(nodeData.id, answerIndex, nodeData.question)
      .then(data => {
        // Check if answer is correct
        const isCorrect = data.correct === true;
        
        // If incorrect AND has second chance AND not used yet
        if (!isCorrect && hasSecondChance && !isSecondAttempt) {
          this.showSecondChancePrompt(nodeData, answerIndex);
          return;
        }
        
        // Continue with normal result handling
        this.handleAnswerResult(data, answerIndex, nodeData);
      })
      .catch(error => {
        if (window.ErrorHandler) {
          ErrorHandler.handleError(
            error,
            "Question Answering", 
            ErrorHandler.SEVERITY.WARNING
          );
        } else {
          console.error("Error answering question:", error);
        }
        
        console.log("Using fallback for question answer handling due to API error");
        
        // FALLBACK: Use local validation instead of API
        if (nodeData.question && typeof nodeData.question.correct === 'number') {
          // Create a mock response based on the correct answer in question data
          const isCorrect = answerIndex === nodeData.question.correct;
          
          // If incorrect AND has second chance AND not used yet
          if (!isCorrect && hasSecondChance && !isSecondAttempt) {
            this.showSecondChancePrompt(nodeData, answerIndex);
            return;
          }
          
          const fallbackData = {
            correct: isCorrect,
            explanation: nodeData.question.explanation || 
                        (isCorrect ? "Correct!" : "Incorrect answer."),
            insight_gained: isCorrect ? 10 : 0
          };
          
          // Log fallback
          console.log("Using fallback response:", fallbackData);
          
          // Continue with result handling
          this.handleAnswerResult(fallbackData, answerIndex, nodeData);
        } else {
          console.error("Fallback failed - question data incomplete:", nodeData.question);
          
          // Re-enable options if we can't use the fallback
          const options = document.querySelectorAll('.game-option');
          options.forEach(opt => {
            opt.disabled = false;
            opt.classList.remove('disabled');
          });
          
          // Show error toast
          this.showToast("There was a problem processing your answer. Please try again.", "danger");
        }
      });
  },
  
  // Show second chance prompt
  showSecondChancePrompt: function(nodeData, wrongAnswerIndex) {
    const resultDiv = document.getElementById('question-result');
    if (!resultDiv) return;
    
    resultDiv.className = 'alert alert-warning mt-sm anim-fade-in';
    resultDiv.innerHTML = `
      <div class="flex items-center mb-sm">
        <span class="text-lg mr-sm">⚠️</span>
        <strong>Incorrect Answer</strong>
      </div>
      <p>Thanks to your Schrödinger's Spectacles, you can try this question again!</p>
      <div class="mt-sm">
        <button id="use-second-chance" class="game-btn game-btn--secondary mr-md">Try Again</button>
        <button id="skip-second-chance" class="game-btn game-btn--danger">Accept Wrong Answer</button>
      </div>
    `;
    resultDiv.style.display = 'block';
    
    // Bind buttons
    document.getElementById('use-second-chance').addEventListener('click', () => {
      this.useSecondChance(nodeData, wrongAnswerIndex);
    });
    
    document.getElementById('skip-second-chance').addEventListener('click', () => {
      // Create mock data for wrong answer
      const mockData = {
        correct: false,
        explanation: nodeData.question.explanation || "Incorrect answer.",
        insight_gained: 0
      };
      
      // Handle as normal wrong answer
      this.handleAnswerResult(mockData, wrongAnswerIndex, nodeData);
    });
  },
  
  // Use second chance to try again
  useSecondChance: function(nodeData, wrongAnswerIndex) {
    // Mark second chance as used
    this.setUiState('usedSecondChance', true);
    
    // Hide result
    const resultDiv = document.getElementById('question-result');
    if (resultDiv) {
      resultDiv.style.display = 'none';
    }
    
    // Re-enable options except the wrong one
    const optionsContainer = document.getElementById('options-container');
    const options = optionsContainer.querySelectorAll('.game-option');
    
    options.forEach((option, index) => {
      // Don't re-enable the wrong answer
      if (index !== wrongAnswerIndex) {
        option.disabled = false;
        option.classList.remove('disabled');
      } else {
        // Mark the wrong option
        option.classList.add('game-option--danger');
        option.disabled = true;
        
        // Add wrong icon
        if (!option.querySelector('.option-icon')) {
          const icon = document.createElement('span');
          icon.className = 'option-icon float-right';
          icon.textContent = '✗';
          option.appendChild(icon);
        }
      }
    });
    
    // Remove second chance badges
    const badges = optionsContainer.querySelectorAll('.second-chance-badge');
    badges.forEach(badge => badge.remove());
    
    // Show toast
    this.showToast("Second chance used! Choose another answer.", "warning");
  },
  
  // Handle answer result (after second chance if applicable)
  handleAnswerResult: function(data, answerIndex, nodeData) {
    // Save result data in UI state
    this.setUiState('questionAnswered', true);
    this.setUiState('resultData', data);
    
    // Show result
    this.showQuestionResult(data, answerIndex, nodeData.question);
    
    // Check for game over
    if (data.game_state && data.game_state.character && 
        data.game_state.character.lives <= 0) {
      // Set timeout to show the result before game over
      setTimeout(() => {
        if (typeof NodeInteraction !== 'undefined' && NodeInteraction.showGameOver) {
          NodeInteraction.showGameOver();
        }
      }, 2000);
    } else {
      // Set up continue button
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'block';
        this.bindAction('continue-btn', 'click', 'continue', { nodeData });
      }
    }
    
    // Update character stats based on result if we don't have game_state in response
    if (!data.game_state) {
      if (data.correct) {
        // Apply insight boost if available
        let insightGained = data.insight_gained || 10;
        if (GameState?.data?.insightBoost) {
          const boost = Math.floor(insightGained * (GameState.data.insightBoost / 100));
          insightGained += boost;
        }
        
        // Award insight
        this.updatePlayerInsight(insightGained);
      } else {
        // Lose a life
        this.updatePlayerLives(-1);
        
        // Check for game over
        if (this.getPlayerLives() <= 0) {
          setTimeout(() => {
            if (typeof NodeInteraction !== 'undefined' && NodeInteraction.showGameOver) {
              NodeInteraction.showGameOver();
            }
          }, 2000);
        }
      }
    }
  },
  
  // Show question result
  showQuestionResult: function(data, selectedIndex, question) {
    const resultDiv = document.getElementById('question-result');
    
    if (!resultDiv) return;
    
    // Default to correct answer if available
    const correctIndex = question?.correct !== undefined ? question.correct : 
                         data?.correct_index !== undefined ? data.correct_index : 0;
    
    // Determine if the answer was correct
    const isCorrect = data?.correct === true || (selectedIndex === correctIndex);
    
    // Apply insight boost if applicable
    let insightGained = data?.insight_gained || 10;
    let boostMessage = "";
    if (isCorrect && GameState?.data?.insightBoost) {
      const baseInsight = insightGained;
      const boost = Math.floor(baseInsight * (GameState.data.insightBoost / 100));
      if (boost > 0) {
        insightGained += boost;
        boostMessage = ` <span class="text-secondary">(+${boost} from Notebook)</span>`;
      }
    }
    
    // Create result message
    resultDiv.className = `alert ${isCorrect ? 'alert-success' : 'alert-danger'} mt-sm anim-fade-in`;
    resultDiv.innerHTML = `
      <div class="flex items-center mb-sm">
        <span class="text-lg mr-sm">${isCorrect ? '✓' : '✗'}</span>
        <strong>${isCorrect ? 'Correct!' : 'Incorrect!'}</strong>
      </div>
      <p>${data?.explanation || question?.explanation || 'No explanation available.'}</p>
      <div class="mt-sm">
        ${isCorrect 
          ? `<span class="badge badge-success">+${insightGained} Insight${boostMessage}</span>` 
          : `<span class="badge badge-danger">-1 Life</span>`}
      </div>
    `;
    
    // Highlight the correct and selected options
    this.highlightOptions(correctIndex, selectedIndex);
    
    // Show floating feedback
    if (isCorrect) {
      this.showFeedback(`+${insightGained} Insight`, 'success');
    } else {
      this.showFeedback('-1 Life', 'danger');
    }
    
    // Show result
    resultDiv.style.display = 'block';
  },
  
  // Highlight correct and selected options
  highlightOptions: function(correctIndex, selectedIndex) {
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;
    
    const options = optionsContainer.querySelectorAll('.game-option');
    
    options.forEach((option, index) => {
      // Clear existing classes
      option.classList.remove('game-option--success', 'game-option--danger');
      
      if (index === correctIndex) {
        // Correct answer
        option.classList.add('game-option--success');
        
        // Add success icon
        if (!option.querySelector('.option-icon')) {
          const icon = document.createElement('span');
          icon.className = 'option-icon float-right';
          icon.textContent = '✓';
          option.appendChild(icon);
        }
      }
      else if (index === selectedIndex && index !== correctIndex) {
        // Wrong answer
        option.classList.add('game-option--danger');
        
        // Add error icon
        if (!option.querySelector('.option-icon')) {
          const icon = document.createElement('span');
          icon.className = 'option-icon float-right';
          icon.textContent = '✗';
          option.appendChild(icon);
        }
      }
    });
  }
});

// Register the component for all question-type nodes
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('question', QuestionComponent);
  // Elite and boss nodes use the same component
  NodeComponents.register('elite', QuestionComponent);  
  NodeComponents.register('boss', QuestionComponent);   
}