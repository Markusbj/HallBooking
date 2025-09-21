#!/usr/bin/env python3
"""
Script to list all users in the database.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

async def list_users():
    """List all users in the database."""
    print("Listing all users...")
    
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(User))
            users = result.scalars().all()
            
            if not users:
                print("No users found in the database.")
                return
            
            print(f"\nFound {len(users)} user(s):")
            print("-" * 80)
            print(f"{'Email':<30} {'Name':<20} {'Admin':<8} {'Active':<8} {'Verified':<10}")
            print("-" * 80)
            
            for user in users:
                admin_status = "✅" if user.is_superuser else "❌"
                active_status = "✅" if user.is_active else "❌"
                verified_status = "✅" if user.is_verified else "❌"
                
                print(f"{user.email:<30} {user.full_name or 'N/A':<20} {admin_status:<8} {active_status:<8} {verified_status:<10}")
            
            print("-" * 80)
            
        except Exception as e:
            print(f"❌ Error listing users: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(list_users())
