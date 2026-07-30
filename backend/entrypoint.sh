#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import asyncio
import sys
from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine

async def check():
    engine = create_async_engine(settings.database_url)
    async with engine.connect():
        pass
    await engine.dispose()

try:
    asyncio.run(check())
except Exception:
    sys.exit(1)
"; do
  sleep 1
done
echo "Database is up."

alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
