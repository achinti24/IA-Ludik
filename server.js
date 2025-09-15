import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Ruta para generar taller
app.post("/api/generar-taller", async (req, res) => {
  try {
    const { perfil, tema, nivel, cantidad } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Eres un generador de talleres inclusivos." },
          { role: "user", content: `imagina que eres un profesor especializado en ${perfil}, y en base a esto genera una actividad ya lista para realizar, que no sea solo instrucciones si no que ya tenag el taller completo para solo realizarlo sobre ${tema}, para un estudiante de nivel de ${nivel}, con ${cantidad} ejercicios.` }
        ]
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ Error de Groq:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    res.json({ taller: data.choices[0].message.content });
  } catch (error) {
    console.error("❌ Error en el servidor:", error);
    res.status(500).json({ error: error.message });
  }
});

// Servir frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
