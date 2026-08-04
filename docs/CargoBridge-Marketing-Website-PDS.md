# CargoBridge Marketing Website
# Product Design Specification (PDS) — Figma Make Source of Truth

**Document version:** 1.0  
**Product:** CargoBridge  
**Audience for this document:** Figma Make, product designers, creative directors  
**Output expected:** Complete marketing website design (all pages, components, states)  
**Explicitly out of scope:** React, HTML, CSS, code, changes to the existing CargoBridge dashboard application  

---

## How to use this document in Figma Make

1. Paste **Section 21 (Master Prompt)** first to establish global system, brand, and constraints.  
2. Generate the **component library** using Section 15.  
3. Generate each page using the **per-page prompts** in Section 22, in sitemap order.  
4. When conflicting instincts appear (generic SaaS purple, Sign Up buttons, USD pricing), this document wins.

---

## Project reality (must stay accurate)

CargoBridge is a modern cloud platform for businesses that import goods from **China** and operate in **Algeria / North Africa**. It replaces Excel, WhatsApp threads, sticky notes, disconnected calculators, paper documents, and fragmented tools with one integrated **business operating system**.

**Real product modules to showcase (names must match the product):**

- Dashboard  
- Goods Management (shipment lifecycle)  
- Supplier Management (profiles, outstanding balances, communications, tasks)  
- Agent Management  
- Buying Operations (Purchase Orders)  
- Payment Operations  
- Shipment / goods status tracking  
- Customs-related status workflow (as part of goods operations)  
- Business Calculator (exchange rates, landed-cost style clarity)  
- QR Code generation + Scanner + public tracking story  
- Document management & supplier/reception templates  
- Audit / Business History timeline  
- Reports & analytics surfaces  
- Multi-language: **Arabic (RTL)** + **French (LTR)**  
- Mobile-accessible operations UI  
- Secure multi-tenant cloud (organization-scoped workspaces)

**Architecture boundary:** This marketing website is a **separate public storefront**. The authenticated CargoBridge dashboard remains the private workspace. The only product bridge is a **Login** link to the existing app login page. Do **not** design a public Sign Up flow on the marketing site.

**Primary conversion goals:** Request a Demo · Contact Sales · (secondary) Login for existing customers.

---

# 1. Brand Identity

## 1.1 Brand personality

CargoBridge is the **calm operations director** of China→Algeria trade: precise, bilingual, unflappable, allergic to chaos. It feels like a control tower—not a neon startup, not an old freight forwarder brochure.

Personality adjectives: **exact · bilingual · grounded · modern · accountable · operator-grade**.

## 1.2 Brand voice

- Speak **operator-to-operator**.  
- Name the mess specifically: Excel sheets, WhatsApp groups, missing invoices, FX mistakes, “where is the container?” calls.  
- Then introduce the system as the obvious next step.  
- Prefer concrete verbs: track, assign, reconcile, calculate, prove, hand off.  
- Forbidden clichés: “synergy,” “AI-powered,” “next-gen,” “revolutionize,” “seamless ecosystem,” “one-stop shop” without substance.

## 1.3 Emotional tone

Progression on every page: **recognition → relief → trust → urgency to talk to sales**.  
Never hype. Quiet confidence. Respect the visitor’s time and money (especially DZD budgets).

## 1.4 Core values

1. **Visibility** — Everyone who needs the truth can see the same status.  
2. **Accountability** — History keeps the receipt.  
3. **Bilingual professionalism** — Arabic and French are first-class, not afterthoughts.  
4. **Money accuracy** — Rates, payments, and margins are not casual.  
5. **Operational unity** — China office and Algeria office share one timeline.

## 1.5 Trust signals (use on site)

- Organization-scoped cloud workspaces (your company’s data stays in your company).  
- Audit / activity history as a product promise.  
- Pricing published in **DZD** for Algerian operators.  
- True AR/FR parity in UI chrome.  
- Clear “Login to your workspace” for existing customers (no fake “10,000 companies” claims unless later verified).  
- Demo-led sales (human qualification) rather than anonymous self-serve chaos.

## 1.6 Visual personality / design language

- Deep navy atmospheric voids (aligned with the product login aesthetic).  
- White/light gray content planes for readability.  
- Sky accent for primary actions (aligned with product CTAs).  
- Emerald for success / cleared / healthy.  
- Trade geometry: routes, containers, QR frames, status chips—not abstract purple blobs.  
- UI mock “glass cards” floating over maps to suggest the real product.  
- Density like Linear; trust typography like Stripe; dark hero atmosphere like Vercel; modular calm like Notion—filtered through logistics realism.

## 1.7 Feeling after 10 seconds

> “They built this for *my* import chaos—not a generic CRM with a ship icon stuck on.”

---

# 2. Customer Personas

## 2.1 Small Importer (1–5 people)

- **Who:** Owner-operator importing containers or air parcels from China for local wholesale/retail.  
- **Goals:** Survive cashflow; know what is in transit; avoid losing a payment or a document.  
- **Daily workflow:** WhatsApp with agent + supplier; Excel for stock/shipments; calculator app for DZD/CNY/USD; folders of PDFs.  
- **Frustrations:** “Which version of the Excel is true?” Status only exists in someone’s head.  
- **Business pains:** Delayed discovery of problems; double payments; customs surprises.  
- **Why CargoBridge:** Starter plan (70,000 DZD), up to 3 admin users; one place to see goods, suppliers, and money movement.  
- **Message that lands:** “Stop running the company from a chat thread.”

## 2.2 Medium Trading Company (5–25 people)

- **Who:** Structured trading firm with buyers in China and receivers/finance in Algeria.  
- **Goals:** Scale supplier count without hiring more ops firefighters; reduce China↔Algeria disputes.  
- **Daily workflow:** Split ownership of shipment statuses; PO emails; payment confirmations in chat; weekly reconciliation meetings.  
- **Frustrations:** “Algeria says arrived, China still shows in transit.” No shared timeline.  
- **Business pains:** Role confusion, duplicate work, margin leakage from FX and freight.  
- **Why CargoBridge:** Business plan (99,000 DZD), up to 10 users; shared history; roles/offices mentally map to real teams.  
- **Message that lands:** “China and Algeria finally share one timeline.”

## 2.3 Large Import Business

- **Who:** Multi-team importer/distributor with governance needs.  
- **Goals:** Control, auditability, standardized process across departments.  
- **Daily workflow:** Multiple tools, shadow spreadsheets, manager approvals via email.  
- **Frustrations:** No single source of truth; onboarding new staff is tribal knowledge.  
- **Business pains:** Compliance risk, disputes without evidence, slow month-end.  
- **Why CargoBridge:** Enterprise / Contact Sales—custom onboarding, volume, process fit.  
- **Message that lands:** “Your operating rules, our platform.”

## 2.4 Purchasing Manager

- **Who:** Owns supplier relationships, POs, and document completeness.  
- **Goals:** Clean PO pipeline; supplier truth; fewer missing invoices.  
- **Daily workflow:** Request quotes, open POs, chase docs, check balances.  
- **Frustrations:** Documents in email; balances in Excel; status in WhatsApp.  
- **Why CargoBridge:** Suppliers + Buying + Documents + Calculator in one loop.  
- **Message that lands:** “Every supplier, every PO, every document—one profile.”

## 2.5 Business Owner

- **Who:** Cares about margin, reputation, and sleep.  
- **Goals:** See risk early; know outstanding; trust that operations are controlled.  
- **Daily workflow:** Spot-checks, calls when something blows up, end-of-month panic.  
- **Frustrations:** Profit clarity arrives too late; arguments without audit trail.  
- **Why CargoBridge:** Dashboard pulse + history + money modules.  
- **Message that lands:** “When something changes, history keeps the receipt.”

---

# 3. Pain Points (detailed)

## 3.1 Managing suppliers in Excel

Multiple sheets, conflicting phone numbers, no single outstanding balance, categories reinvented monthly. Hiring someone means teaching your personal spreadsheet mythology.

## 3.2 Forgetting or double-paying suppliers

Payment confirmations live in WhatsApp voice notes. Finance and purchasing disagree. Outstanding balances are negotiated from memory.

## 3.3 Losing invoices, packing lists, bills of lading

PDFs in email, phone galleries, USB drives, and “the folder on Karim’s laptop.” Customs day becomes archaeology.

## 3.4 Currency conversion mistakes

Mental math between CNY, USD, EUR, and DZD. Freight, insurance, duty, agent commission added in different apps. Margin “looks fine” until it doesn’t.

## 3.5 Shipment delays discovered too late

Status updates arrive as informal messages. Nobody owns the delayed state. Customers and cash get stuck.

## 3.6 WhatsApp as the operating system

Critical decisions buried in scrollback. New staff cannot reconstruct why a shipment changed. No search that finance trusts.

## 3.7 No centralized documents

Templates reinvented per shipment. Reception and delivery paperwork inconsistent. Brand and compliance suffer.

## 3.8 Poor communication with agents

Agents are relationships without structure: passport, phone, reliability, assignment history—all tribal. When an agent is delayed, the shipment story is incomplete.

## 3.9 Difficulty calculating true cost and profit

Landed cost is a weekend project. Owners cannot answer “what did this container actually cost?” without a meeting.

## 3.10 No visibility into profits until month-end

Operational firefighting hides margin death by a thousand FX cuts and forgotten fees.

## 3.11 No business history / audit trail

Disputes become interpersonal. “Who changed the status?” has no answer. Training new employees means storytelling, not systems.

## 3.12 Scattered information & tool-switching tax

Dashboard in one place, payments in another, calculator elsewhere, tracking elsewhere. Context dies on every Alt-Tab.

## 3.13 China office vs Algeria office handoff fights

Two truths. Two Excels. One argument. The customer feels the gap as silence.

## 3.14 Language friction

Tools built English-only force teams to translate mental models. Arabic RTL and French operators deserve native product language.

## 3.15 Mobile gap

Warehouse and travel reality is phone-first. Desktop-only process means status updates wait until someone is back at a PC.

---

# 4. Solutions (business value, not feature labels)

| Pain | CargoBridge solution (value language) |
|------|----------------------------------------|
| Excel suppliers | Centralize every supplier, contact, category, outstanding balance, and buying history in one profile. |
| Forgotten payments | Record payment operations against suppliers and orders so balances move with reality—not with chat memory. |
| Lost documents | Keep invoices, packing lists, and operational documents with the supplier/shipment they belong to; reuse templates. |
| FX / cost mistakes | Use the Business Calculator to clarify rates and cost components before you commit. |
| Late delay discovery | Manage goods statuses in a shared lifecycle so delayed is a first-class state, visible to the team. |
| WhatsApp OS | Move operational truth into the workspace; use chat for conversation, not as the database of record. |
| Agent black box | Maintain agents as structured records and assign them to shipments with history. |
| No audit | Business History shows who did what—status changes and operational events leave a trail. |
| Tool switching | One workspace: goods, suppliers, agents, buying, payments, calculator, QR tracking, history. |
| China↔Algeria fights | One timeline both offices can trust; office context preserved without splitting into two products. |
| Language friction | Native Arabic and French product experience. |
| Mobile gap | Operate key flows from the phone—scan, check, update, follow up. |
| QR / customer visibility | Generate shipment QR codes; support tracking experiences without turning anonymous scanners into accountants. |
| Month-end blindness | Dashboard + reports surfaces turn daily ops into management visibility. |

**Copy rule:** Prefer “Centralize every supplier, payment, document, and buying history in one place” over “Supplier Module.”

---

# 5. Website Storytelling

The site is a guided journey, not a feature dump.

```text
Hero — “Operating system for China→Algeria import”
        ↓
Recognition — four pain tableaux (visitor sees themselves)
        ↓
Consequences — cash stuck, disputes, sleepless owners
        ↓
CargoBridge introduction — one workspace
        ↓
Solution pillars — See everything · Control money · Prove history
        ↓
Feature showcase — real modules with UI metaphors
        ↓
Business benefits — time, fewer disputes, bilingual teams, mobile
        ↓
Customer confidence — trust, security posture, DZD clarity
        ↓
Pricing teaser → full Pricing page
        ↓
FAQ — objections handled
        ↓
Final CTA — Request Demo + Login
```

**Emotional beats:** “That’s me” → “This is expensive” → “There is a system” → “It fits how we work” → “I know what it costs in DZD” → “I’ll talk to them.”

---

# 6. Complete Sitemap

| Route | Page | Purpose | Primary CTA |
|-------|------|---------|-------------|
| `/` | Home | Problem→solution narrative | Request Demo |
| `/features` | Features | Deep module gallery | Request Demo |
| `/pricing` | Pricing | DZD plans + comparison | Contact Sales / Demo |
| `/about` | About | Why this corridor; company posture | Request Demo |
| `/faq` | FAQ | Objections & education | Contact |
| `/contact` | Contact Sales / Demo | Lead capture | Submit |
| `/contact/success` | Success | Confirmation + next steps | Login / Home |
| `/privacy` | Privacy Policy | Legal trust | — |
| `/terms` | Terms of Service | Legal trust | — |
| `/404` | Not Found | Recovery | Home / Contact |

## 6.1 Global navigation

**Left/center:** Home · Features · Pricing · About · Contact  

**Right:**  
- Language toggle AR | FR  
- **Login** (ghost) → existing CargoBridge app login URL  
- **Request Demo** (primary) → `/contact?intent=demo`  

**Do not show:** Sign Up, Start Free Trial, Get Started (ambiguous).  

**Alternate header CTA on Pricing Enterprise band:** Contact Sales → `/contact?intent=sales`

## 6.2 Footer

Columns: Product (Features, Pricing) · Company (About, Contact, FAQ) · Legal (Privacy, Terms) · Workspace (Login). Short brand line: “The operating system for China→Algeria import businesses.” Language toggle repeated.

## 6.3 User journeys

**Journey A — New visitor → Demo**  
Home hero Demo → skim pains → Features deep-dive → Pricing → Contact (intent=demo) → Success.

**Journey B — Price-sensitive → Sales**  
Pricing → compare Starter/Business → Enterprise or Demo → Contact.

**Journey C — Existing customer**  
Any page → Login → leaves marketing site to app.

**Journey D — Skeptical ops manager**  
FAQ → Features (History, QR, Suppliers) → Contact Technical/Demo.

---

# 7. Homepage Blueprint

## H0 — Global Navigation

- **Purpose:** Orientation + conversion always available.  
- **Layout:** Sticky; frosted white on light sections; frosted navy on hero. Height ~72px desktop.  
- **Logo:** Wordmark “CargoBridge” + optional bridge/route mark.  
- **Buttons:** Login (ghost), Request Demo (solid sky).  
- **Animation:** Subtle backdrop blur; no jarring show/hide.  
- **Emotional impact:** Stable, premium, bilingual-ready.

## H1 — Hero

- **Purpose:** Say what it is, who it’s for, why it matters—in one viewport.  
- **Headline (AR):** نظام تشغيل الاستيراد من الصين إلى الجزائر  
- **Headline (FR):** Le système d’exploitation de l’import Chine → Algérie  
- **Subheadline:** Replace Excel, WhatsApp, and scattered tools with one workspace for goods, suppliers, agents, payments, and tracking.  
- **Primary CTA:** Request Demo  
- **Secondary CTA:** Login  
- **Layout:** Full-bleed dark hero; copy left (RTL: mirror); visual right/dominant background.  
- **Color:** Gradient `#0b1220 → #0f172a → #111827`; sky CTA `#0ea5e9`.  
- **Illustration:** Animated China→Algeria trade corridor; floating glass UI cards (Goods status chip, Supplier outstanding, QR frame).  
- **Animations:** SVG/route dash draw ~1.2s; cards stagger fade-up 80ms apart; gentle map glow. Honor reduced motion → static frame.  
- **Typography:** Display 56–72px desktop / 36–40 mobile; sub 18–20px muted.  
- **Spacing:** Min 100vh feel; content padded 24–80px.  
- **Emotional impact:** “Finally—someone named our corridor.”

## H2 — Problem recognition grid

- **Purpose:** Visitor self-identifies.  
- **Headline:** Your operation is running on hope.  
- **Sub:** Spreadsheets, chat threads, and PDFs are not a supply chain system.  
- **Four cards:**  
  1. Losing track of shipments  
  2. Supplier management chaos  
  3. Currency & cost confusion  
  4. Document hunt  
- **Each card:** “Before” clutter visual → soft crossfade hint of organized UI.  
- **Layout:** 2×2 desktop; stacked mobile.  
- **Animation:** Scroll-triggered fade-up; optional before/after hover.  
- **Emotional impact:** Recognition without insult.

## H3 — Consequences band

- **Purpose:** Raise stakes.  
- **Headline:** Every missed status is cash stuck in the Mediterranean.  
- **Body:** Delays compound. Disputes multiply. Month-end becomes archaeology.  
- **Layout:** Full-width dark band; optional 3 stat callouts (qualitative, not fake metrics)—e.g. “One timeline,” “One supplier balance,” “One history.”  
- **Imagery:** Container yard dusk / sea corridor abstract.  
- **Emotional impact:** Productive urgency.

## H4 — Introduce CargoBridge

- **Purpose:** Name the solution after the problem is felt.  
- **Headline:** One workspace for the whole import loop.  
- **Sub:** Goods, suppliers, agents, buying, payments, calculator, QR tracking, and history—built for China↔Algeria teams.  
- **Layout:** Split — copy + large dashboard mock (goods list + status badges).  
- **CTA:** Explore Features  
- **Animation:** Mock UI subtle status chip pulse.  
- **Emotional impact:** Relief.

## H5 — Solution pillars

- **Three pillars:**  
  1. **See everything** — Shared shipment and partner truth.  
  2. **Control money** — Payments, balances, cost clarity.  
  3. **Prove history** — Audit trail for decisions and disputes.  
- **Layout:** Three equal columns; icon + title + 2 sentences.  
- **Color:** White section, navy icons, sky underline accents.

## H6 — Module showcase strip

- **Purpose:** Preview real modules; deep-link to Features.  
- **Cards:** Goods · Suppliers · Agents · Scanner/QR · Calculator · History  
- **Layout:** Horizontal scroll on mobile; 3×2 or marquee on desktop.  
- **Animation:** Slow marquee optional; pause on hover.  
- **Emotional impact:** “This is a real product surface.”

## H7 — Business benefits

- **Headline:** What changes when the truth has a home  
- **Bullets with icons:** Fewer status disputes · Faster payment clarity · Bilingual teams unblocked · Mobile ops for people on the move · Onboarding that isn’t folklore  
- **Layout:** Two-column benefits + phone mock.

## H8 — Pricing teaser

- **Headline:** Clear pricing in Algerian Dinar  
- **Three mini cards:** 70,000 DZD · 99,000 DZD · Contact Sales  
- **Trust line:** No surprise USD list prices for operators who budget in DZD.  
- **CTA:** See full pricing  

## H9 — FAQ (home subset, 6 items)

Accordion; see Section 18 for copy seeds. CTA under: Still questions? Contact us.

## H10 — Closing CTA

- **Headline:** See your workflow in CargoBridge—not a generic slideshow.  
- **Buttons:** Request Demo (primary) · Login (secondary)  
- **Background:** Navy with soft sky radials.

## H11 — Footer

As sitemap footer.

**Global homepage spacing:** 96–128px section padding desktop; 48–64px mobile. Max content width ~1120–1200px.

---

# 8. Features Page

**Page hero:** “Every module exists because import work breaks in predictable ways.”  
CTA: Request Demo.

For each feature block use identical structure: **Problem → Solution → Business value → Illustration concept → Suggested screenshot → Suggested animation**.

## 8.1 Dashboard

- **Problem:** Owners and managers only hear about fires.  
- **Solution:** An operations pulse across goods, partners, and work needing attention.  
- **Value:** Start the day from reality, not inbox anxiety.  
- **Illustration:** Calm command center overlooking a stylized port.  
- **Screenshot:** Dashboard cards/stats (genericized demo data).  
- **Animation:** Numbers ease in on scroll.

## 8.2 Goods Management

- **Problem:** Shipment state lives in chats.  
- **Solution:** Goods records with lifecycle statuses (from draft through transit to delivered), priorities, transport type, assignments.  
- **Value:** Everyone names the same status.  
- **Illustration:** Container with status chip row.  
- **Screenshot:** Goods list + detail with status badges.  
- **Animation:** Status chip morph draft→in_transit→arrived (tasteful, not childish).

## 8.3 QR Codes & Scanner

- **Problem:** Warehouse and partners lack a clean tracking entry point.  
- **Solution:** Generate QR for goods; scan in the field; public tracking experience for status visibility.  
- **Value:** Faster handoffs; fewer “send me the update” loops. Note in microcopy: public tracking emphasizes status—not dumping commercial secrets to strangers.  
- **Illustration:** Phone scanning QR on a crate.  
- **Screenshot:** Scanner view + track page metaphor.  
- **Animation:** Scan line once; QR sharpness focus.

## 8.4 Suppliers

- **Problem:** Supplier truth is fragmented.  
- **Solution:** Supplier profiles with contacts, categories, documents, communications, tasks, ratings, outstanding.  
- **Value:** One place to prepare a buying or payment decision.  
- **Illustration:** Rolodex dissolving into a clean profile card.  
- **Screenshot:** Supplier profile header + outstanding.  
- **Animation:** Card stack consolidating into one.

## 8.5 Buying Operations (Purchase Orders)

- **Problem:** PO state unclear; lines live in email drafts.  
- **Solution:** Purchase order pipeline tied to suppliers and amounts.  
- **Value:** Buying becomes a tracked process, not a thread.  
- **Illustration:** Clipboard → structured order.  
- **Screenshot:** PO list/detail.  
- **Animation:** Line items settle into table.

## 8.6 Payment Operations

- **Problem:** “Did we pay?” is a debate.  
- **Solution:** Payment records progressing against supplier reality.  
- **Value:** Cash outflows become auditable.  
- **Illustration:** Ledger with checkmark.  
- **Screenshot:** Payments list + status.  
- **Animation:** Progress bar to paid.

## 8.7 Agents

- **Problem:** Agents are informal relationships until something goes wrong.  
- **Solution:** Agent records, assignment to goods, operational context.  
- **Value:** Accountability travels with the person moving cargo.  
- **Illustration:** Travel document + route pin.  
- **Screenshot:** Agent profile + linked shipments metaphor.  
- **Animation:** Pin drops on corridor map.

## 8.8 Business Calculator

- **Problem:** Cost math is improvised.  
- **Solution:** Calculator workflows for exchange and cost clarity.  
- **Value:** Commit with eyes open.  
- **Illustration:** Clean calculator UI over currency glyphs (DZD emphasis).  
- **Screenshot:** Calculator screen.  
- **Animation:** Figures tick then settle.

## 8.9 Documents & Templates

- **Problem:** Every shipment reinvents paperwork.  
- **Solution:** Document storage patterns + reception/delivery/supplier templates.  
- **Value:** Consistency under pressure.  
- **Illustration:** Messy papers → labeled templates.  
- **Screenshot:** Templates manager metaphor.  
- **Animation:** Papers align into grid.

## 8.10 Audit History

- **Problem:** No evidence trail.  
- **Solution:** Business activity / history timeline.  
- **Value:** Disputes get facts; training gets examples.  
- **Illustration:** Timeline ribbon.  
- **Screenshot:** History list with actor + action.  
- **Animation:** Timeline draw top→bottom.

## 8.11 Reports / Analytics

- **Problem:** Decisions from anecdotes.  
- **Solution:** Analytics/report surfaces fed by operational data.  
- **Value:** Management without stalking WhatsApp.  
- **Illustration:** Soft chart shapes (not fake exact KPIs).  
- **Screenshot:** Charts composition.  
- **Animation:** Bars rise once.

## 8.12 Multi-language & Mobile

- **Problem:** English-only tools; desktop-only habits.  
- **Solution:** AR/FR product language; mobile-capable ops.  
- **Value:** Whole team included; warehouse included.  
- **Illustration:** Side-by-side AR/FR UI; phone mock.  
- **Animation:** Language toggle morph RTL↔LTR.

**Feature page anchors:** `#dashboard` `#goods` `#qr` `#suppliers` `#buying` `#payments` `#agents` `#calculator` `#documents` `#history` `#reports` `#mobile`

---

# 9. Pricing Page

## 9.1 Hero

- **Headline:** Simple plans. Algerian Dinar. Built for operators.  
- **Sub:** Choose the workspace size that matches your team—then see CargoBridge with a demo.  
- **Trust line:** Prices in DZD for Algerian operators—no hidden USD conversion games.

## 9.2 Plans

### Starter — **70,000 DZD**

- **Includes:** Up to **3 Admin Users**  
- **Ideal for:** Small import businesses / owner-operators  
- **Framing:** “Stop running the company from a chat thread.”  
- **CTA:** Request Demo  

### Business — **99,000 DZD**

- **Includes:** Up to **10 Users**  
- **Ideal for:** Growing import companies with China + Algeria coordination  
- **Framing:** “China and Algeria finally share one timeline.”  
- **CTA:** Request Demo  
- **Visual treatment:** Recommended “Most chosen for teams” badge (sky outline)—not gimmicky.

### Enterprise — **Custom pricing**

- **Display:** Contact Sales for a Custom Quote  
- **Ideal for:** Large businesses, custom requirements, governance-heavy ops  
- **Framing:** “Your operating rules, our platform.”  
- **CTA:** Contact Sales  

## 9.3 Comparison table (suggested rows)

Users · Goods & tracking · Suppliers & buying · Payments · Agents · QR/Scanner · Calculator · History/Audit · Templates · Onboarding support · Priority support  

Starter/Business: core platform checkmarks; Enterprise: custom + dedicated onboarding language.

## 9.4 FAQ strip on pricing

Billing contact, what’s included in demo, how seats work at high level, Enterprise path.

## 9.5 Layout & motion

Three pricing cards centered; Enterprise visually distinct (navy card, white type). Price typography tabular/mono lining figures: `70,000 DZD`. Cards lift 4px on hover desktop.

---

# 10. Contact Sales / Request Demo

## 10.1 Page purpose

Single funnel for demo requests, sales, enterprise quotes, technical questions, partnerships, general inquiries.

## 10.2 Layout

**Desktop:** Two columns — form (60%) + trust panel (40%).  
**Mobile:** Trust summary compact on top; form full width; sticky submit.

## 10.3 Intent selector (required)

Chips: Request Demo · Contact Sales · Technical Questions · Partnership · General Inquiry  
Pre-fill from query `?intent=demo|sales|technical|partnership|general`.

## 10.4 Form fields

| Field | Required | Notes |
|-------|----------|-------|
| Full name | Yes | |
| Company name | Yes | |
| Work email | Yes | |
| Phone | No | Strongly recommended |
| City / Country | No | Default hint Algeria |
| Company size | No | 1–5 / 6–25 / 26–100 / 100+ |
| Intent | Yes | From chips |
| Message | Yes | Placeholder guides: “Tell us how you import today…” |
| Preferred language | Yes | AR / FR |
| Consent | Yes | Contact about this request |

Submit CTA label: **Send request**  
Microcopy under button: Existing customer? **Login** to your workspace.

## 10.5 Trust panel content

- Response expectation (e.g. “We respond within 1 business day”—adjust to real SLA when known).  
- What a demo covers: your goods/supplier workflow, not a random feature tour.  
- Security one-liner: organization-scoped cloud workspaces.  
- Secondary: Contact Sales for Enterprise.  
- Optional: office / phone / email placeholders marked **[TO CONFIRM]** until real company details exist.

## 10.6 Success page (`/contact/success`)

- Headline: Request received.  
- Body: What happens next (review → schedule demo / sales call).  
- CTAs: Back to Home · Login (if already a customer).  
- Tone: calm confirmation, not confetti explosion.

---

# 11. Animation Specification

| Animation | Where | Why it exists | Constraint |
|-----------|-------|---------------|------------|
| Route path draw | Hero | Embodies China→Algeria promise | ≤1.5s; once |
| Stagger fade-up | Section enters | Guides reading order | 40–80ms stagger |
| Card hover lift | Feature/pricing cards | Affordance | 4px; desktop only |
| Counter ease | Stats | Credibility without shouting | Prefer qualitative if metrics unproven |
| Accordion height | FAQ | Clarity | Smooth 200–250ms |
| Page fade | Route change | Continuity | ~150ms |
| Status chip pulse | Product mocks | Suggests live ops | Subtle opacity |
| Language toggle morph | Header | Shows AR/FR seriousness | Layout reflow polished |
| Marquee pause-on-hover | Module strip | Browse without nausea | Slow |
| Button press micro | All CTAs | Tactile quality | 100ms |

**Avoid:** Scroll-jacking; heavy parallax on mobile; autoplay sound; endless Lottie spam; motion that blocks content.

**Reduced motion:** Static hero frame; opacity-only transitions; no path draw.

---

# 12. Visual Assets (AI generation list)

| # | Asset | Style notes | Placement |
|---|-------|-------------|-----------|
| 1 | China→Algeria trade corridor map | Dark navy, luminous route, minimal labels | Home hero |
| 2 | Chaos collage (Excel/WhatsApp/sticky notes) | Slightly desaturated, frustrating but tasteful | Home pain section |
| 3 | Clean goods dashboard UI mock | Match sky accents, status chips | Home intro + Features goods |
| 4 | Container yard at dusk | Cinematic, not clipart | Consequences / About |
| 5 | Supplier profile UI mock | Outstanding balance visible | Features suppliers |
| 6 | Agent metaphor (document + phone + route pin) | Respectful, professional | Features agents |
| 7 | QR on crate + phone scan | Realistic warehouse lighting | Features QR |
| 8 | Calculator / margin UI | DZD emphasis | Features calculator |
| 9 | Documents: messy → organized | Before/after diptych | Features documents |
| 10 | Audit timeline ribbon | Abstract but readable | Features history |
| 11 | Phone mock with app chrome | Bottom tabs metaphor OK | Mobile section |
| 12 | Navy mesh/radial gradients | Reusable backgrounds | Global |
| 13 | Pricing vignettes (shop / office / HQ) | One per plan mood | Pricing cards |
| 14 | About: bilingual team silhouettes at screens | Inclusive, non-stereotyped | About |
| 15 | 404 empty dock / missing container gentle humor | Premium wry, not meme | 404 |

**Art direction:** Photoreal-soft or high-end 3D; consistent color grade with navy/sky; no cartoon ships; no generic purple meshes; UI mocks should resemble CargoBridge language (sky buttons, slate dark hero affinity).

---

# 13. Color System

| Token | Hex | Why |
|-------|-----|-----|
| Navy-950 | `#0b1220` | Hero void; matches product login atmosphere |
| Navy-900 | `#0f172a` | Dark sections |
| Navy-800 | `#111827` | Gradient end |
| Sky-500 | `#0ea5e9` | Primary CTA / focus — product alignment |
| Sky-400 | `#38bdf8` | Hover/lighter accents |
| Blue-600 | `#2563eb` | Secondary accent / charts |
| Emerald-500 | `#10b981` | Success, cleared, healthy balances |
| Amber-500 | `#f59e0b` | Warning, delayed |
| Rose-600 | `#e11d48` | Danger / destructive |
| Gray-50 | `#f9fafb` | App-like light background |
| Gray-100 | `#f3f4f6` | Cards subtle |
| Gray-500 | `#6b7280` | Muted text |
| Gray-900 | `#111827` | Primary text on light |
| White | `#ffffff` | Content planes |

**Gradients:** Radial sky at ~18–22% opacity on navy hero; never rainbow.  
**Surfaces:** Prefer flat + one soft shadow; avoid multi-layer neon glow.

---

# 14. Typography

## 14.1 Families

- **Arabic:** Cairo or IBM Plex Sans Arabic — bold for headlines, regular for body.  
- **French / Latin:** Geist, Satoshi, or similar premium grotesque — **avoid defaulting to Inter** as the “AI website” tell.  
- **Figures/prices:** Tabular lining numerals; mono or featured sans for `70,000 DZD`.

## 14.2 Hierarchy

| Role | Desktop | Mobile | Weight |
|------|---------|--------|--------|
| Display | 56–72 | 36–40 | Bold/Semibold |
| H1 | 40–48 | 32 | Semibold |
| H2 | 32–36 | 26 | Semibold |
| H3 | 24 | 20 | Semibold |
| Body | 18 / 28 lh | 16 / 26 | Regular |
| Small | 14 | 13 | Regular |
| Button | 14–16 | 14 | Semibold |

**RTL rules:** Mirror padding, icon positions, CTA order, and timelines. Never hard-lock left-only layouts.

---

# 15. Component Library

Design as Figma components with variants:

1. **Button** — primary / secondary / ghost / danger; sizes sm/md/lg; states hover/focus/disabled.  
2. **Badge** — status colors (success/warning/danger/info/neutral).  
3. **Nav** — desktop + mobile sheet.  
4. **Footer** — 4-column + compact.  
5. **Language toggle** — AR | FR.  
6. **Feature card** — icon, title, body, optional link.  
7. **Pain card** — before visual + title + body.  
8. **Pricing card** — plan, price, list, CTA, highlighted variant.  
9. **Stat** — label + value.  
10. **FAQ accordion** — collapsed/expanded.  
11. **Form field** — text, email, select, textarea, error, focus.  
12. **Intent chips** — selected/unselected.  
13. **CTA band** — navy + dual buttons.  
14. **Logo mark + wordmark**.  
15. **Dashboard fake-UI kit** — table row, status chip, sidebar mini, card metric (for mocks only).  
16. **Route map** — illustration component with path.  
17. **Testimonial slot** — optional; leave empty or use quote pattern **without inventing fake company logos**.  
18. **Comparison table**.  
19. **Timeline**.  
20. **Mobile sticky CTA bar**.

---

# 16. Mobile Experience

Not “shrunk desktop”—**touch-first redesign**:

- Single column everything.  
- Sticky bottom **Request Demo** on Home/Features/Pricing (dismissible optional).  
- Hero: static art + light pulse; no heavy path animation.  
- Pain cards: accordion or vertical stack with large tap targets (min 44px).  
- Module strip: horizontal snap scroll.  
- Pricing: stacked cards; Business badge still visible.  
- Contact: intent chips wrap; full-width inputs; submit thumb-zone.  
- Nav: hamburger → sheet with Login + Demo duplicated.  
- Language toggle inside sheet and footer.  
- Disable hover-only instructions; use tap states.  
- Reduce motion further on small screens if needed for performance.

---

# 17. SEO Strategy

## 17.1 Titles & metas (draft)

| Page | Title | Meta |
|------|-------|------|
| Home | CargoBridge \| Operating System for China→Algeria Import | Replace Excel and WhatsApp with one workspace for goods, suppliers, agents, payments, and tracking. |
| Features | CargoBridge Features \| Goods, Suppliers, QR, Calculator | Explore the modules importers use to run China↔Algeria operations in one system. |
| Pricing | Pricing in DZD \| CargoBridge | Starter 70,000 DZD · Business 99,000 DZD · Enterprise custom. Clear dinar pricing. |
| About | About CargoBridge | Built for import businesses operating between China and Algeria / North Africa. |
| FAQ | FAQ \| CargoBridge | Answers on demos, pricing, language, and how CargoBridge fits your workflow. |
| Contact | Request a Demo / Contact Sales \| CargoBridge | Talk to CargoBridge about a demo or enterprise plan. |

Provide FR and AR equivalents with the same intent; unique H1 per page.

## 17.2 Keywords (seeds)

import Chine Algérie, gestion importateurs Algérie, suivi marchandises import, gestion fournisseurs, bons de commande import, calcul coût de revient, QR tracking import, logiciel import export Algérie, China Algeria trading software (EN optional landing later).

## 17.3 Structure

- Semantic headings; FAQ schema on FAQ (+ home FAQ subset).  
- Internal links: Home ↔ Features anchors ↔ Pricing ↔ Contact.  
- Future landings: `/features/suppliers`, `/features/qr` using same design system.

---

# 18. Marketing Copy Bank

## 18.1 Hero

- **Sub:** One workspace for goods, suppliers, agents, payments, and tracking—built for China→Algeria trade.  
- **AR sub option:** مساحة عمل واحدةة للبضائع والموردين والوكلاء والمدفوعات والتتبع — مصمّمة لتجارة الصين ↔ الجزائر.

## 18.2 Pain

- If your shipment status lives in three chats and two spreadsheets, you don’t have a process—you have hope.  
- Your supplier balance shouldn’t depend on who remembered to update the Excel.

## 18.3 Value

- When Algeria marks arrived, China can see it. When you pay a supplier, the balance updates. When something changes, history keeps the receipt.  
- Move operational truth out of WhatsApp. Keep the conversation—lose the chaos.

## 18.4 Features intros

- **Goods:** Name the status once. Let the whole team reuse it.  
- **QR:** Give the crate a scannable identity.  
- **Suppliers:** Every supplier, every document, every outstanding—one profile.  
- **Calculator:** Do the math before the money moves.  
- **History:** Arguments end faster when the timeline is shared.

## 18.5 Pricing

- Clear DZD pricing for operators who don’t budget in Silicon Valley dollars.  
- Starter: Stop running the company from a chat thread.  
- Business: China and Algeria finally share one timeline.  
- Enterprise: Your operating rules, our platform.

## 18.6 CTAs

- **Demo:** See your workflow in CargoBridge—not a generic slideshow.  
- **Sales:** Tell us about volume, teams, and constraints—we’ll propose a fit.  
- **Login:** Already operating? Enter your workspace.

## 18.7 FAQ seeds (Q/A short)

1. **Is there a public sign-up?** No on the marketing site—request a demo and we’ll guide onboarding.  
2. **What languages?** Arabic and French.  
3. **What currency is pricing?** Algerian Dinar (DZD).  
4. **Can existing customers log in?** Yes—use Login to open your workspace.  
5. **Do you replace WhatsApp entirely?** No—you replace WhatsApp as the *database of record*.  
6. **Is data separated by company?** Workspaces are organization-scoped.  
7. **What’s in a demo?** Your import loop: goods, suppliers, payments, tracking—mapped to CargoBridge.  
8. **Enterprise differences?** Custom quote, onboarding, and process fit via Contact Sales.

## 18.8 About posture

CargoBridge exists because China↔Algeria trade is a specific operational reality: two geographies, two languages, one cash cycle. Generic global “logistics SaaS” ignores that. We don’t.

## 18.9 Legal pages (tone)

Privacy/Terms: clear, serious, non-theatrical. Placeholder counsel-approved text marked **[LEGAL DRAFT]** until finalized.

---

# 19. Conversion Strategy

| CTA | Destination | Who it’s for | Why click |
|-----|-------------|--------------|-----------|
| Request Demo | `/contact?intent=demo` | New / evaluating | Qualified human walkthrough of *their* workflow |
| Contact Sales | `/contact?intent=sales` | Enterprise / custom | Pricing and process negotiation |
| Login | Existing app `/login` | Customers | Zero friction return to work |
| Explore Features | `/features` | Researchers | Education before sales call |
| See Pricing | `/pricing` | Budget holders | DZD clarity reduces fear |
| Send request | Form submit | Leads | Completes the loop |

**Strategy rules:**

- Marketing does **not** push public Sign Up (sales-led narrative).  
- Always offer Login for customers so they don’t fill demo forms angrily.  
- Demo copy promises workflow relevance, not a feature firehose.  
- Pricing CTAs still lead to conversation (no fake self-serve checkout required in this design phase).

**Lead flow:** Intent → form → success → sales follows up → demo → workspace provisioning (off-site process).

---

# 20. Final Creative Direction

## 20.1 North stars

- **Stripe** — typographic trust, restraint  
- **Linear** — precision, operational density  
- **Vercel** — dark atmospheric hero, product gravity  
- **Notion** — modular clarity  
- **Framer** — craft in motion (used sparingly)  
- **Apple / Arc / Raycast** — premium finish, not enterprise drab  

Filtered through **logistics realism** and **CargoBridge’s actual UI language**: sky CTAs, slate navy heroes, status chips, bilingual chrome.

## 20.2 Do

- Problem-first storytelling  
- Real module names from the product  
- DZD-only public pricing  
- AR/FR as equals  
- Login out to the real app  
- Motion with purpose  

## 20.3 Don’t

- Purple-on-white generic AI SaaS look  
- Warm cream + terracotta cliché  
- Fake customer logos/avatars  
- Public Sign Up button  
- USD pricing tables  
- Feature soup without pain context  
- Decorative animation that slows mobile  

## 20.4 Definition of done (design)

Figma file includes: foundation styles · full component set · all sitemap pages in AR and FR frames (or clear bilingual variants) · mobile + desktop · key interaction states (hover, accordion open, form error, success) · annotated Login external link · pricing cards exact DZD figures.

---

# 21. Figma Make — Master Prompt (paste first)

```text
Design a premium bilingual (Arabic RTL + French LTR) SaaS marketing website for CargoBridge.

CargoBridge is the operating system for businesses importing from China and operating in Algeria / North Africa. It replaces Excel, WhatsApp-as-database, sticky notes, and scattered calculators with one workspace: Goods, Suppliers, Agents, Buying (POs), Payments, Business Calculator, QR/Scanner tracking, Documents/Templates, Audit History, Reports, mobile-friendly ops, organization-scoped cloud security.

Visual system:
- Deep navy hero void (#0b1220 → #0f172a → #111827)
- Primary CTA sky (#0ea5e9)
- White/gray content planes, emerald success (#10b981), amber warning, rose danger
- Trade geometry (routes, containers, QR, status chips)—NOT generic purple gradients
- Quality bar: Stripe + Linear + Vercel + Notion, logistics-real

IA / pages: Home, Features, Pricing, About, FAQ, Contact, Contact Success, Privacy, Terms, 404.

Navigation: Home, Features, Pricing, About, Contact, Language toggle AR|FR, Login (ghost, external to app), Request Demo (primary). NO Sign Up button. Contact Sales used for Enterprise.

Pricing (DZD only):
- Starter 70,000 DZD — up to 3 Admin Users — small importers
- Business 99,000 DZD — up to 10 Users — growing teams
- Enterprise — Contact Sales for custom quote

Homepage story: Hero OS claim → pain recognition → consequences → product intro → three pillars (See everything / Control money / Prove history) → module strip → benefits → pricing teaser → FAQ → final Demo+Login CTA.

Motion: restrained route draw on hero, scroll fade-ups, card hover lifts, FAQ accordion; respect reduced motion; no scroll-jacking.

Output: complete desktop + mobile frames, reusable components (buttons, cards, pricing cards, FAQ, forms, nav, footer), bilingual-ready layouts.
```

---

# 22. Figma Make — Per-page generation prompts

## 22.1 Home

```text
Using the CargoBridge marketing design system, design the Home page desktop and mobile.
Hero: Arabic headline «نظام تشغيل الاستيراد من الصين إلى الجزائر» and French «Le système d’exploitation de l’import Chine → Algérie»; sub about replacing Excel/WhatsApp; CTAs Request Demo + Login; animated China→Algeria route on navy with floating glass UI cards (goods status, supplier outstanding, QR).
Then: 4 pain cards; dark consequences band; split product intro with goods dashboard mock; 3 pillars; module marquee (Goods, Suppliers, Agents, Scanner/QR, Calculator, History); benefits; pricing teaser 70k/99k/Custom DZD; FAQ accordion (6); closing CTA band; full footer.
```

## 22.2 Features

```text
Design Features page with hero and stacked module sections: Dashboard, Goods, QR&Scanner, Suppliers, Buying/POs, Payments, Agents, Calculator, Documents&Templates, Audit History, Reports, AR/FR+Mobile.
Each section: Problem, Solution, Business value, illustration, UI mock screenshot area, subtle animation note.
Include sticky subnav anchors. Primary CTA Request Demo. Desktop + mobile.
```

## 22.3 Pricing

```text
Design Pricing page in Algerian Dinar only.
Three cards: Starter 70,000 DZD (≤3 admin users), Business 99,000 DZD (≤10 users, highlighted), Enterprise Contact Sales custom quote.
Include comparison table, trust line about DZD pricing, FAQ strip, CTAs to Request Demo / Contact Sales.
Desktop + mobile stacked cards.
```

## 22.4 About

```text
Design About page: why China↔Algeria corridor focus; bilingual professionalism; values Visibility, Accountability, Money accuracy, Operational unity.
Imagery: container yard / bilingual ops. CTA Request Demo. Desktop + mobile.
```

## 22.5 FAQ

```text
Design FAQ page with categorized accordion: Product, Pricing, Security/Workspace, Demo&Sales, Language.
Include CTA Contact. Desktop + mobile.
```

## 22.6 Contact

```text
Design Contact page with intent chips (Request Demo, Contact Sales, Technical, Partnership, General).
Form fields: name, company, email, phone, city/country, company size, intent, message, preferred language AR/FR, consent.
Layout: form + trust panel (response SLA, security one-liner, Login link for customers).
Also design /contact/success confirmation page. Desktop + mobile.
```

## 22.7 Legal + utility

```text
Design Privacy Policy and Terms of Service pages: clean typographic legal layout, navy header, footer, bilingual-ready.
Design 404: premium wry “missing container” visual, buttons Home and Contact.
```

## 22.8 Components only (if generating separately)

```text
Build CargoBridge marketing component library: Nav, Footer, Button variants, Badges, Feature/Pain/Pricing cards, Stat, FAQ accordion, Form fields, Intent chips, CTA band, Language toggle, Fake dashboard UI kit, Route map illustration, Mobile sticky Demo bar.
Use sky #0ea5e9 primary, navy dark surfaces, emerald success. Include hover/focus/disabled states.
```

---

# 23. Integration with existing CargoBridge application (non-code)

| Concern | Rule |
|---------|------|
| Dashboard routes | Untouched |
| Auth logic / APIs | Untouched by marketing design |
| Login | Hyperlink to production (or staging) app `/login` |
| Public Sign Up on marketing | Not presented—even if the app supports registration |
| Lead capture | Designed as form UX; implementation tooling chosen later |
| Brand continuity | Sky/navy language so Login feels like entering the same ecosystem |

---

# 24. Open placeholders (do not invent silently)

Mark in designs until real data provided:

- **[TO CONFIRM]** Company support email  
- **[TO CONFIRM]** Phone  
- **[TO CONFIRM]** Office address / map  
- **[TO CONFIRM]** Exact demo SLA wording  
- **[LEGAL DRAFT]** Privacy & Terms body copy  
- **[TO CONFIRM]** Final production Login URL  

---

**End of Product Design Specification**  
This document is the single source of truth for designing the CargoBridge marketing website in Figma Make.
