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
      const postUrl = `${baseUrl}/post/${post.slug}`;
      const authorUrl = `${baseUrl}/profile/${post.author_username || post.author_id}`;
      const categoryUrl = `${baseUrl}/?category=${encodeURIComponent(post.category || "")}`;
      
      const rawContent = post.content || "";
      const cleanContent = rawContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const wordCount = cleanContent ? cleanContent.split(/\s+/).length : 0;
      const description = post.excerpt || cleanContent.slice(0, 160) + "…";

      // Dynamically extract Q&A pairs for FAQPage schema from question headings
      const faqItems: Array<{ question: string; answer: string }> = [];
      const headingRegex = /<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>([\s\S]*?)(?=<h[2-3]|$)/gi;
      let match;
      while ((match = headingRegex.exec(rawContent)) !== null && faqItems.length < 10) {
        const questionText = match[1].replace(/<[^>]*>/g, "").trim();
        const sectionBody = match[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

        const isQuestion =
          questionText.endsWith("?") ||
          /^(what|why|how|who|where|when|can|is|are|will|should|could|do|does)/i.test(questionText);

        if (isQuestion && sectionBody.length > 20) {
          faqItems.push({
            question: questionText,
            answer: sectionBody.slice(0, 320) + (sectionBody.length > 320 ? "…" : ""),
          });
        }
      }

      const graph: any[] = [
        {
          "@type": "BlogPosting",
          "@id": `${postUrl}#article`,
          isPartOf: {
            "@type": "WebPage",
            "@id": postUrl,
          },
          headline: post.title,
          description,
          articleBody: cleanContent.slice(0, 8000),
          wordCount,
          articleSection: post.category || "General",
          keywords: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || undefined,
          inLanguage: "en",
          image: post.cover_image ? [post.cover_image] : [`${baseUrl}/favicon.png`],
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": postUrl,
          },
          author: {
            "@type": "Person",
            name: post.author_name || "EchoGist Writer",
            url: authorUrl,
          },
          publisher: {
            "@type": "Organization",
            name: "EchoGist",
            url: baseUrl,
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/favicon.png`,
            },
          },
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: [".post-key-takeaways-text", ".post-key-takeaways", "h1"],
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${postUrl}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: baseUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: post.category
                ? post.category.charAt(0).toUpperCase() + post.category.slice(1)
                : "Stories",
              item: categoryUrl,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: post.title,
              item: postUrl,
            },
          ],
        },
      ];

      if (faqItems.length > 0) {
        graph.push({
          "@type": "FAQPage",
          "@id": `${postUrl}#faq`,
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        });
      }

      jsonLd = {
        "@context": "https://schema.org",
        "@graph": graph,
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

