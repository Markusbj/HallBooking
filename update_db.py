#!/usr/bin/env python3
"""
Script to update database with new tables.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import Base, engine

async def update_database():
    """Update database with new tables"""
    print("Updating database...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database updated successfully!")

if __name__ == "__main__":
    asyncio.run(update_database())
