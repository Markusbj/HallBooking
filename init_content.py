#!/usr/bin/env python3
"""
Script to initialize default page content in the database.
Run this after setting up the database to populate it with default content.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import AsyncSessionLocal
from app.models import PageContent
from app.crud import create_page_content

# Default content for different pages
DEFAULT_CONTENT = [
    # Landing page content
    {
        "page_name": "landing",
        "section_name": "hero_title",
        "content": "Velkommen til TG Tromsø",
        "content_type": "text"
    },
    {
        "page_name": "landing",
        "section_name": "hero_subtitle",
        "content": "Booking av hall og kurs til din hund",
        "content_type": "text"
    },
    {
        "page_name": "landing",
        "section_name": "features_title",
        "content": "Funksjoner",
        "content_type": "text"
    },
    {
        "page_name": "landing",
        "section_name": "about_title",
        "content": "Om TG Tromsø",
        "content_type": "text"
    },
    {
        "page_name": "landing",
        "section_name": "about_text1",
        "content": "TG Tromsø er din lokale hundetreningsklubb som tilbyr profesjonell opplæring og treningshaller for hunder og deres eiere. Med vårt system kan du enkelt se tilgjengelighet, booke treningshaller og melde deg på kurs.",
        "content_type": "text"
    },
    {
        "page_name": "landing",
        "section_name": "about_text2",
        "content": "Vi fokuserer på positiv hundetrening og skaper et trygt og lærerikt miljø for både hunder og eiere i Tromsø-området.",
        "content_type": "text"
    },
    {
        "page_name": "landing",
        "section_name": "cta_title",
        "content": "Kom i gang i dag",
        "content_type": "text"
    },
    {
        "page_name": "landing",
        "section_name": "cta_text",
        "content": "Registrer deg for å få tilgang til alle funksjonene i TG Tromsø",
        "content_type": "text"
    },
    
    # Instructors page content
    {
        "page_name": "instruktorer",
        "section_name": "pageTitle",
        "content": "Våre instruktører",
        "content_type": "text"
    },
    {
        "page_name": "instruktorer",
        "section_name": "pageSubtitle",
        "content": "Møt vårt erfarne team av hundetreningsinstruktører",
        "content_type": "text"
    },
    {
        "page_name": "instruktorer",
        "section_name": "instructorsTitle",
        "content": "Vårt team",
        "content_type": "text"
    },
    {
        "page_name": "instruktorer",
        "section_name": "instructorsDescription",
        "content": "Våre instruktører har alle lang erfaring og er sertifisert innen hundetrening. Vi jobber kontinuerlig med å oppdatere vår kunnskap og følge de nyeste treningsmetodene.",
        "content_type": "text"
    },
    
    # About us page content
    {
        "page_name": "om-oss",
        "section_name": "pageTitle",
        "content": "Om TG Tromsø",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "pageSubtitle",
        "content": "Din lokale hundetrening-klubb i Tromsø",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "aboutTitle",
        "content": "Vår historie",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "aboutText1",
        "content": "TG Tromsø ble etablert i 2010 med mål om å tilby kvalitetshundetrening til alle hundeeiere i Tromsø-området. Vi har vokst fra en liten gruppe entusiaster til å bli en av byens ledende hundetrening-klubber.",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "aboutText2",
        "content": "Vår klubb er basert på positive treningsmetoder og fokus på både hundens og eierens trivsel. Vi tror på at god trening skaper sterke bånd mellom hund og eier.",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "historyTitle",
        "content": "Vår historie",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "historyText",
        "content": "TG Tromsø ble etablert i 2010 med mål om å tilby kvalitetshundetrening til alle hundeeiere i Tromsø-området. Vi har vokst fra en liten gruppe entusiaster til å bli en av byens ledende hundetrening-klubber.",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "missionTitle",
        "content": "Vår misjon",
        "content_type": "text"
    },
    {
        "page_name": "om-oss",
        "section_name": "missionText",
        "content": "Vår klubb er basert på positive treningsmetoder og fokus på både hundens og eierens trivsel. Vi tror på at god trening skaper sterke bånd mellom hund og eier.",
        "content_type": "text"
    },
    
    # Contact page content
    {
        "page_name": "kontakt",
        "section_name": "page_title",
        "content": "Kontakt oss",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "page_subtitle",
        "content": "Vi hjelper deg gjerne med spørsmål om hundetrening",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "contact_title",
        "content": "Kontaktinformasjon",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "address_title",
        "content": "📍 Adresse",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "address_text",
        "content": "TG Tromsø hundehall<br />Strandgata 59, 3. etasje<br />9008 Tromsø",
        "content_type": "html"
    },
    {
        "page_name": "kontakt",
        "section_name": "phone_title",
        "content": "📞 Telefon",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "phone_text",
        "content": "<a href=\"tel:+4777644555\">+47 77 64 45 55</a><br /><small>Åpent: Man-Fre 08:00-20:00, Lør 09:00-16:00</small>",
        "content_type": "html"
    },
    {
        "page_name": "kontakt",
        "section_name": "email_title",
        "content": "📧 E-post",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "email_text",
        "content": "<a href=\"mailto:post@tgtromso.no\">post@tgtromso.no</a><br /><a href=\"mailto:trening@tgtromso.no\">trening@tgtromso.no</a>",
        "content_type": "html"
    },
    {
        "page_name": "kontakt",
        "section_name": "hours_title",
        "content": "🕒 Åpningstider",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "social_title",
        "content": "🌐 Sosiale medier",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "form_title",
        "content": "Send oss en melding",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "map_title",
        "content": "Hvordan finner du oss?",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "map_text",
        "content": "Vi ligger sentralt i Tromsø med lett tilgang både med bil og kollektivtransport. Det er gratis parkering rett utenfor inngangen, og bussholdeplassen \"Strandgata\" er bare 2 minutter gange unna.",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "location_title",
        "content": "📍 Vår lokasjon",
        "content_type": "text"
    },
    {
        "page_name": "kontakt",
        "section_name": "location_text",
        "content": "<strong>TG Tromsø hundehall</strong><br />Strandgata 59, 3. etasje<br />9008 Tromsø",
        "content_type": "html"
    }
]

async def init_content():
    """Initialize default content in the database."""
    print("Initializing default page content...")
    
    # Create tables first
    from app.database import Base, engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
    
    async with AsyncSessionLocal() as db:
        try:
            for content_data in DEFAULT_CONTENT:
                # Check if content already exists
                from sqlalchemy import select
                result = await db.execute(
                    select(PageContent).filter(
                        PageContent.page_name == content_data["page_name"],
                        PageContent.section_name == content_data["section_name"]
                    )
                )
                existing = result.scalar_one_or_none()
                
                if existing:
                    print(f"Content already exists for {content_data['page_name']}.{content_data['section_name']}")
                    continue
                
                # Create new content
                page_content = PageContent(
                    page_name=content_data["page_name"],
                    section_name=content_data["section_name"],
                    content=content_data["content"],
                    content_type=content_data["content_type"],
                    created_by="system"
                )
                
                db.add(page_content)
                print(f"Created content for {content_data['page_name']}.{content_data['section_name']}")
            
            await db.commit()
            print("✅ Default content initialized successfully!")
            
        except Exception as e:
            print(f"❌ Error initializing content: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(init_content())
