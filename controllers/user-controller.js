var db     = require("../database");
var jwt    = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var salt   = bcrypt.genSaltSync(10);

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
            res.status(200);
            res.json({
                status: "success"
            });
        }
    });
};

module.exports.login = function (req, res) {
    if (req.method === "POST") {
        var submittedPassword = req.body.password;
        var sql               = "SELECT * FROM users WHERE username='" + req.body.username + "' or email='" + req.body.username + "'";
        db.query(sql, function (err, rows, fields) {
            if (!err && rows.length > 0) {
                var userData   = rows[0];
                var isVerified = bcrypt.compareSync(submittedPassword, userData.password);
                if (isVerified) {
                    var token = jwt.sign(userData, process.env.SECRET_KEY, {
                        expiresIn: 60 * 60 * 24
                    });
                    delete userData.password;
                    res.send({redirect: "/users/dashboard?token=" + token})

                }
                else {
                    res.status(400).send("Incorrect password.");
                }
            }
            else {
                res.status(500).send("Unable to process query.");
            }
        });
    }
    else {
        res.render("login");
    }
};

module.exports.dashboard = function (req, res) {
    var jwtToken = req.query.token;
    res.render("dashboard", {token: jwtToken});
};