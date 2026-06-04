#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Load environment variables from .env.local
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
  process.exit(1);
}

const isNeon = dbUrl.includes("neon.tech") || dbUrl.includes("neon.run");
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isNeon ? { rejectUnauthorized: false } : false
});

async function run() {
  console.log("⏳ Connecting to database to clear demo data...");
  try {
    // Delete all comments, likes, bookmarks, posts, profiles, and users
    await pool.query("TRUNCATE TABLE comments, likes, bookmarks, posts, profiles, users CASCADE;");
    console.log("✅ Database cleared successfully! All demo posts and profiles have been removed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }
}

run();
