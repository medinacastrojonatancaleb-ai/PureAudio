import express from "express";
import path from "path";
import fs from "fs";
import ytSearch from "yt-search";
import { GoogleGenAI } from "@google/genai";

const PORT = process.env.PORT || 3000;

// In-memory cache for API results
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

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

  // Fallback generation helper to ensure 100% availability and bypass "high demand" errors.
  async function generateWithFallback(params: any) {
    const models = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3-flash-preview"];
    let lastError = null;
    for (const model of models) {
      try {
        console.log(`[Server] Trying generative AI model: ${model}`);
        const response = await genAI.models.generateContent({
          ...params,
          model,
        });
        if (response && response.text) {
          console.log(`[Server] Model ${model} succeeded!`);
          return response;
        }
      } catch (err: any) {
        console.warn(`[Server] Model ${model} failed:`, err.message || err);
        lastError = err;
      }
    }
    throw lastError || new Error("All Gemini models failed.");
  }

  app.use(express.json());

  // Simple CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString()
    });
  });

  // AI Recommendation Endpoint
  app.post("/api/ai/mood", async (req, res) => {
    const { prompt, age } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
      if (!geminiKey) {
        return res.status(503).json({ error: "AI features are currently unavailable (Missing API Key)" });
      }
      const response = await generateWithFallback({
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
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
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
      const response = await generateWithFallback({
        contents: `Find or provide the full lyrics for the song "${title}" by "${artist}". 

        SAFETY POLICY:
        - If the lyrics contain highly explicit sexual content or extreme hate speech, return "Content unavailable due to safety policy."
        - Prefer clean versions if available.
        
        If you can provide timestamps (LRC format style, e.g. [00:12.34]Lyric line), that would be amazing. 
        If not, just return the plain text lyrics. 
        Format the response as a clean string. Do not include extra commentary, just the lyrics.`
      });

      const lyrics = response.text?.trim() || "No lyrics found.";
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

    const cacheKey = `search_${q}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      // Use raw query for global search to avoid steering the algorithm too much
      const results = await ytSearch(q);
      if (!results || !results.videos || results.videos.length === 0) {
        console.warn(`[Server] No results for search: ${q}`);
        return res.json([]);
      }
      const videos = results.videos.slice(0, 20).map(video => ({
        id: video.videoId,
        title: video.title,
        artist: video.author.name,
        thumbnail: video.image,
        duration: video.timestamp,
        views: video.views
      }));
      setCache(cacheKey, videos);
      res.json(videos);
    } catch (error) {
      console.error("[Server] Search error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  app.get("/api/trending", async (req, res) => {
    const cacheKey = "trending_music";
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      console.log("[Server] Fetching trending...");
      const queries = ["trending music 2024", "top hits 2024", "lofi hip hop"];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const results = await ytSearch(randomQuery);
      if (!results || !results.videos || results.videos.length === 0) {
        console.warn("[Server] ytSearch returned no results, using fallbacks");
        // Fallback tracks if search fails (e.g. data center IP blocking)
        return res.json([
          { id: "jfKfPfyJRdk", title: "lofi hip hop radio - beats to relax/study to", artist: "Lofi Girl", thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg", duration: "LIVE" },
          { id: "5qap5aO4i9A", title: "lofi hip hop radio - beats to sleep/chill to", artist: "Lofi Girl", thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg", duration: "LIVE" },
          { id: "DWcUYeeTclg", title: "Rainy Night in Tokyo", artist: "Lofi Girl", thumbnail: "https://i.ytimg.com/vi/DWcUYeeTclg/hqdefault.jpg", duration: "3:45" }
        ]);
      }
      const videos = results.videos.slice(0, 20).map(video => ({
        id: video.videoId,
        title: video.title,
        artist: video.author.name,
        thumbnail: video.image,
        duration: video.timestamp
      }));
      setCache(cacheKey, videos);
      res.json(videos);
    } catch (error) {
      console.error("[Server] Trending error:", error);
      res.status(500).json({ error: "Failed to fetch trending", details: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.get("/api/artist/:name", async (req, res) => {
    const { name } = req.params;
    const cacheKey = `artist_${name.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      // Searching with "songs" is generally good for getting a track list
      const results = await ytSearch(name + " songs");
      if (!results || !results.videos || results.videos.length === 0) {
        console.warn(`[Server] No results for artist: ${name}`);
        return res.json([]);
      }

      const normalizedSearchName = name.toLowerCase().trim();
      const searchWords = normalizedSearchName.split(/\s+/).filter(w => w.length > 2);
      
      const videos = results.videos
        .filter(video => {
          const lowerTitle = video.title.toLowerCase();
          const lowerAuthor = (video.author?.name || "").toLowerCase();
          
          // 1. Priority: Channel/Author matching
          const nameInAuthor = lowerAuthor.includes(normalizedSearchName) || 
                               lowerAuthor.replace(/\s+/g, '').includes(normalizedSearchName.replace(/\s+/g, ''));
          
          // 2. Official Sources (Topic channels or Vevo)
          const isOfficialSource = lowerAuthor.includes("- topic") || lowerAuthor.includes("vevo");
          const nameInTitle = lowerTitle.includes(normalizedSearchName);

          // 3. Fuzzy author match for typos (handles "josean log" vs "joseang long")
          const authorWords = lowerAuthor.split(/\s+/).filter(w => w.length > 2);
          const matchedWordsCount = searchWords.length > 0 ? searchWords.filter(sw => 
            authorWords.some(aw => aw.includes(sw) || sw.includes(aw))
          ).length : 0;
          const isFuzzyArtist = searchWords.length > 0 && matchedWordsCount >= Math.ceil(searchWords.length * 0.8);

          // 4. Exclude irrelevant content
          const isIrrelevant = lowerTitle.includes("karaoke") || 
                               lowerTitle.includes("instrumental") ||
                               lowerTitle.includes("cover by") ||
                               lowerTitle.includes("parody") ||
                               lowerTitle.includes("fan made") ||
                               lowerTitle.includes("full album");

          // Stricter condition: Must be from a channel matching the name, 
          // or an official source that mentions the name in the title.
          const isCorrectArtist = nameInAuthor || isFuzzyArtist || (isOfficialSource && nameInTitle);
          
          return isCorrectArtist && !isIrrelevant;
        })
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 50)
        .map(video => ({
          id: video.videoId,
          title: video.title,
          artist: video.author.name,
          thumbnail: video.image,
          duration: video.timestamp,
          views: video.views
        }));

      setCache(cacheKey, videos);
      res.json(videos);
    } catch (error) {
      console.error("[Server] Artist error:", error);
      res.status(500).json({ error: "Failed to fetch artist tracks" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Only serve static files if NOT on Vercel (Vercel handles static files itself)
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
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
export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      console.log("[Server] Initializing app instance...");
      appInstance = await createServer();
    }
    // Express app is essentially a function (req, res)
    return appInstance(req, res);
  } catch (err) {
    console.error("[Server] Vercel handler fatal error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err instanceof Error ? err.message : String(err) 
    });
  }
}
