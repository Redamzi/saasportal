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
    
    def __init__(self):
        self.email_verifier = get_email_verifier()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
    
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
    
    def extract_emails_from_html(self, html: str) -> List[str]:
        """
        Extract all email addresses from HTML
        Handles obfuscated emails, mailto links, Cloudflare protection, and various formats
        
        Args:
            html: HTML content
        
        Returns:
            List of email addresses
        """
        soup = BeautifulSoup(html, 'lxml')
        emails = []
        
        # Method 1: Extract from mailto: links
        mailto_links = soup.find_all('a', href=True)
        for link in mailto_links:
            href = link['href']
            if href.startswith('mailto:'):
                email = href.replace('mailto:', '').split('?')[0].strip()
                emails.append(email)
        
        # Method 2: Search in raw HTML source (MOST IMPORTANT for JS-rendered content)
        # This catches emails that might be in data attributes or comments
        raw_emails = re.findall(self.EMAIL_REGEX, html)
        emails.extend(raw_emails)
        
        # Method 3: Remove script and style tags, then use regex
        for script in soup(['script', 'style', 'noscript']):
            script.decompose()
        
        # Get text and normalize whitespace (replace newlines with spaces)
        text = soup.get_text()
        # Normalize whitespace: replace multiple spaces/newlines with single space
        text = ' '.join(text.split())
        
        # Method 4: Find emails with standard regex in normalized text
        regex_emails = re.findall(self.EMAIL_REGEX, text)
        emails.extend(regex_emails)
        
        # Method 5: Handle obfuscated emails (e.g., "info [at] example [dot] com")
        obfuscated_pattern = r'\b[\w.+-]+\s*\[at\]\s*[\w.-]+\s*\[dot\]\s*\w+\b'
        obfuscated = re.findall(obfuscated_pattern, text, re.IGNORECASE)
        for email in obfuscated:
            # Convert to normal email format
            email = email.replace('[at]', '@').replace('[dot]', '.').replace(' ', '')
            emails.append(email.lower())
        
        # Method 6: Handle emails with spaces (e.g., "info @ example . com")
        spaced_pattern = r'\b[\w.+-]+\s*@\s*[\w.-]+\s*\.\s*\w+\b'
        spaced = re.findall(spaced_pattern, text)
        for email in spaced:
            # Remove spaces
            email = email.replace(' ', '')
            emails.append(email.lower())
        
        # Method 7: Handle "Reservierungen: email@example.com" pattern
        # Look for email after common keywords
        keywords = ['email:', 'e-mail:', 'mail:', 'kontakt:', 'reservierungen:', 'reservations:']
        for keyword in keywords:
            pattern = keyword + r'\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
            matches = re.findall(pattern, text, re.IGNORECASE)
            emails.extend(matches)
        
        # Deduplicate and lowercase
        emails = list(set([email.lower().strip() for email in emails if email]))
        
        # Filter out obviously invalid emails
        valid_emails = []
        for email in emails:
            # Must contain @ and .
            if '@' in email and '.' in email.split('@')[1]:
                # Must not be too long
                if len(email) < 100:
                    # Must not be placeholder
                    if not email.startswith('[email') and not email.endswith('protected]'):
                        # Must not be tracking email
                        if not self.is_tracking_email(email):
                            valid_emails.append(email)
        
        print(f"📧 Found {len(valid_emails)} valid email(s) after filtering: {valid_emails}")
        
        return valid_emails
    
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
            
            # Fetch homepage
            try:
                response = self.session.get(url, timeout=10, allow_redirects=True)
                response.raise_for_status()
            except requests.exceptions.SSLError:
                # Try HTTP if HTTPS fails
                url = url.replace('https://', 'http://')
                response = self.session.get(url, timeout=10, allow_redirects=True)
                response.raise_for_status()
            
            homepage_html = response.text
            
            # Try to find Impressum page
            impressum_url = self.find_impressum_url(url, homepage_html)
            
            # Scrape Impressum page if found, otherwise use homepage
            if impressum_url:
                try:
                    impressum_response = self.session.get(impressum_url, timeout=10)
                    impressum_response.raise_for_status()
                    html_to_scrape = impressum_response.text
                    scraped_url = impressum_url
                except:
                    html_to_scrape = homepage_html
                    scraped_url = url
            else:
                html_to_scrape = homepage_html
                scraped_url = url
            
            # Extract emails from HTML
            emails = self.extract_emails_from_html(html_to_scrape)
            
            # HYBRID APPROACH: If no emails found, try Selenium
            if not emails and SELENIUM_AVAILABLE:
                print(f"⚡ No emails found with normal scraping, trying Selenium...")
                selenium_html = self.scrape_with_selenium(scraped_url)
                if selenium_html:
                    emails = self.extract_emails_from_html(selenium_html)
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
                    'error': 'No emails found'
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
                    'error': 'No valid emails found'
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
                'scraped_from': scraped_url
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
    
    def scrape_batch(self, urls: List[str], delay: float = 0.5) -> List[Dict]:
        """
        Scrape multiple websites with rate limiting
        
        Args:
            urls: List of URLs to scrape
            delay: Delay between requests in seconds
        
        Returns:
            List of scraping results
        """
        results = []
        
        for i, url in enumerate(urls):
            print(f"\n[{i+1}/{len(urls)}] Scraping {url}")
            result = self.scrape_website(url)
            results.append(result)
            
            # Rate limiting
            if i < len(urls) - 1:
                time.sleep(delay)
        
        return results


# Singleton instance
_impressum_scraper = None

def get_impressum_scraper() -> ImpressumScraper:
    """Get or create ImpressumScraper instance"""
    global _impressum_scraper
    if _impressum_scraper is None:
        _impressum_scraper = ImpressumScraper()
    return _impressum_scraper
