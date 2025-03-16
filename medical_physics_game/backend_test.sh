#!/bin/bash
echo "=== BACKEND API VERIFICATION ==="

# Define API endpoints to test
endpoints=(
    "/api/characters"
    "/api/characters/1"
    "/api/items"
    "/api/questions"
    "/api/skill_tree"
    "/api/game_state"
)

# Test all endpoints
echo "Testing API endpoints..."
for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000$endpoint)
    if [[ $response -ge 200 && $response -lt 300 ]]; then
        echo "✅ $endpoint: $response OK"
    else
        echo "❌ $endpoint: $response FAILED"
    fi
done

# Test repository functions
echo -e "\n=== Testing Data Repositories ==="
cat > tests/test_repositories.py << 'PY_EOF'
import sys
import os
import json

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.data.repositories import character_repo, item_repo, question_repo

def test_character_repo():
    print("Testing character repository...")
    characters = character_repo.get_all_characters()
    print(f"Found {len(characters)} characters")
    if len(characters) > 0:
        print("✅ Character repository working")
    else:
        print("❌ Character repository not working")

def test_item_repo():
    print("Testing item repository...")
    items = item_repo.get_all_items()
    print(f"Found {len(items)} items")
    if len(items) > 0:
        print("✅ Item repository working")
    else:
        print("❌ Item repository not working")

def test_question_repo():
    print("Testing question repository...")
    questions = question_repo.get_all_questions()
    print(f"Found {len(questions)} questions")
    if len(questions) > 0:
        print("✅ Question repository working")
    else:
        print("❌ Question repository not working")

if __name__ == "__main__":
    test_character_repo()
    test_item_repo()
    test_question_repo()
PY_EOF

echo "Running repository tests..."
python tests/test_repositories.py

# Test model validation
echo -e "\n=== Testing Data Models ==="
cat > tests/test_models.py << 'PY_EOF'
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.data.models.character import Character
from backend.data.models.item import Item
from backend.data.models.question import Question

def test_character_model():
    print("Testing character model...")
    try:
        character = Character(
            id="1",
            name="Test Character",
            max_hp=100,
            current_hp=100,
            abilities=["test"],
            stats={"strength": 10}
        )
        print(f"Created character: {character.name}")
        print("✅ Character model working")
    except Exception as e:
        print(f"❌ Character model error: {e}")

def test_item_model():
    print("Testing item model...")
    try:
        item = Item(
            id="1",
            name="Test Item",
            description="Test description",
            effects={"heal": 10}
        )
        print(f"Created item: {item.name}")
        print("✅ Item model working")
    except Exception as e:
        print(f"❌ Item model error: {e}")

def test_question_model():
    print("Testing question model...")
    try:
        question = Question(
            id="1",
            text="Test question?",
            answers=["Answer 1", "Answer 2"],
            correct_answer=0
        )
        print(f"Created question: {question.text}")
        print("✅ Question model working")
    except Exception as e:
        print(f"❌ Question model error: {e}")

if __name__ == "__main__":
    test_character_model()
    test_item_model()
    test_question_model()
PY_EOF

echo "Running model tests..."
python tests/test_models.py
