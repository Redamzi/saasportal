import sys
sys.path.insert(0, '/Users/amziredzep/Desktop/KUPCI/VOYANERO/Projekt/saasportal/backend')

from services.impressum_scraper import get_impressum_scraper

scraper = get_impressum_scraper()
result = scraper.scrape_website("https://60secondstonapoli.de")

print("\n=== SCRAPER RESULT ===")
print(f"Success: {result.get('success')}")
print(f"Email: {result.get('email')}")
print(f"Meta Description: {result.get('meta_description')[:100]}..." if result.get('meta_description') else "None")
print(f"Meta Keywords: {result.get('meta_keywords')}")
print(f"Services: {result.get('services')}")
print(f"About Text: {result.get('about_text')[:100]}..." if result.get('about_text') else "None")
