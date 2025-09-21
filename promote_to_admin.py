#!/usr/bin/env python3
"""
Script to promote an existing user to admin.
Run this to make an existing user an admin.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

async def promote_to_admin():
    """Promote an existing user to admin."""
    print("Promoting user to admin...")
    
    email = input("Enter user email to promote: ").strip()
    if not email:
        print("❌ Email is required")
        return
    
    async with AsyncSessionLocal() as db:
        try:
            # Find the user
            result = await db.execute(select(User).filter(User.email == email))
            user = result.scalar_one_or_none()
            
            if not user:
                print(f"❌ User with email {email} not found")
                return
            
            if user.is_superuser:
                print(f"❌ User {email} is already an admin")
                return
            
            # Promote to admin
            user.is_superuser = True
            user.is_verified = True  # Also verify the user
            
            db.add(user)
            await db.commit()
            
            print(f"✅ User {email} promoted to admin successfully!")
            print(f"   Email: {user.email}")
            print(f"   Full Name: {user.full_name or 'Not set'}")
            print(f"   Admin Status: ✅")
            
        except Exception as e:
            print(f"❌ Error promoting user: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(promote_to_admin())
