# 📝 Beyond Limits: Submission Requirements

This document provides the formal written explanations required for the Hivon Automations submission brief.

---

## **Area 1: AI Tools Integration**
*   **Selected Tool:** Google Gemini Pro API (`@google/generative-ai`).
*   **Rationale:** Gemini Pro was selected for its superior creative reasoning and cost-efficiency. It integrates natively with our Next.js backend, allowing for ultra-low latency summary generation while maintaining a high standard of editorial "human-like" quality that fits the Beyond Limits brand.

## **Area 2: Feature Logic & Architecture**
*   **Authentication Flow:** Secure, JWT-based sessions managed by Supabase Auth, ensuring that user identity is verified at every request.
*   **Role-Based Access Control (RBAC):** A custom directory system where every user is assigned a role (`admin`, `author`, or `viewer`). This dictates navigation visibility and prevents unauthorized access to the Command Center (Admin) or post creation tools.
*   **Post Creation Logic:** A dual-stream process—when an author submits a story, the client-side form triggers a server-side AI pipeline that extracts the narrative essence before saving the final record to PostgreSQL.
*   **AI Summary Generation Flow:** The summary is generated via a strictly defined prompt engineered to capture the "editorial soul" of the piece within a 160-character limit.

## **Area 3: Cost Optimization Strategies**
*   **Single-Generation Strategy:** The AI summary is generated **exactly once** at the moment of creation.
*   **Reliable Persistence:** The generated summary is committed to a dedicated `summary` column in the database. This ensures that the system **never** re-calls the AI API for a post that already has a summary, drastically reducing operational costs.
*   **Token Efficiency:** We employ localized prompt engineering to ensure Gemini provides the most information with the fewest tokens, optimizing the response payload for performance and budget.

## **Area 4: Development Understanding & Problem Solving**
*   **A "Design-System" Bug & Resolution:** 
    *   **The Issue:** We encountered a persistent "theme flicker" where browser-level Dark Mode was overriding our custom Nordic Palette.
    *   **The Resolution:** We resolved this by hardcoding the palette tokens directly into the Tailwind configuration and using an explicit CSS global override in `globals.css`. This forced a consistent "Beyond Limits" identity regardless of the user's OS settings.
*   **Key Architectural Decision:** 
    *   **The Strategy:** We implemented a "Content-First" redirect for Viewers. Instead of landing on a generic dashboard, logged-in viewers are instantly teleported to the Explore feed (`/posts`). This decision reduces friction and prioritizes the primary product—the content—over administrative overhead.

---
*Beyond Limits — Submission Documentation* 🏛️❄️
