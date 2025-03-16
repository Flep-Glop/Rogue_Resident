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
