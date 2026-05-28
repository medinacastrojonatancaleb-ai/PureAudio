import { FeedItem } from './types';

// Curated seed catalog of exceptionally popular real tracks
export const CURATED_TRACKS: Omit<FeedItem, 'postId'>[] = [
  {
    songTitle: "Abrazado a Ti",
    artist: "Kevin Kaarl",
    coverUrl: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80",
    audioUrl: "9_C73VnkyrQ",
    caption: "Quisiera volver atrás y otra vez bailar... 🌵☕️ Un clásico hermoso de Kevin Kaarl para el alma.",
    likes: 48920,
    comments: 1240,
    views: "2.4M",
    creatorHandle: "kevinkaarl_fans",
    uploadDate: "2025-06-11"
  },
  {
    songTitle: "Yellow",
    artist: "Coldplay",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    audioUrl: "yKNxeF4KAtY",
    caption: "Look at the stars, look how they shine for you... 🌟💫 Un clásico inolvidable.",
    likes: 184200,
    comments: 9812,
    views: "15.4M",
    creatorHandle: "coldplay.fan.hq",
    uploadDate: "2025-05-20"
  },
  {
    songTitle: "DESPECHÁ",
    artist: "Rosalía",
    coverUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    audioUrl: "y3mXyF9_B8a",
    caption: "Que yo estoy ocupá' olvidando tus males... 🏍️💃 ¡Modo despechá activado!",
    likes: 314050,
    comments: 12942,
    views: "22.4M",
    creatorHandle: "motomami_vibe",
    uploadDate: "2025-07-02"
  },
  {
    songTitle: "San Lucas",
    artist: "Kevin Kaarl",
    coverUrl: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&q=80",
    audioUrl: "gJnQX-87-hs",
    caption: "Dile ya a tus papás que no vas a regresar... De mis canciones de carretera favoritas. 🌵🌻 #folklore",
    likes: 85822,
    comments: 3421,
    views: "5.8M",
    creatorHandle: "mexico_folklore",
    uploadDate: "2025-04-18"
  },
  {
    songTitle: "Como un Sol",
    artist: "Kevin Kaarl",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    audioUrl: "E6MRE8xXCHs",
    caption: "Tú me miras como un sol que brilla más... ☀️ Hermosa melodía acústica.",
    likes: 32410,
    comments: 890,
    views: "1.9M",
    creatorHandle: "kaarl_lyrics",
    uploadDate: "2025-08-14"
  },
  {
    songTitle: "Vámonos a Marte",
    artist: "Kevin Kaarl",
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    audioUrl: "yXwSg7Q_T0o",
    caption: "Te llevaré a un lugar donde no haya gravedad... 🚀✨ Vámonos a Marte.",
    likes: 95400,
    comments: 2980,
    views: "6.7M",
    creatorHandle: "vintage_aesthetic",
    uploadDate: "2025-03-01"
  },
  {
    songTitle: "Sweater Weather",
    artist: "The Neighbourhood",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
    audioUrl: "GCdwKhTtNNw",
    caption: "Cause it's too cold for you here and now... ❄️🧥 Cozy autumn feelings.",
    likes: 124500,
    comments: 4890,
    views: "11.2M",
    creatorHandle: "indie_vibes_forever",
    uploadDate: "2025-02-15"
  },
  {
    songTitle: "Blinding Lights",
    artist: "The Weeknd",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    audioUrl: "fHI8X4OXluQ",
    caption: "I said, ooh, I'm blinded by the lights... 🌃⚡ El hit de synthwave moderno definitivo.",
    likes: 425300,
    comments: 18450,
    views: "34.5M",
    creatorHandle: "xo_crew_vibe",
    uploadDate: "2025-01-10"
  },
  {
    songTitle: "Amor Libre",
    artist: "Kevin Kaarl",
    coverUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
    audioUrl: "G7mO_RkZ37o",
    caption: "Que ya no aguanto más este frío en mí... Amor libre, amor puro.",
    likes: 42100,
    comments: 1105,
    views: "3.1M",
    creatorHandle: "musica_del_alma",
    uploadDate: "2025-09-02"
  },
  {
    songTitle: "As It Was",
    artist: "Harry Styles",
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80",
    audioUrl: "H5v3kku4y6Q",
    caption: "In this world, it's just us, you know it's not the same as it was... 🍒☀️",
    likes: 295400,
    comments: 12420,
    views: "21.8M",
    creatorHandle: "harry_style_news",
    uploadDate: "2025-10-12"
  }
];

// Rich set of realistic cover photos to rotate uniquely
const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80"
];

// Famous music icons and artists to populate a highly authentic pool
const POP_ARTISTS = [
  "Kevin Kaarl", "Coldplay", "Rosalía", "Bad Bunny", "The Weeknd", "Harry Styles", 
  "Billie Eilish", "Taylor Swift", "Dua Lipa", "Olivia Rodrigo", "Drake", "SZA", 
  "Ed Sheeran", "Adele", "Rauw Alejandro", "Karol G", "Peso Pluma", "Luis Miguel", 
  "Soda Stereo", "Feid", "Bizarrap", "Quevedo", "C. Tangana", "Post Malone", "Travis Scott"
];

const SONG_TEMPLATES_BY_ARTIST: Record<string, { title: string; youtubeId: string; caption: string }[]> = {
  "Kevin Kaarl": [
    { title: "Abrazado a Ti", youtubeId: "9_C73VnkyrQ", caption: "Quisiera volver atrás... Un clásico hermoso para calmar el alma 🌵🌲" },
    { title: "San Lucas", youtubeId: "gJnQX-87-hs", caption: "Dile ya a tus papás que no vas a regresar... De esas canciones mágicas de carretera 🌻" },
    { title: "Vámonos a Marte", youtubeId: "yXwSg7Q_T0o", caption: "Te llevaré a un lugar totalmente libre... Vámonos a Marte ✨" },
    { title: "Como un Sol", youtubeId: "E6MRE8xXCHs", caption: "Tú me miras como un sol que brilla más... Un acústico nostálgico ☀️" },
    { title: "Amor Libre", youtubeId: "G7mO_RkZ37o", caption: "Que ya no aguanto más este frío en mí... Amor puro, sin pretensiones." }
  ],
  "Coldplay": [
    { title: "Yellow", youtubeId: "yKNxeF4KAtY", caption: "Look at the stars, look how they shine for you... 🌟 Un himno inmortal para dedicar." },
    { title: "The Scientist", youtubeId: "NX3_i_N3A8Q", caption: "Nobody said it was easy... Volviendo al inicio de todo. Hermosa y melancólica 🎹" },
    { title: "Fix You", youtubeId: "k4V3_G333K4", caption: "When you try your best, but you don't succeed... Luces de esperanza 💡" },
    { title: "Viva La Vida", youtubeId: "dvgZkm1xWPE", caption: "I used to rule the world... Una obra de arte que te transporta a otra dimensión." }
  ],
  "Rosalía": [
    { title: "DESPECHÁ", youtubeId: "y3mXyF9_B8a", caption: "Que yo estoy ocupá' olvidando tus males... Un hit veraniego insuperable 🏍️💃" },
    { title: "SAOKO", youtubeId: "6o7bVb7074E", caption: "Chica, ¿qué dices? Saoko Papi, Saoko! Una revolución musical experimental 🏍️⚡" },
    { title: "BIZCOCHITO", youtubeId: "a5Tid8Z747M", caption: "Yo no soy y nunca seré tu bizcochito! Actitud insuperable 💅👑" }
  ],
  "The Weeknd": [
    { title: "Blinding Lights", youtubeId: "fHI8X4OXluQ", caption: "I said, ooh, I'm blinded by the lights... ¡La canción synthwave más grande de esta década! 🌃⚡" },
    { title: "Save Your Tears", youtubeId: "XXYlToYrM-4", caption: "But you saw me, I took you by surprise... Los mejores ritmos retro modernizados." },
    { title: "Starboy", youtubeId: "34Na43YrYgE", caption: "Look what you've done... I'm a motherf***ing starboy. Estilo legendario 💎" }
  ],
  "Harry Styles": [
    { title: "As It Was", youtubeId: "H5v3kku4y6Q", caption: "It's not the same as it was... Sabor alegre con letras melancólicas. Una gema pop" },
    { title: "Watermelon Sugar", youtubeId: "E07s5MRpybY", caption: "Watermelon sugar high... La melodía perfecta del verano 🍉☀️" },
    { title: "Sign of the Times", youtubeId: "qN4ooNxDE2o", caption: "Welcome to the final show, I hope you're wearing your best clothes... Épico." }
  ],
  "Billie Eilish": [
    { title: "Bad Guy", youtubeId: "DyDfgMOUjCI", caption: "So you're a tough guy, like it really rough guy... La voz susurrada que cambió el pop 😈🕷️" },
    { title: "Everything I Wanted", youtubeId: "qCTMq7x_pZs", caption: "If I could exceed, I would probably tell you... Un abrazo musical profundo ❤️" }
  ],
  "Soda Stereo": [
    { title: "De Música Ligera", youtubeId: "I8-T-R8_990", caption: "De aquel amor de música ligera... ¡La pieza más icónica del rock en español! 🎸 Gracias totales." },
    { title: "Persiana Americana", youtubeId: "qK_p_o-m9eQ", caption: "Tus ropas caen lentamente... Sabor ochentero legendario." }
  ],
  "Bad Bunny": [
    { title: "Titi Me Preguntó", youtubeId: "Cr8K8P7b8M8", caption: "Titi me preguntó si tengo muchas novias... ¡El rey indiscutible de la fiesta latina! 💃🌊" },
    { title: "Monaco", youtubeId: "Y3M83X_E4As", caption: "Ustedes de qué hablan si no han visto nada... Directamente de la Fórmula 1 🏎️🔥" }
  ]
};

// Generic list of famous songs to fall back on for other artists
const GENERIC_SONGS = [
  { title: "Flowers", youtubeId: "My3_Y4G79As", caption: "I can buy myself flowers... El himno de amor propio supremo 💐" },
  { title: "Cruel Summer", youtubeId: "ic8j13p9MQs", caption: "It's a cruel summer... Letras apasionantes para cantar a todo pulmón! ☀️" },
  { title: "Anti-Hero", youtubeId: "b1kbL_8V06o", caption: "It's me, hi, I'm the problem, it's me... Un toque de autocrítica divertida." },
  { title: "Driver's License", youtubeId: "gN9J3-0_3M8", caption: "And you're probably with that blonde girl... Emoción a flor de piel 🚗💔" },
  { title: "Good 4 U", youtubeId: "gNi3-Vn83As", caption: "Well, good for you, you look happy and healthy... Explosión de punk pop!" },
  { title: "Levitating", youtubeId: "TUV_8-A8Vj8", caption: "I got you, moonlight, you're my starlight... Ritmos cósmicos ultra bailables ✨" },
  { title: "Stay", youtubeId: "kT_3S3gN-M0", caption: "I do the same thing I told you that I never would... Máxima velocidad ⚡" },
  { title: "Shape of You", youtubeId: "JGwWNGJdvx8", caption: "I'm in love with the shape of you... Melodías infecciosas e inolvidables." },
  { title: "Perfect", youtubeId: "2Vv-BfVoq4g", caption: "I found a love for me... La balada perfecta para soñar despierto 💍" },
  { title: "Starboy", youtubeId: "34Na43YrYgE", caption: "Look what you've done... Estilo cósmico de primer nivel." }
];

// Generates exactly 500 catalog items for premium infinite scroll capability
export const generateFeedCatalog = (): FeedItem[] => {
  const catalog: FeedItem[] = [];

  // 1. Inject the hardcoded curated seeds first to preserve order
  CURATED_TRACKS.forEach((track, index) => {
    catalog.push({
      postId: `feed_track_${index + 1}`,
      ...track
    });
  });

  // 2. Expand up to 500 items systematically
  let songCounter = catalog.length;
  const targetCount = 500;

  // We rotate through our variables to generate organic, believable releases
  while (songCounter < targetCount) {
    const artist = POP_ARTISTS[songCounter % POP_ARTISTS.length];
    const imageCover = UNSPLASH_IMAGES[songCounter % UNSPLASH_IMAGES.length];
    
    // Choose song metadata based on artist match, or fall back to generic
    let songTitle = "";
    let youtubeId = "";
    let caption = "";

    const templates = SONG_TEMPLATES_BY_ARTIST[artist];
    if (templates && templates.length > 0) {
      const template = templates[(songCounter) % templates.length];
      songTitle = template.title;
      // Re-use same youtubeId or mutate. We can use template's real youtubeId
      youtubeId = template.youtubeId;
      caption = template.caption;
    } else {
      const template = GENERIC_SONGS[(songCounter) % GENERIC_SONGS.length];
      songTitle = template.title;
      youtubeId = template.youtubeId;
      caption = `${songTitle} de ${artist}. Sincronizado en alta fidelidad original! 🎧💫`;
    }

    const likes = Math.floor(Math.random() * 95000) + 2400;
    const comments = Math.floor(likes * 0.04) + 12;
    const viewsDecimal = (likes * 12.4 / 1000000).toFixed(1);
    const views = `${viewsDecimal === "0.0" ? "0.4" : viewsDecimal}M`;
    const handle = `${artist.toLowerCase().replace(/[^a-z0-9]/g, '')}_fan_${Math.floor(Math.random() * 900 + 100)}`;
    const randomDaysAgo = Math.floor(Math.random() * 90) + 1;
    const date = new Date();
    date.setDate(date.getDate() - randomDaysAgo);
    const uploadDate = date.toISOString().split('T')[0];

    catalog.push({
      postId: `feed_track_${songCounter + 1}`,
      songTitle,
      artist,
      coverUrl: imageCover,
      audioUrl: youtubeId,
      caption,
      likes,
      comments,
      views,
      creatorHandle: handle,
      uploadDate
    });

    songCounter++;
  }

  return catalog;
};
