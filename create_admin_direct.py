#!/usr/bin/env python3
"""
Script to create admin user directly with hardcoded values.
"""

import asyncio
import sys
import os
from datetime import datetime

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
    """Create admin user with hardcoded values"""
    print("Creating admin user...")
    
    email = "admin@tgtromso.no"
    password = "admin123"
    full_name = "Admin User"
    
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
        
        print(f"✅ Admin user created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Full name: {full_name}")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
