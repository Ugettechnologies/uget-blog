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
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          const data = await res.json();
          if (data && data.user) {
            return { data: { user: data.user }, error: null };
          }
          if (data && data.error) {
            console.error("Auth user error:", data.error);
            return { data: { user: null }, error: new Error(data.error) };
          }
          return { data: { user: null }, error: null };
        } catch (err: any) {
          console.error("Auth user fetch error:", err);
          return { data: { user: null }, error: err };
        }
      },
      async signInWithPassword({ email, password }: any) {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("uget-auth-change", { detail: { event: "SIGNED_IN", session: { user: data.user } } }));
          }
          return { data: { user: data.user, session: data.session }, error: null };
        } catch (err: any) {
          return { data: { user: null, session: null }, error: { message: err.message } };
        }
      },
      async signUp({ email, password, options }: any) {
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name: options?.data?.full_name })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("uget-auth-change", { detail: { event: "SIGNED_IN", session: { user: data.user } } }));
          }
          return { data: { user: data.user, session: data.session }, error: null };
        } catch (err: any) {
          return { data: { user: null, session: null }, error: { message: err.message } };
        }
      },
      async signOut() {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("uget-auth-change", { detail: { event: "SIGNED_OUT", session: null } }));
          }
          return { error: null };
        } catch (err: any) {
          return { error: err };
        }
      },
      async signInWithOAuth({ provider, options }: any) {
        const next = options?.redirectTo || "/dashboard";
        window.location.href = `/api/auth/oauth/initiate?provider=${provider}&next=${encodeURIComponent(next)}`;
        return { data: null, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        fetch("/api/auth/me", { cache: "no-store" })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.user) {
              callback("SIGNED_IN", { user: data.user });
            } else {
              callback("SIGNED_OUT", null);
            }
          })
          .catch(() => {
            callback("SIGNED_OUT", null);
          });

        const handler = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          if (detail) {
            callback(detail.event, detail.session);
          }
        };

        if (typeof window !== "undefined") {
          window.addEventListener("uget-auth-change", handler);
        }

        return {
          data: {
            subscription: {
              unsubscribe() {
                if (typeof window !== "undefined") {
                  window.removeEventListener("uget-auth-change", handler);
                }
              }
            }
          }
        };
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
