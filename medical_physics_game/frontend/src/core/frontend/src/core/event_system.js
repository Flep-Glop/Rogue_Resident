/**
 * Event System for game events
 */
class EventSystem {
    constructor() {
        this.events = {};
        console.log('EventSystem initialized');
    }
    
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }
    
    emit(eventName, data) {
        const callbacks = this.events[eventName];
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
    
    off(eventName, callback) {
        const callbacks = this.events[eventName];
        if (callbacks) {
            this.events[eventName] = callbacks.filter(cb => cb !== callback);
        }
    }
}

export { EventSystem };
