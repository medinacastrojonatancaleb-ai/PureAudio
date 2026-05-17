import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import ytSearch from "yt-search";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
