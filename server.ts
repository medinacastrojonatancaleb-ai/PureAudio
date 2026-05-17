import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import ytSearch from "yt-search";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json());

  // AI Recommendation Endpoint
  app.post("/api/ai/mood", async (req, res) => {
    const { prompt, age } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Act as a professional and responsible music curator. 
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
            { "title": "Song Title", "artist": "Artist Name" },
            ...
          ]
        }`,
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
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find or provide the full lyrics for the song "${title}" by "${artist}". 

        SAFETY POLICY:
        - If the lyrics contain highly explicit sexual content or extreme hate speech, return "Content unavailable due to safety policy."
        - Prefer clean versions if available.
        
        If you can provide timestamps (LRC format style, e.g. [00:12.34]Lyric line), that would be amazing. 
        If not, just return the plain text lyrics. 
        Format the response as a clean string. Do not include extra commentary, just the lyrics.`,
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

    try {
      console.log(`[Server] Searching for: ${q}`);
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
      // Since yt-search doesn't have a direct "trending" chart like the official API,
      // we search for general popular music or use a curated list.
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
