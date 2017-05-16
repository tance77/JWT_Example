var db     = require("../database");
var bcrypt = require("bcryptjs");
var salt   = bcrypt.genSaltSync(10);
var jwt    = require("jsonwebtoken");

module.exports.createUser = function (req, res) {
    var password  = bcrypt.hashSync(req.body.password, salt),
        email     = req.body.email,
        username  = req.body.username,
        firstName = req.body.firstName,
        lastName  = req.body.lastName;
    db.query("INSERT INTO users SET username=?, password=?, email=?, first_name=?, last_name=?", [username, password, email, firstName, lastName], function (err, rows, fields) {
        if (err) {
            console.log(err);
            res.status(409);
            res.json({
                error: true,
                errorCode: 409,
                errorMessage: "Duplicate User",
                errorDescription: "This user already exists and could not be created"
            });
        }
        else {
            res.json({
                status: "User created successfully."
            });
        }
    });
};

module.exports.login = function (req, res) {
    var secret            = "2a$10$aWC05XXmsto7PCnQxgO9f.Rnm0OYPYhaCqpT2dsX3.aCTJtr25eT6";
    var submittedPassword = req.body.user_password;
    var sql               = "SELECT * FROM users WHERE username='" + req.body.loginName + "' or email='" + req.body.loginName + "'";
    db.query(sql, function (err, rows, fields) {
        if (!err && rows.length > 0) {
            var userData   = rows[0];
            var isVerified = bcrypt.compareSync(submittedPassword, userData.user_password);
            if (isVerified) {
                var token = jwt.sign(userData, secret, {
                    expiresIn: 60 * 60 * 24
                });
                delete userData.user_password;
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