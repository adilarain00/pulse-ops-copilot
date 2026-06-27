# 🏆 H0 Hackathon — Research & Strategy Dossier

> **Single source of truth** for *"H0: Hack the Zero Stack with Vercel v0 and AWS Databases."*
> Goal: **Win / place top 3 (solo).** Compiled 2026‑06‑26.

> [!WARNING]
> **The submission deadline is June 29, 2026 @ 5:00 PM PDT.**
> As of the date this dossier was written (June 26), that is **~3 days away.** This is effectively a *weekend sprint*, and the entire strategy below is built around that reality. If you have already started, jump to [§7 Winning Strategy](#7-winning-strategy) and [§9 Action Checklist](#9-action-checklist).

---

## Table of Contents
1. [Hackathon Overview](#1-hackathon-overview)
2. [Rules & Requirements](#2-rules--requirements)
3. [Sponsor Analysis](#3-sponsor-analysis)
4. [Tracks](#4-tracks)
5. [Existing Resources](#5-existing-resources)
6. [Community Research](#6-community-research)
7. [Winning Strategy](#7-winning-strategy)
8. [Opportunities](#8-opportunities)
9. [Action Checklist](#9-action-checklist)
10. [Personal Notes](#-personal-notes)
11. [TODO Checklist](#-todo-checklist)
12. [Progress Tracker](#-progress-tracker)
13. [Next Steps](#-next-steps)
14. [Important Links](#-important-links)

---

## 1. Hackathon Overview

| Field | Detail |
|---|---|
| **Name** | H0: Hack the Zero Stack with Vercel v0 and AWS Databases |
| **Tagline** | *"Front-end in minutes. Back-end designed for scale."* |
| **Organizers** | **Amazon Web Services (AWS)** + **Vercel** (Sponsor: Amazon; Administrator: Devpost) |
| **Platform** | Devpost — online & public |
| **Theme** | Build a full-stack app that pairs Vercel **v0** (rapid AI frontend scaffolding) with a **production-grade AWS Database** — proving fast prototyping doesn't compromise scale. |
| **Purpose** | Showcase the new AWS Databases × Vercel Marketplace integration; the app you build over a weekend runs on the same data foundation enterprises use in production. |
| **Participants** | ~9,371 registered |
| **Prize pool** | **$80,000 cash + $80,000 AWS credits** |

### Timeline & Important Dates (all **PDT**)

| Milestone | Date / Time |
|---|---|
| Hackathon start (submissions open) | **May 27, 2026 @ 12:00 PM** |
| Registration | Open through the submission period (no separate hard registration cutoff) |
| **🚨 Project submission deadline** | **June 29, 2026 @ 5:00 PM** |
| Judging period | **June 30 @ 9:00 AM → July 24 @ 5:00 PM** |
| **Winners announced** | **July 31, 2026 @ 2:00 PM** |

> [!NOTE]
> Convert to your local timezone now and put the **June 29, 5:00 PM PDT** deadline on a calendar with a 24‑hour and 2‑hour alarm. PDT = UTC‑7.

---

## 2. Rules & Requirements

### Eligibility
- Must be **at least the age of majority** where you reside at time of entry.
- **Excluded regions:** Argentina, Italy, Philippines, Thailand, Vietnam, Syria, Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, and any country under US Treasury OFAC sanctions.
- **Excluded persons:** employees/immediate family of AWS, Devpost, or promotion partners; judges and their employers; anyone with a conflict of interest.

### Team Size
- **Solo or teams both allowed.** You can join/enter multiple teams. ✅ *(You are entering solo.)*
- Teams designate one eligible **Representative** who receives and distributes any prize.

### Required Technologies (mandatory)
| Layer | Requirement |
|---|---|
| **Frontend / deploy** | **Vercel** deployment **or** **v0.app** |
| **Database (pick ≥1)** | **Amazon Aurora PostgreSQL** *or* **Aurora DSQL** *or* **Amazon DynamoDB** |
| **Architecture** | Must be a genuine **full-stack** app (frontend ↔ backend ↔ AWS DB) |

### Restricted / Disallowed
- Project must **not** have received prior financial support from AWS or Devpost.
- **Newness rule:** project must be newly created during the hackathon **OR**, if it pre-existed, it must have **added the AWS Databases + Vercel integration after the hackathon start.** (Pre-built apps that simply bolt on the stack are weaker entries and risk the Stage‑One newness check.)

### Submission Requirements (checklist)
- [ ] Functioning full-stack application
- [ ] **Text description** of features + **which AWS database(s)** you used
- [ ] **Demo video < 3 minutes**, public on **YouTube (preferred)**, Vimeo, or Youku — must show: the problem & target user, *footage of the working app*, and an explanation of the AWS database used
- [ ] **Published Vercel project link**
- [ ] **Vercel Team ID** ([how to find it](https://vercel.com/docs/accounts#find-your-team-id))
- [ ] **Architecture diagram** showing app → backend connections
- [ ] **Screenshot proving AWS DB usage** (Vercel Storage config, AWS Console, etc.)

### Judging Criteria (Stage Two — 4 criteria, **equally weighted**)
| # | Criterion | What judges look for |
|---|---|---|
| 1 | **Technological Implementation** | Real software craftsmanship; *deliberate* AWS DB integration with a thoughtful data model & architecture; clean, intentional design |
| 2 | **Design** | Intuitive UX; cohesive frontend↔backend relationship; full-stack thinking |
| 3 | **Impact & Real-world Applicability** | Solves a meaningful problem for a real audience; is it shippable? |
| 4 | **Originality** | Creative concept; genuine insight into the stack |

- **Stage One** is a **pass/fail** gate (baseline viability + on-theme), possibly using manual / automated / AI-assisted review.
- **Bonus:** up to **+0.6 points** for publicly publishing build content (see [§3 bonus](#bonus-prize-opportunity-content)).
- **Tiebreaker:** highest score in the **first** listed criterion (Technical Implementation) wins.
- **One prize max per project.**

### Open-Source / Licensing / IP
- You **retain IP ownership**; AWS gets a non-exclusive license for judging/promotion.
- Submissions must be **original** and not infringe others' IP.
- Open-source software **is allowed** provided you comply with its licenses.
- **No mandatory open-sourcing**, but a clean public repo strengthens the "craftsmanship" and credibility story for judges.

---

## 3. Sponsor Analysis

### 🟧 Amazon Web Services (AWS) — *primary sponsor*
| | |
|---|---|
| **Overview** | World's largest cloud provider; this event spotlights its **managed databases** now natively provisionable from Vercel. |
| **Products / APIs in scope** | **Aurora PostgreSQL** (serverless relational), **Aurora DSQL** (serverless distributed SQL, active-active multi-region), **DynamoDB** (managed NoSQL key-value/document) |
| **Why sponsoring** | Drive database adoption among the fast-moving Vercel/Next.js developer base; show AWS DBs can be provisioned in *seconds* and scale to production. |
| **Recommended use cases** | See the [database decision guide in §7](#which-aws-database-decision-guide). |
| **What impresses their judges** | The judging panel is **entirely AWS database leaders** (PMs & Solutions Architects). They will reward a **deliberate, well-justified data model** and correct use of the DB's strengths far more than UI polish alone. |

### ▲ Vercel (v0) — *co-host*
| | |
|---|---|
| **Overview** | Frontend cloud + creators of **Next.js**; **v0** is their AI app-builder that scaffolds full Next.js UIs from prompts. |
| **Products / APIs** | **v0.app** (AI frontend generation), **Vercel deployment**, **Vercel Marketplace** (one-click AWS DB provisioning, auto-injects credentials/env vars) |
| **Why sponsoring** | Position v0 + Marketplace as the fastest path from idea → deployed full-stack app. |
| **Recommended use cases** | Use **v0 to generate the entire frontend + API routes**, then wire the Marketplace AWS DB integration (it auto-manages env vars). This is the single biggest time-saver for a 3-day sprint. |

### 🎁 Bonus Prize Opportunity (Content)
Publish a blog / video / podcast about building your project with the AWS DB + Vercel. Must be **public** (builder.aws.com, LinkedIn, Medium, dev.to, YouTube…), state it was created for the hackathon, and use **`#H0Hackathon`**. Worth **up to +0.6 bonus points** and **multiple submissions allowed.** → **Low effort, high ROI. Do this.**

---

## 4. Tracks

> Each track awards **1st: $10k+$10k credits / 2nd: $5k+$5k / 3rd: $3k+$3k.** Plus 4 cross-cutting "Best of" prizes at **$2k+$2k** each (Best Technical Implementation, Best Design, Most Impactful, Most Original). **You compete in one track but can also win a "Best of."**

| Track | Objective | Winning characteristics | Recommended solo project type | Difficulty | Impact ceiling |
|---|---|---|---|---|---|
| **1. Monetizable B2C** | Consumer app for ecommerce, travel, retail, hospitality | Clear monetization, polished UX, relatable problem | AI-personalized shopping/travel concierge; niche marketplace | 🟢🟢 Moderate | High (broad appeal) |
| **2. Monetizable B2B** | App solving a company problem in finance, tech, healthcare, insurance, marketing | Real workflow pain, credible data model, "would pay for this" | Internal dashboard / ops tool / vertical SaaS slice | 🟡🟡🟡 Moderate-High | High (judges grok B2B value) |
| **3. Million-scale Global** | Gaming / social / entertainment app **architected to scale to millions** | **Architecture is the star** — sharding, global tables, partition design | Real-time leaderboard, social feed, multiplayer-lite | 🔴🔴🔴🔴 Hardest solo | Very high *if* the scale story is real |
| **4. Open Innovation** | Anything full-stack on the required stack | Creativity + flawless execution | Whatever you can demo best | 🟢 Flexible | Variable |

### Track recommendation for a solo, win-focused entry → see [§7](#7-winning-strategy).

---

## 5. Existing Resources

### Getting Started (do these first, in order)
1. Create a **v0.app** account → https://v0.app
2. Submit the **credit request form** (USD $100 AWS credits): https://forms.gle/ozhbhvaXAxHxu3kMA
   - *Also:* new AWS customers get **$100 in AWS credits** when creating an account via the Vercel Marketplace.
3. Provision your AWS DB from the **Vercel Marketplace** (auto-handles env vars)
4. Build & deploy on **v0 + Vercel** → https://v0.app/?pi=aws
5. Register on Devpost → https://h01.devpost.com/register

### Official Docs, SDKs & Templates
| Resource | Link |
|---|---|
| v0 Docs / Quickstart / FAQs | https://vercel.com/docs/v0 · https://v0.app/docs/quickstart · https://v0.app/docs/faqs |
| Vercel AWS Databases Marketplace | https://vercel.com/marketplace/aws |
| **Next.js + Aurora PostgreSQL template** | https://vercel.com/templates/next.js/next-js-vercel-app-with-aurora-postgresql |
| **Next.js + Aurora DSQL template** | https://vercel.com/templates/next.js/next-js-vercel-app-with-aurora-dsql |
| Aurora DSQL **Movies demo (GitHub)** | https://github.com/vercel/aws-dsql-movies-demo |
| Aurora DSQL **Starter Kit** | https://awslabs.github.io/aurora-dsql-starter-kit/guides/getting-started/quickstart.html |
| Connect Next.js → Aurora PostgreSQL (Vercel KB) | https://vercel.com/kb/guide/connect-next-js-to-amazon-aurora-postgresql-using-vercel-marketplace |
| Aurora PostgreSQL docs / getting started | https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html · [Getting Started](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.html) |
| Aurora DSQL docs / getting started | https://docs.aws.amazon.com/aurora-dsql/latest/userguide/what-is-aurora-dsql.html · [Getting Started](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/getting-started.html) |
| DynamoDB docs / getting started | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html · [Getting Started](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStartedDynamoDB.html) |
| Find your **Vercel Team ID** | https://vercel.com/docs/accounts#find-your-team-id |
| **Live build session / webinar** signup | https://us02web.zoom.us/webinar/register/WN_Ga39jBx_SEKkrKWEJj97vw#/registration |
| AWS Builder space (bonus content) | https://builder.aws.com/connect/space/71f2a761-009f-3283-846c-9a6f86fb4763/h0-hackathon |

### Announcement Blogs (read for context + judge mindset)
- Vercel: *AWS databases are now live on the Vercel Marketplace and v0* — https://vercel.com/blog/aws-databases-are-now-live-on-the-vercel-marketplace-and-v0
- AWS: *AI-native, full-stack web apps with Vercel and AWS Databases* — https://aws.amazon.com/blogs/database/ai-native-full-stack-web-apps-with-vercel-and-aws-databases/

### Architecture diagram tools (required deliverable)
draw.io / diagrams.net (free, has AWS icons) · Excalidraw · Lucidchart · Figma

---

## 6. Community Research

> [!NOTE]
> This is a **brand-new integration launch hackathon** (announced ~late May 2026), so there's no large historical participant corpus yet. Findings below are from the official pages, AWS/Vercel channels, and active community groups.

| Channel | Finding |
|---|---|
| **Devpost** | Submissions managed at the [submission portal](https://devpost.com/submit-to/29812-h0-hack-the-zero-stack-with-vercel-v0-and-aws-databases/manage/submissions). Use Devpost's discussion tab for official Q&A. |
| **AWS Databases (LinkedIn)** | Actively promoting under `#H0Hackathon` — the hashtag judges/sponsors monitor. ([post](https://www.linkedin.com/posts/aws-databases_aws-awsdatabases-h0hackathon-activity-7465874596672569345-dr6M)) |
| **Community co-working** | **JAWS-UG (Japan AWS User Group, Saga)** is running recurring online "もくもく会 (mokumoku / co-working) sessions" for ideation, implementation, and **submission prep** — useful even just to see how others scope projects. ([connpass event](https://jawsug-saga.connpass.com/event/395780/)) |
| **AWS Builder space** | Dedicated [H0 space](https://builder.aws.com/connect/space/71f2a761-009f-3283-846c-9a6f86fb4763/h0-hackathon) for posting bonus content and connecting with other builders. |
| **Webinar** | Official live build session (Zoom) — watch the replay for the intended "happy path" the judges expect. |

### FAQs / common pitfalls (synthesized from rules + judge profile)
- **"Demo, not deployment" trap:** The blogs explicitly say judges want *shippable software, not just demos.* A pretty UI over a fake/in-memory backend will score poorly on Criterion 1.
- **Shallow DB usage:** Because **all 10 judges are AWS database experts**, a token DB call won't cut it. Your data model and *why this DB* must be deliberate.
- **Newness rule:** don't submit an old project with the integration sprinkled on.
- **Video > 3 min or private video** = instant friction at Stage One. Keep it tight and public.
- **Missing Team ID / screenshot / architecture diagram** = incomplete submission. These are easy points to lose.

---

## 7. Winning Strategy

> Context: **solo builder, ~3 days, goal = win/top‑3.** Optimize ruthlessly for the rubric, and remember the panel is **all database people.**

### 🎯 Recommended Track: **Track 2 — Monetizable B2B App**
**Why (for a solo, win-focused entry):**
- Judges instantly understand B2B value; "a company would pay for this" maps directly to **Impact & Real-world Applicability.**
- B2B apps justify a **rich relational data model** → perfect for showing off **deliberate DB design** (your highest-weight tiebreaker criterion).
- **Less UI-polish pressure** than B2C (which competes on consumer delight) and **far less architectural risk** than Track 3 (million-scale is brutal to *prove* solo in 3 days).
- *Backup:* if your idea is more fun/visual, **Track 4 (Open Innovation)** lets you win on execution without genre constraints. Avoid **Track 3** solo unless you have a genuine, demonstrable scaling story.

> Whichever track you pick, **also aim at one "Best of" prize** — for the DB-expert panel, **"Best Technical Implementation"** ($2k+$2k) is the most winnable secondary target. Design your data model to be the showpiece.

### 🧱 Recommended Stack
| Layer | Pick | Reason |
|---|---|---|
| Frontend | **v0.app → Next.js (App Router) on Vercel** | Fastest scaffold; required; v0 generates UI + API routes |
| Database | **Aurora PostgreSQL (serverless)** *(default for B2B)* | Relational model lets you *show* a deliberate schema with relationships — exactly what the judges reward. Provisions in seconds via Marketplace. |
| ORM/query | Drizzle or `pg` / Prisma | Clean, inspectable schema = craftsmanship signal |
| AI feature | **Anthropic Claude** (latest: **`claude-opus-4-8`**, or `claude-haiku-4-5-20251001` for cheap/fast paths) | One sharp AI feature lifts Originality + Impact. Right-size: Haiku for routine calls, Opus for the hard step. |
| Diagram | draw.io with AWS icons | Required deliverable; make it clean |

#### Which AWS Database? (decision guide)
| Choose… | When your project is… |
|---|---|
| **Aurora PostgreSQL** | Relational data, joins, transactions, a schema you can *show off* → **best default for B2B/B2C.** Lowest latency (no network hop on Vercel). |
| **Aurora DSQL** | Needs multi-region active-active / global SQL with strong consistency. Great *story* for "scale," but **don't treat it as drop-in Postgres** — it has constraints. Use the [movies demo](https://github.com/vercel/aws-dsql-movies-demo) + [starter kit](https://awslabs.github.io/aurora-dsql-starter-kit/guides/getting-started/quickstart.html). |
| **DynamoDB** | NoSQL, event-driven, high-throughput key-value/real-time, predictable single-digit-ms latency → natural for **Track 3 (million-scale)** with Global Tables. Requires deliberate single-table / access-pattern design to impress. |

> **Tip:** Pick the DB that lets you tell the *clearest "deliberate data model" story on camera in 30 seconds.* For most solo B2B ideas that's **Aurora PostgreSQL.** Only choose DSQL/DynamoDB if scale/global is genuinely your narrative.

### 📦 Project Size (scope for a solo 3-day win)
- **One** sharp, complete vertical slice — *not* a broad half-built suite.
- 3–5 core screens, **one** "wow" feature, a **real** persisted data model with 3–6 related tables, and a flawless < 3-min demo.
- **Working > feature-rich.** A small app that genuinely works beats an ambitious one that breaks on camera.

### 🤖 Best AI Integrations
- **One** high-value AI feature, deeply integrated: e.g., natural-language → structured query over your DB, AI-generated insights/summaries from real stored data, smart classification/extraction that writes back to the DB.
- Make the AI **read/write your AWS database** so the AI feature *and* the DB story reinforce each other on camera.
- Validate AI output before persisting (don't write unvalidated model output to the DB).

### ⭐ Features judges value (map every build decision to these)
1. **Deliberate data model** — show the schema/ERD and explain *why this DB.* (Highest-leverage; it's the tiebreaker.)
2. **Actually works end-to-end** — live data round-trips, not mocks.
3. **Clear problem + named target user** — say it in the first 15 seconds of the video.
4. **Cohesive full-stack UX** — frontend reflects real backend state.
5. **Originality** — a non-obvious idea or a clever use of the stack.

### ⚠️ Risks to avoid
- ❌ Over-scoping → broken demo. **De-scope early and often.**
- ❌ Fake/in-memory backend — the DB-expert panel *will* notice.
- ❌ Shallow DB usage (one trivial query) — invest in the data model.
- ❌ Leaving the demo video to the last hour — it's a graded deliverable; budget real time.
- ❌ Missing required artifacts (Team ID, AWS-usage screenshot, architecture diagram, public < 3-min video).
- ❌ Violating the **newness rule** with a pre-existing project.
- ❌ Skipping the **bonus content** (+0.6 pts is a large margin in an equally-weighted rubric).

---

## 8. Opportunities

### Problems worth solving (B2B-leaning, solo-friendly, strong DB story)
| Idea | Track | Why it can win | DB |
|---|---|---|---|
| **AI ops copilot for SMBs** — natural-language questions over their orders/inventory/customers DB, returns charts + actions | B2B | NL→SQL shows off relational schema + AI; "would pay for this" impact | Aurora PG |
| **Compliance/contract reviewer** — upload docs, AI extracts clauses → stored, queryable obligations & deadlines | B2B | Real pain (legal/finance); deliberate schema for extracted entities | Aurora PG |
| **Vertical CRM slice for a niche** (clinics, agencies, insurers) | B2B | Judges grok value instantly; rich relational model | Aurora PG |
| **Real-time multiplayer trivia / live leaderboard** | Million-scale | Architecture story is the star; DynamoDB Global Tables narrative | DynamoDB |
| **Personalized travel/itinerary builder** with AI + saved trips | B2C | Relatable, demoable, monetizable | Aurora PG/DSQL |

### Underserved / fast-MVP angles
- **NL→database query** tools are surprisingly demoable and directly flatter the DB-expert judges.
- **"Boring B2B" verticals** (insurance, logistics, healthcare back-office) have weak competition in consumer-heavy hackathons → easier to stand out on Impact.
- The **bonus content** is underused free points — a 600-word dev.to post + tweet with `#H0Hackathon` is ~30 min of work.

### High-impact, low-effort wins
- Use a **v0 template / official starter** (Aurora PG or DSQL movies demo) as your skeleton → save hours of plumbing.
- Provision DB via **Vercel Marketplace** (auto env vars) → skip credential pain.
- Record the demo with a **tight script** (see checklist) → judges watch hundreds; clarity wins.

---

## 9. Action Checklist

### 🔵 Before / Setup (Day 0 — today)
- [ ] Register on Devpost: https://h01.devpost.com/register
- [ ] Submit credit request form (AWS $100): https://forms.gle/ozhbhvaXAxHxu3kMA
- [ ] Create v0.app account; create Vercel account; note **Vercel Team ID**
- [ ] Lock the **track** (recommend B2B) and **one** project idea
- [ ] Pick the **AWS DB** (default Aurora PostgreSQL) and provision via Vercel Marketplace
- [ ] Skim the relevant starter template + the two announcement blogs
- [ ] Put **June 29 5:00 PM PDT** on calendar with 24h + 2h alarms (convert to local time)

### 🟢 During (Days 1–2.5 — the build)
- [ ] **Day 1 AM:** Finalize data model / ERD first (schema before screens). Create tables in AWS DB.
- [ ] **Day 1 PM:** Scaffold UI + API routes with v0; wire to the DB; get **one** full data round-trip working.
- [ ] **Day 2:** Build the core vertical slice + the **one** AI feature; deploy early to Vercel and keep it green.
- [ ] **Day 2 PM:** Polish UX, seed realistic data, fix the demo-critical path. **Freeze scope.**
- [ ] Draft the **architecture diagram** (draw.io) as you go.
- [ ] (Bonus) Write a short build blog/video; post with `#H0Hackathon`.

### 🟡 Submission Day (June 29 — finish by early afternoon PDT)
- [ ] Final deploy; verify the live URL works in an incognito window
- [ ] Record **demo video < 3 min**, script order: **problem + who → live app footage → AWS DB explanation → close.** Upload **public** to YouTube.
- [ ] Take the **AWS DB usage screenshot** (Vercel Storage config / AWS Console)
- [ ] Finalize **architecture diagram**
- [ ] Write the **text description** (features + which DB + why)
- [ ] Gather: published **Vercel project link** + **Vercel Team ID**
- [ ] Complete Devpost submission; **double-check every required field**
- [ ] **Submit by ~2:00 PM PDT** (3-hour buffer before the 5:00 PM cutoff)
- [ ] Post bonus content link(s) if not already

### 🟣 After Submission
- [ ] Confirm submission shows in the [portal](https://devpost.com/submit-to/29812-h0-hack-the-zero-stack-with-vercel-v0-and-aws-databases/manage/submissions)
- [ ] Share on LinkedIn/X with `#H0Hackathon` (more bonus exposure)
- [ ] Keep the deployment live & DB running through **judging (June 30 → July 24)** — judges may open it
- [ ] Watch for results on **July 31 @ 2:00 PM PDT**
- [ ] Note lessons learned for the next hackathon

---

## 📝 Personal Notes
> _Free space — capture decisions, idea pivots, blockers, credentials location (NOT secrets in plaintext), judge-feedback to revisit._

- Chosen track:
- Chosen idea / one-liner:
- Chosen AWS DB + why:
- Target "Best of" prize:
- Demo video script link:
- Blockers:

---

## ✅ TODO Checklist (high-level)
- [ ] Accounts + credits + registration done
- [ ] Idea + track locked
- [ ] Data model designed & created in AWS DB
- [ ] App working end-to-end (live data)
- [ ] AI feature integrated
- [ ] Deployed & green on Vercel
- [ ] Architecture diagram done
- [ ] Demo video (<3 min, public) recorded
- [ ] All submission artifacts gathered (Team ID, screenshot, links, description)
- [ ] Submitted on Devpost (with buffer)
- [ ] Bonus content published with `#H0Hackathon`

---

## 📊 Progress Tracker

| Phase | Status | Notes |
|---|---|---|
| Research & strategy | ✅ Done | This dossier |
| Setup (accounts/credits/DB) | ⬜ Not started | |
| Idea + track locked | ⬜ Not started | |
| Data model designed | ⬜ Not started | |
| Core app working | ⬜ Not started | |
| AI feature | ⬜ Not started | |
| Deployed to Vercel | ⬜ Not started | |
| Architecture diagram | ⬜ Not started | |
| Demo video | ⬜ Not started | |
| Submission complete | ⬜ Not started | |
| Bonus content | ⬜ Not started | |

_Legend: ✅ done · 🟡 in progress · ⬜ not started · ❌ blocked_

---

## ⏭️ Next Steps
1. **Today:** register, request credits, create v0/Vercel accounts, **lock the idea + Track 2 (B2B)**, provision Aurora PostgreSQL via the Marketplace.
2. **Design the data model first** — it's your highest-leverage, tiebreaker-deciding asset.
3. Scaffold with v0, get one **real** data round-trip live by end of Day 1.
4. Build the single vertical slice + one AI feature; **freeze scope** by Day 2 evening.
5. **June 29 morning:** record the tight <3-min video, gather artifacts, submit by ~2 PM PDT.
6. Publish bonus content with `#H0Hackathon`.
7. Keep everything live through judging; check results July 31.

---

## 🔗 Important Links
- **Hackathon home:** https://h01.devpost.com/
- **Rules:** https://h01.devpost.com/rules
- **Resources:** https://h01.devpost.com/resources
- **Register:** https://h01.devpost.com/register
- **Submission portal:** https://devpost.com/submit-to/29812-h0-hack-the-zero-stack-with-vercel-v0-and-aws-databases/manage/submissions
- **Credit request form:** https://forms.gle/ozhbhvaXAxHxu3kMA
- **v0:** https://v0.app/?pi=aws · **Docs:** https://vercel.com/docs/v0
- **Vercel AWS Marketplace:** https://vercel.com/marketplace/aws
- **AWS Builder H0 space:** https://builder.aws.com/connect/space/71f2a761-009f-3283-846c-9a6f86fb4763/h0-hackathon
- **Vercel launch blog:** https://vercel.com/blog/aws-databases-are-now-live-on-the-vercel-marketplace-and-v0
- **AWS launch blog:** https://aws.amazon.com/blogs/database/ai-native-full-stack-web-apps-with-vercel-and-aws-databases/

---

*Dossier compiled 2026-06-26. Verify the live Devpost rules/dates before submitting — official pages are authoritative if anything here differs.*
