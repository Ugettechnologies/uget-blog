import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "blog.db");
const DATA_DIR = path.join(process.cwd(), "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple JSON-based database (no native bindings needed)
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  coverImage: string | null;
  author: string;
  authorId: string;
  published: boolean;
  featured: boolean;
  readTime: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  avatar: string | null;
  createdAt: string;
}

interface Database {
  posts: Post[];
  users: User[];
}

function loadDB(): Database {
  if (!fs.existsSync(DB_PATH)) {
    const initial: Database = { posts: [], users: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function saveDB(db: Database): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getDB(): Database {
  return loadDB();
}

export function saveAndReturn<T>(fn: (db: Database) => T): T {
  const db = loadDB();
  const result = fn(db);
  saveDB(db);
  return result;
}

// Post operations
export function getAllPosts(publishedOnly = false): Post[] {
  const db = loadDB();
  return publishedOnly
    ? db.posts.filter((p) => p.published).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : db.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const db = loadDB();
  return db.posts.find((p) => p.slug === slug) || null;
}

export function getPostById(id: string): Post | null {
  const db = loadDB();
  return db.posts.find((p) => p.id === id) || null;
}

export function createPost(data: Omit<Post, "id" | "createdAt" | "updatedAt" | "views">): Post {
  return saveAndReturn((db) => {
    const post: Post = {
      ...data,
      id: crypto.randomUUID(),
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.posts.push(post);
    return post;
  });
}

export function updatePost(id: string, data: Partial<Post>): Post | null {
  return saveAndReturn((db) => {
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    db.posts[idx] = { ...db.posts[idx], ...data, updatedAt: new Date().toISOString() };
    return db.posts[idx];
  });
}

export function deletePost(id: string): boolean {
  return saveAndReturn((db) => {
    const before = db.posts.length;
    db.posts = db.posts.filter((p) => p.id !== id);
    return db.posts.length < before;
  });
}

export function incrementViews(id: string): void {
  saveAndReturn((db) => {
    const post = db.posts.find((p) => p.id === id);
    if (post) post.views += 1;
  });
}

// User operations
export function getUserByEmail(email: string): User | null {
  const db = loadDB();
  return db.users.find((u) => u.email === email) || null;
}

export function getUserById(id: string): User | null {
  const db = loadDB();
  return db.users.find((u) => u.id === id) || null;
}

export function createUser(data: Omit<User, "id" | "createdAt">): User {
  return saveAndReturn((db) => {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });
}

export function seedAdminIfNeeded(): void {
  const db = loadDB();
  if (db.users.length === 0) {
    // Seed default admin - password: admin123
    const bcrypt = require("bcryptjs");
    const hash = bcrypt.hashSync("admin123", 10);
    db.users.push({
      id: crypto.randomUUID(),
      name: "UGET Admin",
      email: "admin@uget.com",
      password: hash,
      role: "admin",
      avatar: null,
      createdAt: new Date().toISOString(),
    });
    saveDB(db);
    console.log("✅ Seeded admin user: admin@uget.com / admin123");
  }
}

export type { Post, User, Database };
