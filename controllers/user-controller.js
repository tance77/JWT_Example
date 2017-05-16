var db     = require("../database");
var bcrypt = require("bcryptjs");
var salt   = bcrypt.genSaltSync(10);

module.exports.createUser = function (req, res) {
    var password = bcrypt.hashSync(req.body.user_password, salt);
    var sql    = "INSERT INTO users (username, user_password, email) VALUES('" + req.body.username + "', '" + password + "', '" + req.body.email + "')";

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
    var submittedPassword = req.body.user_password;
    var sql = "SELECT * FROM users WHERE username='" + req.body.loginName + "' or email='" + req.body.loginName + "'";
    db.query(sql, function (err, rows, fields) {
        if (!err && rows.length > 0) {
            var userData = rows[0];
            var isVerified = bcrypt.compareSync(submittedPassword, userData.user_password);
            if(isVerified){
                res.json({
                    data: userData
                });
            }
            else{
                res.status(400).send("Incorrect password.")
            }
        }
        else{
            res.status(500).send("Unable to process query.")
        }
    });
};