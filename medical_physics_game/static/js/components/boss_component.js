// fixed_boss_component.js - Specifically for ion chamber boss

const FixedBossComponent = ComponentUtils.createComponent('boss', {
  // Initialize component and set up initial state
  initialize: function() {
    console.log("Initializing ion chamber boss component");
    
    // Initialize phase-specific UI state
    this.setUiState('currentPhase', 0);
    this.setUiState('phaseComplete', false);
    this.setUiState('selectedOption', null);
    this.setUiState('timeRemaining', 90);
    this.setUiState('playerScore', 0);
    this.setUiState('phaseResults', []);
    this.setUiState('bossAnimation', null);
    this.setUiState('bossState', 'idle');
    
    // Set up timer for exam pressure
    this._examTimer = null;
    
    // Register for events
    EventSystem.on('itemUsed', this.onItemUsed.bind(this));
  },
  
  // Clean up when component is destroyed
  destroy: function() {
    // Clear timer if active
    if (this._examTimer) {
      clearInterval(this._examTimer);
      this._examTimer = null;
    }
    
    // Stop and remove boss animation if active
    const animId = this.getUiState('bossAnimation');
    if (animId && typeof SpriteSystem !== 'undefined') {
      SpriteSystem.removeAnimation(animId);
    }
    
    // Unsubscribe from events
    EventSystem.off('itemUsed', this.onItemUsed);
  },
  
  // Handle item usage during exam
  onItemUsed: function(item) {
    if (!item || !this.getUiState('currentPhase') >= 0) return;
    
    let effectText = "You used an item";
    
    // Apply item effects
    if (item.effect) {
      switch (item.effect.type) {
        case 'insight_boost':
          // Add score in exam
          this.setUiState('playerScore', this.getUiState('playerScore') + 10);
          effectText = `The ${item.name} increases your knowledge. +10 Score!`;
          break;
          
        case 'restore_life':
        case 'heal':
          // Add time to exam
          const addedTime = 15;
          this.setUiState('timeRemaining', this.getUiState('timeRemaining') + addedTime);
          effectText = `The ${item.name} grants you extra time. +15 seconds!`;
          break;
          
        default:
          effectText = `The ${item.name} has an unknown effect.`;
          break;
      }
    }
    
    this.showFeedback(effectText, 'primary');
    
    // Change boss animation to 'ability' temporarily
    this.playBossAnimation('ability');
  },

  // Main render function
  render: function(nodeData, container) {
    console.log("Rendering ion chamber boss component", nodeData);
    
    // Ensure we have a boss container
    if (!document.getElementById('boss-container')) {
      container.id = 'boss-container';
      container.className = 'interaction-container boss-exam';
    }
    
    // Initialize or get the current exam phase
    const currentPhase = this.getUiState('currentPhase');
    const phaseComplete = this.getUiState('phaseComplete');
    
    // Get boss data
    const bossData = this.getBossData(nodeData);
    
    // Use ionChamber boss class for styling
    const bossClass = 'ion-chamber-boss';
    
    // Create a wrapper to hold both the boss content and inventory sidebar
    container.innerHTML = `
      <div class="boss-with-inventory">
        <!-- Main boss exam panel -->
        <div class="game-panel boss-exam-panel ${bossClass} anim-fade-in">
          <div id="exam-header" class="exam-header">
            <div class="exam-title-container">
              <h3 class="exam-title">${bossData.title || 'Radiation Metrology Examination'}</h3>
            </div>
            
            <div class="exam-status">
              <div class="time-container">
                <span class="time-icon">⏱️</span>
                <span class="time-remaining">${this.formatTime(this.getUiState('timeRemaining'))}</span>
              </div>
              
              <div class="score-container">
                <span class="score-text">Score: ${this.getUiState('playerScore')}</span>
              </div>
            </div>
          </div>
          
          <!-- Boss character container -->
          <div id="boss-character-container" class="boss-character-container">
            <div id="boss-sprite" class="boss-sprite"></div>
          </div>
          
          <div id="boss-dialogue" class="boss-dialogue">
            <p>${this.getBossDialogue(bossData, currentPhase, phaseComplete)}</p>
          </div>
          
          <div id="exam-phase-container" class="exam-phase-container"></div>
          
          <div id="exam-actions" class="exam-actions">
            ${phaseComplete ? `
              <button id="next-phase-btn" class="game-btn game-btn--primary w-full">
                ${currentPhase >= this.getExamPhases(bossData).length - 1 ? 'Complete Examination' : 'Continue to Next Section'}
              </button>
            ` : ''}
          </div>
        </div>
        
        <!-- Inventory sidebar -->
        <div id="question-inventory-sidebar" class="question-inventory-sidebar boss-inventory-sidebar">
          <h4 class="inventory-sidebar-title">Inventory</h4>
          <div id="question-inventory-items" class="inventory-sidebar-items">
            <p class="text-center">Loading items...</p>
          </div>
        </div>
      </div>
    `;
    
    // Initialize boss animation
    this.initBossAnimation();
    
    // Render the current exam phase
    this.renderExamPhase(bossData, currentPhase);
    
    // Bind next phase button if phase is complete
    if (phaseComplete) {
      this.bindAction('next-phase-btn', 'click', 'nextPhase', { 
        nodeData,
        currentPhase,
        isLastPhase: currentPhase >= this.getExamPhases(bossData).length - 1
      });
    }
    
    // Load inventory items
    this.renderInventoryItems();
    
    // Start exam timer if not already running
    this.startExamTimer();
  },
  
  // Enhanced version with better debugging and fallbacks
  initBossAnimation: function() {
    const container = document.getElementById('boss-sprite');
    if (!container) {
      console.error("Boss sprite container not found");
      return;
    }
    
    console.log("Debug: Starting boss animation initialization");
    
    // Remove existing animation if any
    const existingAnimId = this.getUiState('bossAnimation');
    if (existingAnimId && typeof SpriteSystem !== 'undefined') {
      try {
        SpriteSystem.removeAnimation(existingAnimId);
      } catch (error) {
        console.error("Error removing existing animation:", error);
      }
    }
    
    // Add a background glow effect to the container
    container.style.boxShadow = '0 0 15px rgba(255, 106, 0, 0.6)';
    container.style.position = 'relative';
    container.style.width = '96px';
    container.style.height = '96px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    
    // Method 1: Create a static image with inline styles
    try {
      // Log the expected image path for debugging
      const imagePath = '/static/img/characters/ion_chamber/idle.png';
      console.log("Debug: Attempting to load image from", imagePath);
      
      // Create an image element with detailed inline styles
      const ionChamberImg = document.createElement('img');
      ionChamberImg.src = imagePath;
      ionChamberImg.alt = 'Ion Chamber Boss';
      
      // Apply styles directly to ensure they're applied
      ionChamberImg.style.display = 'block';
      ionChamberImg.style.width = '24px'; // 1/4 of container size since we're scaling 4x
      ionChamberImg.style.height = '24px';
      ionChamberImg.style.transform = 'scale(4)';
      ionChamberImg.style.transformOrigin = 'center center';
      ionChamberImg.style.imageRendering = 'pixelated';
      ionChamberImg.style.position = 'relative';
      ionChamberImg.style.zIndex = '2';
      
      // Add animation via class
      ionChamberImg.className = 'boss-static-img boss-idle';
      
      // Add onload handler to verify the image loads
      ionChamberImg.onload = function() {
        console.log("✅ Ion chamber image loaded successfully!");
      };
      
      // Add error handling for image with detailed fallback
      ionChamberImg.onerror = function() {
        console.warn("Primary ion chamber image failed to load - trying alternatives");
        
        // Try alternative paths - check if resident.png exists
        this.src = '/static/img/characters/resident.png';
        this.onerror = function() {
          // If even that fails, try a minimal circle fallback
          console.error("All image attempts failed, using circle fallback");
          
          // Replace the failed image with a colored div
          const fallbackDiv = document.createElement('div');
          fallbackDiv.style.width = '96px';
          fallbackDiv.style.height = '96px';
          fallbackDiv.style.borderRadius = '50%';
          fallbackDiv.style.background = 'radial-gradient(circle, #ff6a00 0%, #000000 80%)';
          fallbackDiv.style.position = 'relative';
          fallbackDiv.style.animation = 'pulse 3s infinite';
          
          // Add animation keyframes
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); box-shadow: 0 0 15px 5px rgba(255, 106, 0, 0.4); }
              50% { transform: scale(1.05); box-shadow: 0 0 25px 10px rgba(255, 106, 0, 0.7); }
              100% { transform: scale(1); box-shadow: 0 0 15px 5px rgba(255, 106, 0, 0.4); }
            }
          `;
          document.head.appendChild(style);
          
          // Replace this image with the div
          const parent = this.parentNode;
          if (parent) {
            parent.replaceChild(fallbackDiv, this);
          }
        };
      };
      
      // Clear container and add the new image
      container.innerHTML = '';
      container.appendChild(ionChamberImg);
      
      console.log("✅ Using direct image for Ion Chamber boss");
      this.setUiState('bossState', 'idle');
      
      // Create a debug button to test animations
      if (true) { // Change to "if (true)" to enable the debug button
        const debugPanel = document.createElement('div');
        debugPanel.style.position = 'absolute';
        debugPanel.style.bottom = '-40px';
        debugPanel.style.left = '0';
        debugPanel.style.width = '100%';
        debugPanel.style.textAlign = 'center';
        
        const btnIdle = document.createElement('button');
        btnIdle.textContent = 'Idle';
        btnIdle.style.margin = '2px';
        btnIdle.style.padding = '2px 5px';
        btnIdle.style.fontSize = '10px';
        btnIdle.onclick = () => this.playBossAnimation('idle');
        
        const btnAbility = document.createElement('button');
        btnAbility.textContent = 'Ability';
        btnAbility.style.margin = '2px';
        btnAbility.style.padding = '2px 5px';
        btnAbility.style.fontSize = '10px';
        btnAbility.onclick = () => this.playBossAnimation('ability');
        
        const btnWalking = document.createElement('button');
        btnWalking.textContent = 'Walking';
        btnWalking.style.margin = '2px';
        btnWalking.style.padding = '2px 5px';
        btnWalking.style.fontSize = '10px';
        btnWalking.onclick = () => this.playBossAnimation('walking');
        
        debugPanel.appendChild(btnIdle);
        debugPanel.appendChild(btnAbility);
        debugPanel.appendChild(btnWalking);
        
        container.parentNode.appendChild(debugPanel);
      }
      
      return;
    } catch (error) {
      console.error("Method 1 failed:", error);
    }
    
    // Fallback method - create a circular div
    console.log("Debug: Using fallback method for boss display");
    
    // Create a circular element with a glow effect and inline styles
    container.innerHTML = `
      <div style="
        width: 96px;
        height: 96px;
        background-color: #000;
        border-radius: 50%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 0 25px 8px rgba(255, 106, 0, 0.6);
      ">
        <div style="
          width: 80%;
          height: 80%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,106,0,0.8) 0%, rgba(0,0,0,0.9) 70%);
          position: relative;
        "></div>
      </div>
    `;
    
    // Add animation via JavaScript
    const glowElement = container.querySelector('div');
    if (glowElement) {
      // Create animation
      glowElement.animate([
        { boxShadow: '0 0 20px 5px rgba(255, 106, 0, 0.5)', transform: 'scale(1)' },
        { boxShadow: '0 0 30px 10px rgba(255, 106, 0, 0.7)', transform: 'scale(1.05)' },
        { boxShadow: '0 0 20px 5px rgba(255, 106, 0, 0.5)', transform: 'scale(1)' }
      ], {
        duration: 3000,
        iterations: Infinity
      });
    }
    
    console.log("✅ Using fallback HTML/CSS for Ion Chamber boss");
    this.setUiState('bossState', 'idle');
  },

  // Enhanced version of playBossAnimation with better debug output
  playBossAnimation: function(animationName, returnToIdle = true) {
    console.log(`Debug: Playing boss animation: ${animationName}`);
    
    // Handle static image "animations" with CSS classes and direct style manipulation
    const bossElement = document.querySelector('.boss-static-img');
    if (bossElement) {
      console.log("Debug: Found boss-static-img element, applying animation class");
      
      // Reset classes
      bossElement.className = 'boss-static-img';
      
      // Apply animation based on name
      switch(animationName) {
        case 'idle':
          bossElement.style.animation = 'none'; // Reset
          void bossElement.offsetWidth; // Force reflow
          bossElement.style.animation = 'ion-chamber-idle 3s infinite ease-in-out';
          break;
          
        case 'ability':
          bossElement.style.animation = 'none'; // Reset
          void bossElement.offsetWidth; // Force reflow
          bossElement.style.animation = 'ion-chamber-ability 1s ease-in-out';
          break;
          
        case 'walking':
          bossElement.style.animation = 'none'; // Reset
          void bossElement.offsetWidth; // Force reflow
          bossElement.style.animation = 'ion-chamber-walking 1s infinite ease-in-out';
          break;
          
        case 'specialAbility':
          bossElement.style.animation = 'none'; // Reset
          void bossElement.offsetWidth; // Force reflow
          bossElement.style.animation = 'ion-chamber-special 1.5s ease-in-out';
          break;
      }
      
      // Add keyframes if they don't exist
      if (!document.getElementById('ion-chamber-animations')) {
        const style = document.createElement('style');
        style.id = 'ion-chamber-animations';
        style.textContent = `
          @keyframes ion-chamber-idle {
            0% { transform: scale(4); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
            50% { transform: scale(4.1); filter: drop-shadow(0 0 12px rgba(255, 106, 0, 0.5)); }
            100% { transform: scale(4); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
          }
          
          @keyframes ion-chamber-ability {
            0% { transform: scale(4); filter: drop-shadow(0 0 5px rgba(255, 106, 0, 0.3)) brightness(1); }
            50% { transform: scale(4.4) rotate(-5deg); filter: drop-shadow(0 0 15px rgba(255, 106, 0, 0.8)) brightness(1.3); }
            100% { transform: scale(4); filter: drop-shadow(0 0 5px rgba(255, 106, 0, 0.3)) brightness(1); }
          }
          
          @keyframes ion-chamber-walking {
            0% { transform: scale(4) translateX(0); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
            25% { transform: scale(4) translateX(-3px); filter: drop-shadow(0 0 10px rgba(255, 106, 0, 0.4)); }
            75% { transform: scale(4) translateX(3px); filter: drop-shadow(0 0 10px rgba(255, 106, 0, 0.4)); }
            100% { transform: scale(4) translateX(0); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
          }
          
          @keyframes ion-chamber-special {
            0% { transform: scale(4) rotate(0deg); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
            20% { transform: scale(4.5) rotate(-5deg); filter: drop-shadow(0 0 20px rgba(255, 106, 0, 0.8)); }
            40% { transform: scale(4.2) rotate(3deg); filter: drop-shadow(0 0 15px rgba(255, 106, 0, 0.6)); }
            60% { transform: scale(4.4) rotate(-3deg); filter: drop-shadow(0 0 18px rgba(255, 106, 0, 0.7)); }
            80% { transform: scale(4.3) rotate(2deg); filter: drop-shadow(0 0 15px rgba(255, 106, 0, 0.6)); }
            100% { transform: scale(4) rotate(0deg); filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.3)); }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Set timeout to return to idle if needed
      if (returnToIdle && animationName !== 'idle') {
        setTimeout(() => {
          console.log("Debug: Returning to idle animation");
          this.playBossAnimation('idle', false);
        }, 1000);
      }
      
      // Update state
      this.setUiState('bossState', animationName);
      return;
    }
    
    // Fallback for direct manipulation of fallback elements
    const fallbackElement = document.querySelector('#boss-sprite > div');
    if (fallbackElement) {
      console.log("Debug: Found fallback element, applying animation");
      
      // Change the animation based on the requested state
      switch(animationName) {
        case 'ability':
          fallbackElement.style.boxShadow = '0 0 40px 15px rgba(255, 106, 0, 0.8)';
          fallbackElement.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.2) rotate(-5deg)' },
            { transform: 'scale(1)' }
          ], {
            duration: 500,
            iterations: 1
          });
          break;
          
        case 'walking':
          fallbackElement.animate([
            { transform: 'translateX(0px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0px)' }
          ], {
            duration: 500,
            iterations: 2
          });
          break;
          
        case 'specialAbility':
          fallbackElement.style.boxShadow = '0 0 50px 20px rgba(255, 106, 0, 1)';
          fallbackElement.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.3) rotate(-8deg)' },
            { transform: 'scale(1.2) rotate(5deg)' },
            { transform: 'scale(1.25) rotate(-3deg)' },
            { transform: 'scale(1)' }
          ], {
            duration: 1000,
            iterations: 1
          });
          break;
          
        case 'idle':
        default:
          fallbackElement.style.boxShadow = '0 0 25px 8px rgba(255, 106, 0, 0.6)';
          // Reset any existing animations
          fallbackElement.getAnimations().forEach(anim => anim.cancel());
          // Apply idle animation
          fallbackElement.animate([
            { boxShadow: '0 0 20px 5px rgba(255, 106, 0, 0.5)', transform: 'scale(1)' },
            { boxShadow: '0 0 30px 10px rgba(255, 106, 0, 0.7)', transform: 'scale(1.05)' },
            { boxShadow: '0 0 20px 5px rgba(255, 106, 0, 0.5)', transform: 'scale(1)' }
          ], {
            duration: 3000,
            iterations: Infinity
          });
      }
      
      // Reset to idle if needed
      if (returnToIdle && animationName !== 'idle') {
        setTimeout(() => {
          console.log("Debug: Returning fallback to idle state");
          this.playBossAnimation('idle', false);
        }, 1000);
      }
      
      this.setUiState('bossState', animationName);
    }
  },

  // Add inventory rendering function
  renderInventoryItems: function() {
    const container = document.getElementById('question-inventory-items');
    if (!container) return;
    
    // Get inventory from game state
    const inventory = window.GameState?.data?.inventory || [];
    
    // Clear container and show message if no items
    if (!inventory || inventory.length === 0) {
      container.innerHTML = '<p class="text-center p-md">No items in inventory</p>';
      return;
    }
    
    // Filter to only show consumable items (not relics)
    const consumableItems = inventory.filter(item => 
      item.itemType !== 'relic' || !item.itemType
    );
    
    if (consumableItems.length === 0) {
      container.innerHTML = '<p class="text-center p-md">No usable items</p>';
      return;
    }
    
    // Create a simple grid layout for the items
    container.innerHTML = '';
    
    // Create a grid container
    const gridDiv = document.createElement('div');
    gridDiv.className = 'inventory-sidebar-grid';
    container.appendChild(gridDiv);
    
    // Add each item
    consumableItems.forEach(item => {
      // Create item element
      const itemDiv = document.createElement('div');
      itemDiv.className = `inventory-sidebar-item ${item.rarity || 'common'}`;
      
      // Add item icon with appropriate styling based on rarity
      const itemInner = document.createElement('div');
      itemInner.className = 'inventory-sidebar-item-inner';
      
      // Get icon HTML
      itemInner.innerHTML = this.getItemIcon(item);
      
      // Add to item div
      itemDiv.appendChild(itemInner);
      
      // Setup data for tooltip and functionality
      itemDiv.dataset.itemId = item.id;
      itemDiv.dataset.itemName = item.name;
      itemDiv.dataset.itemRarity = item.rarity || 'common';
      
      // Apply tooltips
      if (window.TooltipSystem && typeof TooltipSystem.registerTooltip === 'function') {
        TooltipSystem.registerTooltip(itemDiv, item);
      } else if (window.UnifiedTooltipSystem && typeof UnifiedTooltipSystem.applyTooltip === 'function') {
        UnifiedTooltipSystem.applyTooltip(itemDiv, item);
      }
      
      // Add click event
      const self = this;
      itemDiv.addEventListener('click', function() {
        self.useItem({ item: item });
      });
      
      // Add to grid
      gridDiv.appendChild(itemDiv);
    });
  },

  // Helper function for item icons
  getItemIcon: function(item) {
    // Default item image that we know exists in your file structure
    const defaultItemImage = "Yellow Sticky Note.png";
    
    // Check if the item has a custom icon path
    if (item.iconPath) {
      return `<img src="/static/img/items/${item.iconPath}" alt="${item.name}" 
              style="width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated;"
              onerror="this.onerror=null; this.src='/static/img/items/${defaultItemImage}';">`;
    }
    
    // Map common item types to icons that we know exist in your file structure
    const itemName = (item.name || '').toLowerCase();
    let iconFile = defaultItemImage; // Default fallback
    
    if (itemName.includes('book') || itemName.includes('manual') || itemName.includes('textbook')) {
      iconFile = "Textbook.png";
    } else if (itemName.includes('potion') || itemName.includes('vial')) {
      iconFile = "Prism.png";
    } else if (itemName.includes('badge') || itemName.includes('dosimeter')) {
      iconFile = "Nametag.png";
    } else if (itemName.includes('glasses') || itemName.includes('spectacles') || itemName.includes('goggles')) {
      iconFile = "3D Glasses.png";
    }
    
    return `<img src="/static/img/items/${iconFile}" alt="${item.name}" 
            style="width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated;"
            onerror="this.onerror=null; this.src='/static/img/items/${defaultItemImage}';">`;
  },

  // Use an item during the boss encounter
  useItem: function(data) {
    if (!data || !data.item) return;
    
    const item = data.item;
    console.log(`Using item: ${item.id} - ${item.name}`);
    
    // Apply the item effect
    const effectApplied = this.applyItemEffect(item);
    
    if (!effectApplied) {
      if (typeof this.showToast === 'function') {
        this.showToast("Failed to use item", "error");
      }
      return;
    }
    
    // Remove the item from inventory
    if (window.GameState && window.GameState.data && window.GameState.data.inventory) {
      const inventory = window.GameState.data.inventory;
      const itemIndex = inventory.findIndex(i => i.id === item.id);
      
      if (itemIndex !== -1) {
        // Remove the item
        inventory.splice(itemIndex, 1);
        
        // Save the inventory change via API if available
        if (window.ApiClient && typeof ApiClient.saveInventory === 'function') {
          ApiClient.saveInventory({ inventory: inventory })
            .then(() => console.log("Inventory saved successfully"))
            .catch(err => console.error("Failed to save inventory:", err));
        }
      }
    }
    
    // Show success message
    if (typeof this.showToast === 'function') {
      this.showToast(`Used ${item.name}!`, "success");
    }
    
    // Force inventory update
    this.renderInventoryItems();
    
    // Emit event for item used
    if (window.EventSystem && typeof EventSystem.emit === 'function') {
      EventSystem.emit('itemUsed', item);
    }
  },
  
  // Apply item effect
  applyItemEffect: function(item) {
    if (!item || !item.effect) return false;
    
    // Handle different effect types
    switch(item.effect.type) {
      case "insight_boost":
        // Boost score
        const currentScore = this.getUiState('playerScore');
        this.setUiState('playerScore', currentScore + (parseInt(item.effect.value) || 10));
        
        // Update score display
        const scoreText = document.querySelector('.score-text');
        if (scoreText) {
          scoreText.textContent = `Score: ${this.getUiState('playerScore')}`;
        }
        
        // Change boss animation
        this.playBossAnimation('ability');
        
        return true;
        
      case "restore_life":
      case "heal":
        // Add time
        const timeBonus = parseInt(item.effect.value) || 15;
        const currentTime = this.getUiState('timeRemaining');
        this.setUiState('timeRemaining', currentTime + timeBonus);
        
        // Update time display
        const timeRemainingElement = document.querySelector('.time-remaining');
        if (timeRemainingElement) {
          timeRemainingElement.textContent = this.formatTime(this.getUiState('timeRemaining'));
        }
        
        // Change boss animation
        this.playBossAnimation('ability');
        
        // Show feedback
        if (typeof this.showFloatingText === 'function') {
          this.showFloatingText(`+${timeBonus}s Time`, "success");
        }
        
        return true;
        
      case "eliminateOption":
        // Find the current question options
        const optionsContainer = document.querySelector('.phase-question .question-options');
        if (optionsContainer) {
          return this.eliminateIncorrectOption(item, optionsContainer);
        }
        return false;
        
      default:
        // Generic effect - just play animation
        this.playBossAnimation('ability');
        return true;
    }
  },
  
  // Eliminate an incorrect option
  eliminateIncorrectOption: function(item, optionsContainer) {
    // Try to get the current phase's question
    let correctIndex = null;
    let question = null;
    
    // Get from current phase
    const currentPhase = this.getUiState('currentPhase');
    const bossData = this.getBossData(this.getUiState('currentNodeData'));
    
    if (bossData && bossData.phases && bossData.phases[currentPhase] && 
        bossData.phases[currentPhase].questions && bossData.phases[currentPhase].questions[0] &&
        typeof bossData.phases[currentPhase].questions[0].correct === 'number') {
      
      question = bossData.phases[currentPhase].questions[0];
      correctIndex = question.correct;
    }
    // Fallback to nodeData
    else if (this.getUiState('currentNodeData') && 
        this.getUiState('currentNodeData').question && 
        typeof this.getUiState('currentNodeData').question.correct === 'number') {
      
      question = this.getUiState('currentNodeData').question;
      correctIndex = question.correct;
    }
    
    if (correctIndex === null || !question) {
      if (typeof this.showToast === 'function') {
        this.showToast("Can't determine correct answer", "warning");
      }
      return false;
    }
    
    // Get options
    const options = optionsContainer.querySelectorAll('.question-option:not(.disabled):not(.eliminated-option)');
    
    // Find incorrect options
    const incorrectOptions = Array.from(options).filter((option) => {
      const optionIndex = option.dataset.index ? parseInt(option.dataset.index) : 
                        Array.from(options).indexOf(option);
      return optionIndex !== correctIndex;
    });
    
    // If we have incorrect options, choose one randomly to eliminate
    if (incorrectOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
      const optionToEliminate = incorrectOptions[randomIndex];
      
      // Mark as eliminated
      optionToEliminate.classList.add('eliminated-option');
      optionToEliminate.style.opacity = '0.5';
      optionToEliminate.innerHTML = `<s>${optionToEliminate.textContent}</s> <span class="eliminated-badge">Eliminated</span>`;
      optionToEliminate.disabled = true;
      
      // Show feedback
      if (typeof this.showToast === 'function') {
        this.showToast("Incorrect option eliminated!", "success");
      } else if (typeof this.showFloatingText === 'function') {
        this.showFloatingText("Incorrect option eliminated!", "success");
      }
      
      // Change boss animation
      this.playBossAnimation('ability');
      
      return true;
    } else {
      if (typeof this.showToast === 'function') {
        this.showToast("No incorrect options available to eliminate", "warning");
      }
      return false;
    }
  },
  
  // Get boss dialogue based on phase and state
  getBossDialogue: function(bossData, phaseIndex, phaseComplete) {
    // Use dialogue from NPCAssets if available
    if (window.NPCAssets && NPCAssets.getRandomDialogue) {
      if (phaseComplete) {
        if (phaseIndex >= this.getExamPhases(bossData).length - 1) {
          // Final completion dialogue
          const success = this.getUiState('playerScore') >= 70;
          
          // Try to get dialogue from NPCAssets
          const dialogue = NPCAssets.getRandomDialogue('ionChamberBoss', 'completion');
          if (dialogue) return typeof dialogue === 'object' ? 
            (dialogue[success ? 'success' : 'failure'] || "Examination complete.") : 
            dialogue;
        } else {
          // Phase transition dialogue
          return NPCAssets.getRandomDialogue('ionChamberBoss', 'phase_transition') || 
            "Section complete. Prepare for the next challenge.";
        }
      } else {
        // Standard phase dialogue
        return NPCAssets.getRandomDialogue('ionChamberBoss', 'intro') || 
          "Welcome to your radiation metrology examination.";
      }
    }
    
    // Fallback dialogues if NPCAssets is not available
    const dialogues = [
      "Welcome to your Radiation Metrology examination. I am Professor Ionix.",
      "Now let's test your understanding of ion chamber principles.",
      "Excellent progress. This section will test your radiation detection knowledge."
    ];
    
    // Completion dialogues
    const completionDialogues = [
      "You've completed this section. Let's increase the potential difference and move to the next challenge.",
      "Section complete. Your knowledge shows good linearity so far.",
      "Well done. Your signal-to-noise ratio is impressive."
    ];
    
    // Get appropriate dialogue
    return phaseComplete
      ? completionDialogues[Math.min(phaseIndex, completionDialogues.length - 1)]
      : dialogues[Math.min(phaseIndex, dialogues.length - 1)];
  },
  
  // Render the current exam phase
  renderExamPhase: function(bossData, phaseIndex) {
    const phases = this.getExamPhases(bossData);
    
    // Check if we have valid phases
    if (phases.length === 0 || phaseIndex >= phases.length) {
      this.renderExamComplete(bossData);
      return;
    }
    
    // Get current phase
    const currentPhase = phases[phaseIndex];
    
    // Get the phase container
    const phaseContainer = document.getElementById('exam-phase-container');
    if (!phaseContainer) return;
    
    // If phase is completed, show results
    if (this.getUiState('phaseComplete')) {
      this.renderPhaseResults(phaseContainer, currentPhase, phaseIndex);
      return;
    }
    
    // Set up the phase content
    phaseContainer.innerHTML = `
      <div class="phase-header">
        <h4 class="phase-title">Section ${phaseIndex + 1}: ${currentPhase.title}</h4>
        <p class="phase-description">${currentPhase.description || 'Answer the following questions to prove your knowledge.'}</p>
      </div>
      
      <div id="phase-questions" class="phase-questions"></div>
    `;
    
    // Render questions for this phase
    this.renderPhaseQuestions(currentPhase);
  },
  
  // Render the questions for current phase
  renderPhaseQuestions: function(phase) {
    if (!phase || !phase.questions || phase.questions.length === 0) {
      console.error('No questions available for this phase');
      return;
    }
    
    const questionContainer = document.getElementById('phase-questions');
    if (!questionContainer) return;
    
    // For simplicity, just render the first question of the phase
    const question = phase.questions[0];
    
    // Create question
    questionContainer.innerHTML = `
      <div class="question-card phase-question">
        <div class="question-text">
          <p>${question.text}</p>
        </div>
        
        <div id="question-options" class="question-options">
          ${question.options.map((option, index) => `
            <button data-index="${index}" class="question-option">
              ${option}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    // Add event handlers for options
    const optionsContainer = document.getElementById('question-options');
    if (optionsContainer) {
      this.bindActionToSelector(optionsContainer, '.question-option', 'click', 'answerQuestion', (element) => {
        if (element.classList.contains('disabled')) return null;
        
        const index = parseInt(element.dataset.index, 10);
        return { 
          question,
          answerIndex: index
        };
      });
    }
  },
  
  // Render results of the completed phase
  renderPhaseResults: function(container, phase, phaseIndex) {
    if (!container) return;
    
    // Get phase results
    const results = this.getUiState('phaseResults')[phaseIndex] || {
      correct: 0,
      total: phase.questions ? phase.questions.length : 0,
      answers: []
    };
    
    // Calculate score percentage
    const scorePercent = results.total > 0 ? (results.correct / results.total) * 100 : 0;
    const scoreText = this.getScoreText(scorePercent);
    
    // Create results UI
    container.innerHTML = `
      <div class="phase-results">
        <div class="results-header">
          <h4 class="results-title">Section ${phaseIndex + 1} Results</h4>
          <div class="score-display">
            <div class="score-circle">
              <span class="score-value">${Math.round(scorePercent)}%</span>
            </div>
            <span class="score-text">${scoreText}</span>
          </div>
        </div>
        
        <div class="answered-questions">
          ${results.answers.map((answer, index) => `
            <div class="answered-question ${answer.correct ? 'correct-answer' : 'incorrect-answer'}">
              <div class="question-result">
                <span class="result-icon">${answer.correct ? '✓' : '✗'}</span>
                <p class="question-text">${phase.questions[index]?.text || 'Question'}</p>
              </div>
              <div class="answer-explanation">
                <p>${phase.questions[index]?.explanation || 'No explanation available'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // Render exam completion screen
  renderExamComplete: function(bossData) {
    // Get phase results
    const allResults = this.getUiState('phaseResults');
    
    // Calculate overall score
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    allResults.forEach(result => {
      totalCorrect += result.correct;
      totalQuestions += result.total;
    });
    
    const overallPercent = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const examPassed = overallPercent >= 70;
    
    // Get the phase container
    const phaseContainer = document.getElementById('exam-phase-container');
    if (!phaseContainer) return;
    
    // Get final verdict text
    const verdictText = examPassed 
      ? "Your response curve shows excellent linearity. You'll make a fine medical physicist." 
      : "Your response curve needs recalibration. I recommend more study before our next measurement.";
    
    // Create completion screen
    phaseContainer.innerHTML = `
      <div class="exam-complete">
        <h4 class="complete-title">Examination ${examPassed ? 'Passed' : 'Failed'}</h4>
        
        <div class="final-score-container">
          <div class="final-score-circle ${examPassed ? 'passed' : 'failed'}">
            <span class="final-score">${Math.round(overallPercent)}%</span>
          </div>
          <p class="final-verdict">${verdictText}</p>
        </div>
        
        <div class="exam-rewards">
          <p>Your performance in the radiation metrology examination has earned you:</p>
          <div class="rewards-list">
            <div class="reward-item">
              <span class="reward-icon">🧠</span>
              <span class="reward-text">+${examPassed ? 50 : 20} Insight</span>
            </div>
            ${examPassed ? `
              <div class="reward-item">
                <span class="reward-icon">🏆</span>
                <span class="reward-text">Ion Chamber Calibration Certificate</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Update next phase button to complete exam
    const nextButton = document.getElementById('next-phase-btn');
    if (nextButton) {
      nextButton.textContent = 'Complete Examination';
    }
    
    // Apply rewards
    this.applyExamRewards(examPassed);
    
    // Play boss completion animation
    this.playBossAnimation('specialAbility', false);
  },
  
  // Answer a question
  answerQuestion: function(data) {
    if (!data || !data.question) return;
    
    const question = data.question;
    const answerIndex = data.answerIndex;
    const isCorrect = answerIndex === question.correct;
    
    // Get current phase index
    const currentPhase = this.getUiState('currentPhase');
    
    // Update phase results
    const phaseResults = this.getUiState('phaseResults');
    if (!phaseResults[currentPhase]) {
      phaseResults[currentPhase] = {
        correct: 0,
        total: 1,
        answers: []
      };
    }
    
    // Add this answer to the results
    phaseResults[currentPhase].answers.push({
      questionIndex: 0, // Assuming only one question per phase for simplicity
      answerIndex: answerIndex,
      correct: isCorrect
    });
    
    // Update correct count
    if (isCorrect) {
      phaseResults[currentPhase].correct += 1;
      
      // Update score
      const currentScore = this.getUiState('playerScore');
      this.setUiState('playerScore', currentScore + 20);
      
      // Play success animation
      this.playBossAnimation('ability');
    } else {
      // Play failure animation
      this.playBossAnimation('walking');
    }
    
    // Save updated results
    this.setUiState('phaseResults', phaseResults);
    
    // Update score display
    const scoreText = document.querySelector('.score-text');
    if (scoreText) {
      scoreText.textContent = `Score: ${this.getUiState('playerScore')}`;
    }
    
    // Mark phase as complete
    this.setUiState('phaseComplete', true);
    
    // Disable options
    const optionsContainer = document.getElementById('question-options');
    if (optionsContainer) {
      const options = optionsContainer.querySelectorAll('.question-option');
      options.forEach(option => {
        option.disabled = true;
        option.classList.add('disabled');
        
        // Highlight correct and selected options
        const index = parseInt(option.dataset.index, 10);
        if (index === question.correct) {
          option.classList.add('correct-option');
        } else if (index === answerIndex && !isCorrect) {
          option.classList.add('incorrect-option');
        }
      });
    }
    
    // Show floating feedback
    this.showFeedback(isCorrect ? 'Correct!' : 'Incorrect!', isCorrect ? 'success' : 'danger');
    
    // Re-render to show results
    this.render(this.getCurrentNodeData(), document.getElementById('boss-container'));
  },
  
  // Move to next phase
  nextPhase: function(data) {
    if (!data) return;
    
    const currentPhase = data.currentPhase;
    const isLastPhase = data.isLastPhase;
    
    if (isLastPhase) {
      // Complete the boss node
      this.completeNode(data.nodeData);
    } else {
      // Move to next phase
      this.setUiState('currentPhase', currentPhase + 1);
      this.setUiState('phaseComplete', false);
      
      // Reset timer for next phase
      this.setUiState('timeRemaining', 90);
      
      // Re-render for next phase
      this.render(data.nodeData, document.getElementById('boss-container'));
    }
  },
  
  // Start the exam timer
  startExamTimer: function() {
    // Clear existing timer
    if (this._examTimer) {
      clearInterval(this._examTimer);
    }
    
    // If phase is already complete, don't start timer
    if (this.getUiState('phaseComplete')) {
      return;
    }
    
    // Set up new timer
    this._examTimer = setInterval(() => {
      let timeRemaining = this.getUiState('timeRemaining');
      
      // If phase is complete, stop timer
      if (this.getUiState('phaseComplete')) {
        clearInterval(this._examTimer);
        this._examTimer = null;
        return;
      }
      
      // Reduce time
      timeRemaining -= 1;
      
      // Update time
      this.setUiState('timeRemaining', timeRemaining);
      
      // Update time display
      const timeDisplay = document.querySelector('.time-remaining');
      if (timeDisplay) {
        timeDisplay.textContent = this.formatTime(timeRemaining);
        
        // Add warning class for low time
        if (timeRemaining <= 30) {
          timeDisplay.classList.add('time-warning');
        }
        
        // Add panic visual when very low time
        if (timeRemaining <= 10) {
          timeDisplay.classList.add('time-critical');
          
          // Change boss animation to walking when time is critical
          if (this.getUiState('bossState') !== 'walking') {
            this.playBossAnimation('walking');
          }
        }
      }
      
      // Handle time running out
      if (timeRemaining <= 0) {
        clearInterval(this._examTimer);
        this._examTimer = null;
        
        // Mark phase as failed if not already complete
        if (!this.getUiState('phaseComplete')) {
          // Auto-select an incorrect answer
          const nodeData = this.getCurrentNodeData();
          const bossData = this.getBossData(nodeData);
          const phase = this.getExamPhases(bossData)[this.getUiState('currentPhase')];
          
          if (phase && phase.questions && phase.questions.length > 0) {
            const question = phase.questions[0];
            
            // Choose an incorrect answer
            let wrongAnswer = 0;
            if (question.correct === 0) {
              wrongAnswer = 1;
            }
            
            // Submit the wrong answer
            this.answerQuestion({
              question: question,
              answerIndex: wrongAnswer
            });
          } else {
            // Just mark it complete with no answer
            this.setUiState('phaseComplete', true);
            
            // Re-render to show results
            this.render(this.getCurrentNodeData(), document.getElementById('boss-container'));
          }
          
          // Show time's up message
          this.showFeedback("Time's up!", 'danger');
        }
      }
    }, 1000);
  },
  
  // Format time remaining
  formatTime: function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  // Apply exam rewards
  applyExamRewards: function(passed) {
    // Grant insight based on performance
    const insightGain = passed ? 50 : 20;
    this.updatePlayerInsight(insightGain);
  },
  
  // Get current node data
  getCurrentNodeData: function() {
    return this.getUiState('currentNodeData') || 
           (window.GameState && GameState.data ? 
            GameState.getNodeById(GameState.data.currentNode) : null);
  },
  
  // Get exam phases from boss data
  getExamPhases: function(bossData) {
    if (!bossData) return [];
    
    // Try to get specific phases
    if (bossData.phases && Array.isArray(bossData.phases)) {
      return bossData.phases;
    }
    
    // Get IonChamberBoss phases if available
    if (window.IonChamberBoss && typeof IonChamberBoss.getPhases === 'function') {
      return IonChamberBoss.getPhases();
    }
    
    // Fallback to creating a single phase from the question
    if (bossData.question) {
      return [{
        title: 'Radiation Detection Fundamentals',
        questions: [bossData.question]
      }];
    }
    
    return [];
  },
  
  // Get score text based on percentage
  getScoreText: function(percentage) {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Very Good";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Satisfactory";
    if (percentage >= 50) return "Borderline";
    return "Needs Improvement";
  },
  
  // Get boss data from node data with Ion Chamber support
  getBossData: function(nodeData) {
    if (!nodeData) return { 
      title: 'Radiation Metrology Examination', 
      bossType: 'ionChamber', 
      phases: [] 
    };
    
    // Store current node data for later reference
    this.setUiState('currentNodeData', nodeData);
    
    // Get Ion Chamber boss phases from boss_professor.js if available
    if (window.IonChamberBoss && typeof IonChamberBoss.getPhases === 'function') {
      return {
        title: nodeData.title || 'Radiation Metrology Examination',
        bossType: 'ionChamber',
        phases: IonChamberBoss.getPhases(),
        dialogue: nodeData.dialogue || {}
      };
    }
    
    // Fallback if boss_professor.js isn't available
    return {
      title: nodeData.title || 'Radiation Metrology Examination',
      bossType: 'ionChamber',
      phases: nodeData.questions ? 
        [{ title: 'Radiation Detection Fundamentals', questions: nodeData.questions }] :
        nodeData.question ? 
          [{ title: 'Radiation Detection Fundamentals', questions: [nodeData.question] }] : []
    };
  },
  
  // Show feedback toast or floating text
  showFeedback: function(message, type) {
    if (typeof this.showToast === 'function') {
      this.showToast(message, type);
    } else if (typeof this.showFloatingText === 'function') {
      this.showFloatingText(message, type);
    } else if (window.UiUtils && typeof UiUtils.showToast === 'function') {
      UiUtils.showToast(message, type);
    } else {
      console.log(`Feedback (${type}): ${message}`);
    }
  },
  
  // Handle component actions
  handleAction: function(nodeData, action, data) {
    console.log(`Boss component handling action: ${action}`, data);
    
    switch (action) {
      case 'answerQuestion':
        this.answerQuestion(data);
        break;
          
      case 'nextPhase':
        this.nextPhase(data);
        break;
          
      case 'continue':
        // Complete the node/boss
        this.completeNode(nodeData);
        
        // Clear exam timer
        if (this._examTimer) {
          clearInterval(this._examTimer);
          this._examTimer = null;
        }
        break;
          
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
});

// Register the component
if (typeof NodeComponents !== 'undefined') {
  NodeComponents.register('boss', FixedBossComponent);
}