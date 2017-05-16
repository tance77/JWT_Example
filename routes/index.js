var express = require("express");
var router  = express.Router();



/* GET home page. */
router.get("/", function (req, res, next) {
//    db.connection.connect();
//    db.connection.query("SELECT 1 + 1 AS solution", function (err, rows, fields) {
//        if (err) throw err;
//        console.log("The solution is: " + rows[0].solution);
//    });
//    db.connection.end();
    res.render("index", {title: "Express"});
});


module.exports = router;
