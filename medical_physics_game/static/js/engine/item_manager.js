// item_manager.js - Unified item and relic management system

const ItemManager = {
  // ===== STATE & CONFIGURATION =====
  
  // Storage for definitions
  itemDefinitions: {},
  relicDefinitions: {},
  
  // Track active relics and their effects
  activeRelics: {},
  
  // Track initialization state
  initialized: false,
  
  // ===== INITIALIZATION & SETUP =====
  
  // Initialize the system
  initialize: function() {
    // Prevent double initialization
    if (this.initialized) {
      console.log("ItemManager already initialized");
      return this;
    }
    
    console.log("Initializing enhanced item manager...");
    
    // Subscribe to events
    if (window.EventSystem) {
      EventSystem.on(GAME_EVENTS.ITEM_ADDED, this.onItemAdded.bind(this));
      EventSystem.on(GAME_EVENTS.ITEM_USED, this.onItemUsed.bind(this));
      EventSystem.on(GAME_EVENTS.RELIC_ADDED, this.onRelicAdded.bind(this));
      EventSystem.on(GAME_EVENTS.GAME_INITIALIZED, this.onGameInitialized.bind(this));
    }
    
    // Pre-load item definitions for better performance
    this.preloadItemDefinitions();
    
    // Initialize active relics from current game state
    this.initializeActiveRelics();
    
    // Mark as initialized
    this.initialized = true;
    
    return this;
  },
  
  // Initialize active relics from game state
  initializeActiveRelics: function() {
    if (window.GameState && GameState.data && GameState.data.inventory) {
      // Find all relics in inventory
      const relics = GameState.data.inventory.filter(item => item.itemType === 'relic');
      
      // Register each relic as active
      relics.forEach(relic => {
        this.activeRelics[relic.id] = relic;
        // Apply effect if not already applied
        this.applyRelicEffect(relic);
      });
      
      console.log(`Initialized ${Object.keys(this.activeRelics).length} active relics`);
    }
  },
  
  // Handle game initialization
  onGameInitialized: function() {
    console.log("Game initialized, verifying item manager state");
    this.initializeActiveRelics();
  },
  
  // ===== DATA LOADING & CACHING =====
  
  // Preload common items and relics
  preloadItemDefinitions: function() {
    console.log("Preloading item definitions...");
    
    // Default items if API fails
    const defaultItems = [
      {
        "id": "medical_textbook",
        "name": "Medical Physics Textbook",
        "description": "A comprehensive guide that helps eliminate one incorrect answer option.",
        "rarity": "uncommon",
        "itemType": "consumable",
        "iconPath": "Notebook.png",
        "effect": {
          "type": "eliminateOption",
          "value": "Removes one incorrect answer option",
          "duration": "instant"
        }
      },
      {
        "id": "radiation_badge",
        "name": "Radiation Badge",
        "description": "A personal dosimeter that can absorb harmful radiation, restoring 1 life point.",
        "rarity": "rare",
        "itemType": "consumable",
        "iconPath": "Nametag.png",
        "effect": {
          "type": "heal",
          "value": 1,
          "duration": "instant"
        }
      }
    ];
    
    // Default relics if API fails
    const defaultRelics = [
      {
        "id": "quantum_uncertainty_goggles",
        "name": "Schrödinger's Spectacles",
        "description": "These glasses simultaneously show radiation as both particles and waves, allowing you two attempts at answering questions.",
        "rarity": "epic",
        "itemType": "relic",
        "iconPath": "3D Glasses.png",
        "effect": {
          "type": "second_chance",
          "value": "Allows a second attempt at question nodes",
          "duration": "permanent"
        },
        "passiveText": "Passive: Can attempt questions twice"
      },
      {
        "id": "nihilist_clipboard",
        "name": "Theoretical Physicist's Notebook",
        "description": "A notebook containing advanced calculations that boost your understanding of physics concepts.",
        "rarity": "uncommon",
        "itemType": "relic",
        "iconPath": "Yellow Sticky Note.png",
        "effect": {
          "type": "insight_boost",
          "value": 10,
          "duration": "permanent"
        },
        "passiveText": "Passive: +10% Insight from all sources"
      }
    ];
    
    // Store default definitions
    defaultItems.forEach(item => {
      this.itemDefinitions[item.id] = item;
    });
    
    defaultRelics.forEach(relic => {
      this.relicDefinitions[relic.id] = relic;
    });
    
    // Try to load from API too
    this.loadItemsFromApi();
    this.loadRelicsFromApi();
  },

  // Load items from API - UPDATED to use editor/items endpoint
  loadItemsFromApi: function() {
    try {
      // Use standard fetch instead of relying on ApiClient
      fetch('/api/editor/items')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.success || !Array.isArray(data.items)) {
            throw new Error("Invalid response format or missing items");
          }
          
          // Filter for non-relic items only
          const items = data.items.filter(item => item.itemType !== 'relic');
          
          if (items.length > 0) {
            items.forEach(item => {
              this.itemDefinitions[item.id] = item;
            });
            console.log(`Loaded ${items.length} items from API`);
          } else {
            console.log("No items found in API response");
          }
        })
        .catch(error => {
          console.warn("Failed to load items from API, using defaults", error);
        });
    } catch (error) {
      console.warn("Error in loadItemsFromApi:", error);
    }
  },

  // Load relics from API - UPDATED to use editor/items endpoint
  loadRelicsFromApi: function() {
    try {
      // Use standard fetch instead of relying on ApiClient
      fetch('/api/editor/items')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.success || !Array.isArray(data.items)) {
            throw new Error("Invalid response format or missing items");
          }
          
          // Filter for relic items only
          const relics = data.items.filter(item => item.itemType === 'relic');
          
          if (relics.length > 0) {
            relics.forEach(relic => {
              this.relicDefinitions[relic.id] = relic;
            });
            console.log(`Loaded ${relics.length} relics from API`);
          } else {
            console.log("No relics found in API response");
          }
        })
        .catch(error => {
          console.warn("Failed to load relics from API, using defaults", error);
        });
    } catch (error) {
      console.warn("Error in loadRelicsFromApi:", error);
    }
  },
  
  // Load individual item definition
  loadItemDefinition: function(itemId) {
    // If already loaded, return it
    if (this.itemDefinitions[itemId]) {
      return Promise.resolve(this.itemDefinitions[itemId]);
    }
    
    // Otherwise fetch from API if available
    if (window.ApiClient && typeof ApiClient.getItem === 'function') {
      return ApiClient.getItem(itemId)
        .then(item => {
          this.itemDefinitions[itemId] = item;
          return item;
        })
        .catch(error => {
          console.error(`Failed to load item definition for ${itemId}`, error);
          // Return a default item as fallback
          return {
            id: itemId,
            name: "Unknown Item",
            description: "An item with mysterious properties.",
            rarity: "common",
            effect: { type: "unknown", value: "Unknown effect" }
          };
        });
    }
    
    // No API client available, return a default item
    return Promise.resolve({
      id: itemId,
      name: "Unknown Item",
      description: "An item with mysterious properties.",
      rarity: "common",
      effect: { type: "unknown", value: "Unknown effect" }
    });
  },
  
  // ===== EVENT HANDLERS =====
  
  // Handle adding an item to inventory
  onItemAdded: function(item) {
    console.log("Item added:", item);
    
    // Store definition
    this.itemDefinitions[item.id] = item;
    
    // If it's a relic, register it as active
    if (item.itemType === 'relic') {
      this.activeRelics[item.id] = item;
      // Apply its effect
      this.applyRelicEffect(item);
    }
    
    // Notify UI that an item was added successfully
    if (window.EventSystem) {
      EventSystem.emit(GAME_EVENTS.ITEM_ADDED_SUCCESS, item);
    }
  },
  
  // Handle using an item
  onItemUsed: function(item) {
    console.log("Item used:", item);
    
    // Apply any effects
    if (item.effect) {
      this.applyItemEffect(item.effect);
    }
  },
  
  // Handle adding a relic
  onRelicAdded: function(relic) {
    console.log("Relic added:", relic);
    
    // Store definition
    this.relicDefinitions[relic.id] = relic;
    
    // Register as active
    this.activeRelics[relic.id] = relic;
    
    // Apply passive effect
    this.applyRelicEffect(relic);
  },
  
  // ===== EFFECT HANDLING =====
  
  // Apply a relic's effect with careful error handling
  applyRelicEffect: function(relic) {
    if (!relic || !relic.effect) return;
    
    const effect = relic.effect;
    console.log(`Applying relic effect: ${relic.id}`, effect);
    
    try {
      switch (effect.type) {
        case "insight_boost":
          // Store the boost percentage in game state
          if (!window.GameState || !GameState.data) {
            console.warn("GameState not available for insight boost");
            return;
          }
          
          if (!GameState.data.insightBoost) {
            GameState.data.insightBoost = 0;
          }
          
          // Add the boost percentage
          GameState.data.insightBoost += parseInt(effect.value) || 10;
          console.log(`Applied insight boost: ${GameState.data.insightBoost}%`);
          
          // Show notification
          if (window.UiUtils) {
            UiUtils.showToast(`Relic activated: +${effect.value}% Insight from all sources`, 'success');
          }
          break;
          
        case "second_chance":
          // Store the second chance flag in game state
          if (window.GameState && GameState.data) {
            GameState.data.hasSecondChance = true;
          }
          
          // Show notification
          if (window.UiUtils) {
            UiUtils.showToast("Relic activated: You now get a second chance on questions", 'success');
          }
          break;
          
        case "extra_life":
          if (window.GameState && GameState.data && GameState.data.character) {
            const maxLives = GameState.data.character.max_lives + parseInt(effect.value || 1);
            const lives = GameState.data.character.lives + parseInt(effect.value || 1);
            
            if (typeof GameState.updateCharacterAttribute === 'function') {
              GameState.updateCharacterAttribute('max_lives', maxLives);
              GameState.updateCharacterAttribute('lives', lives);
            } else {
              // Fallback if updateCharacterAttribute is not available
              GameState.data.character.max_lives = maxLives;
              GameState.data.character.lives = lives;
              
              // Save game state
              if (window.ApiClient && ApiClient.saveGame) {
                ApiClient.saveGame();
              }
            }
          }
          break;
          
        case "category_boost":
          // Store category boost in game state
          if (!window.GameState || !GameState.data) {
            console.warn("GameState not available for category boost");
            return;
          }
          
          if (!GameState.data.categoryBoosts) {
            GameState.data.categoryBoosts = {};
          }
          
          // Parse the value to determine which category gets boosted
          const categoryInfo = String(effect.value || '');
          if (categoryInfo.includes('dosimetry')) {
            GameState.data.categoryBoosts.dosimetry = true;
          } else if (categoryInfo.includes('radiation')) {
            GameState.data.categoryBoosts.radiation = true;
          } else if (categoryInfo.includes('imaging')) {
            GameState.data.categoryBoosts.imaging = true;
          }
          
          // Show notification
          if (window.UiUtils) {
            UiUtils.showToast(`Relic activated: ${effect.value}`, 'success');
          }
          break;
      }
    } catch (error) {
      console.error(`Error applying relic effect ${effect.type}:`, error);
    }
  },
  
  // Apply a consumable item's effect with improved error handling
  applyItemEffect: function(effect) {
    if (!effect || !effect.type) return false;
    
    console.log(`Applying item effect:`, effect);
    
    try {
      switch (effect.type) {
        case "heal":
          if (window.GameState && GameState.data && GameState.data.character) {
            const value = parseInt(effect.value) || 1;
            const newLives = Math.min(
              GameState.data.character.max_lives,
              GameState.data.character.lives + value
            );
            
            if (typeof GameState.updateCharacterAttribute === 'function') {
              GameState.updateCharacterAttribute('lives', newLives);
            } else {
              // Fallback if updateCharacterAttribute is not available
              GameState.data.character.lives = newLives;
              
              // Emit event for UI update
              if (window.EventSystem) {
                EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, newLives);
              }
            }
            
            // Show feedback
            if (window.UiUtils) {
              UiUtils.showFloatingText(`+${value} Life`, 'success');
            }
            
            return true;
          }
          return false;
          
        case "insight_gain":
          if (window.GameState && GameState.data && GameState.data.character) {
            // Parse the base value
            let amount = parseInt(effect.value) || 10;
            
            // Apply insight boost if available
            if (GameState.data.insightBoost) {
              const boost = Math.floor(amount * (GameState.data.insightBoost / 100));
              amount += boost;
            }
            
            if (typeof GameState.updateCharacterAttribute === 'function') {
              GameState.updateCharacterAttribute('insight', 
                GameState.data.character.insight + amount);
            } else {
              // Fallback if updateCharacterAttribute is not available
              GameState.data.character.insight += amount;
              
              // Emit event for UI update
              if (window.EventSystem) {
                EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
              }
            }
            
            // Show feedback
            if (window.UiUtils) {
              UiUtils.showFloatingText(`+${amount} Insight`, 'success');
            }
            
            return true;
          }
          return false;
          
        case "eliminateOption":
          // Set flag for question component to use
          if (window.GameState && GameState.data) {
            if (!GameState.data.questionEffects) {
              GameState.data.questionEffects = {};
            }
            
            GameState.data.questionEffects.eliminateOption = true;
            
            // Show feedback
            if (window.UiUtils) {
              UiUtils.showToast("One incorrect option will be eliminated on your next question", 'primary');
            }
            
            return true;
          }
          return false;
          
        case "retry":
          // Emit event for components to handle
          if (window.EventSystem) {
            EventSystem.emit('retryQuestion', {});
            return true;
          }
          return false;
          
        default:
          console.log(`Unhandled effect type: ${effect.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error applying effect ${effect.type}:`, error);
      return false;
    }
  },
  
  // ===== ITEM MANAGEMENT =====
  
  // Use a consumable item with improved error handling
  useItem: function(itemId) {
    console.log(`Attempting to use item: ${itemId}`);
    
    // Ensure we're initialized
    if (!this.initialized) {
      this.initialize();
    }
    
    try {
      // Get inventory from GameState
      if (!window.GameState || !GameState.data) {
        console.error("GameState not available for item usage");
        return false;
      }
      
      const inventory = GameState.data.inventory || [];
      
      // Find the item in inventory
      const itemIndex = inventory.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        console.error(`Item with ID ${itemId} not found in inventory`);
        return false;
      }
      
      const item = inventory[itemIndex];
      
      // Don't allow using relics directly
      if (item.itemType === 'relic') {
        console.warn("Cannot use relics directly");
        return false;
      }
      
      // Apply effect
      if (item.effect) {
        const effectApplied = this.applyItemEffect(item.effect);
        if (!effectApplied) {
          console.error("Failed to apply item effect");
          return false;
        }
      } else {
        console.error("Item has no effect to apply");
        return false;
      }
      
      // Remove from inventory
      inventory.splice(itemIndex, 1);
      console.log(`Removed item at index ${itemIndex} from inventory`);
      
      // Save inventory changes
      if (window.ApiClient) {
        if (typeof ApiClient.saveInventory === 'function') {
          ApiClient.saveInventory({ inventory })
            .catch(err => console.error("Failed to save inventory after using item:", err));
        } else if (typeof ApiClient.saveGame === 'function') {
          ApiClient.saveGame()
            .catch(err => console.error("Failed to save game after using item:", err));
        }
      }
      
      // Emit item used event
      if (window.EventSystem) {
        EventSystem.emit(GAME_EVENTS.ITEM_USED, item);
      }
      
      console.log(`Successfully used item: ${itemId}`);
      return true;
    } catch (error) {
      console.error(`Error using item ${itemId}:`, error);
      return false;
    }
  },
  
  // Add a new item to the game (compatible with InventorySystem.addItem)
  addItem: function(item) {
    console.log("ItemManager adding item:", item);
    
    // Ensure we're initialized
    if (!this.initialized) {
      this.initialize();
    }
    
    try {
      // Check if GameState is available
      if (!window.GameState || !GameState.data) {
        console.error("GameState not available for inventory operations");
        return false;
      }
      
      // Ensure inventory exists
      if (!GameState.data.inventory) {
        GameState.data.inventory = [];
      }
      
      // Check for existing relic
      if (item.itemType === 'relic') {
        const existingRelic = GameState.data.inventory.find(i => i.id === item.id);
        if (existingRelic) {
          console.warn(`Relic ${item.name} (${item.id}) already exists in inventory. Not adding duplicate.`);
          if (window.UiUtils) {
            UiUtils.showToast(`You already have the ${item.name} relic.`, "warning");
          }
          return false;
        }
      }
      
      // Add the item to inventory
      GameState.data.inventory.push(item);
      
      // Store item definition
      if (item.itemType === 'relic') {
        this.relicDefinitions[item.id] = item;
        this.activeRelics[item.id] = item;
        this.applyRelicEffect(item);
      } else {
        this.itemDefinitions[item.id] = item;
      }
      
      // Save inventory changes
      if (window.ApiClient) {
        if (typeof ApiClient.saveInventory === 'function') {
          ApiClient.saveInventory({ inventory: GameState.data.inventory })
            .catch(err => console.error("Failed to save inventory after adding item:", err));
        } else if (typeof ApiClient.saveGame === 'function') {
          ApiClient.saveGame()
            .catch(err => console.error("Failed to save game after adding item:", err));
        }
      }
      
      // Emit item added event
      if (window.EventSystem) {
        EventSystem.emit(GAME_EVENTS.ITEM_ADDED, item);
        EventSystem.emit(GAME_EVENTS.ITEM_ADDED_SUCCESS, item);
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding item ${item.id}:`, error);
      return false;
    }
  },
  
  // ===== UTILITY FUNCTIONS =====
  
  // Check if an effect is active from relics
  hasActiveEffect: function(effectType) {
    // Check if any active relic has this effect type
    return Object.values(this.activeRelics).some(relic => 
      relic.effect && relic.effect.type === effectType);
  },
  
  // Get all active effects of a certain type
  getActiveEffects: function(effectType) {
    return Object.values(this.activeRelics)
      .filter(relic => relic.effect && relic.effect.type === effectType)
      .map(relic => relic.effect);
  },
  
  // Get available item by ID
  getItemById: function(itemId) {
    // Ensure we're initialized
    if (!this.initialized) {
      this.initialize();
    }
    
    // Try to get from inventory first
    if (window.GameState && GameState.data && GameState.data.inventory) {
      const item = GameState.data.inventory.find(i => i.id === itemId);
      if (item) return item;
    }
    
    // Try definitions
    return this.itemDefinitions[itemId] || this.relicDefinitions[itemId] || null;
  }
};

// Export globally
window.ItemManager = ItemManager;

// Auto-initialize at script load
if (typeof window !== 'undefined') {
  // Wait for DOM and GameState to be available
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      if (window.GameState && GameState.data) {
        ItemManager.initialize();
      }
    }, 500);
  });
}