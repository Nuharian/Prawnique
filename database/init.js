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

    // Insert default settings
    const defaultSettings = [
      ['site_name', 'Prawnique'],
      ['site_tagline', 'Premium Prawns, Naturally Sourced'],
      ['site_logo', '/img/logo.png'],
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
      ['mission', 'Our Mission', '', 'To deliver premium, sustainably sourced prawns.'],
      // About Page Sections
      ['about_story', 'Bringing the Best of Bangladesh\'s Seafood to the World', 'Our Story', 'Founded with a vision to showcase Bangladesh\'s exceptional prawn and seafood industry to the global market, Prawnique has grown to become a trusted name in quality seafood exports.\n\nOur journey began in the coastal regions of Bangladesh, where generations of fishing communities have honed their craft. We partner directly with these skilled farmers and fishermen to bring you the freshest, most sustainably sourced prawns available.\n\nToday, we export to over 50 countries, maintaining our commitment to quality, sustainability, and fair partnerships with local communities.'],
      ['about_mission', 'Our Mission', '', 'To deliver premium, sustainably sourced prawns and seafood while supporting local fishing communities and preserving marine ecosystems for future generations.'],
      ['about_vision', 'Our Vision', '', 'To be the world\'s most trusted seafood partner, recognized for exceptional quality, ethical practices, and positive impact on communities and environment.'],
      // Products Section
      ['products_header', 'Our Products', 'Premium Seafood Selection', 'Discover our range of premium prawns and seafood, sourced responsibly and processed with care.'],
      // Features Section
      ['features_header', 'Why Choose Us', 'The Prawnique Difference', 'Quality you can trust, freshness you can taste.'],
      ['feature_quality', 'Premium Quality', '', 'Only the finest prawns make it through our rigorous quality control process.'],
      ['feature_sustainable', 'Sustainably Sourced', '', 'Our farms follow eco-friendly practices to protect marine ecosystems.'],
      ['feature_fresh', 'Fresh Frozen', '', 'Flash-frozen at peak freshness to lock in flavor and nutrients.'],
      ['feature_delivery', 'Global Delivery', '', 'We export to over 50 countries with reliable cold-chain logistics.'],
      // Testimonials Section
      ['testimonials_header', 'Testimonials', 'What Our Clients Say', 'Trusted by seafood importers and distributors worldwide.'],
      // News Section
      ['news_header', 'Latest News', 'From Our Blog', 'Stay updated with industry news and company updates.'],
      // CTA Section
      ['cta_section', 'Ready to Partner With Us?', '', 'Get in touch today to discuss your seafood requirements. We offer competitive pricing, reliable supply, and exceptional quality.'],
      // Footer
      ['footer_about', 'About Footer', '', 'Your trusted partner for premium quality prawns and seafood products. Sustainably sourced from the coastal waters of Bangladesh.'],
      ['footer_newsletter', 'Newsletter', '', 'Subscribe to get the latest news and offers.'],
      ['footer_tagline', 'Footer Tagline', '', 'Designed with 💙 for seafood lovers']
    ];

    for (const [key, title, subtitle, content] of defaultSections) {
      await sql`INSERT INTO sections (section_key, title, subtitle, content) VALUES (${key}, ${title}, ${subtitle}, ${content}) ON CONFLICT (section_key) DO NOTHING`;
    }

    // Clear and insert default testimonials
    await sql`DELETE FROM testimonials`;
    
    const defaultTestimonials = [
      ['James Wilson', 'Seafood Imports Ltd', 'Managing Director, UK', 'Prawnique has been our trusted supplier for over 5 years. Their consistency in quality and timely deliveries have made them an invaluable partner.', 5, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', true, 0],
      ['Yuki Tanaka', 'Tokyo Seafood Co.', 'CEO, Japan', 'The quality of their Black Tiger Shrimp is exceptional. Our customers in Japan appreciate the freshness and taste. Highly recommended!', 5, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', true, 1],
      ['Michael Schmidt', 'Euro Foods GmbH', 'Procurement Manager, Germany', 'Professional team, excellent communication, and top-notch products. Prawnique understands what international buyers need.', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', true, 2]
    ];

    for (const [name, company, position, content, rating, image, featured, order] of defaultTestimonials) {
      await sql`INSERT INTO testimonials (client_name, company, position, content, rating, image_path, is_featured, display_order) 
                VALUES (${name}, ${company}, ${position}, ${content}, ${rating}, ${image}, ${featured}, ${order})`;
    }

    // Insert default news articles
    const defaultNews = [
      ['sustainable-prawn-farming-bangladesh', 'Sustainable Prawn Farming: Leading the Way in Bangladesh', 'Our commitment to eco-friendly aquaculture practices is setting new standards in the industry.', 'Bangladesh has emerged as a global leader in sustainable prawn farming, with innovative techniques that protect marine ecosystems while delivering premium quality seafood.\n\nOur farms utilize advanced water management systems, natural feed supplements, and strict environmental monitoring to ensure minimal impact on local waterways. This approach not only preserves the delicate coastal ecosystem but also produces prawns with superior taste and nutritional value.\n\nThe integration of traditional farming wisdom with modern technology has created a model that other countries are now studying and implementing.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', 'Prawnique Team', true],
      ['export-milestone-50-countries', 'Prawnique Reaches Export Milestone: Now Serving 50+ Countries', 'A major achievement in our global expansion as we celebrate reaching customers across six continents.', 'We are proud to announce that Prawnique has successfully expanded its reach to over 50 countries worldwide, marking a significant milestone in our journey to bring premium Bangladeshi seafood to global markets.\n\nThis achievement reflects our commitment to quality, reliability, and customer satisfaction. From Europe to Asia, North America to Australia, our products are now enjoyed by seafood lovers across diverse cultures and cuisines.\n\nOur success is built on strong partnerships with local distributors, rigorous quality control, and innovative cold-chain logistics that ensure our prawns arrive fresh and delicious, no matter the destination.', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', 'Prawnique Team', true],
      ['new-processing-facility-opens', 'State-of-the-Art Processing Facility Opens in Chittagong', 'Our new facility incorporates the latest technology for enhanced quality control and increased production capacity.', 'Prawnique has inaugurated its newest processing facility in Chittagong, featuring cutting-edge technology and expanded capacity to meet growing international demand.\n\nThe facility includes advanced freezing systems, automated sorting equipment, and comprehensive quality testing laboratories. These improvements allow us to process larger volumes while maintaining our strict quality standards.\n\nThe new facility also creates over 200 jobs in the local community and incorporates sustainable practices including solar power generation and water recycling systems.', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop', 'Prawnique Team', true]
    ];

    for (const [slug, title, excerpt, content, image, author, published] of defaultNews) {
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
  try {
    const data = localDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    console.log('Database saved to disk');
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }

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
      const dbDir = process.env.VERCEL ? '/tmp' : __dirname;
      const dbPath = path.join(dbDir, 'prawnique.db');

      try {
        const data = localDb.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
      } catch (err) {
        console.error('Warning: Could not save DB to disk', err);
      }
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
