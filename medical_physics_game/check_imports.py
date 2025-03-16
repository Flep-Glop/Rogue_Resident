#!/usr/bin/env python3
"""
Import path checker for Medical Physics Game reorganization.
This script checks for potential import path issues after reorganization.
"""

import os
import re
import sys

def check_python_imports(file_path):
    """Check Python files for potentially broken imports after reorganization."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Patterns that might indicate broken imports
    problematic_patterns = [
        r'from\s+game_state\s+import',
        r'import\s+game_state',
        r'from\s+data_manager\s+import',
        r'import\s+data_manager',
        r'from\s+map_generator\s+import',
        r'import\s+map_generator',
        r'from\s+node_plugins\s+import',
        r'import\s+node_plugins',
        r'from\s+plugins\.',
        r'import\s+plugins\.'
    ]
    
    suggested_replacements = {
        r'from\s+game_state\s+import': 'from backend.core.state_manager import',
        r'import\s+game_state': 'import backend.core.state_manager',
        r'from\s+data_manager\s+import': 'from backend.data.repositories import',
        r'import\s+data_manager': 'import backend.data.repositories',
        r'from\s+map_generator\s+import': 'from backend.core.map_generator import',
        r'import\s+map_generator': 'import backend.core.map_generator',
        r'from\s+node_plugins\s+import': 'from backend.plugins.base_plugin import',
        r'import\s+node_plugins': 'import backend.plugins.base_plugin',
        r'from\s+plugins\.': 'from backend.plugins.',
        r'import\s+plugins\.': 'import backend.plugins.'
    }
    
    issues = []
    
    for pattern in problematic_patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            suggested = suggested_replacements.get(pattern, "No suggestion available")
            issues.append((match, suggested))
    
    return issues

def check_js_imports(file_path):
    """Check JavaScript files for potentially broken imports after reorganization."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Patterns that might indicate broken imports
    problematic_patterns = [
        r'from\s+[\'"]\.\.\/engine',
        r'from\s+[\'"]\.\.\/components',
        r'from\s+[\'"]\.\.\/ui',
        r'import.*[\'"]\.\.\/engine',
        r'import.*[\'"]\.\.\/components',
        r'import.*[\'"]\.\.\/ui'
    ]
    
    issues = []
    
    for pattern in problematic_patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            issues.append((match, "Paths need to be updated for new structure"))
    
    return issues

def scan_directory(directory):
    """Scan a directory for potential import problems."""
    results = {}
    
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            
            if file.endswith('.py'):
                issues = check_python_imports(file_path)
                if issues:
                    results[file_path] = {'type': 'python', 'issues': issues}
            
            elif file.endswith('.js'):
                issues = check_js_imports(file_path)
                if issues:
                    results[file_path] = {'type': 'javascript', 'issues': issues}
    
    return results

def main():
    print("\n=== IMPORT PATH CHECK ===\n")
    
    # Scan backend Python files
    print("Checking backend Python files...")
    backend_results = scan_directory('./backend')
    
    # Scan frontend JavaScript files
    print("Checking frontend JavaScript files...")
    frontend_results = scan_directory('./frontend')
    
    # Combine results
    all_results = {**backend_results, **frontend_results}
    
    if not all_results:
        print("\n✅ No potential import path issues detected.")
    else:
        print("\n⚠️  Potential import path issues detected:")
        
        for file_path, data in all_results.items():
            rel_path = os.path.relpath(file_path)
            print(f"\nFile: {rel_path} ({data['type']})")
            
            for issue, suggestion in data['issues']:
                print(f"  - Found: {issue.strip()}")
                print(f"    Suggestion: {suggestion}")
    
    print("\nNote: This is a basic check and may not catch all import issues.")
    print("Test your application thoroughly after reorganization.")

if __name__ == "__main__":
    main()