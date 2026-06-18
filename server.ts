import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { supabaseClient } from "./src/db/supabaseClient.ts";

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

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
app.get(["/api/db-check", "/db-check"], async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  try {
    const result = await supabaseClient.dbCheck();
    res.json({ 
      status: "connected", 
      message: "Conectado exitosamente con Supabase (REST IPv4)",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[DB Check] REST Connection failed:", error);
    res.status(500).json({ 
      status: "error", 
      message: "No se pudo alcanzar la base de datos a través de REST", 
      detail: error.message,
      code: error.code
    });
  }
});

// REAL LOGIN API WITH SUPABASE AUTH
app.post(["/api/login", "/login"], async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ status: "error", message: "Usuario o Correo y clave son requeridos" });
  }

  try {
    console.log(`[AUTH] Login attempt for: ${username}`);
    // First try using official Supabase GoTrue Auth
    const data = await supabaseClient.loginWithSupabaseAuth(username, password);
    const authUser = data.user;
    const metadata = authUser?.user_metadata || {};
    const finalUsername = metadata.username || authUser?.email?.split("@")[0] || "usuario";

    console.log(`[AUTH] Login successful via Supabase Auth for: ${finalUsername}`);
    return res.json({ 
      status: "ok", 
      user: { 
        id: authUser?.id, 
        name: metadata.name || finalUsername, 
        username: finalUsername 
      } 
    });
  } catch (error: any) {
    console.warn("[AUTH] Supabase Auth login failed, checking fallback legacy custom table:", error.message);
    
    try {
      const user = await supabaseClient.getUser(username);
      if (user && user.password === password) {
        console.log(`[AUTH] Fallback local table login successful for: ${username}`);
        return res.json({ 
          status: "ok", 
          user: { id: user.id, name: user.name, username: user.username } 
        });
      }
    } catch (fallbackError: any) {
      console.error("[AUTH] Fallback check failed:", fallbackError.message);
    }

    if (error.message?.includes("42501")) {
      return res.status(500).json({ 
        status: "error", 
        message: "Seguridad RLS activa en Supabase. Debes ejecutar las sentencias SQL para desactivarla." 
      });
    }
    
    res.status(401).json({ 
      status: "error", 
      message: error.message || "Usuario o clave incorrectos" 
    });
  }
});

// REAL SIGNUP API VIA SUPABASE AUTH
app.post(["/api/signup", "/signup"], async (req, res) => {
  const { email, password, name, username } = req.body;
  
  if (!email || !password || !name || !username) {
    return res.status(400).json({ status: "error", message: "Correo, clave, nombre y usuario son obligatorios" });
  }

  try {
    console.log(`[AUTH] Registering user in Supabase Auth: ${email}`);
    const data = await supabaseClient.signUpWithSupabaseAuth(email, password, name, username);
    res.json({ 
      status: "ok", 
      message: "¡Usuario registrado exitosamente en Supabase Auth!",
      user: { id: data.user?.id, name, username } 
    });
  } catch (error: any) {
    console.error("[AUTH] Signup error:", error.message);
    res.status(400).json({ 
      status: "error", 
      message: error.message || "Error al crear cuenta en Supabase" 
    });
  }
});

app.get(["/api/state", "/state"], async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  try {
    console.log("[API] Fetching state from Supabase REST...");
    const state = await supabaseClient.getState();
    res.json(state);
  } catch (error: any) {
    console.error("[API] Error fetching state:", error);
    
    if (error.message?.includes("42501")) {
      return res.status(500).json({ 
        status: "error", 
        message: "Seguridad RLS de Supabase activa. Ejecuta los comandos SQL para desactivarla y permitir lectura." 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to fetch state", 
      detail: error.message
    });
  }
});

app.post(["/api/sync", "/sync"], async (req, res) => {
  try {
    console.log("[API] Syncing state via Supabase REST...");
    const { friends, days, expenses, config } = req.body;
    await supabaseClient.syncState({ friends, days, expenses, config });
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("[API] Error syncing state:", error);
    
    if (error.message?.includes("42501")) {
      return res.status(500).json({ 
        status: "error", 
        message: "Seguridad RLS de Supabase activa. Ejecuta los comandos SQL para desactivarla y permitir escritura." 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to sync state", 
      detail: error.message
    });
  }
});

// Deletions
app.delete(["/api/expenses/:id", "/expenses/:id"], async (req, res) => {
  try {
    await supabaseClient.deleteExpense(req.params.id);
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("[API] Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense", detail: error.message });
  }
});

app.delete(["/api/places/:id", "/places/:id"], async (req, res) => {
  try {
    await supabaseClient.deletePlace(req.params.id);
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("[API] Error deleting place:", error);
    res.status(500).json({ error: "Failed to delete place", detail: error.message });
  }
});

app.delete(["/api/friends/:id", "/friends/:id"], async (req, res) => {
  try {
    await supabaseClient.deleteFriend(req.params.id);
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("[API] Error deleting friend:", error);
    res.status(500).json({ error: "Failed to delete friend", detail: error.message });
  }
});


app.post(["/api/recommendations", "/recommendations"], async (req, res) => {
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
      model: "gemini-2.5-flash",
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

// REAL AI ITINERARY GENERATOR VIA GEMINI
app.post(["/api/ai-itinerary", "/ai-itinerary"], async (req, res) => {
  try {
    const { prompt: userPrompt } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: "Se requiere un texto de instrucción para el itinerario." });
    }

    const ai = getGeminiClient();

    const systemPrompt = `Actúa como un planificador de viajes premium del mundo. Diseña un itinerario completo que se ajuste exactamente o de forma muy cercana a la descripción del usuario.
Tu respuesta debe ser un objeto JSON estructurado que incluya cada día, los lugares turísticos específicos con sus horas aproximadas, descripciones y costos aproximados en la moneda adecuada.

EJEMPLO PUESTO POR EL USUARIO:
"DAME ITINEARIO QUE HACER DESDE LAS 8 AM DESDE SAO PAULO Y LA COSTA DE BRASIL HASTA LLEGAR A RIO DE JANEIRO EN 3 DIAS"

La estructura JSON devuelta debe cumplir exactamente con lo siguiente:
{
  "summary": "Breve resumen ejecutivo sobre cómo se estructuró este viaje e ideas principales (máximo 60 palabras).",
  "approximateTotalCost": 1200, // número sumando los costos estimados del viaje
  "currency": "BRL", // Moneda sugerida: "BRL" o "USD" 
  "days": [
    {
      "dayNumber": 1, // número secuencial del día (1, 2, 3...)
      "dateOffset": 0, // cuántos días después de la fecha de inicio del viaje (el día 1 tiene offset 0, el día 2 offset 1, etc.)
      "touristPlaces": [
        {
          "name": "Nombre detallado y vibrante del lugar o parada",
          "description": "Qué hacer detalladamente en esta hora de parada (máximo 25 palabras).",
          "timeOfDay": "08:00", // Formato HH:MM preferido
          "estimatedCost": 150, // Costo estimado aproximado en la moneda del viaje (un número idealizado para esta parada, p. ej., comida, boletos o pasaje)
          "locationName": "Nombre físico del lugar o ciudad de parada para mapeo posterior en GPS"
        }
      ]
    }
  ]
}

Ten en cuenta que el viaje puede pasar de ciudad a ciudad si el usuario lo indica (por ejemplo, saliendo de Sao Paulo, parando en la costa como Ubatuba, Paraty o Angra, y llegando a Río de Janeiro). Genera paradas muy realistas con horas exactas e itinerarios lógicos.

No incluyas explicaciones adicionales, ni introducciones, ni bloques markdown de tipo \`\`\`json. Devuelve estrictamente un objeto JSON que se pueda parsear directo.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const textOutput = response.text || "{}";
    const itinerary = JSON.parse(textOutput.trim());

    res.json({ itinerary });
  } catch (error: any) {
    console.error("Error al generar itinerario con Gemini:", error);
    res.status(500).json({ error: error.message || "Fallo interno al armar el itinerario con la IA." });
  }
});

// Wrap server startup and middleware registration in an async function to avoid top-level await in CJS output
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

export default app;
