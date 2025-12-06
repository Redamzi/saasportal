
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
        else:
             print(".env not found in CWD")
    except Exception as e:
        print(f"Error reading .env: {e}")
    return vars

env = get_env_vars()
url = env.get("SUPABASE_URL")
key = env.get("SUPABASE_SERVICE_KEY")
anon = env.get("SUPABASE_ANON_KEY")

print(f"URL: {url}")
if key:
    print(f"Service Key found (len={len(key)}), starts with ey? {key.startswith('ey')}")
else:
    print("Service Key NOT found")

if anon:
    print(f"Anon Key found (len={len(anon)}), starts with ey? {anon.startswith('ey')}")
else:
    print("Anon Key NOT found")

target_key = key if key and key.startswith('ey') else anon

if not url or not target_key:
    print("Cannot proceed without URL and valid Key")
    exit(1)

try:
    print(f"Connecting to Supabase using {'SERVICE' if target_key == key else 'ANON'} key...")
    client = create_client(url, target_key)
    res = client.table("campaigns").select("name, status, metadata").order("created_at", desc=True).limit(1).execute()
    if res.data:
        c = res.data[0]
        print(f"Campaign: {c['name']}")
        print(f"Status: {c['status']}")
        print(f"Metadata: {c['metadata']}")
    else:
        print("No campaigns found")
except Exception as e:
    print(f"Error: {e}")
