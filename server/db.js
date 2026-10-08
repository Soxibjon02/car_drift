import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const { Pool } = pg;

const NEON_DEFAULT_URL = "postgresql://neondb_owner:npg_Imu9voAFRtE2@ep-billowing-silence-b1vq1ylz-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || NEON_DEFAULT_URL,
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

    // 6. Images & Wallpapers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        device_type VARCHAR(20) DEFAULT 'desktop',
        sections TEXT[] DEFAULT ARRAY['wallpapers'],
        category VARCHAR(50) DEFAULT 'Supercars',
        car_id VARCHAR(50),
        resolution VARCHAR(30) DEFAULT '4K Ultra HD',
        views INT DEFAULT 0,
        downloads INT DEFAULT 0,
        likes INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. System Settings Table (to track initial seed status)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query("COMMIT");
    console.log("All tables verified in Neon PostgreSQL.");

    // STRICT ADMIN LOCK: Only soxibgaybullayev439@gmail.com with s0x1bj0n$02$
    const targetAdminEmail = process.env.ADMIN_EMAIL || "soxibgaybullayev439@gmail.com";
    const targetAdminPass = process.env.ADMIN_PASSWORD || "s0x1bj0n$02$";

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(targetAdminPass, salt);

    // Demote any old legacy admin accounts
    await client.query("UPDATE users SET role = 'user' WHERE email != $1 AND role = 'admin';", [targetAdminEmail]);

    // Ensure the specific admin account exists with this exact email & password
    const adminUser = await client.query("SELECT id FROM users WHERE email = $1 LIMIT 1;", [targetAdminEmail]);
    if (adminUser.rows.length === 0) {
      await client.query(
        `INSERT INTO users (username, email, password_hash, role, avatar)
         VALUES ($1, $2, $3, 'admin', $4);`,
        [
          "soxibjon",
          targetAdminEmail,
          hash,
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        ]
      );
      console.log(`Dedicated secure admin created: ${targetAdminEmail}`);
    } else {
      await client.query(
        "UPDATE users SET role = 'admin', password_hash = $1 WHERE email = $2;",
        [hash, targetAdminEmail]
      );
      console.log(`Dedicated secure admin credentials synced: ${targetAdminEmail}`);
    }

    // Seed initial videos ONLY once on first-time setup; NEVER re-seed if videos are deleted!
    const seedFlag = await client.query("SELECT value FROM system_settings WHERE key = 'videos_seeded' LIMIT 1;");
    if (seedFlag.rows.length === 0) {
      const videoCount = await client.query("SELECT COUNT(*) FROM videos;");
      if (parseInt(videoCount.rows[0].count) === 0) {
        console.log("Seeding initial high-octane YouTube videos (first time setup only)...");
        for (const v of initialSeedVideos) {
          await client.query(
            `INSERT INTO videos (youtube_id, youtube_url, title, category, description, duration, duration_sec, thumbnail, channel_name, views)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
            [v.youtube_id, v.youtube_url, v.title, v.category, v.description, v.duration, v.duration_sec, v.thumbnail, v.channel_name, v.views]
          );
        }
        console.log("Seeded initial videos into Neon DB.");
      }
      await client.query("INSERT INTO system_settings (key, value) VALUES ('videos_seeded', 'true') ON CONFLICT (key) DO NOTHING;");
    }

    // Seed initial wallpapers ONLY once on first-time setup; NEVER re-seed if deleted!
    const wallSeedFlag = await client.query("SELECT value FROM system_settings WHERE key = 'wallpapers_seeded' LIMIT 1;");
    if (wallSeedFlag.rows.length === 0) {
      const wallCount = await client.query("SELECT COUNT(*) FROM images;");
      if (parseInt(wallCount.rows[0].count) === 0) {
        console.log("Seeding initial high-res automotive wallpapers (first time setup only)...");
        const seedWallpapers = [
          {
            title: "BMW M4 Competition // Midnight Tokyo Drift",
            url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=2560&q=90",
            device_type: "desktop",
            sections: ["wallpapers", "cars"],
            category: "Drift",
            car_id: "bmw-m4-competition",
            resolution: "4K Ultra HD"
          },
          {
            title: "Nissan GT-R Nismo // Cyberpunk Neon Rain",
            url: "https://images.unsplash.com/photo-1607603750909-408e193868c7?auto=format&fit=crop&w=2560&q=90",
            device_type: "desktop",
            sections: ["wallpapers", "cars"],
            category: "Supercars",
            car_id: "nissan-gtr-r35",
            resolution: "4K Ultra HD"
          },
          {
            title: "Porsche 911 GT3 RS // Apex Predator Nürburgring",
            url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=2560&q=90",
            device_type: "desktop",
            sections: ["wallpapers", "cars"],
            category: "Track Day",
            car_id: "porsche-gt3-rs-992",
            resolution: "4K Ultra HD"
          },
          {
            title: "Ferrari SF90 Stradale // Rosso Corsa Highway",
            url: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=2560&q=90",
            device_type: "desktop",
            sections: ["wallpapers"],
            category: "Supercars",
            car_id: "ferrari-sf90",
            resolution: "4K Ultra HD"
          },
          {
            title: "Toyota Supra MK4 // 2JZ Smoke Machine Mobile Wallpaper",
            url: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?auto=format&fit=crop&w=1080&h=1920&q=90",
            device_type: "mobile",
            sections: ["wallpapers", "cars"],
            category: "Drift",
            car_id: "toyota-supra-mk4",
            resolution: "1080x1920 Vertical"
          },
          {
            title: "Lamborghini Aventador SVJ // Night Flame Mobile Lockscreen",
            url: "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1080&h=1920&q=90",
            device_type: "mobile",
            sections: ["wallpapers"],
            category: "Supercars",
            car_id: "lamborghini-aventador-svj",
            resolution: "1080x1920 Vertical"
          },
          {
            title: "Mazda RX-7 Spirit R // Gunsai Touge Mobile Wallpaper",
            url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1080&h=1920&q=90",
            device_type: "mobile",
            sections: ["wallpapers", "cars"],
            category: "JDM Culture",
            car_id: "mazda-rx7-spirit-r",
            resolution: "1080x1920 Vertical"
          },
          {
            title: "Bugatti Chiron Super Sport // French Racing Blue 4K",
            url: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=2560&q=90",
            device_type: "desktop",
            sections: ["wallpapers"],
            category: "Supercars",
            car_id: "bugatti-chiron",
            resolution: "4K Ultra HD"
          }
        ];

        for (const w of seedWallpapers) {
          await client.query(
            `INSERT INTO images (title, url, device_type, sections, category, car_id, resolution, views, downloads, likes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 120, 45, 18);`,
            [w.title, w.url, w.device_type, w.sections, w.category, w.car_id, w.resolution]
          );
        }
        console.log("Seeded initial wallpapers into Neon DB.");
      }
      await client.query("INSERT INTO system_settings (key, value) VALUES ('wallpapers_seeded', 'true') ON CONFLICT (key) DO NOTHING;");
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error initializing DB:", err);
    throw err;
  } finally {
    client.release();
  }
}
