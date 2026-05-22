# YUVA Fresh VDS Deploy Runbook

This file is the source of truth for rebuilding YUVA on a fully formatted, empty Ubuntu 24.04 VDS.

Assumption: the server has no project files, no Docker, no Nginx, no MongoDB data, and no previous configuration. If the old VDS was formatted, old letters are gone unless a MongoDB backup exists and is restored.

## 0. Inputs Needed From The User

When this runbook is used, provide only these values:

```text
VDS_IP=
SSH_USERNAME=
SSH_PORT=22
SUDO_PASSWORD=
DOMAIN=yuvarchive.com
WWW_DOMAIN=www.yuvarchive.com
DATABASE_DOMAIN=database.yuvarchive.com
```

Do not paste production secrets into chat unless explicitly needed. Prefer generating new secrets directly on the VDS.

## 1. High-Level Deployment Model

The production app runs as Docker Compose on the VDS:

```text
Nginx 443/80 -> Node app on 127.0.0.1:3000 -> MongoDB container on Docker network
```

GitHub Actions deploys the repo automatically when `main` is pushed:

```text
GitHub Actions -> SSH/SCP release tarball -> VDS project dir -> docker compose up -d --build
```

No manual project file copying should be used for normal deploys. The only manual work on a fresh VDS is bootstrapping OS packages, Nginx, `.env`, SSH deploy key, DNS, and GitHub repository secrets.

## 2. First Login Check

From the local machine:

```bash
ssh -p SSH_PORT SSH_USERNAME@VDS_IP
```

If the host key warning appears, confirm only if the IP is correct. If password login fails, fix access from the hosting panel first.

After login:

```bash
whoami
hostnamectl
lsb_release -a
sudo -v
```

Expected OS:

```text
Ubuntu 24.04 LTS
```

## 3. Create Standard `admin` User If Needed

The project historically uses:

```text
/home/admin/YuvaProject
```

If the provider already gives an `admin` sudo user, keep it. If the login user is `root`, create `admin`:

```bash
adduser admin
usermod -aG sudo admin
```

Then login as:

```bash
ssh -p SSH_PORT admin@VDS_IP
```

If the provider gives a different sudo user and we do not want to create `admin`, set GitHub secret `VDS_PROJECT_DIR` later, for example:

```text
/home/SSH_USERNAME/YuvaProject
```

## 4. OS Hardening And Packages

Run on the VDS:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git nginx certbot python3-certbot-nginx ufw fail2ban openssl dnsutils
```

Install Docker from Docker's official repository:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable services:

```bash
sudo systemctl enable --now docker nginx fail2ban
sudo usermod -aG docker "$USER"
```

Log out and back in so Docker group membership applies. Verify:

```bash
docker --version
docker compose version
sudo nginx -t
```

## 5. Firewall

Allow SSH and web traffic:

```bash
sudo ufw allow SSH_PORT/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

If `SSH_PORT` is `22`, this is equivalent to:

```bash
sudo ufw allow OpenSSH
```

Do not expose MongoDB publicly. `compose.yaml` binds MongoDB to `127.0.0.1:27017` only.

## 6. Project Directory And Production Env

Create the project directory:

```bash
sudo mkdir -p /home/admin/YuvaProject
sudo chown -R "$USER:$USER" /home/admin/YuvaProject
cd /home/admin/YuvaProject
```

If using a non-admin user, replace `/home/admin/YuvaProject` with the chosen `VDS_PROJECT_DIR`.

Create `.env` manually on the VDS:

```bash
nano /home/admin/YuvaProject/.env
```

Use this template and generate fresh secrets with `openssl rand -hex 32`:

```env
PORT=3000
PUBLIC_ORIGIN=https://yuvarchive.com
DATABASE_ORIGIN=https://database.yuvarchive.com

MONGO_ROOT_USERNAME=yuva-root
MONGO_ROOT_PASSWORD=REPLACE_WITH_OPENSSL_SECRET
MONGODB_URI=mongodb://yuva-root:REPLACE_WITH_SAME_MONGO_PASSWORD@mongo:27017/yuva?authSource=admin

ADMIN_TOKEN=REPLACE_WITH_OPENSSL_SECRET
ADMIN_USERNAME=admin
ADMIN_PASSWORD=REPLACE_WITH_STRONG_ADMIN_PASSWORD

ALLOWED_ORIGINS=https://yuvarchive.com,https://www.yuvarchive.com,https://database.yuvarchive.com,http://yuvarchive.com,http://www.yuvarchive.com,http://database.yuvarchive.com
```

Lock permissions:

```bash
chmod 600 /home/admin/YuvaProject/.env
```

Important:

- Do not commit `.env`.
- Do not print `.env` into public logs.
- If MongoDB has already initialized, changing `MONGO_ROOT_PASSWORD` later requires intentional volume migration or recreation.

## 7. Deploy SSH Key For GitHub Actions

Generate a deploy key on the VDS:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/yuva_github_actions -C "yuva-github-actions" -N ""
mkdir -p ~/.ssh
cat ~/.ssh/yuva_github_actions.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Show the private key once so it can be saved as a GitHub Actions secret:

```bash
cat ~/.ssh/yuva_github_actions
```

Add or update these GitHub repository secrets in `VVentos0/YuvaProject`:

```text
VDS_HOST=VDS_IP
VDS_USER=admin
VDS_PORT=22
VDS_SSH_KEY=<contents of ~/.ssh/yuva_github_actions private key>
VDS_PROJECT_DIR=/home/admin/YuvaProject
```

If the SSH user is not `admin`, set:

```text
VDS_USER=SSH_USERNAME
VDS_PROJECT_DIR=/home/SSH_USERNAME/YuvaProject
```

Keep `VDS_SSH_KEY` private. Never commit it.

## 8. DNS Cutover

In Cloudflare or the DNS provider, point these records to the new IP:

```text
A     yuvarchive.com             VDS_IP
A     www.yuvarchive.com         VDS_IP
A     database.yuvarchive.com    VDS_IP
```

Before Certbot, verify DNS resolves:

```bash
dig +short yuvarchive.com
dig +short www.yuvarchive.com
dig +short database.yuvarchive.com
```

If Cloudflare proxy is enabled, Certbot can still work in most normal setups. If certificate issuance fails, temporarily set records to DNS-only, issue certs, then re-enable proxy.

## 9. First GitHub Actions Deploy

After secrets are set, trigger deployment by pushing `main` or using `workflow_dispatch`.

The workflow will:

1. Pack the repo, excluding `.git`, `node_modules`, `.env`, and old unused heavy assets.
2. Upload `/tmp/yuva-release.tar.gz` to the VDS.
3. Extract it into `VDS_PROJECT_DIR`.
4. Preserve `.env`.
5. Run `docker compose up -d --build`.
6. Check `http://127.0.0.1:3000/api/health`.

On the VDS, inspect after the first deploy:

```bash
cd /home/admin/YuvaProject
docker compose ps
docker compose logs --tail=120 app
docker compose logs --tail=120 mongo
curl -fsS http://127.0.0.1:3000/api/health
```

Expected health:

```json
{"ok":true,"db":"connected"}
```

## 10. Nginx Before SSL

The repo's `nginx-yuvarchive.com.conf` assumes Let's Encrypt cert files already exist. On a fresh server, first create a temporary HTTP-only config:

```bash
sudo tee /etc/nginx/sites-available/yuvarchive-bootstrap >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name yuvarchive.com www.yuvarchive.com database.yuvarchive.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/yuvarchive-bootstrap /etc/nginx/sites-enabled/yuvarchive-bootstrap
sudo nginx -t
sudo systemctl reload nginx
```

HTTP check:

```bash
curl -I http://yuvarchive.com
curl -I http://database.yuvarchive.com
```

## 11. SSL Certificates And Final Nginx Config

Issue a single certificate covering all domains:

```bash
sudo certbot --nginx \
  -d yuvarchive.com \
  -d www.yuvarchive.com \
  -d database.yuvarchive.com
```

Then install the repo's final Nginx config:

```bash
sudo cp /home/admin/YuvaProject/nginx-yuvarchive.com.conf /etc/nginx/sites-available/yuvarchive.com
sudo ln -sf /etc/nginx/sites-available/yuvarchive.com /etc/nginx/sites-enabled/yuvarchive.com
sudo rm -f /etc/nginx/sites-enabled/yuvarchive-bootstrap
sudo nginx -t
sudo systemctl reload nginx
```

Verify auto-renew:

```bash
sudo certbot renew --dry-run
```

## 12. Production Verification

Run from local machine:

```bash
curl -I -L https://yuvarchive.com/
curl -I -L https://www.yuvarchive.com/
curl -I -L https://database.yuvarchive.com/
curl -fsS https://yuvarchive.com/api/health
curl -fsS "https://yuvarchive.com/api/letters?limit=1"
curl -I -L https://yuvarchive.com/socket.io/socket.io.js
```

Validate the 500-character rule without saving a real letter:

```bash
curl -i -X POST https://yuvarchive.com/api/letters \
  -H "Content-Type: application/json" \
  --data '{"recipient":"SEDO","body":"short","formStartedAt":1,"submittedAt":10000}'
```

Expected:

```text
400
Letter body must be at least 500 characters
```

Check key frontend cache-bust markers:

```bash
curl -fsS https://yuvarchive.com/ | grep -E "script.js|style.css|socket.io"
curl -fsS https://yuvarchive.com/script.js | grep -E "tree-optimized.gif|/api/letters|Minimum 500"
```

Check large GIFs:

```bash
curl -I -L "https://yuvarchive.com/images/tree-optimized.gif?v=20260521-scene"
curl -I -L https://yuvarchive.com/images/people.gif
curl -I -L https://yuvarchive.com/images/birdan-optimized.gif
```

## 13. Admin And Database Checks

Open:

```text
https://database.yuvarchive.com
```

Login with:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
```

Admin API smoke test:

```bash
curl -H "x-admin-token: ADMIN_TOKEN" "https://yuvarchive.com/api/admin/letters?limit=1"
```

Do not weaken admin auth or expose MongoDB to the public internet.

## 14. MongoDB Backup And Restore

Create backup directory:

```bash
mkdir -p /home/admin/backups/yuva
```

Manual backup:

```bash
cd /home/admin/YuvaProject
set -a
. ./.env
set +a
BACKUP_FILE="yuva-$(date +%F-%H%M).archive"

docker compose exec mongo mongodump \
  --username "$MONGO_ROOT_USERNAME" \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db yuva \
  --archive="/tmp/$BACKUP_FILE"

docker compose cp "mongo:/tmp/$BACKUP_FILE" "/home/admin/backups/yuva/$BACKUP_FILE"
ls -lh "/home/admin/backups/yuva/$BACKUP_FILE"
```

Restore to a fresh server only after the app and Mongo container are up:

```bash
cd /home/admin/YuvaProject
set -a
. ./.env
set +a
BACKUP_FILE="yuva-BACKUP_DATE.archive"

docker compose cp "/home/admin/backups/yuva/$BACKUP_FILE" "mongo:/tmp/$BACKUP_FILE"
docker compose exec mongo mongorestore \
  --username "$MONGO_ROOT_USERNAME" \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --nsInclude "yuva.*" \
  --archive="/tmp/$BACKUP_FILE" \
  --drop
```

After restore:

```bash
curl -fsS "https://yuvarchive.com/api/letters?limit=1"
```

## 15. Disk Cleanup Safe Commands

Use these when disk pressure appears. These preserve Mongo Docker volumes:

```bash
sudo journalctl --vacuum-size=200M
sudo apt clean
sudo apt autoremove -y
sudo find /tmp -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo find /var/tmp -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo find /var/lib/docker/containers -name '*-json.log' -type f -exec truncate -s 0 {} +
docker builder prune -af --filter "until=24h"
docker image prune -af
docker container prune -f
df -h
docker system df
```

Do not run `docker volume prune` unless a MongoDB backup exists and data loss is explicitly accepted.

## 16. Common Failure Modes

### SSH works locally but GitHub Actions cannot connect

Check repository secrets:

```text
VDS_HOST
VDS_USER
VDS_PORT
VDS_SSH_KEY
VDS_PROJECT_DIR
```

On the VDS:

```bash
tail -n 80 /var/log/auth.log
ls -la ~/.ssh
grep -n "yuva" ~/.ssh/authorized_keys
```

### Deploy fails with missing `.env`

Create:

```bash
/home/admin/YuvaProject/.env
```

The workflow refuses to deploy without it by design.

### App container restarts

Inspect logs:

```bash
cd /home/admin/YuvaProject
docker compose ps
docker compose logs --tail=200 app
docker compose logs --tail=200 mongo
```

Common causes:

- Bad `MONGODB_URI`
- Mongo root password mismatch after volume already existed
- Missing `.env`
- Port 3000 already used on host

### HTTPS fails

Check:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo certbot certificates
sudo tail -n 100 /var/log/nginx/error.log
```

### Frontend still shows old behavior

Check live files, not only `/api/health`:

```bash
curl -fsS https://yuvarchive.com/ | grep script.js
curl -fsS https://yuvarchive.com/script.js | grep "/api/letters"
curl -I -L https://yuvarchive.com/script.js
```

Cloudflare or browser cache can keep old immutable assets. Use versioned URLs for changed GIFs or scripts.

## 17. Final Acceptance Checklist

The fresh VDS is considered ready only when all are true:

- `docker compose ps` shows app and mongo running.
- `curl http://127.0.0.1:3000/api/health` returns DB connected on the VDS.
- `https://yuvarchive.com` returns 200.
- `https://www.yuvarchive.com` redirects to `https://yuvarchive.com`.
- `https://database.yuvarchive.com` opens the admin login.
- `https://yuvarchive.com/api/health` returns `{"ok":true,"db":"connected"}`.
- `POST /api/letters` rejects short letters with the 500-character error.
- Public letters load from `/api/letters`.
- Socket.IO client serves from `/socket.io/socket.io.js`.
- New GIF/image assets return 200.
- GitHub Actions can deploy a new commit without manual VDS file copying.
- `.env`, SSH keys, tokens, and passwords are not committed.
