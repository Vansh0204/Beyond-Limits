# 🏔️ Beyond Limits

Beyond Limits is a premium, AI-powered digital storytelling platform where exploration has no boundaries. Built with Next.js 14, Supabase, and Google Gemini AI, it features a complete CMS architecture with secure role-based access control, automated AI blog summaries, and a cinematic Nordic Mountain design system.

---

## 🛠️ 1. Tech Stack Used

| Technology | Usage |
| :--- | :--- |
| **Next.js 14 (App Router)** | Primary framework for frontend & serverless API routes. |
| **TypeScript** | Ensuring a robust, type-safe development environment. |
| **Tailwind CSS v4** | Custom-swatched Nordic Mountain design system. |
| **Supabase (PostgreSQL)** | Persistent storage, Auth, and Row-Level Security (RLS). |
| **Google Gemini Pro AI** | Automated editorial summarization of storytelling content. |

## 📦 2. Project Setup Instructions

### **Prerequisites**
*   Node.js (v18.x or later)
*   NPM or Yarn
*   A Supabase account and a Google AI Studio account (for Gemini).

### **Repository Initialization**
```bash
git clone <your-repo-url>
cd beyond-limits
npm install
```

### **Environment Configuration**
Create a `.env.local` file in the root directory and populate it with your specific API credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

## 🚀 3. How to Run Locally

Once the environment is configured and dependencies are installed, you can launch the platform in your local development environment:

1.  **Initialize Database Schema:** Locate `supabase_schema.sql` in the project root and execute it in your **Supabase SQL Editor** to set up the relational tables (`users`, `posts`, `comments`) and RLS policies.
2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
3.  **Access Beyond Limits:** Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

## 🌐 4. Deployment Steps (Linux VPS, Nginx, PM2)

To deploy Beyond Limits in a hardened production environment on a native Linux VPS:

### **1. Build the Production Bundle**
```bash
npm run build
```

### **2. Launch Process Management (PM2)**
Ensuring the application remains persistent and automatically restarts on failure:
```bash
npm install -g pm2
pm2 start npm --name "beyond-limits" -- start
pm2 save && pm2 startup
```

### **3. Configure Nginx Reverse Proxy**
Create a new server block targeting port `3000` to expose the blog to your domain:
```nginx
server {
    listen 80;
    server_name your_domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **4. Finalize with SSL Security**
```bash
sudo certbot --nginx -d your_domain.com
```

## Tech Stack

| Technology                  | Usage                                                 |
| --------------------------- | ----------------------------------------------------- |
| **Next.js 14 (App Router)** | Frontend framework and backend API processing         |
| **React**                   | UI library & Global state management (Context API)    |
| **TypeScript**              | Static typing & robust data structures                |
| **Tailwind CSS**            | Utility-first responsive styling and UI design        |
| **Supabase (PostgreSQL)**   | Database, Authentication, and Row Level Security (RLS)|
| **Google Gemini API**       | Automated content summarization via AI                |

## Features

- **Authentication & Authorization**: Secure email/password login integrated with Supabase Auth and native Postgres Row Level Security.
- **Role-Based Access Control (RBAC)**: Three distinct user roles (`viewer`, `author`, `admin`) strictly dictating read, write, and deletion privileges across the application UI and Database layer.
- **AI Summary Generation**: Automated, engaging 200-word summaries generated through the Google Gemini language model directly upon post creation.
- **Advanced Pagination**: Efficient queries chunking records to 6 posts per page for optimized scaling and fast load times.
- **Real-time Search Filter**: Title-based case-insensitive parameter parsing enabling seamless blog exploration.
- **Comprehensive Admin Dashboard**: A specialized interface granting immediate table-level database mutation access for live user role elevation, comment moderation, and content management.

## AI Cost Optimization Strategy

The integration with the **Google Gemini 1.5 Flash** model is fundamentally designed around zero-waste scaling. 
Instead of generating the AI summary iteratively every time a user requests the webpage, the backend specifically intercepts the `POST` payload during publication. The Next.js API route invokes the Gemini generator exactly once, resolves the output string, and stores it permanently into the Supabase database mapping to the `summary` column.

This ensures zero repeated token consumption, meaning the blog can serve an infinite amount of traffic without incurring secondary generative API costs. If the API fails during creation, it defaults gracefully to a standard placeholder string indicating unavailability.

## Local Setup Instructions

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd Blog
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Copy the example environment file and populate it with your keys:
```bash
cp .env.local.example .env.local
```
Fill out the variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key.
- `GEMINI_API_KEY`: Your Google Gemini API Key.

**4. Run Supabase Database Migrations**
Locate the `supabase_schema.sql` file provided with the repository. You must execute this query natively in your Supabase Dashboard's **SQL Editor** to successfully initialize the `users`, `posts`, and `comments` architecture along with the strict RLS Policies.

**5. Start the Development Server**
```bash
npm run dev
```
Navigate to `http://localhost:3000` to interact with the project locally.

## Deployment (Linux VPS, Nginx, PM2)

To deploy the application in a hardened production environment on a native Linux VPS:

**1. Clone the codebase and build the production bundle**
```bash
npm install
npm run build
```

**2. Run with PM2**
Install PM2 globally if you don't have it installed:
```bash
npm install -g pm2
```
Launch the Next.js production daemon (spins up quietly onto port `3000` by default):
```bash
pm2 start npm --name "nextjs-blog" -- start
```
Configure PM2 to persist your app state upon physical server reboots:
```bash
pm2 save
pm2 startup
```

**3. Set up the Nginx Reverse Proxy**
Create a new Nginx virtualization block for your domain:
```bash
sudo nano /etc/nginx/sites-available/nextjs-blog
```
Inject the following proxy-pass routing configuration (replace `your_domain.com` with your actual DNS hook):
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

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
Enable the site block, verify routing syntaxes, and restart Nginx to deploy:
```bash
sudo ln -s /etc/nginx/sites-available/nextjs-blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
Your Next.js production blog is now securely proxied onto the internet!
