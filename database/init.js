require('dotenv').config();
const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

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

    // Insert default admin
    const adminCheck = await sql`SELECT id FROM admins WHERE username = 'admin'`;
    if (adminCheck.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await sql`INSERT INTO admins (username, password) VALUES ('admin', ${hashedPassword})`;
      console.log('Default admin created');
    }

    // Insert default settings
    const defaultSettings = [
      ['site_name', 'Prawnique'],
      ['site_tagline', 'Premium Prawns, Naturally Sourced'],
      ['contact_email', 'info@prawnique.com'],
      ['contact_phone', '+880 1XXX-XXXXXX'],
      ['contact_address', 'Dhaka, Bangladesh'],
      ['facebook_url', ''],
      ['twitter_url', ''],
      ['instagram_url', ''],
      ['linkedin_url', ''],
      ['footer_text', '© 2026 Prawnique. All rights reserved.']
    ];

    for (const [key, value] of defaultSettings) {
      await sql`INSERT INTO site_settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO NOTHING`;
    }

    // Insert default categories
    const defaultCategories = [
      ['Black Tiger Shrimp', 'black-tiger-shrimp', 'Premium Black Tiger Shrimp', 0],
      ['Freshwater Prawns', 'freshwater-prawns', 'Giant Freshwater King Prawns', 1],
      ['Vannamei Shrimp', 'vannamei-shrimp', 'Pacific White Shrimp', 2],
      ['Specialty Prawns', 'specialty-prawns', 'Rare and specialty varieties', 3]
    ];

    for (const [name, slug, desc, order] of defaultCategories) {
      await sql`INSERT INTO product_categories (name, slug, description, display_order) VALUES (${name}, ${slug}, ${desc}, ${order}) ON CONFLICT (slug) DO NOTHING`;
    }

    // Insert default sections
    const defaultSections = [
      ['hero', 'Premium Prawns, Naturally Sourced', 'From the pristine waters of Bangladesh', ''],
      ['about_preview', 'About Prawnique', 'Your Trusted Seafood Partner', 'We are dedicated to providing the highest quality prawns.'],
      ['mission', 'Our Mission', '', 'To deliver premium, sustainably sourced prawns.']
    ];

    for (const [key, title, subtitle, content] of defaultSections) {
      await sql`INSERT INTO sections (section_key, title, subtitle, content) VALUES (${key}, ${title}, ${subtitle}, ${content}) ON CONFLICT (section_key) DO NOTHING`;
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
  const dbPath = path.join(__dirname, 'prawnique.db');

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    localDb = new SQL.Database(buffer);
  } else {
    localDb = new SQL.Database();
  }

  // Create tables for local dev
  localDb.run(`
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY, key TEXT UNIQUE, value TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS slider_images (id INTEGER PRIMARY KEY, image_path TEXT, title TEXT, subtitle TEXT, button_text TEXT, button_link TEXT, display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT);
    CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY, section_key TEXT UNIQUE, title TEXT, subtitle TEXT, content TEXT, image_path TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS product_categories (id INTEGER PRIMARY KEY, name TEXT, slug TEXT UNIQUE, description TEXT, display_order INTEGER DEFAULT 0, created_at TEXT);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, category_id INTEGER, name TEXT, slug TEXT UNIQUE, scientific_name TEXT, short_description TEXT, full_description TEXT, featured_image TEXT, is_featured INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, display_order INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS team_members (id INTEGER PRIMARY KEY, name TEXT, position TEXT, bio TEXT, image_path TEXT, email TEXT, phone TEXT, linkedin TEXT, display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT);
    CREATE TABLE IF NOT EXISTS news_posts (id INTEGER PRIMARY KEY, title TEXT, slug TEXT UNIQUE, excerpt TEXT, content TEXT, featured_image TEXT, author TEXT, is_published INTEGER DEFAULT 0, published_at TEXT, created_at TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS gallery_images (id INTEGER PRIMARY KEY, image_path TEXT, title TEXT, description TEXT, category TEXT, display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT);
    CREATE TABLE IF NOT EXISTS contact_submissions (id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT, subject TEXT, message TEXT, is_read INTEGER DEFAULT 0, created_at TEXT);
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (id INTEGER PRIMARY KEY, email TEXT UNIQUE, subscribed_at TEXT, is_active INTEGER DEFAULT 1);
  `);

  // Insert defaults
  const adminCheck = localDb.exec("SELECT id FROM admins WHERE username = 'admin'");
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    localDb.run("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', hashedPassword]);
  }

  // Save to file
  const data = localDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log('Local SQLite initialized');
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
    try {
      const result = await sql.query(sqlQuery, params);
      return { rowCount: result.rowCount };
    } catch (e) {
      console.error('Run error:', e);
      throw e;
    }
  } else {
    try {
      localDb.run(sqlQuery, params);
      // Save to file
      const fs = require('fs');
      const path = require('path');
      const data = localDb.export();
      fs.writeFileSync(path.join(__dirname, 'prawnique.db'), Buffer.from(data));
      return { lastInsertRowid: localDb.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0 };
    } catch (e) {
      throw e;
    }
  }
}

// Postgres-compatible query builder
function query(strings, ...values) {
  if (isVercelPostgres) {
    return sql(strings, ...values);
  } else {
    // Convert template literal to parameterized query for SQLite
    let queryStr = strings[0];
    const params = [];
    values.forEach((val, i) => {
      params.push(val);
      queryStr += '?' + (strings[i + 1] || '');
    });
    return { query: queryStr, params };
  }
}

module.exports = {
  initDatabase,
  all,
  get,
  run,
  query,
  sql: isVercelPostgres ? sql : null,
  isVercelPostgres
};
