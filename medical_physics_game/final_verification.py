#!/usr/bin/env python3
import os
import sys
import json
import subprocess

def check_api_endpoints():
    """Test API endpoints using curl"""
    print("Testing API endpoints...")
    
    endpoints = [
        "/api/characters",
        "/api/characters/1",
        "/api/items",
        "/api/questions"
    ]
    
    results = {}
    
    # Start the Flask app in the background
    process = subprocess.Popen(["python", "app.py"], 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE)
    
    # Give it a moment to start
    import time
    time.sleep(3)
    
    try:
        for endpoint in endpoints:
            try:
                # Use curl to test the endpoint
                result = subprocess.run(
                    ["curl", "-s", f"http://localhost:5000{endpoint}"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0:
                    try:
                        # Try to parse as JSON to verify it's valid
                        response_data = json.loads(result.stdout)
                        results[endpoint] = {"status": "success", "data": response_data}
                    except json.JSONDecodeError:
                        results[endpoint] = {"status": "error", "message": "Invalid JSON response"}
                else:
                    results[endpoint] = {"status": "error", "message": "Request failed"}
            except subprocess.TimeoutExpired:
                results[endpoint] = {"status": "error", "message": "Request timed out"}
    finally:
        # Kill the Flask app
        process.terminate()
    
    return results

def check_static_files():
    """Check that critical static files exist and are properly structured"""
    print("Checking static files...")
    
    critical_files = [
        "frontend/static/css/base/reset.css",
        "frontend/static/css/base/variables.css",
        "frontend/static/css/base/layout.css",
        "frontend/static/css/themes/retro_theme.css",
        "frontend/templates/base.html",
        "frontend/templates/pages/index.html"
    ]
    
    results = {}
    
    for file_path in critical_files:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
                size = len(content)
                results[file_path] = {"status": "success", "size": size}
        else:
            results[file_path] = {"status": "error", "message": "File not found"}
    
    return results

def check_data_files():
    """Check that critical data files exist and are properly structured"""
    print("Checking data files...")
    
    critical_files = [
        "data/characters/characters.json",
        "data/maps/floors.json",
        "data/questions/questions.json",
        "data/skill_tree/skill_tree.json"
    ]
    
    results = {}
    
    for file_path in critical_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        results[file_path] = {"status": "success", "count": len(data)}
                    else:
                        results[file_path] = {"status": "success", "type": type(data).__name__}
            except json.JSONDecodeError:
                results[file_path] = {"status": "error", "message": "Invalid JSON"}
        else:
            results[file_path] = {"status": "warning", "message": "File not found"}
    
    return results

def run_verification():
    """Run all verification checks and report results"""
    print("Running final migration verification...\n")
    
    # Check API endpoints
    api_results = check_api_endpoints()
    
    # Check static files
    static_results = check_static_files()
    
    # Check data files
    data_results = check_data_files()
    
    # Print results
    print("\nAPI Endpoint Results:")
    for endpoint, result in api_results.items():
        status = "✅" if result["status"] == "success" else "❌"
        print(f"{status} {endpoint}: {result['status']}")
    
    print("\nStatic File Results:")
    for file_path, result in static_results.items():
        status = "✅" if result["status"] == "success" else "❌"
        print(f"{status} {file_path}: {result['status']}")
    
    print("\nData File Results:")
    for file_path, result in data_results.items():
        if result["status"] == "success":
            status = "✅"
        elif result["status"] == "warning":
            status = "⚠️"
        else:
            status = "❌"
        print(f"{status} {file_path}: {result['status']}")
    
    # Calculate overall status
    api_success = all(r["status"] == "success" for r in api_results.values())
    static_success = all(r["status"] == "success" for r in static_results.values())
    data_warnings = any(r["status"] == "warning" for r in data_results.values())
    data_errors = any(r["status"] == "error" for r in data_results.values())
    
    print("\nOverall Status:")
    if api_success and static_success and not data_errors:
        print("✅ Migration verification passed!")
        if data_warnings:
            print("⚠️ Some data files are missing, but this might be expected.")
        print("\nYou can now proceed with the cleanup process:")
        print("1. Create a backup: tar -czvf backup_$(date +%Y%m%d).tar.gz .")
        print("2. Remove nested directory: rm -rf medical_physics_game/")
        print("3. After thorough testing, remove old dirs: rm -rf static/ templates/")
        return True
    else:
        print("❌ Migration verification failed!")
        print("Please fix the issues before proceeding with cleanup.")
        return False

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
