import dotenv from "dotenv";

dotenv.config();

// Determine base Supabase URL: it must NOT end with trailing slashes or include /rest/v1 inside,
// because our request() function automatically appends "/rest/v1/...".
let rawUrl = (process.env.VITE_SUPABASE_URL || "https://hdyyunheifjheunlgcmr.supabase.co").trim();
rawUrl = rawUrl.replace(/\/+$/, ""); // Remove trailing slashes
if (rawUrl.endsWith("/rest/v1")) {
  rawUrl = rawUrl.substring(0, rawUrl.length - 8);
}
rawUrl = rawUrl.replace(/\/+$/, ""); // Remove any trailing slashes again

const supabaseUrl = rawUrl;
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeXl1bmhlaWZqaGV1bmxnY21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTYyMzksImV4cCI6MjA5NzIzMjIzOX0.xp5WhV4V-oX0o1Sr9sc7xQj_hg7kgwXaJen7TcANVdQ").trim();

let serverConfigMemory: Record<string, string> = {
  currentUserId: 'u_1',
  currency: 'BRL',
  budgetLimit: '1200'
};

function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  const snakeObj: any = {};
  for (const key of Object.keys(obj)) {
    // skip internal collections if needed, but maps camelCase keys to snake_case
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = toSnakeCase(obj[key]);
  }
  return snakeObj;
}

function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  const camelObj: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );
    camelObj[camelKey] = toCamelCase(obj[key]);
  }
  return camelObj;
}

async function request(path: string, options: RequestInit = {}) {
  if (!supabaseUrl || !anonKey || supabaseUrl.trim() === "" || anonKey.trim() === "") {
    throw new Error(
      "Variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY faltantes. " +
      "Por favor configúralas en la pestaña Settings -> Environment Variables tanto de AI Studio como de Vercel."
    );
  }
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "apikey": anonKey,
      "Authorization": `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    }
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.message || text;
    } catch (e) {}
    throw new Error(`Supabase REST Error [${response.status}]: ${message}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) return null;
  
  return JSON.parse(text);
}

export const supabaseClient = {
  async dbCheck() {
    try {
      // test query users table with select limit 1
      await request("users?select=id&limit=1");
      return { status: "connected", source: "Supabase REST (IPv4)" };
    } catch (error: any) {
      console.error("[Supabase REST Check Failed]:", error.message);
      throw error;
    }
  },

  async getUser(username: string) {
    const results = await request(`users?username=eq.${encodeURIComponent(username)}&select=*`);
    if (results && results.length > 0) {
      return toCamelCase(results[0]);
    }
    return null;
  },

  async signUpWithSupabaseAuth(email: string, pass: string, name: string, username: string) {
    if (!supabaseUrl || !anonKey) {
      throw new Error("Credenciales de Supabase faltantes");
    }
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "apikey": anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: pass,
        options: {
          data: {
            name,
            username
          }
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error_description || err.message || `No se pudo registrar la cuenta: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Also sync details directly into the public.users table so that our DB state matches
    try {
      const dbUser = toSnakeCase({
        id: data.user?.id || username,
        username: username,
        name: name
      });
      await request("users?on_conflict=id", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify([dbUser])
      });
    } catch (dbErr: any) {
      console.warn("[SignUp DB sync bypassed]:", dbErr.message);
    }

    return data;
  },

  async loginWithSupabaseAuth(emailOrUsername: string, pass: string) {
    if (!supabaseUrl || !anonKey) {
      throw new Error("Credenciales de Supabase faltantes");
    }

    let email = emailOrUsername;
    // If it's a username (no '@'), try to get the matching email from the users table.
    // If they registered with email/pass directly, we can use it.
    if (!emailOrUsername.includes("@")) {
      const dbUser = await this.getUser(emailOrUsername);
      if (dbUser && dbUser.id) {
        // If DB user exists, but we only have username and legacy password inside DB,
        // we can authenticate with legacy password if it matches.
        if (dbUser.password === pass) {
          return {
            user: {
              id: dbUser.id,
              email: `${dbUser.username}@example.com`,
              user_metadata: {
                name: dbUser.name,
                username: dbUser.username
              }
            }
          };
        }
      }
      // If we don't have email domain, fallback to username@como.com or similar,
      // or try authenticating as email directly.
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: pass
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error_description || err.message || `Clave o correo inválido en Supabase Auth.`);
    }

    const data = await response.json();
    
    // Auto-sync authenticated user to public.users on login if not present
    try {
      const meta = data.user?.user_metadata || {};
      const username = meta.username || data.user?.email?.split("@")[0] || "user";
      const name = meta.name || username;
      
      const dbUser = toSnakeCase({
        id: data.user?.id,
        username,
        name
      });
      await request("users?on_conflict=id", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify([dbUser])
      });
    } catch (dbErr: any) {
      console.warn("[Login DB sync bypassed]:", dbErr.message);
    }

    return data;
  },

  async getState() {
    console.log("[Supabase REST] Loading full trip state...");
    const results = await Promise.all([
      request("friends?select=*").catch(e => { console.error("Error fetching friends:", e); return []; }),
      request("trip_days?select=*").catch(e => { console.error("Error fetching trip_days:", e); return []; }),
      request("tourist_places?select=*").catch(e => { console.error("Error fetching tourist_places:", e); return []; }),
      request("expenses?select=*").catch(e => { console.error("Error fetching expenses:", e); return []; }),
      request("expense_splits?select=*").catch(e => { console.error("Error fetching expense_splits:", e); return []; }),
      request("config?select=*").catch(e => { console.error("Error fetching config:", e); return []; })
    ]);
    const [friends, tripDays, touristPlaces, expenses, expenseSplits, config] = results;

    // Format matches server.ts EXPECTATIONS
    const mappedFriendsRaw = toCamelCase(friends || []);
    const mappedFriends = Array.from(new Map(mappedFriendsRaw.map((f: any) => [f.id, f])).values());

    const mappedDaysRaw = toCamelCase(tripDays || []);
    const mappedDays = Array.from(new Map(mappedDaysRaw.map((d: any) => [d.id, d])).values());

    const mappedPlacesRaw = toCamelCase(touristPlaces || []);
    const mappedPlaces = Array.from(new Map(mappedPlacesRaw.map((p: any) => [p.id, p])).values());

    const mappedExpensesRaw = toCamelCase(expenses || []);
    const mappedExpenses = Array.from(new Map(mappedExpensesRaw.map((e: any) => [e.id, e])).values());

    const mappedSplits = toCamelCase(expenseSplits || []);
    const mappedConfig = toCamelCase(config || []);

    const daysWithPlaces = mappedDays.map((day: any) => ({
      ...day,
      touristPlaces: mappedPlaces.filter((p: any) => p.tripDayId === day.id)
    }));

    const expensesWithSplits = mappedExpenses.map((exp: any) => {
      const rawSplits = mappedSplits
        .filter((s: any) => s.expenseId === exp.id)
        .map((s: any) => ({ friendId: s.friendId, amount: s.amount }));
      // Deduplicate splits by friendId to prevent duplicate items from DB rows
      const uniqueSplits = Array.from(new Map(rawSplits.map((s: any) => [s.friendId, s])).values());
      return {
        ...exp,
        splits: uniqueSplits
      };
    });

    const configMap: Record<string, string> = { ...serverConfigMemory };
    mappedConfig.forEach((c: any) => {
      configMap[c.key] = c.value;
    });

    return {
      friends: mappedFriends,
      days: daysWithPlaces,
      expenses: expensesWithSplits,
      config: configMap
    };
  },

  async syncState(payload: { friends?: any[]; days?: any[]; expenses?: any[]; config?: Record<string, string> }) {
    console.log("[Supabase REST] Starting deep dynamic mirror sync...");

    // 1. ANALYZE AND FIX REFERENTIAL INTEGRITY (PAYER_ID & SPLITS FRIEND_ID)
    // Identify all friend IDs referenced in expenses or splits to ensure they exist in friends table
    const referencedFriendIds = new Set<string>();
    if (payload.expenses) {
      for (const e of payload.expenses) {
        const pid = e.payerId || e.payer_id;
        if (pid) {
          referencedFriendIds.add(pid);
        }
        const spl = e.splits || e.expenseSplits;
        if (spl) {
          for (const s of spl) {
            const fid = s.friendId || s.friend_id;
            if (fid) {
              referencedFriendIds.add(fid);
            }
          }
        }
      }
    }

    const payloadFriends = payload.friends || [];
    const payloadFriendIds = new Set(payloadFriends.map(f => f.id || f.friend_id || ""));
    const friendsToSync = [...payloadFriends];

    // Satisfy database foreign keys with temporary placeholders if any referenced friend ID is missing
    for (const refId of referencedFriendIds) {
      if (!refId) continue;
      if (!payloadFriendIds.has(refId)) {
        console.warn(`[Sync Integrity] Referenced friend ID "${refId}" not in payload. Creating placeholder friend to prevent Foreign Key constraints error.`);
        friendsToSync.push({
          id: refId,
          name: refId.startsWith("u_") ? `Viajero ${refId.substring(2)}` : `Invitado ${refId.substring(0, 4)}`,
          avatarColor: 'bg-zinc-650',
          avatarUrl: null,
          avatarEmoji: '✈️',
          checkInCode: null
        });
      }
    }

    // 2. DELETE ORPHANS (Deleted friends, days, tourist places, and expenses)
    // This is crucial, otherwise deleted/modified records remain in the database
    // and reappear whenever the app reloads or polls!

    // A. Delete obsolete expenses and splits first
    try {
      const dbExpenses = await request("expenses?select=id");
      const payloadExpenseIds = new Set((payload.expenses || []).map(e => e.id));
      for (const dbE of dbExpenses) {
        if (!payloadExpenseIds.has(dbE.id)) {
          console.log(`[Sync Cleanup] Deleting obsolete expense and splits: ${dbE.id}`);
          await request(`expense_splits?expense_id=eq.${dbE.id}`, { method: "DELETE" }).catch(() => {});
          await request(`expenses?id=eq.${dbE.id}`, { method: "DELETE" }).catch(() => {});
        }
      }
    } catch (e: any) {
      console.warn("[Sync Cleanup] Warn checking/deleting extra expenses:", e.message);
    }

    // B. Delete obsolete tourist places
    try {
      const payloadPlaceIds = new Set();
      if (payload.days) {
        for (const d of payload.days) {
          if (d.touristPlaces) {
            for (const p of d.touristPlaces) {
              payloadPlaceIds.add(p.id);
            }
          }
        }
      }
      const dbPlaces = await request("tourist_places?select=id");
      for (const dbP of dbPlaces) {
        if (!payloadPlaceIds.has(dbP.id)) {
          console.log(`[Sync Cleanup] Deleting obsolete tourist place: ${dbP.id}`);
          await request(`tourist_places?id=eq.${dbP.id}`, { method: "DELETE" }).catch(() => {});
        }
      }
    } catch (e: any) {
      console.warn("[Sync Cleanup] Warn checking/deleting extra tourist places:", e.message);
    }

    // C. Delete obsolete trip days
    try {
      const dbDays = await request("trip_days?select=id");
      const payloadDayIds = new Set((payload.days || []).map(d => d.id));
      for (const dbD of dbDays) {
        if (!payloadDayIds.has(dbD.id)) {
          console.log(`[Sync Cleanup] Deleting obsolete trip day: ${dbD.id}`);
          await request(`tourist_places?trip_day_id=eq.${dbD.id}`, { method: "DELETE" }).catch((e) => console.error("Error deleting tourist places:", e));
          // Expired day delete logic shouldn't try deleting expenses by non-existent column trip_day_id. 
          // Let's remove the expenses delete line.
          await request(`trip_days?id=eq.${dbD.id}`, { method: "DELETE" }).catch((e) => console.error("Error deleting trip day:", e));
        }
      }
    } catch (e: any) {
      console.warn("[Sync Cleanup] Warn checking/deleting extra trip days:", e.message);
    }

    // D. Delete obsolete friends
    try {
      const dbFriends = await request("friends?select=id");
      const activeIds = new Set(friendsToSync.map(f => f.id));
      for (const dbF of dbFriends) {
        if (!activeIds.has(dbF.id)) {
          console.log(`[Sync Cleanup] Deleting obsolete friend: ${dbF.id}`);
          await request(`expense_splits?friend_id=eq.${dbF.id}`, { method: "DELETE" }).catch((e) => console.error("Error deleting expense splits:", e));
          await request(`expenses?payer_id=eq.${dbF.id}`, { method: "DELETE" }).catch((e) => console.error("Error deleting expenses:", e));
          await request(`friends?id=eq.${dbF.id}`, { method: "DELETE" }).catch((e) => console.error("Error deleting friend:", e));
        }
      }
    } catch (e: any) {
      console.warn("[Sync Cleanup] Warn checking/deleting extra friends:", e.message);
    }

    // 3. UPSERT ACTIVE RECORDS

    // Sync Friends (using complete friendsToSync)
    if (friendsToSync.length > 0) {
      const serializedFriends = friendsToSync.map(f => toSnakeCase({
        id: f.id || null,
        user_id: f.userId || null,
        name: f.name || null,
        avatar_color: f.avatarColor || 'default', // avatar_color is not nullable in schema
        avatar_url: f.avatarUrl || null,
        avatar_emoji: f.avatarEmoji || null,
        check_in_code: f.checkInCode || null
      }));
      console.log("[Supabase REST] Syncing friends, count:", serializedFriends.length);
      try {
        await request("friends?on_conflict=id", {
          method: "POST",
          headers: { 
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(serializedFriends)
        });
      } catch (e: any) {
        console.error("[Supabase REST] ERROR syncing friends:", e.message);
        throw e;
      }
    }

    // Sync Days & Tourist Places
    if (payload.days && payload.days.length > 0) {
      const serialDays = payload.days.map(d => toSnakeCase({
        id: d.id || null,
        day_number: d.dayNumber ?? null,
        date: d.date || null
      }));
      console.log("[Supabase REST] Syncing trip_days, count:", serialDays.length);
      try {
        await request("trip_days?on_conflict=id", {
          method: "POST",
          headers: { 
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(serialDays)
        });
      } catch (e: any) {
        console.error("[Supabase REST] ERROR syncing trip_days:", e.message);
        throw e;
      }

      // Extract and format tourist places day-by-day
      for (const d of payload.days) {
        if (d.touristPlaces && d.touristPlaces.length > 0) {
          const placesForDay = d.touristPlaces.map(p => toSnakeCase({
            id: p.id || null,
            trip_day_id: d.id || null,
            name: p.name || null,
            description: p.description || null,
            time_of_day: p.timeOfDay || null,
            estimated_cost: p.estimatedCost ?? null,
            is_visited: p.isVisited ?? null,
            location_name: p.locationName || null,
            location_url: p.locationUrl || null
          }));
          
          console.log(`[Supabase REST] Syncing tourist_places for day ${d.id}, count: ${placesForDay.length}`);
          try {
            await request("tourist_places?on_conflict=id", {
              method: "POST",
              headers: { 
                "Prefer": "resolution=merge-duplicates"
              },
              body: JSON.stringify(placesForDay)
            });
          } catch (e: any) {
            console.error(`[Supabase REST] ERROR syncing tourist_places for day ${d.id}:`, e.message);
            throw e; 
          }
        }
      }
    }

    // Sync Expenses and Splits
    if (payload.expenses && payload.expenses.length > 0) {
      const serialExpenses = payload.expenses.map(e => toSnakeCase({
        id: e.id || null,
        trip_day_id: e.tripDayId === "general" ? null : (e.tripDayId || e.trip_day_id || null),
        description: e.description || null,
        amount: e.amount ?? null,
        payer_id: e.payerId || e.payer_id || null,
        category: e.category || null,
        is_settlement: e.isSettlement ?? e.is_settlement ?? null,
        notes: e.notes || null
      }));
      await request("expenses?on_conflict=id", {
        method: "POST",
        headers: { 
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(serialExpenses)
      });

      // Reload splits
      for (const e of payload.expenses) {
        const splitsList = e.splits || e.expense_splits || e.expenseSplits;
        if (splitsList) {
          // 1. Delete old splits for safety
          await request(`expense_splits?expense_id=eq.${e.id}`, {
            method: "DELETE"
          });
          
          if (splitsList.length > 0) {
            // 2. Insert new splits
            const serialSplits = splitsList.map((s: any) => toSnakeCase({
              id: crypto.randomUUID(), // add generated UUID
              expense_id: e.id,
              friend_id: s.friendId || s.friend_id,
              amount: s.amount
            }));
            await request("expense_splits", {
              method: "POST",
              body: JSON.stringify(serialSplits)
            });
          }
        }
      }
    }

    // Sync Config settings
    if (payload.config) {
      // Keep copy in fallback memory to survive connection/table caching schema errors
      Object.assign(serverConfigMemory, payload.config);

      const serialConfig = Object.entries(payload.config).map(([key, value]) => toSnakeCase({
        key,
        value: String(value)
      }));
      if (serialConfig.length > 0) {
        try {
          await request("config?on_conflict=key", {
            method: "POST",
            headers: { "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify(serialConfig)
          });
        } catch (e) {
          console.log("[Supabase REST] Handled config save fallback using memory.");
        }
      }
    }

    return { success: true };
  },

  async deleteExpense(id: string) {
    // Splits will automatically cascade-delete if reference integrity is active,
    // but we can delete them explicitly as well to prevent any reference issues
    await request(`expense_splits?expense_id=eq.${id}`, { method: "DELETE" }).catch(() => {});
    await request(`expenses?id=eq.${id}`, { method: "DELETE" });
    return { success: true };
  },

  async deletePlace(id: string) {
    await request(`tourist_places?id=eq.${id}`, { method: "DELETE" });
    return { success: true };
  },

  async deleteFriend(id: string) {
    // Delete associated splits and expenses where friend is payer first to satisfy foreign keys
    await request(`expense_splits?friend_id=eq.${id}`, { method: "DELETE" }).catch(() => {});
    await request(`expenses?payer_id=eq.${id}`, { method: "DELETE" }).catch(() => {});
    // Deletes the friend record
    await request(`friends?id=eq.${id}`, { method: "DELETE" });
    return { success: true };
  }
};
