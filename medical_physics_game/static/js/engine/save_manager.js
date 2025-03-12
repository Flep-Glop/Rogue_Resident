// save_manager.js - Handles game saves and loads

// SaveManager singleton - manages save/load functionality
const SaveManager = {
  // Save metadata
  saves: [],
  
  // Initialize save manager
  initialize: function() {
    console.log("Initializing save manager...");
    
    // Add save/load related event handlers
    this.setupEventListeners();
    
    return this;
  },
  
  // Setup event listeners for save/load UI
  setupEventListeners: function() {
    // Add event handler for save button if it exists
    const saveBtn = document.getElementById('save-game-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', this.createSave.bind(this));
    }
    
    // Add event handler for load game button if it exists
    const loadBtn = document.getElementById('load-game-btn');
    if (loadBtn) {
      loadBtn.addEventListener('click', this.showLoadDialog.bind(this));
    }
    
    // Listen for auto-save events
    EventSystem.on(GAME_EVENTS.NODE_COMPLETED, () => {
      this.autoSave();
    });
    
    EventSystem.on(GAME_EVENTS.FLOOR_CHANGED, () => {
      this.autoSave();
    });
  },
  
  // Auto-save the game after important events
  autoSave: function() {
    console.log("Auto-saving game...");
    
    // Don't show UI feedback for auto-saves to avoid spamming
    ApiClient.saveGame()
      .catch(error => {
        console.error("Error auto-saving game:", error);
      });
  },
  
  // Create a new manual save with UI feedback
  createSave: function() {
    console.log("Creating save...");
    
    // Get current game state
    const currentState = GameState.getState();
    
    // Call API to create save
    ApiClient.saveGame()
      .then(data => {
        if (data.save_id) {
          UiUtils.showToast(`Game saved successfully! ID: ${data.save_id.slice(0, 8)}...`, 'success');
          
          // Emit save created event
          EventSystem.emit('gameSaved', { saveId: data.save_id });
        } else {
          throw new Error("No save ID returned");
        }
      })
      .catch(error => {
        console.error("Error saving game:", error);
        UiUtils.showToast("Failed to save game: " + error.message, 'danger');
      });
  },
  
  // Load a save by ID
  loadSave: function(saveId) {
    console.log(`Loading save: ${saveId}`);
    
    // Call API to load save
    ApiClient.loadGame(saveId)
      .then(gameState => {
        // Re-initialize game with loaded state
        window.location.reload();
      })
      .catch(error => {
        console.error("Error loading save:", error);
        UiUtils.showToast("Failed to load save: " + error.message, 'danger');
      });
  },
  
  // Show load game dialog
  showLoadDialog: function() {
    console.log("Showing load dialog...");
    
    // Create load dialog element
    const dialogHTML = `
      <div id="load-game-modal" class="game-modal" style="display:flex;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Load Game</h3>
            <button class="close-modal" id="close-load-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div id="load-saves-list" class="saves-list">
              <p>Loading saves...</p>
            </div>
            <div class="mt-3">
              <button id="close-load-dialog" class="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // Add close button events
    document.getElementById('close-load-modal').addEventListener('click', () => {
      document.getElementById('load-game-modal').remove();
    });
    
    document.getElementById('close-load-dialog').addEventListener('click', () => {
      document.getElementById('load-game-modal').remove();
    });
    
    // Load and display saves
    this.fetchSaves();
  },
  
  // Fetch all saves from server
  fetchSaves: function() {
    // Example implementation - in a real game, this would fetch from the server
    const savesList = document.getElementById('load-saves-list');
    if (!savesList) return;
    
    // Placeholder for fetching saves
    // In a real implementation, this would call an API endpoint
    savesList.innerHTML = '<p>No saved games found.</p>';
    
    // Example of how to display saves:
    /*
    fetch('/api/saved-games')
      .then(response => response.json())
      .then(data => {
        this.saves = data;
        
        if (data.length === 0) {
          savesList.innerHTML = '<p>No saved games found.</p>';
          return;
        }
        
        savesList.innerHTML = '';
        
        data.forEach(save => {
          const saveItem = document.createElement('div');
          saveItem.className = 'save-item';
          
          const date = new Date(save.timestamp);
          const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
          
          saveItem.innerHTML = `
            <div class="save-details">
              <h4>Save ${save.id.slice(0, 8)}...</h4>
              <p>Floor ${save.floor} - ${formattedDate}</p>
            </div>
            <button class="btn btn-primary load-save-btn" data-save-id="${save.id}">Load</button>
          `;
          
          savesList.appendChild(saveItem);
        });
        
        // Add click handlers for load buttons
        document.querySelectorAll('.load-save-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const saveId = btn.getAttribute('data-save-id');
            this.loadSave(saveId);
          });
        });
      })
      .catch(error => {
        console.error("Error fetching saves:", error);
        savesList.innerHTML = '<p class="text-danger">Error fetching saves: ' + error.message + '</p>';
      });
    */
  },
  
  // Delete a save by ID
  deleteSave: function(saveId) {
    console.log(`Deleting save: ${saveId}`);
    
    // TODO: Implement API call to delete save
    
    // Refresh saves list
    this.fetchSaves();
  },
  
  // Quick-save using keyboard shortcut (F5)
  setupQuickSaveHotkey: function() {
    document.addEventListener('keydown', (e) => {
      // F5 key for quick save (prevent default browser refresh)
      if (e.key === 'F5') {
        e.preventDefault();
        this.createSave();
      }
    });
  }
};

// Export globally
window.SaveManager = SaveManager;