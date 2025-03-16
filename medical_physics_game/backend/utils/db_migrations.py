# backend/utils/db_migrations.py
import sqlite3
import os
import json
from datetime import datetime

class DatabaseMigrationManager:
    def __init__(self, db_path):
        self.db_path = db_path
        self.migrations_dir = os.path.join(os.path.dirname(__file__), '../migrations')
        self.conn = None
        
    def _connect(self):
        """Establish a database connection"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        return self.conn
        
    def _close(self):
        """Close the database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None
            
    def _ensure_migrations_table(self):
        """Ensure the migrations table exists"""
        if not self.conn:
            self._connect()
            
        cursor = self.conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            applied_at TIMESTAMP NOT NULL
        )
        ''')
        self.conn.commit()
        
    def _get_applied_migrations(self):
        """Get a list of applied migrations"""
        if not self.conn:
            self._connect()
            
        cursor = self.conn.cursor()
        cursor.execute('SELECT name FROM migrations ORDER BY id')
        return [row['name'] for row in cursor.fetchall()]
        
    def _get_available_migrations(self):
        """Get a list of available migration files"""
        if not os.path.exists(self.migrations_dir):
            os.makedirs(self.migrations_dir)
            return []
            
        files = [f for f in os.listdir(self.migrations_dir) 
                if f.endswith('.sql') and f.startswith('migration_')]
        return sorted(files)
        
    def _apply_migration(self, migration_file):
        """Apply a single migration file"""
        if not self.conn:
            self._connect()
            
        try:
            # Read the migration file
            with open(os.path.join(self.migrations_dir, migration_file), 'r') as f:
                sql = f.read()
                
            # Execute the migration
            cursor = self.conn.cursor()
            cursor.executescript(sql)
            
            # Record the migration
            cursor.execute(
                'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
                (migration_file, datetime.now().isoformat())
            )
            self.conn.commit()
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"Error applying migration {migration_file}: {e}")
            return False
            
    def run_migrations(self):
        """Run all pending migrations"""
        self._connect()
        self._ensure_migrations_table()
        
        applied = self._get_applied_migrations()
        available = self._get_available_migrations()
        
        pending = [m for m in available if m not in applied]
        
        results = []
        for migration in pending:
            success = self._apply_migration(migration)
            results.append({
                'migration': migration,
                'success': success
            })
            
        self._close()
        return results
        
    def create_migration(self, name, sql_content):
        """Create a new migration file"""
        if not os.path.exists(self.migrations_dir):
            os.makedirs(self.migrations_dir)
            
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f"migration_{timestamp}_{name}.sql"
        
        file_path = os.path.join(self.migrations_dir, filename)
        
        with open(file_path, 'w') as f:
            f.write(sql_content)
            
        return filename