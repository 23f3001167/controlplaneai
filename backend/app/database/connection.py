import os
import sys
import logging
import asyncio
from urllib.parse import urlparse, urlunparse
from sqlalchemy import event, text
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from dotenv import load_dotenv

# Set Windows SelectorEventLoop policy for psycopg async compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Initialize logging
logger = logging.getLogger(__name__)


# Load environment variables from .env
load_dotenv()

# Detect test execution context
IS_TESTING = "pytest" in sys.modules or any("pytest" in arg for arg in sys.argv) or os.getenv("APP_ENV") == "test"

if IS_TESTING:
    DATABASE_URL = "sqlite+aiosqlite:///./test_controlplane.db"
    logger.info("Running in test environment. Using isolated test database.")
else:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing!")
    
    # Auto-adjust Render's postgres:// and standard postgresql:// prefixes to async postgresql+psycopg://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)


# Setup async engine. Connect arguments for check_same_thread apply only to SQLite
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Enforce foreign key constraints on SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in DATABASE_URL:
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        except Exception:
            pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def ensure_database_exists():
    """
    Ensure the target database exists in PostgreSQL by connecting to the default 'postgres' database
    and running a CREATE DATABASE command if it's missing.
    """
    if "sqlite" in DATABASE_URL:
        return  # SQLite creates database automatically

    parsed = urlparse(DATABASE_URL)
    db_name = parsed.path.lstrip('/')

    if not db_name:
        raise ValueError(f"Invalid DATABASE_URL (missing database path name): {DATABASE_URL}")

    # Build connection string for the default 'postgres' database
    default_url = urlunparse(parsed._replace(path="/postgres"))

    # Connect to the default 'postgres' db. Use AUTOCOMMIT isolation for administrative operations
    temp_engine = create_async_engine(default_url, isolation_level="AUTOCOMMIT")
    async with temp_engine.connect() as conn:
        stmt = text(f"SELECT 1 FROM pg_database WHERE datname = :dbname")
        res = await conn.execute(stmt, {"dbname": db_name})
        exists = res.scalar()

        if not exists:
            logger.info(f"Database '{db_name}' does not exist. Creating automatically...")
            # PostgreSQL requires identifier quotation for safe database creation if needed
            await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            logger.info(f"Database '{db_name}' created successfully.")
        else:
            logger.info(f"Database '{db_name}' already exists.")

    await temp_engine.dispose()
