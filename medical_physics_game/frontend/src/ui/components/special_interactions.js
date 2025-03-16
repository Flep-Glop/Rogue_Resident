// special_interactions.js - Handles higher-level interactions between game systems

// SpecialInteractions singleton - coordinates complex game interactions
const SpecialInteractions = {
    // Initialize and bind to events
    initialize: function() {
      console.log("Initializing special interactions system...");
      
      // Subscribe to key events
      EventSystem.on(GAME_EVENTS.CHARACTER_UPDATED, this.onCharacterUpdated.bind(this));
      EventSystem.on(GAME_EVENTS.FLOOR_CHANGED, this.onFloorChanged.bind(this));
      EventSystem.on(GAME_EVENTS.ITEM_ADDED, this.onItemAdded.bind(this));
      EventSystem.on('abilityUsed', this.onAbilityUsed.bind(this));
      
      // Custom event for handling medical emergencies
      EventSystem.on('medicalEmergency', this.handleMedicalEmergency.bind(this));
      
      return this;
    },
    
    // Character level up handler
    onCharacterUpdated: function(character) {
      // Check for level up condition
      if (character && character.level > GameState.previousLevel) {
        console.log(`Character leveled up to ${character.level}!`);
        
        // Save previous level for comparison
        GameState.previousLevel = character.level;
        
        // Show level up feedback
        UiUtils.showFloatingText(`Leveled up to ${character.level}!`, 'success');
        
        // Apply level-up bonuses
        this.applyLevelUpBonuses(character);
      }
    },
    
    // Apply bonuses when character levels up
    applyLevelUpBonuses: function(character) {
      // Fetch character data to get level bonuses
      fetch('/api/characters')
        .then(response => response.json())
        .then(data => {
          // Find the matching character
          const characterData = data.characters.find(c => c.name === character.name);
          if (!characterData) return;
          
          // Find level bonuses
          const levelBonus = characterData.level_bonuses.find(
            lb => lb.level === character.level
          );
          
          if (levelBonus && levelBonus.bonus) {
            const bonus = levelBonus.bonus;
            
            // Apply max lives bonus
            if (bonus.max_lives) {
              GameState.data.character.max_lives += bonus.max_lives;
              GameState.data.character.lives += bonus.max_lives;
              UiUtils.showFloatingText(`+${bonus.max_lives} Maximum Lives!`, 'success');
              EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
            }
            
            // Apply insight bonus
            if (bonus.insight) {
              GameState.data.character.insight += bonus.insight;
              UiUtils.showFloatingText(`+${bonus.insight} Insight!`, 'success');
              EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
            }
            
            // Save game state
            if (typeof ApiClient !== 'undefined' && ApiClient.saveGame) {
              ApiClient.saveGame().catch(err => console.error("Failed to save after level up:", err));
            }
          }
        })
        .catch(error => {
          console.error('Error fetching character data for level up:', error);
        });
    },
    
    // Handle floor changes
    onFloorChanged: function(floorNumber) {
      console.log(`Floor changed to ${floorNumber}`);
      
      // Show floor transition animation
      UiUtils.showFloorTransition(floorNumber);
      
      // Reset ability uses when floor changes
      if (GameState.data.character && 
          GameState.data.character.special_ability) {
        // Reset uses to per-floor amount
        const usesPerFloor = GameState.data.character.special_ability.uses_per_floor || 1;
        GameState.data.character.special_ability.remaining_uses = usesPerFloor;
        
        // Update ability button if it exists
        if (typeof CharacterPanel !== 'undefined' && 
            typeof CharacterPanel.updateSpecialAbility === 'function') {
          CharacterPanel.updateSpecialAbility(GameState.data.character.special_ability);
        }
      }
      
      // Apply floor effects
      this.applyFloorEffects(floorNumber);
    },
    
    // Apply effects specific to the current floor
    applyFloorEffects: function(floorNumber) {
      // Fetch floor data
      fetch(`/api/floor/${floorNumber}`)
        .then(response => response.json())
        .then(floorData => {
          // Apply floor-specific effects
          if (floorData.effects) {
            floorData.effects.forEach(effect => {
              this.applyEffect(effect);
            });
          }
          
          // Show floor name in UI
          const floorNameElement = document.getElementById('floor-name');
          if (floorNameElement && floorData.name) {
            floorNameElement.textContent = floorData.name;
          }
          
          // Update difficulty display if floor changes it
          const difficultyModifier = floorData.difficulty_modifier;
          if (difficultyModifier) {
            console.log(`Floor ${floorNumber} applies difficulty modifier: ${difficultyModifier}`);
            // Update UI or game state as needed
          }
        })
        .catch(error => {
          console.error(`Error fetching floor ${floorNumber} data:`, error);
        });
    },
    
    // Handle adding items to inventory
    onItemAdded: function(item) {
      console.log("Item added to inventory:", item);
      
      // Apply passive effects if item has them
      if (item.effect && item.effect.duration === "permanent") {
        this.applyPassiveItemEffect(item);
      }
    },
    
    // Apply passive effects from items
    applyPassiveItemEffect: function(item) {
      if (!item.effect) return;
      
      const effect = item.effect;
      
      switch (effect.type) {
        case "extra_life":
          // Max lives already increased when item is added in InventorySystem
          console.log(`Applied passive effect: ${effect.value}`);
          break;
          
        case "category_boost":
          // Store category boost for later use in question answering
          if (!GameState.data.categoryBoosts) {
            GameState.data.categoryBoosts = [];
          }
          
          GameState.data.categoryBoosts.push({
            itemId: item.id,
            effect: effect.value
          });
          
          console.log(`Applied category boost: ${effect.value}`);
          break;
          
        case "defense":
          // Store defense boost for damage reduction
          if (!GameState.data.defenseEffects) {
            GameState.data.defenseEffects = [];
          }
          
          GameState.data.defenseEffects.push({
            itemId: item.id,
            effect: effect.value
          });
          
          console.log(`Applied defense effect: ${effect.value}`);
          break;
      }
    },
    
    // Handle ability usage
    onAbilityUsed: function(data) {
      console.log("Special ability used:", data);
      
      // Handle ability effects
      switch (data.abilityName) {
        case "Literature Review":
          // Skip question handled in CharacterPanel
          break;
        
        case "Peer Review":
          // Show correct answer for current question
          if (typeof NodeInteraction !== 'undefined' && 
              typeof NodeInteraction.currentQuestion !== 'undefined' &&
              NodeInteraction.currentQuestion) {
            
            // Get correct answer
            const correctIndex = NodeInteraction.currentQuestion.correct;
            
            // Highlight the correct option in the UI
            if (correctIndex !== undefined) {
              const optionsContainer = document.getElementById('options-container');
              if (optionsContainer && optionsContainer.children[correctIndex]) {
                const correctOption = optionsContainer.children[correctIndex];
                
                // Add visual indicator
                correctOption.classList.add('peer-reviewed');
                correctOption.style.border = '2px solid #56b886';
                
                // Add "Correct Answer" badge
                const badge = document.createElement('span');
                badge.className = 'badge bg-success float-end';
                badge.textContent = 'Correct Answer';
                correctOption.appendChild(badge);
              }
            }
          }
          break;
        
        case "Measurement Uncertainty":
          // Allow retry of failed question
          if (GameState.data.currentNode && 
              document.getElementById('question-result')) {
            
            // Enable the options again
            const options = document.querySelectorAll('.option-btn');
            options.forEach(opt => {
              opt.disabled = false;
              opt.classList.remove('btn-danger', 'btn-success');
              opt.classList.add('btn-outline-primary');
            });
            
            // Hide the result
            const resultDiv = document.getElementById('question-result');
            resultDiv.style.display = 'none';
            
            // Hide continue button
            const continueBtn = document.getElementById('continue-btn');
            if (continueBtn) {
              continueBtn.style.display = 'none';
            }
            
            // Provide feedback
            UiUtils.showFloatingText('Question reset - try again!', 'success');
          }
          break;
      }
    },
    
    // Apply a generic game effect
    applyEffect: function(effect) {
      if (!effect || !effect.type) return;
      
      switch (effect.type) {
        case 'insight_gain':
          if (GameState.data.character) {
            GameState.data.character.insight += effect.value;
            EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
            UiUtils.showFloatingText(`+${effect.value} Insight`, 'success');
          }
          break;
          
        case 'insight_loss':
          if (GameState.data.character) {
            GameState.data.character.insight = Math.max(0, GameState.data.character.insight - effect.value);
            EventSystem.emit(GAME_EVENTS.INSIGHT_CHANGED, GameState.data.character.insight);
            UiUtils.showFloatingText(`-${effect.value} Insight`, 'danger');
          }
          break;
          
        case 'gain_life':
          if (GameState.data.character) {
            const maxLives = GameState.data.character.max_lives;
            GameState.data.character.lives = Math.min(maxLives, GameState.data.character.lives + effect.value);
            EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
            UiUtils.showFloatingText(`+${effect.value} Life`, 'success');
          }
          break;
          
        case 'lose_life':
          if (GameState.data.character) {
            GameState.data.character.lives -= effect.value;
            EventSystem.emit(GAME_EVENTS.LIVES_CHANGED, GameState.data.character.lives);
            UiUtils.showFloatingText(`-${effect.value} Life`, 'danger');
            
            // Check for game over
            if (GameState.data.character.lives <= 0) {
              // Use timeout for visual feedback
              setTimeout(() => {
                if (typeof NodeInteraction !== 'undefined' && 
                    typeof NodeInteraction.showGameOver === 'function') {
                  NodeInteraction.showGameOver();
                }
              }, 1000);
            }
          }
          break;
          
        case 'gain_item':
          fetch(`/api/item/${effect.value}`)
            .then(response => response.json())
            .then(itemData => {
              if (itemData) {
                EventSystem.emit(GAME_EVENTS.ITEM_ADDED, itemData);
                UiUtils.showFloatingText(`Gained ${itemData.name}!`, 'success');
              }
            })
            .catch(error => console.error('Error fetching item:', error));
          break;
      }
    },
    
    // Handle medical emergency events (custom game event for educational value)
    handleMedicalEmergency: function(emergencyData) {
      console.log("Medical emergency event:", emergencyData);
      
      // Create modal with emergency scenario
      const modalHTML = `
        <div id="emergency-modal" class="game-modal" style="display:flex;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>${emergencyData.title || 'Medical Emergency'}</h3>
              <button class="close-modal" id="close-emergency-modal">&times;</button>
            </div>
            <div class="modal-body">
              <p>${emergencyData.description}</p>
              <div id="emergency-options" class="mt-3"></div>
            </div>
          </div>
        </div>
      `;
      
      // Add to DOM
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Get options container
      const optionsContainer = document.getElementById('emergency-options');
      
      // Add options
      if (emergencyData.options && optionsContainer) {
        emergencyData.options.forEach((option, index) => {
          const optionBtn = document.createElement('button');
          optionBtn.className = 'btn btn-outline-primary mb-2 w-100 text-start';
          optionBtn.textContent = option.text;
          
          // Add click handler
          optionBtn.addEventListener('click', () => {
            // Apply outcome
            if (option.outcome && option.outcome.effect) {
              this.applyEffect(option.outcome.effect);
            }
            
            // Show result
            const resultDiv = document.createElement('div');
            resultDiv.className = 'alert alert-info mt-3';
            resultDiv.innerHTML = `
              <p>${option.outcome.description}</p>
              <div class="mt-3">
                <button id="continue-emergency" class="btn btn-primary">Continue</button>
              </div>
            `;
            
            // Replace options with result
            optionsContainer.innerHTML = '';
            optionsContainer.appendChild(resultDiv);
            
            // Add continue button handler
            document.getElementById('continue-emergency').addEventListener('click', () => {
              document.getElementById('emergency-modal').remove();
            });
          });
          
          optionsContainer.appendChild(optionBtn);
        });
      }
      
      // Add close button event
      document.getElementById('close-emergency-modal').addEventListener('click', () => {
        document.getElementById('emergency-modal').remove();
      });
    }
  };
  
  // Export globally
  window.SpecialInteractions = SpecialInteractions;