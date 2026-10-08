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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "driftadmin2026";

app.use(cors());
app.use(express.json());

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

// Admin-Only Login with Dedicated Gateway Password
app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Admin parolini kiriting!" });
    }

    // Check against configured ADMIN_PASSWORD
    if (password !== ADMIN_PASSWORD) {
      // Also check if admin user in database has this password
      const adminUser = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1;");
      let matched = false;
      if (adminUser.rows.length > 0) {
        matched = await bcrypt.compare(password, adminUser.rows[0].password_hash);
      }
      if (!matched) {
        return res.status(401).json({ error: "Admin paroli noto'g'ri! Ruxsat berilmadi." });
      }
    }

    // Get or create admin user info
    let adminRecord = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1;");
    const admin = adminRecord.rows[0] || {
      id: 1,
      username: "admin",
      email: "admin@driftverse.io",
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
        role: "admin",
        avatar: admin.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Admin tizimiga kirishda xato" });
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
    const videoId = parseInt(req.params.id);
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
      WHERE v.id = $1
      GROUP BY v.id;
    `;
    const videoRes = await pool.query(videoQuery, [videoId, userId]);
    if (videoRes.rows.length === 0) {
      return res.status(404).json({ error: "Video topilmadi!" });
    }

    const commentsQuery = `
      SELECT 
        c.id, c.video_id, c.user_id, c.user_name, c.user_avatar, c.content, c.created_at,
        u.role AS user_role
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.video_id = $1
      ORDER BY c.created_at DESC;
    `;
    const commentsRes = await pool.query(commentsQuery, [videoId]);

    res.json({
      video: videoRes.rows[0],
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

// Admin Stats
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const usersCount = await pool.query("SELECT COUNT(*)::int AS c FROM users;");
    const videosCount = await pool.query("SELECT COUNT(*)::int AS c FROM videos;");
    const commentsCount = await pool.query("SELECT COUNT(*)::int AS c FROM comments;");
    const likesCount = await pool.query("SELECT COUNT(*)::int AS c FROM video_likes;");

    res.json({
      total_users: usersCount.rows[0].c,
      total_videos: videosCount.rows[0].c,
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

startServer();
