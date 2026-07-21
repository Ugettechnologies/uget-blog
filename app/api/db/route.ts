import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth-server";
import { randomUUID } from "crypto";

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
        if (table === "profiles") {
          fieldName = `profiles.${filter.field}`;
        } else if (table === "posts" && selectFields.includes("profiles")) {
          if (filter.field.startsWith("profiles.")) {
            fieldName = filter.field;
          } else if (filter.field === "role") {
            fieldName = `profiles.role`;
          } else {
            fieldName = `posts.${filter.field}`;
          }
        } else if (table === "comments" && selectFields.includes("profiles")) {
          fieldName = `comments.${filter.field}`;
        } else if (table === "bookmarks" && selectFields.includes("posts")) {
          if (filter.field.startsWith("posts.")) {
            fieldName = filter.field;
          } else {
            fieldName = `bookmarks.${filter.field}`;
          }
        } else if (table === "follows" && selectFields.includes("profiles")) {
          fieldName = `follows.${filter.field}`;
        } else if (table === "notifications" && selectFields.includes("profiles")) {
          fieldName = `notifications.${filter.field}`;
        } else if (table === "live_events" && selectFields.includes("profiles")) {
          fieldName = `live_events.${filter.field}`;
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
        if (table === "profiles") {
          fieldName = `profiles.${o.field}`;
        } else if (table === "posts" && selectFields.includes("profiles")) {
          fieldName = `posts.${o.field}`;
        } else if (table === "comments" && selectFields.includes("profiles")) {
          fieldName = `comments.${o.field}`;
        } else if (table === "bookmarks" && selectFields.includes("posts")) {
          fieldName = `bookmarks.${o.field}`;
        } else if (table === "follows" && selectFields.includes("profiles")) {
          fieldName = `follows.${o.field}`;
        } else if (table === "notifications" && selectFields.includes("profiles")) {
          fieldName = `notifications.${o.field}`;
        } else if (table === "live_events" && selectFields.includes("profiles")) {
          fieldName = `live_events.${o.field}`;
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
      } else if (table === "bookmarks" && selectFields.includes("posts")) {
        queryText = `
          SELECT bookmarks.*, 
            json_build_object(
              'id', posts.id,
              'title', posts.title,
              'slug', posts.slug,
              'excerpt', posts.excerpt,
              'cover_image', posts.cover_image,
              'category', posts.category,
              'read_time', posts.read_time,
              'created_at', posts.created_at,
              'view_count', posts.view_count,
              'like_count', posts.like_count,
              'comment_count', posts.comment_count,
              'profiles', json_build_object(
                'id', profiles.id,
                'full_name', profiles.full_name,
                'avatar_url', profiles.avatar_url,
                'username', profiles.username
              )
            ) as posts
          FROM bookmarks
          JOIN posts ON bookmarks.post_id = posts.id
          LEFT JOIN profiles ON posts.author_id = profiles.id
          ${whereString}
          ${orderString}
          ${limitString}
        `;
      } else if (table === "follows" && selectFields.includes("profiles")) {
        queryText = `
          SELECT follows.*, 
            json_build_object(
              'id', follower.id,
              'full_name', follower.full_name,
              'avatar_url', follower.avatar_url,
              'username', follower.username,
              'bio', follower.bio
            ) as follower_profile,
            json_build_object(
              'id', following.id,
              'full_name', following.full_name,
              'avatar_url', following.avatar_url,
              'username', following.username,
              'bio', following.bio
            ) as following_profile
          FROM follows
          LEFT JOIN profiles follower ON follows.follower_id = follower.id
          LEFT JOIN profiles following ON follows.following_id = following.id
          ${whereString}
          ${orderString}
          ${limitString}
        `;
      } else if (table === "notifications" && selectFields.includes("profiles")) {
        queryText = `
          SELECT notifications.*, 
            json_build_object(
              'id', actor.id,
              'full_name', actor.full_name,
              'avatar_url', actor.avatar_url,
              'username', actor.username
            ) as actor_profile,
            CASE 
              WHEN p.id IS NOT NULL THEN json_build_object('id', p.id, 'slug', p.slug, 'title', p.title)
              ELSE NULL
            END as posts
          FROM notifications
          LEFT JOIN profiles actor ON notifications.actor_id = actor.id
          LEFT JOIN posts p ON notifications.post_id = p.id
          ${whereString}
          ${orderString}
          ${limitString}
        `;
      } else if (table === "profiles") {
        queryText = `
          SELECT profiles.*, users.email 
          FROM profiles
          JOIN users ON profiles.id = users.id
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

      if (payload && typeof payload === "object") {
        if (table !== "profiles" && (!payload.id || payload.id === "")) {
          payload.id = randomUUID();
        }
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

      if (result) {
        await triggerNotification(sql, table, result);
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

      if (result) {
        if (table === "posts" && result.published) {
          await triggerNotification(sql, table, result);
        }
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

async function triggerNotification(sql: any, table: string, result: any) {
  try {
    if (table === "likes") {
      const postId = result.post_id;
      const actorId = result.user_id;
      const posts = await sql(`SELECT title, author_id FROM posts WHERE id = $1`, [postId]);
      if (posts.length > 0 && posts[0].author_id !== actorId) {
        const targetUserId = posts[0].author_id;
        const postTitle = posts[0].title;
        const shortTitle = postTitle.length > 25 ? postTitle.substring(0, 25) + "..." : postTitle;
        await sql(`
          INSERT INTO notifications (user_id, type, actor_id, post_id, content)
          VALUES ($1, 'like', $2, $3, $4)
        `, [targetUserId, actorId, postId, `liked your story "${shortTitle}"`]);
      }
    } else if (table === "comments") {
      const postId = result.post_id;
      const actorId = result.user_id;
      const posts = await sql(`SELECT title, author_id FROM posts WHERE id = $1`, [postId]);
      if (posts.length > 0 && posts[0].author_id !== actorId) {
        const targetUserId = posts[0].author_id;
        const postTitle = posts[0].title;
        const shortTitle = postTitle.length > 25 ? postTitle.substring(0, 25) + "..." : postTitle;
        await sql(`
          INSERT INTO notifications (user_id, type, actor_id, post_id, content)
          VALUES ($1, 'comment', $2, $3, $4)
        `, [targetUserId, actorId, postId, `commented on your story "${shortTitle}"`]);
      }
    } else if (table === "follows") {
      const followerId = result.follower_id;
      const followingId = result.following_id;
      await sql(`
        INSERT INTO notifications (user_id, type, actor_id, content)
        VALUES ($1, 'follow', $2, 'started following you')
      `, [followingId, followerId]);
    } else if (table === "posts") {
      const authorId = result.author_id;
      const postId = result.id;
      const postTitle = result.title;
      if (result.published) {
        // Prevent duplicate notifications
        const existing = await sql(`SELECT id FROM notifications WHERE post_id = $1 AND type = 'post' LIMIT 1`, [postId]);
        if (existing.length > 0) return;

        const shortTitle = postTitle.length > 25 ? postTitle.substring(0, 25) + "..." : postTitle;
        const followers = await sql(`SELECT follower_id FROM follows WHERE following_id = $1`, [authorId]);
        for (const f of followers) {
          await sql(`
            INSERT INTO notifications (user_id, type, actor_id, post_id, content)
            VALUES ($1, 'post', $2, $3, $4)
          `, [f.follower_id, authorId, postId, `published a new story: "${shortTitle}"`]);
        }
      }
    }
  } catch (err) {
    console.error("Failed to trigger notification:", err);
  }
}
