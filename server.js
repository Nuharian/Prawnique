require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

// Import modules
const { initDatabase, all, get, run, sql, isVercelPostgres } = require('./database/init');
const { upload, getImageUrl, isCloudinaryConfigured } = require('./utils/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple token-based auth (stateless)
const crypto = require('crypto');
const SESSION_SECRET = process.env.SESSION_SECRET || 'prawnique-secret-key-change-in-production';

function createAuthToken(adminId, username) {
    const payload = JSON.stringify({ adminId, username, exp: Date.now() + 24 * 60 * 60 * 1000 });
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    return Buffer.from(payload + '.' + signature).toString('base64');
}

function verifyAuthToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [payload, signature] = decoded.split('.');
        const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
        
        if (signature !== expectedSignature) return null;
        
        const data = JSON.parse(payload);
        if (data.exp < Date.now()) return null;
        
        return data;
    } catch {
        return null;
    }
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        if (isVercelPostgres) {
            await sql`INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (${name}, ${email}, ${phone || null}, ${subject || null}, ${message})`;
        } else {
            await run('INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
                [name, email, phone || null, subject || null, message]);
        }
        res.json({ success: true, message: 'Thank you for your message!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        if (isVercelPostgres) {
            await sql`INSERT INTO newsletter_subscribers (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING`;
        } else {
            await run('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)', [email]);
        }
        res.json({ success: true, message: 'Thank you for subscribing!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ADMIN AUTH ROUTES
// ============================================

app.post('/api/admin/login', async (req, res) => {
    try {
        console.log('Login attempt for username:', req.body.username);
        const { username, password } = req.body;
        let admin;

        if (isVercelPostgres) {
            const result = await sql`SELECT * FROM admins WHERE username = ${username}`;
            admin = result.rows[0];
            console.log('Admin found in Postgres:', !!admin);
        } else {
            admin = await get('SELECT * FROM admins WHERE username = ?', [username]);
            console.log('Admin found in SQLite:', !!admin);
        }

        if (!admin) {
            console.log('Admin not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = bcrypt.compareSync(password, admin.password);
        console.log('Password match:', passwordMatch);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = createAuthToken(admin.id, admin.username);
        
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        console.log('Auth token created and set');
        res.json({ success: true, username: admin.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
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
app.post('/api/admin/upload/:type', requireAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const imageUrl = getImageUrl(req);
        res.json({ success: true, path: imageUrl, cloudinary: isCloudinaryConfigured });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settings
app.put('/api/admin/settings', requireAuth, async (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body)) {
            if (isVercelPostgres) {
                await sql`UPDATE site_settings SET value = ${value}, updated_at = CURRENT_TIMESTAMP WHERE key = ${key}`;
            } else {
                await run('UPDATE site_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key]);
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

// Sections
app.put('/api/admin/sections/:key', requireAuth, async (req, res) => {
    try {
        const { title, subtitle, content, image_path } = req.body;
        console.log('Updating section:', req.params.key, 'with data:', { title, subtitle, content });
        
        if (isVercelPostgres) {
            // First check if section exists
            const existing = await sql`SELECT id FROM sections WHERE section_key = ${req.params.key}`;
            console.log('Section exists:', existing.rows.length > 0);
            
            if (existing.rows.length === 0) {
                // Insert if doesn't exist
                console.log('Inserting new section');
                await sql`INSERT INTO sections (section_key, title, subtitle, content, image_path) VALUES (${req.params.key}, ${title}, ${subtitle}, ${content}, ${image_path || ''})`;
            } else {
                // Update if exists
                console.log('Updating existing section');
                await sql`UPDATE sections SET title = ${title}, subtitle = ${subtitle}, content = ${content}, image_path = ${image_path || ''}, updated_at = CURRENT_TIMESTAMP WHERE section_key = ${req.params.key}`;
            }
            
            // Verify the update
            const updated = await sql`SELECT * FROM sections WHERE section_key = ${req.params.key}`;
            console.log('Section after update:', updated.rows[0]);
        } else {
            await run('INSERT OR REPLACE INTO sections (section_key, title, subtitle, content, image_path, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [req.params.key, title, subtitle, content, image_path || '']);
        }
        console.log('Section update successful');
        res.json({ success: true });
    } catch (error) {
        console.error('Section update error:', error);
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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

        const publishedAt = is_published && !current.is_published ? new Date().toISOString() : current.published_at;

        if (isVercelPostgres) {
            await sql`UPDATE news_posts SET title = ${title}, slug = ${slug}, excerpt = ${excerpt}, content = ${content}, featured_image = ${featured_image}, author = ${author}, is_published = ${is_published || false}, published_at = ${publishedAt}, updated_at = CURRENT_TIMESTAMP WHERE id = ${parseInt(req.params.id)}`;
        } else {
            await run('UPDATE news_posts SET title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?, author = ?, is_published = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [title, slug, excerpt, content, featured_image, author, is_published ? 1 : 0, publishedAt, req.params.id]);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

// Fallback routes
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Emergency admin creation endpoint (remove after first use)
app.get('/api/create-admin', async (req, res) => {
    try {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        
        if (isVercelPostgres) {
            // Check if admin exists
            const existing = await sql`SELECT id FROM admins WHERE username = 'admin'`;
            if (existing.rows.length > 0) {
                // Update password instead
                await sql`UPDATE admins SET password = ${hashedPassword} WHERE username = 'admin'`;
                return res.json({ success: true, message: 'Admin password reset. Username: admin, Password: admin123' });
            }
            // Create admin
            await sql`INSERT INTO admins (username, password) VALUES ('admin', ${hashedPassword})`;
        } else {
            await run('INSERT OR REPLACE INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
        }
        
        res.json({ success: true, message: 'Admin user created. Username: admin, Password: admin123' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
    try {
        await initDatabase();

        console.log('\n📦 Configuration:');
        console.log(`   Database: ${isVercelPostgres ? 'Vercel Postgres' : 'Local SQLite'}`);
        console.log(`   Images: ${isCloudinaryConfigured ? 'Cloudinary' : 'Local Storage'}`);

        app.listen(PORT, () => {
            console.log(`\n🦐 Prawnique server running at http://localhost:${PORT}`);
            console.log(`📊 Admin panel at http://localhost:${PORT}/admin`);
            console.log(`\n📝 Default admin: admin / admin123`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
