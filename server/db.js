import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Seed data with iconic automotive YouTube videos
const initialSeedVideos = [
  {
    youtube_id: "f7oJ2R4-yXU",
    youtube_url: "https://www.youtube.com/watch?v=f7oJ2R4-yXU",
    title: "BMW M4 Competition // Tokyo Midnight Drift Battle",
    category: "Drift",
    description: "Twin-turbo S58 precision tandem drifting through midnight neon streets. Unrestricted exhaust note and tire smoke.",
    duration: "04:32",
    duration_sec: 272,
    thumbnail: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
    channel_name: "TOKYO DRIFT SYNDICATE",
    views: 489200
  },
  {
    youtube_id: "4TshFHRYJ5Y",
    youtube_url: "https://www.youtube.com/watch?v=4TshFHRYJ5Y",
    title: "Ken Block's GYMKHANA 10 // The Ultimate Tire-Shredding Masterpiece",
    category: "Drift",
    description: "Iconic tire destruction across 5 legendary locations featuring the 1,400 HP twin-turbo AWD Hoonicorn V2.",
    duration: "19:04",
    duration_sec: 1144,
    thumbnail: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    channel_name: "HOONIGAN RACING",
    views: 38400000
  },
  {
    youtube_id: "b20_jDqu-r0",
    youtube_url: "https://www.youtube.com/watch?v=b20_jDqu-r0",
    title: "Nissan GT-R Nismo vs BMW M4 // Standing Quarter Mile & Roll Race",
    category: "Drag Race",
    description: "Japanese AWD Godzilla taking on German twin-turbo RWD engineering. Complete telemetry launch battle.",
    duration: "08:14",
    duration_sec: 494,
    thumbnail: "https://images.unsplash.com/photo-1607603750909-408e193868c7?auto=format&fit=crop&w=1200&q=80",
    channel_name: "APEX HORSEPOWER SHOWDOWN",
    views: 890400
  },
  {
    youtube_id: "U1yBqQ3fW-s",
    youtube_url: "https://www.youtube.com/watch?v=U1yBqQ3fW-s",
    title: "Toyota Supra MK4 2JZ // 1000HP Anti-Lag 2-Step Fire & Spool",
    category: "Exhaust & Engine Sound",
    description: "Acoustic masterpiece of the built 2JZ-GTE. Huge single turbo boost pressure and external wastegate backfire.",
    duration: "03:45",
    duration_sec: 225,
    thumbnail: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?auto=format&fit=crop&w=1200&q=80",
    channel_name: "TURBO SOUND LABS",
    views: 1250000
  },
  {
    youtube_id: "ZhhZJ4cMvB4",
    youtube_url: "https://www.youtube.com/watch?v=ZhhZJ4cMvB4",
    title: "Porsche 911 GT3 RS // 9,000 RPM Nürburgring Nordschleife Hot Lap",
    category: "Track Day",
    description: "Pure atmospheric 4.0L flat-six screaming to 9000 RPM around the Green Hell. Telemetry G-force display.",
    duration: "06:49",
    duration_sec: 409,
    thumbnail: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
    channel_name: "PORSCHE MOTORSPORT",
    views: 2450000
  },
  {
    youtube_id: "lA60-hDqP94",
    youtube_url: "https://www.youtube.com/watch?v=lA60-hDqP94",
    title: "Ferrari SF90 Stradale // 0-340 km/h Autobahn Top Speed Acceleration",
    category: "Supercars",
    description: "1000 HP hybrid hypercar unrestricted GPS speed run on the German Autobahn. Raw cockpit camera perspective.",
    duration: "05:12",
    duration_sec: 312,
    thumbnail: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
    channel_name: "AUTOTOPNL",
    views: 1870000
  }
];

export async function initDb() {
  console.log("Initializing Neon PostgreSQL tables...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        avatar TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Videos Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        youtube_id VARCHAR(50) NOT NULL,
        youtube_url TEXT NOT NULL,
        title TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'Drift',
        description TEXT,
        duration VARCHAR(20) DEFAULT '00:00',
        duration_sec INT DEFAULT 0,
        thumbnail TEXT,
        channel_name VARCHAR(100) DEFAULT 'DRIFTVERSE',
        views INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Comments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        video_id INT REFERENCES videos(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(100) NOT NULL,
        user_avatar TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Video Likes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_likes (
        id SERIAL PRIMARY KEY,
        video_id INT REFERENCES videos(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, user_id)
      );
    `);

    // 5. User Garage Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_garage (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        car_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, car_id)
      );
    `);

    await client.query("COMMIT");
    console.log("All tables verified in Neon PostgreSQL.");

    // Seed default admin if not exists
    const adminCheck = await client.query("SELECT id FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1;");
    if (adminCheck.rows.length === 0) {
      const adminPass = process.env.ADMIN_PASSWORD || "driftadmin2026";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPass, salt);
      await client.query(
        `INSERT INTO users (username, email, password_hash, role, avatar)
         VALUES ($1, $2, $3, $4, $5);`,
        [
          "admin",
          "admin@driftverse.io",
          hash,
          "admin",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        ]
      );
      console.log(`Default admin created: admin / ${adminPass}`);
    }

    // Seed initial videos if empty
    const videoCount = await client.query("SELECT COUNT(*) FROM videos;");
    if (parseInt(videoCount.rows[0].count) === 0) {
      console.log("Seeding initial high-octane YouTube videos...");
      for (const v of initialSeedVideos) {
        await client.query(
          `INSERT INTO videos (youtube_id, youtube_url, title, category, description, duration, duration_sec, thumbnail, channel_name, views)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
          [v.youtube_id, v.youtube_url, v.title, v.category, v.description, v.duration, v.duration_sec, v.thumbnail, v.channel_name, v.views]
        );
      }
      console.log("Seeded initial videos into Neon DB.");
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error initializing DB:", err);
    throw err;
  } finally {
    client.release();
  }
}
