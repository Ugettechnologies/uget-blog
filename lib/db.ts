import { Pool } from "pg";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

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

// Fallback JSON-file database implementation for local testing
const mockDbPath = path.join(process.cwd(), "data/mock_db.json");

function getMockDb() {
  if (!fs.existsSync(path.dirname(mockDbPath))) {
    fs.mkdirSync(path.dirname(mockDbPath), { recursive: true });
  }
  if (!fs.existsSync(mockDbPath)) {
    const adminHash = bcrypt.hashSync("admin123", 10);
    const adminId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const initialData = {
      users: [
        { id: adminId, email: "admin@uget.com", password_hash: adminHash }
      ],
      profiles: [
        { 
          id: adminId, 
          username: "admin", 
          full_name: "UGET Admin", 
          role: "admin", 
          avatar_url: "", 
          bio: "UGET Admin account",
          twitter: "",
          website: "",
          follower_count: 5,
          post_count: 3,
          interests: ["tech", "ai", "design"]
        }
      ],
      notifications: [
        {
          id: "1",
          user_id: adminId,
          type: "like",
          actor_id: "other-user-id",
          post_id: "post-1",
          content: "liked your story",
          read: false,
          created_at: new Date().toISOString()
        }
      ],
      posts: [],
      follows: [],
      bookmarks: [],
      comments: []
    };
    fs.writeFileSync(mockDbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(mockDbPath, "utf-8"));
  } catch {
    return { users: [], profiles: [], notifications: [], posts: [], follows: [], bookmarks: [], comments: [] };
  }
}

function saveMockDb(data: any) {
  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
}

export function getSql() {
  if (sqlInstance) return sqlInstance;

  const pool = getPool();
  if (!pool) {
    console.info("ℹ️ DATABASE_URL is not set. Using JSON mock database at data/mock_db.json");
    
    sqlInstance = async (strings: TemplateStringsArray | string, ...values: any[]) => {
      let queryText = "";
      let params = values;

      if (typeof strings === "string") {
        queryText = strings;
        params = values[0] || [];
      } else {
        for (let i = 0; i < strings.length; i++) {
          queryText += strings[i];
          if (i < values.length) {
            queryText += `$${i + 1}`;
          }
        }
      }

      const query = queryText.replace(/\s+/g, " ").trim();
      const db = getMockDb();

      // 1. SELECT users & profiles by email or id
      if (query.includes("FROM users")) {
        if (query.includes("email =")) {
          const email = params[0];
          const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
            const profile = db.profiles.find((p: any) => p.id === user.id) || {};
            return [{
              id: user.id,
              email: user.email,
              password_hash: user.password_hash,
              username: profile.username || "",
              full_name: profile.full_name || "",
              avatar_url: profile.avatar_url || "",
              role: profile.role || "writer"
            }];
          }
          return [];
        } else if (query.includes("id =") || query.includes("u.id =")) {
          const id = params[0];
          const user = db.users.find((u: any) => u.id === id);
          if (user) {
            const profile = db.profiles.find((p: any) => p.id === user.id) || {};
            return [{
              id: user.id,
              email: user.email,
              password_hash: user.password_hash,
              username: profile.username || "",
              full_name: profile.full_name || "",
              avatar_url: profile.avatar_url || "",
              role: profile.role || "writer"
            }];
          }
          return [];
        }
      }

      // 2. SELECT * FROM profiles WHERE id = $1
      if (query.includes("FROM profiles") && query.includes("id =")) {
        const id = params[0];
        const profile = db.profiles.find((p: any) => p.id === id);
        return profile ? [profile] : [];
      }

      // 3. SELECT * FROM profiles (no WHERE id)
      if (query.includes("FROM profiles") && !query.includes("WHERE")) {
        return db.profiles;
      }

      // 4. UPDATE profiles
      if (query.startsWith("UPDATE profiles")) {
        const id = params[params.length - 1];
        const profileIdx = db.profiles.findIndex((p: any) => p.id === id);
        if (profileIdx !== -1) {
          const setPart = query.split("SET")[1].split("WHERE")[0];
          const assignments = setPart.split(",").map(s => s.trim());
          assignments.forEach((assignment, index) => {
            const field = assignment.split("=")[0].trim();
            db.profiles[profileIdx][field] = params[index];
          });
          saveMockDb(db);
          return [db.profiles[profileIdx]];
        }
        return [];
      }

      // 5. INSERT INTO users
      if (query.startsWith("INSERT INTO users")) {
        let email = "";
        let password_hash = "";
        let id = "";
        
        if (query.includes("(id, email, password_hash)")) {
          [id, email, password_hash] = params;
        } else if (query.includes("(email, password_hash)")) {
          [email, password_hash] = params;
          id = Math.random().toString(36).substring(2) + "-" + Math.random().toString(36).substring(2);
        } else {
          [email, password_hash] = params;
          id = Math.random().toString(36).substring(2) + "-" + Math.random().toString(36).substring(2);
        }
        
        const newUser = { id, email, password_hash };
        db.users.push(newUser);
        saveMockDb(db);
        return [{ id, email }];
      }

      // 6. INSERT INTO profiles
      if (query.startsWith("INSERT INTO profiles")) {
        const [id, username, full_name, role] = params;
        const newProfile = { 
          id, 
          username, 
          full_name, 
          role, 
          avatar_url: "", 
          bio: "",
          twitter: "",
          website: "",
          follower_count: 0,
          post_count: 0,
          interests: []
        };
        db.profiles.push(newProfile);
        saveMockDb(db);
        return [newProfile];
      }

      // 7. SELECT * FROM notifications
      if (query.includes("FROM notifications")) {
        const userId = params[0];
        const userNotifs = db.notifications.filter((n: any) => n.user_id === userId);
        return userNotifs;
      }

      // 8. INSERT INTO notifications
      if (query.startsWith("INSERT INTO notifications")) {
        const newNotif = {
          id: Math.random().toString(36).substring(7),
          user_id: params[0],
          type: params[1],
          actor_id: params[2],
          post_id: params[3],
          content: params[4],
          read: false,
          created_at: new Date().toISOString()
        };
        db.notifications.push(newNotif);
        saveMockDb(db);
        return [newNotif];
      }

      return [];
    };
    return sqlInstance;
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
