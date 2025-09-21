#!/usr/bin/env python3
"""
Script to create an admin user account.
Run this to create an admin user that can access the CMS.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import AsyncSessionLocal
from app.models import User
from app.auth import get_user_manager
from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def create_admin_user():
    """Create an admin user account."""
    print("Creating admin user...")
    
    # Get admin details
    email = input("Enter admin email: ").strip()
    if not email:
        print("❌ Email is required")
        return
    
    password = input("Enter admin password: ").strip()
    if not password:
        print("❌ Password is required")
        return
    
    full_name = input("Enter admin full name (optional): ").strip()
    
    async with AsyncSessionLocal() as db:
        try:
            # Check if user already exists
            from sqlalchemy import select
            result = await db.execute(select(User).filter(User.email == email))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"❌ User with email {email} already exists")
                return
            
            # Create new admin user
            hashed_password = get_password_hash(password)
            
            admin_user = User(
                email=email,
                hashed_password=hashed_password,
                is_active=True,
                is_superuser=True,  # This makes them an admin
                is_verified=True,
                full_name=full_name or None
            )
            
            db.add(admin_user)
            await db.commit()
            await db.refresh(admin_user)
            
            print(f"✅ Admin user created successfully!")
            print(f"   Email: {email}")
            print(f"   Full Name: {full_name or 'Not set'}")
            print(f"   Admin Status: ✅")
            print(f"   User ID: {admin_user.id}")
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_admin_user())
