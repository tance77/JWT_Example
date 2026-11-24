const express = require("express");
const path = require("node:path");
const { engine } = require("express-handlebars");
const helmet = require("helmet");
const logger = require("morgan");
const { rateLimit } = require("express-rate-limit");
const userRoutes = require("./routes/users");
const apiRoutes = require("./routes/api");

function createApp({ database = require("./database"), secret = process.env.SECRET_KEY } = {}) {
    if (typeof secret !== "string" || Buffer.byteLength(secret) < 32) {
        throw new Error("Set SECRET_KEY to a random value of at least 32 bytes in .env.");
    }
    const app = express();
    app.disable("x-powered-by");
    app.set("views", path.join(__dirname, "views"));
    app.engine("hbs", engine({
        extname: ".hbs", defaultLayout: "layout", layoutsDir: path.join(__dirname, "views")
    }));
    app.set("view engine", "hbs");
    app.use(helmet({
        contentSecurityPolicy: {
            directives: { "upgrade-insecure-requests": app.get("env") === "production" ? [] : null }
        }
    }));
    if (app.get("env") !== "test") app.use(logger("dev"));
    app.use(express.json({ limit: "10kb" }));
    app.use(express.urlencoded({ extended: false, limit: "10kb", parameterLimit: 20 }));
    app.use(express.static(path.join(__dirname, "public")));
    app.use(["/users", "/api"], (req, res, next) => {
        res.set("Cache-Control", "no-store");
        next();
    });
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: "draft-8", legacyHeaders: false,
        message: { error: { code: 429, message: "Too many attempts. Try again later." } }
    });
    app.use("/", require("./routes/index"));
    app.use("/users", userRoutes({ database, secret, authLimiter }));
    app.use("/api", apiRoutes({ secret }));
    app.use((req, res, next) => {
        const error = new Error("Not Found");
        error.status = 404;
        next(error);
    });
    app.use((err, req, res, next) => {
        if (res.headersSent) return next(err);
        const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600
            ? err.status : 500;
        const message = status === 500 ? "Unable to process request." :
            status === 404 ? "Not Found" : "Invalid request.";
        if (status === 500 && app.get("env") !== "test") console.error(err);
        if (req.path.startsWith("/api/") || req.method === "POST") {
            return res.status(status).json({ error: { code: status, message } });
        }
        res.status(status).render("error", { title: "Error", message });
    });
    return app;
}

module.exports = createApp;
