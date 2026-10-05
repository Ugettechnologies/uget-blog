#!/usr/bin/env node
/**
 * Data Restore Script for EchoGist
 * Restores tables from the latest JSON backup file into the target database.
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Load environment variables from .env.local or .env
const envFiles = [path.join(__dirname, "../.env.local"), path.join(__dirname, "../.env")];
for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error("❌ Error: No database URL found in .env.local or .env");
  process.exit(1);
}

const isNeon = dbUrl.includes("neon.tech") || dbUrl.includes("neon.run");
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
});

async function restore() {
  const backupFile = path.join(__dirname, "../backups/latest_backup.json");
  if (!fs.existsSync(backupFile)) {
    console.error("❌ Error: latest_backup.json not found in backups directory.");
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFile, "utf-8"));
  console.log(`🚀 Restoring backup from: ${backupData.exportedAt}`);

  const client = await pool.connect();
  try {
    const priorityOrder = [
      "users",
      "profiles",
      "posts",
      "comments",
      "likes",
      "bookmarks",
      "follows",
      "notifications",
      "subscribers",
      "newsletters",
      "analytics",
      "page_views",
    ];

    const tables = Object.keys(backupData.tables);
    const sortedTables = [
      ...priorityOrder.filter((t) => tables.includes(t)),
      ...tables.filter((t) => !priorityOrder.includes(t)),
    ];

    for (const table of sortedTables) {
      const rows = backupData.tables[table];
      if (!rows || rows.length === 0) continue;

      console.log(`📥 Restoring table "${table}" (${rows.length} rows)...`);
      const columns = Object.keys(rows[0]);
      const colsFormatted = columns.map((c) => `"${c}"`).join(", ");

      for (const row of rows) {
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        const values = columns.map((col) => row[col]);

        const query = `
          INSERT INTO "${table}" (${colsFormatted})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING;
        `;
        await client.query(query, values);
      }
      console.log(`✅ Restored ${table}`);
    }

    console.log("\n🎉 ALL DATA SUCCESSFULLY RESTORED!");
  } catch (err) {
    console.error("❌ Restoration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

restore();
