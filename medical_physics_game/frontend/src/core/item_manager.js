// item_manager.js - Central management for items and relics

const ItemManager = {
    // Storage for definitions
    itemDefinitions: {},
    relicDefinitions: {},
    
    // Track active relics and their effects
    activeRelics: {},
    
    // Initialize the system
    initialize: function() {
      console.log("Initializing item manager...");
      
      // Subscribe to events
      EventSystem.on(GAME_EVENTS.ITEM_ADDED, this.onItemAdded.bind(this));
      EventSystem.on(GAME_EVENTS.RELIC_ADDED, this.onRelicAdded.bind(this));
      
      return this;
    },
    
    // Load item definitions (call this when needed)
    loadItemDefinition: function(itemId) {
      return fetch(`/api/item/${itemId}`)
        .then(response => response.json())
        .then(item => {
          this.itemDefinitions[itemId] = item;
          return item;
        });
    },
    
    // Load relic definitions (call this when needed)
    loadRelicDefinition: function(relicId) {
      return fetch(`/api/relic/${relicId}`)
        .then(response => response.json())
        .then(relic => {
          this.relicDefinitions[relicId] = relic;
          return relic;
        });
    },
    
    // Handle adding an item to inventory
    onItemAdded: function(item) {
      console.log("Item added:", item);
      
      // Store definition
      this.itemDefinitions[item.id] = item;
    },
    
    // Handle adding a relic to inventory
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
        case "insight_gain":
          if (GameState.data.character) {
            GameState.updateCharacterAttribute('insight', 
              GameState.data.character.insight + effect.value);
          }
          break;
          
        case "extra_life":
          if (GameState.data.character) {
            GameState.updateCharacterAttribute('max_lives', 
              GameState.data.character.max_lives + effect.value);
            GameState.updateCharacterAttribute('lives', 
              GameState.data.character.lives + effect.value);
          }
          break;
          
        case "category_boost":
          if (!GameState.data.categoryBoosts) {
            GameState.data.categoryBoosts = [];
          }
          
          GameState.data.categoryBoosts.push({
            relicId: relic.id,
            effect: effect.value
          });
          break;
          
        case "defense":
          if (!GameState.data.defenseEffects) {
            GameState.data.defenseEffects = [];
          }
          
          GameState.data.defenseEffects.push({
            relicId: relic.id,
            effect: effect.value
          });
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
              GameState.data.character.lives + effect.value
            );
            GameState.updateCharacterAttribute('lives', newLives);
          }
          break;
          
        case "insight_gain":
          if (GameState.data.character) {
            GameState.updateCharacterAttribute('insight', 
              GameState.data.character.insight + effect.value);
          }
          break;
          
        case "retry":
          // Emit event for components to handle
          EventSystem.emit('retryQuestion', {});
          break;
          
        // Add more effect types as needed
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