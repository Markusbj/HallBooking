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
    """
    Create an admin user account.
    
    SECURITY: Uses interactive input with hidden password entry.
    For production, use the admin panel web interface instead.
    """
    import getpass
    
    print("Creating admin user...")
    print("⚠️  SECURITY: Password input will be hidden.\n")
    
    # Get admin details - interactive input only
    email = input("Enter admin email: ").strip()
    if not email:
        print("❌ Email is required")
        return
    
    # SECURITY: Use getpass to hide password input
    password = getpass.getpass("Enter admin password: ").strip()
    if not password:
        print("❌ Password is required")
        return
    
    # Confirm password
    password_confirm = getpass.getpass("Confirm admin password: ").strip()
    if password != password_confirm:
        print("❌ Passwords do not match")
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
            
            print(f"\n✅ Admin user created successfully!")
            print(f"   Email: {email}")
            print(f"   Full Name: {full_name or 'Not set'}")
            print(f"   Admin Status: ✅")
            print(f"   User ID: {admin_user.id}")
            print(f"\n⚠️  Security: Password was NOT displayed. Store it securely if needed.")
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_admin_user())
