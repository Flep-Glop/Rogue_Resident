// Enhanced item_manager.js with improved functionality for items and relics

const ItemManager = {
  // Storage for definitions
  itemDefinitions: {},
  relicDefinitions: {},
  
  // Track active relics and their effects
  activeRelics: {},
  
  // Initialize the system
  initialize: function() {
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

  // Load items from API
  loadItemsFromApi: function() {
    fetch('/api/item/all')
      .then(response => {
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(items => {
        if (Array.isArray(items) && items.length > 0) {
          items.forEach(item => {
            this.itemDefinitions[item.id] = item;
          });
          console.log(`Loaded ${items.length} items from API`);
        }
      })
      .catch(error => {
        console.warn("Failed to load items from API, using defaults", error);
      });
  },

  // Load relics from API
  loadRelicsFromApi: function() {
    fetch('/api/relic/all')
      .then(response => {
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(relics => {
        if (Array.isArray(relics) && relics.length > 0) {
          relics.forEach(relic => {
            this.relicDefinitions[relic.id] = relic;
          });
          console.log(`Loaded ${relics.length} relics from API`);
        }
      })
      .catch(error => {
        console.warn("Failed to load relics from API, using defaults", error);
      });
  },
  
  // Load item definitions
  loadItemDefinition: function(itemId) {
    // If already loaded, return it
    if (this.itemDefinitions[itemId]) {
      return Promise.resolve(this.itemDefinitions[itemId]);
    }
    
    // Otherwise fetch from API
    return fetch(`/api/item/${itemId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        return response.json();
      })
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
  },
  
  // Load relic definitions
  loadRelicDefinition: function(relicId) {
    // If already loaded, return it
    if (this.relicDefinitions[relicId]) {
      return Promise.resolve(this.relicDefinitions[relicId]);
    }
    
    return fetch(`/api/relic/${relicId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(relic => {
        this.relicDefinitions[relicId] = relic;
        return relic;
      })
      .catch(error => {
        console.error(`Failed to load relic definition for ${relicId}`, error);
        // Return a default relic as fallback
        return {
          id: relicId,
          name: "Unknown Relic",
          description: "A relic with mysterious properties.",
          rarity: "common",
          effect: { type: "unknown", value: "Unknown effect" }
        };
      });
  },
  
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
  
  // Apply a relic's effect
  applyRelicEffect: function(relic) {
    if (!relic || !relic.effect) return;
    
    const effect = relic.effect;
    console.log(`Applying relic effect: ${relic.id}`, effect);
    
    switch (effect.type) {
      case "insight_boost":
        // Store the boost percentage in game state
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
  },
  
  // Use a consumable item
  useItem: function(itemId) {
    console.log(`Attempting to use item: ${itemId}`);
    
    // Get inventory from GameState
    const inventory = window.GameState?.data?.inventory || [];
    
    // Find the item in inventory
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      console.error(`Item with ID ${itemId} not found in inventory`);
      return false;
    }
    
    const item = inventory[itemIndex];
    
    // Apply effect
    if (item.effect) {
      this.applyItemEffect(item.effect);
    }
    
    // Remove from inventory if consumable
    if (item.itemType === 'consumable') {
      // Remove from GameState inventory
      if (typeof GameState.removeInventoryItem === 'function') {
        GameState.removeInventoryItem(itemIndex);
      } else {
        // Fallback if removeInventoryItem is not available
        inventory.splice(itemIndex, 1);
        
        // Save updated inventory
        if (window.ApiClient && ApiClient.saveInventory) {
          ApiClient.saveInventory({ inventory });
        }
      }
    }
    
    // Emit item used event
    if (window.EventSystem) {
      EventSystem.emit(GAME_EVENTS.ITEM_USED, item);
    }
    
    console.log(`Successfully used item: ${itemId}`);
    return true;
  },
  
  // Apply a consumable item's effect
  applyItemEffect: function(effect) {
    if (!effect || !effect.type) return;
    
    console.log(`Applying item effect:`, effect);
    
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
            
            // Save game state
            if (window.ApiClient && ApiClient.saveGame) {
              ApiClient.saveGame();
            }
          }
          
          // Show feedback
          if (window.UiUtils) {
            UiUtils.showFloatingText(`+${value} Life`, 'success');
          }
        }
        break;
        
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
            
            // Save game state
            if (window.ApiClient && ApiClient.saveGame) {
              ApiClient.saveGame();
            }
          }
          
          // Show feedback
          if (window.UiUtils) {
            UiUtils.showFloatingText(`+${amount} Insight`, 'success');
          }
        }
        break;
        
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
        }
        break;
        
      case "retry":
        // Emit event for components to handle
        if (window.EventSystem) {
          EventSystem.emit('retryQuestion', {});
        }
        break;
        
      default:
        console.log(`Unhandled effect type: ${effect.type}`);
    }
  },
  
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