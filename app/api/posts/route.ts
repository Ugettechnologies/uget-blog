import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import { slugify, estimateReadTime } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Check if admin (can see unpublished)
  const token = getTokenFromRequest(req);
  const isAdmin = token?.role === "admin";

  let posts = getAllPosts(!isAdmin);

  if (category && category !== "all") {
    posts = posts.filter((p) => p.category === category);
  }
  if (featured === "true") {
    posts = posts.filter((p) => p.featured);
  }

  return NextResponse.json({ posts: posts.slice(0, limit) });
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { title, content, excerpt, category, tags, coverImage, featured, published } = data;

  if (!title || !content || !category) {
    return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 });
  }

  const slug = slugify(title);
  const readTime = estimateReadTime(content);

  const post = createPost({
    title,
    slug,
    content,
    excerpt: excerpt || content.substring(0, 150) + "...",
    category,
    tags: tags || "",
    coverImage: coverImage || null,
    author: "UGET Editorial",
    authorId: token.userId,
    published: published ?? true,
    featured: featured ?? false,
    readTime,
  });

  return NextResponse.json({ post }, { status: 201 });
}
