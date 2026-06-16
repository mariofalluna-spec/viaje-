import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { getDb } from "./src/db/db";
import * as schema from "./src/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

export default app;

function getGeminiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("ADVERTENCIA: GEMINI_API_KEY no está configurada.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Route for Nearby Place Recommendations
// API Route for Nearby Place Recommendations
// API Route for Database Connection Check
app.get("/api/db-check", async (req, res) => {
  try {
    const db = getDb();
    console.log("[DB] Testing connection with 'SELECT 1'...");
    const result = await db.execute(sql`SELECT 1`); 
    res.json({ 
      status: "connected", 
      message: "Database is reachable from server",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[DB] Connection check failed:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Server cannot reach the database", 
      detail: error.message,
      code: error.code
    });
  }
});

// REAL LOGIN API
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ status: "error", message: "Usuario y clave son requeridos" });
  }

  try {
    console.log(`[AUTH] Login attempt for user: ${username}`);
    const db = getDb();
    
    // Check if table exists by doing a raw query or just catch the error
    const user = await db.query.users.findFirst({
      where: (users: any, { eq }: any) => eq(users.username, username)
    });

    if (user && user.password === password) {
      console.log(`[AUTH] Login successful for: ${username}`);
      res.json({ 
        status: "ok", 
        user: { id: user.id, name: user.name, username: user.username } 
      });
    } else {
      console.log(`[AUTH] Login failed: Invalid credentials for ${username}`);
      res.status(401).json({ status: "error", message: "Usuario o clave incorrectos" });
    }
  } catch (error: any) {
    console.error("[AUTH] Login error detailed:", error);
    
    // Special handling for missing table or connection issues
    if (error.message?.includes('does not exist')) {
      return res.status(500).json({ 
        status: "error", 
        message: "La base de datos no está inicializada. Ejecuta el SQL en Supabase." 
      });
    }
    
    res.status(500).json({ 
      status: "error", 
      message: "Error de conexión con la base de datos. Verifica tus credenciales." 
    });
  }
});

app.get("/api/state", async (req, res) => {
  try {
    console.log("[API] Fetching state from DB...");
    const db = getDb();
    const allFriends = await db.query.friends.findMany();
    const allDays = await db.query.tripDays.findMany();
    const allPlaces = await db.query.touristPlaces.findMany();
    const allExpenses = await db.query.expenses.findMany();
    const allSplits = await db.query.expenseSplits.findMany();
    const allConfig = await db.query.config.findMany();

    console.log(`[API] Found ${allFriends.length} friends, ${allExpenses.length} expenses.`);
    const daysWithPlaces = allDays.map(day => ({
      ...day,
      touristPlaces: allPlaces.filter(p => p.tripDayId === day.id)
    }));

    const expensesWithSplits = allExpenses.map(exp => ({
      ...exp,
      splits: allSplits.filter(s => s.expenseId === exp.id).map(s => ({ friendId: s.friendId, amount: s.amount }))
    }));

    const configMap: Record<string, string> = {};
    allConfig.forEach(c => configMap[c.key] = c.value);

    res.json({
      friends: allFriends,
      days: daysWithPlaces,
      expenses: expensesWithSplits,
      config: configMap
    });
  } catch (error: any) {
    console.error("[API] Error fetching state:", error);
    res.status(500).json({ 
      error: "Failed to fetch state", 
      detail: error.message,
      code: error.code // PG error code
    });
  }
});

app.post("/api/sync", async (req, res) => {
  try {
    console.log("[API] Syncing state requested...");
    const { friends, days, expenses: incomingExpenses, config } = req.body;
    const db = getDb();

    console.log(`[API] Syncing: ${friends?.length || 0} friends, ${incomingExpenses?.length || 0} expenses.`);

    // Direct synchronization for simplicity in this prototype
    // For a real app, granular updates are better, but here we can use upserts
    
    // Friends
    if (friends) {
      for (const f of friends) {
        await db.insert(schema.friends).values({
          id: f.id,
          name: f.name,
          avatarColor: f.avatarColor,
          avatarUrl: f.avatarUrl,
          avatarEmoji: f.avatarEmoji,
          checkInCode: f.checkInCode
        }).onConflictDoUpdate({
          target: schema.friends.id,
          set: {
            name: f.name,
            avatarColor: f.avatarColor,
            avatarUrl: f.avatarUrl,
            avatarEmoji: f.avatarEmoji,
            checkInCode: f.checkInCode
          }
        });
      }
    }

    // Days & Places
    if (days) {
      for (const d of days) {
        await db.insert(schema.tripDays).values({
          id: d.id,
          dayNumber: d.dayNumber,
          date: d.date
        }).onConflictDoUpdate({
          target: schema.tripDays.id,
          set: { dayNumber: d.dayNumber, date: d.date }
        });

        if (d.touristPlaces) {
          for (const p of d.touristPlaces) {
            await db.insert(schema.touristPlaces).values({
              id: p.id,
              tripDayId: d.id,
              name: p.name,
              description: p.description,
              timeOfDay: p.timeOfDay,
              estimatedCost: p.estimatedCost,
              isVisited: p.isVisited,
              locationName: p.locationName,
              locationUrl: p.locationUrl
            }).onConflictDoUpdate({
              target: schema.touristPlaces.id,
              set: {
                name: p.name,
                description: p.description,
                timeOfDay: p.timeOfDay,
                estimatedCost: p.estimatedCost,
                isVisited: p.isVisited,
                locationName: p.locationName,
                locationUrl: p.locationUrl
              }
            });
          }
        }
      }
    }

    // Expenses & Splits
    if (incomingExpenses) {
      for (const e of incomingExpenses) {
        await db.insert(schema.expenses).values({
          id: e.id,
          tripDayId: e.tripDayId === 'general' ? null : e.tripDayId,
          description: e.description,
          amount: e.amount,
          payerId: e.payerId,
          category: e.category,
          isSettlement: e.isSettlement,
          notes: e.notes
        }).onConflictDoUpdate({
          target: schema.expenses.id,
          set: {
            tripDayId: e.tripDayId === 'general' ? null : e.tripDayId,
            description: e.description,
            amount: e.amount,
            payerId: e.payerId,
            category: e.category,
            isSettlement: e.isSettlement,
            notes: e.notes
          }
        });

        if (e.splits) {
          // Simplest is to clear and re-insert splits for this expense
          await db.delete(schema.expenseSplits).where(eq(schema.expenseSplits.expenseId, e.id));
          for (const s of e.splits) {
            await db.insert(schema.expenseSplits).values({
              expenseId: e.id,
              friendId: s.friendId,
              amount: s.amount
            });
          }
        }
      }
    }

    // Config
    if (config) {
      for (const [key, value] of Object.entries(config)) {
        await db.insert(schema.config).values({
          key,
          value: String(value)
        }).onConflictDoUpdate({
          target: schema.config.key,
          set: { value: String(value) }
        });
      }
    }

    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("[API] Error syncing state:", error);
    res.status(500).json({ 
      error: "Failed to sync state", 
      detail: error.message,
      code: error.code 
    });
  }
});

// Deletions
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.expenses).where(eq(schema.expenses.id, req.params.id));
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

app.delete("/api/places/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.touristPlaces).where(eq(schema.touristPlaces.id, req.params.id));
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete place" });
  }
});

app.delete("/api/friends/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.friends).where(eq(schema.friends.id, req.params.id));
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete friend" });
  }
});

app.post("/api/recommendations", async (req, res) => {
  try {
    const { placeName, locationName, userLocation } = req.body;
    
    const ai = getGeminiClient();
    let prompt = "";

    if (placeName) {
      const locationContext = userLocation 
        ? `(El usuario se encuentra actualmente en las coordenadas: ${userLocation.latitude}, ${userLocation.longitude})` 
        : (locationName ? `(ubicado en ${locationName})` : `(cerca de ${placeName})`);
        
      prompt = `Como un guía turístico experto de clase mundial, sugiere exactamente 3 atracciones turísticas adicionales, miradores espectaculares, cafeterías hermosas, restaurantes locales o lugares hermosos muy cercanos a "${placeName}" ${locationContext}.
Estas recomendaciones deben ser muy cercanas físicamente, prácticas para complementar la visita a este lugar, atractivas para viajeros, y redactadas de forma impecable en español.`;
    } else if (userLocation) {
      prompt = `Como un guía turístico experto de clase mundial, el usuario se encuentra actualmente en las coordenadas GPS: ${userLocation.latitude}, ${userLocation.longitude}. 
Sugiere exactamente 5 atracciones turísticas imperdibles, monumentos, parques o lugares de interés que se encuentren muy cerca de esta ubicación exacta.
Sé específico con los nombres y proporciona una descripción útil y cautivadora en español.`;
    } else {
      return res.status(400).json({ error: "Se requiere un lugar de referencia (placeName) o una ubicación GPS (userLocation)." });
    }
      
    prompt += `
Debes devolver obligatoriamente los resultados estructurados en formato JSON válido. La respuesta debe consistir de manera estricta de un único JSON array con la siguiente estructura de datos:
[
  {
    "name": "Nombre exacto y cautivador del lugar sugerido",
    "description": "Una frase corta, atractiva y descriptiva (máximo 15 palabras) explicando por qué vale la pena.",
    "type": "Cercano | Comida | Mirador | Opcional"
  }
]

No incluyas introducciones dramáticas, ni explicaciones adicionales fuera del array, ni marcas de bloque de código markdown de tipo \`\`\`json. Devuelve única y directamente la cadena del JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "[]";
    const recommendations = JSON.parse(jsonText.trim());

    res.json({ recommendations });
  } catch (error: any) {
    console.error("Error al llamar a Gemini:", error);
    res.status(500).json({ error: error.message || "Fallo interno al procesar las sugerencias con la IA." });
  }
});

// Wrap server startup and middleware registration in an async function to avoid top-level await in CJS output
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Server] Corriendo en http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Fallo al inicializar el servidor Express:", err);
  });
}
