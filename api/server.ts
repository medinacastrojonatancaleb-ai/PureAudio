import express from "express";
import path from "path";
import ytSearch from "yt-search";
import { GoogleGenAI } from "@google/genai";

const PORT = process.env.PORT || 3000;

export async function createServer() {
  const app = express();

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.warn("[Server] WARNING: GEMINI_API_KEY is not set. AI features will fail.");
  }

  const genAI = new GoogleGenAI({
    apiKey: geminiKey || "stub-key",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json());

  // Simple CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // AI Recommendation Endpoint
  app.post("/api/ai/mood", async (req, res) => {
    const { prompt, age } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
      if (!geminiKey) {
        return res.status(503).json({ error: "AI features are currently unavailable (Missing API Key)" });
      }
      const response = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent({
        contents: [{ role: 'user', parts: [{ text: `Act as a professional and responsible music curator. 
        User is ${age ? age + " years old" : "an adult"}.
        Based on the following mood or description: "${prompt}", suggest 8 real songs that fit perfectly.

        CRITICAL SAFETY RULES:
        - Suggest ONLY clean, non-explicit songs.
        - ABSOLUTELY NO songs with sexual, violent, or highly offensive lyrics.
        - Ensure the content is appropriate for all audiences (Family Friendly).
        - If the user's prompt is inherently inappropriate (sexual, hateful, etc.), return an empty tracks list.

        Return ONLY a JSON object with the following structure:
        {
          "tracks": [
            { "title": "Song Title", "artist": "Artist Name" }
          ]
        }`}]}],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const text = response.response.text();
      if (!text) throw new Error("Empty response from AI");
      
      const aiData = JSON.parse(text);

      // Now search each track on YouTube
      const tracks = await Promise.all(
        aiData.tracks.map(async (t: { title: string; artist: string }) => {
          try {
            const search = await ytSearch(`${t.title} ${t.artist}`);
            const video = search.videos[0];
            if (video) {
              return {
                id: video.videoId,
                title: video.title,
                artist: video.author.name,
                thumbnail: video.image,
                duration: video.timestamp
              };
            }
            return null;
          } catch (e) {
            return null;
          }
        })
      );

      res.json(tracks.filter(t => t !== null));
    } catch (error) {
      console.error("[Server] AI Mood error:", error);
      res.status(500).json({ error: "AI recommendation failed" });
    }
  });

  // AI Lyrics Endpoint
  app.get("/api/lyrics", async (req, res) => {
    const { title, artist } = req.query;
    if (!title) return res.status(400).json({ error: "Title is required" });

    try {
      if (!geminiKey) {
        return res.json({ lyrics: "AI Features disabled. Please set GEMINI_API_KEY." });
      }
      const response = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(`Find or provide the full lyrics for the song "${title}" by "${artist}". 

        SAFETY POLICY:
        - If the lyrics contain highly explicit sexual content or extreme hate speech, return "Content unavailable due to safety policy."
        - Prefer clean versions if available.
        
        If you can provide timestamps (LRC format style, e.g. [00:12.34]Lyric line), that would be amazing. 
        If not, just return the plain text lyrics. 
        Format the response as a clean string. Do not include extra commentary, just the lyrics.`);

      const lyrics = response.response.text()?.trim() || "No lyrics found.";
      res.json({ lyrics });
    } catch (error) {
      console.error("[Server] Lyrics error:", error);
      res.status(500).json({ error: "Failed to fetch lyrics" });
    }
  });

  // API Routes
  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
      const results = await ytSearch(q + " music");
      const videos = results.videos.slice(0, 15).map(video => ({
        id: video.videoId,
        title: video.title,
        artist: video.author.name,
        thumbnail: video.image,
        duration: video.timestamp,
        views: video.views
      }));
      res.json(videos);
    } catch (error) {
      console.error("[Server] Search error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  app.get("/api/trending", async (req, res) => {
    try {
      const queries = ["trending music 2024", "top hits 2024", "lofi hip hop"];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const results = await ytSearch(randomQuery);
      const videos = results.videos.slice(0, 20).map(video => ({
        id: video.videoId,
        title: video.title,
        artist: video.author.name,
        thumbnail: video.image,
        duration: video.timestamp
      }));
      res.json(videos);
    } catch (error) {
      console.error("[Server] Trending error:", error);
      res.status(500).json({ error: "Failed to fetch trending" });
    }
  });
  
  app.get("/api/artist/:name", async (req, res) => {
    const { name } = req.params;
    try {
      const results = await ytSearch(name + " songs");
      const videos = results.videos.slice(0, 10).map(video => ({
        id: video.videoId,
        title: video.title,
        artist: video.author.name,
        thumbnail: video.image,
        duration: video.timestamp
      }));
      res.json(videos);
    } catch (error) {
      console.error("[Server] Artist error:", error);
      res.status(500).json({ error: "Failed to fetch artist tracks" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Start listener if NOT in a serverless environment
if (process.env.NODE_ENV !== 'production' || (!process.env.VERCEL && !process.env.AWS_LAMBDA)) {
  createServer().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  });
}

// Cache for serverless execution
let appInstance: any = null;

// Export a handler for Vercel
export default async (req: any, res: any) => {
  if (!appInstance) {
    appInstance = await createServer();
  }
  return appInstance(req, res);
};
