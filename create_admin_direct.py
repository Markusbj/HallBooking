#!/usr/bin/env python3
"""
Script to create admin user.
SECURITY: This script uses interactive input only - no hardcoded values or 
environment variables for passwords. Passwords are hidden during input.

For production, use the admin panel web interface instead of this script.
This script is primarily for initial setup or development.
"""

import asyncio
import sys
import os
from datetime import datetime
import getpass

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import AsyncSessionLocal
from app.models import User
from passlib.context import CryptContext
from sqlalchemy import select

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def create_admin_user():
    """
    Create admin user with interactive input only.
    
    SECURITY NOTES:
    - Passwords are never stored in code or environment variables
    - Password input is hidden (getpass)
    - Password is never printed to console
    - For production: Use the admin panel web interface instead
    """
    print("Creating admin user...")
    print("⚠️  SECURITY: This script uses interactive input only.")
    print("⚠️  For production, use the admin panel web interface instead.\n")
    
    # Get admin details - ONLY from interactive input for security
    # Email can optionally come from env var for automation, but password NEVER should
    email = os.getenv("ADMIN_EMAIL") or input("Enter admin email: ").strip()
    if not email:
        print("❌ Email is required")
        return
    
    # SECURITY: Password must ALWAYS come from interactive input, never env vars
    # This prevents accidental exposure in process lists, logs, or docker images
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
        # Check if user already exists
        existing_user = await db.execute(
            select(User).filter(User.email == email)
        )
        if existing_user.scalar_one_or_none():
            print(f"User with email {email} already exists!")
            return
        
        # Create new admin user
        hashed_password = get_password_hash(password)
        admin_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_superuser=True,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
        
        print(f"\n✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Full name: {full_name or 'Not set'}")
        print(f"   Admin Status: ✅")
        print(f"   User ID: {admin_user.id}")
        print(f"\n⚠️  Security: Password was NOT displayed. Store it securely if needed.")
        print(f"⚠️  Remember: For production, use the admin panel web interface instead.")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
