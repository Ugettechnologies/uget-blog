import { cookies } from "next/headers";
import { getUserFromSession } from "@/lib/auth-server";

export async function createClient() {
  return {
    auth: {
      async exchangeCodeForSession(code: string) {
        return { error: new Error("OAuth not supported on local Neon DB") };
      },
      async getUser() {
        try {
          const cookieStore = await cookies();
          const user = await getUserFromSession(cookieStore);
          if (!user) {
            return { data: { user: null }, error: null };
          }
          const formattedUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            user_metadata: { full_name: user.full_name },
            aud: "authenticated",
            app_metadata: { provider: user.provider || "email" }
          };
          return { data: { user: formattedUser }, error: null };
        } catch (err: any) {
          return { data: { user: null }, error: err };
        }
      }
    }
  };
}
