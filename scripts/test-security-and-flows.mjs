const API_BASE = "http://localhost:3001/api";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json", Origin: "http://localhost:5173" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function createUser(nonce, suffix) {
  const username = `deep_${suffix}_${nonce}`;
  const password = "pass1234";
  const reg = await req("/auth/register", {
    method: "POST",
    body: {
      username,
      password,
      firstName: "Deep",
      lastName: suffix,
      email: `${username}@example.com`,
      phone: `555${Math.floor(Math.random() * 100000)}`,
    },
  });
  if (reg.ok) return reg.data;
  const login = await req("/auth/login", { method: "POST", body: { username, password } });
  assert(login.ok, `createUser failed for ${username}: ${JSON.stringify(login.data)}`);
  return login.data;
}

async function run() {
  const nonce = Date.now();
  const aliceAuth = await createUser(nonce, "alice");
  const bobAuth = await createUser(nonce, "bob");
  const charlieAuth = await createUser(nonce, "charlie");
  const alice = aliceAuth.user;
  const bob = bobAuth.user;
  const charlie = charlieAuth.user;
  const tokenA = aliceAuth.token;
  const tokenB = bobAuth.token;
  const tokenC = charlieAuth.token;

  // Unauthorized me should fail
  const unauthMe = await req("/auth/me");
  assert(unauthMe.status === 401, `Expected 401 for unauth /auth/me, got ${unauthMe.status}`);

  // Self review should fail
  const selfReview = await req("/reviews", {
    method: "POST",
    token: tokenA,
    body: { targetUserId: alice.id, rating: 5, comment: "self" },
  });
  assert(selfReview.status === 400, `Expected 400 for self review, got ${selfReview.status}`);

  // Setup books
  const now = new Date().toISOString();
  const bookA = `deep_book_a_${nonce}`;
  const bookB = `deep_book_b_${nonce}`;
  const createA = await req("/books", {
    method: "POST",
    token: tokenA,
    body: {
      id: bookA, title: "A", author: "AA", isbn: "1", edition: "1",
      course: "C1", department: "D1", condition: "Good", description: "A",
      imageUrl: "", price: 10, forSwap: true, forSale: false, listedDate: now
    },
  });
  assert(createA.ok, `create bookA failed: ${JSON.stringify(createA.data)}`);

  const createB = await req("/books", {
    method: "POST",
    token: tokenB,
    body: {
      id: bookB, title: "B", author: "BB", isbn: "2", edition: "1",
      course: "C2", department: "D2", condition: "Good", description: "B",
      imageUrl: "", price: 12, forSwap: true, forSale: true, listedDate: now
    },
  });
  assert(createB.ok, `create bookB failed: ${JSON.stringify(createB.data)}`);

  // Unauthorized favorite toggle should fail
  const unauthFav = await req(`/books/${bookB}/favorite`, { method: "POST" });
  assert(unauthFav.status === 401, `Expected 401 for unauth favorite, got ${unauthFav.status}`);

  // Block flow: Bob blocks Alice, then Alice cannot message Bob
  const block = await req(`/users/${alice.id}/block`, { method: "POST", token: tokenB });
  assert(block.ok, `Bob block Alice failed: ${JSON.stringify(block.data)}`);

  const chatAB = await req("/chats", {
    method: "POST",
    token: tokenA,
    body: { targetUserId: bob.id, bookId: bookB, language: "en" },
  });
  assert(chatAB.ok && chatAB.data?.id, `Create chat AB failed: ${JSON.stringify(chatAB.data)}`);
  const chatIdAB = chatAB.data.id;

  const blockedMsg = await req(`/chats/${chatIdAB}/messages`, {
    method: "POST",
    token: tokenA,
    body: { text: "Should be blocked", type: "text" },
  });
  assert(blockedMsg.status === 403, `Expected 403 blocked message, got ${blockedMsg.status}`);

  // Unblock and verify messaging works again
  const unblock = await req(`/users/${alice.id}/block`, { method: "DELETE", token: tokenB });
  assert(unblock.ok, `Unblock failed: ${JSON.stringify(unblock.data)}`);

  const msgAfterUnblock = await req(`/chats/${chatIdAB}/messages`, {
    method: "POST",
    token: tokenA,
    body: { text: "Now allowed", type: "text" },
  });
  assert(msgAfterUnblock.ok, `Message after unblock failed: ${JSON.stringify(msgAfterUnblock.data)}`);

  // Non-participant cannot hide/read someone else's chat
  const unauthorizedHide = await req(`/chats/${chatIdAB}/hide`, {
    method: "POST",
    token: tokenC,
    body: {},
  });
  assert(unauthorizedHide.status === 403, `Expected 403 for unauthorized hide, got ${unauthorizedHide.status}`);
  const unauthorizedRead = await req(`/chats/${chatIdAB}/read`, {
    method: "POST",
    token: tokenC,
    body: {},
  });
  assert(unauthorizedRead.status === 403, `Expected 403 for unauthorized read, got ${unauthorizedRead.status}`);

  // Swap permission checks
  const swapId = `deep_swap_${nonce}`;
  const createSwap = await req("/swaps", {
    method: "POST",
    token: tokenA,
    body: {
      id: swapId,
      offeredToId: bob.id,
      offeredBookIds: [bookA],
      requestedBookId: bookB,
      status: "Pending",
      message: "swap?",
      creationDate: now,
      lastUpdateDate: now,
    },
  });
  assert(createSwap.ok, `Create swap failed: ${JSON.stringify(createSwap.data)}`);

  // Charlie (not recipient) cannot accept
  const badAccept = await req(`/swaps/${swapId}/status`, {
    method: "PUT",
    token: tokenC,
    body: { status: "Accepted", language: "en" },
  });
  assert(badAccept.status === 403, `Expected 403 for non-recipient accept, got ${badAccept.status}`);

  // Completing before accepted should fail
  const earlyComplete = await req(`/swaps/${swapId}/status`, {
    method: "PUT",
    token: tokenA,
    body: { status: "Completed", language: "en" },
  });
  assert(earlyComplete.status === 400, `Expected 400 early completion, got ${earlyComplete.status}`);

  // Correct acceptance by Bob, then completion by Alice
  const goodAccept = await req(`/swaps/${swapId}/status`, {
    method: "PUT",
    token: tokenB,
    body: { status: "Accepted", language: "en" },
  });
  assert(goodAccept.ok, `Expected accept to succeed, got ${goodAccept.status}`);

  const goodComplete = await req(`/swaps/${swapId}/status`, {
    method: "PUT",
    token: tokenA,
    body: { status: "Completed", language: "en" },
  });
  assert(goodComplete.ok, `Expected complete to succeed, got ${goodComplete.status}`);

  // Multi-requested-books offer should be accepted and persisted.
  const bookA2 = `deep_book_a2_${nonce}`;
  const createA2 = await req("/books", {
    method: "POST",
    token: tokenA,
    body: {
      id: bookA2, title: "A2", author: "AA2", isbn: "11", edition: "1",
      course: "C1", department: "D1", condition: "Good", description: "A2",
      imageUrl: "", price: 15, forSwap: true, forSale: false, listedDate: now
    },
  });
  assert(createA2.ok, `create bookA2 failed: ${JSON.stringify(createA2.data)}`);

  const bookB2 = `deep_book_b2_${nonce}`;
  const bookB3 = `deep_book_b3_${nonce}`;
  const createB2 = await req("/books", {
    method: "POST",
    token: tokenB,
    body: {
      id: bookB2, title: "B2", author: "BB2", isbn: "22", edition: "1",
      course: "C2", department: "D2", condition: "Good", description: "B2",
      imageUrl: "", price: 14, forSwap: true, forSale: true, listedDate: now
    },
  });
  assert(createB2.ok, `create bookB2 failed: ${JSON.stringify(createB2.data)}`);
  const createB3 = await req("/books", {
    method: "POST",
    token: tokenB,
    body: {
      id: bookB3, title: "B3", author: "BB3", isbn: "23", edition: "1",
      course: "C2", department: "D2", condition: "Good", description: "B3",
      imageUrl: "", price: 16, forSwap: true, forSale: true, listedDate: now
    },
  });
  assert(createB3.ok, `create bookB3 failed: ${JSON.stringify(createB3.data)}`);

  const swapMultiId = `deep_swap_multi_${nonce}`;
  const createSwapMulti = await req("/swaps", {
    method: "POST",
    token: tokenA,
    body: {
      id: swapMultiId,
      offeredToId: bob.id,
      offeredBookIds: [bookA2],
      requestedBookId: bookB2,
      requestedBookIds: [bookB2, bookB3],
      status: "Pending",
      message: "swap multi?",
      creationDate: now,
      lastUpdateDate: now,
    },
  });
  assert(createSwapMulti.ok, `Create multi swap failed: ${JSON.stringify(createSwapMulti.data)}`);
  const goodAcceptMulti = await req(`/swaps/${swapMultiId}/status`, {
    method: "PUT",
    token: tokenB,
    body: { status: "Accepted", language: "en" },
  });
  assert(goodAcceptMulti.ok, `Expected multi accept to succeed, got ${goodAcceptMulti.status}`);
  const swapsAfterMulti = await req("/swaps", { token: tokenA });
  assert(swapsAfterMulti.ok && Array.isArray(swapsAfterMulti.data), "Failed to fetch swaps after multi accept");
  const multiSwapRow = swapsAfterMulti.data.find((s) => s.id === swapMultiId);
  assert(multiSwapRow && Array.isArray(multiSwapRow.requestedBookIds) && multiSwapRow.requestedBookIds.length === 2,
    `Expected requestedBookIds length 2, got ${JSON.stringify(multiSwapRow)}`);

  // Admin permissions: normal user should not access admin endpoints
  const nonAdminUsers = await req("/admin/users", { token: tokenA });
  assert(nonAdminUsers.status === 403, `Expected 403 non-admin /admin/users, got ${nonAdminUsers.status}`);

  // Invalid token checks
  const invalidAdmin = await req("/admin/reports", { token: "totally.invalid.token" });
  assert(invalidAdmin.status === 403, `Expected 403 invalid token admin endpoint, got ${invalidAdmin.status}`);

  console.log("LIVE_DEEP_TEST_PASS");
  console.log(JSON.stringify({ users: [alice.username, bob.username, charlie.username], chatIdAB, swapId }, null, 2));
}

run().catch((err) => {
  console.error("LIVE_DEEP_TEST_FAIL");
  console.error(err.message || err);
  process.exit(1);
});
