import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env vars
load_dotenv('backend/.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

async def check_db():
    print("🔍 Checking database state...")
    
    # Check impressum_cache count
    try:
        res = supabase.table('impressum_cache').select('id', count='exact').execute()
        count = res.count
        print(f"✅ Impressum Cache Count: {count}")
        
        # Get last 5 entries
        res = supabase.table('impressum_cache').select('*').order('created_at', desc=True).limit(5).execute()
        print("\n📝 Last 5 Cache Entries:")
        for item in res.data:
            print(f"- {item['domain']} (Success: {item['success']}) - Email: {item.get('email')}")
            
    except Exception as e:
        print(f"❌ Error checking impressum_cache: {e}")

    # Check leads with email_source = 'impressum_crawler'
    try:
        res = supabase.table('leads').select('id', count='exact').eq('email_source', 'impressum_crawler').execute()
        count = res.count
        print(f"\n✅ Leads enriched by Impressum Crawler: {count}")
    except Exception as e:
        print(f"❌ Error checking leads: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
