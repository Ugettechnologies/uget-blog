class DbQueryBuilder {
  private table: string;
  private method: string = "select";
  private selectFields: string = "*";
  private filters: { type: string; field: string; value: any }[] = [];
  private orders: { field: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private payload: any = null;
  private isSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = "*") {
    this.selectFields = fields;
    if (this.method === "select" || !this.method) {
      this.method = "select";
    }
    return this;
  }

  insert(data: any) {
    this.payload = data;
    this.method = "insert";
    return this;
  }

  update(data: any) {
    this.payload = data;
    this.method = "update";
    return this;
  }

  delete() {
    this.method = "delete";
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ type: "eq", field, value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ type: "neq", field, value });
    return this;
  }

  ilike(field: string, value: any) {
    this.filters.push({ type: "ilike", field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orders.push({ field, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: this.table,
          method: this.method,
          selectFields: this.selectFields,
          filters: this.filters,
          orders: this.orders,
          limitCount: this.limitCount,
          payload: this.payload,
          isSingle: this.isSingle,
        }),
      });
      const data = await res.json();
      if (onfulfilled) {
        return onfulfilled(data);
      }
      return data;
    } catch (err) {
      const errorObj = { data: null, error: err };
      if (onrejected) {
        return onrejected(errorObj);
      }
      return errorObj;
    }
  }
}

export function createClient() {
  return {
    from(table: string) {
      return new DbQueryBuilder(table);
    },
    auth: {
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
      },
      async signInWithPassword({ email, password }: any) {
        return {
          data: {
            user: {
              id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
              email: "admin@uget.com",
              role: "admin",
              user_metadata: { full_name: "UGET Admin" },
              aud: "authenticated",
              app_metadata: { provider: "email" }
            },
            session: { access_token: "mock-session-token" }
          },
          error: null
        };
      },
      async signUp({ email, password, options }: any) {
        return {
          data: {
            user: {
              id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
              email: "admin@uget.com",
              role: "admin",
              user_metadata: { full_name: "UGET Admin" },
              aud: "authenticated",
              app_metadata: { provider: "email" }
            },
            session: { access_token: "mock-session-token" }
          },
          error: null
        };
      },
      async signOut() {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          return { error: null };
        } catch (err: any) {
          return { error: err };
        }
      },
      async signInWithOAuth({ provider, options }: any) {
        window.location.href = `/api/auth/oauth/${provider}?next=/dashboard`;
        return { data: null, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        const mockUser = {
          id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          email: "admin@uget.com",
          role: "admin",
          user_metadata: { full_name: "UGET Admin" },
          aud: "authenticated",
          app_metadata: { provider: "email" }
        };
        setTimeout(() => {
          callback("SIGNED_IN", { user: mockUser });
        }, 0);
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(pathStr: string, file: File, options?: any) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("path", pathStr);
            try {
              const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data.error) return { error: { message: data.error }, data: null };
              return { error: null, data: { path: data.path } };
            } catch (err: any) {
              return { error: { message: err.message }, data: null };
            }
          },
          getPublicUrl(pathStr: string) {
            return { data: { publicUrl: pathStr } };
          },
        };
      },
    },
  };
}
