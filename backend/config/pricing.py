"""
Zentrale Preis-Konfiguration für Kampagnen
Definiert Credits-Kosten pro Lead für verschiedene Kampagnentypen.
"""

CAMPAIGN_PRICING = {
    'lead_generation': {
        'credits_per_lead': 1.0,
        'name': 'Lead Generation',
        'description': 'Für Ihre eigene Verwendung - fertig zum Download als CSV',
        'features': [
            'Firmenname, Website, Adresse',
            'Telefon, Stadt',
            'Meta-Description, Keywords',
            'About-Text, Services',
            'E-Mail'
        ]
    },
    'ai_email_campaign': {
        'credits_per_lead': 1.6,  # 1.0 Lead + 0.5 AI Gen + 0.1 Send
        'breakdown': {
            'lead_search': 1.0,
            'ai_generation': 0.5,
            'email_sending': 0.1
        },
        'name': 'AI Email Campaign',
        'description': 'Autopilot: Lead-Suche + AI-Emails + Versand',
        'features': [
            'Alle Lead Generation Features',
            'AI-Email-Generierung (GPT-4o)',
            'Automatischer Versand',
            'Email-Tracking (Open/Bounce)',
            'Compliance-Check'
        ]
    },
    'phone_campaign': {
        'credits_per_lead': 5.0, # Example price
        'breakdown': {
            'lead_search': 1.0,
            'ai_call': 4.0
        },
        'name': 'Phone Campaign',
        'description': 'KI-Anrufberater für automatisierte Erstgespräche',
        'features': [
            'Alle Lead Generation Features',
            'KI-Sprach-Anruf (Human-like)',
            'Terminvereinbarung',
            'Transkript & Analyse'
        ]
    }
}

def get_campaign_price(campaign_type: str) -> float:
    """Get total credit price per lead for campaign type"""
    return CAMPAIGN_PRICING.get(campaign_type, {}).get('credits_per_lead', 1.0)
