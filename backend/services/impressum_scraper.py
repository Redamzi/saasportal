"""
Impressum Scraper Service
Crawls websites to extract email addresses from Impressum/Contact pages
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
from typing import Optional, List, Dict
from services.email_verifier import get_email_verifier
import time

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
    
    # Email regex pattern
    EMAIL_REGEX = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
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
    
    def extract_emails_from_html(self, html: str) -> List[str]:
        """
        Extract all email addresses from HTML
        
        Args:
            html: HTML content
        
        Returns:
            List of email addresses
        """
        # Remove script and style tags
        soup = BeautifulSoup(html, 'lxml')
        for script in soup(['script', 'style']):
            script.decompose()
        
        text = soup.get_text()
        
        # Find all emails using regex
        emails = re.findall(self.EMAIL_REGEX, text)
        
        # Deduplicate and lowercase
        emails = list(set([email.lower() for email in emails]))
        
        return emails
    
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
            
            # Extract emails
            emails = self.extract_emails_from_html(html_to_scrape)
            
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
