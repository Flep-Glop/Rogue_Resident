#!/usr/bin/env python3
"""
Verification script for Medical Physics Game reorganization.
This script checks if all files have been properly migrated to the new structure.
"""

import os
import sys
from collections import defaultdict

def count_files(directory, extensions=None):
    """Count files in a directory, optionally filtering by extensions."""
    if not os.path.exists(directory):
        return 0
    
    count = 0
    for root, _, files in os.walk(directory):
        for file in files:
            if extensions is None or any(file.endswith(ext) for ext in extensions):
                count += 1
    return count

def compare_directories(source_dir, target_dir, extensions=None, verbose=False):
    """Compare file counts between source and target directories."""
    if not os.path.exists(source_dir):
        print(f"WARNING: Source directory {source_dir} does not exist")
        return False
    
    if not os.path.exists(target_dir):
        print(f"WARNING: Target directory {target_dir} does not exist")
        return False
    
    source_count = count_files(source_dir, extensions)
    target_count = count_files(target_dir, extensions)
    
    if verbose:
        print(f"  Source: {source_dir} - {source_count} files")
        print(f"  Target: {target_dir} - {target_count} files")
    
    if source_count > target_count:
        print(f"WARNING: {source_count - target_count} files may not have been copied from {source_dir} to {target_dir}")
        return False
    return True

def check_directory_exists(directory):
    """Check if a directory exists and print status."""
    exists = os.path.exists(directory)
    status = "✓" if exists else "✗"
    print(f"{status} {directory}")
    return exists

def get_file_list(directory, extensions=None):
    """Get a list of files in a directory, optionally filtering by extensions."""
    if not os.path.exists(directory):
        return []
    
    file_list = []
    for root, _, files in os.walk(directory):
        for file in files:
            if extensions is None or any(file.endswith(ext) for ext in extensions):
                rel_path = os.path.relpath(os.path.join(root, file), directory)
                file_list.append(rel_path)
    return file_list

def find_missing_files(source_dir, target_dir, extensions=None):
    """Find files that exist in source but not in target directory."""
    if not os.path.exists(source_dir) or not os.path.exists(target_dir):
        return []
    
    source_files = get_file_list(source_dir, extensions)
    target_files = get_file_list(target_dir, extensions)
    
    # Find base filenames that aren't in the target
    source_basenames = [os.path.basename(f) for f in source_files]
    target_basenames = [os.path.basename(f) for f in target_files]
    
    missing_basenames = set(source_basenames) - set(target_basenames)
    missing_files = [f for f in source_files if os.path.basename(f) in missing_basenames]
    
    return missing_files

def main():
    print("\n=== DIRECTORY STRUCTURE VERIFICATION ===\n")
    
    # Check key directory existence
    print("Checking key directories:")
    directories = [
        "./frontend",
        "./frontend/static",
        "./frontend/static/css",
        "./frontend/static/css/base",
        "./frontend/static/css/components",
        "./frontend/static/css/screens",
        "./frontend/static/css/themes",
        "./frontend/static/img",
        "./frontend/static/js",
        "./frontend/src",
        "./frontend/src/core",
        "./frontend/src/entities",
        "./frontend/src/entities/nodes",
        "./frontend/src/entities/nodes/node_types",
        "./frontend/src/ui",
        "./frontend/src/ui/components",
        "./frontend/templates",
        "./frontend/templates/components",
        "./frontend/templates/errors",
        "./frontend/templates/pages",
        "./backend",
        "./backend/api",
        "./backend/core",
        "./backend/data",
        "./backend/plugins",
        "./backend/utils",
        "./data",
        "./config",
        "./tests"
    ]
    
    all_directories_exist = True
    for directory in directories:
        if not check_directory_exists(directory):
            all_directories_exist = False
    
    if not all_directories_exist:
        print("\nWARNING: Some required directories are missing!")
    
    print("\n=== FILE MIGRATION VERIFICATION ===\n")
    
    # Check file counts between old and new structures
    migrations = [
        # CSS migrations
        ("./static/css/base", "./frontend/static/css/base", [".css"]),
        ("./static/css/components", "./frontend/static/css/components", [".css"]),
        ("./static/css/themes", "./frontend/static/css/themes", [".css"]),
        # JS migrations
        ("./static/js/components", "./frontend/src/entities/nodes/node_types", [".js"]),
        ("./static/js/engine", "./frontend/src/core", [".js"]),
        ("./static/js/ui", "./frontend/src/ui/components", [".js"]),
        # Template migrations
        ("./templates", "./frontend/templates/pages", [".html"]),
        # Image migrations
        ("./static/img/characters", "./frontend/static/img/characters", [".png", ".jpg", ".jpeg", ".gif", ".svg"]),
        ("./static/img/items", "./frontend/static/img/items", [".png", ".jpg", ".jpeg", ".gif", ".svg"]),
        # Nested structure migrations
        ("./medical_physics_game/frontend/static/css", "./frontend/static/css", [".css"]),
        ("./medical_physics_game/frontend/static/js", "./frontend/static/js", [".js"]),
        ("./medical_physics_game/frontend/templates", "./frontend/templates", [".html"])
    ]
    
    all_migrations_successful = True
    for source, target, extensions in migrations:
        print(f"Checking migration: {source} -> {target}")
        if not compare_directories(source, target, extensions, verbose=True):
            all_migrations_successful = False
            
            # Print missing files for diagnostics
            missing_files = find_missing_files(source, target, extensions)
            if missing_files:
                print("  Files potentially not migrated:")
                for file in missing_files[:5]:  # Limit to first 5 for brevity
                    print(f"    - {file}")
                if len(missing_files) > 5:
                    print(f"    ...and {len(missing_files) - 5} more")
        print()
    
    print("\n=== SUMMARY ===\n")
    
    if all_directories_exist and all_migrations_successful:
        print("✅ All directories exist and file migrations appear to be complete.")
        print("It should be safe to proceed with removing the nested medical_physics_game directory.")
    else:
        print("⚠️  There are issues with the directory structure or file migrations.")
        print("Please address the warnings before removing any original files or directories.")
    
    # Check app.py for static and template folder references
    try:
        with open('app.py', 'r') as f:
            app_content = f.read()
            if "static_folder='static'" in app_content or "static_folder=\"static\"" in app_content:
                print("\n⚠️  app.py still references the old static folder path.")
                print("   Consider updating to: static_folder='frontend/static'")
            
            if "template_folder='templates'" in app_content or "template_folder=\"templates\"" in app_content:
                print("\n⚠️  app.py still references the old template folder path.")
                print("   Consider updating to: template_folder='frontend/templates'")
    except FileNotFoundError:
        print("\n⚠️  app.py not found. Unable to check for path references.")

    print("\nTo run a full verification of all directories and files:")
    print("find . -type f -not -path '*/\\.*' -not -path '*/venv/*' | sort > old_files.txt")
    print("rm -rf ./medical_physics_game  # Only after confirming all files are migrated")
    print("find . -type f -not -path '*/\\.*' -not -path '*/venv/*' | sort > new_files.txt")
    print("diff old_files.txt new_files.txt  # Should only show removed duplicates, not unique files")

if __name__ == "__main__":
    main()
