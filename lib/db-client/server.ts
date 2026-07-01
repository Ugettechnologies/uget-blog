export async function createClient() {
  return {
    auth: {
      async exchangeCodeForSession(code: string) {
        return { error: new Error("OAuth not supported on local Neon DB") };
      },
      async getUser() {
        return {
          data: {
            user: {
              id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
              email: "admin@uget.com",
              role: "admin",
              user_metadata: { full_name: "UGET Admin" },
              aud: "authenticated",
              app_metadata: { provider: "email" }
            }
          },
          error: null
        };
      }
    }
  };
}
