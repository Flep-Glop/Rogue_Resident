# Medical Physics Game - Installation Guide

## Requirements

- Python 3.9 or higher
- Node.js 14 or higher (for development)
- SQLite or another compatible database
- Redis (optional, for production caching)

## Installation Steps

### Option 1: Docker Installation (Recommended for Production)

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/medical-physics-game.git
   cd medical-physics-game
   ```

2. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env file with your settings
   ```

3. Build and start the Docker containers:
   ```
   docker-compose up -d
   ```

4. Access the application:
   ```
   Open http://localhost:8000 in your web browser
   ```

### Option 2: Manual Installation (Development)

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/medical-physics-game.git
   cd medical-physics-game
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```
   flask db-init
   ```

5. Run the application:
   ```
   flask run
   ```

6. Access the application:
   ```
   Open http://localhost:5000 in your web browser
   ```

## Configuration

The application can be configured through environment variables or by editing the configuration files in the `config` directory.

### Key Configuration Options

- `SECRET_KEY`: Secret key for session security
- `DATABASE_URI`: URI for the database connection
- `REDIS_URL`: URL for Redis connection (if used)
- `DEBUG`: Enable debug mode (development only)

## Troubleshooting

If you encounter issues during installation:

1. Check the logs:
   ```
   docker-compose logs app  # For Docker
   # OR
   cat logs/app.log         # For manual installation
   ```

2. Verify database connectivity:
   ```
   flask db-test
   ```

3. Check environment variables:
   ```
   flask config
   ```

For additional help, please consult the full documentation or open an issue on GitHub.