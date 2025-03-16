#!/usr/bin/env python3
import os

# Create __init__.py files for all backend directories
backend_dirs = [
    'backend',
    'backend/api',
    'backend/core',
    'backend/data',
    'backend/data/models',
    'backend/data/repositories',
    'backend/data/schemas',
    'backend/plugins',
    'backend/utils'
]

for directory in backend_dirs:
    init_file = os.path.join(directory, '__init__.py')
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write(f"# {os.path.basename(directory)} package initialization\n")
        print(f"✅ Created {init_file}")

print("Backend __init__.py files created")
