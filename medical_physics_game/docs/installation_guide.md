mkdir -p tools/content_creation
cat > tools/content_creation/question_creator.py << 'EOF'
#!/usr/bin/env python
"""
Question Creator Tool

A command-line tool to create and manage educational questions for the Medical Physics Game.
"""

import os
import json
import argparse
import random
import uuid
from datetime import datetime

# Categories
CATEGORIES = [
    "radiation_physics",
    "dosimetry",
    "radiation_protection",
    "radiation_biology",
    "imaging_technologies",
    "treatment_planning",
    "quality_assurance"
]

# Difficulty levels
DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"]

def create_question_template():
    """Create a template for a new question"""
    return {
        "id": f"q{uuid.uuid4().hex[:8]}",
        "text": "",
        "options": ["", "", "", ""],
        "correct_answer": 0,
        "difficulty": "intermediate",
        "category": CATEGORIES[0],
        "explanation": "",
        "learning_objectives": [],
        "references": [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "author": os.environ.get("USER", "unknown")
    }

def load_questions(category):
    """Load questions from a category file"""
    file_path = f"data/questions/categories/{category}.json"
    
    if not os.path.exists(file_path):
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        return []
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_questions(category, questions):
    """Save questions to a category file"""
    file_path = f"data/questions/categories/{category}.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'w') as f:
        json.dump(questions, f, indent=2)

def interactive_create_question():
    """Create a question interactively"""
    question = create_question_template()
    
    print("\n=== Create a New Question ===\n")
    
    question["text"] = input("Question text: ")
    
    print("\nEnter 4 options (type each option and press Enter):")
    options = []
    for i in range(4):
        option = input(f"Option {i+1}: ")
        options.append(option)
    question["options"] = options
    
    correct_index = int(input("\nCorrect answer (1-4): ")) - 1
    if correct_index < 0 or correct_index > 3:
        print("Invalid choice, defaulting to option 1")
        correct_index = 0
    question["correct_answer"] = correct_index
    
    print("\nDifficulty levels:")
    for i, level in enumerate(DIFFICULTY_LEVELS):
        print(f"{i+1}. {level}")
    difficulty_index = int(input("Select difficulty (1-3): ")) - 1
    if difficulty_index < 0 or difficulty_index > 2:
        print("Invalid choice, defaulting to intermediate")
        difficulty_index = 1
    question["difficulty"] = DIFFICULTY_LEVELS[difficulty_index]
    
    print("\nCategories:")
    for i, cat in enumerate(CATEGORIES):
        print(f"{i+1}. {cat}")
    category_index = int(input("Select category (1-7): ")) - 1
    if category_index < 0 or category_index > 6:
        print("Invalid choice, defaulting to radiation_physics")
        category_index = 0
    question["category"] = CATEGORIES[category_index]
    
    question["explanation"] = input("\nExplanation: ")
    
    learning_objectives = []
    print("\nEnter learning objectives (enter empty line when done):")
    while True:
        objective = input("Learning objective: ")
        if not objective:
            break
        learning_objectives.append(objective)
    question["learning_objectives"] = learning_objectives
    
    references = []
    print("\nEnter references (enter empty line when done):")
    while True:
        reference = input("Reference: ")
        if not reference:
            break
        references.append(reference)
    question["references"] = references
    
    return question

def list_questions(category=None):
    """List questions in a category or all categories"""
    if category:
        categories = [category]
    else:
        categories = CATEGORIES
    
    for cat in categories:
        questions = load_questions(cat)
        print(f"\n=== {cat.upper()} ({len(questions)} questions) ===")
        for i, q in enumerate(questions):
            print(f"{i+1}. {q['text'][:70]}{'...' if len(q['text']) > 70 else ''} [{q['difficulty']}]")

def main():
    parser = argparse.ArgumentParser(description="Question Creator Tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new question")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List questions")
    list_parser.add_argument("--category", choices=CATEGORIES, help="Filter by category")
    
    args = parser.parse_args()
    
    if args.command == "create":
        question = interactive_create_question()
        category = question["category"]
        questions = load_questions(category)
        questions.append(question)
        save_questions(category, questions)
        print(f"\nQuestion added to {category} category.")
    
    elif args.command == "list":
        list_questions(args.category)
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
