
import os
from supabase import create_client

def get_env_vars():
    vars = {}
    try:
        if os.path.exists(".env"):
            with open(".env") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'): continue
                    if '=' in line:
                        key, val = line.split('=', 1)
                        vars[key.strip()] = val.strip().strip('"').strip("'")
    except Exception as e:
        print(f"Error reading .env: {e}")
    return vars

env = get_env_vars()
url = env.get("SUPABASE_URL")
key = env.get("SUPABASE_SERVICE_KEY") or env.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Cannot proceed without keys")
    exit(1)

client = create_client(url, key)
domain = "60secondstonapoli.de"

print(f"Checking cache for {domain}...")
res = client.table("impressum_cache").select("*").eq("domain", domain).execute()

if res.data:
    entry = res.data[0]
    print(f"✅ Found in cache!")
    print(f"Crawled at: {entry['crawled_at']}")
    print(f"Meta Description: {entry.get('meta_description')}") # Columns might vary if schema changed?
    # Note: impressum_cache schema might not have meta_description if it wasn't there before?
    # Or maybe it's storing everything?
    # The cache code saves: domain, website, email, email_verified, is_personal, all_emails, scraped_from, success, error_message
    # Wait, 'impressum_cache' table schema in code (routes/impressum.py) line 63 only has those fields!
    # Does it store metadata?
    print(f"Keys: {entry.keys()}")
else:
    print("❌ Not found in cache")
