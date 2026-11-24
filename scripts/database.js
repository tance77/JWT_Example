const mysql = require("mysql2/promise");
const fs = require("node:fs/promises");
const path = require("node:path");
const config = require("../config/database");

async function run() {
    const command = process.argv[2];
    if (!["create", "migrate"].includes(command)) throw new Error("Expected create or migrate.");
    const connection = await mysql.createConnection({
        ...config, database: command === "create" ? undefined : config.database
    });
    try {
        if (command === "create") {
            await connection.query("CREATE DATABASE IF NOT EXISTS " + mysql.escapeId(config.database));
            console.log("Database ready: " + config.database);
            return;
        }
        // Retain Sequelize's ledger and original filename so existing databases are preserved.
        await connection.query("CREATE TABLE IF NOT EXISTS `SequelizeMeta` (`name` VARCHAR(255) NOT NULL PRIMARY KEY)");
        const [applied] = await connection.query("SELECT name FROM `SequelizeMeta`");
        const names = new Set(applied.map((row) => row.name));
        const directory = path.join(__dirname, "../migrations");
        for (const name of (await fs.readdir(directory)).filter((file) => file.endsWith(".js")).sort()) {
            if (names.has(name)) continue;
            await require(path.join(directory, name)).up(connection);
            await connection.execute("INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES (?)", [name]);
            console.log("Applied " + name);
        }
        console.log("Migrations complete.");
    } finally {
        await connection.end();
    }
}

run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
