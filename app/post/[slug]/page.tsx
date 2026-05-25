import { getPostBySlug, getAllPosts, seedAdminIfNeeded } from "@/lib/db";
import { notFound } from "next/navigation";
import PostDetail from "@/components/PostDetail";

export async function generateStaticParams() {
  return [];
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  seedAdminIfNeeded();
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const relatedPosts = getAllPosts(true)
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  return <PostDetail post={JSON.parse(JSON.stringify(post))} related={JSON.parse(JSON.stringify(relatedPosts))} />;
}
