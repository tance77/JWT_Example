var express = require("express");
var router  = express.Router();

/* Controller */
var userController = require("../controllers/user-controller.js");

/* GET users listing. */
router.get("/", function (req, res, next) {
    res.render("users", {title: "Make a new User"});
});

router.get('/dashboard', userController.dashboard);

router.post("/create", userController.createUser);
router.get("/login", userController.login);
router.post("/login", userController.login);
module.exports = router;
