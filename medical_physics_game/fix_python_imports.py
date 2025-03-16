#!/usr/bin/env python3
import os
import re
import sys

def fix_imports_in_file(file_path):
    print(f"Processing {file_path}")
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Map of old imports to new imports
    import_map = {
        r'import\s+game_state': 'import backend.core.state_manager',
        r'from\s+game_state\s+import': 'from backend.core.state_manager import',
        r'import\s+data_manager': 'import backend.data.repositories',
        r'from\s+data_manager\s+import': 'from backend.data.repositories import',
        r'import\s+db_utils': 'import backend.utils.db_utils',
        r'from\s+db_utils\s+import': 'from backend.utils.db_utils import',
        r'import\s+map_generator': 'import backend.core.map_generator',
        r'from\s+map_generator\s+import': 'from backend.core.map_generator import',
        r'import\s+node_plugins': 'import backend.plugins.base_plugin',
        r'from\s+node_plugins\s+import': 'from backend.plugins.base_plugin import',
    }
    
    # Apply replacements
    for old_pattern, new_import in import_map.items():
        content = re.sub(old_pattern, new_import, content)
    
    # Write back to file
    with open(file_path, 'w') as f:
        f.write(content)
    
    return True

def fix_imports_in_directory(directory):
    success_count = 0
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                if fix_imports_in_file(file_path):
                    success_count += 1
    
    return success_count

if __name__ == "__main__":
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "backend"
    print(f"Fixing Python imports in {target_dir}...")
    count = fix_imports_in_directory(target_dir)
    print(f"Updated {count} Python files.")
