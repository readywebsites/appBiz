# Biz499 Deployment, Production Infrastructure & Backup Guide

This guide details how to deploy Biz499 to production environments (Ubuntu/Debian, Docker, AWS EC2, or DigitalOcean), configure HTTPS, and implement automated PostgreSQL backups and disaster recovery.

---

## 1. Production Architecture Overview

```text
[ Client (Mobile / Browser) ]
              │ HTTPS (Port 443)
              ▼
    [ Nginx Reverse Proxy ]
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
[ Vite Admin SPA ]  [ Gunicorn WSGI ]
 (Static files)        (Django REST API)
                        │
                        ▼
             [ PostgreSQL Database ]
```

---

## 2. Docker Compose Deployment (Recommended)

Create `docker-compose.prod.yml` in the project root:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: biz499_postgres
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME:-biz499_prod}
      POSTGRES_USER: ${DB_USER:-biz499_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - biz499_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: biz499_api
    restart: always
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 2 --timeout 60
    env_file:
      - ./backend/.env
    depends_on:
      - db
    volumes:
      - media_volume:/app/media
      - static_volume:/app/staticfiles
    networks:
      - biz499_net

  admin_web:
    build:
      context: ./admin
      dockerfile: Dockerfile
    container_name: biz499_admin
    restart: always
    networks:
      - biz499_net

  nginx:
    image: nginx:alpine
    container_name: biz499_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
      - static_volume:/var/www/static
      - media_volume:/var/www/media
    depends_on:
      - backend
      - admin_web
    networks:
      - biz499_net

volumes:
  pgdata:
  static_volume:
  media_volume:

networks:
  biz499_net:
    driver: bridge
```

---

## 3. Gunicorn & Nginx Configuration

### Nginx Configuration (`nginx.conf`)

```nginx
upstream api_server {
    server backend:8000;
}

upstream admin_app {
    server admin_web:80;
}

server {
    listen 80;
    server_name biz499.com www.biz499.com api.biz499.com admin.biz499.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.biz499.com;

    ssl_certificate /etc/letsencrypt/live/api.biz499.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.biz499.com/privkey.pem;

    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /media/ {
        alias /var/www/media/;
        expires 30d;
    }

    location / {
        proxy_pass http://api_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. Automated Database Backup & Disaster Recovery

### Automated Backup Script (`scripts/backup_db.sh`)

```bash
#!/bin/bash
# Biz499 Automated PostgreSQL Backup Script
set -e

BACKUP_DIR="/var/backups/biz499"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="biz499_prod"
DB_USER="biz499_admin"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL backup for $DB_NAME..."
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_DIR/biz499_backup_$DATE.sql.gz"

echo "[$(date)] Backup completed: $BACKUP_DIR/biz499_backup_$DATE.sql.gz"

# Remove backups older than 14 days
find "$BACKUP_DIR" -type f -name "biz499_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleaned backups older than $RETENTION_DAYS days."
```

### Schedule Daily Cron Job

```bash
# Run daily at 02:00 AM UTC
0 2 * * * /bin/bash /var/www/biz499/scripts/backup_db.sh >> /var/log/biz499_backup.log 2>&1
```

### Database Restore Procedure

To restore from a backup file:

```bash
# 1. Unzip backup
gunzip -c /var/backups/biz499/biz499_backup_20261024_020000.sql.gz > restore.sql

# 2. Terminate existing database connections
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'biz499_prod';"

# 3. Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS biz499_prod;"
psql -U postgres -c "CREATE DATABASE biz499_prod OWNER biz499_admin;"

# 4. Import backup
psql -U biz499_admin -d biz499_prod -f restore.sql

echo "Database restoration completed successfully."
```

