import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const {
      table,
      method,
      selectFields,
      filters,
      orders,
      limitCount,
      payload,
      isSingle
    } = await request.json();

    const sql = getSql();
    
    // Get current logged in user for auth/security verification if needed
    const cookieStore = await cookies();
    const user = await getUserFromSession(cookieStore);

    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];

    const getParamPlaceholder = (val: any) => {
      params.push(val);
      return `$${params.length}`;
    };

    if (filters && filters.length > 0) {
      for (const filter of filters) {
        let fieldName = filter.field;
        // Prefix with table name to avoid ambiguity in joins
        if (table === "posts" && selectFields.includes("profiles")) {
          fieldName = `posts.${filter.field}`;
        } else if (table === "comments" && selectFields.includes("profiles")) {
          fieldName = `comments.${filter.field}`;
        }

        if (filter.type === "eq") {
          whereClauses.push(`${fieldName} = ${getParamPlaceholder(filter.value)}`);
        } else if (filter.type === "neq") {
          whereClauses.push(`${fieldName} != ${getParamPlaceholder(filter.value)}`);
        } else if (filter.type === "ilike") {
          whereClauses.push(`${fieldName} ILIKE ${getParamPlaceholder(filter.value)}`);
        }
      }
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Build ORDER BY clause
    let orderString = "";
    if (orders && orders.length > 0) {
      const orderClauses = orders.map((o: any) => {
        let fieldName = o.field;
        if (table === "posts" && selectFields.includes("profiles")) {
          fieldName = `posts.${o.field}`;
        } else if (table === "comments" && selectFields.includes("profiles")) {
          fieldName = `comments.${o.field}`;
        }
        return `${fieldName} ${o.ascending ? "ASC" : "DESC"}`;
      });
      orderString = `ORDER BY ${orderClauses.join(", ")}`;
    }

    // Build LIMIT clause
    const limitString = limitCount ? `LIMIT ${limitCount}` : "";

    let queryText = "";
    
    if (method === "select") {
      if (table === "posts" && selectFields.includes("profiles")) {
        queryText = `
          SELECT posts.*, 
            json_build_object(
              'id', profiles.id,
              'full_name', profiles.full_name,
              'avatar_url', profiles.avatar_url,
              'username', profiles.username,
              'bio', profiles.bio
            ) as profiles
          FROM posts
          LEFT JOIN profiles ON posts.author_id = profiles.id
          ${whereString}
          ${orderString}
          ${limitString}
        `;
      } else if (table === "comments" && selectFields.includes("profiles")) {
        queryText = `
          SELECT comments.*, 
            json_build_object(
              'id', profiles.id,
              'full_name', profiles.full_name,
              'avatar_url', profiles.avatar_url,
              'username', profiles.username
            ) as profiles
          FROM comments
          LEFT JOIN profiles ON comments.user_id = profiles.id
          ${whereString}
          ${orderString}
          ${limitString}
        `;
      } else if (table === "live_events" && selectFields.includes("profiles")) {
        queryText = `
          SELECT live_events.*, 
            json_build_object(
              'id', profiles.id,
              'full_name', profiles.full_name,
              'avatar_url', profiles.avatar_url,
              'username', profiles.username,
              'bio', profiles.bio
            ) as profiles
          FROM live_events
          LEFT JOIN profiles ON live_events.author_id = profiles.id
          ${whereString}
          ${orderString}
          ${limitString}
        `;
      } else {
        queryText = `
          SELECT * FROM ${table}
          ${whereString}
          ${orderString}
          ${limitString}
        `;
      }

      const rows = await sql(queryText, params);
      
      if (isSingle) {
        return NextResponse.json({ data: rows[0] || null, error: null });
      }
      return NextResponse.json({ data: rows, error: null });
    } 
    
    else if (method === "insert") {
      if (!user) {
        return NextResponse.json({ data: null, error: { message: "Unauthorized" } }, { status: 401 });
      }

      const fields = Object.keys(payload);
      const valuePlaceholders = fields.map((f) => getParamPlaceholder(payload[f]));
      
      queryText = `
        INSERT INTO ${table} (${fields.join(", ")})
        VALUES (${valuePlaceholders.join(", ")})
        RETURNING *
      `;

      const rows = await sql(queryText, params);
      
      // If table is posts/comments/live_events and selectFields includes profiles, we should fetch it with the profile join
      let result = rows[0];
      if (result && (table === "posts" || table === "comments" || table === "live_events") && selectFields.includes("profiles")) {
        const idField = result.id;
        let joinedQuery = "";
        if (table === "posts") {
          joinedQuery = `SELECT posts.*, json_build_object('id', profiles.id, 'full_name', profiles.full_name, 'avatar_url', profiles.avatar_url, 'username', profiles.username) as profiles FROM posts LEFT JOIN profiles ON posts.author_id = profiles.id WHERE posts.id = $1`;
        } else if (table === "comments") {
          joinedQuery = `SELECT comments.*, json_build_object('id', profiles.id, 'full_name', profiles.full_name, 'avatar_url', profiles.avatar_url, 'username', profiles.username) as profiles FROM comments LEFT JOIN profiles ON comments.user_id = profiles.id WHERE comments.id = $1`;
        } else if (table === "live_events") {
          joinedQuery = `SELECT live_events.*, json_build_object('id', profiles.id, 'full_name', profiles.full_name, 'avatar_url', profiles.avatar_url, 'username', profiles.username) as profiles FROM live_events LEFT JOIN profiles ON live_events.author_id = profiles.id WHERE live_events.id = $1`;
        }
        const joinedRows = await sql(joinedQuery, [idField]);
        result = joinedRows[0] || result;
      }

      return NextResponse.json({ data: result, error: null });
    } 
    
    else if (method === "update") {
      if (!user) {
        return NextResponse.json({ data: null, error: { message: "Unauthorized" } }, { status: 401 });
      }

      // Build SET clauses
      const setClauses: string[] = [];
      // Make sure updated_at is set to now() or payload.updated_at
      const fields = Object.keys(payload);
      for (const field of fields) {
        // Exclude slug updates on existing posts to avoid breaking links
        if (field === "slug" && payload[field] === undefined) continue;
        setClauses.push(`${field} = ${getParamPlaceholder(payload[field])}`);
      }

      if (setClauses.length === 0) {
        return NextResponse.json({ data: null, error: { message: "No fields to update" } });
      }

      queryText = `
        UPDATE ${table}
        SET ${setClauses.join(", ")}
        ${whereString}
        RETURNING *
      `;

      const rows = await sql(queryText, params);
      let result = rows[0] || null;

      if (result && (table === "posts" || table === "live_events") && selectFields.includes("profiles")) {
        const joinedRows = table === "posts"
          ? await sql(`
              SELECT posts.*, 
                json_build_object(
                  'id', profiles.id, 
                  'full_name', profiles.full_name, 
                  'avatar_url', profiles.avatar_url, 
                  'username', profiles.username,
                  'bio', profiles.bio
                ) as profiles 
              FROM posts 
              LEFT JOIN profiles ON posts.author_id = profiles.id 
              WHERE posts.id = $1
            `, [result.id])
          : await sql(`
              SELECT live_events.*, 
                json_build_object(
                  'id', profiles.id, 
                  'full_name', profiles.full_name, 
                  'avatar_url', profiles.avatar_url, 
                  'username', profiles.username,
                  'bio', profiles.bio
                ) as profiles 
              FROM live_events 
              LEFT JOIN profiles ON live_events.author_id = profiles.id 
              WHERE live_events.id = $1
            `, [result.id]);
        result = joinedRows[0] || result;
      }

      return NextResponse.json({ data: result, error: null });
    } 
    
    else if (method === "delete") {
      if (!user) {
        return NextResponse.json({ data: null, error: { message: "Unauthorized" } }, { status: 401 });
      }

      queryText = `
        DELETE FROM ${table}
        ${whereString}
        RETURNING *
      `;

      const rows = await sql(queryText, params);
      return NextResponse.json({ data: rows[0] || null, error: null });
    }

    return NextResponse.json({ data: null, error: { message: "Unsupported method" } }, { status: 400 });
  } catch (err: any) {
    console.error("DB route error:", err);
    return NextResponse.json({ data: null, error: { message: err.message || "Internal server error" } }, { status: 500 });
  }
}
