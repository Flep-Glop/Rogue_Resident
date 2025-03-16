#!/bin/bash
echo "Fixing Item model JSON import..."

# Add missing json import to item.py
sed -i '1s/^/import json\n/' backend/data/models/item.py

echo "✅ Fixed Item model"
