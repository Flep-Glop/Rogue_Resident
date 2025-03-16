#!/bin/bash

echo "Copying character images..."

# Create the destination directory
mkdir -p frontend/static/img/characters

# List of character images to check
character_images=("physicist.png" "resident.png" "qa_specialist.png" "debug_mode.png" "bonus.png")

# Copy from original location if exists
for img in "${character_images[@]}"; do
    if [ -f "static/img/characters/$img" ]; then
        cp -v "static/img/characters/$img" "frontend/static/img/characters/$img"
        echo "✅ Copied $img to frontend/static/img/characters/"
    else
        echo "⚠️ $img not found in static/img/characters/"
    fi
done

echo "Character image copying complete!"
