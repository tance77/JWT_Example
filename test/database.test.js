const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { randomUUID } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const createApp = require("../app");

// Uses a unique disposable database. Never migrates or clears the configured database.
test("MySQL setup, legacy migration ledger, existing users, and complete authentication flow", {
    skip: process.env.TEST_MYSQL !== "1"
}, async () => {
    const config = { ...require("../config/database"), database: undefined };
    const name = "jwt_example_test_" + randomUUID().replaceAll("-", "");
    const env = { ...process.env, NODE_ENV: "test", DB_NAME: name };
    const run = (command) => execFileSync(process.execPath, ["scripts/database.js", command], {
        env, encoding: "utf8", windowsHide: true
    });
    const admin = await mysql.createConnection(config);
    let pool;
    let server;
    try {
        run("create");
        run("create");
        run("migrate");
        pool = mysql.createPool({ ...config, database: name });
        const [[schema]] = await pool.query("SHOW CREATE TABLE users");
        const legacyHash = (await bcrypt.hash("existing-password", 10)).replace("$2b$", "$2a$");
        await pool.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            ["existing", "existing@example.com", legacyHash]);
        run("migrate");
        const [[after]] = await pool.query("SHOW CREATE TABLE users");
        // AUTO_INCREMENT changes after inserting a user; all other schema details stay intact.
        const normalize = (sql) => sql.replace(/ AUTO_INCREMENT=\d+/, "");
        assert.equal(normalize(after["Create Table"]), normalize(schema["Create Table"]));
        const [ledger] = await pool.query("SELECT name FROM `SequelizeMeta`");
        assert.deepEqual(ledger.map((row) => row.name), ["20170518215602-db_create.js"]);
        assert.equal((await pool.query("SELECT username FROM users"))[0][0].username, "existing");

        const secret = "integration-test-only-".repeat(3);
        process.env.NODE_ENV = "test";
        server = createApp({ database: pool, secret }).listen(0, "127.0.0.1");
        await once(server, "listening");
        const base = "http://127.0.0.1:" + server.address().port;
        const post = (url, body) => fetch(base + url, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        const user = { username: "new-user", email: "new@example.com", password: "new-user-password" };
        assert.equal((await post("/users/create", user)).status, 201);
        assert.equal((await post("/users/create", user)).status, 409);
        const [rows] = await pool.execute("SELECT password FROM users WHERE username = ?", [user.username]);
        assert.notEqual(rows[0].password, user.password);
        assert.ok(await bcrypt.compare(user.password, rows[0].password));
        for (const username of ["new-user", "new@example.com", "existing"]) {
            const response = await post("/users/login", {
                username, password: username === "existing" ? "existing-password" : user.password
            });
            assert.equal(response.status, 200);
            const { token, redirect } = await response.json();
            assert.equal(redirect, "/users/dashboard");
            const info = await fetch(base + "/api/test", { headers: { Authorization: "Bearer " + token } });
            assert.equal(info.status, 200);
            const claims = await info.json();
            assert.equal(claims.password, undefined);
            assert.equal(claims.username, username === "existing" ? "existing" : "new-user");
        }
        assert.equal((await post("/users/login", {
            username: "' OR 1=1 -- ", password: "existing-password"
        })).status, 401);
        // Retry after DDL succeeds but before its ledger record is saved.
        await pool.execute("DELETE FROM `SequelizeMeta` WHERE name = ?", ["20170518215602-db_create.js"]);
        run("migrate");
        assert.equal((await pool.query("SELECT COUNT(*) AS count FROM users"))[0][0].count, 2);
    } finally {
        if (server) await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });
        if (pool) await pool.end();
        await admin.query("DROP DATABASE IF EXISTS " + mysql.escapeId(name));
        await admin.end();
    }
});
