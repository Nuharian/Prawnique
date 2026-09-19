require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Import modules
const { initDatabase, all, get, run, sql, isVercelPostgres } = require('./database/init');
const { upload, getImageUrl, isCloudinaryConfigured } = require('./utils/upload');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// The admin panel is served from the same origin as the API, so credentialed
// requests never need to come from anywhere else. Reflecting an arbitrary
// Origin while allowing credentials would let any site call the admin API with
// a logged-in admin's cookie.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Same-origin and server-to-server requests send no Origin header.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Baseline security headers (no extra dependency needed).
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Simple token-based auth (stateless)
const SESSION_SECRET = resolveSessionSecret();

function resolveSessionSecret() {
    const configured = process.env.SESSION_SECRET;
    const placeholder = 'prawnique-secret-key-change-in-production';

    if (configured && configured !== placeholder && configured.length >= 16) {
        return configured;
    }

    if (IS_PRODUCTION) {
        // A predictable secret means anyone can forge an admin auth token, so in
        // production we refuse to fall back to the shared default. A random
        // secret keeps the site up but invalidates tokens on restart, which is
        // the safe failure mode.
        console.error(
            'SECURITY: SESSION_SECRET is missing or too weak. Set it in your ' +
            'environment variables. Falling back to a random per-boot secret, ' +
            'which will sign admins out whenever the server restarts.'
        );
        return crypto.randomBytes(48).toString('hex');
    }

    console.warn('SESSION_SECRET not set - using a development-only default.');
    return placeholder;
}

function signPayload(payload) {
    return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

function createAuthToken(adminId, username) {
    const payload = JSON.stringify({ adminId, username, exp: Date.now() + 24 * 60 * 60 * 1000 });
    return Buffer.from(payload + '.' + signPayload(payload)).toString('base64');
}

function verifyAuthToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const separator = decoded.lastIndexOf('.');
        if (separator === -1) return null;

        const payload = decoded.slice(0, separator);
        const signature = decoded.slice(separator + 1);
        const expected = signPayload(payload);

        // Constant-time compare so the signature can't be guessed byte by byte.
        const given = Buffer.from(signature, 'hex');
        const want = Buffer.from(expected, 'hex');
        if (given.length !== want.length) return null;
        if (!crypto.timingSafeEqual(given, want)) return null;

        const data = JSON.parse(payload);
        if (data.exp < Date.now()) return null;

        return data;
    } catch {
        return null;
    }
}

// Error responses leak schema details and stack context when the raw message is
// echoed back, so log the real error and return something generic.
function fail(res, error, context, status = 500) {
    console.error(`${context}:`, error);
    res.status(status).json({ error: 'Something went wrong. Please try again.' });
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth middleware
const requireAuth = (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = verifyAuthToken(token);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.adminId = user.adminId;
    req.adminUsername = user.username;
    next();
};

// On serverless the module can start handling requests before the database
// finishes initialising. `databaseReady` is declared at the bottom of this file;
// it is only dereferenced here at request time, so the ordering is fine.
app.use('/api', async (req, res, next) => {
    try {
        await databaseReady;
        next();
    } catch (error) {
        fail(res, error, 'database initialization', 503);
    }
});

// ============================================
// PUBLIC API ROUTES
// ============================================

app.get('/api/settings', async (req, res) => {
    try {
        let settings;
        if (isVercelPostgres) {
            const result = await sql`SELECT key, value FROM site_settings`;
            settings = result.rows;
        } else {
            settings = await all('SELECT key, value FROM site_settings');
        }
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.key] = s.value);
        res.json(settingsObj);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/slider', async (req, res) => {
    try {
        let images;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM slider_images WHERE is_active = true ORDER BY display_order ASC`;
            images = result.rows;
        } else {
            images = await all('SELECT * FROM slider_images WHERE is_active = 1 ORDER BY display_order ASC');
        }
        res.json(images);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/sections', async (req, res) => {
    try {
        let sections;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM sections`;
            sections = result.rows;
        } else {
            sections = await all('SELECT * FROM sections');
        }
        const sectionsObj = {};
        sections.forEach(s => sectionsObj[s.section_key] = s);
        res.json(sectionsObj);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        let categories;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM product_categories ORDER BY display_order ASC`;
            categories = result.rows;
        } else {
            categories = await all('SELECT * FROM product_categories ORDER BY display_order ASC');
        }
        res.json(categories);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/products', async (req, res) => {
    try {
        let products;
        if (isVercelPostgres) {
            const result = await sql`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE p.is_active = true
        ORDER BY p.display_order ASC
      `;
            products = result.rows;
        } else {
            products = await all(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        ORDER BY p.display_order ASC
      `);
        }

        if (req.query.category) {
            products = products.filter(p => p.category_slug === req.query.category);
        }
        if (req.query.featured === 'true') {
            products = products.filter(p => p.is_featured);
        }
        res.json(products);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/products/:slug', async (req, res) => {
    try {
        let product;
        if (isVercelPostgres) {
            const result = await sql`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE p.slug = ${req.params.slug}
      `;
            product = result.rows[0];
        } else {
            product = await get(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `, [req.params.slug]);
        }

        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/team', async (req, res) => {
    try {
        let members;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM team_members WHERE is_active = true ORDER BY display_order ASC`;
            members = result.rows;
        } else {
            members = await all('SELECT * FROM team_members WHERE is_active = 1 ORDER BY display_order ASC');
        }
        res.json(members);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/testimonials', async (req, res) => {
    try {
        let testimonials;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM testimonials ORDER BY display_order ASC`;
            testimonials = result.rows;
        } else {
            testimonials = await all('SELECT * FROM testimonials ORDER BY display_order ASC');
        }
        res.json(testimonials);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        let posts, total;
        if (isVercelPostgres) {
            const countResult = await sql`SELECT COUNT(*) as count FROM news_posts WHERE is_published = true`;
            total = parseInt(countResult.rows[0].count);

            const result = await sql`
        SELECT * FROM news_posts 
        WHERE is_published = true 
        ORDER BY published_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
            posts = result.rows;
        } else {
            const allPosts = await all('SELECT * FROM news_posts WHERE is_published = 1 ORDER BY published_at DESC');
            total = allPosts.length;
            posts = allPosts.slice(offset, offset + limit);
        }

        res.json({ posts, total, limit, offset });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/news/:slug', async (req, res) => {
    try {
        let post;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM news_posts WHERE slug = ${req.params.slug} AND is_published = true`;
            post = result.rows[0];
        } else {
            post = await get('SELECT * FROM news_posts WHERE slug = ? AND is_published = 1', [req.params.slug]);
        }
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.get('/api/gallery', async (req, res) => {
    try {
        let images;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM gallery_images WHERE is_active = true ORDER BY display_order ASC`;
            images = result.rows;
        } else {
            images = await all('SELECT * FROM gallery_images WHERE is_active = 1 ORDER BY display_order ASC');
        }
        if (req.query.category) {
            images = images.filter(i => i.category === req.query.category);
        }
        res.json(images);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }
        if (!EMAIL_PATTERN.test(String(email))) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }
        if (String(message).length > 5000 || String(name).length > 200) {
            return res.status(400).json({ error: 'Your message is too long' });
        }

        if (isVercelPostgres) {
            await sql`INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (${name}, ${email}, ${phone || null}, ${subject || null}, ${message})`;
        } else {
            await run('INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
                [name, email, phone || null, subject || null, message]);
        }
        res.json({ success: true, message: 'Thank you for your message!' });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        if (!EMAIL_PATTERN.test(String(email))) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        if (isVercelPostgres) {
            await sql`INSERT INTO newsletter_subscribers (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING`;
        } else {
            await run('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)', [email]);
        }
        res.json({ success: true, message: 'Thank you for subscribing!' });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// ============================================
// ADMIN AUTH ROUTES
// ============================================

// In-memory throttle for login attempts. Serverless instances are short-lived
// and not shared, so this is a speed bump rather than a hard guarantee - but it
// still removes the "unlimited free guesses" property the login had before.
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function loginThrottle(req) {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = loginAttempts.get(key);

    if (!record || now - record.first > LOGIN_WINDOW_MS) {
        loginAttempts.set(key, { count: 1, first: now });
        return { blocked: false };
    }

    record.count += 1;
    return { blocked: record.count > MAX_LOGIN_ATTEMPTS };
}

function clearLoginThrottle(req) {
    loginAttempts.delete(req.ip || 'unknown');
}

app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (loginThrottle(req).blocked) {
            return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
        }

        let admin;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM admins WHERE username = ${username}`;
            admin = result.rows[0];
        } else {
            admin = await get('SELECT * FROM admins WHERE username = ?', [username]);
        }

        // Always run a bcrypt comparison so a missing user and a wrong password
        // take the same amount of time and can't be told apart.
        const hash = admin ? admin.password : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
        const passwordMatch = bcrypt.compareSync(password, hash);

        if (!admin || !passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        clearLoginThrottle(req);
        const token = createAuthToken(admin.id, admin.username);

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: IS_PRODUCTION,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ success: true, username: admin.username });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true });
});

app.get('/api/admin/check', requireAuth, (req, res) => {
    res.json({ authenticated: true, username: req.adminUsername });
});

// ============================================
// ADMIN CRUD ROUTES
// ============================================

// Upload with Cloudinary support
app.post('/api/admin/upload/:type', requireAuth, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    error: 'File too large. Maximum size is 5MB. Please compress your image before uploading.' 
                });
            }
            if (err.message === 'Only image files are allowed!') {
                return res.status(400).json({ error: err.message });
            }
            return res.status(500).json({ error: 'Upload failed: ' + err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const imageUrl = getImageUrl(req);
            res.json({ success: true, path: imageUrl, cloudinary: isCloudinaryConfigured });
        } catch (error) {
            console.error('Error processing upload:', error);
            fail(res, error, `${req.method} ${req.path}`);
        }
    });
});

// Settings
app.put('/api/admin/settings', requireAuth, async (req, res) => {
    try {
        // This has to upsert, not update. A plain UPDATE silently affects zero
        // rows for any setting that was never seeded, which is why new settings
        // appeared to save successfully but never took effect.
        for (const [key, value] of Object.entries(req.body)) {
            const stored = value === null || value === undefined ? '' : String(value);
            if (isVercelPostgres) {
                await sql`
                    INSERT INTO site_settings (key, value, updated_at)
                    VALUES (${key}, ${stored}, CURRENT_TIMESTAMP)
                    ON CONFLICT (key) DO UPDATE SET value = ${stored}, updated_at = CURRENT_TIMESTAMP
                `;
            } else {
                await run(
                    'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ' +
                    'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
                    [key, stored]
                );
            }
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Slider CRUD
app.get('/api/admin/slider', requireAuth, async (req, res) => {
    try {
        let images;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM slider_images ORDER BY display_order ASC`;
            images = result.rows;
        } else {
            images = await all('SELECT * FROM slider_images ORDER BY display_order ASC');
        }
        res.json(images);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.post('/api/admin/slider', requireAuth, async (req, res) => {
    try {
        const { image_path, title, subtitle, button_text, button_link } = req.body;

        let maxOrder = 0;
        if (isVercelPostgres) {
            const result = await sql`SELECT COALESCE(MAX(display_order), 0) as max FROM slider_images`;
            maxOrder = result.rows[0].max;
            await sql`INSERT INTO slider_images (image_path, title, subtitle, button_text, button_link, display_order) VALUES (${image_path}, ${title || ''}, ${subtitle || ''}, ${button_text || ''}, ${button_link || ''}, ${maxOrder + 1})`;
        } else {
            const maxResult = await get('SELECT MAX(display_order) as max FROM slider_images');
            maxOrder = maxResult?.max || 0;
            await run('INSERT INTO slider_images (image_path, title, subtitle, button_text, button_link, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                [image_path, title || '', subtitle || '', button_text || '', button_link || '', maxOrder + 1]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/slider/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM slider_images WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM slider_images WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.put('/api/admin/slider/reorder', requireAuth, async (req, res) => {
    try {
        const { order } = req.body;
        for (let i = 0; i < order.length; i++) {
            if (isVercelPostgres) {
                await sql`UPDATE slider_images SET display_order = ${i} WHERE id = ${order[i]}`;
            } else {
                await run('UPDATE slider_images SET display_order = ? WHERE id = ?', [i, order[i]]);
            }
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Sections
app.put('/api/admin/sections/:key', requireAuth, async (req, res) => {
    try {
        const key = req.params.key;
        const { title, subtitle, content, image_path, icon, button_text, button_link } = req.body;

        // Only overwrite the fields the client actually sent. The admin form used
        // to post image_path: '' on every save, which silently erased section
        // images each time any text was edited.
        let existing;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM sections WHERE section_key = ${key}`;
            existing = result.rows[0];
        } else {
            existing = await get('SELECT * FROM sections WHERE section_key = ?', [key]);
        }

        const pick = (incoming, current) => (incoming === undefined ? (current || '') : (incoming || ''));
        const next = {
            title: pick(title, existing?.title),
            subtitle: pick(subtitle, existing?.subtitle),
            content: pick(content, existing?.content),
            image_path: pick(image_path, existing?.image_path),
            icon: pick(icon, existing?.icon),
            button_text: pick(button_text, existing?.button_text),
            button_link: pick(button_link, existing?.button_link)
        };

        if (isVercelPostgres) {
            await sql`
                INSERT INTO sections (section_key, title, subtitle, content, image_path, icon, button_text, button_link, updated_at)
                VALUES (${key}, ${next.title}, ${next.subtitle}, ${next.content}, ${next.image_path}, ${next.icon}, ${next.button_text}, ${next.button_link}, CURRENT_TIMESTAMP)
                ON CONFLICT (section_key) DO UPDATE SET
                    title = ${next.title},
                    subtitle = ${next.subtitle},
                    content = ${next.content},
                    image_path = ${next.image_path},
                    icon = ${next.icon},
                    button_text = ${next.button_text},
                    button_link = ${next.button_link},
                    updated_at = CURRENT_TIMESTAMP
            `;
        } else {
            await run(
                'INSERT INTO sections (section_key, title, subtitle, content, image_path, icon, button_text, button_link, updated_at) ' +
                'VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ' +
                'ON CONFLICT(section_key) DO UPDATE SET title = excluded.title, subtitle = excluded.subtitle, ' +
                'content = excluded.content, image_path = excluded.image_path, icon = excluded.icon, ' +
                'button_text = excluded.button_text, button_link = excluded.button_link, updated_at = CURRENT_TIMESTAMP',
                [key, next.title, next.subtitle, next.content, next.image_path, next.icon, next.button_text, next.button_link]
            );
        }

        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Products CRUD
app.get('/api/admin/products', requireAuth, async (req, res) => {
    try {
        let products;
        if (isVercelPostgres) {
            const result = await sql`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        ORDER BY p.display_order ASC
      `;
            products = result.rows;
        } else {
            products = await all(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        ORDER BY p.display_order ASC
      `);
        }
        res.json(products);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.post('/api/admin/products', requireAuth, async (req, res) => {
    try {
        const { category_id, name, slug, scientific_name, short_description, full_description, featured_image, is_featured } = req.body;

        if (isVercelPostgres) {
            await sql`INSERT INTO products (category_id, name, slug, scientific_name, short_description, full_description, featured_image, is_featured) VALUES (${category_id || null}, ${name}, ${slug}, ${scientific_name || ''}, ${short_description || ''}, ${full_description || ''}, ${featured_image || ''}, ${is_featured || false})`;
        } else {
            await run('INSERT INTO products (category_id, name, slug, scientific_name, short_description, full_description, featured_image, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [category_id, name, slug, scientific_name || '', short_description || '', full_description || '', featured_image || '', is_featured ? 1 : 0]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.put('/api/admin/products/:id', requireAuth, async (req, res) => {
    try {
        const { category_id, name, slug, scientific_name, short_description, full_description, featured_image, is_featured, is_active } = req.body;

        if (isVercelPostgres) {
            await sql`UPDATE products SET category_id = ${category_id || null}, name = ${name}, slug = ${slug}, scientific_name = ${scientific_name}, short_description = ${short_description}, full_description = ${full_description}, featured_image = ${featured_image}, is_featured = ${is_featured || false}, is_active = ${is_active !== false}, updated_at = CURRENT_TIMESTAMP WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('UPDATE products SET category_id = ?, name = ?, slug = ?, scientific_name = ?, short_description = ?, full_description = ?, featured_image = ?, is_featured = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [category_id, name, slug, scientific_name, short_description, full_description, featured_image, is_featured ? 1 : 0, is_active ? 1 : 0, req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/products/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM products WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM products WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Categories CRUD
app.post('/api/admin/categories', requireAuth, async (req, res) => {
    try {
        const { name, slug, description, display_order } = req.body;

        if (isVercelPostgres) {
            await sql`INSERT INTO product_categories (name, slug, description, display_order) VALUES (${name}, ${slug}, ${description || ''}, ${display_order || 0})`;
        } else {
            await run('INSERT INTO product_categories (name, slug, description, display_order) VALUES (?, ?, ?, ?)',
                [name, slug, description || '', display_order || 0]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
    try {
        const { name, slug, description, display_order } = req.body;

        if (isVercelPostgres) {
            await sql`UPDATE product_categories SET name = ${name}, slug = ${slug}, description = ${description}, display_order = ${display_order} WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('UPDATE product_categories SET name = ?, slug = ?, description = ?, display_order = ? WHERE id = ?',
                [name, slug, description, display_order, req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM product_categories WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM product_categories WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Team CRUD
app.get('/api/admin/team', requireAuth, async (req, res) => {
    try {
        let members;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM team_members ORDER BY display_order ASC`;
            members = result.rows;
        } else {
            members = await all('SELECT * FROM team_members ORDER BY display_order ASC');
        }
        res.json(members);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.post('/api/admin/team', requireAuth, async (req, res) => {
    try {
        const { name, position, bio, image_path, email, phone, linkedin } = req.body;

        if (isVercelPostgres) {
            await sql`INSERT INTO team_members (name, position, bio, image_path, email, phone, linkedin) VALUES (${name}, ${position || ''}, ${bio || ''}, ${image_path || ''}, ${email || ''}, ${phone || ''}, ${linkedin || ''})`;
        } else {
            await run('INSERT INTO team_members (name, position, bio, image_path, email, phone, linkedin) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, position || '', bio || '', image_path || '', email || '', phone || '', linkedin || '']);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.put('/api/admin/team/:id', requireAuth, async (req, res) => {
    try {
        const { name, position, bio, image_path, email, phone, linkedin, is_active } = req.body;

        if (isVercelPostgres) {
            await sql`UPDATE team_members SET name = ${name}, position = ${position}, bio = ${bio}, image_path = ${image_path}, email = ${email}, phone = ${phone}, linkedin = ${linkedin}, is_active = ${is_active !== false} WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('UPDATE team_members SET name = ?, position = ?, bio = ?, image_path = ?, email = ?, phone = ?, linkedin = ?, is_active = ? WHERE id = ?',
                [name, position, bio, image_path, email, phone, linkedin, is_active ? 1 : 0, req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/team/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM team_members WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM team_members WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Testimonials CRUD
app.post('/api/admin/testimonials', requireAuth, async (req, res) => {
    try {
        const { client_name, company, position, content, rating, image_path, is_featured, display_order } = req.body;

        if (isVercelPostgres) {
            await sql`INSERT INTO testimonials (client_name, company, position, content, rating, image_path, is_featured, display_order) 
                      VALUES (${client_name}, ${company || ''}, ${position || ''}, ${content}, ${rating || 5}, ${image_path || ''}, ${is_featured || false}, ${display_order || 0})`;
        } else {
            await run('INSERT INTO testimonials (client_name, company, position, content, rating, image_path, is_featured, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [client_name, company || '', position || '', content, rating || 5, image_path || '', is_featured ? 1 : 0, display_order || 0]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.put('/api/admin/testimonials/:id', requireAuth, async (req, res) => {
    try {
        const { client_name, company, position, content, rating, image_path, is_featured, display_order } = req.body;

        if (isVercelPostgres) {
            await sql`UPDATE testimonials SET client_name = ${client_name}, company = ${company}, position = ${position}, content = ${content}, 
                      rating = ${rating}, image_path = ${image_path}, is_featured = ${is_featured !== false}, display_order = ${display_order || 0} 
                      WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('UPDATE testimonials SET client_name = ?, company = ?, position = ?, content = ?, rating = ?, image_path = ?, is_featured = ?, display_order = ? WHERE id = ?',
                [client_name, company, position, content, rating, image_path, is_featured ? 1 : 0, display_order || 0, req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/testimonials/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM testimonials WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// News CRUD
app.get('/api/admin/news', requireAuth, async (req, res) => {
    try {
        let posts;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM news_posts ORDER BY created_at DESC`;
            posts = result.rows;
        } else {
            posts = await all('SELECT * FROM news_posts ORDER BY created_at DESC');
        }
        res.json(posts);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.post('/api/admin/news', requireAuth, async (req, res) => {
    try {
        const { title, slug, excerpt, content, featured_image, author, is_published } = req.body;
        const publishedAt = is_published ? new Date().toISOString() : null;

        if (isVercelPostgres) {
            await sql`INSERT INTO news_posts (title, slug, excerpt, content, featured_image, author, is_published, published_at) VALUES (${title}, ${slug}, ${excerpt || ''}, ${content || ''}, ${featured_image || ''}, ${author || ''}, ${is_published || false}, ${publishedAt})`;
        } else {
            await run('INSERT INTO news_posts (title, slug, excerpt, content, featured_image, author, is_published, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [title, slug, excerpt || '', content || '', featured_image || '', author || '', is_published ? 1 : 0, publishedAt]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.put('/api/admin/news/:id', requireAuth, async (req, res) => {
    try {
        const { title, slug, excerpt, content, featured_image, author, is_published } = req.body;

        // Get current state to preserve published_at if already published
        let current;
        if (isVercelPostgres) {
            const result = await sql`SELECT is_published, published_at FROM news_posts WHERE id = ${parseInt(req.params.id)}`;
            current = result.rows[0];
        } else {
            current = await get('SELECT is_published, published_at FROM news_posts WHERE id = ?', [req.params.id]);
        }

        // Without this guard an unknown id threw a TypeError and surfaced as a 500.
        if (!current) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const publishedAt = is_published && !current.is_published ? new Date().toISOString() : current.published_at;

        if (isVercelPostgres) {
            await sql`UPDATE news_posts SET title = ${title}, slug = ${slug}, excerpt = ${excerpt}, content = ${content}, featured_image = ${featured_image}, author = ${author}, is_published = ${is_published || false}, published_at = ${publishedAt}, updated_at = CURRENT_TIMESTAMP WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('UPDATE news_posts SET title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?, author = ?, is_published = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [title, slug, excerpt, content, featured_image, author, is_published ? 1 : 0, publishedAt, req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/news/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM news_posts WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM news_posts WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Gallery CRUD
app.get('/api/admin/gallery', requireAuth, async (req, res) => {
    try {
        let images;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM gallery_images ORDER BY display_order ASC`;
            images = result.rows;
        } else {
            images = await all('SELECT * FROM gallery_images ORDER BY display_order ASC');
        }
        res.json(images);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.post('/api/admin/gallery', requireAuth, async (req, res) => {
    try {
        const { image_path, title, description, category } = req.body;

        if (isVercelPostgres) {
            await sql`INSERT INTO gallery_images (image_path, title, description, category) VALUES (${image_path}, ${title || ''}, ${description || ''}, ${category || ''})`;
        } else {
            await run('INSERT INTO gallery_images (image_path, title, description, category) VALUES (?, ?, ?, ?)',
                [image_path, title || '', description || '', category || '']);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/gallery/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM gallery_images WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM gallery_images WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Contacts
app.get('/api/admin/contacts', requireAuth, async (req, res) => {
    try {
        let contacts;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM contact_submissions ORDER BY created_at DESC`;
            contacts = result.rows;
        } else {
            contacts = await all('SELECT * FROM contact_submissions ORDER BY created_at DESC');
        }
        res.json(contacts);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.put('/api/admin/contacts/:id/read', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`UPDATE contact_submissions SET is_read = true WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('UPDATE contact_submissions SET is_read = 1 WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Newsletter Subscribers
app.get('/api/admin/newsletter', requireAuth, async (req, res) => {
    try {
        let subscribers;
        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC`;
            subscribers = result.rows;
        } else {
            subscribers = await all('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
        }
        res.json(subscribers);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

app.delete('/api/admin/newsletter/:id', requireAuth, async (req, res) => {
    try {
        if (isVercelPostgres) {
            await sql`DELETE FROM newsletter_subscribers WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('DELETE FROM newsletter_subscribers WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// Stats
app.get('/api/admin/stats', requireAuth, async (req, res) => {
    try {
        let stats;
        if (isVercelPostgres) {
            const [products, team, news, contacts] = await Promise.all([
                sql`SELECT COUNT(*) as count FROM products WHERE is_active = true`,
                sql`SELECT COUNT(*) as count FROM team_members WHERE is_active = true`,
                sql`SELECT COUNT(*) as count FROM news_posts WHERE is_published = true`,
                sql`SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = false`
            ]);
            stats = {
                products: parseInt(products.rows[0].count),
                team: parseInt(team.rows[0].count),
                news: parseInt(news.rows[0].count),
                unreadContacts: parseInt(contacts.rows[0].count)
            };
        } else {
            const products = await get('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
            const team = await get('SELECT COUNT(*) as count FROM team_members WHERE is_active = 1');
            const news = await get('SELECT COUNT(*) as count FROM news_posts WHERE is_published = 1');
            const contacts = await get('SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0');
            stats = {
                products: products?.count || 0,
                team: team?.count || 0,
                news: news?.count || 0,
                unreadContacts: contacts?.count || 0
            };
        }
        res.json(stats);
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// ============================================
// ADMIN PASSWORD RESET (opt-in, not a public endpoint)
// ============================================
// The previous version of this route was a public GET that reset the admin
// password to a known value - anyone who knew the URL had full admin access.
// It now requires ADMIN_RESET_TOKEN to be set in the environment and for the
// caller to present it, and it never reveals the resulting password.
app.post('/api/admin/reset-password', async (req, res) => {
    try {
        const configuredToken = process.env.ADMIN_RESET_TOKEN;
        if (!configuredToken) {
            return res.status(404).json({ error: 'Not found' });
        }

        const provided = String(req.body?.token || '');
        const a = Buffer.from(provided);
        const b = Buffer.from(configuredToken);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const newPassword = String(req.body?.password || '');
        if (newPassword.length < 10) {
            return res.status(400).json({ error: 'New password must be at least 10 characters' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        if (isVercelPostgres) {
            const existing = await sql`SELECT id FROM admins WHERE username = 'admin'`;
            if (existing.rows.length > 0) {
                await sql`UPDATE admins SET password = ${hashedPassword} WHERE username = 'admin'`;
            } else {
                await sql`INSERT INTO admins (username, password) VALUES ('admin', ${hashedPassword})`;
            }
        } else {
            await run('INSERT OR REPLACE INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
        }

        res.json({ success: true, message: 'Admin password updated.' });
    } catch (error) {
        fail(res, error, `${req.method} ${req.path}`);
    }
});

// ============================================
// FALLBACK ROUTES
// ============================================

// Unknown API routes should be a JSON 404, not the homepage HTML.
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (req, res) => {
    // Returning index.html for a missing .png or .css hid broken asset paths
    // behind a 200 response. Only unknown *page* routes get the SPA fallback.
    if (path.extname(req.path)) {
        return res.status(404).send('Not found');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// STARTUP
// ============================================

// On Vercel the app is imported rather than listened on, and the first request
// can arrive before initDatabase() resolves. This promise is awaited by the
// gate middleware above so no request ever hits an uninitialised database.
const databaseReady = initDatabase()
    .then(() => {
        console.log('\n📦 Configuration:');
        console.log(`   Database: ${isVercelPostgres ? 'Vercel Postgres' : 'Local SQLite'}`);
        console.log(`   Images: ${isCloudinaryConfigured ? 'Cloudinary' : 'Local Storage'}`);
    })
    .catch(error => {
        console.error('Database initialization failed:', error);
        throw error;
    });

if (!process.env.VERCEL) {
    databaseReady
        .then(() => {
            app.listen(PORT, () => {
                console.log(`\n🦐 Prawnique server running at http://localhost:${PORT}`);
                console.log(`📊 Admin panel at http://localhost:${PORT}/admin`);
            });
        })
        .catch(() => process.exit(1));
}

module.exports = app;
