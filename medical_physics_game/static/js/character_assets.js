// character_assets.js - Modified to prevent redeclaration issues

// Define CharacterAssets globally to avoid scope issues
// Check if it's already defined first
if (typeof window.CharacterAssets === 'undefined') {
    // Define CharacterAssets as a global object
    window.CharacterAssets = {
      // Character data
      characters: {
        physicist: {
          name: "Medical Physicist",
          description: "Specializes in physics concepts and measurements.",
          imagePath: "/static/img/characters/physicist.png",
          stats: {
            startingInsight: 50,
            startingLives: 3,
            maxLives: 5
          },
          perks: [
            "Starts with extra insight",
            "Better understanding of radiation physics"
          ]
        },
        resident: {
          name: "Resident Physician",
          description: "Medical doctor in radiation oncology training.",
          imagePath: "/static/img/characters/resident.png",
          stats: {
            startingInsight: 30,
            startingLives: 4,
            maxLives: 6
          },
          perks: [
            "More resilient to mistakes",
            "Better at patient cases"
          ]
        },
        qa_specialist: {
          name: "QA Specialist",
          description: "Expert in quality assurance procedures.",
          imagePath: "/static/img/characters/qa_specialist.png",
          stats: {
            startingInsight: 40,
            startingLives: 3,
            maxLives: 5
          },
          perks: [
            "Finds more errors in setups",
            "Better at practical questions"
          ]
        }
      },
  
      // Character progression data
      progression: {
        levelThresholds: [0, 100, 250, 450, 700, 1000, 1500, 2000, 3000, 5000],
        
        unlockables: {
          level2: {
            characters: ["resident"],
            items: ["basic_manual"]
          },
          level3: {
            characters: ["qa_specialist"],
            items: ["advanced_dosimeter"]
          }
        }
      },
      
      // Get all character keys
      getCharacterKeys: function() {
        return Object.keys(this.characters);
      },
      
      // Get character data by key
      getCharacter: function(key) {
        return this.characters[key] || null;
      },
      
      // Get progression level based on experience
      getProgressionLevel: function(experience) {
        const thresholds = this.progression.levelThresholds;
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (experience >= thresholds[i]) {
            return i;
          }
        }
        return 0;
      }
    };
    
    console.log("CharacterAssets initialized");
  } else {
    console.warn("CharacterAssets already defined, using existing definition");
  }
  
  // Export CharacterAssets to make sure it's globally available
  // This is redundant but ensures compatibility with different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CharacterAssets;
  }