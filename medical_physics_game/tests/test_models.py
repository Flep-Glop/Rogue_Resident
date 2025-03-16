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
