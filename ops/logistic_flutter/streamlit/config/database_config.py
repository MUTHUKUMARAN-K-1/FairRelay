"""
Database Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration using individual parameters
DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "women_empowerment_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

# Connection string (alternative method)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}@"
    f"{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}"
)

# Database pool settings
POOL_CONFIG = {
    "min_connections": 1,
    "max_connections": 10,
    "connection_timeout": 30,
}

# Query timeout settings
QUERY_CONFIG = {
    "statement_timeout": 30000,  # 30 seconds
    "lock_timeout": 5000,  # 5 seconds
    "idle_in_transaction_session_timeout": 60000,  # 60 seconds
}

# SSL Configuration
SSL_CONFIG = {
    "sslmode": "require",
    "sslrootcert": None,  # Path to root certificate if needed
}
