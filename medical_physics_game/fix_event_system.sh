#!/bin/bash

echo "Fixing event_system.js module export..."

# Fix the event_system.js file
event_system_path="frontend/src/core/event_system.js"
if [ -f "$event_system_path" ]; then
    # Make a backup
    cp "$event_system_path" "${event_system_path}.bak"
    
    # Check if it has an EventSystem class/object
    if grep -q "class EventSystem" "$event_system_path" || grep -q "const EventSystem" "$event_system_path"; then
        # Check if it's already exported properly
        if ! grep -q "export { EventSystem }" "$event_system_path" && ! grep -q "export class EventSystem" "$event_system_path"; then
            # Add export statement at the end of the file
            echo -e "\nexport { EventSystem };" >> "$event_system_path"
            echo "✅ Added missing export statement to event_system.js"
        else
            echo "ℹ️ EventSystem is already exported correctly"
        fi
    else
        # If it doesn't have an EventSystem class/object, create a basic one
        cat > "$event_system_path" << 'END'
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
END
        echo "✅ Created new EventSystem class with proper export in event_system.js"
    fi
else
    # Create the file if it doesn't exist
    mkdir -p $(dirname "$event_system_path")
    cat > "$event_system_path" << 'END'
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
END
    echo "✅ Created new event_system.js file with EventSystem class export"
fi

# Fix the symbolic link in the static directory
symlink_path="frontend/static/js/core/event_system.js"
if [ -L "$symlink_path" ]; then
    # Remove the existing symlink
    rm "$symlink_path"
fi

# Create directory if it doesn't exist
mkdir -p $(dirname "$symlink_path")

# Create a new symlink
ln -sf "../../../src/core/event_system.js" "$symlink_path"
echo "✅ Updated symlink for event_system.js in static directory"

echo "EventSystem module fixes complete!"
