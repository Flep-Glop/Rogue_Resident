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
  

// Add the Ion Chamber Professor to NPCs
NPCAssets.npcs.ionChamberBoss = {
    name: "Professor Ionix",
    description: "A sentient ion chamber that was altered in a radiation accident. Now endowed with consciousness, it tests medical physics residents on their knowledge.",
    imagePath: "/static/img/characters/ion_chamber.png", // You'll need to create this image
    spritePath: "/static/img/characters/ion_chamber/", // Directory for sprites
    animations: {
      idle: {
        file: "idle.png", 
        frames: 8,
        width: 97,
        height: 864,
        speed: 150 
      },
      ability: {
        file: "ability.png", 
        frames: 10, 
        width: 97,
        height: 1080,
        speed: 120
      },
      walking: {
        file: "walking.png", 
        frames: 8, 
        width: 97,
        height: 864,
        speed: 150
      },
      specialAbility: {
        file: "special_ability.png", 
        frames: 9, 
        width: 97,
        height: 972,
        speed: 100
      }
    },
    dialogue: {
      intro: [
        "Welcome to your Radiation Metrology examination. I am Professor Ionix.",
        "As a sentient ion chamber, I have the unique ability to measure your knowledge directly.",
        "Let's see if your understanding of medical physics is... ionizing enough."
      ],
      correct: [
        "Your answer is highly charged with accuracy!",
        "Correct! Your knowledge shows no signs of recombination.",
        "Yes! You've collected the right electrons from your memory.",
        "Accurate! Your signal-to-noise ratio is impressive."
      ],
      incorrect: [
        "Hmm, there seems to be saturation in your reasoning.",
        "Incorrect. Your answer lacks proper calibration.",
        "No - that answer shows significant ion collection inefficiency.",
        "Wrong. Perhaps you're operating in the wrong region of the knowledge curve."
      ],
      phase_transition: [
        "Let's increase the potential and move to the next section.",
        "Now we'll probe your knowledge with higher energy questions.",
        "Your confidence shows good linearity so far. Let's test its limits."
      ],
      completion: {
        success: "Excellent! Your performance shows proportional region precision. You'll make a fine medical physicist.",
        failure: "Your response curve needs recalibration. I recommend more study before our next measurement."
      }
    }
  };
  
  // Make a helper function to get random dialogue for the boss
  NPCAssets.getRandomDialogue = function(npcKey, dialogueType) {
    const npc = this.getNPC(npcKey);
    if (!npc || !npc.dialogue || !npc.dialogue[dialogueType]) {
      return null;
    }
    
    const dialogues = npc.dialogue[dialogueType];
    if (Array.isArray(dialogues)) {
      const randomIndex = Math.floor(Math.random() * dialogues.length);
      return dialogues[randomIndex];
    }
    return dialogues; // If it's not an array, return directly
  };


  console.log("NPCAssets initialized with sprite animation data");
  
  // Export NPCAssets to make sure it's globally available
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NPCAssets;
  }