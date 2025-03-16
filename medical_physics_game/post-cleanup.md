# Key Information for Future Developers - Medical Physics Game Reorganization

Here's a summary of important information for future developers who will work on this project:

## Project Architecture

1. **Separation of Concerns**:
   - **Backend**: Python Flask application with organized modules in `backend/`
   - **Frontend**: JavaScript modules and assets in `frontend/`
   - **Data**: Game data files organized by type in `data/`

2. **Backend Structure**:
   - **API Routes**: REST endpoints in `backend/api/`
   - **Data Models**: Type definitions in `backend/data/models/`
   - **Repositories**: Data access in `backend/data/repositories/`
   - **Core Logic**: Game mechanics in `backend/core/`

3. **Frontend Structure**:
   - **Core**: Main logic in `frontend/src/core/`
   - **Entities**: Game objects in `frontend/src/entities/`
   - **Systems**: Game systems in `frontend/src/systems/`
   - **UI**: User interface in `frontend/src/ui/`

## Working with the Code

1. **API Development**:
   - All API endpoints require serialization to dictionaries using `to_dict()` methods
   - Model instances aren't directly JSON serializable

2. **JavaScript Modules**:
   - Using ES6 module format with explicit exports
   - Core modules (EventSystem, StateManager, Game) are properly structured
   - Always use proper ES6 import/export syntax

3. **Data Management**:
   - Game data is stored in JSON files in the `data/` directory
   - Organized by type (characters, items, questions, etc.)
   - Repository pattern is used to abstract data access

## Maintenance Tips

1. **Adding New Features**:
   - Follow the established patterns and directory structure
   - Add new API endpoints in appropriate route files
   - Create new models in `backend/data/models/`
   - Add new frontend components in the right subdirectories

2. **Testing**:
   - API endpoints can be tested via the `curl` command
   - JavaScript modules can be tested with the verification tool in `tests/js/`
   - Full system tests should verify both frontend and backend functionality

3. **Common Issues**:
   - JSON serialization errors usually indicate missing `to_dict()` calls
   - Module import errors usually indicate incorrect paths or missing exports
   - Data loading issues often relate to missing or malformed JSON files

This reorganization significantly improved code organization, maintainability, and follows modern architectural patterns. Future development should be much easier with this clear separation of concerns and modular structure.