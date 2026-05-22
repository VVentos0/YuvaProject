# YUVA VDS deploy

For a fully formatted or brand-new Ubuntu 24.04 VDS, use `FRESH_VDS_DEPLOY.md` first. This file is the shorter existing-server deploy note.

Target path:

```bash
/home/admin/YuvaProject
```

Recommended first step: rotate the server password that was shared in chat, then deploy with an SSH key.

## 1. DNS

When the real domain is ready, create these records:

```text
A     yuvarchive.com       45.141.150.77
A     www.yuvarchive.com   45.141.150.77
A     database.yuvarchive.com   45.141.150.77
```

Until then, you can test by opening `http://45.141.150.77` after Nginx is configured with the server IP as an extra `server_name`.

## 2. Server packages

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker nginx
sudo usermod -aG docker admin
```

Log out and back in after adding `admin` to the Docker group.

Basic firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 3. App files

Copy this project into:

```bash
/home/admin/YuvaProject
```

Create production env:

```bash
cd /home/admin/YuvaProject
cp .env.example .env
nano .env
```

Use:

```env
PORT=3000
PUBLIC_ORIGIN=https://yuvarchive.com
DATABASE_ORIGIN=https://database.yuvarchive.com
MONGO_ROOT_USERNAME=yuva-root
MONGO_ROOT_PASSWORD=use-a-long-random-mongo-password
MONGODB_URI=mongodb://yuva-root:use-a-long-random-mongo-password@mongo:27017/yuva?authSource=admin
ADMIN_TOKEN=use-a-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-different-long-random-password
```

Generate strong secrets on the VDS with:

```bash
openssl rand -hex 32
```

## 4. Start app and database

```bash
cd /home/admin/YuvaProject
docker compose up -d --build
docker compose logs -f app
```

Health check:

```bash
curl http://127.0.0.1:3000/api/health
```

If you change `MONGO_ROOT_USERNAME` or `MONGO_ROOT_PASSWORD` after MongoDB has already created its Docker volume, recreate the database volume intentionally. Do this only before real letters exist, or after taking a backup.

## 5. Nginx

```bash
sudo cp /home/admin/YuvaProject/nginx-yuvarchive.com.conf /etc/nginx/sites-available/yuvarchive.com
sudo ln -s /etc/nginx/sites-available/yuvarchive.com /etc/nginx/sites-enabled/yuvarchive.com
sudo nginx -t
sudo systemctl reload nginx
```

When DNS points to the VDS:

```bash
sudo certbot --nginx -d yuvarchive.com -d www.yuvarchive.com
```

For the database interface subdomain, issue the certificate with all names:

```bash
sudo certbot --nginx -d yuvarchive.com -d www.yuvarchive.com -d database.yuvarchive.com
```

## 6. Admin read API

Public visitors can only fetch envelope metadata. Full letters require admin authentication on the database host:

```bash
curl --user "admin:use-a-different-long-random-password" \
  "https://database.yuvarchive.com/api/admin/letters?recipient=SEDO"
```

You can also open:

```text
https://database.yuvarchive.com
```

The browser will ask for the `ADMIN_USERNAME` and `ADMIN_PASSWORD` values from `.env`.

## 7. MongoDB Compass

MongoDB is bound only to the VDS localhost. For Compass, open an SSH tunnel from your computer:

```bash
ssh -L 27017:127.0.0.1:27017 admin@45.141.150.77
```

Then connect Compass to:

```text
mongodb://yuva-root:use-a-long-random-mongo-password@127.0.0.1:27017/yuva?authSource=admin
```

## 8. Backups

Create a backup directory:

```bash
mkdir -p /home/admin/backups/yuva
```

Manual backup:

```bash
set -a
source .env
set +a
BACKUP_FILE="yuva-$(date +%F-%H%M).archive"

docker compose exec mongo mongodump \
  --username "$MONGO_ROOT_USERNAME" \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db yuva \
  --archive="/tmp/$BACKUP_FILE"

docker compose cp "mongo:/tmp/$BACKUP_FILE" "/home/admin/backups/yuva/$BACKUP_FILE"
```

For production, add a daily cron backup after deployment and test one restore before announcing the site.
