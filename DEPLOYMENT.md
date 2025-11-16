# Voyanero Deployment Guide

Complete guide for deploying Voyanero to production.

## Prerequisites

- Docker and Docker Compose installed
- Domain names configured:
  - `voyanero.com` - Frontend
  - `api.voyanero.com` - Backend API
  - `superbase.voyanero.com` - Supabase instance
- SSL certificates (Let's Encrypt recommended)
- Supabase account with database configured

## Quick Deployment

### 1. Clone Repository

```bash
git clone <repository-url>
cd saasportal
```

### 2. Configure Environment Variables

#### Backend Configuration

```bash
cp backend/.env.production.example backend/.env.production
```

Edit `backend/.env.production` and set:

```env
# Supabase - Get from Supabase Dashboard > Settings > API
SUPABASE_URL=https://superbase.voyanero.com
SUPABASE_SERVICE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>

# JWT - Generate secure random key (min 32 characters)
JWT_SECRET_KEY=<generate-with: openssl rand -hex 32>

# Redis - Set secure password
REDIS_PASSWORD=<secure-random-password>

# Stripe (optional - for payments)
STRIPE_SECRET_KEY=<your-stripe-secret-key>

# Other services as needed
```

#### Frontend Configuration

```bash
cp frontend/.env.production.example frontend/.env.production
```

Edit `frontend/.env.production` and set:

```env
VITE_SUPABASE_URL=https://superbase.voyanero.com
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=https://api.voyanero.com
```

### 3. Setup Supabase Database

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `backend/database/schema.sql`
3. Execute the SQL script
4. Verify tables were created:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

### 4. Build and Deploy with Docker

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Verify Deployment

```bash
# Check backend health
curl https://api.voyanero.com/health

# Check frontend
curl https://voyanero.com/health

# Test Supabase connection
curl https://api.voyanero.com/api/auth/health
```

## SSL/TLS Setup with Let's Encrypt

### Using Certbot with Nginx

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d voyanero.com -d www.voyanero.com
sudo certbot --nginx -d api.voyanero.com

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

### Update Nginx Configuration

Add to `frontend/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name voyanero.com www.voyanero.com;

    ssl_certificate /etc/letsencrypt/live/voyanero.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voyanero.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name voyanero.com www.voyanero.com;
    return 301 https://$server_name$request_uri;
}
```

## Environment-Specific Configurations

### Development

```bash
docker-compose up
```

Uses:
- `backend/.env` - Development settings
- `frontend/.env` - Development settings
- Hot reload enabled
- Debug mode on

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Uses:
- `backend/.env.production` - Production settings
- `frontend/.env.production` - Production settings
- Optimized builds
- Debug mode off
- Health checks enabled
- Auto-restart enabled

## Scaling

### Horizontal Scaling

Scale backend workers:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Load Balancing

Add Nginx load balancer:

```nginx
upstream backend_servers {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location /api {
        proxy_pass http://backend_servers;
    }
}
```

## Monitoring

### Health Checks

All services have built-in health checks:

```bash
# Backend
curl https://api.voyanero.com/health

# Frontend
curl https://voyanero.com/health

# Redis
docker exec voyanero-redis-prod redis-cli ping
```

### Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Backup

### Database Backup (Supabase)

Supabase provides automated backups. Manual backup:

```bash
# Export schema
pg_dump -h superbase.voyanero.com -U postgres -d postgres --schema-only > schema_backup.sql

# Export data
pg_dump -h superbase.voyanero.com -U postgres -d postgres --data-only > data_backup.sql
```

### Redis Backup

```bash
# Create backup
docker exec voyanero-redis-prod redis-cli SAVE

# Copy backup file
docker cp voyanero-redis-prod:/data/dump.rdb ./redis_backup.rdb
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common issues:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Port already in use

# Test Supabase connection
docker exec voyanero-backend-prod python -c "
from services.supabase_client import test_connection
import asyncio
print(asyncio.run(test_connection()))
"
```

### Frontend Not Loading

```bash
# Check Nginx logs
docker-compose -f docker-compose.prod.yml logs frontend

# Verify build
docker exec voyanero-frontend-prod ls -la /usr/share/nginx/html

# Test Nginx config
docker exec voyanero-frontend-prod nginx -t
```

### Database Connection Issues

```bash
# Verify Supabase URL and keys
# Check RLS policies are correctly set
# Ensure service role key is used for backend

# Test connection from backend
docker exec voyanero-backend-prod curl https://superbase.voyanero.com/rest/v1/
```

## Security Checklist

- [ ] All `.env.production` files are not committed to Git
- [ ] Strong JWT secret key (min 32 characters)
- [ ] Redis password is set
- [ ] SSL/TLS certificates installed
- [ ] CORS origins restricted to production domains
- [ ] Debug mode is disabled
- [ ] Supabase RLS policies are active
- [ ] Rate limiting configured (recommended)
- [ ] Regular security updates applied

## Performance Optimization

### Backend

- Use `--workers 4` for Uvicorn (already in Dockerfile.prod)
- Enable Redis caching for frequently accessed data
- Use connection pooling for database

### Frontend

- Gzip compression enabled (in nginx.conf)
- Static assets cached (1 year)
- CDN recommended for static files
- Code splitting for large bundles

### Database

- Add indexes for frequently queried columns
- Regular VACUUM and ANALYZE
- Monitor slow queries

## Maintenance

### Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Remove old images
docker image prune -a
```

### Database Migrations

```bash
# Create new migration
# Add SQL file to backend/database/migrations/

# Apply migration
docker exec voyanero-backend-prod python scripts/migrate.py
```

## Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## Support

For issues or questions:
- Check logs first
- Review Supabase documentation
- Consult backend/database/README.md for schema issues
- Check environment variables are correctly set

## Production URLs

After deployment, your services will be available at:

- **Frontend**: https://voyanero.com
- **Backend API**: https://api.voyanero.com
- **API Documentation**: https://api.voyanero.com/docs
- **Supabase**: https://superbase.voyanero.com
