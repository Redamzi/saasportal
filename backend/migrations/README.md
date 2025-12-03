# SQL Migrations - Anleitung

## Reihenfolge der Ausführung:

### 1. Cleanup Migration (ZUERST)
**Datei**: `cleanup_profiles_table.sql`

Entfernt kampagnen-spezifische Felder aus der `profiles` Tabelle.

```sql
-- In Supabase SQL Editor ausführen
```

### 2. Campaigns Migration (DANACH)
**Datei**: `add_campaigns_email_config.sql`

Fügt Email-Konfiguration zur `campaigns` Tabelle hinzu.

```sql
-- In Supabase SQL Editor ausführen
```

---

## Finale Struktur:

### `profiles` Tabelle (User/Firma Stammdaten):
- company_description
- company_industry
- company_services
- company_usp
- value_proposition
- problem_solution
- success_metrics
- certification_file_url, is_certified
- sender_name, sender_email, custom_domain

### `campaigns` Tabelle (Kampagnen-spezifische Email-Config):
- target_industries
- target_company_size
- target_pain_points
- target_opportunities
- acquisition_goal
- acquisition_cta
- email_tone
- email_formality
- email_language
- email_max_length
- email_style_rules
- email_config_completed

### `leads` Tabelle (bereits vorhanden):
- company_name, email, phone, address, website
- industry, rating, reviews, etc.

---

## LLM Email-Generierung Flow:
1. User-Stammdaten (profiles) ✅
2. Kampagnen-Config (campaigns) ✅
3. Lead-Daten (leads) ✅
→ AI generiert personalisierte Email
