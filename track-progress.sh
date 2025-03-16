#!/bin/bash

# Colors for better visual feedback
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Base directory to check - change this to match your project folder
BASE_DIR="."  # Using current directory

# Function to check if a file exists and print colored status
check_file() {
    local file=$1
    local description=$2
    local path="${BASE_DIR}/${file}"
    
    if [ -f "$path" ]; then
        echo -e "  [${GREEN}✓${NC}] $description"
        return 0
    else
        echo -e "  [${RED}✗${NC}] $description"
        return 1
    fi
}

# Function to check if a directory exists and print colored status
check_dir() {
    local dir=$1
    local description=$2
    local path="${BASE_DIR}/${dir}"
    
    if [ -d "$path" ]; then
        echo -e "  [${GREEN}✓${NC}] $description"
        return 0
    else
        echo -e "  [${RED}✗${NC}] $description"
        return 1
    fi
}

# Title
echo -e "\n${BOLD}${BLUE}=== Medical Physics Game Reorganization Progress Tracker ===${NC}\n"

# Initialize counters
total_checks=0
passed_checks=0

# Phase 1: Project Structure
echo -e "${BOLD}Phase 1: Base Project Structure${NC}"
check_dir "backend" "Backend directory" && ((passed_checks++)) || true; ((total_checks++))
check_dir "frontend" "Frontend directory" && ((passed_checks++)) || true; ((total_checks++))
check_dir "data" "Data directory" && ((passed_checks++)) || true; ((total_checks++))
check_dir "config" "Config directory" && ((passed_checks++)) || true; ((total_checks++))
check_dir "tools" "Tools directory" && ((passed_checks++)) || true; ((total_checks++))

# Phase 2: Essential Files
echo -e "\n${BOLD}Phase 2: Essential Files${NC}"
check_file "app.py" "Main application entry point" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/__init__.py" "Backend package initialization" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/utils/db_utils.py" "Database utilities" && ((passed_checks++)) || true; ((total_checks++))
check_file "config/development.py" "Development configuration" && ((passed_checks++)) || true; ((total_checks++))

# Phase 3: Model Files
echo -e "\n${BOLD}Phase 3: Model Files${NC}"
check_dir "backend/data/models" "Models directory" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/data/models/character.py" "Character model" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/data/models/question.py" "Question model" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/data/models/node.py" "Node model" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/data/models/__init__.py" "Models package initialization" && ((passed_checks++)) || true; ((total_checks++))

# Phase 4: Repository Files
echo -e "\n${BOLD}Phase 4: Repository Files${NC}"
check_dir "backend/data/repositories" "Repositories directory" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/data/repositories/character_repo.py" "Character repository" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/data/repositories/question_repo.py" "Question repository" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/data/repositories/__init__.py" "Repositories package initialization" && ((passed_checks++)) || true; ((total_checks++))

# Phase 5: Core Files
echo -e "\n${BOLD}Phase 5: Core Files${NC}"
check_dir "backend/core" "Core directory" && ((passed_checks++)) || true; ((total_checks++))
check_dir "backend/plugins" "Plugins directory" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/core/state_manager.py" "State manager" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/plugins/base_plugin.py" "Base plugin" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/core/__init__.py" "Core package initialization" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/plugins/__init__.py" "Plugins package initialization" && ((passed_checks++)) || true; ((total_checks++))

# Phase 6: API Files
echo -e "\n${BOLD}Phase 6: API Files${NC}"
check_dir "backend/api" "API directory" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/api/routes.py" "API routes" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/api/character_routes.py" "Character routes" && ((passed_checks++)) || true; ((total_checks++))
check_file "backend/api/__init__.py" "API package initialization" && ((passed_checks++)) || true; ((total_checks++))

# Phase 7: Frontend Files
echo -e "\n${BOLD}Phase 7: Frontend Files${NC}"
check_dir "frontend/src/core" "Frontend core directory" && ((passed_checks++)) || true; ((total_checks++))
check_file "frontend/src/core/bootstrap.js" "Bootstrap JavaScript" && ((passed_checks++)) || true; ((total_checks++))
check_file "frontend/src/core/event_system.js" "Event system JavaScript" && ((passed_checks++)) || true; ((total_checks++))

# Phase 8: Import Fixer
echo -e "\n${BOLD}Phase 8: Import Fixer${NC}"
check_dir "tools" "Tools directory" && ((passed_checks++)) || true; ((total_checks++))
check_file "tools/import_fixer.py" "Import fixer utility" && ((passed_checks++)) || true; ((total_checks++))

# Calculate progress percentage
progress=$(( (passed_checks * 100) / total_checks ))

# Print progress summary
echo -e "\n${BOLD}${BLUE}=== Progress Summary ===${NC}"
echo -e "${BOLD}Completed:${NC} $passed_checks/$total_checks checks (${BOLD}${progress}%${NC})"

# Progress bar
bar_size=50
completed_size=$(( bar_size * passed_checks / total_checks ))
remaining_size=$(( bar_size - completed_size ))

echo -n "["
printf "%${completed_size}s" | tr " " "█"
printf "%${remaining_size}s" | tr " " "░"
echo -e "] ${progress}%"

# Provide next steps based on progress
echo -e "\n${BOLD}${BLUE}=== Next Steps ===${NC}"

if [ $progress -eq 100 ]; then
    echo -e "${GREEN}Congratulations! The reorganization appears to be complete.${NC}"
    echo -e "Next step: ${YELLOW}Run tests to ensure everything is working properly.${NC}"
    echo -e "  python -m pytest tests/"
    echo -e "  python app.py"
elif [ $progress -lt 25 ]; then
    echo -e "${YELLOW}You're just getting started. Begin with creating the base project structure:${NC}"
    echo -e "  chmod +x missing-files-script.sh"
    echo -e "  ./missing-files-script.sh"
elif [ $progress -lt 50 ]; then
    echo -e "${YELLOW}Focus on moving the essential model and repository files next:${NC}"
    echo -e "  mkdir -p ${BASE_DIR}/backend/data/models"
    echo -e "  mkdir -p ${BASE_DIR}/backend/data/repositories"
    echo -e "  cp character-model.py ${BASE_DIR}/backend/data/models/character.py"
    echo -e "  cp question-model.py ${BASE_DIR}/backend/data/models/question.py"
    echo -e "  cp node-model.py ${BASE_DIR}/backend/data/models/node.py"
elif [ $progress -lt 75 ]; then
    echo -e "${YELLOW}Continue with moving the core and API files:${NC}"
    echo -e "  mkdir -p ${BASE_DIR}/backend/core"
    echo -e "  mkdir -p ${BASE_DIR}/backend/plugins"
    echo -e "  mkdir -p ${BASE_DIR}/backend/api"
    echo -e "  cp state-manager.py ${BASE_DIR}/backend/core/state_manager.py"
    echo -e "  cp base-plugin.py ${BASE_DIR}/backend/plugins/base_plugin.py"
else
    echo -e "${YELLOW}Almost there! Focus on the frontend files and import fixing:${NC}"
    echo -e "  mkdir -p ${BASE_DIR}/frontend/src/core"
    echo -e "  cp bootstrap-js.js ${BASE_DIR}/frontend/src/core/bootstrap.js"
    echo -e "  cp event-system-js.js ${BASE_DIR}/frontend/src/core/event_system.js"
    echo -e "  python ${BASE_DIR}/tools/import_fixer.py ${BASE_DIR}"
fi

echo -e "\n${BOLD}${BLUE}=== End of Report ===${NC}\n"
