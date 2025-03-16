#!/usr/bin/env python
"""
Script to fix import paths in Python files after reorganization.
"""

import os
import re
import sys

# Mapping of old imports to new imports
IMPORT_MAPPINGS = {
    r'from\s+game_state\s+import': 'from backend.core.state_manager import',
    r'import\s+game_state': 'import backend.core.state_manager',
    r'from\s+data_manager\s+import': 'from backend.data.repositories import',
    r'import\s+data_manager': 'import backend.data.repositories',
    r'from\s+db_utils\s+import': 'from backend.utils.db_utils import',
    r'import\s+db_utils': 'import backend.utils.db_utils',
    r'from\s+map_generator\s+import': 'from backend.core.map_generator import',
    r'import\s+map_generator': 'import backend.core.map_generator',
    r'from\s+node_plugins\s+import': 'from backend.plugins.base_plugin import',
    r'import\s+node_plugins': 'import backend.plugins.base_plugin',
    r'from\s+plugins.question_plugin\s+import': 'from backend.plugins.question_plugin import',
    r'import\s+plugins.question_plugin': 'import backend.plugins.question_plugin'
}

def fix_imports_in_file(file_path):
    """
    Fix imports in a single Python file.
    
    Args:
        file_path (str): Path to the Python file
        
    Returns:
        bool: True if any changes were made, False otherwise
    """
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        original_content = content
        
        # Apply each import mapping
        for old_pattern, new_import in IMPORT_MAPPINGS.items():
            content = re.sub(old_pattern, new_import, content)
            
        # If no changes were made, return False
        if content == original_content:
            return False
            
        # Write the updated content back to the file
        with open(file_path, 'w') as f:
            f.write(content)
            
        return True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def fix_imports_in_directory(directory):
    """
    Fix imports in all Python files in a directory (recursively).
    
    Args:
        directory (str): Directory path
        
    Returns:
        tuple: (total_files, changed_files)
    """
    total_files = 0
    changed_files = 0
    
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith('.py'):
                total_files += 1
                file_path = os.path.join(root, filename)
                
                if fix_imports_in_file(file_path):
                    changed_files += 1
                    print(f"Updated imports in {file_path}")
    
    return total_files, changed_files

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python import_fixer.py <directory>")
        sys.exit(1)
        
    directory = sys.argv[1]
    
    if not os.path.isdir(directory):
        print(f"Error: {directory} is not a valid directory")
        sys.exit(1)
        
    print(f"Fixing imports in {directory}...")
    total, changed = fix_imports_in_directory(directory)
    
    print(f"Processed {total} Python files")
    print(f"Updated imports in {changed} files")
    
if __name__ == "__main__":
    main()