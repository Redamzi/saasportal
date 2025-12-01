"""
Email Verifier Service
Validates email addresses with syntax check, MX record verification, and fake email filtering
"""

from email_validator import validate_email, EmailNotValidError
import dns.resolver
from typing import Optional, Dict
import re

class EmailVerifier:
    """Service for email validation and verification"""
    
    # Fake email patterns to filter out
    FAKE_EMAIL_PATTERNS = [
        'noreply@',
        'no-reply@',
        'test@',
        'example@',
        'demo@',
        'backup@',
        'dev@'
    ]
    
    # Disposable email domains
    DISPOSABLE_DOMAINS = [
        'mailinator.com',
        'guerrillamail.com',
        'temp-mail.org',
        '10minutemail.com',
        'throwaway.email'
    ]
    
    def validate_syntax(self, email: str) -> bool:
        """
        Validate email syntax
        
        Args:
            email: Email address to validate
        
        Returns:
            True if syntax is valid, False otherwise
        """
        try:
            # Validate email syntax
            validate_email(email, check_deliverability=False)
            return True
        except EmailNotValidError:
            return False
    
    def verify_mx_record(self, email: str) -> bool:
        """
        Verify MX record exists for email domain
        
        Args:
            email: Email address to verify
        
        Returns:
            True if MX record exists, False otherwise
        """
        try:
            domain = email.split('@')[1]
            mx_records = dns.resolver.resolve(domain, 'MX')
            return len(mx_records) > 0
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers, IndexError):
            return False
        except Exception as e:
            print(f"⚠️  MX verification error for {email}: {str(e)}")
            return False
    
    def is_fake_email(self, email: str) -> bool:
        """
        Check if email matches fake email patterns
        
        Args:
            email: Email address to check
        
        Returns:
            True if email is likely fake, False otherwise
        """
        email_lower = email.lower()
        
        # Check against fake patterns
        for pattern in self.FAKE_EMAIL_PATTERNS:
            if email_lower.startswith(pattern):
                return True
        
        # Check against disposable domains
        try:
            domain = email_lower.split('@')[1]
            if domain in self.DISPOSABLE_DOMAINS:
                return True
        except IndexError:
            return True
        
        return False
    
    def is_personal_email(self, email: str) -> bool:
        """
        Check if email appears to be a personal email (e.g., firstname.lastname@)
        
        Args:
            email: Email address to check
        
        Returns:
            True if email appears personal, False otherwise
        """
        try:
            local_part = email.split('@')[0].lower()
            
            # Check for patterns like firstname.lastname or firstname_lastname
            if '.' in local_part or '_' in local_part:
                parts = re.split(r'[._]', local_part)
                # If we have 2 parts and both are alphabetic, likely personal
                if len(parts) == 2 and all(part.isalpha() for part in parts):
                    return True
            
            return False
        except IndexError:
            return False
    
    def verify_email(self, email: str, check_mx: bool = True) -> Dict:
        """
        Comprehensive email verification
        
        Args:
            email: Email address to verify
            check_mx: Whether to perform MX record check (can be slow)
        
        Returns:
            Dictionary with verification results
        """
        if not email or not isinstance(email, str):
            return {
                'valid': False,
                'email': email,
                'reason': 'Invalid input'
            }
        
        # Syntax check
        if not self.validate_syntax(email):
            return {
                'valid': False,
                'email': email,
                'reason': 'Invalid syntax'
            }
        
        # Fake email check
        if self.is_fake_email(email):
            return {
                'valid': False,
                'email': email,
                'reason': 'Fake email pattern',
                'is_fake': True
            }
        
        # MX record check (optional, can be slow)
        mx_valid = True
        if check_mx:
            mx_valid = self.verify_mx_record(email)
            if not mx_valid:
                return {
                    'valid': False,
                    'email': email,
                    'reason': 'No MX record found',
                    'mx_verified': False
                }
        
        # All checks passed
        return {
            'valid': True,
            'email': email,
            'is_personal': self.is_personal_email(email),
            'is_fake': False,
            'mx_verified': mx_valid
        }
    
    def get_best_email(self, emails: list) -> Optional[str]:
        """
        Get the best email from a list of emails
        Prioritizes personal emails over generic ones
        
        Args:
            emails: List of email addresses
        
        Returns:
            Best email address or None
        """
        if not emails:
            return None
        
        verified_emails = []
        
        for email in emails:
            result = self.verify_email(email, check_mx=False)
            if result['valid']:
                verified_emails.append({
                    'email': email,
                    'is_personal': result.get('is_personal', False)
                })
        
        if not verified_emails:
            return None
        
        # Prioritize personal emails
        personal_emails = [e for e in verified_emails if e['is_personal']]
        if personal_emails:
            return personal_emails[0]['email']
        
        # Return first valid email
        return verified_emails[0]['email']


# Singleton instance
_email_verifier = None

def get_email_verifier() -> EmailVerifier:
    """Get or create EmailVerifier instance"""
    global _email_verifier
    if _email_verifier is None:
        _email_verifier = EmailVerifier()
    return _email_verifier
