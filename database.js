const mysql = require("mysql2/promise");
const config = require("./config/database");

module.exports = mysql.createPool({ ...config, connectionLimit: 10 });
