#!/bin/bash
echo "Fixing Question model parameter issue..."

# Check if question.py exists
if [ -f "backend/data/models/question.py" ]; then
    # Create backup
    cp backend/data/models/question.py backend/data/models/question.py.bak
    
    # Replace the constructor to match expected parameters in test
    cat > backend/data/models/question.py << 'PY_EOF'
class Question:
    def __init__(self, id, text, answers, correct_answer):
        self.id = id
        self.text = text
        self.answers = answers
        self.correct_answer = correct_answer
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data.get('id'),
            text=data.get('text'),
            answers=data.get('answers', []),
            correct_answer=data.get('correct_answer')
        )
PY_EOF
    
    echo "✅ Fixed Question model"
else
    echo "❌ Question model file not found"
fi
