#!/usr/bin/env node
/**
 * Data Exporter Script for EchoGist
 * Extracts all database tables into JSON and SQL files for backup / later restoration.
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// 1. Load environment variables from .env.local or .env
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

function escapeSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return val.toString();
  if (Array.isArray(val)) {
    // Format postgres array
    const escapedArr = val.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",");
    return `'${"{" + escapedArr + "}"}'`;
  }
  if (val instanceof Date) {
    return `'${val.toISOString()}'`;
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportAll() {
  const exportDir = path.join(__dirname, "../backups");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const timestampDir = path.join(exportDir, `backup_${timestamp}`);
  fs.mkdirSync(timestampDir, { recursive: true });

  console.log("🚀 Starting database data extraction...");
  console.log(`📁 Backup directory: ${timestampDir}`);

  const client = await pool.connect();
  try {
    // Get list of all user tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map((r) => r.table_name);
    console.log(`📋 Found ${tables.length} tables:`, tables.join(", "));

    const fullBackup = {
      exportedAt: new Date().toISOString(),
      sourceDatabase: dbUrl.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
      tables: {},
      summary: {},
    };

    let sqlDump = `-- EchoGist Backup Dump\n-- Generated on: ${new Date().toISOString()}\n\n`;

    // Desired insertion order to respect foreign key dependencies
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

    const sortedTables = [
      ...priorityOrder.filter((t) => tables.includes(t)),
      ...tables.filter((t) => !priorityOrder.includes(t)),
    ];

    for (const table of sortedTables) {
      const dataRes = await client.query(`SELECT * FROM "${table}"`);
      const rows = dataRes.rows;

      fullBackup.tables[table] = rows;
      fullBackup.summary[table] = rows.length;

      // Save individual JSON file
      const jsonFile = path.join(timestampDir, `${table}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(rows, null, 2), "utf-8");

      console.log(`✅ Exported ${table.padEnd(20)}: ${rows.length} rows -> ${table}.json`);

      // Generate SQL INSERT statements
      if (rows.length > 0) {
        sqlDump += `\n-- Table: ${table} (${rows.length} rows)\n`;
        const columns = Object.keys(rows[0]);
        const colsFormatted = columns.map((c) => `"${c}"`).join(", ");

        for (const row of rows) {
          const valsFormatted = columns.map((col) => escapeSqlValue(row[col])).join(", ");
          sqlDump += `INSERT INTO "${table}" (${colsFormatted}) VALUES (${valsFormatted}) ON CONFLICT DO NOTHING;\n`;
        }
      }
    }

    // Save full combined JSON backup
    const fullJsonPath = path.join(timestampDir, "full_backup.json");
    fs.writeFileSync(fullJsonPath, JSON.stringify(fullBackup, null, 2), "utf-8");

    // Save latest pointer in backups root
    const latestJsonPath = path.join(exportDir, "latest_backup.json");
    fs.writeFileSync(latestJsonPath, JSON.stringify(fullBackup, null, 2), "utf-8");

    // Save SQL dump
    const sqlPath = path.join(timestampDir, "backup.sql");
    fs.writeFileSync(sqlPath, sqlDump, "utf-8");

    const latestSqlPath = path.join(exportDir, "latest_backup.sql");
    fs.writeFileSync(latestSqlPath, sqlDump, "utf-8");

    console.log("\n========================================================");
    console.log("🎉 DATA EXTRACTION COMPLETED SUCCESSFULLY!");
    console.log("========================================================");
    console.log(`📁 Files saved in: ${timestampDir}`);
    console.log(`📄 Full JSON Backup: backups/latest_backup.json`);
    console.log(`📄 Full SQL Dump:    backups/latest_backup.sql`);
    console.log(`📊 Summary:`);
    for (const [t, count] of Object.entries(fullBackup.summary)) {
      console.log(`   - ${t.padEnd(20)}: ${count} items`);
    }
    console.log("========================================================\n");
  } catch (err) {
    console.error("❌ Export failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

exportAll();
