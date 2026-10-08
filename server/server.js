import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool, initDb } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "driftverse_jwt_super_secret_speed_2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "soxibgaybullayev439@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "s0x1bj0n$02$";

app.use(cors());
app.use(express.json());

// Lazy DB init for Vercel Serverless Functions and container startups
let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    if (!dbInitPromise) {
      dbInitPromise = initDb().catch((err) => {
        console.error("Database lazy init error:", err);
      });
    }
    await dbInitPromise;
  }
  next();
});

// Helper: Extract YouTube ID from URL or raw ID
function extractYouTubeId(urlOrId) {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = str.match(regex);
  return match ? match[1] : null;
}

// Middleware: Authenticate User JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Kirish talab etiladi (Avtorizatsiyadan o'ting)" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Yaroqsiz yoki muddati o'tgan token" });
    req.user = user;
    next();
  });
}

// Optional Auth (populates req.user if token is present, does not reject if not)
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
}

// Middleware: Require Admin
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ error: "Faqat administrator uchun ruxsat berilgan!" });
    }
  });
}

// --------------------------------------------------------------------------
// AUTHENTICATION ROUTES
// --------------------------------------------------------------------------

// Register User
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak!" });
    }

    // Check existing
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1;",
      [username.trim(), email.trim().toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Ushbu username yoki email allaqachon ro'yxatdan o'tgan!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, avatar)
       VALUES ($1, $2, $3, 'user', $4) RETURNING id, username, email, role, avatar, created_at;`,
      [username.trim(), email.trim().toLowerCase(), hash, avatar]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
      token,
      user
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server xatosi: Ro'yxatdan o'tishda muammo yuz berdi" });
  }
});

// Login User
app.post("/api/auth/login", async (req, res) => {
  try {
    const { login, password } = req.body; // login can be username or email
    if (!login || !password) {
      return res.status(400).json({ error: "Login va parolni kiriting!" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1 LIMIT 1;",
      [login.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Foydalanuvchi topilmadi yoki parol noto'g'ri!" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Foydalanuvchi topilmadi yoki parol noto'g'ri!" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Tizimga muvaffaqiyatli kirdingiz!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server xatosi: Tizimga kirishda muammo" });
  }
});

// Admin-Only Login with Dedicated Email & Password
app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Admin email manzili va maxfiy parolini kiriting!" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetEmail = (process.env.ADMIN_EMAIL || "soxibgaybullayev439@gmail.com").toLowerCase();
    const targetPassword = process.env.ADMIN_PASSWORD || "s0x1bj0n$02$";

    // Strictly locked: ONLY the specified administrator email is allowed
    if (cleanEmail !== targetEmail) {
      return res.status(401).json({ error: "Kirish rad etildi: Faqat belgilangan administrator ruxsatiga ega!" });
    }

    // Verify password against environment or bcrypt hash in Neon DB
    let isValid = false;
    if (password === targetPassword) {
      isValid = true;
    } else {
      const adminUser = await pool.query("SELECT * FROM users WHERE email = $1 AND role = 'admin' LIMIT 1;", [cleanEmail]);
      if (adminUser.rows.length > 0) {
        isValid = await bcrypt.compare(password, adminUser.rows[0].password_hash);
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: "Admin paroli noto'g'ri! Kirish rad etildi." });
    }

    // Get admin user info from database
    let adminRecord = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1;", [cleanEmail]);
    const admin = adminRecord.rows[0] || {
      id: 1,
      username: "soxibjon",
      email: cleanEmail,
      role: "admin"
    };

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: "admin", email: admin.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Admin boshqaruv tizimiga muvaffaqiyatli ulandingiz!",
      token,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: "admin",
        avatar: admin.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Admin tizimiga kirishda xato yuz berdi" });
  }
});

// Current User Profile
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, avatar, created_at FROM users WHERE id = $1 LIMIT 1;",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Xatolik yuz berdi" });
  }
});

// --------------------------------------------------------------------------
// VIDEOS ROUTES (YOUTUBE INTEGRATION)
// --------------------------------------------------------------------------

// Get All Videos with Likes, Comments Count, and isLiked flag for current user
app.get("/api/videos", optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const query = `
      SELECT 
        v.*,
        COUNT(DISTINCT vl.id)::int AS likes_count,
        COUNT(DISTINCT c.id)::int AS comments_count,
        CASE 
          WHEN $1::int IS NOT NULL AND EXISTS(SELECT 1 FROM video_likes WHERE video_id = v.id AND user_id = $1::int) 
          THEN true 
          ELSE false 
        END AS is_liked
      FROM videos v
      LEFT JOIN video_likes vl ON vl.video_id = v.id
      LEFT JOIN comments c ON c.video_id = v.id
      GROUP BY v.id
      ORDER BY v.created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    res.json({ videos: result.rows });
  } catch (err) {
    console.error("Get videos error:", err);
    res.status(500).json({ error: "Videolarni yuklashda xatolik" });
  }
});

// Get Single Video with Comments & Details
app.get("/api/videos/:id", optionalAuth, async (req, res) => {
  try {
    const rawId = req.params.id;
    const isNum = !isNaN(parseInt(rawId)) && /^\d+$/.test(rawId);
    const videoId = isNum ? parseInt(rawId) : 0;
    const userId = req.user ? req.user.id : null;

    const videoQuery = `
      SELECT 
        v.*,
        COUNT(DISTINCT vl.id)::int AS likes_count,
        CASE 
          WHEN $2::int IS NOT NULL AND EXISTS(SELECT 1 FROM video_likes WHERE video_id = v.id AND user_id = $2::int) 
          THEN true 
          ELSE false 
        END AS is_liked
      FROM videos v
      LEFT JOIN video_likes vl ON vl.video_id = v.id
      WHERE (v.id = $1 OR v.youtube_id = $3)
      GROUP BY v.id;
    `;
    const videoRes = await pool.query(videoQuery, [videoId, userId, rawId]);
    if (videoRes.rows.length === 0) {
      return res.status(404).json({ error: "Video topilmadi!" });
    }

    const foundVideo = videoRes.rows[0];
    const commentsQuery = `
      SELECT 
        c.id, c.video_id, c.user_id, c.user_name, c.user_avatar, c.content, c.created_at,
        u.role AS user_role
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.video_id = $1
      ORDER BY c.created_at DESC;
    `;
    const commentsRes = await pool.query(commentsQuery, [foundVideo.id]);

    res.json({
      video: foundVideo,
      comments: commentsRes.rows
    });
  } catch (err) {
    console.error("Get video detail error:", err);
    res.status(500).json({ error: "Video tafsilotlarini yuklashda xatolik" });
  }
});

// Admin: Add New YouTube Video
app.post("/api/videos", requireAdmin, async (req, res) => {
  try {
    const { url, title, category, description, duration, channel_name } = req.body;
    if (!url || !title) {
      return res.status(400).json({ error: "YouTube havola (URL) va video nomi kiritilishi shart!" });
    }

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      return res.status(400).json({ error: "Noto'g'ri YouTube havola formati! Yaroqli YouTube URL yoki Video ID kiriting." });
    }

    const cleanUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const defaultThumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

    // Estimate duration sec from "MM:SS" or default 300
    let durationSec = 300;
    if (duration && duration.includes(":")) {
      const parts = duration.split(":");
      if (parts.length === 2) {
        durationSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        durationSec = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    }

    const insertQuery = `
      INSERT INTO videos (youtube_id, youtube_url, title, category, description, duration, duration_sec, thumbnail, channel_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      youtubeId,
      cleanUrl,
      title.trim(),
      category || "Drift",
      description || "DRIFTVERSE yuqori sifatli avtomobil videolavhasi.",
      duration || "05:00",
      durationSec,
      defaultThumbnail,
      channel_name || "DRIFTVERSE STUDIO"
    ]);

    res.status(201).json({
      message: "YouTube video muvaffaqiyatli saqlandi!",
      video: result.rows[0]
    });
  } catch (err) {
    console.error("Add video error:", err);
    res.status(500).json({ error: "Video qo'shishda xatolik yuz berdi" });
  }
});

// Admin: Update / Edit Existing Video
app.put("/api/videos/:id", requireAdmin, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { url, title, category, description, duration, channel_name } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Video nomi (title) kiritilishi shart!" });
    }

    const check = await pool.query("SELECT * FROM videos WHERE id = $1;", [videoId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Video topilmadi!" });
    }
    const current = check.rows[0];

    let youtubeId = current.youtube_id;
    let cleanUrl = current.youtube_url;
    let thumbnail = current.thumbnail;

    if (url && url.trim()) {
      const extractedId = extractYouTubeId(url);
      if (extractedId) {
        youtubeId = extractedId;
        cleanUrl = `https://www.youtube.com/watch?v=${extractedId}`;
        thumbnail = `https://img.youtube.com/vi/${extractedId}/maxresdefault.jpg`;
      }
    }

    let durationSec = current.duration_sec || 300;
    const durStr = duration ? duration.trim() : current.duration;
    if (durStr && durStr.includes(":")) {
      const parts = durStr.split(":");
      if (parts.length === 2) {
        durationSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        durationSec = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    }

    const updateQuery = `
      UPDATE videos
      SET 
        youtube_id = $1,
        youtube_url = $2,
        title = $3,
        category = $4,
        description = $5,
        duration = $6,
        duration_sec = $7,
        thumbnail = $8,
        channel_name = $9
      WHERE id = $10
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [
      youtubeId,
      cleanUrl,
      title.trim(),
      category || current.category || "Drift",
      description !== undefined ? description : current.description,
      durStr || "05:00",
      durationSec,
      thumbnail,
      channel_name || current.channel_name || "DRIFTVERSE",
      videoId
    ]);

    res.json({
      message: "Video ma'lumotlari muvaffaqiyatli tahrirlandi!",
      video: result.rows[0]
    });
  } catch (err) {
    console.error("Update video error:", err);
    res.status(500).json({ error: "Videoni tahrirlashda xatolik yuz berdi" });
  }
});

// Admin: Delete Video
app.delete("/api/videos/:id", requireAdmin, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const result = await pool.query("DELETE FROM videos WHERE id = $1 RETURNING id;", [videoId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Video topilmadi!" });
    res.json({ message: "Video o'chirildi", id: videoId });
  } catch (err) {
    console.error("Delete video error:", err);
    res.status(500).json({ error: "Videoni o'chirishda xatolik" });
  }
});

// User: Toggle Like Video
app.post("/api/videos/:id/like", authenticateToken, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if liked
    const check = await pool.query(
      "SELECT id FROM video_likes WHERE video_id = $1 AND user_id = $2;",
      [videoId, userId]
    );

    let isLiked = false;
    if (check.rows.length > 0) {
      await pool.query("DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2;", [videoId, userId]);
      isLiked = false;
    } else {
      await pool.query("INSERT INTO video_likes (video_id, user_id) VALUES ($1, $2);", [videoId, userId]);
      isLiked = true;
    }

    const countRes = await pool.query("SELECT COUNT(*)::int AS count FROM video_likes WHERE video_id = $1;", [videoId]);
    res.json({ is_liked: isLiked, likes_count: countRes.rows[0].count });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ error: "Like qo'yishda xatolik" });
  }
});

// User: Add Comment to Video
app.post("/api/videos/:id/comments", authenticateToken, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Izoh matnini yozing!" });
    }

    // Get latest user info
    const userRes = await pool.query("SELECT username, avatar FROM users WHERE id = $1;", [req.user.id]);
    const user = userRes.rows[0] || { username: req.user.username, avatar: null };

    const insertQuery = `
      INSERT INTO comments (video_id, user_id, user_name, user_avatar, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      videoId,
      req.user.id,
      user.username,
      user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
      content.trim()
    ]);

    res.status(201).json({
      message: "Izoh muvaffaqiyatli joylandi!",
      comment: result.rows[0]
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Izoh qoldirishda xatolik" });
  }
});

// User or Admin: Delete Comment
app.delete("/api/comments/:id", authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const check = await pool.query("SELECT * FROM comments WHERE id = $1;", [commentId]);
    if (check.rows.length === 0) return res.status(404).json({ error: "Izoh topilmadi" });

    const comment = check.rows[0];
    if (comment.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Faqat o'z izohingizni o'chira olasiz!" });
    }

    await pool.query("DELETE FROM comments WHERE id = $1;", [commentId]);
    res.json({ message: "Izoh o'chirildi", id: commentId });
  } catch (err) {
    res.status(500).json({ error: "Izohni o'chirishda xatolik" });
  }
});

// Increment View Count
app.post("/api/videos/:id/view", async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    await pool.query("UPDATE videos SET views = views + 1 WHERE id = $1;", [videoId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Xatolik" });
  }
});

// --------------------------------------------------------------------------
// IMAGES & WALLPAPERS ROUTES (NEON DB)
// --------------------------------------------------------------------------

// Get Images (Supports filters: ?section=wallpapers|cars, ?device_type=desktop|mobile, ?category=...)
app.get("/api/images", async (req, res) => {
  try {
    const { section, device_type, category, car_id } = req.query;
    let query = "SELECT * FROM images WHERE 1=1";
    const params = [];

    if (section) {
      params.push(section);
      query += ` AND $${params.length} = ANY(sections)`;
    }
    if (device_type && device_type !== "all") {
      params.push(device_type);
      query += ` AND device_type = $${params.length}`;
    }
    if (category && category !== "all") {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (car_id) {
      params.push(car_id);
      query += ` AND car_id = $${params.length}`;
    }

    query += " ORDER BY created_at DESC;";
    const result = await pool.query(query, params);
    res.json({ images: result.rows });
  } catch (err) {
    console.error("Get images error:", err);
    res.status(500).json({ error: "Rasmlarni yuklashda xatolik yuz berdi" });
  }
});

// Get Single Image
app.get("/api/images/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("SELECT * FROM images WHERE id = $1;", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Rasm topilmadi!" });
    res.json({ image: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Xatolik" });
  }
});

// Admin: Add New Image / Wallpaper
app.post("/api/images", requireAdmin, async (req, res) => {
  try {
    const { title, url, device_type, sections, category, car_id, resolution } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: "Rasm sarlavhasi va URL havolasi kiritilishi shart!" });
    }

    let sectionsArr = Array.isArray(sections) ? sections : ["wallpapers"];
    if (typeof sections === "string") {
      sectionsArr = sections.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (sectionsArr.length === 0) sectionsArr = ["wallpapers"];

    const insertQuery = `
      INSERT INTO images (title, url, device_type, sections, category, car_id, resolution)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      title.trim(),
      url.trim(),
      device_type || "desktop",
      sectionsArr,
      category || "Supercars",
      car_id || null,
      resolution || "4K Ultra HD"
    ]);

    res.status(201).json({
      message: "Rasm / Wallpaper muvaffaqiyatli saqlandi!",
      image: result.rows[0]
    });
  } catch (err) {
    console.error("Add image error:", err);
    res.status(500).json({ error: "Rasm qo'shishda xatolik yuz berdi" });
  }
});

// Admin: Update Image
app.put("/api/images/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, url, device_type, sections, category, car_id, resolution } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Sarlavha kiritilishi shart!" });
    }

    let sectionsArr = null;
    if (sections) {
      sectionsArr = Array.isArray(sections) ? sections : sections.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const updateQuery = `
      UPDATE images
      SET
        title = COALESCE($1, title),
        url = COALESCE($2, url),
        device_type = COALESCE($3, device_type),
        sections = COALESCE($4, sections),
        category = COALESCE($5, category),
        car_id = COALESCE($6, car_id),
        resolution = COALESCE($7, resolution)
      WHERE id = $8
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [
      title.trim(),
      url ? url.trim() : null,
      device_type || null,
      sectionsArr,
      category || null,
      car_id !== undefined ? car_id : null,
      resolution || null,
      id
    ]);

    if (result.rows.length === 0) return res.status(404).json({ error: "Rasm topilmadi!" });

    res.json({
      message: "Rasm ma'lumotlari yangilandi!",
      image: result.rows[0]
    });
  } catch (err) {
    console.error("Update image error:", err);
    res.status(500).json({ error: "Rasmni tahrirlashda xatolik" });
  }
});

// Admin: Delete Image
app.delete("/api/images/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("DELETE FROM images WHERE id = $1 RETURNING id;", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Rasm topilmadi!" });
    res.json({ message: "Rasm Neon DB dan o'chirildi", id });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ error: "Rasmni o'chirishda xatolik" });
  }
});

// Download Counter
app.post("/api/images/:id/download", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query("UPDATE images SET downloads = downloads + 1 WHERE id = $1;", [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Xatolik" });
  }
});

// Like Image
app.post("/api/images/:id/like", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("UPDATE images SET likes = likes + 1 WHERE id = $1 RETURNING likes;", [id]);
    res.json({ likes: result.rows[0]?.likes || 0 });
  } catch {
    res.status(500).json({ error: "Xatolik" });
  }
});

// Admin Stats
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const usersCount = await pool.query("SELECT COUNT(*)::int AS c FROM users;");
    const videosCount = await pool.query("SELECT COUNT(*)::int AS c FROM videos;");
    const imagesCount = await pool.query("SELECT COUNT(*)::int AS c FROM images;");
    const commentsCount = await pool.query("SELECT COUNT(*)::int AS c FROM comments;");
    const likesCount = await pool.query("SELECT COUNT(*)::int AS c FROM video_likes;");

    res.json({
      total_users: usersCount.rows[0].c,
      total_videos: videosCount.rows[0].c,
      total_images: imagesCount.rows[0].c,
      total_comments: commentsCount.rows[0].c,
      total_likes: likesCount.rows[0].c,
      db_status: "Neon PostgreSQL (Connected)",
      server_time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: "Statistikani olishda xatolik" });
  }
});

// System Health Check
app.get("/api/health", async (req, res) => {
  try {
    const check = await pool.query("SELECT NOW() AS now;");
    res.json({ status: "ok", database: "connected", time: check.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});


// --------------------------------------------------------------------------
// STATIC FILES & SPA FALLBACK
// --------------------------------------------------------------------------
app.use(express.static(ROOT_DIR));

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API Endpoint topilmadi" });
  }
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

// --------------------------------------------------------------------------
// SERVER BOOTSTRAP
// --------------------------------------------------------------------------
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🏎️ DRIFTVERSE SERVER IS RUNNING ON PORT ${PORT}`);
      console.log(`🔥 Neon DB: Connected successfully`);
      console.log(`🛡️ Admin Gateway Password: ${ADMIN_PASSWORD}`);
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error("FATAL: Failed to start DRIFTVERSE server:", err);
    process.exit(1);
  }
}

if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

export default app;
