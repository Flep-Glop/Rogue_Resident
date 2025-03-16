#!/bin/bash

echo "Updating app routes..."

app_py_path="app.py"
if [ -f "$app_py_path" ]; then
    # Make a backup
    cp "$app_py_path" "${app_py_path}.bak"
    
    # Check if the character_select route exists
    if ! grep -q "def character_select" "$app_py_path"; then
        # Find where to insert the route
        insert_pos=$(grep -n "def index" "$app_py_path" | head -1 | cut -d: -f1)
        
        if [ -n "$insert_pos" ]; then
            # Find the end of the index function
            for ((i=$insert_pos; i<$(wc -l < "$app_py_path"); i++)); do
                if grep -A $((i-insert_pos)) -B 0 "def index" "$app_py_path" | tail -1 | grep -q "return"; then
                    insert_pos=$((i+1))
                    break
                fi
            done
            
            # Create the new route content
            character_select_route='
    @app.route("/character-select")
    def character_select():
        return render_template("pages/character_select.html")
'
            
            # Insert the new route
            sed -i "${insert_pos}i\\${character_select_route}" "$app_py_path"
            echo "✅ Added character_select route to app.py"
        else
            echo "❌ Could not find where to insert character_select route"
        fi
    else
        echo "ℹ️ character_select route already exists in app.py"
    fi
    
    # Make sure all templates reference uses pages/ directory
    sed -i 's/return render_template("index.html")/return render_template("pages\/index.html")/' "$app_py_path"
    sed -i 's/return render_template("character_select.html")/return render_template("pages\/character_select.html")/' "$app_py_path"
    sed -i 's/return render_template("game.html")/return render_template("pages\/game.html")/' "$app_py_path"
    sed -i 's/return render_template("item_editor.html")/return render_template("pages\/item_editor.html")/' "$app_py_path"
    
    echo "✅ Updated template paths in app.py routes"
else
    echo "❌ app.py not found"
fi

echo "App routes update complete!"
