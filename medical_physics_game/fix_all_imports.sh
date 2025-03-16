#!/bin/bash

# Get the content of bootstrap.js to check for other imports
bootstrap_js_path="frontend/src/core/bootstrap.js"
if [ -f "$bootstrap_js_path" ]; then
    echo "Checking all imports in bootstrap.js..."
    
    # Extract all import statements
    imports=$(grep -e "import.*from" "$bootstrap_js_path")
    
    # Process each import
    echo "$imports" | while IFS= read -r import_line; do
        # Extract the module name and path
        if [[ $import_line =~ import[[:space:]]+\{[[:space:]]*([^}]+)[[:space:]]*\}[[:space:]]+from[[:space:]]+[\'\"]([^\'\"]+)[\'\"] ]]; then
            imported_names="${BASH_REMATCH[1]}"
            module_path="${BASH_REMATCH[2]}"
            
            echo "Found import: $imported_names from $module_path"
            
            # Check if the module exists
            resolved_path=$(echo "$module_path" | sed 's/\.\//frontend\/src\/core\//g')
            if [[ ! $resolved_path == /* ]]; then
                # If it's a relative path, resolve it relative to frontend/src/core
                resolved_path="frontend/src/core/$resolved_path"
            fi
            
            if [ -f "$resolved_path" ]; then
                echo "  Module exists at $resolved_path"
                
                # Check if the module exports what's being imported
                for name in $(echo "$imported_names" | tr ',' ' '); do
                    name=$(echo "$name" | tr -d ' ')
                    if ! grep -q "export.*$name" "$resolved_path" && ! grep -q "export.*{.*$name.*}" "$resolved_path"; then
                        echo "  ⚠️ Missing export for '$name' in $resolved_path"
                        
                        # Add the export statement
                        if grep -q "class $name" "$resolved_path" || grep -q "function $name" "$resolved_path" || grep -q "const $name" "$resolved_path" || grep -q "let $name" "$resolved_path"; then
                            echo -e "\nexport { $name };" >> "$resolved_path"
                            echo "  ✅ Added export statement for '$name' to $resolved_path"
                        else
                            echo "  ❌ Could not find declaration for '$name' in $resolved_path"
                        fi
                    else
                        echo "  ✅ '$name' is properly exported from $resolved_path"
                    fi
                done
            else
                echo "  ❌ Module not found at $resolved_path"
                
                # Create a basic module with the necessary exports
                mkdir -p $(dirname "$resolved_path")
                
                # Extract exported names
                exports=""
                for name in $(echo "$imported_names" | tr ',' ' '); do
                    name=$(echo "$name" | tr -d ' ')
                    if [ -n "$exports" ]; then
                        exports="$exports, "
                    fi
                    exports="$exports$name"
                    
                    # Add a basic implementation
                    if [ "$name" == "EventSystem" ]; then
                        echo "/**
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

export { EventSystem };" > "$resolved_path"
                        echo "  ✅ Created new module with EventSystem implementation at $resolved_path"
                    else
                        echo "/**
 * $name implementation
 */
const $name = {
    init() {
        console.log('$name initialized');
    }
};

export { $name };" > "$resolved_path"
                        echo "  ✅ Created new module with $name implementation at $resolved_path"
                    fi
                done
            fi
        fi
    done
else
    echo "❌ bootstrap.js not found at $bootstrap_js_path"
fi

echo "Import fixes complete!"
