import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg'; // Using standard pg library
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';

const { Pool } = pg;

const app = express();
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';
const SECRET_KEY = process.env.JWT_SECRET || 'development_only_change_me';
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = (process.env.CORS_ORIGIN || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const bodyLimit = process.env.BODY_LIMIT || '10mb';
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- DATABASE CONFIGURATION ---
const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'campusbookswap',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT || 5432),
};

if (NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
}

if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set. Using insecure development fallback secret.');
}

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
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        if (isLocalhostOrigin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('CORS origin not allowed'));
    }
}));

// Request logging
app.use((req, res, next) => {
    const requestId = randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.url,
        ip: req.ip
    }));
    next();
});

// Payload limits
app.use(express.json({ limit: bodyLimit }) as any);
app.use(express.urlencoded({ limit: bodyLimit, extended: true }) as any);

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
        "offerType" VARCHAR(20) DEFAULT 'swap',
        "offeredAmount" REAL,
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

        try {
            await pool.query(`ALTER TABLE swaps ADD COLUMN IF NOT EXISTS "offerType" VARCHAR(20) DEFAULT 'swap'`);
            await pool.query(`ALTER TABLE swaps ADD COLUMN IF NOT EXISTS "offeredAmount" REAL`);
            await pool.query(`ALTER TABLE swaps ADD COLUMN IF NOT EXISTS "requestedBookIds" JSONB`);
        } catch (e) {
            console.log("Swaps offerType/offeredAmount schema update check ignored");
        }

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

        await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_pins (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "chatId" VARCHAR(255) REFERENCES chats(id) ON DELETE CASCADE,
        "createdAt" TEXT,
        UNIQUE("userId", "chatId")
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS swap_counters (
        id SERIAL PRIMARY KEY,
        "swapId" VARCHAR(255) REFERENCES swaps(id) ON DELETE CASCADE,
        "proposedById" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "offeredBookIds" JSONB,
        "requestedBookId" VARCHAR(255),
        "requestedBookIds" JSONB,
        message TEXT,
        "createdAt" TEXT
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS swap_audit_logs (
        id SERIAL PRIMARY KEY,
        "swapId" VARCHAR(255) REFERENCES swaps(id) ON DELETE CASCADE,
        "actorId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(80),
        details TEXT,
        "createdAt" TEXT
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS swap_completion_confirms (
        id SERIAL PRIMARY KEY,
        "swapId" VARCHAR(255) REFERENCES swaps(id) ON DELETE CASCADE,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "confirmedAt" TEXT,
        UNIQUE("swapId", "userId")
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS book_inventory_events (
        id SERIAL PRIMARY KEY,
        "bookId" VARCHAR(255) REFERENCES books(id) ON DELETE CASCADE,
        "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        "eventType" VARCHAR(80),
        note TEXT,
        "createdAt" TEXT
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS book_ownership_history (
        id SERIAL PRIMARY KEY,
        "swapId" VARCHAR(255) REFERENCES swaps(id) ON DELETE CASCADE,
        "bookId" VARCHAR(255),
        title TEXT,
        author TEXT,
        isbn VARCHAR(50),
        "imageUrl" TEXT,
        "fromUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        "toUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        "transferKind" VARCHAR(20) DEFAULT 'swap',
        note TEXT,
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
        const seedAdminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
        const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin';
        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', [seedAdminUsername]);
        if (adminCheck.rows.length === 0) {
            console.log('Creating Super Admin user...');
            if (seedAdminPassword === 'admin') {
                console.warn('SEED_ADMIN_PASSWORD is using insecure default value. Change it in environment variables.');
            }
            const adminHash = bcrypt.hashSync(seedAdminPassword, 10);
            await pool.query(
                'INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, "avatarUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [seedAdminUsername, adminHash, 'System', 'Admin', 'admin@campusbookswap.com', '555-0000', 'super_admin', 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff']
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

const isNonEmptyString = (value: any, maxLen = 500) =>
    typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLen;

const toPositiveInt = (value: any) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const normalizeBookIdArray = (value: any) => {
    if (!Array.isArray(value)) return [];
    const unique = new Set<string>();
    for (const raw of value) {
        if (isNonEmptyString(raw, 255)) unique.add(String(raw).trim());
    }
    return Array.from(unique);
};

const getRequestedBookIds = (payload: any) => {
    const requestedBookIds = normalizeBookIdArray(payload?.requestedBookIds);
    if (requestedBookIds.length > 0) return requestedBookIds;
    if (isNonEmptyString(payload?.requestedBookId, 255)) return [String(payload.requestedBookId).trim()];
    return [];
};

const allowedMessageTypes = new Set(['text', 'image', 'location', 'book_card']);

const validateBookPayload = (book: any) => {
    if (!book || typeof book !== 'object') return 'Invalid payload';
    if (!isNonEmptyString(book.id, 255)) return 'Invalid book id';
    if (!isNonEmptyString(book.title, 300)) return 'Invalid title';
    if (book.description && !isNonEmptyString(book.description, 3000)) return 'Invalid description';
    const forSale = !!book.forSale;
    if (book.price !== undefined && book.price !== null && Number.isNaN(Number(book.price))) return 'Invalid price';
    if (forSale) {
        if (book.price === undefined || book.price === null || Number(book.price) <= 0 || Number.isNaN(Number(book.price))) return 'Price is required for sale listings';
    }
    return null;
};

const mapToBool = (value: any) => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return null;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return null;
};

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts. Please try again later.'
});

const swapStatusTransitions: Record<string, string[]> = {
    Pending: ['Accepted', 'Rejected', 'Cancelled'],
    Accepted: ['Completed', 'Cancelled'],
    Rejected: [],
    Cancelled: [],
    Completed: []
};

const logSwapAudit = async (swapId: string, actorId: number | null, action: string, details = '') => {
    try {
        await pool.query(
            'INSERT INTO swap_audit_logs ("swapId", "actorId", action, details, "createdAt") VALUES ($1,$2,$3,$4,$5)',
            [swapId, actorId, action, details, new Date().toISOString()]
        );
    } catch (e) {
        console.error('swap_audit_logs insert failed', e);
    }
};

const logInventoryEvent = async (bookId: string, userId: number | null, eventType: string, note = '') => {
    try {
        await pool.query(
            'INSERT INTO book_inventory_events ("bookId", "userId", "eventType", note, "createdAt") VALUES ($1,$2,$3,$4,$5)',
            [bookId, userId, eventType, note, new Date().toISOString()]
        );
    } catch (e) {
        console.error('book_inventory_events insert failed', e);
    }
};

const attachInventoryTags = async (bookRows: any[]) => {
    if (!bookRows.length) return bookRows;
    const ids = bookRows.map((b) => b.id);
    const ownerIds = Array.from(new Set(bookRows.map((b) => Number(b.ownerId)).filter((n) => Number.isInteger(n) && n > 0)));
    const latestEventsRes = await pool.query(
        `SELECT DISTINCT ON ("bookId", "userId") "bookId", "userId", "eventType"
         FROM book_inventory_events
         WHERE "bookId" = ANY($1) AND "userId" = ANY($2)
         ORDER BY "bookId", "userId", "createdAt" DESC, id DESC`,
        [ids, ownerIds]
    );
    const tagMap: Record<string, string> = {};
    for (const r of latestEventsRes.rows) tagMap[`${r.bookId}:${r.userId}`] = r.eventType;
    return bookRows.map((b) => ({ ...b, inventoryTag: tagMap[`${b.id}:${Number(b.ownerId)}`] || null }));
};

const sendSystemSwapMessage = async (participantAId: string, participantBId: string, bookId: string | null, senderId: number, text: string) => {
    try {
        const allChats = await pool.query('SELECT * FROM chats WHERE "participantIds" @> $1', [JSON.stringify([participantAId])]);
        let existingChat = allChats.rows.find((c: any) =>
            Array.isArray(c.participantIds) &&
            c.participantIds.includes(participantBId) &&
            (!bookId || !c.bookId || String(c.bookId) === String(bookId))
        );
        let chatId = '';
        const timestamp = new Date().toISOString();
        if (existingChat) {
            chatId = existingChat.id;
            await pool.query('UPDATE chats SET "hiddenBy" = $1, status = $2 WHERE id = $3', ['[]', 'accepted', chatId]);
        } else {
            chatId = `chat_${Date.now()}_${randomUUID()}`;
            await pool.query(
                'INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
                [chatId, JSON.stringify([participantAId, participantBId]), bookId || null, text, timestamp, 0, '[]', senderId, 'accepted', '{}']
            );
        }
        await pool.query(
            'INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [`msg_${Date.now()}_${randomUUID()}_sys`, chatId, senderId, text, timestamp, false, 'text']
        );
        await pool.query(
            'UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "lastSenderId" = $4 WHERE id = $3',
            [text, timestamp, chatId, senderId]
        );
    } catch (e) {
        console.error('Failed to send system swap message', e);
    }
};

app.get('/', (req, res) => { res.send('Backend API is running on PostgreSQL.'); });
app.get('/healthz', (req, res) => { res.json({ ok: true, service: 'api' }); });
app.get('/readyz', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, db: 'up' });
    } catch (e) {
        res.status(503).json({ ok: false, db: 'down' });
    }
});

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
        const targetRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        const targetRole = targetRoleRes.rows[0]?.role || null;
        if (!targetRole) return res.status(404).send("User not found");
        if (targetRole !== 'user') return res.json([]);
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
    const targetId = toPositiveInt(targetUserId);
    if (!targetId || rating === undefined || rating === null) return res.status(400).send("Missing required fields");
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) return res.status(400).send("Rating must be between 1 and 5");
    if (comment && !isNonEmptyString(comment, 1000)) return res.status(400).send("Invalid comment");
    if (parseInt(targetUserId) === parseInt(reviewerId)) return res.status(400).send("Cannot review yourself");
    try {
        const rolesRes = await pool.query('SELECT id, role FROM users WHERE id = ANY($1)', [[Number(reviewerId), Number(targetId)]]);
        const roleById: Record<number, string> = {};
        for (const row of rolesRes.rows) roleById[Number(row.id)] = row.role;
        const reviewerRole = roleById[Number(reviewerId)];
        const targetRole = roleById[Number(targetId)];
        if (!reviewerRole || !targetRole) return res.status(404).send("User not found");
        if (reviewerRole !== 'user' || targetRole !== 'user') return res.status(403).send("Reviews are only allowed between marketplace users");
        await pool.query(
            'INSERT INTO reviews ("reviewerId", "targetUserId", rating, comment, "createdAt") VALUES ($1, $2, $3, $4, $5)',
            [reviewerId, targetId, Number(rating), comment || '', new Date().toISOString()]
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

app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { username, password, firstName, lastName, email, phone } = req.body;
    if (!isNonEmptyString(username, 255) || !isNonEmptyString(password, 128) || !isNonEmptyString(firstName, 100) || !isNonEmptyString(lastName, 100)) {
        return res.status(400).send('Required fields missing.');
    }
    if (password.length < 6) return res.status(400).send('Password must be at least 6 characters.');
    if (email && !isNonEmptyString(email, 255)) return res.status(400).send('Invalid email.');
    if (phone && !isNonEmptyString(phone, 50)) return res.status(400).send('Invalid phone.');
    const hashedPassword = bcrypt.hashSync(password, 10);
    const avatarUrl = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, "avatarUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [username, hashedPassword, firstName, lastName, email || '', phone || '', 'user', avatarUrl]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id.toString(), username: user.username }, SECRET_KEY, { expiresIn: TOKEN_EXPIRES_IN });
        res.json({ user: { id: user.id.toString(), username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl }, token });
    } catch (err: any) {
        if (err.code === '23505') res.status(400).send('This username is already taken.');
        else res.status(500).send('Internal Server Error.');
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!isNonEmptyString(username, 255) || !isNonEmptyString(password, 128)) return res.status(400).send('Invalid credentials payload');
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (user && bcrypt.compareSync(password, user.password_hash)) {
            const token = jwt.sign({ id: user.id.toString(), username: user.username }, SECRET_KEY, { expiresIn: TOKEN_EXPIRES_IN });
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

app.get('/api/admin/swaps-details', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const swapsRes = await pool.query(`
            SELECT s.*,
                   u1.username as "offeredByUsername",
                   u2.username as "offeredToUsername"
            FROM swaps s
            LEFT JOIN users u1 ON s."offeredById" = u1.id
            LEFT JOIN users u2 ON s."offeredToId" = u2.id
            ORDER BY s."lastUpdateDate" DESC
        `);

        const allBookIds = new Set<string>();
        for (const s of swapsRes.rows) {
            for (const id of getRequestedBookIds(s)) allBookIds.add(id);
            if (Array.isArray(s.offeredBookIds)) {
                for (const id of s.offeredBookIds) allBookIds.add(id);
            }
        }

        const booksMap: Record<string, any> = {};
        if (allBookIds.size > 0) {
            const ids = Array.from(allBookIds);
            const booksRes = await pool.query('SELECT id, title, author, status, "ownerId", "imageUrl", price, "forSwap", "forSale", condition, department, course FROM books WHERE id = ANY($1)', [ids]);
            for (const b of booksRes.rows) booksMap[b.id] = b;
        }

        const payload = swapsRes.rows.map((s) => ({
            ...s,
            offeredById: s.offeredById?.toString(),
            offeredToId: s.offeredToId?.toString(),
            requestedBookIds: getRequestedBookIds(s),
            offeredBooks: (s.offeredBookIds || []).map((id: string) => ({
                id,
                title: booksMap[id]?.title || 'Unknown',
                author: booksMap[id]?.author || '',
                status: booksMap[id]?.status || 'Unknown',
                ownerId: booksMap[id]?.ownerId?.toString() || null,
                imageUrl: booksMap[id]?.imageUrl || '',
                price: booksMap[id]?.price ?? null,
                forSwap: !!booksMap[id]?.forSwap,
                forSale: !!booksMap[id]?.forSale,
                condition: booksMap[id]?.condition || '',
                department: booksMap[id]?.department || '',
                course: booksMap[id]?.course || ''
            })),
            requestedBook: getRequestedBookIds(s)[0] ? {
                id: getRequestedBookIds(s)[0],
                title: booksMap[getRequestedBookIds(s)[0]]?.title || 'Unknown',
                status: booksMap[getRequestedBookIds(s)[0]]?.status || 'Unknown',
                ownerId: booksMap[getRequestedBookIds(s)[0]]?.ownerId?.toString() || null,
                author: booksMap[getRequestedBookIds(s)[0]]?.author || '',
                imageUrl: booksMap[getRequestedBookIds(s)[0]]?.imageUrl || '',
                price: booksMap[getRequestedBookIds(s)[0]]?.price ?? null,
                forSwap: !!booksMap[getRequestedBookIds(s)[0]]?.forSwap,
                forSale: !!booksMap[getRequestedBookIds(s)[0]]?.forSale,
                condition: booksMap[getRequestedBookIds(s)[0]]?.condition || '',
                department: booksMap[getRequestedBookIds(s)[0]]?.department || '',
                course: booksMap[getRequestedBookIds(s)[0]]?.course || ''
            } : null
        }));
        res.json(payload);
    } catch (e) { res.status(500).send("Failed to fetch swap details"); }
});

app.get('/api/admin/offers-audit', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.id, l."swapId", l."actorId", l.action, l.details, l."createdAt",
                   u.username as "actorUsername"
            FROM swap_audit_logs l
            LEFT JOIN users u ON l."actorId" = u.id
            ORDER BY l."createdAt" DESC
            LIMIT 300
        `);
        res.json(result.rows.map((r) => ({ ...r, actorId: r.actorId ? String(r.actorId) : null })));
    } catch (e) { res.status(500).send("Failed to fetch offers audit logs"); }
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
        const taggedRows = await attachInventoryTags(result.rows);
        const books = taggedRows.map(b => ({
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

app.get('/api/books/search', async (req, res) => {
    try {
        const {
            q = '',
            department,
            course,
            condition,
            minPrice,
            maxPrice,
            forSwap,
            forSale,
            sort = 'newest'
        } = req.query as any;

        const where: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (isNonEmptyString(q, 255)) {
            where.push(`(LOWER(title) LIKE LOWER($${idx}) OR LOWER(author) LIKE LOWER($${idx}) OR LOWER(isbn) LIKE LOWER($${idx}))`);
            params.push(`%${q.trim()}%`);
            idx++;
        }
        if (isNonEmptyString(department, 100)) { where.push(`department = $${idx}`); params.push(department); idx++; }
        if (isNonEmptyString(course, 100)) { where.push(`course = $${idx}`); params.push(course); idx++; }
        if (isNonEmptyString(condition, 50)) { where.push(`condition = $${idx}`); params.push(condition); idx++; }
        if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(Number(minPrice))) { where.push(`price >= $${idx}`); params.push(Number(minPrice)); idx++; }
        if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) { where.push(`price <= $${idx}`); params.push(Number(maxPrice)); idx++; }
        const swapBool = mapToBool(forSwap);
        const saleBool = mapToBool(forSale);
        if (swapBool === true && saleBool === true) {
            // Both toggled => books listed for both
            where.push(`"forSwap" = $${idx}`); params.push(true); idx++;
            where.push(`"forSale" = $${idx}`); params.push(true); idx++;
        } else if (swapBool === true) {
            // For Swap filter
            where.push(`"forSwap" = $${idx}`); params.push(true); idx++;
        } else if (saleBool === true) {
            // For Sale filter
            where.push(`"forSale" = $${idx}`); params.push(true); idx++;
        }

        const orderBy = sort === 'price_asc' ? 'price ASC NULLS LAST'
            : sort === 'price_desc' ? 'price DESC NULLS LAST'
                : '\"listedDate\" DESC';

        const query = `
            SELECT b.*, u.username as "ownerUsername",
            (SELECT COUNT(*)::int FROM favorites f WHERE f."bookId" = b.id) as "favoriteCount"
            FROM books b
            LEFT JOIN users u ON b."ownerId" = u.id
            ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
            ORDER BY ${orderBy}
            LIMIT 200
        `;
        const result = await pool.query(query, params);
        const taggedRows = await attachInventoryTags(result.rows);
        const books = taggedRows.map(b => ({
            ...b,
            ownerId: b.ownerId ? b.ownerId.toString() : null,
            isFavorited: false
        }));
        res.json(books);
    } catch (e) {
        console.error(e);
        res.status(500).send('Book search failed');
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
            const taggedRows = await attachInventoryTags(result.rows);
            const b = taggedRows[0];
            res.json({
                ...b,
                ownerId: b.ownerId ? b.ownerId.toString() : null,
                isFavorited: !!b.isFavorited
            });
        } else { res.status(404).send("Book not found"); }
    } catch (e) { res.status(500).send("DB Error"); }
});

app.get('/api/books/:id/ownership-history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT h.*, uf.username as "fromUsername", ut.username as "toUsername"
             FROM book_ownership_history h
             LEFT JOIN users uf ON h."fromUserId" = uf.id
             LEFT JOIN users ut ON h."toUserId" = ut.id
             WHERE h."bookId" = $1
             ORDER BY h."createdAt" DESC, h.id DESC`,
            [req.params.id]
        );
        res.json(result.rows.map((r) => ({
            ...r,
            fromUserId: r.fromUserId ? String(r.fromUserId) : null,
            toUserId: r.toUserId ? String(r.toUserId) : null
        })));
    } catch (e) {
        console.error(e);
        res.status(500).send("Failed to fetch ownership history");
    }
});

app.post('/api/books', authenticateToken, async (req, res) => {
    const book = req.body;
    const validationError = validateBookPayload(book);
    if (validationError) return res.status(400).send(validationError);
    try {
        const roleRes = await pool.query('SELECT role FROM users WHERE id = $1', [(req as any).user.id]);
        const role = roleRes.rows[0]?.role || 'user';
        if (role !== 'user') return res.status(403).send("Admins/moderators cannot create listings");
        const normalizedPrice = !!book.forSale ? Number(book.price) : null;
        await pool.query(
            `INSERT INTO books (id, title, author, isbn, edition, course, department, condition, description, "imageUrl", "ownerId", price, "forSwap", "forSale", "listedDate", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [book.id, book.title, book.author, book.isbn, book.edition, book.course, book.department, book.condition, book.description, book.imageUrl, (req as any).user.id, normalizedPrice, !!book.forSwap, !!book.forSale, book.listedDate, 'Available']
        );
        await logInventoryEvent(book.id, Number((req as any).user.id), 'ADDED', 'Book added to account');
        res.json(book);
    } catch (err) { res.status(500).send("Failed to add book"); }
});

app.put('/api/books/:id', authenticateToken, async (req, res) => {
    const book = req.body;
    const validationError = validateBookPayload({ ...book, id: req.params.id });
    if (validationError) return res.status(400).send(validationError);
    try {
        const requesterId = parseInt((req as any).user.id);
        const requesterRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        const requesterRole = requesterRoleRes.rows[0]?.role || 'user';
        const bookOwnerRes = await pool.query('SELECT "ownerId", "forSwap", "forSale" FROM books WHERE id = $1', [req.params.id]);
        if (bookOwnerRes.rows.length === 0) return res.status(404).send("Book not found");
        const isOwner = String(bookOwnerRes.rows[0].ownerId) === String(requesterId);
        const isAdmin = ['super_admin', 'admin', 'moderator'].includes(requesterRole);
        if (!isOwner && !isAdmin) return res.status(403).send("Not authorized to edit this book");
        const normalizedPrice = !!book.forSale ? Number(book.price) : null;

        await pool.query(
            `UPDATE books SET title=$1, author=$2, isbn=$3, edition=$4, course=$5, department=$6, condition=$7, description=$8, "imageUrl"=$9, price=$10, "forSwap"=$11, "forSale"=$12, status=$14 WHERE id=$13`,
            [book.title, book.author, book.isbn, book.edition, book.course, book.department, book.condition, book.description, book.imageUrl, normalizedPrice, !!book.forSwap, !!book.forSale, req.params.id, book.status || 'Available']
        );
        const wasListed = !!bookOwnerRes.rows[0].forSwap || !!bookOwnerRes.rows[0].forSale;
        const nowListed = !!book.forSwap || !!book.forSale;
        if (wasListed && !nowListed) {
            await logInventoryEvent(req.params.id, Number(requesterId), 'UNLISTED', 'Moved from listing to inventory');
        } else if (!wasListed && nowListed) {
            await logInventoryEvent(req.params.id, Number(requesterId), 'LISTED', 'Moved from inventory to listing');
        }
        res.json(book);
    } catch (e) { res.status(500).send("Server Error"); }
});

app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        const requesterId = parseInt((req as any).user.id);
        const requesterRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        const requesterRole = requesterRoleRes.rows[0]?.role || 'user';
        const bookOwnerRes = await pool.query('SELECT "ownerId" FROM books WHERE id = $1', [req.params.id]);
        if (bookOwnerRes.rows.length === 0) return res.status(404).send("Book not found");
        const isOwner = String(bookOwnerRes.rows[0].ownerId) === String(requesterId);
        const isAdmin = ['super_admin', 'admin', 'moderator'].includes(requesterRole);
        if (!isOwner && !isAdmin) return res.status(403).send("Not authorized to delete this book");

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

app.post('/api/chats/:id/pin', authenticateToken, async (req, res) => {
    const userId = parseInt((req as any).user.id);
    const chatId = req.params.id;
    try {
        const chatRes = await pool.query('SELECT "participantIds" FROM chats WHERE id = $1', [chatId]);
        if (chatRes.rows.length === 0) return res.status(404).send('Chat not found');
        if (!(chatRes.rows[0].participantIds || []).includes(userId.toString())) return res.status(403).send('Not authorized');
        await pool.query(
            'INSERT INTO chat_pins ("userId", "chatId", "createdAt") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [userId, chatId, new Date().toISOString()]
        );
        res.json({ success: true, pinned: true });
    } catch (e) { res.status(500).send('Pin failed'); }
});

app.get('/api/chats/:id/pin', authenticateToken, async (req, res) => {
    const userId = parseInt((req as any).user.id);
    const chatId = req.params.id;
    try {
        const chatRes = await pool.query('SELECT "participantIds" FROM chats WHERE id = $1', [chatId]);
        if (chatRes.rows.length === 0) return res.status(404).send('Chat not found');
        if (!(chatRes.rows[0].participantIds || []).includes(userId.toString())) return res.status(403).send('Not authorized');
        const pinRes = await pool.query(
            'SELECT 1 FROM chat_pins WHERE "userId" = $1 AND "chatId" = $2 LIMIT 1',
            [userId, chatId],
        );
        res.json({ pinned: pinRes.rows.length > 0 });
    } catch (e) { res.status(500).send('Pin status failed'); }
});

app.delete('/api/chats/:id/pin', authenticateToken, async (req, res) => {
    const userId = parseInt((req as any).user.id);
    try {
        await pool.query('DELETE FROM chat_pins WHERE "userId" = $1 AND "chatId" = $2', [userId, req.params.id]);
        res.json({ success: true, pinned: false });
    } catch (e) { res.status(500).send('Unpin failed'); }
});

app.get('/api/chats/:id/search', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id.toString();
    const queryText = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!queryText) return res.status(400).send('Search query is required');
    try {
        const chatRes = await pool.query('SELECT "participantIds" FROM chats WHERE id = $1', [req.params.id]);
        if (chatRes.rows.length === 0) return res.status(404).send('Chat not found');
        if (!(chatRes.rows[0].participantIds || []).includes(userId)) return res.status(403).send('Not authorized');
        const result = await pool.query(
            'SELECT * FROM messages WHERE "chatThreadId" = $1 AND LOWER(text) LIKE LOWER($2) ORDER BY timestamp DESC LIMIT 100',
            [req.params.id, `%${queryText}%`]
        );
        res.json(result.rows.map(m => ({ ...m, senderId: m.senderId ? m.senderId.toString() : null })));
    } catch (e) { res.status(500).send('Chat search failed'); }
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
        if (!(chat.participantIds || []).includes(userId)) return res.status(403).send("Not authorized");
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
            chatId = `chat_${Date.now()}_${randomUUID()}`;
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
                    const msgId = `msg_${Date.now()}_${randomUUID()}_auto`;
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
        const chatRes = await pool.query('SELECT "participantIds", "lastSenderId" FROM chats WHERE id = $1', [req.params.id]);
        if (chatRes.rows.length === 0) return res.status(404).send("Chat not found");
        if (!(chatRes.rows[0].participantIds || []).includes(String(userId))) return res.status(403).send("Not authorized");
        if (chatRes.rows[0].lastSenderId !== userId) {
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
        const chatRes = await pool.query('SELECT "participantIds", "clearedHistoryAt" FROM chats WHERE id = $1', [req.params.id]);
        let filterTimestamp = null;

        if (chatRes.rows.length === 0) return res.status(404).send("Chat not found");
        const participantIds = chatRes.rows[0].participantIds || [];
        if (!participantIds.includes(userId)) return res.status(403).send("Not authorized to access this chat");
        const clearedMap = chatRes.rows[0].clearedHistoryAt || {};
        if (clearedMap[userId]) filterTimestamp = clearedMap[userId];

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
    const msgId = `msg_${Date.now()}_${randomUUID()}`;
    const timestamp = new Date().toISOString();
    const normalizedType = type || 'text';
    if (!allowedMessageTypes.has(normalizedType)) return res.status(400).send("Invalid message type");
    if (!isNonEmptyString(text, 5000)) return res.status(400).send("Message text is required");

    try {
        // --- BLOCK CHECK LOGIC ---
        // 1. Get chat participants to find the other user
        const chatRes = await pool.query('SELECT "participantIds", "hiddenBy" FROM chats WHERE id = $1', [chatId]);
        if (chatRes.rows.length === 0) return res.status(404).send("Chat not found");

        const chat = chatRes.rows[0];
        const participantIds = chat.participantIds;
        if (!participantIds.includes(senderId.toString())) return res.status(403).send("Not authorized");
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

        await pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', [msgId, chatId, senderId, text.trim(), timestamp, false, normalizedType]);
        let preview = text;
        if (normalizedType === 'image') preview = '📷 Photo';
        else if (normalizedType === 'location') preview = '📍 Location';

        // Remove from hiddenBy for participants (unhide chat if it was hidden/deleted)
        // Note: We DO NOT reset 'clearedHistoryAt'. 
        // If User A deleted chat (set clearedHistoryAt), and User B sends message, 
        // User A should see the new message, but NOT the old ones.
        const currentHidden = chat.hiddenBy || [];
        const newHidden = currentHidden.filter((id: string) => !participantIds.includes(id));

        await pool.query('UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "hiddenBy" = $3, "lastSenderId" = $4 WHERE id = $5', [preview, timestamp, JSON.stringify(newHidden), senderId, chatId]);
        res.json({ id: msgId, chatThreadId: chatId, senderId: senderId.toString(), text: text.trim(), timestamp, isRead: false, type: normalizedType });
    } catch (e) {
        console.error("Message send error:", e);
        res.status(500).send("Send message error");
    }
});

// Swaps
app.get('/api/swaps', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const requesterRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const requesterRole = requesterRoleRes.rows[0]?.role || 'user';
        if (requesterRole !== 'user') return res.json([]);
        const result = await pool.query(`SELECT s.*, u1.username as "offeredByUsername", u2.username as "offeredToUsername" FROM swaps s LEFT JOIN users u1 ON s."offeredById" = u1.id LEFT JOIN users u2 ON s."offeredToId" = u2.id WHERE s."offeredById" = $1 OR s."offeredToId" = $1`, [userId]);
        const swapIds = result.rows.map((r) => String(r.id));
        const historyBySwap: Record<string, any[]> = {};
        if (swapIds.length > 0) {
            const historyRes = await pool.query(
                `SELECT h.*, uf.username as "fromUsername", ut.username as "toUsername"
                 FROM book_ownership_history h
                 LEFT JOIN users uf ON h."fromUserId" = uf.id
                 LEFT JOIN users ut ON h."toUserId" = ut.id
                 WHERE h."swapId" = ANY($1)
                 ORDER BY h."createdAt" DESC, h.id DESC`,
                [swapIds]
            );
            for (const row of historyRes.rows) {
                const key = String(row.swapId);
                if (!historyBySwap[key]) historyBySwap[key] = [];
                historyBySwap[key].push({
                    ...row,
                    fromUserId: row.fromUserId ? String(row.fromUserId) : null,
                    toUserId: row.toUserId ? String(row.toUserId) : null
                });
            }
        }
        const swaps = result.rows.map(s => ({
            ...s,
            offeredById: s.offeredById.toString(),
            offeredToId: s.offeredToId.toString(),
            bookHistory: historyBySwap[String(s.id)] || []
        }));
        res.json(swaps);
    } catch (e) { res.status(500).send("Swap list error"); }
});

app.post('/api/swaps', authenticateToken, async (req, res) => {
    const swap = req.body;
    const userId = (req as any).user.id;
    try {
        const roleRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = roleRes.rows[0]?.role || 'user';
        if (role !== 'user') return res.status(403).send("Admins/moderators cannot create offers");
        if (!isNonEmptyString(swap.id, 255)) return res.status(400).send("Invalid swap id");
        const offeredToId = toPositiveInt(swap.offeredToId);
        if (!offeredToId) return res.status(400).send("Invalid offeredToId");
        const requestedBookIds = getRequestedBookIds(swap);
        if (requestedBookIds.length === 0) return res.status(400).send("Invalid requested books");
        const offerType = swap.offerType === 'buy' ? 'buy' : 'swap';
        const offeredAmount = swap.offeredAmount !== undefined && swap.offeredAmount !== null ? Number(swap.offeredAmount) : null;
        if (String(offeredToId) === String(userId)) return res.status(400).send("Cannot create swap with yourself");
        const recipientRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [offeredToId]);
        const recipientRole = recipientRoleRes.rows[0]?.role || null;
        if (!recipientRole) return res.status(404).send("Offered-to user not found");
        if (recipientRole !== 'user') return res.status(403).send("Cannot send offers to admin/moderator accounts");

        const requestedBookRes = await pool.query(
            'SELECT id, "ownerId", status, "forSale", "forSwap" FROM books WHERE id = ANY($1)',
            [requestedBookIds],
        );
        if (requestedBookRes.rows.length !== requestedBookIds.length) return res.status(404).send("One or more requested books were not found");
        for (const b of requestedBookRes.rows) {
            if (String(b.ownerId) !== String(offeredToId)) return res.status(400).send("All requested books must belong to offeredTo user");
            if (b.status !== 'Available') return res.status(400).send("One or more requested books are not available");
        }

        if (offerType === 'buy') {
            if (!requestedBookRes.rows.every((b: any) => !!b.forSale)) return res.status(400).send("All requested books must be listed for sale");
            if (!offeredAmount || Number.isNaN(offeredAmount) || offeredAmount <= 0) return res.status(400).send("Invalid offeredAmount");
            swap.offeredBookIds = [];
        } else {
            if (!requestedBookRes.rows.every((b: any) => !!b.forSwap)) return res.status(400).send("All requested books must be listed for swap");
            if (!Array.isArray(swap.offeredBookIds) || swap.offeredBookIds.length === 0 || !swap.offeredBookIds.every((id: any) => isNonEmptyString(id, 255))) {
                return res.status(400).send("Invalid offeredBookIds");
            }
            for (const offeredBookId of swap.offeredBookIds) {
                const offeredBookRes = await pool.query('SELECT "ownerId", status FROM books WHERE id = $1', [offeredBookId]);
                if (offeredBookRes.rows.length === 0) return res.status(404).send(`Offered book not found: ${offeredBookId}`);
                if (String(offeredBookRes.rows[0].ownerId) !== String(userId)) return res.status(403).send("You can only offer your own books");
                if (offeredBookRes.rows[0].status !== 'Available') return res.status(400).send("One or more offered books are not available");
            }
        }

        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", "requestedBookIds", "offerType", "offeredAmount", status, message, "creationDate", "lastUpdateDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [swap.id, userId, swap.offeredToId, JSON.stringify(swap.offeredBookIds), requestedBookIds[0], JSON.stringify(requestedBookIds), offerType, offeredAmount, swap.status, swap.message, swap.creationDate, swap.lastUpdateDate],
        );
        await logSwapAudit(String(swap.id), Number(userId), 'OFFER_CREATED', `type=${offerType}`);
        res.json({ ...swap, requestedBookId: requestedBookIds[0], requestedBookIds });
    } catch (e) { res.status(500).send("Failed to create swap"); }
});

app.get('/api/swaps/:id/counters', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const swapRes = await pool.query('SELECT "offeredById", "offeredToId" FROM swaps WHERE id = $1', [req.params.id]);
        if (swapRes.rows.length === 0) return res.status(404).send('Swap not found');
        const swap = swapRes.rows[0];
        if (String(swap.offeredById) !== String(userId) && String(swap.offeredToId) !== String(userId)) return res.status(403).send('Not authorized');
        const result = await pool.query('SELECT * FROM swap_counters WHERE "swapId" = $1 ORDER BY "createdAt" DESC', [req.params.id]);
        res.json(result.rows);
    } catch (e) { res.status(500).send('Failed to fetch counters'); }
});

app.post('/api/swaps/:id/counter', authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const { offeredBookIds, requestedBookId, requestedBookIds, message } = req.body;
    try {
        const swapRes = await pool.query('SELECT * FROM swaps WHERE id = $1', [req.params.id]);
        if (swapRes.rows.length === 0) return res.status(404).send('Swap not found');
        const swap = swapRes.rows[0];
        if (swap.status !== 'Pending') return res.status(400).send('Counter offer is only allowed for pending swaps');
        if (String(swap.offeredById) !== String(userId) && String(swap.offeredToId) !== String(userId)) return res.status(403).send('Not authorized');
        const normalizedOfferedBookIds = normalizeBookIdArray(offeredBookIds);
        const normalizedRequestedBookIds = getRequestedBookIds({ requestedBookId, requestedBookIds });
        if (normalizedOfferedBookIds.length === 0) return res.status(400).send('Invalid offeredBookIds');
        if (normalizedRequestedBookIds.length === 0) return res.status(400).send('Invalid requested books');
        const counterpartyId = String(userId) === String(swap.offeredById) ? swap.offeredToId : swap.offeredById;
        const requesterId = Number(userId);
        const requestedRes = await pool.query(
            'SELECT id, "ownerId", status, "forSale", "forSwap" FROM books WHERE id = ANY($1)',
            [normalizedRequestedBookIds],
        );
        if (requestedRes.rows.length !== normalizedRequestedBookIds.length) return res.status(404).send('One or more requested books not found');
        for (const b of requestedRes.rows) {
            if (String(b.ownerId) !== String(counterpartyId)) return res.status(400).send('Requested books must belong to the counterparty');
            if (b.status !== 'Available' && b.status !== 'Reserved') return res.status(400).send('Requested books must be available or reserved');
            if (swap.offerType === 'buy' && !b.forSale) return res.status(400).send('Requested books must be listed for sale');
            if (swap.offerType !== 'buy' && !b.forSwap) return res.status(400).send('Requested books must be listed for swap');
        }
        const offeredRes = await pool.query(
            'SELECT id, "ownerId", status FROM books WHERE id = ANY($1)',
            [normalizedOfferedBookIds],
        );
        if (offeredRes.rows.length !== normalizedOfferedBookIds.length) return res.status(404).send('One or more offered books not found');
        for (const b of offeredRes.rows) {
            if (String(b.ownerId) !== String(requesterId)) return res.status(400).send('You can only offer your own books');
            if (b.status !== 'Available' && b.status !== 'Reserved') return res.status(400).send('Offered books must be available or reserved');
        }

        await pool.query(
            'INSERT INTO swap_counters ("swapId", "proposedById", "offeredBookIds", "requestedBookId", "requestedBookIds", message, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [req.params.id, userId, JSON.stringify(normalizedOfferedBookIds), normalizedRequestedBookIds[0], JSON.stringify(normalizedRequestedBookIds), message || '', new Date().toISOString()]
        );
        await pool.query(
            'UPDATE swaps SET "offeredBookIds" = $1, "requestedBookId" = $2, "requestedBookIds" = $3, message = $4, "lastUpdateDate" = $5 WHERE id = $6',
            [JSON.stringify(normalizedOfferedBookIds), normalizedRequestedBookIds[0], JSON.stringify(normalizedRequestedBookIds), message || swap.message || '', new Date().toISOString(), req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).send('Counter offer failed'); }
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
            for (const requestedBookId of getRequestedBookIds(swap)) {
                await pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND (status = 'Requested' OR status = 'Reserved')", [requestedBookId]);
            }
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
        const nextStatuses = swapStatusTransitions[swap.status] || [];
        if (!nextStatuses.includes(status)) {
            return res.status(400).send(`Invalid status transition from ${swap.status} to ${status}`);
        }

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

        // Completed: require confirmations from both participants before transfer
        if (status === 'Completed') {
            if (swap.status !== 'Accepted') return res.status(400).send('Swap must be Accepted before completing.');
            const requestedBookIds = getRequestedBookIds(swap);
            await pool.query(
                `INSERT INTO swap_completion_confirms ("swapId", "userId", "confirmedAt")
                 VALUES ($1,$2,$3)
                 ON CONFLICT ("swapId","userId") DO UPDATE SET "confirmedAt" = EXCLUDED."confirmedAt"`,
                [req.params.id, Number(currentUserId), new Date().toISOString()]
            );
            await logSwapAudit(req.params.id, Number(currentUserId), 'COMPLETION_CONFIRMED', 'Participant confirmed completion');
            const confRes = await pool.query('SELECT "userId" FROM swap_completion_confirms WHERE "swapId" = $1', [req.params.id]);
            const confirmedBy = confRes.rows.map((r) => String(r.userId));
            if (confirmedBy.length < 2) {
                return res.json({ success: true, pendingSecondConfirmation: true, confirmedBy });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                if (swap.offeredBookIds && Array.isArray(swap.offeredBookIds)) {
                    for (const bookId of swap.offeredBookIds) {
                        const offeredBookSnapshotRes = await client.query(
                            'SELECT id, title, author, isbn, "imageUrl", "ownerId" FROM books WHERE id = $1',
                            [bookId]
                        );
                        const offeredBookSnapshot = offeredBookSnapshotRes.rows[0];
                        await client.query('UPDATE books SET "ownerId" = $1, status = $2, "forSwap" = $3, "forSale" = $4 WHERE id = $5', [swap.offeredToId, 'Swapped', false, false, bookId]);
                        await client.query('INSERT INTO book_inventory_events ("bookId","userId","eventType",note,"createdAt") VALUES ($1,$2,$3,$4,$5)', [bookId, swap.offeredToId, 'RECEIVED_SWAP', `Received from user ${swap.offeredById}`, new Date().toISOString()]);
                        await client.query('INSERT INTO book_inventory_events ("bookId","userId","eventType",note,"createdAt") VALUES ($1,$2,$3,$4,$5)', [bookId, swap.offeredById, 'TRANSFERRED_OUT', `Transferred to user ${swap.offeredToId}`, new Date().toISOString()]);
                        await client.query(
                            `INSERT INTO book_ownership_history
                             ("swapId","bookId",title,author,isbn,"imageUrl","fromUserId","toUserId","transferKind",note,"createdAt")
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                            [
                                req.params.id,
                                bookId,
                                offeredBookSnapshot?.title || null,
                                offeredBookSnapshot?.author || null,
                                offeredBookSnapshot?.isbn || null,
                                offeredBookSnapshot?.imageUrl || null,
                                offeredBookSnapshot?.ownerId || swap.offeredById,
                                swap.offeredToId,
                                'swap',
                                `Transferred from ${swap.offeredById} to ${swap.offeredToId}`,
                                new Date().toISOString()
                            ]
                        );
                    }
                }
                for (const requestedBookId of requestedBookIds) {
                    const requestedBookSnapshotRes = await client.query(
                        'SELECT id, title, author, isbn, "imageUrl", "ownerId" FROM books WHERE id = $1',
                        [requestedBookId]
                    );
                    const requestedBookSnapshot = requestedBookSnapshotRes.rows[0];
                    await client.query('UPDATE books SET "ownerId" = $1, status = $2, "forSwap" = $3, "forSale" = $4 WHERE id = $5', [swap.offeredById, 'Swapped', false, false, requestedBookId]);
                    await client.query('INSERT INTO book_inventory_events ("bookId","userId","eventType",note,"createdAt") VALUES ($1,$2,$3,$4,$5)', [requestedBookId, swap.offeredById, 'RECEIVED_SWAP', `Received from user ${swap.offeredToId}`, new Date().toISOString()]);
                    await client.query('INSERT INTO book_inventory_events ("bookId","userId","eventType",note,"createdAt") VALUES ($1,$2,$3,$4,$5)', [requestedBookId, swap.offeredToId, 'TRANSFERRED_OUT', `Transferred to user ${swap.offeredById}`, new Date().toISOString()]);
                    await client.query(
                        `INSERT INTO book_ownership_history
                         ("swapId","bookId",title,author,isbn,"imageUrl","fromUserId","toUserId","transferKind",note,"createdAt")
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                        [
                            req.params.id,
                            requestedBookId,
                            requestedBookSnapshot?.title || null,
                            requestedBookSnapshot?.author || null,
                            requestedBookSnapshot?.isbn || null,
                            requestedBookSnapshot?.imageUrl || null,
                            requestedBookSnapshot?.ownerId || swap.offeredToId,
                            swap.offeredById,
                            swap.offerType === 'buy' ? 'sale' : 'swap',
                            swap.offerType === 'buy'
                                ? `Sold by ${swap.offeredToId} to ${swap.offeredById}`
                                : `Transferred from ${swap.offeredToId} to ${swap.offeredById}`,
                            new Date().toISOString()
                        ]
                    );
                }
                await client.query('UPDATE swaps SET status = $1, "lastUpdateDate" = $2 WHERE id = $3', ['Completed', new Date().toISOString(), req.params.id]);
                await client.query('DELETE FROM swap_completion_confirms WHERE "swapId" = $1', [req.params.id]);
                await client.query('COMMIT');
                await logSwapAudit(req.params.id, Number(currentUserId), 'COMPLETED', 'Swap ownership transfer completed');
                return res.json({ success: true });
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Completion failed:', err);
                return res.status(500).send('Failed to complete swap');
            } finally {
                client.release();
            }
        }

        // Default: update status and then handle book/chat updates
        const upd = await pool.query('UPDATE swaps SET status = $1, "lastUpdateDate" = $2 WHERE id = $3 RETURNING *', [status, new Date().toISOString(), req.params.id]);
        if (!(upd.rowCount && upd.rowCount > 0)) return res.status(404).send('Swap not found');
        const updatedSwap = upd.rows[0];
        await logSwapAudit(req.params.id, Number(currentUserId), `STATUS_${status.toUpperCase()}`, `status changed to ${status}`);

        if (status === 'Accepted') {
            const affectedBookIds: string[] = [...getRequestedBookIds(updatedSwap), ...((updatedSwap.offeredBookIds || []) as string[])].filter(Boolean);
            for (const bookId of affectedBookIds) {
                await pool.query("UPDATE books SET status = 'Reserved' WHERE id = $1", [bookId]);
            }

            // reject competing pending offers involving same reserved books
            const competingRes = await pool.query(
                `SELECT id, "offeredById", "offeredToId", "requestedBookId", "requestedBookIds"
                 FROM swaps
                 WHERE id <> $1
                   AND status = 'Pending'
                  AND ("requestedBookId" = ANY($2) OR "offeredBookIds" ?| $2 OR "requestedBookIds" ?| $2)`,
                [updatedSwap.id, affectedBookIds]
            );
            if (competingRes.rows.length > 0) {
                await pool.query(
                    `UPDATE swaps
                     SET status = 'Rejected', "lastUpdateDate" = $2
                     WHERE id = ANY($1)`,
                    [competingRes.rows.map((r) => r.id), new Date().toISOString()]
                );
                for (const c of competingRes.rows) {
                    await logSwapAudit(c.id, Number(currentUserId), 'AUTO_REJECTED', `Rejected because related book was accepted in swap ${updatedSwap.id}`);
                    const msg = isTr
                        ? 'Teklif, ilgili kitap başka bir teklifte kabul edildiği için otomatik reddedildi.'
                        : 'Offer was automatically rejected because this book was accepted in another offer.';
                    const messageBookId = getRequestedBookIds(c)[0] || c.requestedBookId || null;
                    await sendSystemSwapMessage(String(c.offeredById), String(c.offeredToId), messageBookId, Number(currentUserId), msg);
                }
            }

            const primaryRequestedBookId = getRequestedBookIds(updatedSwap)[0] || updatedSwap.requestedBookId;
            const bookRes = await pool.query('SELECT title FROM books WHERE id = $1', [primaryRequestedBookId]);
            const bookTitle = getRequestedBookIds(updatedSwap).length > 1
                ? `${(bookRes.rows[0] && bookRes.rows[0].title) || 'the selected books'} (+${getRequestedBookIds(updatedSwap).length - 1} more)`
                : ((bookRes.rows[0] && bookRes.rows[0].title) || 'the book');
            const autoMsg = isTr ? `Merhaba! "${bookTitle}" için teklifi kabul ettim.` : `Hello! I accepted the offer for "${bookTitle}".`;
            await sendSystemSwapMessage(String(updatedSwap.offeredToId), String(updatedSwap.offeredById), primaryRequestedBookId || null, Number(currentUserId), autoMsg);
        } else if (status === 'Rejected' || status === 'Cancelled') {
            await pool.query('DELETE FROM swap_completion_confirms WHERE "swapId" = $1', [req.params.id]);
            for (const requestedBookId of getRequestedBookIds(updatedSwap)) {
                await pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND status = 'Reserved'", [requestedBookId]);
            }
            if (updatedSwap.offeredBookIds && Array.isArray(updatedSwap.offeredBookIds)) {
                for (const bookId of updatedSwap.offeredBookIds) {
                    await pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND status = 'Reserved'", [bookId]);
                }
            }
        }

        return res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).send('Swap update error'); }
});

app.get('/api/users/:id/trust-score', authenticateToken, async (req, res) => {
    const targetUserId = toPositiveInt(req.params.id);
    if (!targetUserId) return res.status(400).send('Invalid user id');
    try {
        const reviewRes = await pool.query('SELECT AVG(rating) as avg, COUNT(*)::int as count FROM reviews WHERE "targetUserId" = $1', [targetUserId]);
        const swapRes = await pool.query('SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = \'Completed\')::int as completed FROM swaps WHERE "offeredById" = $1 OR "offeredToId" = $1', [targetUserId]);
        const reportRes = await pool.query('SELECT COUNT(*)::int as count FROM reports WHERE "reportedUserId" = $1', [targetUserId]);

        const avgRating = Number(reviewRes.rows[0]?.avg || 0);
        const reviewCount = Number(reviewRes.rows[0]?.count || 0);
        const totalSwaps = Number(swapRes.rows[0]?.total || 0);
        const completedSwaps = Number(swapRes.rows[0]?.completed || 0);
        const reportsCount = Number(reportRes.rows[0]?.count || 0);

        const ratingScore = Math.min((avgRating / 5) * 50, 50);
        const completionRate = totalSwaps ? completedSwaps / totalSwaps : 0;
        const completionScore = completionRate * 35;
        const reportPenalty = Math.min(reportsCount * 3, 25);
        const confidenceBonus = Math.min(reviewCount, 10) * 0.5;
        const score = Math.max(0, Math.min(100, Math.round(ratingScore + completionScore + confidenceBonus - reportPenalty)));

        res.json({
            score,
            breakdown: { avgRating, reviewCount, totalSwaps, completedSwaps, reportsCount, completionRate }
        });
    } catch (e) { res.status(500).send('Failed to calculate trust score'); }
});

app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    const userId = parseInt((req as any).user.id);
    try {
        const [booksRes, favoritesRes, swapsRes, chatsRes, userRes] = await Promise.all([
            pool.query('SELECT COUNT(*)::int as count FROM books WHERE "ownerId" = $1', [userId]),
            pool.query('SELECT COUNT(*)::int as count FROM favorites WHERE "userId" = $1', [userId]),
            pool.query('SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = \'Completed\')::int as completed, COUNT(*) FILTER (WHERE status = \'Pending\')::int as pending FROM swaps WHERE "offeredById" = $1 OR "offeredToId" = $1', [userId]),
            pool.query('SELECT COUNT(*)::int as count FROM chats WHERE "participantIds" @> $1', [JSON.stringify([userId.toString()])]),
            pool.query('SELECT role FROM users WHERE id = $1', [userId])
        ]);

        const role = userRes.rows[0]?.role || 'user';
        const payload: any = {
            myBooks: booksRes.rows[0].count,
            myFavorites: favoritesRes.rows[0].count,
            mySwaps: swapsRes.rows[0],
            myChats: chatsRes.rows[0].count
        };

        if (['super_admin', 'admin', 'moderator'].includes(role)) {
            const [usersCount, booksCount, reportsCount, swapsCount] = await Promise.all([
                pool.query('SELECT COUNT(*)::int as count FROM users'),
                pool.query('SELECT COUNT(*)::int as count FROM books'),
                pool.query('SELECT COUNT(*)::int as count FROM reports'),
                pool.query('SELECT COUNT(*)::int as count FROM swaps')
            ]);
            payload.admin = {
                users: usersCount.rows[0].count,
                books: booksCount.rows[0].count,
                reports: reportsCount.rows[0].count,
                swaps: swapsCount.rows[0].count
            };
        }
        res.json(payload);
    } catch (e) { res.status(500).send('Failed to load dashboard analytics'); }
});

app.post('/api/demo/reset', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE book_ownership_history, book_inventory_events, swap_counters, chat_pins, favorites, reports, blocks, reviews, messages, chats, swaps, books RESTART IDENTITY CASCADE');
        await pool.query(`
            DELETE FROM reviews
            WHERE "reviewerId" IN (SELECT id FROM users WHERE role <> 'user')
               OR "targetUserId" IN (SELECT id FROM users WHERE role <> 'user')
        `);
        await pool.query(`DELETE FROM books WHERE "ownerId" IN (SELECT id FROM users WHERE role <> 'user')`);
        res.json({ success: true, message: 'Demo data reset complete' });
    } catch (e) { res.status(500).send('Demo reset failed'); }
});

app.post('/api/demo/prune-test-users', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM users
             WHERE username LIKE 'live_%'
                OR username LIKE 'deep_%'
                OR username LIKE 'feat_%'
                OR username LIKE 'demo_%'`
        );
        res.json({ success: true, deletedUsers: result.rowCount || 0 });
    } catch (e) { res.status(500).send('Failed to prune test users'); }
});

app.post('/api/demo/seed', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const now = new Date().toISOString();
        await pool.query(`
            DELETE FROM reviews
            WHERE "reviewerId" IN (SELECT id FROM users WHERE role <> 'user')
               OR "targetUserId" IN (SELECT id FROM users WHERE role <> 'user')
        `);
        await pool.query(`DELETE FROM books WHERE "ownerId" IN (SELECT id FROM users WHERE role <> 'user')`);
        const requiredUsers = ['jsmith', 'sarah', 'mike', 'emily', 'alex'];
        const aliases: Record<string, string[]> = {
            jsmith: ['jsmith'],
            sarah: ['sarah_w', 'sarah'],
            mike: ['mike_bio', 'mike'],
            emily: ['emily_arts', 'emily'],
            alex: ['alex_eng', 'alex']
        };
        const defaultProfiles: Record<string, { firstName: string; lastName: string; email: string; username: string }> = {
            jsmith: { firstName: 'John', lastName: 'Smith', email: 'jsmith@campus.local', username: 'jsmith' },
            sarah: { firstName: 'Sarah', lastName: 'Khan', email: 'sarah@campus.local', username: 'sarah_w' },
            mike: { firstName: 'Mike', lastName: 'Rahman', email: 'mike@campus.local', username: 'mike_bio' },
            emily: { firstName: 'Emily', lastName: 'Stone', email: 'emily@campus.local', username: 'emily_arts' },
            alex: { firstName: 'Alex', lastName: 'Kim', email: 'alex@campus.local', username: 'alex_eng' }
        };

        const usersByUsername: Record<string, any> = {};
        for (const uname of requiredUsers) {
            const candidates = aliases[uname] || [uname];
            const existing = await pool.query('SELECT id, username FROM users WHERE username = ANY($1) ORDER BY id ASC LIMIT 1', [candidates]);
            if (existing.rows.length > 0) {
                usersByUsername[uname] = existing.rows[0];
                continue;
            }
            const p = defaultProfiles[uname];
            const hash = bcrypt.hashSync('pass1234', 10);
            const inserted = await pool.query(
                'INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, "avatarUrl") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, username',
                [p.username, hash, p.firstName, p.lastName, p.email, '000-0000', 'user', `https://ui-avatars.com/api/?name=${p.firstName}+${p.lastName}&background=0D8ABC&color=fff`]
            );
            usersByUsername[uname] = inserted.rows[0];
        }
        const u1 = usersByUsername['jsmith'];
        const u2 = usersByUsername['sarah'];
        const u3 = usersByUsername['mike'];
        const u4 = usersByUsername['emily'];
        const u5 = usersByUsername['alex']; // intentionally no listings

        const b1 = `demo_book_${Date.now()}_1`;
        const b2 = `demo_book_${Date.now()}_2`;
        const b3 = `demo_book_${Date.now()}_3`;
        const b4 = `demo_book_${Date.now()}_4`;
        const b5 = `demo_book_${Date.now()}_5`;
        const b6 = `demo_book_${Date.now()}_6`;
        const cover1 = 'https://picsum.photos/seed/demo-algorithms/480/640';
        const cover2 = 'https://picsum.photos/seed/demo-databases/480/640';
        const cover3 = 'https://picsum.photos/seed/demo-networks/480/640';
        const cover4 = 'https://picsum.photos/seed/demo-ai/480/640';
        const cover5 = 'https://picsum.photos/seed/demo-security/480/640';
        const cover6 = 'https://picsum.photos/seed/demo-cloud/480/640';

        // 4 users have listings; alex (u5) intentionally has no listings
        await pool.query(
            `INSERT INTO books (id, title, author, isbn, edition, course, department, condition, description, "imageUrl", "ownerId", price, "forSwap", "forSale", "listedDate", status)
             VALUES
             ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16),
             ($17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32),
             ($33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48),
             ($49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64),
             ($65,$66,$67,$68,$69,$70,$71,$72,$73,$74,$75,$76,$77,$78,$79,$80),
             ($81,$82,$83,$84,$85,$86,$87,$88,$89,$90,$91,$92,$93,$94,$95,$96)`,
            [
                b1, 'Data Structures', 'Weiss', '9780133000436', '2nd', 'CS201', 'Computer Engineering', 'Good', 'Listed by jsmith', cover1, u1.id, 16, true, false, now, 'Available',
                b2, 'Database Systems', 'Silberschatz', '9780078022159', '6th', 'CS305', 'Software Engineering', 'Like New', 'Listed by sarah', cover2, u2.id, 22, true, true, now, 'Available',
                b3, 'Computer Networks', 'Kurose', '9780133594140', '8th', 'CS307', 'Computer Engineering', 'Very Good', 'Listed by mike', cover3, u3.id, 20, true, false, now, 'Available',
                b4, 'Artificial Intelligence', 'Russell', '9780134610993', '4th', 'CS402', 'Software Engineering', 'Good', 'Listed by emily', cover4, u4.id, 26, true, true, now, 'Available',
                b5, 'Software Security', 'Bishop', '9780321536204', '1st', 'CS430', 'Software Engineering', 'Good', 'Extra listing by jsmith', cover5, u1.id, 18, true, false, now, 'Available',
                b6, 'Cloud Computing', 'Buyya', '9780128054437', '1st', 'CS450', 'Computer Engineering', 'Like New', 'Extra listing by sarah', cover6, u2.id, 24, true, true, now, 'Available'
            ]
        );

        // Accepted chat between Alice and Bob with multiple messages
        const chatIdAccepted = `chat_demo_${Date.now()}_${randomUUID()}_a`;
        await pool.query(
            'INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
            [chatIdAccepted, JSON.stringify([u1.id.toString(), u2.id.toString()]), b1, 'Can we meet tomorrow?', now, 1, '[]', u2.id, 'accepted', '{}']
        );
        await pool.query(
            `INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES
             ($1,$2,$3,$4,$5,$6,$7),
             ($8,$9,$10,$11,$12,$13,$14),
             ($15,$16,$17,$18,$19,$20,$21)`,
            [
                `msg_demo_${Date.now()}_${randomUUID()}_1`, chatIdAccepted, u1.id, 'Hi Bob, interested in your DB book.', now, true, 'text',
                `msg_demo_${Date.now()}_${randomUUID()}_2`, chatIdAccepted, u2.id, 'Sure, I can trade it for Algorithms.', now, true, 'text',
                `msg_demo_${Date.now()}_${randomUUID()}_3`, chatIdAccepted, u2.id, 'Can we meet tomorrow?', now, false, 'text'
            ]
        );

        // Pending request chat between mike and emily
        const chatIdPending = `chat_demo_${Date.now()}_${randomUUID()}_p`;
        await pool.query(
            'INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
            [chatIdPending, JSON.stringify([u3.id.toString(), u4.id.toString()]), b4, 'Hi, is this still available?', now, 1, '[]', u3.id, 'pending', '{}']
        );
        await pool.query(
            'INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [`msg_demo_${Date.now()}_${randomUUID()}_4`, chatIdPending, u3.id, 'Hi Emily, is this still available?', now, false, 'text']
        );

        // Seed swaps (active + historical completed)
        const swapPendingId = `swap_demo_${Date.now()}_${randomUUID()}_p`;
        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [swapPendingId, u3.id, u4.id, JSON.stringify([b3]), b4, 'Pending', 'Would you swap Networks for AI Basics?', now, now]
        );

        // Additional competing pending offers for the same requested book (b4 by emily)
        const swapPendingCompete1 = `swap_demo_${Date.now()}_${randomUUID()}_p2`;
        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [swapPendingCompete1, u1.id, u4.id, JSON.stringify([b1]), b4, 'Pending', 'Competing offer: Data Structures for AI', now, now]
        );
        const swapPendingCompete2 = `swap_demo_${Date.now()}_${randomUUID()}_p3`;
        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [swapPendingCompete2, u2.id, u4.id, JSON.stringify([b2]), b4, 'Pending', 'Competing offer: Database Systems for AI', now, now]
        );

        const swapAcceptedId = `swap_demo_${Date.now()}_${randomUUID()}_a`; // active accepted
        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [swapAcceptedId, u1.id, u2.id, JSON.stringify([b1]), b2, 'Accepted', 'Ready to exchange these two books', now, now]
        );
        await pool.query("UPDATE books SET status = 'Reserved' WHERE id = $1", [b1]);
        await pool.query("UPDATE books SET status = 'Reserved' WHERE id = $1", [b2]);

        // completed swap in past for trust score + history
        const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
        const past2 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString();
        const past3 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
        const swapCompleted1 = `swap_demo_${Date.now()}_${randomUUID()}_c1`;
        const swapCompleted2 = `swap_demo_${Date.now()}_${randomUUID()}_c2`;
        const swapCompleted3 = `swap_demo_${Date.now()}_${randomUUID()}_c3`;
        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [swapCompleted1, u1.id, u2.id, JSON.stringify([b5]), b6, 'Completed', 'Completed two weeks ago', past, past]
        );
        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [swapCompleted2, u2.id, u3.id, JSON.stringify([b6]), b3, 'Completed', 'Follow-up trade after first swap', past2, past2]
        );
        await pool.query(
            'INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [swapCompleted3, u3.id, u4.id, JSON.stringify([b3]), b4, 'Completed', 'Another historical completion', past3, past3]
        );

        // Pre-seed ownership chains so demo clearly shows books with multiple past owners
        await pool.query(
            `INSERT INTO book_ownership_history
            ("swapId","bookId",title,author,isbn,"imageUrl","fromUserId","toUserId","transferKind",note,"createdAt")
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11),
            ($12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22),
            ($23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33),
            ($34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44),
            ($45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55)`,
            [
                // b6 owner chain: sarah -> jsmith -> mike (multiple owners)
                swapCompleted1, b6, 'Cloud Computing', 'Buyya', '9780128054437', cover6, u2.id, u1.id, 'swap', 'Transferred from sarah to jsmith', past,
                swapCompleted2, b6, 'Cloud Computing', 'Buyya', '9780128054437', cover6, u1.id, u3.id, 'swap', 'Transferred from jsmith to mike', past2,
                // b5 and b3 historical transfers
                swapCompleted1, b5, 'Software Security', 'Bishop', '9780321536204', cover5, u1.id, u2.id, 'swap', 'Transferred from jsmith to sarah', past,
                swapCompleted2, b3, 'Computer Networks', 'Kurose', '9780133594140', cover3, u3.id, u2.id, 'swap', 'Transferred from mike to sarah', past2,
                swapCompleted3, b4, 'Artificial Intelligence', 'Russell', '9780134610993', cover4, u4.id, u3.id, 'swap', 'Transferred from emily to mike', past3
            ]
        );

        // Reviews for trust score
        await pool.query(
            `INSERT INTO reviews ("reviewerId", "targetUserId", rating, comment, "createdAt") VALUES
             ($1,$2,$3,$4,$5),
             ($6,$7,$8,$9,$10),
             ($11,$12,$13,$14,$15)`,
            [
                u2.id, u1.id, 5, 'Very reliable swap partner.', now,
                u1.id, u2.id, 4, 'Smooth communication and fair trade.', now,
                u4.id, u3.id, 5, 'Great swap experience in the past.', now
            ]
        );

        res.json({
            success: true,
            message: 'Demo content seeded',
            seeded: {
                books: [b1, b2, b3, b4, b5, b6],
                chats: [chatIdAccepted, chatIdPending],
                swaps: [swapPendingId, swapAcceptedId, swapCompleted1, swapCompleted2, swapCompleted3],
                competingOffersOnBook: b4,
                multiOwnerHistoryBooks: [b6, b5, b3, b4],
                usersWithListings: [u1.username, u2.username, u3.username, u4.username],
                userWithoutListings: u5.username
            }
        });
    } catch (e) { res.status(500).send('Demo seed failed'); }
});

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
