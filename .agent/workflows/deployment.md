---
description: Deployment workflow for GitHub + Coolify
---

# Deployment Workflow

## Important Context
- **Version Control**: We use GitHub exclusively (branch: `main`)
- **Deployment**: Coolify on Hetzner
- **Workflow**: Always commit → push to GitHub → deploy via Coolify

## Standard Deployment Steps

### 1. Check Git Status
```bash
git status
```

### 2. Add Changes
```bash
git add .
# or for specific files:
git add <file>
```

### 3. Commit Changes
```bash
git commit -m "descriptive commit message"
```

// turbo
### 4. Push to GitHub
```bash
git push
```

### 5. Deploy via Coolify
- **Frontend changes**: Deploy frontend service in Coolify
- **Backend changes**: Deploy backend service in Coolify
- **Both changed**: Deploy both services

## Notes
- All changes MUST be pushed to GitHub before deployment
- Coolify pulls from `main` branch
- No local-only development - everything goes through GitHub
