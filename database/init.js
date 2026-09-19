require('dotenv').config();
const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');
const seed = require('./seed');

// Check if we're using Vercel Postgres or local fallback
const isVercelPostgres = !!process.env.POSTGRES_URL;

let localDb = null;

// Initialize database
async function initDatabase() {
  if (isVercelPostgres) {
    console.log('Using Vercel Postgres database');
    await initPostgres();
  } else {
    console.log('Using local SQLite database (for development)');
    await initLocalDb();
  }
}

// Columns added after the original schema shipped. Existing deployments already
// have the tables, so CREATE TABLE IF NOT EXISTS alone would never add these.
const sectionColumnMigrations = [
  ['icon', 'VARCHAR(255)'],
  ['button_text', 'VARCHAR(255)'],
  ['button_link', 'VARCHAR(255)']
];

// Initialize Vercel Postgres tables
async function initPostgres() {
  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS slider_images (
        id SERIAL PRIMARY KEY,
        image_path TEXT NOT NULL,
        title VARCHAR(255),
        subtitle TEXT,
        button_text VARCHAR(255),
        button_link VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        section_key VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255),
        subtitle TEXT,
        content TEXT,
        image_path TEXT,
        icon VARCHAR(255),
        button_text VARCHAR(255),
        button_link VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    for (const [column, type] of sectionColumnMigrations) {
      await sql.query(`ALTER TABLE sections ADD COLUMN IF NOT EXISTS ${column} ${type}`);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS product_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES product_categories(id),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        scientific_name VARCHAR(255),
        short_description TEXT,
        full_description TEXT,
        featured_image TEXT,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        bio TEXT,
        image_path TEXT,
        email VARCHAR(255),
        phone VARCHAR(255),
        linkedin TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS news_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT,
        featured_image TEXT,
        author VARCHAR(255),
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id SERIAL PRIMARY KEY,
        image_path TEXT NOT NULL,
        title VARCHAR(255),
        description TEXT,
        category VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        position VARCHAR(255),
        content TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        image_path TEXT,
        is_featured BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert default admin
    const adminCheck = await sql`SELECT id FROM admins WHERE username = 'admin'`;
    if (adminCheck.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await sql`INSERT INTO admins (username, password) VALUES ('admin', ${hashedPassword})`;
      console.log('Default admin created');
    }

    for (const [key, value] of seed.settings) {
      await sql`INSERT INTO site_settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO NOTHING`;
    }

    for (const [name, slug, desc, order] of seed.categories) {
      await sql`INSERT INTO product_categories (name, slug, description, display_order) VALUES (${name}, ${slug}, ${desc}, ${order}) ON CONFLICT (slug) DO NOTHING`;
    }

    // Seed sections without clobbering anything the admin has already edited.
    // Only blank columns get backfilled from the defaults.
    for (const s of seed.sections) {
      await sql`
        INSERT INTO sections (section_key, title, subtitle, content, image_path, icon, button_text, button_link)
        VALUES (${s.key}, ${s.title || ''}, ${s.subtitle || ''}, ${s.content || ''}, ${s.image_path || ''}, ${s.icon || ''}, ${s.button_text || ''}, ${s.button_link || ''})
        ON CONFLICT (section_key) DO UPDATE SET
          image_path  = COALESCE(NULLIF(sections.image_path, ''),  ${s.image_path || ''}),
          icon        = COALESCE(NULLIF(sections.icon, ''),        ${s.icon || ''}),
          button_text = COALESCE(NULLIF(sections.button_text, ''), ${s.button_text || ''}),
          button_link = COALESCE(NULLIF(sections.button_link, ''), ${s.button_link || ''})
      `;
    }

    // Insert default testimonials only if none exist.
    // Postgres returns COUNT(*) as a string, so this must be parsed before comparing.
    const testimonialCheck = await sql`SELECT COUNT(*) as count FROM testimonials`;
    if (parseInt(testimonialCheck.rows[0].count, 10) === 0) {
      for (const [name, company, position, content, rating, image, featured, order] of seed.testimonials) {
        await sql`INSERT INTO testimonials (client_name, company, position, content, rating, image_path, is_featured, display_order)
                  VALUES (${name}, ${company}, ${position}, ${content}, ${rating}, ${image}, ${featured}, ${order})`;
      }
    }

    for (const [slug, title, excerpt, content, image, author, published] of seed.news) {
      await sql`INSERT INTO news_posts (slug, title, excerpt, content, featured_image, author, is_published, published_at)
                VALUES (${slug}, ${title}, ${excerpt}, ${content}, ${image}, ${author}, ${published}, CURRENT_TIMESTAMP)
                ON CONFLICT (slug) DO NOTHING`;
    }

    console.log('Postgres database initialized successfully');
  } catch (error) {
    console.error('Postgres init error:', error);
    throw error;
  }
}

// Local SQLite fallback for development
async function initLocalDb() {
  const initSqlJs = require('sql.js');
  const fs = require('fs');
  const path = require('path');

  // Use /tmp directory on Vercel, otherwise use current directory
  const dbDir = process.env.VERCEL ? '/tmp' : __dirname;
  const dbPath = path.join(dbDir, 'prawnique.db');

  console.log(`Initializing SQLite database at ${dbPath}`);

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    console.log('Loading existing database file');
    const buffer = fs.readFileSync(dbPath);
    localDb = new SQL.Database(buffer);
  } else {
    console.log('Creating new database instance');
    localDb = new SQL.Database();
  }

  // Create tables for local dev. Kept at parity with the Postgres schema above.
  localDb.run(`
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY, key TEXT UNIQUE, value TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS slider_images (id INTEGER PRIMARY KEY, image_path TEXT, title TEXT, subtitle TEXT, button_text TEXT, button_link TEXT, display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT);
    CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY, section_key TEXT UNIQUE, title TEXT, subtitle TEXT, content TEXT, image_path TEXT, icon TEXT, button_text TEXT, button_link TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS product_categories (id INTEGER PRIMARY KEY, name TEXT, slug TEXT UNIQUE, description TEXT, display_order INTEGER DEFAULT 0, created_at TEXT);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, category_id INTEGER, name TEXT, slug TEXT UNIQUE, scientific_name TEXT, short_description TEXT, full_description TEXT, featured_image TEXT, is_featured INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, display_order INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS team_members (id INTEGER PRIMARY KEY, name TEXT, position TEXT, bio TEXT, image_path TEXT, email TEXT, phone TEXT, linkedin TEXT, display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT);
    CREATE TABLE IF NOT EXISTS news_posts (id INTEGER PRIMARY KEY, title TEXT, slug TEXT UNIQUE, excerpt TEXT, content TEXT, featured_image TEXT, author TEXT, is_published INTEGER DEFAULT 0, published_at TEXT, created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS gallery_images (id INTEGER PRIMARY KEY, image_path TEXT, title TEXT, description TEXT, category TEXT, display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT);
    CREATE TABLE IF NOT EXISTS contact_submissions (id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT, subject TEXT, message TEXT, is_read INTEGER DEFAULT 0, created_at TEXT);
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (id INTEGER PRIMARY KEY, email TEXT UNIQUE, subscribed_at TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY, client_name TEXT, company TEXT, position TEXT, content TEXT, rating INTEGER DEFAULT 5, image_path TEXT, is_featured INTEGER DEFAULT 0, display_order INTEGER DEFAULT 0, created_at TEXT);
  `);

  // Databases created before the sections table grew these columns need them added.
  const existingSectionColumns = localDb.exec('PRAGMA table_info(sections)');
  const sectionColumnNames = existingSectionColumns.length
    ? existingSectionColumns[0].values.map(row => row[1])
    : [];
  for (const [column] of sectionColumnMigrations) {
    if (!sectionColumnNames.includes(column)) {
      localDb.run(`ALTER TABLE sections ADD COLUMN ${column} TEXT`);
    }
  }

  // Insert defaults
  const adminCheck = localDb.exec("SELECT id FROM admins WHERE username = 'admin'");
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    localDb.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
  }

  for (const [key, value] of seed.settings) {
    localDb.run('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)', [key, value]);
  }

  for (const [name, slug, desc, order] of seed.categories) {
    localDb.run('INSERT OR IGNORE INTO product_categories (name, slug, description, display_order) VALUES (?, ?, ?, ?)', [name, slug, desc, order]);
  }

  for (const s of seed.sections) {
    localDb.run(
      'INSERT OR IGNORE INTO sections (section_key, title, subtitle, content, image_path, icon, button_text, button_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [s.key, s.title || '', s.subtitle || '', s.content || '', s.image_path || '', s.icon || '', s.button_text || '', s.button_link || '']
    );
  }

  const testimonialCheck = localDb.exec('SELECT COUNT(*) as count FROM testimonials');
  const testimonialCount = testimonialCheck.length ? testimonialCheck[0].values[0][0] : 0;
  if (testimonialCount === 0) {
    for (const [name, company, position, content, rating, image, featured, order] of seed.testimonials) {
      localDb.run(
        'INSERT INTO testimonials (client_name, company, position, content, rating, image_path, is_featured, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, company, position, content, rating, image, featured ? 1 : 0, order]
      );
    }
  }

  for (const [slug, title, excerpt, content, image, author, published] of seed.news) {
    localDb.run(
      'INSERT OR IGNORE INTO news_posts (slug, title, excerpt, content, featured_image, author, is_published, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [slug, title, excerpt, content, image, author, published ? 1 : 0]
    );
  }

  saveLocalDb();
  console.log('Local SQLite initialized');
}

function saveLocalDb() {
  try {
    const fs = require('fs');
    const path = require('path');
    const dbDir = process.env.VERCEL ? '/tmp' : __dirname;
    const dbPath = path.join(dbDir, 'prawnique.db');
    const data = localDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('Warning: Could not save DB to disk', err);
  }
}

// Query helpers
async function all(sqlQuery, params = []) {
  if (isVercelPostgres) {
    try {
      const result = await sql.query(sqlQuery, params);
      return result.rows;
    } catch (e) {
      console.error('Query error:', e);
      return [];
    }
  } else {
    try {
      const result = localDb.exec(sqlQuery, params);
      if (result.length === 0) return [];
      const columns = result[0].columns;
      return result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
      });
    } catch (e) {
      console.error('SQLite query error:', e.message, '\n  query:', sqlQuery);
      return [];
    }
  }
}

async function get(sqlQuery, params = []) {
  const results = await all(sqlQuery, params);
  return results.length > 0 ? results[0] : null;
}

async function run(sqlQuery, params = []) {
  if (isVercelPostgres) {
    const result = await sql.query(sqlQuery, params);
    return { rowCount: result.rowCount };
  }

  localDb.run(sqlQuery, params);
  saveLocalDb();
  return { lastInsertRowid: localDb.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || 0 };
}

module.exports = {
  initDatabase,
  all,
  get,
  run,
  sql: isVercelPostgres ? sql : null,
  isVercelPostgres
};
