import { Pool } from "pg";

let poolInstance: Pool | null = null;
let sqlInstance: any = null;

export function getPool(): Pool | null {
  if (poolInstance) return poolInstance;

  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    console.warn("⚠️ DATABASE_URL or NEON_DATABASE_URL is not set. Database queries will fail.");
    return null;
  }

  // Determine SSL configuration:
  // Neon Cloud DB requires SSL, whereas local PostgreSQL databases generally do not.
  const isNeonCloud = url.includes("neon.tech") || url.includes("neon.run");
  const ssl = isNeonCloud ? { rejectUnauthorized: false } : false;

  poolInstance = new Pool({
    connectionString: url,
    ssl: ssl,
  });

  return poolInstance;
}

export function getSql() {
  if (sqlInstance) return sqlInstance;

  const pool = getPool();
  if (!pool) {
    console.warn("⚠️ Pool could not be created. Returning dummy sql function.");
    return async () => [];
  }

  // Create a function that can be used as a tagged template literal or as a regular function:
  sqlInstance = async (strings: TemplateStringsArray | string, ...values: any[]) => {
    let queryText = "";
    let params = values;

    if (typeof strings === "string") {
      // Regular function call: sql("SELECT ...", [param1, param2])
      queryText = strings;
      params = values[0] || [];
    } else {
      // Tagged template literal: sql`SELECT ... WHERE id = ${id}`
      for (let i = 0; i < strings.length; i++) {
        queryText += strings[i];
        if (i < values.length) {
          queryText += `$${i + 1}`;
        }
      }
    }

    try {
      const result = await pool.query(queryText, params);
      return result.rows;
    } catch (err: any) {
      console.error("Database query failed:", err.message, "\nQuery:", queryText, "\nParams:", params);
      throw err;
    }
  };

  return sqlInstance;
}

export async function queryOne(queryText: string, params: any[] = []) {
  const sql = getSql();
  const rows = await sql(queryText, params);
  return rows[0] || null;
}

export async function queryAll(queryText: string, params: any[] = []) {
  const sql = getSql();
  return await sql(queryText, params);
}
