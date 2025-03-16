#!/bin/bash
echo "Fixing data loading for items and questions..."

# First check if the data files exist in the right locations
echo "Checking data files..."
if [ -f "data/items/items.json" ]; then
    echo "✅ Found items.json"
else
    echo "❌ items.json not found, creating placeholder"
    # Create directory if it doesn't exist
    mkdir -p data/items
    # Create sample items data
    cat > data/items/items.json << 'JSON_EOF'
[
  {
    "id": "item1",
    "name": "Medical Textbook",
    "description": "A comprehensive guide to medical physics principles",
    "effects": {
      "intelligence": 5,
      "knowledge": 10
    }
  },
  {
    "id": "item2",
    "name": "Dosimeter",
    "description": "Measures radiation exposure",
    "effects": {
      "safety": 8,
      "awareness": 5
    }
  },
  {
    "id": "item3",
    "name": "Lab Coat",
    "description": "Standard protective equipment",
    "effects": {
      "protection": 3,
      "professionalism": 5
    }
  }
]
JSON_EOF
    echo "✅ Created sample items.json"
fi

if [ -f "data/questions/questions.json" ]; then
    echo "✅ Found questions.json"
else
    echo "❌ questions.json not found, creating placeholder"
    # Create directory if it doesn't exist
    mkdir -p data/questions
    # Create sample questions data
    cat > data/questions/questions.json << 'JSON_EOF'
[
  {
    "id": "q1",
    "text": "What is the SI unit for absorbed radiation dose?",
    "answers": ["Gray (Gy)", "Sievert (Sv)", "Becquerel (Bq)", "Roentgen (R)"],
    "correct_answer": 0
  },
  {
    "id": "q2",
    "text": "Which imaging modality does NOT use ionizing radiation?",
    "answers": ["CT Scan", "MRI", "X-Ray", "PET Scan"],
    "correct_answer": 1
  },
  {
    "id": "q3",
    "text": "What is the half-life of Tc-99m?",
    "answers": ["6 hours", "12 hours", "24 hours", "48 hours"],
    "correct_answer": 0
  }
]
JSON_EOF
    echo "✅ Created sample questions.json"
fi

# Fix item_repo.py to properly load items data
cat > backend/data/repositories/item_repo.py << 'PY_EOF'
import os
import json
from backend.data.models.item import Item

class ItemRepository:
    @staticmethod
    def load_items_data():
        """Load item data from JSON file."""
        try:
            items_path = os.path.join('data', 'items', 'items.json')
            print(f"Loading items from: {items_path}")
            with open(items_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading items: {e}")
            return []

    @staticmethod
    def get_all_items():
        """Get all items from the data file."""
        items_data = ItemRepository.load_items_data()
        return [Item.from_dict(i) for i in items_data]

    @staticmethod
    def get_item_by_id(item_id):
        """Get a specific item by ID."""
        items_data = ItemRepository.load_items_data()
        for item_data in items_data:
            if item_data.get('id') == item_id:
                return Item.from_dict(item_data)
        return None

# Functions for API use
def get_all_items():
    return ItemRepository.get_all_items()

def get_item_by_id(item_id):
    return ItemRepository.get_item_by_id(item_id)
PY_EOF

# Fix question_repo.py to properly load questions data
cat > backend/data/repositories/question_repo.py << 'PY_EOF'
import os
import json
from backend.data.models.question import Question

class QuestionRepository:
    @staticmethod
    def load_questions_data():
        """Load question data from JSON file."""
        try:
            questions_path = os.path.join('data', 'questions', 'questions.json')
            print(f"Loading questions from: {questions_path}")
            with open(questions_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading questions: {e}")
            return []

    @staticmethod
    def get_all_questions():
        """Get all questions from the data file."""
        questions_data = QuestionRepository.load_questions_data()
        return [Question.from_dict(q) for q in questions_data]

    @staticmethod
    def get_question_by_id(question_id):
        """Get a specific question by ID."""
        questions_data = QuestionRepository.load_questions_data()
        for question_data in questions_data:
            if question_data.get('id') == question_id:
                return Question.from_dict(question_data)
        return None

# Functions for API use
def get_all_questions():
    return QuestionRepository.get_all_questions()

def get_question_by_id(question_id):
    return QuestionRepository.get_question_by_id(question_id)
PY_EOF

echo "✅ Fixed data loading for items and questions"
