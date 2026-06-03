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
        try {
          const res = await fetch("/api/auth/me");
          if (!res.ok) return { data: { user: null }, error: null };
          const data = await res.json();
          return { data: { user: data.user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      },
      async signInWithPassword({ email, password }: any) {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Login failed");
          return { data: { user: data.user, session: data.session }, error: null };
        } catch (err: any) {
          return { data: { user: null, session: null }, error: err };
        }
      },
      async signUp({ email, password, options }: any) {
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, full_name: options?.data?.full_name }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Sign up failed");
          return { data: { user: data.user, session: data.session }, error: null };
        } catch (err: any) {
          return { data: { user: null, session: null }, error: err };
        }
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
        window.location.href = `/api/auth/oauth/${provider}`;
        return { data: null, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        fetch("/api/auth/me")
          .then((res) => res.json())
          .then((data) => {
            callback("SIGNED_IN", data.user ? { user: data.user } : null);
          })
          .catch(() => {
            callback("SIGNED_OUT", null);
          });
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
