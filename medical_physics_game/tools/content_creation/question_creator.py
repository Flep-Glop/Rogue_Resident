#!/usr/bin/env python3
"""
Question Creator Tool for Medical Physics Game

This tool helps content creators develop standardized educational content following
the guidelines from Developer Guide 3. It provides a structured way to create:
1. Multiple-choice questions with varying difficulty levels
2. Patient cases with branching decisions
"""

import json
import os
import uuid
from datetime import datetime

# Categories from Developer Guide 3
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

def create_question():
    """Create a new question following the structured format"""
    question = {
        "id": f"q{uuid.uuid4().hex[:8]}",
        "text": "",
        "options": ["", "", "", ""],
        "correct_answer": 0,
        "difficulty": "intermediate",
        "category": "treatment_planning",
        "explanation": "",
        "learning_objectives": [],
        "references": [],
        "created_at": datetime.now().isoformat(),
        "last_modified": datetime.now().isoformat()
    }
    
    print("\n=== New Question Creation ===")
    
    # Get question text
    question["text"] = input("Question text: ")
    
    # Get options
    print("\nEnter 4 options (enter each option on a new line):")
    for i in range(4):
        question["options"][i] = input(f"Option {i+1}: ")
    
    # Get correct answer
    while True:
        try:
            correct = int(input("\nCorrect option number (1-4): "))
            if 1 <= correct <= 4:
                question["correct_answer"] = correct - 1  # Convert to 0-indexed
                break
            else:
                print("Please enter a number between 1 and 4.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Get difficulty
    print("\nDifficulty levels:")
    for i, level in enumerate(DIFFICULTY_LEVELS):
        print(f"{i+1}. {level}")
    
    while True:
        try:
            difficulty_choice = int(input("Select difficulty (1-3): "))
            if 1 <= difficulty_choice <= 3:
                question["difficulty"] = DIFFICULTY_LEVELS[difficulty_choice - 1]
                break
            else:
                print("Please enter a number between 1 and 3.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Get category
    print("\nCategories:")
    for i, category in enumerate(CATEGORIES):
        print(f"{i+1}. {category}")
    
    while True:
        try:
            category_choice = int(input("Select category (1-7): "))
            if 1 <= category_choice <= 7:
                question["category"] = CATEGORIES[category_choice - 1]
                break
            else:
                print("Please enter a number between 1 and 7.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Get explanation
    question["explanation"] = input("\nExplanation for the correct answer: ")
    
    # Get learning objectives
    print("\nEnter learning objectives (one per line, blank line to finish):")
    while True:
        objective = input("Learning objective: ")
        if not objective:
            break
        question["learning_objectives"].append(objective)
    
    # Get references
    print("\nEnter references (one per line, blank line to finish):")
    while True:
        reference = input("Reference: ")
        if not reference:
            break
        question["references"].append(reference)
    
    return question

def create_patient_case():
    """Create a new patient case following the structured format"""
    case = {
        "id": f"case{uuid.uuid4().hex[:8]}",
        "title": "",
        "description": "",
        "history": "",
        "vitals": {
            "height": "",
            "weight": "",
            "blood_pressure": "",
            "heart_rate": ""
        },
        "imaging": [],
        "labs": {},
        "diagnosis": "",
        "treatment_options": [],
        "questions": [],
        "follow_up": "",
        "created_at": datetime.now().isoformat(),
        "last_modified": datetime.now().isoformat()
    }
    
    print("\n=== New Patient Case Creation ===")
    
    # Basic case information
    case["title"] = input("Case title: ")
    case["description"] = input("Brief description: ")
    case["history"] = input("Patient history: ")
    
    # Vitals
    print("\nVital signs:")
    case["vitals"]["height"] = input("Height (cm): ")
    case["vitals"]["weight"] = input("Weight (kg): ")
    case["vitals"]["blood_pressure"] = input("Blood pressure (e.g., 120/80): ")
    case["vitals"]["heart_rate"] = input("Heart rate (bpm): ")
    
    # Imaging studies
    print("\nImaging studies (blank line to finish):")
    while True:
        imaging_type = input("Imaging type (e.g., CT, MRI, X-ray): ")
        if not imaging_type:
            break
        
        imaging = {
            "type": imaging_type,
            "description": input("Description of findings: "),
            "image_url": input("Image URL (optional): ")
        }
        
        case["imaging"].append(imaging)
    
    # Lab results
    print("\nLab results (blank line to finish):")
    while True:
        lab_name = input("Lab test name: ")
        if not lab_name:
            break
        
        lab_value = input("Result: ")
        case["labs"][lab_name] = lab_value
    
    # Diagnosis
    case["diagnosis"] = input("\nDiagnosis: ")
    
    # Treatment options
    print("\nTreatment options (blank line to finish):")
    while True:
        treatment_name = input("Treatment name: ")
        if not treatment_name:
            break
        
        treatment = {
            "id": f"option{len(case['treatment_options']) + 1}",
            "name": treatment_name,
            "description": input("Description: ")
        }
        
        case["treatment_options"].append(treatment)
    
    # Add questions related to the case
    print("\nAdd questions related to the case (blank line to finish):")
    while True:
        question_text = input("Question text: ")
        if not question_text:
            break
        
        # Determine if it's a multiple choice or treatment option question
        q_type = input("Question type (1: Multiple choice, 2: Treatment option): ")
        
        if q_type == "1":
            # Multiple choice question
            options = []
            print("Enter options (blank line to finish):")
            while True:
                option = input("Option: ")
                if not option:
                    break
                options.append(option)
            
            correct_idx = int(input("Correct option number (1-based): ")) - 1
            explanation = input("Explanation: ")
            
            question = {
                "id": f"case_q{uuid.uuid4().hex[:6]}",
                "text": question_text,
                "options": options,
                "correct_answer": correct_idx,
                "explanation": explanation
            }
            
        else:
            # Treatment option question
            print("Available treatment option IDs:")
            for opt in case["treatment_options"]:
                print(f"- {opt['id']}: {opt['name']}")
            
            correct_option = input("Correct treatment option ID: ")
            explanation = input("Explanation: ")
            
            question = {
                "id": f"case_q{uuid.uuid4().hex[:6]}",
                "text": question_text,
                "correct_option": correct_option,
                "explanation": explanation
            }
        
        case["questions"].append(question)
    
    # Follow-up
    case["follow_up"] = input("\nFollow-up information: ")
    
    return case

def save_question(question):
    """Save a question to the questions data file"""
    questions_file = "../../data/questions/questions.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(questions_file), exist_ok=True)
    
    # Load existing questions
    questions = []
    if os.path.exists(questions_file):
        try:
            with open(questions_file, 'r') as f:
                questions = json.load(f)
        except json.JSONDecodeError:
            # If the file is empty or invalid, start with an empty list
            questions = []
    
    # Add new question
    questions.append(question)
    
    # Save updated questions
    with open(questions_file, 'w') as f:
        json.dump(questions, f, indent=2)
    
    print(f"\nQuestion saved to {questions_file}")

def save_patient_case(case):
    """Save a patient case to the patient cases data file"""
    cases_file = "../../data/questions/patient_cases.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(cases_file), exist_ok=True)
    
    # Load existing cases
    cases = []
    if os.path.exists(cases_file):
        try:
            with open(cases_file, 'r') as f:
                cases = json.load(f)
        except json.JSONDecodeError:
            # If the file is empty or invalid, start with an empty list
            cases = []
    
    # Add new case
    cases.append(case)
    
    # Save updated cases
    with open(cases_file, 'w') as f:
        json.dump(cases, f, indent=2)
    
    print(f"\nPatient case saved to {cases_file}")

def main():
    print("=== Medical Physics Game Content Creator ===")
    print("This tool helps create educational content for the game.")
    
    while True:
        print("\nChoose an option:")
        print("1. Create a new question")
        print("2. Create a new patient case")
        print("3. Exit")
        
        choice = input("\nChoice: ")
        
        if choice == "1":
            question = create_question()
            save_question(question)
        elif choice == "2":
            case = create_patient_case()
            save_patient_case(case)
        elif choice == "3":
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()