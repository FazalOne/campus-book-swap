import express from 'express';
import cors from 'cors';
import pg from 'pg'; // Using standard pg library
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

const app = express();
const PORT = 3001;
const HOST = '0.0.0.0';
const SECRET_KEY = 'super_secret_graduation_key';

// --- DATABASE CONFIGURATION ---
const DB_CONFIG = {
    user: 'postgres',
    host: 'localhost',
    database: 'campusbookswap',
    password: 'admin',
    port: 5432,
};

const pool = new Pool(DB_CONFIG);

// Test Database Connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
        console.error('LÜTFEN server.ts DOSYASINDAKİ DB_CONFIG ŞİFRESİNİ KONTROL EDİN!');
    } else {
        console.log('Connected to PostgreSQL database successfully.');
        release();
    }
});

// STRICT CORS SETTINGS
app.use(cors({ origin: '*' }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Payload limits
app.use(express.json({ limit: '50mb' }) as any);
app.use(express.urlencoded({ limit: '50mb', extended: true }) as any);

// --- Database Schema Setup ---
const createTables = async () => {
    try {
        // Users Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(20) DEFAULT 'user',
        "avatarUrl" TEXT
      );
    `);

        // Books Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        isbn VARCHAR(50),
        edition VARCHAR(50),
        course VARCHAR(100),
        department VARCHAR(100),
        condition VARCHAR(50),
        description TEXT,
        "imageUrl" TEXT,
        "ownerId" INTEGER,
        price REAL,
        "forSwap" BOOLEAN DEFAULT TRUE,
        "forSale" BOOLEAN DEFAULT FALSE,
        "listedDate" TEXT,
        status VARCHAR(20) DEFAULT 'Available',
        FOREIGN KEY("ownerId") REFERENCES users(id) ON DELETE CASCADE
      );
    `);

        try {
            await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Available'`);
        } catch (e) {
            console.log("Status column check/add ignored or failed (might already exist)");
        }

        // Chats Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(255) PRIMARY KEY,
        "participantIds" JSONB, 
        "bookId" VARCHAR(255),
        "lastMessageText" TEXT,
        "lastMessageTimestamp" TEXT,
        "unreadMessages" INTEGER DEFAULT 0,
        "hiddenBy" JSONB DEFAULT '[]',
        "lastSenderId" INTEGER,
        status VARCHAR(20) DEFAULT 'accepted',
        "clearedHistoryAt" JSONB DEFAULT '{}'
      );
    `);

        try {
            await pool.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted'`);
            await pool.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS "clearedHistoryAt" JSONB DEFAULT '{}'`);
        } catch (e) {
            console.log("Chat status/clearedHistoryAt column check/add ignored or failed (might already exist)");
        }

        // Messages Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        "chatThreadId" VARCHAR(255),
        "senderId" INTEGER,
        text TEXT,
        timestamp TEXT,
        "isRead" BOOLEAN DEFAULT FALSE,
        "type" VARCHAR(20) DEFAULT 'text',
        FOREIGN KEY("chatThreadId") REFERENCES chats(id) ON DELETE CASCADE
      );
    `);

        // Swaps Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS swaps (
        id VARCHAR(255) PRIMARY KEY,
        "offeredById" INTEGER,
        "offeredToId" INTEGER,
        "offeredBookIds" JSONB,
        "requestedBookId" VARCHAR(255),
        status VARCHAR(50),
        message TEXT,
        "creationDate" TEXT,
        "lastUpdateDate" TEXT
      );
    `);

        // Reviews Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        "reviewerId" INTEGER,
        "targetUserId" INTEGER,
        rating INTEGER,
        comment TEXT,
        "createdAt" TEXT,
        FOREIGN KEY("reviewerId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY("targetUserId") REFERENCES users(id) ON DELETE CASCADE
      );
    `);

        // Engellenenler Tablosu (Blocks)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        "blockerId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "blockedId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TEXT,
        UNIQUE("blockerId", "blockedId")
      );
    `);

        // Raporlar Tablosu (Reports)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        "reporterId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "reportedUserId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        "chatId" VARCHAR(255),
        "createdAt" TEXT
      );
    `);

        // Reports Table Schema Update (Ensure columns exist)
        try {
            await pool.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS "chatId" VARCHAR(255)`);
            await pool.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS "createdAt" TEXT`);
        } catch (e) {
            console.log("Reports schema update check ignored");
        }

        // Favoriler Tablosu (Favorites / Wishlist)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "bookId" VARCHAR(255) REFERENCES books(id) ON DELETE CASCADE,
        "createdAt" TEXT,
        UNIQUE("userId", "bookId")
      );
    `);

        // İletişim Mesajları Tablosu (Contact Messages)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        subject TEXT,
        message TEXT,
        "createdAt" TEXT
      );
    `);

        console.log("Database tables checked/created.");
        seedIfEmpty();
    } catch (err) {
        console.error("Error creating tables:", err);
    }
};

const seedIfEmpty = async () => {
    try {
        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (adminCheck.rows.length === 0) {
            console.log('Creating Super Admin user...');
            const adminHash = bcrypt.hashSync('admin', 10);
            await pool.query(
                'INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, "avatarUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                ['admin', adminHash, 'System', 'Admin', 'admin@campusbookswap.com', '555-0000', 'super_admin', 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff']
            );
        }
    } catch (e) { console.error("Seeding failed:", e); }
};

createTables();

const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const getUserIdFromRequest = (req: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as any;
        return decoded.id;
    } catch (e) {
        return null;
    }
};

const checkRole = (allowedRoles: string[]) => {
    return async (req: any, res: any, next: any) => {
        const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        const userRole = userRes.rows[0]?.role;
        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).send("Access denied. Insufficient permissions.");
        }
    };
};

app.get('/', (req, res) => { res.send('Backend API is running on PostgreSQL.'); });

// Auth & User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [(req as any).user.id]);
        if (result.rows.length > 0) {
            const u = result.rows[0];
            res.json({
                id: u.id.toString(),
                username: u.username,
                firstName: u.first_name,
                lastName: u.last_name,
                email: u.email,
                phone: u.phone,
                role: u.role,
                avatarUrl: u.avatarUrl
            });
        } else {
            res.status(404).send("User not found");
        }
    } catch (e) { res.status(500).send("Server Error"); }
});

app.get('/api/users/:id/public', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, first_name as "firstName", last_name as "lastName", role, "avatarUrl" FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) {
            const u = result.rows[0];
            const ratingRes = await pool.query('SELECT AVG(rating) as average FROM reviews WHERE "targetUserId" = $1', [req.params.id]);
            const averageRating = ratingRes.rows[0].average ? parseFloat(ratingRes.rows[0].average).toFixed(1) : null;
            res.json({
                id: u.id.toString(),
                username: u.username,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                avatarUrl: u.avatarUrl,
                averageRating: averageRating ? parseFloat(averageRating) : 0
            });
        } else {
            res.status(404).send("User not found");
        }
    } catch (e) { res.status(500).send("Server Error"); }
});

// Reviews
app.get('/api/users/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, u.username as "reviewerUsername", u."avatarUrl" as "reviewerAvatarUrl"
            FROM reviews r
            JOIN users u ON r."reviewerId" = u.id
            WHERE r."targetUserId" = $1
            ORDER BY r."createdAt" DESC
        `, [req.params.id]);
        const reviews = result.rows.map(r => ({
            ...r,
            reviewerId: r.reviewerId.toString(),
            targetUserId: r.targetUserId.toString()
        }));
        res.json(reviews);
    } catch (e) { res.status(500).send("Failed to fetch reviews"); }
});

app.post('/api/reviews', authenticateToken, async (req, res) => {
    const { targetUserId, rating, comment } = req.body;
    const reviewerId = (req as any).user.id;
    if (!targetUserId || !rating) return res.status(400).send("Missing required fields");
    if (parseInt(targetUserId) === parseInt(reviewerId)) return res.status(400).send("Cannot review yourself");
    try {
        await pool.query(
            'INSERT INTO reviews ("reviewerId", "targetUserId", rating, comment, "createdAt") VALUES ($1, $2, $3, $4, $5)',
            [reviewerId, targetUserId, rating, comment, new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).send("Failed to post review"); }
});

// Get blocked users list for current user
app.get('/api/users/blocks', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const result = await pool.query('SELECT "blockedId" FROM blocks WHERE "blockerId" = $1', [userId]);
        const blockedIds = result.rows.map(r => r.blockedId.toString());
        res.json(blockedIds);
    } catch (e) { res.status(500).send("Failed to fetch blocks"); }
});

// Block User
app.post('/api/users/:id/block', authenticateToken, async (req, res) => {
    const blockedId = parseInt(req.params.id);
    const blockerId = parseInt((req as any).user.id);
    if (blockedId === blockerId) return res.status(400).send("Kendini engelleyemezsin.");
    try {
        await pool.query(
            'INSERT INTO blocks ("blockerId", "blockedId", "createdAt") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [blockerId, blockedId, new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).send("Engelleme başarısız.");
    }
});

// Unblock User
app.delete('/api/users/:id/block', authenticateToken, async (req, res) => {
    const blockedId = parseInt(req.params.id);
    const blockerId = parseInt((req as any).user.id);
    try {
        await pool.query(
            'DELETE FROM blocks WHERE "blockerId" = $1 AND "blockedId" = $2',
            [blockerId, blockedId]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).send("Engel kaldırma başarısız.");
    }
});

// Report User
app.post('/api/reports', authenticateToken, async (req, res) => {
    const { reportedUserId, reason, chatId } = req.body;
    const reporterId = parseInt((req as any).user.id);
    // Ensure reportedUserId is integer
    const reportedIdInt = parseInt(reportedUserId);

    if (!reportedIdInt || isNaN(reportedIdInt)) {
        return res.status(400).send("Invalid user ID");
    }

    try {
        await pool.query(
            'INSERT INTO reports ("reporterId", "reportedUserId", reason, "chatId", "createdAt") VALUES ($1, $2, $3, $4, $5)',
            [reporterId, reportedIdInt, reason, chatId || null, new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (e: any) {
        console.error(e);
        res.status(500).send("Rapor gönderme başarısız: " + e.message);
    }
});

// Public Contact Form
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).send("Missing required fields");
    try {
        await pool.query(
            'INSERT INTO contact_messages (name, email, subject, message, "createdAt") VALUES ($1, $2, $3, $4, $5)',
            [name, email, subject, message, new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (e) {
        console.error("Contact form error:", e);
        res.status(500).send("Failed to save message");
    }
});

// Admin Contact Messages Routes
app.get('/api/admin/contact-messages', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contact_messages ORDER BY "createdAt" DESC');
        res.json(result.rows);
    } catch (e) {
        console.error(e);
        res.status(500).send("Failed to fetch messages");
    }
});

app.delete('/api/admin/contact-messages/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        await pool.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).send("Failed to delete message");
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, firstName, lastName, email, phone } = req.body;
    if (!username || !password || !firstName || !lastName) return res.status(400).send('Required fields missing.');
    const hashedPassword = bcrypt.hashSync(password, 10);
    const avatarUrl = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, "avatarUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [username, hashedPassword, firstName, lastName, email || '', phone || '', 'user', avatarUrl]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id.toString(), username: user.username }, SECRET_KEY);
        res.json({ user: { id: user.id.toString(), username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl }, token });
    } catch (err: any) {
        if (err.code === '23505') res.status(400).send('This username is already taken.');
        else res.status(500).send('Internal Server Error.');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (user && bcrypt.compareSync(password, user.password_hash)) {
            const token = jwt.sign({ id: user.id.toString(), username: user.username }, SECRET_KEY);
            res.json({ user: { id: user.id.toString(), username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl }, token });
        } else { res.status(401).send('Invalid credentials'); }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send("Login failed");
    }
});

// Admin Reports Routes
app.get('/api/admin/reports', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, u1.username as "reporterUsername", u2.username as "reportedUsername"
            FROM reports r
            JOIN users u1 ON r."reporterId" = u1.id
            JOIN users u2 ON r."reportedUserId" = u2.id
            ORDER BY r."createdAt" DESC
        `);
        // ID'leri string olarak döndür (frontend uyumu için)
        const reports = result.rows.map(r => ({
            ...r,
            reporterId: r.reporterId.toString(),
            reportedUserId: r.reportedUserId.toString()
        }));
        res.json(reports);
    } catch (e) {
        console.error(e);
        res.status(500).send("Failed to fetch reports");
    }
});

app.delete('/api/admin/reports/:id', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
    try {
        await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send("Failed to delete report"); }
});

app.get('/api/admin/users', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, first_name as "firstName", last_name as "lastName", email, phone, role, "avatarUrl" FROM users ORDER BY id ASC');
        const users = result.rows.map(u => ({ ...u, id: u.id.toString() }));
        res.json(users);
    } catch (e) { res.status(500).send("Failed to fetch users"); }
});

app.delete('/api/admin/users/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const requesterId = (req as any).user.id;
    if (isNaN(targetUserId)) return res.status(400).send("Invalid ID");
    try {
        const requesterRes = await pool.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        const targetRes = await pool.query('SELECT role FROM users WHERE id = $1', [targetUserId]);
        if (targetRes.rows.length === 0) return res.status(404).send("User not found");
        const requesterRole = requesterRes.rows[0].role;
        const targetRole = targetRes.rows[0].role;
        if (targetRole === 'super_admin') return res.status(403).send("Cannot delete Super Admin.");
        if (requesterRole === 'admin' && (targetRole === 'admin' || targetRole === 'super_admin')) return res.status(403).send("Admins cannot delete other Admins.");

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM reviews WHERE "reviewerId" = $1 OR "targetUserId" = $1', [targetUserId]);
            await client.query('DELETE FROM swaps WHERE "offeredById" = $1 OR "offeredToId" = $1', [targetUserId]);
            await client.query('DELETE FROM chats WHERE "participantIds" @> $1', [JSON.stringify([targetUserId.toString()])]);
            await client.query('DELETE FROM users WHERE id = $1', [targetUserId]);
            await client.query('COMMIT');
            res.json({ success: true });
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    } catch (e) { res.status(500).send("Failed to delete user"); }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const { username, firstName, lastName, email, phone, role, newPassword, oldPassword, avatarUrl } = req.body;
    const targetUserId = parseInt(req.params.id);
    const requesterId = parseInt((req as any).user.id);
    try {
        const requesterRes = await pool.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        const targetRes = await pool.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
        if (targetRes.rows.length === 0) return res.status(404).send("User not found");
        const requesterRole = requesterRes.rows[0].role;
        const targetUser = targetRes.rows[0];
        const isSelf = requesterId === targetUserId;
        const isAdmin = ['super_admin', 'admin', 'moderator'].includes(requesterRole);
        if (!isSelf && !isAdmin) return res.status(403).send("Access denied.");

        let hashedPassword = null;
        if (newPassword && newPassword.trim() !== "") {
            if (isSelf) {
                if (!oldPassword) return res.status(400).send("Old password required.");
                const isValid = bcrypt.compareSync(oldPassword, targetUser.password_hash);
                if (!isValid) return res.status(401).send("Incorrect old password.");
            }
            hashedPassword = bcrypt.hashSync(newPassword, 10);
        }

        let query = 'UPDATE users SET username=$1, first_name=$2, last_name=$3, email=$4, phone=$5';
        let params = [username, firstName, lastName, email, phone];
        let idx = 6;
        if (role && requesterRole === 'super_admin') { query += `, role=$${idx}`; params.push(role); idx++; }
        if (hashedPassword) { query += `, password_hash=$${idx}`; params.push(hashedPassword); idx++; }
        if (avatarUrl) { query += `, "avatarUrl"=$${idx}`; params.push(avatarUrl); idx++; }
        else if (targetUser.avatarUrl.includes("ui-avatars.com")) {
            const newAvatarUrl = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
            query += `, "avatarUrl"=$${idx}`; params.push(newAvatarUrl); idx++;
        }
        query += ` WHERE id=$${idx}`; params.push(targetUserId);
        const result = await pool.query(query + ' RETURNING *', params);
        const updatedUser = result.rows[0];
        res.json({ success: true, user: { id: updatedUser.id.toString(), username: updatedUser.username, firstName: updatedUser.first_name, lastName: updatedUser.last_name, email: updatedUser.email, phone: updatedUser.phone, role: updatedUser.role, avatarUrl: updatedUser.avatarUrl } });
    } catch (e) { res.status(500).send("Failed to update user"); }
});

// Books
app.get('/api/books', async (req, res) => {
    const currentUserId = getUserIdFromRequest(req);
    try {
        let query = `
            SELECT b.*, u.username as "ownerUsername",
            (SELECT COUNT(*)::int FROM favorites f WHERE f."bookId" = b.id) as "favoriteCount"
        `;

        let params: any[] = [];

        if (currentUserId) {
            query += `, (SELECT EXISTS(SELECT 1 FROM favorites f WHERE f."bookId" = b.id AND f."userId" = $1)) as "isFavorited"`;
            params.push(currentUserId);
        } else {
            query += `, false as "isFavorited"`;
        }

        query += ` FROM books b LEFT JOIN users u ON b."ownerId" = u.id ORDER BY b."listedDate" DESC`;

        const result = await pool.query(query, params);
        const books = result.rows.map(b => ({
            ...b,
            ownerId: b.ownerId ? b.ownerId.toString() : null,
            isFavorited: !!b.isFavorited // ensure boolean
        }));
        res.json(books);
    } catch (e) {
        console.error(e);
        res.status(500).send("DB Error");
    }
});

app.get('/api/books/:id', authenticateToken, async (req, res) => {
    const currentUserId = (req as any).user.id;
    try {
        const result = await pool.query(`
            SELECT b.*, u.username as "ownerUsername",
            (SELECT COUNT(*)::int FROM favorites f WHERE f."bookId" = b.id) as "favoriteCount",
            (SELECT EXISTS(SELECT 1 FROM favorites f WHERE f."bookId" = b.id AND f."userId" = $2)) as "isFavorited"
            FROM books b 
            LEFT JOIN users u ON b."ownerId" = u.id 
            WHERE b.id = $1
        `, [req.params.id, currentUserId]);

        if (result.rows.length > 0) {
            const b = result.rows[0];
            res.json({
                ...b,
                ownerId: b.ownerId ? b.ownerId.toString() : null,
                isFavorited: !!b.isFavorited
            });
        } else { res.status(404).send("Book not found"); }
    } catch (e) { res.status(500).send("DB Error"); }
});

app.post('/api/books', authenticateToken, async (req, res) => {
    const book = req.body;
    try {
        await pool.query(
            `INSERT INTO books (id, title, author, isbn, edition, course, department, condition, description, "imageUrl", "ownerId", price, "forSwap", "forSale", "listedDate", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [book.id, book.title, book.author, book.isbn, book.edition, book.course, book.department, book.condition, book.description, book.imageUrl, (req as any).user.id, book.price, !!book.forSwap, !!book.forSale, book.listedDate, 'Available']
        );
        res.json(book);
    } catch (err) { res.status(500).send("Failed to add book"); }
});

app.put('/api/books/:id', authenticateToken, async (req, res) => {
    const book = req.body;
    try {
        await pool.query(
            `UPDATE books SET title=$1, author=$2, isbn=$3, edition=$4, course=$5, department=$6, condition=$7, description=$8, "imageUrl"=$9, price=$10, "forSwap"=$11, "forSale"=$12, status=$14 WHERE id=$13`,
            [book.title, book.author, book.isbn, book.edition, book.course, book.department, book.condition, book.description, book.imageUrl, book.price, !!book.forSwap, !!book.forSale, req.params.id, book.status || 'Available']
        );
        res.json(book);
    } catch (e) { res.status(500).send("Server Error"); }
});

app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
        if (result.rowCount && result.rowCount > 0) res.json({ success: true });
        else res.status(404).send("Book not found");
    } catch (e) { res.status(500).send("Server error"); }
});

// Favorites Toggle
app.post('/api/books/:id/favorite', authenticateToken, async (req, res) => {
    const bookId = req.params.id;
    const userId = (req as any).user.id;

    try {
        // Check if already favorite
        const check = await pool.query('SELECT * FROM favorites WHERE "userId" = $1 AND "bookId" = $2', [userId, bookId]);

        if (check.rows.length > 0) {
            // Remove
            await pool.query('DELETE FROM favorites WHERE "userId" = $1 AND "bookId" = $2', [userId, bookId]);
            res.json({ isFavorited: false });
        } else {
            // Add
            await pool.query('INSERT INTO favorites ("userId", "bookId", "createdAt") VALUES ($1, $2, $3)', [userId, bookId, new Date().toISOString()]);
            res.json({ isFavorited: true });
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Favorite toggle failed");
    }
});

// Chats
app.get('/api/chats', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const userIdStr = userId.toString();
        // Sadece gizlenmiş sohbetleri filtrele, engellenenleri GÖSTER (kullanıcı isteği)
        const result = await pool.query('SELECT * FROM chats WHERE "participantIds" @> $1', [JSON.stringify([userIdStr])]);

        const visibleChats = result.rows.filter((chat: any) => {
            const hiddenList = chat.hiddenBy || [];
            if (hiddenList.includes(userIdStr)) return false;
            return true;
        });

        const uniqueChatsMap = new Map();
        for (const chat of visibleChats) {
            const pIds = chat.participantIds;
            const otherId = pIds.find((id: string) => id !== userIdStr) || userIdStr;
            if (uniqueChatsMap.has(otherId)) {
                const existing = uniqueChatsMap.get(otherId);
                if (new Date(chat.lastMessageTimestamp).getTime() > new Date(existing.lastMessageTimestamp).getTime()) uniqueChatsMap.set(otherId, chat);
            } else { uniqueChatsMap.set(otherId, chat); }
        }

        const formattedChats = await Promise.all(Array.from(uniqueChatsMap.values()).map(async (chat: any) => {
            const pIds = chat.participantIds;
            const usernames: any = {};
            for (const pid of pIds) {
                const uRes = await pool.query('SELECT username FROM users WHERE id = $1', [parseInt(pid)]);
                usernames[pid] = uRes.rows[0] ? uRes.rows[0].username : "Unknown";
            }
            // Add default status if missing
            return {
                ...chat,
                participantIds: pIds,
                participantUsernames: usernames,
                lastSenderId: chat.lastSenderId ? chat.lastSenderId.toString() : null,
                status: chat.status || 'accepted'
            };
        }));
        formattedChats.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
        res.json(formattedChats);
    } catch (e) { res.status(500).send("Chat fetch error"); }
});

app.post('/api/chats/:id/accept', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id.toString();
    try {
        const chatRes = await pool.query('SELECT * FROM chats WHERE id = $1', [req.params.id]);
        if (chatRes.rows.length === 0) return res.status(404).send("Chat not found");

        const chat = chatRes.rows[0];
        if (!chat.participantIds.includes(userId)) return res.status(403).send("Not authorized");

        await pool.query('UPDATE chats SET status = $1 WHERE id = $2', ['accepted', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send("Failed to accept chat"); }
});

app.post('/api/chats/:id/hide', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id.toString();
    try {
        const chatRes = await pool.query('SELECT * FROM chats WHERE id = $1', [req.params.id]);
        if (chatRes.rows.length === 0) return res.status(404).send("Chat not found");

        const chat = chatRes.rows[0];
        const currentHidden = chat.hiddenBy || [];
        const currentCleared = chat.clearedHistoryAt || {};

        if (!currentHidden.includes(userId)) {
            const newHidden = [...currentHidden, userId];
            // Update timestamp for when user cleared history
            const newCleared = { ...currentCleared, [userId]: new Date().toISOString() };

            await pool.query('UPDATE chats SET "hiddenBy" = $1, "clearedHistoryAt" = $2 WHERE id = $3', [JSON.stringify(newHidden), JSON.stringify(newCleared), req.params.id]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).send("Failed to delete chat"); }
});

app.post('/api/chats', authenticateToken, async (req, res) => {
    const { targetUserId, bookId, language } = req.body;
    const currentUserId = (req as any).user.id.toString();
    const isTr = language === 'tr';
    try {
        const allChats = await pool.query('SELECT * FROM chats WHERE "participantIds" @> $1', [JSON.stringify([currentUserId])]);
        let chat = allChats.rows.find((c: any) => c.participantIds.includes(targetUserId));
        let chatId = chat ? chat.id : null;
        if (chat) {
            const hiddenList = chat.hiddenBy || [];
            if (hiddenList.includes(currentUserId)) {
                const newHidden = hiddenList.filter((id: string) => id !== currentUserId);
                // Unhide, but do NOT clear 'clearedHistoryAt', user wants to see new messages, not old ones if they deleted them
                await pool.query('UPDATE chats SET "hiddenBy" = $1 WHERE id = $2', [JSON.stringify(newHidden), chat.id]);
            }
        } else {
            chatId = `chat_${Date.now()}`;
            // New DM chats start as 'pending'
            await pool.query(
                'INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [chatId, JSON.stringify([currentUserId, targetUserId]), bookId || null, isTr ? "Sohbet başlatıldı" : "Chat started", new Date().toISOString(), 0, '[]', parseInt(currentUserId), 'pending', '{}']
            );
            chat = { id: chatId };
        }
        if (bookId) {
            const bookRes = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
            if (bookRes.rows.length > 0) {
                const book = bookRes.rows[0];
                const cardData = JSON.stringify({ id: book.id, title: book.title, imageUrl: book.imageUrl, price: book.price, forSale: book.forSale, forSwap: book.forSwap });
                const lastMsgRes = await pool.query('SELECT type, text FROM messages WHERE "chatThreadId" = $1 ORDER BY timestamp DESC LIMIT 1', [chatId]);
                if (lastMsgRes.rows.length === 0 || lastMsgRes.rows[0].type !== 'book_card' || lastMsgRes.rows[0].text !== cardData) {
                    const msgId = `msg_${Date.now()}_auto`;
                    const timestamp = new Date().toISOString();
                    await pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', [msgId, chatId, parseInt(currentUserId), cardData, timestamp, false, 'book_card']);
                    await pool.query('UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "hiddenBy" = $3, "lastSenderId" = $4 WHERE id = $5', [isTr ? `İlgileniliyor: ${book.title}` : `Interested in: ${book.title}`, timestamp, '[]', parseInt(currentUserId), chatId]);
                }
            }
        }
        res.json(chat);
    } catch (e) { res.status(500).send("Create chat error"); }
});

app.post('/api/chats/:id/read', authenticateToken, async (req, res) => {
    const userId = parseInt((req as any).user.id);
    try {
        const chatRes = await pool.query('SELECT "lastSenderId" FROM chats WHERE id = $1', [req.params.id]);
        if (chatRes.rows.length > 0 && chatRes.rows[0].lastSenderId !== userId) {
            await pool.query('UPDATE messages SET "isRead" = TRUE WHERE "chatThreadId" = $1 AND "senderId" != $2', [req.params.id, userId]);
            await pool.query('UPDATE chats SET "unreadMessages" = 0 WHERE id = $1', [req.params.id]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).send("Error marking read"); }
});

app.get('/api/chats/:id/messages', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id.toString();
    try {
        // First get chat info to check for cleared history timestamp
        const chatRes = await pool.query('SELECT "clearedHistoryAt" FROM chats WHERE id = $1', [req.params.id]);
        let filterTimestamp = null;

        if (chatRes.rows.length > 0) {
            const clearedMap = chatRes.rows[0].clearedHistoryAt || {};
            if (clearedMap[userId]) {
                filterTimestamp = clearedMap[userId];
            }
        }

        let query = 'SELECT * FROM messages WHERE "chatThreadId" = $1';
        const params = [req.params.id];

        if (filterTimestamp) {
            query += ' AND timestamp > $2';
            params.push(filterTimestamp);
        }

        query += ' ORDER BY timestamp ASC';

        const result = await pool.query(query, params);
        const messages = result.rows.map(m => ({ ...m, senderId: m.senderId ? m.senderId.toString() : null }));
        res.json(messages);
    } catch (e) { res.status(500).send("Fetch messages error"); }
});

app.post('/api/chats/:id/messages', authenticateToken, async (req, res) => {
    const { text, type } = req.body;
    const senderId = parseInt((req as any).user.id);
    const chatId = req.params.id;
    const msgId = `msg_${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
        // --- BLOCK CHECK LOGIC ---
        // 1. Get chat participants to find the other user
        const chatRes = await pool.query('SELECT "participantIds", "hiddenBy" FROM chats WHERE id = $1', [chatId]);
        if (chatRes.rows.length === 0) return res.status(404).send("Chat not found");

        const chat = chatRes.rows[0];
        const participantIds = chat.participantIds;
        const otherUserIdStr = participantIds.find((id: string) => id !== senderId.toString());

        if (otherUserIdStr) {
            const otherUserId = parseInt(otherUserIdStr);
            // Check if sender is blocked by receiver OR receiver is blocked by sender
            // We want to prevent messaging in BOTH directions if a block exists
            const blockCheck = await pool.query(
                'SELECT * FROM blocks WHERE ("blockerId"=$1 AND "blockedId"=$2) OR ("blockerId"=$2 AND "blockedId"=$1)',
                [senderId, otherUserId]
            );

            if (blockCheck.rows.length > 0) {
                return res.status(403).send("Message blocked.");
            }
        }
        // -------------------------

        await pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', [msgId, chatId, senderId, text, timestamp, false, type || 'text']);
        let preview = text;
        if (type === 'image') preview = '📷 Photo';
        else if (type === 'location') preview = '📍 Location';

        // Remove from hiddenBy for participants (unhide chat if it was hidden/deleted)
        // Note: We DO NOT reset 'clearedHistoryAt'. 
        // If User A deleted chat (set clearedHistoryAt), and User B sends message, 
        // User A should see the new message, but NOT the old ones.
        const currentHidden = chat.hiddenBy || [];
        const newHidden = currentHidden.filter((id: string) => !participantIds.includes(id));

        await pool.query('UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "hiddenBy" = $3, "lastSenderId" = $4 WHERE id = $5', [preview, timestamp, JSON.stringify(newHidden), senderId, chatId]);
        res.json({ id: msgId, chatThreadId: chatId, senderId: senderId.toString(), text, timestamp, isRead: false, type: type || 'text' });
    } catch (e) {
        console.error("Message send error:", e);
        res.status(500).send("Send message error");
    }
});

// Swaps
app.get('/api/swaps', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const result = await pool.query(`SELECT s.*, u1.username as "offeredByUsername", u2.username as "offeredToUsername" FROM swaps s LEFT JOIN users u1 ON s."offeredById" = u1.id LEFT JOIN users u2 ON s."offeredToId" = u2.id WHERE s."offeredById" = $1 OR s."offeredToId" = $1`, [userId]);
        const swaps = result.rows.map(s => ({ ...s, offeredById: s.offeredById.toString(), offeredToId: s.offeredToId.toString() }));
        res.json(swaps);
    } catch (e) { res.status(500).send("Swap list error"); }
});

app.post('/api/swaps', authenticateToken, async (req, res) => {
    const swap = req.body;
    const userId = (req as any).user.id;
    try {
        await pool.query('INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [swap.id, userId, swap.offeredToId, JSON.stringify(swap.offeredBookIds), swap.requestedBookId, swap.status, swap.message, swap.creationDate, swap.lastUpdateDate]);
        await pool.query("UPDATE books SET status = 'Requested' WHERE id = $1 AND status = 'Available'", [swap.requestedBookId]);
        if (swap.offeredBookIds && Array.isArray(swap.offeredBookIds)) {
            for (const bookId of swap.offeredBookIds) { await pool.query("UPDATE books SET status = 'Requested' WHERE id = $1 AND status = 'Available'", [bookId]); }
        }
        res.json(swap);
    } catch (e) { res.status(500).send("Failed to create swap"); }
});

app.delete('/api/swaps/:id', authenticateToken, async (req, res) => {
    try {
        // Ensure swap exists and requester is a participant
        const swapRes = await pool.query('SELECT * FROM swaps WHERE id = $1', [req.params.id]);
        if (swapRes.rows.length === 0) return res.status(404).send('Swap not found');
        const swap = swapRes.rows[0];
        const userId = (req as any).user.id;
        if (String(swap.offeredById) !== String(userId) && String(swap.offeredToId) !== String(userId)) {
            return res.status(403).send('Not authorized');
        }

        // Revert book statuses if they are in Requested/Reserved
        try {
            await pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND (status = 'Requested' OR status = 'Reserved')", [swap.requestedBookId]);
            if (swap.offeredBookIds && Array.isArray(swap.offeredBookIds)) {
                for (const bookId of swap.offeredBookIds) {
                    await pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND (status = 'Requested' OR status = 'Reserved')", [bookId]);
                }
            }
        } catch (e) {
            console.error('Failed to revert book statuses on delete:', e);
        }

        const result = await pool.query('DELETE FROM swaps WHERE id = $1', [req.params.id]);
        if (result.rowCount && result.rowCount > 0) res.json({ success: true });
        else res.status(404).send('Swap not found');
    } catch (e) { console.error(e); res.status(500).send('Delete swap error'); }
});

app.delete('/api/swaps/batch/clean', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const result = await pool.query('DELETE FROM swaps WHERE ("offeredById" = $1 OR "offeredToId" = $1) AND status != \'Pending\'', [userId]);
        res.json({ success: true, count: result.rowCount });
    } catch (e) { res.status(500).send("Batch delete error"); }
});

app.put('/api/swaps/:id/status', authenticateToken, async (req, res) => {
    const { status, language } = req.body;
    const currentUserId = (req as any).user.id;
    const isTr = language === 'tr';
    try {
        // load swap
        const swapRes = await pool.query('SELECT * FROM swaps WHERE id = $1', [req.params.id]);
        if (swapRes.rows.length === 0) return res.status(404).send('Swap not found');
        const swap = swapRes.rows[0];

        // permission checks
        if ((status === 'Accepted' || status === 'Rejected') && String(currentUserId) !== String(swap.offeredToId)) {
            return res.status(403).send('Access denied. Only the recipient can accept/reject.');
        }
        if (status === 'Cancelled' && String(currentUserId) !== String(swap.offeredById) && String(currentUserId) !== String(swap.offeredToId)) {
            return res.status(403).send('Access denied.');
        }
        if (status === 'Completed' && String(currentUserId) !== String(swap.offeredById) && String(currentUserId) !== String(swap.offeredToId)) {
            return res.status(403).send('Access denied.');
        }

        // Completed: perform ownership transfer in a transaction
        if (status === 'Completed') {
            if (swap.status !== 'Accepted') return res.status(400).send('Swap must be Accepted before completing.');
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // transfer offered books to offeredToId
                if (swap.offeredBookIds && Array.isArray(swap.offeredBookIds)) {
                    for (const bookId of swap.offeredBookIds) {
                        await client.query('UPDATE books SET "ownerId" = $1, status = $2, "forSwap" = $3, "forSale" = $4 WHERE id = $5', [swap.offeredToId, 'Swapped', false, false, bookId]);
                    }
                }
                // transfer requested book to offeredById
                if (swap.requestedBookId) {
                    await client.query('UPDATE books SET "ownerId" = $1, status = $2, "forSwap" = $3, "forSale" = $4 WHERE id = $5', [swap.offeredById, 'Swapped', false, false, swap.requestedBookId]);
                }

                // mark swap as completed
                await client.query('UPDATE swaps SET status = $1, "lastUpdateDate" = $2 WHERE id = $3', ['Completed', new Date().toISOString(), req.params.id]);

                await client.query('COMMIT');
                res.json({ success: true });
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Completion failed:', err);
                res.status(500).send('Failed to complete swap');
            } finally {
                client.release();
            }
            return;
        }

        // Default: update status and then handle book/chat updates
        const upd = await pool.query('UPDATE swaps SET status = $1, "lastUpdateDate" = $2 WHERE id = $3 RETURNING *', [status, new Date().toISOString(), req.params.id]);
        if (!(upd.rowCount && upd.rowCount > 0)) return res.status(404).send('Swap not found');
        const updatedSwap = upd.rows[0];

        if (status === 'Accepted') {
            await pool.query("UPDATE books SET status = 'Reserved' WHERE id = $1", [updatedSwap.requestedBookId]);
            if (updatedSwap.offeredBookIds && Array.isArray(updatedSwap.offeredBookIds)) {
                for (const bookId of updatedSwap.offeredBookIds) {
                    await pool.query("UPDATE books SET status = 'Reserved' WHERE id = $1", [bookId]);
                }
            }

            // find or create chat and notify
            const otherUserId = updatedSwap.offeredById;
            const bookRes = await pool.query('SELECT title FROM books WHERE id = $1', [updatedSwap.requestedBookId]);
            const bookTitle = (bookRes.rows[0] && bookRes.rows[0].title) || 'the book';

            const allChats = await pool.query('SELECT * FROM chats WHERE "participantIds" @> $1', [JSON.stringify([currentUserId.toString()])]);
            let existingChat = allChats.rows.find(function (c: any) { return c.participantIds.includes(otherUserId.toString()); });
            let chatId = '';
            if (existingChat) {
                chatId = existingChat.id;
                await pool.query('UPDATE chats SET "hiddenBy" = $1, status = $2 WHERE id = $3', ['[]', 'accepted', chatId]);
            } else {
                chatId = `chat_${Date.now()}`;
                await pool.query('INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [chatId, JSON.stringify([currentUserId.toString(), otherUserId.toString()]), updatedSwap.requestedBookId, isTr ? "Sohbet başlatıldı" : "Chat started", new Date().toISOString(), 0, '[]', currentUserId, 'accepted', '{}']);
            }

            const autoMsg = isTr ? `Merhaba! "${bookTitle}" için takas teklifini kabul ettim.` : `Hello! I have accepted the swap offer for "${bookTitle}".`;
            const timestamp = new Date().toISOString();
            await pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', [`msg_${Date.now()}_auto`, chatId, currentUserId, autoMsg, timestamp, false, 'text']);
            await pool.query('UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "lastSenderId" = $4 WHERE id = $3', [autoMsg, timestamp, chatId, currentUserId]);
        } else if (status === 'Rejected' || status === 'Cancelled') {
            // revert book statuses
            await pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND (status = 'Requested' OR status = 'Reserved')", [updatedSwap.requestedBookId]);
            if (updatedSwap.offeredBookIds && Array.isArray(updatedSwap.offeredBookIds)) {
                for (const bookId of updatedSwap.offeredBookIds) {
                    await pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND (status = 'Requested' OR status = 'Reserved')", [bookId]);
                }
            }
        }

        res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).send('Swap update error'); }
});

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
