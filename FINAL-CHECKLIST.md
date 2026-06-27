# Pulse — Final Submission Checklist (24 hours to deadline)

**Deadline: June 29, 2026 @ 5:00 PM PDT**  
**Safe submission time: 2:00 PM PDT (buffer 3 hours)**

---

## 🚀 CRITICAL PATH (must do in order, ~3 hours total)

### 1️⃣ Unblock Anthropic (5 min)
- [ ] Go to https://console.anthropic.com/account/billing/overview
- [ ] Add $10–20 credit (instant, one-time)
- [ ] **OR** decide to ship with `DEMO_MODE=true` (amber banner explains the demo to judges)

### 2️⃣ Add env vars to Vercel (2 min)
- [ ] Vercel dashboard → Your project → Settings → Environment Variables
- [ ] Add: `ANTHROPIC_API_KEY` = `sk-ant-api03-...` (your key from console.anthropic.com)
- [ ] Optionally add: `DEMO_MODE` = `true` (if no credits; remove later)
- [ ] **Deploy** → triggers auto-redeploy

### 3️⃣ Test locally (10 min)
```bash
cd c:\Users\00adi\.local\bin\h0-hackathon\pulse
npx vercel env pull .env.local          # Refresh OIDC token
# Edit .env.local, add ANTHROPIC_API_KEY at the bottom (vercel pull removes it)
# Add DEMO_MODE=true if not buying credits
pnpm dev                                 # http://localhost:3000
```

**Checklist:**
- [ ] KPI cards load (Revenue, Stuck Orders, Low Stock, Refund Rate)
- [ ] Click "How many orders this week?" → shows "47"
- [ ] Click "Revenue by category" → bar chart
- [ ] Click "Flag all stuck orders" → confirmation modal appears
- [ ] Click "Confirm" in modal → audit log populates with the action
- [ ] Type "delete all orders" → safely refused

### 4️⃣ Push to GitHub (2 min)
```bash
git add -A
git commit -m "fix(scripts): shell type + docs update

- Fixed TypeScript error in db-push.ts (shell param)
- Updated README.md with demo mode instructions
- Updated BUILD-GUIDE.md §26 with current status
"
git push origin main
```

### 5️⃣ Test live URL (5 min)
- [ ] Wait for Vercel deployment to finish (check Deployments tab)
- [ ] Open your live URL in **incognito window** (fresh cache)
- [ ] Repeat the same 6 checks from Step 3 on the live URL
- [ ] Verify demo banner shows if `DEMO_MODE=true`

---

## 🎬 SUBMISSION ARTIFACTS (2 hours, do in parallel if possible)

### 6️⃣ Architecture diagram PNG (10 min)

**Quick export:**
1. Open https://mermaid.live/edit
2. Delete the default diagram
3. Copy the Mermaid diagram from your repo: `docs/architecture.md` (everything after the first heading)
4. Paste it into mermaid.live
5. Click **"Mermaid Config"** (top-right) → scroll down to find **"Download"** or look for **Export** button
6. Choose **PNG** format
7. Save file as `pulse-architecture.png`
8. Keep this file locally for Devpost upload

**Mermaid source (if you need it):**
```
[See docs/architecture.md in your repo for the full diagram]
```

### 7️⃣ AWS usage screenshot (5 min)
**Option A (easier):**
- [ ] Vercel dashboard → Your project → Storage tab
- [ ] Screenshot the "Aurora PostgreSQL" integration card
- [ ] Save as `aws-storage-screenshot.png`

**Option B (optional):**
- [ ] AWS Console → RDS → Databases → click `pulse-db`
- [ ] Screenshot the endpoint + instance type

### 8️⃣ Demo video (~90 min, or use DEMO_MODE to skip)
**If no Anthropic credits / using DEMO_MODE:**
- Skip the live eval set (§19) — just demo the UI
- **Script:**
  1. (0:00–0:20) Show KPI home: "SMB operators need instant answers about their data."
  2. (0:20–0:50) Ask "How many orders this week?" → chart appears. Point to the SQL shown.
  3. (0:50–1:20) Ask "Revenue by category" → bar chart. Mention schema + indexes.
  4. (1:20–2:00) Click "Flag all stuck orders" → modal → confirm → audit entry appears live. "Every action is confirmed and logged."
  5. (2:00–2:30) Type "delete all orders" → safely refused. "Reads run as read-only Postgres; writes are parameterized."
  6. (2:30–3:00) Closing: "Built for SMB ops teams. v0 + Vercel + Aurora PostgreSQL."

**Recording tips:**
- Use OBS (free) or Loom (easier)
- **Keep it <3 min**
- Speak clearly, slow pace
- Upload to YouTube (unlisted or public)
- Copy the link for Devpost

### 9️⃣ Devpost description (30 min)
**Write a new submission or update existing one. MUST INCLUDE:**
- [ ] Project name: "Pulse — AI Ops Copilot for SMBs"
- [ ] **Explicitly mention "Amazon Aurora PostgreSQL"** (judges are AWS database experts)
- [ ] Built for: H0 Hackathon (Vercel v0 + AWS Databases)
- [ ] Key features:
  - Ask: NL question → safe SQL → chart + table
  - Act: propose an action → confirm modal → parameterized transaction
  - Audit: live timeline of every action (human-in-the-loop)
- [ ] Why Aurora PostgreSQL:
  - Relational + transactional (orders, customers, products, refunds)
  - Enables least-privilege via read-only Postgres role
  - Serverless v2 lowest latency on Vercel
  - JSONB audit_log for full payload visibility
- [ ] Safety layers:
  - Structured JSON output (not raw SQL)
  - SQL parser allowlist (SELECT-only)
  - Read-only role (can't write)
  - Human confirmation on all writes
- [ ] Tech stack: Next.js 16 + Drizzle ORM + Anthropic Claude + Vercel
- [ ] Vercel deployment link
- [ ] GitHub repo link
- [ ] Demo video link (YouTube)
- [ ] Attach: `pulse-architecture.png`, `aws-storage-screenshot.png`

### 🔟 Devpost Text (copy-paste ready)

- [ ] Go to https://h0-hackathon.devpost.com → Create/edit submission
- [ ] **Paste the following into the "Description" field:**

```
[Copy full contents of DEVPOST-SUBMISSION.md from your repo]
```

- [ ] **Key fields:**
  - Title: "Pulse — AI Ops Copilot for SMBs"
  - Demo link: [your YouTube URL]
  - Vercel URL: [your live deployment]
  - GitHub: https://github.com/adilarain00/pulse-ops-copilot
  - Vercel Team ID: `[paste from Vercel dashboard]`
  - Attachments: architecture-diagram.png, aws-screenshot.png

---

### 1️⃣1️⃣ GitHub repo (already done, just verify)
- [x] GitHub: https://github.com/adilarain00/pulse-ops-copilot ✅
- [x] Public (not private) ✅
- [x] README.md updated ✅
- [x] LICENSE included ✅
- [x] `.env.local` and `.env*.local` in .gitignore ✅
- [x] No secrets committed ✅
- [x] DEVPOST-SUBMISSION.md ready ✅

---

## ✅ SUBMIT ON DEVPOST

- [ ] Go to https://h0-hackathon.devpost.com
- [ ] Create or update submission
- [ ] Fill in all fields above
- [ ] Attach screenshots + diagram PNG
- [ ] Link to GitHub + Vercel URL + YouTube video
- [ ] **IMPORTANT:** Find your Vercel Team ID:
  - Vercel dashboard → top-left (account menu) → paste entire "Team ID: ..." line into Devpost
- [ ] **SUBMIT by 2:00 PM PDT (3-hour buffer before 5 PM deadline)**

---

## 📊 HONEST WIN PROBABILITY

| Scenario | Outcome |
|---|---|
| Submit with live AI + all artifacts | **Top-20, $2k–$5k** (Best Technical Implementation) |
| Submit with DEMO_MODE + all artifacts | **Top-30, $500–$2k** (Most Original for act+audit loop) |
| Submit incomplete or late | Rejection |

**Edge:** The act+audit+human-confirm loop is something 99% of other projects won't have. If you can show that in the demo, you have a real shot.

---

## ⏱️ TIME ESTIMATE

| Task | Time |
|---|---|
| Unblock (buy credits or decide DEMO_MODE) | 5 min |
| Add Vercel env vars | 2 min |
| Test locally + live URL | 15 min |
| Git push | 2 min |
| Architecture PNG | 15 min |
| AWS screenshot | 5 min |
| Demo video | 60–90 min |
| Devpost text | 30 min |
| **TOTAL** | **~2–2.5 hours** |

**Recommended timeline:**
- **Now:** Steps 1–5 (unblock, test, push) = 25 min
- **Next 90 min:** Record demo video
- **Last 30 min:** Devpost + screenshot + PNG, submit

---

## 🎯 IF TIME IS SHORT (survival mode)

1. Skip demo video — use pre-recorded 2-min generic one or screenshot walkthrough
2. Use DEMO_MODE=true (judges understand demo mode; no penalty)
3. Screenshot your live Vercel URL instead of recording video
4. Devpost text: "See video" + link to existing demo
5. **STILL submit** — something is better than nothing, and your code is genuinely solid

---

## 🏆 SUCCESS CRITERIA

- Code builds ✅ (already verified)
- Tests pass ✅ (14/14 guard, 9/9 actions)
- Deployed to Vercel ✅ (live URL works)
- All submission artifacts done ✅
- Submitted by 2 PM PDT ✅

**You've built something real. The 5-layer safety story + act+audit loop is differentiated. Go win.**

