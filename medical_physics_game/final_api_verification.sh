#!/bin/bash
echo "Performing final API verification..."

echo -e "\n=== Testing /api/characters endpoint ==="
curl -s http://localhost:5000/api/characters | python3 -m json.tool

echo -e "\n=== Testing /api/items endpoint ==="
curl -s http://localhost:5000/api/items | python3 -m json.tool

echo -e "\n=== Testing /api/questions endpoint ==="
curl -s http://localhost:5000/api/questions | python3 -m json.tool

echo -e "\n=== Testing /api/skill_tree endpoint ==="
curl -s http://localhost:5000/api/skill_tree | python3 -m json.tool

echo -e "\n=== Testing /api/game_state endpoint ==="
curl -s http://localhost:5000/api/game_state | python3 -m json.tool

echo -e "\n=== API Verification Complete ==="
echo "If all endpoints returned JSON data, the API is working correctly."
