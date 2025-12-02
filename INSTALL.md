# Sentinel - Fresh Installation Guide for Ubuntu Linux

This guide covers installing Sentinel on a fresh Ubuntu 20.04/22.04/24.04 system.

## System Requirements

- Ubuntu 20.04 LTS or newer
- 2 GB RAM minimum (4 GB recommended)
- 10 GB disk space
- Internet connection

## Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Node.js 20.x

```bash
# Install curl if not present
sudo apt install -y curl

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

## Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

## Step 4: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Run these SQL commands in the PostgreSQL prompt:
CREATE USER sentinel WITH PASSWORD 'your_secure_password';
CREATE DATABASE sentinel_db OWNER sentinel;
GRANT ALL PRIVILEGES ON DATABASE sentinel_db TO sentinel;
\q
```

## Step 5: Clone the Repository

```bash
# Install git if not present
sudo apt install -y git

# Clone the repository
git clone <your-repository-url> sentinel
cd sentinel
```

## Step 6: Install Dependencies

```bash
# Install all Node.js dependencies
npm install
```

## Step 7: Configure Environment Variables

**IMPORTANT:** The `.env` file MUST be created before running the application.

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following content (replace `your_secure_password` with the password you set in Step 4):

```env
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://sentinel:your_secure_password@localhost:5432/sentinel_db
PGHOST=localhost
PGPORT=5432
PGUSER=sentinel
PGPASSWORD=your_secure_password
PGDATABASE=sentinel_db

# Session Configuration (REQUIRED)
SESSION_SECRET=generate_a_random_32_character_string_here

# Server Configuration (optional)
PORT=5000
NODE_ENV=production
```

Generate a random session secret and add it to your `.env`:
```bash
# Generate secret
openssl rand -hex 32

# Copy the output and paste it as the SESSION_SECRET value in .env
```

**Verify your .env file exists:**
```bash
cat .env
```

You should see all your configuration values displayed.

## Step 8: Initialize Database

```bash
# Push the database schema
npm run db:push
```

## Step 9: Build for Production

```bash
# Build the application
npm run build
```

## Step 10: Run the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Running as a System Service (Recommended for Production)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/sentinel.service
```

Add the following content:

```ini
[Unit]
Description=Sentinel Infrastructure Monitoring
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sentinel
ExecStart=/usr/bin/node dist/index.cjs
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable sentinel
sudo systemctl start sentinel

# Check status
sudo systemctl status sentinel
```

## Nginx Reverse Proxy (Optional)

Install Nginx:

```bash
sudo apt install -y nginx
```

Create a configuration file:

```bash
sudo nano /etc/nginx/sites-available/sentinel
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL with Let's Encrypt (Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Firewall Configuration

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Verify Installation

1. Open your browser and navigate to `http://localhost:5000` (or your domain)
2. You should see the Sentinel dashboard
3. Create your first organization to start monitoring

## Troubleshooting

### Error: DATABASE_URL must be set

This error means the `.env` file is missing or not in the correct location.

**Solution:**
```bash
# Make sure you're in the project root directory
cd /path/to/sentinel

# Check if .env file exists
ls -la .env

# If it doesn't exist, create it (see Step 7 above)
nano .env

# Verify the file has correct content
cat .env
```

The `.env` file must be in the same directory as `package.json`.

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U sentinel -h localhost -d sentinel_db
```

### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /path/to/sentinel
```

### View Application Logs
```bash
# If running as systemd service
sudo journalctl -u sentinel -f
```

## Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | 20.x | JavaScript runtime |
| npm | 10.x | Package manager |
| PostgreSQL | 14+ | Database |
| Git | 2.x | Version control |

## Optional Dependencies

| Package | Purpose |
|---------|---------|
| Nginx | Reverse proxy |
| Certbot | SSL certificates |
| UFW | Firewall |

## Support

For issues and feature requests, please open an issue in the repository.
