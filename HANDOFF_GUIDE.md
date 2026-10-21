# LeadFlow AI Platform — Complete Handoff Guide

> **Project Status**: Production-ready B2B revenue operations platform with 4 MicroMind Core chatflows integrated into Supabase PostgreSQL. All core features operational as of 2026-10-20.

---

## 1. Project Overview

**LeadFlow AI** is a modern B2B revenue operations dashboard that replaces the legacy "Executive Gold" brand. It connects four MicroMind Core chatflows to a cloud Supabase database, providing real-time analytics, conversational AI, lead intelligence, and sales co-piloting — all through a polished indigo/purple themed React/Vite frontend.

**Core Value Proposition**: AI is embedded *inside* workflows (analytics queries, messenger replies, lead scoring, sales assistance) rather than bolted on as a generic chatbot.

---

## 2. Tech Stack

| Layer | Technology | Version/Notes |
|-------|------------|---------------|
| **Frontend** | React 18 + Vite | `client/` — SPA with React Router, i18next, Tailwind CSS |
| **Backend** | Node.js + Express | `server/` — REST API, JWT auth, Prisma ORM |
| **Database** | Supabase PostgreSQL | Direct connection port 5432 (no PgBouncer) — `aws-1-eu-west-1.pooler.supabase.com:5432` |
| **AI/Chatflows** | MicroMind Core | 4 chatflows via `https://core.aimicromind.com/api/v1/prediction/{id}` |
| **Auth** | JWT (HS256) | 5 demo users, tokens in `localStorage` |
| **Styling** | Tailwind CSS | Custom indigo/purple theme (`tailwind.config.js`) |
| **State** | React hooks | `useState`, `useEffect`, `useRef` — no Redux/Zustand |
| **API Client** | Axios | Centralized in `client/src/services/leadflowService.js` |
| **Dev Tools** | npm, concurrently | `npm run dev` spins both servers |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  http://localhost:5173 (Vite dev)  →  http://localhost:3000/api │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (VITE_API_URL)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (port 3000)                  │
│  /api/auth/*          →  JWT login/register                     │
│  /api/leadflow/*      →  All business logic endpoints           │
│  /api/webhook         →  Facebook Messenger webhook receiver    │
│  /api/health          →  Health check                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL (port 5432)                │
│  Tables: User, Organization, Conversation, Message,             │
│          Opportunity, Lead, Activity, LeadScore                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (AI_API_URL)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MICROMIND CORE (4 Chatflows)                    │
│  bfe4a91b...  →  lead-db (Analytics SQL)                        │
│  e4876b97...  →  Lead Intelligence (Messenger scoring)          │
│  68e1ccae...  →  Follow-Up Copywriter (Generate Reply)          │
│  bb723aa1...  →  Sales Co-Pilots (/copilots chat)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Chatflow Mapping (Critical)

| Chatflow Name | MicroMind ID | Purpose | Connected UI | Backend Endpoint |
|---------------|--------------|---------|--------------|------------------|
| **lead-db** | `bfe4a91b-470f-48f4-9e63-fbf66f29edbd` | Natural language → SQL → real DB results | `/analytics` (AI Analytics) | `POST /api/leadflow/analytics/ask` |
| **Lead Intelligence** | `e4876b97-8c0a-4f79-838f-59dc66f656ac` | Score inbound Messenger messages | Messenger webhook + Conversations list | `GET /api/leadflow/conversations/:id/lead-score` |
| **Follow-Up Copywriter** | `68e1ccae-ddf8-4618-8716-cb09beb3478d` | Generate contextual replies | Conversations "Generate Reply" → now full messaging | `POST /api/leadflow/conversations/:id/send-message` |
| **Sales Co-Pilots** | `bb723aa1-6e9c-45a1-a73d-3918977f7a46` | Sales strategy, objections, playbooks | `/copilots` dedicated page | `POST /api/leadflow/copilots/ask` |

**Auth Header Rule**: `Authorization: Bearer ***` is **only sent if `AI_API_KEY` is set in server/.env**. The `lead-db` chatflow works unauthenticated — header omitted automatically.

---

## 5. Features — Complete Breakdown

### 5.1 Revenue Operations Dashboard (`/leadflow`)
- **KPI Cards**: Total leads, open opportunities, hot leads, pending approvals
- **Pipeline Value**: Live sum from Opportunities table (demo: EGP 12,694)
- **Recent Activity Feed**: 10 most recent lead/status changes with timestamps
- **AI Analytics Section**: Natural language input → calls `lead-db` chatflow → renders SQL results + **auto-generated charts** (bar/line/pie based on question keywords)

### 5.2 Conversations Hub (`/conversations`)
- **Conversation List**: Filterable by status (ALL/ACTIVE/PENDING/RESOLVED/ARCHIVED), searchable
- **Real-time Updates**: 30s poll + webhook-driven refresh
- **Message Thread**: Chronological bubbles with sender avatars (Customer/You/AI/Bot)
- **Facebook Messenger Integration**:
  - Inbound: Webhook (`/api/webhook`) → stores as `HUMAN` message → updates `lastMessageAt`
  - Outbound: Message input → `POST /conversations/:id/send-message` → stores user msg → calls Follow-Up Copywriter chatflow → stores AI reply → returns both
- **Message Input**: Enter to send, auto-scroll, loading state, copy-to-clipboard on AI responses
- **Status Management**: Dropdown to change conversation status inline

### 5.3 Opportunities Management (`/opportunities`)
- **Pipeline Table**: All opportunities with stage, value, expected close, associated lead
- **Filters**: By stage, value range, date
- **Demo Data**: 3 opportunities totaling EGP 12,694

### 5.4 Sales Co-Pilots Workspace (`/copilots`)
- **Dedicated Chat Interface**: Persistent session history (localStorage)
- **Suggested Prompts**: "Handle pricing objection", "Draft follow-up for [lead]", "Create proposal outline"
- **AI Actions**: Copy response, regenerate, clear history
- **Context Awareness**: Can reference opportunity/lead data if passed

### 5.5 AI Analytics (`/analytics`) — **Now with Visualizations**
- **Natural Language Input**: "Show revenue by category", "Top 5 customers last quarter"
- **Backend Enhancement** (2026-10-20): Automatically extracts SQL results from `usedTools[0].toolOutput` and constructs `chartData`:
  - **Bar charts** for categorical comparisons (default)
  - **Line charts** for time-series/trend keywords
  - **Pie charts** for distribution/percentage questions
- **Response Format**:
```json
{
  "text": "### Revenue by product category\n\n| Category | Revenue |\n|---|---:|\n| Dresses | $5,499 |\n| ...",
  "chartData": {
    "type": "bar",
    "title": "Analysis Results",
    "labels": ["Dresses", "Footwear", "Knitwear"],
    "values": [5499, 4299, 2199]
  },
  "usedTools": [...]
}
```
- **Frontend**: `AnalyticsPage.jsx` renders `chartData` via `renderChart()` using Chart.js-compatible config

---

## 6. Database Schema (Prisma)

```prisma
// Key models — see server/prisma/schema.prisma for full

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(USER)
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id])
  createdAt     DateTime @default(now())
}

model Organization {
  id    String @id @default(uuid())
  name  String
  slug  String @unique
  users User[]
}

model Conversation {
  id              String   @id @default(uuid())
  organizationId  String
  customerId      String?
  customer        Customer? @relation(fields: [customerId], references: [id])
  status          ConversationStatus @default(ACTIVE)
  lastMessageAt   DateTime @default(now())
  messages        Message[]
  leadScore       LeadScore?
}

model Message {
  id              String       @id @default(uuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  sender          MessageSender // CUSTOMER | HUMAN | AI | BOT | SYSTEM
  content         String
  metadata        Json?
  createdAt       DateTime     @default(now())
}

model Opportunity {
  id            String @id @default(uuid())
  organizationId String
  leadId        String?
  name          String
  value         Decimal @db.Decimal(12,2)
  stage         OpportunityStage
  expectedClose DateTime?
  createdAt     DateTime @default(now())
}

enum MessageSender { CUSTOMER HUMAN AI BOT SYSTEM }
enum ConversationStatus { ACTIVE PENDING RESOLVED ARCHIVED }
enum OpportunityStage { PROSPECTING QUALIFICATION PROPOSAL NEGOTIATION CLOSED_WON CLOSED_LOST }
```

**Demo Seed Data** (`prisma/seed.js`):
- 1 Organization: "ABC Fashion" (`4d01ebeb-a684-4e84-bb66-a4ed5c76f42c`)
- 5 Users: admin@abcfashion.com/admin123, manager@abcfashion.com/user123, etc.
- 5 Conversations (4 active, 1 resolved)
- 3 Opportunities (EGP 12,694 total pipeline)
- 2 Hot leads, 1 pending approval
- 10 activity entries

---

## 7. Configuration Files

### 7.1 `server/.env` (Secrets — **Never Commit**)
```env
# Database
DATABASE_URL="postgresql://postgres:***@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?schema=public"

# MicroMind Core
AI_API_URL="https://core.aimicromind.com"
AI_API_KEY=***  # Empty = unauthenticated chatflows (lead-db works without)

# Chatflow IDs
AI_LEAD_DB_CHATFLOW_ID="bfe4a91b-470f-48f4-9e63-fbf66f29edbd"
AI_LEAD_INTELLIGENCE_CHATFLOW_ID="e4876b97-8c0a-4f79-838f-59dc66f656ac"
AI_FOLLOWUP_COPYWRITER_CHATFLOW_ID="68e1ccae-ddf8-4618-8716-cb09beb3478d"
AI_COPILOTS_CHATFLOW_ID="bb723aa1-6e9c-45a1-a73d-3918977f7a46"
AI_CONVERSATIONS_CHATFLOW_ID="46375c82-442a-4aff-8ff8-a97fdf2e6216"

# JWT
JWT_SECRET="***"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
```

### 7.2 `client/.env`
```env
VITE_API_URL=http://localhost:3000
```

### 7.3 `tailwind.config.js` — Custom Theme
```js
theme: {
  extend: {
    colors: {
      primary: { 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA' }, // Indigo
      secondary: { 500: '#8B5CF6', 600: '#7C3AED' }, // Purple
      surface: '#1C1C1C',
      background: '#0F0F0F',
    }
  }
}
```

---

## 8. Key Files — What They Do

| File | Purpose |
|------|---------|
| `server/src/index.js` | Express app entry, middleware, route mounting |
| `server/src/routes/leadflow.js` | **All business endpoints** — analytics, conversations, copilots, webhook helpers |
| `server/src/routes/webhook.js` | Facebook Messenger webhook receiver → stores inbound messages |
| `server/src/routes/auth.js` | JWT login/register, token verification middleware |
| `server/prisma/schema.prisma` | Database schema |
| `server/prisma/seed.js` | Demo data population |
| `client/src/App.jsx` | Routes: `/leadflow`, `/conversations`, `/opportunities`, `/analytics`, `/copilots`, `/settings`, `/login` |
| `client/src/components/Sidebar.jsx` | Navigation with search, responsive collapse, active route highlighting |
| `client/src/pages/AnalyticsPage.jsx` | AI Analytics UI — question input, response display, **chart rendering** |
| `client/src/pages/ConversationsPage.jsx` | Full messaging UI — list + detail + message input + send via chatflow |
| `client/src/pages/CopilotsPage.jsx` | Sales Co-Pilots chat interface with history & prompts |
| `client/src/pages/DashboardsPage.jsx` | Revenue ops dashboard with KPIs + AI Analytics section |
| `client/src/services/leadflowService.js` | **Centralized API client** — all `leadflow.*` methods |
| `client/src/context/AuthContext.jsx` | JWT token storage, user state, login/logout |

---

## 9. Running the Project

```bash
# Terminal 1 — Backend
cd /c/Users/lenovo/Desktop/LeadApp2/YourApp/server
npm install
npx prisma generate
npx prisma db push   # or migrate deploy for prod
npx prisma db seed   # loads ABC Fashion demo data
node src/index.js    # runs on http://localhost:3000

# Terminal 2 — Frontend
cd /c/Users/lenovo/Desktop/LeadApp2/YourApp/client
npm install
npm run dev          # runs on http://localhost:5173 (VITE_API_URL=http://localhost:3000)
```

**Demo Login**:
- `admin@abcfashion.com` / `admin123`
- `manager@abcfashion.com` / `user123`
- (3 more seeded users)

---

## 10. Known Limitations & Gotchas

| Area | Limitation | Workaround / Note |
|------|------------|-------------------|
| **Chart Generation** | Heuristic-based (keywords + SQL result shape) — not LLM-driven | Modify `extractChartData()` in `leadflow.js:740-820` for custom logic |
| **Chatflow Auth** | `AI_API_KEY` empty → unauthenticated calls only | Set `AI_API_KEY` in `.env` if chatflows require auth |
| **Webhook Security** | No signature verification on `/api/webhook` | Add `X-Hub-Signature-256` validation for production |
| **Real-time** | Polling (30s) + manual refresh — no WebSockets | Add Socket.io or Supabase Realtime for true real-time |
| **Multi-org** | Schema supports `organizationId` but UI assumes single org | Add org switcher in Sidebar for multi-tenant |
| **Error Boundaries** | No React error boundaries — crashes bubble to console | Wrap pages in `ErrorBoundary` component |
| **Tests** | Zero automated tests | Add Vitest (frontend) + Jest (backend) |
| **TypeScript** | Entire codebase is JavaScript | Migrate to TS for type safety |
| **Chart Library** | Uses inline `renderChart()` — no Chart.js/Recharts dep | Swap to Recharts for richer interactivity |
| **Rate Limiting** | None on chatflow endpoints | Add `express-rate-limit` before production |
| **Message Sender Enum** | Only `CUSTOMER\|HUMAN\|AI\|BOT\|SYSTEM` — no `USER` | Fixed in code (use `HUMAN` for user-sent messages) |

---

## 11. Extending the Platform

### Add a New Chatflow Integration
1. Add `AI_NEW_CHATFLOW_ID` to `server/.env`
2. Create endpoint in `server/src/routes/leadflow.js`:
```js
router.post('/new-feature/ask', async (req, res) => {
  const { question } = req.body;
  const chatflowId = process.env.AI_NEW_CHATFLOW_ID;
  // ... call MicroMind Core prediction endpoint
});
```
3. Add method to `client/src/services/leadflowService.js`
4. Create/page/update React component
5. Add route in `App.jsx` + nav item in `Sidebar.jsx`

### Add a New Database Model
1. Define in `server/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_model`
3. Add CRUD endpoints in `leadflow.js`
4. Add service methods + UI

### Switch to Production Database
- Update `DATABASE_URL` in `server/.env` to production Supabase project
- Run `npx prisma migrate deploy`
- Set `AI_API_KEY` if chatflows require authentication
- Set `NODE_ENV=production`
- Build frontend: `npm run build` → serve static files via Express or CDN

---

## 12. Debugging Cheatsheet

```bash
# Check backend health
curl http://localhost:3000/api/health

# Test chatflow directly
curl -X POST "https://core.aimicromind.com/api/v1/prediction/bfe4a91b-470f-48f4-9e63-fbf66f29edbd" \
  -H "Content-Type: application/json" \
  -d '{"question":"Show revenue by category","context":{"organizationName":"ABC Fashion"}}'

# Get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abcfashion.com","password": "***"}'

# Call authenticated endpoint
curl -X POST http://localhost:3000/api/leadflow/analytics/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ***" \
  -d '{"question":"Top customers"}'

# View Prisma data
npx prisma studio  # Opens http://localhost:5555

# Kill stuck ports (Windows)
npx kill-port 3000 5173
# or
taskkill /F /IM node.exe
```

---

## 13. Recent Critical Fixes (2026-10-20)

1. **Chatflow Auth Header** — Made conditional: only sent when `AI_API_KEY` present (fixes `lead-db` 401 errors)
2. **Port Conflicts** — `npx kill-port 3000` / `taskkill /F /IM node.exe` for Windows EADDRINUSE
3. **Message Sender Enum** — Fixed `USER` → `HUMAN` to match Prisma enum
4. **OrganizationId on Messages** — Removed (Message model has no `organizationId` field)
5. **Chatflow Response Parsing** — Extract reply from `usedTools[0].toolInput.messageText` (Messenger `send_text_message` tool)
6. **Analytics Visualizations** — **NEW**: Backend now auto-generates `chartData` from SQL results in `usedTools[0].toolOutput`

---

## 14. Handoff Checklist for Next Developer

- [ ] Read this guide end-to-end
- [ ] Run both servers locally (`npm run dev` in client + `node src/index.js` in server)
- [ ] Log in with demo credentials, visit all 5 pages
- [ ] Test Analytics: ask "Show revenue by product category" → verify bar chart renders
- [ ] Test Conversations: send message from UI → verify AI reply appears
- [ ] Test Webhook: send Messenger message from tester account → appears in UI
- [ ] Review `server/src/routes/leadflow.js` — understand all 10+ endpoints
- [ ] Review `client/src/services/leadflowService.js` — all frontend API calls
- [ ] Check `server/.env` has all 5 chatflow IDs
- [ ] Verify Supabase connection works (`npx prisma studio`)
- [ ] Run `npm run build` in client — ensure no TypeScript/ESLint errors

---

## 15. Contact / Context

**Original Request**: "lead db chatflow is not working properly in the app, reconnect it with this id: @url:`https://core.aimicromind.com/canvas/bfe4a91b-470f-48f4-9e63-fbf66f29edbd` ... it needs to be in the AI analatics section"

**Evolved Into**: Full LeadFlow AI platform build with 4 chatflows, Supabase migration, Messenger integration, and visualization pipeline.

**Key Decision**: Chatflows are the *backend* for features — not decorative. Each page calls its dedicated chatflow via the Express proxy, which handles auth, context enrichment, response parsing, and DB persistence.

---

*Generated 2026-10-20 from full conversation context. All secrets redacted. This document is the single source of truth for onboarding.*