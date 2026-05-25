#!/usr/bin/env node
// Run: node scripts/seed.js
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "blog.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const adminHash = bcrypt.hashSync("admin123", 10);
const adminId = "admin-user-001";

const posts = [
  {
    id: "post-001",
    title: "The Complete Frontend Roadmap for 2025: From Zero to Job-Ready",
    slug: "complete-frontend-roadmap-2025",
    excerpt: "A step-by-step guide to becoming a frontend developer in today's competitive market — covering HTML, CSS, JavaScript, React, and beyond.",
    content: `# The Complete Frontend Roadmap for 2025

The tech industry is evolving faster than ever, and frontend development remains one of the most in-demand skills globally. Whether you're starting from scratch or looking to upgrade your skills, this guide covers everything you need.

## Where to Begin: The Fundamentals

Every great frontend developer starts with the same foundation: **HTML, CSS, and JavaScript**. These are not optional prerequisites — they are the bedrock of everything you will build.

### HTML & CSS (Weeks 1–3)

Start with semantic HTML. Learn the difference between \`<div>\` and \`<section>\`, understand accessibility with ARIA roles, and build forms that actually work.

For CSS, go beyond basics. Master Flexbox, Grid, custom properties (CSS variables), and responsive design. Mobile-first is not a trend; it's the standard.

> "The best frontend developers I've hired could build any layout from scratch without a framework." — Senior Engineering Manager, Lagos

### JavaScript (Weeks 4–8)

JavaScript is where frontend development truly begins. Focus on:

- DOM manipulation and events
- Asynchronous programming (Promises, async/await)
- Fetch API and working with REST APIs
- ES6+ syntax: arrow functions, destructuring, spread operators

## React: The Industry Standard

After mastering vanilla JavaScript, React is your logical next step. Used by companies like Meta, Airbnb, and hundreds of Nigerian startups, React dominates the job market.

Learn hooks (useState, useEffect, useContext), component composition, and state management. Then add Next.js for server-side rendering and full-stack capability.

## Tools Every Developer Needs

- **Git & GitHub** — version control is non-negotiable
- **VS Code** — with ESLint, Prettier, and GitLens
- **Chrome DevTools** — your debugging best friend
- **Figma** — to collaborate with designers

## Getting Your First Job

Build 3 portfolio projects that solve real problems. Contribute to open source. Network on Twitter/X and LinkedIn. And apply, apply, apply — rejection is part of the process.

The average time from zero to first job in Nigeria is 8–14 months of dedicated learning. You can do this.`,
    category: "frontend",
    tags: "html, css, javascript, react, career",
    coverImage: null,
    author: "UGET Editorial",
    authorId: adminId,
    published: true,
    featured: true,
    readTime: 8,
    views: 1240,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-002",
    title: "10 Figma Tricks Every UI Designer Should Know in 2025",
    slug: "figma-tricks-ui-designer-2025",
    excerpt: "Master these advanced Figma techniques to design faster, collaborate better, and impress your clients every time.",
    content: `# 10 Figma Tricks Every UI Designer Should Know in 2025

Figma has become the undisputed standard for UI design, but most designers only use 20% of its features. Here are 10 tricks that will transform your workflow.

## 1. Auto Layout Is Your Best Friend

Stop manually resizing frames. Auto Layout lets your designs grow and shrink dynamically. Set it on any frame and watch your components become truly responsive.

## 2. Component Properties

With component properties, you can expose specific values (like text, icons, or visibility) directly in the properties panel. Create one button component that handles all states.

## 3. Variables for Design Tokens

Figma Variables let you create a single source of truth for colors, spacing, and typography. Change one value and watch it update everywhere.

## 4. Advanced Prototyping with Variables

Boolean and number variables unlock conditional logic in your prototypes. Build interactive flows that feel like real apps.

## 5. Batch Export with Plugins

The Batch Export plugin can export hundreds of assets in one click, organized exactly how your developer needs them.

> Save 2+ hours per project with these five tricks alone.

## 6. Community Resources

The Figma Community has thousands of free UI kits, icon sets, and templates. Never start from zero.

## 7. Dev Mode

Share designs with developers using Dev Mode — they can inspect every value, copy CSS, and download assets without touching your file.

## 8. Keyboard Shortcuts

Press Ctrl+/ to search for any action. Learn 10 shortcuts per week until they're muscle memory.

## 9. Branching for Teams

For large projects, use Figma branching like Git branches. Propose changes without affecting the main file.

## 10. AI-Powered Features

Figma AI (still rolling out) can auto-rename layers, generate copy, and even suggest layout improvements.

Master these tools and you'll consistently deliver better work in less time.`,
    category: "uiux",
    tags: "figma, design, ui, ux, tools",
    coverImage: null,
    author: "Amara Johnson",
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 6,
    views: 847,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-003",
    title: "How Hackers Think: A Beginner's Guide to Ethical Hacking",
    slug: "hackers-think-ethical-hacking-beginners",
    excerpt: "Understanding the attacker's mindset is the first step to building impenetrable systems. Here's where to start.",
    content: `# How Hackers Think: A Beginner's Guide to Ethical Hacking

Cybersecurity is one of the fastest-growing career fields in Nigeria and globally. But before you can defend systems, you need to understand how they're attacked.

## The Attacker's Mindset

Hackers — both malicious and ethical — think in terms of **attack surfaces**. Every input, every connection, every piece of exposed software is a potential entry point.

They ask: "What happens if I send unexpected input here?" or "Is this service running an outdated version with known vulnerabilities?"

## The Five Phases of Hacking

### 1. Reconnaissance
Passive information gathering: WHOIS lookups, Google dorking, LinkedIn profiles. No direct contact with the target.

### 2. Scanning
Active probing: port scanning with \`nmap\`, vulnerability scanning with \`nessus\`, identifying open services.

### 3. Exploitation
Using the vulnerabilities found to gain unauthorized access. Tools like Metasploit automate many exploits.

### 4. Post-Exploitation
Maintaining access, escalating privileges, and moving laterally through the network.

### 5. Covering Tracks
Clearing logs and hiding evidence of intrusion.

## Getting Started Legally

> **Important**: Only practice on systems you own or have explicit permission to test. Unauthorized hacking is illegal everywhere.

Set up a home lab with **Kali Linux** and vulnerable virtual machines like **DVWA** (Damn Vulnerable Web App) or **VulnHub** machines.

## Certifications to Pursue

- **CompTIA Security+** — entry-level baseline
- **CEH (Certified Ethical Hacker)** — industry recognized
- **OSCP (Offensive Security Certified Professional)** — the gold standard

Start with Security+ and work your way up. The cybersecurity field in Nigeria is desperate for skilled professionals — this could be your breakthrough.`,
    category: "cybersecurity",
    tags: "hacking, security, ethical hacking, career, cybersecurity",
    coverImage: null,
    author: "Kelechi Obi",
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 9,
    views: 623,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-004",
    title: "ChatGPT vs Claude vs Gemini: Which AI Should You Use for Coding?",
    slug: "chatgpt-vs-claude-vs-gemini-coding",
    excerpt: "We tested all three major AI assistants on 20 real-world coding tasks. Here are the surprising results.",
    content: `# ChatGPT vs Claude vs Gemini: Which AI Should You Use for Coding?

AI coding assistants have gone from novelty to necessity. But which one should you actually use for day-to-day development? We ran 20 real coding tasks across all three and the results were eye-opening.

## The Test Setup

We tested each AI on:
- Debugging complex React components
- Writing and optimizing SQL queries
- Explaining legacy code
- Building REST API endpoints
- Writing unit tests

## Claude (Anthropic)

Claude consistently produced the most thorough explanations. For debugging tasks, it didn't just fix the bug — it explained *why* the bug existed and how to prevent similar issues.

**Best for**: Code explanation, architecture decisions, writing clean readable code.

> Claude's context window and ability to hold long conversations made it exceptional for refactoring large codebases.

## ChatGPT (OpenAI)

GPT-4o was the most versatile. It handles ambiguous prompts well and has the largest ecosystem of integrations.

**Best for**: Quick answers, code snippets, broad language support.

## Gemini (Google)

Gemini 1.5 Pro's massive context window (1M tokens) was genuinely impressive for working with large files. Its integration with Google Workspace is unique.

**Best for**: Processing large codebases, Google Cloud development.

## Our Verdict

For most developers, **Claude** wins on code quality and explanation depth. **ChatGPT** wins on versatility. **Gemini** wins on context size.

Use all three. They're complementary tools, not competitors.`,
    category: "ai",
    tags: "ai, chatgpt, claude, gemini, tools, coding",
    coverImage: null,
    author: "UGET Editorial",
    authorId: adminId,
    published: true,
    featured: true,
    readTime: 11,
    views: 2103,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-005",
    title: "How to Land Your First Tech Job with No Experience",
    slug: "land-first-tech-job-no-experience",
    excerpt: "A practical, no-BS guide to breaking into tech in Nigeria and beyond — portfolio tips, networking, and more.",
    content: `# How to Land Your First Tech Job with No Experience

Everyone says "just build projects" but nobody tells you what projects, how to present them, or how to actually get in front of hiring managers. Let's fix that.

## The Brutal Truth

Most job descriptions are wish lists. The company wants a unicorn but will hire someone who can solve their problems. Your job is to show you can solve those specific problems.

## Build the Right Projects

Don't build yet another to-do app. Build things that companies actually use:

- **Clone a real product** — rebuild Paystack's checkout page, or a simplified version of Notion
- **Solve a local problem** — an app for tracking market prices in Lagos, a tool for small business invoicing
- **Contribute to open source** — even documentation improvements count

## Make Your GitHub Shine

Recruiters will check your GitHub. Every repository should have:
- A clear README with a live demo link
- Screenshots or a video walkthrough
- Clean commit history (no "asdfg" commits)

## The Nigerian Tech Community

- **Twitter/X** — follow and engage with Nigerian tech Twitter
- **Andela Alumni Community**
- **HNG Internship** — free, remote, and brutal in the best way
- **Ingressive for Good** — scholarships and training

## Applying Strategically

Apply to 5 positions per day. Customize each application. Your cover letter should say: "I saw you're using X technology, I built Y which solves the same problem, here's the link."

Response rates increase 40% when you reference something specific about the company.

## The Salary Conversation

Know your worth. Junior frontend developers in Lagos earn ₦150,000–₦350,000/month. Remote opportunities from international companies pay significantly more in USD.

Never accept the first offer. Negotiate every time.`,
    category: "career",
    tags: "career, jobs, nigeria, portfolio, job search",
    coverImage: null,
    author: "Fatima Bello",
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 10,
    views: 1876,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-006",
    title: "Build a Full-Stack App with Next.js 15 & Supabase in One Weekend",
    slug: "nextjs-15-supabase-fullstack-weekend",
    excerpt: "From zero to deployed in one weekend. This step-by-step tutorial covers auth, database, and hosting.",
    content: `# Build a Full-Stack App with Next.js 15 & Supabase in One Weekend

Next.js 15 and Supabase are the perfect combination for shipping fast. By the end of this tutorial, you'll have a deployed, full-stack web app with authentication and a real database.

## What We're Building

A task management app with:
- User authentication (email + OAuth)
- Real-time task list per user
- Deployed on Vercel + Supabase free tier

## Setup (30 minutes)

\`\`\`bash
npx create-next-app@latest my-app --typescript --tailwind
cd my-app
npm install @supabase/supabase-js @supabase/ssr
\`\`\`

Create a Supabase project at supabase.com (free tier is generous). Copy your URL and anon key.

## Database Schema

In the Supabase SQL editor, run:

\`\`\`sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table tasks enable row level security;
create policy "Users can only see own tasks" on tasks
  for all using (auth.uid() = user_id);
\`\`\`

## Authentication

Supabase handles auth beautifully. With the SSR package, session management works seamlessly with Next.js Server Components.

## Deployment

Push to GitHub, connect to Vercel, add your environment variables, and deploy. The whole process takes under 10 minutes.

## What to Build Next

- Add due dates and priority levels
- Email reminders via Supabase Edge Functions
- Share tasks between team members

The stack you just learned — Next.js + Supabase + Vercel — is production-ready and used by thousands of companies. Master it and you'll build faster than most senior engineers.`,
    category: "tutorials",
    tags: "nextjs, supabase, fullstack, tutorial, react",
    coverImage: null,
    author: "Samuel Eze",
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 14,
    views: 734,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const db = {
  users: [
    {
      id: adminId,
      name: "UGET Admin",
      email: "admin@uget.com",
      password: adminHash,
      role: "admin",
      avatar: null,
      createdAt: new Date().toISOString(),
    },
  ],
  posts,
};

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log("✅ Database seeded!");
console.log("   Admin: admin@uget.com / admin123");
console.log(`   ${posts.length} posts created`);
