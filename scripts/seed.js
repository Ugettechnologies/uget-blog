#!/usr/bin/env node
// Run: node scripts/seed.js

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

// 1. Load env vars from .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Error: DATABASE_URL or NEON_DATABASE_URL is not set in .env.local");
  console.log("Please define DATABASE_URL in your .env.local file first.");
  process.exit(1);
}

// Initialize pg Pool and sql helper function
const isNeon = dbUrl.includes("neon.tech") || dbUrl.includes("neon.run");
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isNeon ? { rejectUnauthorized: false } : false
});

const sql = async (queryText, params = []) => {
  const result = await pool.query(queryText, params);
  return result.rows;
};

const adminHash = bcrypt.hashSync("admin123", 10);
const adminId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // A valid UUID

const posts = [
  {
    id: "e067c29e-2fc9-4fa2-9d89-cb6a74c43a41",
    title: "The Complete Frontend Roadmap for 2025: From Zero to Job-Ready",
    slug: "complete-frontend-roadmap-2025",
    excerpt: "A step-by-step guide to becoming a frontend developer in today's competitive market — covering HTML, CSS, JavaScript, React, and beyond.",
    content: `<h1>The Complete Frontend Roadmap for 2025</h1><p>The tech industry is evolving faster than ever, and frontend development remains one of the most in-demand skills globally. Whether you're starting from scratch or looking to upgrade your skills, this guide covers everything you need.</p><h2>Where to Begin: The Fundamentals</h2><p>Every great frontend developer starts with the same foundation: <strong>HTML, CSS, and JavaScript</strong>. These are not optional prerequisites — they are the bedrock of everything you will build.</p><h3>HTML & CSS (Weeks 1–3)</h3><p>Start with semantic HTML. Learn the difference between <code>&lt;div&gt;</code> and <code>&lt;section&gt;</code>, understand accessibility with ARIA roles, and build forms that actually work.</p><p>For CSS, go beyond basics. Master Flexbox, Grid, custom properties (CSS variables), and responsive design. Mobile-first is not a trend; it's the standard.</p><blockquote>"The best frontend developers I've hired could build any layout from scratch without a framework." — Senior Engineering Manager, Lagos</blockquote><h3>JavaScript (Weeks 4–8)</h3><p>JavaScript is where frontend development truly begins. Focus on:</p><ul><li>DOM manipulation and events</li><li>Asynchronous programming (Promises, async/await)</li><li>Fetch API and working with REST APIs</li><li>ES6+ syntax: arrow functions, destructuring, spread operators</li></ul><h2>React: The Industry Standard</h2><p>After mastering vanilla JavaScript, React is your logical next step. Used by companies like Meta, Airbnb, and hundreds of Nigerian startups, React dominates the job market.</p><p>Learn hooks (useState, useEffect, useContext), component composition, and state management. Then add Next.js for server-side rendering and full-stack capability.</p><h2>Tools Every Developer Needs</h2><ul><li><strong>Git & GitHub</strong> — version control is non-negotiable</li><li><strong>VS Code</strong> — with ESLint, Prettier, and GitLens</li><li><strong>Chrome DevTools</strong> — your debugging best friend</li><li><strong>Figma</strong> — to collaborate with designers</li></ul><h2>Getting Your First Job</h2><p>Build 3 portfolio projects that solve real problems. Contribute to open source. Network on Twitter/X and LinkedIn. And apply, apply, apply — rejection is part of the process.</p><p>The average time from zero to first job in Nigeria is 8–14 months of dedicated learning. You can do this.</p>`,
    category: "frontend",
    tags: ["html", "css", "javascript", "react", "career"],
    coverImage: null,
    authorId: adminId,
    published: true,
    featured: true,
    readTime: 8,
    views: 1240,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b4fe90b4-3a95-46fd-8f19-33b8fbca0b42",
    title: "10 Figma Tricks Every UI Designer Should Know in 2025",
    slug: "figma-tricks-ui-designer-2025",
    excerpt: "Master these advanced Figma techniques to design faster, collaborate better, and impress your clients every time.",
    content: `<h1>10 Figma Tricks Every UI Designer Should Know in 2025</h1><p>Figma has become the undisputed standard for UI design, but most designers only use 20% of its features. Here are 10 tricks that will transform your workflow.</p><h2>1. Auto Layout Is Your Best Friend</h2><p>Stop manually resizing frames. Auto Layout lets your designs grow and shrink dynamically. Set it on any frame and watch your components become truly responsive.</p><h2>2. Component Properties</h2><p>With component properties, you can expose specific values (like text, icons, or visibility) directly in the properties panel. Create one button component that handles all states.</p><h2>3. Variables for Design Tokens</h2><p>Figma Variables let you create a single source of truth for colors, spacing, and typography. Change one value and watch it update everywhere.</p><h2>4. Advanced Prototyping with Variables</h2><p>Boolean and number variables unlock conditional logic in your prototypes. Build interactive flows that feel like real apps.</p><h2>5. Batch Export with Plugins</h2><p>The Batch Export plugin can export hundreds of assets in one click, organized exactly how your developer needs them.</p><blockquote>Save 2+ hours per project with these five tricks alone.</blockquote><h2>6. Community Resources</h2><p>The Figma Community has thousands of free UI kits, icon sets, and templates. Never start from zero.</p><h2>7. Dev Mode</h2><p>Share designs with developers using Dev Mode — they can inspect every value, copy CSS, and download assets without touching your file.</p><h2>8. Keyboard Shortcuts</h2><p>Press Ctrl+/ to search for any action. Learn 10 shortcuts per week until they're muscle memory.</p><h2>9. Branching for Teams</h2><p>For large projects, use Figma branching like Git branches. Propose changes without affecting the main file.</p><h2>10. AI-Powered Features</h2><p>Figma AI (still rolling out) can auto-rename layers, generate copy, and even suggest layout improvements.</p><p>Master these tools and you'll consistently deliver better work in less time.</p>`,
    category: "design",
    tags: ["figma", "design", "ui", "ux", "tools"],
    coverImage: null,
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 6,
    views: 847,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c8be3a25-c6ee-4dfc-bf62-ffb78e1201cc",
    title: "How Hackers Think: A Beginner's Guide to Ethical Hacking",
    slug: "hackers-think-ethical-hacking-beginners",
    excerpt: "Understanding the attacker's mindset is the first step to building impenetrable systems. Here's where to start.",
    content: `<h1>How Hackers Think: A Beginner's Guide to Ethical Hacking</h1><p>Cybersecurity is one of the fastest-growing career fields in Nigeria and globally. But before you can defend systems, you need to understand how they're attacked.</p><h2>The Attacker's Mindset</h2><p>Hackers — both malicious and ethical — think in terms of <strong>attack surfaces</strong>. Every input, every connection, every piece of exposed software is a potential entry point.</p><p>They ask: "What happens if I send unexpected input here?" or "Is this service running an outdated version with known vulnerabilities?"</p><h2>The Five Phases of Hacking</h2><h3>1. Reconnaissance</h3><p>Passive information gathering: WHOIS lookups, Google dorking, LinkedIn profiles. No direct contact with the target.</p><h3>2. Scanning</h3><p>Active probing: port scanning with <code>nmap</code>, vulnerability scanning with <code>nessus</code>, identifying open services.</p><h3>3. Exploitation</h3><p>Using the vulnerabilities found to gain unauthorized access. Tools like Metasploit automate many exploits.</p><h3>4. Post-Exploitation</h3><p>Maintaining access, escalating privileges, and moving laterally through the network.</p><h3>5. Covering Tracks</h3><p>Clearing logs and hiding evidence of intrusion.</p><h2>Getting Started Legally</h2><blockquote><strong>Important</strong>: Only practice on systems you own or have explicit permission to test. Unauthorized hacking is illegal everywhere.</blockquote><p>Set up a home lab with <strong>Kali Linux</strong> and vulnerable virtual machines like <strong>DVWA</strong> (Damn Vulnerable Web App) or <strong>VulnHub</strong> machines.</p><h2>Certifications to Pursue</h2><ul><li><strong>CompTIA Security+</strong> — entry-level baseline</li><li><strong>CEH (Certified Ethical Hacker)</strong> — industry recognized</li><li><strong>OSCP (Offensive Security Certified Professional)</strong> — the gold standard</li></ul><p>Start with Security+ and work your way up. The cybersecurity field in Nigeria is desperate for skilled professionals — this could be your breakthrough.</p>`,
    category: "cybersecurity",
    tags: ["hacking", "security", "ethical hacking", "career", "cybersecurity"],
    coverImage: null,
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 9,
    views: 623,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "a09df07f-cf33-4f11-9a74-4bcf42a0a20e",
    title: "ChatGPT vs Claude vs Gemini: Which AI Should You Use for Coding?",
    slug: "chatgpt-vs-claude-vs-gemini-coding",
    excerpt: "We tested all three major AI assistants on 20 real-world coding tasks. Here are the surprising results.",
    content: `<h1>ChatGPT vs Claude vs Gemini: Which AI Should You Use for Coding?</h1><p>AI coding assistants have gone from novelty to necessity. But which one should you actually use for day-to-day development? We ran 20 real coding tasks across all three and the results were eye-opening.</p><h2>The Test Setup</h2><p>We tested each AI on:</p><ul><li>Debugging complex React components</li><li>Writing and optimizing SQL queries</li><li>Explaining legacy code</li><li>Building REST API endpoints</li><li>Writing unit tests</li></ul><h2>Claude (Anthropic)</h2><p>Claude consistently produced the most thorough explanations. For debugging tasks, it didn't just fix the bug — it explained <em>why</em> the bug existed and how to prevent similar issues.</p><p><strong>Best for</strong>: Code explanation, architecture decisions, writing clean readable code.</p><blockquote>Claude's context window and ability to hold long conversations made it exceptional for refactoring large codebases.</blockquote><h2>ChatGPT (OpenAI)</h2><p>GPT-4o was the most versatile. It handles ambiguous prompts well and has the largest ecosystem of integrations.</p><p><strong>Best for</strong>: Quick answers, code snippets, broad language support.</p><h2>Gemini (Google)</h2><p>Gemini 1.5 Pro's massive context window (1M tokens) was genuinely impressive for working with large files. Its integration with Google Workspace is unique.</p><p><strong>Best for</strong>: Processing large codebases, Google Cloud development.</p><h2>Our Verdict</h2><p>For most developers, <strong>Claude</strong> wins on code quality and explanation depth. <strong>ChatGPT</strong> wins on versatility. <strong>Gemini</strong> wins on context size.</p><p>Use all three. They're complementary tools, not competitors.</p>`,
    category: "ai",
    tags: ["ai", "chatgpt", "claude", "gemini", "tools", "coding"],
    coverImage: null,
    authorId: adminId,
    published: true,
    featured: true,
    readTime: 11,
    views: 2103,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "f3be019e-e3dd-45fc-ae74-9fbdab1204d5",
    title: "How to Land Your First Tech Job with No Experience",
    slug: "land-first-tech-job-no-experience",
    excerpt: "A practical, no-BS guide to breaking into tech in Nigeria and beyond — portfolio tips, networking, and more.",
    content: `<h1>How to Land Your First Tech Job with No Experience</h1><p>Everyone says "just build projects" but nobody tells you what projects, how to present them, or how to actually get in front of hiring managers. Let's fix that.</p><h2>The Brutal Truth</h2><p>Most job descriptions are wish lists. The company wants a unicorn but will hire someone who can solve their problems. Your job is to show you can solve those specific problems.</p><h2>Build the Right Projects</h2><p>Don't build yet another to-do app. Build things that companies actually use:</p><ul><li><strong>Clone a real product</strong> — rebuild Paystack's checkout page, or a simplified version of Notion</li><li><strong>Solve a local problem</strong> — an app for tracking market prices in Lagos, a tool for small business invoicing</li><li><strong>Contribute to open source</strong> — even documentation improvements count</li></ul><h2>Make Your GitHub Shine</h2><p>Recruiters will check your GitHub. Every repository should have:</p><ul><li>A clear README with a live demo link</li><li>Screenshots or a video walkthrough</li><li>Clean commit history (no "asdfg" commits)</li></ul><h2>The Nigerian Tech Community</h2><ul><li><strong>Twitter/X</strong> — follow and engage with Nigerian tech Twitter</li><li><strong>Andela Alumni Community</strong></li><li><strong>HNG Internship</strong> — free, remote, and brutal in the best way</li><li><strong>Ingressive for Good</strong> — scholarships and training</li></ul><h2>Applying Strategically</h2><p>Apply to 5 positions per day. Customize each application. Your cover letter should say: "I saw you're using X technology, I built Y which solves the same problem, here's the link."</p><p>Response rates increase 40% when you reference something specific about the company.</p><h2>The Salary Conversation</h2><p>Know your worth. Junior frontend developers in Lagos earn ₦150,000–₦350,000/month. Remote opportunities from international companies pay significantly more in USD.</p><p>Never accept the first offer. Negotiate every time.</p>`,
    category: "career",
    tags: ["career", "jobs", "nigeria", "portfolio", "job search"],
    coverImage: null,
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 10,
    views: 1876,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d9fe029c-ef3e-46fc-bd8a-ffbcd1b203ee",
    title: "Build a Full-Stack App with Next.js 15 & Neon in One Weekend",
    slug: "nextjs-15-neon-fullstack-weekend",
    excerpt: "From zero to deployed in one weekend. This step-by-step tutorial covers auth, database, and hosting.",
    content: `<h1>Build a Full-Stack App with Next.js 15 & Neon in One Weekend</h1><p>Next.js 15 and Neon are the perfect combination for shipping fast. By the end of this tutorial, you'll have a deployed, full-stack web app with authentication and a real database.</p><h2>What We're Building</h2><p>A task management app with:</p><ul><li>User authentication (email + credentials)</li><li>Real-time task list per user</li><li>Deployed on Vercel + Neon free tier</li></ul><h2>Setup (30 minutes)</h2><pre><code>npx create-next-app@latest my-app --typescript --tailwind\ncd my-app\nnpm install @neondatabase/serverless bcryptjs jsonwebtoken</code></pre><p>Create a Neon project at neon.tech (free tier is generous). Copy your connection string URL.</p><h2>Database Schema</h2><p>In the Neon SQL editor, run:</p><pre><code>create table tasks (\n  id uuid primary key default gen_random_uuid(),\n  user_id uuid references public.users not null,\n  title text not null,\n  completed boolean default false,\n  created_at timestamptz default now()\n);</code></pre><h2>Authentication</h2><p>We handle credentials auth beautifully with JWT and secure cookies, fully serverless.</p><h2>Deployment</h2><p>Push to GitHub, connect to Vercel, add your environment variables, and deploy. The whole process takes under 10 minutes.</p><h2>What to Build Next</h2><ul><li>Add due dates and priority levels</li><li>Email reminders via CRON jobs</li><li>Share tasks between team members</li></ul><p>The stack you just learned — Next.js + Neon + Vercel — is production-ready and used by thousands of companies. Master it and you'll build faster than most senior engineers.</p>`,
    category: "tutorial",
    tags: ["nextjs", "neon", "fullstack", "tutorial", "react"],
    coverImage: null,
    authorId: adminId,
    published: true,
    featured: false,
    readTime: 14,
    views: 734,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function run() {
  console.log("⏳ Connecting to Neon database and running schema.sql...");
  
  try {
    // 2. Read schema.sql and execute
    const schemaPath = path.join(__dirname, "../schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    
    // Split statements by semicolon (ignoring semicolons inside $$ dollar quotes)
    const cleanSql = schemaSql
      .replace(/--.*$/gm, "") // remove comments
      .replace(/\/\*[\s\S]*?\*\//g, ""); // remove block comments
      
    const statements = [];
    let currentStatement = "";
    let inDollarQuote = false;
    for (let i = 0; i < cleanSql.length; i++) {
      const char = cleanSql[i];
      if (char === '$' && cleanSql[i + 1] === '$') {
        inDollarQuote = !inDollarQuote;
        currentStatement += "$$";
        i++;
        continue;
      }
      if (char === ';' && !inDollarQuote) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      } else {
        currentStatement += char;
      }
    }
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    for (const statement of statements) {
      try {
        await sql(statement);
      } catch (err) {
        // Some statements like CREATE TRIGGER might fail if already exists or on certain splits, we print warning
        console.warn(`⚠️ Warning executing statement: ${statement.substring(0, 50)}... \nError: ${err.message}`);
      }
    }

    console.log("✅ Schema applied successfully!");

    // 3. Insert Admin User
    console.log("⏳ Seeding admin user...");
    await sql(`
      INSERT INTO users (id, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [adminId, "admin@uget.com", adminHash]);

    await sql(`
      INSERT INTO profiles (id, username, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
    `, [adminId, "admin", "UGET Admin", "admin"]);

    console.log("✅ Admin user seeded!");

    // 4. Insert Posts
    console.log(`⏳ Seeding ${posts.length} posts...`);
    for (const post of posts) {
      await sql(`
        INSERT INTO posts (id, title, slug, excerpt, content, cover_image, category, tags, author_id, published, featured, read_time, view_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, excerpt = EXCLUDED.excerpt, tags = EXCLUDED.tags
      `, [
        post.id,
        post.title,
        post.slug,
        post.excerpt,
        post.content,
        post.coverImage,
        post.category,
        post.tags,
        post.authorId,
        post.published,
        post.featured,
        post.readTime,
        post.views
      ]);
    }

    console.log("✅ Database seeded successfully!");
    console.log("\n🔑 Login Credentials:");
    console.log("   Email: admin@uget.com");
    console.log("   Password: admin123");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

run();
