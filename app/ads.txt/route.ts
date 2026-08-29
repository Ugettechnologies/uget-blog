export const dynamic = "force-static";

export async function GET() {
  const content = "google.com, pub-7030150096951668, DIRECT, f08c47fec0942fa0\n";
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

