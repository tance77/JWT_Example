var db     = require("../database");
var bcrypt = require("bcryptjs");
var salt   = bcrypt.genSaltSync(10);
var jwt    = require("jsonwebtoken");

module.exports.createUser = function (req, res) {
    var password = bcrypt.hashSync(req.body.user_password, salt);
    var sql      = "INSERT INTO users (username, user_password, email) VALUES('" + req.body.username + "', '" + password + "', '" + req.body.email + "')";

    db.query(sql, function (err, rows, fields) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send("User was successfully created!");
        }
    });
};

module.exports.login = function (req, res) {
    var secret = "2a$10$aWC05XXmsto7PCnQxgO9f.Rnm0OYPYhaCqpT2dsX3.aCTJtr25eT6";
    var submittedPassword = req.body.user_password;
    var sql               = "SELECT * FROM users WHERE username='" + req.body.loginName + "' or email='" + req.body.loginName + "'";
    db.query(sql, function (err, rows, fields) {
        if (!err && rows.length > 0) {
            var userData   = rows[0];
            var isVerified = bcrypt.compareSync(submittedPassword, userData.user_password);
            if (isVerified) {
                var token = jwt.sign(userData, secret, {
                    expiresIn: 60*60*24
                });
                res.json({
                    jwt_token: token,
                    data: userData
                });
            }
            else {
                res.status(400).send("Incorrect password.");
            }
        }
        else {
            res.status(500).send("Unable to process query.");
        }
    });
};