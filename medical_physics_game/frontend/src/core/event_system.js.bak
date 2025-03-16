/**
 * Event System for Medical Physics Game
 * Implements a publish-subscribe pattern for event handling
 */

export class EventSystem {
    /**
     * Initialize a new event system
     */
    constructor() {
        // Map of event types to arrays of subscriber callbacks
        this.subscribers = new Map();
        
        // Event history for debugging
        this.eventHistory = [];
        this.maxHistoryLength = 100;
        
        // Debug mode flag
        this.debugMode = false;
        
        console.log('Event system initialized');
    }
    
    /**
     * Subscribe to an event
     * 
     * @param {string} eventType - Type of event to subscribe to
     * @param {Function} callback - Function to call when event occurs
     * @returns {Object} Subscription object with unsubscribe method
     */
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        
        const callbacks = this.subscribers.get(eventType);
        callbacks.push(callback);
        
        if (this.debugMode) {
            console.log(`Subscribed to event: ${eventType}`);
        }
        
        // Return subscription object with unsubscribe method
        return {
            unsubscribe: () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                    if (this.debugMode) {
                        console.log(`Unsubscribed from event: ${eventType}`);
                    }
                }
            }
        };
    }
    
    /**
     * Publish an event
     * 
     * @param {string} eventType - Type of event to publish
     * @param {Object} data - Event data to pass to subscribers
     */
    publish(eventType, data = {}) {
        if (this.debugMode) {
            console.log(`Publishing event: ${eventType}`, data);
        }
        
        // Add to event history
        this.addToHistory(eventType, data);
        
        // If no subscribers, return
        if (!this.subscribers.has(eventType)) {
            return;
        }
        
        // Call all subscriber callbacks
        const callbacks = this.subscribers.get(eventType);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
            }
        });
    }
    
    /**
     * Add event to history
     * 
     * @param {string} eventType - Type of event
     * @param {Object} data - Event data
     * @private
     */
    addToHistory(eventType, data) {
        this.eventHistory.push({
            timestamp: new Date(),
            type: eventType,
            data: data
        });
        
        // Limit history length
        if (this.eventHistory.length > this.maxHistoryLength) {
            this.eventHistory.shift();
        }
    }
    
    /**
     * Enable or disable debug mode
     * 
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`Event system debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get event history
     * 
     * @returns {Array} Array of event history objects
     */
    getEventHistory() {
        return [...this.eventHistory];
    }
    
    /**
     * Clear event history
     */
    clearEventHistory() {
        this.eventHistory = [];
        console.log('Event history cleared');
    }
    
    /**
     * Get count of subscribers for a specific event type
     * 
     * @param {string} eventType - Type of event
     * @returns {number} Number of subscribers
     */
    getSubscriberCount(eventType) {
        if (!this.subscribers.has(eventType)) {
            return 0;
        }
        
        return this.subscribers.get(eventType).length;
    }
}