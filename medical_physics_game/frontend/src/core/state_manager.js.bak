// frontend/src/core/state_manager.js
class GameStateManager {
    constructor() {
        this.state = {
            user: null,
            gameState: null,
            uiState: {
                currentScreen: 'title',
                activeModal: null,
                notifications: []
            },
            loadingState: {
                isLoading: false,
                loadingMessage: ''
            }
        };
        
        this.listeners = [];
    }
    
    getState() {
        return this.state;
    }
    
    setState(newState) {
        this.state = {...this.state, ...newState};
        this._notifyListeners();
    }
    
    updateGameState(gameState) {
        this.state.gameState = gameState;
        this._notifyListeners();
    }
    
    setScreen(screenName) {
        this.state.uiState.currentScreen = screenName;
        this._notifyListeners();
    }
    
    openModal(modalName, modalData = {}) {
        this.state.uiState.activeModal = {
            name: modalName,
            data: modalData
        };
        this._notifyListeners();
    }
    
    closeModal() {
        this.state.uiState.activeModal = null;
        this._notifyListeners();
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        this.state.uiState.notifications.push(notification);
        this._notifyListeners();
        
        // Auto-remove after duration
        setTimeout(() => {
            this.dismissNotification(notification.id);
        }, duration);
        
        return notification.id;
    }
    
    dismissNotification(id) {
        this.state.uiState.notifications = 
            this.state.uiState.notifications.filter(n => n.id !== id);
        this._notifyListeners();
    }
    
    setLoading(isLoading, message = '') {
        this.state.loadingState = {
            isLoading,
            loadingMessage: message
        };
        this._notifyListeners();
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    _notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// Create singleton instance
const gameStateManager = new GameStateManager();
export default gameStateManager;