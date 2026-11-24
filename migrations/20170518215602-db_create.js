"use strict";

// The table layout and filename match the original Sequelize migration.
// IF NOT EXISTS also makes retrying after a partially completed setup safe.
module.exports.up = async function (connection) {
    await connection.query(`CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(255) DEFAULT NULL,
        last_name VARCHAR(255) DEFAULT NULL,
        display_name VARCHAR(255) DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL
    )`);
};
