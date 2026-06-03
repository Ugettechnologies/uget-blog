export async function createClient() {
  return {
    auth: {
      async exchangeCodeForSession(code: string) {
        return { error: new Error("OAuth not supported on local Neon DB") };
      },
      async getUser() {
        return { data: { user: null }, error: null };
      }
    }
  };
}
