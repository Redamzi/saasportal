"""
Impressum Scraper Service
Crawls websites to extract email addresses from Impressum/Contact pages
Supports both static HTML and JavaScript-rendered content via Selenium
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
from typing import Optional, List, Dict
from services.email_verifier import get_email_verifier
import time
import os

# Selenium imports
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    print("⚠️  Selenium not available - JavaScript-rendered sites won't work")


class ImpressumScraper:
    """Service for scraping emails from Impressum pages"""
    
    # Common Impressum URL patterns
    IMPRESSUM_PATTERNS = [
        '/impressum',
        '/imprint',
        '/kontakt',
        '/contact',
        '/about',
        '/ueber-uns',
        '/legal',
        '/datenschutz',
        '/privacy',
        '/contact-us'
    ]
    
    # Impressum link text patterns (case-insensitive)
    IMPRESSUM_LINK_TEXTS = [
        'impressum',
        'imprint',
        'kontakt',
        'contact',
        'legal',
        'datenschutz',
        'privacy',
        'über uns',
        'about us'
    ]
    
    # Email regex pattern (more permissive)
    EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    
    # Tracking/spam domains to exclude
    EXCLUDED_DOMAINS = [
        'facebook.com', 'fb.com', 'google.com', 'cloudflare.com',
        'fontawesome.com', 'twitter.com', 'instagram.com', 'linkedin.com',
        'youtube.com', 'example.com', 'test.com', 'domain.com'
    ]
    
    # Rotating User-Agents to avoid detection
    USER_AGENTS = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ]
    
    def __init__(self):
        self.email_verifier = get_email_verifier()
        self.session = requests.Session()
        self.current_ua_index = 0
        self._update_headers()
    
    def _update_headers(self):
        """Update session headers with rotating User-Agent"""
        user_agent = self.USER_AGENTS[self.current_ua_index % len(self.USER_AGENTS)]
        self.session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
        })
        self.current_ua_index += 1
    
    def _make_request_with_retry(self, url: str, max_retries: int = 3) -> Optional[requests.Response]:
        """
        Make HTTP request with retry logic for 403 errors
        
        Args:
            url: URL to fetch
            max_retries: Maximum number of retry attempts
        
        Returns:
            Response object or None if all retries failed
        """
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, timeout=10, allow_redirects=True)
                response.raise_for_status()
                return response
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 403 and attempt < max_retries - 1:
                    # Rotate User-Agent and retry with exponential backoff
                    wait_time = 2 ** attempt  # 1s, 2s, 4s
                    print(f"⚠️  403 Forbidden on {url}, retrying in {wait_time}s with new User-Agent...")
                    time.sleep(wait_time)
                    self._update_headers()  # Rotate to next User-Agent
                    continue
                else:
                    raise
            except requests.exceptions.SSLError:
                # Try HTTP if HTTPS fails
                if url.startswith('https://'):
                    url = url.replace('https://', 'http://')
                    try:
                        response = self.session.get(url, timeout=10, allow_redirects=True)
                        response.raise_for_status()
                        return response
                    except:
                        raise
                else:
                    raise
        
        return None
    
    def extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return url
    
    def find_impressum_url(self, base_url: str, html: str) -> Optional[str]:
        """
        Find Impressum page URL from homepage
        
        Args:
            base_url: Base URL of the website
            html: HTML content of the homepage
        
        Returns:
            URL to Impressum page or None
        """
        soup = BeautifulSoup(html, 'lxml')
        
        # First, try direct URL patterns
        for pattern in self.IMPRESSUM_PATTERNS:
            test_url = urljoin(base_url, pattern)
            try:
                response = self.session.head(test_url, timeout=5, allow_redirects=True)
                if response.status_code == 200:
                    print(f"✅ Found Impressum at: {test_url}")
                    return test_url
            except:
                continue
        
        # Second, search for links with Impressum-related text
        all_links = soup.find_all('a', href=True)
        
        for link in all_links:
            link_text = link.get_text().strip().lower()
            href = link['href']
            
            # Check if link text matches Impressum patterns
            for pattern in self.IMPRESSUM_LINK_TEXTS:
                if pattern in link_text:
                    impressum_url = urljoin(base_url, href)
                    print(f"✅ Found Impressum link: {impressum_url}")
                    return impressum_url
    
        # Third, as a last resort, try common URL patterns directly
        # This helps when Selenium loads the page but link detection fails
        print(f"⚠️  No Impressum link found in HTML, trying standard URL patterns...")
        fallback_patterns = ['/impressum/', '/impressum', '/kontakt/', '/contact/', '/imprint/']
        for pattern in fallback_patterns:
            test_url = urljoin(base_url, pattern)
            try:
                response = self.session.head(test_url, timeout=3, allow_redirects=True)
                if response.status_code == 200:
                    print(f"✅ Found Impressum via fallback pattern: {test_url}")
                    return test_url
            except:
                continue
        
        print(f"⚠️  No Impressum page found for {base_url}")
        return None
    
    def is_tracking_email(self, email: str) -> bool:
        """Check if email is from a tracking/spam domain"""
        try:
            domain = email.split('@')[1].lower()
            # Check exact match
            if domain in self.EXCLUDED_DOMAINS:
                return True
            # Check if it's a subdomain of excluded domains
            for excluded in self.EXCLUDED_DOMAINS:
                if domain.endswith('.' + excluded) or domain == excluded:
                    return True
            return False
        except:
            return True
    
    def extract_metadata(self, html: str) -> Dict:
        """
        Extract metadata from HTML (description, keywords, services, about text)
        
        Args:
            html: HTML content
        
        Returns:
            Dictionary with extracted metadata
        """
        soup = BeautifulSoup(html, 'lxml')
        metadata = {
            'meta_description': '',
            'meta_keywords': '',
            'services': [],
            'about_text': ''
        }
        
        # 1. Meta Description
        meta_desc = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
        if meta_desc and meta_desc.get('content'):
            metadata['meta_description'] = meta_desc['content'].strip()
            
        # 2. Meta Keywords
        meta_keys = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keys and meta_keys.get('content'):
            metadata['meta_keywords'] = meta_keys['content'].strip()
            
        # 3. Services (Heuristic: Look for "Leistungen", "Services", "Angebot" in nav or headings)
        services = set()
        # Check navigation links
        nav_links = soup.find_all('a', href=True)
        for link in nav_links:
            text = link.get_text().strip().lower()
            if any(keyword in text for keyword in ['leistung', 'service', 'angebot', 'lösung', 'produkt']):
                services.add(link.get_text().strip())
        
        # Check headings
        for tag in ['h1', 'h2', 'h3']:
            for heading in soup.find_all(tag):
                text = heading.get_text().strip()
                if len(text) < 50 and any(keyword in text.lower() for keyword in ['unsere leistungen', 'unsere services', 'was wir tun']):
                    # Get the following list or text
                    next_elem = heading.find_next_sibling()
                    if next_elem:
                        if next_elem.name in ['ul', 'ol']:
                            for li in next_elem.find_all('li'):
                                services.add(li.get_text().strip())
                        elif next_elem.name == 'p':
                            services.add(next_elem.get_text().strip())
                            
        metadata['services'] = list(services)[:5] # Limit to top 5 detected services
        
        # 4. About Text (Heuristic: "Über uns", "About us" sections or first substantial paragraph)
        about_text = ""
        # Try to find "Über uns" section
        about_section = soup.find(string=re.compile(r'Über uns|About us', re.I))
        if about_section:
            parent = about_section.find_parent(['div', 'section', 'p'])
            if parent:
                about_text = parent.get_text(separator=' ', strip=True)
        
        # Fallback: Use meta description or first long paragraph
        if not about_text or len(about_text) < 50:
            if metadata['meta_description']:
                about_text = metadata['meta_description']
            else:
                # Find first paragraph with > 100 chars
                for p in soup.find_all('p'):
                    text = p.get_text(strip=True)
                    if len(text) > 100:
                        about_text = text
                        break
                        
        metadata['about_text'] = about_text[:500] # Limit length
        
        return metadata

    def extract_emails_from_html(self, html: str) -> List[str]:
        """
        Extract all email addresses from HTML with improved accuracy
        Handles obfuscated emails, mailto links, and various formats
        
        Args:
            html: HTML content
        
        Returns:
            List of clean email addresses
        """
        soup = BeautifulSoup(html, 'lxml')
        emails = set()  # Use set to avoid duplicates
        
        # Method 1: Extract from mailto: links (most reliable)
        mailto_links = soup.find_all('a', href=True)
        for link in mailto_links:
            href = link['href']
            if href.startswith('mailto:'):
                email = href.replace('mailto:', '').split('?')[0].strip()
                if '@' in email:
                    emails.add(email.lower())
        
        # Remove script, style, and noscript tags
        for script in soup(['script', 'style', 'noscript', 'svg', 'path']):
            script.decompose()
        
        # Get text and clean it thoroughly
        text = soup.get_text(separator=' ', strip=True)
        
        # Replace common separators with spaces to create word boundaries
        text = re.sub(r'[|•·\t\n\r]+', ' ', text)
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        # Method 2: Extract emails with word boundaries
        # This regex requires whitespace or punctuation around the email
        email_pattern = r'(?:^|[\s,;:()[\]{}"\'])([\w.+-]+@[\w.-]+\.[\w]{2,})(?=[\s,;:()[\]{}"\']|$)'
        matches = re.findall(email_pattern, text, re.IGNORECASE)
        for email in matches:
            emails.add(email.lower())
        
        # Method 3: Handle obfuscated emails (e.g., "info [at] example [dot] com")
        obfuscated_pattern = r'\b([\w.+-]+)\s*\[at\]\s*([\w.-]+)\s*\[dot\]\s*(\w+)\b'
        obfuscated = re.findall(obfuscated_pattern, text, re.IGNORECASE)
        for local, domain, tld in obfuscated:
            email = f"{local}@{domain}.{tld}".lower()
            emails.add(email)
        
        # Method 4: Handle emails with spaces (e.g., "info @ example . com")
        spaced_pattern = r'\b([\w.+-]+)\s+@\s+([\w.-]+)\s+\.\s+(\w+)\b'
        spaced = re.findall(spaced_pattern, text)
        for local, domain, tld in spaced:
            email = f"{local}@{domain}.{tld}".lower()
            emails.add(email)
        
        # Method 5: Look for emails after keywords (with strict boundaries)
        keywords = ['email:', 'e-mail:', 'mail:', 'kontakt:', 'contact:']
        for keyword in keywords:
            pattern = keyword + r'\s*([\w.+-]+@[\w.-]+\.[\w]{2,})'
            matches = re.findall(pattern, text, re.IGNORECASE)
            for email in matches:
                emails.add(email.lower())
        
        # Convert set to list and filter
        emails_list = list(emails)
        
        # Advanced filtering
        valid_emails = []
        for email in emails_list:
            if not self._is_valid_email(email):
                continue
            valid_emails.append(email)
        
        print(f"📧 Found {len(valid_emails)} valid email(s) after filtering: {valid_emails}")
        
        return valid_emails
    
    def _is_valid_email(self, email: str) -> bool:
        """
        Comprehensive email validation
        
        Args:
            email: Email address to validate
        
        Returns:
            True if valid, False otherwise
        """
        # Must contain @ and .
        if '@' not in email or '.' not in email.split('@')[1]:
            return False
        
        # Split into local and domain parts
        try:
            local_part, domain_part = email.split('@')
        except ValueError:
            return False
        
        # Local part checks
        if not local_part or len(local_part) > 64:
            return False
        
        # Domain part checks
        if not domain_part or len(domain_part) > 255:
            return False
        
        # Must not be too long overall
        if len(email) >= 100:
            return False
        
        # Must not be placeholder
        if email.startswith('[email') or email.endswith('protected]'):
            return False
        
        # Must not be tracking email
        if self.is_tracking_email(email):
            return False
        
        # Filter out emails with phone numbers or excessive digits
        # Skip if local part starts with digits (likely phone number prefix)
        if local_part and local_part[0].isdigit():
            return False
        
        # Skip if local part contains more than 4 consecutive digits (likely phone number)
        if re.search(r'\d{5,}', local_part):
            return False
        
        # Skip if email contains suspicious patterns (domain embedded in local part)
        if local_part.count('.') > 3:  # Too many dots in local part
            return False
        
        # NEW: Check for concatenated text patterns
        # Skip if local part ends with common German/English words (indicates concatenation)
        suspicious_endings = [
            'aufsichtsbeh', 'behörde', 'ministerium', 'zust', 'zuständige',
            'www', 'http', 'https', 'de', 'com', 'org', 'net',
            'strasse', 'str', 'platz', 'weg', 'allee'
        ]
        local_lower = local_part.lower()
        for ending in suspicious_endings:
            if local_lower.endswith(ending):
                return False
        
        # NEW: Check domain part for concatenated text
        # Domain should not contain common words concatenated
        domain_lower = domain_part.lower()
        if any(word in domain_lower for word in ['dewww', 'dehttp', 'comwww', 'orgwww']):
            return False
        
        # Domain must have valid TLD
        if '.' not in domain_part:
            return False
        
        tld = domain_part.split('.')[-1]
        if len(tld) < 2 or not tld.isalpha():
            return False
        
        return True

    
    def scrape_with_selenium(self, url: str) -> Optional[str]:
        """
        Scrape website using Selenium (for JavaScript-rendered content)
        
        Args:
            url: Website URL to scrape
        
        Returns:
            HTML content or None
        """
        if not SELENIUM_AVAILABLE:
            print("⚠️  Selenium not available")
            return None
        
        driver = None
        try:
            print(f"🌐 Using Selenium for {url}")
            
            # Setup Chrome options
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # Run in background
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            # Set binary location if using Chromium in Docker
            if os.environ.get('CHROME_BIN'):
                chrome_options.binary_location = os.environ.get('CHROME_BIN')
            
            # Initialize driver
            # In Docker we use system installed chromedriver
            if os.environ.get('CHROMEDRIVER_PATH'):
                service = Service(executable_path=os.environ.get('CHROMEDRIVER_PATH'))
            else:
                # Fallback for local development
                try:
                    service = Service(ChromeDriverManager().install())
                except:
                    # Try default path
                    service = Service()

            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Load page
            driver.get(url)
            
            # Wait for page to load (max 10 seconds)
            time.sleep(3)  # Give JavaScript time to render
            
            # Get page source
            html = driver.page_source
            
            print(f"✅ Selenium loaded {len(html)} bytes")
            return html
            
        except Exception as e:
            print(f"❌ Selenium error: {str(e)}")
            return None
        finally:
            if driver:
                driver.quit()

    
    def scrape_website(self, url: str) -> Dict:
        """
        Scrape website for email addresses
        
        Args:
            url: Website URL to scrape
        
        Returns:
            Dictionary with scraping results
        """
        try:
            print(f"🔍 Scraping: {url}")
            
            # Ensure URL has protocol
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            
            # Fetch homepage with retry logic
            try:
                response = self._make_request_with_retry(url)
                if not response:
                    raise Exception("Failed to fetch homepage after retries")
                
                homepage_html = response.text
                use_selenium = False
            except Exception as e:
                # If we get 403 or other errors, try Selenium immediately
                if '403' in str(e) and SELENIUM_AVAILABLE:
                    print(f"⚡ Got 403 error, switching to Selenium for {url}")
                    homepage_html = self.scrape_with_selenium(url)
                    if not homepage_html:
                        raise Exception(f"Failed with both requests and Selenium: {str(e)}")
                    use_selenium = True
                else:
                    raise
            
            # Try to find Impressum page
            impressum_url = self.find_impressum_url(url, homepage_html)

            # Extract metadata from HOMEPAGE (primary source for description/keywords)
            metadata = self.extract_metadata(homepage_html)
            
            # Scrape Impressum page if found, otherwise use homepage
            # Skip if we're already using Selenium (it loaded the full page with JS)
            if impressum_url and not use_selenium:
                impressum_response = self._make_request_with_retry(impressum_url)
                if impressum_response:
                    html_to_scrape = impressum_response.text
                    scraped_url = impressum_url
                else:
                    html_to_scrape = homepage_html
                    scraped_url = url
            else:
                html_to_scrape = homepage_html
                scraped_url = url
            
            # Extract emails from HTML (Impressum or Homepage)
            emails = self.extract_emails_from_html(html_to_scrape)
            
            # If metadata from homepage was empty, try extracting from current page (Impressum)
            if not metadata['meta_description']:
                secondary_metadata = self.extract_metadata(html_to_scrape)
                metadata['meta_description'] = secondary_metadata['meta_description']
                if not metadata['meta_keywords']:
                    metadata['meta_keywords'] = secondary_metadata['meta_keywords']
                # Merge services
                metadata['services'] = list(set(metadata['services'] + secondary_metadata['services']))[:5]
                # Merge about text
                if not metadata['about_text']:
                    metadata['about_text'] = secondary_metadata['about_text']
            
            # HYBRID APPROACH: If no emails found and not already using Selenium, try it
            if not emails and not use_selenium and SELENIUM_AVAILABLE:
                print(f"⚡ No emails found with normal scraping, trying Selenium...")
                selenium_html = self.scrape_with_selenium(scraped_url)
                if selenium_html:
                    emails = self.extract_emails_from_html(selenium_html)
                    # Update metadata from Selenium HTML if it was empty before
                    if not metadata['meta_description']:
                        metadata = self.extract_metadata(selenium_html)
                    if emails:
                        print(f"✅ Selenium found {len(emails)} email(s)!")
            
            if not emails:
                print(f"❌ No emails found on {scraped_url}")
                return {
                    'success': False,
                    'url': url,
                    'domain': self.extract_domain(url),
                    'email': None,
                    'all_emails': [],
                    'error': 'No emails found',
                    # Return metadata even if no email found
                    'meta_description': metadata['meta_description'],
                    'meta_keywords': metadata['meta_keywords'],
                    'services': metadata['services'],
                    'about_text': metadata['about_text']
                }
            
            print(f"📧 Found {len(emails)} email(s): {emails}")
            
            # Verify and get best email
            best_email = self.email_verifier.get_best_email(emails)
            
            if not best_email:
                print(f"⚠️  All emails failed verification")
                return {
                    'success': False,
                    'url': url,
                    'domain': self.extract_domain(url),
                    'email': None,
                    'all_emails': emails,
                    'error': 'No valid emails found',
                    # Return metadata
                    'meta_description': metadata['meta_description'],
                    'meta_keywords': metadata['meta_keywords'],
                    'services': metadata['services'],
                    'about_text': metadata['about_text']
                }
            
            # Verify the best email
            verification = self.email_verifier.verify_email(best_email, check_mx=True)
            
            print(f"✅ Best email: {best_email} (verified: {verification['valid']})")
            
            return {
                'success': True,
                'url': url,
                'domain': self.extract_domain(url),
                'email': best_email,
                'all_emails': emails,
                'verified': verification['valid'],
                'is_personal': verification.get('is_personal', False),
                'scraped_from': scraped_url,
                # Return metadata
                'meta_description': metadata['meta_description'],
                'meta_keywords': metadata['meta_keywords'],
                'services': metadata['services'],
                'about_text': metadata['about_text']
            }
            
        except requests.exceptions.Timeout:
            print(f"⏱️  Timeout scraping {url}")
            return {
                'success': False,
                'url': url,
                'domain': self.extract_domain(url),
                'email': None,
                'error': 'Timeout'
            }
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error scraping {url}: {str(e)}")
            return {
                'success': False,
                'url': url,
                'domain': self.extract_domain(url),
                'email': None,
                'error': f'Request error: {str(e)}'
            }
        except Exception as e:
            print(f"💥 Error scraping {url}: {str(e)}")
            return {
                'success': False,
                'url': url,
                'domain': self.extract_domain(url),
                'email': None,
                'error': str(e)
            }
    
    def scrape_batch(self, urls: List[str], max_workers: int = 5) -> List[Dict]:
        """
        Scrape multiple websites in parallel
        
        Args:
            urls: List of URLs to scrape
            max_workers: Number of concurrent threads (default 5)
        
        Returns:
            List of scraping results
        """
        import concurrent.futures
        
        results = []
        print(f"🚀 Starting parallel scrape for {len(urls)} websites with {max_workers} workers")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Create a future for each URL
            future_to_url = {executor.submit(self.scrape_website, url): url for url in urls}
            
            for i, future in enumerate(concurrent.futures.as_completed(future_to_url)):
                url = future_to_url[future]
                try:
                    data = future.result()
                    results.append(data)
                    print(f"[{i+1}/{len(urls)}] ✅ Completed {url}")
                except Exception as exc:
                    print(f"[{i+1}/{len(urls)}] 💥 Generated an exception for {url}: {exc}")
                    results.append({
                        'success': False,
                        'url': url,
                        'domain': self.extract_domain(url),
                        'email': None,
                        'error': str(exc)
                    })
        
        return results


# Singleton instance
_impressum_scraper = None

def get_impressum_scraper() -> ImpressumScraper:
    """Get or create ImpressumScraper instance"""
    global _impressum_scraper
    if _impressum_scraper is None:
        _impressum_scraper = ImpressumScraper()
    return _impressum_scraper
