import requests
from bs4 import BeautifulSoup

url = "https://60secondstonapoli.de"
response = requests.get(url, timeout=10)
html = response.text

soup = BeautifulSoup(html, 'lxml')

# Test 1: Find meta description
meta_desc = soup.find('meta', attrs={'name': 'description'})
print(f"Meta tag found: {meta_desc is not None}")
if meta_desc:
    print(f"Content attribute: {meta_desc.get('content')}")
    print(f"Full tag: {meta_desc}")

# Test 2: Check if it's in the HTML
search_str = 'meta name="description"'
print(f"\n'{search_str}' in HTML: {search_str in html}")
print(f"HTML length: {len(html)} bytes")
