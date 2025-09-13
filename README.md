This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Automated Deployment on VM

This section guides you through deploying the app on a virtual machine (VM) with automated startup and domain configuration. Assumes a Linux VM (e.g., Ubuntu) with Node.js (v18+), Git, and Nginx installed.

### Prerequisites
- VM with SSH access.
- Domain name pointing to your VM's IP (update DNS A record).
- Install dependencies: `sudo apt update && sudo apt install nodejs npm git nginx pm2 -y`.

### Step 1: Clone the Repository
Clone the repo to your VM:
```bash
git clone https://github.com/your-username/functions-codes.git
cd functions-codes
```

### Step 2: Install Dependencies and Build
```bash
npm install
npm run build
```

### Step 3: Automated Run with PM2
Use PM2 to run the app and restart on crashes or reboots:
```bash
pm2 start npm --name "next-app" -- start
pm2 save
pm2 startup
```
- The app will run on port 3000 by default.
- For full automation on git pushes, set up a webhook or CI/CD (e.g., GitHub Actions) to run these commands remotely via SSH.

### Step 4: Domain Configuration with Nginx
Configure Nginx as a reverse proxy for your domain:
1. Create a new config file: `sudo nano /etc/nginx/sites-available/your-domain.com`
2. Add the following (replace `your-domain.com` and adjust paths):
   ```
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Enable the site: `sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/`
4. Test and reload: `sudo nginx -t && sudo systemctl reload nginx`
5. For SSL (HTTPS), install Certbot: `sudo apt install certbot python3-certbot-nginx -y` then `sudo certbot --nginx -d your-domain.com`.

### Additional Notes
- Monitor with `pm2 monit` or logs in `~/.pm2/logs`.
- For production, consider environment variables (e.g., via `.env.local`) and security hardening.
- If using Docker, wrap the app in a container for easier deployment.
