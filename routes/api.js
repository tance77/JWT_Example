var express = require("express");
var router  = express.Router();
var api = require("../controllers/api-controller.js");

//Routes
router.get("/test", api.test);

module.exports = router;