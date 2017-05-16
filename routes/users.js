var express = require("express");
var router  = express.Router();

/* Controller */
var userController = require("../controllers/user-controller.js");

/* GET users listing. */
router.get("/", function (req, res, next) {
    res.send("respond with a resource");
});

router.post("/create", userController.createUser);
router.post("/login", userController.login);
module.exports = router;
