var mysql = require("mysql");

/* Configuration */
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "jwt_example"
});

module.exports = connection;