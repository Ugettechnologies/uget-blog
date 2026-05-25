import { getAllPosts, seedAdminIfNeeded } from "@/lib/db";
import ClientHome from "@/components/ClientHome";

export default function Home() {
  seedAdminIfNeeded();
  const allPosts = getAllPosts(true);
  return <ClientHome posts={JSON.parse(JSON.stringify(allPosts))} />;
}
