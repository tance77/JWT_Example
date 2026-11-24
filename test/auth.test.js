const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createApp = require("../app");

process.env.NODE_ENV = "test";
const secret = "test-only-secret-".repeat(4);
const password = "correct horse battery staple";
let server;
let base;
let calls = [];
let query = async () => [[]];
const database = { execute: async (...args) => { calls.push(args); return query(...args); } };

before(async () => {
    server = createApp({ database, secret }).listen(0, "127.0.0.1");
    await once(server, "listening");
    base = "http://127.0.0.1:" + server.address().port;
});
after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
const post = (url, body) => fetch(base + url, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
});
const tokenOptions = { issuer: "jwt-example", audience: "jwt-example-api", expiresIn: "1h" };

test("startup requires an external signing secret of at least 32 bytes", () => {
    for (const value of [undefined, "", "short"]) {
        assert.throws(() => createApp({ database, secret: value }), /SECRET_KEY/);
    }
});

test("all views render with local scripts, security headers, and escaped query input", async () => {
    for (const route of ["/", "/users", "/users/login", "/users/dashboard?token=<script>alert(1)</script>"]) {
        const response = await fetch(base + route);
        assert.equal(response.status, 200);
        assert.ok(response.headers.get("content-security-policy").includes("script-src 'self'"));
        assert.equal(response.headers.get("x-powered-by"), null);
        const html = await response.text();
        assert.ok(html.includes("/javascripts/app.js"));
        assert.ok(!html.includes("<script>alert(1)</script>"));
        assert.ok(!html.includes("unpkg.com"));
    }
    assert.equal((await fetch(base + "/missing")).status, 404);
});

test("missing, malformed, expired, unsigned, and wrongly signed JWTs are rejected", async () => {
    const tokens = [
        undefined, "garbage",
        jwt.sign({ id: 1 }, secret, { ...tokenOptions, expiresIn: -1 }),
        jwt.sign({ id: 1 }, "wrong-secret", tokenOptions),
        jwt.sign({ id: 1 }, secret, { ...tokenOptions, algorithm: "HS384" }),
        jwt.sign({ id: 1 }, "", { ...tokenOptions, algorithm: "none" }),
        jwt.sign({ id: 1 }, secret, { ...tokenOptions, audience: "other-api" }),
        jwt.sign({ id: 1 }, secret, { ...tokenOptions, issuer: "other-issuer" })
    ];
    for (const token of tokens) {
        const response = await fetch(base + "/api/test", {
            headers: token ? { Authorization: "Bearer " + token } : {}
        });
        assert.equal(response.status, 401);
        assert.equal(response.headers.get("cache-control"), "no-store");
    }
    const response = await fetch(base + "/api/test", { headers: { Authorization: "Basic abc" } });
    assert.equal(response.status, 401);
});

test("valid bearer and original token headers return the verified claims", async () => {
    const token = jwt.sign({ id: 7, username: "demo" }, secret, tokenOptions);
    for (const headers of [{ Authorization: "Bearer " + token }, { token }]) {
        const response = await fetch(base + "/api/test", { headers });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).id, 7);
    }
});

test("registration validates inputs and generates a fresh salt for each user", async () => {
    calls = [];
    const user = { username: "demo", email: "demo@example.com", password };
    for (const body of [{}, { ...user, password: "short" }, { ...user, email: "bad" },
        { ...user, password: "é".repeat(37) }, { ...user, username: {} }]) {
        assert.equal((await post("/users/create", body)).status, 400);
    }
    assert.equal(calls.length, 0);
    query = async () => [{ insertId: 1 }];
    assert.equal((await post("/users/create", user)).status, 201);
    assert.equal((await post("/users/create", { ...user, username: "other" })).status, 201);
    const firstHash = calls[0][1][1];
    const secondHash = calls[1][1][1];
    assert.notEqual(firstHash, secondHash);
    assert.ok(await bcrypt.compare(password, firstHash));
    assert.ok(await bcrypt.compare(password, secondHash));
    query = async () => { throw Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" }); };
    assert.equal((await post("/users/create", user)).status, 409);
});

test("login binds SQL values, accepts existing bcrypt hashes, and excludes secrets from JWTs", async () => {
    const hash = await bcrypt.hash(password, 10);
    query = async (sql, values) => values[0] === "demo" ? [[{
        id: 1, username: "demo", email: "demo@example.com", password: hash,
        first_name: "Demo", last_name: "User", display_name: null, location: null
    }]] : [[]];
    calls = [];
    const injection = "' OR 1=1 -- ";
    const injectedResponse = await post("/users/login", { username: injection, password });
    assert.equal(injectedResponse.status, 401);
    assert.ok(!calls[0][0].includes(injection));
    assert.deepEqual(calls[0][1], [injection.trim(), injection.trim()]);
    const response = await post("/users/login", { username: "demo", password });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.redirect, "/users/dashboard");
    assert.equal(result.expiresIn, 3600);
    const claims = jwt.verify(result.token, secret, tokenOptions);
    assert.equal(claims.username, "demo");
    assert.equal(claims.password, undefined);
    assert.equal(claims.sub, "1");
    assert.equal(claims.exp - claims.iat, 3600);
    assert.equal((await post("/users/login", { username: "demo", password: "wrong" })).status, 401);
    query = async () => [[]];
    assert.equal((await post("/users/login", { username: "missing", password })).status, 401);
    assert.equal((await post("/users/login", {})).status, 400);
});

test("Express 5 handles empty bodies and database failures without disclosing details", async () => {
    assert.equal((await fetch(base + "/users/login", { method: "POST" })).status, 400);
    query = async () => { throw new Error("database credentials must not be exposed"); };
    const response = await post("/users/login", { username: "demo", password });
    assert.equal(response.status, 500);
    assert.ok(!(await response.text()).includes("credentials"));
    assert.equal((await fetch(base + "/users/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{broken"
    })).status, 400);
    assert.equal((await post("/users/login", { username: "x".repeat(11000) })).status, 413);
});

test("authentication attempts are rate limited", async () => {
    const responses = [];
    for (let index = 0; index < 51; index++) responses.push(await post("/users/login", {}));
    assert.equal(responses.at(-1).status, 429);
    assert.ok(responses.at(-1).headers.get("retry-after"));
});
