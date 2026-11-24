const express = require("express");
const apiController = require("../controllers/api-controller");

module.exports = function apiRoutes({ secret }) {
    const router = express.Router();
    router.get("/test", apiController({ secret }));
    return router;
};
