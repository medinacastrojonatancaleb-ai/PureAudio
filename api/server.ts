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
    const models = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash"
    ];
    let lastError = null;
    for (const model of models) {
      let attempts = 2; // Try up to 2 times for each model if we hit rate limits (429)
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`[Server] Trying generative AI model: ${model} (attempt ${attempt}/${attempts})`);
          
          // Only include thinkingConfig for Gemini 3 series models
          const config: any = {
            ...params.config,
          };
          if (model.startsWith("gemini-3")) {
            config.thinkingConfig = {
              thinkingLevel: "MINIMAL"
            };
          } else {
            // gemini-2.x fallback models do not support googleSearch tool configuration
            if (config.tools) {
              delete config.tools;
            }
          }

          const response = await genAI.models.generateContent({
            ...params,
            model,
            config
          });
          if (response && response.text) {
            console.log(`[Server] Model ${model} succeeded!`);
            return response;
          }
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isRateLimit = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("quota");
          
          if (isRateLimit) {
            console.warn(`[Server] Model ${model} failed on attempt ${attempt}: Quota/Rate limit exceeded (RESOURCE_EXHAUSTED).`);
            if (attempt < attempts) {
              const delay = attempt * 1000; // 1s, then 2s
              console.log(`[Server] Waiting ${delay}ms before retrying ${model}...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // retry
            }
          } else {
            console.warn(`[Server] Model ${model} failed on attempt ${attempt}:`, errMsg);
          }
          lastError = err;
          break; // break the attempt loop to try next model
        }
      }
    }
    throw lastError || new Error("All Gemini models failed.");
  }

  // Procedural fallback catalog for 100% availability in case of model limitations
  function getThematicFallback(prompt: string): any[] {
    const p = (prompt || "").toLowerCase();
    
    // Rainy / Melancholic / Acoustic
    if (
      p.includes("rain") || p.includes("lluv") || p.includes("triste") || 
      p.includes("sad") || p.includes("melanc") || p.includes("acurruc") || 
      p.includes("maverick") || p.includes("kaarl") || p.includes("acoustic")
    ) {
      return [
        { id: "gJnQX-87-hs", title: "San Lucas", artist: "Kevin Kaarl", thumbnail: "https://i.ytimg.com/vi/gJnQX-87-hs/hqdefault.jpg", duration: "4:12" },
        { id: "7d_oSTrLpRE", title: "Fuentes de Ortiz", artist: "Ed Maverick", thumbnail: "https://i.ytimg.com/vi/7d_oSTrLpRE/hqdefault.jpg", duration: "3:33" },
        { id: "oG_T42t00wQ", title: "Chachachá", artist: "Josean Log", thumbnail: "https://i.ytimg.com/vi/oG_T42t00wQ/hqdefault.jpg", duration: "3:28" },
        { id: "sSMvE7h9pLI", title: "Vámonos a Marte", artist: "Kevin Kaarl", thumbnail: "https://i.ytimg.com/vi/sSMvE7h9pLI/hqdefault.jpg", duration: "3:34" },
        { id: "w7jG8V_3hGg", title: "Acurrucar", artist: "Ed Maverick", thumbnail: "https://i.ytimg.com/vi/w7jG8V_3hGg/hqdefault.jpg", duration: "4:00" },
        { id: "fS_TevS_I8Y", title: "Disfruto", artist: "Carla Morrison", thumbnail: "https://i.ytimg.com/vi/fS_TevS_I8Y/hqdefault.jpg", duration: "4:05" },
        { id: "vVOnH6bnd0M", title: "Labios Rotos", artist: "Zoé", thumbnail: "https://i.ytimg.com/vi/vVOnH6bnd0M/hqdefault.jpg", duration: "4:20" },
        { id: "vAOk7pY7F9I", title: "Únicos", artist: "Siddhartha", thumbnail: "https://i.ytimg.com/vi/vAOk7pY7F9I/hqdefault.jpg", duration: "4:15" }
      ];
    }
    
    // Focus / Study / Coding / Lofi
    if (
      p.includes("focus") || p.includes("cod") || p.includes("program") || 
      p.includes("lofi") || p.includes("estud") || p.includes("study") || 
      p.includes("deep") || p.includes("relax")
    ) {
      return [
        { id: "jfKfPfyJRdk", title: "lofi hip hop radio - beats to relax/study to", artist: "Lofi Girl", thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg", duration: "LIVE" },
        { id: "5qap5aO4i9A", title: "lofi hip hop radio - beats to sleep/chill to", artist: "Lofi Girl", thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg", duration: "LIVE" },
        { id: "7T767k30X_E", title: "Affection", artist: "Jinsang", thumbnail: "https://i.ytimg.com/vi/7T767k30X_E/hqdefault.jpg", duration: "4:04" },
        { id: "dw_0P768S4c", title: "Sunset Lover", artist: "Petit Biscuit", thumbnail: "https://i.ytimg.com/vi/dw_0P768S4c/hqdefault.jpg", duration: "3:57" },
        { id: "N_0v9fR7Lko", title: "Chamber of Reflection", artist: "Mac DeMarco", thumbnail: "https://i.ytimg.com/vi/N_0v9fR7Lko/hqdefault.jpg", duration: "3:52" },
        { id: "5fR_2P9Eru4", title: "Feather", artist: "Nujabes", thumbnail: "https://i.ytimg.com/vi/5fR_2P9Eru4/hqdefault.jpg", duration: "2:55" }
      ];
    }
    
    // Gym / Workout / Electronic / Phonk
    if (
      p.includes("gym") || p.includes("hype") || p.includes("energ") || 
      p.includes("phonk") || p.includes("heavy") || p.includes("lift") ||
      p.includes("ejercicio") || p.includes("entren")
    ) {
      return [
        { id: "w-sQZof_w3Y", title: "Murder In My Mind", artist: "KORDHELL", thumbnail: "https://i.ytimg.com/vi/w-sQZof_w3Y/hqdefault.jpg", duration: "2:24" },
        { id: "U-F42Ua_r6U", title: "Sahara", artist: "Hensonn", thumbnail: "https://i.ytimg.com/vi/U-F42Ua_r6U/hqdefault.jpg", duration: "2:51" },
        { id: "v233-r6r8fI", title: "Close Eyes", artist: "DVRST", thumbnail: "https://i.ytimg.com/vi/v233-r6r8fI/hqdefault.jpg", duration: "2:12" },
        { id: "FGBhQAkFHWY", title: "One More Time", artist: "Daft Punk", thumbnail: "https://i.ytimg.com/vi/FGBhQAkFHWY/hqdefault.jpg", duration: "5:20" },
        { id: "7rA18968Rro", title: "Breathe", artist: "The Prodigy", thumbnail: "https://i.ytimg.com/vi/7rA18968Rro/hqdefault.jpg", duration: "3:59" }
      ];
    }
    
    // Sunset / Chill / Beach / Surf / Indie
    if (
      p.includes("sunset") || p.includes("atardecer") || p.includes("playa") || 
      p.includes("beach") || p.includes("surf") || p.includes("indie") ||
      p.includes("chill") || p.includes("sol")
    ) {
      return [
        { id: "gBrp05e8eY0", title: "Freaks", artist: "Surf Curse", thumbnail: "https://i.ytimg.com/vi/gBrp05e8eY0/hqdefault.jpg", duration: "2:26" },
        { id: "3pA9WfX4e8c", title: "Heart to Heart", artist: "Mac DeMarco", thumbnail: "https://i.ytimg.com/vi/3pA9WfX4e8c/hqdefault.jpg", duration: "3:31" },
        { id: "N_0v9fR7Lko", title: "Chamber of Reflection", artist: "Mac DeMarco", thumbnail: "https://i.ytimg.com/vi/N_0v9fR7Lko/hqdefault.jpg", duration: "3:52" },
        { id: "S_MvExK9eS0", title: "I Love You So", artist: "The Walters", thumbnail: "https://i.ytimg.com/vi/S_MvExK9eS0/hqdefault.jpg", duration: "2:40" },
        { id: "wIuBcb241CZ", title: "My Kind of Woman", artist: "Mac DeMarco", thumbnail: "https://i.ytimg.com/vi/wIuBcb241CZ/hqdefault.jpg", duration: "3:11" }
      ];
    }
    
    // Cyberpunk / Retro / Synthwave / Neon
    if (
      p.includes("cyber") || p.includes("synth") || p.includes("futur") || 
      p.includes("retro") || p.includes("industrial") || p.includes("neon")
    ) {
      return [
        { id: "MV_3Dpw-BRY", title: "Nightcall", artist: "Kavinsky", thumbnail: "https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg", duration: "4:18" },
        { id: "rDBbaGCCIhk", title: "Sunset", artist: "The Midnight", thumbnail: "https://i.ytimg.com/vi/rDBbaGCCIhk/hqdefault.jpg", duration: "5:36" },
        { id: "8GW6sLrK40k", title: "Resonance", artist: "Home", thumbnail: "https://i.ytimg.com/vi/8GW6sLrK40k/hqdefault.jpg", duration: "3:32" },
        { id: "qy9W0vW5r6o", title: "Turbo Killer", artist: "Carpenter Brut", thumbnail: "https://i.ytimg.com/vi/qy9W0vW5r6o/hqdefault.jpg", duration: "4:15" }
      ];
    }
    
    // General / Pop / Happy / Dance
    return [
      { id: "7d_oSTrLpRE", title: "Fuentes De Ortiz", artist: "Ed Maverick", thumbnail: "https://i.ytimg.com/vi/7d_oSTrLpRE/hqdefault.jpg", duration: "3:33" },
      { id: "gJnQX-87-hs", title: "San Lucas", artist: "Kevin Kaarl", thumbnail: "https://i.ytimg.com/vi/gJnQX-87-hs/hqdefault.jpg", duration: "4:12" },
      { id: "FGBhQAkFHWY", title: "Get Lucky", artist: "Daft Punk", thumbnail: "https://i.ytimg.com/vi/FGBhQAkFHWY/hqdefault.jpg", duration: "5:20" },
      { id: "oG_T42t00wQ", title: "Chachachá", artist: "Josean Log", thumbnail: "https://i.ytimg.com/vi/oG_T42t00wQ/hqdefault.jpg", duration: "3:28" }
    ];
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

    // 1. Check mood cache for near-instant return on same query
    const cacheKey = `ai_mood_${prompt.toLowerCase().trim()}_${age || 'any'}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[Server] Returning cached AI recommendations for: ${prompt}`);
      return res.json(cached);
    }

    let aiTracksList: any[] = [];
    let usedFallback = false;

    try {
      if (!geminiKey) {
        throw new Error("Missing GEMINI_API_KEY");
      }
      
      const response = await generateWithFallback({
        contents: [{ role: 'user', parts: [{ text: `Act as a professional and responsible music curator. 
        User is ${age ? age + " years old" : "an adult"}.
        Based on the following mood or description: "${prompt}", suggest 5 real songs that fit perfectly.

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
      if (aiData && Array.isArray(aiData.tracks)) {
        aiTracksList = aiData.tracks;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.warn("[Server] Gemini AI Mood error, falling back to high-fidelity semantic engine:", error);
      aiTracksList = getThematicFallback(prompt);
      usedFallback = true;
    }

    try {
      // If we used fallback, it already has valid IDs and metadata. Return directly!
      if (usedFallback) {
        console.log("[Server] Returning pre-cached falling fallback list immediately.");
        setCache(cacheKey, aiTracksList);
        return res.json(aiTracksList);
      }

      // Now search each track on YouTube (using caching on per-track level as well!)
      const tracks = await Promise.all(
        aiTracksList.slice(0, 5).map(async (t: { title: string; artist: string }) => {
          const trackKey = `yt_track_${(t.title + " " + t.artist).toLowerCase().trim()}`;
          const cachedTrack = getCached(trackKey);
          if (cachedTrack) {
            return cachedTrack;
          }
          try {
            const search = await ytSearch(`${t.title} ${t.artist}`);
            const video = search.videos[0];
            if (video) {
              const trackData = {
                id: video.videoId,
                title: video.title,
                artist: video.author?.name || t.artist,
                thumbnail: video.image,
                duration: video.timestamp
              };
              setCache(trackKey, trackData);
              return trackData;
            }
            return null;
          } catch (e) {
            return null;
          }
        })
      );

      const filteredTracks = tracks.filter(t => t !== null);
      if (filteredTracks.length === 0) {
        console.log("[Server] Live YouTube searches returned zero results under rate limit. Falling back to pre-cached thematic tracks.");
        const fallbackList = getThematicFallback(prompt);
        setCache(cacheKey, fallbackList);
        return res.json(fallbackList);
      }

      setCache(cacheKey, filteredTracks);
      res.json(filteredTracks);
    } catch (error) {
      console.warn("[Server] YouTube search execution threw an error, returning pre-cached thematic tracks gracefully:", error);
      const fallbackList = getThematicFallback(prompt);
      setCache(cacheKey, fallbackList);
      res.json(fallbackList);
    }
  });

  // AI Lyrics Endpoint
  const LYRICS_DB_PATH = path.join(process.cwd(), "lyrics-db.json");

  function readLyricsDb(): Record<string, { lyrics: string; timestamp: number }> {
    try {
      if (fs.existsSync(LYRICS_DB_PATH)) {
        const content = fs.readFileSync(LYRICS_DB_PATH, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("[Server DB] Error reading lyrics database:", error);
    }
    return {};
  }

  function writeLyricsDb(data: Record<string, { lyrics: string; timestamp: number }>) {
    try {
      fs.writeFileSync(LYRICS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      console.error("[Server DB] Error writing lyrics database:", error);
    }
  }

  function getNormalizedLyricKey(title: string, artist: string): string {
    let cleanTitle = String(title)
      .replace(/\s*\([^)]*(?:video|lyric|audio|oficial|official|subtitul|remaster|karaoke|live|cover|hd|hq)[^)]*\)/gi, "")
      .replace(/\s*\[[^\]]*(?:video|lyric|audio|oficial|official|subtitul|remaster|karaoke|live|cover|hd|hq)[^\]]*\]/gi, "")
      .replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ]/g, "")
      .trim()
      .toLowerCase();
    let cleanArtist = artist ? String(artist).replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ]/g, "").trim().toLowerCase() : "";

    if (cleanArtist) {
      const artistWords = cleanArtist.split(/\s+/).filter(w => w.length > 1);
      cleanTitle = cleanTitle.replace(cleanArtist, "").trim();
      for (const word of artistWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        cleanTitle = cleanTitle.replace(regex, "").trim();
      }
      cleanTitle = cleanTitle.replace(new RegExp(`^${cleanArtist}\\s+`, 'i'), '');
      cleanTitle = cleanTitle.replace(new RegExp(`\\s+${cleanArtist}$`, 'i'), '');
    }

    cleanTitle = cleanTitle.replace(/\s+/g, " ").trim();
    cleanArtist = cleanArtist.replace(/\s+/g, " ").trim();

    if (!cleanTitle) {
      cleanTitle = String(title).replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ]/g, "").trim().toLowerCase();
    }

    return `${cleanTitle}_by_${cleanArtist}`.replace(/\s+/g, "_");
  }

  function lookupLyricsEntry(lyricsDb: Record<string, any>, title: string, artist: string): any | null {
    const cleanTitle = String(title).replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ]/g, "").trim().toLowerCase();
    const cleanArtist = artist ? String(artist).replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ]/g, "").trim().toLowerCase() : "";
    const basicKey = `${cleanTitle}_by_${cleanArtist}`.replace(/\s+/g, "_");

    if (lyricsDb[basicKey]) {
      return lyricsDb[basicKey];
    }

    const normalizedKey = getNormalizedLyricKey(title, artist);
    if (lyricsDb[normalizedKey]) {
      return lyricsDb[normalizedKey];
    }

    const searchTitle = normalizedKey.split("_by_")[0];
    const searchArtist = cleanArtist.replace(/\s+/g, "_");
    
    if (searchTitle && searchArtist) {
      for (const key of Object.keys(lyricsDb)) {
        if (key.includes(searchTitle) && key.includes(searchArtist)) {
          console.log(`[Server DB] Robust match found: ${key} for: ${normalizedKey}`);
          return lyricsDb[key];
        }
      }
    }

    return null;
  }

  async function fetchLyricsFromLetrasComDirectly(title: string, artist: string): Promise<string | null> {
    try {
      const cleanSlug = (str: string) => {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // removes accents
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // remove special chars
          .trim()
          .replace(/\s+/g, "-"); // replace spaces with hyphens
      };

      const artistSlug = cleanSlug(artist);
      const songSlug = cleanSlug(title);

      if (!artistSlug || !songSlug) return null;

      const urls = [
        `https://www.letras.com/${artistSlug}/${songSlug}/`,
        `https://www.letras.com/${artistSlug}/${songSlug}-letra/`
      ];

      for (const url of urls) {
        console.log(`[Scraper] Attempting direct crawl for fallback from Letras.com: ${url}`);
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
          }
        });

        if (!res.ok) {
          console.warn(`[Scraper] Direct crawl failed for ${url} (status: ${res.status})`);
          continue;
        }

        const html = await res.text();

        // Letras.com has lyric containers like lyric-cnt, or cnt-letra containing multiple <p> tags
        const lyricMatch = html.match(/<div class=["']lyric-cnt["']>([\s\S]*?)<\/div>/i) ||
                           html.match(/<div class=["']cnt-letra[^"']*["']>([\s\S]*?)<\/div>/i);

        if (lyricMatch) {
          const block = lyricMatch[1];
          const paragraphs = [...block.matchAll(/<p>([\s\S]*?)<\/p>/gmi)].map(m => m[1]);
          
          if (paragraphs.length > 0) {
            return paragraphs.map(p => {
              return p
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/\n{3,}/g, "\n\n")
                .trim();
            }).join("\n\n");
          } else {
            let cleanBlock = block
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<p>/gi, "")
              .replace(/<\/p>/gi, "\n\n")
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;/g, " ")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&#39;/g, "'")
              .replace(/\n{3,}/g, "\n\n")
              .trim();
            if (cleanBlock.length > 50) return cleanBlock;
          }
        }
      }
    } catch (err) {
      console.error("[Scraper] Direct scraper failed:", err);
    }
    return null;
  }

  function getCleanTitleAndArtist(title: string, artist: string) {
    let cleanTitle = String(title)
      .replace(/\s*\([^)]*(?:video|lyric|audio|oficial|official|subtitul|remaster|karaoke|live|cover|hd|hq|music|clip|ft|feat)[^)]*\)/gi, "")
      .replace(/\s*\[[^\]]*(?:video|lyric|audio|oficial|official|subtitul|remaster|karaoke|live|cover|hd|hq|music|clip|ft|feat)[^\]]*\]/gi, "")
      .replace(/\b(?:official video|official audio|video oficial|official lyric video|lyrics|remastered|hd|hq)\b/gi, "");

    let cleanArtist = artist ? String(artist)
      .replace(/\s*\([^)]*(?:video|lyric|audio|oficial|official|subtitul|remaster|karaoke|live|cover|hd|hq|music|clip)[^)]*\)/gi, "")
      .replace(/\s*\[[^\]]*(?:video|lyric|audio|oficial|official|subtitul|remaster|karaoke|live|cover|hd|hq|music|clip)[^\]]*\]/gi, "")
      .replace(/\b(?:topic|vevo)\b/gi, "")
      .replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ']/g, "")
      .replace(/\s+/g, " ")
      .trim() : "";

    // If the title starts with "artist - " or contains "-", let's split it
    if (cleanTitle.includes(" - ")) {
      const parts = cleanTitle.split(" - ");
      if (parts.length >= 2) {
        const part0 = parts[0].trim();
        const part1 = parts[1].trim();
        if (cleanArtist && part0.toLowerCase().includes(cleanArtist.toLowerCase())) {
          cleanTitle = part1;
        } else if (cleanArtist && part1.toLowerCase().includes(cleanArtist.toLowerCase())) {
          cleanTitle = part0;
        } else {
          if (!cleanArtist) {
            cleanArtist = part0;
            cleanTitle = part1;
          }
        }
      }
    }

    // Also remove the artist name from the title if present
    if (cleanArtist) {
      const artistWords = cleanArtist.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let lowerTitle = cleanTitle.toLowerCase();
      for (const word of artistWords) {
        const idx = lowerTitle.indexOf(word);
        if (idx !== -1) {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          cleanTitle = cleanTitle.replace(regex, "").trim();
        }
      }
      cleanTitle = cleanTitle.replace(/^\s*-\s*|\s*-\s*$/g, "").trim();
    }

    cleanTitle = cleanTitle.replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ']/g, " ").replace(/\s+/g, " ").trim();
    cleanArtist = cleanArtist.replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ']/g, " ").replace(/\s+/g, " ").trim();

    return { 
      trackName: cleanTitle || title, 
      artistName: cleanArtist || artist 
    };
  }

  async function fetchLyricsFromLrcLib(title: string, artist: string): Promise<any | null> {
    const { trackName, artistName } = getCleanTitleAndArtist(title, artist);
    const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`;
    
    try {
      console.log(`[LRCLIB] Fetching exact match via: ${getUrl}`);
      const response = await fetch(getUrl, {
        headers: {
          'User-Agent': 'PureAudioWeb/1.0.0 (https://ais-dev-7ddelib5ur2tm3jxjpopyj-275348128361.us-west1.run.app; medinacastrojonatancaleb@gmail.com)'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && (data.syncedLyrics || data.plainLyrics)) {
          console.log(`[LRCLIB] Found lyrics via GET for: ${trackName} - ${artistName}`);
          return {
            lyrics: data.syncedLyrics || data.plainLyrics,
            syncedLyrics: data.syncedLyrics || null,
            plainLyrics: data.plainLyrics || null,
            albumName: data.albumName || null,
            duration: data.duration || null,
            isSynced: !!data.syncedLyrics
          };
        }
      } else {
        console.log(`[LRCLIB] GET query returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("[LRCLIB] Exact match lookup error:", error);
    }

    const searchQuery = `${trackName} ${artistName}`.trim();
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
    
    try {
      console.log(`[LRCLIB] Fetching search matches via: ${searchUrl}`);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'PureAudioWeb/1.0.0 (https://ais-dev-7ddelib5ur2tm3jxjpopyj-275348128361.us-west1.run.app; medinacastrojonatancaleb@gmail.com)'
        }
      });
      
      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results) && results.length > 0) {
          const bestResult = results.find(item => item && (item.syncedLyrics || item.plainLyrics));
          if (bestResult) {
            console.log(`[LRCLIB] Found lyrics via search results for query: "${searchQuery}"`);
            return {
              lyrics: bestResult.syncedLyrics || bestResult.plainLyrics,
              syncedLyrics: bestResult.syncedLyrics || null,
              plainLyrics: bestResult.plainLyrics || null,
              albumName: bestResult.albumName || null,
              duration: bestResult.duration || null,
              isSynced: !!bestResult.syncedLyrics
            };
          }
        }
      }
    } catch (error) {
      console.error("[LRCLIB] Search fallback lookup error:", error);
    }

    const specificSearchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`;
    try {
      console.log(`[LRCLIB] Fetching specific search matches via: ${specificSearchUrl}`);
      const response = await fetch(specificSearchUrl, {
        headers: {
          'User-Agent': 'PureAudioWeb/1.0.0 (https://ais-dev-7ddelib5ur2tm3jxjpopyj-275348128361.us-west1.run.app; medinacastrojonatancaleb@gmail.com)'
        }
      });
      
      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results) && results.length > 0) {
          const bestResult = results.find(item => item && (item.syncedLyrics || item.plainLyrics));
          if (bestResult) {
            console.log(`[LRCLIB] Found lyrics via specific search results for: ${trackName} - ${artistName}`);
            return {
              lyrics: bestResult.syncedLyrics || bestResult.plainLyrics,
              syncedLyrics: bestResult.syncedLyrics || null,
              plainLyrics: bestResult.plainLyrics || null,
              albumName: bestResult.albumName || null,
              duration: bestResult.duration || null,
              isSynced: !!bestResult.syncedLyrics
            };
          }
        }
      }
    } catch (error) {
      console.error("[LRCLIB] Specific search fallback lookup error:", error);
    }

    return null;
  }

  app.get("/api/lyrics", async (req, res) => {
    const { title, artist } = req.query;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const titleStr = String(title);
    const artistStr = artist ? String(artist) : "";

    const lyricsDb = readLyricsDb();
    const cachedEntry = lookupLyricsEntry(lyricsDb, titleStr, artistStr);

    if (cachedEntry) {
      console.log(`[Server DB] Serving cached lyrics using robust lookup for: ${titleStr} - ${artistStr}`);
      if (typeof cachedEntry === 'string') {
        const hasTimeStamp = cachedEntry.includes('[00:') || cachedEntry.includes('[01:') || cachedEntry.includes('[');
        return res.json({ 
          lyrics: cachedEntry,
          syncedLyrics: hasTimeStamp ? cachedEntry : null,
          plainLyrics: hasTimeStamp ? null : cachedEntry,
          isSynced: hasTimeStamp,
          albumName: null,
          duration: null
        });
      } else {
        const lyricsText = cachedEntry.lyrics;
        const hasTimeStamp = lyricsText?.includes('[00:') || lyricsText?.includes('[01:') || lyricsText?.includes('[');
        return res.json({
          lyrics: lyricsText || "",
          syncedLyrics: cachedEntry.syncedLyrics || (hasTimeStamp ? lyricsText : null),
          plainLyrics: cachedEntry.plainLyrics || (hasTimeStamp ? null : lyricsText),
          albumName: cachedEntry.albumName || null,
          duration: cachedEntry.duration || null,
          isSynced: cachedEntry.isSynced !== undefined ? cachedEntry.isSynced : hasTimeStamp
        });
      }
    }

    const lyricKey = getNormalizedLyricKey(titleStr, artistStr);

    try {
      const lrcResult = await fetchLyricsFromLrcLib(titleStr, artistStr);
      
      if (lrcResult) {
        lyricsDb[lyricKey] = {
          lyrics: lrcResult.lyrics,
          syncedLyrics: lrcResult.syncedLyrics,
          plainLyrics: lrcResult.plainLyrics,
          albumName: lrcResult.albumName,
          duration: lrcResult.duration,
          isSynced: lrcResult.isSynced,
          timestamp: Date.now()
        };
        writeLyricsDb(lyricsDb);
        console.log(`[Server DB] Saved new LRCLIB lyrics under database key: ${lyricKey}`);
        return res.json(lrcResult);
      }

      console.log(`[Server DB] No lyrics found on LRCLIB for: ${titleStr} - ${artistStr}`);
      
      const emptyResult = {
        lyrics: "No se encontraron letras disponibles.",
        syncedLyrics: null,
        plainLyrics: "No se encontraron letras disponibles.",
        albumName: null,
        duration: null,
        isSynced: false
      };
      
      lyricsDb[lyricKey] = {
        ...emptyResult,
        timestamp: Date.now()
      };
      writeLyricsDb(lyricsDb);
      
      res.json(emptyResult);
    } catch (error) {
      console.error("[Server] LRCLIB lyrics lookup failed completely with error:", error);
      res.json({
        lyrics: "No se encontraron letras disponibles.",
        syncedLyrics: null,
        plainLyrics: "No se encontraron letras disponibles.",
        albumName: null,
        duration: null,
        isSynced: false
      });
    }
  });

    // Save/Correct lyrics manually
  app.post("/api/lyrics", (req, res) => {
    try {
      const { title, artist, lyrics } = req.body;
      if (!title || !lyrics) {
        return res.status(400).json({ error: "Title and lyrics are required" });
      }

      const cleanTitle = String(title).replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ]/g, "").trim();
      const cleanArtist = artist ? String(artist).replace(/[^\w\sа-яА-ЯáéíóúÁÉÍÓÚñÑ]/g, "").trim() : "";
      const basicKey = `${cleanTitle}_by_${cleanArtist}`.toLowerCase().replace(/\s+/g, "_");
      const normalizedKey = getNormalizedLyricKey(String(title), artist ? String(artist) : "");

      const lyricsDb = readLyricsDb();
      const entry = {
        lyrics: String(lyrics).trim(),
        timestamp: Date.now()
      };
      
      lyricsDb[normalizedKey] = entry;
      lyricsDb[basicKey] = entry;
      
      writeLyricsDb(lyricsDb);
      console.log(`[Server DB] User manually updated/corrected lyrics for keys: ${normalizedKey} & ${basicKey}`);
      res.json({ success: true, lyrics: entry.lyrics });
    } catch (err: any) {
      console.error("[Server] Error saving corrected lyrics:", err);
      res.status(500).json({ error: "Error saving corrected lyrics." });
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
        console.warn(`[Server] No results for search: ${q}. Activating fallback.`);
        return res.json(getThematicFallback(q));
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
      console.warn("[Server] Search error, activating transparent self-healing fallback:", error);
      res.json(getThematicFallback(q));
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
        return res.json(getThematicFallback("default"));
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
      console.warn("[Server] Trending error, using resilient backup tracks gracefully:", error);
      res.json(getThematicFallback("default"));
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
        console.warn(`[Server] No results for artist: ${name}, returning fallback`);
        return res.json(getThematicFallback(name).slice(0, 8));
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

      // If filtering took out all tracks, don't return an empty array, return standard query results or thematic fallback
      if (videos.length === 0) {
        const fallbackResults = results.videos.slice(0, 15).map(v => ({
          id: v.videoId,
          title: v.title,
          artist: v.author?.name || name,
          thumbnail: v.image,
          duration: v.timestamp,
          views: v.views
        }));
        setCache(cacheKey, fallbackResults);
        return res.json(fallbackResults);
      }

      setCache(cacheKey, videos);
      res.json(videos);
    } catch (error) {
      console.warn("[Server] Artist search failed. Returning custom themed fallback gracefully:", error);
      res.json(getThematicFallback(name).slice(0, 8));
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
