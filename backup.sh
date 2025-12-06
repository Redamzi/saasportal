#!/bin/bash
# Voyanero Backup Script
# Erstellt vollständiges Backup von Code + Datenbank

set -e  # Exit on error

# Konfiguration
BACKUP_DIR="$HOME/Desktop/VOYANERO_BACKUPS"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="voyanero_backup_${TIMESTAMP}"
PROJECT_DIR="/Users/amziredzep/Desktop/KUPCI/VOYANERO/Projekt/saasportal"

echo "🔄 Voyanero Backup gestartet..."
echo "📅 Zeitstempel: ${TIMESTAMP}"

# Backup-Verzeichnis erstellen
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# 1. CODE BACKUP (Git Repository)
echo ""
echo "📦 1/3: Code-Backup (Git)..."
cd "${PROJECT_DIR}"

# Git Status prüfen
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warnung: Es gibt uncommitted changes!"
    git status --short
fi

# Aktuellen Branch und Commit speichern
git branch --show-current > "${BACKUP_DIR}/${BACKUP_NAME}/git_branch.txt"
git rev-parse HEAD > "${BACKUP_DIR}/${BACKUP_NAME}/git_commit.txt"
git log -1 --pretty=format:"%H%n%an%n%ae%n%ad%n%s" > "${BACKUP_DIR}/${BACKUP_NAME}/git_last_commit.txt"

# Komplettes Repository kopieren (inkl. .git)
echo "   Kopiere Repository..."
rsync -a --exclude='node_modules' \
         --exclude='__pycache__' \
         --exclude='.next' \
         --exclude='dist' \
         --exclude='build' \
         --exclude='.venv' \
         "${PROJECT_DIR}/" "${BACKUP_DIR}/${BACKUP_NAME}/code/"

echo "   ✅ Code gesichert"

# 2. DATENBANK BACKUP (Supabase)
echo ""
echo "🗄️  2/3: Datenbank-Backup..."
echo "   ⚠️  WICHTIG: Führe folgende SQL-Befehle in Supabase SQL Editor aus:"
echo ""
cat > "${BACKUP_DIR}/${BACKUP_NAME}/database_backup_instructions.sql" << 'EOF'
-- ============================================
-- VOYANERO DATABASE BACKUP
-- Führe diese Befehle in Supabase SQL Editor aus
-- ============================================

-- 1. PROFILES (User-Daten)
COPY (
    SELECT * FROM profiles
) TO STDOUT WITH CSV HEADER;
-- Speichere als: profiles.csv

-- 2. CAMPAIGNS
COPY (
    SELECT * FROM campaigns
) TO STDOUT WITH CSV HEADER;
-- Speichere als: campaigns.csv

-- 3. LEADS
COPY (
    SELECT * FROM leads
) TO STDOUT WITH CSV HEADER;
-- Speichere als: leads.csv

-- 4. GENERATED_EMAILS
COPY (
    SELECT * FROM generated_emails
) TO STDOUT WITH CSV HEADER;
-- Speichere als: generated_emails.csv

-- 5. IMPRESSUM_CACHE
COPY (
    SELECT * FROM impressum_cache
) TO STDOUT WITH CSV HEADER;
-- Speichere als: impressum_cache.csv

-- 6. CREDIT_TRANSACTIONS
COPY (
    SELECT * FROM credit_transactions
) TO STDOUT WITH CSV HEADER;
-- Speichere als: credit_transactions.csv

-- ============================================
-- ALTERNATIVE: Komplettes Schema exportieren
-- ============================================

-- Schema-Struktur (Tabellen, Indizes, Constraints)
-- Gehe zu: Database → Schema → Export Schema (SQL)

EOF

echo "   📄 Anleitung erstellt: database_backup_instructions.sql"
echo "   ⚠️  Bitte manuell in Supabase ausführen!"

# 3. ENVIRONMENT VARIABLES
echo ""
echo "🔐 3/3: Environment Variables..."

# Backend .env
if [ -f "${PROJECT_DIR}/backend/.env" ]; then
    cp "${PROJECT_DIR}/backend/.env" "${BACKUP_DIR}/${BACKUP_NAME}/backend_env.txt"
    echo "   ✅ Backend .env gesichert"
else
    echo "   ⚠️  Backend .env nicht gefunden"
fi

# Frontend .env
if [ -f "${PROJECT_DIR}/frontend/.env" ]; then
    cp "${PROJECT_DIR}/frontend/.env" "${BACKUP_DIR}/${BACKUP_NAME}/frontend_env.txt"
    echo "   ✅ Frontend .env gesichert"
else
    echo "   ⚠️  Frontend .env nicht gefunden"
fi

# 4. METADATA
echo ""
echo "📋 Erstelle Backup-Metadata..."

cat > "${BACKUP_DIR}/${BACKUP_NAME}/BACKUP_INFO.txt" << EOF
VOYANERO BACKUP
===============

Erstellt am: $(date)
Backup Name: ${BACKUP_NAME}

GIT INFORMATION
---------------
Branch: $(cat "${BACKUP_DIR}/${BACKUP_NAME}/git_branch.txt")
Commit: $(cat "${BACKUP_DIR}/${BACKUP_NAME}/git_commit.txt")

PROJEKT STRUKTUR
----------------
$(tree -L 2 -d "${BACKUP_DIR}/${BACKUP_NAME}/code/" 2>/dev/null || echo "tree nicht installiert")

DATEIGRÖSSEN
------------
Code: $(du -sh "${BACKUP_DIR}/${BACKUP_NAME}/code/" | cut -f1)
Gesamt: $(du -sh "${BACKUP_DIR}/${BACKUP_NAME}/" | cut -f1)

WIEDERHERSTELLUNG
-----------------
1. Code: Kopiere 'code/' Verzeichnis zurück
2. Datenbank: Importiere CSV-Dateien in Supabase
3. Environment: Kopiere .env Dateien zurück
4. Git: git checkout <commit-hash>

EOF

# 5. ZUSAMMENFASSUNG
echo ""
echo "✅ BACKUP ABGESCHLOSSEN!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Backup-Verzeichnis: ${BACKUP_DIR}/${BACKUP_NAME}"
echo ""
echo "📦 Gesichert:"
echo "   ✅ Code (Git Repository)"
echo "   ✅ Environment Variables"
echo "   📄 Datenbank-Anleitung (manuell ausführen)"
echo ""
echo "📊 Backup-Größe: $(du -sh "${BACKUP_DIR}/${BACKUP_NAME}/" | cut -f1)"
echo ""
echo "⚠️  NÄCHSTE SCHRITTE:"
echo "   1. Öffne: ${BACKUP_DIR}/${BACKUP_NAME}/database_backup_instructions.sql"
echo "   2. Führe SQL-Befehle in Supabase aus"
echo "   3. Speichere CSV-Dateien im Backup-Verzeichnis"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Öffne Backup-Verzeichnis im Finder
open "${BACKUP_DIR}/${BACKUP_NAME}"
