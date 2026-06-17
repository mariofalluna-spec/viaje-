import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://nypwmtupwkdayjhqnuqy.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cHdtdHVwd2tkYXlqaHFudXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NDE1MTEsImV4cCI6MjA5NzIxNzUxMX0.PlsYUt0nhjxvhrGZiukspxmiPsD6brxCO64K9O17CME";

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

  return response.json();
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

  async getState() {
    console.log("[Supabase REST] Loading full trip state...");
    const [friends, tripDays, touristPlaces, expenses, expenseSplits, config] = await Promise.all([
      request("friends?select=*"),
      request("trip_days?select=*"),
      request("tourist_places?select=*"),
      request("expenses?select=*"),
      request("expense_splits?select=*"),
      request("config?select=*")
    ]);

    // Format matches server.ts EXPECTATIONS
    const mappedFriends = toCamelCase(friends || []);
    const mappedDays = toCamelCase(tripDays || []);
    const mappedPlaces = toCamelCase(touristPlaces || []);
    const mappedExpenses = toCamelCase(expenses || []);
    const mappedSplits = toCamelCase(expenseSplits || []);
    const mappedConfig = toCamelCase(config || []);

    const daysWithPlaces = mappedDays.map((day: any) => ({
      ...day,
      touristPlaces: mappedPlaces.filter((p: any) => p.tripDayId === day.id)
    }));

    const expensesWithSplits = mappedExpenses.map((exp: any) => ({
      ...exp,
      splits: mappedSplits
        .filter((s: any) => s.expenseId === exp.id)
        .map((s: any) => ({ friendId: s.friendId, amount: s.amount }))
    }));

    const configMap: Record<string, string> = {};
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
    console.log("[Supabase REST] Starting deep sync...");

    // Sync Friends
    if (payload.friends && payload.friends.length > 0) {
      const serializedFriends = payload.friends.map(f => toSnakeCase({
        id: f.id,
        name: f.name,
        avatar_color: f.avatarColor,
        avatar_url: f.avatarUrl,
        avatar_emoji: f.avatarEmoji,
        check_in_code: f.checkInCode
      }));
      await request("friends", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify(serializedFriends)
      });
    }

    // Sync Days & Tourist Places
    if (payload.days && payload.days.length > 0) {
      const serialDays = payload.days.map(d => toSnakeCase({
        id: d.id,
        day_number: d.dayNumber,
        date: d.date
      }));
      await request("trip_days", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify(serialDays)
      });

      // Extract and format tourist places
      const allPlaces: any[] = [];
      for (const d of payload.days) {
        if (d.touristPlaces) {
          for (const p of d.touristPlaces) {
            allPlaces.push(toSnakeCase({
              id: p.id,
              trip_day_id: d.id,
              name: p.name,
              description: p.description,
              time_of_day: p.timeOfDay,
              estimated_cost: p.estimatedCost,
              is_visited: p.isVisited,
              location_name: p.locationName,
              location_url: p.locationUrl
            }));
          }
        }
      }

      if (allPlaces.length > 0) {
        await request("tourist_places", {
          method: "POST",
          headers: { "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(allPlaces)
        });
      }
    }

    // Sync Expenses and Splits
    if (payload.expenses && payload.expenses.length > 0) {
      const serialExpenses = payload.expenses.map(e => toSnakeCase({
        id: e.id,
        trip_day_id: e.tripDayId === "general" ? null : e.tripDayId,
        description: e.description,
        amount: e.amount,
        payer_id: e.payerId,
        category: e.category,
        is_settlement: e.isSettlement,
        notes: e.notes
      }));
      await request("expenses", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify(serialExpenses)
      });

      // Reload splits
      for (const e of payload.expenses) {
        if (e.splits) {
          // 1. Delete old splits for safety
          await request(`expense_splits?expense_id=eq.${e.id}`, {
            method: "DELETE"
          });
          
          if (e.splits.length > 0) {
            // 2. Insert new splits
            const serialSplits = e.splits.map((s: any) => toSnakeCase({
              expense_id: e.id,
              friend_id: s.friendId,
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
      const serialConfig = Object.entries(payload.config).map(([key, value]) => toSnakeCase({
        key,
        value: String(value)
      }));
      if (serialConfig.length > 0) {
        await request("config", {
          method: "POST",
          headers: { "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(serialConfig)
        });
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
    // Deletes the friend record
    await request(`friends?id=eq.${id}`, { method: "DELETE" });
    return { success: true };
  }
};
