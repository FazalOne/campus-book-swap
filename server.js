"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var pg_1 = __importDefault(require("pg")); // Using standard pg library
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var Pool = pg_1.default.Pool;
var app = (0, express_1.default)();
var PORT = 3001;
var HOST = '0.0.0.0';
var SECRET_KEY = 'super_secret_graduation_key';
// --- DATABASE CONFIGURATION ---
var DB_CONFIG = {
    user: 'postgres',
    host: 'localhost',
    database: 'campusbookswap',
    password: 'admin',
    port: 5432,
};
var pool = new Pool(DB_CONFIG);
// Test Database Connection
pool.connect(function (err, client, release) {
    if (err) {
        console.error('Error acquiring client', err.stack);
        console.error('LÜTFEN server.ts DOSYASINDAKİ DB_CONFIG ŞİFRESİNİ KONTROL EDİN!');
    }
    else {
        console.log('Connected to PostgreSQL database successfully.');
        release();
    }
});
// STRICT CORS SETTINGS
app.use((0, cors_1.default)({ origin: '*' }));
// Request logging
app.use(function (req, res, next) {
    console.log("[".concat(new Date().toISOString(), "] ").concat(req.method, " ").concat(req.url));
    next();
});
// Payload limits
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// --- Database Schema Setup ---
var createTables = function () { return __awaiter(void 0, void 0, void 0, function () {
    var e_1, e_2, e_3, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 25, , 26]);
                // Users Table
                return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS users (\n        id SERIAL PRIMARY KEY,\n        username VARCHAR(255) UNIQUE NOT NULL,\n        password_hash TEXT NOT NULL,\n        first_name VARCHAR(100),\n        last_name VARCHAR(100),\n        email VARCHAR(255),\n        phone VARCHAR(50),\n        role VARCHAR(20) DEFAULT 'user',\n        \"avatarUrl\" TEXT\n      );\n    ")];
            case 1:
                // Users Table
                _a.sent();
                // Books Table
                return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS books (\n        id VARCHAR(255) PRIMARY KEY,\n        title TEXT NOT NULL,\n        author TEXT,\n        isbn VARCHAR(50),\n        edition VARCHAR(50),\n        course VARCHAR(100),\n        department VARCHAR(100),\n        condition VARCHAR(50),\n        description TEXT,\n        \"imageUrl\" TEXT,\n        \"ownerId\" INTEGER,\n        price REAL,\n        \"forSwap\" BOOLEAN DEFAULT TRUE,\n        \"forSale\" BOOLEAN DEFAULT FALSE,\n        \"listedDate\" TEXT,\n        status VARCHAR(20) DEFAULT 'Available',\n        FOREIGN KEY(\"ownerId\") REFERENCES users(id) ON DELETE CASCADE\n      );\n    ")];
            case 2:
                // Books Table
                _a.sent();
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, pool.query("ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Available'")];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                e_1 = _a.sent();
                console.log("Status column check/add ignored or failed (might already exist)");
                return [3 /*break*/, 6];
            case 6: 
            // Chats Table
            return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS chats (\n        id VARCHAR(255) PRIMARY KEY,\n        \"participantIds\" JSONB, \n        \"bookId\" VARCHAR(255),\n        \"lastMessageText\" TEXT,\n        \"lastMessageTimestamp\" TEXT,\n        \"unreadMessages\" INTEGER DEFAULT 0,\n        \"hiddenBy\" JSONB DEFAULT '[]',\n        \"lastSenderId\" INTEGER,\n        status VARCHAR(20) DEFAULT 'accepted',\n        \"clearedHistoryAt\" JSONB DEFAULT '{}'\n      );\n    ")];
            case 7:
                // Chats Table
                _a.sent();
                _a.label = 8;
            case 8:
                _a.trys.push([8, 11, , 12]);
                return [4 /*yield*/, pool.query("ALTER TABLE chats ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted'")];
            case 9:
                _a.sent();
                return [4 /*yield*/, pool.query("ALTER TABLE chats ADD COLUMN IF NOT EXISTS \"clearedHistoryAt\" JSONB DEFAULT '{}'")];
            case 10:
                _a.sent();
                return [3 /*break*/, 12];
            case 11:
                e_2 = _a.sent();
                console.log("Chat status/clearedHistoryAt column check/add ignored or failed (might already exist)");
                return [3 /*break*/, 12];
            case 12: 
            // Messages Table
            return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS messages (\n        id VARCHAR(255) PRIMARY KEY,\n        \"chatThreadId\" VARCHAR(255),\n        \"senderId\" INTEGER,\n        text TEXT,\n        timestamp TEXT,\n        \"isRead\" BOOLEAN DEFAULT FALSE,\n        \"type\" VARCHAR(20) DEFAULT 'text',\n        FOREIGN KEY(\"chatThreadId\") REFERENCES chats(id) ON DELETE CASCADE\n      );\n    ")];
            case 13:
                // Messages Table
                _a.sent();
                // Swaps Table
                return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS swaps (\n        id VARCHAR(255) PRIMARY KEY,\n        \"offeredById\" INTEGER,\n        \"offeredToId\" INTEGER,\n        \"offeredBookIds\" JSONB,\n        \"requestedBookId\" VARCHAR(255),\n        status VARCHAR(50),\n        message TEXT,\n        \"creationDate\" TEXT,\n        \"lastUpdateDate\" TEXT\n      );\n    ")];
            case 14:
                // Swaps Table
                _a.sent();
                // Reviews Table
                return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS reviews (\n        id SERIAL PRIMARY KEY,\n        \"reviewerId\" INTEGER,\n        \"targetUserId\" INTEGER,\n        rating INTEGER,\n        comment TEXT,\n        \"createdAt\" TEXT,\n        FOREIGN KEY(\"reviewerId\") REFERENCES users(id) ON DELETE CASCADE,\n        FOREIGN KEY(\"targetUserId\") REFERENCES users(id) ON DELETE CASCADE\n      );\n    ")];
            case 15:
                // Reviews Table
                _a.sent();
                // Engellenenler Tablosu (Blocks)
                return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS blocks (\n        id SERIAL PRIMARY KEY,\n        \"blockerId\" INTEGER REFERENCES users(id) ON DELETE CASCADE,\n        \"blockedId\" INTEGER REFERENCES users(id) ON DELETE CASCADE,\n        \"createdAt\" TEXT,\n        UNIQUE(\"blockerId\", \"blockedId\")\n      );\n    ")];
            case 16:
                // Engellenenler Tablosu (Blocks)
                _a.sent();
                // Raporlar Tablosu (Reports)
                return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS reports (\n        id SERIAL PRIMARY KEY,\n        \"reporterId\" INTEGER REFERENCES users(id) ON DELETE CASCADE,\n        \"reportedUserId\" INTEGER REFERENCES users(id) ON DELETE CASCADE,\n        reason TEXT,\n        \"chatId\" VARCHAR(255),\n        \"createdAt\" TEXT\n      );\n    ")];
            case 17:
                // Raporlar Tablosu (Reports)
                _a.sent();
                _a.label = 18;
            case 18:
                _a.trys.push([18, 21, , 22]);
                return [4 /*yield*/, pool.query("ALTER TABLE reports ADD COLUMN IF NOT EXISTS \"chatId\" VARCHAR(255)")];
            case 19:
                _a.sent();
                return [4 /*yield*/, pool.query("ALTER TABLE reports ADD COLUMN IF NOT EXISTS \"createdAt\" TEXT")];
            case 20:
                _a.sent();
                return [3 /*break*/, 22];
            case 21:
                e_3 = _a.sent();
                console.log("Reports schema update check ignored");
                return [3 /*break*/, 22];
            case 22: 
            // Favoriler Tablosu (Favorites / Wishlist)
            return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS favorites (\n        id SERIAL PRIMARY KEY,\n        \"userId\" INTEGER REFERENCES users(id) ON DELETE CASCADE,\n        \"bookId\" VARCHAR(255) REFERENCES books(id) ON DELETE CASCADE,\n        \"createdAt\" TEXT,\n        UNIQUE(\"userId\", \"bookId\")\n      );\n    ")];
            case 23:
                // Favoriler Tablosu (Favorites / Wishlist)
                _a.sent();
                // İletişim Mesajları Tablosu (Contact Messages)
                return [4 /*yield*/, pool.query("\n      CREATE TABLE IF NOT EXISTS contact_messages (\n        id SERIAL PRIMARY KEY,\n        name TEXT,\n        email TEXT,\n        subject TEXT,\n        message TEXT,\n        \"createdAt\" TEXT\n      );\n    ")];
            case 24:
                // İletişim Mesajları Tablosu (Contact Messages)
                _a.sent();
                console.log("Database tables checked/created.");
                seedIfEmpty();
                return [3 /*break*/, 26];
            case 25:
                err_1 = _a.sent();
                console.error("Error creating tables:", err_1);
                return [3 /*break*/, 26];
            case 26: return [2 /*return*/];
        }
    });
}); };
var seedIfEmpty = function () { return __awaiter(void 0, void 0, void 0, function () {
    var adminCheck, adminHash, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE username = $1', ['admin'])];
            case 1:
                adminCheck = _a.sent();
                if (!(adminCheck.rows.length === 0)) return [3 /*break*/, 3];
                console.log('Creating Super Admin user...');
                adminHash = bcryptjs_1.default.hashSync('admin', 10);
                return [4 /*yield*/, pool.query('INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, "avatarUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', ['admin', adminHash, 'System', 'Admin', 'admin@campusbookswap.com', '555-0000', 'super_admin', 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff'])];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                e_4 = _a.sent();
                console.error("Seeding failed:", e_4);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
createTables();
var authenticateToken = function (req, res, next) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, SECRET_KEY, function (err, user) {
        if (err)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
};
var getUserIdFromRequest = function (req) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return null;
    try {
        var decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        return decoded.id;
    }
    catch (e) {
        return null;
    }
};
var checkRole = function (allowedRoles) {
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var userRes, userRole;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, pool.query('SELECT role FROM users WHERE id = $1', [req.user.id])];
                case 1:
                    userRes = _b.sent();
                    userRole = (_a = userRes.rows[0]) === null || _a === void 0 ? void 0 : _a.role;
                    if (allowedRoles.includes(userRole)) {
                        next();
                    }
                    else {
                        res.status(403).send("Access denied. Insufficient permissions.");
                    }
                    return [2 /*return*/];
            }
        });
    }); };
};
app.get('/', function (req, res) { res.send('Backend API is running on PostgreSQL.'); });
// Auth & User
app.get('/api/auth/me', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, u, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])];
            case 1:
                result = _a.sent();
                if (result.rows.length > 0) {
                    u = result.rows[0];
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
                }
                else {
                    res.status(404).send("User not found");
                }
                return [3 /*break*/, 3];
            case 2:
                e_5 = _a.sent();
                res.status(500).send("Server Error");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/users/:id/public', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, u, ratingRes, averageRating, e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, pool.query('SELECT id, username, first_name as "firstName", last_name as "lastName", role, "avatarUrl" FROM users WHERE id = $1', [req.params.id])];
            case 1:
                result = _a.sent();
                if (!(result.rows.length > 0)) return [3 /*break*/, 3];
                u = result.rows[0];
                return [4 /*yield*/, pool.query('SELECT AVG(rating) as average FROM reviews WHERE "targetUserId" = $1', [req.params.id])];
            case 2:
                ratingRes = _a.sent();
                averageRating = ratingRes.rows[0].average ? parseFloat(ratingRes.rows[0].average).toFixed(1) : null;
                res.json({
                    id: u.id.toString(),
                    username: u.username,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    role: u.role,
                    avatarUrl: u.avatarUrl,
                    averageRating: averageRating ? parseFloat(averageRating) : 0
                });
                return [3 /*break*/, 4];
            case 3:
                res.status(404).send("User not found");
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                e_6 = _a.sent();
                res.status(500).send("Server Error");
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Reviews
app.get('/api/users/:id/reviews', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, reviews, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query("\n            SELECT r.*, u.username as \"reviewerUsername\", u.\"avatarUrl\" as \"reviewerAvatarUrl\"\n            FROM reviews r\n            JOIN users u ON r.\"reviewerId\" = u.id\n            WHERE r.\"targetUserId\" = $1\n            ORDER BY r.\"createdAt\" DESC\n        ", [req.params.id])];
            case 1:
                result = _a.sent();
                reviews = result.rows.map(function (r) { return (__assign(__assign({}, r), { reviewerId: r.reviewerId.toString(), targetUserId: r.targetUserId.toString() })); });
                res.json(reviews);
                return [3 /*break*/, 3];
            case 2:
                e_7 = _a.sent();
                res.status(500).send("Failed to fetch reviews");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/reviews', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, targetUserId, rating, comment, reviewerId, e_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, targetUserId = _a.targetUserId, rating = _a.rating, comment = _a.comment;
                reviewerId = req.user.id;
                if (!targetUserId || !rating)
                    return [2 /*return*/, res.status(400).send("Missing required fields")];
                if (parseInt(targetUserId) === parseInt(reviewerId))
                    return [2 /*return*/, res.status(400).send("Cannot review yourself")];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('INSERT INTO reviews ("reviewerId", "targetUserId", rating, comment, "createdAt") VALUES ($1, $2, $3, $4, $5)', [reviewerId, targetUserId, rating, comment, new Date().toISOString()])];
            case 2:
                _b.sent();
                res.json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                e_8 = _b.sent();
                res.status(500).send("Failed to post review");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get blocked users list for current user
app.get('/api/users/blocks', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, blockedIds, e_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('SELECT "blockedId" FROM blocks WHERE "blockerId" = $1', [userId])];
            case 2:
                result = _a.sent();
                blockedIds = result.rows.map(function (r) { return r.blockedId.toString(); });
                res.json(blockedIds);
                return [3 /*break*/, 4];
            case 3:
                e_9 = _a.sent();
                res.status(500).send("Failed to fetch blocks");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Block User
app.post('/api/users/:id/block', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var blockedId, blockerId, e_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                blockedId = parseInt(req.params.id);
                blockerId = parseInt(req.user.id);
                if (blockedId === blockerId)
                    return [2 /*return*/, res.status(400).send("Kendini engelleyemezsin.")];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('INSERT INTO blocks ("blockerId", "blockedId", "createdAt") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [blockerId, blockedId, new Date().toISOString()])];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                e_10 = _a.sent();
                console.error(e_10);
                res.status(500).send("Engelleme başarısız.");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Unblock User
app.delete('/api/users/:id/block', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var blockedId, blockerId, e_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                blockedId = parseInt(req.params.id);
                blockerId = parseInt(req.user.id);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('DELETE FROM blocks WHERE "blockerId" = $1 AND "blockedId" = $2', [blockerId, blockedId])];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                e_11 = _a.sent();
                console.error(e_11);
                res.status(500).send("Engel kaldırma başarısız.");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Report User
app.post('/api/reports', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, reportedUserId, reason, chatId, reporterId, reportedIdInt, e_12;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, reportedUserId = _a.reportedUserId, reason = _a.reason, chatId = _a.chatId;
                reporterId = parseInt(req.user.id);
                reportedIdInt = parseInt(reportedUserId);
                if (!reportedIdInt || isNaN(reportedIdInt)) {
                    return [2 /*return*/, res.status(400).send("Invalid user ID")];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('INSERT INTO reports ("reporterId", "reportedUserId", reason, "chatId", "createdAt") VALUES ($1, $2, $3, $4, $5)', [reporterId, reportedIdInt, reason, chatId || null, new Date().toISOString()])];
            case 2:
                _b.sent();
                res.json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                e_12 = _b.sent();
                console.error(e_12);
                res.status(500).send("Rapor gönderme başarısız: " + e_12.message);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Public Contact Form
app.put('/api/swaps/:id/status', authenticateToken, async function (req, res) {
    const { status, language } = req.body;
    const currentUserId = req.user.id;
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
            let existingChat = allChats.rows.find(function (c) { return c.participantIds.includes(otherUserId.toString()); });
            let chatId = '';
            if (existingChat) {
                chatId = existingChat.id;
                await pool.query('UPDATE chats SET "hiddenBy" = $1, status = $2 WHERE id = $3', ['[]', 'accepted', chatId]);
            } else {
                chatId = "chat_" + Date.now();
                await pool.query('INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [chatId, JSON.stringify([currentUserId.toString(), otherUserId.toString()]), updatedSwap.requestedBookId, isTr ? "Sohbet başlatıldı" : "Chat started", new Date().toISOString(), 0, '[]', currentUserId, 'accepted', '{}']);
            }

            const autoMsg = isTr ? "Merhaba! \"" + bookTitle + "\" için takas teklifini kabul ettim." : "Hello! I have accepted the swap offer for \"" + bookTitle + "\".";
            const timestamp = new Date().toISOString();
            await pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', ["msg_" + Date.now() + "_auto", chatId, currentUserId, autoMsg, timestamp, false, 'text']);
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
    } catch (e) {
        console.error(e);
        res.status(500).send('Swap update error');
    }
});
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE username = $1', [username])];
            case 2:
                result = _b.sent();
                user = result.rows[0];
                if (user && bcryptjs_1.default.compareSync(password, user.password_hash)) {
                    token = jsonwebtoken_1.default.sign({ id: user.id.toString(), username: user.username }, SECRET_KEY);
                    res.json({ user: { id: user.id.toString(), username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl }, token: token });
                }
                else {
                    res.status(401).send('Invalid credentials');
                }
                return [3 /*break*/, 4];
            case 3:
                err_3 = _b.sent();
                console.error("Login Error:", err_3);
                res.status(500).send("Login failed");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Admin Reports Routes
app.get('/api/admin/reports', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, reports, e_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query("\n            SELECT r.*, u1.username as \"reporterUsername\", u2.username as \"reportedUsername\"\n            FROM reports r\n            JOIN users u1 ON r.\"reporterId\" = u1.id\n            JOIN users u2 ON r.\"reportedUserId\" = u2.id\n            ORDER BY r.\"createdAt\" DESC\n        ")];
            case 1:
                result = _a.sent();
                reports = result.rows.map(function (r) { return (__assign(__assign({}, r), { reporterId: r.reporterId.toString(), reportedUserId: r.reportedUserId.toString() })); });
                res.json(reports);
                return [3 /*break*/, 3];
            case 2:
                e_16 = _a.sent();
                console.error(e_16);
                res.status(500).send("Failed to fetch reports");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/admin/reports/:id', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var e_17;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query('DELETE FROM reports WHERE id = $1', [req.params.id])];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                e_17 = _a.sent();
                res.status(500).send("Failed to delete report");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/admin/users', authenticateToken, checkRole(['super_admin', 'admin', 'moderator']), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, users, e_18;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query('SELECT id, username, first_name as "firstName", last_name as "lastName", email, phone, role, "avatarUrl" FROM users ORDER BY id ASC')];
            case 1:
                result = _a.sent();
                users = result.rows.map(function (u) { return (__assign(__assign({}, u), { id: u.id.toString() })); });
                res.json(users);
                return [3 /*break*/, 3];
            case 2:
                e_18 = _a.sent();
                res.status(500).send("Failed to fetch users");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/admin/users/:id', authenticateToken, checkRole(['super_admin', 'admin']), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var targetUserId, requesterId, requesterRes, targetRes, requesterRole, targetRole, client, e_19, e_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                targetUserId = parseInt(req.params.id);
                requesterId = req.user.id;
                if (isNaN(targetUserId))
                    return [2 /*return*/, res.status(400).send("Invalid ID")];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 16, , 17]);
                return [4 /*yield*/, pool.query('SELECT role FROM users WHERE id = $1', [requesterId])];
            case 2:
                requesterRes = _a.sent();
                return [4 /*yield*/, pool.query('SELECT role FROM users WHERE id = $1', [targetUserId])];
            case 3:
                targetRes = _a.sent();
                if (targetRes.rows.length === 0)
                    return [2 /*return*/, res.status(404).send("User not found")];
                requesterRole = requesterRes.rows[0].role;
                targetRole = targetRes.rows[0].role;
                if (targetRole === 'super_admin')
                    return [2 /*return*/, res.status(403).send("Cannot delete Super Admin.")];
                if (requesterRole === 'admin' && (targetRole === 'admin' || targetRole === 'super_admin'))
                    return [2 /*return*/, res.status(403).send("Admins cannot delete other Admins.")];
                return [4 /*yield*/, pool.connect()];
            case 4:
                client = _a.sent();
                _a.label = 5;
            case 5:
                _a.trys.push([5, 12, 14, 15]);
                return [4 /*yield*/, client.query('BEGIN')];
            case 6:
                _a.sent();
                return [4 /*yield*/, client.query('DELETE FROM reviews WHERE "reviewerId" = $1 OR "targetUserId" = $1', [targetUserId])];
            case 7:
                _a.sent();
                return [4 /*yield*/, client.query('DELETE FROM swaps WHERE "offeredById" = $1 OR "offeredToId" = $1', [targetUserId])];
            case 8:
                _a.sent();
                return [4 /*yield*/, client.query('DELETE FROM chats WHERE "participantIds" @> $1', [JSON.stringify([targetUserId.toString()])])];
            case 9:
                _a.sent();
                return [4 /*yield*/, client.query('DELETE FROM users WHERE id = $1', [targetUserId])];
            case 10:
                _a.sent();
                return [4 /*yield*/, client.query('COMMIT')];
            case 11:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 15];
            case 12:
                e_19 = _a.sent();
                return [4 /*yield*/, client.query('ROLLBACK')];
            case 13:
                _a.sent();
                throw e_19;
            case 14:
                client.release();
                return [7 /*endfinally*/];
            case 15: return [3 /*break*/, 17];
            case 16:
                e_20 = _a.sent();
                res.status(500).send("Failed to delete user");
                return [3 /*break*/, 17];
            case 17: return [2 /*return*/];
        }
    });
}); });
app.put('/api/users/:id', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, firstName, lastName, email, phone, role, newPassword, oldPassword, avatarUrl, targetUserId, requesterId, requesterRes, targetRes, requesterRole, targetUser, isSelf, isAdmin, hashedPassword, isValid, query, params, idx, newAvatarUrl, result, updatedUser, e_21;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, firstName = _a.firstName, lastName = _a.lastName, email = _a.email, phone = _a.phone, role = _a.role, newPassword = _a.newPassword, oldPassword = _a.oldPassword, avatarUrl = _a.avatarUrl;
                targetUserId = parseInt(req.params.id);
                requesterId = parseInt(req.user.id);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, pool.query('SELECT role FROM users WHERE id = $1', [requesterId])];
            case 2:
                requesterRes = _b.sent();
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE id = $1', [targetUserId])];
            case 3:
                targetRes = _b.sent();
                if (targetRes.rows.length === 0)
                    return [2 /*return*/, res.status(404).send("User not found")];
                requesterRole = requesterRes.rows[0].role;
                targetUser = targetRes.rows[0];
                isSelf = requesterId === targetUserId;
                isAdmin = ['super_admin', 'admin', 'moderator'].includes(requesterRole);
                if (!isSelf && !isAdmin)
                    return [2 /*return*/, res.status(403).send("Access denied.")];
                hashedPassword = null;
                if (newPassword && newPassword.trim() !== "") {
                    if (isSelf) {
                        if (!oldPassword)
                            return [2 /*return*/, res.status(400).send("Old password required.")];
                        isValid = bcryptjs_1.default.compareSync(oldPassword, targetUser.password_hash);
                        if (!isValid)
                            return [2 /*return*/, res.status(401).send("Incorrect old password.")];
                    }
                    hashedPassword = bcryptjs_1.default.hashSync(newPassword, 10);
                }
                query = 'UPDATE users SET username=$1, first_name=$2, last_name=$3, email=$4, phone=$5';
                params = [username, firstName, lastName, email, phone];
                idx = 6;
                if (role && requesterRole === 'super_admin') {
                    query += ", role=$".concat(idx);
                    params.push(role);
                    idx++;
                }
                if (hashedPassword) {
                    query += ", password_hash=$".concat(idx);
                    params.push(hashedPassword);
                    idx++;
                }
                if (avatarUrl) {
                    query += ", \"avatarUrl\"=$".concat(idx);
                    params.push(avatarUrl);
                    idx++;
                }
                else if (targetUser.avatarUrl.includes("ui-avatars.com")) {
                    newAvatarUrl = "https://ui-avatars.com/api/?name=".concat(firstName, "+").concat(lastName, "&background=random");
                    query += ", \"avatarUrl\"=$".concat(idx);
                    params.push(newAvatarUrl);
                    idx++;
                }
                query += " WHERE id=$".concat(idx);
                params.push(targetUserId);
                return [4 /*yield*/, pool.query(query + ' RETURNING *', params)];
            case 4:
                result = _b.sent();
                updatedUser = result.rows[0];
                res.json({ success: true, user: { id: updatedUser.id.toString(), username: updatedUser.username, firstName: updatedUser.first_name, lastName: updatedUser.last_name, email: updatedUser.email, phone: updatedUser.phone, role: updatedUser.role, avatarUrl: updatedUser.avatarUrl } });
                return [3 /*break*/, 6];
            case 5:
                e_21 = _b.sent();
                res.status(500).send("Failed to update user");
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Books
app.get('/api/books', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var currentUserId, query, params, result, books, e_22;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                currentUserId = getUserIdFromRequest(req);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                query = "\n            SELECT b.*, u.username as \"ownerUsername\",\n            (SELECT COUNT(*)::int FROM favorites f WHERE f.\"bookId\" = b.id) as \"favoriteCount\"\n        ";
                params = [];
                if (currentUserId) {
                    query += ", (SELECT EXISTS(SELECT 1 FROM favorites f WHERE f.\"bookId\" = b.id AND f.\"userId\" = $1)) as \"isFavorited\"";
                    params.push(currentUserId);
                }
                else {
                    query += ", false as \"isFavorited\"";
                }
                query += " FROM books b LEFT JOIN users u ON b.\"ownerId\" = u.id ORDER BY b.\"listedDate\" DESC";
                return [4 /*yield*/, pool.query(query, params)];
            case 2:
                result = _a.sent();
                books = result.rows.map(function (b) { return (__assign(__assign({}, b), { ownerId: b.ownerId ? b.ownerId.toString() : null, isFavorited: !!b.isFavorited // ensure boolean
                 })); });
                res.json(books);
                return [3 /*break*/, 4];
            case 3:
                e_22 = _a.sent();
                console.error(e_22);
                res.status(500).send("DB Error");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get('/api/books/:id', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var currentUserId, result, b, e_23;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                currentUserId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query("\n            SELECT b.*, u.username as \"ownerUsername\",\n            (SELECT COUNT(*)::int FROM favorites f WHERE f.\"bookId\" = b.id) as \"favoriteCount\",\n            (SELECT EXISTS(SELECT 1 FROM favorites f WHERE f.\"bookId\" = b.id AND f.\"userId\" = $2)) as \"isFavorited\"\n            FROM books b \n            LEFT JOIN users u ON b.\"ownerId\" = u.id \n            WHERE b.id = $1\n        ", [req.params.id, currentUserId])];
            case 2:
                result = _a.sent();
                if (result.rows.length > 0) {
                    b = result.rows[0];
                    res.json(__assign(__assign({}, b), { ownerId: b.ownerId ? b.ownerId.toString() : null, isFavorited: !!b.isFavorited }));
                }
                else {
                    res.status(404).send("Book not found");
                }
                return [3 /*break*/, 4];
            case 3:
                e_23 = _a.sent();
                res.status(500).send("DB Error");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post('/api/books', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var book, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                book = req.body;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query("INSERT INTO books (id, title, author, isbn, edition, course, department, condition, description, \"imageUrl\", \"ownerId\", price, \"forSwap\", \"forSale\", \"listedDate\", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)", [book.id, book.title, book.author, book.isbn, book.edition, book.course, book.department, book.condition, book.description, book.imageUrl, req.user.id, book.price, !!book.forSwap, !!book.forSale, book.listedDate, 'Available'])];
            case 2:
                _a.sent();
                res.json(book);
                return [3 /*break*/, 4];
            case 3:
                err_4 = _a.sent();
                res.status(500).send("Failed to add book");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.put('/api/books/:id', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var book, e_24;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                book = req.body;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query("UPDATE books SET title=$1, author=$2, isbn=$3, edition=$4, course=$5, department=$6, condition=$7, description=$8, \"imageUrl\"=$9, price=$10, \"forSwap\"=$11, \"forSale\"=$12, status=$14 WHERE id=$13", [book.title, book.author, book.isbn, book.edition, book.course, book.department, book.condition, book.description, book.imageUrl, book.price, !!book.forSwap, !!book.forSale, req.params.id, book.status || 'Available'])];
            case 2:
                _a.sent();
                res.json(book);
                return [3 /*break*/, 4];
            case 3:
                e_24 = _a.sent();
                res.status(500).send("Server Error");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/books/:id', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, e_25;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query('DELETE FROM books WHERE id = $1', [req.params.id])];
            case 1:
                result = _a.sent();
                if (result.rowCount && result.rowCount > 0)
                    res.json({ success: true });
                else
                    res.status(404).send("Book not found");
                return [3 /*break*/, 3];
            case 2:
                e_25 = _a.sent();
                res.status(500).send("Server error");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Favorites Toggle
app.post('/api/books/:id/favorite', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var bookId, userId, check, e_26;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                bookId = req.params.id;
                userId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                return [4 /*yield*/, pool.query('SELECT * FROM favorites WHERE "userId" = $1 AND "bookId" = $2', [userId, bookId])];
            case 2:
                check = _a.sent();
                if (!(check.rows.length > 0)) return [3 /*break*/, 4];
                // Remove
                return [4 /*yield*/, pool.query('DELETE FROM favorites WHERE "userId" = $1 AND "bookId" = $2', [userId, bookId])];
            case 3:
                // Remove
                _a.sent();
                res.json({ isFavorited: false });
                return [3 /*break*/, 6];
            case 4: 
            // Add
            return [4 /*yield*/, pool.query('INSERT INTO favorites ("userId", "bookId", "createdAt") VALUES ($1, $2, $3)', [userId, bookId, new Date().toISOString()])];
            case 5:
                // Add
                _a.sent();
                res.json({ isFavorited: true });
                _a.label = 6;
            case 6: return [3 /*break*/, 8];
            case 7:
                e_26 = _a.sent();
                console.error(e_26);
                res.status(500).send("Favorite toggle failed");
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// Chats
app.get('/api/chats', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userIdStr_1, result, visibleChats, uniqueChatsMap, _i, visibleChats_1, chat, pIds, otherId, existing, formattedChats, e_27;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                userIdStr_1 = userId.toString();
                return [4 /*yield*/, pool.query('SELECT * FROM chats WHERE "participantIds" @> $1', [JSON.stringify([userIdStr_1])])];
            case 2:
                result = _a.sent();
                visibleChats = result.rows.filter(function (chat) {
                    var hiddenList = chat.hiddenBy || [];
                    if (hiddenList.includes(userIdStr_1))
                        return false;
                    return true;
                });
                uniqueChatsMap = new Map();
                for (_i = 0, visibleChats_1 = visibleChats; _i < visibleChats_1.length; _i++) {
                    chat = visibleChats_1[_i];
                    pIds = chat.participantIds;
                    otherId = pIds.find(function (id) { return id !== userIdStr_1; }) || userIdStr_1;
                    if (uniqueChatsMap.has(otherId)) {
                        existing = uniqueChatsMap.get(otherId);
                        if (new Date(chat.lastMessageTimestamp).getTime() > new Date(existing.lastMessageTimestamp).getTime())
                            uniqueChatsMap.set(otherId, chat);
                    }
                    else {
                        uniqueChatsMap.set(otherId, chat);
                    }
                }
                return [4 /*yield*/, Promise.all(Array.from(uniqueChatsMap.values()).map(function (chat) { return __awaiter(void 0, void 0, void 0, function () {
                        var pIds, usernames, _i, pIds_1, pid, uRes;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    pIds = chat.participantIds;
                                    usernames = {};
                                    _i = 0, pIds_1 = pIds;
                                    _a.label = 1;
                                case 1:
                                    if (!(_i < pIds_1.length)) return [3 /*break*/, 4];
                                    pid = pIds_1[_i];
                                    return [4 /*yield*/, pool.query('SELECT username FROM users WHERE id = $1', [parseInt(pid)])];
                                case 2:
                                    uRes = _a.sent();
                                    usernames[pid] = uRes.rows[0] ? uRes.rows[0].username : "Unknown";
                                    _a.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4: 
                                // Add default status if missing
                                return [2 /*return*/, __assign(__assign({}, chat), { participantIds: pIds, participantUsernames: usernames, lastSenderId: chat.lastSenderId ? chat.lastSenderId.toString() : null, status: chat.status || 'accepted' })];
                            }
                        });
                    }); }))];
            case 3:
                formattedChats = _a.sent();
                formattedChats.sort(function (a, b) { return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime(); });
                res.json(formattedChats);
                return [3 /*break*/, 5];
            case 4:
                e_27 = _a.sent();
                res.status(500).send("Chat fetch error");
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.post('/api/chats/:id/accept', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, chatRes, chat, e_28;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id.toString();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, pool.query('SELECT * FROM chats WHERE id = $1', [req.params.id])];
            case 2:
                chatRes = _a.sent();
                if (chatRes.rows.length === 0)
                    return [2 /*return*/, res.status(404).send("Chat not found")];
                chat = chatRes.rows[0];
                if (!chat.participantIds.includes(userId))
                    return [2 /*return*/, res.status(403).send("Not authorized")];
                return [4 /*yield*/, pool.query('UPDATE chats SET status = $1 WHERE id = $2', ['accepted', req.params.id])];
            case 3:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 5];
            case 4:
                e_28 = _a.sent();
                res.status(500).send("Failed to accept chat");
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.post('/api/chats/:id/hide', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, chatRes, chat, currentHidden, currentCleared, newHidden, newCleared, e_29;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.user.id.toString();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, pool.query('SELECT * FROM chats WHERE id = $1', [req.params.id])];
            case 2:
                chatRes = _b.sent();
                if (chatRes.rows.length === 0)
                    return [2 /*return*/, res.status(404).send("Chat not found")];
                chat = chatRes.rows[0];
                currentHidden = chat.hiddenBy || [];
                currentCleared = chat.clearedHistoryAt || {};
                if (!!currentHidden.includes(userId)) return [3 /*break*/, 4];
                newHidden = __spreadArray(__spreadArray([], currentHidden, true), [userId], false);
                newCleared = __assign(__assign({}, currentCleared), (_a = {}, _a[userId] = new Date().toISOString(), _a));
                return [4 /*yield*/, pool.query('UPDATE chats SET "hiddenBy" = $1, "clearedHistoryAt" = $2 WHERE id = $3', [JSON.stringify(newHidden), JSON.stringify(newCleared), req.params.id])];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                res.json({ success: true });
                return [3 /*break*/, 6];
            case 5:
                e_29 = _b.sent();
                res.status(500).send("Failed to delete chat");
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.post('/api/chats', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, targetUserId, bookId, language, currentUserId, isTr, allChats, chat, chatId, hiddenList, newHidden, bookRes, book, cardData, lastMsgRes, msgId, timestamp, e_30;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, targetUserId = _a.targetUserId, bookId = _a.bookId, language = _a.language;
                currentUserId = req.user.id.toString();
                isTr = language === 'tr';
                _b.label = 1;
            case 1:
                _b.trys.push([1, 13, , 14]);
                return [4 /*yield*/, pool.query('SELECT * FROM chats WHERE "participantIds" @> $1', [JSON.stringify([currentUserId])])];
            case 2:
                allChats = _b.sent();
                chat = allChats.rows.find(function (c) { return c.participantIds.includes(targetUserId); });
                chatId = chat ? chat.id : null;
                if (!chat) return [3 /*break*/, 5];
                hiddenList = chat.hiddenBy || [];
                if (!hiddenList.includes(currentUserId)) return [3 /*break*/, 4];
                newHidden = hiddenList.filter(function (id) { return id !== currentUserId; });
                // Unhide, but do NOT clear 'clearedHistoryAt', user wants to see new messages, not old ones if they deleted them
                return [4 /*yield*/, pool.query('UPDATE chats SET "hiddenBy" = $1 WHERE id = $2', [JSON.stringify(newHidden), chat.id])];
            case 3:
                // Unhide, but do NOT clear 'clearedHistoryAt', user wants to see new messages, not old ones if they deleted them
                _b.sent();
                _b.label = 4;
            case 4: return [3 /*break*/, 7];
            case 5:
                chatId = "chat_".concat(Date.now());
                // New DM chats start as 'pending'
                return [4 /*yield*/, pool.query('INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [chatId, JSON.stringify([currentUserId, targetUserId]), bookId || null, isTr ? "Sohbet başlatıldı" : "Chat started", new Date().toISOString(), 0, '[]', parseInt(currentUserId), 'pending', '{}'])];
            case 6:
                // New DM chats start as 'pending'
                _b.sent();
                chat = { id: chatId };
                _b.label = 7;
            case 7:
                if (!bookId) return [3 /*break*/, 12];
                return [4 /*yield*/, pool.query('SELECT * FROM books WHERE id = $1', [bookId])];
            case 8:
                bookRes = _b.sent();
                if (!(bookRes.rows.length > 0)) return [3 /*break*/, 12];
                book = bookRes.rows[0];
                cardData = JSON.stringify({ id: book.id, title: book.title, imageUrl: book.imageUrl, price: book.price, forSale: book.forSale, forSwap: book.forSwap });
                return [4 /*yield*/, pool.query('SELECT type, text FROM messages WHERE "chatThreadId" = $1 ORDER BY timestamp DESC LIMIT 1', [chatId])];
            case 9:
                lastMsgRes = _b.sent();
                if (!(lastMsgRes.rows.length === 0 || lastMsgRes.rows[0].type !== 'book_card' || lastMsgRes.rows[0].text !== cardData)) return [3 /*break*/, 12];
                msgId = "msg_".concat(Date.now(), "_auto");
                timestamp = new Date().toISOString();
                return [4 /*yield*/, pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', [msgId, chatId, parseInt(currentUserId), cardData, timestamp, false, 'book_card'])];
            case 10:
                _b.sent();
                return [4 /*yield*/, pool.query('UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "hiddenBy" = $3, "lastSenderId" = $4 WHERE id = $5', [isTr ? "\u0130lgileniliyor: ".concat(book.title) : "Interested in: ".concat(book.title), timestamp, '[]', parseInt(currentUserId), chatId])];
            case 11:
                _b.sent();
                _b.label = 12;
            case 12:
                res.json(chat);
                return [3 /*break*/, 14];
            case 13:
                e_30 = _b.sent();
                res.status(500).send("Create chat error");
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); });
app.post('/api/chats/:id/read', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, chatRes, e_31;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = parseInt(req.user.id);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                return [4 /*yield*/, pool.query('SELECT "lastSenderId" FROM chats WHERE id = $1', [req.params.id])];
            case 2:
                chatRes = _a.sent();
                if (!(chatRes.rows.length > 0 && chatRes.rows[0].lastSenderId !== userId)) return [3 /*break*/, 5];
                return [4 /*yield*/, pool.query('UPDATE messages SET "isRead" = TRUE WHERE "chatThreadId" = $1 AND "senderId" != $2', [req.params.id, userId])];
            case 3:
                _a.sent();
                return [4 /*yield*/, pool.query('UPDATE chats SET "unreadMessages" = 0 WHERE id = $1', [req.params.id])];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                res.json({ success: true });
                return [3 /*break*/, 7];
            case 6:
                e_31 = _a.sent();
                res.status(500).send("Error marking read");
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
app.get('/api/chats/:id/messages', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, chatRes, filterTimestamp, clearedMap, query, params, result, messages, e_32;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id.toString();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, pool.query('SELECT "clearedHistoryAt" FROM chats WHERE id = $1', [req.params.id])];
            case 2:
                chatRes = _a.sent();
                filterTimestamp = null;
                if (chatRes.rows.length > 0) {
                    clearedMap = chatRes.rows[0].clearedHistoryAt || {};
                    if (clearedMap[userId]) {
                        filterTimestamp = clearedMap[userId];
                    }
                }
                query = 'SELECT * FROM messages WHERE "chatThreadId" = $1';
                params = [req.params.id];
                if (filterTimestamp) {
                    query += ' AND timestamp > $2';
                    params.push(filterTimestamp);
                }
                query += ' ORDER BY timestamp ASC';
                return [4 /*yield*/, pool.query(query, params)];
            case 3:
                result = _a.sent();
                messages = result.rows.map(function (m) { return (__assign(__assign({}, m), { senderId: m.senderId ? m.senderId.toString() : null })); });
                res.json(messages);
                return [3 /*break*/, 5];
            case 4:
                e_32 = _a.sent();
                res.status(500).send("Fetch messages error");
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.post('/api/chats/:id/messages', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, text, type, senderId, chatId, msgId, timestamp, chatRes, chat, participantIds_1, otherUserIdStr, otherUserId, blockCheck, preview, currentHidden, newHidden, e_33;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, text = _a.text, type = _a.type;
                senderId = parseInt(req.user.id);
                chatId = req.params.id;
                msgId = "msg_".concat(Date.now());
                timestamp = new Date().toISOString();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 7, , 8]);
                return [4 /*yield*/, pool.query('SELECT "participantIds", "hiddenBy" FROM chats WHERE id = $1', [chatId])];
            case 2:
                chatRes = _b.sent();
                if (chatRes.rows.length === 0)
                    return [2 /*return*/, res.status(404).send("Chat not found")];
                chat = chatRes.rows[0];
                participantIds_1 = chat.participantIds;
                otherUserIdStr = participantIds_1.find(function (id) { return id !== senderId.toString(); });
                if (!otherUserIdStr) return [3 /*break*/, 4];
                otherUserId = parseInt(otherUserIdStr);
                return [4 /*yield*/, pool.query('SELECT * FROM blocks WHERE ("blockerId"=$1 AND "blockedId"=$2) OR ("blockerId"=$2 AND "blockedId"=$1)', [senderId, otherUserId])];
            case 3:
                blockCheck = _b.sent();
                if (blockCheck.rows.length > 0) {
                    return [2 /*return*/, res.status(403).send("Message blocked.")];
                }
                _b.label = 4;
            case 4: 
            // -------------------------
            return [4 /*yield*/, pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', [msgId, chatId, senderId, text, timestamp, false, type || 'text'])];
            case 5:
                // -------------------------
                _b.sent();
                preview = text;
                if (type === 'image')
                    preview = '📷 Photo';
                else if (type === 'location')
                    preview = '📍 Location';
                currentHidden = chat.hiddenBy || [];
                newHidden = currentHidden.filter(function (id) { return !participantIds_1.includes(id); });
                return [4 /*yield*/, pool.query('UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "hiddenBy" = $3, "lastSenderId" = $4 WHERE id = $5', [preview, timestamp, JSON.stringify(newHidden), senderId, chatId])];
            case 6:
                _b.sent();
                res.json({ id: msgId, chatThreadId: chatId, senderId: senderId.toString(), text: text, timestamp: timestamp, isRead: false, type: type || 'text' });
                return [3 /*break*/, 8];
            case 7:
                e_33 = _b.sent();
                console.error("Message send error:", e_33);
                res.status(500).send("Send message error");
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// Swaps
app.get('/api/swaps', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, swaps, e_34;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query("SELECT s.*, u1.username as \"offeredByUsername\", u2.username as \"offeredToUsername\" FROM swaps s LEFT JOIN users u1 ON s.\"offeredById\" = u1.id LEFT JOIN users u2 ON s.\"offeredToId\" = u2.id WHERE s.\"offeredById\" = $1 OR s.\"offeredToId\" = $1", [userId])];
            case 2:
                result = _a.sent();
                swaps = result.rows.map(function (s) { return (__assign(__assign({}, s), { offeredById: s.offeredById.toString(), offeredToId: s.offeredToId.toString() })); });
                res.json(swaps);
                return [3 /*break*/, 4];
            case 3:
                e_34 = _a.sent();
                res.status(500).send("Swap list error");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post('/api/swaps', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var swap, userId, _i, _a, bookId, e_35;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                swap = req.body;
                userId = req.user.id;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 8, , 9]);
                return [4 /*yield*/, pool.query('INSERT INTO swaps (id, "offeredById", "offeredToId", "offeredBookIds", "requestedBookId", status, message, "creationDate", "lastUpdateDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [swap.id, userId, swap.offeredToId, JSON.stringify(swap.offeredBookIds), swap.requestedBookId, swap.status, swap.message, swap.creationDate, swap.lastUpdateDate])];
            case 2:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE books SET status = 'Requested' WHERE id = $1 AND status = 'Available'", [swap.requestedBookId])];
            case 3:
                _b.sent();
                if (!(swap.offeredBookIds && Array.isArray(swap.offeredBookIds))) return [3 /*break*/, 7];
                _i = 0, _a = swap.offeredBookIds;
                _b.label = 4;
            case 4:
                if (!(_i < _a.length)) return [3 /*break*/, 7];
                bookId = _a[_i];
                return [4 /*yield*/, pool.query("UPDATE books SET status = 'Requested' WHERE id = $1 AND status = 'Available'", [bookId])];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7:
                res.json(swap);
                return [3 /*break*/, 9];
            case 8:
                e_35 = _b.sent();
                res.status(500).send("Failed to create swap");
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/swaps/:id', authenticateToken, async function (req, res) {
    try {
        // Ensure swap exists and requester is a participant
        const swapRes = await pool.query('SELECT * FROM swaps WHERE id = $1', [req.params.id]);
        if (swapRes.rows.length === 0) return res.status(404).send('Swap not found');
        const swap = swapRes.rows[0];
        const userId = req.user.id;
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
            // log and continue
            console.error('Failed to revert book statuses on delete:', e);
        }

        const result = await pool.query('DELETE FROM swaps WHERE id = $1', [req.params.id]);
        if (result.rowCount && result.rowCount > 0) res.json({ success: true });
        else res.status(404).send('Swap not found');
    } catch (e) {
        console.error(e);
        res.status(500).send('Delete swap error');
    }
});
app.delete('/api/swaps/batch/clean', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, e_37;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('DELETE FROM swaps WHERE ("offeredById" = $1 OR "offeredToId" = $1) AND status != \'Pending\'', [userId])];
            case 2:
                result = _a.sent();
                res.json({ success: true, count: result.rowCount });
                return [3 /*break*/, 4];
            case 3:
                e_37 = _a.sent();
                res.status(500).send("Batch delete error");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.put('/api/swaps/:id/status', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status, language, currentUserId, isTr, result, swap, _i, _b, bookId, _c, _d, bookId, otherUserId_1, bookRes, bookTitle, chatId, allChats, existingChat, autoMsg, timestamp, e_38;
    var _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _a = req.body, status = _a.status, language = _a.language;
                currentUserId = req.user.id;
                isTr = language === 'tr';
                _f.label = 1;
            case 1:
                _f.trys.push([1, 25, , 26]);
                return [4 /*yield*/, pool.query('UPDATE swaps SET status = $1, "lastUpdateDate" = $2 WHERE id = $3 RETURNING *', [status, new Date().toISOString(), req.params.id])];
            case 2:
                result = _f.sent();
                if (!(result.rowCount && result.rowCount > 0)) return [3 /*break*/, 23];
                swap = result.rows[0];
                if (!(status === 'Accepted')) return [3 /*break*/, 8];
                return [4 /*yield*/, pool.query("UPDATE books SET status = 'Reserved' WHERE id = $1", [swap.requestedBookId])];
            case 3:
                _f.sent();
                if (!swap.offeredBookIds) return [3 /*break*/, 7];
                _i = 0, _b = swap.offeredBookIds;
                _f.label = 4;
            case 4:
                if (!(_i < _b.length)) return [3 /*break*/, 7];
                bookId = _b[_i];
                return [4 /*yield*/, pool.query("UPDATE books SET status = 'Reserved' WHERE id = $1", [bookId])];
            case 5:
                _f.sent();
                _f.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7: return [3 /*break*/, 13];
            case 8:
                if (!(status === 'Rejected' || status === 'Cancelled')) return [3 /*break*/, 13];
                return [4 /*yield*/, pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND (status = 'Requested' OR status = 'Reserved')", [swap.requestedBookId])];
            case 9:
                _f.sent();
                if (!swap.offeredBookIds) return [3 /*break*/, 13];
                _c = 0, _d = swap.offeredBookIds;
                _f.label = 10;
            case 10:
                if (!(_c < _d.length)) return [3 /*break*/, 13];
                bookId = _d[_c];
                return [4 /*yield*/, pool.query("UPDATE books SET status = 'Available' WHERE id = $1 AND (status = 'Requested' OR status = 'Reserved')", [bookId])];
            case 11:
                _f.sent();
                _f.label = 12;
            case 12:
                _c++;
                return [3 /*break*/, 10];
            case 13:
                if (!(status === 'Accepted')) return [3 /*break*/, 22];
                otherUserId_1 = swap.offeredById;
                return [4 /*yield*/, pool.query('SELECT title FROM books WHERE id = $1', [swap.requestedBookId])];
            case 14:
                bookRes = _f.sent();
                bookTitle = ((_e = bookRes.rows[0]) === null || _e === void 0 ? void 0 : _e.title) || 'the book';
                chatId = '';
                return [4 /*yield*/, pool.query('SELECT * FROM chats WHERE "participantIds" @> $1', [JSON.stringify([currentUserId.toString()])])];
            case 15:
                allChats = _f.sent();
                existingChat = allChats.rows.find(function (c) { return c.participantIds.includes(otherUserId_1.toString()); });
                if (!existingChat) return [3 /*break*/, 17];
                chatId = existingChat.id;
                return [4 /*yield*/, pool.query('UPDATE chats SET "hiddenBy" = $1, status = $2 WHERE id = $3', ['[]', 'accepted', chatId])];
            case 16:
                _f.sent();
                return [3 /*break*/, 19];
            case 17:
                chatId = "chat_".concat(Date.now());
                return [4 /*yield*/, pool.query('INSERT INTO chats (id, "participantIds", "bookId", "lastMessageText", "lastMessageTimestamp", "unreadMessages", "hiddenBy", "lastSenderId", status, "clearedHistoryAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [chatId, JSON.stringify([currentUserId.toString(), otherUserId_1.toString()]), swap.requestedBookId, isTr ? "Sohbet başlatıldı" : "Chat started", new Date().toISOString(), 0, '[]', currentUserId, 'accepted', '{}'])];
            case 18:
                _f.sent();
                _f.label = 19;
            case 19:
                autoMsg = isTr ? "Merhaba! \"".concat(bookTitle, "\" i\u00E7in takas teklifini kabul ettim.") : "Hello! I have accepted the swap offer for \"".concat(bookTitle, "\".");
                timestamp = new Date().toISOString();
                return [4 /*yield*/, pool.query('INSERT INTO messages (id, "chatThreadId", "senderId", text, timestamp, "isRead", "type") VALUES ($1, $2, $3, $4, $5, $6, $7)', ["msg_".concat(Date.now(), "_auto"), chatId, currentUserId, autoMsg, timestamp, false, 'text'])];
            case 20:
                _f.sent();
                return [4 /*yield*/, pool.query('UPDATE chats SET "lastMessageText" = $1, "lastMessageTimestamp" = $2, "unreadMessages" = "unreadMessages" + 1, "lastSenderId" = $4 WHERE id = $3', [autoMsg, timestamp, chatId, currentUserId])];
            case 21:
                _f.sent();
                _f.label = 22;
            case 22:
                res.json({ success: true });
                return [3 /*break*/, 24];
            case 23:
                res.status(500).send("Failed to update");
                _f.label = 24;
            case 24: return [3 /*break*/, 26];
            case 25:
                e_38 = _f.sent();
                res.status(500).send("Swap update error");
                return [3 /*break*/, 26];
            case 26: return [2 /*return*/];
        }
    });
}); });
app.listen(PORT, HOST, function () {
    console.log("Server running on http://".concat(HOST, ":").concat(PORT));
});
