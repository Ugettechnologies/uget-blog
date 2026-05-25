import { NextRequest, NextResponse } from "next/server";
import { getPostById, updatePost, deletePost, incrementViews } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import { slugify, estimateReadTime } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment views
  incrementViews(id);

  return NextResponse.json({ post });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req);
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();

  const updates: Record<string, unknown> = { ...data };
  if (data.title) updates.slug = slugify(data.title);
  if (data.content) updates.readTime = estimateReadTime(data.content);

  const post = updatePost(id, updates);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req);
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deletePost(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
