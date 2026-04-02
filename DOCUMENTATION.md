# 🏔️ Beyond Limits: Project Documentation

## **1. Project Identity**
*   **Name:** Beyond Limits
*   **Vision:** A premium, AI-powered digital storytelling platform where exploration has no boundaries.
*   **Branding:** Nordic Mountain Aesthetic (Minimalist, Serene, High-Contrast).

---

## **2. Technical Architecture**

### **Core Stack**
*   **Frontend:** Next.js 14 (App Router) — High-performance React framework.
*   **Language:** TypeScript — Robust, type-safe development.
*   **Styling:** Tailwind CSS v4 — Custom utility-first design system with hardcoded palette overrides.
*   **Database:** Supabase (PostgreSQL) — Real-time relational database with Row-Level Security (RLS).
*   **Intelligence:** Google Gemini Pro AI — Automated summarization and content insights.

### **Database Schema highlights**
| Table | Description |
| :--- | :--- |
| `users` | Role-based authentication (Admin, Author, Viewer). |
| `posts` | Story content with AI-generated summaries and image support. |
| `comments` | Interactive discussions with enterprise-grade moderation tools. |

---

## **3. The Nordic Design System**
The platform's visual identity is meticulously designed to evoke a sense of professional serenity and vast potential.

*   **Ice White (#F4FAF9):** Primary background for a clean, expensive atmosphere.
*   **Midnight Navy (#121E26):** Dominant text and branding for high legibility and authority.
*   **Steel Blue (#7E94A8):** Primary action color for links and subtle interactive highlights.
*   **Mist Gray (#CAD3D7):** Soft borders and secondary backgrounds.

---

## **4. User & Command Levels**

### **🏛️ System Administrator (Authority)**
The Admin Dashboard ("Authority") provides a full-spectrum control center:
*   **Personnel Directory:** Promote users to Authors or fellow Admins.
*   **Content Moderation:** Purge any post or comment across the platform.
*   **Real-time Analytics:** Track active users and entire content output.

### **✨ Content Author**
*   **Direct Dashboard:** Manage unique stories and engagement metrics.
*   **Creation Suite:** AI-integrated editor that can auto-generate summaries.
*   **Edit/Delete Control:** Ownership over their specific narrative circle.

### **🌿 Viewer**
*   **Direct Exploration:** Bypasses dashboards to land directly in the global story feed.
*   **Engagement:** Upvote/Downvote stories and engage in discussion.

---

## **5. Production Launch Guide (VPS Deployment)**

### **Prerequisites**
1. Ubuntu/Debian Linux Server.
2. Nginx installed.
3. Node.js & NPM configured.

### **Step 1: Preparation**
```bash
git clone <your-repo-ui>
cd beyond-limits
npm install
```

### **Step 2: Configuration**
Update `.env.local` with production credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-api-key
```

### **Step 3: Build & Process Management**
```bash
npm run build
pm2 start npm --name "beyond-limits" -- start
```

### **Step 4: Nginx Reverse Proxy**
Create a config at `/etc/nginx/sites-available/beyond-limits`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
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

### **Step 5: Security**
```bash
sudo ln -s /etc/nginx/sites-available/beyond-limits /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
```

---

## **6. Submission Requirements (Hivon Automations)**

This section provides the required written explanations for the official Hivon Automations submission.

### **Area 1: AI Tools Integration**
*   **Selected Tool:** Google Gemini Pro API (`@google/generative-ai`).
*   **Rationale:** Gemini Pro was selected for its superior creative reasoning and cost-efficiency. It integrates natively with our Next.js backend, allowing for ultra-low latency summary generation while maintaining a high standard of editorial "human-like" quality that fits the Beyond Limits brand.

### **Area 2: Feature Logic & Architecture**
*   **Authentication Flow:** Secure, JWT-based sessions managed by Supabase Auth, ensuring that user identity is verified at every request.
*   **Role-Based Access Control (RBAC):** A custom directory system where every user is assigned a role (`admin`, `author`, or `viewer`). This dictates navigation visibility and prevents unauthorized access to the Command Center (Admin) or post creation tools.
*   **Post Creation Logic:** A dual-stream process—when an author submits a story, the client-side form triggers a server-side AI pipeline that extracts the narrative essence before saving the final record to PostgreSQL.
*   **AI Summary Generation Flow:** The summary is generated via a strictly defined prompt engineered to capture the "editorial soul" of the piece within a 160-character limit.

### **Area 3: Cost Optimization Strategies**
*   **Single-Generation Strategy:** The AI summary is generated **exactly once** at the moment of creation.
*   **Reliable Persistence:** The generated summary is committed to a dedicated `summary` column in the database. This ensures that the system **never** re-calls the AI API for a post that already has a summary, drastically reducing operational costs.
*   **Token Efficiency:** We employ localized prompt engineering to ensure Gemini provides the most information with the fewest tokens, optimizing the response payload for performance and budget.

### **Area 4: Development Understanding & Problem Solving**
*   **A "Design-System" Bug & Resolution:** 
    *   **The Issue:** We encountered a persistent "theme flicker" where browser-level Dark Mode was overriding our custom Nordic Palette.
    *   **The Resolution:** We resolved this by hardcoding the palette tokens directly into the Tailwind configuration and using an explicit CSS global override in `globals.css`. This forced a consistent "Beyond Limits" identity regardless of the user's OS settings.
*   **Key Architectural Decision:** 
    *   **The Strategy:** We implemented a "Content-First" redirect for Viewers. Instead of landing on a generic dashboard, logged-in viewers are instantly teleported to the Explore feed (`/posts`). This decision reduces friction and prioritizes the primary product—the content—over administrative overhead.

---
*Beyond Limits — Built for boundless exploration.* 🏛️❄️
