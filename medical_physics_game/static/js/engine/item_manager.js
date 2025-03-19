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
    EventSystem.on(GAME_EVENTS.ITEM_ADDED, this.onItemAdded.bind(this));
    EventSystem.on(GAME_EVENTS.ITEM_USED, this.onItemUsed.bind(this));
    EventSystem.on(GAME_EVENTS.RELIC_ADDED, this.onRelicAdded.bind(this));
    
    // Pre-load item definitions for better performance
    this.preloadItemDefinitions();
    
    return this;
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
        "iconPath": "textbook.png",
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
        "iconPath": "badge.png",
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
        "iconPath": "glasses.png",
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
        "iconPath": "notebook.png",
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
    fetch('/api/item/all')
      .then(response => response.json())
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
      
    fetch('/api/relic/all')
      .then(response => response.json())
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
      .then(response => response.json())
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
      .then(response => response.json())
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
    
    // Notify UI that an item was added successfully
    EventSystem.emit(GAME_EVENTS.ITEM_ADDED_SUCCESS, item);
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
        UiUtils.showToast(`Relic activated: +${effect.value}% Insight from all sources`, 'success');
        break;
        
      case "second_chance":
        // Store the second chance flag in game state
        GameState.data.hasSecondChance = true;
        
        // Show notification
        UiUtils.showToast("Relic activated: You now get a second chance on questions", 'success');
        break;
        
      case "extra_life":
        if (GameState.data.character) {
          GameState.updateCharacterAttribute('max_lives', 
            GameState.data.character.max_lives + effect.value);
          GameState.updateCharacterAttribute('lives', 
            GameState.data.character.lives + effect.value);
        }
        break;
    }
  },
  
  // Use a consumable item
  useItem: function(itemId) {
    // Get item definition
    const item = this.itemDefinitions[itemId];
    if (!item) {
      console.error(`Cannot use item: ${itemId} - definition not found`);
      return false;
    }
    
    console.log(`Using item: ${itemId}`);
    
    // Apply effect
    if (item.effect) {
      this.applyItemEffect(item.effect);
    }
    
    // Remove from inventory (find index first)
    if (GameState.data.inventory) {
      const index = GameState.data.inventory.findIndex(i => i.id === itemId);
      if (index !== -1) {
        GameState.removeInventoryItem(index);
      }
    }
    
    // Emit item used event
    EventSystem.emit(GAME_EVENTS.ITEM_USED, item);
    
    return true;
  },
  
  // Apply a consumable item's effect
  applyItemEffect: function(effect) {
    if (!effect || !effect.type) return;
    
    console.log(`Applying item effect:`, effect);
    
    switch (effect.type) {
      case "heal":
        if (GameState.data.character) {
          const newLives = Math.min(
            GameState.data.character.max_lives,
            GameState.data.character.lives + parseInt(effect.value) || 1
          );
          GameState.updateCharacterAttribute('lives', newLives);
          
          // Show feedback
          UiUtils.showFloatingText(`+${effect.value} Life`, 'success');
        }
        break;
        
      case "insight_gain":
        if (GameState.data.character) {
          // Apply insight boost if available
          let amount = parseInt(effect.value) || 10;
          if (GameState.data.insightBoost) {
            const boost = Math.floor(amount * (GameState.data.insightBoost / 100));
            amount += boost;
          }
          
          GameState.updateCharacterAttribute('insight', 
            GameState.data.character.insight + amount);
          
          // Show feedback
          UiUtils.showFloatingText(`+${amount} Insight`, 'success');
        }
        break;
        
      case "eliminateOption":
        // Set flag for question component to use
        if (!GameState.data.questionEffects) {
          GameState.data.questionEffects = {};
        }
        
        GameState.data.questionEffects.eliminateOption = true;
        
        // Show feedback
        UiUtils.showToast("One incorrect option will be eliminated on your next question", 'primary');
        break;
        
      case "retry":
        // Emit event for components to handle
        EventSystem.emit('retryQuestion', {});
        break;
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
  }
};

// Export globally
window.ItemManager = ItemManager;