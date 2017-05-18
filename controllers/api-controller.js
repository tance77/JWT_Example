var db  = require("../database");
var jwt = require("jsonwebtoken");


module.exports.test = function (req, res) {
  authenticate(req, res, function (decoded) {
        res.json(decoded);
  });
};

function authenticate(req, res, next) {
    var token = req.body.token || req.headers["token"];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decode) {
            if (err) {
                res.status(400);
                res.json({
                    error: {
                        "code": 400,
                        "message": "JSON Web Token is invalid."
                    }
                });
            }
            else {
                next(decode);
            }
        });
    }
    else {
        res.status(401);
        res.json(
            {
                error: {
                    "code": 401,
                    "message": "No JSON token received."
                }
            }
        );
    }
}