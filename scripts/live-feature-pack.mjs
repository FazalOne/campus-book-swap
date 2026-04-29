const API = "http://localhost:3001/api";

const j = (token, body) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    Origin: "http://localhost:5173",
  },
  body: JSON.stringify(body),
});

async function req(path, init = {}) {
  const res = await fetch(`${API}${path}`, init);
  const txt = await res.text();
  let data;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  return { ok: res.ok, status: res.status, data, headers: res.headers };
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function createUser(base) {
  const reg = await req("/auth/register", j(null, base));
  if (reg.ok) return reg.data;
  const login = await req("/auth/login", j(null, { username: base.username, password: base.password }));
  if (!login.ok) throw new Error(`auth failed ${base.username}: ${JSON.stringify(login.data)}`);
  return login.data;
}

async function run() {
  const nonce = Date.now();
  const admin = await req("/auth/login", j(null, { username: "admin", password: "admin" }));
  assert(admin.ok, "admin login failed");
  const adminToken = admin.data.token;

  const u1 = await createUser({
    username: `feat_u1_${nonce}`, password: "pass1234", firstName: "Feat", lastName: "One",
    email: `feat_u1_${nonce}@e.com`, phone: "111111"
  });
  const u2 = await createUser({
    username: `feat_u2_${nonce}`, password: "pass1234", firstName: "Feat", lastName: "Two",
    email: `feat_u2_${nonce}@e.com`, phone: "222222"
  });

  // demo reset/seed
  const reset = await req("/demo/reset", j(adminToken, {}));
  assert(reset.ok, `demo reset failed: ${JSON.stringify(reset.data)}`);
  const seed = await req("/demo/seed", j(adminToken, {}));
  assert(seed.ok, `demo seed failed: ${JSON.stringify(seed.data)}`);

  // search endpoint
  const search = await req("/books/search?q=Demo&forSwap=true&sort=newest", {
    headers: { Origin: "http://localhost:5173" },
  });
  assert(search.ok && Array.isArray(search.data), "book search failed");

  // create chat then pin + search
  const chat = await req("/chats", j(u1.token, { targetUserId: u2.user.id, language: "en" }));
  assert(chat.ok && chat.data?.id, "chat create failed");
  const chatId = chat.data.id;
  const msg = await req(`/chats/${chatId}/messages`, j(u1.token, { text: "feature pack hello", type: "text" }));
  assert(msg.ok, "send message failed");
  const pin = await req(`/chats/${chatId}/pin`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${u1.token}`, Origin: "http://localhost:5173" }, body: "{}" });
  assert(pin.ok, "pin failed");
  const searchMsg = await req(`/chats/${chatId}/search?q=feature`, { headers: { Authorization: `Bearer ${u1.token}`, Origin: "http://localhost:5173" } });
  assert(searchMsg.ok && Array.isArray(searchMsg.data) && searchMsg.data.length > 0, "chat search failed");

  // trust score + analytics
  const trust = await req(`/users/${u1.user.id}/trust-score`, { headers: { Authorization: `Bearer ${u2.token}`, Origin: "http://localhost:5173" } });
  assert(trust.ok && typeof trust.data?.score === "number", "trust score failed");
  const analytics = await req("/analytics/dashboard", { headers: { Authorization: `Bearer ${u1.token}`, Origin: "http://localhost:5173" } });
  assert(analytics.ok && analytics.data?.mySwaps, "dashboard analytics failed");

  // swap + counter-offer
  const b1 = `feat_book_${nonce}_1`;
  const b2 = `feat_book_${nonce}_2`;
  const now = new Date().toISOString();
  await req("/books", j(u1.token, { id: b1, title: "Feat A", author: "A", isbn: "1", edition: "1", course: "C", department: "Computer Engineering", condition: "Good", description: "d", imageUrl: "", price: 10, forSwap: true, forSale: false, listedDate: now }));
  await req("/books", j(u2.token, { id: b2, title: "Feat B", author: "B", isbn: "2", edition: "1", course: "C", department: "Software Engineering", condition: "Good", description: "d", imageUrl: "", price: 11, forSwap: true, forSale: false, listedDate: now }));
  const swapId = `feat_swap_${nonce}`;
  const swap = await req("/swaps", j(u1.token, { id: swapId, offeredToId: u2.user.id, offeredBookIds: [b1], requestedBookId: b2, status: "Pending", message: "swap", creationDate: now, lastUpdateDate: now }));
  assert(swap.ok, "create swap failed");
  const counter = await req(`/swaps/${swapId}/counter`, j(u2.token, { offeredBookIds: [b2], requestedBookId: b1, message: "counter offer" }));
  assert(counter.ok, "counter offer failed");
  const counters = await req(`/swaps/${swapId}/counters`, { headers: { Authorization: `Bearer ${u1.token}`, Origin: "http://localhost:5173" } });
  assert(counters.ok && Array.isArray(counters.data) && counters.data.length > 0, "fetch counters failed");

  // health/readiness
  const health = await fetch("http://localhost:3001/healthz").then(r => r.json());
  const ready = await fetch("http://localhost:3001/readyz").then(r => r.json());
  assert(health.ok === true && ready.ok === true, "health/ready failed");

  console.log("LIVE_FEATURE_PACK_PASS");
  console.log(JSON.stringify({ chatId, swapId, trustScore: trust.data.score, demoSeeded: seed.data?.seeded || true }, null, 2));
}

run().catch((e) => {
  console.error("LIVE_FEATURE_PACK_FAIL");
  console.error(e.message || e);
  process.exit(1);
});

