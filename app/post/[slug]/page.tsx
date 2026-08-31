import type { Metadata } from "next";
import { queryOne } from "@/lib/db";
import PostPage from "@/components/PostPage";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://echo-gist.com";

  try {
    const post = await queryOne(
      `SELECT posts.*, profiles.full_name as author_name 
       FROM posts 
       LEFT JOIN profiles ON posts.author_id = profiles.id 
       WHERE posts.slug = $1 AND posts.published = true`,
      [slug]
    );

    if (!post) {
      return {
        title: "Story Not Found | EchoGist",
        description: "The story you are looking for does not exist on EchoGist.",
      };
    }

    const title = `${post.title} | EchoGist`;
    const description =
      post.excerpt ||
      `Read "${post.title}" by ${post.author_name || "a writer"} on EchoGist.`;
    const canonicalUrl = `${baseUrl}/post/${post.slug}`;
    const coverImage = post.cover_image || `${baseUrl}/favicon.png`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: post.title,
        description,
        url: canonicalUrl,
        siteName: "EchoGist",
        type: "article",
        publishedTime: post.created_at,
        authors: post.author_name ? [post.author_name] : undefined,
        images: [
          {
            url: coverImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        images: [coverImage],
      },
    };
  } catch (err) {
    console.error("Error generating metadata for post:", err);
    return {
      title: "EchoGist — Where Ideas Live",
      description: "Read stories that matter on EchoGist.",
    };
  }
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://echo-gist.com";

  let jsonLd = null;
  try {
    const post = await queryOne(
      `SELECT posts.*, profiles.full_name as author_name, profiles.username as author_username 
       FROM posts 
       LEFT JOIN profiles ON posts.author_id = profiles.id 
       WHERE posts.slug = $1 AND posts.published = true`,
      [slug]
    );

    if (post) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt || "",
        image: post.cover_image ? [post.cover_image] : undefined,
        datePublished: post.created_at,
        dateModified: post.updated_at || post.created_at,
        author: {
          "@type": "Person",
          name: post.author_name || "EchoGist Writer",
          url: `${baseUrl}/profile/${post.author_username || post.author_id}`,
        },
        publisher: {
          "@type": "Organization",
          name: "EchoGist",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/favicon.png`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${baseUrl}/post/${post.slug}`,
        },
      };
    }
  } catch (e) {
    console.error("Error generating JSON-LD:", e);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PostPage />
    </>
  );
}

