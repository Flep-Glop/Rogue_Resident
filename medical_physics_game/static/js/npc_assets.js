// npc_assets.js - Animation and sprite data for all non-player characters

// Define NPCAssets globally
window.NPCAssets = {
    // NPC data by type
    npcs: {
      medicalBoss: {
        name: "Medical Physics Examiner",
        description: "A stern medical physics expert evaluating your knowledge.",
        imagePath: "/static/img/characters/resident/idle.png", // Replace with actual boss image path
        spritePath: "/static/img/characters/resident/", // Using resident sprites temporarily
        animations: {
          idle: {
            file: "idle.png", 
            frames: 8,
            width: 97,
            height: 864,  // Total height of all frames
            speed: 150 
          },
          walking: {
            file: "walking.png", 
            frames: 10, 
            width: 97,
            height: 1080,
            speed: 150
          },
          ability: {
            file: "ability.png", 
            frames: 18, 
            width: 97,
            height: 1944,
            speed: 150
          },
          specialAbility: {
            file: "special_ability.png", 
            frames: 9, 
            width: 97,
            height: 972,
            speed: 150
          }
        }
      },
      
      // Add more NPCs as needed
      shopkeeper: {
        name: "Equipment Vendor",
        description: "A knowledgeable vendor of medical physics equipment.",
        imagePath: "/static/img/npcs/shopkeeper/portrait.png", // Replace with actual path when available
        spritePath: "/static/img/npcs/shopkeeper/", // Replace with actual path when available
        animations: {
          idle: {
            file: "idle.png", 
            frames: 4,
            width: 96,
            height: 384,
            speed: 200
          }
          // Add more animations when available
        }
      }
    },
    
    // Get all NPC type keys
    getNPCKeys: function() {
      return Object.keys(this.npcs);
    },
    
    // Get NPC data by key
    getNPC: function(key) {
      return this.npcs[key] || null;
    },
    
    // Get NPC portrait image path
    getNPCImagePath: function(key) {
      const npc = this.getNPC(key);
      return npc ? npc.imagePath : '/static/img/placeholder.png';
    },
    
    // Get sprite path for a specific animation
    getNPCSpritePath: function(key, animation = "idle") {
      const npc = this.getNPC(key);
      if (!npc || !npc.animations || !npc.animations[animation]) {
        return null; // Animation not found
      }
      
      return npc.spritePath + npc.animations[animation].file;
    },
    
    // Get animation data for an NPC
    getNPCAnimation: function(key, animation = "idle") {
      const npc = this.getNPC(key);
      if (!npc || !npc.animations) return null;
      
      return npc.animations[animation] || npc.animations.idle;
    },
    
    // Get all available animations for an NPC
    getNPCAnimations: function(key) {
      const npc = this.getNPC(key);
      if (!npc || !npc.animations) return [];
      
      return Object.keys(npc.animations);
    },
    
    // Get NPC name by key
    getNPCName: function(key) {
      const npc = this.getNPC(key);
      return npc ? npc.name : 'Unknown NPC';
    },
    
    // Get NPC description by key
    getNPCDescription: function(key) {
      const npc = this.getNPC(key);
      return npc ? npc.description : '';
    }
  };
  
  console.log("NPCAssets initialized with sprite animation data");
  
  // Export NPCAssets to make sure it's globally available
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NPCAssets;
  }