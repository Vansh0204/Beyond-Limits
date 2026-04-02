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

## ✨ 2. Key Features

- **Authentication & Authorization**: Secure email/password login integrated with Supabase Auth and native Postgres Row Level Security.
- **Role-Based Access Control (RBAC)**: Three distinct user roles (`viewer`, `author`, `admin`) strictly dictating read, write, and deletion privileges.
- **AI Summary Generation**: Automated, engaging editorial summaries generated through the Google Gemini language model directly upon post creation.
- **Nordic Design System**: A high-end, cinematic UI featuring an Ice White and Midnight Navy palette.
- **Comprehensive Admin Dashboard**: A specialized "Authority" interface for live user role management and content moderation.

## 📦 3. Project Setup Instructions

### **Prerequisites**
*   Node.js (v18.x or later)
*   NPM or Yarn
*   A Supabase account and a Google AI Studio account (for Gemini).

### **Repository Initialization**
```bash
git clone https://github.com/Vansh0204/Beyond-Limits.git
cd Beyond-Limits
npm install
```

### **Environment Configuration**
Create a `.env.local` file in the root directory and populate it with your specific API credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

## 🚀 4. How to Run Locally

1.  **Initialize Database Schema:** Locate `supabase_schema.sql` in the project root and execute it in your **Supabase SQL Editor** to initialize the `users`, `posts`, and `comments` architecture.
2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
3.  **Access Beyond Limits:** Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

## ⚡ 5. AI Cost Optimization Strategy

The integration with the **Google Gemini Pro** model is designed for zero-waste scaling. Instead of generating the AI summary every time a user requests the webpage, the system invokes the Gemini generator **exactly once** during publication. The result is stored permanently in the Supabase `summary` column, eliminating repeated token consumption and allowing the platform to serve infinite traffic without incurring secondary API costs.

## 🌐 6. Deployment Steps (Linux VPS & Vercel)

### **Option A: Vercel (Recommended)**
1. Connect your GitHub repository to Vercel.
2. Add your environment variables in the Vercel Dashboard.
3. Click **Deploy**.

### **Option B: Linux VPS (Nginx, PM2)**
1. **Build:** `npm run build`
2. **Process Management:** `pm2 start npm --name "beyond-limits" -- start`
3. **Reverse Proxy:** Configure Nginx server block targeting port `3000`.
4. **SSL:** Enable HTTPS via Certbot.

---
*Beyond Limits — Built for boundless exploration.* 🏛️❄️
