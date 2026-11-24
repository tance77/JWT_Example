const express = require("express");
const userController = require("../controllers/user-controller");

module.exports = function userRoutes({ database, secret, authLimiter }) {
    const router = express.Router();
    const controller = userController({ database, secret });
    router.get("/", (req, res) => res.render("users", { title: "Make a new User" }));
    router.get("/dashboard", (req, res) => res.render("dashboard", { title: "JWT Dashboard" }));
    router.get("/login", (req, res) => res.render("login", { title: "Login" }));
    router.post("/create", authLimiter, controller.createUser);
    router.post("/login", authLimiter, controller.login);
    return router;
};
