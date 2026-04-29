const API_BASE = process.env.API_BASE || "http://localhost:3001/api";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function registerOrLogin({ username, password, firstName, lastName, email, phone }) {
  const registerRes = await request("/auth/register", {
    method: "POST",
    body: { username, password, firstName, lastName, email, phone },
  });
  if (registerRes.ok) return registerRes.data;

  const loginRes = await request("/auth/login", {
    method: "POST",
    body: { username, password },
  });
  assert(loginRes.ok, `Register/Login failed for ${username}: ${JSON.stringify(loginRes.data)}`);
  return loginRes.data;
}

async function run() {
  const nonce = Date.now();
  const user1Creds = {
    username: `live_user1_${nonce}`,
    password: "pass1234",
    firstName: "Live",
    lastName: "UserOne",
    email: `live1_${nonce}@example.com`,
    phone: "5551001",
  };
  const user2Creds = {
    username: `live_user2_${nonce}`,
    password: "pass1234",
    firstName: "Live",
    lastName: "UserTwo",
    email: `live2_${nonce}@example.com`,
    phone: "5551002",
  };

  const user1Auth = await registerOrLogin(user1Creds);
  const user2Auth = await registerOrLogin(user2Creds);
  const user1 = user1Auth.user;
  const user2 = user2Auth.user;
  const token1 = user1Auth.token;
  const token2 = user2Auth.token;

  assert(token1 && token2, "Missing auth tokens");

  const me1 = await request("/auth/me", { token: token1 });
  assert(me1.ok && me1.data?.id === user1.id, "User1 /auth/me failed");

  const me2 = await request("/auth/me", { token: token2 });
  assert(me2.ok && me2.data?.id === user2.id, "User2 /auth/me failed");

  const book1Id = `book_${nonce}_1`;
  const book2Id = `book_${nonce}_2`;
  const now = new Date().toISOString();

  const book1 = await request("/books", {
    method: "POST",
    token: token1,
    body: {
      id: book1Id,
      title: "Distributed Systems",
      author: "Tanenbaum",
      isbn: "1111111111",
      edition: "4th",
      course: "CS401",
      department: "CSE",
      condition: "Good",
      description: "Smoke test listing 1",
      imageUrl: "",
      price: 20,
      forSwap: true,
      forSale: true,
      listedDate: now,
    },
  });
  assert(book1.ok, `Create user1 book failed: ${JSON.stringify(book1.data)}`);

  const book2 = await request("/books", {
    method: "POST",
    token: token2,
    body: {
      id: book2Id,
      title: "Operating Systems",
      author: "Silberschatz",
      isbn: "2222222222",
      edition: "9th",
      course: "CS301",
      department: "CSE",
      condition: "Like New",
      description: "Smoke test listing 2",
      imageUrl: "",
      price: 25,
      forSwap: true,
      forSale: false,
      listedDate: now,
    },
  });
  assert(book2.ok, `Create user2 book failed: ${JSON.stringify(book2.data)}`);

  const allBooks = await request("/books");
  assert(allBooks.ok && Array.isArray(allBooks.data), "GET /books failed");
  assert(allBooks.data.some((b) => b.id === book1Id), "Book1 missing from /books");
  assert(allBooks.data.some((b) => b.id === book2Id), "Book2 missing from /books");

  const favoriteOn = await request(`/books/${book2Id}/favorite`, {
    method: "POST",
    token: token1,
  });
  assert(favoriteOn.ok && favoriteOn.data?.isFavorited === true, "Favorite on failed");

  const favoriteOff = await request(`/books/${book2Id}/favorite`, {
    method: "POST",
    token: token1,
  });
  assert(favoriteOff.ok && favoriteOff.data?.isFavorited === false, "Favorite off failed");

  const chatCreate = await request("/chats", {
    method: "POST",
    token: token1,
    body: { targetUserId: user2.id, bookId: book2Id, language: "en" },
  });
  assert(chatCreate.ok && chatCreate.data?.id, `Chat create failed: ${JSON.stringify(chatCreate.data)}`);
  const chatId = chatCreate.data.id;

  const sendMsg = await request(`/chats/${chatId}/messages`, {
    method: "POST",
    token: token1,
    body: { text: "Hello from live smoke test", type: "text" },
  });
  assert(sendMsg.ok, `Send message failed: ${JSON.stringify(sendMsg.data)}`);

  const getMessages = await request(`/chats/${chatId}/messages`, { token: token2 });
  assert(getMessages.ok && Array.isArray(getMessages.data), "Fetch messages failed");
  assert(
    getMessages.data.some((m) => m.text === "Hello from live smoke test"),
    "Sent message missing in chat history"
  );

  const swapId = `swap_${nonce}`;
  const createSwap = await request("/swaps", {
    method: "POST",
    token: token1,
    body: {
      id: swapId,
      offeredToId: user2.id,
      offeredBookIds: [book1Id],
      requestedBookId: book2Id,
      status: "Pending",
      message: "Would you like to swap?",
      creationDate: now,
      lastUpdateDate: now,
    },
  });
  assert(createSwap.ok, `Create swap failed: ${JSON.stringify(createSwap.data)}`);

  const acceptSwap = await request(`/swaps/${swapId}/status`, {
    method: "PUT",
    token: token2,
    body: { status: "Accepted", language: "en" },
  });
  assert(acceptSwap.ok, `Accept swap failed: ${JSON.stringify(acceptSwap.data)}`);

  const completeSwap = await request(`/swaps/${swapId}/status`, {
    method: "PUT",
    token: token1,
    body: { status: "Completed", language: "en" },
  });
  assert(completeSwap.ok, `Complete swap failed: ${JSON.stringify(completeSwap.data)}`);

  const book1After = await request(`/books/${book1Id}`, { token: token1 });
  const book2After = await request(`/books/${book2Id}`, { token: token2 });
  assert(book1After.ok && book2After.ok, "Failed to verify books after swap completion");
  assert(book1After.data?.status === "Swapped", "Book1 status not Swapped after completion");
  assert(book2After.data?.status === "Swapped", "Book2 status not Swapped after completion");

  const review = await request("/reviews", {
    method: "POST",
    token: token1,
    body: { targetUserId: user2.id, rating: 5, comment: "Great swap partner" },
  });
  assert(review.ok, `Review create failed: ${JSON.stringify(review.data)}`);

  const publicProfile = await request(`/users/${user2.id}/public`, { token: token1 });
  assert(publicProfile.ok && publicProfile.data?.id === user2.id, "Public profile endpoint failed");

  console.log("LIVE_SMOKE_TEST_PASS");
  console.log(
    JSON.stringify(
      {
        users: [user1.username, user2.username],
        ids: [user1.id, user2.id],
        chatId,
        swapId,
        books: [book1Id, book2Id],
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error("LIVE_SMOKE_TEST_FAIL");
  console.error(err?.message || err);
  process.exit(1);
});
