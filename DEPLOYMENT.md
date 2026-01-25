# 🚀 Deployment Guide

## Deploy Your Wedding API

This guide shows how to deploy your API to various cloud platforms.

---

## Option 1: Heroku (Easiest)

### Prerequisites

- Heroku account (free at heroku.com)
- Heroku CLI installed

### Steps

1. **Install Heroku CLI**

   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Procfile**

   ```bash
   # Create file named "Procfile" in project root
   echo "web: npm start" > Procfile
   ```

3. **Initialize Git** (if not already)

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. **Login and Deploy**

   ```bash
   heroku login
   heroku create your-wedding-api
   git push heroku main
   ```

5. **View Logs**

   ```bash
   heroku logs --tail
   ```

6. **Open App**
   ```bash
   heroku open
   ```

Your API will be available at: `https://your-wedding-api.herokuapp.com`

---

## Option 2: Railway

### Prerequisites

- Railway account (railway.app)
- GitHub account

### Steps

1. **Push to GitHub**

   ```bash
   git push origin main
   ```

2. **Connect Railway**
   - Go to railway.app
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository

3. **Add Environment Variables**
   - Click "Add Variable"
   - Add: `NODE_ENV` = `production`
   - Add: `PORT` = `8080`

4. **Deploy**
   - Click "Deploy"
   - Railway automatically deploys on push

---

## Option 3: Render

### Prerequisites

- Render account (render.com)
- GitHub repository

### Steps

1. **Create New Web Service**
   - Go to render.com
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub

2. **Configure**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Set environment variables

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment

---

## Option 4: DigitalOcean

### Prerequisites

- DigitalOcean account
- SSH key setup

### Steps

1. **Create Droplet**
   - Select Node.js app droplet
   - Select $4/month plan
   - Create with SSH key

2. **SSH into Server**

   ```bash
   ssh root@your_server_ip
   ```

3. **Install Node.js** (usually pre-installed)

   ```bash
   node --version
   npm --version
   ```

4. **Clone Repository**

   ```bash
   git clone your-repo-url
   cd boda-backend
   npm install
   ```

5. **Install PM2** (Process Manager)

   ```bash
   npm install -g pm2
   pm2 start src/index.js --name "wedding-api"
   pm2 save
   pm2 startup
   ```

6. **Setup Database** (Optional)

   ```bash
   node scripts/seed-data.js
   ```

7. **Setup Reverse Proxy** (nginx)
   ```bash
   sudo apt install nginx
   # Configure nginx to proxy to port 3000
   ```

---

## Environment Variables for Production

Update `.env` before deploying:

```
PORT=8080
NODE_ENV=production
DB_PATH=/var/data/wedding.db    # Or use cloud database

# Optional - Database URL if using cloud DB
DATABASE_URL=postgresql://...
```

---

## Database Considerations

### Local SQLite (Current Setup)

✅ Good for: Small to medium events  
❌ Limitation: Not ideal for distributed systems

### Cloud Database Options

**PostgreSQL (Recommended)**

```bash
npm install pg
```

Update `db.js` to use PostgreSQL instead of SQLite.

**MongoDB**

```bash
npm install mongodb
```

More flexible schema for guest data.

**Firebase**

```bash
npm install firebase
```

Serverless option with automatic scaling.

---

## Monitoring & Logs

### View Logs

**Heroku:**

```bash
heroku logs --tail
```

**Railway:**

- Dashboard → Logs tab

**Render:**

- Logs tab in dashboard

**DigitalOcean:**

```bash
pm2 logs wedding-api
```

### Monitor Performance

**PM2 Web Dashboard:**

```bash
pm2 web
# Visit http://localhost:9615
```

---

## Custom Domain

### Setup Custom Domain

1. **Get Domain**
   - Register at GoDaddy, Namecheap, etc.

2. **Add to Your Platform**

   **Heroku:**

   ```bash
   heroku domains:add www.mysite.com
   ```

   **Railway/Render:**
   - Dashboard → Settings → Custom Domain

3. **Update DNS**
   - Point to your provider's nameservers

4. **Enable HTTPS**
   - Most platforms include free SSL/TLS

---

## Cost Estimation

| Platform     | Price     | Notes              |
| ------------ | --------- | ------------------ |
| Heroku       | $7/month  | Dyno, 1GB database |
| Railway      | $5+/month | Pay-as-you-go      |
| Render       | $12/month | Starter instance   |
| DigitalOcean | $4/month  | Basic droplet      |

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        run: |
          git remote add heroku https://git.heroku.com/your-app.git
          git push heroku main
```

---

## Security Checklist

Before deploying:

- [ ] Set strong `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Add authentication if needed
- [ ] Validate all inputs
- [ ] Set rate limiting
- [ ] Enable CORS properly
- [ ] Hide sensitive variables
- [ ] Setup monitoring
- [ ] Regular backups
- [ ] Update dependencies

---

## API Usage After Deployment

Replace `localhost:3000` with your deployed URL:

```bash
# Instead of:
curl http://localhost:3000/api/guests

# Use:
curl https://your-wedding-api.herokuapp.com/api/guests
```

---

## Troubleshooting

**App crashes on startup:**

- Check logs: `heroku logs --tail`
- Verify environment variables
- Check database path

**Port errors:**

- Ensure PORT env variable is set
- Platform assigns random port usually

**Database issues:**

- Check DB_PATH permissions
- Verify database is initialized
- Run seed script if needed

---

## Scaling Tips

1. **Database**
   - Consider cloud DB for larger events
   - Add caching with Redis

2. **API**
   - Add load balancing
   - Use CDN for static content
   - Implement rate limiting

3. **Monitoring**
   - Setup error tracking (Sentry)
   - Monitor performance
   - Alert on failures

---

## Next Steps

1. Choose hosting platform
2. Setup custom domain
3. Deploy application
4. Run seed data script
5. Test endpoints
6. Setup monitoring
7. Share with guests!

---

**Happy deploying! 🎉**
